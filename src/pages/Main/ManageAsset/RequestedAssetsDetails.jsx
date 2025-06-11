import { useState, useEffect } from "react";
import { FiCheckSquare, FiX } from "react-icons/fi";
import { FiArrowLeft } from "react-icons/fi";
import { fetchAssetById } from "../../../firebase/assetservices";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { updateRequestUnit } from "../../../firebase/assetunitservices";
import { useAuth } from "../../../context/AuthContext";

const RequestAssetsDetails = ({ requestAssetsDetails, onClose }) => {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assetName, setAssetName] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [isRequestApproved, setIsRequestApproved] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (requestAssetsDetails) {
      setSelectedRequest(requestAssetsDetails);

      const fetchAssetData = async () => {
        try {
          const asset = await fetchAssetById(requestAssetsDetails.asset);
          setAssetName(asset.name);
        } catch (error) {
          console.error("Failed to fetch asset data:", error);
          setAssetName("Unknown Asset");
        }
      };

      fetchAssetData();
    }
  }, [requestAssetsDetails]);

  const handleApproveRequest = () => {
    if (!selectedRequest) return;

    setIsRequestApproved(true);
  };

  const handleCancelApproval = () => {
    setIsRequestApproved(false);
  };

  const handleConfirmRequest = () => {
    if (!selectedRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);

    try {
      updateRequestUnit(selectedRequest, remarks, "Approved", profile?.id);
      setMessage("Request was approved successfully!");
    } catch (error) {
      setError("Failed to approve request. Please try again.");
    }

    setIsLoading(false);

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleRejectRequest = () => {
    if (!selectedRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);

    try {
      updateRequestUnit(selectedRequest, "Rejected", profile?.id);
      setMessage("Request was rejected!");
    } catch (error) {
      setError("Failed to delete rejected. Please try again.");
    }

    setIsLoading(false);

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (!selectedRequest) return null;

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
            <h3 className="text-lg font-semibold">
              {isRequestApproved ? "Confirmation Details" : "Request Details"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!["Approved", "Rejected"].includes(selectedRequest?.status) ? (
              isRequestApproved ? (
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition"
                    onClick={handleCancelApproval}
                    title="Cancel Approval"
                  >
                    <FiX />
                    <span className="hidden md:inline">Cancel</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2 rounded bg-green-600 hover:bg-green-500 text-white transition"
                    onClick={handleConfirmRequest}
                    title="Confirm Approval"
                  >
                    <FiCheckSquare />
                    <span className="hidden md:inline">Confirm</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-500 text-white transition"
                    onClick={() => setShowRejectModal(true)}
                    title="Reject Request"
                  >
                    <FiX />
                    <span className="hidden md:inline">Reject</span>
                  </button>
                  <button
                    className="flex items-center gap-2 px-5 py-2 rounded bg-green-600 hover:bg-green-500 text-white transition"
                    onClick={handleApproveRequest}
                    title="Approve Request"
                  >
                    <FiCheckSquare />
                    <span className="hidden md:inline">Approve</span>
                  </button>
                </>
              )
            ) : (
              <div
                className={`flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold ${
                  selectedRequest.status === "Approved"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {selectedRequest.status === "Approved" ? (
                  <FiCheckSquare />
                ) : (
                  <FiX />
                )}
                <span className="hidden md:inline">
                  {selectedRequest.status}
                </span>
              </div>
            )}
          </div>
        </div>

        {showRejectModal && (
          <ConfirmModal
            message="Are you sure you want to reject this request?"
            onConfirm={handleRejectRequest}
            onCancel={() => setShowRejectModal(false)}
          />
        )}

        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />

        {isLoading && <SpinnerOverlay logo="A" />}

        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
            {!isRequestApproved ? (
              <>
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid col-span-1 md:col-span-2 grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Requested Asset
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        value={assetName || selectedRequest.asset || ""}
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quantity of Units
                      </label>
                      <input
                        type="text"
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                        value={selectedRequest.quantity || ""}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="cols-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Total Cost
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      value={selectedRequest.totalCost || ""}
                      readOnly
                    />
                  </div>

                  <div className="cols-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Cost per Unit
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      value={selectedRequest.estimatedCostPerUnit || ""}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Request
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 resize-none"
                    value={selectedRequest.reason || ""}
                    readOnly
                    rows={9}
                  />
                </div>
              </>
            ) : (
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Remarks/Notes
                </label>
                <textarea
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 resize-none"
                  value={remarks || ""}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={9}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestAssetsDetails;
