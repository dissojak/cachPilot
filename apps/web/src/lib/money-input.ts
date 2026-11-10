/**
 * "2,000.5" → 2000500 millimes. Pure string parsing: no floating point ever
 * touches money (BR-29). Returns null when the text is not an amount.
 */
export function parseDntToMillimes(text: string, options: { allowNegative?: boolean } = {}): number | null {
  const cleaned = text.trim().replace(/[\s,]/g, "").replace(/DNT$/i, "");
  const match = /^(-)?(\d+)(?:\.(\d{1,3}))?$/.exec(cleaned);
  if (!match) return null;
  const [, minus, dinars = "0", decimals = ""] = match;
  if (minus && !options.allowNegative) return null;
  const millimes = Number(dinars) * 1000 + Number(decimals.padEnd(3, "0"));
  if (!Number.isSafeInteger(millimes)) return null;
  return minus ? -millimes : millimes;
}
