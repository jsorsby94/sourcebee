"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ToolApiError,
  toolsApi,
  type Base64Response,
  type BinaryToolResponse,
  type ColorConverterResponse,
  type CronToolResponse,
  type HashGeneratorRequest,
  type HashGeneratorResponse,
  type JsonYamlResponse,
  type JsonFormatterResponse,
  type JwtDecodeResponse,
  type PasswordGeneratorResponse,
  type SslCheckerResponse,
  type TimestampConverterResponse,
  type URLCodecResponse,
  type UUIDGeneratorResponse,
  type UnitConverterRequest,
  type UnitConverterResponse,
} from "@/lib/api";
import { formatJwtDate } from "@/lib/tool-engines/jwt";
import { UNITS_BY_CATEGORY } from "@/lib/tool-engines/units";
import type { ToolDefinition } from "@/lib/tool-registry";
import { validateHostnameClient, validateRequiredText } from "@/lib/validators";

interface ToolRuntimePanelProps {
  tool: ToolDefinition;
}

const selectClassName =
  "mt-1 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 dark:border-white/15 dark:bg-[#0d131e] dark:text-slate-100";

function formatApiError(error: unknown): string {
  if (error instanceof ToolApiError) {
    return error.message;
  }
  return "Unexpected error. Please try again.";
}

