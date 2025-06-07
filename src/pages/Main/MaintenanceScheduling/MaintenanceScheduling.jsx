import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddSchedule from "./AddSchedule";
import MaintenanceScheduleDetails from "./MaintenanceScheduleDetails";
import Modal from "../../../components/Modal/Modal"; // Assuming you want a modal for filters
import { FiFilter, FiPlus } from "react-icons/fi"; // Icon for filters
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
    "Preventive": false,
    "Corrective": false
  });
  const [statusFilters, setStatusFilters] = useState({
    "Pending": false,
    "Ongoing": false,
    "Completed": false,
    "Cancelled": false
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
    setMaintenanceTypeFilters(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilters(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  const applyFilters = () => {
    setShowFilterModal(false);
  };

  const resetFilters = () => {
    const resetMaintenanceTypeFilters = Object.keys(maintenanceTypeFilters).reduce((acc, key) => {
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
    const assetIds = Array.isArray(schedule.assets) ? schedule.assets : [schedule.assets];
    const assets = assetIds.map(id => assetMap[id]).filter(Boolean);

    if (assets.length === 0) return false;

    const assetNames = assets.map(asset => asset.name?.toLowerCase() || "").join(" ");

    const title = schedule.title?.toLowerCase() || "";
    const type = schedule.maintenanceType?.toLowerCase() || "";

    const matchesSearch =
      searchQuery === "" ||
      assetNames.includes(searchQuery.toLowerCase()) ||
      title.includes(searchQuery.toLowerCase()) ||
      type.includes(searchQuery.toLowerCase());

    const selectedMaintenanceTypes = Object.keys(maintenanceTypeFilters).filter(key => maintenanceTypeFilters[key]);
    const matchesMaintenanceType = selectedMaintenanceTypes.length === 0 || selectedMaintenanceTypes.includes(schedule.maintenanceType);

    const selectedStatuses = Object.keys(statusFilters).filter(key => statusFilters[key]);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(schedule.status);

    const isAssignedToUser = (schedule.assignedTechnicians?.includes(profile.id) || profile?.role === "Department Manager") || profile?.role === "Admin";

    const matchesDepartment = assets.some(asset => asset.department === profile?.department) || profile?.role === "Admin";

    return matchesSearch && matchesMaintenanceType && matchesStatus && isAssignedToUser && matchesDepartment;
  });

  const totalPages = Math.ceil(filteredSchedules.length / rowsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const activeFilterCount =
    Object.values(maintenanceTypeFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  return (
    <div className="table-container">
      <div className="page-table-header">
        <div className="header-top">
          <h1 className="title">
            Maintenance Schedule List
            <span className="table-title-style">{filteredSchedules.length}</span>
          </h1>
          <input
            type="text"
            className="search-bar"
            placeholder="Search by asset, title, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="filter-button"
            onClick={() => setShowFilterModal(true)}
          >
            <FiFilter /> {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          {(profile?.role === "Admin" || profile?.role === "Department Manager") && (
            <button className="add-data-btn" onClick={() => setIsAddingSchedule(true)}>
              <FiPlus /> Add Schedule
            </button>
          )}
        </div>
        <table className="header-table">
          <thead>
            <tr>
              <th>Schedule ID</th>
              <th>Schedule Title</th>
              <th>Maintenance Type</th>
              <th>Status</th>
              <th>Priority Level</th>
              <th>Scheduled Date</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="table-wrapper">
        <table className="body-table">
          <tbody>

            {paginatedSchedules.length > 0 ? (
              paginatedSchedules.map((schedule) => (
                <tr
                  key={schedule.id}
                  onClick={() => setSelectedSchedule(schedule)}
                  style={{ cursor: "pointer" }}
                >
                  <td>{schedule.id}</td>
                  <td>{schedule.title}</td>
                  <td>{schedule.maintenanceType}</td>
                  <td>
                    <span className={`status-indicator status-${schedule.status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}></span>
                    {schedule.status}</td>
                  <td>
                    <span className={`status-indicator priority-${getPriorityLabel(schedule.priorityScore)?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}></span>
                    {getPriorityLabel(schedule.priorityScore)}
                  </td>
                  <td>{schedule.scheduledDate?.toDate().toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No Schedule found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="pagination-controls">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="pagination-button"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="pagination-button"
        >
          Next
        </button>
      </div>

      {isAddingSchedule && <AddSchedule onClose={() => setIsAddingSchedule(false)} />}
      {selectedSchedule && (
        <MaintenanceScheduleDetails
          scheduleDetails={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <Modal onClose={() => setShowFilterModal(false)} title="Filter Schedules">
          <div className="filter-modal-content">
            <div className="filter-section">
              <h3>Maintenance Type</h3>
              <div className="filter-checkboxes">
                {Object.keys(maintenanceTypeFilters).map((type) => (
                  <label key={type} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={maintenanceTypeFilters[type] || false}
                      onChange={() => handleMaintenanceTypeFilterChange(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h3>Status</h3>
              <div className="filter-checkboxes">
                {Object.keys(statusFilters).map((status) => (
                  <label key={status} className="filter-checkbox-label">
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

            <div className="filter-modal-actions">
              <button className="reset-filter-button" onClick={resetFilters}>Reset Filters</button>
              <button className="apply-button" onClick={applyFilters}>Apply Filters</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MaintenanceScheduling;