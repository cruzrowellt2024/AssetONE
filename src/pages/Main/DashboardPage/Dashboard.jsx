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
            const assetData = await fetchAssets();
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
        <div className="dashboard-container">
            <div className="dashboard-content">
                <div className="panel total-assets">
                    <h2>Total Asset Units</h2>
                    <div style={{ width: '100%', height: 300 }}>
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

                <div className="panel maintenance-today">
                    <div className="panel-header">
                        <h2>Maintenance Today</h2>
                        {schedules.length > 3 && (
                            <button className="view-more-button" onClick={() => setShowModal(true)}>View All</button>
                        )}
                    </div>
                    <table className="table">
                        <colgroup>
                            <col style={{ width: "50%" }} />
                            <col style={{ width: "50%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.length > 0 ? (
                                schedules.slice(0, 5).map((schedule, index) => (
                                    <tr key={index} onClick={() => setSelectedSchedule(schedule)}>
                                        <td>{schedule.title || "Maintenance Task"}</td>
                                        <td>{schedule.scheduledDate.toDate().toLocaleTimeString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="3">No schedule today.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {showModal && (
                    <MaintenanceToday scheduleToday={schedules} onClose={() => setShowModal(false)} />
                )}

                {selectedSchedule && <MaintenanceScheduleDetails scheduleDetails={selectedSchedule} onClose={() => setSelectedSchedule(null)} />}

                <div className="panel total-spent">
                    <h2>Total Spent</h2>
                    <div className="total-cost">
                        <p>Total: Php{totalAssetCost.toLocaleString()}</p>
                    </div>
                    <div className="cost-indicators">
                        <p>Asset Cost: Php{totalAssetCost.toLocaleString()}</p>
                        <p>Repair Cost: Php{totalRepairCost.toLocaleString()}</p>
                    </div>
                </div>

                <div className="panel quick-actions">
                    <h2>Quick Actions</h2>
                    <button className="quick-action-btn" onClick={() => setIsAddingAsset(true)}>Add Asset</button>
                    <button className="quick-action-btn" onClick={() => setIsAddingSchedule(true)}>Create Schedule</button>
                    <button className="quick-action-btn" onClick={() => setIsAddingLocation(true)}>New Location</button>
                    {isAddingAsset && (<AddAsset onClose={() => setIsAddingAsset(false)} />)}
                    {isAddingSchedule && (<AddSchedule onClose={() => setIsAddingSchedule(false)} />)}
                    {isAddingLocation && (<AddLocation onClose={() => setIsAddingLocation(false)} />)}
                </div>

                <div className="panel asset-added">
                    <h2>Assets Added</h2>
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

                <div className="panel recent-activities">
                    <div className="panel-header">
                        <h2>Recent Activities</h2>
                        {activities.length > 5 && (
                            <button className="view-more-button" onClick={() => setShowActivityModal(true)}>View More</button>
                        )}
                    </div>
                    <table className="table">
                        <colgroup>
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "25%" }} />
                            <col style={{ width: "25%" }} />
                        </colgroup>
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Action</th>
                                <th>Remarks</th>
                                <th>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.length > 0 ? (
                                activities.slice(0, 5).map((log, index) => (
                                    <tr key={index}>
                                        <td>{userMap[log.user] || "Unknown"}</td>
                                        <td>{log.action}</td>
                                        <td>{log.remarks}</td>
                                        <td>{new Date(log.timestamp?.toDate?.() || log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="4">No recent activity</td></tr>
                            )}
                        </tbody>
                    </table>
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