import { useState, useEffect } from "react";
import {
  updateLocation,
  deleteLocation,
} from "../../../../firebase/locationservices";
import { useAuth } from "../../../../context/AuthContext";
import ModalDetails from "../../../../components/Modal/ModalDetails";
import MessageModal from "../../../../components/Modal/MessageModal";
import ConfirmModal from "../../../../components/Modal/ConfirmModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

const LocationDetails = ({ locationDetails, onClose }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (locationDetails) {
      setSelectedLocation(locationDetails);
    }
  }, [locationDetails]);

  const handleUpdateLocation = async () => {
    if (!selectedLocation) return;

    setIsLoading(true);
    try {
      await updateLocation(selectedLocation, profile?.id);
      setMessage("Location details updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
      setError("Failed to update location. Please try again.");
    }
    setIsLoading(false);
    setShowUpdateModal(false);
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation || !selectedLocation.name) {
      setError("Invalid location selected.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteLocation(selectedLocation.id, profile?.id);
      setMessage("Location was deleted successfully!");
    } catch (error) {
      console.error("Error deleting location:", error);
      setError("Failed to delete location. Please try again.");
    }
    setIsLoading(false);
    setShowDeleteModal(false);
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

  if (!selectedLocation) return <div>Loading...</div>;

  return (
    <>
      {isLoading ? (
        <SpinnerOverlay />
      ) : (
        <ModalDetails
          title="Location Details"
          onClose={onClose}
          onDelete={() => setShowDeleteModal(true)}
          onSave={() => setShowUpdateModal(true)}
        >
          {showDeleteModal && (
            <ConfirmModal
              message={`Are you sure you want to delete '${selectedLocation.name}'?`}
              onConfirm={handleDeleteLocation}
              onCancel={() => setShowDeleteModal(false)}
            />
          )}

          {showUpdateModal && (
            <ConfirmModal
              message={`Are you sure you want to update '${selectedLocation.name}'?`}
              onConfirm={handleUpdateLocation}
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
                Name
              </label>
              <input
                type="text"
                value={selectedLocation.name}
                onChange={(e) =>
                  setSelectedLocation({
                    ...selectedLocation,
                    name: e.target.value,
                  })
                }
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                value={selectedLocation.address}
                onChange={(e) =>
                  setSelectedLocation({
                    ...selectedLocation,
                    address: e.target.value,
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
                value={selectedLocation.description}
                onChange={(e) =>
                  setSelectedLocation({
                    ...selectedLocation,
                    description: e.target.value,
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

export default LocationDetails;
