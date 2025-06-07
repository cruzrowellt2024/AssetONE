import { FiMenu, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import "./Header.css";
import { useNavigate } from "react-router-dom";

const Header = ({
    isMobile,
    pageTitle,
    setPageTitle,
    profile,
    showDropdown,
    setShowDropdown,
    showAccount,
    handleLogout,
    profileRef,
    toggleMobileOpen
}) => {
    const navigate = useNavigate();

    const goToAccountSettings = () => {
        navigate("/account-settings");
        setPageTitle("Account Settings");
    }

    return (
        <div className={isMobile ? "mobile-header" : "page-header-container"}>
            {isMobile && (
                <FiMenu
                    className="hamburger"
                    onClick={toggleMobileOpen}
                />
            )}

            <span className={isMobile ? "" : "page-header"}>{pageTitle}</span>

            <div className="user-info" ref={profileRef} onClick={() => setShowDropdown(!showDropdown)}>
                <label className="username">{profile?.firstName}</label>
                <FiUser
                    className={`profile-icon ${!isMobile ? "desktop" : ""}`}
                    onClick={() => setShowDropdown(!showDropdown)}
                />
                {!showAccount && showDropdown && (
                    <div className="dropdown-menu">
                        <label className="email">{profile?.email}</label>
                        <button onClick={goToAccountSettings}>
                            <span className="icon"><FiSettings /></span>
                            Account Settings
                        </button>
                        <button className="logout-btn" onClick={handleLogout}>
                            <span className="icon"><FiLogOut /></span>
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;