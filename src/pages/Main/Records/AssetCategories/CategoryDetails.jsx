import { useState, useEffect } from "react";
import {
  updateCategory,
  deleteCategory,
} from "../../../../firebase/categoryservices";
import { useAuth } from "../../../../context/AuthContext";
import ModalDetails from "../../../../components/Modal/ModalDetails";
import MessageModal from "../../../../components/Modal/MessageModal";
import ConfirmModal from "../../../../components/Modal/ConfirmModal";

const CategoryDetails = ({ categoryDetails, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (categoryDetails) {
      setSelectedCategory(categoryDetails);
    }
  }, [categoryDetails]);

  const handleUpdateCategory = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);

    try {
      await updateCategory(selectedCategory, profile?.id);
      setMessage("Category details updated successfully!");
    } catch (error) {
      console.error("Error updating category:", error);
      setError("Failed to update category. Please try again.");
    }

    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory || !selectedCategory.name) {
      setError("Invalid category selected.");
      return;
    }

    setIsLoading(true);

    try {
      await deleteCategory(selectedCategory.id, profile?.id);
      setMessage("Category was deleted successfully!");
      onClose();
    } catch (error) {
      setError("Failed to delete category. Please try again.");
    }

    setIsLoading(false);
    setShowDeleteModal(false);
  };

  if (!selectedCategory) {
    return <p>Loading category details...</p>;
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
      title="Category Details"
      onClose={onClose}
      onDelete={() => setShowDeleteModal(true)}
      onSave={() => setShowUpdateModal(true)}
    >
      {showDeleteModal && (
        <ConfirmModal
          message={`Are you sure you want to delete '${selectedCategory.name}'?`}
          onConfirm={handleDeleteCategory}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      {showUpdateModal && (
        <ConfirmModal
          message={`Are you sure you want to update '${selectedCategory.name}'?`}
          onConfirm={handleUpdateCategory}
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
          <label className="block text-sm font-medium text-gray-700">ID</label>
          <input
            type="text"
            value={selectedCategory.id || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Name
          </label>
          <input
            type="text"
            value={selectedCategory.name || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) =>
              setSelectedCategory({
                ...selectedCategory,
                name: e.target.value,
              })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <input
            type="text"
            value={selectedCategory.description || ""}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            onChange={(e) =>
              setSelectedCategory({
                ...selectedCategory,
                description: e.target.value,
              })
            }
          />
        </div>
      </div>
    </ModalDetails>
  );
};

export default CategoryDetails;
