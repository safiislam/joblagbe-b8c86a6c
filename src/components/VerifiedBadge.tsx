import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const VerifiedBadge = ({ className = "" }: { className?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <BadgeCheck className={`h-4 w-4 text-primary shrink-0 ${className}`} />
    </TooltipTrigger>
    <TooltipContent side="top" className="text-xs">
      ভেরিফাইড কোম্পানি
    </TooltipContent>
  </Tooltip>
);

export default VerifiedBadge;
