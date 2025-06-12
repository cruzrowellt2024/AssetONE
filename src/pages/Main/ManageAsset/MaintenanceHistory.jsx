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
        className="bg-white rounded-lg shadow-lg w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh", display: "flex", flexDirection: "column" }}
      >
        <div className="bg-gray-800 text-white flex items-center justify-between p-4 rounded-t-lg flex-shrink-0">
          <div className="flex items-center gap-4">
            <FiArrowLeft className="cursor-pointer" onClick={onClose} />
            <h3 className="text-lg font-semibold">Maintenance History</h3>
          </div>
        </div>

        {schedules && schedules.length > 0 ? (
          <>
            <table className="w-full border-collapse mt-5 bg-gray-100">
              <thead className="bg-gray-200">
                <tr>
                  <th className="w-[35%] text-start p-2">Title</th>
                  <th className="w-[35%] text-start p-2">Type</th>
                  <th className="w-[35%] text-start p-2">Technician(s)</th>
                  <th className="w-[35%] text-start p-2">Status</th>
                  <th className="w-[35%] text-start p-2">Issue</th>
                  <th className="w-[35%] text-start p-2">Scheduled</th>
                  <th className="w-[35%] text-start p-2">Completed</th>
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

            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>

              <span className="text-sm font-medium text-gray-600">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
