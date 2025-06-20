import { useState, useEffect } from "react";
import { addSchedule } from "../../../firebase/maintenancescheduleservices";
import {
  fetchUnits,
  fetchUnitsByAssetId,
} from "../../../firebase/assetunitservices";
import { Timestamp } from "firebase/firestore";
import { fetchUsers } from "../../../firebase/userservices";
import { useAuth } from "../../../context/AuthContext";
import { FiArrowLeft } from "react-icons/fi";
import { fetchDepartments } from "../../../firebase/departmentservices";
import MessageModal from "../../../components/Modal/MessageModal";
import SpinnerOverlay from "../../../components/SpinnerOverlay";
import { fetchAssets } from "../../../firebase/assetservices";

const AddSchedule = ({ onClose }) => {
  const [technicians, setTechnicians] = useState({});
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assignedTechnicians, setAssignedTechnicians] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    units: [],
    title: "",
    description: "",
    scheduledDate: "",
    maintenanceType: "",
    frequency: "",
    nextSchedule: "",
    priorityScore: null,
    status: "Pending",
    requestId: "None",
    dueDate: null,
  });
  const [units, setUnits] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState("");
  const [departments, setDepartments] = useState([]);
  const [scheduleDepartment, setScheduleDepartment] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const { profile } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAddAsset = () => {
    if (!selectedAssetId) return;

    if (scheduleData.units.find((asset) => asset.id === selectedAssetId)) {
      setError("Asset already selected.");
      return;
    }

    if (
      scheduleData.maintenanceType === "Corrective" &&
      scheduleData.units.length >= 1
    ) {
      setError("Only one asset can be selected for corrective maintenance.");
      return;
    }

    const asset = units.find((a) => a.id === selectedAssetId);
    if (!asset) return;

    setScheduleData((prev) => ({
      ...prev,
      units: [...prev.units, { id: asset.id, name: asset.name }],
    }));
    setSelectedAssetId("");
  };

  const handleRemoveAsset = (idToRemove) => {
    setScheduleData((prev) => ({
      ...prev,
      units: prev.units.filter((a) => a.id !== idToRemove),
    }));
  };

  useEffect(() => {
    loadDropdownData(fetchDepartments, setDepartments);
    loadDropdownData(fetchAssets, setAssets);
  }, []);

  useEffect(() => {
    if (scheduleDepartment || profile?.department) {
      loadTechnicianDropdownData(fetchUsers, setTechnicians);
    }
  }, [scheduleDepartment, profile?.department]);

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

  const loadTechnicianDropdownData = async (fetchFn, setFn) => {
    try {
      const data = await fetchFn();
      const techniciansOnly = data.filter(
        (user) =>
          user.role === "Technician" &&
          (user.department === scheduleDepartment ||
            user.department === profile?.department)
      );

      const mappedTechnicians = techniciansOnly.reduce((acc, item) => {
        acc[item.id] = `${item.firstName} ${item.lastName}`;
        return acc;
      }, {});

      setFn(mappedTechnicians);
    } catch (error) {
      console.error(`Error fetching data:`, error);
      setFn({});
    }
  };

  const getUnits = async () => {
    try {
      if (!selectedAsset) return;
      const assetData = await fetchUnitsByAssetId(selectedAsset);
      setUnits(assetData);
    } catch (error) {
      console.error("Error fetching units:", error);
      setUnits([]);
    }
  };

  useEffect(() => {
    setUnits([]);
    getUnits();
  }, [scheduleDepartment, profile?.department, selectedAsset]);

  const getUnitsNumber = (unitId) => {
    const user = units.find((unit) => unit.id === unitId);
    return user ? `${user.unitNumber}` : "Unknown Unit";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    const numberFields = ["frequency", "priorityScore"];
    setScheduleData((prevState) => ({
      ...prevState,
      [name]: numberFields.includes(name) ? parseInt(value || "0", 10) : value,
    }));
  };

  const handleAddSchedule = async () => {
    const { units, description, maintenanceType } = scheduleData;

    if (!units.length || !description.trim() || !maintenanceType.trim()) {
      setError("All fields are required!");
      return;
    }

    if (
      (scheduleData.maintenanceType === "Corrective" &&
        scheduleData.units.length !== 1) ||
      (scheduleData.maintenanceType === "Preventive" &&
        scheduleData.units.length < 1)
    ) {
      setError("Please select appropriate number of units.");
      return;
    }

    setIsLoading(true);

    try {
      await addSchedule(
        {
          ...scheduleData,
          units: scheduleData.units.map((a) => a.id),
          priorityScore:
            scheduleData.priorityScore !== null
              ? parseInt(scheduleData.priorityScore)
              : null,
          scheduledDate: scheduleData.scheduledDate
            ? Timestamp.fromDate(new Date(scheduleData.scheduledDate))
            : null,
          dueDate: scheduleData.dueDate
            ? Timestamp.fromDate(new Date(scheduleData.dueDate))
            : null,
          nextSchedule: scheduleData.nextSchedule
            ? Timestamp.fromDate(new Date(scheduleData.nextSchedule))
            : null,
          dateCompleted: "",
          assignedTechnicians: assignedTechnicians.map((t) => t.id),
        },
        profile?.id
      );

      setMessage("Schedule was added successfully!");

      setScheduleData({
        units: [],
        title: "",
        description: "",
        scheduledDate: "",
        maintenanceType: "",
        frequency: "",
        nextSchedule: "",
        priorityScore: null,
        status: "Pending",
        dueDate: null,
      });
      setAssignedTechnicians([]);
      setDepartments([]);
      setCurrentStep(1);
      setIsLoading(false);
    } catch (error) {
      console.error("Error adding schedule:", error);
      setError("Failed to adding schedule. Please try again.");
      setIsLoading(false);
    }
  };

  const updateNextSchedule = (date, freq) => {
    if (date && freq) {
      const frequencyDays = parseInt(freq, 10);
      if (!isNaN(frequencyDays)) {
        let newDate = new Date(date);
        newDate.setDate(newDate.getDate() + frequencyDays);
        setScheduleData((prevState) => ({
          ...prevState,
          nextSchedule: newDate.toISOString().slice(0, 16),
        }));
      }
    } else {
      setScheduleData((prevState) => ({
        ...prevState,
        nextSchedule: null,
      }));
    }
  };

  const handleAddTechnician = () => {
    if (!selectedTechnicianId) return;

    if (assignedTechnicians.find((t) => t.id === selectedTechnicianId)) {
      setError("Technician already assigned.");
      return;
    }

    const name = technicians[selectedTechnicianId];
    setAssignedTechnicians([
      ...assignedTechnicians,
      { id: selectedTechnicianId, name },
    ]);
    setSelectedTechnicianId("");
  };

  const handleRemoveTechnician = (idToRemove) => {
    setAssignedTechnicians(
      assignedTechnicians.filter((t) => t.id !== idToRemove)
    );
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const clearMessages = () => {
    setError("");
    setMessage("");
  };

  useEffect(() => {
    setSelectedAssetId("");
    setScheduleData((prev) => ({ ...prev, units: [] }));
  }, [selectedAsset]);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft className="cursor-pointer" onClick={onClose} />
            <h3 className="text-lg font-semibold">Add Schedule</h3>
          </div>
        </div>

        {isLoading && <SpinnerOverlay logo="A" />}
        <MessageModal
          error={error}
          message={message}
          clearMessages={clearMessages}
        />

        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          {currentStep === 1 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Maintenance Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Maintenance Type
                  </label>
                  <select
                    name="maintenanceType"
                    value={scheduleData.maintenanceType || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Maintenance Type</option>
                    <option value="Preventive">Preventive</option>
                    <option value="Corrective">Corrective</option>
                  </select>
                </div>

                {/* Department (Admin only) */}
                {profile?.role === "Admin" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <select
                      value={scheduleDepartment}
                      onChange={(e) => setScheduleDepartment(e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Department</option>
                      {Object.entries(departments).map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Asset
                  </label>
                  <select
                    value={selectedAsset}
                    onChange={(e) => setSelectedAsset(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Asset</option>
                    {Object.entries(assets).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Asset(s) */}
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Unit
                  </label>
                  {scheduleData.maintenanceType === "Corrective" ? (
                    <select
                      name="assetId"
                      value={scheduleData.units[0]?.id || ""}
                      onChange={(e) => {
                        const selected = units.find(
                          (a) => a.id === e.target.value
                        );
                        if (selected) {
                          setScheduleData((prev) => ({
                            ...prev,
                            units: [{ id: selected.id, name: selected.name }],
                          }));
                        }
                      }}
                      className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Unit</option>
                      {units.length > 0 ? (
                        units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unit.unitNumber}
                          </option>
                        ))
                      ) : (
                        <option disabled>No units available</option>
                      )}
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <select
                        value={selectedAssetId}
                        onChange={(e) => setSelectedAssetId(e.target.value)}
                        className="mt-1 flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Unit</option>
                        {units.length > 0 ? (
                          units.map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.unitNumber}
                            </option>
                          ))
                        ) : (
                          <option disabled>No units available</option>
                        )}
                      </select>
                      <button
                        type="button"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-1"
                        onClick={handleAddAsset}
                      >
                        Add
                      </button>
                    </div>
                  )}
                  {scheduleData.maintenanceType === "Preventive" &&
                    scheduleData.units.length > 0 && (
                      <div className="mt-5">
                        <ul className="pl-5 list-disc text-sm text-gray-700">
                          {scheduleData.units.map((asset) => (
                            <li
                              key={asset.id}
                              className="flex justify-between items-center"
                            >
                              {getUnitsNumber(asset.id)}
                              <button
                                type="button"
                                className="text-red-600 hover:underline text-xs"
                                onClick={() => handleRemoveAsset(asset.id)}
                              >
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={scheduleData.title || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={scheduleData.description || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Priority
                  </label>
                  <select
                    name="priorityScore"
                    value={scheduleData.priorityScore || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Priority Level</option>
                    <option value="24">Low</option>
                    <option value="49">Medium</option>
                    <option value="74">High</option>
                    <option value="100">Very High</option>
                  </select>
                </div>

                {/* Scheduled Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Scheduled Date
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduledDate"
                    value={scheduleData.scheduledDate || ""}
                    onChange={(e) => {
                      handleChange(e);
                      updateNextSchedule(
                        e.target.value,
                        scheduleData.frequency
                      );
                    }}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Preventive-specific fields */}
                {scheduleData.maintenanceType === "Preventive" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Frequency (days)
                      </label>
                      <input
                        type="number"
                        name="frequency"
                        value={scheduleData.frequency ?? 0}
                        onChange={(e) => {
                          handleChange(e);
                          updateNextSchedule(
                            scheduleData.scheduledDate,
                            e.target.value
                          );
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Next Schedule
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduleData.nextSchedule || ""}
                        readOnly
                        className="mt-1 block w-full rounded-md bg-gray-100 border border-gray-300 shadow-sm px-3 py-2 text-sm"
                      />
                    </div>
                  </>
                )}

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Due Date
                  </label>
                  <input
                    type="datetime-local"
                    name="dueDate"
                    value={scheduleData.dueDate || ""}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                {/* Assign Technicians */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Assign Technicians
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedTechnicianId}
                      onChange={(e) => setSelectedTechnicianId(e.target.value)}
                      className="mt-1 flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Technician</option>
                      {Object.entries(technicians).map(([id, fullName]) => (
                        <option key={id} value={id}>
                          {fullName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-1"
                      onClick={handleAddTechnician}
                    >
                      Assign
                    </button>
                  </div>
                </div>

                {/* Display Assigned Technicians */}
                {assignedTechnicians.length > 0 && (
                  <ul className="pl-5 list-disc text-sm text-gray-700">
                    {assignedTechnicians.map((tech) => (
                      <li
                        key={tech.id}
                        className="flex justify-between items-center"
                      >
                        {tech.name}
                        <button
                          type="button"
                          className="text-red-600 hover:underline text-xs"
                          onClick={() => handleRemoveTechnician(tech.id)}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex justify-end gap-2 rounded-b-lg flex-shrink-0">
          {currentStep === 1 && (
            <button
              onClick={nextStep}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-500 transition"
            >
              Next
            </button>
          )}
          {currentStep === 2 && (
            <div>
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
              >
                Back
              </button>
              <button
                onClick={handleAddSchedule}
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Submit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddSchedule;
