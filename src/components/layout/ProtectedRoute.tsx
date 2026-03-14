import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "../../config/supabase";

export function ProtectedRoute({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  allowedRoles: _allowedRoles = [],
}: {
  allowedRoles?: string[];
}) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUserRole(session?.user?.user_metadata?.role || "patient");
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserRole(session?.user?.user_metadata?.role || "patient");
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading spinner while checking session initially
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-muted">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role Checking
  if (
    _allowedRoles.length > 0 &&
    userRole &&
    !_allowedRoles.includes(userRole)
  ) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    if (userRole === "doctor") {
      return <Navigate to="/doctor" replace />;
    } else {
      return <Navigate to="/patient" replace />;
    }
  }

  return <Outlet />;
}
