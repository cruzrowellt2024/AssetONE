import { useState } from "react";
import { addVendor } from "../../../../firebase/vendorservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

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

  return (
    <>
      {isLoading ? (
        <SpinnerOverlay />
      ) : (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <FiArrowLeft className="cursor-pointer" onClick={onClose} />
                <h3 className="text-lg font-semibold">Add Vendor</h3>
              </div>
            </div>

            <MessageModal
              error={error}
              message={message}
              clearMessages={clearMessages}
            />

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    placeholder="Vendor Name"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    placeholder="Description"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorDescription}
                    onChange={(e) => setVendorDescription(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Offers
                  </label>
                  <input
                    type="text"
                    placeholder="Offers"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorOffers}
                    onChange={(e) => setVendorOffers(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Phone Number"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="text"
                    placeholder="Email"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Point of Contact
                  </label>
                  <input
                    type="text"
                    placeholder="Point of Contact"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorContact}
                    onChange={(e) => setVendorContact(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    placeholder="Address"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={vendorAddress}
                    onChange={(e) => setVendorAddress(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  onClick={handleAddVendor}
                  disabled={isLoading}
                >
                  Add Vendor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddVendor;
