import { useState, useEffect, useRef } from "react";
import {
  updateUnit,
  deleteUnit,
  fetchSpecs,
  updateUnitSpecs,
} from "../../../firebase/assetunitservices";
import { fetchCategories } from "../../../firebase/categoryservices";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { fetchLocations } from "../../../firebase/locationservices";
import { fetchVendors } from "../../../firebase/vendorservices";
import { useAuth } from "../../../context/AuthContext";
import {
  FiArrowLeft,
  FiCamera,
  FiCheckSquare,
  FiClock,
  FiTrash,
} from "react-icons/fi";
import { QRCodeCanvas } from "qrcode.react";
import Modal from "../../../components/Modal/Modal";
import MessageModal from "../../../components/Modal/MessageModal";
import ConfirmModal from "../../../components/Modal/ConfirmModal";
import MaintenanceHistory from "./MaintenanceHistory";
import { fetchSchedules } from "../../../firebase/maintenancescheduleservices";
import { fetchUsers } from "../../../firebase/userservices";
import SpinnerOverlay from "../../../components/SpinnerOverlay";

const AssetDetails = ({ unitDetails, onClose }) => {
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [users, setUsers] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [showQrCode, setShowQrCode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [locations, setLocations] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [assetSpecs, setAssetSpecs] = useState([]);
  const [specKey, setSpecKey] = useState("");
  const [specValue, setSpecValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const { profile } = useAuth();
  const qrRef = useRef();
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    if (unitDetails) {
      setSelectedUnit(unitDetails);
      getSpecs(unitDetails.id);
    }
  }, [unitDetails]);

  useEffect(() => {
    loadDropdownData(fetchCategories, setCategories);
    loadDropdownData(fetchDepartments, setDepartments);
    loadDropdownData(fetchLocations, setLocations);
    loadDropdownData(fetchVendors, setVendors);
  }, []);

  useEffect(() => {
    const loadSchedules = async () => {
      if (!selectedUnit?.id) return;

      try {
        const allSchedules = await fetchSchedules();

        const filtered = allSchedules.filter((schedule) => {
          const assetField = schedule.units;
          if (!assetField) return false;

          if (Array.isArray(assetField)) {
            return assetField.includes(selectedUnit.id);
          }

          return assetField === selectedUnit.id;
        });

        setSchedules(filtered);
      } catch (error) {
        console.error("Error loading schedules:", error);
        setSchedules([]);
      }
    };

    loadSchedules();
    getUsers();
  }, [selectedUnit]);

  const getSpecs = async (assetID) => {
    try {
      const assetData = await fetchSpecs(assetID);
      setAssetSpecs(assetData || []);
    } catch (error) {
      console.error("Error fetching asset specs:", error);
      setAssetSpecs([]);
    }
  };

  const getUsers = async () => {
    try {
      const userData = await fetchUsers();
      setUsers(userData || []);
      console.log(userData);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

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

  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;

    if (editingIndex !== null) {
      const updatedSpecs = [...assetSpecs];
      updatedSpecs[editingIndex] = { key: specKey, value: specValue };
      setAssetSpecs(updatedSpecs);
      setEditingIndex(null);
    } else {
      setAssetSpecs((prev) => [...prev, { key: specKey, value: specValue }]);
    }

    setSpecKey("");
    setSpecValue("");
  };

  const handleEditSpec = (index) => {
    setSpecKey(assetSpecs[index].key);
    setSpecValue(assetSpecs[index].value);
    setEditingIndex(index);
  };

  const handleDeleteSpec = (index) => {
    setAssetSpecs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateUnit = async () => {
    if (!selectedUnit) return;

    setIsLoading(true);

    try {
      const updatedAsset = {
        ...selectedUnit,
        cost: Number(selectedUnit.cost),
      };

      await updateUnit(updatedAsset, profile?.id);
      await updateUnitSpecs(selectedUnit.id, assetSpecs, profile?.id);

      setMessage("Asset details updated successfully!");
      setIsLoading(false);
    } catch (error) {
      console.error("Error updating asset:", error);
      setError("Failed to update asset. Please try again.");
      setIsLoading(false);
    }
    setShowDeleteModal(false);
  };

  const handleDeleteUnit = async () => {
    if (!selectedUnit || !selectedUnit.unitNumber) {
      setError("Invalid asset selected.");
      return;
    }

    setIsLoading(true);

    try {
      await deleteUnit(selectedUnit.id, profile?.id);
      setMessage("Asset was deleted successfully!");
      setIsLoading(false);
    } catch (error) {
      setError("Failed to delete asset. Please try again.");
      setIsLoading(false);
    }
    setShowDeleteModal(false);
  };

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleQrCode = () => {
    setShowQrCode((prevState) => !prevState);
  };

  const handleDownload = () => {
    const canvas = qrRef.current.querySelector("canvas");
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${selectedUnit.name}_QR_Code.png`;
    link.click();
  };

  if (!selectedUnit) {
    return <p>Loading asset details...</p>;
  }

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

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
        {/* Header */}
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft
              className="cursor-pointer hover:text-gray-300 transition"
              onClick={onClose}
            />
            <h3 className="text-lg font-semibold">Unit Details</h3>
            <button
              className="text-gray-200 hover:text-gray-300 px-4 py-3 rounded bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2"
              onClick={() => setShowHistoryModal(true)}
              title="Maintenance History"
            >
              <FiClock />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-gray-700 hover:bg-gray-600 transition flex items-center gap-2"
              onClick={handleQrCode}
              title="Scan QR Code"
            >
              <FiCamera />
              <span className="hidden lg:inline">Scan QR Code</span>
            </button>
            {["operational_administrator", "department_manager"].includes(
              profile.role
            ) && (
              <>
                {profile.role === "operational_administrator" && (
                  <button
                    className="text-gray-200 hover:text-gray-300 px-4 py-3 lg:py-2 rounded bg-red-600 hover:bg-red-500 transition flex items-center gap-2"
                    onClick={() => setShowDeleteModal(true)}
                    title="Delete Asset"
                  >
                    <FiTrash />
                    <span className="hidden lg:inline">Delete</span>
                  </button>
                )}
                <button
                  className="bg-green-600 text-white px-5 py-3 lg:py-2 rounded hover:bg-green-500 transition flex items-center gap-2"
                  onClick={() => setShowUpdateModal(true)}
                  title="Save Changes"
                >
                  <FiCheckSquare />
                  <span className="hidden lg:inline">Save</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1" style={{ minHeight: 0 }}>
          {showDeleteModal && (
            <ConfirmModal
              message={`Are you sure you want to delete Unit #${selectedUnit.unitNumber}?`}
              onConfirm={handleDeleteUnit}
              onCancel={() => setShowDeleteModal(false)}
            />
          )}

          {showUpdateModal && (
            <ConfirmModal
              message={`Are you sure you want to update Unit #${selectedUnit.unitNumber}?`}
              onConfirm={handleUpdateUnit}
              onCancel={() => setShowUpdateModal(false)}
            />
          )}

          {isLoading && <SpinnerOverlay logo="A" />}

          <MessageModal
            error={error}
            message={message}
            clearMessages={clearMessages}
          />

          {currentStep === 1 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Acquisition Date
                  </label>
                  <input
                    type="date"
                    className="mt-1 block w-full rounded-md border border-gray-100 px-3 py-2 text-sm shadow-sm"
                    value={selectedUnit?.dateAcquired || ""}
                    disabled
                    tabIndex={-1}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Acquisation Cost
                  </label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border border-gray-100 px-3 py-2 text-sm shadow-sm"
                    value={selectedUnit?.cost || ""}
                    disabled
                    tabIndex={-1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    value={selectedUnit.status || ""}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    onChange={(e) =>
                      setSelectedUnit({
                        ...selectedUnit,
                        status: e.target.value,
                      })
                    }
                  >
                    <option value="On Stock">On Stock</option>
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="Under Investigation">
                      Under Investigation
                    </option>
                    <option value="In Repair">In Repair</option>
                    <option value="Borrowed">Borrowed</option>
                    <option value="Broken">Broken</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Condition
                  </label>
                  <input
                    value={selectedUnit.condition || ""}
                    className="mt-1 block w-full rounded-md border border-gray-100 px-3 py-2 text-sm shadow-sm"
                    disabled
                  ></input>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Department
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedUnit?.department || ""}
                    onChange={(e) =>
                      setSelectedUnit({
                        ...selectedUnit,
                        department: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Department</option>
                    <option value="in_stock">No Department - On Stock</option>
                    {Object.entries(departments).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedUnit?.location || ""}
                    onChange={(e) =>
                      setSelectedUnit({
                        ...selectedUnit,
                        location: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Location</option>
                    <option value="in_stock">No Location - On Stock</option>
                    {Object.entries(locations).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Vendor
                  </label>
                  <select
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={selectedUnit?.vendor || ""}
                    onChange={(e) =>
                      setSelectedUnit({
                        ...selectedUnit,
                        vendor: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Vendor</option>
                    {Object.entries(vendors).map(([id, name]) => (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <h3 className="font-medium text-gray-800 mb-2">
                    Specifications
                  </h3>
                  {profile.role === "operational_administrator" && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Spec Name"
                        className="col-span-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={specKey}
                        onChange={(e) => setSpecKey(e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Spec Value"
                        className="col-span-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                        value={specValue}
                        onChange={(e) => setSpecValue(e.target.value)}
                      />
                      <button
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
                        onClick={handleAddSpec}
                      >
                        {editingIndex !== null ? "Update Spec" : "Add Spec"}
                      </button>
                    </div>
                  )}
                  {assetSpecs.length > 0 && (
                    <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                      {assetSpecs.map((spec, index) => (
                        <li
                          key={index}
                          className="flex justify-between items-center"
                        >
                          {spec.key}: {spec.value}
                          <div className="space-x-2">
                            <button
                              className="text-blue-600 hover:underline text-xs"
                              onClick={() => handleEditSpec(index)}
                            >
                              Edit
                            </button>
                            <button
                              className="text-red-600 hover:underline text-xs"
                              onClick={() => handleDeleteSpec(index)}
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (pagination/submit) */}
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
            <>
              <button
                onClick={prevStep}
                className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-400 transition"
              >
                Back
              </button>
            </>
          )}
        </div>
        {showQrCode && (
          <Modal
            onClose={() => setShowQrCode(false)}
            title={`QR Code for ${selectedUnit.name}`}
          >
            <div className="flex flex-col items-center py-8">
              <div ref={qrRef} className="m-auto">
                <QRCodeCanvas value={selectedUnit.id} size={256} />
              </div>
              <button
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500 transition"
                onClick={handleDownload}
              >
                Download QR Code
              </button>
            </div>
          </Modal>
        )}
        {showHistoryModal && (
          <MaintenanceHistory
            schedules={schedules}
            technicians={users}
            onClose={() => setShowHistoryModal(false)}
          />
        )}
      </div>
    </div>
  );
};

export default AssetDetails;
