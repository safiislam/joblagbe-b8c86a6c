import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Records a free asset access in payments table so it appears in the user's library.
 * Returns true if successful (or already recorded), false on error.
 */
export const recordFreeAccess = async (
  userId: string,
  itemType: "ebook" | "course",
  itemId: string,
  itemTitle: string
): Promise<boolean> => {
  // Check if already recorded
  const { data: existing } = await supabase
    .from("payments")
    .select("id")
    .eq("user_id", userId)
    .eq("item_id", itemId)
    .eq("item_type", itemType)
    .limit(1);

  if (existing && existing.length > 0) return true;

  const { error } = await supabase.from("payments").insert({
    user_id: userId,
    item_type: itemType,
    item_id: itemId,
    item_title: itemTitle,
    amount: 0,
    payment_method: "free",
    payment_type: "free",
    status: "approved",
  });

  if (error) {
    console.error("Failed to record free access:", error);
    toast.error("কিছু সমস্যা হয়েছে");
    return false;
  }

  toast.success("আপনার লাইব্রেরিতে যোগ হয়েছে!");
  return true;
};
