import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, Phone, MessageSquare, Wallet, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const DashboardSmsOtp = () => {
  const qc = useQueryClient();
  const [searchPhone, setSearchPhone] = useState("");
  const [balanceData, setBalanceData] = useState<{ balance: string; status: string } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { data: otpLogs, isLoading, refetch } = useQuery({
    queryKey: ["admin-otp-logs", searchPhone],
    queryFn: async () => {
      let query = supabase
        .from("phone_otps")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (searchPhone.trim()) {
        query = query.ilike("phone", `%${searchPhone.trim()}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });

  const checkBalance = async () => {
    setBalanceLoading(true);
    try {
      const res = await supabase.functions.invoke("check-sms-balance");
      if (res.error) throw res.error;
      setBalanceData(res.data);
      toast.success("SMS ব্যালেন্স আপডেট হয়েছে");
    } catch (err: any) {
      toast.error("ব্যালেন্স চেক করতে সমস্যা হয়েছে");
      console.error(err);
    } finally {
      setBalanceLoading(false);
    }
  };

  const stats = {
    total: otpLogs?.length ?? 0,
    used: otpLogs?.filter((o) => o.is_used).length ?? 0,
    expired: otpLogs?.filter((o) => !o.is_used && new Date(o.expires_at) < new Date()).length ?? 0,
    active: otpLogs?.filter((o) => !o.is_used && new Date(o.expires_at) >= new Date()).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">SMS & OTP Management</h2>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-1" /> রিফ্রেশ
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">SMS ব্যালেন্স</p>
                <p className="text-lg font-bold">
                  {balanceData ? balanceData.balance : "—"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={checkBalance} disabled={balanceLoading}>
              {balanceLoading ? "চেক হচ্ছে..." : "ব্যালেন্স চেক করুন"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">মোট OTP</p>
                <p className="text-lg font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Phone className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">ব্যবহৃত</p>
                <p className="text-lg font-bold">{stats.used}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <RefreshCw className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">মেয়াদ শেষ</p>
                <p className="text-lg font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="ফোন নম্বর দিয়ে সার্চ করুন..."
          value={searchPhone}
          onChange={(e) => setSearchPhone(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* OTP Logs Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">OTP Logs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">লোড হচ্ছে...</p>
          ) : !otpLogs?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">কোনো OTP লগ পাওয়া যায়নি</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                 <TableHeader>
                  <TableRow>
                    <TableHead>ফোন</TableHead>
                    <TableHead>OTP কোড</TableHead>
                    <TableHead>স্ট্যাটাস</TableHead>
                    <TableHead>মেয়াদ</TableHead>
                    <TableHead>পাঠানো হয়েছে</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otpLogs.map((otp) => {
                    const isExpired = new Date(otp.expires_at) < new Date();
                    return (
                      <TableRow key={otp.id}>
                        <TableCell className="font-mono text-sm">{otp.phone}</TableCell>
                        <TableCell className="font-mono text-sm">{otp.otp_code}</TableCell>
                        <TableCell>
                          {otp.is_used ? (
                            <Badge variant="default" className="bg-green-600 text-xs">ব্যবহৃত</Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive" className="text-xs">মেয়াদ শেষ</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">সক্রিয়</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(otp.expires_at), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(otp.created_at), "dd MMM yyyy, hh:mm a")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="ডিলিট করুন"
                            onClick={async () => {
                              if (!confirm("এই OTP রেকর্ড স্থায়ীভাবে মুছে ফেলতে চান?")) return;
                              const { error } = await supabase.from("phone_otps").delete().eq("id", otp.id);
                              if (error) toast.error(error.message);
                              else { toast.success("মুছে ফেলা হয়েছে"); qc.invalidateQueries({ queryKey: ["admin-otp-logs"] }); }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSmsOtp;
