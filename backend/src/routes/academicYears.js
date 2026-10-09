import express from 'express';
import { get, query, run, logAudit } from '../db.js';
import { broadcast } from '../services/websocketService.js';

const router = express.Router();

// List all academic years with resident statistics
router.get('/', async (req, res) => {
  try {
    const years = await query(`
      SELECT ay.*,
        (SELECT COUNT(*) FROM students WHERE academic_year = ay.year_name) as resident_count
      FROM academic_years ay
      ORDER BY ay.year_name DESC
    `);

    const activeSetting = await get("SELECT value FROM settings WHERE key = 'active_academic_year'");
    const activeYearName = activeSetting ? activeSetting.value : (years.find(y => y.is_active)?.year_name || '2024-2025');

    res.json({
      activeYear: activeYearName,
      academicYears: years
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new academic year
router.post('/', async (req, res) => {
  try {
    const { year_name, start_date, end_date, is_active, admin_name } = req.body;

    if (!year_name || typeof year_name !== 'string' || !year_name.trim()) {
      return res.status(400).json({ error: 'Academic year name is required (e.g. 2025-2026)' });
    }

    const cleanName = year_name.trim();

    // Check duplicate
    const existing = await get('SELECT id FROM academic_years WHERE year_name = ?', [cleanName]);
    if (existing) {
      return res.status(400).json({ error: `Academic year '${cleanName}' already exists.` });
    }

    if (is_active) {
      await run('UPDATE academic_years SET is_active = 0');
      await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_academic_year', ?)", [cleanName]);
    }

    const result = await run(`
      INSERT INTO academic_years (year_name, is_active, start_date, end_date)
      VALUES (?, ?, ?, ?)
    `, [cleanName, is_active ? 1 : 0, start_date || null, end_date || null]);

    await logAudit({
      action: 'ACADEMIC_YEAR_CREATED',
      details: `Created new academic year '${cleanName}' (Active: ${!!is_active})`,
      performed_by: admin_name || 'Admin',
      role: 'ADMIN',
      target_id: result.lastID
    });

    broadcast('ACADEMIC_YEAR_CHANGED', {
      year_name: cleanName,
      is_active: !!is_active
    });

    res.json({
      success: true,
      message: `Academic year '${cleanName}' created successfully.`,
      id: result.lastID,
      year_name: cleanName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Activate an academic year
router.post('/:id/activate', async (req, res) => {
  try {
    const yearId = req.params.id;
    const { admin_name } = req.body;

    const targetYear = await get('SELECT * FROM academic_years WHERE id = ?', [yearId]);
    if (!targetYear) {
      return res.status(404).json({ error: 'Academic year not found' });
    }

    // Set all to inactive, then target to active
    await run('UPDATE academic_years SET is_active = 0');
    await run('UPDATE academic_years SET is_active = 1 WHERE id = ?', [yearId]);
    await run("INSERT OR REPLACE INTO settings (key, value) VALUES ('active_academic_year', ?)", [targetYear.year_name]);

    await logAudit({
      action: 'ACADEMIC_YEAR_ACTIVATED',
      details: `Switched active academic year to '${targetYear.year_name}'`,
      performed_by: admin_name || 'Admin',
      role: 'ADMIN',
      target_id: targetYear.id
    });

    broadcast('ACADEMIC_YEAR_CHANGED', {
      activeYear: targetYear.year_name,
      id: targetYear.id
    });

    res.json({
      success: true,
      message: `Active academic year updated to '${targetYear.year_name}'. All student views and records now default to this batch.`,
      activeYear: targetYear.year_name
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
