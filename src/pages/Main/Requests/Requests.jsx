import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../../firebase/firebase";
import AddRequest from "./AddRequest";
import RequestDetails from "./RequestDetails";
import { fetchUsers } from "../../../firebase/userservices";
import Modal from "../../../components/Modal/Modal";
import { FiFilter, FiPlus } from "react-icons/fi";
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
        "Pending": false,
        "Rejected": false,
        "Approved": false,
        "Ongoing": false,
        "Resolved": false,
    });

    const [priorityFilter, setPriorityFilter] = useState({
        "Pending": false,
        "Rejected": false,
        "Approved": false,
        "Ongoing": false,
        "Resolved": false,
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
        const q = query(collection(db, "requests"), orderBy("priorityScore", "desc"));
        return onSnapshot(q, (snapshot) => {
            const requestList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRequests(requestList);
        }, (error) => {
            console.error("Error fetching requests:", error);
            setRequests([]);
        });
    };

    useEffect(() => {
        const unsubscribe = getRequestRealtime();
        return () => unsubscribe();
    }, []);

    const getUserFullName = (userId) => {
        const user = users.find(user => user.id === userId);
        return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    };

    const handleStatusFilterChange = (status) => {
        setStatusFilters(prev => ({ ...prev, [status]: !prev[status] }));
    };

    const handlePriorityFilterChange = (priority) => {
        setPriorityFilter(prev => ({ ...prev, [priority]: !prev[priority] }));
    };

    const applyFilters = () => {
        setShowFilterModal(false);
    };

    const resetFilters = () => {
        const reset = Object.fromEntries(Object.keys(statusFilters).map(k => [k, false]));
        setStatusFilters(reset);
    };

    const filteredRequests = requests.filter((request) => {
        const matchesSearch = searchQuery === "" ||
            request.requestType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            request.description?.toLowerCase().includes(searchQuery.toLowerCase());

        const selectedStatuses = Object.keys(statusFilters).filter(k => statusFilters[k]);
        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(request.status);

        const isReportedBy = request.reportedBy?.includes(profile?.id) || profile?.role === "Admin";

        return matchesSearch && matchesStatus && isReportedBy;
    });

    // Pagination logic
    const totalPages = Math.ceil(filteredRequests.length / rowsPerPage);
    const paginatedData = filteredRequests.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, statusFilters]);

    useEffect(() => {
        document.querySelector('.table-wrapper')?.scrollTo({ top: 0, behavior: 'smooth' });
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
                html5QrCode.stop()
                    .then(() => {
                        html5QrCode.clear();
                        setScannerStarted(false);
                    })
                    .catch(err => console.error("Failed to stop camera", err));
            }
            return;
        }

        const qrCodeScanner = new Html5Qrcode("reader");
        setHtml5QrCode(qrCodeScanner);

        qrCodeScanner.start(
            { facingMode: "environment" },
            {
                fps: 5,
                qrbox: { width: 200, height: 200 }
            },
            (decodedText) => {
                qrCodeScanner.stop().then(() => qrCodeScanner.clear());
                setScanResult(decodedText);
                setScannerStarted(false);
            },
            (errorMessage) => {
                console.warn(errorMessage);
            }
        ).then(() => {
            setScannerStarted(true);
        }).catch(err => {
            console.error("Start failed", err);
        });

        return () => {
            if (qrCodeScanner && scannerStarted) {
                qrCodeScanner.stop()
                    .then(() => {
                        qrCodeScanner.clear();
                        setScannerStarted(false);
                    })
                    .catch(err => console.error("Failed to stop camera on unmount", err));
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
        <div className="table-container">
            <div className="page-table-header">
                <div className="header-top">
                    <h1 className="title">Request List<span className="table-title-style">{filteredRequests.length}</span></h1>
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
                    {(profile?.role === "Reporter" || profile?.role === "Technician") && (
                        <button className="add-data-btn" onClick={() => scanQrCode()}><FiPlus /> Add Request</button>
                    )}
                </div>

                <table className="header-table">
                    <thead>
                        <tr>
                            <th>Request ID</th>
                            <th>Request Type</th>
                            <th>Description</th>
                            <th>Status</th>
                            <th>Priority Level</th>
                            <th>Reported By</th>
                        </tr>
                    </thead>
                </table>
            </div>

            <div className="table-wrapper">
                <table className="body-table">
                    <tbody>
                        {paginatedData.length > 0 ? paginatedData.map((request) => (
                            <tr key={request.id} onClick={() => setSelectedRequest(request)}>
                                <td>{request.id}</td>
                                <td>{request.requestType}</td>
                                <td>{request.description}</td>
                                <td>
                                    <span className={`status-indicator status-${request.status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}></span>
                                    {request.status || "N/A"}
                                </td>
                                <td>
                                    <span className={`status-indicator priority-${getPriorityLabel(request.priorityScore)?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}`}></span>
                                    {getPriorityLabel(request.priorityScore)}</td>
                                <td>{getUserFullName(request.reportedBy)}</td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6">No Request found</td></tr>
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

            {isAddingRequest && <AddRequest assetId={reportedAsset} onClose={() => setIsAddingRequest(false)} />}
            {selectedRequest && <RequestDetails requestDetails={selectedRequest} onClose={() => setSelectedRequest(null)} />}

            {showFilterModal && (
                <Modal onClose={() => setShowFilterModal(false)} title="Filter Requests">
                    <div className="filter-modal-content">
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
                            <h3>Priority</h3>
                            <div className="filter-checkboxes">
                                {Object.keys(priorityFilter).map((priority) => (
                                    <label key={priority} className="filter-checkbox-label">
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

                        <div className="filter-modal-actions">
                            <button className="reset-filter-button" onClick={resetFilters}>Reset Filters</button>
                            <button className="apply-button" onClick={applyFilters}>Apply Filters</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showScanner && (
                <Modal onClose={() => setShowScanner(false)} title="Scan QR Code">
                    <div id="reader"></div>
                </Modal>
            )}
        </div>
    );
};

export default Requests;