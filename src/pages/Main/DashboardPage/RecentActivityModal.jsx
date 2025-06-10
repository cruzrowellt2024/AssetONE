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
                        <FiArrowLeft
                            className="cursor-pointer hover:text-gray-300 transition"
                            onClick={onClose}
                            size={22}
                        />
                        <h3 className="text-lg font-semibold">All Activity Logs</h3>
                    </div>
                </div>
                {logs && logs.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">User</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Action</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Device</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">Timestamp</th>
                                    </tr>
                                </thead>
                            </table>
                            <div className="max-h-80 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {currentLogs.map((log, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="px-4 py-2">{userMap[log.user] || "Unknown"}</td>
                                                <td className="px-4 py-2">{log.action}</td>
                                                <td className="px-4 py-2">{log.device}</td>
                                                <td className="px-4 py-2">{new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                    </>
                ) : (
                    <div className="p-8 text-center text-gray-500">No activity logs found.</div>
                )}
            </div>
        </div>
    );
}

export default RecentActivityModal;