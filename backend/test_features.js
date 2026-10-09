import { normalizeRfid, compareRfid } from './src/utils/rfidUtils.js';

async function runTests() {
  console.log('=== PART 1: RFID NORMALIZATION UNIT TESTS ===');
  const unitTests = [
    { input: '0009275982', expected: '9275982', desc: 'Leading zeros stripped' },
    { input: '9275982', expected: '9275982', desc: 'No leading zeros unchanged' },
    { input: '0000123456', expected: '123456', desc: 'Multiple leading zeros' },
    { input: '0000000000', expected: '0', desc: 'All zeros normalize to 0' },
    { input: '0', expected: '0', desc: 'Single zero stays 0' },
    { input: '', expected: '', desc: 'Empty string returns empty' },
    { input: null, expected: '', desc: 'null returns empty' },
    { input: undefined, expected: '', desc: 'undefined returns empty' },
    { input: '   00123   ', expected: '123', desc: 'Whitespace trimmed' },
  ];

  let unitFailed = false;
  unitTests.forEach(({ input, expected, desc }) => {
    const res = normalizeRfid(input);
    if (res === expected) {
      console.log(`  [PASS] ${desc}: normalizeRfid("${input}") => "${res}"`);
    } else {
      console.error(`  [FAIL] ${desc}: normalizeRfid("${input}") => got "${res}", expected "${expected}"`);
      unitFailed = true;
    }
  });

  console.log('\n=== MANDATORY COMPARISON TESTS ===');
  const compareTests = [
    { a: '0009275982', b: '9275982', expected: true, desc: 'Test 1: Scanned 0009275982 vs Stored 9275982' },
    { a: '9275982', b: '0009275982', expected: true, desc: 'Test 2: Scanned 9275982 vs Stored 0009275982' },
    { a: '0009275982', b: '0009275982', expected: true, desc: 'Test 3: Scanned 0009275982 vs Stored 0009275982' },
    { a: '0000123456', b: '123456', expected: true, desc: 'Test 4: Scanned 0000123456 vs Stored 123456' },
    { a: '0009275982', b: '9275983', expected: false, desc: 'Test 5: Scanned 0009275982 vs Stored 9275983' },
    { a: '0009275982', b: '7654321', expected: false, desc: 'Test 6: Scanned 0009275982 vs Stored 7654321' },
    { a: '', b: '', expected: false, desc: 'Test 7: Empty vs Empty' },
    { a: '0000000000', b: '0', expected: true, desc: 'Test 8: Scanned 0000000000 vs Stored 0' },
  ];

  compareTests.forEach(({ a, b, expected, desc }) => {
    const res = compareRfid(a, b);
    if (res === expected) {
      console.log(`  [PASS] ${desc}: compareRfid("${a}", "${b}") => ${res}`);
    } else {
      console.error(`  [FAIL] ${desc}: compareRfid("${a}", "${b}") => got ${res}, expected ${expected}`);
      unitFailed = true;
    }
  });

  if (unitFailed) {
    console.error('Unit tests failed!');
    process.exit(1);
  }

  console.log('\n=== PART 2: ENDPOINT TESTS ===');
  const BASE = 'http://localhost:5000/api';

  // 1. Test Student Data Download
  console.log('\n1. Testing GET /api/students/download-all');
  const resStudents = await fetch(`${BASE}/students/download-all`);
  console.log('  Status:', resStudents.status);
  console.log('  Content-Type:', resStudents.headers.get('content-type'));
  console.log('  Content-Disposition:', resStudents.headers.get('content-disposition'));
  const bufStudents = Buffer.from(await resStudents.arrayBuffer());
  const hasBomStudents = bufStudents[0] === 0xEF && bufStudents[1] === 0xBB && bufStudents[2] === 0xBF;
  console.log('  Has UTF-8 BOM bytes (EF BB BF):', hasBomStudents ? '[PASS]' : '[FAIL]');
  const textStudents = bufStudents.toString('utf-8');
  const studentLines = textStudents.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log('  Total Lines (Header + Data):', studentLines.length);
  const cleanHeader = studentLines[0].replace(/^\uFEFF/, '');
  console.log('  Header line:', cleanHeader);
  const expectedStudentHeader = 'Sr. No.,RFID No.,Room No.,Registration No.,Branch,Name of the Student,Student Mobile No.,Parents Contact No.,Year,Gender';
  if (cleanHeader === expectedStudentHeader) {
    console.log('  [PASS] Student CSV Header matches exact required 10 columns in order!');
  } else {
    console.error('  [FAIL] Header mismatch!\n  Expected:', expectedStudentHeader, '\n  Received:', cleanHeader);
  }
  if (studentLines.length > 1) {
    console.log('  Sample Data Row:', studentLines[1]);
  }

  // 2. Test RFID Data Download
  console.log('\n2. Testing GET /api/rfid/download-all');
  const resRfid = await fetch(`${BASE}/rfid/download-all`);
  console.log('  Status:', resRfid.status);
  console.log('  Content-Type:', resRfid.headers.get('content-type'));
  console.log('  Content-Disposition:', resRfid.headers.get('content-disposition'));
  const bufRfid = Buffer.from(await resRfid.arrayBuffer());
  const hasBomRfid = bufRfid[0] === 0xEF && bufRfid[1] === 0xBB && bufRfid[2] === 0xBF;
  console.log('  Has UTF-8 BOM bytes (EF BB BF):', hasBomRfid ? '[PASS]' : '[FAIL]');
  const textRfid = bufRfid.toString('utf-8');
  const rfidLines = textRfid.split(/\r?\n/).filter(l => l.trim().length > 0);
  console.log('  Total Lines (Header + Data):', rfidLines.length);
  const cleanRfidHeader = rfidLines[0].replace(/^\uFEFF/, '');
  console.log('  Header line:', cleanRfidHeader);
  if (rfidLines.length > 1) {
    console.log('  Sample Data Row:', rfidLines[1]);
  }

  // 3. Test Scan with Leading Zero Variations
  console.log('\n3. Testing POST /api/rfid/scan with Leading Zero Variations');
  // Priya Patel has DB stored rfid: 0008456123.
  // We test scanning with stripped zeros: 8456123
  const scanStripRes = await fetch(`${BASE}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid_tag: '8456123' })
  });
  const scanStripData = await scanStripRes.json();
  if (scanStripRes.ok && scanStripData.student?.full_name === 'Priya Patel') {
    console.log('  [PASS] Scanning "8456123" matched student Priya Patel (stored "0008456123")!');
  } else {
    console.error('  [FAIL] Failed matching Priya Patel with "8456123":', scanStripData);
  }

  // Test scanning with extra leading zeros: 0000008456123
  const scanExtraRes = await fetch(`${BASE}/rfid/scan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfid_tag: '0000008456123' })
  });
  const scanExtraData = await scanExtraRes.json();
  if (scanExtraRes.ok && scanExtraData.student?.full_name === 'Priya Patel') {
    console.log('  [PASS] Scanning "0000008456123" matched student Priya Patel (stored "0008456123")!');
  } else {
    console.error('  [FAIL] Failed matching Priya Patel with "0000008456123":', scanExtraData);
  }

  // Verify DB value was NOT changed
  const verifyStudent = await fetch(`${BASE}/students/${scanStripData.student?.id}`);
  const verifyData = await verifyStudent.json();
  const dbTag = verifyData.student?.rfid_tag;
  if (dbTag === '0008456123') {
    console.log('  [PASS] Stored database rfid_tag remained exactly "0008456123" (unchanged)!');
  }
  // 4. Test Ambiguity / Conflict Protection
  console.log('\n4. Testing Ambiguity / Conflict Protection');
  const mockStudents = [
    { id: 101, full_name: 'Student A', rfid_tag: '9275982' },
    { id: 102, full_name: 'Student B', rfid_tag: '0009275982' },
    { id: 103, full_name: 'Student C', rfid_tag: '1234567' }
  ];
  const { findStudentByRfid } = await import('./src/utils/rfidUtils.js');
  const conflictResult = await findStudentByRfid('0009275982', async () => mockStudents);
  if (conflictResult.status === 'CONFLICT' && conflictResult.student === null && conflictResult.matches?.length === 2) {
    console.log('  [PASS] findStudentByRfid detected RFID conflict, returned status=CONFLICT, student=null, with 2 conflicting records!');
  }
  // 5. Test API Duplicate Normalized RFID Protection
  console.log('\n5. Testing API Duplicate Normalized RFID Protection');
  const dupCreateRes = await fetch(`${BASE}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rfid_tag: '8456123', // Matches Priya's 0008456123
      reg_number: '99TEST001',
      full_name: 'Test Duplicate Student',
      room_number: 'Z-999',
      email: 'test@sggs.ac.in'
    })
  });
  const dupCreateData = await dupCreateRes.json();
  if (dupCreateRes.status === 400 && dupCreateData.error?.includes('already assigned')) {
    console.log('  [PASS] Server blocked student creation with duplicate normalized RFID (HTTP 400):', dupCreateData.error);
  } else {
    console.error('  [FAIL] Server failed to block duplicate normalized RFID creation:', dupCreateRes.status, dupCreateData);
  }

  console.log('\n=== ALL AUTOMATED TESTS FINISHED ===');
}

runTests().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
