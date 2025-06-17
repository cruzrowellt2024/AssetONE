import { useState, useEffect } from "react";
import { updateUser, deleteUser } from "../../../firebase/userservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { useAuth } from "../../../context/AuthContext";
import ModalDetails from "../../../components/Modal/ModalDetails";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { FiArrowLeft, FiCheckSquare, FiTrash } from "react-icons/fi";

const UserDetails = ({ userDetails, onClose }) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [departments, setDepartments] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { profile } = useAuth();

  const isNotSystemAdmin = profile?.role !== "system_administrator";

  useEffect(() => {
    if (userDetails) {
      setSelectedUser(userDetails);
    }
  }, [userDetails]);

  useEffect(() => {
    loadIdNameMap(fetchDepartments, setDepartments, "departments");
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
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !selectedUser.firstName || !selectedUser.lastName) {
      alert("Invalid user selected.");
      return;
    }

    setIsLoading(true);

    try {
      await deleteUser(selectedUser, profile?.id);
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

  if (!selectedUser) return;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft
              className="back-btn cursor-pointer"
              onClick={onClose}
              title="Go Back"
            />
            <h3 className="text-lg font-semibold">User Details</h3>
          </div>
          <div className="actions flex items-center gap-2">
            {profile?.role === "system_administrator" && (
              <>
                <button
                  className="delete-btn text-gray-200 hover:text-gray-900 px-4 py-2 rounded bg-red-600 hover:bg-red-700 transition flex items-center gap-2"
                  onClick={() => setShowDeleteModal(true)}
                  title="Delete Asset"
                >
                  <FiTrash />
                  <span>Delete</span>
                </button>
                <button
                  className="save-btn bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
                  onClick={() => setShowUpdateModal(true)}
                  title="Save Changes"
                >
                  <FiCheckSquare />
                  <span>Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
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

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />

          {isLoading && <SpinnerOverlay logo="A" />}

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  value={selectedUser.firstName || ""}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      firstName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  value={selectedUser.lastName || ""}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      lastName: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Contact Number
                </label>
                <input
                  type="text"
                  value={selectedUser.contactNumber || ""}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      contactNumber: e.target.value,
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  value={selectedUser.email || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Status
                </label>
                <select
                  value={selectedUser.status}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, status: e.target.value })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                >
                  <option value="Available">Available</option>
                  <option value="In Operation">In Operation</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              {![
                "system_administrator",
                "operational_administrator",
                "reporter",
                "finance",
              ].includes(selectedUser.role) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    value={selectedUser?.department || ""}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        department: e.target.value,
                      })
                    }
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={isNotSystemAdmin}
                  >
                    <option value="">None</option>
                    {Object.entries(departments).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div
                className={selectedUser.role !== "Admin" ? "" : "sm:col-span-2"}
              >
                <label className="block text-sm font-medium text-gray-700">
                  Priority Level
                </label>
                <select
                  value={selectedUser.priorityScore?.toString() || ""}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      priorityScore: parseInt(e.target.value),
                    })
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  disabled={isNotSystemAdmin}
                >
                  <option value="">None</option>
                  <option value="25">Default Priority</option>
                  <option value="50">Medium</option>
                  <option value="75">High</option>
                  <option value="100">Top Priority</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetails;
