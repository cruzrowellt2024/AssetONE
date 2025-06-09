import { useState, useEffect } from "react";
import {
  updateDepartment,
  deleteDepartment,
} from "../../../../firebase/departmentservices";
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

      <MessageModal
        error={error}
        message={message}
        clearMessages={clearMessages}
      />

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Department ID
          </label>
          <input
            type="text"
            value={selectedDepartment.id || ""}
            readOnly
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={selectedDepartment.name || ""}
            onChange={(e) =>
              setSelectedDepartment({
                ...selectedDepartment,
                name: e.target.value,
              })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            value={selectedDepartment.description || ""}
            onChange={(e) =>
              setSelectedDepartment({
                ...selectedDepartment,
                description: e.target.value,
              })
            }
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </ModalDetails>
  );
};

export default DepartmentDetails;
