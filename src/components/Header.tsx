import { Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <a href="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="Job Lagbe" className="h-9 w-auto" />
        </a>

        <div className="hidden flex-1 items-center gap-2 rounded-lg border bg-secondary px-3 py-1.5 md:flex max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm">Jobs</Button>
          <Button variant="ghost" size="sm">Companies</Button>
          <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">Login</Button>
          <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90">Sign Up</Button>
        </nav>

        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden">
          <div className="mb-4 flex items-center gap-2 rounded-lg border bg-secondary px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search jobs..." className="flex-1 bg-transparent text-sm outline-none" />
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start">Jobs</Button>
            <Button variant="ghost" className="justify-start">Companies</Button>
            <Button variant="outline" className="border-primary text-primary">Login</Button>
            <Button className="bg-accent text-accent-foreground">Sign Up</Button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
