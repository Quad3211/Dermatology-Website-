import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../core/Button";
import {
  LogOut,
  Activity,
  UploadCloud,
  FileText,
  Menu,
  X,
  History,
} from "lucide-react";
import { cn } from "../../utils/cn";
import { IncomingCallListener } from "../shared/IncomingCallListener";

export function PatientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const navLinks = [
    { name: "Dashboard", path: "/patient", icon: Activity },
    { name: "New Scan", path: "/patient/upload", icon: UploadCloud },
    { name: "Scan History", path: "/patient/history", icon: History },
    { name: "Education", path: "/patient/education", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col">
      <nav className="bg-white border-b border-surface-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className=" flex-shrink-0 flex items-center">
                <Link
                  to="/"
                  className="text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  SkinHealth
                </Link>
              </div>
              <div className="hidden sm:-my-px sm:ml-8 sm:flex sm:space-x-8">
                {navLinks.map((link) => {
                  const isActive =
                    location.pathname === link.path ||
                    (link.path !== "/patient" &&
                      location.pathname.startsWith(link.path));
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      className={cn(
                        "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                        isActive
                          ? "border-primary-500 text-slate-900"
                          : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700",
                      )}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-500"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
            <div className="-mr-2 flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-white inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden bg-white border-b border-surface-border">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center px-4 py-2 text-base font-medium",
                      isActive
                        ? "bg-primary-50 border-l-4 border-primary-500 text-primary-700"
                        : "border-l-4 border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800",
                    )}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {link.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 border-l-4 border-transparent text-base font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-800"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative">
        <IncomingCallListener />
        <Outlet />
      </main>
    </div>
  );
}
