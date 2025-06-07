import { useState, useEffect, useRef } from "react";
import { updateAsset, deleteAsset, fetchSpecs, updateAssetSpecs } from "../../../firebase/assetservices";
import { fetchCategories } from "../../../firebase/categoryservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchLocations } from "../../../firebase/locationservices";
import { fetchVendors } from "../../../firebase/vendorservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft, FiCamera, FiCheckSquare, FiClock, FiTrash } from "react-icons/fi";
import { QRCodeCanvas } from "qrcode.react";
import Modal from "../../../components/Modal/Modal";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import MaintenanceHistory from "./MaintenanceHistory";
import { fetchSchedules } from "../../../firebase/maintenancescheduleservices";
import { fetchUsers } from "../../../firebase/userservices";

const AssetDetails = ({ assetDetails, onClose }) => {
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [users, setUsers] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [showQrCode, setShowQrCode] = useState(false);
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [assetSpecs, setAssetSpecs] = useState([]);
    const [specKey, setSpecKey] = useState("");
    const [specValue, setSpecValue] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const { profile } = useAuth();
    const qrRef = useRef();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    useEffect(() => {
        if (assetDetails) {
            setSelectedAsset(assetDetails);
            getSpecs(assetDetails.id);
        }
    }, [assetDetails]);

    useEffect(() => {
        loadDropdownData(fetchCategories, setCategories);
        loadDropdownData(fetchDepartments, setDepartments);
        loadDropdownData(fetchLocations, setLocations);
        loadDropdownData(fetchVendors, setVendors);
    }, []);

    useEffect(() => {
        const loadSchedules = async () => {
            if (!selectedAsset?.id) return;

            try {
                const allSchedules = await fetchSchedules();

                const filtered = allSchedules.filter(schedule => {
                    const assetField = schedule.assets;
                    if (!assetField) return false;

                    if (Array.isArray(assetField)) {
                        return assetField.includes(selectedAsset.id);
                    }

                    return assetField === selectedAsset.id;
                });

                setSchedules(filtered);
            } catch (error) {
                console.error("Error loading schedules:", error);
                setSchedules([]);
            }
        };

        loadSchedules();
        getUsers();
    }, [selectedAsset]);

    const getSpecs = async (assetID) => {
        try {
            const assetData = await fetchSpecs(assetID);
            setAssetSpecs(assetData || []);
        } catch (error) {
            console.error("Error fetching asset specs:", error);
            setAssetSpecs([]);
        }
    };

    const getUsers = async () => {
        try {
            const userData = await fetchUsers();
            setUsers(userData || []);
            console.log(userData);
        } catch (error) {
            console.error("Error fetching users:", error);
            setUsers([]);
        }
    };

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

    const handleAddSpec = () => {
        if (!specKey.trim() || !specValue.trim()) return;

        if (editingIndex !== null) {
            const updatedSpecs = [...assetSpecs];
            updatedSpecs[editingIndex] = { key: specKey, value: specValue };
            setAssetSpecs(updatedSpecs);
            setEditingIndex(null);
        } else {
            setAssetSpecs(prev => [...prev, { key: specKey, value: specValue }]);
        }

        setSpecKey("");
        setSpecValue("");
    };

    const handleEditSpec = (index) => {
        setSpecKey(assetSpecs[index].key);
        setSpecValue(assetSpecs[index].value);
        setEditingIndex(index);
    };

    const handleDeleteSpec = (index) => {
        setAssetSpecs(prev => prev.filter((_, i) => i !== index));
    };

    const handleUpdateAsset = async () => {
        if (!selectedAsset) return;

        setIsLoading(true);

        try {
            const updatedAsset = {
                ...selectedAsset,
                cost: Number(selectedAsset.cost)
            };

            await updateAsset(updatedAsset, profile?.id);
            await updateAssetSpecs(selectedAsset.id, assetSpecs, profile?.id);

            setMessage("Asset details updated successfully!");
            setIsLoading(false);

        } catch (error) {
            console.error("Error updating asset:", error);
            setError("Failed to update asset. Please try again.");
            setIsLoading(false);
        }
        setShowDeleteModal(false);
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
            setIsLoading(false);
        } catch (error) {
            setError("Failed to delete asset. Please try again.");
            setIsLoading(false);
        }
        setShowDeleteModal(false);
    };


    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleQrCode = () => {
        setShowQrCode(prevState => !prevState);
    };

    const handleDownload = () => {
        const canvas = qrRef.current.querySelector('canvas');
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${selectedAsset.name}_QR_Code.png`;
        link.click();
    };

    if (!selectedAsset) {
        return <p>Loading asset details...</p>;
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
                <div className="modal-header">
                    <div className="modal-header-left">
                        <FiArrowLeft className="back-btn" onClick={onClose} />
                        <h3>Asset Details</h3>
                        <FiClock className="qr-code-btn" onClick={() => setShowHistoryModal(true)} />
                    </div>
                    <div className="modal-header-right">
                        <FiCamera className="qr-code-btn" onClick={handleQrCode} />
                        <FiTrash className="delete-btn" onClick={() => setShowDeleteModal(true)} />
                        <div className="update-btn" onClick={() => setShowUpdateModal(true)}>
                            <span>Save Changes</span>
                            <FiCheckSquare className="btn-save-icon" />
                        </div>
                    </div>
                </div>

                {showDeleteModal && (
                    <ConfirmModal
                        message={`Are you sure you want to delete ${selectedAsset.name}?`}
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

                <MessageModal error={error} message={message} clearMessages={clearMessages} />
                <div className="record-form">
                    {currentStep === 1 && (
                        <div className="record-form-group">
                            <label>Asset ID</label>
                            <input type="text" value={selectedAsset.id || ""} readOnly />

                            <label>Asset Name</label>
                            <input
                                type="text"
                                value={selectedAsset.name || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, name: e.target.value })}
                            />

                            <label>Description</label>
                            <input
                                type="text"
                                value={selectedAsset.description || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, description: e.target.value })}
                            />

                            <label>Acquisition Date</label>
                            <input
                                type="date"
                                value={selectedAsset.dateAcquired || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, dateAcquired: e.target.value })}
                            />

                            <label>Cost</label>
                            <input
                                type="number"
                                value={selectedAsset.cost || 0}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, cost: e.target.value })}
                            />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="record-form-group">
                            <label>Category</label>
                            <select
                                value={selectedAsset?.category || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                {Object.entries(categories).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Department</label>
                            <select
                                value={selectedAsset?.department || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, department: e.target.value })}
                            >
                                <option value="">Select Department</option>
                                {Object.entries(departments).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Location</label>
                            <select
                                value={selectedAsset?.location || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, location: e.target.value })}
                            >
                                <option value="">Select Location</option>
                                {Object.entries(locations).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Vendor</label>
                            <select
                                value={selectedAsset?.vendor || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, vendor: e.target.value })}
                            >
                                <option value="">Select Vendor</option>
                                {Object.entries(vendors).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Status</label>
                            <select
                                value={selectedAsset.status || ""}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, status: e.target.value })}
                            >
                                <option value="Active">Active</option>
                                <option value="In Use">In Use</option>
                                <option value="Under Investigation">Under Investigation</option>
                                <option value="In Repair">In Repair</option>
                                <option value="Borrowed">Borrowed</option>
                                <option value="Broken">Broken</option>
                                <option value="Disposed">Disposed</option>
                            </select>

                            <label>Condition</label>
                            <select
                                value={selectedAsset.condition || "Good"}
                                onChange={(e) => setSelectedAsset({ ...selectedAsset, condition: e.target.value })}
                            >
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                                <option value="Unserviceable">Unserviceable</option>
                            </select>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="record-form-group">
                            <h3 style={{ gridColumn: "span 2" }}>Specifications</h3>
                            <div className="spec-inputs" style={{ display: "grid", gridColumn: "span 2", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", columnGap: "1rem" }}>
                                <input style={{ gridColumn: "span 2" }}
                                    type="text"
                                    placeholder="Spec Name"
                                    value={specKey}
                                    onChange={(e) => setSpecKey(e.target.value)}
                                />
                                <input style={{ gridColumn: "span 2" }}
                                    type="text"
                                    placeholder="Spec Value"
                                    value={specValue}
                                    onChange={(e) => setSpecValue(e.target.value)}
                                />
                                <button style={{ gridColumn: "span 1" }}
                                    className="add-btn"
                                    onClick={handleAddSpec}
                                >
                                    {editingIndex !== null ? "Update Spec" : "Add Spec"}
                                </button>
                            </div>

                            <ul className="record-list">
                                {assetSpecs.length > 0 ? (
                                    assetSpecs.map((spec, index) => (
                                        <li key={index}>
                                            <strong>{spec.key}:</strong> {spec.value}
                                            <div className="spec-actions">
                                                <button
                                                    className="btn-edit"
                                                    style={{ padding: "10px", backgroundColor: "#ccc", border: "none" }}
                                                    onClick={() => handleEditSpec(index)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn-delete"
                                                    style={{ padding: "10px", marginLeft: "10px", backgroundColor: "#ff6e6e", color: "#fff", border: "none" }}
                                                    onClick={() => handleDeleteSpec(index)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <p>No specifications added yet</p>
                                )}
                            </ul>
                        </div>
                    )}

                    <div className="pagination-controls">
                        {currentStep > 1 && <button className="pagination-button" onClick={prevStep}>Back</button>}
                        {currentStep < 3 && <button className="pagination-button" onClick={nextStep}>Next</button>}
                    </div>
                    {showQrCode && (
                        <Modal onClose={() => setShowQrCode(false)} title={`QR Code for ${selectedAsset.name}`}>
                            <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 0" }}>
                                <div ref={qrRef} style={{ margin: "auto" }}>
                                    <QRCodeCanvas value={selectedAsset.id} size={256} />
                                </div>
                                <button className="download-btn" onClick={handleDownload}>
                                    Download QR Code
                                </button>
                            </div>
                        </Modal>
                    )}
                    {showHistoryModal && (
                        <MaintenanceHistory
                            schedules={schedules}
                            technicians={users}
                            onClose={() => setShowHistoryModal(false)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default AssetDetails;