import { useState, useEffect } from "react";
import { addRequestUnit, addUnit } from "../../../firebase/assetunitservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchLocations } from "../../../firebase/locationservices";
import { fetchVendors } from "../../../firebase/vendorservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";

const AddRequestUnit = ({ assetDetails, onClose }) => {
  const [requestedUnit, setRequestedUnit] = useState({
    asset: "",
    quantity: 0,
    estimatedCostPerUnit: 0,
    totalCost: 0,
    reason: "",
    specs: [],
  });

  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { profile } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (assetDetails) {
      setRequestedUnit((prev) => ({
        ...prev,
        asset: assetDetails.id,
      }));
    }
  }, [assetDetails]);

  const handleChange = (key, value) => {
    const updated = {
      ...requestedUnit,
      [key]: value,
    };

    const quantity = parseFloat(updated.quantity) || 0;
    const unitCost = parseFloat(updated.estimatedCostPerUnit) || 0;

    updated.totalCost = quantity * unitCost;

    setRequestedUnit(updated);
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;

    if (editingIndex !== null) {
      const updatedSpecs = [...requestedUnit.specs];
      updatedSpecs[editingIndex] = { key: specKey, value: specValue };
      setRequestedUnit((prev) => ({ ...prev, specs: updatedSpecs }));
      setEditingIndex(null);
    } else {
      setRequestedUnit((prev) => ({
        ...prev,
        specs: [...prev.specs, { key: specKey, value: specValue }],
      }));
    }

    setSpecKey("");
    setSpecValue("");
  };

  const handleEditSpec = (index) => {
    setSpecKey(requestedUnit.specs[index].key);
    setSpecValue(requestedUnit.specs[index].value);
    setEditingIndex(index);
  };

  const handleDeleteSpec = (index) => {
    setRequestedUnit((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  };

  const handleAddUnit = async () => {
    const hasEmptyField = [requestedUnit.quantity, requestedUnit.reason].some(
      (field) => !field.trim()
    );

    const isCostValid =
      (requestedUnit.estimatedCostPerUnit !== "" &&
        !isNaN(Number(requestedUnit.estimatedCostPerUnit))) ||
      (requestedUnit.totalCost !== "" &&
        !isNaN(Number(requestedUnit.totalCost)));

    if (hasEmptyField || !isCostValid) {
      setError(
        "All fields are required, and at least one specification must be added."
      );
      return;
    }

    setIsLoading(true);

    try {
      const parsedEstimatedCostPerUnit = Number(
        requestedUnit.estimatedCostPerUnit
      );
      const parsedTotalCost = Number(requestedUnit.totalCost);
      await addRequestUnit(
        {
          ...requestedUnit,
          parsedEstimatedCostPerUnit,
          parsedTotalCost,
        },
        profile?.id
      );

      setMessage("Unit was added successfully!");
      setRequestedUnit({
        quantity: 0,
        estimatedCostPerUnit: 0,
        totalCost: 0,
        reason: "",
        specs: [],
      });
      setSpecKey("");
      setSpecValue("");
      setEditingIndex(null);
      setCurrentStep(1);
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding unit:", error);
      setError("Failed to add unit. Please try again.");
      setIsLoading(false);
    }
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FiArrowLeft className="cursor-pointer" onClick={onClose} />
            <h3 className="text-lg font-semibold">Request Unit</h3>
          </div>
        </div>

        {isLoading && <SpinnerOverlay logo="A" />}
        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />

        {currentStep === 1 && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${["system_administrator", "operational_administrator"].includes(profile.role) ? "col-span-3" : "col-span-1"} md:col-span-3`}>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={requestedUnit.quantity}
                  onChange={(e) => handleChange("quantity", e.target.value)}
                />
              </div>

              {["system_administrator", "operational_administrator"].includes(
                profile.role
              ) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Estimated Cost per Unit
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={requestedUnit.estimatedCostPerUnit}
                      onChange={(e) =>
                        handleChange("estimatedCostPerUnit", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Total Cost
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={requestedUnit.totalCost}
                      readOnly
                    />
                  </div>
                </>
              )}

              <div className="col-span-1 md:col-span-3">
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  value={requestedUnit.reason}
                  onChange={(e) => handleChange("reason", e.target.value)}
                  rows={3}
                  placeholder="Enter the reason for this request"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              {profile?.role === "operational_administrator" ? (
                <button
                  onClick={nextStep}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleAddUnit}
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                >
                  Submit
                </button>
              )}
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              {/* Specifications */}
              <div className="pt-4">
                <h3 className="font-medium text-gray-800 mb-2">
                  Specifications
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Spec Name"
                    className="col-span-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Spec Value"
                    className="col-span-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                  />
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={handleAddSpec}
                  >
                    {editingIndex !== null ? "Update Spec" : "Add Spec"}
                  </button>
                </div>
                {requestedUnit.specs.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {requestedUnit.specs.map((spec, index) => (
                      <li
                        key={index}
                        className="flex justify-between items-center"
                      >
                        {spec.key}: {spec.value}
                        <div className="space-x-2">
                          <button
                            className="text-blue-600 hover:underline text-xs"
                            onClick={() => handleEditSpec(index)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:underline text-xs"
                            onClick={() => handleDeleteSpec(index)}
                          >
                            Delete
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleAddUnit}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddRequestUnit;
