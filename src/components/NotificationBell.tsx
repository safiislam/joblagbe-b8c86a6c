import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2, ExternalLink, Mail, CheckCircle2, XCircle, Star, PartyPopper, ClipboardList, ShieldCheck, AlertTriangle, Info, type LucideIcon } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const requestNotificationPermission = async () => {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  return await Notification.requestPermission();
};

const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `notif-${Date.now()}`,
    });
    if (onClick) n.onclick = () => { window.focus(); onClick(); n.close(); };
  } catch {
    // Silent fail
  }
};

const playNotificationSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Silent fail
  }
};

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  new_application: { icon: Mail, color: "text-blue-500" },
  job_approved: { icon: CheckCircle2, color: "text-green-500" },
  job_rejected: { icon: XCircle, color: "text-destructive" },
  application_shortlisted: { icon: Star, color: "text-yellow-500" },
  application_accepted: { icon: CheckCircle2, color: "text-green-500" },
  application_rejected: { icon: XCircle, color: "text-destructive" },
  course_approved: { icon: CheckCircle2, color: "text-green-500" },
  course_rejected: { icon: XCircle, color: "text-destructive" },
  verification_approved: { icon: ShieldCheck, color: "text-green-500" },
  verification_rejected: { icon: AlertTriangle, color: "text-yellow-500" },
  info: { icon: Info, color: "text-muted-foreground" },
};

const NotificationBell = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef(true);

  // Request permission on mount
  useEffect(() => {
    if (user) requestNotificationPermission();
  }, [user]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleNewNotifications = useCallback((data: any[]) => {
    if (!data?.length) return;
    
    if (initialLoadRef.current) {
      data.forEach((n) => seenIdsRef.current.add(n.id));
      initialLoadRef.current = false;
      return;
    }

    const newUnread = data.filter((n) => !n.is_read && !seenIdsRef.current.has(n.id));
    newUnread.forEach((n) => {
      seenIdsRef.current.add(n.id);
      playNotificationSound();
      showBrowserNotification(n.title, n.message, () => {
        if (n.link) navigate(n.link);
      });
    });
  }, [navigate]);

  const { data: notifications } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      const result = data ?? [];
      handleNewNotifications(result);
      return result;
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as any;
          if (!seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id);
            playNotificationSound();
            showBrowserNotification(n.title, n.message, () => {
              if (n.link) navigate(n.link);
            });
          }
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient, navigate]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").update({ is_read: true }).eq("user_id", user!.id).eq("is_read", false);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteNotification = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("notifications").delete().eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const deleteAllRead = useMutation({
    mutationFn: async () => {
      await supabase.from("notifications").delete().eq("user_id", user!.id).eq("is_read", true);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const handleNotifClick = (n: any) => {
    if (!n.is_read) markRead.mutate(n.id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  if (!user) return null;

  const unreadCount = notifications?.filter((n: any) => !n.is_read).length ?? 0;
  const readCount = notifications?.filter((n: any) => n.is_read).length ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell className={`h-[18px] w-[18px] transition-colors ${unreadCount > 0 ? "text-primary" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground px-1 animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[340px] rounded-2xl border bg-card shadow-elevated animate-fade-in" style={{ animationDuration: "0.15s" }}>
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h3 className="font-bold text-sm">Notifications</h3>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} className="h-7 text-[11px] gap-1 text-primary px-2">
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </Button>
              )}
            </div>
          </div>

          {/* Notifications list */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`group relative flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-secondary/50 border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
                  onClick={() => handleNotifClick(n)}
                >
                  {/* Type icon */}
                  <span className="text-lg shrink-0 mt-0.5">{typeIcons[n.type] || typeIcons.info}</span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                      {n.link && (
                        <span className="text-[10px] text-primary flex items-center gap-0.5">
                          <ExternalLink className="h-2.5 w-2.5" /> View
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotification.mutate(n.id); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-destructive/10"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <Bell className="h-8 w-8 mx-auto text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {readCount > 0 && (
            <div className="border-t px-4 py-2 flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteAllRead.mutate()}
                className="h-7 text-[11px] text-muted-foreground gap-1"
              >
                <Trash2 className="h-3 w-3" /> Clear read notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
