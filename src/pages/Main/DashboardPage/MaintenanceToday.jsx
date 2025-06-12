import { useState } from "react";
import { FiArrowLeft } from "react-icons/fi";
import MaintenanceScheduleDetails from "../MaintenanceScheduling/MaintenanceScheduleDetails";

const MaintenanceToday = ({ scheduleToday, onClose }) => {
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const logsPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(scheduleToday.length / logsPerPage);
  const currentLogs = scheduleToday.slice(
    (currentPage - 1) * logsPerPage,
    currentPage * logsPerPage
  );
  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg">
          <div className="flex items-center gap-4">
            <FiArrowLeft className="back-btn" onClick={onClose} />
            <h3 id="activity-modal-header">All Maintenance Today</h3>
          </div>
        </div>

        {scheduleToday && scheduleToday.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Due Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((schedule, index) => (
                  <tr key={index} onClick={() => setSelectedSchedule(schedule)}>
                    <td className="px-4 py-2">
                      {schedule.title || "Maintenance Task"}
                    </td>
                    <td className="px-4 py-2">
                      {schedule.scheduledDate.toDate().toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {schedule.dueDate
                        ? schedule.dueDate.toDate
                          ? schedule.dueDate.toDate().toLocaleString()
                          : new Date(schedule.dueDate).toLocaleString()
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 rounded-b-lg">
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <p>No activity logs found.</p>
        )}
      </div>

      {selectedSchedule && (
        <MaintenanceScheduleDetails
          scheduleDetails={selectedSchedule}
          onClose={() => setSelectedSchedule(null)}
        />
      )}
    </div>
  );
};

export default MaintenanceToday;
