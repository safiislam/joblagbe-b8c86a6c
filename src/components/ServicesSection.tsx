import { Lightbulb, FileText, Megaphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: Lightbulb,
    title: "ক্যারিয়ার টিপস",
    titleEn: "Career Tips",
    desc: "পেশাদার পরামর্শ, ইন্টারভিউ প্রস্তুতি এবং ক্যারিয়ার গড়ার সেরা কৌশল।",
    color: "bg-primary/10 text-primary",
    hoverColor: "group-hover:bg-primary group-hover:text-primary-foreground",
  },
  {
    icon: FileText,
    title: "Professional আবেদন",
    titleEn: "Professional Application",
    desc: "প্রফেশনাল CV, কভার লেটার এবং আবেদনপত্র তৈরিতে সহায়তা।",
    color: "bg-accent/10 text-accent",
    hoverColor: "group-hover:bg-accent group-hover:text-accent-foreground",
  },
  {
    icon: Megaphone,
    title: "Circular বিজ্ঞাপন",
    titleEn: "Job Circular Ads",
    desc: "আপনার নিয়োগ বিজ্ঞপ্তি হাজারো প্রার্থীর কাছে পৌঁছে দিন।",
    color: "bg-success/10 text-success",
    hoverColor: "group-hover:bg-success group-hover:text-success-foreground",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-16 bg-secondary/30">
      <div className="container">
        <div className="text-center">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">আমাদের সেবাসমূহ</h2>
          <p className="mt-2 text-muted-foreground">Services that help you succeed in your career</p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.titleEn}
              className="group relative overflow-hidden rounded-2xl border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated cursor-pointer"
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${s.color} ${s.hoverColor}`}>
                <s.icon className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-bold font-bangla">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground font-bangla">{s.desc}</p>
              <Button variant="ghost" className="mt-4 gap-1 px-0 text-primary hover:bg-transparent hover:text-primary/80">
                বিস্তারিত দেখুন <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
