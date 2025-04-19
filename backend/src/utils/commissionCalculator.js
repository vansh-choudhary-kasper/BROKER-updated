const calculateCommission = (amount, slabs) => {
  if (!slabs || slabs.length === 0) {
    return 0;
  }

  // Sort slabs by minAmount to ensure proper calculation
  const sortedSlabs = [...slabs].sort((a, b) => a.minAmount - b.minAmount);

  let commission = 0;
  let remainingAmount = amount;

  for (const slab of sortedSlabs) {
    if (remainingAmount <= 0) break;

    const slabAmount = Math.min(
      remainingAmount,
      slab.maxAmount - slab.minAmount
    );

    if (slabAmount > 0) {
      commission += (slabAmount * slab.commission) / 100;
      remainingAmount -= slabAmount;
    }
  }

  return commission;
};

module.exports = {
  calculateCommission
}; 