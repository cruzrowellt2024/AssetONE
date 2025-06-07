import { Timestamp } from "firebase/firestore";
import { useState, useEffect } from "react";
import { updateRequest } from "../../../firebase/requestservices";
import { addSchedule } from "../../../firebase/maintenancescheduleservices";
import { fetchUsers } from "../../../firebase/userservices";
import { updateAsset, fetchAssetById } from "../../../firebase/assetservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft, FiCheck, FiDelete, FiX } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";

const RequestDetails = ({ requestDetails, onClose }) => {
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { profile } = useAuth();
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [assetName, setAssetName] = useState("");
    const [isRequestApproved, setIsRequestApproved] = useState(false);
    const [technicians, setTechnicians] = useState({});
    const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
    const [assignedTechnicians, setAssignedTechnicians] = useState([]);
    const [reportedAsset, setReportedAsset] = useState({});
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [scheduleData, setScheduleData] = useState({
        assets: "",
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

    const isAdminOrDeptHead = profile?.role === "Admin" || profile?.role === "Department Manager";

    useEffect(() => {
        if (reportedAsset?.department) {
            loadDropdownData(fetchUsers, setTechnicians);
        }
    }, [reportedAsset]);

    const loadDropdownData = async (fetchFn, setFn) => {
        try {
            const data = await fetchFn();
            const techniciansOnly = data.filter(user => user.role === 'Technician' && user.department === reportedAsset.department);

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

            fetchAssetData();
        }
    }, [requestDetails]);

    const handleConfirmSchedule = async () => {
        if (!selectedRequest) return;

        if (selectedRequest.requestType === "Maintenance Request" && assignedTechnicians.length === 0) {
            setError("Please assign at least one technician before confirming.");
            return;
        }

        setIsLoading(true);

        try {
            if (selectedRequest.requestType === "Maintenance Request") {
                await addSchedule({
                    ...scheduleData,
                    assets: selectedRequest.reportedAsset,
                    title: `${assetName} Repair`,
                    description: selectedRequest.description,
                    scheduledDate: Timestamp.fromDate(new Date(scheduleData.scheduledDate)),
                    priorityScore: selectedRequest.priorityScore,
                    assignedTechnicians: assignedTechnicians.map(t => t.id),
                    dueDate: Timestamp.fromDate(new Date(scheduleData.dueDate)),
                    status: "Pending",
                    requestId: selectedRequest.id,
                }, profile?.id);

                const assetData = await fetchAssetById(selectedRequest.reportedAsset);
                if (!assetData) {
                    throw new Error("Asset not found");
                }

                const updatedAsset = {
                    ...assetData,
                    status: selectedRequest.assetStatus,
                };

                await updateAsset(updatedAsset, profile?.id);
                setMessage("Request successfully approved. Maintenance schedule was created.");
            } else {
                const assetData = await fetchAssetById(selectedRequest.reportedAsset);
                if (!assetData) {
                    throw new Error("Asset not found");
                }

                const updatedAsset = {
                    ...assetData,
                    status: selectedRequest.assetStatus,
                };

                await updateAsset(updatedAsset, profile?.id);
                setMessage("Request successfully approved. Asset status was updated.");
            }
            updateRequest(selectedRequest, "Approved", profile?.id);
            setIsLoading(false);
        } catch (error) {
            console.error("Error approving request:", error);
            setError("Failed to approve request. Please try again.");
            setIsLoading(false);
        }
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
        setShowRejectModal(false);
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

    if (!selectedRequest) {
        return <p>Loading request details...</p>;
    }

    const clearMessages = () => {
        setError("");
        setMessage("");
        onClose();
    };

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
                            <h3>{isRequestApproved ? "Assign Details for Maintenance" : "Request Details"}</h3>
                        </div>
                        <div className="modal-header-right">
                            {!["Approved", "Completed", "Ongoing"].includes(selectedRequest.status) && isAdminOrDeptHead && (
                                <>
                                    {isRequestApproved ? (
                                        <>
                                            <div className="update-btn" onClick={handleConfirmSchedule} >
                                                <FiCheck className="btn-save-icon" />
                                                <span>Confirm</span>
                                            </div>
                                            <div className="delete-btn" onClick={handleCancelApproval} >
                                                <FiDelete className="btn-save-icon" />
                                                <span>Cancel</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="update-btn" onClick={handleApproveRequest} >
                                                <FiCheck className="btn-save-icon" />
                                                <span>Approve</span>
                                            </div>
                                            <div className="delete-btn" onClick={() => setShowRejectModal(true)} >
                                                <FiX className="btn-save-icon" />
                                                <span>Reject</span>
                                            </div>
                                        </>
                                    )}
                                </>
                            )
                            }
                        </div>
                    </div>

                    {showRejectModal && (
                        <ConfirmModal
                            message="Are you sure you want to reject this request?"
                            onConfirm={handleRejectRequest}
                            onCancel={() => setShowRejectModal(false)}
                        />
                    )}

                    <MessageModal error={error} message={message} clearMessages={clearMessages} />
                    <div className="record-form">
                        <div className="record-form-group">
                            {!isRequestApproved ? (
                                <>
                                    <label>ID:</label>
                                    <input type="text" value={selectedRequest.id || ""} readOnly />
                                    <label>Reported Asset:</label>
                                    <input type="text" value={assetName || selectedRequest.reportedAsset || ""} readOnly />
                                    <label>Request Type:</label>
                                    <input type="text" value={selectedRequest.requestType || ""} readOnly />
                                    <label>Description:</label>
                                    <input type="text" value={selectedRequest.description || ""} readOnly />
                                </>
                            ) : (
                                <>
                                    <div className="record-form-group" style={{ gridTemplateColumns: "1fr 1fr 1fr", gridColumn: "span 2" }}>
                                        <label style={{ gridColumn: "span 1" }}>Assign Technician:</label>
                                        <select style={{ gridColumn: "span 1" }} value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)}>
                                            <option value="">Select Technician</option>
                                            {Object.entries(technicians).map(([id, fullName]) => (
                                                <option key={id} value={id}>{fullName}</option>
                                            ))}
                                        </select>
                                        <button className="add-btn" style={{ border: "none", borderRadius: "8px", color: "#fff", fontSize: "1rem" }} onClick={handleAddTechnician}>Add</button>
                                    </div>

                                    {assignedTechnicians.length > 0 && (
                                        <div className="record-list" style={{ gridColumn: "span 2" }}>
                                            <ul>
                                                {assignedTechnicians.map((tech) => (
                                                    <li key={tech.id}>
                                                        <span>{tech.name}</span>
                                                        <button type="button" className="delete-btn" style={{ borderRadius: "5px", padding: "1rem" }} onClick={() => handleRemoveTechnician(tech.id)}>Remove</button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <label>Scheduled Date:</label>
                                    <input
                                        type="datetime-local"
                                        name="scheduledDate"
                                        value={scheduleData.scheduledDate || ""}
                                        onChange={(e) => {
                                            setScheduleData(prev => ({
                                                ...prev,
                                                scheduledDate: e.target.value
                                            }));
                                        }}
                                    />
                                    <label>Due Date:</label>
                                    <input
                                        type="datetime-local"
                                        name="dueDate"
                                        value={scheduleData.dueDate || ""}
                                        onChange={(e) => {
                                            setScheduleData(prev => ({
                                                ...prev,
                                                dueDate: e.target.value
                                            }));
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestDetails;