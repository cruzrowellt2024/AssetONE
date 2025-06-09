import { useState, useEffect } from "react";
import { addRequest } from "../../../firebase/requestservices";
import { useAuth } from "../../../context/AuthContext";
import { updateUnit, fetchUnitById } from "../../../firebase/assetunitservices";
import { fetchPositionById } from "../../../firebase/usertitleservices";
import { FiArrowLeft } from "react-icons/fi";
import MessageModal from "../../../components/Modal/MessageModal";

const AddRequest = ({ assetId, onClose }) => {
  const [requestType, setRequestType] = useState("");
  const [description, setDescription] = useState("");
  const [reportedAsset, setReportedAsset] = useState({});
  const [urgency, setUrgency] = useState(0);
  const [impact, setImpact] = useState(0);
  const [status, setStatus] = useState("");
  const { profile } = useAuth();
  const [enrichedProfile, setEnrichedProfile] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loadingAsset, setLoadingAsset] = useState(true);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const asset = await fetchUnitById(assetId);
        setReportedAsset(asset);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingAsset(false);
      }
    };

    if (assetId) loadAsset();
  }, [assetId]);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        let titleInfo = { name: "", score: 0 };
        if (profile?.title) {
          titleInfo = await fetchPositionById(profile.title);
        }
        setEnrichedProfile({
          ...profile,
          titleName: titleInfo.name,
          titleScore: titleInfo.score,
        });
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    if (profile) loadUserProfile();
  }, [profile]);

  const handleAddRequest = async () => {
    if (!requestType || !description.trim() || !reportedAsset) {
      alert("All fields are required!");
      return;
    }

    if (requestType === "Maintenance Request") {
      if (!urgency || !impact) {
        alert("All fields are required!");
        return;
      }
    } else if (requestType === "Asset Update Request") {
      if (!status) {
        alert("All fields are required!");
        return;
      }
    }

    try {
      const priorityScore = calculatePriorityScore({
        titleScore: enrichedProfile?.titleScore || 0,
        urgency: parseInt(urgency),
        impact: parseInt(impact),
      });
      const reportedBy = enrichedProfile?.id || "";
      let assetStatus = status;
      if (requestType === "Maintenance Request") assetStatus = "In Repair";

      const assetData = reportedAsset;

      await addRequest(
        requestType,
        reportedAsset.id,
        description,
        priorityScore,
        reportedBy,
        assetStatus
      );

      const updatedAsset = {
        ...assetData,
        status: "Under Investigation",
      };

      await updateUnit(updatedAsset);

      alert("Request was added successfully!");

      setRequestType("");
      setDescription("");
      onClose();
    } catch (error) {
      console.error("Error adding request:", error);
      alert("Failed to add request. Please try again.");
    }
  };

  function calculatePriorityScore({ titleScore, urgency, impact }) {
    const weightTitle = 0.5;
    const weightUrgency = 0.3;
    const weightImpact = 0.2;

    const normalizedTitle = Math.min(Math.max(titleScore, 0), 100);
    const normalizedUrgency = Math.min(Math.max(urgency, 0), 100);
    const normalizedImpact = Math.min(Math.max(impact, 0), 100);

    const score =
      normalizedTitle * weightTitle +
      normalizedUrgency * weightUrgency +
      normalizedImpact * weightImpact;

    return Math.round(score);
  }

  useEffect(() => {
    const status = reportedAsset.status?.toLowerCase();
    if (
      ["under investigation", "in repair", "broken", "disposed"].includes(status)
    ) {
      setRequestType("Asset Update Request");
      setMessage(`Asset is already reported and ${status}.`);
    } else {
      setRequestType("Maintenance Request");
    }
  }, [reportedAsset]);

  const clearMessages = () => {
    setError("");
    setMessage("");
    onClose();
  };

  if (loadingAsset) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
        <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
      </div>
    );
  }

  return (
    <>
      {["Under Investigation", "In Repair", "Broken", "Disposed"].includes(
        reportedAsset.status
      ) && profile.role === "Reporter" ? (
        <MessageModal error={error} message={message} clearMessages={clearMessages} />
      ) : (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-lg mx-4 p-6 overflow-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center mb-6">
              <FiArrowLeft
                className="text-gray-600 hover:text-gray-800 cursor-pointer mr-3"
                onClick={onClose}
                size={24}
              />
              <h3 className="text-xl font-semibold text-gray-900">
                {requestType === "Maintenance Request"
                  ? "Report Issue"
                  : "Update Asset Condition"}
              </h3>
            </div>

            <div className="space-y-5">
              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Reported Asset</label>
                <input
                  type="text"
                  placeholder="Scan QR Code"
                  value={reportedAsset.name || ""}
                  readOnly
                  className="border border-gray-300 rounded px-3 py-2 text-gray-700 bg-gray-100 cursor-not-allowed"
                />
              </div>

              <div className="flex flex-col">
                <label className="mb-1 font-medium text-gray-700">Description</label>
                <input
                  type="text"
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {requestType === "Maintenance Request" && (
                <>
                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-gray-700">
                      How urgent is the issue?
                    </label>
                    <select
                      value={urgency}
                      onChange={(e) => setUrgency(parseInt(e.target.value))}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select urgency level</option>
                      <option value="24">Minor – Doesn't affect usage</option>
                      <option value="49">Moderate – Affects performance</option>
                      <option value="74">Major – Prevents normal use</option>
                      <option value="100">Urgent – Needs immediate attention</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="mb-1 font-medium text-gray-700">Who is affected?</label>
                    <select
                      value={impact}
                      onChange={(e) => setImpact(parseInt(e.target.value))}
                      required
                      className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select who is affected</option>
                      <option value="24">Only me</option>
                      <option value="49">A small group (e.g. my team)</option>
                      <option value="74">A department or building</option>
                      <option value="100">The entire campus</option>
                    </select>
                  </div>
                </>
              )}

              {requestType === "Asset Update Request" && (
                <div className="flex flex-col">
                  <label className="mb-1 font-medium text-gray-700">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    required
                    className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Status</option>
                    <option value="Active">Active</option>
                    <option value="In Use">In Use</option>
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="In Repair">In Repair</option>
                    <option value="Borrowed">Borrowed</option>
                    <option value="Broken">Broken</option>
                    <option value="Disposed">Disposed</option>
                  </select>
                </div>
              )}

              <button
                onClick={handleAddRequest}
                className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddRequest;