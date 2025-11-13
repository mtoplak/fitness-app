import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

type ProtectedRouteProps = {
  children: JSX.Element;
  requireRole?: "member" | "trainer" | "admin";
};

export default function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  
  // Check if specific role is required
  if (requireRole && user.role !== requireRole) {
    return <Navigate to="/profile" replace />;
  }
  
  return children;
}



