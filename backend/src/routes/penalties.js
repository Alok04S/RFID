import express from 'express';
import { get, query, run, logAudit } from '../db.js';
import { broadcast } from '../services/websocketService.js';

const router = express.Router();

// List all penalties with student details and metrics
router.get('/', async (req, res) => {
  try {
    const { status, academic_year } = req.query; // 'ACTIVE', 'WAIVED', or all
    let sql = `
      SELECT p.*, s.full_name, s.reg_number, s.room_number, s.branch, s.photo_url, s.contact_number, s.email,
             ases.session_date
      FROM penalties p
      JOIN students s ON p.student_id = s.id
      LEFT JOIN attendance_sessions ases ON p.session_id = ases.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'ALL') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (academic_year && academic_year !== 'ALL') {
      sql += ' AND s.academic_year = ?';
      params.push(academic_year);
    }

    sql += ' ORDER BY p.created_at DESC';

    const penalties = await query(sql, params);

    // Filter metrics by academic year if provided
    let metricsSql = `
      SELECT 
        COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) as active_count,
        COALESCE(SUM(CASE WHEN p.status = 'ACTIVE' THEN p.amount ELSE 0 END), 0) as total_active_fine,
        COUNT(CASE WHEN p.status = 'WAIVED' THEN 1 END) as waived_count,
        COUNT(CASE WHEN p.tier = 'EXPULSION_FLAG' AND p.status = 'ACTIVE' THEN 1 END) as expulsion_flags_count
      FROM penalties p
      JOIN students s ON p.student_id = s.id
    `;
    const metricParams = [];
    if (academic_year && academic_year !== 'ALL') {
      metricsSql += ' WHERE s.academic_year = ?';
      metricParams.push(academic_year);
    }

    const metrics = await get(metricsSql, metricParams);

    res.json({
      metrics: metrics || { active_count: 0, total_active_fine: 0, waived_count: 0, expulsion_flags_count: 0 },
      penalties
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Waive off penalty with mandatory reason & audit logging (Admin or Warden authorized)
router.post('/:id/waive', async (req, res) => {
  try {
    const penaltyId = req.params.id;
    const { waive_reason, admin_name, role } = req.body;

    if (!waive_reason || typeof waive_reason !== 'string' || waive_reason.trim().length < 5) {
      return res.status(400).json({ error: 'A genuine waiver justification reason (min 5 characters) is mandatory.' });
    }

    const authorityName = admin_name && admin_name.trim() ? admin_name.trim() : 'Warden Office';
    const authorityRole = role || (authorityName.toLowerCase().includes('warden') ? 'WARDEN' : 'ADMIN');

    const penalty = await get(`
      SELECT p.*, s.full_name, s.reg_number, s.room_number
      FROM penalties p
      JOIN students s ON p.student_id = s.id
      WHERE p.id = ?
    `, [penaltyId]);

    if (!penalty) {
      return res.status(404).json({ error: 'Penalty record not found' });
    }

    if (penalty.status === 'WAIVED') {
      return res.status(400).json({ error: 'This penalty has already been waived off.' });
    }

    // 1. Update penalty status
    await run(`
      UPDATE penalties
      SET status = 'WAIVED',
          waived_by = ?,
          waive_reason = ?,
          waived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [authorityName, waive_reason.trim(), penaltyId]);

    // 2. Check remaining active incidents for the student
    const activeCountRow = await get(`
      SELECT COUNT(*) as active_count
      FROM penalties
      WHERE student_id = ? AND status = 'ACTIVE'
    `, [penalty.student_id]);

    const remainingActiveIncidents = activeCountRow ? activeCountRow.active_count : 0;

    // 3. If student had EXPELLED_FLAGGED and now active incidents < 5, restore status to ACTIVE
    if (remainingActiveIncidents < 5) {
      await run(`
        UPDATE students
        SET status = 'ACTIVE'
        WHERE id = ? AND status = 'EXPELLED_FLAGGED'
      `, [penalty.student_id]);
    }

    // 4. Create audit log entry
    const auditDetails = `Waived ${penalty.tier} (₹${penalty.amount}) for ${penalty.full_name} (${penalty.reg_number}, Room ${penalty.room_number}). Reason: "${waive_reason.trim()}". Active incidents remaining: ${remainingActiveIncidents}.`;

    await logAudit({
      action: 'PENALTY_WAIVED',
      details: auditDetails,
      performed_by: authorityName,
      role: authorityRole,
      target_id: penalty.student_id
    });

    const updatedPenalty = await get(`
      SELECT p.*, s.full_name, s.reg_number, s.room_number, s.photo_url
      FROM penalties p
      JOIN students s ON p.student_id = s.id
      WHERE p.id = ?
    `, [penaltyId]);

    broadcast('PENALTY_WAIVED', {
      penalty: updatedPenalty,
      remainingActiveIncidents,
      auditDetails
    });

    res.json({
      success: true,
      message: `Penalty successfully waived off for ${penalty.full_name}.`,
      penalty: updatedPenalty,
      remainingActiveIncidents
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Full Audit trail logs with role & action filters
router.get('/audit-logs', async (req, res) => {
  try {
    const { role, action, search, limit = 150 } = req.query;

    let sql = `
      SELECT al.*, s.full_name, s.reg_number, s.room_number
      FROM audit_logs al
      LEFT JOIN students s ON al.target_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'ALL') {
      sql += ' AND al.role = ?';
      params.push(role);
    }

    if (action && action !== 'ALL') {
      sql += ' AND al.action = ?';
      params.push(action);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      sql += ' AND (al.details LIKE ? OR al.performed_by LIKE ? OR s.full_name LIKE ?)';
      params.push(term, term, term);
    }

    sql += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 150);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
