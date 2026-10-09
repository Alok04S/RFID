/**
 * Centralized Client-Side RFID Normalization and Comparison Utilities
 * 
 * Rules:
 * 1. String-based conversion only (no unsafe numeric coercion).
 * 2. Trim surrounding whitespace.
 * 3. Strip leading zeros.
 * 4. Strings of zeros (e.g. '0', '0000000000') normalize to '0'.
 * 5. Empty or invalid identifiers return empty string '' (cannot match).
 */

export function normalizeRfid(rawRfid) {
  if (rawRfid === null || rawRfid === undefined) {
    return '';
  }

  const str = String(rawRfid).trim();
  if (str.length === 0) {
    return '';
  }

  const stripped = str.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

export function compareRfid(rfidA, rfidB) {
  const normA = normalizeRfid(rfidA);
  const normB = normalizeRfid(rfidB);

  if (!normA || !normB) {
    return false;
  }

  return normA === normB;
}
