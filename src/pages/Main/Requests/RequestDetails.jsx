import { Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import { updateRequest } from "../../../firebase/requestservices";
import { addSchedule } from "../../../firebase/maintenancescheduleservices";
import { fetchUsers, updateUserStatus } from "../../../firebase/userservices";
import { updateUnit, fetchUnitById } from "../../../firebase/assetunitservices";
import { useAuth } from "../../../context/AuthContext";
import {
  FiArrowLeft,
  FiCheck,
  FiCheckSquare,
  FiDelete,
  FiX,
} from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { fetchAssetById } from "../../../firebase/assetservices";

const RequestDetails = ({ requestDetails, onClose }) => {
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [assetName, setAssetName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [isRequestApproved, setIsRequestApproved] = useState(false);
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [reportedAsset, setReportedAsset] = useState({});
  const [reportedUnit, setReportedUnit] = useState({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    asset: "",
    unit: "",
    title: "",
    description: "",
    scheduledDate: "",
    maintenanceType: "Corrective",
    frequency: "",
    nextSchedule: "",
    priorityScore: null,
    dueDate: null,
    dateCompleted: "",
  });

  const isMaintenanceTeam = profile?.role === "maintenance_head";

  useEffect(() => {
    if (requestDetails) {
      setSelectedRequest(requestDetails);

      const fetchAssetData = async () => {
        try {
          const asset = await fetchAssetById(requestDetails.reportedAsset);
          setReportedAsset(asset);
          setAssetName(asset.name);
        } catch (error) {
          console.error("Failed to fetch asset data:", error);
          setAssetName("Unknown Asset");
        }
      };
      const fetchUnitData = async () => {
        try {
          const unit = await fetchUnitById(requestDetails.reportedUnit);
          setReportedUnit(unit);
          setUnitNumber(unit.unitNumber);
        } catch (error) {
          console.error("Failed to fetch unit data:", error);
          setUnitNumber("Unknown Unit");
        }
      };

      fetchAssetData();
      fetchUnitData();
      loadDropdownData(fetchUsers, setTechnicians);
      console.log(requestDetails);
    }
  }, [requestDetails]);

  const loadDropdownData = async (fetchFn, setFn) => {
    try {
      const data = await fetchFn();
      const techniciansOnly = data.filter(
        (user) =>
          user.role === "maintenance_technician" && user.status === "Available"
      );
      const mappedTechnicians = techniciansOnly.reduce((acc, item) => {
        acc[item.id] = `${item.firstName} ${item.lastName}`;
        return acc;
      }, {});
      setFn(mappedTechnicians);
    } catch (error) {
      console.error(`Error fetching data:`, error);
      setFn({});
    }
  };

  const handleConfirmSchedule = async () => {
    if (!selectedRequest) return;

    if (
      selectedRequest.requestType === "Maintenance Request" &&
      assignedTechnicians.length === 0
    ) {
      setError("Please assign at least one technician before confirming.");
      return;
    }

    setIsLoading(true);

    try {
      if (selectedRequest.requestType === "Maintenance Request") {
        await addSchedule(
          {
            ...scheduleData,
            asset: selectedRequest.reportedAsset,
            units: selectedRequest.reportedUnit,
            title: `${assetName} Repair`,
            description: selectedRequest.description,
            scheduledDate: Timestamp.fromDate(
              new Date(scheduleData.scheduledDate)
            ),
            priorityScore: selectedRequest.priorityScore,
            assignedTechnicians: assignedTechnicians.map((t) => t.id),
            dueDate: Timestamp.fromDate(new Date(scheduleData.dueDate)),
            status: "Pending",
            requestId: selectedRequest.id,
          },
          profile?.id
        );

        const unitData = await fetchUnitById(selectedRequest.reportedUnit);
        if (!unitData) {
          throw new Error("Unit not found");
        }

        const updatedUnit = {
          ...unitData,
          status: selectedRequest.assetStatus,
        };

        await updateUnit(updatedUnit, profile?.id);
        setMessage("Request approved. Maintenance schedule was created.");
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        const unitData = await fetchUnitById(selectedRequest.reportedUnit);
        if (!unitData) {
          throw new Error("Unit not found");
        }

        const updatedUnit = {
          ...unitData,
          status: selectedRequest.assetStatus,
        };

        await updateUnit(updatedUnit, profile?.id);

        setMessage("Request approved. Maintenance schedule was created.");
      }
      updateRequest(selectedRequest, "Approved", profile?.id);
      setIsLoading(false);
    } catch (error) {
      console.error("Error approving request:", error);
      setError("Failed to approve request. Please try again.");
      setIsLoading(false);
    }

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) {
      setError("Invalid request selected.");
      return;
    }

    setIsLoading(true);
    try {
      updateRequest(selectedRequest, "Rejected", profile?.id);
      setMessage("Request was rejected successfully!");
      setSelectedRequest(null);
      setIsLoading(false);
    } catch (error) {
      setError("Failed to delete rejected. Please try again.");
      setIsLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;

    if (selectedRequest.requestType === "Asset Update Request") {
      await handleConfirmSchedule();
    } else {
      setIsRequestApproved(true);
    }
  };

  const handleCancelApproval = async () => {
    setIsRequestApproved(false);
  };

  const handleAddTechnician = () => {
    const availableTechnicians = Object.entries(technicians).filter(
      ([id]) => !assignedTechnicians.find((t) => t.id === id)
    );

    if (availableTechnicians.length === 0) {
      setError("No more available technicians to assign.");
      return;
    }

    const [nextTechId, name] = availableTechnicians[0]; // auto-pick the first one
    setAssignedTechnicians((prev) => [...prev, { id: nextTechId, name }]);
  };

  const handleRemoveTechnician = (idToRemove) => {
    setAssignedTechnicians(
      assignedTechnicians.filter((t) => t.id !== idToRemove)
    );
  };

  if (!selectedRequest) {
    return <p>Loading request details...</p>;
  }

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
              {isRequestApproved
                ? "Assign Details for Maintenance"
                : "Request Details"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!["Approved", "Completed", "Ongoing"].includes(
              selectedRequest.status
            ) &&
              isMaintenanceTeam && (
                <>
                  {isRequestApproved ? (
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
                        onClick={handleConfirmSchedule}
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
                  )}
                </>
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reported Asset:
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      value={assetName || selectedRequest.reportedAsset || ""}
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reported Unit:
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      value={unitNumber || selectedRequest.reportedUnit || ""}
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Request Type:
                    </label>
                    <input
                      type="text"
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100"
                      value={selectedRequest.requestType || ""}
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue:
                  </label>
                  <textarea
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-gray-100 resize-none"
                    value={selectedRequest.description || ""}
                    readOnly
                    rows={9}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheduled Date:
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={scheduleData.scheduledDate || ""}
                    onChange={(e) => {
                      setScheduleData((prev) => ({
                        ...prev,
                        scheduledDate: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date:
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={scheduleData.dueDate || ""}
                    onChange={(e) => {
                      setScheduleData((prev) => ({
                        ...prev,
                        dueDate: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1 md:mb-0">
                    Assign Technician:
                  </label>
                  <button
                    className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white transition"
                    onClick={handleAddTechnician}
                  >
                    Auto-Assign Technician
                  </button>
                </div>

                {assignedTechnicians.length > 0 && (
                  <div className="md:col-span-2">
                    <ul className="divide-y divide-gray-200">
                      {assignedTechnicians.map((tech) => (
                        <li
                          key={tech.id}
                          className="flex items-center justify-between py-2"
                        >
                          <span className="text-gray-800">{tech.name}</span>
                          <button
                            type="button"
                            className="px-3 py-1 rounded bg-red-500 hover:bg-red-400 text-white text-xs transition"
                            onClick={() => handleRemoveTechnician(tech.id)}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetails;
