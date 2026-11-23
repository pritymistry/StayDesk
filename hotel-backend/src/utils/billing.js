const GST_RATE = 0.12;

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Single place where the bill is calculated (always on the server)
const calculateBill = (pricePerNight, nights) => {
  const roomCharges = round2(pricePerNight * nights);
  const gstAmount = round2(roomCharges * GST_RATE);
  const totalAmount = round2(roomCharges + gstAmount);
  return { roomCharges, gstAmount, totalAmount };
};

module.exports = { GST_RATE, calculateBill };
