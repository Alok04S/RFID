import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { get, query, run, logAudit } from '../db.js';
import { broadcast } from '../services/websocketService.js';
import { validateAndPreviewZip, commitPhotoZip, removeDirRecursive } from '../services/photoZipService.js';
import { normalizeRfid, compareRfid } from '../utils/rfidUtils.js';
import { getHostelNameFromRoom } from '../utils/hostelUtils.js';
import { parseYearToNumber, getAcademicYearCode, attachAcademicYearDetails, formatAcademicYear } from '../utils/academicYearUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const PHOTOS_DIR = path.resolve(UPLOADS_DIR, 'photos');
const TEMP_DIR = path.resolve(UPLOADS_DIR, 'temp');

[UPLOADS_DIR, PHOTOS_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const upload = multer({
  dest: TEMP_DIR,
  limits: { fileSize: 1024 * 1024 * 1024 } // 1 GB (1,024 MB)
});

const router = express.Router();

// Required 10 CSV Template Headers in Exact Order
export const REQUIRED_CSV_HEADERS = [
  'Sr. No.',
  'RFID No.',
  'Room No.',
  'Registration No.',
  'Branch',
  'Name of the Student',
  'Student Mobile No.',
  'Parents Contact No.',
  'Year',
  'Gender'
];

/**
 * Standard CSV line parser handling quotes, escaped quotes, and delimiters
 */
export function parseCsvContent(csvText) {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const cells = [];
    let cur = '';
    let inQuotes = false;
    const delimiter = line.includes('\t') ? '\t' : ',';

    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"' || c === "'") {
        if (inQuotes && line[i + 1] === c) {
          cur += c;
          i++; // Skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === delimiter && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    cells.push(cur.trim());
    return cells;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter((r) => r.some((c) => c && c.length > 0));

  return { headers, rows };
}

// ============================================================================
// 1. DOWNLOAD EXACT CSV TEMPLATE (10 SPECIFIED COLUMNS)
// ============================================================================
router.get('/csv-template', (req, res) => {
  const headerLine = REQUIRED_CSV_HEADERS.join(',');
  const sampleRow1 = '1,0008456123,A-204,2024BIT001,Information Technology,Kartik Pratap Singh,+91 98765 43210,+91 87654 32109,3,Male';
  const sampleRow2 = '2,0008456124,G-108,2024BIT002,Information Technology,Priya Patel,+91 98765 43211,+91 87654 32110,2,Female';
  const sampleRow3 = '3,0008456125,B-112,2024BCS015,Computer Science & Engg,Aditya Deshmukh,+91 98765 43212,+91 87654 32111,1,Male';

  const csvContent = `\uFEFF${headerLine}\r\n${sampleRow1}\r\n${sampleRow2}\r\n${sampleRow3}\r\n`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="sggs_hostel_students_template.csv"');
  res.send(csvContent);
});

// ============================================================================
// 1B. DOWNLOAD ALL STUDENT DATA (EXACT 10 COLUMNS, UTF-8 BOM, PRESERVING TEXT)
// ============================================================================
router.get('/download-all', async (req, res) => {
  try {
    const students = await query(`
      SELECT 
        sr_no,
        rfid_tag,
        room_number,
        reg_number,
        branch,
        full_name,
        contact_number,
        parent_contact_number,
        year,
        gender
      FROM students
      ORDER BY sr_no ASC, room_number ASC, full_name ASC
    `);

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    let csvContent = '\uFEFF' + REQUIRED_CSV_HEADERS.join(',') + '\r\n';

    students.forEach((s, idx) => {
      const srNo = s.sr_no !== null && s.sr_no !== undefined ? s.sr_no : (idx + 1);
      const row = [
        escapeCsv(srNo),
        escapeCsv(s.rfid_tag || ''),
        escapeCsv(s.room_number || ''),
        escapeCsv(s.reg_number || ''),
        escapeCsv(s.branch || ''),
        escapeCsv(s.full_name || ''),
        escapeCsv(s.contact_number || ''),
        escapeCsv(s.parent_contact_number || ''),
        escapeCsv(s.year || 1),
        escapeCsv(s.gender || 'Not Specified')
      ];
      csvContent += row.join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="student_database_${dateStr}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export student database', details: err.message });
  }
});

// ============================================================================
// 2. CSV PREVIEW & VALIDATION (PRE-COMMIT VALIDATION)
// ============================================================================
router.post('/validate-csv', async (req, res) => {
  try {
    const { csv_text } = req.body;
    if (!csv_text || typeof csv_text !== 'string' || !csv_text.trim()) {
      return res.status(400).json({ error: 'CSV content is required.' });
    }

    const { headers, rows } = parseCsvContent(csv_text);

    if (headers.length === 0) {
      return res.status(400).json({ error: 'CSV file is empty or missing headers.' });
    }

    // Validate headers against required template
    const normalizedUploaded = headers.map((h) => h.replace(/[\ufeff\s]/g, '').toLowerCase());
    const normalizedRequired = REQUIRED_CSV_HEADERS.map((h) => h.replace(/[\ufeff\s]/g, '').toLowerCase());

    const isMatch =
      normalizedUploaded.length === normalizedRequired.length &&
      normalizedUploaded.every((val, idx) => val === normalizedRequired[idx]);

    if (!isMatch) {
      return res.status(400).json({
        error: 'Invalid CSV header format.',
        expectedHeaders: REQUIRED_CSV_HEADERS,
        receivedHeaders: headers,
        message: `CSV headers must match exactly: ${REQUIRED_CSV_HEADERS.join(', ')}`
      });
    }

    // Existing records in database for duplicate detection
    const existingStudents = await query('SELECT id, reg_number, rfid_tag, full_name, room_number FROM students');
    const existingRegMap = new Map();
    const existingNormRfidMap = new Map();

    existingStudents.forEach((st) => {
      if (st.reg_number) existingRegMap.set(st.reg_number.trim().toUpperCase(), st);
      const normTag = normalizeRfid(st.rfid_tag);
      if (normTag) existingNormRfidMap.set(normTag, st);
    });

    const validRows = [];
    const invalidRows = [];
    const seenRegInCsv = new Map();
    const seenNormRfidInCsv = new Map();
    const duplicatesInDb = [];

    rows.forEach((row, idx) => {
      const rowNumber = idx + 2; // +1 header, +1 1-based index
      const srNo = (row[0] || '').trim();
      const rfidNo = (row[1] || '').trim();
      const roomNo = (row[2] || '').trim();
      const regNo = (row[3] || '').trim();
      const branch = (row[4] || 'Engineering').trim();
      const studentName = (row[5] || '').trim();
      const studentMobile = (row[6] || '').trim();
      const parentsContact = (row[7] || '').trim();
      const yearStr = (row[8] || '1').trim();
      const gender = (row[9] || 'Not Specified').trim();

      const errors = [];

      // Required field checks
      if (!studentName) errors.push('Missing Student Name');
      if (!regNo) errors.push('Missing Registration No.');
      if (!rfidNo) errors.push('Missing RFID No.');
      if (!roomNo) errors.push('Missing Room No.');

      const normReg = regNo.toUpperCase();
      const normRfid = normalizeRfid(rfidNo);

      // Intra-CSV duplicate registration number check
      if (normReg) {
        if (seenRegInCsv.has(normReg)) {
          errors.push(`Duplicate Registration No. '${regNo}' (also found at Row ${seenRegInCsv.get(normReg)})`);
        } else {
          seenRegInCsv.set(normReg, rowNumber);
        }
      }

      // Intra-CSV duplicate RFID number check (normalized to ignore leading zeroes)
      if (normRfid) {
        if (seenNormRfidInCsv.has(normRfid)) {
          errors.push(`Duplicate RFID '${rfidNo}' (resolves to same normalized RFID as Row ${seenNormRfidInCsv.get(normRfid)})`);
        } else {
          seenNormRfidInCsv.set(normRfid, rowNumber);
        }
      }

      // Existing DB conflict check
      let isDbDuplicate = false;
      let dbDuplicateDetails = null;

      if (normReg && existingRegMap.has(normReg)) {
        isDbDuplicate = true;
        const exist = existingRegMap.get(normReg);
        dbDuplicateDetails = `Registration No. '${regNo}' already exists in database (${exist.full_name}, Room ${exist.room_number})`;
      }

      if (normRfid && existingNormRfidMap.has(normRfid)) {
        const exist = existingNormRfidMap.get(normRfid);
        if (!isDbDuplicate || exist.reg_number.toUpperCase() !== normReg) {
          isDbDuplicate = true;
          dbDuplicateDetails = `RFID '${rfidNo}' normalizes to '${normRfid}', which is already assigned to ${exist.full_name} (${exist.reg_number}, Stored: '${exist.rfid_tag}')`;
        }
      }

      const parsedYear = parseYearToNumber(yearStr);
      const yearCode = getAcademicYearCode(yearStr);

      const studentObj = {
        rowNumber,
        sr_no: parseInt(srNo, 10) || rowNumber - 1,
        rfid_tag: rfidNo,
        room_number: roomNo,
        reg_number: regNo,
        branch,
        full_name: studentName,
        contact_number: studentMobile,
        parent_contact_number: parentsContact,
        year: parsedYear,
        gender: gender || 'Not Specified',
        isDbDuplicate,
        dbDuplicateDetails
      };

      if (isDbDuplicate) {
        duplicatesInDb.push({
          rowNumber,
          reg_number: regNo,
          rfid_tag: rfidNo,
          details: dbDuplicateDetails
        });
      }

      if (errors.length > 0) {
        invalidRows.push({
          rowNumber,
          row,
          errors
        });
      } else {
        validRows.push(studentObj);
      }
    });

    res.json({
      success: true,
      totalRows: rows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
      dbDuplicateCount: duplicatesInDb.length,
      validRows,
      invalidRows,
      duplicatesInDb,
      canImport: validRows.length > 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 3. CONFIRM AND IMPORT STUDENT CSV
// ============================================================================
router.post('/import-csv', async (req, res) => {
  try {
    const { students: studentList, skipDuplicates = false, academic_year, admin_name } = req.body;

    if (!Array.isArray(studentList) || studentList.length === 0) {
      return res.status(400).json({ error: 'No student data provided for import.' });
    }

    let targetYear = academic_year;
    if (!targetYear) {
      const activeSetting = await get("SELECT value FROM settings WHERE key = 'active_academic_year'");
      targetYear = activeSetting ? activeSetting.value : '2024-2025';
    }

    const performer = admin_name || 'Administrator';

    const existingStudents = await query('SELECT id, reg_number, rfid_tag, full_name FROM students');
    const existingRegMap = new Map();
    const existingNormRfidMap = new Map();

    existingStudents.forEach((st) => {
      if (st.reg_number) existingRegMap.set(st.reg_number.trim().toUpperCase(), st);
      const norm = normalizeRfid(st.rfid_tag);
      if (norm) existingNormRfidMap.set(norm, st);
    });

    let importedCount = 0;
    let skippedCount = 0;
    const skippedRecords = [];
    const failedRecords = [];

    // Begin transaction for safety
    await run('BEGIN TRANSACTION');

    try {
      for (const st of studentList) {
        const normReg = (st.reg_number || '').trim().toUpperCase();
        const normRfid = normalizeRfid(st.rfid_tag);

        const isRegConflict = existingRegMap.has(normReg);
        const isRfidConflict = existingNormRfidMap.has(normRfid);

        if (isRegConflict || isRfidConflict) {
          if (skipDuplicates) {
            skippedCount++;
            skippedRecords.push({
              rowNumber: st.rowNumber,
              reg_number: st.reg_number,
              rfid_tag: st.rfid_tag,
              full_name: st.full_name,
              reason: isRegConflict
                ? `Registration No. '${st.reg_number}' already exists.`
                : `RFID '${st.rfid_tag}' normalizes to '${normRfid}', which conflicts with assigned RFID of ${existingNormRfidMap.get(normRfid)?.full_name}.`
            });
            continue;
          } else {
            // Cannot import when conflict exists and skipDuplicates is false
            throw new Error(`Conflict detected for student ${st.full_name} (${st.reg_number}). Set skip duplicates or resolve file conflicts.`);
          }
        }

        // Clean initial photo placeholder (no photo link)
        const initialPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(st.full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;
        const email = `${st.reg_number ? st.reg_number.toLowerCase() : 'resident'}@sggs.ac.in`;
        const studentRoom = st.room_number ? st.room_number.trim() : 'TBD';
        const derivedHostel = getHostelNameFromRoom(studentRoom);

        await run(`
          INSERT INTO students (
            sr_no, rfid_tag, reg_number, full_name, branch, year, room_number,
            photo_url, contact_number, parent_name, parent_contact_number,
            email, hostel_name, card_type, academic_year, current_status, rfid_status, gender
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INSIDE', 'ACTIVE', ?)
        `, [
          st.sr_no || null,
          st.rfid_tag ? st.rfid_tag.trim() : '',
          st.reg_number ? st.reg_number.trim() : '',
          st.full_name ? st.full_name.trim() : '',
          st.branch || 'Information Technology',
          st.year ? parseYearToNumber(st.year) : 1,
          studentRoom,
          initialPhoto,
          st.contact_number || '',
          'Guardian',
          st.parent_contact_number || '',
          email,
          derivedHostel,
          '125 KHz (EM4100)',
          targetYear,
          st.gender || 'Not Specified'
        ]);

        existingRegMap.set(normReg, { reg_number: st.reg_number });
        existingNormRfidMap.set(normRfid, { rfid_tag: st.rfid_tag, full_name: st.full_name });
        importedCount++;
      }

      await run('COMMIT');
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }

    await logAudit({
      action: 'STUDENTS_CSV_IMPORTED',
      details: `Imported ${importedCount} student records from CSV. Skipped duplicates: ${skippedCount}. Batch: ${targetYear}`,
      performed_by: performer,
      role: 'ADMIN'
    });

    broadcast('STUDENT_UPDATED', { action: 'BULK_IMPORT', count: importedCount });

    res.json({
      success: true,
      message: `Successfully imported ${importedCount} student records.`,
      totalRows: studentList.length,
      importedCount,
      skippedCount,
      skippedRecords,
      failedCount: failedRecords.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 4. CLEAR ALL STUDENT DATA (ADMIN ONLY DESTRUCTIVE RESET)
// ============================================================================
router.post('/clear-all', async (req, res) => {
  try {
    const { confirm, admin_name, role } = req.body;

    if (role !== 'ADMIN' && req.headers['x-user-role'] !== 'ADMIN') {
      // Allow if performer role is ADMIN
      if (role !== 'ADMIN') {
        return res.status(403).json({ error: 'Permission denied: Only authorized administrators can clear student data.' });
      }
    }

    if (confirm !== 'CLEAR_ALL_STUDENT_DATA') {
      return res.status(400).json({ error: 'Explicit confirmation required. Please confirm the deletion request.' });
    }

    const performer = admin_name || 'Administrator';

    // Count records before deletion
    const countResult = await get('SELECT COUNT(*) as count FROM students');
    const studentCount = countResult ? countResult.count : 0;

    // 1. Clean up local uploaded photo files safely
    try {
      if (fs.existsSync(PHOTOS_DIR)) {
        const photoFiles = fs.readdirSync(PHOTOS_DIR);
        photoFiles.forEach((file) => {
          try {
            const filePath = path.join(PHOTOS_DIR, file);
            if (fs.statSync(filePath).isFile()) {
              fs.unlinkSync(filePath);
            }
          } catch (e) {
            console.warn('Could not remove photo file:', file, e.message);
          }
        });
      }
    } catch (e) {
      console.warn('Error cleaning photo directory:', e.message);
    }

    // 2. Perform safe transactional database purge of student records only
    await run('BEGIN TRANSACTION');
    try {
      await run('DELETE FROM penalties');
      await run('DELETE FROM attendance_records');
      await run('DELETE FROM gate_logs');
      await run('DELETE FROM students');
      await run('COMMIT');
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }

    await logAudit({
      action: 'ALL_STUDENTS_CLEARED',
      details: `Administrator cleared all ${studentCount} student records from database and removed associated photos.`,
      performed_by: performer,
      role: 'ADMIN'
    });

    broadcast('STUDENT_UPDATED', { action: 'ALL_CLEARED', count: studentCount });

    res.json({
      success: true,
      message: `All ${studentCount} student records and associated photos have been permanently removed.`,
      deletedCount: studentCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 5. BULK DELETE STUDENTS USING CHECKBOX SELECTION
// ============================================================================
router.post('/bulk-delete', async (req, res) => {
  try {
    const { student_ids, admin_name, role } = req.body;

    if (!Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least one student to delete.' });
    }

    // Validate integer IDs
    const validIds = student_ids
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id > 0);

    if (validIds.length === 0) {
      return res.status(400).json({ error: 'Invalid student IDs supplied.' });
    }

    const performer = admin_name || 'Administrator';

    // Verify which students exist in DB
    const placeholders = validIds.map(() => '?').join(',');
    const foundStudents = await query(
      `SELECT id, full_name, reg_number, photo_url FROM students WHERE id IN (${placeholders})`,
      validIds
    );

    if (foundStudents.length === 0) {
      return res.status(404).json({ error: 'No matching student records found for deletion.' });
    }

    const targetIds = foundStudents.map((s) => s.id);
    const targetPlaceholders = targetIds.map(() => '?').join(',');

    // Clean up local photo files for deleted students
    foundStudents.forEach((st) => {
      if (st.photo_url && st.photo_url.startsWith('/uploads/photos/')) {
        try {
          const photoFile = path.basename(st.photo_url);
          const fullPath = path.join(PHOTOS_DIR, photoFile);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        } catch (e) {
          console.warn('Could not delete photo for student:', st.reg_number, e.message);
        }
      }
    });

    // Transactional deletion of students and dependent records
    await run('BEGIN TRANSACTION');
    try {
      await run(`DELETE FROM penalties WHERE student_id IN (${targetPlaceholders})`, targetIds);
      await run(`DELETE FROM attendance_records WHERE student_id IN (${targetPlaceholders})`, targetIds);
      await run(`DELETE FROM gate_logs WHERE student_id IN (${targetPlaceholders})`, targetIds);
      await run(`DELETE FROM students WHERE id IN (${targetPlaceholders})`, targetIds);
      await run('COMMIT');
    } catch (err) {
      await run('ROLLBACK');
      throw err;
    }

    const namesSample = foundStudents.slice(0, 3).map((s) => s.full_name).join(', ') + (foundStudents.length > 3 ? '...' : '');

    await logAudit({
      action: 'STUDENTS_BULK_DELETED',
      details: `Bulk deleted ${foundStudents.length} student record(s): ${namesSample}`,
      performed_by: performer,
      role: 'ADMIN'
    });

    broadcast('STUDENT_UPDATED', { action: 'BULK_DELETED', ids: targetIds });

    res.json({
      success: true,
      message: `Successfully deleted ${foundStudents.length} selected student(s).`,
      deletedCount: foundStudents.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 6. STUDENT PHOTO ZIP UPLOAD & PREVIEW
// ============================================================================
router.post('/upload-photo-zip', (req, res, next) => {
  upload.single('zip_file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'The uploaded ZIP archive exceeds the maximum allowed size (1 GB). Please compress the archive or upload in smaller slots.'
        });
      }
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Please choose a ZIP file containing student photographs.' });
  }

  const uploadedZipPath = req.file.path;

  try {
    const previewResult = await validateAndPreviewZip(uploadedZipPath);
    res.json(previewResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  } finally {
    // Clean up uploaded zip file
    try {
      if (fs.existsSync(uploadedZipPath)) {
        fs.unlinkSync(uploadedZipPath);
      }
    } catch (e) {}
  }
});

// ============================================================================
// 7. CONFIRM AND COMMIT STUDENT PHOTO ZIP IMPORT
// ============================================================================
router.post('/commit-photo-zip', async (req, res) => {
  try {
    const { batchId, admin_name } = req.body;
    if (!batchId) {
      return res.status(400).json({ error: 'batchId is required to commit photo upload.' });
    }

    const commitResult = await commitPhotoZip(batchId, admin_name || 'Administrator');
    res.json(commitResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 8. LIST STUDENTS
// ============================================================================
router.get('/', async (req, res) => {
  try {
    const { academic_year, search, status } = req.query;

    let sql = `
      SELECT s.*,
        (SELECT COUNT(*) FROM penalties WHERE student_id = s.id AND status = 'ACTIVE') as active_penalty_count,
        (SELECT COALESCE(SUM(amount), 0) FROM penalties WHERE student_id = s.id AND status = 'ACTIVE') as total_fines,
        (SELECT status FROM attendance_records WHERE student_id = s.id AND session_id = (SELECT id FROM attendance_sessions ORDER BY id DESC LIMIT 1)) as today_status
      FROM students s
      WHERE 1=1
    `;
    const params = [];

    if (academic_year && academic_year !== 'ALL') {
      sql += ' AND s.academic_year = ?';
      params.push(academic_year);
    }

    if (status && status !== 'ALL') {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (s.full_name LIKE ? OR s.reg_number LIKE ? OR s.rfid_tag LIKE ? OR s.room_number LIKE ?)';
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY s.room_number ASC, s.full_name ASC';

    const students = await query(sql, params);
    const enriched = students.map(attachAcademicYearDetails);
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 9. GET SINGLE STUDENT PROFILE
// ============================================================================
router.get('/:id', async (req, res) => {
  try {
    const student = await get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const penalties = await query(
      'SELECT * FROM penalties WHERE student_id = ? ORDER BY created_at DESC',
      [student.id]
    );

    const gateLogs = await query(
      'SELECT * FROM gate_logs WHERE student_id = ? ORDER BY timestamp DESC LIMIT 30',
      [student.id]
    );

    res.json({
      student: attachAcademicYearDetails(student),
      penalties,
      gateLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 10. REGISTER INDIVIDUAL RESIDENT
// ============================================================================
router.post('/', async (req, res) => {
  try {
    const {
      rfid_tag, reg_number, full_name, branch, year, room_number,
      contact_number, parent_name, parent_contact_number,
      email, hostel_name, card_type, academic_year, gender, sr_no,
      performer_name, performer_role
    } = req.body;

    if (!rfid_tag || !reg_number || !full_name || !room_number || !email) {
      return res.status(400).json({ error: 'Required fields: rfid_tag, reg_number, full_name, room_number, email' });
    }

    let targetYear = academic_year;
    if (!targetYear) {
      const activeSetting = await get("SELECT value FROM settings WHERE key = 'active_academic_year'");
      targetYear = activeSetting ? activeSetting.value : '2024-2025';
    }

    // Check duplicate RFID
    const existingStudents = await query('SELECT id, full_name, rfid_tag FROM students WHERE rfid_tag IS NOT NULL');
    const existingRfid = existingStudents.find(s => compareRfid(s.rfid_tag, rfid_tag));
    if (existingRfid) {
      return res.status(400).json({ error: `RFID tag '${rfid_tag}' (normalized matches '${existingRfid.rfid_tag}') is already assigned to ${existingRfid.full_name}.` });
    }

    // Check duplicate Reg Number
    const existingReg = await get('SELECT id, full_name FROM students WHERE reg_number = ?', [reg_number.trim()]);
    if (existingReg) {
      return res.status(400).json({ error: `Registration Number '${reg_number}' already belongs to ${existingReg.full_name}.` });
    }

    const resolvedYear = year !== undefined ? parseYearToNumber(year) : 1;
    const studentRoom = room_number.trim();
    const derivedHostel = hostel_name || getHostelNameFromRoom(studentRoom);
    const defaultPhoto = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(full_name)}&backgroundColor=0284c7,0d9488,4f46e5`;

    const result = await run(`
      INSERT INTO students (
        sr_no, rfid_tag, reg_number, full_name, branch, year, room_number,
        photo_url, contact_number, parent_name, parent_contact_number,
        email, hostel_name, card_type, academic_year, current_status, rfid_status, gender
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'INSIDE', 'ACTIVE', ?)
    `, [
      sr_no || null,
      rfid_tag.trim(),
      reg_number.trim(),
      full_name.trim(),
      branch || 'Information Technology',
      resolvedYear,
      studentRoom,
      defaultPhoto,
      contact_number || '+91 90000 00000',
      parent_name || 'Guardian',
      parent_contact_number || '+91 90000 00000',
      email.trim(),
      derivedHostel,
      card_type || '125 KHz (EM4100)',
      targetYear,
      gender || 'Not Specified'
    ]);

    const rawNewStudent = await get('SELECT * FROM students WHERE id = ?', [result.lastID]);
    const newStudent = attachAcademicYearDetails(rawNewStudent);

    await logAudit({
      action: 'STUDENT_CREATED',
      details: `Registered resident ${newStudent.full_name} (${newStudent.reg_number}, Room: ${newStudent.room_number})`,
      performed_by: performer_name || 'Admin',
      role: performer_role || 'ADMIN',
      target_id: newStudent.id
    });

    broadcast('STUDENT_UPDATED', { action: 'CREATED', student: newStudent });
    res.status(201).json(newStudent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 11. UPDATE STUDENT DETAILS
// ============================================================================
router.put('/:id', async (req, res) => {
  try {
    const studentId = req.params.id;
    const {
      full_name, branch, year, room_number, contact_number,
      parent_name, parent_contact_number, email, status, academic_year,
      rfid_tag, reg_number, hostel_name, card_type, gender, sr_no,
      performer_name, performer_role
    } = req.body;

    const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    if (rfid_tag && !compareRfid(rfid_tag, student.rfid_tag)) {
      const allOtherStudents = await query('SELECT id, full_name, rfid_tag FROM students WHERE id != ? AND rfid_tag IS NOT NULL', [studentId]);
      const existingRfid = allOtherStudents.find(s => compareRfid(s.rfid_tag, rfid_tag));
      if (existingRfid) {
        return res.status(400).json({ error: `RFID tag '${rfid_tag}' (normalized matches '${existingRfid.rfid_tag}') is already assigned to ${existingRfid.full_name}.` });
      }
    }

    if (reg_number && reg_number.trim() !== student.reg_number) {
      const existingReg = await get('SELECT id, full_name FROM students WHERE reg_number = ? AND id != ?', [reg_number.trim(), studentId]);
      if (existingReg) {
        return res.status(400).json({ error: `Registration Number '${reg_number}' already belongs to ${existingReg.full_name}.` });
      }
    }

    const updatedYear = year !== undefined ? parseYearToNumber(year) : null;
    const updatedHostel = hostel_name || (room_number ? getHostelNameFromRoom(room_number) : null);

    await run(`
      UPDATE students
      SET full_name = COALESCE(?, full_name),
          branch = COALESCE(?, branch),
          year = COALESCE(?, year),
          room_number = COALESCE(?, room_number),
          contact_number = COALESCE(?, contact_number),
          parent_name = COALESCE(?, parent_name),
          parent_contact_number = COALESCE(?, parent_contact_number),
          email = COALESCE(?, email),
          status = COALESCE(?, status),
          academic_year = COALESCE(?, academic_year),
          rfid_tag = COALESCE(?, rfid_tag),
          reg_number = COALESCE(?, reg_number),
          hostel_name = COALESCE(?, hostel_name),
          card_type = COALESCE(?, card_type),
          gender = COALESCE(?, gender),
          sr_no = COALESCE(?, sr_no)
      WHERE id = ?
    `, [
      full_name, branch, updatedYear, room_number, contact_number,
      parent_name, parent_contact_number, email, status, academic_year,
      rfid_tag ? rfid_tag.trim() : null,
      reg_number ? reg_number.trim() : null,
      updatedHostel,
      card_type,
      gender,
      sr_no,
      studentId
    ]);

    const rawUpdated = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    const updated = attachAcademicYearDetails(rawUpdated);

    await logAudit({
      action: 'STUDENT_UPDATED',
      details: `Updated profile for ${updated.full_name} (${updated.reg_number}, Room: ${updated.room_number})`,
      performed_by: performer_name || 'Admin',
      role: performer_role || 'ADMIN',
      target_id: updated.id
    });

    broadcast('STUDENT_UPDATED', { action: 'UPDATED', student: updated });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 12. REASSIGN RFID TAG
// ============================================================================
router.post('/:id/reassign-rfid', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { new_rfid_tag, reason, performer_name, performer_role } = req.body;

    if (!new_rfid_tag || typeof new_rfid_tag !== 'string' || new_rfid_tag.trim() === '') {
      return res.status(400).json({ error: 'New RFID tag is required' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const tagToAssign = new_rfid_tag.trim();

    const allOtherStudents = await query('SELECT id, full_name, reg_number, rfid_tag FROM students WHERE id != ? AND rfid_tag IS NOT NULL', [studentId]);
    const conflict = allOtherStudents.find(s => compareRfid(s.rfid_tag, tagToAssign));
    if (conflict) {
      return res.status(400).json({ error: `RFID tag '${tagToAssign}' (normalized matches '${conflict.rfid_tag}') is already assigned to ${conflict.full_name} (${conflict.reg_number})` });
    }

    const oldTag = student.rfid_tag;
    await run('UPDATE students SET rfid_tag = ? WHERE id = ?', [tagToAssign, studentId]);

    const updated = await get('SELECT * FROM students WHERE id = ?', [studentId]);

    await logAudit({
      action: 'RFID_REASSIGNED',
      details: `Reassigned RFID card for ${student.full_name}: ${oldTag} ➔ ${tagToAssign}. Reason: ${reason || 'Card replacement'}`,
      performed_by: performer_name || 'Admin',
      role: performer_role || 'ADMIN',
      target_id: studentId
    });

    broadcast('STUDENT_UPDATED', { action: 'RFID_REASSIGNED', student: updated });

    res.json({
      success: true,
      message: `RFID tag successfully reassigned to ${tagToAssign}`,
      student: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 13. UPDATE RFID STATUS (ACTIVE, DEACTIVATED, LOST)
// ============================================================================
router.post('/:id/rfid-status', async (req, res) => {
  try {
    const studentId = req.params.id;
    const { rfid_status, reason, performer_name, performer_role } = req.body;

    const validStatuses = ['ACTIVE', 'DEACTIVATED', 'LOST'];
    if (!validStatuses.includes(rfid_status)) {
      return res.status(400).json({ error: 'rfid_status must be ACTIVE, DEACTIVATED, or LOST' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [studentId]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    await run('UPDATE students SET rfid_status = ? WHERE id = ?', [rfid_status, studentId]);
    const updated = await get('SELECT * FROM students WHERE id = ?', [studentId]);

    await logAudit({
      action: `RFID_CARD_${rfid_status}`,
      details: `RFID card '${student.rfid_tag}' for ${student.full_name} (${student.reg_number}) changed to ${rfid_status}. Reason: ${reason || 'Admin status change'}`,
      performed_by: performer_name || 'Admin',
      role: performer_role || 'ADMIN',
      target_id: studentId
    });

    broadcast('STUDENT_UPDATED', { action: 'RFID_STATUS_CHANGED', student: updated });

    res.json({
      success: true,
      message: `RFID card status updated to ${rfid_status}`,
      student: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// 14. INDIVIDUAL STUDENT DELETION
// ============================================================================
router.delete('/:id', async (req, res) => {
  try {
    const student = await get('SELECT * FROM students WHERE id = ?', [req.params.id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const performerName = req.query.admin_name || 'Admin';

    // Delete student photo if stored locally
    if (student.photo_url && student.photo_url.startsWith('/uploads/photos/')) {
      try {
        const photoFile = path.basename(student.photo_url);
        const fullPath = path.join(PHOTOS_DIR, photoFile);
        if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
      } catch (e) {}
    }

    await run('DELETE FROM penalties WHERE student_id = ?', [req.params.id]);
    await run('DELETE FROM attendance_records WHERE student_id = ?', [req.params.id]);
    await run('DELETE FROM gate_logs WHERE student_id = ?', [req.params.id]);
    await run('DELETE FROM students WHERE id = ?', [req.params.id]);

    await logAudit({
      action: 'STUDENT_DELETED',
      details: `Deleted student record ${student.full_name} (${student.reg_number})`,
      performed_by: performerName,
      role: 'ADMIN',
      target_id: student.id
    });

    broadcast('STUDENT_UPDATED', { action: 'DELETED', studentId: student.id });
    res.json({ success: true, message: `Student ${student.full_name} deleted successfully.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
