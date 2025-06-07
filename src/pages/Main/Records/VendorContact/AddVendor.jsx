import { useState } from "react";
import { addVendor } from "../../../../firebase/vendorservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";

const AddVendor = ({ onClose }) => {
  const [vendorName, setVendorName] = useState("");
  const [vendorDescription, setVendorDescription] = useState("");
  const [vendorOffers, setVendorOffers] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorEmail, setVendorEmail] = useState("");
  const [vendorContact, setVendorContact] = useState("");
  const [vendorAddress, setVendorAddress] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { profile } = useAuth();

  const handleAddVendor = async () => {
    if (
      [
        vendorName,
        vendorDescription,
        vendorOffers,
        vendorPhone,
        vendorEmail,
        vendorContact,
        vendorAddress,
      ].some((field) => !field.trim())
    ) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);

    try {
      await addVendor(
        vendorName,
        vendorDescription,
        vendorOffers,
        vendorPhone,
        vendorEmail,
        vendorContact,
        vendorAddress,
        profile?.id
      );

      setMessage("Vendor was added successfully!");
      setVendorName("");
      setVendorDescription("");
      setVendorOffers("");
      setVendorPhone("");
      setVendorEmail("");
      setVendorContact("");
      setVendorAddress("");
    } catch (error) {
      console.error("Error adding vendor:", error);
      setError("Failed to add vendor. Please try again.");
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
            <h3>Add Vendor</h3>
          </div>
        </div>

        <MessageModal error={error} message={message} clearMessages={clearMessages} />

        <div className="record-form">
          <div className="record-form-group vendor">
            <label>Vendor Name</label>
            <input
              type="text"
              placeholder="Vendor Name"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
            />
            <label>Description</label>
            <input
              type="text"
              placeholder="Description"
              value={vendorDescription}
              onChange={(e) => setVendorDescription(e.target.value)}
            />
            <label>Offers</label>
            <input
              type="text"
              placeholder="Offers"
              value={vendorOffers}
              onChange={(e) => setVendorOffers(e.target.value)}
            />
            <label>Phone Number</label>
            <input
              type="text"
              placeholder="Phone Number"
              value={vendorPhone}
              onChange={(e) => setVendorPhone(e.target.value)}
            />
            <label>Email</label>
            <input
              type="text"
              placeholder="Email"
              value={vendorEmail}
              onChange={(e) => setVendorEmail(e.target.value)}
            />
            <label>Point of Contact</label>
            <input
              type="text"
              placeholder="Point of Contact"
              value={vendorContact}
              onChange={(e) => setVendorContact(e.target.value)}
            />
            <label>Address</label>
            <input
              type="text"
              placeholder="Address"
              value={vendorAddress}
              onChange={(e) => setVendorAddress(e.target.value)}
            />
          </div>
          <button className="add-btn" onClick={handleAddVendor} disabled={isLoading}>
            Add Vendor
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddVendor;