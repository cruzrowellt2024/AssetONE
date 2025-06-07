import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddUser from "./AddUser";
import UserDetails from "../UserManagement/UserDetails";
import Modal from "../../../components/Modal/Modal";
import { FiFilter, FiPlus } from "react-icons/fi";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [titles, setTitles] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [roleFilters, setRoleFilters] = useState({
    Admin: false,
    "Department Head": false,
    Technician: false,
    User: false,
  });

  const [statusFilters, setStatusFilters] = useState({
    Available: false,
    "In Operation": false,
    Unavailable: false,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 30;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "users"),
      (querySnapshot) => {
        const userList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(userList);
      },
      (error) => {
        console.error("Error fetching users in real-time:", error);
        setUsers([]);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "titles"),
      (querySnapshot) => {
        const titlesMap = {};
        querySnapshot.docs.forEach(doc => {
          titlesMap[doc.id] = doc.data().name;
        });
        setTitles(titlesMap);
      },
      (error) => {
        console.error("Error fetching titles:", error);
        setTitles({});
      }
    );
    return () => unsubscribe();
  }, []);


  const handleRoleFilterChange = (role) => {
    setRoleFilters((prev) => ({
      ...prev,
      [role]: !prev[role],
    }));
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilters((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const resetFilters = () => {
    const resetRoles = Object.keys(roleFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    const resetStatus = Object.keys(statusFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    setRoleFilters(resetRoles);
    setStatusFilters(resetStatus);
  };

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      year: 31536000,
      month: 2592000,
      day: 86400,
      hour: 3600,
      minute: 60,
      second: 1,
    };
    for (const [unit, value] of Object.entries(intervals)) {
      const count = Math.floor(seconds / value);
      if (count > 0) {
        return `${count} ${unit}${count !== 1 ? "s" : ""} ago`;
      }
    }
    return "just now";
  };

  const activeFilterCount =
    Object.values(roleFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchQuery === "" ||
      [user.id, user.firstName, user.lastName, user.role, user.status]
        .filter(Boolean)
        .some((value) =>
          value.toLowerCase().includes(searchQuery.toLowerCase())
        );

    const selectedRoles = Object.keys(roleFilters).filter((r) => roleFilters[r]);
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(user.role);

    const selectedStatuses = Object.keys(statusFilters).filter((s) => statusFilters[s]);
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(user.status);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);
  const paginatedData = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const pageNumbersToShow = 5; // Number of page buttons to show
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

  return (
    <div className="table-container">
      <div className="page-table-header">
        <div className="header-top">
          <h1 className="title">
            User List<span className="table-title-style">{filteredUsers.length}</span>
          </h1>
          <input
            type="text"
            className="search-bar"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-button" onClick={() => setShowFilterModal(true)}>
            <FiFilter /> {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>
          <button className="add-data-btn" onClick={() => setIsAddingUser(true)}>
            <FiPlus /> Add User
          </button>
        </div>

        <table className="header-table">
          <thead>
            <tr>
              <th>UID</th>
              <th>Name</th>
              <th>Position</th>
              <th>Role</th>
              <th>Updated</th>
              <th>Created</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="table-wrapper">
        <table className="body-table">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((user) => (
                <tr key={user.id} onClick={() => setSelectedUser(user)}>
                  <td>{user.id}</td>
                  <td>{user.firstName} {user.lastName}</td>
                  <td>{titles[user.title] || user.title}</td>
                  <td>{user.role}</td>
                  <td>{user.dateUpdated ? timeAgo(user.dateUpdated.toDate()) : "N/A"}</td>
                  <td>{user.dateCreated ? timeAgo(user.dateCreated.toDate()) : "N/A"}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No Users found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className="pagination-button"
        >
          Prev
        </button>

        {currentPage > halfPageRange + 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="pagination-button">1</button>
            <span>...</span>
          </>
        )}

        {pageButtons.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`pagination-button ${currentPage === page ? "active" : ""}`}
          >
            {page}
          </button>
        ))}

        {currentPage < totalPages - halfPageRange && (
          <>
            <span>...</span>
            <button onClick={() => setCurrentPage(totalPages)} className="pagination-button">{totalPages}</button>
          </>
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className="pagination-button"
        >
          Next
        </button>
      </div>

      {isAddingUser && <AddUser onClose={() => setIsAddingUser(false)} />}
      {selectedUser && <UserDetails userDetails={selectedUser} onClose={() => setSelectedUser(null)} />}

      {showFilterModal && (
        <Modal onClose={() => setShowFilterModal(false)} title="Filter Users">
          <div className="filter-modal-content">
            <div className="filter-section">
              <h3>Roles</h3>
              <div className="filter-checkboxes">
                {Object.keys(roleFilters).map((role) => (
                  <label key={role} className="filter-checkbox-label">
                    <input
                      type="checkbox"
                      checked={roleFilters[role]}
                      onChange={() => handleRoleFilterChange(role)}
                    />
                    {role}
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
                      checked={statusFilters[status]}
                      onChange={() => handleStatusFilterChange(status)}
                    />
                    {status}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-modal-actions">
              <button className="reset-filter-button" onClick={resetFilters}>
                Reset Filters
              </button>
              <button className="apply-button" onClick={() => setShowFilterModal(false)}>
                Apply Filters
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;