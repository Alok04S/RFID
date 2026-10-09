import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AdmZip from 'adm-zip';
import { query, get, run, logAudit } from '../db.js';
import { broadcast } from './websocketService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
const PHOTOS_DIR = path.resolve(UPLOADS_DIR, 'photos');
const TEMP_DIR = path.resolve(UPLOADS_DIR, 'temp');

// Ensure necessary directories exist
[UPLOADS_DIR, PHOTOS_DIR, TEMP_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const SUPPORTED_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];

/**
 * Validate image buffer using magic bytes
 */
function isValidImage(buffer, ext) {
  if (!buffer || buffer.length < 12) return false;
  const lowerExt = ext.toLowerCase();

  if (lowerExt === '.jpg' || lowerExt === '.jpeg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (lowerExt === '.png') {
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47
    );
  }
  if (lowerExt === '.webp') {
    const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
    const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
    return isRiff && isWebp;
  }
  return false;
}

/**
 * Clean up a directory recursively
 */
export function removeDirRecursive(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error(`Failed to clean up directory ${dirPath}:`, err.message);
  }
}

/**
 * Step 1: Validate and Preview ZIP archive contents matching Registration Numbers
 */
export async function validateAndPreviewZip(zipFilePath) {
  const batchId = `zip_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const extractDir = path.resolve(TEMP_DIR, batchId);
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    // 1. Verify ZIP header (magic bytes: 0x50 0x4B 0x03 0x04)
    const fileHeader = Buffer.alloc(4);
    const fd = fs.openSync(zipFilePath, 'r');
    fs.readSync(fd, fileHeader, 0, 4, 0);
    fs.closeSync(fd);

    if (
      fileHeader[0] !== 0x50 ||
      fileHeader[1] !== 0x4b ||
      (fileHeader[2] !== 0x03 && fileHeader[2] !== 0x05 && fileHeader[2] !== 0x07)
    ) {
      throw new Error('The uploaded file is not a valid ZIP archive.');
    }

    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    if (zipEntries.length === 0) {
      throw new Error('The uploaded ZIP archive is completely empty.');
    }

    if (zipEntries.length > 5000) {
      throw new Error('ZIP archive contains too many entries (limit: 5,000 files).');
    }

    // 2. Fetch all existing students from database
    const allStudents = await query(
      'SELECT id, reg_number, full_name, room_number, branch, photo_url FROM students'
    );
    const studentMapByReg = new Map();
    allStudents.forEach((st) => {
      if (st.reg_number) {
        studentMapByReg.set(st.reg_number.trim().toUpperCase(), st);
      }
    });

    const items = [];
    const regCountInZip = new Map();
    const extractedFiles = [];
    let totalImagesFound = 0;
    let invalidFilesCount = 0;

    // 3. Process entries safely (Prevent Zip Slip / Path Traversal)
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      const rawEntryName = entry.entryName;
      // Sanitize: disallow directory traversal
      if (rawEntryName.includes('..') || path.isAbsolute(rawEntryName)) {
        invalidFilesCount++;
        items.push({
          reg_number: 'N/A',
          student_name: 'N/A',
          filename: rawEntryName,
          status: 'INVALID_PATH',
          message: 'Security Alert: Path traversal entry rejected.'
        });
        continue;
      }

      // Ignore macOS hidden metadata (__MACOSX, .DS_Store)
      if (rawEntryName.includes('__MACOSX') || path.basename(rawEntryName).startsWith('.')) {
        continue;
      }

      const basename = path.basename(rawEntryName);
      const ext = path.extname(basename).toLowerCase();

      if (!SUPPORTED_EXTS.includes(ext)) {
        invalidFilesCount++;
        items.push({
          reg_number: 'N/A',
          student_name: 'N/A',
          filename: basename,
          status: 'UNSUPPORTED_FORMAT',
          message: `Unsupported format '${ext}'. Allowed: .jpg, .jpeg, .png, .webp`
        });
        continue;
      }

      totalImagesFound++;

      // Decompress entry into buffer and check magic bytes
      const fileData = entry.getData();
      if (!isValidImage(fileData, ext)) {
        invalidFilesCount++;
        items.push({
          reg_number: 'N/A',
          student_name: 'N/A',
          filename: basename,
          status: 'CORRUPTED_IMAGE',
          message: 'File extension does not match actual image binary content.'
        });
        continue;
      }

      // Extract Sr. No. and Registration No. from filename without extension
      // Format: SrNo_RegistrationNo.extension (e.g. 10_2024BIT002.jpg, 11_2024BIT003.png)
      const nameWithoutExt = path.basename(basename, ext).trim();
      const firstUnderscoreIdx = nameWithoutExt.indexOf('_');

      if (firstUnderscoreIdx === -1) {
        invalidFilesCount++;
        items.push({
          reg_number: 'N/A',
          sr_no: 'N/A',
          student_name: 'N/A',
          filename: basename,
          status: 'INVALID_FILENAME_FORMAT',
          message: `Filename does not follow 'SrNo_RegistrationNo${ext}' format (missing '_' separator).`
        });
        continue;
      }

      const srNoPart = nameWithoutExt.substring(0, firstUnderscoreIdx).trim();
      const regNoPart = nameWithoutExt.substring(firstUnderscoreIdx + 1).trim();

      if (!regNoPart) {
        invalidFilesCount++;
        items.push({
          reg_number: 'N/A',
          sr_no: srNoPart || 'N/A',
          student_name: 'N/A',
          filename: basename,
          status: 'INVALID_FILENAME_FORMAT',
          message: `Filename does not contain a Registration No. after the '_' separator.`
        });
        continue;
      }

      // Normalized Registration No. for matching against student database (Sr. No. ignored for matching)
      const normalizedReg = regNoPart.toUpperCase();

      // Track duplicate filename conflict for same registration number
      const existingEntries = regCountInZip.get(normalizedReg) || [];
      existingEntries.push({ basename, ext, entry, srNo: srNoPart });
      regCountInZip.set(normalizedReg, existingEntries);

      // Save valid image to temp extraction folder
      const safeTempFilename = `${normalizedReg}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${ext}`;
      const tempFilePath = path.join(extractDir, safeTempFilename);
      fs.writeFileSync(tempFilePath, fileData);

      extractedFiles.push({
        rawFilename: basename,
        srNo: srNoPart,
        regNumber: normalizedReg,
        tempFilePath,
        ext
      });
    }

    // 4. Match against existing student records
    const matchedRegs = new Set();
    const duplicateConflicts = new Set();

    // Check for duplicate filenames mapping to the same registration number in the ZIP
    for (const [normReg, files] of regCountInZip.entries()) {
      if (files.length > 1) {
        duplicateConflicts.add(normReg);
      }
    }

    for (const item of extractedFiles) {
      const student = studentMapByReg.get(item.regNumber);

      if (duplicateConflicts.has(item.regNumber)) {
        items.push({
          sr_no: item.srNo,
          reg_number: item.regNumber,
          student_name: student ? student.full_name : 'Unknown',
          filename: item.rawFilename,
          status: 'DUPLICATE_IN_ZIP',
          tempFilePath: item.tempFilePath,
          message: `Multiple images found for Registration No. '${item.regNumber}' in ZIP. Resolve conflict.`
        });
        continue;
      }

      if (student) {
        matchedRegs.add(item.regNumber);
        const hasExistingPhoto = Boolean(
          student.photo_url &&
          (student.photo_url.includes('/uploads/photos/') || student.photo_url.startsWith('data:') || student.photo_url.startsWith('http'))
        );

        items.push({
          student_id: student.id,
          sr_no: item.srNo,
          reg_number: student.reg_number,
          student_name: student.full_name,
          room_number: student.room_number,
          filename: item.rawFilename,
          status: hasExistingPhoto ? 'MATCHED_REPLACEMENT' : 'MATCHED',
          tempFilePath: item.tempFilePath,
          hasExistingPhoto,
          message: hasExistingPhoto
            ? `Matches ${student.full_name} (${student.reg_number}) (Will replace existing photo).`
            : `Matches ${student.full_name} (${student.reg_number}).`
        });
      } else {
        items.push({
          sr_no: item.srNo,
          reg_number: item.regNumber,
          student_name: 'None',
          filename: item.rawFilename,
          status: 'UNMATCHED',
          tempFilePath: item.tempFilePath,
          message: `No student in database has Registration No. '${item.regNumber}'.`
        });
      }
    }

    // 5. Detect students whose photos are MISSING in this ZIP
    const missingStudents = [];
    allStudents.forEach((student) => {
      const normReg = student.reg_number ? student.reg_number.trim().toUpperCase() : '';
      if (!matchedRegs.has(normReg)) {
        missingStudents.push({
          student_id: student.id,
          reg_number: student.reg_number,
          student_name: student.full_name,
          room_number: student.room_number,
          filename: 'None',
          status: 'PHOTO_MISSING',
          message: `No photo provided for ${student.full_name} (${student.reg_number}).`
        });
      }
    });

    const summary = {
      batchId,
      totalStudentsInDb: allStudents.length,
      totalImagesFound,
      matchedCount: matchedRegs.size,
      unmatchedCount: items.filter((i) => i.status === 'UNMATCHED').length,
      duplicateConflictCount: duplicateConflicts.size,
      missingCount: missingStudents.length,
      invalidCount: invalidFilesCount
    };

    // Save batch metadata in temp folder for commit
    fs.writeFileSync(
      path.join(extractDir, 'meta.json'),
      JSON.stringify({ summary, items, missingStudents }, null, 2)
    );

    return {
      success: true,
      summary,
      items,
      missingStudents
    };
  } catch (err) {
    // Clean up temp directory on failure
    removeDirRecursive(extractDir);
    throw err;
  }
}

/**
 * Step 2: Confirm and Commit Matched Photos to Student Records
 */
export async function commitPhotoZip(batchId, adminName = 'Administrator') {
  const extractDir = path.resolve(TEMP_DIR, batchId);
  const metaFile = path.join(extractDir, 'meta.json');

  if (!fs.existsSync(metaFile)) {
    throw new Error('Photo upload session expired or not found. Please re-upload the ZIP file.');
  }

  const { items } = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  let updatedCount = 0;
  const replacedFilesToClean = [];

  try {
    for (const item of items) {
      if (item.status !== 'MATCHED' && item.status !== 'MATCHED_REPLACEMENT') {
        continue;
      }

      if (!item.student_id || !item.tempFilePath || !fs.existsSync(item.tempFilePath)) {
        continue;
      }

      const ext = path.extname(item.tempFilePath).toLowerCase();
      const sanitizedReg = String(item.reg_number).replace(/[^a-zA-Z0-9_-]/g, '_');
      const targetFilename = `${sanitizedReg}_${Date.now()}${ext}`;
      const destPath = path.join(PHOTOS_DIR, targetFilename);

      // Copy file from temp to final photos directory
      fs.copyFileSync(item.tempFilePath, destPath);

      // Check current photo to remove old local file if replaced
      const currentStudent = await get('SELECT photo_url FROM students WHERE id = ?', [item.student_id]);
      if (currentStudent && currentStudent.photo_url) {
        if (currentStudent.photo_url.startsWith('/uploads/photos/')) {
          const oldFilename = path.basename(currentStudent.photo_url);
          const oldFilePath = path.join(PHOTOS_DIR, oldFilename);
          if (oldFilePath !== destPath && fs.existsSync(oldFilePath)) {
            replacedFilesToClean.push(oldFilePath);
          }
        }
      }

      const newPhotoUrl = `/uploads/photos/${targetFilename}`;
      await run('UPDATE students SET photo_url = ? WHERE id = ?', [newPhotoUrl, item.student_id]);
      updatedCount++;
    }

    // Clean up replaced photo files
    for (const oldFile of replacedFilesToClean) {
      try {
        if (fs.existsSync(oldFile)) {
          fs.unlinkSync(oldFile);
        }
      } catch (e) {
        console.warn('Could not remove replaced photo:', oldFile, e.message);
      }
    }

    // Clean up temporary batch folder
    removeDirRecursive(extractDir);

    // Audit log
    await logAudit({
      action: 'STUDENT_PHOTOS_ZIP_IMPORTED',
      details: `Successfully mapped and updated ${updatedCount} student photographs via ZIP archive batch ${batchId}`,
      performed_by: adminName,
      role: 'ADMIN'
    });

    broadcast('STUDENT_UPDATED', { action: 'PHOTOS_BATCH_UPDATED', count: updatedCount });

    return {
      success: true,
      message: `Successfully mapped and updated ${updatedCount} student photographs.`,
      updatedCount
    };
  } catch (err) {
    removeDirRecursive(extractDir);
    throw err;
  }
}
