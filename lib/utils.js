// Format number as Uzbek currency
export function formatMoney(amount) {
  return new Intl.NumberFormat('uz-UZ').format(amount);
}

// Format date to dd.mm.yyyy
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

// Format date with time
export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

// Get relative time (e.g., "2 kun oldin")
export function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = Math.floor((now - d) / 1000);
  
  if (diff < 60) return 'hozirgina';
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDate(dateStr);
}

// Days until due date
export function daysUntilDue(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
}

// Status labels in Uzbek
export const STATUS_LABELS = {
  pending: 'Kutilmoqda',
  active: 'Faol',
  overdue: "Muddati o'tgan",
  closed: 'Yopilgan',
  cancelled: 'Bekor qilingan',
};

// Status badge class
export const STATUS_CLASSES = {
  pending: 'badge-pending',
  active: 'badge-active',
  overdue: 'badge-overdue',
  closed: 'badge-closed',
  cancelled: 'badge-cancelled',
};

// Get initials from name
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Format phone number for display
export function formatPhone(phone) {
  if (!phone) return '';
  const p = phone.replace(/\D/g, '');
  if (p.length === 9) {
    return `+998 ${p.slice(0, 2)} ${p.slice(2, 5)} ${p.slice(5, 7)} ${p.slice(7)}`;
  }
  return `+998 ${p}`;
}
