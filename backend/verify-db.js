import { query, get } from './src/db.js';
import fs from 'fs';
import path from 'path';

async function main() {
  const count = await get('SELECT COUNT(*) as total FROM students');
  const photosWithUrl = await get("SELECT COUNT(*) as withPhoto FROM students WHERE photo_url IS NOT NULL AND photo_url != ''");
  const rfidBound = await get("SELECT COUNT(*) as withRfid FROM students WHERE rfid_tag IS NOT NULL AND rfid_tag != ''");
  const students = await query('SELECT id, rfid_tag, reg_number, full_name, branch, year, room_number, photo_url FROM students LIMIT 10');
  const years = await query('SELECT year, COUNT(*) as count FROM students GROUP BY year ORDER BY year');
  
  const photosDir = path.resolve('uploads/photos');
  const photoFiles = fs.existsSync(photosDir) ? fs.readdirSync(photosDir) : [];

  console.log('=== DATABASE & PHOTO ASSET VERIFICATION ===');
  console.log('Total Student Records:', count?.total || 0);
  console.log('Students with Photo URLs:', photosWithUrl?.withPhoto || 0);
  console.log('Students with RFID Tags:', rfidBound?.withRfid || 0);
  console.log('Academic Year Distribution:');
  years.forEach(y => console.log(`  - Year ${y.year}: ${y.count} students`));
  console.log(`\nPhotos Directory: ${photosDir}`);
  console.log(`Total photo files on disk: ${photoFiles.length}`);
  if (photoFiles.length > 0) {
    console.log('Sample photo files on disk:', photoFiles.slice(0, 5).join(', '));
  }
  console.log('\nSample Student Records:');
  students.forEach(s => {
    console.log(`  [ID: ${s.id}] Reg: ${s.reg_number} | Name: ${s.full_name} | RFID: ${s.rfid_tag} | Yr: ${s.year} | Room: ${s.room_number} | Photo: ${s.photo_url}`);
  });

  // Verify whether student photo URLs point to files that exist
  let missingPhotos = 0;
  let existingPhotos = 0;
  const allStudents = await query('SELECT id, reg_number, photo_url FROM students');
  for (const st of allStudents) {
    if (st.photo_url) {
      const cleaned = st.photo_url.replace('/uploads/photos/', '');
      const fullPath = path.join(photosDir, cleaned);
      if (fs.existsSync(fullPath)) {
        existingPhotos++;
      } else {
        missingPhotos++;
      }
    }
  }
  console.log(`\nPhoto file existence check: ${existingPhotos} present on disk, ${missingPhotos} missing.`);
  process.exit(0);
}

main().catch(err => {
  console.error('Error during verification:', err);
  process.exit(1);
});
