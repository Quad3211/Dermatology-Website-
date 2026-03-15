import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  FileText,
  History,
  LogOut,
  Menu,
  MessageSquare,
  UploadCloud,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";
import { Button } from "../core/Button";
import { IncomingCallListener } from "../shared/IncomingCallListener";
import { NotificationBell } from "../shared/NotificationBell";

export function PatientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (location.pathname.startsWith("/patient")) {
      navigate("/login");
    } else {
      window.location.reload();
    }
  };

  const navLinks = [
    { name: "Dashboard", path: "/patient", icon: Activity },
    { name: "New Scan", path: "/patient/upload", icon: UploadCloud },
    { name: "Scan History", path: "/patient/history", icon: History },
    { name: "Education", path: "/patient/education", icon: FileText },
    { name: "Messages", path: "/patient/messages", icon: MessageSquare },
  ];

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages", "patient"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return 0;

      const { data: consultations, error: consultErr } = await supabase
        .from("consultations")
        .select("id")
        .eq("patient_id", user.id);

      if (consultErr || !consultations?.length) return 0;
      const ids = consultations.map((c) => c.id);

      const { count, error: msgErr } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .in("consultation_id", ids)
        .neq("sender_role", "patient")
        .eq("is_read", false);

      if (msgErr) return 0;
      return count ?? 0;
    },
    staleTime: 15_000,
  });

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
            <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-2">
              <NotificationBell role="patient" />
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
        {isMobileMenuOpen &&
          createPortal(
            <div className="sm:hidden fixed inset-0 z-[100] bg-white">
              <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-500">
                  Patient Menu
                </span>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="h-[calc(100dvh-4.5rem)] overflow-y-auto snap-y snap-mandatory">
                <div className="min-h-full flex flex-col px-6 py-6 snap-start">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Navigation
                  </div>
                  <div className="space-y-2">
                    {navLinks.map((link) => {
                      const isActive = location.pathname === link.path;
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.name}
                          to={link.path}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center justify-between rounded-2xl border px-4 py-4 text-base font-semibold transition",
                            isActive
                              ? "border-primary-200 bg-primary-50 text-primary-700"
                              : "border-slate-200 text-slate-700 hover:bg-slate-50"
                          )}
                        >
                          <span className="flex items-center">
                            <Icon className="mr-3 h-5 w-5" />
                            {link.name}
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Account
                    </div>
                    <Link
                      to="/patient/messages"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span className="flex items-center">
                        <MessageSquare className="mr-3 h-5 w-5" />
                        Messages
                      </span>
                      {unreadCount > 0 && (
                        <span className="h-6 min-w-[1.5rem] rounded-full bg-primary-600 px-2 text-xs font-bold text-white flex items-center justify-center">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <span className="flex items-center">
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                      </span>
                    </button>
                  </div>
                </div>

                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-2">
                  <span className="h-2 w-2 rounded-full bg-slate-900" />
                  <span className="h-2 w-2 rounded-full bg-slate-300" />
                  <span className="mt-2 h-6 w-6 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
                </div>
              </div>
            </div>,
            document.body
          )}
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative">
        <IncomingCallListener />
        <Outlet />
      </main>
    </div>
  );
}
