import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus, Pencil, Trash2, Smartphone, CreditCard, Search,
  CheckCircle2, XCircle, Clock, Download, Loader2,
} from "lucide-react";

type PaymentSetting = {
  id: string;
  method_name: string;
  method_type: string;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
  icon_url: string | null;
};

type Payment = {
  id: string;
  user_id: string | null;
  payment_type: string;
  item_type: string;
  item_id: string | null;
  item_title: string | null;
  amount: number;
  payment_method: string;
  transaction_id: string | null;
  sender_number: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
};

const emptyForm = {
  method_name: "",
  method_type: "mobile_banking",
  account_number: "",
  account_name: "",
  instructions: "",
  is_active: true,
  sort_order: 0,
  icon_url: "",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const DashboardPayments = () => {
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<PaymentSetting | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Payment settings
  const { data: settings } = useQuery({
    queryKey: ["payment-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("payment_settings").select("*").order("sort_order");
      return (data as PaymentSetting[]) ?? [];
    },
  });

  // Payments history
  const { data: payments, isLoading: loadingPayments } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as Payment[]) ?? [];
    },
  });

  const openAdd = () => {
    setForm(emptyForm);
    setEditItem(null);
    setShowForm(true);
  };

  const openEdit = (s: PaymentSetting) => {
    setForm({
      method_name: s.method_name,
      method_type: s.method_type,
      account_number: s.account_number ?? "",
      account_name: s.account_name ?? "",
      instructions: s.instructions ?? "",
      is_active: s.is_active,
      sort_order: s.sort_order,
    });
    setEditItem(s);
    setShowForm(true);
  };

  const saveMethod = async () => {
    if (!form.method_name.trim()) { toast.error("মেথডের নাম দিন"); return; }
    setSaving(true);
    try {
      const payload = {
        method_name: form.method_name.trim(),
        method_type: form.method_type,
        account_number: form.account_number.trim() || null,
        account_name: form.account_name.trim() || null,
        instructions: form.instructions.trim() || null,
        is_active: form.is_active,
        sort_order: form.sort_order,
      };

      if (editItem) {
        const { error } = await supabase.from("payment_settings").update(payload).eq("id", editItem.id);
        if (error) throw error;
        toast.success("আপডেট হয়েছে");
      } else {
        const { error } = await supabase.from("payment_settings").insert(payload);
        if (error) throw error;
        toast.success("যোগ করা হয়েছে");
      }
      qc.invalidateQueries({ queryKey: ["payment-settings"] });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteMethod = async (id: string) => {
    if (!confirm("মুছে ফেলতে চান?")) return;
    const { error } = await supabase.from("payment_settings").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["payment-settings"] }); }
  };

  const updatePaymentStatus = async (paymentId: string, status: string) => {
    const { error } = await supabase.from("payments").update({ status }).eq("id", paymentId);
    if (error) toast.error(error.message);
    else { toast.success(`স্ট্যাটাস ${status === "approved" ? "অনুমোদিত" : "প্রত্যাখ্যাত"} হয়েছে`); qc.invalidateQueries({ queryKey: ["admin-payments"] }); }
  };

  const filteredPayments = payments?.filter((p) => {
    const matchSearch = !search ||
      p.item_title?.toLowerCase().includes(search.toLowerCase()) ||
      p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
      p.payment_method.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const exportCSV = () => {
    if (!filteredPayments?.length) return;
    const headers = ["Date", "Item", "Type", "Amount", "Method", "TrxID", "Sender", "Status"];
    const rows = filteredPayments.map(p => [
      new Date(p.created_at).toLocaleDateString("bn-BD"),
      p.item_title || "-",
      p.item_type,
      p.amount,
      p.payment_method,
      p.transaction_id || "-",
      p.sender_number || "-",
      p.status,
    ]);
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-bangla">পেমেন্ট ম্যানেজমেন্ট</h1>
        <p className="text-sm text-muted-foreground">পেমেন্ট মেথড সেটআপ ও পেমেন্ট হিস্ট্রি দেখুন</p>
      </div>

      <Tabs defaultValue="methods">
        <TabsList>
          <TabsTrigger value="methods" className="gap-1.5">
            <Smartphone className="h-4 w-4" /> পেমেন্ট মেথড
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5">
            <CreditCard className="h-4 w-4" /> পেমেন্ট হিস্ট্রি
            {payments?.filter(p => p.status === "pending").length ? (
              <Badge className="ml-1 bg-accent text-accent-foreground text-[10px] px-1.5 py-0 h-4">
                {payments.filter(p => p.status === "pending").length}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Payment Methods Tab */}
        <TabsContent value="methods" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openAdd} className="gap-1.5">
              <Plus className="h-4 w-4" /> নতুন মেথড যোগ করুন
            </Button>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>নাম</TableHead>
                  <TableHead>টাইপ</TableHead>
                  <TableHead>অ্যাকাউন্ট নম্বর</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings?.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.method_name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{s.method_type === "mobile_banking" ? "মোবাইল ব্যাংকিং" : s.method_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{s.account_number || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? "default" : "outline"} className="text-xs">
                        {s.is_active ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMethod(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!settings?.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8 font-bangla">
                      কোনো পেমেন্ট মেথড নেই। উপরের বাটনে ক্লিক করে যোগ করুন।
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history" className="space-y-4 mt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">সকল</SelectItem>
                  <SelectItem value="pending">পেন্ডিং</SelectItem>
                  <SelectItem value="approved">অনুমোদিত</SelectItem>
                  <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          </div>

          <div className="rounded-xl border overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>তারিখ</TableHead>
                  <TableHead>আইটেম</TableHead>
                  <TableHead>টাইপ</TableHead>
                  <TableHead>পরিমাণ</TableHead>
                  <TableHead>মেথড</TableHead>
                  <TableHead>TrxID</TableHead>
                  <TableHead>প্রেরক</TableHead>
                  <TableHead>স্ট্যাটাস</TableHead>
                  <TableHead className="text-right">অ্যাকশন</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPayments ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredPayments?.length ? filteredPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString("bn-BD")}</TableCell>
                    <TableCell className="font-medium text-sm max-w-[150px] truncate">{p.item_title || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{p.item_type}</Badge></TableCell>
                    <TableCell className="font-semibold">৳{p.amount}</TableCell>
                    <TableCell className="text-sm">{p.payment_method}</TableCell>
                    <TableCell className="font-mono text-xs">{p.transaction_id || "—"}</TableCell>
                    <TableCell className="text-sm">{p.sender_number || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColors[p.status] || ""}`}>
                        {p.status === "pending" && <Clock className="h-3 w-3" />}
                        {p.status === "approved" && <CheckCircle2 className="h-3 w-3" />}
                        {p.status === "rejected" && <XCircle className="h-3 w-3" />}
                        {p.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status === "pending" && (
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => updatePaymentStatus(p.id, "approved")}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updatePaymentStatus(p.id, "rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-8 font-bangla">কোনো পেমেন্ট পাওয়া যায়নি</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bangla">{editItem ? "মেথড সম্পাদনা" : "নতুন পেমেন্ট মেথড"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">নাম <span className="text-destructive">*</span></label>
              <Input value={form.method_name} onChange={(e) => setForm(f => ({ ...f, method_name: e.target.value }))} placeholder="যেমন: bKash, Nagad" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">টাইপ</label>
              <Select value={form.method_type} onValueChange={(v) => setForm(f => ({ ...f, method_type: v }))}>
                <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile_banking">মোবাইল ব্যাংকিং</SelectItem>
                  <SelectItem value="bank_transfer">ব্যাংক ট্রান্সফার</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">অ্যাকাউন্ট নম্বর</label>
              <Input value={form.account_number} onChange={(e) => setForm(f => ({ ...f, account_number: e.target.value }))} placeholder="01XXXXXXXXX" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">অ্যাকাউন্ট নাম</label>
              <Input value={form.account_name} onChange={(e) => setForm(f => ({ ...f, account_name: e.target.value }))} placeholder="নাম" className="mt-1 rounded-xl" />
            </div>
            <div>
              <label className="text-sm font-medium">নির্দেশনা</label>
              <Textarea value={form.instructions} onChange={(e) => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Send Money করুন..." rows={3} className="mt-1 rounded-xl resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">সক্রিয়</label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({ ...f, is_active: v }))} />
            </div>
            <div>
              <label className="text-sm font-medium">ক্রম</label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))} className="mt-1 rounded-xl w-24" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>বাতিল</Button>
            <Button onClick={saveMethod} disabled={saving} className="flex-1 rounded-xl font-semibold">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editItem ? "আপডেট করুন" : "যোগ করুন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardPayments;
