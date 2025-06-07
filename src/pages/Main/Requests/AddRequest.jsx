import { useState, useEffect } from "react";
import { addRequest } from "../../../firebase/requestservices";
import { useAuth } from "../../../context/AuthContext";
import { updateAsset, fetchAssetById } from "../../../firebase/assetservices";
import { fetchTitleById } from "../../../firebase/usertitleservices";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";

const AddRequest = ({ assetId, onClose }) => {
    const [requestType, setRequestType] = useState("");
    const [description, setDescription] = useState("");
    const [reportedAsset, setReportedAsset] = useState({});
    const [urgency, setUrgency] = useState(0);
    const [impact, setImpact] = useState(0);
    const [status, setStatus] = useState("");
    const { profile } = useAuth();
    const [enrichedProfile, setEnrichedProfile] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [loadingAsset, setLoadingAsset] = useState(true);

    useEffect(() => {
        const loadAsset = async () => {
            try {
                const asset = await fetchAssetById(assetId);
                setReportedAsset(asset);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingAsset(false);
            }
        };

        if (assetId) {
            loadAsset();
        }
    }, [assetId]);

    useEffect(() => {
        const loadUserProfile = async () => {
            try {
                let titleInfo = { name: "", score: 0 };
                if (profile?.title) {
                    titleInfo = await fetchTitleById(profile.title);
                }

                setEnrichedProfile({
                    ...profile,
                    titleName: titleInfo.name,
                    titleScore: titleInfo.score,
                });
            } catch (error) {
                console.error("Failed to load user profile:", error);
            }
        };

        if (profile) {
            loadUserProfile();
        }
    }, [profile]);

    const handleAddRequest = async () => {
        if (!requestType || !description.trim() || !reportedAsset) {
            alert("All fields are required!");
            return;
        }

        if (requestType === "Maintenance Request") {
            if (!urgency || !impact) {
                alert("All fields are required!");
                return;
            }
        } else if (requestType === "Asset Update Request") {
            if (!status) {
                alert("All fields are required!");
                return;
            }
        }

        try {
            const priorityScore = calculatePriorityScore({ titleScore: enrichedProfile?.titleScore || 0, urgency: parseInt(urgency), impact: parseInt(impact) })
            const reportedBy = enrichedProfile?.id || "";
            let assetStatus = status;
            if (requestType === "Maintenance Request") assetStatus = "In Repair";

            const assetData = reportedAsset;

            await addRequest(requestType, reportedAsset.id, description, priorityScore, reportedBy, assetStatus);

            const updatedAsset = {
                ...assetData,
                status: "Under Investigation",
            };

            await updateAsset(updatedAsset);

            alert("Request was added successfully!");

            setRequestType("");
            setDescription("");
            onClose();

        } catch (error) {
            console.error("Error adding request:", error);
            alert("Failed to add request. Please try again.");
        }
    };

    function calculatePriorityScore({ titleScore, urgency, impact }) {
        const weightTitle = 0.5;
        const weightUrgency = 0.3;
        const weightImpact = 0.2;

        const normalizedTitle = Math.min(Math.max(titleScore, 0), 100);
        const normalizedUrgency = Math.min(Math.max(urgency, 0), 100);
        const normalizedImpact = Math.min(Math.max(impact, 0), 100);

        const score = (
            (normalizedTitle * weightTitle) +
            (normalizedUrgency * weightUrgency) +
            (normalizedImpact * weightImpact)
        );
        console.log(score);
        return Math.round(score);
    }

    useEffect(() => {
        const status = reportedAsset.status?.toLowerCase();
        if (["under investigation", "in repair", "broken", "disposed"].includes(status)) {
            setRequestType("Asset Update Request");
            setMessage(`Asset is already reported and ${status}.`);
        } else {
            setRequestType("Maintenance Request");
        }
    }, [reportedAsset]);

    const clearMessages = () => {
        setError("");
        setMessage("");
        onClose();
    };

    if (loadingAsset) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            {(["Under Investigation", "In Repair", "Broken", "Disposed"].includes(reportedAsset.status)  && profile.role === "Reporter") ? (
                <MessageModal error={error} message={message} clearMessages={clearMessages} />
            ) : (
                <div className="modal-backdrop" onClick={onClose}>
                    <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-header-left">
                                <FiArrowLeft className="back-btn" onClick={onClose} />
                                <h3>{requestType === "Maintenance Request" ? "Report Issue" : "Update Asset Condition"}</h3>
                            </div>
                        </div>

                        <div className="record-form">
                            <div className="record-form-group">
                                <label>Reported Asset</label>
                                <input type="text" placeholder="Scan QR Code" value={reportedAsset.name || ''} readOnly />
                                <label>Description</label>
                                <input type="text" placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
                                {requestType === "Maintenance Request" && (
                                    <>
                                        <label>How urgent is the issue?</label>
                                        <select value={urgency} onChange={(e) => setUrgency(parseInt(e.target.value))} required>
                                            <option value="">Select urgency level</option>
                                            <option value="24">Minor – Doesn't affect usage</option>
                                            <option value="49">Moderate – Affects performance</option>
                                            <option value="74">Major – Prevents normal use</option>
                                            <option value="100">Urgent – Needs immediate attention</option>
                                        </select>
                                        <label>Who is affected?</label>
                                        <select value={impact} onChange={(e) => setImpact(parseInt(e.target.value))} required>
                                            <option value="">Select who is affected</option>
                                            <option value="24">Only me</option>
                                            <option value="49">A small group (e.g. my team)</option>
                                            <option value="74">A department or building</option>
                                            <option value="100">The entire campus</option>
                                        </select>
                                    </>
                                )}
                                {requestType == "Asset Update Request" && (
                                    <>
                                        <label>Status</label>
                                        <select value={status} onChange={(e) => setStatus(e.target.value)} required>
                                            <option value="">Select Status</option>
                                            <option value="Active">Active</option>
                                            <option value="In Use">In Use</option>
                                            <option value="Under Investigation">Under Investigation</option>
                                            <option value="In Repair">In Repair</option>
                                            <option value="Borrowed">Borrowed</option>
                                            <option value="Broken">Broken</option>
                                            <option value="Disposed">Disposed</option>
                                        </select>
                                    </>
                                )}
                            </div>
                            <button className="add-btn" onClick={handleAddRequest}>Add Request</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AddRequest;