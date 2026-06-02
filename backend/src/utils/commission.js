/**
 * Courier commission rules:
 * 1–60 gallons  => Rp 500/gallon
 * > 60 gallons  => Rp 1.000/gallon
 */
const calculateCommission = (totalGallons) => {
  if (!totalGallons || totalGallons <= 0) return { amount: 0, rate: 0 };
  const rate = totalGallons > 60 ? 1000 : 500;
  return { amount: totalGallons * rate, rate };
};

module.exports = { calculateCommission };
