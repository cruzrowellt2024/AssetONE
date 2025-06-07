import { useState, useEffect } from "react";
import { updateDepartment, deleteDepartment } from "../../../../firebase/departmentservices";
import { useAuth } from "../../../../context/AuthContext";
import ModalDetails from "../../../../components/Modal/ModalDetails";
import MessageModal from "../../../../components/Modal/MessageModal";
import ConfirmModal from "../../../../components/Modal/ConfirmModal";

const DepartmentDetails = ({ departmentDetails, onClose }) => {
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        if (departmentDetails) {
            setSelectedDepartment(departmentDetails);
        }
    }, [departmentDetails]);

    const handleUpdateDepartment = async () => {
        if (!selectedDepartment) return;

        setIsLoading(true);

        try {
            await updateDepartment(selectedDepartment, profile?.id);
            setMessage("Department details updated successfully!");
        } catch (error) {
            console.error("Error updating department:", error);
            setError("Failed to update department. Please try again.");
        }

        setIsLoading(false);
        setShowUpdateModal(false);
    };

    const handleDeleteDepartment = async () => {
        if (!selectedDepartment || !selectedDepartment.name) {
            setError("Invalid department selected.");
            return;
        }

        setIsLoading(true);

        try {
            await deleteDepartment(selectedDepartment.id, profile?.id);
            setMessage("Department was deleted successfully!");
        } catch (error) {
            setError("Failed to delete department. Please try again.");
        }

        setIsLoading(false);
        setShowDeleteModal(false);
    };

    const clearMessages = () => {
        setError("");
        setMessage("");
        onClose();
    };

    if (!selectedDepartment) {
        return <p>Loading department details...</p>;
    }

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <ModalDetails
            title="Department Details"
            onClose={onClose}
            onDelete={() => setShowDeleteModal(true)}
            onSave={() => setShowUpdateModal(true)}
        >
            {showDeleteModal && (
                <ConfirmModal
                    message={`Are you sure you want to delete '${selectedDepartment.name}'?`}
                    onConfirm={handleDeleteDepartment}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showUpdateModal && (
                <ConfirmModal
                    message={`Are you sure you want to update '${selectedDepartment.name}'?`}
                    onConfirm={handleUpdateDepartment}
                    onCancel={() => setShowUpdateModal(false)}
                />
            )}

            <MessageModal error={error} message={message} clearMessages={clearMessages} />

            <div className="record-form">
                <div className="record-form-group">
                    <label>Department ID</label>
                    <input type="text" value={selectedDepartment.id || ""} readOnly />
                    <label>Name</label>
                    <input
                        type="text"
                        value={selectedDepartment.name || ""}
                        onChange={(e) =>
                            setSelectedDepartment({ ...selectedDepartment, name: e.target.value })
                        }
                    />
                    <label>Description</label>
                    <input
                        type="text"
                        value={selectedDepartment.description || ""}
                        onChange={(e) =>
                            setSelectedDepartment({ ...selectedDepartment, description: e.target.value })
                        }
                    />
                </div>
            </div>
        </ModalDetails>
    );
};

export default DepartmentDetails;