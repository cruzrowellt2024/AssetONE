import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiMenu,
  FiHome,
  FiUser,
  FiCalendar,
  FiBarChart,
  FiChevronDown,
  FiChevronUp,
  FiTag,
  FiBriefcase,
  FiMapPin,
  FiTruck,
  FiAward,
  FiInbox,
  FiDatabase,
  FiUsers,
  FiSettings,
  FiFileText,
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
  const [isUserListOpen, setIsUserListOpen] = useState(false);
  const [isSystemSettingsOpen, setIsSystemSettingsOpen] = useState(false);
  const sidebarRef = useRef(null);
  const { profile } = useAuth();
  const location = useLocation();

  const handleLinkClick = (title) => {
    setPageTitle(title);
    if (isMobile) setMobileOpen(false);
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setIsCollapsed(!isCollapsed);
    }
  };

  const toggleUserList = () => setIsUserListOpen((prev) => !prev);
  const toggleSystemSettings = () => setIsSystemSettingsOpen((prev) => !prev);

  const shouldShowItem = (requiredRoles) => {
    if (!profile?.role) return false;
    const userRole = profile.role.toLowerCase();
    return requiredRoles.some((role) => role.toLowerCase() === userRole);
  };

  // Highlight active links
  const isActive = (path) => location.pathname.includes(path);

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
        className={`fixed top-0 left-0 h-full bg-[#111827] shadow-lg z-40
          flex flex-col transition-transform duration-300 ease-in-out
          ${
            isMobile
              ? mobileOpen
                ? "translate-x-0 w-64"
                : "-translate-x-full w-64"
              : isCollapsed
              ? "w-20"
              : "w-64"
          }
        `}
      >
        <ul className="flex flex-col h-full overflow-y-auto select-none text-gray-100">
          {/* Brand / Hamburger */}
          <li
            className="flex items-center h-14 px-4 py-3 cursor-pointer bg-[#161d2c] hover:bg-gray-700 border-b border-gray-700"
            onClick={toggleSidebar}
          >
            {isCollapsed ? (
              <FiMenu className="text-xl ml-3" />
            ) : (
              <img
                src="/assetone-app-icon.png"
                alt="logo"
                className="w-7 h-7 ml-2 invert"
              />
            )}

            {(!isCollapsed || (isMobile && mobileOpen)) && (
              <>
                <span className="ml-3 text-lg font-semibold">AssetONE</span>
                <FiMenu className="text-xl ml-auto mr-2" />
              </>
            )}
          </li>

          {/* Dashboard */}
          {shouldShowItem([
            "system_administrator",
            "operational_administrator",
            "finance",
            "department_manager",
            "maintenance_head",
            "maintenance_technician",
          ]) && (
            <li
              className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                isActive("dashboard") ? "bg-gray-800" : ""
              }`}
            >
              <Link
                to="dashboard"
                className="flex items-center w-full"
                onClick={() => handleLinkClick("Dashboard")}
              >
                <FiHome className="text-lg ml-3" />
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="ml-3">Dashboard</span>
                )}
              </Link>
            </li>
          )}

          {/* User Management */}
          {shouldShowItem([
            "operational_administrator",
            "maintenance_head",
            "maintenance_technician",
          ]) && (
            <li
              className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                isActive("user-management") ? "bg-gray-800" : ""
              }`}
            >
              <Link
                to="user-management"
                className="flex items-center w-full"
                onClick={() => handleLinkClick("User Management")}
              >
                <FiUser className="text-lg ml-3" />
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="ml-3">User Management</span>
                )}
              </Link>
            </li>
          )}

          {/* Extended submenu */}
          {shouldShowItem(["system_administrator"]) && (
            <>
              <li
                className={`flex items-center justify-between h-12 px-4 py-3 cursor-pointer hover:bg-gray-700 select-none ${
                  isUserListOpen ? "bg-gray-800" : ""
                }`}
                onClick={toggleUserList}
                aria-expanded={isUserListOpen}
                aria-controls="user-submenu"
              >
                <div className="flex items-center">
                  <FiUsers className="text-lg ml-3" />
                  {(!isCollapsed || (isMobile && mobileOpen)) && (
                    <span className="ml-3">User Management</span>
                  )}
                </div>
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="mr-2">
                    {isUserListOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                )}
              </li>

              {isUserListOpen && (
                <ul
                  id="user-submenu"
                  className="flex flex-col border-l border-gray-200"
                >
                  <li
                    className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                      isActive("user-management") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="user-management"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("User Management")}
                    >
                      <FiUser className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">User List</span>
                      )}
                    </Link>
                  </li>
                  <li
                    className={`flex items-center h-12 px-4 py-2 hover:bg-gray-700 ${
                      isActive("user-titles") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="user-titles"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("User Positions")}
                    >
                      <FiAward className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">User Positions</span>
                      )}
                    </Link>
                  </li>
                </ul>
              )}
            </>
          )}

          {/* Asset List */}
          {shouldShowItem([
            "system_administrator",
            "operational_administrator",
            "finance",
            "department_manager",
            "maintenance_head",
          ]) && (
            <li
              className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                isActive("manage-assets") ? "bg-gray-800" : ""
              }`}
            >
              <Link
                to="manage-assets"
                className="flex items-center w-full"
                onClick={() => handleLinkClick("Manage Asset")}
              >
                <FiDatabase className="text-lg ml-3" />
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="ml-3">{profile.role === "finance" ? "Asset Requests" : "Asset Inventory"}</span>
                )}
              </Link>
            </li>
          )}

          {/* Maintenance Schedule */}
          {shouldShowItem([
            "system_administrator",
            "operational_administrator",
            "maintenance_head",
            "maintenance_technician",
          ]) && (
            <li
              className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                isActive("maintenance-scheduling") ? "bg-gray-800" : ""
              }`}
            >
              <Link
                to="maintenance-scheduling"
                className="flex items-center w-full"
                onClick={() => handleLinkClick("Maintenance Schedule")}
              >
                <FiCalendar className="text-lg ml-3" />
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="ml-3">Maintenance Schedules</span>
                )}
              </Link>
            </li>
          )}

          {/* Requests List - visible to all */}
          <li
            className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
              isActive("requests") ? "bg-gray-800" : ""
            }`}
          >
            <Link
              to="requests"
              className="flex items-center w-full"
              onClick={() => handleLinkClick("Requests")}
            >
              <FiInbox className="text-lg ml-3" />
              {(!isCollapsed || (isMobile && mobileOpen)) && (
                <span className="ml-3">Requests</span>
              )}
            </Link>
          </li>

          {/* Generate Reports */}
          {shouldShowItem([
            "system_administrator",
            "operational_administrator",
            "department_manager",
            "maintenance_head",
            "finance",
          ]) && (
            <li
              className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                isActive("generate-reports") ? "bg-gray-800" : ""
              }`}
            >
              <Link
                to="generate-reports"
                className="flex items-center w-full"
                onClick={() => handleLinkClick("Generate Reports")}
              >
                <FiFileText className="text-lg ml-3" />
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="ml-3">Generate Reports</span>
                )}
              </Link>
            </li>
          )}

          {/* System Settings submenu */}
          {shouldShowItem(["system_administrator"]) && (
            <>
              <li
                className={`flex items-center justify-between h-12 px-4 py-3 cursor-pointer hover:bg-gray-700 select-none ${
                  isSystemSettingsOpen ? "bg-gray-800" : ""
                }`}
                onClick={toggleSystemSettings}
                aria-expanded={isSystemSettingsOpen}
                aria-controls="system-settings-submenu"
              >
                <div className="flex items-center">
                  <FiSettings className="text-lg ml-3" />
                  {(!isCollapsed || (isMobile && mobileOpen)) && (
                    <span className="ml-3">System Settings</span>
                  )}
                </div>
                {(!isCollapsed || (isMobile && mobileOpen)) && (
                  <span className="mr-2">
                    {isSystemSettingsOpen ? <FiChevronUp /> : <FiChevronDown />}
                  </span>
                )}
              </li>

              {isSystemSettingsOpen && (
                <ul
                  id="system-settings-submenu"
                  className="flex flex-col border-l border-gray-200"
                >
                  <li
                    className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                      isActive("asset-categories") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="asset-categories"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("Manage Categories")}
                    >
                      <FiTag className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">Manage Categories</span>
                      )}
                    </Link>
                  </li>
                  <li
                    className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                      isActive("departments") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="departments"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("Manage Departments")}
                    >
                      <FiBriefcase className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">Manage Departments</span>
                      )}
                    </Link>
                  </li>
                  <li
                    className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                      isActive("location-management") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="location-management"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("Manage Locations")}
                    >
                      <FiMapPin className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">Manage Locations</span>
                      )}
                    </Link>
                  </li>
                  <li
                    className={`flex items-center h-12 px-4 py-3 hover:bg-gray-700 ${
                      isActive("vendor-contact") ? "bg-gray-800" : ""
                    }`}
                  >
                    <Link
                      to="vendor-contact"
                      className="flex items-center w-full"
                      onClick={() => handleLinkClick("Manage Vendors")}
                    >
                      <FiTruck className="text-lg ml-3" />
                      {(!isCollapsed || (isMobile && mobileOpen)) && (
                        <span className="ml-3">Manage Vendors</span>
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
