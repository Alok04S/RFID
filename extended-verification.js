// Extended Verification Test Suite for RFID Hostel System Upgrades
// Verifies 3 Roles, Sequence-Independent CSV Import, Academic Years, Gate In/Out, and Audit Logs

async function runExtendedVerification() {
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

  console.log('\n======================================================');
  console.log('   STARTING EXTENDED SYSTEM FEATURE VERIFICATION');
  console.log('======================================================\n');

  // 1. Health check
  const health = await fetch(`${BASE_URL}/health`).then(r => r.json());
  assert(health.status === 'ok', 'API Health Check returns OK');

  // 2. Authentication for all 3 Roles
  // 2A. Guard Login
  const guardLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'GUARD', username: 'guard', password: 'guard123' })
  }).then(r => r.json());
  assert(guardLogin.success === true && guardLogin.user.role === 'GUARD', 'Guard authentication successful');

  // 2B. Warden Login
  const wardenLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'WARDEN', username: 'warden', password: 'warden123' })
  }).then(r => r.json());
  assert(wardenLogin.success === true && wardenLogin.user.role === 'WARDEN', 'Warden authentication successful');

  // 2C. Admin Login
  const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'ADMIN', username: 'admin', password: 'admin123' })
  }).then(r => r.json());
  assert(adminLogin.success === true && adminLogin.user.role === 'ADMIN', 'Admin authentication successful');

  // 3. Central Audit Logs Verification
  const auditLogs = await fetch(`${BASE_URL}/system/audit-logs`).then(r => r.json());
  assert(Array.isArray(auditLogs) && auditLogs.length > 0, `Audit logs endpoint returned ${auditLogs.length} activity records`);
  const hasLoginLog = auditLogs.some(l => l.action === 'USER_LOGIN');
  assert(hasLoginLog, 'User logins are automatically recorded in central audit trail');

  // 4. Academic Years Lifecycle
  const ayList = await fetch(`${BASE_URL}/academic-years`).then(r => r.json());
  assert(Array.isArray(ayList.academicYears) && ayList.academicYears.length > 0, `Found ${ayList.academicYears.length} academic batches (Active: ${ayList.activeYear})`);

  const testBatchName = `BATCH-TEST-${Date.now().toString().slice(-4)}`;
  const createBatch = await fetch(`${BASE_URL}/academic-years`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ year_name: testBatchName, is_active: false, admin_name: 'Test Runner' })
  }).then(r => r.json());
  assert(createBatch.success === true, `Created new academic year '${testBatchName}'`);

  // Activate batch
  const activateBatch = await fetch(`${BASE_URL}/academic-years/${createBatch.id}/activate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ admin_name: 'Test Runner' })
  }).then(r => r.json());
  assert(activateBatch.success === true && activateBatch.activeYear === testBatchName, `Successfully switched active academic year to '${testBatchName}'`);

  // Restore 2024-2025 as active batch
  const defaultBatch = ayList.academicYears.find(y => y.year_name === '2024-2025') || ayList.academicYears[0];
  if (defaultBatch) {
    await fetch(`${BASE_URL}/academic-years/${defaultBatch.id}/activate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_name: 'Test Runner' })
    });
  }

  // 5. Sequence-Independent CSV Master Import
  // Notice: columns are in completely randomized/scrambled order!
  const scrambledStudents = [
    {
      room_no: 'C-301',
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
      student_name: 'Vikrant Roy',
      card_id: `RFID-TEST-${Date.now()}-1`,
      roll_no: `24CS${Date.now().toString().slice(-4)}`,
      discipline: 'Aeronautical Engg',
      class_year: '1',
      mobile: '+91 91111 22222',
      guardian_mobile: '+91 91111 33333'
    },
    {
      room: 'C-302',
      candidate_name: 'Divya Sen',
      tag: `RFID-TEST-${Date.now()}-2`,
      enrollment: `24EC${Date.now().toString().slice(-4)}`,
      dept: 'Electronics',
      study_year: '2'
    }
  ];

  const bulkImportRes = await fetch(`${BASE_URL}/students/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      students: scrambledStudents,
      academic_year: '2024-2025',
      admin_name: 'Test Runner'
    })
  }).then(r => r.json());

  assert(bulkImportRes.success === true && bulkImportRes.importedCount >= 2, `Sequence-independent CSV master import: created ${bulkImportRes.importedCount} records`);

  // Verify imported student exists in database with mapped fields
  const verifyStudent = await fetch(`${BASE_URL}/students?search=Vikrant%20Roy`).then(r => r.json());
  assert(verifyStudent.length > 0 && verifyStudent[0].room_number === 'C-301', 'Imported student record has correctly mapped room number and name');

  // 6. Gate In / Out Movement System
  const studentToScan = verifyStudent[0];

  // 6A. Gate OUT Scan
  const outScan = await fetch(`${BASE_URL}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rfid_tag: studentToScan.rfid_tag,
      direction: 'OUT',
      device_type: 'MOBILE',
      guard_name: 'Mobile Guard Unit',
      notes: 'Market Pass'
    })
  }).then(r => r.json());

  assert(outScan.success === true && outScan.direction === 'OUT', 'Gate OUT exit scan registered with direction = OUT');
  assert(outScan.student.current_status === 'OUTSIDE', 'Student presence status updated to OUTSIDE');

  // 6B. Gate IN Scan
  const inScan = await fetch(`${BASE_URL}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rfid_tag: studentToScan.rfid_tag,
      direction: 'IN',
      device_type: 'DESKTOP',
      guard_name: 'Main Gate Guard (PC)',
      notes: 'Returned from market'
    })
  }).then(r => r.json());

  assert(inScan.success === true && inScan.direction === 'IN', 'Gate IN return scan registered with direction = IN');
  assert(inScan.student.current_status === 'INSIDE', 'Student presence status updated to INSIDE');

  // 6C. Gate Presence Headcount Stats
  const presence = await fetch(`${BASE_URL}/rfid/presence`).then(r => r.json());
  assert(typeof presence.insideCount === 'number' && typeof presence.outsideCount === 'number', `Gate presence stats verified: ${presence.insideCount} Inside, ${presence.outsideCount} Outside`);

  // 6D. Gate Movement History
  const history = await fetch(`${BASE_URL}/rfid/history?limit=10`).then(r => r.json());
  assert(Array.isArray(history) && history.length > 0, `Gate history returned ${history.length} movement records`);
  assert(history[0].device_type !== undefined && history[0].direction !== undefined, 'Gate history includes device_type and direction tracking');

  // 7. Dynamic System Configuration
  const configUpdate = await fetch(`${BASE_URL}/system/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      curfew_start_time: '20:30',
      curfew_end_time: '21:30',
      buffer_end_time: '21:45',
      hostel_name: 'Shivaji Central Residence Hall',
      performer_name: 'Super Admin',
      performer_role: 'ADMIN'
    })
  }).then(r => r.json());

  assert(configUpdate.success === true, 'Dynamic system configurations saved live without code changes');

  const loadedSettings = await fetch(`${BASE_URL}/system/settings`).then(r => r.json());
  assert(loadedSettings.hostel_name === 'Shivaji Central Residence Hall', 'Updated hostel name verified in database settings');

  console.log('\n======================================================');
  console.log(`   EXTENDED TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runExtendedVerification().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
