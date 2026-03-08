import { Search, Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";

const Header = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <img src={logo} alt="Job Lagbe" className="h-9 w-auto" />
        </Link>

        <div className="hidden flex-1 items-center gap-2 rounded-lg border bg-secondary px-3 py-1.5 md:flex max-w-md">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search jobs, companies..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <nav className="hidden items-center gap-2 md:flex">
          <Button variant="ghost" size="sm" asChild><Link to="/">Jobs</Link></Button>
          {user && profile?.role === "employer" && (
            <Button variant="ghost" size="sm" asChild><Link to="/post-job">Post Job</Link></Button>
          )}
          {user ? (
            <>
              <span className="flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm">
                <User className="h-3.5 w-3.5" />
                {profile?.full_name || user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90" asChild>
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
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
            <Button variant="ghost" className="justify-start" asChild><Link to="/">Jobs</Link></Button>
            {user && profile?.role === "employer" && (
              <Button variant="ghost" className="justify-start" asChild><Link to="/post-job">Post Job</Link></Button>
            )}
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" /> {profile?.full_name || user.email}
                </div>
                <Button variant="ghost" className="justify-start" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="border-primary text-primary" asChild><Link to="/login">Login</Link></Button>
                <Button className="bg-accent text-accent-foreground" asChild><Link to="/signup">Sign Up</Link></Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
