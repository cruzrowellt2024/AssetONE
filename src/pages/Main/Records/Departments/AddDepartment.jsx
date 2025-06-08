import { useEffect, useState } from "react";
import { addDepartment } from "../../../../firebase/departmentservices";
import { useAuth } from "../../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../../components/SpinnerOverlay";

const AddDepartment = ({ onClose }) => {
  const [departmentName, setDepartmentName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentType, setDepartmentType] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { profile } = useAuth();

  useEffect(() => {
    if (!profile) return;
    if (profile.role === "system_administrator") return;
    if (profile.role === "operational_administrator") {
      setDepartmentType("asset");
    } else {
      setDepartmentType("maintenance");
    }
  }, [profile]);

  const handleAddDepartment = async () => {
    if ([departmentName, description].some((field) => !field.trim())) {
      setError("All fields are required!");
      return;
    }

    setIsLoading(true);

    try {
      await addDepartment(
        departmentName,
        description,
        departmentType,
        profile?.id
      );
      setMessage("Department was added successfully!");
      setDepartmentName("");
      setDescription("");
      setDepartmentType("");
    } catch (error) {
      console.error("Error adding department:", error);
      setError("Failed to add department. Please try again.");
    }

    setIsLoading(false);
  };

  const clearMessages = () => {
    setError("");
    setMessage("");
  };
  
  return (
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
            <h3 className="text-lg font-semibold">Add Department</h3>
          </div>
        </div>

        {isLoading && <SpinnerOverlay logo="A" />}

        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department Name
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Department Name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
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
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {profile?.role === "system_administrator" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Department Type
                </label>
                <select
                  className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  value={departmentType}
                  onChange={(e) => setDepartmentType(e.target.value)}
                >
                  <option value="">Select Type</option>
                  <option value="asset">Property Custodian Department</option>
                  <option value="maintenance">Maintenance Team</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-6">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              onClick={handleAddDepartment}
            >
              Add Department
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddDepartment;