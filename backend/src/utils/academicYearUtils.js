/**
 * Academic Year & Study Year Mappings for SGGS Hostel ERP
 *
 * Rules:
 * - FYBT -> First Year B.Tech (Year 1)
 * - SNBT / SYBT -> Second Year B.Tech (Year 2)
 * - TYBT -> Third Year B.Tech (Year 3)
 * - FNBT / LYBT -> Final Year B.Tech (Year 4)
 */

export const ACADEMIC_YEAR_MAP = {
  FYBT: {
    code: 'FYBT',
    yearNumber: 1,
    label: 'First Year B.Tech',
    shortLabel: '1st Year',
    badge: 'FYBT'
  },
  SNBT: {
    code: 'SNBT',
    yearNumber: 2,
    label: 'Second Year B.Tech',
    shortLabel: '2nd Year',
    badge: 'SNBT'
  },
  TYBT: {
    code: 'TYBT',
    yearNumber: 3,
    label: 'Third Year B.Tech',
    shortLabel: '3rd Year',
    badge: 'TYBT'
  },
  FNBT: {
    code: 'FNBT',
    yearNumber: 4,
    label: 'Final Year B.Tech',
    shortLabel: 'Final Year',
    badge: 'FNBT'
  }
};

/**
 * Checks a single string or number for standard year code
 */
function matchYearCode(val) {
  if (val === null || val === undefined) return null;
  const str = String(val).trim().toUpperCase();
  if (!str) return null;

  if (str === 'FYBT' || str === 'FY' || str === '1' || str === '1ST' || str.includes('FIRST')) {
    return 'FYBT';
  }
  if (str === 'SNBT' || str === 'SYBT' || str === 'SY' || str === '2' || str === '2ND' || str.includes('SECOND')) {
    return 'SNBT';
  }
  if (str === 'TYBT' || str === 'TY' || str === '3' || str === '3RD' || str.includes('THIRD')) {
    return 'TYBT';
  }
  if (str === 'FNBT' || str === 'FINAL' || str === 'LYBT' || str === '4' || str === '4TH' || str.includes('FINAL') || str.includes('FOURTH')) {
    return 'FNBT';
  }

  // Standalone numbers 1..4
  const numMatch = str.match(/\b([1-4])\b/);
  if (numMatch) {
    if (numMatch[1] === '1') return 'FYBT';
    if (numMatch[1] === '2') return 'SNBT';
    if (numMatch[1] === '3') return 'TYBT';
    if (numMatch[1] === '4') return 'FNBT';
  }

  return null;
}

/**
 * Derives academic year code from student registration number prefix
 * e.g. 2025... -> FYBT, 2024... -> SNBT, 2023... -> TYBT, 2022/2021... -> FNBT
 */
function matchRegYear(reg) {
  if (!reg || typeof reg !== 'string') return null;
  const clean = reg.trim().toUpperCase();
  if (clean.startsWith('2025')) return 'FYBT';
  if (clean.startsWith('2024')) return 'SNBT';
  if (clean.startsWith('2023')) return 'TYBT';
  if (clean.startsWith('2022') || clean.startsWith('2021') || clean.startsWith('2020') || clean.startsWith('2019')) return 'FNBT';
  return null;
}

/**
 * Normalizes any year input (object, code, number, or string) to standard code ('FYBT', 'SNBT', 'TYBT', 'FNBT')
 * @param {object|string|number|null|undefined} input
 * @returns {'FYBT'|'SNBT'|'TYBT'|'FNBT'}
 */
export function getAcademicYearCode(input) {
  if (input === null || input === undefined) return 'FYBT';

  if (typeof input === 'object') {
    // 1. Check academic_year code
    const ayCode = matchYearCode(input.academic_year);
    if (ayCode) return ayCode;

    // 2. Check year field code or number
    const yrCode = matchYearCode(input.year);
    if (yrCode) return yrCode;

    // 3. Check registration number admission year
    const regCode = matchRegYear(input.reg_number);
    if (regCode) return regCode;

    return 'FYBT';
  }

  return matchYearCode(input) || matchRegYear(input) || 'FYBT';
}

/**
 * Converts any year representation into integer 1..4
 * @param {object|string|number|null|undefined} input
 * @returns {number}
 */
export function parseYearToNumber(input) {
  const code = getAcademicYearCode(input);
  return ACADEMIC_YEAR_MAP[code]?.yearNumber || 1;
}

/**
 * Formats academic year into full text label e.g. "First Year B.Tech", "Final Year B.Tech"
 * @param {object|string|number|null|undefined} input
 * @param {object} options
 * @returns {string}
 */
export function formatAcademicYear(input, options = {}) {
  const code = getAcademicYearCode(input);
  const info = ACADEMIC_YEAR_MAP[code] || ACADEMIC_YEAR_MAP.FYBT;

  if (options.short) {
    return info.shortLabel;
  }
  if (options.badgeOnly) {
    return info.badge;
  }
  if (options.includeCode) {
    return `${info.label} (${info.code})`;
  }
  return info.label;
}

/**
 * Enhances a student object with standard academic year fields
 */
export function attachAcademicYearDetails(student) {
  if (!student) return student;
  const code = getAcademicYearCode(student);
  const info = ACADEMIC_YEAR_MAP[code] || ACADEMIC_YEAR_MAP.FYBT;

  return {
    ...student,
    year: info.yearNumber,
    academic_year: code,
    academic_year_code: code,
    academic_year_label: info.label,
    academic_year_short: info.shortLabel,
    academic_year_formatted: `${info.label} (${info.code})`
  };
}
