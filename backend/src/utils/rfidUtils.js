/**
 * Centralized RFID Normalization and Comparison Utilities
 * 
 * Rules:
 * 1. Convert input to string without unsafe numeric conversion (prevents precision loss on large numbers).
 * 2. Trim surrounding whitespace.
 * 3. Remove leading zeros from identifier.
 * 4. Strings consisting exclusively of zeros (e.g. '0', '0000000000') normalize to '0'.
 * 5. Empty or invalid identifiers return empty string '' (cannot match any RFID).
 */

/**
 * Normalizes an RFID tag by stripping surrounding whitespace and leading zeros.
 * String-safe: never coerces to JavaScript Number or Float.
 *
 * @param {string|number|null|undefined} rawRfid
 * @returns {string} Normalized RFID string, or '' if empty/invalid
 */
export function normalizeRfid(rawRfid) {
  if (rawRfid === null || rawRfid === undefined) {
    return '';
  }

  const str = String(rawRfid).trim();
  if (str.length === 0) {
    return '';
  }

  // Remove leading zeros
  const stripped = str.replace(/^0+/, '');

  // If the string was all zeros (e.g., '0' or '0000000000'), normalize to '0'
  return stripped === '' ? '0' : stripped;
}

/**
 * Compares two RFID identifiers ignoring leading zeros.
 * Safe against empty identifiers (empty RFID never matches anything).
 *
 * @param {string|number} rfidA
 * @param {string|number} rfidB
 * @returns {boolean} True if both are non-empty and have matching normalized values
 */
export function compareRfid(rfidA, rfidB) {
  const normA = normalizeRfid(rfidA);
  const normB = normalizeRfid(rfidB);

  if (!normA || !normB) {
    return false;
  }

  return normA === normB;
}

/**
 * Look up student(s) in SQLite matching a scanned RFID tag by normalized value.
 * Protects against ambiguous matches by returning all candidates that resolve
 * to the same normalized identifier.
 *
 * @param {string} scannedRfid - Scanned RFID tag from reader
 * @param {Function} queryFn - Database query function returning an array of rows
 * @returns {Promise<{
 *   status: 'MATCH' | 'NOT_FOUND' | 'CONFLICT' | 'INVALID',
 *   student: object | null,
 *   matches: Array<object>,
 *   normalizedRfid: string,
 *   message: string
 * }>}
 */
export async function findStudentByRfid(scannedRfid, queryFn) {
  const rawScanned = String(scannedRfid || '').trim();
  const normalizedScanned = normalizeRfid(rawScanned);

  if (!rawScanned || !normalizedScanned) {
    return {
      status: 'INVALID',
      student: null,
      matches: [],
      normalizedRfid: '',
      message: 'Empty or invalid RFID identifier provided.'
    };
  }

  // Query database using exact match OR SQLite leading-zero stripped match
  // SQLite expression: CASE WHEN LTRIM(TRIM(rfid_tag), '0') = '' AND TRIM(rfid_tag) != '' THEN '0' ELSE LTRIM(TRIM(rfid_tag), '0') END
  const sql = `
    SELECT * FROM students
    WHERE rfid_tag = ?
       OR rfid_tag = ?
       OR (CASE WHEN LTRIM(TRIM(rfid_tag), '0') = '' AND TRIM(rfid_tag) != '' THEN '0' ELSE LTRIM(TRIM(rfid_tag), '0') END) = ?
  `;

  const candidates = await queryFn(sql, [rawScanned, normalizedScanned, normalizedScanned]);

  // Secondary verification using JavaScript normalizeRfid to ensure 100% parity
  const matches = (candidates || []).filter((s) => {
    return compareRfid(s.rfid_tag, normalizedScanned);
  });

  if (matches.length === 0) {
    return {
      status: 'NOT_FOUND',
      student: null,
      matches: [],
      normalizedRfid: normalizedScanned,
      message: `No student record found matching RFID '${rawScanned}' (Normalized: '${normalizedScanned}').`
    };
  }

  if (matches.length === 1) {
    return {
      status: 'MATCH',
      student: matches[0],
      matches,
      normalizedRfid: normalizedScanned,
      message: `Matched ${matches[0].full_name} (${matches[0].reg_number}).`
    };
  }

  // Multiple student records resolve to the same normalized RFID -> AMBIGUOUS CONFLICT
  const conflictList = matches
    .map((s) => `${s.full_name} (Reg: ${s.reg_number}, Room: ${s.room_number}, Stored RFID: '${s.rfid_tag}')`)
    .join('; ');

  return {
    status: 'CONFLICT',
    student: null,
    matches,
    normalizedRfid: normalizedScanned,
    message: `RFID Ambiguity Conflict: Multiple students (${matches.length}) match normalized RFID '${normalizedScanned}': ${conflictList}. Access blocked to prevent incorrect attribution.`
  };
}
