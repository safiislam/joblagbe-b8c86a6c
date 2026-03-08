import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";

const FraudWarning = () => {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative border-b border-destructive/20 bg-destructive/5">
      <div className="container flex items-start gap-3 py-3 pr-10">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
        <div className="text-sm">
          <p className="font-bold text-destructive font-bangla">⚠️ প্রতারকদের থেকে সতর্ক থাকুন ⚠️</p>
          <p className="mt-1 leading-relaxed text-foreground/80 font-bangla">
            Job লাগবে? — কোনো অর্থের বিনিময়ে চাকরি পাওয়া বা ইন্টারভিউয়ের নিশ্চয়তা প্রদান করে না। 
            প্রতারণাকারীরা নিবন্ধন ফি, ফেরতযোগ্য ফি, বা এ ধরনের অজুহাতে অর্থ দাবি করতে পারে—এই ধরনের প্রস্তাব থেকে সতর্ক থাকুন। 
            আপনি যদি এ ধরনের কোনো সন্দেহজনক ইমেইল বা বার্তা পান, তাহলে আমাদের সাথে দ্রুত যোগাযোগ করুন।
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default FraudWarning;
