import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BookMarked, Download, FileText, BookOpen, ShoppingCart, Tablet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaymentDialog from "@/components/PaymentDialog";

type Ebook = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  author: string | null;
  pages: number | null;
  is_free: boolean;
  price: number | null;
  cover_image_url: string | null;
  download_url: string | null;
  created_at: string;
  book_type?: string;
  purchase_link?: string | null;
};

const BookCard = ({ book }: { book: Ebook }) => {
  const isHardcopy = book.book_type === "hardcopy";

  return (
    <div className="group flex flex-col rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div className="relative flex h-44 items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <BookMarked className="h-14 w-14 text-primary/20" />
        )}
        <Badge
          className={`absolute top-3 left-3 text-[10px] font-semibold ${
            isHardcopy
              ? "bg-amber-500/90 text-white border-0"
              : "bg-emerald-500/90 text-white border-0"
          }`}
        >
          {isHardcopy ? "📖 হার্ড কপি" : "📱 ই-বুক"}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="text-xs">{book.category}</Badge>
          <Badge variant={book.is_free ? "default" : "outline"} className="text-xs">
            {book.is_free ? "ফ্রি" : `৳${book.price}`}
          </Badge>
        </div>
        <h3 className="font-bold text-lg font-bangla group-hover:text-primary transition-colors line-clamp-2">
          {book.title}
        </h3>
        {book.description && (
          <p className="mt-2 text-sm text-muted-foreground font-bangla line-clamp-2">{book.description}</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" /> {book.author ?? "—"} {book.pages ? `· ${book.pages} পৃষ্ঠা` : ""}
          </span>
          {isHardcopy ? (
            book.purchase_link ? (
              <Button size="sm" className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white" asChild>
                <a href={book.purchase_link} target="_blank" rel="noopener noreferrer">
                  <ShoppingCart className="h-3.5 w-3.5" /> কিনুন
                </a>
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>শীঘ্রই আসছে</Button>
            )
          ) : book.download_url ? (
            <Button size="sm" variant="outline" className="gap-1.5" asChild>
              <a href={book.download_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-3.5 w-3.5" /> ডাউনলোড
              </a>
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled>শীঘ্রই আসছে</Button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center py-20 text-muted-foreground">
    <BookMarked className="mb-3 h-12 w-12 opacity-30" />
    <p className="text-lg font-medium font-bangla">{message}</p>
  </div>
);

const Ebooks = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");

  const { data: ebooks, isLoading } = useQuery({
    queryKey: ["all-ebooks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ebooks")
        .select("*")
        .order("created_at", { ascending: false });
      return (data as Ebook[] | null) ?? [];
    },
  });

  const categories = [...new Set(ebooks?.map((e) => e.category) ?? [])];

  const filtered = ebooks?.filter((e) => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || e.category === category;
    const matchPrice = priceFilter === "all" || (priceFilter === "free" ? e.is_free : !e.is_free);
    const matchTab =
      activeTab === "all" ||
      (activeTab === "ebook" && (e.book_type === "ebook" || !e.book_type)) ||
      (activeTab === "hardcopy" && e.book_type === "hardcopy");
    return matchSearch && matchCat && matchPrice && matchTab;
  });

  const ebookCount = ebooks?.filter((e) => e.book_type === "ebook" || !e.book_type).length ?? 0;
  const hardcopyCount = ebooks?.filter((e) => e.book_type === "hardcopy").length ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-4">
            <BookOpen className="h-4 w-4" /> বই সমগ্র
          </div>
          <h1 className="text-3xl font-bold font-bangla md:text-4xl">বই সংগ্রহ</h1>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            চাকরি প্রস্তুতি ও দক্ষতা বৃদ্ধির জন্য ই-বুক ও হার্ড কপি বই সংগ্রহ
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 h-12 rounded-xl">
            <TabsTrigger value="all" className="gap-1.5 rounded-lg font-medium">
              <BookOpen className="h-4 w-4" /> সকল ({ebooks?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="ebook" className="gap-1.5 rounded-lg font-medium">
              <Tablet className="h-4 w-4" /> ই-বুক ({ebookCount})
            </TabsTrigger>
            <TabsTrigger value="hardcopy" className="gap-1.5 rounded-lg font-medium">
              <BookMarked className="h-4 w-4" /> হার্ড কপি ({hardcopyCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="বই খুঁজুন..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl">
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
            <SelectTrigger className="w-full sm:w-36 rounded-xl">
              <SelectValue placeholder="মূল্য" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">সকল</SelectItem>
              <SelectItem value="free">ফ্রি</SelectItem>
              <SelectItem value="paid">পেইড</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{filtered?.length ?? 0} টি বই পাওয়া গেছে</p>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered && filtered.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <EmptyState message="কোনো বই পাওয়া যায়নি" />
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Ebooks;
