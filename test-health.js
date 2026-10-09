async function runChecks() {
  console.log('========================================');
  console.log('COMPREHENSIVE HEALTH CHECK & VERIFICATION');
  console.log('========================================\n');

  // 1. Backend Health Check
  console.log('[1/5] Testing GET http://localhost:5000/api/health...');
  const healthRes = await fetch('http://localhost:5000/api/health');
  const healthData = await healthRes.json();
  console.log(` -> Status: ${healthRes.status} ${healthRes.statusText}`);
  console.log(` -> Response:`, healthData);
  if (healthRes.status !== 200 || healthData.status !== 'ok') {
    throw new Error('Backend health check failed');
  }

  // 2. Student Data Endpoint
  console.log('\n[2/5] Testing GET http://localhost:5000/api/students...');
  const studentsRes = await fetch('http://localhost:5000/api/students?limit=5');
  const studentsData = await studentsRes.json();
  console.log(` -> Status: ${studentsRes.status} ${studentsRes.statusText}`);
  console.log(` -> Received: ${Array.isArray(studentsData) ? studentsData.length : 'N/A'} students`);
  const sample = Array.isArray(studentsData) ? studentsData[0] : null;
  if (sample) {
    console.log(` -> Sample Student: ${sample.full_name} (${sample.reg_number}, RFID: ${sample.rfid_tag}, Room: ${sample.room_number})`);
    console.log(` -> Sample Photo URL: ${sample.photo_url}`);
  }

  // 3. Static Photo Serving
  console.log('\n[3/5] Testing Static Photo Serving...');
  if (sample && sample.photo_url) {
    const photoUrl = `http://localhost:5000${sample.photo_url}`;
    const photoRes = await fetch(photoUrl);
    console.log(` -> Requesting: ${photoUrl}`);
    console.log(` -> Status: ${photoRes.status} ${photoRes.statusText}`);
    console.log(` -> Content-Type: ${photoRes.headers.get('content-type')}`);
    console.log(` -> Content-Length: ${photoRes.headers.get('content-length')} bytes`);
    if (photoRes.status !== 200) {
      throw new Error(`Photo fetch failed with status ${photoRes.status}`);
    }
  }

  // 4. Frontend Dev Server
  console.log('\n[4/5] Testing Frontend Dev Server at http://localhost:5173...');
  const feRes = await fetch('http://localhost:5173');
  const feHtml = await feRes.text();
  console.log(` -> Status: ${feRes.status} ${feRes.statusText}`);
  console.log(` -> HTML Length: ${feHtml.length} characters`);
  console.log(` -> Contains Title/Root: ${feHtml.includes('<title>') || feHtml.includes('id="root"')}`);
  if (feRes.status !== 200) {
    throw new Error('Frontend check failed');
  }

  // 5. RFID Scan Simulation
  console.log('\n[5/5] Testing RFID Scan Simulation (POST /api/rfid/scan with tag: 3257259)...');
  const scanRes = await fetch('http://localhost:5000/api/rfid/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rfid_tag: '3257259',
      direction: 'IN',
      guard_name: 'Main Gate Verification Guard',
      device_type: 'DESKTOP'
    })
  });
  const scanData = await scanRes.json();
  console.log(` -> Status: ${scanRes.status} ${scanRes.statusText}`);
  console.log(` -> Scan Result:`, JSON.stringify(scanData, null, 2));

  if (!scanData.success || scanData.status !== 'VERIFIED_GATE_ENTRY') {
    throw new Error('RFID scan simulation failed');
  }

  // Also test frontend proxy to backend
  console.log('\n[Bonus] Testing Frontend Vite Proxy: GET http://localhost:5173/api/health...');
  const proxyHealthRes = await fetch('http://localhost:5173/api/health');
  const proxyHealthData = await proxyHealthRes.json();
  console.log(` -> Vite Proxy Status: ${proxyHealthRes.status} ${proxyHealthRes.statusText}`);
  console.log(` -> Vite Proxy Response:`, proxyHealthData);

  console.log('\n========================================');
  console.log('ALL HEALTH CHECKS PASSED SUCCESSFULLY!');
  console.log('========================================');
}

runChecks().catch(err => {
  console.error('\n Health check error:', err);
  process.exit(1);
});
