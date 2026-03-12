import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

const FraudWarning = () => {
  const [visible, setVisible] = useState(true);
  const { data } = useSiteContent<{ message: string }>("fraud_warning");

  const message = data?.message || "সতর্কতা: কোনো অর্থের বিনিময়ে চাকরির নিশ্চয়তা দেওয়া হয় না। প্রতারণা থেকে সাবধান থাকুন।";

  if (!visible) return null;

  return (
    <div className="relative bg-destructive/8 border-b border-destructive/15">
      <div className="container flex items-center gap-1.5 py-1 pr-7">
        <AlertTriangle className="h-3 w-3 shrink-0 text-destructive" />
        <p className="text-[11px] text-destructive font-medium truncate font-bangla leading-none">
          {message}
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-destructive/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
};

export default FraudWarning;
