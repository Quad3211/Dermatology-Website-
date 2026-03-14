import { useEffect, useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import { PublicNavbar } from "../shared/PublicNavbar";
import { supabase } from "../../config/supabase";

export function AuthLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUserRole(session?.user?.user_metadata?.role || "patient");
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      setUserRole(session?.user?.user_metadata?.role || "patient");
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  // If already authenticated, redirect away from auth pages
  if (isAuthenticated) {
    return (
      <Navigate to={userRole === "doctor" ? "/doctor" : "/patient"} replace />
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <PublicNavbar />
      <div className="flex-1 mt-20 flex">
        <Outlet />
      </div>
    </div>
  );
}
