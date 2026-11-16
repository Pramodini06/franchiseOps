export const salesSeries = {
  daily: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, i) => ({ label, sales: [358000, 402000, 381000, 436000, 498000, 612000, 589000][i] })),
  weekly: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'].map((label, i) => ({ label, sales: [2620000, 2780000, 2710000, 2950000, 3040000, 2980000, 3120000, 3280000][i] })),
  monthly: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((label, i) => ({ label, sales: [8.9, 9.2, 9.8, 10.1, 10.6, 10.9, 11.4, 11.8, 12.1, 12.4, 12.7, 13.1][i] * 1e6 }))
};
export const activities = [
  { id: 1, type: 'order', text: 'Bulk order of 24 items placed at Koramangala Flagship', time: '4 min ago' },
  { id: 2, type: 'menu', text: 'Farmhouse Pizza marked unavailable at Mysuru Palace Road', time: '22 min ago' },
  { id: 3, type: 'branch', text: 'Whitefield Tech Park moved to maintenance mode', time: '1 hr ago' },
  { id: 4, type: 'user', text: 'New staff account created for Mangaluru Hampankatta', time: '2 hr ago' },
  { id: 5, type: 'order', text: 'Order FO-2611-1029 cancelled by customer (Hubballi)', time: '3 hr ago' },
  { id: 6, type: 'menu', text: 'Mysore Pak added to Tumakuru Bypass menu', time: 'Yesterday' }
];
export const notifications = [
  { id: 1, title: 'Low stock alert', body: 'Paneer stock is low at Hubballi Gokul Road.', time: '5 min ago', unread: true },
  { id: 2, title: 'New order placed', body: 'Order FO-2611-1034 received at Koramangala.', time: '12 min ago', unread: true },
  { id: 3, title: 'Weekly report ready', body: 'Franchise performance report for W45 is ready.', time: '1 hr ago', unread: true },
  { id: 4, title: 'Branch update', body: 'Whitefield Tech Park is under maintenance.', time: 'Yesterday', unread: false }
];
