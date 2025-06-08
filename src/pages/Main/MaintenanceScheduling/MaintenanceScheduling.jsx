import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddSchedule from "./AddSchedule";
import MaintenanceScheduleDetails from "./MaintenanceScheduleDetails";
import { FiFilter, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

const MaintenanceScheduling = () => {
  const [schedules, setSchedules] = useState([]);
  const [assetMap, setAssetMap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const { profile } = useAuth();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Filters states
  const [maintenanceTypeFilters, setMaintenanceTypeFilters] = useState({
    Preventive: false,
    Corrective: false,
  });
  const [statusFilters, setStatusFilters] = useState({
    Pending: false,
    Ongoing: false,
    Completed: false,
    Cancelled: false,
  });

  const getPriorityLabel = (score) => {
    if (score <= 24) return "Low";
    if (score <= 49) return "Medium";
    if (score <= 74) return "High";
    return "Critical";
  };

  const getSchedulesRealtime = () => {
    const unsubscribe = onSnapshot(
      collection(db, "schedules"),
      (querySnapshot) => {
        const scheduleList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchedules(scheduleList);
      },
      (error) => {
        console.error("Error in real-time fetching schedules:", error);
        setSchedules([]);
      }
    );
    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "assets"), (snapshot) => {
      const map = {};
      snapshot.forEach((doc) => {
        map[doc.id] = doc.data(); // This stores the whole asset object
      });
      setAssetMap(map);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = getSchedulesRealtime();
    return () => unsubscribe();
  }, []);

  const handleMaintenanceTypeFilterChange = (type) => {
    setMaintenanceTypeFilters((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    const resetMaintenanceTypeFilters = Object.keys(
      maintenanceTypeFilters
    ).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    const resetStatusFilters = Object.keys(statusFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    setMaintenanceTypeFilters(resetMaintenanceTypeFilters);
    setStatusFilters(resetStatusFilters);
  };

  const filteredSchedules = schedules.filter((schedule) => {
    const assetIds = Array.isArray(schedule.assets)
      ? schedule.assets
      : [schedule.assets];
    const assets = assetIds.map((id) => assetMap[id]).filter(Boolean);

    if (assets.length === 0) return false;

    const assetNames = assets
      .map((asset) => asset.name?.toLowerCase() || "")
      .join(" ");

    const title = schedule.title?.toLowerCase() || "";
    const type = schedule.maintenanceType?.toLowerCase() || "";

    const matchesSearch =
      searchQuery === "" ||
      assetNames.includes(searchQuery.toLowerCase()) ||
      title.includes(searchQuery.toLowerCase()) ||
      type.includes(searchQuery.toLowerCase());

    const selectedMaintenanceTypes = Object.keys(maintenanceTypeFilters).filter(
      (key) => maintenanceTypeFilters[key]
    );
    const matchesMaintenanceType =
      selectedMaintenanceTypes.length === 0 ||
      selectedMaintenanceTypes.includes(schedule.maintenanceType);

    const selectedStatuses = Object.keys(statusFilters).filter(
      (key) => statusFilters[key]
    );
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes(schedule.status);

    const isAssignedToUser =
      schedule.assignedTechnicians?.includes(profile.id) ||
      profile?.role === "Department Manager" ||
      profile?.role === "Admin";

    const matchesDepartment =
      assets.some((asset) => asset.department === profile?.department) ||
      profile?.role === "Admin";

    return (
      matchesSearch &&
      matchesMaintenanceType &&
      matchesStatus &&
      isAssignedToUser &&
      matchesDepartment
    );
  });

  const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
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

  const activeFilterCount =
    Object.values(maintenanceTypeFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  return (
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-0">
            Maintenance Schedule List
            <span className="ml-4 text-gray-300">
              {filteredSchedules.length}
            </span>
          </h1>
          <input
            type="text"
            className="order-2 min-w-[120px] max-w-[200px] flex-grow rounded-md border-none px-2 py-1 text-black"
            placeholder="Search by asset, title, or type..."
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

          {[
            "system_administrator",
            "operational_administrator",
            "maintenance_head",
          ].includes(profile?.role) && (
            <button
              className="hidden sm:flex order-4 rounded-md bg-gray-800 px-3 py-1 text-white hover:bg-gray-900 items-center gap-1"
              onClick={() => setIsAddingSchedule(true)}
            >
              <FiPlus /> Add Schedule
            </button>
          )}

          {/* Floating button for mobile */}
          <button
            onClick={() => setIsAddingSchedule()}
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
              <th className="w-[20%] text-start">Schedule Title</th>
              <th className="w-[20%] text-start">Maintenance Type</th>
              <th className="w-[20%] text-start">Status</th>
              <th className="w-[20%] text-start">Priority Level</th>
              <th className="w-[20%] text-start">Scheduled Date</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-grow overflow-y-auto bg-white px-4 rounded-b-lg">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {paginatedSchedules.length > 0 ? (
              paginatedSchedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  onClick={() => setSelectedSchedule(schedule)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {schedule.title}
                  </td>
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {schedule.maintenanceType}
                  </td>
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    <span
                      className={`status-indicator status-${
                        schedule.status?.toLowerCase().replace(/\s+/g, "-") ||
                        "unknown"
                      }`}
                    ></span>
                    {schedule.status}
                  </td>
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    <span
                      className={`status-indicator priority-${
                        getPriorityLabel(schedule.priorityScore)
                          ?.toLowerCase()
                          .replace(/\s+/g, "-") || "unknown"
                      }`}
                    ></span>
                    {getPriorityLabel(schedule.priorityScore)}
                  </td>
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {schedule.scheduledDate?.toDate().toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-gray-500">No Schedule found</td>
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

      {isAddingSchedule && (
        <AddSchedule onClose={() => setIsAddingSchedule(false)} />
      )}
      {selectedSchedule && (
        <MaintenanceScheduleDetails
          scheduleDetails={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}

      {/* Filter Modal */}
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
              <h3 className="text-lg font-semibold">Filter Schedules</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowFilterModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Maintenance Type Filter */}
              <div>
                <h4 className="text-md font-medium mb-2">Maintenance Type</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(maintenanceTypeFilters).map((type) => (
                    <label
                      key={type}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={maintenanceTypeFilters[type] || false}
                        onChange={() => handleMaintenanceTypeFilterChange(type)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {type}
                    </label>
                  ))}
                </div>
              </div>

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
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
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
    </div>
  );
};

export default MaintenanceScheduling;
