from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field
from pymongo import DESCENDING
from pymongo.database import Database

from app.config import Settings, get_settings
from app.database import create_client, ensure_indexes, get_database
from app.sanitize import (
    ensure_utc,
    normalize_pathname,
    normalize_referrer,
    sanitize_meta,
)

logger = logging.getLogger(__name__)


class AnalyticsEventIn(BaseModel):
    event_type: str = Field(min_length=1, max_length=64)
    occurred_at: datetime
    env: Literal["dev", "prod", "test"]
    source: Literal["frontend_client", "frontend_proxy", "backend"]
    pathname: str = Field(min_length=1, max_length=2048)
    tool_slug: str | None = Field(default=None, max_length=128)
    request_id: str | None = Field(default=None, max_length=128)
    visitor_id: str | None = Field(default=None, max_length=128)
    ip: str = Field(min_length=1, max_length=128)
    user_agent: str | None = Field(default=None, max_length=1024)
    referrer: str | None = Field(default=None, max_length=2048)
    language: str | None = Field(default=None, max_length=128)
    status_code: int | None = Field(default=None, ge=100, le=599)
    latency_ms: float | None = Field(default=None, ge=0, le=600_000)
    meta: dict[str, Any] = Field(default_factory=dict)


def setup_logging(level: str) -> None:
    logging.basicConfig(
        level=level.upper(),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def _extract_ip(request: Request, payload_ip: str | None) -> str:
    if payload_ip and payload_ip != "unknown":
        return payload_ip[:128]

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",", maxsplit=1)[0].strip()[:128]

    real_ip = request.headers.get("x-real-ip") or request.headers.get(
        "cf-connecting-ip"
    )
    if real_ip:
        return real_ip.strip()[:128]

    if request.client and request.client.host:
        return request.client.host[:128]

    return "unknown"


def _parse_datetime(raw: str | None, fallback: datetime) -> datetime:
    if not raw:
        return fallback

    candidate = raw.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid datetime format") from exc
    return ensure_utc(parsed)


def _resolve_window(
    settings: Settings,
    start: str | None,
    end: str | None,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)
    default_start = now - timedelta(hours=settings.dashboard_default_window_hours)

    start_dt = _parse_datetime(start, fallback=default_start)
    end_dt = _parse_datetime(end, fallback=now)

    if start_dt > end_dt:
        raise HTTPException(status_code=400, detail="start must be before end")

    return start_dt, end_dt


def _build_match(
    start_dt: datetime,
    end_dt: datetime,
    event_type: str | None,
    tool_slug: str | None,
    status_class: str | None,
) -> dict[str, Any]:
    match: dict[str, Any] = {
        "occurred_at": {
            "$gte": start_dt,
            "$lte": end_dt,
        }
    }

    if event_type:
        match["event_type"] = event_type[:64]

    if tool_slug:
        match["tool_slug"] = tool_slug[:128]

    if status_class:
        normalized = status_class.strip().lower()
        if normalized not in {"2xx", "3xx", "4xx", "5xx"}:
            raise HTTPException(
                status_code=400,
                detail="status_class must be one of: 2xx, 3xx, 4xx, 5xx",
            )
        floor = int(normalized[0]) * 100
        match["status_code"] = {"$gte": floor, "$lte": floor + 99}

    return match


def _get_db(request: Request) -> Database:
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return db


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    setup_logging(settings.log_level)

    client = create_client(settings.mongodb_url)
    db = get_database(client, settings.mongodb_db_name)

    try:
        client.admin.command("ping")
        ensure_indexes(db)
        logger.info("analytics_mongodb_connected")
    except Exception:  # noqa: BLE001
        logger.exception("analytics_mongodb_startup_failed")
        raise

    app.state.mongo_client = client
    app.state.db = db

    yield

    client.close()


app = FastAPI(
    title="Simple Tools Hub Analytics",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def security_and_size_middleware(request: Request, call_next):
    settings = get_settings()

    if request.method == "POST" and request.url.path == "/internal/events":
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                if int(content_length) > settings.ingest_max_bytes:
                    return JSONResponse(
                        status_code=413,
                        content={"error": "payload_too_large"},
                    )
            except ValueError:
                return JSONResponse(
                    status_code=400,
                    content={"error": "invalid_content_length"},
                )

    response = await call_next(request)

    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
    )
    response.headers["Cache-Control"] = "no-store"

    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/internal/events")
