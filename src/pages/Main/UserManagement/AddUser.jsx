import { useState, useEffect } from "react";
import { addUser } from "../../../firebase/userservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchTitles } from "../../../firebase/usertitleservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";

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
        loadDropdownData(fetchTitles, setTitles);
    }, []);

    const loadDropdownData = async (fetchFn, setFn) => {
        try {
            const data = await fetchFn();
            const mappedData = data.reduce((acc, item) => {
                acc[item.id] = item.name;
                return acc;
            }, {});
            setFn(mappedData);
        } catch (error) {
            console.error(`Error fetching data:`, error);
            setFn({});
        }
    };

    const handleAddUser = async () => {
        if ([firstName, lastName, email, password, role, userTitle].some(field => !field.trim())) {
            setError("All fields are required!");
            return;
        }

        setIsLoading(true);

        try {
            await addUser(firstName, lastName, email, password, role, userDepartment, userTitle, profile?.id);

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
                        <h3>Add User</h3>
                    </div>
                </div>

                <MessageModal error={error} message={message} clearMessages={clearMessages} />
                <div className="record-form">
                    <div className="record-form-group">
                        <label>First Name</label>
                        <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                        <label>Last Name</label>
                        <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                        <label >Email</label>
                        <input className="other-info" type="text" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                        <label>Password</label>
                        <input className="other-info" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                        <label>Role</label>
                        <select className="other-info" value={role} onChange={(e) => setRole(e.target.value)} required>
                            <option value="Admin">Admin</option>
                            <option value="Department Manager">Department Manager</option>
                            <option value="Technician">Technician</option>
                            <option value="Reporter">Reporter</option>
                        </select>
                        <label>Position</label>
                        <select className="other-info" value={userTitle} onChange={(e) => setUserTitle(e.target.value)} required>
                            <option value="">Select Position</option>
                            {Object.entries(titles).map(([id, name]) => (
                                <option key={id} value={id}>{name}</option>
                            ))}
                        </select>
                        {role !== "Admin" && (
                            <>
                                {role !== "Reporter" && (
                                    <>
                                        <label>Department</label>
                                        <select className="other-info" value={userDepartment} onChange={(e) => setUserDepartment(e.target.value)} required>
                                            <option value="">Select Department</option>
                                            {Object.entries(departments).map(([id, name]) => (
                                                <option key={id} value={id}>{name}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </>
                        )}
                    </div>

                    <button className="add-btn" onClick={handleAddUser}>Add User</button>

                </div>
            </div>
        </div>
    );
};

export default AddUser;