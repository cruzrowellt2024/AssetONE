import { useState, useEffect } from "react";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import { fetchCategories } from "../../../firebase/categoryservices";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { addAsset } from "../../../firebase/assetservices";
import { useAuth } from "../../../context/AuthContext";

const AddAsset = ({ onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [assetName, setAssetName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useAuth();

  useEffect(() => {
    loadDropdownData(fetchCategories, setCategories);
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

  const handleAddAsset = async () => {
    if ([assetName, description].some((field) => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);

    try {
      await addAsset(assetName, description, selectedCategory, profile?.id);
      setMessage("Asset was added successfully!");
      setAssetName("");
      setDescription("");
      setSelectedCategory("");
    } catch (error) {
      console.error("Error adding asset:", error);
      setError("Failed to add asset. Please try again.");
    }

    setIsLoading(false);
  };

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

        <div className="p-6">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Asset Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Asset Name"
                value={assetName}
                onChange={(e) => setAssetName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {Object.entries(categories).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-6">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              onClick={handleAddAsset}
            >
              Add Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddAsset;
