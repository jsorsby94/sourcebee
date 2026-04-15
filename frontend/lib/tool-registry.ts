export type ToolSlug =
  | "jwt-decoder"
  | "base64"
  | "json-formatter"
  | "unit-converter"
  | "calculator"
  | "ssl-checker"
  | "qr-code-generator"
  | "image-converter"
  | "pdf-utilities"
  | "password-generator"
  | "color-converter";

export type ToolApiSlug =
  | "jwt-decode"
  | "base64"
  | "json-formatter"
  | "unit-converter"
  | "calculator"
  | "ssl-checker"
  | "qr-code"
  | "image-converter"
  | "pdf-merge"
  | "pdf-split"
  | "pdf-compress"
  | "password-generator"
  | "color-converter";

export type CategorySlug = "encoding" | "data" | "developer" | "security" | "utilities";

export interface ToolFaqItem {
  question: string;
  answer: string;
}

export interface ToolDefinition {
  slug: ToolSlug;
  apiSlug: ToolApiSlug;
  extraApiSlugs?: ToolApiSlug[];
  name: string;
  category: CategorySlug;
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
    description: "General conversion and calculator tools for quick tasks.",
  },
];

export const TOOLS: ToolDefinition[] = [
  {
    slug: "jwt-decoder",
    apiSlug: "jwt-decode",
    name: "JWT Decoder",
    category: "security",
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
    category: "encoding",
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
    slug: "json-formatter",
    apiSlug: "json-formatter",
    name: "JSON Formatter",
    category: "data",
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
    category: "utilities",
    shortDescription: "Convert between common length, weight, temperature, volume, speed, and area units.",
    intro:
      "Use accurate unit conversions for engineering estimates, technical writing, and day-to-day calculations.",
    explanation:
      "Supports length, weight, temperature, volume, speed, and area categories with deterministic conversions.",
    seoTitle: "Unit Converter - Length, Weight, Temperature, Volume, Speed, Area",
    seoDescription:
      "Fast online unit converter for common categories with a clean interface and practical defaults.",
    related: ["calculator", "json-formatter", "color-converter"],
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
    slug: "calculator",
    apiSlug: "calculator",
    name: "Calculator",
    category: "developer",
    shortDescription: "Evaluate arithmetic expressions quickly with safe parsing.",
    intro:
      "Run quick arithmetic with strict parsing so unsupported or unsafe expression forms are rejected.",
    explanation:
      "Supports common arithmetic operators for reliable day-to-day engineering calculations.",
    seoTitle: "Online Calculator for Fast Developer Arithmetic",
    seoDescription:
      "Simple online calculator with safe expression parsing and reliable numeric output.",
    related: ["unit-converter", "json-formatter", "color-converter"],
    faqs: [
      {
        question: "Does this evaluate JavaScript code?",
        answer: "No. It uses a restricted arithmetic parser, not JavaScript eval.",
      },
      {
        question: "Which operators are supported?",
        answer: "Addition, subtraction, multiplication, division, modulo, floor division, and exponentiation.",
      },
    ],
  },
  {
    slug: "ssl-checker",
    apiSlug: "ssl-checker",
    name: "SSL Certificate Checker",
    category: "security",
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
    category: "encoding",
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
    category: "utilities",
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
    category: "data",
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
    category: "security",
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
    category: "developer",
    shortDescription: "Convert HEX, HEXA, RGB, and RGBA values instantly.",
    intro:
      "Switch between CSS color formats quickly while preserving alpha values where available.",
    explanation:
      "Supports #RGB, #RRGGBB, #RGBA, #RRGGBBAA, rgb(), and rgba() with canonicalized outputs.",
    seoTitle: "Hex to RGB and RGB to Hex Converter (with Alpha)",
    seoDescription:
      "Convert between hex, hexa, rgb, and rgba color formats with strict validation and clean output.",
    related: ["calculator", "image-converter", "unit-converter"],
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
