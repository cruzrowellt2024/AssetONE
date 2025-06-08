import { useState, useEffect } from "react";
import { addUser } from "../../../firebase/userservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchPositions } from "../../../firebase/usertitleservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";

const AddUser = ({ onClose }) => {
  const { profile } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Admin");
  const [userDepartment, setUserDepartment] = useState("None");
  const [departments, setDepartments] = useState({});
  const [userTitle, setUserTitle] = useState("None");
  const [titles, setTitles] = useState({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadDropdownData(fetchDepartments, setDepartments);
    loadDropdownData(fetchPositions, setTitles);
  }, []);

  const loadDropdownData = async (fetchFn, setFn) => {
    try {
      const data = await fetchFn();
      const mappedData = data.reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
      setFn(mappedData);
    } catch (error) {
      console.error(`Error fetching data:`, error);
      setFn({});
    }
  };

  const assetDepartments = Object.entries(departments).filter(
    ([id, dep]) => dep.departmentType === "asset"
  );

  const maintenanceDepartments = Object.entries(departments).filter(
    ([id, dep]) => dep.departmentType === "maintenance"
  );

  const handleAddUser = async () => {
    if (
      [firstName, lastName, email, password, role, userTitle].some(
        (field) => !field.trim()
      )
    ) {
      setError("All fields are required!");
      return;
    }
    setIsLoading(true);
    try {
      await addUser(
        firstName,
        lastName,
        email,
        password,
        role,
        userDepartment,
        userTitle,
        profile?.id
      );
      setMessage("User was added successfully!");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setRole("Admin");
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding user:", error);
      setError("Failed to add user. Please try again.");
      setIsLoading(false);
    }
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
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FiArrowLeft className="cursor-pointer" onClick={onClose} />
            <h3 className="text-lg font-semibold">Add User</h3>
          </div>
        </div>

        {isLoading && <SpinnerOverlay logo="A" />}
        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-gray-700">First Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700">Last Name</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700">Email</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700">Password</label>
              <input
                type="password"
                className="w-full border border-gray-300 rounded px-4 py-2"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className="font-semibold text-gray-700">Role</label>
              <select
                className="w-full border border-gray-300 rounded px-4 py-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="system_administrator">
                  System Administrator
                </option>
                <option value="operational_administrator">
                  Operational Administrator
                </option>
                <option value="department_manager">Department Manager</option>
                <option value="maintenance_head">Maintenance Head</option>
                <option value="maintenance_technician">Technician</option>
                <option value="finance">Finance</option>
                <option value="reporter">Reporter</option>
              </select>
            </div>
            <div>
              <label className="font-semibold text-gray-700">Position</label>
              <select
                className="w-full border border-gray-300 rounded px-4 py-2"
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
                required
              >
                <option value="">Select Position</option>
                {Object.entries(titles).map(([id, title]) => (
                  <option key={id} value={id}>
                    {title.name}
                  </option>
                ))}
              </select>
            </div>

            {role !== "reporter" && (
              <>
                {role === "department_manager" && (
                  <div>
                    <label className="font-semibold text-gray-700">
                      Department (Asset Custodian)
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      value={userDepartment}
                      onChange={(e) => setUserDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select Department</option>
                      {assetDepartments.map(([id, dep]) => (
                        <option key={id} value={id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {(role === "maintenance_head" ||
                  role === "maintenance_technician") && (
                  <div>
                    <label className="font-semibold text-gray-700">
                      Maintenance Team
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded px-4 py-2"
                      value={userDepartment}
                      onChange={(e) => setUserDepartment(e.target.value)}
                      required
                    >
                      <option value="">Select Maintenance Team</option>
                      {maintenanceDepartments.map(([id, dep]) => (
                        <option key={id} value={id}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-6">
            <button
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              onClick={handleAddUser}
            >
              Add User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
