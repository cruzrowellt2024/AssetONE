import { FiArrowLeft } from "react-icons/fi";
import { useState } from "react";

const RecentActivityModal = ({ logs, userMap, onClose }) => {
    const logsPerPage = 10; // Number of logs per page
    const [currentPage, setCurrentPage] = useState(1);

    // Calculate total pages
    const totalPages = Math.ceil(logs.length / logsPerPage);

    // Get the logs for the current page
    const currentLogs = logs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

    // Handlers for pagination
    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="activity-modal-header">
                <div>
                    <div className="modal-header">
                        <div className="modal-header-left">
                            <FiArrowLeft className="back-btn" onClick={onClose} />
                            <h3 id="activity-modal-header">All Activity Logs</h3>
                        </div>
                    </div>
                    {logs && logs.length > 0 ? (
                        <>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Action</th>
                                        <th>Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLogs.map((log, index) => (
                                        <tr key={index}>
                                            <td>{userMap[log.user] || "Unknown"}</td>
                                            <td>{log.action}</td>
                                            <td>{new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="pagination-controls">
                                <button className="pagination-button" onClick={goToPreviousPage} disabled={currentPage === 1}>
                                    Previous
                                </button>
                                <span>Page {currentPage} of {totalPages}</span>
                                <button className="pagination-button" onClick={goToNextPage} disabled={currentPage === totalPages}>
                                    Next
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>No activity logs found.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RecentActivityModal;