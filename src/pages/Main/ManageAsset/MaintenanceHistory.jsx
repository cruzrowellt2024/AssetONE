import { FiArrowLeft } from "react-icons/fi";
import { useState } from "react";

const MaintenanceHistory = ({ schedules, technicians, onClose }) => {
    const schedulesPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);

    const techIdToName = {};
    technicians.forEach(tech => {
        techIdToName[tech.id] = `${tech.firstName} ${tech.lastName}`;
    });

    const totalPages = Math.ceil(schedules.length / schedulesPerPage);

    const currentSchedules = schedules
        .filter(schedule => schedule.status === "Completed")
        .sort((a, b) => b.dateCompleted?.seconds - a.dateCompleted?.seconds)
        .slice((currentPage - 1) * schedulesPerPage, currentPage * schedulesPerPage);

    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return "—";
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-labelledby="activity-modal-header">
                <div>
                    <div className="modal-header">
                        <div className="modal-header-left">
                            <FiArrowLeft className="back-btn" onClick={onClose} />
                            <h3 id="activity-modal-header">Maintenance History</h3>
                        </div>
                    </div>

                    {schedules && schedules.length > 0 ? (
                        <>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Technician(s)</th>
                                        <th>Status</th>
                                        <th>Issue</th>
                                        <th>Scheduled</th>
                                        <th>Completed</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSchedules.length > 0 ? (
                                        currentSchedules.map((schedule, index) => (
                                            <tr key={index}>
                                                <td>{schedule.title || "Untitled"}</td>
                                                <td>{schedule.maintenanceType || "—"}</td>
                                                <td>
                                                    {Array.isArray(schedule.assignedTechnicians) && schedule.assignedTechnicians.length > 0
                                                        ? schedule.assignedTechnicians
                                                            .map(id => techIdToName[id] || "(Deleted User)")
                                                            .join(", ")
                                                        : "None Assigned"}
                                                </td>
                                                <td>{schedule.status}</td>
                                                <td>{schedule.description || "No description"}</td>
                                                <td>{formatDate(schedule.scheduledDate)}</td>
                                                <td>{formatDate(schedule.dateCompleted)}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="9">
                                                No completed maintenance records found.
                                            </td>
                                        </tr>
                                    )}
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
                        <p>No completed maintenance records found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MaintenanceHistory;
