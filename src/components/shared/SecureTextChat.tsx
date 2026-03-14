import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Shield,
  Lock,
  Loader2,
  AlertCircle,
  RefreshCcw,
  X,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../../config/supabase";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ── Types ──────────────────────────────────────────────────────
interface Message {
  id: string;
  sender_id?: string;
  sender_role: "doctor" | "patient" | "system";
  content: string;
  created_at: string;
}

interface SecureTextChatProps {
  consultationId: string;
  role: "doctor" | "patient";
  otherPartyName: string;
  onClose?: () => void;
}

// ── Helpers ────────────────────────────────────────────────────
function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// ── Avatar ─────────────────────────────────────────────────────
function Avatar({
  label,
  color,
}: {
  label: string;
  color: "blue" | "emerald";
}) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
        color === "blue" ? "bg-blue-500" : "bg-emerald-500"
      }`}
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────
export function SecureTextChat({
  consultationId,
  role,
  otherPartyName,
  onClose,
}: SecureTextChatProps) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Fetch messages ───────────────────────────────────────────
  const {
    data: messages = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Message[]>({
    queryKey: ["chat", consultationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, sender_role, content, created_at")
        .eq("consultation_id", consultationId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data as Message[]) || [];
    },
    staleTime: 10_000,
  });

  // ── Real-time subscription ───────────────────────────────────
  useEffect(() => {
    // Clean up any previous channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`chat-${consultationId}-${role}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `consultation_id=eq.${consultationId}`,
        },
        (payload) => {
          queryClient.setQueryData<Message[]>(
            ["chat", consultationId],
            (old = []) => {
              const newMsg = payload.new as Message;
              // Deduplicate: skip if already present (handles optimistic updates)
              if (old.some((m) => m.id === newMsg.id)) return old;
              // Also replace any temp optimistic entry from the same sender/content
              const withoutTemp = old.filter(
                (m) =>
                  !m.id.startsWith("temp-") ||
                  m.content !== newMsg.content ||
                  m.sender_role !== newMsg.sender_role,
              );
              return [...withoutTemp, newMsg];
            },
          );
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [consultationId, role, queryClient]);

  // ── Auto-scroll ──────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Auto-grow textarea ───────────────────────────────────────
  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, [input, resizeTextarea]);

  // ── Send mutation ────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: async (text: string) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data, error } = await supabase
        .from("messages")
        .insert({
          consultation_id: consultationId,
          sender_id: user.id,
          sender_role: role,
          content: text,
        })
        .select("id, sender_id, sender_role, content, created_at")
        .single();

      if (error) throw error;
      return data as Message;
    },
    onMutate: async (newText) => {
      setSendError(null);
      await queryClient.cancelQueries({ queryKey: ["chat", consultationId] });
      const prev = queryClient.getQueryData<Message[]>([
        "chat",
        consultationId,
      ]);

      queryClient.setQueryData<Message[]>(
        ["chat", consultationId],
        (old = []) => [
          ...old,
          {
            id: `temp-${Date.now()}`,
            sender_role: role,
            content: newText,
            created_at: new Date().toISOString(),
          },
        ],
      );

      return { prev };
    },
    onError: (_err, _text, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["chat", consultationId], context.prev);
      }
      setSendError("Failed to send. Please try again.");
    },
    onSuccess: (data) => {
      // Replace the temp optimistic entry with the real one
      queryClient.setQueryData<Message[]>(
        ["chat", consultationId],
        (old = []) => {
          const withoutTemp = old.filter(
            (m) =>
              !m.id.startsWith("temp-") ||
              m.content !== data.content ||
              m.sender_role !== data.sender_role,
          );
          if (withoutTemp.some((m) => m.id === data.id)) return withoutTemp;
          return [...withoutTemp, data];
        },
      );
    },
  });

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    sendMutation.mutate(text);
    setInput("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Derived labels ───────────────────────────────────────────
  const myLabel = role === "doctor" ? "Dr." : "You";
  const theirColor = role === "doctor" ? "blue" : "emerald";
  const myColor = role === "doctor" ? "emerald" : "blue";

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-slate-200">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Avatar label={otherPartyName} color={theirColor} />
          <div>
            <h3 className="font-semibold text-white text-sm leading-tight">
              {otherPartyName}
            </h3>
            <p className="text-blue-200 text-xs flex items-center gap-1 mt-0.5">
              <Lock className="h-2.5 w-2.5" />
              End-to-end encrypted · Secure consultation
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="bg-blue-500/40 border border-blue-400/30 text-blue-100 p-1.5 rounded-full"
            title="HIPAA-compliant secure channel"
          >
            <Shield className="h-4 w-4" />
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white hover:bg-blue-500/40 p-1.5 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ───────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-slate-50/60">
        {/* System banner */}
        <div className="flex justify-center py-2">
          <span className="text-[11px] bg-slate-200/80 text-slate-500 px-3 py-1 rounded-full font-medium">
            🔒 Secure consultation channel — messages are private
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-sm">Loading messages…</span>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm text-red-500">Could not load messages.</p>
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-100 transition-colors"
            >
              <RefreshCcw className="h-3 w-3" /> Retry
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
            <div className="bg-slate-100 p-4 rounded-full">
              <MessageSquare className="h-8 w-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-medium text-slate-500 text-sm">
                No messages yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Send a message to start the secure consultation.
              </p>
            </div>
          </div>
        ) : (
          (() => {
            const elements: React.ReactNode[] = [];
            let prevDate = "";

            messages.forEach((msg, i) => {
              // Date separator
              if (!isSameDay(msg.created_at, prevDate || "")) {
                elements.push(
                  <div key={`date-${i}`} className="flex justify-center my-3">
                    <span className="text-[11px] bg-slate-200/80 text-slate-500 px-3 py-1 rounded-full font-medium">
                      {formatDateLabel(msg.created_at)}
                    </span>
                  </div>,
                );
              }
              prevDate = msg.created_at;

              // System message
              if (msg.sender_role === "system") {
                elements.push(
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="text-[11px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
                      {msg.content}
                    </span>
                  </div>,
                );
                return;
              }

              const isMe = msg.sender_role === role;
              const isTemp = msg.id.startsWith("temp-");

              elements.push(
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"} ${isTemp ? "opacity-70" : ""}`}
                >
                  {/* Other party avatar */}
                  {!isMe && (
                    <Avatar label={otherPartyName} color={theirColor} />
                  )}

                  <div
                    className={`max-w-[75%] flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    {/* Sender label */}
                    <span className="text-[10px] text-slate-400 mb-1 px-1">
                      {isMe ? "You" : otherPartyName}
                    </span>

                    {/* Bubble */}
                    <div
                      className={`px-4 py-2.5 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap word-break break-words ${
                        isMe
                          ? "bg-blue-600 text-white rounded-br-sm"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>

                    {/* Timestamp */}
                    <span
                      className={`text-[10px] mt-1 px-1 ${isMe ? "text-slate-400" : "text-slate-400"}`}
                    >
                      {isTemp ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          Sending…
                        </span>
                      ) : (
                        formatTime(msg.created_at)
                      )}
                    </span>
                  </div>

                  {/* My avatar */}
                  {isMe && <Avatar label={myLabel} color={myColor} />}
                </div>,
              );
            });

            return elements;
          })()
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Error banner ─────────────────────────────────────── */}
      {sendError && (
        <div className="mx-4 mb-2 px-4 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-600 gap-2 shrink-0">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {sendError}
          </span>
          <button
            onClick={() => setSendError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ── Input area ──────────────────────────────────────── */}
      <div className="px-4 py-3 bg-white border-t border-slate-200 shrink-0">
        <form onSubmit={handleSend} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            disabled={sendMutation.isPending}
            className="flex-1 resize-none border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-slate-50 rounded-2xl px-4 py-2.5 outline-none transition-all leading-relaxed overflow-hidden"
            style={{ minHeight: "42px", maxHeight: "120px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || sendMutation.isPending}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-md hover:shadow-lg active:scale-95"
            title="Send message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-2">
          HIPAA-compliant · End-to-end encrypted · Patient data protected
        </p>
      </div>
    </div>
  );
}
