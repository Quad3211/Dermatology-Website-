import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 mins

export function SessionWatcher() {
  const navigate = useNavigate();
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
        // Check the current path at time of timeout, not at mount time
        const currentPath = window.location.pathname;
        const isProtected =
          currentPath.startsWith("/patient") ||
          currentPath.startsWith("/doctor");

        if (isProtected) {
          navigate("/login");
        } else {
          window.location.reload();
        }
      }, INACTIVITY_TIMEOUT_MS);
    };

    const handleActivity = () => {
      const now = Date.now();
      // Throttle: only reset the timer every 5s at most
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
  }, [navigate]); // Removed location.pathname — navigation should NOT restart the inactivity timer

  return null;
}
