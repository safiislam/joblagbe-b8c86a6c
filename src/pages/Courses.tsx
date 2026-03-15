import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BookOpen, Clock, ExternalLink, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentDialog from "@/components/PaymentDialog";

const Courses = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [paymentCourse, setPaymentCourse] = useState<{ id: string; title: string; price: number } | null>(null);

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
    return matchSearch && matchCat && matchPrice;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-bangla">কোর্স সমূহ</h1>
          <p className="mt-2 text-muted-foreground">ক্যারিয়ার গড়তে দরকারি অনলাইন কোর্সসমূহ</p>
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

        <p className="mb-4 text-sm text-muted-foreground">{filtered?.length ?? 0} টি কোর্স পাওয়া গেছে</p>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((course) => (
              <div key={course.id} className="group flex flex-col rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated">
                <div className="flex h-36 items-center justify-center bg-accent/10">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                  ) : (
                    <BookOpen className="h-12 w-12 text-accent/40" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{course.category}</Badge>
                    <Badge variant={course.is_free ? "default" : "outline"} className="text-xs">
                      {course.is_free ? "ফ্রি" : `৳${course.price}`}
                    </Badge>
                  </div>
                  <h3 className="font-bold text-lg font-bangla group-hover:text-primary transition-colors">{course.title}</h3>
                  {course.description && <p className="mt-2 text-sm text-muted-foreground font-bangla line-clamp-2">{course.description}</p>}
                  <div className="mt-auto pt-4 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {course.duration ?? "—"}
                    </span>
                    {course.is_free ? (
                      course.link ? (
                        <Button size="sm" variant="outline" className="gap-1" asChild>
                          <a href={course.link} target="_blank" rel="noopener noreferrer">
                            শুরু করুন <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" disabled>শীঘ্রই আসছে</Button>
                      )
                    ) : (
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => setPaymentCourse({ id: course.id, title: course.title, price: Number(course.discount_price || course.price || 0) })}
                      >
                        <ShoppingCart className="h-3 w-3" /> কিনুন ৳{course.discount_price || course.price}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center py-20 text-muted-foreground">
            <BookOpen className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-lg font-medium font-bangla">কোনো কোর্স পাওয়া যায়নি</p>
          </div>
        )}
      </div>
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
