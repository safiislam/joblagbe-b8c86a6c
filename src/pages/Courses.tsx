import { useEffect, useState } from "react";
import SeoHead from "@/components/SeoHead";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Clock, ExternalLink, ShoppingCart, Eye, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentDialog from "@/components/PaymentDialog";
import { getJobDisplayTag } from "@/lib/jobTag";
import { AffiliateSidebarAd, AffiliateInContentAd, AffiliateCarousel } from "@/components/AffiliateAds";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { requireAuth } from "@/lib/authGuard";
import { recordFreeAccess } from "@/lib/freeAssetAccess";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const Courses = () => {
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [courseType, setCourseType] = useState<"all" | "online" | "offline">("all");
  const [paymentCourse, setPaymentCourse] = useState<{ id: string; title: string; price: number } | null>(null);
  const [detailCourse, setDetailCourse] = useState<any>(null);

  const handleBuyCourse = (course: any) => {
    if (!requireAuth(user, navigate)) return;
    setPaymentCourse({ id: course.id, title: course.title, price: getFinalPrice(course) });
  };

  const handleFreeCourseAccess = async (course: any) => {
    if (!requireAuth(user, navigate)) return;
    await recordFreeAccess(user!.id, "course", course.id, course.title);
    if (course.link) {
      window.open(course.link, "_blank", "noopener,noreferrer");
    }
  };

  const { data: courses, isLoading } = useQuery({
    queryKey: ["all-courses"],
    queryFn: async () => {
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const categories = [...new Set(courses?.map((c) => c.category) ?? [])];

  const filtered = courses?.filter((c) => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || c.category === category;
    const matchPrice = priceFilter === "all" || (priceFilter === "free" ? c.is_free : !c.is_free);
    const matchType = courseType === "all" || (c as any).course_type === courseType;
    return matchSearch && matchCat && matchPrice && matchType;
  });

  const PriceDisplay = ({ course, size = "sm" }: { course: any; size?: "sm" | "lg" }) => {
    if (course.is_free) {
      return <Badge variant="default" className={size === "lg" ? "text-sm px-3 py-1" : "text-xs"}>ফ্রি</Badge>;
    }

    const hasDiscount = course.discount_price && Number(course.discount_price) < Number(course.price);

    return (
      <div className="flex items-center gap-2">
        {hasDiscount ? (
          <>
            <span className={`line-through text-muted-foreground ${size === "lg" ? "text-base" : "text-xs"}`}>৳{course.price}</span>
            <span className={`font-bold text-primary ${size === "lg" ? "text-xl" : "text-sm"}`}>৳{course.discount_price}</span>
            <Badge variant="destructive" className="text-[10px]">
              {Math.round((1 - Number(course.discount_price) / Number(course.price)) * 100)}% ছাড়
            </Badge>
          </>
        ) : (
          <span className={`font-bold ${size === "lg" ? "text-xl" : "text-sm"}`}>৳{course.price}</span>
        )}
      </div>
    );
  };

  const getFinalPrice = (course: any) => course ? Number(course.discount_price || course.price || 0) : 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-bangla">কোর্স সমূহ</h1>
          <p className="mt-2 text-muted-foreground">ক্যারিয়ার গড়তে দরকারি কোর্সসমূহ</p>
          <div className="flex justify-center gap-2 mt-4">
            {(["all", "online", "offline"] as const).map((t) => (
              <Button
                key={t}
                variant={courseType === t ? "default" : "outline"}
                size="sm"
                onClick={() => setCourseType(t)}
                className="font-bangla"
              >
                {t === "all" ? "সকল কোর্স" : t === "online" ? "অনলাইন কোর্স" : "অফলাইন কোর্স"}
              </Button>
            ))}
          </div>
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="কোর্স খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="ক্যাটাগরি" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল ক্যাটাগরি</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priceFilter} onValueChange={setPriceFilter}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="মূল্য" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="free">ফ্রি</SelectItem>
              <SelectItem value="paid">পেইড</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-8">
          <div className="flex-1 min-w-0">
            <p className="mb-4 text-sm text-muted-foreground">{filtered?.length ?? 0} টি কোর্স পাওয়া গেছে</p>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
                ))}
              </div>
            ) : filtered && filtered.length > 0 ? (
              <>
                <div className="grid gap-6 md:grid-cols-2">
                  {filtered.map((course, index) => (
                    <div key={course.id}>
                      <div className="group flex flex-col rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated h-full">
                        <div className="flex h-36 items-center justify-center bg-accent/10 relative">
                          {course.thumbnail_url ? (
                            <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                          ) : (
                            <BookOpen className="h-12 w-12 text-accent/40" />
                          )}
                          {(() => { const dt = getJobDisplayTag(null, course.created_at); return dt ? <Badge className="absolute top-2 right-2 bg-accent/90 text-accent-foreground text-[10px]">{dt}</Badge> : null; })()}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                            <Badge variant={(course as any).course_type === "offline" ? "destructive" : "default"} className="text-[10px]">
                              {(course as any).course_type === "offline" ? "অফলাইন" : "অনলাইন"}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-lg font-bangla group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
                          <div className="mt-2">
                            <PriceDisplay course={course} />
                          </div>
                          <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" /> {course.duration ?? "—"}
                            </span>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setDetailCourse(course)}>
                                <Eye className="h-3 w-3" /> বিস্তারিত
                              </Button>
                              {course.is_free ? (
                                course.link ? (
                                  <Button size="sm" className="gap-1 text-xs" onClick={() => handleFreeCourseAccess(course)}>
                                    শুরু করুন <ExternalLink className="h-3 w-3" />
                                  </Button>
                                ) : null
                              ) : (
                                <Button
                                  size="sm"
                                  className="gap-1 text-xs"
                                  onClick={() => handleBuyCourse(course)}
                                >
                                  <ShoppingCart className="h-3 w-3" /> কিনুন
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      {(index + 1) % 4 === 0 && <div className="mt-4"><AffiliateInContentAd /></div>}
                    </div>
                  ))}
                </div>
                <AffiliateCarousel />
              </>
            ) : (
              <div className="flex flex-col items-center py-20 text-muted-foreground">
                <BookOpen className="mb-3 h-12 w-12 opacity-30" />
                <p className="text-lg font-medium font-bangla">কোনো কোর্স পাওয়া যায়নি</p>
              </div>
            )}
          </div>

          {/* Sidebar Ads */}
          <aside className="hidden lg:block w-72 shrink-0 space-y-6">
            <AffiliateSidebarAd placement="sidebar" />
          </aside>
        </div>
      </div>

      {/* Course Details Dialog */}
      <Dialog open={!!detailCourse} onOpenChange={(open) => { if (!open) setDetailCourse(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-bangla text-xl leading-relaxed">{detailCourse?.title}</DialogTitle>
            <DialogDescription>
              <Badge variant="secondary" className="text-xs">{detailCourse?.category}</Badge>
            </DialogDescription>
          </DialogHeader>

          {detailCourse?.thumbnail_url && (
            <div className="rounded-xl overflow-hidden">
              <img src={detailCourse.thumbnail_url} alt={detailCourse.title} className="w-full h-48 object-cover" />
            </div>
          )}

          <div className="space-y-4">
            {/* Price Section */}
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-xs text-muted-foreground mb-1 font-bangla">মূল্য</p>
              <PriceDisplay course={detailCourse || {}} size="lg" />
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
              {detailCourse?.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-bangla">{detailCourse.duration}</span>
                </div>
              )}
              {detailCourse?.provider && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{detailCourse.provider}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {detailCourse?.description && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 font-bangla">বিবরণ</p>
                <p className="text-sm leading-relaxed font-bangla whitespace-pre-line">{detailCourse.description}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              {detailCourse?.is_free ? (
                detailCourse?.link ? (
                  <Button className="flex-1 gap-1" onClick={() => { setDetailCourse(null); handleFreeCourseAccess(detailCourse); }}>
                    শুরু করুন <ExternalLink className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button className="flex-1" disabled>শীঘ্রই আসছে</Button>
                )
              ) : (
                <Button
                  className="flex-1 gap-1"
                  onClick={() => {
                    setDetailCourse(null);
                    handleBuyCourse(detailCourse);
                  }}
                >
                  <ShoppingCart className="h-4 w-4" /> কিনুন ৳{getFinalPrice(detailCourse)}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentDialog
        open={!!paymentCourse}
        onOpenChange={(open) => { if (!open) setPaymentCourse(null); }}
        itemType="course"
        itemId={paymentCourse?.id}
        itemTitle={paymentCourse?.title || ""}
        amount={paymentCourse?.price || 0}
      />
      <Footer />
    </div>
  );
};

export default Courses;