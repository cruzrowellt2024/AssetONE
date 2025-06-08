import { useState, useEffect } from "react";
import { updateUser, deleteUser } from "../../../firebase/userservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchPositions } from "../../../firebase/usertitleservices";
import { useAuth } from "../../../context/AuthContext";
import ModalDetails from "../../../components/Modal/ModalDetails";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";

const UserDetails = ({ userDetails, onClose }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [departments, setDepartments] = useState({});
    const [titles, setTitles] = useState({});
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const { profile } = useAuth();

    useEffect(() => {
        if (userDetails) {
            setSelectedUser(userDetails);
        }
    }, [userDetails]);

    useEffect(() => {
        loadIdNameMap(fetchDepartments, setDepartments, "departments");
        loadIdNameMap(fetchPositions, setTitles, "titles");
    }, []);

    const loadIdNameMap = async (fetchFn, setFn, label) => {
        try {
            const data = await fetchFn();
            const idNameMap = data.reduce((acc, item) => {
                acc[item.id] = item.name;
                return acc;
            }, {});
            setFn(idNameMap);
        } catch (error) {
            console.error(`Error fetching ${label}:`, error);
            setFn({});
        }
    };

    const handleUpdateUser = async () => {
        if (!selectedUser) return;

        setIsLoading(true);
        try {
            await updateUser(selectedUser, profile?.id);
            setMessage("User details updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            setError("Failed to update user. Please try again.");
        }

        setIsLoading(false);
        setShowUpdateModal(false);
    };

    const handleDeleteUser = async () => {
        if (!selectedUser || !selectedUser.firstName || !selectedUser.lastName) {
            alert("Invalid user selected.");
            return;
        }
        
        setIsLoading(true);

        try {
            await deleteUser(selectedUser.id, profile?.id);
            setMessage("User was deleted successfully!");
        } catch (error) {
            setError("Failed to delete user. Please try again.");
        }
        setIsLoading(false);
        setShowDeleteModal(false);
    };

    if (!selectedUser) {
        return <div>Loading...</div>;
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
        <ModalDetails
            title="User Details"
            onClose={onClose}
            onDelete={() => setShowDeleteModal(true)}
            onSave={() => setShowUpdateModal(true)}
        >
            {showDeleteModal && (
                <ConfirmModal
                    message={`Are you sure you want to delete '${selectedUser.firstName}' '${selectedUser.lastName}'?`}
                    onConfirm={handleDeleteUser}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}

            {showUpdateModal && (
                <ConfirmModal
                    message={`Are you sure you want to update '${selectedUser.firstName}' '${selectedUser.lastName}'?`}
                    onConfirm={handleUpdateUser}
                    onCancel={() => setShowUpdateModal(false)}
                />
            )}

            <MessageModal error={error} message={message} clearMessages={clearMessages} />

            <div className="record-form">
                <div className="record-form-group">
                    <label>ID:</label>
                    <input className="other-info" type="text" value={selectedUser.id || ""} readOnly />
                    <label>First Name:</label>
                    <input type="text" value={selectedUser.firstName || ""} onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })} />
                    <label>Last Name:</label>
                    <input type="text" value={selectedUser.lastName || ""} onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })} />
                    <label>Contact Number:</label>
                    <input className="other-info" type="text" value={selectedUser.contactNumber || ""} onChange={(e) => setSelectedUser({ ...selectedUser, contactNumber: e.target.value })} />
                    <label>Email:</label>
                    <input className="other-info" type="text" value={selectedUser.email || ""} onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })} />
                    {/* <label>Status:</label>
                    <select className="other-info"
                        value={selectedUser.status}
                        onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value })}
                    >
                        <option value="Available">Available</option>
                        <option value="In Operation">In Operation</option>
                        <option value="Unavailable">Unavailable</option>
                    </select> */}
                    {selectedUser.role !== "Admin" && (
                        <>
                            <label>Department:</label>
                            <select className="other-info"
                                value={selectedUser?.department || ""}
                                onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                            >
                                <option value="">None</option>
                                {Object.entries(departments).map(([id, name]) => (
                                    <option key={id} value={id}>{name}</option>
                                ))}
                            </select>
                        </>
                    )}
                    <label>Position:</label>
                    <select className="other-info"
                        value={selectedUser?.title || ""}
                        onChange={(e) => setSelectedUser({ ...selectedUser, title: e.target.value })}
                    >
                        <option value="">None</option>
                        {Object.entries(titles).map(([id, name]) => (
                            <option key={id} value={id}>{name}</option>
                        ))}
                    </select>
                </div>
            </div>
        </ModalDetails>
    );
}

export default UserDetails;