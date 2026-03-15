import { AlertTriangle } from "lucide-react";

const JobFraudWarning = ({ className = "" }: { className?: string }) => (
  <details className={`group text-[11px] text-muted-foreground bg-destructive/5 border border-destructive/15 rounded-lg px-3 py-1.5 ${className}`}>
    <summary className="cursor-pointer font-semibold text-destructive flex items-center gap-1">
      <AlertTriangle className="h-3 w-3 shrink-0" /> প্রতারকদের থেকে সতর্ক থাকুন
    </summary>
    <p className="mt-1 leading-relaxed font-bangla">
      Job লাগবে? কোনো অর্থের বিনিময়ে চাকরি পাওয়া বা ইন্টারভিউয়ের নিশ্চয়তা প্রদান করে না। প্রতারণাকারীরা নিবন্ধন ফি, ফেরতযোগ্য ফি, বা এ ধরনের অজুহাতে অর্থ দাবি করতে পারে—এই ধরনের প্রস্তাব থেকে সতর্ক থাকুন।
    </p>
  </details>
);

export default JobFraudWarning;
