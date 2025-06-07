import { useState } from "react";
import { addDepartment } from "../../../../firebase/departmentservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";

const AddDepartment = ({ onClose }) => {
    const [departmentName, setDepartmentName] = useState("");
    const [description, setDescription] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { profile } = useAuth();

    const handleAddDepartment = async () => {
        if ([departmentName, description].some(field => !field.trim())) {
            setError("All fields are required!");
            return;
        }
        
        setIsLoading(true);

        try {
            await addDepartment(departmentName, description, profile?.id);
            setMessage("Department was added successfully!");
            setDepartmentName("");
            setDescription("");
        } catch (error) {
            console.error("Error adding department:", error);
            setError("Failed to add department. Please try again.");
        }

        setIsLoading(false);
    };

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
            <div className="modal-container" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-header-left">
                        <FiArrowLeft className="back-btn" onClick={onClose} />
                        <h3>Add Department</h3>
                    </div>
                </div>

                <MessageModal error={error} message={message} clearMessages={clearMessages} />

                <div className="record-form">
                    <div className="record-form-group">
                        <label>Department Name</label>
                        <input
                            type="text"
                            placeholder="Department Name"
                            value={departmentName}
                            onChange={e => setDepartmentName(e.target.value)}
                        />
                        <label>Description</label>
                        <input
                            type="text"
                            placeholder="Description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    <button className="add-btn" onClick={handleAddDepartment}>
                        Add Department
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddDepartment;