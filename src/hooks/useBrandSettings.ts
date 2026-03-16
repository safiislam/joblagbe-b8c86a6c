import { useSiteContent } from "@/hooks/useSiteContent";
import fallbackLogo from "@/assets/logo.png";

type BrandSettings = {
  app_name: string;
  short_name: string;
  logo_url: string;
};

export function useBrandSettings() {
  const { data, isLoading } = useSiteContent<Partial<BrandSettings>>("pwa_settings");

  return {
    logoUrl: data?.logo_url || fallbackLogo,
    appName: data?.app_name || "Job লাগবে",
    shortName: data?.short_name || "Job লাগবে",
    isLoading,
  };
}
