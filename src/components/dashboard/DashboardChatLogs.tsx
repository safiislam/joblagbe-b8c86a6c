import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const DashboardChatLogs = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: logs } = useQuery({
    queryKey: ["admin-chat-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("chat_logs").select("*").order("updated_at", { ascending: false }).limit(50);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Chat Logs ({logs?.length ?? 0})</h1>
      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {logs && logs.length > 0 ? logs.map((log) => {
          const messages = Array.isArray(log.messages) ? log.messages : [];
          return (
            <div key={log.id} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">Session: {log.session_id.slice(0, 12)}...</p>
                  <p className="text-xs text-muted-foreground">{messages.length} messages · {formatDistanceToNow(new Date(log.updated_at), { addSuffix: true })}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)} className="gap-1 text-xs">
                  <Eye className="h-3 w-3" /> {expandedId === log.id ? "Hide" : "View"}
                </Button>
              </div>
              {expandedId === log.id && (
                <div className="mt-3 rounded-xl bg-secondary/50 p-4 space-y-2 text-sm max-h-64 overflow-y-auto animate-fade-in" style={{ animationDuration: "0.2s" }}>
                  {messages.map((msg: any, i: number) => (
                    <div key={i} className={`p-2 rounded-lg ${msg.role === "user" ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                      <span className="font-medium text-xs">{msg.role === "user" ? "User" : "Jobu"}:</span>
                      <p className="text-xs mt-0.5">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }) : <div className="p-8 text-center text-muted-foreground">No chat logs yet</div>}
      </div>
    </div>
  );
};

export default DashboardChatLogs;
