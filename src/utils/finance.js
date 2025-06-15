export const calculateDepreciation = (unit) => {
  const {
    cost,
    salvageValue = 0,
    dateAcquired,
    usefulLife,
    depreciationMethod,
    depreciationRate,
  } = unit;

  const originalCost = parseFloat(cost);
  const salvage = parseFloat(salvageValue);
  const life = parseInt(usefulLife);

  if (isNaN(originalCost) || isNaN(life) || !dateAcquired) {
    return { accumulated: 0, bookValue: originalCost || 0 };
  }

  const acquiredDate = new Date(dateAcquired);
  const now = new Date();
  const yearsElapsed = Math.min(
    life,
    Math.floor((now - acquiredDate) / (1000 * 60 * 60 * 24 * 365))
  );

  if (depreciationMethod === "straight_line") {
    const annual = (originalCost - salvage) / life;
    const accumulated = annual * yearsElapsed;
    const bookValue = Math.max(originalCost - accumulated, salvage);
    return { accumulated, bookValue };
  }

  if (depreciationMethod === "declining_balance") {
    const rate = parseFloat(depreciationRate);
    if (isNaN(rate) || rate <= 0 || rate >= 1) {
      return { accumulated: 0, bookValue: originalCost };
    }

    let bookValue = originalCost;
    for (let i = 0; i < yearsElapsed; i++) {
      bookValue *= 1 - rate;
    }
    const accumulated = originalCost - bookValue;
    return { accumulated, bookValue };
  }
  console.log({
  id: unit.id || unit.assetName, // add whatever identifier
  dateAcquired,
  yearsElapsed,
  depreciationMethod,
  cost: originalCost,
  salvage,
  life,
});

  return { accumulated: 0, bookValue: originalCost };
};
