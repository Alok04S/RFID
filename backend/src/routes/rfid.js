import express from 'express';
import { get, query, run, logAudit } from '../db.js';
import { timeService } from '../services/timeService.js';
import { escalationService } from '../services/escalationService.js';
import { broadcast } from '../services/websocketService.js';
import { findStudentByRfid, normalizeRfid, compareRfid } from '../utils/rfidUtils.js';
import { attachAcademicYearDetails } from '../utils/academicYearUtils.js';
import { getHostelNameFromRoom } from '../utils/hostelUtils.js';

const router = express.Router();

// Real-time RFID Card Scan Handler with Gate IN / OUT Support
router.post('/scan', async (req, res) => {
  try {
    let { rfid_tag, direction, guard_name, device_type, notes } = req.body;
    if (!rfid_tag || typeof rfid_tag !== 'string') {
      return res.status(400).json({ error: 'RFID Tag is required' });
    }

    rfid_tag = rfid_tag.trim();
    const guard = guard_name || 'Security Guard (Gate 1)';
    const device = device_type || 'DESKTOP';

    // 1. Look up student in database ignoring leading zeros and preventing ambiguous matches
    const lookup = await findStudentByRfid(rfid_tag, query);
    const currentMode = timeService.getCurrentMode();
    const istSqliteTime = timeService.getIstSqliteDateTime();
    const istIsoString = timeService.getIstIsoString();
    const istTimeString12h = timeService.getIstTimeString12h();

    // Check if multiple students resolve to the same normalized RFID (Ambiguous Conflict)
    if (lookup.status === 'CONFLICT') {
      const conflictMsg = lookup.message;

      // Log conflict attempt
      await run(
        'INSERT INTO gate_logs (rfid_tag, scan_type, verified_by_guard, direction, device_type, guard_name, notes, timestamp) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
        [rfid_tag, 'AMBIGUOUS_RFID_CONFLICT', direction || 'IN', device, guard, conflictMsg, istSqliteTime]
      );

      await logAudit({
        action: 'AMBIGUOUS_RFID_CONFLICT',
        details: conflictMsg,
        performed_by: guard,
        role: 'GUARD',
        device_info: device
      });

      const conflictPayload = {
        success: false,
        status: 'RFID_CONFLICT',
        rfid_tag,
        normalized_rfid: lookup.normalizedRfid,
        mode: currentMode.mode,
        audio: 'ERROR',
        device_type: device,
        timestamp: istIsoString,
        scanned_at_ist: istTimeString12h,
        conflictingStudents: lookup.matches,
        message: conflictMsg
      };

      broadcast('RFID_SCANNED', conflictPayload);
      return res.status(409).json(conflictPayload);
    }

    if (lookup.status !== 'MATCH' || !lookup.student) {
      // Log unregistered scan attempt
      await run(
        'INSERT INTO gate_logs (rfid_tag, scan_type, verified_by_guard, direction, device_type, guard_name, notes, timestamp) VALUES (?, ?, 0, ?, ?, ?, ?, ?)',
        [rfid_tag, 'UNREGISTERED', direction || 'IN', device, guard, 'Card not recognized in database', istSqliteTime]
      );

      await logAudit({
        action: 'UNREGISTERED_CARD_SCANNED',
        details: `Unknown RFID card '${rfid_tag}' tapped at gate via ${device} by ${guard}`,
        performed_by: guard,
        role: 'GUARD',
        device_info: device
      });

      const unregPayload = {
        success: false,
        status: 'UNREGISTERED',
        rfid_tag,
        normalized_rfid: lookup.normalizedRfid,
        mode: currentMode.mode,
        audio: 'ERROR',
        device_type: device,
        timestamp: istIsoString,
        scanned_at_ist: istTimeString12h,
        message: 'Unregistered RFID Card Detected! Access Denied.'
      };

      broadcast('RFID_SCANNED', unregPayload);
      return res.status(404).json(unregPayload);
    }

    const student = lookup.student;

    // 2. Check if RFID Card is Deactivated or Reported Lost
    const isDeactivated = student.rfid_status === 'DEACTIVATED' || student.status === 'Inactive' || student.status === 'Deactivated';
    const isLost = student.rfid_status === 'LOST';

    if (isDeactivated || isLost) {
      const reasonMsg = isLost
        ? `RFID Card '${rfid_tag}' is reported LOST! Access Denied.`
        : `RFID Card '${rfid_tag}' is DEACTIVATED! Access Denied.`;

      await run(
        'INSERT INTO gate_logs (student_id, rfid_tag, scan_type, verified_by_guard, direction, device_type, guard_name, notes, academic_year, timestamp) VALUES (?, ?, ?, 0, ?, ?, ?, ?, ?, ?)',
        [student.id, rfid_tag, 'BLOCKED_CARD', 'IN', device, guard, reasonMsg, student.academic_year || '2024-2025', istSqliteTime]
      );

      await logAudit({
        action: 'BLOCKED_CARD_SCANNED',
        details: `${reasonMsg} Student: ${student.full_name} (${student.reg_number}, Room: ${student.room_number})`,
        performed_by: guard,
        role: 'GUARD',
        device_info: device
      });

      const blockedPayload = {
        success: false,
        status: 'CARD_DEACTIVATED',
        rfid_tag,
        student,
        audio: 'ERROR',
        device_type: device,
        timestamp: istIsoString,
        scanned_at_ist: istTimeString12h,
        message: reasonMsg
      };

      broadcast('RFID_SCANNED', blockedPayload);
      return res.status(403).json(blockedPayload);
    }

    // 3. Gate Entry Focus: Students tap strictly for Gate IN (Entry).
    const finalDirection = 'IN';
    const newStatus = 'INSIDE';

    // 4. Update student's presence state with exact IST timestamp
    await run(
      'UPDATE students SET current_status = ?, last_gate_movement = ? WHERE id = ?',
      [newStatus, istSqliteTime, student.id]
    );

    const updatedStudent = attachAcademicYearDetails({
      ...student,
      hostel_name: student.hostel_name || getHostelNameFromRoom(student.room_number),
      current_status: newStatus,
      last_gate_movement: istIsoString
    });

    // 5. Log Gate Entry with exact IST timestamp
    await run(`
      INSERT INTO gate_logs (
        student_id, rfid_tag, scan_type, verified_by_guard,
        direction, device_type, guard_name, notes, academic_year, timestamp
      )
      VALUES (?, ?, 'GATE_ENTRY', 1, ?, ?, ?, ?, ?, ?)
    `, [
      student.id,
      rfid_tag,
      finalDirection,
      device,
      guard,
      notes || 'Gate Entry check-in verified',
      student.academic_year || '2024-2025',
      istSqliteTime
    ]);

    const responsePayload = {
      success: true,
      status: 'VERIFIED_GATE_ENTRY',
      direction: finalDirection,
      device_type: device,
      guard_name: guard,
      mode: 'GATE_ENTRY',
      audio: 'SUCCESS',
      student: updatedStudent,
      autoResetSeconds: 5,
      timestamp: istIsoString,
      scanned_at_ist: istTimeString12h,
      entry_time_ist: istTimeString12h,
      message: `Gate Entry Logged for ${student.full_name} (${student.room_number})`
    };

    broadcast('RFID_SCANNED', responsePayload);
    broadcast('GATE_MOVEMENT', responsePayload);
    return res.json(responsePayload);
  } catch (err) {
    console.error('RFID scan error:', err);
    return res.status(500).json({ error: 'Server error processing RFID scan', details: err.message });
  }
});

