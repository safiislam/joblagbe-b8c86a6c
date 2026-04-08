import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow, format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Eye, Search, Filter, CheckCircle2, Clock, XCircle, Package } from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "In Progress", color: "bg-primary/15 text-primary border-primary/20", icon: Package },
  completed: { label: "Completed", color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

const DashboardServiceOrders = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  const { data: orders } = useQuery({
    queryKey: ["admin-service-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("service_orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-service-orders"] });
      toast.success("স্ট্যাটাস আপডেট হয়েছে");
    },
  });

  const deleteOrder = async (id: string) => {
    if (!confirm("এই সার্ভিস অর্ডার স্থায়ীভাবে মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("service_orders").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("মুছে ফেলা হয়েছে"); queryClient.invalidateQueries({ queryKey: ["admin-service-orders"] }); }
  };

  const filtered = (orders ?? []).filter((o) => {
    const matchSearch =
      !search ||
      o.name?.toLowerCase().includes(search.toLowerCase()) ||
      o.email?.toLowerCase().includes(search.toLowerCase()) ||
      o.phone?.includes(search) ||
      o.service_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: orders?.length ?? 0,
    pending: orders?.filter((o) => o.status === "pending").length ?? 0,
    in_progress: orders?.filter((o) => o.status === "in_progress").length ?? 0,
    completed: orders?.filter((o) => o.status === "completed").length ?? 0,
  };

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Service Orders</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total", value: stats.total, color: "text-foreground" },
          { label: "Pending", value: stats.pending, color: "text-warning" },
          { label: "In Progress", value: stats.in_progress, color: "text-primary" },
          { label: "Completed", value: stats.completed, color: "text-success" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, service..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px] rounded-xl">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((o) => {
                const cfg = statusConfig[o.status] || statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{o.service_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {o.email && <div>{o.email}</div>}
                      {o.phone && <div>{o.phone}</div>}
                      {!o.email && !o.phone && "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${cfg.color} text-xs gap-1`}>
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(o.created_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelected(o)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteOrder(o.id)} title="স্থায়ীভাবে মুছুন">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No service orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>ID: {selected?.id?.slice(0, 8)}...</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Customer</p>
                  <p className="font-medium">{selected.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Service</p>
                  <p className="font-medium">{selected.service_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p>{selected.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Phone</p>
                  <p>{selected.phone || "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Submitted</p>
                  <p>{format(new Date(selected.created_at), "dd MMM yyyy, hh:mm a")}</p>
                </div>
              </div>

              {selected.details && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Details</p>
                  <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{selected.details}</div>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-xs mb-1.5">Update Status</p>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(statusConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <Button
                        key={key}
                        size="sm"
                        variant={selected.status === key ? "default" : "outline"}
                        className="text-xs h-8 gap-1 rounded-lg"
                        disabled={selected.status === key}
                        onClick={() => {
                          updateStatus.mutate({ id: selected.id, status: key });
                          setSelected({ ...selected, status: key });
                        }}
                      >
                        <Icon className="h-3 w-3" />
                        {cfg.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardServiceOrders;
