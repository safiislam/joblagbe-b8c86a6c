import { FileText, Megaphone, ScrollText, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

const services = [
  {
    icon: ScrollText,
    title: "PROFESSIONAL সিভি তৈরি",
    desc: "আমরা পেশাদারভাবে সিভি (CV) তৈরি করে থাকি, যা নিয়োগকর্তার কাছে আপনার দক্ষতা ও যোগ্যতাকে সঠিকভাবে তুলে ধরে।",
    features: [
      "আধুনিক ও প্রফেশনাল ডিজাইন",
      "সঠিক ও গঠনমূলক তথ্য বিন্যাস",
      "চাকরির ধরন অনুযায়ী কাস্টমাইজেশন",
      "অভিজ্ঞতা, দক্ষতা ও অর্জনের কার্যকর উপস্থাপন",
      "Soft copy only",
    ],
    cost: "৩০ টাকা / পৃষ্ঠা",
    btnLabel: "Order Now",
    btnVariant: "default" as const,
    color: "bg-primary/10 text-primary",
    borderColor: "border-primary/20",
  },
  {
    icon: FileText,
    title: "Professional আবেদন",
    desc: "আমরা সঠিক ও প্রফেশনালভাবে চাকুরি আবেদন প্রস্তুত করতে সাহায্য করি, যাতে তা নিয়োগকর্তার কাছে প্রভাবশালীভাবে উপস্থাপিত হয়।",
    features: [
      "অভিজ্ঞতা, দক্ষতা ও অর্জনকে কার্যকরভাবে উপস্থাপন",
      "চাকরির ধরন অনুযায়ী কাস্টমাইজড কনটেন্ট",
      "পুরো আবেদন প্রক্রিয়ায় সহায়তা",
      "চাকরি পাওয়ার সম্ভাবনা বাড়াতে লক্ষ্যভিত্তিক কৌশল",
    ],
    cost: "৬০-১৩০ টাকা",
    btnLabel: "Order Now",
    btnVariant: "default" as const,
    color: "bg-accent/10 text-accent",
    borderColor: "border-accent/20",
  },
  {
    icon: Megaphone,
    title: "Circular বিজ্ঞাপন",
    desc: "আপনার প্রতিষ্ঠানের চাকরির বিজ্ঞাপন আমাদের প্ল্যাটফর্মে প্রকাশ করুন এবং লক্ষ্যমাত্রা প্রার্থীদের কাছে দ্রুত পৌঁছে দিন।",
    features: [
      "চাকরির বিজ্ঞাপন দ্রুত ও কার্যকরভাবে প্রচারিত",
      "সঠিক প্রার্থীদের কাছে পৌঁছানো",
      "ওয়েবসাইট ও সোশ্যাল মিডিয়ায় বিস্তৃত প্রচার",
    ],
    cost: "Free (সীমিত সময়)",
    btnLabel: "Claim Offer",
    btnVariant: "secondary" as const,
    color: "bg-success/10 text-success",
    borderColor: "border-success/20",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-12 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">আমাদের সেবাসমূহ</h2>
          <p className="mt-1 text-sm text-muted-foreground">Services that help you succeed</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.title}
              className={`rounded-xl border ${s.borderColor} bg-card p-5 flex flex-col justify-between transition-shadow hover:shadow-elevated`}
            >
              <div>
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-base font-bold font-bangla">{s.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-bangla">{s.desc}</p>

                <ul className="mt-3 space-y-1">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground font-bangla">
                      <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-semibold font-bangla">{s.cost}</span>
                <Button size="sm" variant={s.btnVariant} className="text-xs h-8">
                  {s.btnLabel}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
