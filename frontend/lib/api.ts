import type { ToolApiSlug } from "@/lib/tool-registry";

export interface ToolApiErrorPayload {
  error: {
    code: string;
    message: string;
    request_id?: string;
  };
}

export class ToolApiError extends Error {
  code: string;
  requestId?: string;
  status: number;

  constructor(status: number, code: string, message: string, requestId?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export interface BinaryToolResponse {
  blob: Blob;
  contentType: string;
  filename: string;
}

function parseFilename(contentDisposition: string | null): string | null {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const basicMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  return basicMatch?.[1] ?? null;
}

async function parseJsonSafe(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizeApiError(status: number, body: unknown): ToolApiError {
  if (body && typeof body === "object" && "error" in body) {
    const apiError = body as ToolApiErrorPayload;
    return new ToolApiError(status, apiError.error.code, apiError.error.message, apiError.error.request_id);
  }
  return new ToolApiError(status, "request_failed", "Request failed unexpectedly");
}

export async function callTool<TReq, TRes>(tool: ToolApiSlug, payload: TReq): Promise<TRes> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(`/api/tools/${tool}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    const body = await parseJsonSafe(response);

    if (!response.ok) {
      throw normalizeApiError(response.status, body);
    }

    if (body === null) {
      throw new ToolApiError(502, "invalid_response", "Server returned an empty response");
    }

    return body as TRes;
  } catch (error) {
    if (error instanceof ToolApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ToolApiError(504, "timeout", "Request timed out");
    }
    throw new ToolApiError(500, "network_error", "Unable to reach the tool API");
  } finally {
    clearTimeout(timeout);
  }
}

export async function callBinaryTool(tool: ToolApiSlug, formData: FormData): Promise<BinaryToolResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(`/api/tools/${tool}`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      const maybeErrorBody = await parseJsonSafe(response);
      throw normalizeApiError(response.status, maybeErrorBody);
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") ?? "application/octet-stream";
    const filename =
      parseFilename(response.headers.get("content-disposition")) ??
      `${tool}-${Date.now().toString()}.bin`;

    return { blob, contentType, filename };
  } catch (error) {
    if (error instanceof ToolApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ToolApiError(504, "timeout", "Request timed out");
    }
    throw new ToolApiError(500, "network_error", "Unable to reach the tool API");
  } finally {
    clearTimeout(timeout);
  }
}

export interface JwtDecodeRequest {
  token: string;
}

export interface JwtDecodeResponse {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
  issued_at: string | null;
  expires_at: string | null;
  is_expired: boolean | null;
}

export interface Base64Request {
  mode: "encode" | "decode";
  input: string;
}

export interface Base64Response {
  mode: "encode" | "decode";
  output: string;
}

export interface JsonFormatterRequest {
  operation: "pretty" | "minify" | "validate";
  input: string;
  sort_keys: boolean;
}

export interface JsonFormatterResponse {
  operation: "pretty" | "minify" | "validate";
  valid: boolean;
  output: string | null;
}

export interface UnitConverterRequest {
  category: "length" | "weight" | "temperature" | "volume" | "speed" | "area";
  value: number;
  from_unit: string;
  to_unit: string;
}

export interface UnitConverterResponse {
  category: string;
  input_value: number;
  from_unit: string;
  to_unit: string;
  output_value: number;
}

export interface CalculatorRequest {
  expression: string;
}

export interface CalculatorResponse {
  expression: string;
  result: number;
}

export interface SslCheckerRequest {
  hostname: string;
}

export interface SslCheckerResponse {
  hostname: string;
  issuer: string;
  subject: string;
  valid_from: string;
  valid_to: string;
  days_remaining: number;
  sans: string[];
}

export interface PasswordGeneratorRequest {
  mode: "random" | "passphrase";
  length: number;
  include_lowercase: boolean;
  include_uppercase: boolean;
  include_numbers: boolean;
  include_symbols: boolean;
  word_count: number;
  separator: string;
  capitalize_words: boolean;
  append_number: boolean;
}

export interface PasswordGeneratorResponse {
  mode: "random" | "passphrase";
  value: string;
  length: number;
}

export interface ColorConverterRequest {
  input: string;
}

export interface ColorConverterResponse {
  input: string;
  hex: string;
  hex_alpha: string;
  rgb: string;
  rgba: string;
}

export const toolsApi = {
  jwtDecode: (payload: JwtDecodeRequest) => callTool<JwtDecodeRequest, JwtDecodeResponse>("jwt-decode", payload),
  base64: (payload: Base64Request) => callTool<Base64Request, Base64Response>("base64", payload),
  jsonFormatter: (payload: JsonFormatterRequest) =>
    callTool<JsonFormatterRequest, JsonFormatterResponse>("json-formatter", payload),
  unitConverter: (payload: UnitConverterRequest) =>
    callTool<UnitConverterRequest, UnitConverterResponse>("unit-converter", payload),
  calculator: (payload: CalculatorRequest) =>
    callTool<CalculatorRequest, CalculatorResponse>("calculator", payload),
  sslChecker: (payload: SslCheckerRequest) =>
    callTool<SslCheckerRequest, SslCheckerResponse>("ssl-checker", payload),
  passwordGenerator: (payload: PasswordGeneratorRequest) =>
    callTool<PasswordGeneratorRequest, PasswordGeneratorResponse>("password-generator", payload),
  colorConverter: (payload: ColorConverterRequest) =>
    callTool<ColorConverterRequest, ColorConverterResponse>("color-converter", payload),
  qrCode: (payload: FormData) => callBinaryTool("qr-code", payload),
  imageConverter: (payload: FormData) => callBinaryTool("image-converter", payload),
  pdfMerge: (payload: FormData) => callBinaryTool("pdf-merge", payload),
  pdfSplit: (payload: FormData) => callBinaryTool("pdf-split", payload),
  pdfCompress: (payload: FormData) => callBinaryTool("pdf-compress", payload),
};
