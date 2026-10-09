import express from 'express';
import { get, query, run, logAudit } from '../db.js';
import { timeService } from '../services/timeService.js';
import { escalationService } from '../services/escalationService.js';
import { brevoEmailService } from '../services/brevoEmailService.js';
import { broadcast } from '../services/websocketService.js';

const router = express.Router();

// Get current system time & mode
router.get('/time', (req, res) => {
  const currentMode = timeService.getCurrentMode();
  res.json({
    effectiveTime: timeService.getIstIsoString(),
    currentMode
  });
});

// Set simulated time (e.g., '20:35' for Attendance Mode, '21:35' for Buffer Mode, '21:50' for Post-Buffer, or 'REALTIME')
router.post('/time', (req, res) => {
  const { time } = req.body;
  const result = timeService.setSimulatedTime(time);
  const currentMode = timeService.getCurrentMode();

  broadcast('TIME_CHANGED', {
    effectiveTime: result.currentTime,
    currentMode
  });

  res.json({
    ...result,
    currentMode
  });
});

// Manually trigger 9:30 PM Buffer Window Automation
router.post('/trigger-buffer', async (req, res) => {
  try {
    const result = await escalationService.runBufferWindowAutomation();
    res.json({
      success: true,
      message: `Buffer window automation executed. Dispatched alerts to ${result.defaulter_count} unverified students.`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manually trigger 9:45 PM Progressive Disciplinary Escalation
router.post('/trigger-escalation', async (req, res) => {
  try {
    const result = await escalationService.runDisciplinaryEscalation();
    res.json({
      success: true,
      message: `Progressive disciplinary escalation evaluated for ${result.penalties_applied.length} unverified students.`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get recent Brevo email dispatches / log
router.get('/emails', (req, res) => {
  res.json(brevoEmailService.getEmailLogs());
});

// Get system configuration settings
router.get('/settings', async (req, res) => {
  try {
    const settings = await query('SELECT key, value FROM settings');
    const settingsMap = {};
    settings.forEach(s => {
      if (s.key === 'brevo_api_key' && s.value) {
        settingsMap[s.key] = s.value.substring(0, 8) + '...' + s.value.substring(s.value.length - 4);
      } else {
        settingsMap[s.key] = s.value;
      }
    });

    // Sync timing config into timeService
    const timingConfig = {};
    if (settingsMap.curfew_start_time) timingConfig.curfewStart = settingsMap.curfew_start_time;
    if (settingsMap.curfew_end_time) timingConfig.curfewEnd = settingsMap.curfew_end_time;
    if (settingsMap.buffer_end_time) timingConfig.bufferEnd = settingsMap.buffer_end_time;
    timeService.setTimingConfig(timingConfig);

    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save dynamic system settings (Admin only)
router.post('/settings', async (req, res) => {
  try {
    const {
      brevo_api_key, brevo_sender_email, brevo_sender_name,
      hostel_name, curfew_start_time, curfew_end_time, buffer_end_time,
      fine_warning_threshold, fine_tier_2_amount, fine_tier_3_amount, fine_tier_4_amount,
      active_academic_year, performer_name, performer_role
    } = req.body;

    const updates = [];

    const saveKey = async (key, val) => {
      if (val !== undefined && val !== null) {
        const strVal = String(val).trim();
        await run("INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?", [key, strVal, strVal]);
        updates.push(`${key}=${strVal}`);
      }
    };

    await saveKey('brevo_api_key', brevo_api_key);
    await saveKey('brevo_sender_email', brevo_sender_email);
    await saveKey('brevo_sender_name', brevo_sender_name);
    await saveKey('hostel_name', hostel_name);
    await saveKey('curfew_start_time', curfew_start_time);
    await saveKey('curfew_end_time', curfew_end_time);
    await saveKey('buffer_end_time', buffer_end_time);
    await saveKey('fine_warning_threshold', fine_warning_threshold);
    await saveKey('fine_tier_2_amount', fine_tier_2_amount);
    await saveKey('fine_tier_3_amount', fine_tier_3_amount);
    await saveKey('fine_tier_4_amount', fine_tier_4_amount);
    await saveKey('active_academic_year', active_academic_year);

    // Update timeService dynamic windows
    const timingConfig = {};
    if (curfew_start_time) timingConfig.curfewStart = curfew_start_time;
    if (curfew_end_time) timingConfig.curfewEnd = curfew_end_time;
    if (buffer_end_time) timingConfig.bufferEnd = buffer_end_time;
    timeService.setTimingConfig(timingConfig);

    await logAudit({
      action: 'SYSTEM_SETTINGS_UPDATED',
      details: `Updated system configurations: ${updates.join(', ')}`,
      performed_by: performer_name || 'Admin',
      role: performer_role || 'ADMIN'
    });

    broadcast('SETTINGS_UPDATED', {
      curfewStart: curfew_start_time,
      curfewEnd: curfew_end_time,
      bufferEnd: buffer_end_time,
      hostelName: hostel_name
    });

    res.json({
      success: true,
      message: 'System configurations saved successfully and applied live.',
      updates
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comprehensive Audit Logs for Admin & Warden
router.get('/audit-logs', async (req, res) => {
  try {
    const { role, action, search, limit = 200 } = req.query;

    let sql = `
      SELECT al.*, s.full_name as student_name, s.reg_number, s.room_number
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
      sql += ' AND (al.details LIKE ? OR al.performed_by LIKE ? OR al.action LIKE ? OR s.full_name LIKE ?)';
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY al.timestamp DESC LIMIT ?';
    params.push(parseInt(limit, 10) || 200);

    const logs = await query(sql, params);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
