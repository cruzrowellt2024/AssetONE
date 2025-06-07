import { useState } from "react";
import { addCategory } from "../../../../firebase/categoryservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";

const AddCategory = ({ onClose }) => {
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useAuth();

  const handleAddCategory = async () => {
    if ([categoryName, description].some((field) => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);

    try {
      await addCategory(categoryName, description, profile?.id);

      setMessage("Category was added successfully!");
      setCategoryName("");
      setDescription("");
    } catch (error) {
      console.error("Error adding category:", error);
      setError("Failed to add category. Please try again.");
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
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-left">
            <FiArrowLeft className="back-btn" onClick={onClose} />
            <h3>Add Category</h3>
          </div>
        </div>

        <MessageModal error={error} message={message} clearMessages={clearMessages} />

        <div className="record-form">
          <div className="record-form-group">
            <label>Category</label>
            <input
              type="text"
              placeholder="Category Name"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={handleAddCategory} disabled={isLoading}>
            Add Category
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddCategory;