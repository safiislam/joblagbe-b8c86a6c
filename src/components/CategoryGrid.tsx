import {
  Monitor, Cpu, TrendingUp, Stethoscope, GraduationCap,
  Building2, Palette, Megaphone, Truck, Scale,
  Banknote, Wrench
} from "lucide-react";

const categories = [
  { name: "IT & Software", icon: Monitor, count: 1240 },
  { name: "Engineering", icon: Cpu, count: 890 },
  { name: "Marketing", icon: Megaphone, count: 650 },
  { name: "Healthcare", icon: Stethoscope, count: 430 },
  { name: "Education", icon: GraduationCap, count: 520 },
  { name: "Real Estate", icon: Building2, count: 310 },
  { name: "Design", icon: Palette, count: 280 },
  { name: "Finance", icon: Banknote, count: 760 },
  { name: "Logistics", icon: Truck, count: 390 },
  { name: "Legal", icon: Scale, count: 210 },
  { name: "Sales", icon: TrendingUp, count: 580 },
  { name: "Maintenance", icon: Wrench, count: 170 },
];

const CategoryGrid = () => {
  return (
    <section className="bg-secondary/50 py-16">
      <div className="container">
        <h2 className="text-center text-2xl font-bold md:text-3xl">Browse by Category</h2>
        <p className="mt-2 text-center text-muted-foreground">Explore opportunities in your field</p>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {categories.map((cat) => (
            <button
              key={cat.name}
              className="group flex flex-col items-center gap-3 rounded-xl border bg-card p-5 shadow-card transition-all hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <cat.icon className="h-6 w-6" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.count} jobs</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;
