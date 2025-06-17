import { useState, useEffect } from "react";
import { fetchCategories } from "../../../firebase/categoryservices";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddAsset from "./AddAsset";
import AssetUnitDetails from "./AssetUnitDetails";
import { FiFilter, FiPlus, FiX } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

const AssetList = ({ onClose, onSelectAsset }) => {
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  const [categoryFilters, setCategoryFilters] = useState({});
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
    const unsubscribe = onSnapshot(
      collection(db, "assets"),
      (querySnapshot) => {
        const assetList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAssets(assetList);
      },
      (error) => {
        console.error("Error in real-time fetching assets:", error);
        setAssets([]);
      }
    );

    fetchCategories()
      .then((categoryData) => {
        const categoryMap = categoryData.reduce((acc, category) => {
          acc[category.id] = category.name;
          setCategoryFilters((prev) => ({
            ...prev,
            [category.id]: false,
          }));
          return acc;
        }, {});
        setCategories(categoryMap);
      })
      .catch((error) => {
        console.error("Error fetching category:", error);
        setCategories({});
      });

    return () => unsubscribe();
  }, []);

  const handleCategoryFilterChange = (categoryId) => {
    setCategoryFilters((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
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
    const resetCategoryFilters = Object.keys(categoryFilters).reduce(
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

    setCategoryFilters(resetCategoryFilters);
    setStatusFilters(resetStatusFilters);
  };

  useEffect(() => {
    document
      .querySelector(".table-wrapper")
      ?.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const filteredData = assets.filter((asset) => {
    const matchesSearch =
      searchQuery === "" ||
      asset.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categories[asset.category]
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const selectedCategories = Object.keys(categoryFilters).filter(
      (key) => categoryFilters[key]
    );
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(asset.category);

    return matchesSearch && matchesCategory;
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
    Object.values(categoryFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  const handleAssetSelection = (asset) => {
    setSelectedAsset(asset);
    onSelectAsset(asset);
    onClose();
  };

  return (
    <>
      <div className="sticky top-0 flex-shrink-0 min-h-[5rem] rounded-lg bg-gray-600 text-white px-4 pt-8 pb-2">
        <div className="flex flex-wrap items-center gap-2 mb-2 px-2">
          <h1 className="flex-1 text-xl font-semibold order-1 mr-auto min-w-[120px]">
            Asset List
            <span className="ml-4 text-gray-300">{filteredData.length}</span>
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

          {profile?.role === "operational_administrator" && (
            <>
              <button
                className="hidden sm:flex order-4 rounded-md bg-gray-800 px-3 py-1 text-white hover:bg-gray-900 items-center gap-1"
                onClick={() => setIsAddingAsset(true)}
              >
                <FiPlus />
                Add Asset
              </button>

              {/* Floating button for mobile */}
              <button
                onClick={() => setIsAddingAsset(true)}
                className="fixed bottom-5 right-5 z-50 inline-flex items-center justify-center rounded-full bg-blue-600 p-4 text-white shadow-lg hover:bg-blue-700 sm:hidden"
                aria-label="Add Asset"
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
              <th className="w-[35%] text-start">Name</th>
              <th className="w-[35%] text-start">Category</th>
              <th className="hidden sm:table-cell w-[30%] text-start">
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
              paginatedData.map((asset) => (
                <tr
                  key={asset.id}
                  onClick={() => {
                    handleAssetSelection(asset);
                  }}
                  className={`${
                    asset.dateUpdated.toDate() >
                    new Date(Date.now() - 5 * 60 * 1000)
                      ? "bg-green-100"
                      : ""
                  }`}
                >
                  <td
                    className={`w-[35%] border-b border-gray-300 py-2 truncate`}
                  >
                    {asset.name}
                  </td>
                  <td
                    className={`w-[35%] border-b border-gray-300 py-2 truncate`}
                  >
                    {categories[asset.category] || "Unknown"}
                  </td>
                  <td
                    className={`hidden sm:table-cell w-[30%] border-b border-gray-300 py-2 truncate`}
                  >
                    {asset.dateUpdated
                      ? timeAgo(asset.dateUpdated.toDate())
                      : "N/A"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-3 py-6 text-center text-gray-500">
                  No Asset found
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

      {isAddingAsset && <AddAsset onClose={() => setIsAddingAsset(false)} />}

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
              <h3 className="text-lg font-semibold">Filter Assets</h3>
              <FiX
                className="cursor-pointer text-2xl p-1 rounded hover:bg-gray-500 transition-colors"
                onClick={() => setShowFilterModal(false)}
              />
            </div>

            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Categories Filter */}
              <div>
                <h4 className="text-md font-medium mb-2">Categories</h4>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(categories).map(([id, name]) => (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={categoryFilters[id] || false}
                        onChange={() => handleCategoryFilterChange(id)}
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

export default AssetList;
