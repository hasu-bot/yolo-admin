export function toQuery(params: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value) result[key] = value;
  }
  return result;
}
