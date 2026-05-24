import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccess, type Permission } from "./permissions";
import { useAuth } from "./providers";

export function ProtectedRoute({ permission }: { permission?: Permission }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !canAccess(user.papel, permission)) {
    return <Navigate to="/acesso-negado" replace />;
  }

  return <Outlet />;
}
