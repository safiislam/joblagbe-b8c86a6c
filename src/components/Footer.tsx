import { Facebook, Youtube, Mail, Phone, MessageCircle, Instagram, Twitter, Linkedin, Globe, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useSiteContent } from "@/hooks/useSiteContent";
import { useBrandSettings } from "@/hooks/useBrandSettings";
import { Skeleton } from "@/components/ui/skeleton";

type SocialLink = {
  platform: string;
  url: string;
  label?: string;
};

type FooterData = {
  description: string;
  contact_email: string;
  contact_phone: string;
  social_links: { facebook: string; youtube: string };
  custom_social_links?: SocialLink[];
};

type FooterProps = {
  contentLoading?: boolean;
};

const ICON_MAP: Record<string, React.ElementType> = {
  facebook: Facebook,
  youtube: Youtube,
  whatsapp: MessageCircle,
  instagram: Instagram,
  twitter: Twitter,
  linkedin: Linkedin,
  telegram: Send,
  website: Globe,
  email: Mail,
};

const Footer = ({ contentLoading = false }: FooterProps) => {
  const { data, isLoading } = useSiteContent<FooterData>("footer");
  const { logoUrl } = useBrandSettings();
  const showSkeleton = contentLoading || isLoading;
  const desc = data?.description || "Bangladesh's trusted job portal connecting talent with opportunity.";
  const email = data?.contact_email || "support@joblagbe.com";
  const phone = data?.contact_phone || "+880 1XXX-XXXXXX";

  // Build social links array from legacy + custom
  const socialLinks: SocialLink[] = (() => {
    const custom = data?.custom_social_links || [];
    if (custom.length > 0) return custom;
    // Fallback to legacy fields
    const legacy: SocialLink[] = [];
    if (data?.social_links?.facebook) legacy.push({ platform: "facebook", url: data.social_links.facebook });
    if (data?.social_links?.youtube) legacy.push({ platform: "youtube", url: data.social_links.youtube });
    if (!legacy.length) {
      legacy.push({ platform: "facebook", url: "#" });
      legacy.push({ platform: "youtube", url: "#" });
    }
    return legacy;
  })();

  return (
    <footer className="border-t bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <img src={logoUrl} alt="Job Lagbe" width={40} height={40} className="h-10 w-auto" loading="lazy" decoding="async" />
            {showSkeleton ? (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-5/6 rounded-lg" />
              </div>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-3">
              {socialLinks.map((link, i) => {
                const Icon = ICON_MAP[link.platform] || Globe;
                const href = link.platform === "whatsapp" && link.url && !link.url.startsWith("http")
                  ? `https://wa.me/${link.url.replace(/[^0-9]/g, "")}`
                  : link.url || "#";
                return (
                  <a key={i} href={href} target="_blank" rel="noopener noreferrer" title={link.label || link.platform} className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
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
              {showSkeleton ? (
                <>
                  <li><Skeleton className="h-4 w-36 rounded-lg" /></li>
                  <li><Skeleton className="h-4 w-32 rounded-lg" /></li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {email}</li>
                  <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {phone}</li>
                </>
              )}
              <li><Link to="/contact" className="transition-colors hover:text-primary">Free Consultation</Link></li>
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
