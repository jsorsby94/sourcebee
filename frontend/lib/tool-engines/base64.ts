export function inferBase64Mode(value: string): "encode" | "decode" {
  const trimmed = value.trim();
  if (!trimmed) return "encode";
  const base64Like = /^[A-Za-z0-9+/=\s]+$/.test(trimmed);
  return base64Like ? "decode" : "encode";
}
