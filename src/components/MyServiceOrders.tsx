import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Clock, Package, CheckCircle2, XCircle, ShoppingBag,
  BookOpen, BookMarked, CreditCard, FileText,
} from "lucide-react";

const statusConfig: Record<string, { label: string; labelBn: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Pending", labelBn: "অপেক্ষমান", color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  in_progress: { label: "In Progress", labelBn: "চলমান", color: "bg-primary/15 text-primary border-primary/20", icon: Package },
  completed: { label: "Completed", labelBn: "সম্পন্ন", color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", labelBn: "বাতিল", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
  approved: { label: "Approved", labelBn: "অনুমোদিত", color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  rejected: { label: "Rejected", labelBn: "বাতিল", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

const itemTypeLabels: Record<string, { label: string; icon: typeof BookOpen }> = {
  course: { label: "কোর্স", icon: BookOpen },
  ebook: { label: "বই", icon: BookMarked },
  service: { label: "সার্ভিস", icon: FileText },
};

const MyServiceOrders = () => {
  const { user } = useAuth();

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["my-service-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("service_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["my-payments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const isLoading = ordersLoading || paymentsLoading;
  const hasOrders = (orders && orders.length > 0);
  const hasPayments = (payments && payments.length > 0);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!hasOrders && !hasPayments) {
    return (
      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col items-center py-14 text-muted-foreground">
          <ShoppingBag className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">কোনো অর্ডার বা কেনাকাটা নেই</p>
          <p className="mt-1 text-sm">আপনি এখনো কোনো সার্ভিস অর্ডার বা কেনাকাটা করেননি</p>
        </div>
      </div>
    );
  }

  return (
    <Tabs defaultValue={hasPayments ? "purchases" : "services"}>
      <TabsList className="w-full grid grid-cols-2 h-10 mb-4">
        <TabsTrigger value="purchases" className="gap-1.5 text-xs sm:text-sm">
          <CreditCard className="h-3.5 w-3.5" /> কেনাকাটা ({payments?.length ?? 0})
        </TabsTrigger>
        <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm">
          <FileText className="h-3.5 w-3.5" /> সার্ভিস ({orders?.length ?? 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="purchases">
        <div className="rounded-2xl border bg-card shadow-card divide-y">
          {hasPayments ? payments!.map((payment) => {
            const cfg = statusConfig[payment.status] || statusConfig.pending;
            const Icon = cfg.icon;
            const typeInfo = itemTypeLabels[payment.item_type] || itemTypeLabels.service;
            const TypeIcon = typeInfo.icon;
            return (
              <div key={payment.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <h3 className="font-semibold text-sm">{payment.item_title || "Unknown"}</h3>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.labelBn}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="secondary" className="text-[10px]">{typeInfo.label}</Badge>
                      <span>৳{payment.amount}</span>
                      <span>{payment.payment_method}</span>
                      <span>{formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}</span>
                    </div>
                    {payment.transaction_id && (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        TrxID: <span className="font-mono">{payment.transaction_id}</span>
                      </p>
                    )}
                  </div>
                </div>
                {payment.admin_note && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                    📝 {payment.admin_note}
                  </p>
                )}
              </div>
            );
          }) : (
            <div className="flex flex-col items-center py-14 text-muted-foreground">
              <CreditCard className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">কোনো কেনাকাটা নেই</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="services">
        <div className="rounded-2xl border bg-card shadow-card divide-y">
          {hasOrders ? orders!.map((order) => {
            const cfg = statusConfig[order.status] || statusConfig.pending;
            const Icon = cfg.icon;
            return (
              <div key={order.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm">{order.service_type}</h3>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${cfg.color}`}>
                        <Icon className="h-3 w-3" />
                        {cfg.labelBn}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>নাম: {order.name}</span>
                      {order.phone && <span>📞 {order.phone}</span>}
                      <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
                {order.details && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 whitespace-pre-wrap">
                    {order.details}
                  </p>
                )}
              </div>
            );
          }) : (
            <div className="flex flex-col items-center py-14 text-muted-foreground">
              <ShoppingBag className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">কোনো সার্ভিস অর্ডার নেই</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MyServiceOrders;
