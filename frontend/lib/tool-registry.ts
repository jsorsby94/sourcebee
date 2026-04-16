export type ToolSlug =
  | "jwt-decoder"
  | "base64"
  | "json-yaml"
  | "hash-generator"
  | "uuid-generator"
  | "url-encoder-decoder"
  | "timestamp-converter"
  | "cron-parser-generator"
  | "json-formatter"
  | "unit-converter"
  | "ssl-checker"
  | "qr-code-generator"
  | "image-converter"
  | "pdf-utilities"
  | "password-generator"
  | "color-converter";

export type ToolApiSlug =
  | "jwt-decode"
  | "base64"
  | "json-yaml"
  | "hash-generator"
  | "uuid-generator"
  | "url-encoder-decoder"
  | "timestamp-converter"
  | "cron-parser-generator"
  | "json-formatter"
  | "unit-converter"
  | "ssl-checker"
  | "qr-code"
  | "image-converter"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-compress"
  | "password-generator"
  | "color-converter";

export type CategorySlug = "encoding" | "data" | "developer" | "security" | "utilities";
export type ToolIconKey =
  | "token"
  | "base64"
  | "yaml"
  | "hash"
  | "uuid"
  | "url"
  | "time"
  | "cron"
  | "json"
  | "units"
  | "math"
  | "ssl"
  | "qr"
  | "image"
  | "pdf"
  | "password"
  | "color";

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: ToolSlug;
  apiSlug: ToolApiSlug;
  extraApiSlugs?: ToolApiSlug[];
  name: string;
  iconKey: ToolIconKey;
  category: CategorySlug;
  searchKeywords: string[];
  shortDescription: string;
  intro: string;
  explanation: string;
  seoTitle: string;
  seoDescription: string;
  related: ToolSlug[];
  faqs: ToolFaqItem[];
}

