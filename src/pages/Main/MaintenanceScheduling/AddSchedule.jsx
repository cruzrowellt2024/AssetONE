import { useState, useEffect } from "react";
import { addSchedule } from "../../../firebase/maintenancescheduleservices";
import { fetchAssets } from "../../../firebase/assetservices";
import { Timestamp } from "firebase/firestore";
import { fetchUsers } from "../../../firebase/userservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import { fetchDepartments } from "../../../firebase/departmentservices";
import MessageModal from "../../../components/Modal/MessageModal";

const AddSchedule = ({ onClose }) => {
    const [technicians, setTechnicians] = useState({});
    const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
    const [assignedTechnicians, setAssignedTechnicians] = useState([]);
    const [scheduleData, setScheduleData] = useState({
        assets: [],
        title: "",
        description: "",
        scheduledDate: "",
        maintenanceType: "",
        frequency: "",
        nextSchedule: "",
        priorityScore: null,
        status: "Pending",
        requestId: "None",
        dueDate: null
    });
    const [assets, setAssets] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [scheduleDepartment, setScheduleDepartment] = useState("");
    const [selectedAssetId, setSelectedAssetId] = useState("");
    const { profile } = useAuth();
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAddAsset = () => {
        if (!selectedAssetId) return;

        if (scheduleData.assets.find(asset => asset.id === selectedAssetId)) {
            setError("Asset already selected.");
            return;
        }

        if (scheduleData.maintenanceType === "Corrective" && scheduleData.assets.length >= 1) {
            setError("Only one asset can be selected for corrective maintenance.");
            return;
        }

        const asset = assets.find(a => a.id === selectedAssetId);
        if (!asset) return;

        setScheduleData(prev => ({
            ...prev,
            assets: [...prev.assets, { id: asset.id, name: asset.name }]
        }));
        setSelectedAssetId("");
    };

    const handleRemoveAsset = (idToRemove) => {
        setScheduleData(prev => ({
            ...prev,
            assets: prev.assets.filter(a => a.id !== idToRemove)
        }));
    };


    useEffect(() => {
        loadDropdownData(fetchDepartments, setDepartments);
    }, []);

    useEffect(() => {
        if (scheduleDepartment || profile?.department) {
            loadTechnicianDropdownData(fetchUsers, setTechnicians);
        }
    }, [scheduleDepartment, profile?.department]);

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

    const loadTechnicianDropdownData = async (fetchFn, setFn) => {
        try {
            const data = await fetchFn();
            const techniciansOnly = data.filter(user => user.role === 'Technician' && (user.department === scheduleDepartment || user.department === profile?.department));

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
            const departmentId = scheduleDepartment || profile?.department;
            const filteredAssets = assetData.filter(asset => asset.department === departmentId);
            setAssets(filteredAssets);
        } catch (error) {
            console.error("Error fetching assets:", error);
            setAssets([]);
        }
    };

    useEffect(() => {
        setAssets([]);
        getAssets();
    }, [scheduleDepartment, profile?.department]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        const numberFields = ["frequency", "priorityScore"];
        setScheduleData(prevState => ({
            ...prevState,
            [name]: numberFields.includes(name) ? parseInt(value || "0", 10) : value
        }));
    };

    const handleAddSchedule = async () => {
        const { assets, description, maintenanceType } = scheduleData;

        if (!assets.length || !description.trim() || !maintenanceType.trim()) {
            setError("All fields are required!");
            return;
        }

        if (
            scheduleData.maintenanceType === "Corrective" && scheduleData.assets.length !== 1 ||
            scheduleData.maintenanceType === "Preventive" && scheduleData.assets.length < 1
        ) {
            setError("Please select appropriate number of assets.");
            return;
        }

        setIsLoading(true);

        try {
            await addSchedule({
                ...scheduleData,
                assets: scheduleData.assets.map(a => a.id),
                priorityScore: scheduleData.priorityScore !== null ? parseInt(scheduleData.priorityScore) : null,
                scheduledDate: scheduleData.scheduledDate
                    ? Timestamp.fromDate(new Date(scheduleData.scheduledDate))
                    : null,
                dueDate: scheduleData.dueDate
                    ? Timestamp.fromDate(new Date(scheduleData.dueDate))
                    : null,
                nextSchedule: scheduleData.nextSchedule
                    ? Timestamp.fromDate(new Date(scheduleData.nextSchedule))
                    : null,
                dateCompleted: "",
                assignedTechnicians: assignedTechnicians.map(t => t.id),
            }, profile?.id);

            setMessage("Schedule was added successfully!");

            setScheduleData({
                assets: [],
                title: "",
                description: "",
                scheduledDate: "",
                maintenanceType: "",
                frequency: "",
                nextSchedule: "",
                priorityScore: null,
                status: "Pending",
                dueDate: null
            });
            setAssignedTechnicians([]);
            setDepartments([]);
            setCurrentStep(1);
            setIsLoading(false);
        } catch (error) {
            console.error("Error adding schedule:", error);
            setError("Failed to adding schedule. Please try again.");
            setIsLoading(false);
        }
    };

    const updateNextSchedule = (date, freq) => {
        if (date && freq) {
            const frequencyDays = parseInt(freq, 10);
            if (!isNaN(frequencyDays)) {
                let newDate = new Date(date);
                newDate.setDate(newDate.getDate() + frequencyDays);
                setScheduleData(prevState => ({
                    ...prevState,
                    nextSchedule: newDate.toISOString().slice(0, 16)
                }));
            }
        } else {
            setScheduleData(prevState => ({
                ...prevState,
                nextSchedule: null
            }));
        }
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

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
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
                        <h3>Add Schedule</h3>
                    </div>
                </div>

                <MessageModal error={error} message={message} clearMessages={clearMessages} />
                <div className="record-form">
                    {currentStep === 1 && (
                        <div className="record-form-group">
                            <label>Maintenance Type</label>
                            <select
                                name="maintenanceType"
                                value={scheduleData.maintenanceType || ""}
                                onChange={handleChange}
                            >
                                <option value="">Select Maintenance Type</option>
                                <option value="Preventive">Preventive</option>
                                <option value="Corrective">Corrective</option>
                            </select>

                            {profile?.role === "Admin" && (
                                <>
                                    <label>Department</label>
                                    <select value={scheduleDepartment} onChange={(e) => setScheduleDepartment(e.target.value)}>
                                        <option value="">Select Department</option>
                                        {Object.entries(departments).map(([id, name]) => (
                                            <option key={id} value={id}>{name}</option>
                                        ))}
                                    </select>
                                </>
                            )}

                            <label>Asset</label>
                            {scheduleData.maintenanceType === "Corrective" ? (
                                <select
                                    name="assetId"
                                    value={scheduleData.assets[0]?.id || ""}
                                    onChange={(e) => {
                                        const selected = assets.find(a => a.id === e.target.value);
                                        if (selected) {
                                            setScheduleData(prev => ({
                                                ...prev,
                                                assets: [{ id: selected.id, name: selected.name }]
                                            }));
                                        }
                                    }}
                                >
                                    <option value="">Select Asset</option>
                                    {assets.map((assetData) => (
                                        <option key={assetData.id} value={assetData.id}>{assetData.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <>
                                    <div style={{ display: "flex", gap: "0.5rem" }}>
                                        <select
                                            value={selectedAssetId}
                                            onChange={(e) => setSelectedAssetId(e.target.value)}
                                        >
                                            <option value="">Select Asset</option>
                                            {assets.map((assetData) => (
                                                <option key={assetData.id} value={assetData.id}>{assetData.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" className="add-btn" onClick={handleAddAsset}>Add</button>
                                    </div>

                                    {scheduleData.assets.length > 0 && (
                                        <div className="record-list" style={{ gridColumn: "span 2" }}>
                                            <ul>
                                                {scheduleData.assets.map((asset) => (
                                                    <li key={asset.id}>
                                                        <span>{asset.name}</span>
                                                        <button
                                                            type="button"
                                                            className="delet-btn"
                                                            onClick={() => handleRemoveAsset(asset.id)}
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
                    )}


                    {currentStep === 2 && (
                        <div className="record-form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                placeholder="Title"
                                name="title"
                                value={scheduleData.title || ""}
                                onChange={handleChange}
                            />
                            <label>Description</label>
                            <input
                                type="text"
                                placeholder="Description"
                                name="description"
                                value={scheduleData.description || ""}
                                onChange={handleChange}
                            />

                            <label>Priority Level</label>
                            <select
                                name="priorityScore"
                                value={scheduleData.priorityScore || ""}
                                onChange={handleChange}
                            >
                                <option value="">Select Priority Level</option>
                                <option value="24">Low</option>
                                <option value="49">Medium</option>
                                <option value="74">High</option>
                                <option value="100">Very High</option>
                            </select>
                        </div>
                    )}

                    {currentStep === 3 && (
                        <div className="record-form-group">
                            <label>Scheduled Date</label>
                            <input
                                type="datetime-local"
                                name="scheduledDate"
                                value={scheduleData.scheduledDate || ""}
                                onChange={(e) => {
                                    handleChange(e);
                                    updateNextSchedule(e.target.value, scheduleData.frequency);
                                }}
                            />

                            {scheduleData.maintenanceType === "Preventive" && (
                                <>
                                    <label>Frequency</label>
                                    <input
                                        type="number"
                                        placeholder="Frequency (days)"
                                        name="frequency"
                                        value={scheduleData.frequency ?? 0}
                                        onChange={(e) => {
                                            handleChange(e);
                                            updateNextSchedule(scheduleData.scheduledDate, e.target.value);
                                        }}
                                    />

                                    {scheduleData.frequency !== "" && scheduleData.scheduledDate && (
                                        <>
                                            <label>Next Schedule</label>
                                            <input
                                                type="datetime-local"
                                                placeholder="Next Schedule"
                                                value={scheduleData.nextSchedule || ""}
                                                readOnly
                                            />
                                        </>
                                    )}
                                </>
                            )}

                            <label>Due Date</label>
                            <input
                                type="datetime-local"
                                name="dueDate"
                                value={scheduleData.dueDate || ""}
                                onChange={handleChange}
                            />
                        </div>
                    )}

                    {currentStep === 4 && (
                        <div className="record-form-group" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
                            <label style={{ gridColumn: "span 1" }}>Assign Technician:</label>
                            <select value={selectedTechnicianId} onChange={(e) => setSelectedTechnicianId(e.target.value)}>
                                <option style={{ gridColumn: "span 1" }} value="">Select Technician</option>
                                {Object.entries(technicians).map(([id, fullName]) => (
                                    <option key={id} value={id}>{fullName}</option>
                                ))}
                            </select>
                            <button style={{ gridColumn: "span 1" }} type="button" className="add-btn" onClick={handleAddTechnician}>Add</button>

                            {assignedTechnicians.length > 0 && (
                                <>
                                    <div className="record-list" style={{ gridColumn: "span 3" }}>
                                        <ul>
                                            {assignedTechnicians.map((tech) => (
                                                <li key={tech.id}>
                                                    <span>{tech.name}</span>
                                                    <button type="button" className="delete-btn" onClick={() => handleRemoveTechnician(tech.id)}>Remove</button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <div className="pagination-controls">
                        {currentStep > 1 && <button className="pagination-button" onClick={prevStep}>Back</button>}
                        {currentStep < 4 && <button className="pagination-button" onClick={nextStep}>Next</button>}
                        {currentStep === 4 && <button className="pagination-button" onClick={handleAddSchedule}>Submit</button>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddSchedule;