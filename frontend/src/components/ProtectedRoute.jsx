import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const isLoggedIn = Boolean(localStorage.getItem("token"));
  if (!isLoggedIn) return <Navigate to="/" />;
  return children;
}
