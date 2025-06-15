import { useState, useEffect } from "react";
import {
  updateSchedule,
  deleteSchedule,
  addSchedule,
} from "../../../firebase/maintenancescheduleservices";
import {
  fetchUnitById,
  fetchUnits,
  updateUnit,
} from "../../../firebase/assetunitservices";
import {
  fetchUsers,
  updateUser,
  updateUserStatus,
} from "../../../firebase/userservices";
import { useAuth } from "../../../context/AuthContext";
import {
  FiThumbsUp,
  FiArrowLeft,
  FiCheckSquare,
  FiTrash,
  FiMail,
} from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import {
  fetchRequestById,
  updateRequest,
} from "../../../firebase/requestservices";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchAssets } from "../../../firebase/assetservices";

const MaintenanceScheduleDetails = ({ scheduleDetails, onClose }) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [units, setUnits] = useState([]);
  const [users, setUsers] = useState([]);
  const [assetMap, setAssetMap] = useState({});
  const [departmentMap, setDepartmentMap] = useState({});
  const [isLastSchedule, setIsLastSchedule] = useState(false);
  const [initialStatus, setInitialStatus] = useState(null);
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [confirmUpdateMessage, setConfirmUpdateMessage] = useState("");
  const scoreToLabelMap = {
    24: "Low",
    49: "Medium",
    74: "High",
    100: "Critical",
  };

  const labelToScoreMap = {
    Low: 24,
    Medium: 49,
    High: 74,
    Critical: 100,
  };
  const { profile } = useAuth();
  const isViewer =
    profile?.role === "maintenance_technician" || profile?.role === "reporter";

  const isSysAdminOrMaintenanceHead =
    profile?.role === "maintenance_head" ||
    profile?.role === "system_administrator";

  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (scheduleDetails) {
      setSelectedSchedule(scheduleDetails);
      setInitialStatus(scheduleDetails.status);
      if (
        scheduleDetails.assignedTechnicians &&
        scheduleDetails.assignedTechnicians.length > 0
      ) {
        const assignedTechs = scheduleDetails.assignedTechnicians.map(
          (technicianId) => {
            const name = technicians[technicianId];
            return { id: technicianId, name };
          }
        );
        setAssignedTechnicians(assignedTechs);
      }
    }
    getUnits();
  }, [scheduleDetails, technicians]);

  useEffect(() => {
    const loadData = async () => {
      const assets = await fetchAssets();
      const departments = await fetchDepartments();

      const assetObj = {};
      assets.forEach((asset) => {
        assetObj[asset.id] = asset.name; // assuming asset has { id, name, departmentId }
      });

      const deptObj = {};
      departments.forEach((dept) => {
        deptObj[dept.id] = dept.name; // assuming dept has { id, name }
      });

      setAssetMap(assetObj);
      setDepartmentMap(deptObj);
      loadDropdownData(fetchUsers, setTechnicians);
    };

    loadData();
  }, []);

  const loadDropdownData = async (fetchFn, setFn) => {
    try {
      const data = await fetchFn();
      const techniciansOnly = data.filter(
        (user) => user.role === "maintenance_technician"
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

  const getUnits = async () => {
    try {
      const assetData = await fetchUnits();
      const userData = await fetchUsers();
      setUsers(userData || []);
      setUnits(assetData || []);
    } catch (error) {
      console.error("Error fetching schedules:", error);
    }
  };

  const getUserFullName = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getUnitsNumber = (unitId) => {
    const user = units.find((unit) => unit.id === unitId);
    return user ? `${user.unitNumber}` : "Unknown Unit";
  };

  const getUnitsAssetId = (unitId) => {
    const user = units.find((unit) => unit.id === unitId);
    return user ? `${user.asset}` : "Unknown Unit";
  };

  const getUnitsDepartment = (unitId) => {
    const unit = units.find((unit) => unit.id === unitId);
    console.log(unit);
    return unit ? `${unit.department}` : "Unknown Unit";
  };

  const handleUpdateSchedule = async () => {
    if (!selectedSchedule) return;

    const updatedSchedule = {
      ...selectedSchedule,
      assignedTechnicians: assignedTechnicians.map((t) => t.id),
    };

    const isCompleted = selectedSchedule.status === "Completed";
    const maintenanceType = selectedSchedule.maintenanceType;

    setIsLoading(true);

    try {
      await updateSchedule(updatedSchedule, isCompleted, profile?.id);

      if (isCompleted && maintenanceType === "Preventive" && !isLastSchedule) {
        const currentNextSchedule =
          selectedSchedule.nextSchedule instanceof Date
            ? selectedSchedule.nextSchedule
            : selectedSchedule.nextSchedule.toDate
            ? selectedSchedule.nextSchedule.toDate()
            : new Date(selectedSchedule.nextSchedule);

        currentNextSchedule.setDate(
          currentNextSchedule.getDate() + selectedSchedule.frequency
        );

        const { id, ...scheduleWithoutId } = updatedSchedule;

        await addSchedule(
          {
            ...scheduleWithoutId,
            scheduledDate: selectedSchedule.nextSchedule,
            nextSchedule: currentNextSchedule,
            status: "Pending",
            dateCompleted: "",
          },
          profile?.id
        );
      }

      if (
        selectedSchedule.requestId !== "None" &&
        selectedSchedule.status !== "Pending"
      ) {
        const requestData = await fetchRequestById(selectedSchedule.requestId);
        await updateRequest(
          { ...requestData, id: selectedSchedule.requestId },
          selectedSchedule.status,
          profile?.id
        );
      }

      setMessage("Schedule details updated successfully!");
    } catch (error) {
      console.error("Error updating schedule:", error);
      setError("Failed to update schedule. Please try again.");
    }
    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const showUpdateMessage = () => {
    if (!selectedSchedule) return;

    const isCompleted = selectedSchedule.status === "Completed";
    const maintenanceType = selectedSchedule.maintenanceType;

    const confirmMessage =
      isCompleted && maintenanceType === "Preventive"
        ? `Are you sure you want to mark '${selectedSchedule.title}' as completed? Once completed, this schedule cannot be modified due to strict compliance requirements.`
        : `Are you sure you want to update ${selectedSchedule.title}?`;

    setConfirmUpdateMessage(confirmMessage);
    setShowUpdateModal(true);
  };

  const handleDeleteSchedule = async () => {
    if (!selectedSchedule) {
      setError("Invalid schedule selected.");
      return;
    }

    setIsLoading(true);

    try {
      await deleteSchedule(selectedSchedule.id, profile?.id);
      setMessage("Schedule was deleted successfully!");
    } catch (error) {
      console.log(error);
      setError("Failed to delete schedule. Please try again.");
    }

    setIsLoading(false);
    setShowDeleteModal(false);
  };

  const handleStartSchedule = async () => {
    if (!selectedSchedule) {
      setError("Invalid schedule selected.");
      return;
    }

    setIsLoading(true);

    try {
      await updateSchedule(
        { id: selectedSchedule.id, status: "Ongoing" },
        false,
        profile?.id
      );

      if (selectedSchedule.requestId !== "None") {
        const requestData = await fetchRequestById(selectedSchedule.requestId);
        await updateRequest(
          { ...requestData, id: selectedSchedule.requestId },
          "Ongoing",
          profile?.id
        );
      }

      const unitIds = Array.isArray(selectedSchedule.units)
        ? selectedSchedule.units
        : [selectedSchedule.units];

      for (const unitId of unitIds) {
        const unitData = await fetchUnitById(unitId);
        if (!unitData) {
          throw new Error(`Asset not found: ${unitId}`);
        }

        const updatedAsset = {
          ...unitData,
          status: "In Repair",
        };

        await updateUnit(updatedAsset, profile?.id);
        await updateUserStatus("In Operation", profile.id);
      }

      setSelectedSchedule((prev) => ({ ...prev, status: "Ongoing" }));
      setMessage("Schedule started successfully!");
    } catch (error) {
      console.error("Error starting schedule:", error);
      setError("Failed to start schedule. Please try again.");
    }
    setIsLoading(false);
  };

  const handleCompleteSchedule = async () => {
    if (!selectedSchedule) {
      setError("Invalid schedule selected.");
      return;
    }

    setIsLoading(true);

    try {
      await updateSchedule(
        { id: selectedSchedule.id, status: "Completion Requested" },
        false,
        profile?.id
      );

      const unitIds = Array.isArray(selectedSchedule.units)
        ? selectedSchedule.units
        : [selectedSchedule.units];

      for (const assetId of unitIds) {
        const assetData = await fetchUnitById(assetId);
        if (!assetData) {
          throw new Error(`Asset not found: ${assetId}`);
        }

        const updatedAsset = {
          ...assetData,
          status: "Under Investigation",
        };

        await updateUnit(updatedAsset, profile?.id);
        await updateUserStatus("Available", profile.id);
      }

      setMessage("Completion requested successfully!");
    } catch (error) {
      console.error("Error complete schedule:", error);
      setError(
        "Failed to request for completion of the schedule. Please try again."
      );
    }
    setIsLoading(false);
  };

  const handleApproveCompletion = async () => {
    if (!selectedSchedule) {
      setError("Invalid schedule selected.");
      return;
    }

    setIsLoading(true);

    try {
      await updateSchedule(
        { id: selectedSchedule.id, status: "Completed" },
        true,
        profile?.id
      );

      if (selectedSchedule.requestId !== "None") {
        const requestData = await fetchRequestById(selectedSchedule.requestId);
        await updateRequest(
          { ...requestData, id: selectedSchedule.requestId },
          "Completed",
          profile?.id
        );
      }

      const unitIds = Array.isArray(selectedSchedule.units)
        ? selectedSchedule.units
        : [selectedSchedule.units];

      for (const assetId of unitIds) {
        const assetData = await fetchUnitById(assetId);
        if (!assetData) {
          throw new Error(`Asset not found: ${assetId}`);
        }

        const updatedAsset = {
          ...assetData,
          status: "Active",
        };

        await updateUnit(updatedAsset, profile?.id);
      }

      setSelectedSchedule((prev) => ({ ...prev, status: "Completed" }));
      setMessage("Schedule completed successfully!");
    } catch (error) {
      console.error("Error complete schedule:", error);
      setError("Failed to complete schedule. Please try again.");
    }
    setIsLoading(false);
  };

  const handleStatusChange = async (e) => {
    setSelectedSchedule({ ...selectedSchedule, status: e.target.value });
    setIsEditing(true);
  };

  const handleChange = (e) => {
    setIsLastSchedule(e.target.checked);
  };

  const formatDatetimeLocal = (date) => {
    if (!date) return "";

    const d = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(d.getTime())) return "";

    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const handleAddTechnician = () => {
    if (!selectedTechnicianId) return;

    if (assignedTechnicians.find((t) => t.id === selectedTechnicianId)) {
      setError("Technician already assigned.");
      return;
    }

    const name = technicians[selectedTechnicianId];
    setAssignedTechnicians([
      ...assignedTechnicians,
      { id: selectedTechnicianId, name },
    ]);
    setSelectedTechnicianId("");
  };

  const handleRemoveTechnician = (idToRemove) => {
    setAssignedTechnicians(
      assignedTechnicians.filter((t) => t.id !== idToRemove)
    );
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

  if (!selectedSchedule) {
    return <div>Loading...</div>;
  }

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
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft
              className="cursor-pointer hover:text-gray-300 transition"
              onClick={onClose}
            />
            <h3 className="text-lg font-semibold">Schedule Details</h3>
            {isSysAdminOrMaintenanceHead &&
              selectedSchedule.status === "Completion Requested" && (
                <button
                  className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2"
                  onClick={() => setShowApproveModal(true)}
                  title="Confirm Completion"
                >
                  <FiThumbsUp />
                  <span className="hidden lg:inline">Confirm Completion</span>
                </button>
              )}
          </div>
          <div className="flex items-center gap-2">
            {isSysAdminOrMaintenanceHead &&
              selectedSchedule.maintenanceType === "Preventive" &&
              initialStatus !== "Completed" && (
                <label className="last-schedule-checkbox">
                  <input
                    type="checkbox"
                    checked={isLastSchedule}
                    onChange={handleChange}
                  />
                  <span>Last schedule</span>
                </label>
              )}

            {isSysAdminOrMaintenanceHead && (
              <button
                className="text-gray-200 hover:text-gray-300 px-5 py-3 md:py-2 rounded  bg-red-600 hover:bg-red-500  transition flex items-center gap-2"
                onClick={() => setShowDeleteModal(true)}
                title="Delete Asset"
              >
                <FiTrash />
                <span className="hidden md:inline">Delete</span>
              </button>
            )}

            {isSysAdminOrMaintenanceHead ? (
              <button
                className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                onClick={showUpdateMessage}
                title="Save Changes"
              >
                <FiCheckSquare />
                <span className="hidden lg:inline">Save Changes</span>
              </button>
            ) : selectedSchedule.status === "Pending" ? (
              <button
                className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                onClick={() => setShowStartModal(true)}
                title="Start"
              >
                <FiCheckSquare />
                <span className="hidden lg:inline">Start</span>
              </button>
            ) : selectedSchedule.status === "Ongoing" ? (
              <button
                className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                onClick={() => setShowCompleteModal(true)}
                title="Complete"
              >
                <FiCheckSquare />
                <span className="hidden lg:inline">Complete</span>
              </button>
            ) : selectedSchedule.status === "Completion Requested" ? (
              <div className="flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold text-green-500">
                <FiMail />
                <span className="hidden md:inline">Completion Requested</span>
              </div>
            ) : selectedSchedule.status === "Completed" ? (
              <div className="flex items-center gap-2 px-5 py-2 rounded bg-gray-700 font-bold text-green-500">
                <FiCheckSquare />
                <span className="hidden md:inline">Completed</span>
              </div>
            ) : null}
          </div>
        </div>

        {showDeleteModal && (
          <ConfirmModal
            message="Are you sure you want to delete this schedule?"
            onConfirm={handleDeleteSchedule}
            onCancel={() => setShowDeleteModal(false)}
          />
        )}

        {showUpdateModal && (
          <ConfirmModal
            message={confirmUpdateMessage}
            onConfirm={handleUpdateSchedule}
            onCancel={() => setShowUpdateModal(false)}
          />
        )}

        {showStartModal && (
          <ConfirmModal
            message={`Start schedule '${selectedSchedule.title}'?`}
            onConfirm={handleStartSchedule}
            onCancel={() => setShowStartModal(false)}
          />
        )}

        {showCompleteModal && (
          <ConfirmModal
            message={`Request schedule '${selectedSchedule.title}' for Compeltion?`}
            onConfirm={handleCompleteSchedule}
            onCancel={() => setShowCompleteModal(false)}
          />
        )}

        {showApproveModal && (
          <ConfirmModal
            message={`Mark schedule '${selectedSchedule.title}' as Completed?`}
            onConfirm={handleApproveCompletion}
            onCancel={() => setShowApproveModal(false)}
          />
        )}

        {isLoading && <SpinnerOverlay logo="A" />}

        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />
        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          {currentStep === 1 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Asset:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={
                      Array.isArray(scheduleDetails.units)
                        ? scheduleDetails.units
                            .map((unit) => assetMap[getUnitsAssetId(unit)])
                            .filter(Boolean)
                            .join(", ")
                        : assetMap[getUnitsAssetId(scheduleDetails.units)] || ""
                    }
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Units:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={
                      Array.isArray(selectedSchedule.units)
                        ? selectedSchedule.units
                            .map((id) => getUnitsNumber(id))
                            .join(", ")
                        : getUnitsNumber(selectedSchedule.units)
                    }
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={
                      Array.isArray(scheduleDetails.units)
                        ? [
                            ...new Set(
                              scheduleDetails.units
                                .map(
                                  (unit) =>
                                    departmentMap[getUnitsDepartment(unit)]
                                )
                                .filter(Boolean)
                            ),
                          ].join(", ")
                        : departmentMap[
                            getUnitsDepartment(scheduleDetails.units)
                          ] || ""
                    }
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={selectedSchedule.description}
                    onChange={(e) =>
                      setSelectedSchedule({
                        ...selectedSchedule,
                        description: e.target.value,
                      })
                    }
                    readOnly={isViewer}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Type:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={selectedSchedule.maintenanceType}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority Level:
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={scoreToLabelMap[selectedSchedule.priorityScore]}
                    onChange={(e) =>
                      setSelectedSchedule({
                        ...selectedSchedule,
                        priorityScore: labelToScoreMap[e.target.value],
                      })
                    }
                    style={{ pointerEvents: isViewer ? "none" : "auto" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status:
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedSchedule.status}
                    onChange={handleStatusChange}
                    disabled={
                      !isEditing &&
                      (selectedSchedule.status === "Completed" ||
                        selectedSchedule.status === "Cancelled")
                    }
                  >
                    <option value="Pending">Pending</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Date:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="datetime-local"
                    value={
                      formatDatetimeLocal(selectedSchedule.scheduledDate) || ""
                    }
                    onChange={(e) =>
                      setSelectedSchedule({
                        ...selectedSchedule,
                        scheduledDate: new Date(e.target.value),
                      })
                    }
                    readOnly={isViewer}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="datetime-local"
                    value={formatDatetimeLocal(selectedSchedule.dueDate) || ""}
                    onChange={(e) =>
                      setSelectedSchedule({
                        ...selectedSchedule,
                        dueDate: new Date(e.target.value),
                      })
                    }
                    readOnly={isViewer}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Updated:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="datetime-local"
                    value={
                      formatDatetimeLocal(selectedSchedule.dateUpdated) || ""
                    }
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Date Created:
                  </label>
                  <input
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    type="datetime-local"
                    value={
                      formatDatetimeLocal(selectedSchedule.dateUpdated) || ""
                    }
                    readOnly
                  />
                </div>
                {selectedSchedule.dateCompleted !== "" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Date Completed:
                    </label>
                    <input
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      type="text"
                      value={
                        selectedSchedule.dateCompleted
                          .toDate()
                          .toLocaleString() || ""
                      }
                      readOnly
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <h3 className="font-medium text-gray-800 mb-2">
                  Assigned Technician:
                </h3>
                {isSysAdminOrMaintenanceHead && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <select
                      className="md:col-span-2 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                    >
                      <option value="">Select Technician</option>
                      {Object.entries(technicians).map(([id, fullName]) => (
                        <option key={id} value={id}>
                          {fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
                      type="button"
                      onClick={handleAddTechnician}
                    >
                      Add
                    </button>
                  </div>
                )}
                {assignedTechnicians.length > 0 && (
                  <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {assignedTechnicians.map((tech) => (
                      <li
                        className="flex justify-between items-center"
                        key={tech.id}
                      >
                        <span>{getUserFullName(tech.id)}</span>
                        {isSysAdminOrMaintenanceHead && (
                          <button
                            type="button"
                            className="text-red-600 hover:underline text-xs"
                            onClick={() => handleRemoveTechnician(tech.id)}
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        {/* Footer (pagination/submit) */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-lg flex-shrink-0">
          {currentStep === 1 && (
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 transition"
            >
              Next
            </button>
          )}
          {currentStep === 2 && (
            <>
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-400 transition"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaintenanceScheduleDetails;
