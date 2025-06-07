import { useState, useEffect } from "react";
import { updateSchedule, deleteSchedule, addSchedule } from "../../../firebase/maintenancescheduleservices";
import { fetchAssetById, fetchAssets, updateAsset } from "../../../firebase/assetservices";
import { fetchUsers } from "../../../firebase/userservices";
import { useAuth } from "../../../context/AuthContext";
import { FiThumbsUp, FiArrowLeft, FiCheckSquare, FiTrash } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import { fetchRequestById, updateRequest } from "../../../firebase/requestservices";

const MaintenanceScheduleDetails = ({ scheduleDetails, onClose }) => {
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [assets, setAssets] = useState([]);
    const [assetMap, setAssetMap] = useState({});
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
        "Low": 24,
        "Medium": 49,
        "High": 74,
        "Critical": 100,
    };
    const { profile } = useAuth();
    const isViewer = profile?.role === "Technician" || profile?.role === "Reporter";
    const isAdminOrDeptHead = profile?.role === "Admin" || profile?.role === "Department Manager";

    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (scheduleDetails) {
            setSelectedSchedule(scheduleDetails);
            setInitialStatus(scheduleDetails.status);
            if (scheduleDetails.assignedTechnicians && scheduleDetails.assignedTechnicians.length > 0) {
                const assignedTechs = scheduleDetails.assignedTechnicians.map((technicianId) => {
                    const name = technicians[technicianId];
                    return { id: technicianId, name };
                });
                setAssignedTechnicians(assignedTechs);
            }
        }
        getAssets();
    }, [scheduleDetails, technicians]);

    useEffect(() => {
        loadDropdownData(fetchUsers, setTechnicians);
    }, []);

    const loadDropdownData = async (fetchFn, setFn) => {
        try {
            const data = await fetchFn();
            const techniciansOnly = data.filter(user => user.role === 'Technician');

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

    const getAssets = async () => {
        try {
            const assetData = await fetchAssets();
            setAssets(assetData || []);
            const assetLookup = assetData.reduce((map, asset) => {
                map[asset.id] = asset.name;
                return map;
            }, {});
            setAssetMap(assetLookup);
        } catch (error) {
            console.error("Error fetching schedules:", error);
        }
    };

    const handleUpdateSchedule = async () => {
        if (!selectedSchedule) return;

        const updatedSchedule = {
            ...selectedSchedule,
            assignedTechnicians: assignedTechnicians.map(t => t.id),
        };

        const isCompleted = selectedSchedule.status === "Completed";
        const maintenanceType = selectedSchedule.maintenanceType;

        setIsLoading(true);

        try {
            await updateSchedule(updatedSchedule, isCompleted, profile?.id);

            if (isCompleted && maintenanceType === "Preventive" && !isLastSchedule) {
                const currentNextSchedule = selectedSchedule.nextSchedule instanceof Date
                    ? selectedSchedule.nextSchedule
                    : selectedSchedule.nextSchedule.toDate ? selectedSchedule.nextSchedule.toDate() : new Date(selectedSchedule.nextSchedule);

                currentNextSchedule.setDate(currentNextSchedule.getDate() + selectedSchedule.frequency);

                const { id, ...scheduleWithoutId } = updatedSchedule;

                await addSchedule({
                    ...scheduleWithoutId,
                    scheduledDate: selectedSchedule.nextSchedule,
                    nextSchedule: currentNextSchedule,
                    status: "Pending",
                    dateCompleted: "",
                }, profile?.id);
            }

            if (selectedSchedule.requestId !== "None" && selectedSchedule.status !== "Pending") {
                const requestData = await fetchRequestById(selectedSchedule.requestId);
                await updateRequest({ ...requestData, id: selectedSchedule.requestId }, selectedSchedule.status, profile?.id);
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

        const confirmMessage = isCompleted && maintenanceType === "Preventive"
            ? `Are you sure you want to mark '${selectedSchedule.title}' as completed? Once completed, this schedule cannot be modified due to strict compliance requirements.`
            : `Are you sure you want to update ${selectedSchedule.title}?`;

        setConfirmUpdateMessage(confirmMessage);
        setShowUpdateModal(true);
    }

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
                await updateRequest({ ...requestData, id: selectedSchedule.requestId }, "Ongoing", profile?.id);
            }

            const assetIds = Array.isArray(selectedSchedule.assets)
                ? selectedSchedule.assets
                : [selectedSchedule.assets];

            for (const assetId of assetIds) {
                const assetData = await fetchAssetById(assetId);
                if (!assetData) {
                    throw new Error(`Asset not found: ${assetId}`);
                }

                const updatedAsset = {
                    ...assetData,
                    status: "In Repair",
                };

                await updateAsset(updatedAsset, profile?.id);
            }

            setSelectedSchedule(prev => ({ ...prev, status: "Ongoing" }));
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

            const assetIds = Array.isArray(selectedSchedule.assets)
                ? selectedSchedule.assets
                : [selectedSchedule.assets];

            for (const assetId of assetIds) {
                const assetData = await fetchAssetById(assetId);
                if (!assetData) {
                    throw new Error(`Asset not found: ${assetId}`);
                }

                const updatedAsset = {
                    ...assetData,
                    status: "Under Investigation",
                };

                await updateAsset(updatedAsset, profile?.id);
            }

            setMessage("Completion requested successfully!");
        } catch (error) {
            console.error("Error complete schedule:", error);
            setError("Failed to request for completion of the schedule. Please try again.");
        }
        setIsLoading(false);
    }

    const handleApproveCompletion = async () => {
        if (!selectedSchedule) {
            setError("Invalid schedule selected.");
            return;
        }

        setIsLoading(true);

        try {
            await updateSchedule(
                { id: selectedSchedule.id, status: "Completed"},
                true,
                profile?.id
            );

            if (selectedSchedule.requestId !== "None") {
                const requestData = await fetchRequestById(selectedSchedule.requestId);
                await updateRequest({ ...requestData, id: selectedSchedule.requestId }, "Completed", profile?.id);
            }

            const assetIds = Array.isArray(selectedSchedule.assets)
                ? selectedSchedule.assets
                : [selectedSchedule.assets];

            for (const assetId of assetIds) {
                const assetData = await fetchAssetById(assetId);
                if (!assetData) {
                    throw new Error(`Asset not found: ${assetId}`);
                }

                const updatedAsset = {
                    ...assetData,
                    status: "Active",
                };

                await updateAsset(updatedAsset, profile?.id);
            }

            setSelectedSchedule(prev => ({ ...prev, status: "Completed" }));
            setMessage("Schedule completed successfully!");
        } catch (error) {
            console.error("Error complete schedule:", error);
            setError("Failed to complete schedule. Please try again.");
        }
        setIsLoading(false);
    }

    const handleStatusChange = async (e) => {
        setSelectedSchedule({ ...selectedSchedule, status: e.target.value });
        setIsEditing(true);
    }

    const handleChange = (e) => {
        setIsLastSchedule(e.target.checked);
    };

    const formatDatetimeLocal = (date) => {
        if (!date) return "";

        const d = date.toDate ? date.toDate() : new Date(date);
        if (isNaN(d.getTime())) return "";

        const pad = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const handleAddTechnician = () => {
        if (!selectedTechnicianId) return;

        if (assignedTechnicians.find(t => t.id === selectedTechnicianId)) {
            setError("Technician already assigned.");
            return;
        }

        const name = technicians[selectedTechnicianId];
        setAssignedTechnicians([...assignedTechnicians, { id: selectedTechnicianId, name }]);
        setSelectedTechnicianId("");
    };

    const handleRemoveTechnician = (idToRemove) => {
        setAssignedTechnicians(assignedTechnicians.filter(t => t.id !== idToRemove));
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const clearMessages = () => {
        setError("");
        setMessage("");
        onClose();
    };

    if (!selectedSchedule) {
        return <div>Loading...</div>;
    }

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div>
                    <div className="modal-header">
                        <div className="modal-header-left">
                            <FiArrowLeft className="back-btn" onClick={onClose} />
                            <h3>Schedule Details</h3>
                            {isAdminOrDeptHead && selectedSchedule.status === "Completion Requested" && (
                                <div className="update-btn" onClick={() => setShowApproveModal(true)}>
                                    <FiThumbsUp className="btn-save-icon" />
                                    <span>Confirm Completion</span>
                                </div>
                            )}
                        </div>
                        <div className="modal-header-right">
                            {isAdminOrDeptHead && selectedSchedule.maintenanceType === "Preventive" && initialStatus !== "Completed" && (
                                <label className="last-schedule-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={isLastSchedule}
                                        onChange={handleChange}
                                    />
                                    <span>Last schedule</span>
                                </label>
                            )}

                            {isAdminOrDeptHead && (
                                <FiTrash className="delete-btn" onClick={() => setShowDeleteModal(true)} />
                            )}

                            {isAdminOrDeptHead ? (
                                <div className="update-btn" onClick={showUpdateMessage}>
                                    <FiCheckSquare className="btn-save-icon" />
                                    <span>Save Changes</span>
                                </div>
                            ) : selectedSchedule.status === "Pending" ? (
                                <div className="update-btn" onClick={() => setShowStartModal(true)}>
                                    <FiCheckSquare className="btn-save-icon" />
                                    <span>Start</span>
                                </div>
                            ) : selectedSchedule.status === "Ongoing" && (
                                <div className="update-btn" onClick={() => setShowCompleteModal(true)}>
                                    <FiCheckSquare className="btn-save-icon" />
                                    <span>Complete</span>
                                </div>
                            )}

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

                    <MessageModal error={error} message={message} clearMessages={clearMessages} />
                    <div className="record-form">
                        {currentStep === 1 && (
                            <div className="record-form-group">
                                <label>ID:</label>
                                <input type="text" value={selectedSchedule.id} readOnly />
                                <label>Assets:</label>
                                <input
                                    type="text"
                                    value={
                                        Array.isArray(selectedSchedule.assets)
                                            ? selectedSchedule.assets.map(id => assetMap[id] || id).join(", ")
                                            : assetMap[selectedSchedule.assets] || selectedSchedule.assets
                                    }
                                    readOnly
                                />
                                <label>Description:</label>
                                <input type="text" value={selectedSchedule.description} onChange={(e) => setSelectedSchedule({ ...selectedSchedule, description: e.target.value })} readOnly={isViewer} />
                                <label>Maintenance Type:</label>
                                <input type="text" value={selectedSchedule.maintenanceType} readOnly />
                                <label>Priority Level:</label>
                                <select
                                    value={scoreToLabelMap[selectedSchedule.priorityScore]}
                                    onChange={(e) =>
                                        setSelectedSchedule({
                                            ...selectedSchedule,
                                            priorityScore: labelToScoreMap[e.target.value],
                                        })
                                    }
                                    style={{ pointerEvents: isViewer ? 'none' : 'auto' }}
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                    <option value="Critical">Critical</option>
                                </select>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="record-form-group">
                                <label>Status:</label>
                                <select
                                    value={selectedSchedule.status}
                                    onChange={handleStatusChange}
                                    disabled={!isEditing && (selectedSchedule.status === "Completed" || selectedSchedule.status === "Cancelled")}
                                >
                                    <option value="Pending">Pending</option>
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Cancelled">Cancelled</option>
                                    <option value="Completed">Completed</option>
                                </select>
                                <label>Scheduled Date:</label>
                                <input type="datetime-local" value={formatDatetimeLocal(selectedSchedule.scheduledDate) || ""} onChange={(e) => setSelectedSchedule({ ...selectedSchedule, scheduledDate: new Date(e.target.value) })} readOnly={isViewer} />
                                <label>Due Date:</label>
                                <input type="datetime-local" value={formatDatetimeLocal(selectedSchedule.dueDate) || ""} onChange={(e) => setSelectedSchedule({ ...selectedSchedule, dueDate: new Date(e.target.value) })} readOnly={isViewer} />
                                <label>Date Updated:</label>
                                <input type="datetime-local" value={formatDatetimeLocal(selectedSchedule.dateUpdated) || ""} readOnly />
                                <label>Date Created:</label>
                                <input type="datetime-local" value={formatDatetimeLocal(selectedSchedule.dateUpdated) || ""} readOnly />
                                {selectedSchedule.dateCompleted !== "" && (
                                    <>
                                        <label>Date Completed:</label>
                                        <input type="text" value={selectedSchedule.dateCompleted.toDate().toLocaleString() || ""} readOnly />
                                    </>
                                )}
                            </div>
                        )}


                        {currentStep === 3 && (
                            <div className="record-form-group" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                                <label style={{ gridColumn: "span 1" }}>Assign Technician:</label>
                                {isAdminOrDeptHead && (<>
                                    <select style={{ gridColumn: "span 1" }} value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)}>
                                        <option value="">Select Technician</option>
                                        {Object.entries(technicians).map(([id, fullName]) => (
                                            <option key={id} value={id}>{fullName}</option>
                                        ))}
                                    </select>
                                    <button style={{ gridColumn: "span 1" }} type="button" className="add-btn" onClick={handleAddTechnician}>Add</button>

                                </>)}
                                {assignedTechnicians.length > 0 && (
                                    <div style={{ gridColumn: "span 3" }} className="record-list">
                                        <ul>
                                            {assignedTechnicians.map((tech) => (
                                                <li key={tech.id}>
                                                    <span>{tech.name}</span>
                                                    {isAdminOrDeptHead && (<button type="button" className="delete-btn" onClick={() => handleRemoveTechnician(tech.id)}>Remove</button>)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="pagination-controls">
                            {currentStep > 1 && <button className="pagination-button" onClick={prevStep}>Back</button>}
                            {currentStep < 3 && <button className="pagination-button" onClick={nextStep}>Next</button>}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}

export default MaintenanceScheduleDetails;