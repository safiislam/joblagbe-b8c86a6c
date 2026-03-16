import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, BookMarked, Download, FileText, BookOpen, ShoppingCart, Tablet, Eye, X, User, Hash, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PaymentDialog from "@/components/PaymentDialog";
import { getJobDisplayTag } from "@/lib/jobTag";

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

const PriceDisplay = ({ book, size = "sm" }: { book: Ebook; size?: "sm" | "lg" }) => {
  if (book.is_free) {
    return (
      <Badge variant="default" className={size === "lg" ? "text-sm px-3 py-1" : "text-xs"}>
        ফ্রি
      </Badge>
    );
  }

  const price = book.price ?? 0;

  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-primary ${size === "lg" ? "text-2xl" : "text-base"}`}>
        ৳{price}
      </span>
    </div>
  );
};

const BookDetailDialog = ({
  book,
  open,
  onOpenChange,
  onBuy,
}: {
  book: Ebook | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onBuy: (book: Ebook) => void;
}) => {
  if (!book) return null;
  const isHardcopy = book.book_type === "hardcopy";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        {/* Cover Image */}
        <div className="relative h-56 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
          ) : (
            <BookMarked className="h-20 w-20 text-primary/20" />
          )}
          <Badge
            className={`absolute top-4 left-4 ${
              isHardcopy ? "bg-amber-500/90 text-white border-0" : "bg-emerald-500/90 text-white border-0"
            }`}
          >
            {isHardcopy ? "📖 হার্ড কপি" : "📱 ই-বুক"}
          </Badge>
        </div>

        <div className="p-6 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle className="text-xl font-bold font-bangla leading-tight">{book.title}</DialogTitle>
          </DialogHeader>

          {/* Meta info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{book.category}</Badge>
            {(() => {
              const dt = getJobDisplayTag(null, book.created_at);
              return dt ? <Badge className="bg-accent/15 text-accent border-accent/20 text-[10px]">{dt}</Badge> : null;
            })()}
          </div>

          {/* Price section */}
          <div className="rounded-xl bg-muted/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">মূল্য</p>
              <PriceDisplay book={book} size="lg" />
            </div>
            {!book.is_free && (
              <Button onClick={() => onBuy(book)} className="gap-2">
                <ShoppingCart className="h-4 w-4" /> কিনুন
              </Button>
            )}
            {book.is_free && !isHardcopy && book.download_url && (
              <Button className="gap-2" asChild>
                <a href={book.download_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" /> ডাউনলোড
                </a>
              </Button>
            )}
            {book.is_free && isHardcopy && book.purchase_link && (
              <Button className="gap-2 bg-amber-500 hover:bg-amber-600 text-white" asChild>
                <a href={book.purchase_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" /> ফ্রি কপি নিন
                </a>
              </Button>
            )}
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            {book.author && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">লেখক</p>
                  <p className="text-sm font-medium">{book.author}</p>
                </div>
              </div>
            )}
            {book.pages && (
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground">পৃষ্ঠা সংখ্যা</p>
                  <p className="text-sm font-medium">{book.pages} পৃষ্ঠা</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">প্রকাশ</p>
                <p className="text-sm font-medium">{new Date(book.created_at).toLocaleDateString("bn-BD")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border p-3">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">ধরন</p>
                <p className="text-sm font-medium">{isHardcopy ? "হার্ড কপি" : "ই-বুক"}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {book.description && (
            <div>
              <h4 className="font-semibold mb-2">বিবরণ</h4>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{book.description}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const BookCard = ({ book, onBuy, onView }: { book: Ebook; onBuy: (book: Ebook) => void; onView: (book: Ebook) => void }) => {
  const isHardcopy = book.book_type === "hardcopy";

  return (
    <div className="group flex flex-col rounded-2xl border bg-card shadow-card overflow-hidden transition-all hover:-translate-y-1 hover:shadow-elevated">
      <div
        className="relative flex h-44 items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5 cursor-pointer"
        onClick={() => onView(book)}
      >
        {book.cover_image_url ? (
          <img src={book.cover_image_url} alt={book.title} className="h-full w-full object-cover" />
        ) : (
          <BookMarked className="h-14 w-14 text-primary/20" />
        )}
        <Badge
          className={`absolute top-3 left-3 text-[10px] font-semibold ${
            isHardcopy ? "bg-amber-500/90 text-white border-0" : "bg-emerald-500/90 text-white border-0"
          }`}
        >
          {isHardcopy ? "📖 হার্ড কপি" : "📱 ই-বুক"}
        </Badge>
        {/* View overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <span className="bg-white/90 text-foreground rounded-full px-3 py-1.5 text-xs font-medium flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> বিস্তারিত দেখুন
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">{book.category}</Badge>
          <PriceDisplay book={book} />
          {(() => {
            const dt = getJobDisplayTag(null, book.created_at);
            return dt ? <Badge className="bg-accent/15 text-accent border-accent/20 text-[10px]">{dt}</Badge> : null;
          })()}
        </div>
        <h3
          className="font-bold text-lg font-bangla group-hover:text-primary transition-colors line-clamp-2 cursor-pointer"
          onClick={() => onView(book)}
        >
          {book.title}
        </h3>
        {book.description && (
          <p className="mt-2 text-sm text-muted-foreground font-bangla line-clamp-2">{book.description}</p>
        )}
        <div className="mt-auto pt-4 flex items-center justify-between">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3" /> {book.author ?? "—"} {book.pages ? `· ${book.pages} পৃষ্ঠা` : ""}
          </span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => onView(book)}>
              <Eye className="h-3.5 w-3.5" /> বিস্তারিত
            </Button>
            {book.is_free ? (
              isHardcopy ? (
                book.purchase_link ? (
                  <Button size="sm" className="gap-1 bg-amber-500 hover:bg-amber-600 text-white text-xs" asChild>
                    <a href={book.purchase_link} target="_blank" rel="noopener noreferrer">
                      <ShoppingCart className="h-3.5 w-3.5" /> ফ্রি কপি
                    </a>
                  </Button>
                ) : null
              ) : book.download_url ? (
                <Button size="sm" variant="default" className="gap-1 text-xs" asChild>
                  <a href={book.download_url} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3.5 w-3.5" /> ডাউনলোড
                  </a>
                </Button>
              ) : null
            ) : (
              <Button size="sm" className="gap-1 text-xs" onClick={() => onBuy(book)}>
                <ShoppingCart className="h-3.5 w-3.5" /> ৳{book.price}
              </Button>
            )}
          </div>
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
  useEffect(() => { window.scrollTo(0, 0); }, []);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [paymentBook, setPaymentBook] = useState<{ id: string; title: string; price: number } | null>(null);
  const [viewBook, setViewBook] = useState<Ebook | null>(null);

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
              <BookCard
                key={book.id}
                book={book}
                onBuy={(b) => setPaymentBook({ id: b.id, title: b.title, price: Number(b.price || 0) })}
                onView={(b) => setViewBook(b)}
              />
            ))}
          </div>
        ) : (
          <EmptyState message="কোনো বই পাওয়া যায়নি" />
        )}
      </div>

      {/* Book Detail Dialog */}
      <BookDetailDialog
        book={viewBook}
        open={!!viewBook}
        onOpenChange={(open) => { if (!open) setViewBook(null); }}
        onBuy={(b) => {
          setViewBook(null);
          setPaymentBook({ id: b.id, title: b.title, price: Number(b.price || 0) });
        }}
      />

      <PaymentDialog
        open={!!paymentBook}
        onOpenChange={(open) => { if (!open) setPaymentBook(null); }}
        itemType="ebook"
        itemId={paymentBook?.id}
        itemTitle={paymentBook?.title || ""}
        amount={paymentBook?.price || 0}
      />
      <Footer />
    </div>
  );
};

export default Ebooks;
