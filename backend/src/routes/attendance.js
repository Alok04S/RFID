import express from 'express';
import { get, query, run } from '../db.js';
import { timeService } from '../services/timeService.js';
import { escalationService } from '../services/escalationService.js';
import { broadcast } from '../services/websocketService.js';

const router = express.Router();

// Get today's attendance summary & lists
router.get('/today', async (req, res) => {
  try {
    const session = await escalationService.getOrCreateTodaySession();
    const currentMode = timeService.getCurrentMode();

    // Total active students
    const totalStudentsRow = await get("SELECT COUNT(*) as count FROM students WHERE status != 'EXPELLED'");
    const totalStudents = totalStudentsRow ? totalStudentsRow.count : 0;

    // Verified present students
    const presentRecords = await query(`
      SELECT ar.*, s.full_name, s.reg_number, s.room_number, s.photo_url, s.branch, s.contact_number
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ? AND ar.status = 'PRESENT'
      ORDER BY ar.verified_at DESC
    `, [session.id]);

    // Defaulter / unverified students
    const defaulters = await escalationService.getDefaultersForToday();

    return res.json({
      session,
      currentMode,
      stats: {
        totalStudents,
        presentCount: presentRecords.length,
        pendingCount: defaulters.length,
        attendanceRate: totalStudents > 0 ? Math.round((presentRecords.length / totalStudents) * 100) : 0
      },
      presentRecords,
      defaulters
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get real-time defaulters watchlist
router.get('/defaulters', async (req, res) => {
  try {
    const defaulters = await escalationService.getDefaultersForToday();
    const currentMode = timeService.getCurrentMode();
    res.json({
      count: defaulters.length,
      currentMode,
      defaulters
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Guard verifies student attendance (triggered by Enter key or Verify button)
router.post('/verify', async (req, res) => {
  try {
    const { student_id, notes } = req.body;
    if (!student_id) {
      return res.status(400).json({ error: 'student_id is required' });
    }

    const student = await get('SELECT * FROM students WHERE id = ?', [student_id]);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const session = await escalationService.getOrCreateTodaySession();

    // Insert or update attendance record as PRESENT
    await run(`
      INSERT INTO attendance_records (session_id, student_id, status, verified_at, verified_by)
      VALUES (?, ?, 'PRESENT', CURRENT_TIMESTAMP, 'GUARD_MANUAL')
      ON CONFLICT(session_id, student_id) DO UPDATE SET
        status = 'PRESENT',
        verified_at = CURRENT_TIMESTAMP,
        verified_by = 'GUARD_MANUAL'
    `, [session.id, student.id]);

    // Also log in gate_logs
    await run(`
      INSERT INTO gate_logs (student_id, rfid_tag, scan_type, verified_by_guard, notes)
      VALUES (?, ?, 'NIGHT_ATTENDANCE', 1, ?)
    `, [student.id, student.rfid_tag, notes || 'Verified present by guard']);

    const verifiedRecord = await get(`
      SELECT ar.*, s.full_name, s.reg_number, s.room_number, s.photo_url, s.branch, s.contact_number
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ? AND ar.student_id = ?
    `, [session.id, student.id]);

    broadcast('ATTENDANCE_VERIFIED', {
      student_id: student.id,
      student,
      record: verifiedRecord,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: `Attendance verified successfully for ${student.full_name} (${student.room_number})`,
      record: verifiedRecord
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance history by dates
router.get('/history', async (req, res) => {
  try {
    const sessions = await query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'PRESENT') as present_count,
        (SELECT COUNT(*) FROM attendance_records WHERE session_id = s.id AND status = 'ABSENT') as absent_count
      FROM attendance_sessions s
      ORDER BY s.session_date DESC
      LIMIT 30
    `);

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Attendance records for a specific session
router.get('/sessions/:id/records', async (req, res) => {
  try {
    const records = await query(`
      SELECT ar.*, s.full_name, s.reg_number, s.room_number, s.branch, s.year, s.contact_number, s.photo_url
      FROM attendance_records ar
      JOIN students s ON ar.student_id = s.id
      WHERE ar.session_id = ?
      ORDER BY ar.status ASC, s.room_number ASC
    `, [req.params.id]);

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
