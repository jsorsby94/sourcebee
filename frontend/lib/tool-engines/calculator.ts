export function sanitizeExpression(input: string): string {
  return input.replace(/\s+/g, " ").trim();
}
