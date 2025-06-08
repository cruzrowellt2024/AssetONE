import { useState, useEffect } from "react";
import { updatePosition, deletePosition } from "../../../../firebase/usertitleservices";
import { useAuth } from "../../../../context/AuthContext";
import ModalDetails from "../../../../components/Modal/ModalDetails";
import MessageModal from "../../../../components/Modal/MessageModal";
import ConfirmModal from "../../../../components/Modal/ConfirmModal";

const TitleDetails = ({ titleDetails, onClose }) => {
    const [selectedTitle, setSelectedTitle] = useState(null);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        if (titleDetails) {
            setSelectedTitle(titleDetails);
        }
    }, [titleDetails]);

    const handleUpdateTitle = async () => {
        if (!selectedTitle) return;

        setIsLoading(true);
        try {
            await updatePosition(selectedTitle, profile?.id);
            setMessage("Title details updated successfully!");
        } catch (error) {
            console.error("Error updating title:", error);
            setError("Failed to update title. Please try again.");
        }
        setIsLoading(false);
        setShowUpdateModal(false);
    };

    const handleDeleteTitle = async () => {
        if (!selectedTitle || !selectedTitle.name) {
            setError("Invalid title selected.");
            return;
        }

        setIsLoading(true);
        try {
            await deletePosition(selectedTitle.id, profile?.id);
            setMessage("Title was deleted successfully!");
        } catch (error) {
            console.error("Error deleting title:", error);
            setError("Failed to delete title. Please try again.");
        }
        setIsLoading(false);
        setShowDeleteModal(false);
    };

    const clearMessages = () => {
        setError("");
        setMessage("");
        onClose();
    };

    if (!selectedTitle) return <p>Loading title details...</p>;

    if (isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <ModalDetails
            title="Title Details"
            onClose={onClose}
            onDelete={() => setShowDeleteModal(true)}
            onSave={() => setShowUpdateModal(true)}
        >
            {showDeleteModal && (
                <ConfirmModal
                    message={`Are you sure you want to delete '${selectedTitle.name}'?`}
                    onConfirm={handleDeleteTitle}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showUpdateModal && (
                <ConfirmModal
                    message={`Are you sure you want to update '${selectedTitle.name}'?`}
                    onConfirm={handleUpdateTitle}
                    onCancel={() => setShowUpdateModal(false)}
                />
            )}

            <MessageModal error={error} message={message} clearMessages={clearMessages} />

            <div className="record-form">
                <div className="record-form-group">
                    <label>ID:</label>
                    <input type="text" value={selectedTitle.id || ""} readOnly />
                    <label>Name:</label>
                    <input
                        type="text"
                        value={selectedTitle.name || ""}
                        onChange={(e) =>
                            setSelectedTitle({ ...selectedTitle, name: e.target.value })
                        }
                    />
                    <label>Description:</label>
                    <input
                        type="text"
                        value={selectedTitle.description || ""}
                        onChange={(e) =>
                            setSelectedTitle({ ...selectedTitle, description: e.target.value })
                        }
                    />
                    <label>Score:</label>
                    <input
                        type="number"
                        value={selectedTitle.score || ""}
                        onChange={(e) =>
                            setSelectedTitle({ ...selectedTitle, score: Number(e.target.value) })
                        }
                    />
                </div>
            </div>
        </ModalDetails>
    );
};

export default TitleDetails;