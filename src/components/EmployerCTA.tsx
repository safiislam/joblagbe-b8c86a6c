import { Building2, Users, BarChart3, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  { icon: Building2, title: "Post Jobs", desc: "Reach thousands of qualified candidates" },
  { icon: Users, title: "Manage Applicants", desc: "Track and filter applications easily" },
  { icon: BarChart3, title: "Analytics", desc: "Insights on your job post performance" },
];

const EmployerCTA = () => {
  return (
    <section className="bg-primary py-16 text-primary-foreground">
      <div className="container">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl">Are You Hiring?</h2>
            <p className="mt-3 text-primary-foreground/80 md:text-lg">
              Post your open positions and find the best talent in Bangladesh. Our platform connects you with thousands of job seekers every day.
            </p>
            <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 gap-2 px-6 font-semibold" asChild>
              <Link to="/post-job">Post a Job <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl bg-primary-foreground/10 p-5 backdrop-blur-sm">
                <f.icon className="h-8 w-8 text-accent" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-primary-foreground/70">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EmployerCTA;
