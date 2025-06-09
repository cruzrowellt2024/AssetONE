import { useState, useEffect } from "react";
import { fetchDepartments } from "../../../firebase/departmentservices";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddAssetUnit from "./AddAssetUnit";
import AssetUnitDetails from "./AssetUnitDetails";
import { FiFilter, FiPlus, FiSearch, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

const UnitList = ({ assetDetails }) => {
  const [units, setUnits] = useState([]);
  const [departments, setDepartments] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const [departmentFilters, setDepartmentFilters] = useState({});
  const [statusFilters, setStatusFilters] = useState({
    Active: false,
    "In Use": false,
    "Under Investigation": false,
    "In Repair": false,
    Borrowed: false,
    Broken: false,
    Disposed: false,
  });

  const { profile } = useAuth();

  useEffect(() => {
    if (assetDetails) {
      setSelectedAsset(assetDetails);
      console.log("Selected Asset:", assetDetails);
    }
  }, [assetDetails]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "units"),
      (querySnapshot) => {
        const unitList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUnits(unitList);
      },
      (error) => {
        console.error("Error in real-time fetching units:", error);
        setUnits([]);
      }
    );

    fetchDepartments()
      .then((departmentData) => {
        const departmentMap = departmentData.reduce((acc, department) => {
          acc[department.id] = department.name;
          setDepartmentFilters((prev) => ({
            ...prev,
            [department.id]: false,
          }));
          return acc;
        }, {});
        setDepartments(departmentMap);
      })
      .catch((error) => {
        console.error("Error fetching department:", error);
        setDepartments({});
      });

    return () => unsubscribe();
  }, []);

  const handleDepartmentFilterChange = (departmentId) => {
    setDepartmentFilters((prev) => ({
      ...prev,
      [departmentId]: !prev[departmentId],
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
    const resetDepartmentFilters = Object.keys(departmentFilters).reduce(
      (acc, key) => {
        acc[key] = false;
        return acc;
      },
      {}
    );

    const resetStatusFilters = Object.keys(statusFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    setDepartmentFilters(resetDepartmentFilters);
    setStatusFilters(resetStatusFilters);
  };

  useEffect(() => {
    document
      .querySelector(".table-wrapper")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const filteredData = units.filter((unit) => {
    const matchesSearch =
      searchQuery === "" ||
      unit.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      departments[unit.department]
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const selectedDepartments = Object.keys(departmentFilters).filter(
      (key) => departmentFilters[key]
    );

    const matchesSelectedAsset =
      !selectedAsset || unit.asset === selectedAsset.id;

    const matchesDepartment =
      selectedDepartments.length === 0 ||
      selectedDepartments.includes(unit.department);

    const selectedStatuses = Object.keys(statusFilters).filter(
      (key) => statusFilters[key]
    );
    const matchesStatus =
      selectedStatuses.length === 0 || selectedStatuses.includes(unit.status);

    const isInDepartment =
      unit.department?.includes(profile?.department) ||
      profile?.role === "system_administrator" || "operational_administrator";

    return matchesSearch && matchesDepartment && matchesStatus && isInDepartment && matchesSelectedAsset;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
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
    Object.values(departmentFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  return (
    <>
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] border-t-2 border-t-gray-200 mt-2">
        <div className="flex flex-wrap items-center gap-2 mt-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-0">
            LIST OF UNITS
            <span className="ml-4 text-gray-300">{filteredData.length}</span>
          </h1>
          <div className="order-2 min-w-[120px] max-w-[200px] flex items-center flex-grow rounded-md border-none px-2 py-1 text-black bg-gray-200">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              className="w-full bg-transparent outline-none"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

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
            onClick={() => setIsAddingUnit(true)}
          >
            <FiPlus /> Add Unit
          </button>

          {/* Floating button for mobile */}
          <button
            onClick={() => setIsAddingUnit(true)}
            className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 sm:hidden"
            aria-label="Add Unit"
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

        <table className="w-full border-collapse mt-5 bg-gray-100">
          <thead className="bg-gray-200">
            <tr>
              <th className="w-[25%] text-start p-2">Unit Number</th>
              <th className="hidden sm:table-cell w-[25%] text-start p-2">
                Department
              </th>
              <th className="w-[25%] text-start p-2">Status</th>
              <th className="hidden sm:table-cell w-[25%] text-start p-2">
                Updated
              </th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="flex-grow overflow-y-auto bg-white px-4 rounded-b-lg">
        <table className="w-full border-collapse table-fixed">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((unit) => (
                <tr key={unit.id} onClick={() => setSelectedUnit(unit)}>
                  <td
                    className={`w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {unit.unitNumber}
                  </td>
                  <td
                    className={`w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {departments[unit.department] || (unit.department === "on_stock" ? "Inventory - On Stock" : "Unknown")}
                  </td>
                  <td
                    className={`w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    <span
                      className={`status-indicator status-${
                        unit.status?.toLowerCase().replace(/\s+/g, "-") ||
                        "unknown"
                      }`}
                    ></span>
                    {unit.status}
                  </td>
                  <td
                    className={`w-[25%] border-b border-gray-300 py-2 truncate`}
                  >
                    {unit.dateUpdated
                      ? timeAgo(unit.dateUpdated.toDate())
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-gray-500">
                  No Unit found
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

      {isAddingUnit && <AddAssetUnit assetDetails={selectedAsset} onClose={() => setIsAddingUnit(false)} />}
      {selectedUnit && (
        <AssetUnitDetails
          unitDetails={selectedUnit}
          onClose={() => setSelectedUnit(null)}
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
              <h3 className="text-lg font-semibold">Filter Units</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowFilterModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Departments Filter */}
              <div>
                <h4 className="text-md font-medium mb-2">Departments</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(departments).map(([id, name]) => (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={departmentFilters[id] || false}
                        onChange={() => handleDepartmentFilterChange(id)}
                      />
                      {name}
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
    </>
  );
};

export default UnitList;
