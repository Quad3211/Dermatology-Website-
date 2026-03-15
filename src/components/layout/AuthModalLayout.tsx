import { X } from "lucide-react";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

export function AuthModalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const backgroundLocation = (location.state as Record<string, unknown>)
    ?.backgroundLocation as { pathname: string } | undefined;
  const closeTarget = backgroundLocation?.pathname || "/";

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        navigate(closeTarget, { replace: true });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navigate, closeTarget]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 lg:p-8"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close authentication dialog"
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
        onClick={() => navigate(closeTarget, { replace: true })}
      />

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-36 left-6 h-80 w-80 rounded-full bg-primary-300/50 blur-[140px]" />
        <div className="absolute bottom-6 right-6 h-96 w-96 rounded-full bg-emerald-300/45 blur-[160px]" />
        <div className="absolute top-1/3 right-1/4 h-56 w-56 rounded-full bg-white/50 blur-[90px]" />
      </div>

      <div
        className="relative z-10 w-full flex items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative w-full flex items-center justify-center">
          <Outlet />
          <button
            type="button"
            aria-label="Close"
            className="absolute -top-3 right-3 sm:right-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/90 bg-white/90 text-slate-700 shadow-xl transition hover:bg-white"
            onClick={() => navigate(closeTarget, { replace: true })}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
