import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../database.sqlite');

// Ensure database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

// Promisified query helpers
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const exec = (sql) => {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};

// Initialize schema & sample seeds
export async function initDb() {
  await exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rfid_tag TEXT UNIQUE NOT NULL,
      reg_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      branch TEXT NOT NULL,
      year INTEGER NOT NULL,
      room_number TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      parent_name TEXT DEFAULT 'Guardian',
      parent_contact_number TEXT NOT NULL,
      email TEXT NOT NULL,
      hostel_name TEXT DEFAULT 'Shivaji Hostel',
      card_type TEXT DEFAULT '125 KHz (EM4100)',
      status TEXT DEFAULT 'Active', -- Active, Expulsion_Flagged
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS gate_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER,
      rfid_tag TEXT NOT NULL,
      scan_type TEXT NOT NULL, -- DAY_ENTRY, NIGHT_ATTENDANCE, UNREGISTERED
      verified_by_guard INTEGER DEFAULT 0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      notes TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, BUFFER, CLOSED
      buffer_triggered_at DATETIME,
      escalation_triggered_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      student_id INTEGER NOT NULL,
      status TEXT NOT NULL, -- PRESENT, ABSENT, EXCUSED
      verified_at DATETIME,
      verified_by TEXT DEFAULT 'GUARD',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(session_id, student_id),
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id),
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE TABLE IF NOT EXISTS penalties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      session_id INTEGER,
      incident_number INTEGER NOT NULL,
      tier TEXT NOT NULL, -- WARNING, FINE_100, FINE_500, FINE_1000, EXPULSION_FLAG
      amount INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'ACTIVE', -- ACTIVE, WAIVED, PAID
      reason TEXT,
      waived_by TEXT,
      waive_reason TEXT,
      waived_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id),
      FOREIGN KEY (session_id) REFERENCES attendance_sessions(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      target_id INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_name TEXT UNIQUE NOT NULL,
      is_active INTEGER DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate any missing columns if needed
  try {
    await exec(`ALTER TABLE students ADD COLUMN parent_name TEXT DEFAULT 'Guardian';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN hostel_name TEXT DEFAULT 'Shivaji Hostel';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN card_type TEXT DEFAULT '13.56 MHz (NFC)';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN academic_year TEXT DEFAULT '2024-2025';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN current_status TEXT DEFAULT 'INSIDE';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN rfid_status TEXT DEFAULT 'ACTIVE';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN last_gate_movement DATETIME;`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN gender TEXT DEFAULT 'Not Specified';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE students ADD COLUMN sr_no INTEGER;`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE gate_logs ADD COLUMN direction TEXT DEFAULT 'IN';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE gate_logs ADD COLUMN academic_year TEXT DEFAULT '2024-2025';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE gate_logs ADD COLUMN device_type TEXT DEFAULT 'DESKTOP';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE gate_logs ADD COLUMN guard_name TEXT DEFAULT 'Security Guard';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE audit_logs ADD COLUMN role TEXT DEFAULT 'SYSTEM';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE audit_logs ADD COLUMN ip_address TEXT DEFAULT '127.0.0.1';`);
  } catch (e) {}
  try {
    await exec(`ALTER TABLE audit_logs ADD COLUMN device_info TEXT DEFAULT 'Desktop';`);
  } catch (e) {}

  // Automatic Hostel Name Sync based on Room Number Prefix:
  // SH / sh -> Sahyadri
  // NA / na -> Nandgiri
  // D / d   -> Devgiri
  // K / k   -> Krishna
  // G / g   -> Godavari
  try {
    await exec(`
      UPDATE students SET hostel_name = 'Sahyadri' WHERE UPPER(TRIM(room_number)) LIKE 'SH%';
      UPDATE students SET hostel_name = 'Nandgiri' WHERE UPPER(TRIM(room_number)) LIKE 'NA%';
      UPDATE students SET hostel_name = 'Devgiri' WHERE UPPER(TRIM(room_number)) LIKE 'D%';
      UPDATE students SET hostel_name = 'Krishna' WHERE UPPER(TRIM(room_number)) LIKE 'K%';
      UPDATE students SET hostel_name = 'Godavari' WHERE UPPER(TRIM(room_number)) LIKE 'G%';
    `);
  } catch (e) {}

  // Automatic Academic Year / Class Year Code Sync:
  // FYBT -> Year 1 (First Year B.Tech)
  // SNBT / SYBT -> Year 2 (Second Year B.Tech)
  // TYBT -> Year 3 (Third Year B.Tech)
  // FNBT / LYBT -> Year 4 (Final Year B.Tech)
  try {
    // 1. If academic_year explicitly contains code:
    await exec(`
      UPDATE students SET year = 1, academic_year = 'FYBT' WHERE UPPER(TRIM(academic_year)) IN ('FYBT', 'FY', '1', 'FIRST YEAR', '1ST YEAR');
      UPDATE students SET year = 2, academic_year = 'SNBT' WHERE UPPER(TRIM(academic_year)) IN ('SNBT', 'SYBT', 'SY', '2', 'SECOND YEAR', '2ND YEAR');
      UPDATE students SET year = 3, academic_year = 'TYBT' WHERE UPPER(TRIM(academic_year)) IN ('TYBT', 'TY', '3', 'THIRD YEAR', '3RD YEAR');
      UPDATE students SET year = 4, academic_year = 'FNBT' WHERE UPPER(TRIM(academic_year)) IN ('FNBT', 'LYBT', 'FINAL', '4', 'FINAL YEAR', '4TH YEAR');
    `);

    // 2. If year field has codes:
    await exec(`
      UPDATE students SET year = 1, academic_year = 'FYBT' WHERE UPPER(TRIM(year)) IN ('FYBT', 'FY', 'FIRST YEAR', '1ST YEAR');
      UPDATE students SET year = 2, academic_year = 'SNBT' WHERE UPPER(TRIM(year)) IN ('SNBT', 'SYBT', 'SY', 'SECOND YEAR', '2ND YEAR');
      UPDATE students SET year = 3, academic_year = 'TYBT' WHERE UPPER(TRIM(year)) IN ('TYBT', 'TY', 'THIRD YEAR', '3RD YEAR');
      UPDATE students SET year = 4, academic_year = 'FNBT' WHERE UPPER(TRIM(year)) IN ('FNBT', 'LYBT', 'FINAL', 'FINAL YEAR', '4TH YEAR');
    `);

    // 3. Infer from Registration Number admission year:
    await exec(`
      UPDATE students SET year = 1, academic_year = 'FYBT' WHERE reg_number LIKE '2025%';
      UPDATE students SET year = 2, academic_year = 'SNBT' WHERE reg_number LIKE '2024%';
      UPDATE students SET year = 3, academic_year = 'TYBT' WHERE reg_number LIKE '2023%';
      UPDATE students SET year = 4, academic_year = 'FNBT' WHERE reg_number LIKE '2022%' OR reg_number LIKE '2021%' OR reg_number LIKE '2020%' OR reg_number LIKE '2019%';
    `);
  } catch (e) {
    console.warn('Academic year sync notice:', e.message);
  }

  // Seed default academic years if empty
  const yearCount = await get('SELECT COUNT(*) as count FROM academic_years');
  if (yearCount.count === 0) {
    await run(`INSERT INTO academic_years (year_name, is_active, start_date, end_date) VALUES ('2024-2025', 1, '2024-07-01', '2025-06-30')`);
    await run(`INSERT INTO academic_years (year_name, is_active, start_date, end_date) VALUES ('2025-2026', 0, '2025-07-01', '2026-06-30')`);
  }

  // Seed dynamic settings if not present
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('brevo_sender_email', 'hostel-security@sggs.ac.in')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('brevo_sender_name', 'Hostel Warden & Security Office')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('hostel_name', 'Shivaji Hostel')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('curfew_start_time', '20:30')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('curfew_end_time', '21:30')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('buffer_end_time', '21:45')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('fine_warning_threshold', '1')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('fine_tier_2_amount', '100')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('fine_tier_3_amount', '500')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('fine_tier_4_amount', '1000')`);
  await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('active_academic_year', '2024-2025')`);

  // Check if students exist, if not or if we need to ensure Kartik Pratap Singh is seeded
  const countRow = await get('SELECT COUNT(*) as count FROM students');
  if (countRow.count === 0) {
    console.log('Seeding initial student data...');

    const sampleStudents = [
      {
        rfid_tag: '04A3B17F2E8190',
        reg_number: '22IT1234',
        full_name: 'Kartik Pratap Singh',
        branch: 'Information Technology',
        year: 3,
        room_number: 'A-204',
        photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43210',
        parent_name: 'Mr. Pratap Singh',
        parent_contact_number: '+91 87654 32109',
        email: 'kartik.singh22@sggs.ac.in',
        hostel_name: 'Shivaji Hostel',
        card_type: '13.56 MHz (NFC)'
      },
      {
        rfid_tag: '0008456123',
        reg_number: '23CS5678',
        full_name: 'Priya Patel',
        branch: 'Computer Science & Engg',
        year: 2,
        room_number: 'G-108',
        photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43211',
        parent_name: 'Mr. Ramesh Patel',
        parent_contact_number: '+91 98765 22222',
        email: 'priya.patel@sggs.ac.in',
        hostel_name: 'Saraswati Hostel',
        card_type: '125 KHz (EM4100)'
      },
      {
        rfid_tag: 'RFID-1003',
        reg_number: '21EC9012',
        full_name: 'Rohan Verma',
        branch: 'Electronics & Comm Engg',
        year: 4,
        room_number: 'B-412',
        photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43212',
        parent_name: 'Mr. Alok Verma',
        parent_contact_number: '+91 98765 33333',
        email: 'rohan.verma@sggs.ac.in',
        hostel_name: 'Shivaji Hostel',
        card_type: '13.56 MHz (NFC)'
      },
      {
        rfid_tag: 'RFID-1004',
        reg_number: '24ME3456',
        full_name: 'Ananya Iyer',
        branch: 'Mechanical Engineering',
        year: 1,
        room_number: 'G-215',
        photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43213',
        parent_name: 'Mrs. Geeta Iyer',
        parent_contact_number: '+91 98765 44444',
        email: 'ananya.iyer@sggs.ac.in',
        hostel_name: 'Saraswati Hostel',
        card_type: '13.56 MHz (NFC)'
      },
      {
        rfid_tag: 'RFID-1005',
        reg_number: '22EE7890',
        full_name: 'Vikram Singh',
        branch: 'Electrical Engineering',
        year: 3,
        room_number: 'B-201',
        photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43214',
        parent_name: 'Mr. Devendra Singh',
        parent_contact_number: '+91 98765 55555',
        email: 'vikram.singh@sggs.ac.in',
        hostel_name: 'Shivaji Hostel',
        card_type: '125 KHz (EM4100)'
      },
      {
        rfid_tag: 'RFID-1006',
        reg_number: '23CE1122',
        full_name: 'Sneha Reddy',
        branch: 'Civil Engineering',
        year: 2,
        room_number: 'G-309',
        photo_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
        contact_number: '+91 98765 43215',
        parent_name: 'Mr. K. Reddy',
        parent_contact_number: '+91 98765 66666',
        email: 'sneha.reddy@sggs.ac.in',
        hostel_name: 'Saraswati Hostel',
        card_type: '13.56 MHz (NFC)'
      }
    ];

    for (const student of sampleStudents) {
      await run(
        `INSERT INTO students (rfid_tag, reg_number, full_name, branch, year, room_number, photo_url, contact_number, parent_name, parent_contact_number, email, hostel_name, card_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          student.rfid_tag,
          student.reg_number,
          student.full_name,
          student.branch,
          student.year,
          student.room_number,
          student.photo_url,
          student.contact_number,
          student.parent_name,
          student.parent_contact_number,
          student.email,
          student.hostel_name,
          student.card_type
        ]
      );
    }

    // Seed sample gate entry logs for Kartik Pratap Singh for realistic display
    await run(`
      INSERT INTO gate_logs (student_id, rfid_tag, scan_type, verified_by_guard, notes, timestamp)
      VALUES (1, '04A3B17F2E8190', 'DAY_ENTRY', 1, 'Standard gate entry log', datetime('now', '-1 hour'))
    `);

    // Seed default settings
    await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('brevo_sender_email', 'hostel-security@sggs.ac.in')`);
    await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('brevo_sender_name', 'Hostel Warden & Security Office')`);
    await run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('hostel_name', 'Shivaji Hostel')`);

    console.log('Database initialized and seeded successfully.');
  }
}

export async function logAudit({ action, details, performed_by = 'SYSTEM', role = 'SYSTEM', ip_address = '127.0.0.1', device_info = 'Desktop', target_id = null }) {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(new Date());
    const m = {};
    parts.forEach(p => { m[p.type] = p.value; });
    const istTime = `${m.year}-${m.month}-${m.day} ${m.hour}:${m.minute}:${m.second}`;

    const res = await run(
      `INSERT INTO audit_logs (action, details, performed_by, role, ip_address, device_info, target_id, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [action, details, performed_by, role, ip_address, device_info, target_id, istTime]
    );
    return res;
  } catch (err) {
    console.error('Audit log failed:', err.message);
  }
}

export default db;

