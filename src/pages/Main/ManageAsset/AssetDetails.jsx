import { useState, useEffect } from "react";
import { updateAsset, deleteAsset } from "../../../firebase/assetservices";
import { fetchCategories } from "../../../firebase/categoryservices";
import { useAuth } from "../../../context/AuthContext";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import { FiArrowLeft, FiCheckSquare, FiTrash } from "react-icons/fi";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import AssetList from "./AssetList";
import UnitList from "./UnitList";

const AssetDetails = ({ assetDetails, onClose }) => {
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    loadDropdownData(fetchCategories, setCategories);
  }, []);

  useEffect(() => {
    if (assetDetails) {
      setSelectedAsset(assetDetails);
    }
  }, [assetDetails]);

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

  const handleUpdateAsset = async () => {
    if (!selectedAsset) return;

    setIsLoading(true);

    try {
      await updateAsset(selectedAsset, profile?.id);
      setMessage("Asset details updated successfully!");
    } catch (error) {
      console.error("Error updating asset:", error);
      setError("Failed to update asset. Please try again.");
    }

    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const handleDeleteAsset = async () => {
    if (!selectedAsset || !selectedAsset.name) {
      setError("Invalid asset selected.");
      return;
    }

    setIsLoading(true);

    try {
      await deleteAsset(selectedAsset.id, profile?.id);
      setMessage("Asset was deleted successfully!");
      onClose();
    } catch (error) {
      setError("Failed to delete asset. Please try again.");
    }

    setIsLoading(false);
    setShowDeleteModal(false);
  };

  if (!selectedAsset) {
    return <p>Loading asset details...</p>;
  }

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

  return (
    <div className="asset-details-container flex flex-col h-full">
      <div className="header bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FiArrowLeft
            className="back-btn cursor-pointer"
            onClick={onClose}
            title="Go Back"
          />
          <h3 className="text-lg font-semibold">Asset Details</h3>
        </div>
        <div className="actions flex items-center gap-2">
          {profile?.role === "operational_administrator" && (
            <>
              <button
                className="delete-btn text-gray-200 hover:text-gray-900 px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                onClick={() => setShowDeleteModal(true)}
                title="Delete Asset"
              >
                <FiTrash />
                <span>Delete</span>
              </button>
              <button
                className="save-btn bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                onClick={() => setShowUpdateModal(true)}
                title="Save Changes"
              >
                <FiCheckSquare />
                <span>Save</span>
              </button>
            </>
          )}
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          message={`Are you sure you want to delete '${selectedAsset.name}'?`}
          onConfirm={handleDeleteAsset}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showUpdateModal && (
        <ConfirmModal
          message={`Are you sure you want to update '${selectedAsset.name}'?`}
          onConfirm={handleUpdateAsset}
          onCancel={() => setShowUpdateModal(false)}
        />
      )}

      {isLoading && <SpinnerOverlay logo="A" />}

      <MessageModal
        error={error}
        message={message}
        clearMessages={clearMessages}
      />

      <div className="record-form p-4 bg-white flex-1 overflow-y-auto">
        <div className="record-form-group grid grid-cols-2 gap-x-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={selectedAsset.name || ""}
              onChange={(e) =>
                setSelectedAsset({ ...selectedAsset, name: e.target.value })
              }
              className="input-field border border-gray-300 rounded px-3 py-2 w-full"
              disabled={profile.role !== "operational_administrator"}
            />
          </div>
          <div className="row-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={selectedAsset.description || ""}
              onChange={(e) =>
                setSelectedAsset({
                  ...selectedAsset,
                  description: e.target.value,
                })
              }
              className="border border-gray-300 rounded px-3 py-2 w-full min-h-28 resize-none"
              disabled={profile.role !== "operational_administrator"}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              value={selectedAsset?.category || ""}
              onChange={(e) =>
                setSelectedAsset({
                  ...selectedAsset,
                  category: e.target.value,
                })
              }
              className="input-field border border-gray-300 rounded px-3 py-2 w-full"
              disabled={profile.role !== "operational_administrator"}
            >
              <option value="">Select Category</option>
              {Object.entries(categories).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <UnitList assetDetails={selectedAsset} />
      </div>
    </div>
  );
};

export default AssetDetails;
