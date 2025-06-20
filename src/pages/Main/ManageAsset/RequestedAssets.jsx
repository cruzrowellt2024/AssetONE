import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import RequestDetails from "../Requests/RequestDetails";
import { fetchUsers } from "../../../firebase/userservices";
import { FiFilter, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import RequestAssetsDetails from "./RequestedAssetsDetails";
import { fetchAssets } from "../../../firebase/assetservices";

const RequestedAssets = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { profile } = useAuth();

  const [statusFilters, setStatusFilters] = useState({
    Pending: false,
    Rejected: false,
    Approved: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  const getPriorityLabel = (score) => {
    if (score <= 24) return "Low";
    if (score <= 49) return "Medium";
    if (score <= 74) return "High";
    if (score <= 100) return "Critical";
    return "Very Low";
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-yellow-500";
      case "acquired":
        return "bg-blue-500";
      case "approved":
        return "bg-green-700";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getPriorityColor = (priorityLabel) => {
    switch (priorityLabel?.toLowerCase()) {
      case "very low":
        return "bg-gray-400";
      case "low":
        return "bg-blue-500";
      case "medium":
        return "bg-yellow-500";
      case "high":
        return "bg-orange-500";
      case "critical":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getData = async () => {
    try {
      const userData = await fetchUsers();
      const assetData = await fetchAssets();
      setUsers(userData || []);
      setAssets(assetData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setAssets([]);
    }
  };

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    getData();
  }, []);

  const getRequestRealtime = () => {
    const q = query(collection(db, "unit_requests"));
    return onSnapshot(
      q,
      (snapshot) => {
        const requestList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(requestList);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setRequests([]);
      }
    );
  };

  useEffect(() => {
    const unsubscribe = getRequestRealtime();
    return () => unsubscribe();
  }, []);

  const getUserFullName = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
  };

  const getUserRole = (userId) => {
    const user = users.find((user) => user.id === userId);
    return user ? `${user.role}` : "Unknown User";
  };

  const getAssetName = (assetId) => {
    const asset = assets.find((asset) => asset.id === assetId);
    return asset ? `${asset.name}` : "Unknown Asset";
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    const reset = Object.fromEntries(
      Object.keys(statusFilters).map((k) => [k, false])
    );
    setStatusFilters(reset);
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      searchQuery === "" ||
      request.requestType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const selectedStatuses = Object.keys(statusFilters).filter(
      (k) => statusFilters[k]
    );
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(request.status);

    const isRequestedByOperationalAdmin =
      getUserRole(request.requestedBy) === "operational_administrator";

    return matchesSearch && matchesStatus && isRequestedByOperationalAdmin;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
  const paginatedData = filteredRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageNumbersToShow = 5;
  const halfPageRange = Math.floor(pageNumbersToShow / 2);

  const getPageButtons = () => {
    const startPage = Math.max(currentPage - halfPageRange, 1);
    const endPage = Math.min(currentPage + halfPageRange, totalPages);

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return pageNumbers;
  };

  const pageButtons = getPageButtons();

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilters]);

  useEffect(() => {
    document
      .querySelector(".table-wrapper")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const activeFilterCount = Object.values(statusFilters).filter(Boolean).length;

  return (
    <>
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-[120px]">
            Unit Request List
            <span className="ml-4 text-gray-300">
              {filteredRequests.length}
            </span>
          </h1>
          <input
            type="text"
            className="order-2 min-w-[100px] max-w-[300px] flex-grow rounded-md border-none px-2 py-1 text-black"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="order-3 ml-auto relative flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 p-1.5 text-gray-700 transition hover:bg-gray-200"
            onClick={() => setShowFilterModal(true)}
          >
            <FiFilter className="text-lg" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        <table className="w-full border-collapse text-white mt-5">
          <thead>
            <tr>
              <th className="w-[20%] text-start">Asset</th>
              <th className="hidden sm:table-cell w-[25%] text-start">
                Reason
              </th>
              <th className="w-[17.5%] text-start">Status</th>
              <th className="hidden sm:table-cell w-[17.5%] text-start">
                Priority Level
              </th>
              <th className="hidden sm:table-cell w-[20%] text-start">
                Reported By
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-grow overflow-y-auto bg-white px-4 rounded-b-lg">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((request) => (
                <tr
                  key={request.id}
                  onClick={() => setSelectedRequest(request)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {getAssetName(request.asset)}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {request.reason}
                  </td>
                  <td
                    className={`w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          request.status
                        )}`}
                      ></span>
                      <span>{request.status || "N/A"}</span>
                    </div>
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-3 h-3 rounded-full ${getPriorityColor(
                          getPriorityLabel(request.priorityScore)
                        )}`}
                      ></span>
                      <span>{getPriorityLabel(request.priorityScore)}</span>
                    </div>
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {getUserFullName(request.requestedBy)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                  No Request found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="sticky bottom-0 mt-2 flex w-full items-center justify-center gap-2 rounded-b-lg bg-white py-2">
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            {"<<"}
          </button>
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            {"<"}
          </button>

          {pageButtons.map((pageNum) => (
            <button
              key={pageNum}
              className={`rounded border px-3 py-1 ${
                pageNum === currentPage
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 hover:bg-gray-200"
              }`}
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </button>
          ))}

          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            {">"}
          </button>
          <button
            className="rounded border border-gray-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            {">>"}
          </button>
        </div>
      )}

      {selectedRequest && (
        <RequestAssetsDetails
          requestAssetsDetails={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowFilterModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-700 text-white flex items-center justify-between py-4 px-6 rounded-t-lg">
              <h3 className="text-lg font-semibold">Filter Request</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowFilterModal(false)}
              />
            </div>

            {/* Filters */}
            <div className="p-6 space-y-6">
              {/* Status Filter */}
              <div>
                <h4 className="text-md font-medium mb-2">Status</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(statusFilters).map((status) => (
                    <label
                      key={status}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={statusFilters[status] || false}
                        onChange={() => handleStatusFilterChange(status)}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex justify-end items-center gap-4 p-6 border-t border-gray-200">
              <button
                className="text-gray-600 hover:text-gray-900 px-4 py-2 rounded border border-gray-300 hover:bg-gray-100 transition"
                onClick={resetFilters}
              >
                Reset Filters
              </button>
              <button
                className="bg-blue-600 text-white px-5 py-2 rounded hover:bg-blue-700 transition"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RequestedAssets;
