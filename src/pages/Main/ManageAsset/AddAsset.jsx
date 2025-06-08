import { useState, useEffect } from "react";
import { addAsset } from "../../../firebase/assetservices";
import { fetchCategories } from "../../../firebase/categoryservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchLocations } from "../../../firebase/locationservices";
import { fetchVendors } from "../../../firebase/vendorservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";

const AddAsset = ({ onClose }) => {
  const [asset, setAsset] = useState({
    name: "",
    description: "",
    dateAcquired: "",
    cost: "",
    status: "",
    condition: "",
    specs: [],
    category: "",
    department: "",
    location: "",
    vendor: "",
  });
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { profile } = useAuth();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDropdownData(fetchCategories, setCategories);
    loadDropdownData(fetchDepartments, setDepartments);
    loadDropdownData(fetchLocations, setLocations);
    loadDropdownData(fetchVendors, setVendors);
  }, []);

  const loadDropdownData = async (fetchFn, setFn) => {
    try {
      const data = await fetchFn();
      const mappedData = data.reduce((acc, item) => {
        acc[item.id] = item.name;
        return acc;
      }, {});
      setFn(mappedData);
    } catch (error) {
      console.error(`Error fetching data:`, error);
      setFn({});
    }
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;

    if (editingIndex !== null) {
      const updatedSpecs = [...asset.specs];
      updatedSpecs[editingIndex] = { key: specKey, value: specValue };
      setAsset((prev) => ({ ...prev, specs: updatedSpecs }));
      setEditingIndex(null);
    } else {
      setAsset((prev) => ({
        ...prev,
        specs: [...prev.specs, { key: specKey, value: specValue }],
      }));
    }

    setSpecKey("");
    setSpecValue("");
  };

  const handleEditSpec = (index) => {
    setSpecKey(asset.specs[index].key);
    setSpecValue(asset.specs[index].value);
    setEditingIndex(index);
  };

  const handleDeleteSpec = (index) => {
    setAsset((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  };

  const handleAddAsset = async () => {
    const hasEmptyField = [
      asset.name,
      asset.description,
      asset.dateAcquired,
      asset.category,
      asset.department,
      asset.location,
      asset.vendor,
      asset.status,
      asset.condition,
    ].some((field) => !field.trim());

    const isCostValid = asset.cost !== "" && !isNaN(Number(asset.cost));
    const hasEmptySpecs = asset.specs.length === 0;

    if (hasEmptyField || !isCostValid || hasEmptySpecs) {
      setError(
        "All fields are required, and at least one specification must be added."
      );
      return;
    }

    setIsLoading(true);

    try {
      const parsedCost = Number(asset.cost);
      await addAsset(
        {
          ...asset,
          parsedCost,
        },
        profile?.id
      );

      setMessage("Asset was added successfully!");
      setAsset({
        name: "",
        description: "",
        dateAcquired: "",
        cost: "",
        status: "",
        condition: "",
        specs: [],
        category: "",
        department: "",
        location: "",
        vendor: "",
      });
      setSpecKey("");
      setSpecValue("");
      setEditingIndex(null);
      setCurrentStep(1);
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding asset:", error);
      setError("Failed to add asset. Please try again.");
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
            <h3 className="text-lg font-semibold">Add Asset</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Asset Name
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.name}
                  onChange={(e) => setAsset({ ...asset, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.description}
                  onChange={(e) =>
                    setAsset({ ...asset, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.dateAcquired}
                  onChange={(e) =>
                    setAsset({ ...asset, dateAcquired: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Cost
                </label>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.cost}
                  onChange={(e) => setAsset({ ...asset, cost: e.target.value })}
                />
              </div>

              {[
                { label: "Category", key: "category", options: categories },
                {
                  label: "Department",
                  key: "department",
                  options: departments,
                },
                { label: "Location", key: "location", options: locations },
                { label: "Vendor", key: "vendor", options: vendors },
              ].map(({ label, key, options }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700">
                    {label}
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={asset[key]}
                    onChange={(e) =>
                      setAsset({ ...asset, [key]: e.target.value })
                    }
                  >
                    <option value="">Select {label}</option>
                    {Object.entries(options).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.status}
                  onChange={(e) =>
                    setAsset({ ...asset, status: e.target.value })
                  }
                >
                  <option value="">Select Status</option>
                  {[
                    "Active",
                    "In Use",
                    "Under Investigation",
                    "In Repair",
                    "Borrowed",
                    "Broken",
                    "Disposed",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  value={asset.condition}
                  onChange={(e) =>
                    setAsset({ ...asset, condition: e.target.value })
                  }
                >
                  <option value="">Select Condition</option>
                  {["Excellent", "Good", "Fair", "Poor", "Unserviceable"].map(
                    (c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={nextStep}
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Next
              </button>
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
                {asset.specs.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {asset.specs.map((spec, index) => (
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
                onClick={handleAddAsset}
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

export default AddAsset;
