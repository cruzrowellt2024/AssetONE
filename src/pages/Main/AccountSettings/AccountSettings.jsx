import { useState, useEffect } from "react";
import { updateUser } from "../../../firebase/userservices";
import { FiCheck, FiEdit, FiUser } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import Modal from "../../../components/Modal/Modal";
import { reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import MessageModal from "../../../components/Modal/MessageModal";

const AccountSettings = () => {
    const { profile, loading: authLoading } = useAuth();
    const [editingField, setEditingField] = useState(null);
    const [editableProfile, setEditableProfile] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (profile) {
            setEditableProfile({ ...profile });
        }
    }, [profile]);

    const handleSave = () => {
        setEditingField(null);
        handleUpdateUser();
    };

    const handleUpdateUser = async () => {
        if (!editableProfile) return;
        setIsLoading(true);

        try {
            await updateUser(editableProfile, editableProfile.id);
            setIsLoading(false);
            setMessage("User details updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            setIsLoading(false);
            setError("Failed to update user. Please try again.");
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            setError("New password and confirmation do not match.");
            return;
        }

        setIsLoading(true);
        try {
            const user = auth.currentUser;

            if (!user || !editableProfile.email) {
                setError("User not authenticated.");
                return;
            }

            const credential = EmailAuthProvider.credential(editableProfile.email, currentPassword);

            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            setMessage("Password updated successfully.");
            setShowPassword(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setIsLoading(false);
        } catch (error) {
            console.error("Error updating password:", error);
            setError("Failed to update password. Make sure your current password is correct.");
            setIsLoading(false);
        }
    };

    const clearMessages = () => {
        setError("");
        setMessage("");
    };

    if (authLoading || !editableProfile || isLoading) {
        return (
            <div className="loading-overlay">
                <div className="spinner"></div>
            </div>
        );
    }

    const renderEditableField = (label, fieldKey, value) => {
        return (
            <div className="element-group">
                <label style={{ minWidth: 150, fontSize: "0.75rem" }}>{label}</label>
                {
                    editingField === fieldKey ? (
                        <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <input
                                type="text"
                                value={editableProfile[fieldKey] || ""}
                                onChange={(e) => setEditableProfile({ ...editableProfile, [fieldKey]: e.target.value })}
                                style={{ gridColumn: "span 1" }}
                            />
                            <FiCheck className="edit-field" onClick={() => handleSave(fieldKey)} />
                        </div>
                    ) : (
                        <div style={{ gridColumn: "span 1", display: "flex", justifyContent: "center", alignItems: "center" }}>
                            <span style={{ color: "black", flex: 1 }}>{value || "-"}</span>
                            <FiEdit className="edit-field" onClick={() => setEditingField(fieldKey)} />
                        </div>
                    )
                }
            </div>
        );
    };

    return (
        <div className="user-profile-page">
            <MessageModal error={error} message={message} clearMessages={clearMessages} />
            <h2 className="profile-header-title">User Profile</h2>
            <div className="profile-container">
                <FiUser className="profile-pic" />
                <div className="profile-info">
                    <label>{editableProfile.firstName || ""} {editableProfile.lastName || ""}</label>
                    <label>{editableProfile.role || ""}</label>
                </div>
                <div className="profile-date">
                    <label>Joined Date:</label>
                    <label>
                        {editableProfile.dateCreated?.toDate().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        }) || ""}
                    </label>
                </div>
            </div>

            <div className="form-group">
                <div className="name-group">
                    {renderEditableField("FIRST NAME:", "firstName", editableProfile.firstName)}
                    {renderEditableField("LAST NAME:", "lastName", editableProfile.lastName)}
                </div>
                {renderEditableField("EMAIL:", "email", editableProfile.email)}
                {renderEditableField("SECONDARY EMAIL:", "secondaryEmail", editableProfile.secondaryEmail)}
                {renderEditableField("CONTACT NUMBER:", "contactNumber", editableProfile.contactNumber)}

                <div className="element-group">
                    <label>PASSWORD:</label>
                    <span onClick={() => setShowPassword(true)} style={{ textDecoration: "underline", cursor: "pointer" }}>Change password</span>
                </div>
            </div>

            {showPassword && (
                <Modal onClose={() => setShowPassword(false)} title="Change Password">

                    <MessageModal error={error} message={message} clearMessages={clearMessages} />
                    <div className="password-content">
                        <label>Current Password</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        <label>New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />

                        <div className="actions">
                            <button className="cancel-button" onClick={() => setShowPassword(false)}>
                                Cancel
                            </button>
                            <button className="confirm-button" onClick={handleChangePassword}>
                                Confirm
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default AccountSettings;