/** Rounds to two decimals and drops trailing zeros, e.g. 1.03 or 12. */
export function fmt(n: number): string {
  if (!Number.isFinite(n)) return "";
  return (Math.round(n * 100) / 100).toString();
}

/** Replaces {name} placeholders. Unknown names become an empty string. */
export function fill(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = vars[key];
    return value === undefined ? "" : String(value);
  });
}
