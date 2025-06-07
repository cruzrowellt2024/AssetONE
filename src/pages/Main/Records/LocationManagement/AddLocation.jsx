import { useState } from "react";
import { addLocation } from "../../../../firebase/locationservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";

const AddLocation = ({ onClose }) => {
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const handleAddLocation = async () => {
    if ([locationName, locationAddress, locationDescription].some(field => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    try {
      await addLocation(locationName, locationAddress, locationDescription, profile?.id);
      setMessage("Location was added successfully!");
      setLocationName("");
      setLocationAddress("");
      setLocationDescription("");
    } catch (error) {
      console.error("Error adding location:", error);
      setError("Failed to add location. Please try again.");
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
            <h3>Add Location</h3>
          </div>
        </div>

        <MessageModal error={error} message={message} clearMessages={clearMessages} />

        <div className="record-form">
          <div className="record-form-group">
            <label>Location Name</label>
            <input
              type="text"
              placeholder="Location Name"
              value={locationName}
              onChange={e => setLocationName(e.target.value)}
            />
            <label>Address</label>
            <input
              type="text"
              placeholder="Address"
              value={locationAddress}
              onChange={e => setLocationAddress(e.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              placeholder="Description"
              value={locationDescription}
              onChange={e => setLocationDescription(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={handleAddLocation} disabled={isLoading}>
            Add Location
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddLocation;