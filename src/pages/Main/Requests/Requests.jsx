import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddRequest from "./AddRequest";
import RequestDetails from "./RequestDetails";
import { fetchUsers } from "../../../firebase/userservices";
import Modal from "../../../components/Modal/Modal";
import { FiArrowLeft, FiFilter, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";
import { Html5Qrcode } from "html5-qrcode";

const Requests = () => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [isAddingRequest, setIsAddingRequest] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { profile } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [reportedAsset, setReportedAsset] = useState(null);

  const [statusFilters, setStatusFilters] = useState({
    Pending: false,
    Rejected: false,
    Approved: false,
    Ongoing: false,
    Resolved: false,
  });

  const [priorityFilter, setPriorityFilter] = useState({
    Low: false,
    Medium: false,
    High: false,
    Critical: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  const getPriorityLabel = (score) => {
    if (score <= 24) return "Low";
    if (score <= 49) return "Medium";
    if (score <= 74) return "High";
    return "Critical";
  };

  const getUsers = async () => {
    try {
      const userData = await fetchUsers();
      setUsers(userData || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
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
    getUsers();
  }, []);

  const getRequestRealtime = () => {
    const q = query(
      collection(db, "requests"),
      orderBy("priorityScore", "desc")
    );
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

  const handleStatusFilterChange = (status) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const handlePriorityFilterChange = (priority) => {
    setPriorityFilter((prev) => ({ ...prev, [priority]: !prev[priority] }));
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

    const isReportedBy =
      request.reportedBy?.includes(profile?.id) || profile?.role === "maintenance_head";

    return matchesSearch && matchesStatus && isReportedBy;
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

  const scanQrCode = () => {
    setShowScanner(true);
  };

  const [scanResult, setScanResult] = useState(null);
  const [html5QrCode, setHtml5QrCode] = useState(null);
  const [scannerStarted, setScannerStarted] = useState(false);

  useEffect(() => {
    if (!showScanner) {
      if (html5QrCode && scannerStarted) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
            setScannerStarted(false);
          })
          .catch((err) => console.error("Failed to stop camera", err));
      }
      return;
    }

    const qrCodeScanner = new Html5Qrcode("reader");
    setHtml5QrCode(qrCodeScanner);

    qrCodeScanner
      .start(
        { facingMode: "environment" },
        {
          fps: 5,
          qrbox: { width: 200, height: 200 },
        },
        (decodedText) => {
          qrCodeScanner.stop().then(() => qrCodeScanner.clear());
          setScanResult(decodedText);
          setScannerStarted(false);
        },
        (errorMessage) => {
          console.warn(errorMessage);
        }
      )
      .then(() => {
        setScannerStarted(true);
      })
      .catch((err) => {
        console.error("Start failed", err);
      });

    return () => {
      if (qrCodeScanner && scannerStarted) {
        qrCodeScanner
          .stop()
          .then(() => {
            qrCodeScanner.clear();
            setScannerStarted(false);
          })
          .catch((err) =>
            console.error("Failed to stop camera on unmount", err)
          );
      }
    };
  }, [showScanner]);

  useEffect(() => {
    if (scanResult) {
      setReportedAsset(scanResult);
      setShowScanner(false);
      setScanResult(null);
      setIsAddingRequest(true);
    }
  }, [scanResult]);

  return (
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-[120px]">
            Request List
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

          <button
            className="hidden sm:flex order-4 rounded-md bg-gray-800 px-3 py-1 text-white hover:bg-gray-900 items-center gap-1"
            onClick={() => scanQrCode()}
          >
            <FiPlus /> Add Request
          </button>

          {/* Floating button for mobile */}
          <button
            onClick={() => scanQrCode()}
            className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 sm:hidden"
            aria-label="Add Request"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>

        <table className="w-full border-collapse text-white mt-5">
          <thead>
            <tr>
              <th className="w-[20%] text-start">Request Type</th>
              <th className="hidden sm:table-cell w-[25%] text-start">
                Description
              </th>
              <th className="w-[17.5%] text-start">Status</th>
              <th className="hidden sm:table-cell w-[17.5%] text-start">Priority Level</th>
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
                    {request.requestType}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {request.description}
                  </td>
                  <td
                    className={`w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    <span
                      className={`status-indicator status-${
                        request.status?.toLowerCase().replace(/\s+/g, "-") ||
                        "unknown"
                      }`}
                    ></span>
                    {request.status || "N/A"}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    <span
                      className={`status-indicator priority-${
                        getPriorityLabel(request.priorityScore)
                          ?.toLowerCase()
                          .replace(/\s+/g, "-") || "unknown"
                      }`}
                    ></span>
                    {getPriorityLabel(request.priorityScore)}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {getUserFullName(request.reportedBy)}
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

      {isAddingRequest && (
        <AddRequest
          assetId={reportedAsset}
          onClose={() => setIsAddingRequest(false)}
        />
      )}
      {selectedRequest && (
        <RequestDetails
          requestDetails={selectedRequest}
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

              {/* Priority Filter */}
              <div>
                <h4 className="text-md font-medium mb-2">Priority</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(priorityFilter).map((priority) => (
                    <label
                      key={priority}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={priorityFilter[priority] || false}
                        onChange={() => handlePriorityFilterChange(priority)}
                      />
                      {priority}
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

      {showScanner && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowScanner(false)}
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-[400px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <FiArrowLeft className="cursor-pointer" onClick={() => setShowScanner(false)} />
                <h3 className="text-lg font-semibold">Scan QR Code</h3>
              </div>
            </div>
            <div id="reader"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
