/**
 * i-HR reads the visitor's IP from the X-Real-IP header in the test setup
 * (CLIENT_IP_HEADER), and only 127.0.0.0/8 counts as the "office network".
 */

/** A random office-network address: each browser context gets its own, so tests
 *  don't share i-HR's per-IP rate limits (e.g. 10 registrations per hour). */
export function officeIp(): string {
  const byte = () => 1 + Math.floor(Math.random() * 254);
  return `127.${byte()}.${byte()}.${byte()}`;
}

/** An address outside the allowlist (TEST-NET-3, reserved for documentation) */
export const OUTSIDE_IP = '203.0.113.50';
