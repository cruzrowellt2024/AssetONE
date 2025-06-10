import { FiArrowLeft, FiCheckSquare, FiX } from "react-icons/fi";
import { useEffect, useState } from "react";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import {
  deleteUnit,
  fetchRequestSpecs,
  updateUnit,
} from "../../../firebase/assetunitservices";
import { useAuth } from "../../../context/AuthContext";

const UnitRequestDetails = ({ requestDetails, onClose }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [requestSpecs, setRequestSpecs] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  useEffect(() => {
    if (requestDetails) {
      setSelectedUnit(requestDetails);
      getSpecs(requestDetails.id);
    }
    console.log("Request Details:", requestDetails);
  }, [requestDetails]);

  const getSpecs = async (requestId) => {
    try {
      const requestData = await fetchRequestSpecs(requestId);
      setRequestSpecs(requestData || []);
    } catch (error) {
      console.error("Error fetching asset specs:", error);
      setRequestSpecs([]);
    }
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit) return;

    setIsLoading(true);

    try {
      await updateUnit(selectedUnit, profile?.id);
      setMessage("Unit details updated successfully!");
    } catch (error) {
      console.error("Error updating unit:", error);
      setError("Failed to update unit. Please try again.");
    }

    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit) return;
    setIsLoading(true);
    try {
      await deleteUnit(selectedUnit.id, profile?.id);
      setMessage(`Unit #${selectedUnit.unitNumber} deleted successfully!`);
      onClose(); // Close the modal after deletion
    } catch (error) {
      console.error("Error deleting unit:", error);
      setError("Failed to delete unit. Please try again.");
    }
    setIsLoading(false);
    setShowDeleteModal(false);
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
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft
              className="cursor-pointer hover:text-gray-300 transition"
              onClick={onClose}
            />
            <h3 className="text-lg font-semibold">Unit Request Details</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-red-600 hover:bg-red-500 transition flex items-center gap-2"
              onClick={() => setShowDeleteModal(true)}
              title="Delete Asset"
            >
              <FiX />
              <span className="hidden md:inline">Reject</span>
            </button>
            <button
              className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
              onClick={() => setShowUpdateModal(true)}
              title="Save Changes"
            >
              <FiCheckSquare />
              <span className="hidden md:inline">Approve</span>
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          {showDeleteModal && (
            <ConfirmModal
              message={`Are you sure you want to delete Unit #${selectedUnit.unitNumber}?`}
              onConfirm={handleDeleteUnit}
              onCancel={() => setShowDeleteModal(false)}
            />
          )}

          {showUpdateModal && (
            <ConfirmModal
              message={`Are you sure you want to update Unit #${selectedUnit.unitNumber}?`}
              onConfirm={handleUpdateUnit}
              onCancel={() => setShowUpdateModal(false)}
            />
          )}

          {isLoading && <SpinnerOverlay logo="A" />}

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selectedUnit?.quantity || 0}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estimated Cost per Unit
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selectedUnit?.estimatedCostPerUnit || 0}
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Total Cost
              </label>
              <input
                type="number"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={selectedUnit?.totalCost || 0}
                readOnly
              />
            </div>
          
          {requestSpecs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 col-span-1 md:col-span-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Specification
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  value={
                    requestSpecs.length > 0
                      ? requestSpecs
                          .map((spec) => `${spec.key}: ${spec.value}`)
                          .join("\n")
                      : "No specifications provided"
                  }
                  readOnly
                  rows={Math.max(3, requestSpecs.length)}
                  placeholder="Specifications will appear here"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Reason
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  value={selectedUnit?.reason || "No reason provided"}
                  readOnly
                  rows={3}
                  placeholder="Enter the reason for this request"
                />
              </div>
            </div>
            ) : (
            <div className="col-span-1 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Reason
              </label>
              <textarea
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                value={selectedUnit?.reason || "No reason provided"}
                readOnly
                rows={3}
                placeholder="Enter the reason for this request"
              />
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnitRequestDetails;
