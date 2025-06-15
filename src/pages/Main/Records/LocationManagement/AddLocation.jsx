import { useState } from "react";
import { addLocation } from "../../../../firebase/locationservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

const AddLocation = ({ onClose }) => {
  const [locationName, setLocationName] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const handleAddLocation = async () => {
    if (
      [locationName, locationAddress, locationDescription].some(
        (field) => !field.trim()
      )
    ) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);

    try {
      await addLocation(
        locationName,
        locationAddress,
        locationDescription,
        profile?.id
      );
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
                <h3 className="text-lg font-semibold">Add Location</h3>
              </div>
            </div>

            <MessageModal
              error={error}
              message={message}
              clearMessages={clearMessages}
            />

            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location Name
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Location Name"
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Address"
                    value={locationAddress}
                    onChange={(e) => setLocationAddress(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description"
                    value={locationDescription}
                    onChange={(e) => setLocationDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6">
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  onClick={handleAddLocation}
                  disabled={isLoading}
                >
                  Add Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddLocation;
