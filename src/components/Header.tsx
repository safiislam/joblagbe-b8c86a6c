import { Search, Menu, X, LogOut, Shield, Home, Download, ArrowUp } from "lucide-react";
import { useState, useEffect, useRef, useCallback, FormEvent, lazy, Suspense } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { usePwaInstall } from "@/hooks/usePwaInstall";
import { toast } from "sonner";

const NotificationBell = lazy(() => import("@/components/NotificationBell"));

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [headerSearch, setHeaderSearch] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const { logoUrl } = useBrandSettings();
  const { canInstall, install } = usePwaInstall();
  const navigate = useNavigate();
  const location = useLocation();
  const mobileSearchRef = useRef<HTMLInputElement>(null);

  // Close mobile menu on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) setMobileOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);

  // Auto-focus mobile search when menu opens
  useEffect(() => {
    if (mobileOpen) {
      setTimeout(() => mobileSearchRef.current?.focus(), 100);
    }
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Back to top button visibility
  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  const navLinkClass = (path: string) =>
    `relative ${isActive(path) ? "text-primary font-semibold after:absolute after:bottom-0 after:left-1 after:right-1 after:h-0.5 after:rounded-full after:bg-primary" : ""}`;

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-card/90 backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between gap-3 md:h-16">
          <Link to="/" className="shrink-0">
            <img src={logoUrl} alt="Job Lagbe" width={36} height={36} className="h-8 w-auto md:h-9" decoding="async" />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleHeaderSearch} className="hidden flex-1 items-center gap-2 rounded-xl border bg-secondary px-3 py-1.5 md:flex max-w-sm lg:max-w-md transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
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
            <Button variant="ghost" size="sm" className={navLinkClass("/")} asChild><Link to="/">Home</Link></Button>
            {canInstall && (
              <Button variant="ghost" size="sm" className="gap-1" onClick={async () => {
                const ok = await install();
                if (ok) toast.success("অ্যাপ ইনস্টল হচ্ছে!");
              }}>
                <Download className="h-3.5 w-3.5" /> Install
              </Button>
            )}
            {user && profile?.role === "employer" && (
              <Button variant="ghost" size="sm" className={navLinkClass("/post-job")} asChild><Link to="/post-job">Post Job</Link></Button>
            )}
            {isAdmin && (
              <Button variant="ghost" size="sm" className={`gap-1 text-accent ${navLinkClass("/dashboard")}`} asChild>
                <Link to="/dashboard"><Shield className="h-3.5 w-3.5" /> Admin</Link>
              </Button>
            )}
            {user ? (
              <>
                <Suspense fallback={null}><NotificationBell /></Suspense>
                <Link to={profileLink} className="flex items-center gap-2 rounded-full bg-secondary px-2 py-1 hover:bg-secondary/80 transition-colors">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <span className="max-w-[100px] truncate text-xs font-medium">{profile?.full_name || "Profile"}</span>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8" aria-label="Sign out">
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

          <div className="flex items-center gap-1.5 md:hidden">
            {location.pathname !== "/" && (
              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                <Link to="/"><Home className="h-4 w-4" /></Link>
              </Button>
            )}
            {canInstall && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => {
                const ok = await install();
                if (ok) toast.success("অ্যাপ ইনস্টল হচ্ছে!");
              }}>
                <Download className="h-4 w-4" />
              </Button>
            )}
            {user ? (
              <>
                <Suspense fallback={null}><NotificationBell /></Suspense>
                <Link to={profileLink}>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
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
            <button className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? "Close menu" : "Open menu"}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu with backdrop */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 top-14 z-40 bg-foreground/20 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
            <div className="relative z-50 border-t bg-card p-4 md:hidden animate-slide-in-left" style={{ animationDuration: "0.25s" }}>
              <form onSubmit={handleHeaderSearch} className="mb-3 flex items-center gap-2 rounded-xl border bg-secondary px-3 py-2.5 focus-within:ring-2 focus-within:ring-ring">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input ref={mobileSearchRef} type="text" placeholder="Search jobs..." value={headerSearch} onChange={(e) => setHeaderSearch(e.target.value)} className="flex-1 bg-transparent text-sm outline-none" />
              </form>
              <div className="flex flex-col gap-1">
                <Button variant="ghost" className={`justify-start min-h-[44px] ${isActive("/") ? "bg-primary/10 text-primary" : ""}`} asChild>
                  <Link to="/"><Home className="mr-2 h-4 w-4" /> Home</Link>
                </Button>
                {canInstall && (
                  <Button variant="ghost" className="justify-start min-h-[44px]" onClick={async () => {
                    setMobileOpen(false);
                    const ok = await install();
                    if (ok) toast.success("অ্যাপ ইনস্টল হচ্ছে!");
                  }}>
                    <Download className="mr-2 h-4 w-4" /> Install App
                  </Button>
                )}
                {user && profile?.role === "employer" && (
                  <Button variant="ghost" className={`justify-start min-h-[44px] ${isActive("/post-job") ? "bg-primary/10 text-primary" : ""}`} asChild>
                    <Link to="/post-job">Post Job</Link>
                  </Button>
                )}
                {isAdmin && (
                  <Button variant="ghost" className={`justify-start gap-2 text-accent min-h-[44px] ${isActive("/dashboard") ? "bg-accent/10" : ""}`} asChild>
                    <Link to="/dashboard"><Shield className="h-4 w-4" /> Admin Panel</Link>
                  </Button>
                )}
                {user ? (
                  <Button variant="ghost" className="justify-start text-destructive min-h-[44px]" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                  </Button>
                ) : (
                  <div className="mt-2 flex flex-col gap-2">
                    <Button variant="outline" className="border-primary text-primary min-h-[44px]" asChild>
                      <Link to="/login">Login</Link>
                    </Button>
                    <Button className="bg-accent text-accent-foreground font-semibold min-h-[44px]" asChild>
                      <Link to="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      {/* Back to Top button */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="back-to-top animate-fade-in"
          aria-label="Back to top"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </>
  );
};

// Kept as no-op export for backward compatibility
export const MobileBottomNav = () => null;

export default Header;
