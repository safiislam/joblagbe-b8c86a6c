import { Facebook, Youtube, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useSiteContent } from "@/hooks/useSiteContent";

type FooterData = {
  description: string;
  contact_email: string;
  contact_phone: string;
  social_links: { facebook: string; youtube: string };
};

const Footer = () => {
  const { data } = useSiteContent<FooterData>("footer");
  const desc = data?.description || "Bangladesh's trusted job portal connecting talent with opportunity.";
  const email = data?.contact_email || "support@joblagbe.com";
  const phone = data?.contact_phone || "+880 1XXX-XXXXXX";
  const socialFb = data?.social_links?.facebook || "#";
  const socialYt = data?.social_links?.youtube || "#";

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={logo} alt="Job Lagbe" width={40} height={40} className="h-10 w-auto" />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            <div className="mt-4 flex gap-3">
              <a href={socialFb} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={socialYt} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Youtube className="h-4 w-4" />
              </a>
              <a href={`mailto:${email}`} className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                <Mail className="h-4 w-4" />
              </a>
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
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {email}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {phone}</li>
              <li><Link to="/blog" className="transition-colors hover:text-primary">Blog</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="container py-5 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Job Lagbe. All rights reserved. · <Link to="/terms" className="underline hover:text-primary transition-colors">Terms & Conditions</Link> · <Link to="/privacy-policy" className="underline hover:text-primary transition-colors">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
