import { X, Info, AlertTriangle, Megaphone } from "lucide-react";
import { useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

type AnnouncementData = {
  enabled: boolean;
  message: string;
  type: "info" | "warning" | "promo";
};

type AnnouncementBannerProps = {
  contentLoading?: boolean;
};

const iconMap = { info: Info, warning: AlertTriangle, promo: Megaphone };
const colorMap = {
  info: "bg-primary/8 border-primary/15 text-primary",
  warning: "bg-destructive/8 border-destructive/15 text-destructive",
  promo: "bg-accent/8 border-accent/15 text-accent",
};

const AnnouncementBanner = ({ contentLoading = false }: AnnouncementBannerProps) => {
  const [dismissed, setDismissed] = useState(false);
  const { data } = useSiteContent<AnnouncementData>("announcement");

  if (contentLoading) return null;
  if (!data?.enabled || !data?.message || dismissed) return null;

  const Icon = iconMap[data.type] || Info;
  const colors = colorMap[data.type] || colorMap.info;

  return (
    <div className={`relative border-b ${colors}`}>
      <div className="container flex items-center gap-2 py-2 pr-8">
        <Icon className="h-4 w-4 shrink-0" />
        <p className="text-xs font-medium font-bangla">{data.message}</p>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
