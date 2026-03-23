import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, BookMarked, Download, ExternalLink, Clock,
  CheckCircle2, XCircle, ShoppingCart, Library, Lock,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type PaymentRow = {
  id: string;
  item_id: string | null;
  item_title: string | null;
  item_type: string;
  amount: number;
  status: string;
  payment_method: string;
  created_at: string;
  admin_note: string | null;
};

const statusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "অপেক্ষমান", color: "bg-warning/15 text-warning border-warning/20", icon: Clock },
  approved: { label: "অনুমোদিত", color: "bg-success/15 text-success border-success/20", icon: CheckCircle2 },
  rejected: { label: "বাতিল", color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle },
};

const MyLibrary = () => {
  const { user } = useAuth();

  // Fetch user's payments
  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["my-library-payments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data as PaymentRow[]) ?? [];
    },
    enabled: !!user,
  });

  // Fetch ebook details for approved payments
  const approvedEbookIds = payments
    ?.filter((p) => p.item_type === "ebook" && p.status === "approved" && p.item_id)
    .map((p) => p.item_id!) ?? [];

  const approvedCourseIds = payments
    ?.filter((p) => p.item_type === "course" && p.status === "approved" && p.item_id)
    .map((p) => p.item_id!) ?? [];

  const { data: ebooks } = useQuery({
    queryKey: ["library-ebooks", approvedEbookIds],
    queryFn: async () => {
      if (approvedEbookIds.length === 0) return [];
      const { data } = await supabase
        .from("ebooks")
        .select("id, title, download_url, cover_image_url, book_type, purchase_link, author")
        .in("id", approvedEbookIds);
      return data ?? [];
    },
    enabled: approvedEbookIds.length > 0,
  });

  const { data: courses } = useQuery({
    queryKey: ["library-courses", approvedCourseIds],
    queryFn: async () => {
      if (approvedCourseIds.length === 0) return [];
      const { data } = await supabase
        .from("courses")
        .select("id, title, link, thumbnail_url, provider")
        .in("id", approvedCourseIds);
      return data ?? [];
    },
    enabled: approvedCourseIds.length > 0,
  });

  const ebookPayments = payments?.filter((p) => p.item_type === "ebook") ?? [];
  const coursePayments = payments?.filter((p) => p.item_type === "course") ?? [];

  const ebookMap = new Map(ebooks?.map((e) => [e.id, e]) ?? []);
  const courseMap = new Map(courses?.map((c) => [c.id, c]) ?? []);

  if (paymentsLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  const hasItems = ebookPayments.length > 0 || coursePayments.length > 0;

  if (!hasItems) {
    return (
      <div className="rounded-2xl border bg-card shadow-card">
        <div className="flex flex-col items-center py-14 text-muted-foreground">
          <Library className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium">আপনার লাইব্রেরি খালি</p>
          <p className="mt-1 text-sm">বই বা কোর্স কিনলে এখানে দেখা যাবে</p>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" asChild>
              <a href="/ebooks">বই দেখুন</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/courses">কোর্স দেখুন</a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const renderItem = (payment: PaymentRow, type: "ebook" | "course") => {
    const cfg = statusMap[payment.status] || statusMap.pending;
    const Icon = cfg.icon;
    const isApproved = payment.status === "approved";

    const ebook = type === "ebook" && payment.item_id ? ebookMap.get(payment.item_id) : null;
    const course = type === "course" && payment.item_id ? courseMap.get(payment.item_id) : null;

    return (
      <div key={payment.id} className="p-4 space-y-2">
        <div className="flex items-start gap-3">
          {/* Thumbnail */}
          <div className="shrink-0 w-14 h-14 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
            {type === "ebook" && ebook?.cover_image_url ? (
              <img src={ebook.cover_image_url} alt="" className="w-full h-full object-cover" />
            ) : type === "course" && course?.thumbnail_url ? (
              <img src={course.thumbnail_url} alt="" className="w-full h-full object-cover" />
            ) : type === "ebook" ? (
              <BookMarked className="h-6 w-6 text-muted-foreground/40" />
            ) : (
              <BookOpen className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm">{payment.item_title || "Unknown"}</h3>
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-1 ${cfg.color}`}>
                <Icon className="h-3 w-3" />
                {cfg.label}
              </Badge>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span>৳{payment.amount}</span>
              <span>{payment.payment_method}</span>
              <span>{formatDistanceToNow(new Date(payment.created_at), { addSuffix: true })}</span>
            </div>

            {/* Access button for approved items */}
            {isApproved && (
              <div className="mt-2 flex flex-wrap gap-2">
                {type === "ebook" && ebook?.download_url && (
                  <Button size="sm" variant="default" className="gap-1.5 text-xs h-7" asChild>
                    <a href={ebook.download_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-3 w-3" /> ডাউনলোড করুন
                    </a>
                  </Button>
                )}
                {type === "ebook" && ebook?.book_type === "hardcopy" && ebook?.purchase_link && (
                  <Button size="sm" className="gap-1.5 text-xs h-7 bg-amber-500 hover:bg-amber-600 text-white" asChild>
                    <a href={ebook.purchase_link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> বই সংগ্রহ করুন
                    </a>
                  </Button>
                )}
                {type === "course" && course?.link && (
                  <Button size="sm" variant="default" className="gap-1.5 text-xs h-7" asChild>
                    <a href={course.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3" /> কোর্স শুরু করুন
                    </a>
                  </Button>
                )}
                {/* Fallback when no specific URL is available */}
                {type === "ebook" && !ebook?.download_url && !(ebook?.book_type === "hardcopy" && ebook?.purchase_link) && (
                  <Badge variant="outline" className="bg-success/15 text-success border-success/20 text-[11px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> অ্যাক্সেস অনুমোদিত
                  </Badge>
                )}
                {type === "course" && !course?.link && (
                  <Badge variant="outline" className="bg-success/15 text-success border-success/20 text-[11px] gap-1">
                    <CheckCircle2 className="h-3 w-3" /> অ্যাক্সেস অনুমোদিত
                  </Badge>
                )}
              </div>
            )}

            {/* Pending message */}
            {payment.status === "pending" && (
              <p className="mt-1.5 text-[11px] text-warning flex items-center gap-1">
                <Lock className="h-3 w-3" /> পেমেন্ট অনুমোদনের পর অ্যাক্সেস পাবেন
              </p>
            )}

            {/* Rejected message */}
            {payment.status === "rejected" && (
              <p className="mt-1.5 text-[11px] text-destructive flex items-center gap-1">
                <XCircle className="h-3 w-3" /> পেমেন্ট বাতিল হয়েছে
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
  };

  return (
    <Tabs defaultValue={ebookPayments.length > 0 ? "ebooks" : "courses"}>
      <TabsList className="w-full grid grid-cols-2 h-10 mb-4">
        <TabsTrigger value="ebooks" className="gap-1.5 text-xs sm:text-sm">
          <BookMarked className="h-3.5 w-3.5" /> বই ({ebookPayments.length})
        </TabsTrigger>
        <TabsTrigger value="courses" className="gap-1.5 text-xs sm:text-sm">
          <BookOpen className="h-3.5 w-3.5" /> কোর্স ({coursePayments.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="ebooks">
        <div className="rounded-2xl border bg-card shadow-card divide-y">
          {ebookPayments.length > 0 ? (
            ebookPayments.map((p) => renderItem(p, "ebook"))
          ) : (
            <div className="flex flex-col items-center py-14 text-muted-foreground">
              <BookMarked className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">কোনো বই কেনা হয়নি</p>
            </div>
          )}
        </div>
      </TabsContent>

      <TabsContent value="courses">
        <div className="rounded-2xl border bg-card shadow-card divide-y">
          {coursePayments.length > 0 ? (
            coursePayments.map((p) => renderItem(p, "course"))
          ) : (
            <div className="flex flex-col items-center py-14 text-muted-foreground">
              <BookOpen className="mb-3 h-10 w-10 opacity-30" />
              <p className="font-medium">কোনো কোর্স কেনা হয়নি</p>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default MyLibrary;
