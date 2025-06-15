import { useState, useEffect } from "react";
import {
  updateVendor,
  deleteVendor,
} from "../../../../firebase/vendorservices";
import { useAuth } from "../../../../context/AuthContext";
import ModalDetails from "../../../../components/Modal/ModalDetails";
import MessageModal from "../../../../components/Modal/MessageModal";
import ConfirmModal from "../../../../components/Modal/ConfirmModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

const VendorDetails = ({ vendorDetails, onClose }) => {
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (vendorDetails) {
      setSelectedVendor(vendorDetails);
    }
  }, [vendorDetails]);

  const handleUpdateVendor = async () => {
    if (!selectedVendor) return;

    setIsLoading(true);
    try {
      await updateVendor(selectedVendor, profile?.id);
      setMessage("Vendor details updated successfully!");
    } catch (error) {
      console.error("Error updating vendor:", error);
      setError("Failed to update vendor. Please try again.");
    }
    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor || !selectedVendor.name) {
      setError("Invalid vendor selected.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteVendor(selectedVendor.id, profile?.id);
      setMessage("Vendor was deleted successfully!");
    } catch (error) {
      console.error("Error deleting vendor:", error);
      setError("Failed to delete vendor. Please try again.");
    }
    setIsLoading(false);
    setShowDeleteModal(false);
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

  if (!selectedVendor) return <div>Loading...</div>;

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      {isLoading ? (
        <SpinnerOverlay />
      ) : (
        <ModalDetails
          title="Vendor Details"
          onClose={onClose}
          onDelete={() => setShowDeleteModal(true)}
          onSave={() => setShowUpdateModal(true)}
        >
          {showDeleteModal && (
            <ConfirmModal
              message={`Are you sure you want to delete '${selectedVendor.name}'?`}
              onConfirm={handleDeleteVendor}
              onCancel={() => setShowDeleteModal(false)}
            />
          )}

          {showUpdateModal && (
            <ConfirmModal
              message={`Are you sure you want to update '${selectedVendor.name}'?`}
              onConfirm={handleUpdateVendor}
              onCancel={() => setShowUpdateModal(false)}
            />
          )}

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Vendor Name
              </label>
              <input
                type="text"
                value={selectedVendor.name || ""}
                onChange={(e) =>
                  setSelectedVendor({ ...selectedVendor, name: e.target.value })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <input
                type="text"
                value={selectedVendor.description || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    description: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Offers
              </label>
              <input
                type="text"
                value={selectedVendor.offers || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    offers: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                value={selectedVendor.phoneNumber || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    phoneNumber: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="text"
                value={selectedVendor.emailAddress || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    emailAddress: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Point of Contact
              </label>
              <input
                type="text"
                value={selectedVendor.contactPerson || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={selectedVendor.address || ""}
                onChange={(e) =>
                  setSelectedVendor({
                    ...selectedVendor,
                    address: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </ModalDetails>
      )}
    </>
  );
};

export default VendorDetails;
