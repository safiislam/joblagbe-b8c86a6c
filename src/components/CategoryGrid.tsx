import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import {
  Monitor, Cpu, TrendingUp, Stethoscope, GraduationCap,
  Building2, Palette, Megaphone, Truck, Scale,
  Banknote, Wrench, type LucideIcon
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Monitor, Cpu, TrendingUp, Stethoscope, GraduationCap,
  Building2, Palette, Megaphone, Truck, Scale,
  Banknote, Wrench,
};

const CategoryGrid = () => {
  const { data: sectionData } = useSiteContent<{ title: string; subtitle: string }>("category_section");
  const title = sectionData?.title || "ক্যাটাগরি অনুযায়ী খুঁজুন";
  const subtitle = sectionData?.subtitle || "Explore opportunities in your field";

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data ?? [];
    },
  });

  const { data: jobCounts } = useQuery({
    queryKey: ["job-counts-by-category"],
    queryFn: async () => {
      const { data } = await supabase.from("jobs").select("category_id").eq("is_active", true);
      const counts: Record<string, number> = {};
      data?.forEach((j) => { if (j.category_id) counts[j.category_id] = (counts[j.category_id] || 0) + 1; });
      return counts;
    },
  });

  return (
    <section className="bg-secondary/40 py-16">
      <div className="container">
        <div className="text-center">
          <h2 className="text-2xl font-bold md:text-3xl font-bangla">{title}</h2>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 sm:gap-4">
          {categories?.map((cat) => {
            const Icon = iconMap[cat.icon] || Monitor;
            const count = jobCounts?.[cat.id] || 0;
            return (
              <button
                key={cat.id}
                className="group flex flex-col items-center gap-3 rounded-2xl border bg-card p-4 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated sm:p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold leading-tight">{cat.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{count} jobs</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
