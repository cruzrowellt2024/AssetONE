import { useState } from "react";
import { addPosition } from "../../../../firebase/usertitleservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";

const AddTitle = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const handleAddTitle = async () => {
    if ([title, description].some(field => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    try {
      await addPosition(title, description, parseInt(score) || 0, profile?.id);
      setMessage("Title was added successfully!");
      setTitle("");
      setDescription("");
      setScore("");
    } catch (error) {
      console.error("Error adding title:", error);
      setError("Failed to add title. Please try again.");
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
            <h3>Add Title</h3>
          </div>
        </div>

        <MessageModal error={error} message={message} clearMessages={clearMessages} />

        <div className="record-form">
          <div className="record-form-group">
            <label>Title</label>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
            <label>Score</label>
            <input
              type="number"
              placeholder="Score"
              value={score}
              onChange={e => setScore(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={handleAddTitle} disabled={isLoading}>
            Add Title
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTitle;