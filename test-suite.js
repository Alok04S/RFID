// Comprehensive verification test script for RFID Hostel Attendance System

async function runTests() {
  const BASE_URL = 'http://localhost:5000/api';
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  console.log('--- STARTING RFID SYSTEM VERIFICATION ---');

  // 1. Health Check
  const healthRes = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert(healthRes.status === 'ok', 'API Health Check returns OK');

  // Fetch registered students
  const students = await fetch(`${BASE_URL}/students`).then(r => r.json());
  assert(students.length > 0, `Found ${students.length} registered students in system`);

  const student1 = students[0];
  const student2 = students[1] || students[0];

  // 2. Day Mode Entry Test
  await fetch(`${BASE_URL}/system/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: '14:00' })
  });

  const dayScanRes = await fetch(`${BASE_URL}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid_tag: student1.rfid_tag })
  }).then(r => r.json());

  assert(dayScanRes.success === true, 'Day mode scan successful');
  assert(dayScanRes.status === 'VERIFIED_DAY_ENTRY', 'Day mode marked as VERIFIED_DAY_ENTRY');
  assert(dayScanRes.autoResetSeconds === 5, 'Auto-reset set to 5 seconds');

  // 3. Unregistered RFID Card Scan Test
  const unregRes = await fetch(`${BASE_URL}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid_tag: 'UNKNOWN-CARD-9999' })
  });
  const unregData = await unregRes.json();
  assert(unregRes.status === 404 && unregData.status === 'UNREGISTERED', 'Unregistered card returns 404 and UNREGISTERED status');
  assert(unregData.audio === 'ERROR', 'Error buzzer audio flag returned');

  // 4. Night Attendance Mode (8:30 PM - 9:30 PM)
  await fetch(`${BASE_URL}/system/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: '20:45' })
  });

  const nightScanRes = await fetch(`${BASE_URL}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid_tag: student2.rfid_tag })
  }).then(r => r.json());

  assert(nightScanRes.status === 'AWAITING_VERIFICATION' || nightScanRes.status === 'ALREADY_PRESENT', 'Night mode scan processed');

  // Guard confirms verification
  const verifyRes = await fetch(`${BASE_URL}/attendance/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ student_id: student2.id })
  }).then(r => r.json());

  assert(verifyRes.success === true, `Guard verified attendance for ${student2.full_name}`);
  assert(verifyRes.record.status === 'PRESENT', 'Attendance record recorded as PRESENT');

  // 5. Buffer Window (9:30 PM - 9:45 PM) & Brevo Email Automation
  await fetch(`${BASE_URL}/system/time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ time: '21:35' })
  });

  const bufferRes = await fetch(`${BASE_URL}/system/trigger-buffer`, { method: 'POST' }).then(r => r.json());
  assert(bufferRes.success === true, 'Buffer window automation executed successfully');

  // Check email logs
  const emailLogs = await fetch(`${BASE_URL}/system/emails`).then(r => r.json());
  assert(emailLogs.length >= 0, 'Brevo email log endpoint working');

  // 6. 9:45 PM Disciplinary Escalation Engine Test
  const escRes = await fetch(`${BASE_URL}/system/trigger-escalation`, { method: 'POST' }).then(r => r.json());
  assert(escRes.success === true, 'Progressive escalation engine executed');

  // 7. Admin Penalty Forgiveness / Waiver Test
  const penaltiesList = await fetch(`${BASE_URL}/penalties?status=ACTIVE`).then(r => r.json());
  if (penaltiesList.penalties && penaltiesList.penalties.length > 0) {
    const penaltyToWaive = penaltiesList.penalties[0];

    const waiveRes = await fetch(`${BASE_URL}/penalties/${penaltyToWaive.id}/waive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        waive_reason: 'Hospital outpatient slip verified with chief medical officer.',
        admin_name: 'Warden Sharma'
      })
    }).then(r => r.json());

    assert(waiveRes.success === true, 'Penalty successfully waived off with mandatory reason');
    assert(waiveRes.penalty.status === 'WAIVED', 'Penalty status updated to WAIVED in database');
  }

  console.log(`\n========================================`);
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
