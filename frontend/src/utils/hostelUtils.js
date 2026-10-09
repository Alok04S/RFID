/**
 * Maps Room Number prefix to SGGS Hostel Name:
 * - 'SH' / 'sh' -> 'Sahyadri'
 * - 'NA' / 'na' -> 'Nandgiri'
 * - 'D'  / 'd'  -> 'Devgiri'
 * - 'K'  / 'k'  -> 'Krishna'
 * - 'G'  / 'g'  -> 'Godavari'
 */
export function getHostelNameFromRoom(roomNumber) {
  if (!roomNumber || typeof roomNumber !== 'string') return 'Hostel';
  const clean = roomNumber.trim().toUpperCase();
  if (clean.startsWith('SH')) return 'Sahyadri';
  if (clean.startsWith('NA')) return 'Nandgiri';
  if (clean.startsWith('D')) return 'Devgiri';
  if (clean.startsWith('K')) return 'Krishna';
  if (clean.startsWith('G')) return 'Godavari';
  return 'Hostel';
}

export function formatHostelDisplayName(hostelName, roomNumber) {
  const name = hostelName || getHostelNameFromRoom(roomNumber);
  if (!name || name === 'Hostel') return 'Hostel';
  return name.includes('Hostel') ? name : `${name} Hostel`;
}
