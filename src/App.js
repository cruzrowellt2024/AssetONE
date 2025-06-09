import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage/LoginPage";
import Main from "./pages/Main/MainPage";
import Dashboard from "./pages/Main/DashboardPage/Dashboard";
import UserManagement from "./pages/Main/UserManagement/UserManagement";
import Requests from "./pages/Main/Requests/Requests";
import ManageAssets from "./pages/Main/ManageAsset/ManageAssets";
import MaintenanceScheduling from "./pages/Main/MaintenanceScheduling/MaintenanceScheduling";
import LocationManagement from "./pages/Main/Records/LocationManagement/LocationManagement";
import VendorContact from "./pages/Main/Records/VendorContact/VendorContact";
import GenerateReports from "./pages/Main/GenerateReports/GenerateReports";
import AccountSettings from "./pages/Main/AccountSettings/AccountSettings";
import PrivateRoute from "./components/PrivateRoute";
import AssetCategories from "./pages/Main/Records/AssetCategories/AssetCategories";
import UserTitle from "./pages/Main/Records/UserTitle/UserTitle";
import Departments from "./pages/Main/Records/Departments/Departments";
import "./App.css";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/",
    element: <PrivateRoute/>,
    children: [
      {
        path: "",
        element: <Main />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "manage-assets", element: <ManageAssets /> },
          { path: "user-management", element: <UserManagement /> },
          { path: "requests", element: <Requests /> },
          { path: "generate-reports", element: <GenerateReports /> },
          { path: "account-settings", element: <AccountSettings /> },
          { path: "maintenance-scheduling", element: <MaintenanceScheduling /> },
          { path: "location-management", element: <LocationManagement /> },
          { path: "vendor-contact", element: <VendorContact /> },
          { path: "asset-categories", element: <AssetCategories/> },
          { path: "departments", element: <Departments/> },
          { path: "user-titles", element: <UserTitle/> },
        ]},
    ],
  },
]);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;