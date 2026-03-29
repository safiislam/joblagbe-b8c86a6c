import { Bell, BookOpen, BookMarked, Lightbulb, ArrowRight, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { Skeleton } from "@/components/ui/skeleton";

const iconMap: Record<string, LucideIcon> = { Bell, BookOpen, BookMarked, Lightbulb };

type QuickLinkItem = { title: string; desc: string; icon: string; color: string; href: string };
type QuickLinksData = { title: string; subtitle: string; items: QuickLinkItem[] };

const defaultItems: QuickLinkItem[] = [
  { icon: "Bell", title: "নিয়োগ বিজ্ঞপ্তি", desc: "সরকারি-বেসরকারি সকল নিয়োগ বিজ্ঞপ্তি এক জায়গায়।", color: "bg-primary", href: "/jobs" },
  { icon: "BookOpen", title: "কোর্স সমূহ", desc: "ক্যারিয়ার গড়তে দরকারি অনলাইন কোর্সসমূহ।", color: "bg-accent", href: "/courses" },
  { icon: "BookMarked", title: "ই-বই", desc: "চাকরি প্রস্তুতি ও দক্ষতা বৃদ্ধির ই-বই সংগ্রহ।", color: "bg-success", href: "/ebooks" },
  { icon: "Lightbulb", title: "ক্যারিয়ার টিপস", desc: "ইন্টারভিউ, CV এবং ক্যারিয়ার নিয়ে পরামর্শ।", color: "bg-destructive", href: "/blog" },
];

const QuickLinks = () => {
  const { data, isLoading } = useSiteContent<QuickLinksData>("quick_links");
  const title = data?.title || "আপনার জন্য";
  const subtitle = data?.subtitle || "Resources to accelerate your career";
  const items = data?.items?.length ? data.items : defaultItems;

  return (
    <section className="py-14">
      <div className="container">
        <div className="text-center">
          {isLoading ? (
            <>
              <Skeleton className="mx-auto h-8 w-48 rounded-lg" />
              <Skeleton className="mx-auto mt-2 h-5 w-64 rounded-lg" />
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold md:text-3xl font-bangla">{title}</h2>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </>
          )}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {items.map((item) => {
            const Icon = iconMap[item.icon] || Bell;
            return (
              <Link
                key={item.title}
                to={item.href}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.color} text-primary-foreground transition-transform group-hover:scale-110`}>
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-bold font-bangla leading-tight">{item.title}</h3>
                <p className="text-xs text-muted-foreground font-bangla leading-relaxed hidden sm:block">{item.desc}</p>
                <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  দেখুন <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default QuickLinks;
