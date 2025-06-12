import {
  FiArrowLeft,
  FiCheckSquare,
  FiClock,
  FiEye,
  FiMail,
  FiX,
} from "react-icons/fi";
import { useEffect, useState } from "react";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import {
  addUnit,
  deleteUnit,
  fetchRequestSpecs,
  fetchUnits,
  getNextUnitNumber,
  updateRequestUnit,
  updateUnit,
} from "../../../firebase/assetunitservices";
import { useAuth } from "../../../context/AuthContext";
import { fetchUsers } from "../../../firebase/userservices";
import { fetchAssets } from "../../../firebase/assetservices";
import { fetchVendors } from "../../../firebase/vendorservices";

const UnitRequestDetails = ({ requestDetails, onClose }) => {
  const [selectedUnitRequest, setSelectedUnitRequest] = useState(null);
  const [requestSpecs, setRequestSpecs] = useState([]);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assetVendor, setAssetVendor] = useState("");
  const [acquisationCost, setAcquisationCost] = useState(0);
  const [remarks, setRemarks] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showUpdateModal, setShowConfirmRequestModal] = useState(false);
  const [isConfirmingAcquisation, setIsConfirmingAcquisation] = useState(false);

  useEffect(() => {
    if (requestDetails) {
      setSelectedUnitRequest(requestDetails);
      getData(requestDetails.id);
    }
  }, [requestDetails]);

  const getData = async (requestId) => {
    setIsLoading(true);
    try {
      const requestData = (await fetchRequestSpecs(requestId)) ?? [];
      const userData = (await fetchUsers()) ?? [];
      const unitData = (await fetchUnits()) ?? [];
      const vendorData = (await fetchVendors()) ?? [];
      setRequestSpecs(Array.isArray(requestData) ? requestData : []);
      setUsers(userData || []);
      setUnits(unitData || []);
      setVendors(Array.isArray(vendorData) ? vendorData : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRequestSpecs([]);
      setUsers([]);
      setUnits([]);
      setVendors([]);
    }
    setIsLoading(false);
  };

  const handleAcquiredUnitClick = async () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    if (!isConfirmingAcquisation) setIsConfirmingAcquisation(true);
    else await handleAcquiredUnit();
  };

  const handleApproveRequest = async () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    const availableUnits = units.filter(
      (unit) =>
        unit.asset === selectedUnitRequest.asset && unit.status === "In Stock"
    );

    if (availableUnits.length < selectedUnitRequest.quantity) {
      setError("Not enough stock available for this request.");
      return;
    } else {
      await handleConfirmRequest();
    }
  };

  const handleAcquiredUnit = async () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    const quantity = selectedUnitRequest?.quantity;
    const today = new Date().toISOString().split("T")[0];

    const unitTemplate = {
      asset: selectedUnitRequest.asset,
      dateAcquired: today,
      cost: acquisationCost,
      status: "In Stock",
      condition: "Good",
      department: "in_stock",
      location: "in_stock",
      vendor: assetVendor,
      specs: [],
      addedBy: profile?.id ?? "System",
      requestedBy: selectedUnitRequest.requestedBy,
      isLegacy: false,
    };

    setIsLoading(true);

    try {
      const createPromises = [];

      for (let i = 0; i < quantity; i++) {
        console.log(`Creating unit ${i + 1} of ${quantity}`);
        createPromises.push(addUnit(unitTemplate, profile?.id));
      }

      await Promise.all(createPromises);

      await updateRequestUnit(selectedUnitRequest, "", "Acquired", profile?.id);
      setMessage("Units successfully acquired into stock.");
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error("Acquisition Error:", error);
      setError("Failed to acquire units. Please try again.");
    }

    setIsLoading(false);
  };

  const handleDeliverUnit = async () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);

    try {
      const availableUnits = units.filter(
        (unit) =>
          unit.asset === selectedUnitRequest.asset && unit.status === "In Stock"
      );

      if (availableUnits.length < selectedUnitRequest.quantity) {
        setError("Not enough stock to fulfill the request.");
        setIsLoading(false);
        return;
      }

      const department = getDepartment(selectedUnitRequest.requestedBy);
      const location = getLocation(selectedUnitRequest.requestedBy);

      const unitsToDeliver = availableUnits.slice(
        0,
        selectedUnitRequest?.quantity
      );

      const updatePromises = unitsToDeliver.map((unit) => {
        const updatedUnit = {
          ...unit,
          status: "In Use",
          department,
          location,
          requestedBy: selectedUnitRequest.requestedBy,
        };
        return updateUnit(updatedUnit, profile?.id);
      });

      await Promise.all(updatePromises);

      await updateRequestUnit(
        selectedUnitRequest,
        "",
        "Delivered",
        profile?.id
      );

      setMessage("Units delivered successfully!");
      setTimeout(() => onClose(), 3000);
    } catch (error) {
      console.error("Delivery Error:", error);
      setError("Failed to deliver units. Please try again.");
    }

    setIsLoading(false);
  };

  const handleRejectRequest = () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);

    try {
      updateRequestUnit(selectedUnitRequest, "", "Rejected", profile?.id);
      setMessage("Request was rejected!");
    } catch (error) {
      setError("Failed to delete rejected. Please try again.");
    }

    setIsLoading(false);

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleConfirmRequest = () => {
    if (!selectedUnitRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);

    try {
      updateRequestUnit(
        selectedUnitRequest,
        "Your request is being processed. Please wait.",
        "In Process",
        profile?.id
      );
      setMessage("Request was approved successfully!");
    } catch (error) {
      setError("Failed to approve request. Please try again.");
    }

    setIsLoading(false);

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const getUserRole = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.role}` : "Unknown User";
  };

  const getUserFullName = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getDepartment = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.department}` : "Unknown Department";
  };

  const getLocation = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.location}` : "Unknown Location";
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  return (
    <>
      {isLoading ? (
        <SpinnerOverlay logo="A" />
      ) : (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
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
                {["system_administrator", "operational_administrator"].includes(
                  profile.role
                ) &&
                  getUserRole(selectedUnitRequest?.requestedBy) !==
                    "operational_administrator" &&
                  selectedUnitRequest?.status === "Pending" && (
                    <>
                      <button
                        className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-red-600 hover:bg-red-500 transition flex items-center gap-2"
                        onClick={handleRejectRequest}
                        title="Delete Asset"
                      >
                        <FiX />
                        <span className="hidden md:inline">Reject</span>
                      </button>
                      <button
                        className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                        onClick={handleApproveRequest}
                        title="Save Changes"
                      >
                        <FiCheckSquare />
                        <span className="hidden md:inline">Approve</span>
                      </button>
                    </>
                  )}
                {selectedUnitRequest?.status === "In Process" ? (
                  ![
                    "system_administrator",
                    "operational_administrator",
                  ].includes(profile.role) ? (
                    <div className="bg-gray-400 text-black px-5 py-3 lg:py-2 rounded flex items-center gap-2 font-bold">
                      <FiClock />
                      <span className="hidden md:inline">In Process</span>
                    </div>
                  ) : (
                    <button
                      className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                      onClick={handleDeliverUnit}
                      title="Save Changes"
                    >
                      <FiMail />
                      <span className="hidden md:inline">Deliver</span>
                    </button>
                  )
                ) : selectedUnitRequest?.status === "Acquired" ? (
                  <div className="flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold text-green-500">
                    <FiMail />
                    <span className="hidden md:inline">Acquired</span>
                  </div>
                ) : selectedUnitRequest?.status === "Pending" &&
                  ![
                    "system_administrator",
                    "operational_administrator",
                  ].includes(profile.role) ? (
                  <div className="flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold text-gray-400">
                    <FiEye />
                    <span className="hidden md:inline">Pending</span>
                  </div>
                ) : selectedUnitRequest?.status === "Approved" &&
                  [
                    "system_administrator",
                    "operational_administrator",
                  ].includes(profile.role) ? (
                  <button
                    className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                    onClick={handleAcquiredUnitClick}
                    title="Acquire"
                  >
                    <FiCheckSquare />
                    <span className="hidden md:inline">
                      {isConfirmingAcquisation ? "Confirm" : "Acquire"}
                    </span>
                  </button>
                ) : selectedUnitRequest?.status === "Delivered" ? (
                  <div className="flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold text-green-400">
                    <FiMail />
                    <span className="hidden md:inline">Delivered</span>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
              {showRejectModal && (
                <ConfirmModal
                  message={`Are you sure you want to reject this request from ${getUserFullName(
                    selectedUnitRequest.requestedBy
                  )}?`}
                  onConfirm={handleRejectRequest}
                  onCancel={() => setShowRejectModal(false)}
                />
              )}

              {showUpdateModal && (
                <ConfirmModal
                  message={`Are you sure you want to update Unit #${selectedUnitRequest.unitNumber}?`}
                  onConfirm={handleConfirmRequest}
                  onCancel={() => setShowConfirmRequestModal(false)}
                />
              )}

              <MessageModal
                error={error}
                message={message}
                clearMessages={clearMessages}
              />

              {!isConfirmingAcquisation ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  <div className={`${(selectedUnitRequest?.estimatedCostPerUnit !== 0 && !selectedUnitRequest?.totalCost !== 0) ? "col-span-1 md:col-span-1" : "col-span-1 md:col-span-3"}`}>
                    <label className="block text-sm font-medium text-gray-700">
                      Quantity
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={selectedUnitRequest?.quantity || 0}
                      readOnly
                    />
                  </div>
                  {[
                    "operational_administrator",
                    "system_administrator",
                  ].includes(profile.role) && (selectedUnitRequest?.estimatedCostPerUnit !== 0 && !selectedUnitRequest?.totalCost !== 0) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Estimated Cost per Unit
                        </label>
                        <input
                          type="number"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          value={selectedUnitRequest?.estimatedCostPerUnit || 0}
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
                          value={selectedUnitRequest?.totalCost || 0}
                          readOnly
                        />
                      </div>
                    </>
                  )}

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
                          value={
                            selectedUnitRequest?.reason || "No reason provided"
                          }
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
                        value={
                          selectedUnitRequest?.reason || "No reason provided"
                        }
                        readOnly
                        rows={3}
                        placeholder="Enter the reason for this request"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  <div>
                    <label className="font-semibold text-gray-700">
                      Vendor/Supplier
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      value={assetVendor}
                      onChange={(e) => setAssetVendor(e.target.value)}
                      required
                    >
                      <option value="">Select Vendor/Supplier</option>
                      {Array.isArray(vendors) &&
                        vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Cost Per Unit
                    </label>
                    <input
                      type="number"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      value={acquisationCost}
                      onChange={(e) => setAcquisationCost(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnitRequestDetails;
