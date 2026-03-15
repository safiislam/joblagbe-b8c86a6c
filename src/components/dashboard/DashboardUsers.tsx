import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Eye, Phone, Calendar, FileText, User, Briefcase, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Profile = {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  user_id: string;
  created_at: string;
  avatar_url: string | null;
  resume_url: string | null;
};

const DashboardUsers = () => {
  const [selected, setSelected] = useState<Profile | null>(null);
  const [search, setSearch] = useState("");

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, role, phone, user_id, created_at, avatar_url, resume_url")
        .order("created_at", { ascending: false })
        .limit(200);
      return (data ?? []) as Profile[];
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
    name
      ? name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : "?";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Users ({profiles?.length ?? 0})</h1>
          <Badge variant="outline" className="border-primary text-primary">Seekers: {seekers}</Badge>
          <Badge variant="outline" className="border-accent text-accent">Employers: {employers}</Badge>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-2xl border bg-card shadow-sm divide-y">
        {filtered && filtered.length > 0 ? (
          filtered.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => setSelected(p)}
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={p.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(p.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{p.full_name || "No name"}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.phone || "No phone"} · Joined{" "}
                    {formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={
                    p.role === "employer"
                      ? "border-accent text-accent"
                      : "border-primary text-primary"
                  }
                >
                  {p.role}
                </Badge>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-muted-foreground">No users found</div>
        )}
      </div>

      {/* Profile Preview Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-5">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selected.avatar_url ?? undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">
                    {getInitials(selected.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-bold">{selected.full_name || "No name"}</h3>
                  <Badge
                    variant="outline"
                    className={
                      selected.role === "employer"
                        ? "border-accent text-accent"
                        : "border-primary text-primary"
                    }
                  >
                    {selected.role === "employer" ? (
                      <Briefcase className="h-3 w-3 mr-1" />
                    ) : (
                      <User className="h-3 w-3 mr-1" />
                    )}
                    {selected.role}
                  </Badge>
                </div>
              </div>

              {/* Info Grid */}
              <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{selected.phone || "Not provided"}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Joined:</span>
                  <span className="font-medium">
                    {format(new Date(selected.created_at), "dd MMM yyyy, hh:mm a")}
                  </span>
                </div>
                {selected.resume_url && (
                  <div className="flex items-center gap-3 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Resume:</span>
                    <a
                      href={selected.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}
              </div>

              {/* Documents */}
              {documents && documents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Documents</h4>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/50 transition-colors"
                      >
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
    </div>
  );
};

export default DashboardUsers;
