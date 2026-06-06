import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Phone, Calendar, FileText, User, Briefcase, Search, Shield, Download, Bell, Send, Loader2, CreditCard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  user_id: string;
  created_at: string;
  avatar_url: string | null;
  resume_url: string | null;
  nid_number: string | null;
};

const DashboardUsers = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<Profile | null>(null);
  const [notifyForm, setNotifyForm] = useState({ title: "", message: "" });

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, user_id, created_at, avatar_url, resume_url")
        .order("created_at", { ascending: false })
        .limit(500);
      const baseProfiles = (data ?? []) as Omit<Profile, "nid_number">[];
      // Sensitive NID lives in a restricted table; fetch and merge for admins.
      const userIds = baseProfiles.map((p) => p.user_id);
      if (userIds.length === 0) return [] as Profile[];
      const { data: sensitive } = await supabase
        .from("profile_sensitive" as any)
        .select("user_id, nid_number")
        .in("user_id", userIds);
      const nidMap = new Map<string, string | null>(
        ((sensitive ?? []) as any[]).map((s) => [s.user_id, s.nid_number ?? null])
      );
      return baseProfiles.map((p) => ({ ...p, nid_number: nidMap.get(p.user_id) ?? null })) as Profile[];
    },
  });

  const { data: userRoles } = useQuery({
    queryKey: ["admin-user-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role");
      return data ?? [];
    },
  });

  const { data: documents } = useQuery({
    queryKey: ["admin-documents", selected?.user_id],
    enabled: !!selected,
    queryFn: async () => {
      const { data } = await supabase
        .from("seeker_documents")
        .select("id, file_name, file_url, file_type, created_at")
        .eq("user_id", selected!.user_id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "moderator" | "user" }) => {
      // Remove existing roles first
      await supabase.from("user_roles").delete().eq("user_id", userId);
      if (role !== "user") {
        const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Role updated!");
      queryClient.invalidateQueries({ queryKey: ["admin-user-roles"] });
    },
    onError: () => toast.error("Failed to update role"),
  });

  const sendNotification = useMutation({
    mutationFn: async () => {
      if (!notifyForm.title.trim() || !notifyForm.message.trim()) throw new Error("Title and message required");

      if (notifyTarget) {
        // Send to single user
        const { error } = await supabase.from("notifications").insert({
          user_id: notifyTarget.user_id,
          title: notifyForm.title.trim(),
          message: notifyForm.message.trim(),
          type: "admin",
        });
        if (error) throw error;
      } else {
        // Send to all users
        const allUsers = profiles?.map((p) => ({
          user_id: p.user_id,
          title: notifyForm.title.trim(),
          message: notifyForm.message.trim(),
          type: "admin",
        }));
        if (!allUsers?.length) throw new Error("No users");
        const { error } = await supabase.from("notifications").insert(allUsers);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(notifyTarget ? "Notification sent!" : "Notification sent to all users!");
      setNotifyOpen(false);
      setNotifyForm({ title: "", message: "" });
      setNotifyTarget(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const getUserRole = (userId: string) => {
    const r = userRoles?.find((ur) => ur.user_id === userId);
    return r?.role ?? "user";
  };

  const exportCSV = () => {
    if (!profiles?.length) return;
    const headers = ["Name", "Phone", "NID", "Role", "App Role", "Joined"];
    const rows = profiles.map((p) => [
      p.full_name || "N/A",
      p.phone || "N/A",
      p.nid_number || "N/A",
      p.role,
      getUserRole(p.user_id),
      format(new Date(p.created_at), "yyyy-MM-dd"),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  };

  const filtered = profiles?.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.full_name?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q)
    );
  });

  const seekers = profiles?.filter((p) => p.role === "seeker").length ?? 0;
  const employers = profiles?.filter((p) => p.role === "employer").length ?? 0;

  const getInitials = (name: string | null) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "?";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold">Users ({profiles?.length ?? 0})</h1>
          <Badge variant="outline" className="border-primary text-primary">Seekers: {seekers}</Badge>
          <Badge variant="outline" className="border-accent text-accent">Employers: {employers}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => { setNotifyTarget(null); setNotifyOpen(true); }} className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Notify All
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {filtered && filtered.length > 0 ? (
          filtered.map((p) => {
            const appRole = getUserRole(p.user_id);
            return (
              <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3 cursor-pointer flex-1 min-w-0" onClick={() => setSelected(p)}>
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={p.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">{getInitials(p.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.full_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.phone || "No phone"} · NID: {p.nid_number || "N/A"} · {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={p.role === "employer" ? "border-accent text-accent" : "border-primary text-primary"}>
                    {p.role}
                  </Badge>
                  {appRole !== "user" && (
                    <Badge variant="default" className="text-[10px]">
                      <Shield className="h-2.5 w-2.5 mr-0.5" /> {appRole}
                    </Badge>
                  )}
                  <Select
                    value={appRole}
                    onValueChange={(v) => changeRoleMutation.mutate({ userId: p.user_id, role: v as "admin" | "moderator" | "user" })}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setNotifyTarget(p); setNotifyOpen(true); }}>
                    <Bell className="h-3.5 w-3.5" />
                  </Button>
                  <Eye className="h-4 w-4 text-muted-foreground cursor-pointer" onClick={() => setSelected(p)} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        )}
      </div>

      {/* Profile Preview Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selected.avatar_url ?? undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{getInitials(selected.full_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selected.full_name || "No name"}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={selected.role === "employer" ? "border-accent text-accent" : "border-primary text-primary"}>
                      {selected.role === "employer" ? <Briefcase className="h-3 w-3 mr-1" /> : <User className="h-3 w-3 mr-1" />}
                      {selected.role}
                    </Badge>
                    {getUserRole(selected.user_id) !== "user" && (
                      <Badge><Shield className="h-3 w-3 mr-1" />{getUserRole(selected.user_id)}</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{selected.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">NID:</span>
                  <span className="font-medium">{selected.nid_number || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">{format(new Date(selected.created_at), "dd MMM yyyy, hh:mm a")}</span>
                </div>
                {selected.resume_url && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resume:</span>
                    <a href={selected.resume_url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">View Resume</a>
                  </div>
                )}
              </div>

              {documents && documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Documents</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a key={doc.id} href={doc.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="flex-1 truncate">{doc.file_name}</span>
                        <Badge variant="secondary" className="text-xs">{doc.file_type}</Badge>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Send Notification Dialog */}
      <Dialog open={notifyOpen} onOpenChange={(open) => { if (!open) { setNotifyOpen(false); setNotifyTarget(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              {notifyTarget ? `Notify ${notifyTarget.full_name || "User"}` : "Notify All Users"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input value={notifyForm.title} onChange={(e) => setNotifyForm((f) => ({ ...f, title: e.target.value }))} placeholder="Notification title..." />
            </div>
            <div className="space-y-1.5">
              <Label>Message *</Label>
              <Textarea value={notifyForm.message} onChange={(e) => setNotifyForm((f) => ({ ...f, message: e.target.value }))} placeholder="Notification message..." rows={3} />
            </div>
            <Button onClick={() => sendNotification.mutate()} disabled={sendNotification.isPending} className="w-full gap-2">
              {sendNotification.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {notifyTarget ? "Send Notification" : `Send to All (${profiles?.length ?? 0})`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardUsers;
