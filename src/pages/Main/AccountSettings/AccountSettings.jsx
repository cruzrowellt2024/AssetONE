import { useState, useEffect } from "react";
import { updateUser } from "../../../firebase/userservices";
import { FiCheck, FiEdit, FiUser } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import Modal from "../../../components/Modal/Modal";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
} from "firebase/auth";
import { auth } from "../../../firebase/firebase";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { fetchDepartments } from "../../../firebase/departmentservices";

const AccountSettings = () => {
  const { profile, loading: authLoading } = useAuth();
  const [departments, setDepartments] = useState([]);
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
      getDepartments();
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

      const credential = EmailAuthProvider.credential(
        editableProfile.email,
        currentPassword
      );

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
      setError(
        "Failed to update password. Make sure your current password is correct."
      );
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  const getDepartments = async () => {
    try {
      const departmentData = await fetchDepartments();
      setDepartments(departmentData || []);
    } catch (error) {
      console.error("Error fetching asset:", error);
      setDepartments([]);
    }
  };

  const getUserDepartment = (departmentId) => {
    const department = departments.find(
      (department) => department.id === departmentId
    );
    return department ? `${department.name}` : "Unknown Department";
  };

  const renderEditableField = (label, fieldKey, value) => {
    return (
      <div className="element-group flex flex-col gap-1 mb-4">
        <label className="min-w-[150px] text-xs font-semibold text-gray-600 mb-1">
          {label}
        </label>
        {editingField === fieldKey ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={editableProfile[fieldKey] || ""}
              onChange={(e) =>
                setEditableProfile({
                  ...editableProfile,
                  [fieldKey]: e.target.value,
                })
              }
            />
            <button
              type="button"
              className="text-green-600 hover:bg-green-100 rounded-full p-1 transition"
              onClick={() => handleSave(fieldKey)}
              aria-label="Save"
            >
              <FiCheck size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 flex-1">
            <span className="text-gray-800 flex-1">{value || "-"}</span>
            <button
              type="button"
              className="text-blue-600 hover:bg-blue-100 rounded-full p-1 transition"
              onClick={() => setEditingField(fieldKey)}
              aria-label="Edit"
            >
              <FiEdit size={18} />
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="asset-details-container m-4 bg-white min-h-[80vh] rounded-lg shadow-2xl">
      <div className="header bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">User Profile</h3>
        </div>
      </div>

      {authLoading ||
        !editableProfile ||
        (isLoading && <SpinnerOverlay logo="A" />)}

      <MessageModal
        error={error}
        message={message}
        clearMessages={clearMessages}
      />
      {editableProfile && (
        <>
          <div className="profile-container flex items-center gap-6 p-6 bg-gray-50 rounded-lg shadow mb-6">
            <div className="flex-shrink-0">
              <FiUser className="w-16 h-16 text-gray-400 bg-gray-200 rounded-full p-3" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-lg text-gray-800">
                {editableProfile.firstName || ""}{" "}
                {editableProfile.lastName || ""}
              </div>
              <div className="text-sm text-gray-500">
                {editableProfile.role
                  ? editableProfile.role
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")
                  : ""}{" "}
                - {getUserDepartment(editableProfile.department) || ""}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-400">Joined Date:</div>
              <div className="text-sm text-gray-600 font-medium">
                {editableProfile.dateCreated
                  ?.toDate()
                  .toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) || ""}
              </div>
            </div>
          </div>

          <div className="form-group p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {renderEditableField(
                "FIRST NAME:",
                "firstName",
                editableProfile.firstName
              )}
              {renderEditableField(
                "LAST NAME:",
                "lastName",
                editableProfile.lastName
              )}
              {renderEditableField("EMAIL:", "email", editableProfile.email)}
              {renderEditableField(
                "SECONDARY EMAIL:",
                "secondaryEmail",
                editableProfile.secondaryEmail
              )}
              {renderEditableField(
                "CONTACT NUMBER:",
                "contactNumber",
                editableProfile.contactNumber
              )}
              <div className="element-group flex flex-col gap-1 mb-4">
                <label className="min-w-[150px] text-xs font-semibold text-gray-600 mb-1">
                  PASSWORD:
                </label>
                <span
                  onClick={() => setShowPassword(true)}
                  className="text-blue-600 hover:underline cursor-pointer"
                >
                  Change password
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {showPassword && (
        <Modal onClose={() => setShowPassword(false)} title="Change Password">
          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />
          <div className="password-content flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="actions flex justify-end gap-2 mt-2">
              <button
                className="cancel-button px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowPassword(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-button px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleChangePassword}
              >
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
