import { useState } from "react";
import { addPosition } from "../../../../firebase/usertitleservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

const AddTitle = ({ onClose }) => {
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  const handleAddTitle = async () => {
    if ([title].some((field) => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);
    try {
      await addPosition(title, parseInt(score) || 0, profile?.id);
      setMessage("Title was added successfully!");
      setTitle("");
      setScore("");
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding title:", error);
      setError("Failed to add title. Please try again.");
    }
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
                <h3 className="text-lg font-semibold">Add Title</h3>
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
                    Title
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Score
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Score"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                  />
                </div>
                <div className="mt-6">
                  <button
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                    onClick={handleAddTitle}
                  >
                    Add Title
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTitle;
