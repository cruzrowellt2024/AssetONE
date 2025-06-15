import { useState, useEffect } from "react";
import { fetchUnits } from "../../../firebase/assetunitservices";

const DepreciationModule = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUnits = async () => {
      const data = await fetchUnits();
      setUnits(data);
      setLoading(false);
    };
    loadUnits();
  }, []);

  const calculateDepreciation = (unit) => {
    const {
      cost,
      salvageValue = 0,
      dateAcquired,
      usefulLife,
      depreciationMethod,
      depreciationRate,
    } = unit;

    if (!cost || !usefulLife || !dateAcquired) {
      return { accumulated: 0, bookValue: cost || 0 };
    }

    const acquiredDate = new Date(dateAcquired);
    const yearsElapsed = Math.min(
      usefulLife,
      Math.floor((new Date() - acquiredDate) / (1000 * 60 * 60 * 24 * 365))
    );

    if (depreciationMethod === "straight_line") {
      const annual = (cost - salvageValue) / usefulLife;
      const accumulated = annual * yearsElapsed;
      const bookValue = Math.max(cost - accumulated, salvageValue);
      return { accumulated, bookValue };
    }

    console.log("Method for unit", unit.id, depreciationMethod);

    if (depreciationMethod === "declining_balance") {
      const rate = parseFloat(depreciationRate);
      console.log(rate);

      if (isNaN(rate) || rate <= 0 || rate >= 1) {
        return { accumulated: 0, bookValue: cost };
      }
      let bookValue = cost;
      for (let i = 0; i < yearsElapsed; i++) {
        bookValue *= 1 - rate;
      }
      const accumulated = cost - bookValue;
      console.log({
        id: unit.id,
        cost,
        salvageValue,
        yearsElapsed,
        accumulated,
        bookValue,
      });
      return { accumulated, bookValue };
    }

    return { accumulated: 0, bookValue: cost };
  };

  if (loading) return <p>Loading depreciation data...</p>;

  return (
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold text-gray-700 mb-4">
        Unit Depreciation
      </h2>
      <table className="min-w-full table-auto text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            <th className="p-2">Unit</th>
            <th className="p-2">Cost</th>
            <th className="p-2">Method</th>
            <th className="p-2">Useful Life</th>
            <th className="p-2">Accum. Depreciation</th>
            <th className="p-2">Book Value</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => {
            const { accumulated, bookValue } = calculateDepreciation(unit);
            return (
              <tr key={unit.id} className="border-t">
                <td className="p-2">{unit.asset}</td>
                <td className="p-2">Php{unit.cost || "0.00"}</td>
                <td className="p-2 capitalize">
                  {unit.depreciationMethod?.replace("_", " ") || "n/a"}
                </td>
                <td className="p-2">{unit.usefulLife || "-"} yrs</td>
                <td className="p-2 text-red-600">
                  Php{accumulated.toFixed(2)}
                </td>
                <td className="p-2 text-green-600">
                  Php{bookValue.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DepreciationModule;
