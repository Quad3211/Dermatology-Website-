import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins

export function SessionWatcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastResetRef = useRef<number>(0);

  useEffect(() => {
    const startTimeout = async () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      timeoutRef.current = setTimeout(async () => {
        await supabase.auth.signOut();
        const isProtected =
          location.pathname.startsWith("/patient") ||
          location.pathname.startsWith("/doctor");

        if (isProtected) {
          navigate("/login");
        } else {
          window.location.reload();
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
      const now = Date.now();
      // Throttle: only check session every 5s if already active
      if (now - lastResetRef.current > 5000) {
        lastResetRef.current = now;
        startTimeout();
      }
    };

    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];
    events.forEach((event) => document.addEventListener(event, handleActivity));

    startTimeout(); // initial start

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, handleActivity),
      );
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [location.pathname, navigate]);

  return null;
}