// Recent Gate Movement Logs
router.get('/history', async (req, res) => {
  try {
    const { direction, limit = 50, academic_year } = req.query;

    let sql = `
      SELECT gl.*, s.full_name, s.reg_number, s.room_number, s.photo_url, s.branch, s.current_status
      FROM gate_logs gl
      LEFT JOIN students s ON gl.student_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (direction && (direction === 'IN' || direction === 'OUT')) {
      sql += ' AND gl.direction = ?';
      params.push(direction);
    }

    if (academic_year && academic_year !== 'ALL') {
      sql += ' AND (gl.academic_year = ? OR s.academic_year = ?)';
      params.push(academic_year, academic_year);
    }

    sql += ' ORDER BY gl.timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 50);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Real-time Hostel Presence Statistics (Inside vs Outside Headcounts)
router.get('/presence', async (req, res) => {
  try {
    const { academic_year } = req.query;
    const todayIst = timeService.getTodayString();

    let filterYear = '';
    const params = [];
    if (academic_year && academic_year !== 'ALL') {
      filterYear = 'WHERE academic_year = ?';
      params.push(academic_year);
    }

    const counts = await get(`
      SELECT
        COUNT(*) as total_students,
        COUNT(CASE WHEN current_status = 'INSIDE' OR current_status IS NULL THEN 1 END) as inside_count,
        COUNT(CASE WHEN current_status = 'OUTSIDE' THEN 1 END) as outside_count
      FROM students
      ${filterYear}
    `, params);

    // Today's total IN and OUT gate scans (IST date)
    const todayScans = await get(`
      SELECT
        COUNT(CASE WHEN direction = 'IN' THEN 1 END) as today_in_scans,
        COUNT(CASE WHEN direction = 'OUT' THEN 1 END) as today_out_scans
      FROM gate_logs
      WHERE date(timestamp) = ?
    `, [todayIst]);

    res.json({
      totalStudents: counts.total_students || 0,
      insideCount: counts.inside_count || 0,
      outsideCount: counts.outside_count || 0,
      todayInScans: todayScans.today_in_scans || 0,
      todayOutScans: todayScans.today_out_scans || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================================
// DOWNLOAD ALL RFID DATA (CSV with UTF-8 BOM, preserving leading zeros)
// ============================================================================
router.get('/download-all', async (req, res) => {
  try {
    const students = await query(`
      SELECT 
        sr_no,
        rfid_tag,
        reg_number,
        full_name,
        room_number,
        branch,
        contact_number,
        year,
        gender,
        rfid_status,
        card_type,
        current_status,
        last_gate_movement,
        academic_year
      FROM students
      ORDER BY sr_no ASC, room_number ASC, full_name ASC
    `);

    const headers = [
      'Sr. No.',
      'RFID No.',
      'Registration No.',
      'Name of the Student',
      'Room No.',
      'Branch',
      'Student Mobile No.',
      'Year',
      'Gender',
      'RFID Card Status',
      'Card Type / Protocol',
      'Current Gate Status',
      'Gate IN Permission',
      'Last Gate Movement'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    let csvContent = '\uFEFF' + headers.join(',') + '\r\n';

    students.forEach((s, idx) => {
      const srNo = s.sr_no !== null && s.sr_no !== undefined ? s.sr_no : (idx + 1);
      const cardStatus = s.rfid_status || 'ACTIVE';
      const permission = cardStatus === 'ACTIVE' ? 'Authorized Access' : 'Blocked at Gate';
      const gateStatus = s.current_status || 'INSIDE';

      const row = [
        escapeCsv(srNo),
        escapeCsv(s.rfid_tag || ''),
        escapeCsv(s.reg_number || ''),
        escapeCsv(s.full_name || ''),
        escapeCsv(s.room_number || ''),
        escapeCsv(s.branch || ''),
        escapeCsv(s.contact_number || ''),
        escapeCsv(s.year || 1),
        escapeCsv(s.gender || 'Not Specified'),
        escapeCsv(cardStatus),
        escapeCsv(s.card_type || '125 KHz (EM4100)'),
        escapeCsv(gateStatus),
        escapeCsv(permission),
        escapeCsv(s.last_gate_movement || 'No Recorded Movement')
      ];

      csvContent += row.join(',') + '\r\n';
    });

    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rfid_data_${dateStr}.csv"`);
    res.send(csvContent);
  } catch (err) {
    res.status(500).json({ error: 'Failed to export RFID dataset', details: err.message });
  }
});

export default router;
