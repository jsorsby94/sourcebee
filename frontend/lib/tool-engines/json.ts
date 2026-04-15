export function normalizeJsonInput(value: string): string {
  return value.replace(/\u00a0/g, " ").trim();
}
