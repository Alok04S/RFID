import { query, run, exec } from './src/db.js';

async function updateAllHostels() {
  console.log('--- Applying Hostel Name Mapping ---');
  await run("UPDATE students SET hostel_name = 'Sahyadri' WHERE UPPER(TRIM(room_number)) LIKE 'SH%'");
  await run("UPDATE students SET hostel_name = 'Nandgiri' WHERE UPPER(TRIM(room_number)) LIKE 'NA%'");
  await run("UPDATE students SET hostel_name = 'Devgiri' WHERE UPPER(TRIM(room_number)) LIKE 'D%'");
  await run("UPDATE students SET hostel_name = 'Krishna' WHERE UPPER(TRIM(room_number)) LIKE 'K%'");
  await run("UPDATE students SET hostel_name = 'Godavari' WHERE UPPER(TRIM(room_number)) LIKE 'G%'");

  const summary = await query(`
    SELECT hostel_name, COUNT(*) as student_count, GROUP_CONCAT(DISTINCT SUBSTR(room_number, 1, 2)) as sample_prefixes
    FROM students
    GROUP BY hostel_name
    ORDER BY student_count DESC
  `);

  console.log('\nUpdated Database Summary:');
  console.log(JSON.stringify(summary, null, 2));

  const sampleRows = await query(`
    SELECT id, full_name, reg_number, room_number, hostel_name
    FROM students
    ORDER BY id ASC
    LIMIT 10
  `);

  console.log('\nSample Student Records:');
  sampleRows.forEach(s => {
    console.log(`  [ID ${s.id}] ${s.full_name} | Reg: ${s.reg_number} | Room: ${s.room_number} -> Hostel: ${s.hostel_name}`);
  });

  process.exit(0);
}

updateAllHostels().catch(err => {
  console.error(err);
  process.exit(1);
});
