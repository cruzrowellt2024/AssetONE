import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddUser from "./AddUser";
import UserDetails from "../UserManagement/UserDetails";
import Modal from "../../../components/Modal/Modal";
import { FiFilter, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const { profile } = useAuth();

  const [roleFilters, setRoleFilters] = useState({
    system_administrator: false,
    operational_administrator: false,
    department_manager: false,
    finance: false,
    maintenance_head: false,
    maintenance_technician: false,
    reporter: false,
  });

  const ROLE_LABELS = {
    system_administrator: "System Administrator",
    operational_administrator: "Operational Administrator",
    department_manager: "Department Manager",
    finance: "Finance",
    maintenance_head: "Maintenance Head",
    maintenance_technician: "Maintenance Technician",
    reporter: "Reporter",
  };

  const [statusFilters, setStatusFilters] = useState({
    Available: false,
    "In Operation": false,
    Unavailable: false,
  });

  const getPriorityLabel = (score) => {
    if (score <= 25) return "Default Priority";
    if (score <= 50) return "Medium";
    if (score <= 75) return "High";
    if (score <= 100) return "Top Priority";
    return "None";
  };

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
    setRoleFilters(
      Object.keys(roleFilters).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    );
    setStatusFilters(
      Object.keys(statusFilters).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {})
    );
  };

  const applyFilters = () => {
    setShowFilterModal(false);
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

    const selectedRoles = Object.keys(roleFilters).filter(
      (r) => roleFilters[r]
    );
    const matchesRole =
      selectedRoles.length === 0 || selectedRoles.includes(user.role);

    const selectedStatuses = Object.keys(statusFilters).filter(
      (s) => statusFilters[s]
    );
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(user.status);

    const isTeam =
      (profile?.role === "operational_administrator" &&
        (user.role === profile?.role || user.role === "department_manager")) ||
      (profile?.role === "maintenance_head" &&
        (user.role === profile?.role ||
          user.role === "maintenance_technician")) ||
      profile?.role === "system_administrator";

    return matchesSearch && matchesRole && matchesStatus && isTeam;
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
    <div className="flex flex-col m-4 w-[calc(100%-2rem)] h-[calc(100%-2rem)] max-h-[calc(100%-6rem)] rounded-lg shadow-2xl">
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-[120px]">
            User List
            <span className="ml-4 text-gray-300">{filteredUsers.length}</span>
          </h1>

          <input
            type="text"
            className="order-2 min-w-[100px] max-w-[300px] flex-grow rounded-md border-none px-2 py-1 text-black"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            onClick={() => setShowFilterModal(true)}
            className="order-3 ml-auto relative flex items-center justify-center rounded-md border border-gray-300 bg-gray-100 p-1.5 text-gray-700 transition hover:bg-gray-200"
            aria-label="Filter"
          >
            <FiFilter className="text-lg" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          {profile.role === "system_administrator" && (
            <>
              <button
                onClick={() => setIsAddingUser(true)}
                className="hidden sm:flex order-4 rounded-md bg-gray-800 px-3 py-1 text-white hover:bg-gray-900 items-center gap-1"
              >
                <FiPlus /> Add User
              </button>

              {/* Floating button for mobile */}
              <button
                onClick={() => setIsAddingUser(true)}
                className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 sm:hidden"
                aria-label="Add User"
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
            </>
          )}
        </div>

        <table className="w-full border-collapse text-white mt-5">
          <thead>
            <tr>
              <th className="w-[25%] text-start">Name</th>
              <th className="hidden sm:table-cell w-[20%] text-start">
                Priority Level
              </th>
              <th className="w-[20%] text-start">Role</th>
              <th className="hidden sm:table-cell w-[17.5%] text-start">
                Updated
              </th>
              <th className="hidden sm:table-cell w-[17.5%] text-start">
                Created
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-grow overflow-y-auto bg-white px-4 rounded-b-lg">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="cursor-pointer hover:bg-gray-100"
                >
                  <td
                    className={`w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {user.firstName} {user.lastName}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {getPriorityLabel(user.priorityScore) ||
                      user.priorityScore}
                  </td>
                  <td
                    className={`w-[20%] border-b border-gray-300 py-2 truncate`}
                  >
                    {ROLE_LABELS[user.role] || user.role}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    {user.dateUpdated
                      ? timeAgo(user.dateUpdated.toDate())
                      : "N/A"}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[17.5%] border-b border-gray-300 py-2 truncate`}
                  >
                    {user.dateCreated
                      ? timeAgo(user.dateCreated.toDate())
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-3 py-6 text-center text-gray-500">
                  No Users found
                </td>
              </tr>
            )}
          </tbody>
        </table>

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
      </div>

      {selectedUser && (
        <UserDetails
          userDetails={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {isAddingUser && <AddUser onClose={() => setIsAddingUser(false)} />}

      {showFilterModal && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setShowFilterModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gray-700 text-white flex items-center justify-between py-4 px-6 rounded-t-lg">
              <h3 className="text-lg font-semibold">Filter Users</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowFilterModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Role Filters */}
              <div>
                <h4 className="text-md font-medium mb-2">Roles</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.keys(roleFilters).map((role) => (
                    <label
                      key={role}
                      className="flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={roleFilters[role]}
                        onChange={() => handleRoleFilterChange(role)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {ROLE_LABELS[role] || role}
                    </label>
                  ))}
                </div>
              </div>

              {/* Status Filters */}
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
                        checked={statusFilters[status]}
                        onChange={() => handleStatusFilterChange(status)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
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

export default UserManagement;
