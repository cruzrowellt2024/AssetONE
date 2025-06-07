import { useState, useEffect } from "react";
import { fetchCategories } from "../../../firebase/categoryservices";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddAsset from "./AddAsset";
import AssetDetails from "./AssetDetails";
import Modal from "../../../components/Modal/Modal";
import { FiFilter, FiPlus } from "react-icons/fi";
import { useAuth } from "../../../context/AuthContext";

const ManageAsset = () => {
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
    "Active": false,
    "In Use": false,
    "Under Investigation": false,
    "In Repair": false,
    "Borrowed": false,
    "Broken": false,
    "Disposed": false
  });

  const { profile } = useAuth();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "assets"), (querySnapshot) => {
      const assetList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAssets(assetList);
    }, (error) => {
      console.error("Error in real-time fetching assets:", error);
      setAssets([]);
    });

    fetchCategories()
      .then((categoryData) => {
        const categoryMap = categoryData.reduce((acc, category) => {
          acc[category.id] = category.name;
          setCategoryFilters(prev => ({
            ...prev,
            [category.id]: false
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
    setCategoryFilters(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
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
    const resetCategoryFilters = Object.keys(categoryFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    const resetStatusFilters = Object.keys(statusFilters).reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});

    setCategoryFilters(resetCategoryFilters);
    setStatusFilters(resetStatusFilters);
  };

  useEffect(() => {
    document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const filteredData = assets.filter((asset) => {
    const matchesSearch =
      searchQuery === "" ||
      asset.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categories[asset.category]?.toLowerCase().includes(searchQuery.toLowerCase());

    const selectedCategories = Object.keys(categoryFilters).filter(key => categoryFilters[key]);
    const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(asset.category);

    const selectedStatuses = Object.keys(statusFilters).filter(key => statusFilters[key]);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(asset.status);

    const isInDepartment = asset.department?.includes(profile?.department) || profile?.role === "Admin";

    return matchesSearch && matchesCategory && matchesStatus && isInDepartment;
  });

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

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
        return `${count} ${unit}${count !== 1 ? 's' : ''} ago`;
      }
    }
    return 'just now';
  }

  const activeFilterCount =
    Object.values(categoryFilters).filter(Boolean).length +
    Object.values(statusFilters).filter(Boolean).length;

  return (
    <div className="table-container">
      <div className="page-table-header">
        <div className="header-top">
          <h1 className="title">Asset List<span className="table-title-style">{filteredData.length}</span></h1>
          <input
            type="text"
            className="search-bar"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <button
            className="filter-button"
            onClick={() => setShowFilterModal(true)}
          >
            <FiFilter /> {activeFilterCount > 0 && <span className="filter-badge">{activeFilterCount}</span>}
          </button>

          <button className="add-data-btn" onClick={() => setIsAddingAsset(true)}><FiPlus /> Add Asset</button>
        </div>

        <table className="header-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Updated</th>
            </tr>
          </thead>
        </table>
      </div>

      <div className="table-wrapper">
        <table className="body-table">
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((asset) => (
                <tr key={asset.id} onClick={() => setSelectedAsset(asset)}>
                  <td>{asset.id}</td>
                  <td>{asset.name}</td>
                  <td>{categories[asset.category] || "Unknown"}</td>
                  <td>
                    <span className={`status-indicator status-${asset.status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}></span>
                    {asset.status}
                  </td>
                  <td>Php {asset.cost}</td>
                  <td>{asset.dateUpdated ? timeAgo(asset.dateUpdated.toDate()) : 'N/A'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3">No Asset found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination-controls">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
          className="pagination-button"
        >
          Prev
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
          className="pagination-button"
        >
          Next
        </button>
      </div>

      {isAddingAsset && <AddAsset onClose={() => setIsAddingAsset(false)} />}
      {selectedAsset && <AssetDetails assetDetails={selectedAsset} onClose={() => setSelectedAsset(null)} />}

      {showFilterModal && (
        <Modal onClose={() => setShowFilterModal(false)} title="Filter Assets">
          <div className="filter-modal-content">
            <div className="filter-section">
              <h3>Categories</h3>
              <div className="filter-checkboxes">
                {Object.entries(categories).map(([id, name]) => (
                  <label key={id} className="filter-checkbox-label">
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

export default ManageAsset;