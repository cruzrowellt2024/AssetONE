import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import MaintenanceScheduleDetails from "../MaintenanceScheduling/MaintenanceScheduleDetails";

const MaintenanceToday = ({ scheduleToday, onClose }) => {
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const logsPerPage = 10;
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = Math.ceil(scheduleToday.length / logsPerPage);
    const currentLogs = scheduleToday.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);
    const goToPreviousPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div>
                    <div className="modal-header">
                        <div className="modal-header-left">
                            <FiArrowLeft className="back-btn" onClick={onClose} />
                            <h3 id="activity-modal-header">All Maintenance Today</h3>
                        </div>
                    </div>

                    {scheduleToday && scheduleToday.length > 0 ? (
                        <>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Date</th>
                                        <th>Due Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLogs.map((schedule, index) => (
                                        <tr key={index} onClick={() => setSelectedSchedule(schedule)}>
                                            <td>{schedule.title || "Maintenance Task"}</td>
                                            <td>{schedule.scheduledDate.toDate().toLocaleString()}</td>
                                            <td>
                                                {schedule.dueDate
                                                    ? (schedule.dueDate.toDate
                                                        ? schedule.dueDate.toDate().toLocaleString()
                                                        : new Date(schedule.dueDate).toLocaleString()
                                                    )
                                                    : "N/A"}
                                            </td>
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

            {selectedSchedule && <MaintenanceScheduleDetails scheduleDetails={selectedSchedule} onClose={() => setSelectedSchedule(null)} />}
        </div>
    );
}

export default MaintenanceToday;