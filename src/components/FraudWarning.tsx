import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

const FraudWarning = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative bg-destructive/10 border-b border-destructive/20">
      <div className="container flex items-center gap-2 py-1.5 pr-8">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-destructive" />
        <p className="text-xs text-destructive font-medium truncate font-bangla">
          ⚠️ সতর্কতা: কোনো অর্থের বিনিময়ে চাকরির নিশ্চয়তা দেওয়া হয় না। প্রতারণা থেকে সাবধান!
        </p>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-destructive/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default FraudWarning;
