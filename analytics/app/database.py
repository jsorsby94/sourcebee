from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.database import Database


def create_client(mongodb_url: str) -> MongoClient:
    return MongoClient(mongodb_url, tz_aware=True)


def get_database(client: MongoClient, db_name: str) -> Database:
    return client[db_name]


def ensure_indexes(db: Database) -> None:
    events = db["events"]
    events.create_index([("occurred_at", DESCENDING)])
    events.create_index([("event_type", ASCENDING), ("occurred_at", DESCENDING)])
    events.create_index([("pathname", ASCENDING), ("occurred_at", DESCENDING)])
    events.create_index([("tool_slug", ASCENDING), ("occurred_at", DESCENDING)])
    events.create_index([("status_code", ASCENDING), ("occurred_at", DESCENDING)])
    events.create_index([("visitor_id", ASCENDING), ("occurred_at", DESCENDING)])
    events.create_index([("ip", ASCENDING), ("occurred_at", DESCENDING)])
