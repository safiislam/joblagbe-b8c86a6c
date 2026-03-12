import { FileText, Megaphone, ScrollText, Check, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSiteContent } from "@/hooks/useSiteContent";

const iconMap: Record<string, LucideIcon> = { ScrollText, FileText, Megaphone };

type ServiceItem = { title: string; desc: string; icon: string; features: string[]; cost: string };
type ServicesData = { title: string; subtitle: string; items: ServiceItem[] };

const colorCycle = [
  { color: "bg-primary/10 text-primary", border: "border-primary/20" },
  { color: "bg-accent/10 text-accent", border: "border-accent/20" },
  { color: "bg-success/10 text-success", border: "border-success/20" },
];

const ServicesSection = () => {
  const { data } = useSiteContent<ServicesData>("services");
  const title = data?.title || "আমাদের সেবাসমূহ";
  const subtitle = data?.subtitle || "Services that help you succeed";
  const items = data?.items || [];

  return (
    <section className="py-12 bg-secondary/30">
      <div className="container">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {items.map((s, i) => {
            const Icon = iconMap[s.icon] || FileText;
            const style = colorCycle[i % colorCycle.length];
            return (
              <div key={s.title || i} className={`rounded-xl border ${style.border} bg-card p-5 flex flex-col justify-between transition-shadow hover:shadow-elevated`}>
                <div>
                  <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${style.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 text-base font-bold font-bangla">{s.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground font-bangla">{s.desc}</p>
                  <ul className="mt-3 space-y-1">
                    {(s.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-1.5 text-xs text-muted-foreground font-bangla">
                        <Check className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-semibold font-bangla">{s.cost}</span>
                  <Button size="sm" className="text-xs h-8">Order Now</Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