function triggerDownload(payload: BinaryToolResponse): void {
  const url = URL.createObjectURL(payload.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = payload.filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function ResultHeading({ children }: { children: ReactNode }) {
  return <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{children}</h3>;
}

function OutputText({ value }: { value: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">
      <code>{value}</code>
    </pre>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function PrivacyNote({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-brand-500/25 bg-brand-100/40 px-3 py-2 text-xs text-brand-800 dark:bg-brand-500/12 dark:text-brand-200">
      {text}
    </p>
  );
}

function BinaryResult({ result, label }: { result: BinaryToolResponse | null; label?: string }) {
  if (!result) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-white/10 dark:bg-[#0d131e]/75">
      <p className="text-xs text-slate-600 dark:text-slate-300">{label ?? "Result ready"}</p>
      <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">{result.filename}</p>
      <div className="mt-3">
        <Button variant="secondary" onClick={() => triggerDownload(result)}>
          Download file
        </Button>
      </div>
    </div>
  );
}

export function ToolRuntimePanel({ tool }: ToolRuntimePanelProps) {
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  return (
    <Card className="space-y-4 shadow-glow">
      {error ? (
        <p className="rounded-xl border border-red-300/45 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/35 dark:text-red-300">
          {error}
        </p>
      ) : null}

      {tool.slug === "jwt-decoder" && <JwtDecoderPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "base64" && <Base64Panel onError={setError} onClearError={clearError} />}
      {tool.slug === "json-yaml" && <JsonYamlPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "hash-generator" && <HashGeneratorPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "uuid-generator" && <UuidGeneratorPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "url-encoder-decoder" && <UrlCodecPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "timestamp-converter" && <TimestampConverterPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "json-formatter" && <JsonFormatterPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "cron-parser-generator" && <CronParserGeneratorPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "unit-converter" && <UnitConverterPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "ssl-checker" && <SslCheckerPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "qr-code-generator" && <QrCodePanel onError={setError} onClearError={clearError} />}
      {tool.slug === "image-converter" && <ImageConverterPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "pdf-utilities" && <PdfUtilitiesPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "password-generator" && <PasswordGeneratorPanel onError={setError} onClearError={clearError} />}
      {tool.slug === "color-converter" && <ColorConverterPanel onError={setError} onClearError={clearError} />}
    </Card>
  );
}

function JwtDecoderPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JwtDecodeResponse | null>(null);

  async function handleDecode() {
    const validation = validateRequiredText(token, "JWT token");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.jwtDecode({ token: token.trim() });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PrivacyNote text="JWT input is processed only for this request and is never stored." />
      <p className="rounded-xl border border-amber-300/45 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-200">
        JWT decode reads token content only. It does not verify token signature trust.
      </p>
      <Textarea value={token} onChange={(event) => setToken(event.target.value)} placeholder="Paste JWT token" />
      <Button onClick={handleDecode} disabled={loading}>
        {loading ? "Decoding..." : "Decode JWT"}
      </Button>

      {result ? (
        <div className="space-y-3">
          <div>
            <ResultHeading>Header</ResultHeading>
            <OutputText value={JSON.stringify(result.header, null, 2)} />
          </div>
          <div>
            <ResultHeading>Payload</ResultHeading>
            <OutputText value={JSON.stringify(result.payload, null, 2)} />
          </div>
          <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            <p>
              <span className="font-semibold">Issued:</span> {formatJwtDate(result.issued_at)}
            </p>
            <p>
              <span className="font-semibold">Expires:</span> {formatJwtDate(result.expires_at)}
            </p>
            <p>
              <span className="font-semibold">Expired:</span> {String(result.is_expired ?? "unknown")}
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Base64Panel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Base64Response | null>(null);

  async function handleSubmit() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.base64({ mode, input });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>
          Encode
        </Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>
          Decode
        </Button>
      </div>
      <Textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={mode === "encode" ? "Text to encode" : "Base64 to decode"}
      />
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Processing..." : mode === "encode" ? "Encode text" : "Decode text"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>Output</ResultHeading>
          <Textarea value={result.output} readOnly className="min-h-[120px]" />
          <Button variant="secondary" onClick={copyOutput}>
            Copy output
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function JsonYamlPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"json-to-yaml" | "yaml-to-json">("json-to-yaml");
  const [sortKeys, setSortKeys] = useState(false);
  const [input, setInput] = useState('{"hello":"world","count":2}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JsonYamlResponse | null>(null);

  async function handleRun() {
    const validation = validateRequiredText(input, "Input");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.jsonYaml({ mode, input, sort_keys: sortKeys });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "json-to-yaml" ? "primary" : "secondary"} onClick={() => setMode("json-to-yaml")}>
          JSON to YAML
        </Button>
        <Button variant={mode === "yaml-to-json" ? "primary" : "secondary"} onClick={() => setMode("yaml-to-json")}>
          YAML to JSON
        </Button>
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />
        Sort keys
      </label>
      <Textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={mode === "json-to-yaml" ? "Paste JSON" : "Paste YAML"}
      />
      <Button onClick={handleRun} disabled={loading}>
        {loading ? "Converting..." : mode === "json-to-yaml" ? "Convert to YAML" : "Convert to JSON"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>Output</ResultHeading>
          <Textarea value={result.output} readOnly className="min-h-[180px]" />
          <Button variant="secondary" onClick={copyOutput}>
            Copy output
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function HashGeneratorPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [algorithm, setAlgorithm] = useState<HashGeneratorRequest["algorithm"]>("sha256");
  const [input, setInput] = useState("hello");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HashGeneratorResponse | null>(null);

  async function handleGenerate() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.hashGenerator({ algorithm, input });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyDigest() {
    if (!result?.digest) return;
    await navigator.clipboard.writeText(result.digest);
  }

  return (
    <div className="space-y-4">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Algorithm
        <select
          value={algorithm}
          onChange={(event) => setAlgorithm(event.target.value as HashGeneratorRequest["algorithm"])}
          className={selectClassName}
        >
          <option value="md5">MD5</option>
          <option value="sha1">SHA-1</option>
          <option value="sha224">SHA-224</option>
          <option value="sha256">SHA-256</option>
          <option value="sha384">SHA-384</option>
          <option value="sha512">SHA-512</option>
        </select>
      </label>
      <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Text to hash" />
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Hashing..." : "Generate hash"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>Digest</ResultHeading>
          <Textarea value={result.digest} readOnly className="min-h-[96px]" />
          <p className="text-xs text-slate-600 dark:text-slate-300">Input length: {result.input_length} characters</p>
          <Button variant="secondary" onClick={copyDigest}>
            Copy digest
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UuidGeneratorPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [count, setCount] = useState("1");
  const [uppercase, setUppercase] = useState(false);
  const [removeHyphens, setRemoveHyphens] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UUIDGeneratorResponse | null>(null);

  async function handleGenerate() {
    const parsedCount = Number.parseInt(count, 10);
    if (!Number.isFinite(parsedCount) || parsedCount < 1 || parsedCount > 100) {
      onError("Count must be an integer between 1 and 100.");
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.uuidGenerator({
        count: parsedCount,
        uppercase,
        remove_hyphens: removeHyphens,
      });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyAll() {
    if (!result?.uuids.length) return;
    await navigator.clipboard.writeText(result.uuids.join("\n"));
  }

  return (
    <div className="space-y-4">
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Count
        <Input value={count} onChange={(event) => setCount(event.target.value)} />
      </label>
      <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
          Uppercase
        </label>
        <label className="inline-flex items-center gap-2">
          <input type="checkbox" checked={removeHyphens} onChange={(event) => setRemoveHyphens(event.target.checked)} />
          Remove hyphens
        </label>
      </div>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate UUIDs"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>UUIDs</ResultHeading>
          <Textarea value={result.uuids.join("\n")} readOnly className="min-h-[160px]" />
          <Button variant="secondary" onClick={copyAll}>
            Copy all
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function UrlCodecPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<URLCodecResponse | null>(null);

  async function handleRun() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.urlEncoderDecoder({ mode, input });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "encode" ? "primary" : "secondary"} onClick={() => setMode("encode")}>
          Encode
        </Button>
        <Button variant={mode === "decode" ? "primary" : "secondary"} onClick={() => setMode("decode")}>
          Decode
        </Button>
      </div>
      <Textarea
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder={mode === "encode" ? "Text to URL-encode" : "URL-encoded text to decode"}
      />
      <Button onClick={handleRun} disabled={loading}>
        {loading ? "Running..." : mode === "encode" ? "Encode URL text" : "Decode URL text"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>Output</ResultHeading>
          <Textarea value={result.output} readOnly className="min-h-[120px]" />
          <Button variant="secondary" onClick={copyOutput}>
            Copy output
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function TimestampConverterPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [input, setInput] = useState(() => Math.floor(Date.now() / 1000).toString());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TimestampConverterResponse | null>(null);

  async function handleConvert() {
    const validation = validateRequiredText(input, "Timestamp input");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.timestampConverter({ input });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
  }

  function setNowSeconds() {
    setInput(Math.floor(Date.now() / 1000).toString());
  }

  function setNowMilliseconds() {
    setInput(Date.now().toString());
  }

  function setNowIso() {
    setInput(new Date().toISOString());
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={setNowSeconds}>
          Now (seconds)
        </Button>
        <Button variant="secondary" onClick={setNowMilliseconds}>
          Now (milliseconds)
        </Button>
        <Button variant="secondary" onClick={setNowIso}>
          Now (ISO)
        </Button>
      </div>
      <Input
        value={input}
        onChange={(event) => setInput(event.target.value)}
        placeholder="Unix seconds/ms or ISO datetime"
      />
      <Button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert timestamp"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Detected type:</span> {result.detected_type}
          </p>
          {[
            { label: "ISO UTC", value: result.iso_utc },
            { label: "Unix seconds", value: String(result.unix_seconds) },
            { label: "Unix milliseconds", value: String(result.unix_milliseconds) },
          ].map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100/70 p-2 dark:border-white/10 dark:bg-[#0d131e]/75"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200">
                <span className="font-semibold">{entry.label}:</span> {entry.value}
              </p>
              <Button variant="secondary" onClick={() => copyValue(entry.value)}>
                Copy
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function JsonFormatterPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [operation, setOperation] = useState<"pretty" | "minify" | "validate">("pretty");
  const [sortKeys, setSortKeys] = useState(false);
  const [input, setInput] = useState('{"hello": "world"}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<JsonFormatterResponse | null>(null);

  async function handleSubmit() {
    const validation = validateRequiredText(input, "JSON input");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.jsonFormatter({ operation, input, sort_keys: sortKeys });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyOutput() {
    if (!result?.output) return;
    await navigator.clipboard.writeText(result.output);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pretty", "minify", "validate"] as const).map((value) => (
          <Button
            key={value}
            variant={operation === value ? "primary" : "secondary"}
            onClick={() => setOperation(value)}
          >
            {value}
          </Button>
        ))}
      </div>
      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" checked={sortKeys} onChange={(event) => setSortKeys(event.target.checked)} />
        Sort keys
      </label>
      <Textarea value={input} onChange={(event) => setInput(event.target.value)} placeholder="Paste JSON" />
      <Button onClick={handleSubmit} disabled={loading}>
        {loading ? "Running..." : "Run JSON tool"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <ResultHeading>Result</ResultHeading>
          {result.output ? <Textarea value={result.output} readOnly className="min-h-[160px]" /> : null}
          {result.operation === "validate" ? (
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">JSON is valid.</p>
          ) : null}
          {result.output ? (
            <Button variant="secondary" onClick={copyOutput}>
              Copy output
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function CronParserGeneratorPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"parse" | "generate">("parse");
  const [expression, setExpression] = useState("*/15 9-17 * * 1-5");
  const [minute, setMinute] = useState("*");
  const [hour, setHour] = useState("*");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("*");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CronToolResponse | null>(null);

  async function handleRun() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      if (mode === "parse") {
        const validation = validateRequiredText(expression, "Cron expression");
        if (validation) {
          onError(validation);
          return;
        }

        const response = await toolsApi.cronParserGenerator({
          mode: "parse",
          expression,
        });
        setResult(response);
        return;
      }

      const fields = [
        { value: minute, label: "Minute" },
        { value: hour, label: "Hour" },
        { value: dayOfMonth, label: "Day of month" },
        { value: month, label: "Month" },
        { value: dayOfWeek, label: "Day of week" },
      ];
      for (const field of fields) {
        if (!field.value.trim()) {
          onError(`${field.label} field is required.`);
          return;
        }
      }

      const response = await toolsApi.cronParserGenerator({
        mode: "generate",
        minute,
        hour,
        day_of_month: dayOfMonth,
        month,
        day_of_week: dayOfWeek,
      });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyExpression() {
    if (!result?.expression) return;
    await navigator.clipboard.writeText(result.expression);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant={mode === "parse" ? "primary" : "secondary"} onClick={() => setMode("parse")}>
          Parse
        </Button>
        <Button variant={mode === "generate" ? "primary" : "secondary"} onClick={() => setMode("generate")}>
          Generate
        </Button>
      </div>

      {mode === "parse" ? (
        <Input
          value={expression}
          onChange={(event) => setExpression(event.target.value)}
          placeholder="*/15 9-17 * * 1-5"
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Minute
            <Input value={minute} onChange={(event) => setMinute(event.target.value)} placeholder="*" />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Hour
            <Input value={hour} onChange={(event) => setHour(event.target.value)} placeholder="*" />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Day of month
            <Input value={dayOfMonth} onChange={(event) => setDayOfMonth(event.target.value)} placeholder="*" />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Month
            <Input value={month} onChange={(event) => setMonth(event.target.value)} placeholder="*" />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300 sm:col-span-2">
            Day of week
            <Input value={dayOfWeek} onChange={(event) => setDayOfWeek(event.target.value)} placeholder="*" />
          </label>
        </div>
      )}

      <Button onClick={handleRun} disabled={loading}>
        {loading ? "Processing..." : mode === "parse" ? "Parse cron expression" : "Generate cron expression"}
      </Button>

      {result ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-white/10 dark:bg-[#0d131e]/75">
            <p className="text-sm text-slate-700 dark:text-slate-200">
              <span className="font-semibold">Expression:</span> {result.expression}
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{result.description}</p>
            <div className="mt-2">
              <Button variant="secondary" onClick={copyExpression}>
                Copy expression
              </Button>
            </div>
          </div>
          <dl className="grid gap-2 text-sm text-slate-700 dark:text-slate-200 sm:grid-cols-2">
            <div>
              <dt className="font-semibold">Minute</dt>
              <dd>{result.minute}</dd>
            </div>
            <div>
              <dt className="font-semibold">Hour</dt>
              <dd>{result.hour}</dd>
            </div>
            <div>
              <dt className="font-semibold">Day of month</dt>
              <dd>{result.day_of_month}</dd>
            </div>
            <div>
              <dt className="font-semibold">Month</dt>
              <dd>{result.month}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-semibold">Day of week</dt>
              <dd>{result.day_of_week}</dd>
            </div>
          </dl>
        </div>
      ) : null}
    </div>
  );
}

function UnitConverterPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [category, setCategory] = useState<UnitConverterRequest["category"]>("length");
  const units = useMemo(() => UNITS_BY_CATEGORY[category], [category]);
  const [fromUnit, setFromUnit] = useState(units[0]);
  const [toUnit, setToUnit] = useState(units[1] ?? units[0]);
  const [value, setValue] = useState("1");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UnitConverterResponse | null>(null);

  function onCategoryChange(nextCategory: UnitConverterRequest["category"]) {
    const nextUnits = UNITS_BY_CATEGORY[nextCategory];
    setCategory(nextCategory);
    setFromUnit(nextUnits[0]);
    setToUnit(nextUnits[1] ?? nextUnits[0]);
    setResult(null);
  }

  async function handleConvert() {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      onError("Enter a valid numeric value.");
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.unitConverter({
        category,
        value: parsed,
        from_unit: fromUnit,
        to_unit: toUnit,
      });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Category
          <select
            value={category}
            onChange={(event) => onCategoryChange(event.target.value as UnitConverterRequest["category"])}
            className={selectClassName}
          >
            {Object.keys(UNITS_BY_CATEGORY).map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Value
          <Input value={value} onChange={(event) => setValue(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          From
          <select
            value={fromUnit}
            onChange={(event) => setFromUnit(event.target.value)}
            className={selectClassName}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-slate-700 dark:text-slate-300">
          To
          <select
            value={toUnit}
            onChange={(event) => setToUnit(event.target.value)}
            className={selectClassName}
          >
            {units.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert"}
      </Button>

      {result ? (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {result.input_value} {result.from_unit} = {result.output_value} {result.to_unit}
        </p>
      ) : null}
    </div>
  );
}

function SslCheckerPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [hostname, setHostname] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SslCheckerResponse | null>(null);

  async function handleCheck() {
    const validation = validateHostnameClient(hostname);
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.sslChecker({ hostname: hostname.trim() });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input
        value={hostname}
        onChange={(event) => setHostname(event.target.value)}
        placeholder="example.com"
        autoComplete="off"
      />
      <Button onClick={handleCheck} disabled={loading}>
        {loading ? "Checking..." : "Check certificate"}
      </Button>

      {result ? (
        <dl className="grid gap-2 text-sm text-slate-700 dark:text-slate-200">
          <div>
            <dt className="font-semibold">Issuer</dt>
            <dd>{result.issuer}</dd>
          </div>
          <div>
            <dt className="font-semibold">Subject</dt>
            <dd>{result.subject}</dd>
          </div>
          <div>
            <dt className="font-semibold">Valid from</dt>
            <dd>{new Date(result.valid_from).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-semibold">Valid to</dt>
            <dd>{new Date(result.valid_to).toLocaleString()}</dd>
          </div>
          <div>
            <dt className="font-semibold">Days remaining</dt>
            <dd>{result.days_remaining}</dd>
          </div>
          <div>
            <dt className="font-semibold">SANs</dt>
            <dd>{result.sans.length > 0 ? result.sans.join(", ") : "No SANs listed"}</dd>
          </div>
        </dl>
      ) : null}
    </div>
  );
}

function QrCodePanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [text, setText] = useState("");
  const [format, setFormat] = useState<"png" | "svg">("png");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BinaryToolResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleGenerate() {
    const validation = validateRequiredText(text, "QR text");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const payload = new FormData();
      payload.append("data", text);
      payload.append("output_format", format);

      const response = await toolsApi.qrCode(payload);
      setResult(response);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(response.blob));
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PrivacyNote text="QR content is generated transiently and deleted immediately after response." />
      <Textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Enter text or URL" />
      <label className="text-sm text-slate-700 dark:text-slate-300">
        Output format
        <select
          value={format}
          onChange={(event) => setFormat(event.target.value as "png" | "svg")}
          className={selectClassName}
        >
          <option value="png">PNG</option>
          <option value="svg">SVG</option>
        </select>
      </label>
      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate QR code"}
      </Button>

      {previewUrl ? (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <img src={previewUrl} alt="Generated QR code preview" className="max-h-64 w-auto" />
        </div>
      ) : null}

      <BinaryResult result={result} label="QR code generated" />
    </div>
  );
}

function ImageConverterPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("png");
  const [quality, setQuality] = useState("90");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BinaryToolResponse | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleConvert() {
    if (!file) {
      onError("Choose an image file first.");
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const payload = new FormData();
      payload.append("file", file);
      payload.append("target_format", format);
      payload.append("quality", quality);

      const response = await toolsApi.imageConverter(payload);
      setResult(response);

      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (response.contentType.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(response.blob));
      } else {
        setPreviewUrl(null);
      }
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PrivacyNote text="Uploaded images are processed in-memory and never stored after conversion." />
      <Input
        type="file"
        accept="image/*,.heic,.heif"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Target format
          <select
            value={format}
            onChange={(event) => setFormat(event.target.value)}
            className={selectClassName}
          >
            <option value="png">PNG</option>
            <option value="jpeg">JPEG</option>
            <option value="webp">WEBP</option>
            <option value="gif">GIF</option>
            <option value="bmp">BMP</option>
            <option value="tiff">TIFF</option>
          </select>
        </label>
        <label className="text-sm text-slate-700 dark:text-slate-300">
          Quality (JPEG/WEBP)
          <Input value={quality} onChange={(event) => setQuality(event.target.value)} />
        </label>
      </div>

      <Button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert image"}
      </Button>

      {previewUrl ? (
        <div className="rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <img src={previewUrl} alt="Converted image preview" className="max-h-72 w-auto" />
        </div>
      ) : null}

      <BinaryResult result={result} label="Image conversion complete" />
    </div>
  );
}

function PdfUtilitiesPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"merge" | "split" | "compress">("merge");
  const [files, setFiles] = useState<File[]>([]);
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [compressFile, setCompressFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState("1-2");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BinaryToolResponse | null>(null);

  async function handleRun() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      if (mode === "merge") {
        if (files.length < 2) {
          onError("Select at least two PDF files for merge.");
          return;
        }
        const payload = new FormData();
        files.forEach((file) => payload.append("files", file));
        setResult(await toolsApi.pdfMerge(payload));
        return;
      }

      if (mode === "split") {
        if (!splitFile) {
          onError("Select a PDF file for split.");
          return;
        }
        const payload = new FormData();
        payload.append("file", splitFile);
        payload.append("page_range", pageRange);
        setResult(await toolsApi.pdfSplit(payload));
        return;
      }

      if (!compressFile) {
        onError("Select a PDF file for compression.");
        return;
      }
      const payload = new FormData();
      payload.append("file", compressFile);
      setResult(await toolsApi.pdfCompress(payload));
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <PrivacyNote text="PDFs are processed transiently and deleted immediately after output is returned." />
      <div className="flex flex-wrap gap-2">
        <Button variant={mode === "merge" ? "primary" : "secondary"} onClick={() => setMode("merge")}>Merge</Button>
        <Button variant={mode === "split" ? "primary" : "secondary"} onClick={() => setMode("split")}>Split</Button>
        <Button variant={mode === "compress" ? "primary" : "secondary"} onClick={() => setMode("compress")}>Compress</Button>
      </div>

      {mode === "merge" ? (
        <Input
          type="file"
          accept="application/pdf"
          multiple
          onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
        />
      ) : null}

      {mode === "split" ? (
        <div className="space-y-3">
          <Input type="file" accept="application/pdf" onChange={(event) => setSplitFile(event.target.files?.[0] ?? null)} />
          <Input value={pageRange} onChange={(event) => setPageRange(event.target.value)} placeholder="1-3,5,8-10" />
        </div>
      ) : null}

      {mode === "compress" ? (
        <Input type="file" accept="application/pdf" onChange={(event) => setCompressFile(event.target.files?.[0] ?? null)} />
      ) : null}

      <Button onClick={handleRun} disabled={loading}>
        {loading ? "Processing PDF..." : `Run PDF ${mode}`}
      </Button>

      <BinaryResult result={result} label="PDF result generated" />
      {mode === "compress" && result?.pdfCompression ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900 dark:border-emerald-700/55 dark:bg-emerald-950/25 dark:text-emerald-200">
          <p className="font-semibold">
            Compression saved {formatBytes(result.pdfCompression.savedBytes)} ({result.pdfCompression.savedPercent.toFixed(2)}%)
          </p>
          <p className="mt-1">
            Original: {formatBytes(result.pdfCompression.originalBytes)} | Compressed: {formatBytes(result.pdfCompression.compressedBytes)}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function PasswordGeneratorPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [mode, setMode] = useState<"random" | "passphrase">("random");
  const [length, setLength] = useState("20");
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [wordCount, setWordCount] = useState("4");
  const [separator, setSeparator] = useState("-");
  const [capitalizeWords, setCapitalizeWords] = useState(false);
  const [appendNumber, setAppendNumber] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PasswordGeneratorResponse | null>(null);

  async function handleGenerate() {
    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.passwordGenerator({
        mode,
        length: Number(length),
        include_lowercase: includeLowercase,
        include_uppercase: includeUppercase,
        include_numbers: includeNumbers,
        include_symbols: includeSymbols,
        word_count: Number(wordCount),
        separator,
        capitalize_words: capitalizeWords,
        append_number: appendNumber,
      });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyPassword() {
    if (!result?.value) return;
    await navigator.clipboard.writeText(result.value);
  }

  return (
    <div className="space-y-4">
      <PrivacyNote text="Generated passwords are returned once and never saved in backend storage, logs, or browser local storage." />
      <div className="flex gap-2">
        <Button variant={mode === "random" ? "primary" : "secondary"} onClick={() => setMode("random")}>Random password</Button>
        <Button variant={mode === "passphrase" ? "primary" : "secondary"} onClick={() => setMode("passphrase")}>Passphrase</Button>
      </div>

      {mode === "random" ? (
        <div className="space-y-3">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Length
            <Input value={length} onChange={(event) => setLength(event.target.value)} />
          </label>
          <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeLowercase} onChange={(event) => setIncludeLowercase(event.target.checked)} />Lowercase</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeUppercase} onChange={(event) => setIncludeUppercase(event.target.checked)} />Uppercase</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeNumbers} onChange={(event) => setIncludeNumbers(event.target.checked)} />Numbers</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={includeSymbols} onChange={(event) => setIncludeSymbols(event.target.checked)} />Symbols</label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Word count
            <Input value={wordCount} onChange={(event) => setWordCount(event.target.value)} />
          </label>
          <label className="text-sm text-slate-700 dark:text-slate-300">
            Separator
            <Input value={separator} onChange={(event) => setSeparator(event.target.value)} />
          </label>
          <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={capitalizeWords} onChange={(event) => setCapitalizeWords(event.target.checked)} />Capitalize words</label>
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={appendNumber} onChange={(event) => setAppendNumber(event.target.checked)} />Append number</label>
          </div>
        </div>
      )}

      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate"}
      </Button>

      {result ? (
        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-100/70 p-3 dark:border-white/10 dark:bg-[#0d131e]/75">
          <ResultHeading>Generated value</ResultHeading>
          <Textarea value={result.value} readOnly className="min-h-[96px]" />
          <Button variant="secondary" onClick={copyPassword}>Copy</Button>
        </div>
      ) : null}
    </div>
  );
}

function ColorConverterPanel({ onError, onClearError }: { onError: (message: string) => void; onClearError: () => void }) {
  const [input, setInput] = useState("#14B8A6");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ColorConverterResponse | null>(null);

  async function handleConvert() {
    const validation = validateRequiredText(input, "Color value");
    if (validation) {
      onError(validation);
      return;
    }

    onClearError();
    setLoading(true);
    setResult(null);

    try {
      const response = await toolsApi.colorConverter({ input });
      setResult(response);
    } catch (error) {
      onError(formatApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function copyValue(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <div className="space-y-4">
      <Input value={input} onChange={(event) => setInput(event.target.value)} placeholder="#RRGGBB or rgba(...)" />
      <Button onClick={handleConvert} disabled={loading}>
        {loading ? "Converting..." : "Convert color"}
      </Button>

      {result ? (
        <div className="space-y-2">
          {[
            { label: "HEX", value: result.hex },
            { label: "HEX Alpha", value: result.hex_alpha },
            { label: "RGB", value: result.rgb },
            { label: "RGBA", value: result.rgba },
          ].map((entry) => (
            <div
              key={entry.label}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-100/70 p-2 dark:border-white/10 dark:bg-[#0d131e]/75"
            >
              <p className="text-sm text-slate-700 dark:text-slate-200"><span className="font-semibold">{entry.label}:</span> {entry.value}</p>
              <Button variant="secondary" onClick={() => copyValue(entry.value)}>Copy</Button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
