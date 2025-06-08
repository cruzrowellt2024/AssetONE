import { FiMenu, FiUser, FiSettings, FiLogOut } from "react-icons/fi";
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
  toggleMobileOpen,
}) => {
  const navigate = useNavigate();

  const goToAccountSettings = () => {
    navigate("/account-settings");
    setPageTitle("Account Settings");
  };

  return (
    <header
      className={`sticky top-0 flex items-center justify-between border-b border-gray-200 ${
        isMobile
          ? "bg-gray-900 text-white px-4 py-2 shadow-md z-20"
          : "bg-white px-4 py-2 text-black z-20"
      }`}
    >
      {isMobile && (
        <FiMenu
          className="text-2xl cursor-pointer text-white"
          onClick={toggleMobileOpen}
        />
      )}

      <h1 className={`font-semibold text-lg ${isMobile ? "ml-2" : ""}`}>
        {pageTitle}
      </h1>

      <div
        ref={profileRef}
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative flex items-center gap-2 cursor-pointer px-4 py-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <span className=" font-medium select-none">
          {profile?.firstName}
        </span>

        <FiUser
          className={`rounded-full bg-indigo-600 p-2 text-white text-4xl ${
            !isMobile ? "hidden sm:block" : ""
          }`}
        />

        {!showAccount && showDropdown && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-md bg-white shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
            <div className="px-4 py-2 text-sm text-gray-500 select-none border-b border-gray-200">
              {profile?.email}
            </div>

            <button
              onClick={goToAccountSettings}
              className="flex items-center gap-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100"
            >
              <FiSettings className="text-lg" />
              Account Settings
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-b-md"
            >
              <FiLogOut className="text-lg" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;