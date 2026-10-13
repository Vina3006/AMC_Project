import { Navigate, useLocation } from "react-router-dom";
import { getUser } from "../utils/auth";
 
// Wrap pages with this.
//   <ProtectedRoute>                          any logged-in user
//   <ProtectedRoute roles={["admin"]}>        only these roles
export default function ProtectedRoute({ children, roles }) {
  const user = getUser();
  const location = useLocation();
 
  // Not logged in (or token expired): go to login and remember the page.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
 
  // Logged in but not allowed on this page: back to the dashboard.
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
 
  return children;
}
 