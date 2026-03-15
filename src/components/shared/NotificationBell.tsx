import { Bell, CheckCheck, MessageSquare, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { cn } from "../../utils/cn";

interface NotifItem {
  id: string;
  consultationId: string;
  fromName: string;
  content: string;
  timestamp: string;
  is_read: boolean;
}

interface Props {
  role: "patient" | "doctor";
}

export function NotificationBell({ role }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotifItem[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Load recent incoming messages as notifications
  useEffect(() => {
    let mounted = true;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const columnFilter = role === "patient" ? "patient_id" : "doctor_id";

      const { data: consultations } = await supabase
        .from("consultations")
        .select(
          `
          id,
          patient:profiles!consultations_patient_id_fkey(full_name),
          doctor:profiles!consultations_doctor_id_fkey(full_name)
        `,
        )
        .eq(columnFilter, user.id);

      if (!consultations || !mounted) return;

      const allNotifs: NotifItem[] = [];

      for (const c of consultations as any[]) {
        const senderRole = role === "patient" ? "doctor" : "patient";
        const fromName =
          role === "patient"
            ? c.doctor?.full_name
              ? `Dr. ${c.doctor.full_name.replace(/^Dr\.\s*/i, "")}`
              : "Doctor"
            : c.patient?.full_name || "Patient";

        const { data: msgs } = await supabase
          .from("messages")
          .select("id, content, created_at, is_read")
          .eq("consultation_id", c.id)
          .eq("sender_role", senderRole)
          .order("created_at", { ascending: false })
          .limit(5);

        if (!msgs) continue;

        for (const msg of msgs) {
          allNotifs.push({
            id: msg.id,
            consultationId: c.id,
            fromName,
            content: msg.content,
            timestamp: msg.created_at,
            is_read: msg.is_read,
          });
        }
      }

      // Sort by newest first and cap at 15
      allNotifs.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      if (mounted) setNotifications(allNotifs.slice(0, 15));
    }

    load();

    // Subscribe to new messages in real time
    const channel = supabase
      .channel(`notification-bell-${role}`)
      .on(
        "postgres_changes",
        {
          event: "*", // Listen to all changes (including updates for read status)
          schema: "public",
          table: "messages",
        },
        () => {
          load();
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [role]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("messages")
      .update({ is_read: true })
      .in("id", unreadIds);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const handleClick = async (notif: NotifItem) => {
    if (!notif.is_read) {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("id", notif.id);
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n)),
    );
    setOpen(false);
    navigate(role === "doctor" ? "/doctor/messages" : "/patient/messages", {
      state: { selectedId: notif.consultationId },
    });
  };

  function formatTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return `${Math.floor(diffHrs / 24)}d ago`;
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] rounded-full bg-primary-600 px-1 text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary-600" />
              <span className="font-bold text-slate-900 text-sm">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-slate-300" />
                </div>
                <p className="text-sm font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className={cn(
                    "w-full text-left px-5 py-4 flex gap-4 hover:bg-slate-50 transition-colors",
                    !notif.is_read && "bg-primary-50/40",
                  )}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 text-xs font-bold">
                    {notif.fromName.slice(0, 2).toUpperCase()}
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-slate-900 truncate">
                        {notif.fromName}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                        {formatTime(notif.timestamp)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {notif.content}
                    </p>
                  </div>
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="w-2 h-2 rounded-full bg-primary-500 shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60">
            <button
              onClick={() => {
                setOpen(false);
                navigate(
                  role === "doctor" ? "/doctor/messages" : "/patient/messages",
                );
              }}
              className="w-full text-center text-xs font-semibold text-primary-600 hover:text-primary-700 py-1"
            >
              View all messages →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
