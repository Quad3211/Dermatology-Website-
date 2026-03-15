import { motion } from "framer-motion";
import { Activity, Menu, ShieldPlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { Button } from "../core/Button";

export function PublicNavbar() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const modalLinkState = { backgroundLocation: location };

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
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link
            to="/"
            className="flex items-center space-x-2 transition-opacity hover:opacity-80"
          >
            <div className="bg-primary-50 p-2 rounded-lg">
              <ShieldPlus className="h-6 w-6 text-primary-600" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Dermify
            </span>
          </Link>
          <div className="hidden sm:flex items-center space-x-4">
            {isAuthenticated === null ? (
              <div className="h-10 w-24 bg-slate-100 animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <Link to={userRole === "doctor" ? "/doctor" : "/patient"}>
                <Button>
                  <Activity className="w-4 h-4 mr-2" />
                  Go to {userRole === "doctor" ? "Portal" : "Dashboard"}
                </Button>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  state={modalLinkState}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Log In
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen &&
        createPortal(
          <div className="sm:hidden fixed inset-0 z-[100] bg-white">
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-500">Menu</span>
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
                  Explore
                </div>
                <div className="space-y-2">
                  <Link
                    to="/about"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Contact
                  </Link>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-6">
                  <div className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Account
                  </div>
                  {isAuthenticated === null ? (
                    <div className="h-12 w-full rounded-2xl bg-slate-100 animate-pulse" />
                  ) : isAuthenticated ? (
                    <Link
                      to={userRole === "doctor" ? "/doctor" : "/patient"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Go to {userRole === "doctor" ? "Portal" : "Dashboard"}
                    </Link>
                  ) : (
                    <div className="space-y-2">
                      <Link
                        to="/login"
                        state={modalLinkState}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-4 text-base font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Log In
                      </Link>
                    </div>
                  )}
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
    </motion.nav>
  );
}
