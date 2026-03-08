import { Facebook, Youtube, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={logo} alt="Job Lagbe" className="h-10 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Bangladesh's trusted job portal connecting talent with opportunity.
            </p>
            <div className="mt-4 flex gap-3">
              {[Facebook, Youtube, Mail].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold">Job Seekers</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li><a href="/#jobs" className="transition-colors hover:text-primary">Browse Jobs</a></li>
              <li><Link to="/companies" className="transition-colors hover:text-primary">Companies</Link></li>
              <li><Link to="/blog" className="transition-colors hover:text-primary">Career Tips</Link></li>
              <li><Link to="/my-applications" className="transition-colors hover:text-primary">My Applications</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Employers</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/post-job" className="transition-colors hover:text-primary">Post a Job</Link></li>
              <li><Link to="/employer-dashboard" className="transition-colors hover:text-primary">Employer Dashboard</Link></li>
              <li><Link to="/companies" className="transition-colors hover:text-primary">All Companies</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@joblagbe.com</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +880 1XXX-XXXXXX</li>
              <li><Link to="/blog" className="transition-colors hover:text-primary">Blog</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-5 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Job Lagbe. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
