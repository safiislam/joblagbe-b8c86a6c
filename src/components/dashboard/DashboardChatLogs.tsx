import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Search, Trash2, MessageSquare, Bot, User, Clock, X, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

type ChatMessage = { role: "user" | "assistant"; content: string };
type ChatLog = {
  id: string;
  session_id: string;
  user_id: string | null;
  messages: any;
  created_at: string;
  updated_at: string;
};

const PAGE_SIZE = 20;

const DashboardChatLogs = () => {
  const [selectedLog, setSelectedLog] = useState<ChatLog | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-chat-logs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("chat_logs")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200);
      return (data ?? []) as ChatLog[];
    },
  });

  // Fetch user profiles for logged-in chatters
  const { data: userProfiles } = useQuery({
    queryKey: ["admin-chat-user-profiles", logs?.map((l) => l.user_id).filter(Boolean)],
    enabled: !!logs && logs.some((l) => l.user_id),
    queryFn: async () => {
      const userIds = [...new Set(logs?.map((l) => l.user_id).filter(Boolean) as string[])];
      if (!userIds.length) return {};
      const { data } = await supabase.from("profiles").select("user_id, full_name, phone").in("user_id", userIds);
      const map: Record<string, { full_name: string | null; phone: string | null }> = {};
      data?.forEach((p: any) => { map[p.user_id] = p; });
      return map;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("chat_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chat-logs"] });
      toast.success("Chat log deleted");
      setSelectedLog(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const parseMessages = (raw: any): ChatMessage[] => {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    return [];
  };

  const filtered = useMemo(() => {
    if (!logs) return [];
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) => {
      const msgs = parseMessages(log.messages);
      const matchSession = log.session_id.toLowerCase().includes(q);
      const matchContent = msgs.some((m) => m.content.toLowerCase().includes(q));
      return matchSession || matchContent;
    });
  }, [logs, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const totalMessages = useMemo(() => {
    return (logs ?? []).reduce((sum, log) => sum + parseMessages(log.messages).length, 0);
  }, [logs]);

  const getPreview = (log: ChatLog): string => {
    const msgs = parseMessages(log.messages);
    const firstUser = msgs.find((m) => m.role === "user");
    if (firstUser) return firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? "..." : "");
    return "No user message";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Chat Logs</h1>
          <p className="text-sm text-muted-foreground">
            {logs?.length ?? 0} sessions · {totalMessages} messages total
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total Sessions", value: logs?.length ?? 0, icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
          { label: "Total Messages", value: totalMessages, icon: MessageSquare, color: "text-accent", bg: "bg-accent/10" },
          { label: "With Users", value: logs?.filter((l) => l.user_id).length ?? 0, icon: User, color: "text-success", bg: "bg-success/10" },
          { label: "Anonymous", value: logs?.filter((l) => !l.user_id).length ?? 0, icon: Bot, color: "text-muted-foreground", bg: "bg-muted" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-3 shadow-sm">
            <div className={`mb-1 flex h-8 w-8 items-center justify-center rounded-lg ${s.bg}`}>
              <s.icon className={`h-4 w-4 ${s.color}`} />
            </div>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Log List */}
      <div className="rounded-2xl border bg-card shadow-sm">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading chat logs...</div>
        ) : paged.length > 0 ? (
          <div className="divide-y">
            {paged.map((log) => {
              const msgs = parseMessages(log.messages);
              const userMsgCount = msgs.filter((m) => m.role === "user").length;
              const botMsgCount = msgs.filter((m) => m.role === "assistant").length;

              return (
                <div
                  key={log.id}
                  className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors cursor-pointer group"
                  onClick={() => setSelectedLog(log)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{getPreview(log)}</p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(log.updated_at), { addSuffix: true })}
                      </span>
                      <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                        <User className="h-2.5 w-2.5" /> {userMsgCount}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] h-4 gap-0.5">
                        <Bot className="h-2.5 w-2.5" /> {botMsgCount}
                      </Badge>
                      {log.user_id && (
                        <Badge variant="outline" className="text-[10px] h-4 text-success border-success/30">
                          Logged In
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Delete this chat log?")) deleteMutation.mutate(log.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            {search ? "No conversations match your search" : "No chat logs yet"}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-2">
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} ({filtered.length} results)
            </span>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col p-0">
          <DialogHeader className="px-5 pt-5 pb-3 border-b shrink-0">
            <DialogTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Conversation
            </DialogTitle>
            {selectedLog && (
              <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>Session: {selectedLog.session_id.slice(0, 16)}...</span>
                <span>·</span>
                <span>{format(new Date(selectedLog.created_at), "MMM dd, yyyy HH:mm")}</span>
                {selectedLog.user_id && (
                  <>
                    <span>·</span>
                    <Badge variant="outline" className="text-[10px] h-4 text-success border-success/30">Logged In User</Badge>
                  </>
                )}
              </div>
            )}
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {selectedLog && parseMessages(selectedLog.messages).map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5">
                    <Bot className="h-3.5 w-3.5" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-accent-foreground rounded-br-md"
                      : "bg-secondary text-foreground rounded-bl-md"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none [&_p]:mb-1 [&_p]:mt-0 [&_ul]:my-1 [&_li]:my-0 [&_a]:text-primary [&_a]:underline">
                      <ReactMarkdown
                        components={{
                          a: ({ href, children }) => (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:opacity-80">
                              {children}
                            </a>
                          ),
                        }}
                      >{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent mt-0.5">
                    <User className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="border-t px-4 py-3 flex items-center justify-between shrink-0">
            <span className="text-xs text-muted-foreground">
              {selectedLog ? parseMessages(selectedLog.messages).length : 0} messages
            </span>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1 text-xs"
              onClick={() => {
                if (selectedLog && confirm("Delete this chat log?")) {
                  deleteMutation.mutate(selectedLog.id);
                }
              }}
            >
              <Trash2 className="h-3 w-3" /> Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardChatLogs;