def ingest_event(request: Request, payload: AnalyticsEventIn) -> dict[str, bool]:
    db = _get_db(request)
    events = db["events"]

    occurred_at = ensure_utc(payload.occurred_at)
    pathname = normalize_pathname(payload.pathname)
    referrer = normalize_referrer(payload.referrer)
    visitor_id = (payload.visitor_id or "").strip()[:128] or None

    clean_meta_raw = sanitize_meta(payload.meta)
    clean_meta = clean_meta_raw if isinstance(clean_meta_raw, dict) else {}

    document = {
        "occurred_at": occurred_at,
        "ingested_at": datetime.now(timezone.utc),
        "event_type": payload.event_type.strip()[:64],
        "env": payload.env,
        "source": payload.source,
        "pathname": pathname,
        "tool_slug": (payload.tool_slug or "").strip()[:128] or None,
        "request_id": (payload.request_id or "").strip()[:128] or None,
        "visitor_id": visitor_id,
        "ip": _extract_ip(request, payload.ip),
        "user_agent": (payload.user_agent or "").strip()[:1024] or None,
        "referrer": referrer,
        "language": (payload.language or "").strip()[:128] or None,
        "status_code": payload.status_code,
        "latency_ms": payload.latency_ms,
        "meta": clean_meta,
    }

    events.insert_one(document)
    return {"ok": True}


