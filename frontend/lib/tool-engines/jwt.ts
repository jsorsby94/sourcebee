export function formatJwtDate(isoDate?: string | null): string {
  if (!isoDate) return "Not present";
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return "Invalid date";
  return parsed.toLocaleString();
}
