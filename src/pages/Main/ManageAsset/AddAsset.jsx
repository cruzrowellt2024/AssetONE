import { useState, useEffect } from "react";
import { addAsset } from "../../../firebase/assetservices";
import { fetchCategories } from "../../../firebase/categoryservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchLocations } from "../../../firebase/locationservices";
import { fetchVendors } from "../../../firebase/vendorservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";

const AddAsset = ({ onClose }) => {
    const [asset, setAsset] = useState({
        name: "",
        description: "",
        dateAcquired: "",
        cost: "",
        status: "",
        condition: "",
        specs: [],
        category: "",
        department: "",
        location: "",
        vendor: "",
    });
    const [categories, setCategories] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [locations, setLocations] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [specKey, setSpecKey] = useState("");
    const [specValue, setSpecValue] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const { profile } = useAuth();
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadDropdownData(fetchCategories, setCategories);
        loadDropdownData(fetchDepartments, setDepartments);
        loadDropdownData(fetchLocations, setLocations);
        loadDropdownData(fetchVendors, setVendors);
    }, []);

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
            const updatedSpecs = [...asset.specs];
            updatedSpecs[editingIndex] = { key: specKey, value: specValue };
            setAsset(prev => ({ ...prev, specs: updatedSpecs }));
            setEditingIndex(null);
        } else {
            setAsset(prev => ({ ...prev, specs: [...prev.specs, { key: specKey, value: specValue }] }));
        }

        setSpecKey("");
        setSpecValue("");
    };

    const handleEditSpec = (index) => {
        setSpecKey(asset.specs[index].key);
        setSpecValue(asset.specs[index].value);
        setEditingIndex(index);
    };

    const handleDeleteSpec = (index) => {
        setAsset(prev => ({ ...prev, specs: prev.specs.filter((_, i) => i !== index) }));
    };

    const handleAddAsset = async () => {
        const hasEmptyField = [
            asset.name,
            asset.description,
            asset.dateAcquired,
            asset.category,
            asset.department,
            asset.location,
            asset.vendor,
            asset.status,
            asset.condition,
        ].some(field => !field.trim());

        const isCostValid = asset.cost !== "" && !isNaN(Number(asset.cost));
        const hasEmptySpecs = asset.specs.length === 0;

        if (hasEmptyField || !isCostValid || hasEmptySpecs) {
            setError("All fields are required, and at least one specification must be added.");
            return;
        }

        setIsLoading(true);

        try {
            const parsedCost = Number(asset.cost);
            await addAsset({
                ...asset,
                parsedCost
            }, profile?.id);

            setMessage("Asset was added successfully!");
            setAsset({
                name: "",
                description: "",
                dateAcquired: "",
                cost: "",
                status: "",
                condition: "",
                specs: [],
                category: "",
                department: "",
                location: "",
                vendor: "",
            });
            setSpecKey("");
            setSpecValue("");
            setEditingIndex(null);
            setCurrentStep(1);
            setIsLoading(false);
        } catch (error) {
            console.error("Error adding asset:", error);
            setError("Failed to add asset. Please try again.");
            setIsLoading(false);
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const clearMessages = () => {
        setError("");
        setMessage("");
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
                        <h3>Add Asset</h3>
                    </div>
                </div>

                <MessageModal error={error} message={message} clearMessages={clearMessages} />
                <div className="record-form">
                    {currentStep === 1 && (
                        <div className="record-form-group">
                            <label>Asset Name</label>
                            <input type="text" value={asset.name} onChange={(e) => setAsset({ ...asset, name: e.target.value })} />
                            <label>Description</label>
                            <input type="text" value={asset.description} onChange={(e) => setAsset({ ...asset, description: e.target.value })} />
                            <label>Acquisition Date</label>
                            <input type="date" value={asset.dateAcquired} onChange={(e) => setAsset({ ...asset, dateAcquired: e.target.value })} />
                            <label>Cost</label>
                            <input type="number" value={asset.cost} onChange={(e) => setAsset({ ...asset, cost: e.target.value })} />
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div className="record-form-group">
                            <label>Category</label>
                            <select value={asset.category} onChange={(e) => setAsset({ ...asset, category: e.target.value })}>
                                <option value="">Select Category</option>
                                {Object.entries(categories).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Department</label>
                            <select value={asset.department} onChange={(e) => setAsset({ ...asset, department: e.target.value })}>
                                <option value="">Select Department</option>
                                {Object.entries(departments).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Location</label>
                            <select value={asset.location} onChange={(e) => setAsset({ ...asset, location: e.target.value })}>
                                <option value="">Select Location</option>
                                {Object.entries(locations).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Vendor</label>
                            <select value={asset.vendor} onChange={(e) => setAsset({ ...asset, vendor: e.target.value })}>
                                <option value="">Select Vendor</option>
                                {Object.entries(vendors).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>

                            <label>Status</label>
                            <select value={asset.status} onChange={(e) => setAsset({ ...asset, status: e.target.value })}>
                                <option value="">Select Status</option>
                                <option value="Active">Active</option>
                                <option value="In Use">In Use</option>
                                <option value="Under Investigation">Under Investigation</option>
                                <option value="In Repair">In Repair</option>
                                <option value="Borrowed">Borrowed</option>
                                <option value="Broken">Broken</option>
                                <option value="Disposed">Disposed</option>
                            </select>

                            <label>Condition</label>
                            <select value={asset.condition} onChange={(e) => setAsset({ ...asset, condition: e.target.value })}>
                                <option value="">Select Condition</option>
                                <option value="Excellent">Excellent</option>
                                <option value="Good">Good</option>
                                <option value="Fair">Fair</option>
                                <option value="Poor">Poor</option>
                                <option value="Unserviceable">Unserviceable</option>
                            </select>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="record-form-group" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <h3 style={{ gridColumn: "span 3" }}>Specifications</h3>
                            <input type="text" placeholder="Spec Name" value={specKey} onChange={(e) => setSpecKey(e.target.value)} />
                            <input type="text" placeholder="Spec Value" value={specValue} onChange={(e) => setSpecValue(e.target.value)} />
                            <button className="add-btn" onClick={handleAddSpec}>{editingIndex !== null ? "Update Spec" : "Add Spec"}</button>

                            <ul className="record-list" style={{ gridColumn: "span 3" }}>
                                {asset.specs.map((spec, index) => (
                                    <li key={index}>
                                        {spec.key}: {spec.value}
                                        <button className="pagination-button" onClick={() => handleEditSpec(index)}>Edit</button>
                                        <button className="delete-btn" onClick={() => handleDeleteSpec(index)}>Delete</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="pagination-buttons">
                        {currentStep > 1 && <button className="pagination-button" onClick={prevStep}>Back</button>}
                        {currentStep < 3 && <button className="pagination-button" onClick={nextStep}>Next</button>}
                        {currentStep === 3 && <button className="pagination-button" onClick={handleAddAsset}>Submit</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddAsset;