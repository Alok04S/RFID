import express from 'express';
import { logAudit } from '../db.js';
import { broadcast } from '../services/websocketService.js';

const router = express.Router();

// Role authentication supporting GUARD, WARDEN, and ADMIN
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const deviceInfo = isMobile ? 'Mobile Phone' : 'Desktop Workstation';

    let user = null;

    if (role === 'GUARD' || username === 'guard') {
      if (password === 'guard123' || !password) {
        user = {
          id: 'guard_1',
          name: 'Security Officer - Gate 1',
          role: 'GUARD',
          boothName: 'Main Hostel Gate (Booth 1)',
          permissions: ['gate_scan', 'night_verify', 'view_residents']
        };
      } else {
        return res.status(401).json({ error: 'Incorrect Guard password (default: guard123)' });
      }
    } else if (role === 'WARDEN' || username === 'warden') {
      if (password === 'warden123' || !password) {
        user = {
          id: 'warden_1',
          name: 'Dr. S. K. Sharma (Hostel Warden)',
          role: 'WARDEN',
          office: 'Chief Warden Office & Disciplinary Wing',
          permissions: ['penalties_waive', 'view_residents', 'edit_residents', 'view_gate_logs', 'view_attendance', 'view_audit_logs']
        };
      } else {
        return res.status(401).json({ error: 'Incorrect Warden password (default: warden123)' });
      }
    } else if (role === 'ADMIN' || username === 'admin') {
      if (password === 'admin123' || !password) {
        user = {
          id: 'admin_1',
          name: 'Hostel Super Administrator',
          role: 'ADMIN',
          office: 'Campus Security & Systems Central Admin',
          permissions: ['all', 'manage_academic_years', 'master_import', 'system_config', 'manage_users', 'delete_students', 'audit_full']
        };
      } else {
        return res.status(401).json({ error: 'Incorrect Admin password (default: admin123)' });
      }
    } else {
      return res.status(400).json({ error: 'Please specify role as GUARD, WARDEN, or ADMIN' });
    }

    // Auto-record login into audit log
    await logAudit({
      action: 'USER_LOGIN',
      details: `${user.name} logged into ${user.role} portal via ${deviceInfo}`,
      performed_by: user.name,
      role: user.role,
      ip_address: clientIp,
      device_info: deviceInfo
    });

    broadcast('USER_LOGGED_IN', {
      user: { id: user.id, name: user.name, role: user.role },
      deviceInfo,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      user,
      token: `${user.role.toLowerCase()}_session_token_${Date.now()}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Session verification
router.get('/me', (req, res) => {
  res.json({ status: 'active', message: 'Session valid' });
});

export default router;
