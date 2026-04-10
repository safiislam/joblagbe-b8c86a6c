import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateSiteContent } from "@/hooks/useSiteContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Plus, Trash2, Eye, Upload, Image } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SectionData = { section_key: string; content: Record<string, any> };

const DashboardSiteContent = () => {
  const { data: sections, isLoading } = useQuery({
    queryKey: ["site-content-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("site_content").select("section_key, content").order("section_key");
      return (data ?? []) as SectionData[];
    },
  });

  const updateMutation = useUpdateSiteContent();
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState("announcement");

  useEffect(() => {
    if (sections) {
      const map: Record<string, any> = {};
      sections.forEach((s) => { map[s.section_key] = JSON.parse(JSON.stringify(s.content)); });
      setEditData(map);
    }
  }, [sections]);

  const save = async (key: string) => {
    try {
      await updateMutation.mutateAsync({ sectionKey: key, content: editData[key] });
      toast.success(`"${key}" section updated!`);
    } catch {
      toast.error("Failed to save");
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const updateNestedField = (section: string, arrayField: string, index: number, field: string, value: any) => {
    setEditData((prev) => {
      const items = [...(prev[section]?.[arrayField] || [])];
      items[index] = { ...items[index], [field]: value };
      return { ...prev, [section]: { ...prev[section], [arrayField]: items } };
    });
  };

  const addArrayItem = (section: string, arrayField: string, template: Record<string, any>) => {
    setEditData((prev) => {
      const items = [...(prev[section]?.[arrayField] || []), template];
      return { ...prev, [section]: { ...prev[section], [arrayField]: items } };
    });
  };

  const removeArrayItem = (section: string, arrayField: string, index: number) => {
    setEditData((prev) => {
      const items = [...(prev[section]?.[arrayField] || [])];
      items.splice(index, 1);
      return { ...prev, [section]: { ...prev[section], [arrayField]: items } };
    });
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading...</div>;

  const SaveBtn = ({ sectionKey }: { sectionKey: string }) => (
    <Button onClick={() => save(sectionKey)} disabled={updateMutation.isPending} className="gap-2">
      <Save className="h-4 w-4" /> Save Changes
    </Button>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Site Content</h1>
        <a href="/" target="_blank" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Eye className="h-4 w-4" /> Preview Site
        </a>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="announcement">📢 Announcement</TabsTrigger>
          <TabsTrigger value="hero">🏠 Hero</TabsTrigger>
          
          <TabsTrigger value="category_section">📂 Categories</TabsTrigger>
          <TabsTrigger value="quick_links">🔗 Quick Links</TabsTrigger>
          <TabsTrigger value="services">🛠️ Services</TabsTrigger>
          <TabsTrigger value="employer_cta">💼 Employer CTA</TabsTrigger>
          <TabsTrigger value="footer">📋 Footer</TabsTrigger>
          <TabsTrigger value="install_page">📲 Install Page</TabsTrigger>
          <TabsTrigger value="pwa_settings">⚙️ PWA Settings</TabsTrigger>
          <TabsTrigger value="tutorial_videos">🎥 Tutorial Videos</TabsTrigger>
          <TabsTrigger value="contact_page">📩 Contact Page</TabsTrigger>
          <TabsTrigger value="job_posting_pricing">💰 Job Post Pricing</TabsTrigger>
        </TabsList>

        {/* Announcement */}
        <TabsContent value="announcement" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={editData.announcement?.enabled || false}
                onCheckedChange={(v) => updateField("announcement", "enabled", v)}
              />
              <Label>Enable Announcement Banner</Label>
            </div>
            <div>
              <Label>Banner Type</Label>
              <Select
                value={editData.announcement?.type || "info"}
                onValueChange={(v) => updateField("announcement", "type", v)}
              >
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">ℹ️ Info</SelectItem>
                  <SelectItem value="warning">⚠️ Warning</SelectItem>
                  <SelectItem value="promo">📣 Promo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                className="mt-1"
                value={editData.announcement?.message || ""}
                onChange={(e) => updateField("announcement", "message", e.target.value)}
                placeholder="Write your announcement here..."
              />
            </div>
            <SaveBtn sectionKey="announcement" />
          </div>
        </TabsContent>

        {/* Hero */}
        <TabsContent value="hero" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Badge Text</Label>
              <Input className="mt-1" value={editData.hero?.badge || ""} onChange={(e) => updateField("hero", "badge", e.target.value)} />
            </div>
            <div>
              <Label>Title Line 1</Label>
              <Input className="mt-1" value={editData.hero?.title_line1 || ""} onChange={(e) => updateField("hero", "title_line1", e.target.value)} />
            </div>
            <div>
              <Label>Title Highlight (gradient text)</Label>
              <Input className="mt-1" value={editData.hero?.title_highlight || ""} onChange={(e) => updateField("hero", "title_highlight", e.target.value)} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea className="mt-1" value={editData.hero?.subtitle || ""} onChange={(e) => updateField("hero", "subtitle", e.target.value)} />
            </div>
            <div>
              <Label>Popular Tags (comma-separated)</Label>
              <Input
                className="mt-1"
                value={(editData.hero?.popular_tags || []).join(", ")}
                onChange={(e) => updateField("hero", "popular_tags", e.target.value.split(",").map((t: string) => t.trim()).filter(Boolean))}
              />
            </div>
            <SaveBtn sectionKey="hero" />
          </div>
        </TabsContent>


        {/* Category Section */}
        <TabsContent value="category_section" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input className="mt-1" value={editData.category_section?.title || ""} onChange={(e) => updateField("category_section", "title", e.target.value)} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input className="mt-1" value={editData.category_section?.subtitle || ""} onChange={(e) => updateField("category_section", "subtitle", e.target.value)} />
            </div>
            <SaveBtn sectionKey="category_section" />
          </div>
        </TabsContent>

        {/* Quick Links */}
        <TabsContent value="quick_links" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input className="mt-1" value={editData.quick_links?.title || ""} onChange={(e) => updateField("quick_links", "title", e.target.value)} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input className="mt-1" value={editData.quick_links?.subtitle || ""} onChange={(e) => updateField("quick_links", "subtitle", e.target.value)} />
            </div>
            <h3 className="font-semibold text-sm pt-2">Items</h3>
            {(editData.quick_links?.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Item {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeArrayItem("quick_links", "items", i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <Input placeholder="Title" value={item.title || ""} onChange={(e) => updateNestedField("quick_links", "items", i, "title", e.target.value)} />
                <Input placeholder="Description" value={item.desc || ""} onChange={(e) => updateNestedField("quick_links", "items", i, "desc", e.target.value)} />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Icon (e.g. Bell)" value={item.icon || ""} onChange={(e) => updateNestedField("quick_links", "items", i, "icon", e.target.value)} />
                  <Input placeholder="Link (e.g. /jobs)" value={item.href || ""} onChange={(e) => updateNestedField("quick_links", "items", i, "href", e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addArrayItem("quick_links", "items", { title: "", desc: "", icon: "Bell", color: "bg-primary", href: "/" })}>
              <Plus className="h-3 w-3" /> Add Item
            </Button>
            <SaveBtn sectionKey="quick_links" />
          </div>
        </TabsContent>

        {/* Services */}
        <TabsContent value="services" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Section Title</Label>
              <Input className="mt-1" value={editData.services?.title || ""} onChange={(e) => updateField("services", "title", e.target.value)} />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input className="mt-1" value={editData.services?.subtitle || ""} onChange={(e) => updateField("services", "subtitle", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Order Dialog Title</Label>
                <Input className="mt-1" placeholder="সেবা অর্ডার করুন" value={editData.services?.orderDialogTitle || ""} onChange={(e) => updateField("services", "orderDialogTitle", e.target.value)} />
              </div>
              <div>
                <Label>Order Submit Button Text</Label>
                <Input className="mt-1" placeholder="অর্ডার জমা দিন" value={editData.services?.orderSubmitText || ""} onChange={(e) => updateField("services", "orderSubmitText", e.target.value)} />
              </div>
            </div>
            <h3 className="font-semibold text-sm pt-2">Service Cards</h3>
            {(editData.services?.items || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Service {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeArrayItem("services", "items", i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <Input placeholder="Title" value={item.title || ""} onChange={(e) => updateNestedField("services", "items", i, "title", e.target.value)} />
                <Textarea placeholder="Description" value={item.desc || ""} onChange={(e) => updateNestedField("services", "items", i, "desc", e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Icon (e.g. ScrollText)" value={item.icon || ""} onChange={(e) => updateNestedField("services", "items", i, "icon", e.target.value)} />
                  <Input placeholder="Cost" value={item.cost || ""} onChange={(e) => updateNestedField("services", "items", i, "cost", e.target.value)} />
                  <Input placeholder="Button Text (e.g. Order Now)" value={item.cta || ""} onChange={(e) => updateNestedField("services", "items", i, "cta", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Features (comma-separated)</Label>
                  <Textarea
                    className="mt-1"
                    placeholder="Feature 1, Feature 2, ..."
                    value={(item.features || []).join(", ")}
                    onChange={(e) => updateNestedField("services", "items", i, "features", e.target.value.split(",").map((f: string) => f.trim()).filter(Boolean))}
                  />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addArrayItem("services", "items", { title: "", desc: "", icon: "FileText", features: [], cost: "" })}>
              <Plus className="h-3 w-3" /> Add Service
            </Button>
            <SaveBtn sectionKey="services" />
          </div>
        </TabsContent>

        {/* Employer CTA */}
        <TabsContent value="employer_cta" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Badge Text</Label>
              <Input className="mt-1" value={editData.employer_cta?.badge || ""} onChange={(e) => updateField("employer_cta", "badge", e.target.value)} />
            </div>
            <div>
              <Label>Title</Label>
              <Input className="mt-1" value={editData.employer_cta?.title || ""} onChange={(e) => updateField("employer_cta", "title", e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" value={editData.employer_cta?.description || ""} onChange={(e) => updateField("employer_cta", "description", e.target.value)} />
            </div>
            <div>
              <Label>Button Text</Label>
              <Input className="mt-1" value={editData.employer_cta?.button_text || ""} onChange={(e) => updateField("employer_cta", "button_text", e.target.value)} />
            </div>
            <h3 className="font-semibold text-sm pt-2">Feature Cards</h3>
            {(editData.employer_cta?.features || []).map((f: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <Input placeholder="Title" value={f.title || ""} onChange={(e) => updateNestedField("employer_cta", "features", i, "title", e.target.value)} />
                <Input placeholder="Description" value={f.desc || ""} onChange={(e) => updateNestedField("employer_cta", "features", i, "desc", e.target.value)} />
                <Input placeholder="Icon (e.g. Building2)" value={f.icon || ""} onChange={(e) => updateNestedField("employer_cta", "features", i, "icon", e.target.value)} />
              </div>
            ))}
            <SaveBtn sectionKey="employer_cta" />
          </div>
        </TabsContent>

        {/* Footer */}
        <TabsContent value="footer" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" value={editData.footer?.description || ""} onChange={(e) => updateField("footer", "description", e.target.value)} />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input className="mt-1" value={editData.footer?.contact_email || ""} onChange={(e) => updateField("footer", "contact_email", e.target.value)} />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input className="mt-1" value={editData.footer?.contact_phone || ""} onChange={(e) => updateField("footer", "contact_phone", e.target.value)} />
            </div>

            {/* Dynamic Social Links */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Social Links</Label>
                <Button size="sm" variant="outline" onClick={() => addArrayItem("footer", "custom_social_links", { platform: "whatsapp", url: "", label: "" })}>
                  <Plus className="h-4 w-4 mr-1" /> Add Link
                </Button>
              </div>
              {(editData.footer?.custom_social_links || []).map((link: any, idx: number) => (
                <div key={idx} className="flex items-end gap-2 rounded-lg border p-3">
                  <div className="w-36">
                    <Label className="text-xs">Platform</Label>
                    <Select value={link.platform || "website"} onValueChange={(v) => updateNestedField("footer", "custom_social_links", idx, "platform", v)}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter / X</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs">URL / Number</Label>
                    <Input className="mt-1" placeholder={link.platform === "whatsapp" ? "+880XXXXXXXXX or https://wa.me/..." : "https://..."} value={link.url || ""} onChange={(e) => updateNestedField("footer", "custom_social_links", idx, "url", e.target.value)} />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Label</Label>
                    <Input className="mt-1" placeholder="Optional" value={link.label || ""} onChange={(e) => updateNestedField("footer", "custom_social_links", idx, "label", e.target.value)} />
                  </div>
                  <Button size="icon" variant="ghost" className="text-destructive shrink-0" onClick={() => removeArrayItem("footer", "custom_social_links", idx)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {!(editData.footer?.custom_social_links?.length) && (
                <p className="text-sm text-muted-foreground">No custom social links yet. Click "Add Link" to add WhatsApp, Instagram, etc.</p>
              )}
            </div>

            <SaveBtn sectionKey="footer" />
          </div>
        </TabsContent>

        {/* Install Page Content */}
        <TabsContent value="install_page" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground">Install পেজে দেখানো কন্টেন্ট কাস্টমাইজ করুন</p>
            <div>
              <Label>Page Title</Label>
              <Input className="mt-1" value={editData.install_page?.title || ""} onChange={(e) => updateField("install_page", "title", e.target.value)} placeholder="অ্যাপ ইনস্টল করুন" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Textarea className="mt-1" value={editData.install_page?.subtitle || ""} onChange={(e) => updateField("install_page", "subtitle", e.target.value)} placeholder="Job লাগবে অ্যাপ আপনার ফোনে ইনস্টল করুন..." />
            </div>
            <div>
              <Label>Installed Message</Label>
              <Input className="mt-1" value={editData.install_page?.installed_title || ""} onChange={(e) => updateField("install_page", "installed_title", e.target.value)} placeholder="অ্যাপ ইতিমধ্যে ইনস্টল হয়েছে! 🎉" />
            </div>
            <div>
              <Label>Installed Description</Label>
              <Textarea className="mt-1" value={editData.install_page?.installed_desc || ""} onChange={(e) => updateField("install_page", "installed_desc", e.target.value)} placeholder="আপনি হোম স্ক্রিন থেকে Job লাগবে অ্যাপ ওপেন করতে পারবেন।" />
            </div>
            <div>
              <Label>Install Button Text</Label>
              <Input className="mt-1" value={editData.install_page?.install_btn || ""} onChange={(e) => updateField("install_page", "install_btn", e.target.value)} placeholder="এখনই ইনস্টল করুন" />
            </div>

            <h3 className="font-semibold text-sm pt-2">Benefits List</h3>
            {(editData.install_page?.benefits || []).map((b: string, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={b} onChange={(e) => {
                  const items = [...(editData.install_page?.benefits || [])];
                  items[i] = e.target.value;
                  updateField("install_page", "benefits", items);
                }} />
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => {
                  const items = [...(editData.install_page?.benefits || [])];
                  items.splice(i, 1);
                  updateField("install_page", "benefits", items);
                }}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
              const items = [...(editData.install_page?.benefits || []), ""];
              updateField("install_page", "benefits", items);
            }}>
              <Plus className="h-3 w-3" /> Add Benefit
            </Button>
            <SaveBtn sectionKey="install_page" />
          </div>
        </TabsContent>

        {/* PWA Settings */}
        <TabsContent value="pwa_settings" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground">App ব্র্যান্ডিং, লোগো ও PWA manifest সেটিংস</p>
            
            {/* Logo Upload */}
            <div>
              <Label>App Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                {editData.pwa_settings?.logo_url ? (
                  <img src={editData.pwa_settings.logo_url} alt="Logo" className="h-14 w-14 rounded-lg border object-contain bg-white p-1" />
                ) : (
                  <div className="h-14 w-14 rounded-lg border bg-muted flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/png,image/jpeg,image/webp,image/svg+xml";
                      input.onchange = async (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (!file) return;
                        if (file.size > 300 * 1024) {
                          toast.error("Logo must be under 300KB");
                          return;
                        }
                        const ext = file.name.split(".").pop() || "png";
                        const path = `logo.${ext}`;
                        const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
                        if (error) {
                          toast.error("Upload failed: " + error.message);
                          return;
                        }
                        const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(path);
                        const logoUrl = urlData.publicUrl + "?t=" + Date.now();
                        updateField("pwa_settings", "logo_url", logoUrl);
                        toast.success("Logo uploaded! Click Save to apply.");
                      };
                      input.click();
                    }}
                  >
                    <Upload className="h-3 w-3" /> Upload Logo
                  </Button>
                  <span className="text-[10px] text-muted-foreground">PNG, JPG, WebP, SVG — Max 300KB</span>
                </div>
              </div>
            </div>

            <div>
              <Label>App Name</Label>
              <Input className="mt-1" value={editData.pwa_settings?.app_name || ""} onChange={(e) => updateField("pwa_settings", "app_name", e.target.value)} placeholder="Job লাগবে - চাকরি খুঁজুন" />
            </div>
            <div>
              <Label>Short Name</Label>
              <Input className="mt-1" value={editData.pwa_settings?.short_name || ""} onChange={(e) => updateField("pwa_settings", "short_name", e.target.value)} placeholder="Job লাগবে" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea className="mt-1" value={editData.pwa_settings?.description || ""} onChange={(e) => updateField("pwa_settings", "description", e.target.value)} placeholder="বাংলাদেশের বিশ্বস্ত চাকরির পোর্টাল..." />
            </div>
            <div>
              <Label>Theme Color (hex)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={editData.pwa_settings?.theme_color || "#1d4ed8"} onChange={(e) => updateField("pwa_settings", "theme_color", e.target.value)} placeholder="#1d4ed8" />
                <div className="h-9 w-9 rounded-md border shrink-0" style={{ backgroundColor: editData.pwa_settings?.theme_color || "#1d4ed8" }} />
              </div>
            </div>
            <div>
              <Label>Background Color (hex)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={editData.pwa_settings?.bg_color || "#ffffff"} onChange={(e) => updateField("pwa_settings", "bg_color", e.target.value)} placeholder="#ffffff" />
                <div className="h-9 w-9 rounded-md border shrink-0" style={{ backgroundColor: editData.pwa_settings?.bg_color || "#ffffff" }} />
              </div>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              ⚠️ Logo ও App Name পরিবর্তন সাইটে সাথে সাথে প্রতিফলিত হবে। PWA manifest সেটিংস কার্যকর হতে রিবিল্ড ও রিপাবলিশ করতে হবে।
            </div>
            <SaveBtn sectionKey="pwa_settings" />
          </div>
        </TabsContent>

        {/* Tutorial Videos */}
        <TabsContent value="tutorial_videos" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground">
              প্রতিটি পেজের জন্য টিউটোরিয়াল ভিডিও লিংক সেট করুন। ইউজাররা পেজে একটি হেল্প বাটন দেখবে যেখান থেকে ভিডিও দেখতে পারবে।
            </p>
            <h3 className="font-semibold text-sm">Page Videos</h3>
            {(editData.tutorial_videos?.videos || []).map((item: any, i: number) => (
              <div key={i} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">Video {i + 1}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeArrayItem("tutorial_videos", "videos", i)}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Page Key</Label>
                    <Select
                      value={item.page_key || ""}
                      onValueChange={(v) => updateNestedField("tutorial_videos", "videos", i, "page_key", v)}
                    >
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select page" /></SelectTrigger>
                      <SelectContent>
                        {[
                          { key: "home", label: "🏠 Home" },
                          { key: "jobs", label: "💼 Jobs" },
                          { key: "blog", label: "📝 Blog" },
                          { key: "courses", label: "🎓 Courses" },
                          { key: "ebooks", label: "📚 E-Books" },
                          { key: "companies", label: "🏢 Companies" },
                          { key: "login", label: "🔑 Login" },
                          { key: "signup", label: "📋 Sign Up" },
                          { key: "post-job", label: "📤 Post Job" },
                          { key: "my-applications", label: "📄 My Applications" },
                          { key: "employer-dashboard", label: "💼 Employer Dashboard" },
                        ].map((p) => (
                          <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Page Label (shown to user)</Label>
                    <Input className="mt-1" placeholder="e.g. হোম পেজ টিউটোরিয়াল" value={item.page_label || ""} onChange={(e) => updateNestedField("tutorial_videos", "videos", i, "page_label", e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Video URL (YouTube / Facebook / Direct)</Label>
                  <Input className="mt-1" placeholder="https://www.youtube.com/watch?v=..." value={item.video_url || ""} onChange={(e) => updateNestedField("tutorial_videos", "videos", i, "video_url", e.target.value)} />
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addArrayItem("tutorial_videos", "videos", { page_key: "", page_label: "", video_url: "" })}>
              <Plus className="h-3 w-3" /> Add Video
            </Button>
            <SaveBtn sectionKey="tutorial_videos" />
          </div>
        </TabsContent>

        {/* Contact Page */}
        <TabsContent value="contact_page" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground">যোগাযোগ পেজের কন্টেন্ট এডিট করুন</p>
            <div>
              <Label>Page Title</Label>
              <Input className="mt-1" value={editData.contact_page?.title || ""} onChange={(e) => updateField("contact_page", "title", e.target.value)} placeholder="যোগাযোগ করুন" />
            </div>
            <div>
              <Label>Subtitle</Label>
              <Input className="mt-1" value={editData.contact_page?.subtitle || ""} onChange={(e) => updateField("contact_page", "subtitle", e.target.value)} placeholder="আমাদের সাথে যোগাযোগ করতে নিচের ফর্মটি পূরণ করুন" />
            </div>
            <div>
              <Label>Email</Label>
              <Input className="mt-1" value={editData.contact_page?.email || ""} onChange={(e) => updateField("contact_page", "email", e.target.value)} placeholder="support@joblagbe.com" />
            </div>
            <div>
              <Label>Phone</Label>
              <Input className="mt-1" value={editData.contact_page?.phone || ""} onChange={(e) => updateField("contact_page", "phone", e.target.value)} placeholder="+880 1XXX-XXXXXX" />
            </div>
            <div>
              <Label>Address</Label>
              <Input className="mt-1" value={editData.contact_page?.address || ""} onChange={(e) => updateField("contact_page", "address", e.target.value)} placeholder="ঢাকা, বাংলাদেশ" />
            </div>
            <SaveBtn sectionKey="contact_page" />
          </div>
        </TabsContent>

        {/* Job Posting Pricing */}
        <TabsContent value="job_posting_pricing" className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs text-muted-foreground">চাকরি পোস্ট করার জন্য মূল্য, অফার এবং ফ্রি সিস্টেম নিয়ন্ত্রণ করুন</p>
            <div className="flex items-center gap-3">
              <Switch
                checked={editData.job_posting_pricing?.is_free || false}
                onCheckedChange={(v) => updateField("job_posting_pricing", "is_free", v)}
              />
              <Label>ফ্রি জব পোস্ট (পেমেন্ট ছাড়াই পোস্ট করতে পারবে)</Label>
            </div>
            <div>
              <Label>মূল মূল্য (৳)</Label>
              <Input
                type="number"
                className="mt-1"
                value={editData.job_posting_pricing?.price || ""}
                onChange={(e) => updateField("job_posting_pricing", "price", Number(e.target.value))}
                placeholder="500"
              />
              <p className="text-xs text-muted-foreground mt-1">ফ্রি থাকলেও এই মূল্য দেখানো হবে (কাটা দামে)</p>
            </div>
            <div>
              <Label>অফার মূল্য (৳)</Label>
              <Input
                type="number"
                className="mt-1"
                value={editData.job_posting_pricing?.offer_price ?? ""}
                onChange={(e) => updateField("job_posting_pricing", "offer_price", Number(e.target.value))}
                placeholder="200"
              />
              <p className="text-xs text-muted-foreground mt-1">০ রাখলে অফার দেখাবে না। ফ্রি না হলে এই মূল্যে পেমেন্ট নিবে।</p>
            </div>
            <div>
              <Label>অফার লেবেল</Label>
              <Input
                className="mt-1"
                value={editData.job_posting_pricing?.offer_label || ""}
                onChange={(e) => updateField("job_posting_pricing", "offer_label", e.target.value)}
                placeholder="🎉 বিশেষ অফার!"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={editData.job_posting_pricing?.show_original_price ?? true}
                onCheckedChange={(v) => updateField("job_posting_pricing", "show_original_price", v)}
              />
              <Label>মূল মূল্য দেখাও (কাটা দামে)</Label>
            </div>
            <SaveBtn sectionKey="job_posting_pricing" />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardSiteContent;
