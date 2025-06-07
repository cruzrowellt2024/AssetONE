import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
    FiMenu, FiHome, FiUser, FiCalendar, FiBarChart, FiBookOpen,
    FiChevronDown, FiChevronUp, FiTag, FiBriefcase, FiMapPin,
    FiTruck, FiAward, FiInbox, FiDatabase
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const Sidebar = ({
    isCollapsed,
    setIsCollapsed,
    isMobile,
    mobileOpen,
    setMobileOpen,
    setPageTitle,
}) => {
    const [isRecordsOpen, setIsRecordsOpen] = useState(false);
    const sidebarRef = useRef(null);
    const { profile } = useAuth();

    const handleItemClick = (title) => {
        setPageTitle(title);
        if (isMobile) {
            setMobileOpen(false);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!sidebarRef.current) return;
        };

        document.addEventListener("click", handleClickOutside);
        return () => document.removeEventListener("click", handleClickOutside);
    }, [isCollapsed, isMobile]);

    const toggleSidebar = () => {
        if (isMobile) {
            setMobileOpen(!mobileOpen);
        } else {
            setIsCollapsed(!isCollapsed);
        }
    };

    const toggleRecords = () => setIsRecordsOpen(!isRecordsOpen);

    const shouldShowItem = (requiredRoles) => {
        if (!profile?.role) return false;
        const userRole = profile.role.toLowerCase();
        return requiredRoles.some(role => role.toLowerCase() === userRole);
    };

    return (
        <div className="relative">

            {isMobile && mobileOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}
            <aside
                ref={sidebarRef}
                className={`
          fixed top-0 left-0 h-full bg-[#111827] shadow-lg z-40
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isMobile
                        ? mobileOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
                        : isCollapsed ? "w-20" : "w-64"
                    }
        `}
            >
                <ul className="flex flex-col h-full overflow-y-auto select-none text-gray-100">
                    {/* Brand / Hamburger */}
                    <li
                        className="flex items-center h-16 px-4 py-3 cursor-pointer bg-[#161d2c] hover:bg-gray-700 border-b border-gray-700"
                        onClick={toggleSidebar}
                    >
                        {isMobile ? (
                            <FiMenu className="text-xl ml-3" />
                        ) : (
                            isCollapsed ? (
                                <FiMenu className="text-xl ml-3" />
                            ) : (
                                <img src="/assetone-app-icon.png" alt="logo" className="w-7 h-7 ml-2 invert" />
                            )
                        )}

                        {(!isCollapsed || (isMobile && mobileOpen)) && (
                            <>
                                <span className="ml-3 text-lg font-semibold">
                                    AssetONE
                                </span>
                                <FiMenu className="text-xl ml-auto mr-2" />
                            </>
                        )}
                    </li>

                    {/* Dashboard */}
                    {shouldShowItem(['admin', 'department manager', 'technician']) && (
                        <li
                            className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleItemClick("Dashboard")}
                        >
                            <Link to="dashboard" className="flex items-center w-full">
                                <FiHome className="text-lg ml-3" />
                                {!isCollapsed && (
                                    <span className="ml-3">Dashboard</span>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* User Management */}
                    {shouldShowItem(['admin']) && (
                        <li
                            className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleItemClick("User Management")}
                        >
                            <Link to="user-management" className="flex items-center w-full">
                                <FiUser className="text-lg ml-3" />
                                {!isCollapsed && (
                                    <span className="ml-3">User Management</span>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* Asset List */}
                    {shouldShowItem(['admin', 'department manager']) && (
                        <li
                            className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleItemClick("Manage Asset")}
                        >
                            <Link to="manage-assets" className="flex items-center w-full">
                                <FiDatabase className="text-lg ml-3" />
                                {!isCollapsed && (
                                    <span className="ml-3">Asset List</span>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* Maintenance Schedule */}
                    {shouldShowItem(['admin', 'department manager', 'technician']) && (
                        <li
                            className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleItemClick("Maintenace Schedule")}
                        >
                            <Link to="maintenance-scheduling" className="flex items-center w-full">
                                <FiCalendar className="text-lg ml-3" />
                                {!isCollapsed && (
                                    <span className="ml-3">Maintenance Schedules</span>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* Requests List - visible to all */}
                    <li
                        className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleItemClick("Requests List")}
                    >
                        <Link to="requests" className="flex items-center w-full">
                            <FiInbox className="text-lg ml-3" />
                            {!isCollapsed && (
                                <span className="ml-3">Requests List</span>
                            )}
                        </Link>
                    </li>

                    {/* Generate Reports */}
                    {shouldShowItem(['admin', 'department manager']) && (
                        <li
                            className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleItemClick("Generate Reports")}
                        >
                            <Link to="generate-reports" className="flex items-center w-full">
                                <FiBarChart className="text-lg ml-3" />
                                {!isCollapsed && (
                                    <span className="ml-3">Generate Reports</span>
                                )}
                            </Link>
                        </li>
                    )}

                    {/* Records submenu */}
                    {shouldShowItem(['admin']) && (
                        <>
                            <li
                                className="flex items-center justify-between h-12 px-4 py-3 cursor-pointer hover:bg-gray-700 select-none"
                                onClick={toggleRecords}
                                aria-expanded={isRecordsOpen}
                                aria-controls="records-submenu"
                            >
                                <div className="flex items-center">
                                    <FiBookOpen className="text-lg ml-3" />
                                    {!isCollapsed && (
                                        <span className="ml-3">Records</span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <span className="mr-2">
                                        {isRecordsOpen ? <FiChevronUp /> : <FiChevronDown />}
                                    </span>
                                )}
                            </li>
                            {isRecordsOpen && (
                                <ul
                                    id="records-submenu"
                                    className="flex flex-col border-l border-gray-200"
                                >
                                    <li
                                        className="flex items-center h-12 px-4 py-3 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => handleItemClick("Categories")}
                                    >
                                        <Link to="asset-categories" className="flex items-center w-full">
                                            <FiTag className="text-lg ml-3" />
                                            {!isCollapsed && (
                                                <span className="ml-3">Categories</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li
                                        className="flex items-center h-12 px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => handleItemClick("Departments")}
                                    >
                                        <Link to="departments" className="flex items-center w-full">
                                            <FiBriefcase className="text-lg ml-3" />
                                            {!isCollapsed && (
                                                <span className="ml-3">Departments</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li
                                        className="flex items-center h-12 px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => handleItemClick("Locations")}
                                    >
                                        <Link to="location-management" className="flex items-center w-full">
                                            <FiMapPin className="text-lg ml-3" />
                                            {!isCollapsed && (
                                                <span className="ml-3">Locations</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li
                                        className="flex items-center h-12 px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => handleItemClick("Vendors")}
                                    >
                                        <Link to="vendor-contact" className="flex items-center w-full">
                                            <FiTruck className="text-lg ml-3" />
                                            {!isCollapsed && (
                                                <span className="ml-3">Vendors</span>
                                            )}
                                        </Link>
                                    </li>
                                    <li
                                        className="flex items-center h-12 px-4 py-2 hover:bg-gray-700 cursor-pointer"
                                        onClick={() => handleItemClick("User Titles")}
                                    >
                                        <Link to="user-titles" className="flex items-center w-full">
                                            <FiAward className="text-lg ml-3" />
                                            {!isCollapsed && (
                                                <span className="ml-3">User Positions</span>
                                            )}
                                        </Link>
                                    </li>
                                </ul>
                            )}
                        </>
                    )}
                </ul>
            </aside>
        </div>
    );
};

export default Sidebar;