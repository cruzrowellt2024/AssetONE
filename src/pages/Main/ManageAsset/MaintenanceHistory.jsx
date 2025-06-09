import { FiArrowLeft } from "react-icons/fi";
import { useState } from "react";

const MaintenanceHistory = ({ schedules, technicians, onClose }) => {
  const schedulesPerPage = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const techIdToName = {};
  technicians.forEach((tech) => {
    techIdToName[tech.id] = `${tech.firstName} ${tech.lastName}`;
  });

  const totalPages = Math.ceil(schedules.length / schedulesPerPage);

  const currentSchedules = schedules
    .filter((schedule) => schedule.status === "Completed")
    .sort((a, b) => b.dateCompleted?.seconds - a.dateCompleted?.seconds)
    .slice(
      (currentPage - 1) * schedulesPerPage,
      currentPage * schedulesPerPage
    );

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
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gray-600 text-white flex items-center justify-between p-4 rounded-t-lg">
          <div className="flex items-center gap-3">
            <FiArrowLeft className="cursor-pointer" onClick={onClose} />
            <h3 className="text-lg font-semibold">Maintenance History</h3>
          </div>
        </div>

        {schedules && schedules.length > 0 ? (
          <>
            <table className="w-full border-collapse text-white mt-5">
              <thead>
                <tr>
                  <th className="w-[35%] text-start">Title</th>
                  <th className="w-[35%] text-start">Type</th>
                  <th className="w-[35%] text-start">Technician(s)</th>
                  <th className="w-[35%] text-start">Status</th>
                  <th className="w-[35%] text-start">Issue</th>
                  <th className="w-[35%] text-start">Scheduled</th>
                  <th className="w-[35%] text-start">Completed</th>
                </tr>
              </thead>
              <tbody>
                {currentSchedules.length > 0 ? (
                  currentSchedules.map((schedule, index) => (
                    <tr key={index}>
                      <td>{schedule.title || "Untitled"}</td>
                      <td>{schedule.maintenanceType || "—"}</td>
                      <td>
                        {Array.isArray(schedule.assignedTechnicians) &&
                        schedule.assignedTechnicians.length > 0
                          ? schedule.assignedTechnicians
                              .map((id) => techIdToName[id] || "(Deleted User)")
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
                    <td
                      colSpan="9"
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      No completed maintenance records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="pagination-controls">
              <button
                className="pagination-button"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                className="pagination-button"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          </>
        ) : (
          <p className="px-3 py-6 text-center text-gray-500">
            No completed maintenance records found.
          </p>
        )}
      </div>
    </div>
  );
};

export default MaintenanceHistory;
