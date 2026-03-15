import { FileText, Megaphone, ScrollText, Check, Loader2, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import PaymentDialog from "@/components/PaymentDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const iconMap: Record<string, LucideIcon> = { ScrollText, FileText, Megaphone };

type ServiceItem = { title: string; desc: string; icon: string; features: string[]; cost: string };
type ServicesData = { title: string; subtitle: string; items: ServiceItem[] };

const colorCycle = [
  { color: "bg-primary/10 text-primary", border: "border-primary/20" },
  { color: "bg-accent/10 text-accent", border: "border-accent/20" },
  { color: "bg-success/10 text-success", border: "border-success/20" },
];

const ServicesSection = () => {
  const { data } = useSiteContent<ServicesData>("services");
  const { user, profile } = useAuth();
  const [orderService, setOrderService] = useState<ServiceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", details: "" });
  const [paymentItem, setPaymentItem] = useState<{ title: string; amount: number; orderId?: string } | null>(null);

  const title = data?.title || "আমাদের সেবাসমূহ";
  const subtitle = data?.subtitle || "Services that help you succeed";
  const items = data?.items || [];

  const openOrder = (service: ServiceItem) => {
    setFormData({
      name: profile?.full_name || "",
      email: user?.email || "",
      phone: profile?.phone || "",
      details: "",
    });
    setOrderService(service);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { toast.error("নাম লিখুন"); return; }
    if (!formData.phone.trim() && !formData.email.trim()) { toast.error("ফোন বা ইমেইল দিন"); return; }

    setSubmitting(true);
    try {
      const { error, data: inserted } = await supabase.from("service_orders").insert({
        service_type: orderService?.title || "",
        name: formData.name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        details: formData.details.trim() || null,
        user_id: user?.id || null,
      }).select("id").single();
      if (error) throw error;
      
      // Parse cost to number
      const costStr = orderService?.cost || "";
      const amount = parseInt(costStr.replace(/[^\d]/g, "")) || 0;
      
      if (amount > 0) {
        // Open payment dialog
        setPaymentItem({
          title: orderService?.title || "",
          amount,
          orderId: inserted?.id,
        });
      } else {
        toast.success("অর্ডার সফলভাবে জমা হয়েছে! আমরা শীঘ্রই যোগাযোগ করবো।");
      }
      setOrderService(null);
    } catch (err: any) {
      toast.error(err.message || "অর্ডার জমা দিতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((s, i) => {
            const Icon = iconMap[s.icon] || FileText;
            const style = colorCycle[i % colorCycle.length];
            return (
              <div key={s.title || i} className={`rounded-xl border ${style.border} bg-card p-5 flex flex-col justify-between transition-shadow hover:shadow-elevated`}>
                <div>
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold font-bangla">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-bangla">{s.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {(s.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground font-bangla">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold font-bangla">{s.cost}</span>
                  <Button size="sm" className="text-xs h-8" onClick={() => openOrder(s)}>
                    Order Now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Dialog */}
      <Dialog open={!!orderService} onOpenChange={(open) => { if (!open) setOrderService(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bangla">সেবা অর্ডার করুন</DialogTitle>
            <DialogDescription>
              <span className="font-medium text-foreground">{orderService?.title}</span>
              {orderService?.cost && <span className="text-muted-foreground"> — {orderService.cost}</span>}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">নাম <span className="text-destructive">*</span></label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="আপনার নাম"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ইমেইল</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="example@email.com"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">ফোন</label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                placeholder="01XXXXXXXXX"
                className="mt-1 rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium">বিস্তারিত (ঐচ্ছিক)</label>
              <Textarea
                value={formData.details}
                onChange={(e) => setFormData((p) => ({ ...p, details: e.target.value }))}
                placeholder="আপনার প্রয়োজন সম্পর্কে লিখুন..."
                rows={3}
                className="mt-1 rounded-xl resize-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="rounded-xl" onClick={() => setOrderService(null)}>
              বাতিল
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-xl font-semibold"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "অর্ডার জমা দিন"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <PaymentDialog
        open={!!paymentItem}
        onOpenChange={(open) => { if (!open) setPaymentItem(null); }}
        itemType="service"
        itemId={paymentItem?.orderId}
        itemTitle={paymentItem?.title || ""}
        amount={paymentItem?.amount || 0}
      />
    </section>
  );
};

export default ServicesSection;
