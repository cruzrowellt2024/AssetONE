import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { fetchAssets } from '../../../firebase/assetservices';
import { fetchSchedules } from "../../../firebase/maintenancescheduleservices";
import MaintenanceToday from "./MaintenanceToday";
import AddAsset from "../ManageAsset/AddAsset";
import AddSchedule from "../MaintenanceScheduling/AddSchedule";
import AddLocation from "../Records/LocationManagement/AddLocation";
import { fetchActivityLogs } from "../../../firebase/activtylogservices";
import RecentActivityModal from "./RecentActivityModal";
import { fetchUsers } from "../../../firebase/userservices";
import MaintenanceScheduleDetails from "../MaintenanceScheduling/MaintenanceScheduleDetails";
import { fetchUnits } from "../../../firebase/assetunitservices";

const Dashboard = () => {
    const [assets, setAssets] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [isAddingAsset, setIsAddingAsset] = useState(false);
    const [isAddingSchedule, setIsAddingSchedule] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    const [activities, setActivities] = useState([]);
    const [showActivityModal, setShowActivityModal] = useState(false);

    const statusColors = {
        "active": "#4CAF50",
        "in use": "#2196F3",
        "under investigation": "#9E9E9E",
        "in repair": "#FFC107",
        "borrowed": "#9C27B0",
        "broken": "#F44336",
        "disposed": "#795548",
        "unknown": "#9E9E9E"
    };

    const getAssets = async () => {
        try {
            const assetData = await fetchUnits();
            setAssets(assetData || []);
        } catch (error) {
            console.error("Error fetching asset:", error);
            setAssets([]);
        }
    };

    const getSchedules = async () => {
        try {
            const scheduleData = await fetchSchedules();
            const today = new Date();
            const todayStr = today.toISOString().split("T")[0];

            const filtered = scheduleData.filter(schedule => {
                const scheduleDateStr = schedule.scheduledDate.toDate().toISOString().split("T")[0];
                return scheduleDateStr === todayStr;
            });
            setSchedules(filtered || []);
        } catch (error) {
            console.error("Error fetching schedules:", error);
            setSchedules([]);
        }
    };

    const getActivityLogs = async () => {
        try {
            const logs = await fetchActivityLogs();
            setActivities(logs || []);
        } catch (error) {
            console.error("Error fetching activity logs:", error);
            setActivities([]);
        }
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
        getSchedules();
        getAssets();
        getActivityLogs();
        getUsers();
    }, []);

    const userMap = users.reduce((map, user) => {
        map[user.id] = `${user.firstName} ${user.lastName}`;
        return map;
    }, {});

    const statusCounts = assets.reduce((acc, asset) => {
        const status = asset.status?.toLowerCase() || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const pieChartData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
    }));

    const getColor = (status) => statusColors[status.toLowerCase()] || "#ccc";
    const totalAssetCost = assets.reduce((sum, asset) => {
        const cost = parseFloat(asset.cost);
        return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const totalRepairCost = schedules.reduce((sum, sched) => {
        const cost = parseFloat(sched.repairCost);
        return sum + (isNaN(cost) ? 0 : cost);
    }, 0);

    const getMonthlyAssetCounts = () => {
        const monthlyCounts = {};

        assets.forEach(asset => {
            if (asset.dateCreated && asset.dateCreated.toDate) {
                const date = asset.dateCreated.toDate();
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

                if (!monthlyCounts[monthKey]) {
                    monthlyCounts[monthKey] = 0;
                }
                monthlyCounts[monthKey]++;
            }
        });

        const sortedMonths = Object.keys(monthlyCounts).sort();
        return sortedMonths.slice(-6).map(month => ({
            month,
            count: monthlyCounts[month]
        }));
    };

    const assetMonthlyData = getMonthlyAssetCounts();

    return (
        <div className="dashboard-container bg-gray-100 min-h-screen py-8 px-2 md:px-8">
            <div className="dashboard-content grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Asset Units */}
                <div className="panel total-assets bg-white rounded-lg shadow p-6 flex flex-col items-center">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Total Asset Units</h2>
                    <div className="w-full h-72">
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieChartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius="80%"
                                    fill="#8884d8"
                                    dataKey="value"
                                    label
                                >
                                    {pieChartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Maintenance Today */}
                <div className="panel maintenance-today bg-white rounded-lg shadow p-6 flex flex-col">
                    <div className="panel-header flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-gray-700">Maintenance Today</h2>
                        {schedules.length > 3 && (
                            <button className="view-more-button text-blue-600 hover:underline text-sm" onClick={() => setShowModal(true)}>View All</button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full text-sm text-left">
                            <colgroup>
                                <col style={{ width: "50%" }} />
                                <col style={{ width: "50%" }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-2">Title</th>
                                    <th className="py-2 px-2">Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {schedules.length > 0 ? (
                                    schedules.slice(0, 5).map((schedule, index) => (
                                        <tr key={index} className="hover:bg-blue-50 cursor-pointer" onClick={() => setSelectedSchedule(schedule)}>
                                            <td className="py-2 px-2">{schedule.title || "Maintenance Task"}</td>
                                            <td className="py-2 px-2">{schedule.scheduledDate.toDate().toLocaleTimeString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="2" className="py-2 px-2 text-center text-gray-500">No schedule today.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {showModal && (
                    <MaintenanceToday scheduleToday={schedules} onClose={() => setShowModal(false)} />
                )}

                {selectedSchedule && <MaintenanceScheduleDetails scheduleDetails={selectedSchedule} onClose={() => setSelectedSchedule(null)} />}

                {/* Total Spent */}
                <div className="panel total-spent bg-white rounded-lg shadow p-6 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Total Spent</h2>
                    <div className="total-cost mb-2">
                        <p className="text-lg font-bold text-green-700">Total: <span className="font-mono">Php{totalAssetCost.toLocaleString()}</span></p>
                    </div>
                    <div className="cost-indicators space-y-1">
                        <p className="text-gray-600">Asset Cost: <span className="font-mono">Php{totalAssetCost.toLocaleString()}</span></p>
                        <p className="text-gray-600">Repair Cost: <span className="font-mono">Php{totalRepairCost.toLocaleString()}</span></p>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="panel quick-actions bg-white rounded-lg shadow p-6 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Quick Actions</h2>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <button className="quick-action-btn bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition" onClick={() => setIsAddingAsset(true)}>Add Asset</button>
                        <button className="quick-action-btn bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition" onClick={() => setIsAddingSchedule(true)}>Create Schedule</button>
                        <button className="quick-action-btn bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition" onClick={() => setIsAddingLocation(true)}>New Location</button>
                    </div>
                    {isAddingAsset && (<AddAsset onClose={() => setIsAddingAsset(false)} />)}
                    {isAddingSchedule && (<AddSchedule onClose={() => setIsAddingSchedule(false)} />)}
                    {isAddingLocation && (<AddLocation onClose={() => setIsAddingLocation(false)} />)}
                </div>

                {/* Assets Added */}
                <div className="panel asset-added bg-white rounded-lg shadow p-6 flex flex-col">
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Assets Added</h2>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={assetMonthlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis width={30} />
                            <Tooltip />
                            <Bar dataKey="count" fill="#344a7a" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Recent Activities */}
                <div className="panel recent-activities bg-white rounded-lg shadow p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-3">
                    <div className="panel-header flex justify-between items-center mb-2">
                        <h2 className="text-xl font-semibold text-gray-700">Recent Activities</h2>
                        {activities.length > 5 && (
                            <button className="view-more-button text-blue-600 hover:underline text-sm" onClick={() => setShowActivityModal(true)}>View More</button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="table w-full text-sm text-left">
                            <colgroup>
                                <col style={{ width: "25%" }} />
                                <col style={{ width: "25%" }} />
                                <col style={{ width: "25%" }} />
                                <col style={{ width: "25%" }} />
                            </colgroup>
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="py-2 px-2">User</th>
                                    <th className="py-2 px-2">Action</th>
                                    <th className="py-2 px-2">Remarks</th>
                                    <th className="py-2 px-2">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activities.length > 0 ? (
                                    activities.slice(0, 5).map((log, index) => (
                                        <tr key={index} className="hover:bg-blue-50">
                                            <td className="py-2 px-2">{userMap[log.user] || "Unknown"}</td>
                                            <td className="py-2 px-2">{log.action}</td>
                                            <td className="py-2 px-2">{log.remarks}</td>
                                            <td className="py-2 px-2">{new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="py-2 px-2 text-center text-gray-500">No recent activity</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {showActivityModal && (
                    <RecentActivityModal
                        logs={activities}
                        userMap={userMap}
                        onClose={() => setShowActivityModal(false)}
                    />
                )}
            </div>
        </div>
    );
}

export default Dashboard;