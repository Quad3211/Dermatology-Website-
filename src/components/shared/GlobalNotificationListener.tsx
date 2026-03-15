import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { showToast } from "../../services/toastService";

export function GlobalNotificationListener() {
  const navigate = useNavigate();
  const activeSubs = useRef<Set<string>>(new Set());

  useEffect(() => {
    let mounted = true;

    async function setupSubscriptions() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const role = user.user_metadata?.role || "patient";
      const columnFilter = role === "patient" ? "patient_id" : "doctor_id";

      // Fetch all consultations for this user to know which chat channels to join
      const { data } = await supabase
        .from("consultations")
        .select(
          `
          id,
          patient:profiles!consultations_patient_id_fkey(full_name),
          doctor:profiles!consultations_doctor_id_fkey(full_name)
        `,
        )
        .eq(columnFilter, user.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const consultations = data as unknown as Record<string, any>[];

      if (!consultations || !mounted) return;

      consultations.forEach((consult) => {
        if (activeSubs.current.has(consult.id)) return;

        const otherPartyName =
          role === "patient"
            ? consult.doctor?.full_name
              ? `Dr. ${consult.doctor.full_name.replace(/^Dr\.\s*/i, "")}`
              : "Your Doctor"
            : consult.patient?.full_name || "Patient";

        supabase
          .channel(`notifications-${consult.id}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "messages",
              filter: `consultation_id=eq.${consult.id}`,
            },
            (payload) => {
              const newMsg = payload.new;
              // Only notify if the message is NOT from the current role
              if (newMsg.sender_role !== role) {
                showToast({
                  title: `New message from ${otherPartyName}`,
                  message: newMsg.content,
                  onClick: () => {
                    navigate(
                      role === "doctor"
                        ? "/doctor/messages"
                        : "/patient/messages",
                      {
                        state: { selectedId: consult.id },
                      },
                    );
                  },
                });
              }
            },
          )
          .subscribe();

        activeSubs.current.add(consult.id);
      });
    }

    setupSubscriptions();

    // Re-check on auth state change (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setupSubscriptions();
      } else if (event === "SIGNED_OUT") {
        // Clear all
        activeSubs.current.clear();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate]);

  return null;
}
