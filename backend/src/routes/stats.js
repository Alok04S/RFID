import express from 'express';
import { get, query } from '../db.js';
import { timeService } from '../services/timeService.js';
import { escalationService } from '../services/escalationService.js';

const router = express.Router();

// Dashboard overview stats
router.get('/dashboard', async (req, res) => {
  try {
    const session = await escalationService.getOrCreateTodaySession();
    const currentMode = timeService.getCurrentMode();

    const todayIst = timeService.getTodayString();
    const totalStudents = (await get("SELECT COUNT(*) as c FROM students WHERE status != 'EXPELLED'"))?.c || 0;
    const presentToday = (await get("SELECT COUNT(*) as c FROM attendance_records WHERE session_id = ? AND status = 'PRESENT'", [session.id]))?.c || 0;
    const totalGateEntriesToday = (await get("SELECT COUNT(*) as c FROM gate_logs WHERE date(timestamp) = ?", [todayIst]))?.c || 0;
    const activePenaltiesCount = (await get("SELECT COUNT(*) as c FROM penalties WHERE status = 'ACTIVE'"))?.c || 0;
    const totalFinesSum = (await get("SELECT COALESCE(SUM(amount), 0) as s FROM penalties WHERE status = 'ACTIVE'"))?.s || 0;
    const expulsionFlagsCount = (await get("SELECT COUNT(*) as c FROM penalties WHERE tier = 'EXPULSION_FLAG' AND status = 'ACTIVE'"))?.c || 0;

    const recentGateLogs = await query(`
      SELECT gl.*, s.full_name, s.reg_number, s.room_number, s.photo_url
      FROM gate_logs gl
      LEFT JOIN students s ON gl.student_id = s.id
      ORDER BY gl.timestamp DESC
      LIMIT 15
    `);

    res.json({
      currentMode,
      metrics: {
        totalStudents,
        presentToday,
        pendingToday: Math.max(0, totalStudents - presentToday),
        attendanceRate: totalStudents > 0 ? Math.round((presentToday / totalStudents) * 100) : 0,
        totalGateEntriesToday,
        activePenaltiesCount,
        totalFinesSum,
        expulsionFlagsCount
      },
      recentGateLogs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
