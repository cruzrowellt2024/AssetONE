import { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import { Tooltip } from "react-tooltip";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import Sidebar from "../../components/Sidebar";

const Main = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sidebarRef = useRef(null);
  const [pageTitle, setPageTitle] = useState("AssetONE");
  const { profile, loading: authLoading, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();
  const [showAccount, setShowAccount] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && profile) {
      setLoading(false);
    }
  }, [authLoading, profile]);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };

    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !isMobile
      ) {
        setIsCollapsed(true);
      }

      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    window.addEventListener("resize", handleResize);
    document.addEventListener("click", handleClickOutside);

    return () => {
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isMobile]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="loading-overlay">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        ref={sidebarRef}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        setPageTitle={setPageTitle}
        className={`
      ${
        isMobile
          ? mobileOpen
            ? "fixed top-0 left-0 h-full z-50 w-64 shadow-lg bg-white transition-transform duration-300 transform translate-x-0"
            : "fixed top-0 left-0 h-full z-50 w-64 shadow-lg bg-white transition-transform duration-300 transform -translate-x-full"
          : isCollapsed
          ? "relative w-20"
          : "relative w-64"
      }
    `}
      />

      <div
        className={`
      flex-1
      ${!isMobile && isCollapsed ? "ml-20" : ""}
      ${!isMobile && !isCollapsed ? "ml-64" : ""}
      ${isMobile && mobileOpen ? "pointer-events-none" : ""}
      transition-margin duration-300
      overflow-auto
    `}
      >
        <Header
          isMobile={isMobile}
          pageTitle={pageTitle}
          setPageTitle={setPageTitle}
          profile={profile}
          showDropdown={showDropdown}
          setShowDropdown={setShowDropdown}
          showAccount={showAccount}
          handleLogout={handleLogout}
          profileRef={profileRef}
          toggleMobileOpen={() => setMobileOpen(!mobileOpen)}
        />
        <Outlet />
      </div>

      {!isMobile && (
        <Tooltip
          id="sidebar-tooltip"
          place="right"
          effect="solid"
          style={{ zIndex: 9999 }}
        />
      )}
    </div>
  );
};

export default Main;
