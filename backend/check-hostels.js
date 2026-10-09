import { query } from './src/db.js';

async function main() {
  const rooms = await query('SELECT DISTINCT room_number, hostel_name FROM students LIMIT 20');
  console.log('Sample rooms and hostel_name:', rooms);

  const prefixStats = await query(`
    SELECT 
      CASE 
        WHEN UPPER(TRIM(room_number)) LIKE 'SH%' THEN 'SH -> Sahyadri'
        WHEN UPPER(TRIM(room_number)) LIKE 'NA%' THEN 'NA -> Nandgiri'
        WHEN UPPER(TRIM(room_number)) LIKE 'D%' THEN 'D -> Devgiri'
        WHEN UPPER(TRIM(room_number)) LIKE 'K%' THEN 'K -> Krishna'
        WHEN UPPER(TRIM(room_number)) LIKE 'G%' THEN 'G -> Godavari'
        ELSE 'OTHER (' || room_number || ')'
      END as prefix_group,
      COUNT(*) as count,
      GROUP_CONCAT(DISTINCT hostel_name) as current_hostel_names
    FROM students
    GROUP BY prefix_group
    ORDER BY count DESC
  `);

  console.log('\nPrefix Stats:');
  console.log(JSON.stringify(prefixStats, null, 2));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
