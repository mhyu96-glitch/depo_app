const generateInvoiceNumber = (branchCode = 'CB') => {
  const now = new Date();
  const date = now.toISOString().slice(0,10).replace(/-/g,'');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${branchCode}-${date}-${rand}`;
};

module.exports = { generateInvoiceNumber };