export interface CategoryDefinition {
  slug: CategorySlug;
  name: string;
  description: string;
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    slug: "encoding",
    name: "Encoding",
    description: "Encoding and decoding helpers for text and token workflows.",
  },
  {
    slug: "data",
    name: "Data",
    description: "Data cleanup and formatting tools for JSON and structured payloads.",
  },
  {
    slug: "developer",
    name: "Developer",
    description: "Practical everyday utilities for software engineering tasks.",
  },
  {
    slug: "security",
    name: "Security",
    description: "Read-only security diagnostics with strict validation and safe defaults.",
  },
  {
    slug: "utilities",
    name: "Utilities",
    description: "General conversion tools for quick tasks.",
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: "jwt-decoder",
    apiSlug: "jwt-decode",
    name: "JWT Decoder",
    iconKey: "token",
    category: "security",
    searchKeywords: ["token", "claims", "bearer", "auth", "header", "payload"],
    shortDescription: "Decode JWT header and payload safely with expiration details.",
    intro:
      "Decode JSON Web Tokens quickly to inspect claims, headers, and expiration timestamps during debugging.",
    explanation:
      "This tool decodes JWT structure for analysis only. It does not verify signatures and should not be used as a trust decision.",
    seoTitle: "JWT Decoder Tool - Decode Header and Payload Instantly",
    seoDescription:
      "Free JWT decoder with readable header, payload, issue time, and expiry output. Built for safe token debugging workflows.",
    related: ["json-formatter", "base64", "ssl-checker"],
    faqs: [
      {
        question: "Does decoding a JWT verify the token signature?",
        answer:
          "No. Decoding only reads token content. Signature verification requires the issuer secret or public key and trust policy.",
      },
      {
        question: "Is my JWT stored?",
        answer:
          "No. JWT values are processed only for the current request and are never persisted or cached.",
      },
    ],
  },
  {
    slug: "base64",
    apiSlug: "base64",
    name: "Base64 Encode/Decode",
    iconKey: "base64",
    category: "encoding",
    searchKeywords: ["encode", "decode", "utf8", "string", "payload"],
    shortDescription: "Encode or decode Base64 text with copy-friendly output.",
    intro:
      "Convert plain text to Base64 and decode Base64 back to UTF-8 text with clear validation feedback.",
    explanation:
      "Useful for API payload inspection, data transfer troubleshooting, and quick developer workflows where deterministic conversion is needed.",
    seoTitle: "Base64 Encode and Decode Tool - Fast, Reliable, and Free",
    seoDescription:
      "Encode and decode Base64 text quickly with strict validation and clean output. Built for practical engineering tasks.",
    related: ["jwt-decoder", "json-formatter"],
    faqs: [
      {
        question: "Can this decode invalid Base64 input?",
        answer: "Invalid Base64 is rejected with a friendly error instead of returning corrupted output.",
      },
      {
        question: "Does this support binary files?",
        answer: "The MVP targets text workflows. Binary upload support can be added in a future enhancement.",
      },
    ],
  },
  {
    slug: "url-encoder-decoder",
    apiSlug: "url-encoder-decoder",
    name: "URL Encoder/Decoder",
    iconKey: "url",
    category: "encoding",
    searchKeywords: ["url", "encode", "decode", "percent", "query", "uri"],
    shortDescription: "Encode and decode URL-safe text for query strings and path segments.",
    intro:
      "Convert plain text into percent-encoded URL text and decode encoded URL components back to readable UTF-8.",
    explanation:
      "Useful for debugging query parameters, callback URLs, redirects, and API payloads that include encoded text.",
    seoTitle: "URL Encoder and Decoder - Percent Encode or Decode Text",
    seoDescription:
      "Encode and decode URL text instantly with UTF-8 handling and clear output for developer workflows.",
    related: ["base64", "json-formatter", "timestamp-converter"],
    faqs: [
      {
        question: "Does this encode spaces and reserved symbols?",
        answer: "Yes. Spaces and reserved characters are percent-encoded for URL-safe component usage.",
      },
      {
        question: "Can I decode UTF-8 URL text?",
        answer: "Yes. Decoding expects UTF-8 encoded content and returns readable text output.",
      },
    ],
  },
  {
    slug: "json-yaml",
    apiSlug: "json-yaml",
    name: "JSON <-> YAML Converter",
    iconKey: "yaml",
    category: "data",
    searchKeywords: ["json", "yaml", "yml", "convert", "transform", "parser"],
    shortDescription: "Convert JSON to YAML and YAML back to pretty JSON safely.",
    intro:
      "Switch between JSON and YAML formats quickly for configs, API payloads, and infrastructure manifests.",
    explanation:
      "Supports bidirectional conversion with strict parsing and optional key sorting for deterministic output.",
    seoTitle: "JSON to YAML and YAML to JSON Converter",
    seoDescription:
      "Convert JSON and YAML instantly with safe parsing, readable formatting, and developer-friendly output.",
    related: ["json-formatter", "base64", "url-encoder-decoder"],
    faqs: [
      {
        question: "Does this support conversion in both directions?",
        answer: "Yes. You can convert JSON to YAML and YAML back to formatted JSON.",
      },
      {
        question: "Can I sort object keys in output?",
        answer: "Yes. Enable key sorting to produce stable, deterministic output ordering.",
      },
    ],
  },
  {
    slug: "hash-generator",
    apiSlug: "hash-generator",
    name: "Hash Generator",
    iconKey: "hash",
    category: "security",
    searchKeywords: ["hash", "sha256", "sha512", "md5", "digest", "checksum"],
    shortDescription: "Generate deterministic hashes using MD5, SHA-1, SHA-2 algorithms.",
    intro:
      "Create hash digests from text input quickly for verification, debugging, and integration workflows.",
    explanation:
      "Supports MD5, SHA-1, SHA-224, SHA-256, SHA-384, and SHA-512 output in lowercase hexadecimal format.",
    seoTitle: "Hash Generator - MD5, SHA-1, SHA-256, SHA-512 Online",
    seoDescription:
      "Generate text hashes instantly with algorithm selection for common developer and security checks.",
    related: ["password-generator", "jwt-decoder", "base64"],
    faqs: [
      {
        question: "Is hashing the same as encryption?",
        answer: "No. Hashing is one-way and cannot be reversed to recover the original input.",
      },
      {
        question: "Which algorithms are available?",
        answer: "MD5, SHA-1, SHA-224, SHA-256, SHA-384, and SHA-512 are supported.",
      },
    ],
  },
  {
    slug: "uuid-generator",
    apiSlug: "uuid-generator",
    name: "UUID Generator",
    iconKey: "uuid",
    category: "developer",
    searchKeywords: ["uuid", "guid", "id", "unique", "v4", "identifier"],
    shortDescription: "Generate one or many UUID v4 identifiers with formatting options.",
    intro:
      "Create random UUID v4 values for database keys, distributed systems, and test fixtures.",
    explanation:
      "Supports batch generation with optional uppercase output and hyphen removal.",
    seoTitle: "UUID Generator - Fast UUID v4 IDs",
    seoDescription:
      "Generate UUID v4 values instantly with bulk output and formatting controls for developer workflows.",
    related: ["timestamp-converter", "json-formatter", "hash-generator"],
    faqs: [
      {
        question: "Which UUID version does this generate?",
        answer: "This tool generates RFC-compatible random UUID version 4 values.",
      },
      {
        question: "Can I generate multiple IDs at once?",
        answer: "Yes. You can request batch generation and copy all IDs in one action.",
      },
    ],
  },
  {
    slug: "timestamp-converter",
    apiSlug: "timestamp-converter",
    name: "Timestamp Converter",
    iconKey: "time",
    category: "developer",
    searchKeywords: ["timestamp", "unix", "epoch", "iso", "datetime", "utc"],
    shortDescription: "Convert Unix timestamps and ISO-8601 datetimes with UTC output.",
    intro:
      "Convert between Unix seconds, Unix milliseconds, and ISO datetime formats for logs and integrations.",
    explanation:
      "Input is auto-detected and converted into UTC ISO text, Unix seconds, and Unix milliseconds.",
    seoTitle: "Timestamp Converter - Unix and ISO-8601",
    seoDescription:
      "Convert Unix timestamps to ISO UTC and ISO datetimes to Unix seconds/milliseconds instantly.",
    related: ["uuid-generator", "url-encoder-decoder", "json-formatter"],
    faqs: [
      {
        question: "Does this support milliseconds?",
        answer: "Yes. Numeric input is auto-detected as seconds or milliseconds by magnitude.",
      },
      {
        question: "What timezone is used in output?",
        answer: "ISO output is normalized to UTC and returned with a trailing Z.",
      },
    ],
  },
  {
    slug: "cron-parser-generator",
    apiSlug: "cron-parser-generator",
    name: "Cron Parser/Generator",
    iconKey: "cron",
    category: "developer",
    searchKeywords: ["cron", "schedule", "parser", "generator", "expression", "jobs"],
    shortDescription: "Parse cron expressions and generate schedules from field values.",
    intro:
      "Inspect standard 5-field cron expressions or build a cron schedule from minute/hour/day fields.",
    explanation:
      "Supports wildcard, ranges, lists, and step values across the five standard cron fields.",
    seoTitle: "Cron Parser and Generator - 5-Field Cron Tool",
    seoDescription:
      "Parse and generate standard cron expressions with validation and readable schedule summaries.",
    related: ["timestamp-converter", "json-formatter", "uuid-generator"],
    faqs: [
      {
        question: "Which cron format is supported?",
        answer: "The tool supports the standard 5-field cron format: minute hour day-of-month month day-of-week.",
      },
      {
        question: "Does it validate ranges and steps?",
        answer: "Yes. Invalid ranges, empty list items, and invalid step values are rejected with clear errors.",
      },
    ],
  },
  {
    slug: "json-formatter",
    apiSlug: "json-formatter",
    name: "JSON Formatter",
    iconKey: "json",
    category: "data",
    searchKeywords: ["pretty", "minify", "validate", "parse", "schema"],
    shortDescription: "Pretty print, minify, and validate JSON with helpful errors.",
    intro:
      "Format, validate, and minify JSON in one place to speed up debugging and payload preparation.",
    explanation:
      "Validation errors include precise line and column context so malformed JSON can be fixed quickly.",
    seoTitle: "JSON Formatter and Validator - Pretty, Minify, and Validate",
    seoDescription:
      "Free JSON formatter with pretty print, minify mode, validation, and readable error messages for developers.",
    related: ["jwt-decoder", "base64", "unit-converter"],
    faqs: [
      {
        question: "Can I sort object keys?",
        answer: "Yes. You can enable key sorting for stable output when comparing payload versions.",
      },
      {
        question: "What happens on invalid JSON?",
        answer: "The tool returns a validation error with line and column information instead of partial output.",
      },
    ],
  },
  {
    slug: "unit-converter",
    apiSlug: "unit-converter",
    name: "Unit Converter",
    iconKey: "units",
    category: "utilities",
    searchKeywords: ["length", "weight", "temperature", "volume", "speed", "area"],
    shortDescription: "Convert between common length, weight, temperature, volume, speed, and area units.",
    intro:
      "Use accurate unit conversions for engineering estimates, technical writing, and day-to-day calculations.",
    explanation:
      "Supports length, weight, temperature, volume, speed, and area categories with deterministic conversions.",
    seoTitle: "Unit Converter - Length, Weight, Temperature, Volume, Speed, Area",
    seoDescription:
      "Fast online unit converter for common categories with a clean interface and practical defaults.",
    related: ["json-formatter", "color-converter", "image-converter"],
    faqs: [
      {
        question: "Which categories are supported?",
        answer: "Length, weight, temperature, volume, speed, and area are included in this MVP.",
      },
      {
        question: "Are conversions approximate?",
        answer: "The tool uses standard deterministic conversion constants and formulas.",
      },
    ],
  },
  {
    slug: "ssl-checker",
    apiSlug: "ssl-checker",
    name: "SSL Certificate Checker",
    iconKey: "ssl",
    category: "security",
    searchKeywords: ["tls", "certificate", "issuer", "san", "x509", "expiry"],
    shortDescription: "Check SSL certificate issuer, subject, SANs, and expiration metadata.",
    intro:
      "Inspect TLS certificate details for a hostname with strict SSRF controls and bounded timeouts.",
    explanation:
      "The checker accepts hostnames only, blocks private/internal targets, and connects safely on port 443.",
    seoTitle: "SSL Certificate Checker - Issuer, SANs, and Expiration",
    seoDescription:
      "Check SSL certificate metadata by hostname including issuer, subject, SAN list, validity dates, and days remaining.",
    related: ["jwt-decoder", "json-formatter", "password-generator"],
    faqs: [
      {
        question: "Can I submit full URLs?",
        answer: "No. For security reasons the checker accepts hostnames only.",
      },
      {
        question: "Why might a hostname be blocked?",
        answer:
          "Targets that resolve to localhost, private, or otherwise non-public IP ranges are blocked to reduce SSRF risk.",
      },
    ],
  },
  {
    slug: "qr-code-generator",
    apiSlug: "qr-code",
    name: "QR Code Generator",
    iconKey: "qr",
    category: "encoding",
    searchKeywords: ["qr", "png", "svg", "barcode", "link"],
    shortDescription: "Generate privacy-safe QR codes in PNG or SVG format.",
    intro:
      "Create downloadable QR codes for links, text, Wi-Fi payloads, and app deep links with fast output options.",
    explanation:
      "QR content is processed transiently and never stored after response delivery.",
    seoTitle: "QR Code Generator - PNG and SVG Output",
    seoDescription:
      "Generate QR codes instantly with PNG and SVG downloads, strict validation, and zero-retention processing.",
    related: ["base64", "pdf-utilities", "image-converter"],
    faqs: [
      {
        question: "What QR formats are available?",
        answer: "PNG and SVG outputs are supported for screen and print workflows.",
      },
      {
        question: "Is QR content stored?",
        answer: "No. Generated QR data is not persisted or cached.",
      },
    ],
  },
  {
    slug: "image-converter",
    apiSlug: "image-converter",
    name: "Image Converter",
    iconKey: "image",
    category: "utilities",
    searchKeywords: ["jpg", "png", "webp", "gif", "tiff", "heic"],
    shortDescription: "Convert images between common formats with strict file safety limits.",
    intro:
      "Convert uploaded images to PNG, JPEG, WEBP, GIF, BMP, or TIFF for compatibility across apps and platforms.",
    explanation:
      "HEIC input is supported, output targets stay in common web and desktop image formats.",
    seoTitle: "Image Converter - Convert PNG, JPG, WEBP, GIF, BMP, TIFF",
    seoDescription:
      "Privacy-focused image converter supporting common formats and HEIC input with strict size and safety controls.",
    related: ["qr-code-generator", "pdf-utilities", "color-converter"],
    faqs: [
      {
        question: "Does this support HEIC files?",
        answer: "Yes. HEIC can be uploaded as input and converted to common output formats.",
      },
      {
        question: "Are uploaded images stored?",
        answer: "No. Files are processed in-memory and discarded immediately after response.",
      },
    ],
  },
  {
    slug: "pdf-utilities",
    apiSlug: "pdf-merge",
    extraApiSlugs: ["pdf-split", "pdf-compress"],
    name: "PDF Utilities",
    iconKey: "pdf",
    category: "data",
    searchKeywords: ["pdf", "merge", "split", "compress", "pages"],
    shortDescription: "Merge, split, and compress PDFs with strict privacy and limits.",
    intro:
      "Run core PDF operations without accounts or storage: combine multiple PDFs, split ranges, and reduce document size.",
    explanation:
      "PDF files are transiently processed and deleted immediately; no file retention is used.",
    seoTitle: "PDF Utilities - Merge, Split, and Compress PDFs",
    seoDescription:
      "Use secure PDF merge, split, and compress utilities with balanced limits and zero-retention processing.",
    related: ["image-converter", "qr-code-generator", "json-formatter"],
    faqs: [
      {
        question: "Which PDF operations are included?",
        answer: "Merge, split-by-page-range, and compression are included in this release.",
      },
      {
        question: "Are my PDFs retained after processing?",
        answer: "No. Uploaded files are not stored and are discarded immediately after processing.",
      },
    ],
  },
  {
    slug: "password-generator",
    apiSlug: "password-generator",
    name: "Secure Password Generator",
    iconKey: "password",
    category: "security",
    searchKeywords: ["password", "passphrase", "entropy", "generator"],
    shortDescription: "Generate strong random passwords or passphrases with policy controls.",
    intro:
      "Create high-entropy passwords for production systems, credentials, and security policy compliance.",
    explanation:
      "Generated passwords are returned once and never persisted in storage or logs.",
    seoTitle: "Secure Password Generator - Random Passwords and Passphrases",
    seoDescription:
      "Generate secure random passwords and passphrases with length and character controls in a privacy-first workflow.",
    related: ["ssl-checker", "jwt-decoder", "color-converter"],
    faqs: [
      {
        question: "Can I generate passphrases too?",
        answer: "Yes. The tool supports both random-password mode and passphrase mode.",
      },
      {
        question: "Are generated passwords saved?",
        answer: "No. Password outputs are not stored in backend persistence or browser storage.",
      },
    ],
  },
  {
    slug: "color-converter",
    apiSlug: "color-converter",
    name: "Hex to RGB Converter",
    iconKey: "color",
    category: "developer",
    searchKeywords: ["hex", "rgb", "rgba", "css", "palette", "alpha"],
    shortDescription: "Convert HEX, HEXA, RGB, and RGBA values instantly.",
    intro:
      "Switch between CSS color formats quickly while preserving alpha values where available.",
    explanation:
      "Supports #RGB, #RRGGBB, #RGBA, #RRGGBBAA, rgb(), and rgba() with canonicalized outputs.",
    seoTitle: "Hex to RGB and RGB to Hex Converter (with Alpha)",
    seoDescription:
      "Convert between hex, hexa, rgb, and rgba color formats with strict validation and clean output.",
    related: ["image-converter", "unit-converter", "json-formatter"],
    faqs: [
      {
        question: "Are alpha channels supported?",
        answer: "Yes. Both hex-alpha and rgba inputs/outputs are supported.",
      },
      {
        question: "Which input formats are accepted?",
        answer: "#RGB, #RRGGBB, #RGBA, #RRGGBBAA, rgb(r,g,b), and rgba(r,g,b,a).",
      },
    ],
  },
];

const TOOL_MAP = new Map(TOOLS.map((tool) => [tool.slug, tool]));
const CATEGORY_MAP = new Map(CATEGORIES.map((category) => [category.slug, category]));

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return TOOL_MAP.get(slug as ToolSlug);
}

export function getCategoryBySlug(slug: string): CategoryDefinition | undefined {
  return CATEGORY_MAP.get(slug as CategorySlug);
}

export function getToolsByCategory(category: CategorySlug): ToolDefinition[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export const TOOL_API_SLUGS = [
  ...new Set(TOOLS.flatMap((tool) => [tool.apiSlug, ...(tool.extraApiSlugs ?? [])])),
] as ToolApiSlug[];
