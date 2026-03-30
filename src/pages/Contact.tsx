import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteContent } from "@/hooks/useSiteContent";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Send, Mail, Phone, MapPin } from "lucide-react";

type ContactPageData = {
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
};

const Contact = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: pageData, isLoading } = useSiteContent<ContactPageData>("contact_page");
  const pageTitle = pageData?.title || "যোগাযোগ করুন";
  const pageSubtitle = pageData?.subtitle || "আমাদের সাথে যোগাযোগ করতে নিচের ফর্মটি পূরণ করুন";
  const contactEmail = pageData?.email || "support@joblagbe.com";
  const contactPhone = pageData?.phone || "+880 1XXX-XXXXXX";
  const contactAddress = pageData?.address || "ঢাকা, বাংলাদেশ";
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) {
      toast.error("নাম এবং মেসেজ আবশ্যক");
      return;
    }
    if (form.name.length > 100 || form.message.length > 2000 || form.subject.length > 200) {
      toast.error("Input too long");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("contact_submissions").insert({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      subject: form.subject.trim() || null,
      message: form.message.trim(),
      user_id: user?.id || null,
    });
    setLoading(false);

    if (error) {
      toast.error("Failed to send message. Please try again.");
    } else {
      toast.success("আপনার মেসেজ পাঠানো হয়েছে! আমরা শীঘ্রই যোগাযোগ করব।");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-4xl">
        <div className="text-center mb-10">
          {isLoading ? (
            <>
              <Skeleton className="mx-auto h-9 w-56 rounded-lg mb-3" />
              <Skeleton className="mx-auto h-5 w-72 rounded-lg" />
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-foreground mb-2">{pageTitle}</h1>
              <p className="text-muted-foreground">{pageSubtitle}</p>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">ইমেইল</p>
                {isLoading ? <Skeleton className="h-4 w-36 rounded mt-1" /> : <p className="text-sm text-muted-foreground">{contactEmail}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">ফোন</p>
                {isLoading ? <Skeleton className="h-4 w-32 rounded mt-1" /> : <p className="text-sm text-muted-foreground">{contactPhone}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-foreground">ঠিকানা</p>
                {isLoading ? <Skeleton className="h-4 w-28 rounded mt-1" /> : <p className="text-sm text-muted-foreground">{contactAddress}</p>}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border bg-card p-6 shadow-sm">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">নাম *</Label>
                  <Input id="name" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="আপনার নাম" maxLength={100} required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="email">ইমেইল</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} placeholder="your@email.com" maxLength={255} className="mt-1" />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">ফোন</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="01XXX-XXXXXX" maxLength={20} className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="subject">বিষয়</Label>
                  <Input id="subject" value={form.subject} onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="আপনার বিষয়" maxLength={200} className="mt-1" />
                </div>
              </div>
              <div>
                <Label htmlFor="message">মেসেজ *</Label>
                <Textarea id="message" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} placeholder="আপনার মেসেজ লিখুন..." rows={5} maxLength={2000} required className="mt-1" />
              </div>
              <Button type="submit" disabled={loading} className="w-full gap-2">
                <Send className="h-4 w-4" />
                {loading ? "পাঠানো হচ্ছে..." : "মেসেজ পাঠান"}
              </Button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
