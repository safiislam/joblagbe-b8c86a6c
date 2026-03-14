import { Search, Menu, X, LogOut, Shield, Home, Briefcase, Building2, BookOpen } from "lucide-react";
import { useState, FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import NotificationBell from "@/components/NotificationBell";
import logo from "@/assets/logo.png";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleHeaderSearch = (e: FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(headerSearch.trim())}`);
      setHeaderSearch("");
      setMobileOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const profileLink = profile?.role === "employer" ? "/employer-dashboard" : "/my-applications";

  const initials = profile?.full_name
    ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between gap-3 md:h-16">
        <Link to="/" className="shrink-0">
          <img src={logo} alt="Job Lagbe" width={36} height={36} className="h-8 w-auto md:h-9" />
        </Link>

        {/* Desktop search */}
        <form onSubmit={handleHeaderSearch} className="hidden flex-1 items-center gap-2 rounded-xl border bg-secondary px-3 py-1.5 md:flex max-w-sm lg:max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </form>

        <nav className="hidden items-center gap-1.5 md:flex">
          <Button variant="ghost" size="sm" asChild><Link to="/">Home</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/jobs">Jobs</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/companies">Companies</Link></Button>
          <Button variant="ghost" size="sm" asChild><Link to="/blog">Blog</Link></Button>
          {user && profile?.role === "employer" && (
            <Button variant="ghost" size="sm" asChild><Link to="/post-job">Post Job</Link></Button>
          )}
          {isAdmin && (
            <Button variant="ghost" size="sm" className="gap-1 text-accent" asChild>
              <Link to="/dashboard"><Shield className="h-3.5 w-3.5" /> Admin</Link>
            </Button>
          )}
          {user ? (
            <>
              <NotificationBell />
              <Link to={profileLink} className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1 hover:bg-secondary/80 transition-colors">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[100px] truncate text-xs font-medium">{profile?.full_name || "Profile"}</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link to={profileLink}>
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <>
              <Button variant="outline" size="sm" className="h-8 text-xs border-primary text-primary" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="h-8 text-xs bg-accent text-accent-foreground font-semibold" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
          <button className="p-1" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t bg-card p-4 md:hidden animate-fade-in" style={{ animationDuration: "0.2s" }}>
          <form onSubmit={handleHeaderSearch} className="mb-3 flex items-center gap-2 rounded-xl border bg-secondary px-3 py-2.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input type="text" placeholder="Search jobs..." value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
          </form>
          <div className="flex flex-col gap-1">
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/"><Home className="mr-2 h-4 w-4" /> Home</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/jobs"><Briefcase className="mr-2 h-4 w-4" /> Jobs</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/companies"><Building2 className="mr-2 h-4 w-4" /> Companies</Link>
            </Button>
            <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
              <Link to="/blog"><BookOpen className="mr-2 h-4 w-4" /> Blog</Link>
            </Button>
            {user && profile?.role === "employer" && (
              <Button variant="ghost" className="justify-start" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/post-job">Post Job</Link>
              </Button>
            )}
            {isAdmin && (
              <Button variant="ghost" className="justify-start gap-2 text-accent" asChild onClick={() => setMobileOpen(false)}>
                <Link to="/dashboard"><Shield className="h-4 w-4" /> Admin Panel</Link>
              </Button>
            )}
            {user ? (
              <Button variant="ghost" className="justify-start text-destructive" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="outline" className="border-primary text-primary" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/login">Login</Link>
                </Button>
                <Button className="bg-accent text-accent-foreground font-semibold" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

const mobileNavItems = [
  { to: "/", icon: Home, label: "হোম" },
  { to: "/jobs", icon: Briefcase, label: "চাকরি" },
  { to: "/companies", icon: Building2, label: "কোম্পানি" },
  { to: "/blog", icon: BookOpen, label: "ব্লগ" },
];

export const MobileBottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-card/95 backdrop-blur-xl border-t border-border/50 shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)]">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || (to === "/jobs" && location.pathname.startsWith("/jobs"));
            return (
              <Link
                key={to}
                to={to}
                className={`relative flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground active:scale-95"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1 left-1/2 h-[3px] w-6 -translate-x-1/2 rounded-full bg-primary" />
                )}
                <Icon className={`h-[22px] w-[22px] transition-transform duration-200 ${isActive ? "scale-110" : ""}`} strokeWidth={isActive ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </div>
        {/* Safe area spacer for notched devices */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
};

export default Header;