@app.get("/api/analytics/summary")
def analytics_summary(
    request: Request,
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    tool_slug: str | None = Query(default=None),
    status_class: str | None = Query(default=None),
) -> dict[str, Any]:
    db = _get_db(request)
    events = db["events"]
    settings = get_settings()

    start_dt, end_dt = _resolve_window(settings, start, end)
    match = _build_match(start_dt, end_dt, event_type, tool_slug, status_class)

    total_events = events.count_documents(match)

    unique_ips = len(events.distinct("ip", match))

    unique_visitors_pipeline = [
        {"$match": {**match, "visitor_id": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$visitor_id"}},
    ]
    unique_visitors = len(list(events.aggregate(unique_visitors_pipeline)))

    top_routes_pipeline = [
        {"$match": match},
        {"$group": {"_id": "$pathname", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_routes = [
        {"pathname": row.get("_id") or "/", "count": row.get("count", 0)}
        for row in events.aggregate(top_routes_pipeline)
    ]

    top_tools_pipeline = [
        {"$match": {**match, "tool_slug": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$tool_slug", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]
    top_tools = [
        {"tool_slug": row.get("_id"), "count": row.get("count", 0)}
        for row in events.aggregate(top_tools_pipeline)
    ]

    event_types_pipeline = [
        {"$match": match},
        {"$group": {"_id": "$event_type", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]
    event_types = [
        {"event_type": row.get("_id"), "count": row.get("count", 0)}
        for row in events.aggregate(event_types_pipeline)
    ]

    status_breakdown = {"2xx": 0, "3xx": 0, "4xx": 0, "5xx": 0, "other": 0}
    status_pipeline = [
        {"$match": {**match, "status_code": {"$ne": None}}},
        {"$group": {"_id": "$status_code", "count": {"$sum": 1}}},
    ]
    for row in events.aggregate(status_pipeline):
        code = row.get("_id")
        count = row.get("count", 0)
        if not isinstance(code, int):
            status_breakdown["other"] += count
        elif 200 <= code < 300:
            status_breakdown["2xx"] += count
        elif 300 <= code < 400:
            status_breakdown["3xx"] += count
        elif 400 <= code < 500:
            status_breakdown["4xx"] += count
        elif 500 <= code < 600:
            status_breakdown["5xx"] += count
        else:
            status_breakdown["other"] += count

    error_events = events.count_documents({**match, "status_code": {"$gte": 400}})
    rate_limited_events = events.count_documents(
        {**match, "event_type": "rate_limited"}
    )

    return {
        "window": {
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
        },
        "totals": {
            "events": total_events,
            "unique_ips": unique_ips,
            "unique_visitors": unique_visitors,
            "errors": error_events,
            "rate_limited": rate_limited_events,
        },
        "top_routes": top_routes,
        "top_tools": top_tools,
        "event_types": event_types,
        "status_breakdown": status_breakdown,
    }


@app.get("/api/analytics/timeseries")
def analytics_timeseries(
    request: Request,
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    tool_slug: str | None = Query(default=None),
    status_class: str | None = Query(default=None),
    interval_minutes: int = Query(default=15, ge=1, le=1_440),
) -> dict[str, Any]:
    db = _get_db(request)
    events = db["events"]
    settings = get_settings()

    start_dt, end_dt = _resolve_window(settings, start, end)
    match = _build_match(start_dt, end_dt, event_type, tool_slug, status_class)

    bucket_counts: dict[datetime, int] = {}
    cursor = events.find(match, {"occurred_at": 1}).sort("occurred_at", DESCENDING)
    for doc in cursor:
        occurred_at = doc.get("occurred_at")
        if not isinstance(occurred_at, datetime):
            continue
        occurred = ensure_utc(occurred_at).replace(second=0, microsecond=0)
        rounded_minute = (occurred.minute // interval_minutes) * interval_minutes
        bucket = occurred.replace(minute=rounded_minute)
        bucket_counts[bucket] = bucket_counts.get(bucket, 0) + 1

    points = [
        {"bucket": bucket.isoformat(), "count": count}
        for bucket, count in sorted(bucket_counts.items(), key=lambda item: item[0])
    ]

    return {
        "window": {
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
        },
        "interval_minutes": interval_minutes,
        "points": points,
    }


@app.get("/api/analytics/events")
def analytics_events(
    request: Request,
    start: str | None = Query(default=None),
    end: str | None = Query(default=None),
    event_type: str | None = Query(default=None),
    tool_slug: str | None = Query(default=None),
    status_class: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=200),
) -> dict[str, Any]:
    db = _get_db(request)
    events = db["events"]
    settings = get_settings()

    start_dt, end_dt = _resolve_window(settings, start, end)
    match = _build_match(start_dt, end_dt, event_type, tool_slug, status_class)

    total = events.count_documents(match)
    skip = (page - 1) * page_size

    raw_events = list(
        events.find(match).sort("occurred_at", DESCENDING).skip(skip).limit(page_size)
    )

    items: list[dict[str, Any]] = []
    for row in raw_events:
        occurred_at = row.get("occurred_at")
        ingested_at = row.get("ingested_at")
        items.append(
            {
                "id": str(row.get("_id")),
                "event_type": row.get("event_type"),
                "env": row.get("env"),
                "source": row.get("source"),
                "pathname": row.get("pathname"),
                "tool_slug": row.get("tool_slug"),
                "request_id": row.get("request_id"),
                "visitor_id": row.get("visitor_id"),
                "ip": row.get("ip"),
                "user_agent": row.get("user_agent"),
                "referrer": row.get("referrer"),
                "language": row.get("language"),
                "status_code": row.get("status_code"),
                "latency_ms": row.get("latency_ms"),
                "meta": row.get("meta", {}),
                "occurred_at": (
                    ensure_utc(occurred_at).isoformat()
                    if isinstance(occurred_at, datetime)
                    else None
                ),
                "ingested_at": (
                    ensure_utc(ingested_at).isoformat()
                    if isinstance(ingested_at, datetime)
                    else None
                ),
            }
        )

    return {
        "window": {
            "start": start_dt.isoformat(),
            "end": end_dt.isoformat(),
        },
        "page": page,
        "page_size": page_size,
        "total": total,
        "items": items,
    }


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard() -> str:
    return """<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Simple Tools Hub Analytics Dashboard</title>
    <style>
      :root { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; }
      body { margin: 0; background: #f8fafc; color: #0f172a; }
      .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
      h1 { margin: 0 0 8px; }
      .muted { color: #475569; margin-bottom: 20px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 20px; }
      .card { background: #fff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; }
      .label { font-size: 12px; color: #475569; text-transform: uppercase; letter-spacing: .06em; }
      .value { font-size: 24px; font-weight: 700; margin-top: 6px; }
      .row { display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 12px; }
      @media (min-width: 1000px) { .row { grid-template-columns: 1fr 1fr; } }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th, td { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 8px; vertical-align: top; }
      th { font-size: 12px; color: #334155; text-transform: uppercase; letter-spacing: .05em; }
      .filters { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 12px; }
      input, select, button { padding: 8px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; }
      button { cursor: pointer; background: #0f172a; color: #fff; border-color: #0f172a; }
      pre { white-space: pre-wrap; margin: 0; }
    </style>
  </head>
  <body>
    <div class=\"container\">
      <h1>Simple Tools Hub Analytics</h1>
      <p class=\"muted\">Internal no-auth dashboard. Sensitive tool payloads are never stored; behavior metadata only.</p>

      <div class=\"filters\">
        <input id=\"start\" type=\"datetime-local\" />
        <input id=\"end\" type=\"datetime-local\" />
        <input id=\"eventType\" type=\"text\" placeholder=\"event_type\" />
        <input id=\"toolSlug\" type=\"text\" placeholder=\"tool_slug\" />
        <select id=\"statusClass\">
          <option value=\"\">status class (all)</option>
          <option value=\"2xx\">2xx</option>
          <option value=\"3xx\">3xx</option>
          <option value=\"4xx\">4xx</option>
          <option value=\"5xx\">5xx</option>
        </select>
        <button id=\"refresh\">Refresh</button>
      </div>

      <div class=\"grid\" id=\"totals\"></div>

      <div class=\"row\">
        <div class=\"card\">
          <h3>Top Routes</h3>
          <table><thead><tr><th>Pathname</th><th>Count</th></tr></thead><tbody id=\"topRoutes\"></tbody></table>
        </div>
        <div class=\"card\">
          <h3>Top Tools</h3>
          <table><thead><tr><th>Tool</th><th>Count</th></tr></thead><tbody id=\"topTools\"></tbody></table>
        </div>
      </div>

      <div class=\"row\">
        <div class=\"card\">
          <h3>Timeseries</h3>
          <table><thead><tr><th>Bucket</th><th>Count</th></tr></thead><tbody id=\"timeseries\"></tbody></table>
        </div>
        <div class=\"card\">
          <h3>Recent Events</h3>
          <table><thead><tr><th>When</th><th>Event</th><th>Path</th><th>IP</th><th>Status</th></tr></thead><tbody id=\"events\"></tbody></table>
        </div>
      </div>
    </div>

    <script>
      function queryString() {
        const params = new URLSearchParams();
        const start = document.getElementById('start').value;
        const end = document.getElementById('end').value;
        const eventType = document.getElementById('eventType').value.trim();
        const toolSlug = document.getElementById('toolSlug').value.trim();
        const statusClass = document.getElementById('statusClass').value;

        if (start) params.set('start', new Date(start).toISOString());
        if (end) params.set('end', new Date(end).toISOString());
        if (eventType) params.set('event_type', eventType);
        if (toolSlug) params.set('tool_slug', toolSlug);
        if (statusClass) params.set('status_class', statusClass);

        return params.toString();
      }

      function renderRows(targetId, rows, cols) {
        const target = document.getElementById(targetId);
        target.innerHTML = '';
        for (const row of rows) {
          const tr = document.createElement('tr');
          for (const col of cols) {
            const td = document.createElement('td');
            td.textContent = String(row[col] ?? '');
            tr.appendChild(td);
          }
          target.appendChild(tr);
        }
      }

      async function refresh() {
        const qs = queryString();
        const [summaryRes, timeseriesRes, eventsRes] = await Promise.all([
          fetch('/api/analytics/summary?' + qs),
          fetch('/api/analytics/timeseries?' + qs + '&interval_minutes=15'),
          fetch('/api/analytics/events?' + qs + '&page=1&page_size=25'),
        ]);

        const summary = await summaryRes.json();
        const timeseries = await timeseriesRes.json();
        const events = await eventsRes.json();

        const totals = [
          ['Events', summary.totals.events],
          ['Unique IPs', summary.totals.unique_ips],
          ['Unique Visitors', summary.totals.unique_visitors],
          ['Errors', summary.totals.errors],
          ['Rate Limited', summary.totals.rate_limited],
        ];
        const totalsNode = document.getElementById('totals');
        totalsNode.innerHTML = '';
        for (const [label, value] of totals) {
          const card = document.createElement('div');
          card.className = 'card';
          card.innerHTML = `<div class=\"label\">${label}</div><div class=\"value\">${value}</div>`;
          totalsNode.appendChild(card);
        }

        renderRows('topRoutes', summary.top_routes, ['pathname', 'count']);
        renderRows('topTools', summary.top_tools, ['tool_slug', 'count']);
        renderRows('timeseries', timeseries.points, ['bucket', 'count']);

        const eventRows = (events.items || []).map((item) => ({
          occurred_at: item.occurred_at,
          event_type: item.event_type,
          pathname: item.pathname,
          ip: item.ip,
          status_code: item.status_code ?? '',
        }));
        renderRows('events', eventRows, ['occurred_at', 'event_type', 'pathname', 'ip', 'status_code']);
      }

      document.getElementById('refresh').addEventListener('click', refresh);
      refresh().catch((err) => {
        console.error('Dashboard refresh failed', err);
      });
    </script>
  </body>
</html>
"""
