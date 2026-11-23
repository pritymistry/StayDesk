import dayjs from 'dayjs';

/**
 * Format currency in Indian Rupees (₹)
 */
export const formatCurrency = (amount) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(num);
};

/**
 * Format standard date
 */
export const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return dayjs(dateStr).format('DD MMM YYYY');
};

/**
 * Format relative date tag (e.g. "Today", "Tomorrow", "In 3 days")
 */
export const getDateRelative = (dateStr) => {
  if (!dateStr) return '';
  const target = dayjs(dateStr).startOf('day');
  const today = dayjs().startOf('day');
  const diffDays = target.diff(today, 'day');

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 1) return `In ${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

/**
 * GST Rate
 */
export const GST_RATE = 0.12;

/**
 * Calculate client-side estimated bill for preview
 */
export const calculateClientBill = (pricePerNight, checkInStr, checkOutStr) => {
  if (!pricePerNight || !checkInStr || !checkOutStr) {
    return { nights: 0, roomCharges: 0, gstAmount: 0, totalAmount: 0 };
  }
  const start = dayjs(checkInStr);
  const end = dayjs(checkOutStr);
  const nights = end.diff(start, 'day');

  if (nights <= 0) {
    return { nights: 0, roomCharges: 0, gstAmount: 0, totalAmount: 0 };
  }

  const roomCharges = Math.round(Number(pricePerNight) * nights * 100) / 100;
  const gstAmount = Math.round(roomCharges * GST_RATE * 100) / 100;
  const totalAmount = Math.round((roomCharges + gstAmount) * 100) / 100;

  return { nights, roomCharges, gstAmount, totalAmount };
};
