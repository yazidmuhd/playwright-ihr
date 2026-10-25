/** "$29.99" or "Item total: $29.99" → 29.99 */
export function parsePrice(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d{1,2})?)/);
  if (!match?.[1]) throw new Error(`No price found in "${text}"`);
  return Number(match[1]);
}

/** Rounds to cents the way the site displays money */
export function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}
