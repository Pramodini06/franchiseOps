export const SHIFTS = [
  { id: 'morning', name: 'Morning', start: '06:00', end: '14:00' },
  { id: 'afternoon', name: 'Afternoon', start: '12:00', end: '20:00' },
  { id: 'evening', name: 'Evening', start: '16:00', end: '00:00' }
];

const STAFF_DETAILS = {
  'vikram@franchiseops.ai': { employeeId: 'FO-1001', designation: 'Branch Manager', shift: 'morning' },
  'neha@franchiseops.ai': { employeeId: 'FO-1002', designation: 'Branch Manager', shift: 'morning' },
  'manager@franchiseops.ai': { employeeId: 'FO-1003', designation: 'Branch Manager', shift: 'afternoon' },
  'lakshmi@franchiseops.ai': { employeeId: 'FO-1004', designation: 'Branch Manager', shift: 'morning' },
  'manju@franchiseops.ai': { employeeId: 'FO-1005', designation: 'Branch Manager', shift: 'afternoon' },
  'staff@franchiseops.ai': { employeeId: 'FO-2001', designation: 'Service Associate', shift: 'evening' },
  'imran@franchiseops.ai': { employeeId: 'FO-2002', designation: 'Kitchen Associate', shift: 'morning' }
};

export function buildStaffRoster(users, branches) {
  return users.filter((u) => ['Branch Manager', 'Staff'].includes(u.role)).map((u, index) => {
    const details = STAFF_DETAILS[u.email] || {};
    const branch = branches.find((b) => b.id === u.branchId);
    return {
      ...u,
      employeeId: details.employeeId || `FO-${String(index + 1).padStart(4, '0')}`,
      designation: details.designation || u.role,
      shift: details.shift || SHIFTS[index % SHIFTS.length].id,
      branchName: branch?.name || 'Unassigned'
    };
  });
}

export const PREVIEW_INVENTORY = [
  { id: 'inv-1', name: 'Paneer', category: 'Dairy', quantity: 3.5, unit: 'kg', minimum: 5, branchId: 'b5' },
  { id: 'inv-2', name: 'Fresh tomatoes', category: 'Produce', quantity: 12, unit: 'kg', minimum: 8, branchId: 'b5' },
  { id: 'inv-3', name: 'Basmati rice', category: 'Grains', quantity: 0, unit: 'kg', minimum: 10, branchId: 'b5' },
  { id: 'inv-4', name: 'Chicken breast', category: 'Protein', quantity: 7, unit: 'kg', minimum: 8, branchId: 'b1' },
  { id: 'inv-5', name: 'Cooking oil', category: 'Pantry', quantity: 18, unit: 'L', minimum: 6, branchId: 'b1' },
  { id: 'inv-6', name: 'Mozzarella', category: 'Dairy', quantity: 2, unit: 'kg', minimum: 5, branchId: 'b2' },
  { id: 'inv-7', name: 'Onions', category: 'Produce', quantity: 15, unit: 'kg', minimum: 10, branchId: 'b2' },
  { id: 'inv-8', name: 'All-purpose flour', category: 'Grains', quantity: 22, unit: 'kg', minimum: 12, branchId: 'b3' },
  { id: 'inv-9', name: 'Ground coffee', category: 'Beverages', quantity: 1.2, unit: 'kg', minimum: 2, branchId: 'b3' },
  { id: 'inv-10', name: 'Butter', category: 'Dairy', quantity: 4, unit: 'kg', minimum: 4, branchId: 'b4' },
  { id: 'inv-11', name: 'Chicken breast', category: 'Protein', quantity: 11, unit: 'kg', minimum: 8, branchId: 'b5' },
  { id: 'inv-12', name: 'Paper takeaway boxes', category: 'Packaging', quantity: 90, unit: 'pcs', minimum: 30, branchId: 'b5' }
];

const SAMPLE_ATTENDANCE = ['Present', 'Present', 'Late', 'Absent', 'On leave', 'Half-day'];

export function attendanceForDate(employees, date, statusOverrides = {}, shifts = SHIFTS) {
  const day = new Date(`${date}T00:00:00`).getDate() || 1;
  return employees.map((employee) => {
    const shift = shifts.find((item) => item.id === employee.shift) || shifts[0] || SHIFTS[0];
    const seed = [...(employee.employeeId || employee.id)].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const status = statusOverrides[employee.id] || SAMPLE_ATTENDANCE[(day + seed) % SAMPLE_ATTENDANCE.length];
    const [startHour, startMinute] = shift.start.split(':').map(Number);
    const lateMinutes = status === 'Late' ? 12 + (seed % 3) * 5 : 0;
    const checkInDate = new Date(2000, 0, 1, startHour, startMinute + lateMinutes);
    const [endHour, endMinute] = shift.end.split(':').map(Number);
    const checkOutDate = new Date(2000, 0, 1, endHour, endMinute);
    if (checkOutDate <= checkInDate) checkOutDate.setDate(checkOutDate.getDate() + 1);
    const halfDayEnd = new Date(checkInDate.getTime() + 4 * 60 * 60 * 1000);
    const minutes = status === 'Absent' || status === 'On leave' ? 0 : Math.max(0, Math.round((checkOutDate - checkInDate) / 60000));
    const time = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return {
      ...employee,
      shiftName: shift.name,
      scheduledStart: shift.start,
      checkIn: minutes ? time(checkInDate) : '—',
      checkOut: minutes ? time(status === 'Half-day' ? halfDayEnd : checkOutDate) : '—',
      workingHours: minutes ? `${Math.floor((status === 'Half-day' ? 4 * 60 : minutes) / 60)}h ${(status === 'Half-day' ? 4 * 60 : minutes) % 60}m` : '—',
      status
    };
  });
}

export function stockStatus(item) {
  if (item.quantity <= 0) return 'Out of stock';
  if (item.quantity <= item.minimum) return 'Low stock';
  return 'In stock';
}
