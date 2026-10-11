import { Navigate, useLocation } from "react-router-dom";
 
// Wrap a page with this to make it available only to logged-in users.
export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const location = useLocation();
 
  if (!token) {
    // Not logged in: send to login and remember where they wanted to go.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
 
  return children;
}