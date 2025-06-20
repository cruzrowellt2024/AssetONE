import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SpinnerOverlay from "./SpinnerOverlay";

const PrivateRoute = () => {
  const { user, profile, loading, profileLoading } = useAuth();
  const location = useLocation();

  if (profileLoading) {
    return (
      <SpinnerOverlay logo="A" />
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname === "/") {
    if (["reporter", "maintenance_technician"].includes(profile.role)) return <Navigate to="/requests" replace />;
    else return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;