import { run, query } from './src/db.js';

async function main() {
  await run(`
    UPDATE students
    SET full_name = 'Kartik Pratap Singh',
        reg_number = '22IT1234',
        rfid_tag = '04A3B17F2E8190',
        branch = 'Information Technology',
        year = 3,
        room_number = 'A-204',
        photo_url = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
        contact_number = '+91 98765 43210',
        parent_name = 'Mr. Pratap Singh',
        parent_contact_number = '+91 87654 32109',
        email = 'kartik.singh22@sggs.ac.in',
        hostel_name = 'Shivaji Hostel',
        card_type = '13.56 MHz (NFC)',
        status = 'Active'
    WHERE id = 1
  `);

  await run(`
    UPDATE students
    SET rfid_tag = '0008456123',
        parent_name = 'Mr. Ramesh Patel',
        hostel_name = 'Saraswati Hostel',
        card_type = '125 KHz (EM4100)'
    WHERE id = 2
  `);

  console.log('Database updated successfully!');
  const students = await query('SELECT id, rfid_tag, full_name, room_number, reg_number FROM students LIMIT 5');
  console.log(students);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
