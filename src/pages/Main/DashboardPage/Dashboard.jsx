import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { fetchSchedules } from "../../../firebase/maintenancescheduleservices";
import MaintenanceToday from "./MaintenanceToday";
import AddAsset from "../ManageAsset/AddAsset";
import AddSchedule from "../MaintenanceScheduling/AddSchedule";
import AddLocation from "../Records/LocationManagement/AddLocation";
import { fetchActivityLogs } from "../../../firebase/activtylogservices";
import RecentActivityModal from "./RecentActivityModal";
import { fetchUsers } from "../../../firebase/userservices";
import MaintenanceScheduleDetails from "../MaintenanceScheduling/MaintenanceScheduleDetails";
import AddUser from "../UserManagement/AddUser";
import { fetchUnits } from "../../../firebase/assetunitservices";
import { calculateDepreciation } from "../../../utils/finance";
import { useAuth } from "../../../context/AuthContext";
import { fetchDepartments } from "../../../firebase/departmentservices";

const Dashboard = () => {
  const [assets, setAssets] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [users, setUsers] = useState([]);
  const [departments, setDeparments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [activities, setActivities] = useState([]);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { profile } = useAuth();

  const statusColors = {
    active: "#22c55e", // green-500
    "in use": "#3b82f6", // blue-500
    "under investigation": "#6b7280", // gray-500
    "in repair": "#facc15", // yellow-500
    borrowed: "#7e22ce", // purple-700
    broken: "#ef4444", // red-500
    disposed: "#78350f", // brown-700 (approx)
    unknown: "#6b7280", // gray-500
  };

  const conditionColors = {
    good: "#4caf50",
    fair: "#ffeb3b",
    "needs maintenance": "#ff9800",
    critical: "#f44336",
    unknown: "#9e9e9e",
  };

  const userStatusColors = {
    available: "#4ade80",
    "in operation": "#facc15",
    unavailable: "#ef4444",
    unknown: "#ccc",
  };

  const getAssets = async () => {
    try {
      const assetData = await fetchUnits();
      let filteredAssets = assetData || [];

      if (profile.role === "department_manager") {
        filteredAssets = filteredAssets.filter(
          (asset) => asset.department === profile.department
        );
      }

      setAssets(filteredAssets);
    } catch (error) {
      console.error("Error fetching asset:", error);
      setAssets([]);
    }
  };

  const getDepartments = async () => {
    try {
      const departmentData = await fetchDepartments();
      setDeparments(departmentData || []);
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

      const filtered = scheduleData.filter((schedule) => {
        const scheduleDateStr = schedule.scheduledDate
          .toDate()
          .toISOString()
          .split("T")[0];
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
    getDepartments();
  }, []);

  const filteredAssets = assets.filter((asset) => {
    const dateMatch =
      !startDate || !endDate
        ? true
        : asset.dateAcquired >= startDate && asset.dateAcquired <= endDate;

    const departmentMatch =
      profile.role === "department_manager"
        ? asset.department === profile.department
        : true;

    return dateMatch && departmentMatch;
  });

  const userMap = users.reduce((map, user) => {
    map[user.id] = `${user.firstName} ${user.lastName}`;
    return map;
  }, {});

  const getUserDepartment = (departmentId) => {
    const department = departments.find(
      (department) => department.id === departmentId
    );
    return department ? `${department.name}` : "Unknown Department";
  };

  const groupKey =
    profile.role === "maintenance_head"
      ? "condition"
      : profile.role === "system_administrator"
      ? "status"
      : "status";

  const isAdmin = profile.role === "system_administrator";

  const dataSource = isAdmin
    ? users
    : profile.role === "department_manager"
    ? assets.filter((a) => a.department === profile.department)
    : assets;

  const filteredAssetsUnits =
    profile.role === "department_manager"
      ? assets.filter((a) => a.department === profile.department)
      : assets;

  // Count-based data
  const groupedCounts = dataSource.reduce((acc, asset) => {
    const key = asset[groupKey]?.toLowerCase() || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  // Cost-based data for finance
  const valueByGroup = dataSource.reduce((acc, asset) => {
    const key = asset[groupKey]?.toLowerCase() || "unknown";
    const cost = Number(asset.cost) || 0;
    acc[key] = (acc[key] || 0) + cost;
    return acc;
  }, {});

  const pieChartData = Object.entries(groupedCounts).map(([name, value]) => ({
    name,
    value,
  }));

  const pieChartFinanceData = Object.entries(valueByGroup).map(
    ([name, value]) => ({
      name,
      value,
    })
  );

  const totalCount = pieChartData.reduce((a, b) => a + b.value, 0);
  const totalCost = pieChartFinanceData.reduce((a, b) => a + b.value, 0);

  const getColor = (key) => {
    const safeKey = key.toLowerCase();
    if (profile.role === "maintenance_head")
      return conditionColors[safeKey] || "#ccc";
    if (profile.role === "system_administrator")
      return userStatusColors[safeKey] || "#ccc";
    return statusColors[safeKey] || "#ccc";
  };

  const totalOriginalCost = filteredAssets.reduce((sum, asset) => {
    const cost = parseFloat(asset.cost);
    return sum + (isNaN(cost) ? 0 : cost);
  }, 0);

  const { totalAccumulated, totalBookValue } = filteredAssets.reduce(
    (totals, unit) => {
      const { accumulated, bookValue } = calculateDepreciation(unit);
      return {
        totalAccumulated: totals.totalAccumulated + accumulated,
        totalBookValue: totals.totalBookValue + bookValue,
      };
    },
    { totalAccumulated: 0, totalBookValue: 0 }
  );

  const getMonthlyAssetComparison = () => {
    const monthlyCounts = {};

    assets.forEach((asset) => {
      if (asset.dateAcquired) {
        const date = new Date(asset.dateAcquired); // Parses "yyyy-mm-dd" to JS Date
        if (isNaN(date)) return; // Skip if invalid

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthlyCounts[monthKey]) {
          monthlyCounts[monthKey] = 0;
        }
        monthlyCounts[monthKey]++;
      }
    });

    const sortedMonths = Object.keys(monthlyCounts).sort();

    if (sortedMonths.length === 0) {
      return {
        latestMonth: "No data",
        previousMonth: null,
        latestCount: 0,
        previousCount: 0,
        percentChange: null,
        trend: "no-data",
      };
    }

    const latest = sortedMonths[sortedMonths.length - 1];
    const previous =
      sortedMonths.length >= 2 ? sortedMonths[sortedMonths.length - 2] : null;

    const latestCount = monthlyCounts[latest] || 0;
    const previousCount = previous ? monthlyCounts[previous] || 0 : 0;

    let percentChange = null;
    let trend = "no-data";

    if (previousCount === 0) {
      trend = latestCount > 0 ? "up" : "equal";
      percentChange = latestCount > 0 ? 100 : 0;
    } else {
      const change = ((latestCount - previousCount) / previousCount) * 100;
      percentChange = change.toFixed(1);
      trend =
        latestCount > previousCount
          ? "up"
          : latestCount < previousCount
          ? "down"
          : "equal";
    }

    return {
      latestMonth: latest,
      previousMonth: previous,
      latestCount,
      previousCount,
      percentChange,
      trend,
    };
  };

  const assetComparison = getMonthlyAssetComparison();

  const today = new Date().toISOString().split("T")[0];
  const oldestAcquiredDate =
    assets
      .map((asset) => new Date(asset.dateAcquired))
      .sort((a, b) => a - b)[0]
      ?.toISOString()
      .split("T")[0] || today;

  return (
    <div className="dashboard-container bg-gray-100 min-h-screen py-8 px-6 md:px-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Asset Units */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center col-span-2">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            {profile.role === "maintenance_head"
              ? "Asset Conditions Overview"
              : profile.role === "finance"
              ? "Asset Value by Status"
              : profile.role === "system_administrator"
              ? "User Status Overview"
              : `Total ${
                  profile.role === "department_manager"
                    ? getUserDepartment(profile.department)
                    : "Campus"
                } Units`}
          </h2>
          <div className="w-full h-72 flex flex-col items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={
                    profile.role === "finance"
                      ? pieChartFinanceData
                      : pieChartData
                  }
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={90}
                  dataKey="value"
                  label={({ name, value }) =>
                    profile.role === "finance"
                      ? `${((value / totalCost) * 100).toFixed(1)}%`
                      : `${((value / totalCount) * 100).toFixed(1)}%`
                  }
                >
                  {(profile.role === "finance"
                    ? pieChartFinanceData
                    : pieChartData
                  ).map((entry, i) => (
                    <Cell key={i} fill={getColor(entry.name)} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) =>
                    profile.role === "finance"
                      ? `₱${value.toLocaleString()}`
                      : value
                  }
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-gray-800">
                {profile.role === "finance"
                  ? `₱${totalCost.toLocaleString()}`
                  : totalCount}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
            {(profile.role === "finance"
              ? pieChartFinanceData
              : pieChartData
            ).map((entry, i) => (
              <div key={i} className="flex items-center space-x-2">
                <span
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getColor(entry.name) }}
                ></span>
                <span className="capitalize text-gray-700">
                  {entry.name}{" "}
                  {profile.role === "finance"
                    ? `- ₱${entry.value.toLocaleString()}`
                    : `- ${entry.value}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 col-span-2 gap-6">
          {/* Total Spent */}
          <div className="bg-white rounded-lg shadow p-6 flex flex-col  col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2 sm:gap-0">
              <h2 className="text-xl font-semibold text-gray-700">
                Asset Value Summary
              </h2>

              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  min={oldestAcquiredDate}
                  max={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span className="text-gray-500 text-sm">to</span>
                <input
                  type="date"
                  value={endDate}
                  min={oldestAcquiredDate}
                  max={today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col border-l-4 border-gray-500 pl-4">
                <span className="text-sm text-gray-500">Original Cost</span>
                <span className="text-2xl font-bold text-gray-800 font-mono">
                  Php
                  {totalOriginalCost.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex flex-col border-l-4 border-green-500 pl-4">
                <span className="text-sm text-gray-500">Book Value</span>
                <span className="text-2xl font-bold text-green-700 font-mono">
                  Php
                  {totalBookValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="flex flex-col border-l-4 border-red-500 pl-4">
                <span className="text-sm text-gray-500">
                  Accum. Depreciation
                </span>
                <span className="text-2xl font-bold text-red-600 font-mono">
                  Php
                  {totalAccumulated.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {profile.role === "maintenance_head" && (
          <>
            {/* Maintenance Today */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col col-span-2">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold text-gray-700">
                  Maintenance Today
                </h2>
                {schedules.length > 3 && (
                  <button
                    className="text-blue-600 hover:underline text-sm"
                    onClick={() => setShowModal(true)}
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="py-2 px-2">Title</th>
                      <th className="py-2 px-2">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.length > 0 ? (
                      schedules.slice(0, 5).map((s, i) => (
                        <tr
                          key={i}
                          className="hover:bg-blue-50 cursor-pointer"
                          onClick={() => setSelectedSchedule(s)}
                        >
                          <td className="py-2 px-2">
                            {s.title || "Maintenance Task"}
                          </td>
                          <td className="py-2 px-2">
                            {s.scheduledDate.toDate().toLocaleTimeString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="2"
                          className="py-2 px-2 text-center text-gray-500"
                        >
                          No schedule today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Modals below grid */}
            {showModal && (
              <MaintenanceToday
                scheduleToday={schedules}
                onClose={() => setShowModal(false)}
              />
            )}
            {selectedSchedule && (
              <MaintenanceScheduleDetails
                scheduleDetails={selectedSchedule}
                onClose={() => setSelectedSchedule(null)}
              />
            )}
          </>
        )}

        {[
          "system_administrator",
          "operational_administrator",
          "maintenance_head",
        ].includes(profile.role) && (
          <>
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">
                Quick Actions
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-1 gap-2 mb-2">
                {profile.role === "system_administrator" ? (
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                    onClick={() => setIsAddingUser(true)}
                  >
                    Create User
                  </button>
                ) : profile.role === "operational_administrator" ? (
                  <>
                    <button
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                      onClick={() => setIsAddingAsset(true)}
                    >
                      Add Asset
                    </button>
                    <button
                      className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition"
                      onClick={() => setIsAddingLocation(true)}
                    >
                      New Location
                    </button>
                    new department
                  </>
                ) : (
                  <>
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                      onClick={() => setIsAddingSchedule(true)}
                    >
                      Create Schedule
                    </button>
                  </>
                )}
              </div>
              {isAddingAsset && (
                <AddAsset onClose={() => setIsAddingAsset(false)} />
              )}
              {isAddingSchedule && (
                <AddSchedule onClose={() => setIsAddingSchedule(false)} />
              )}
              {isAddingLocation && (
                <AddLocation onClose={() => setIsAddingLocation(false)} />
              )}
              {isAddingUser && (
                <AddUser onClose={() => setIsAddingUser(false)} />
              )}
            </div>
          </>
        )}

        {/* Assets Added */}
        {assetComparison && (
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col gap-2 w-full">
            <h2 className="text-lg font-semibold text-gray-700">
              Monthly Acquisition
            </h2>

            <div className="text-sm text-gray-500">
              {assetComparison.previousMonth
                ? `${assetComparison.latestMonth} vs ${assetComparison.previousMonth}`
                : assetComparison.latestMonth}
            </div>

            <div className="text-4xl font-bold text-gray-800 tracking-tight">
              {assetComparison.latestCount}
            </div>

            <div
              className={`text-sm font-medium flex items-center ${
                assetComparison.trend === "up"
                  ? "text-green-600"
                  : assetComparison.trend === "down"
                  ? "text-red-600"
                  : "text-gray-500"
              }`}
            >
              <span className="text-lg">
                {assetComparison.trend === "up" && "▲"}
                {assetComparison.trend === "down" && "▼"}
                {assetComparison.trend === "equal" && "―"}
              </span>
              <span className="ml-1">
                {assetComparison.percentChange !== null
                  ? `${assetComparison.percentChange}% ${assetComparison.trend}`
                  : "No previous data"}
              </span>
            </div>
          </div>
        )}

        {/* Recent Activities */}
        <div className="bg-white rounded-lg shadow p-6 flex flex-col col-span-2">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold text-gray-700">
              Recent Activities
            </h2>
            {activities.length > 5 && (
              <button
                className="text-blue-600 hover:underline text-sm"
                onClick={() => setShowActivityModal(true)}
              >
                View More
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-2">User</th>
                  <th className="py-2 px-2">Action</th>
                  <th className="py-2 px-2">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {activities.length > 0 ? (
                  activities.slice(0, 5).map((log, i) => (
                    <tr key={i} className="hover:bg-blue-50">
                      <td className="py-2 px-2">
                        {userMap[log.user] || "Unknown"}
                      </td>
                      <td className="py-2 px-2">{log.action}</td>
                      <td className="py-2 px-2">
                        {new Date(
                          log.timestamp?.toDate?.() || log.timestamp
                        ).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-2 px-2 text-center text-gray-500"
                    >
                      No recent activity
                    </td>
                  </tr>
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
};

export default Dashboard;
