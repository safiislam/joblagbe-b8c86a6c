import { Bell, BookOpen, BookMarked, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const links = [
  {
    icon: Bell,
    title: "নিয়োগ বিজ্ঞপ্তি",
    desc: "সরকারি-বেসরকারি সকল নিয়োগ বিজ্ঞপ্তি এক জায়গায়।",
    color: "bg-primary",
    href: "/jobs",
  },
  {
    icon: BookOpen,
    title: "কোর্স সমূহ",
    desc: "ক্যারিয়ার গড়তে দরকারি অনলাইন কোর্সসমূহ।",
    color: "bg-accent",
    href: "/courses",
  },
  {
    icon: BookMarked,
    title: "ই-বই",
    desc: "চাকরি প্রস্তুতি ও দক্ষতা বৃদ্ধির ই-বই সংগ্রহ।",
    color: "bg-success",
    href: "/ebooks",
  },
  {
    icon: Lightbulb,
    title: "ক্যারিয়ার টিপস",
    desc: "ইন্টারভিউ, CV এবং ক্যারিয়ার নিয়ে পরামর্শ।",
    color: "bg-destructive",
    href: "/blog",
  },
];

const QuickLinks = () => {
  return (
    <section className="py-14">
      <div className="container">
        <div className="text-center">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">আপনার জন্য</h2>
          <p className="mt-2 text-muted-foreground">Resources to accelerate your career</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          {links.map((item) => (
            <a
              key={item.title}
              href={item.href}
              className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-6 text-center shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${item.color} text-primary-foreground transition-transform group-hover:scale-110`}>
                <item.icon className="h-7 w-7" />
              </div>
              <h3 className="font-bold font-bangla leading-tight">{item.title}</h3>
              <p className="text-xs text-muted-foreground font-bangla leading-relaxed hidden sm:block">{item.desc}</p>
              <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                দেখুন <ArrowRight className="h-3 w-3" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickLinks;
