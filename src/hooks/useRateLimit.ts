import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RateLimitConfig = {
  action: string;
  maxCount: number;
  intervalMinutes: number;
  message?: string;
};

// Moderate rate limits
export const RATE_LIMITS = {
  JOB_APPLICATION: {
    action: "job_application",
    maxCount: 10,
    intervalMinutes: 1440, // 24 hours
    message: "আপনি আজকের জন্য সর্বোচ্চ আবেদন সীমায় পৌঁছেছেন। আগামীকাল আবার চেষ্টা করুন।",
  },
  CONTACT_FORM: {
    action: "contact_form",
    maxCount: 5,
    intervalMinutes: 60,
    message: "অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
  },
  SERVICE_ORDER: {
    action: "service_order",
    maxCount: 5,
    intervalMinutes: 1440,
    message: "আজকের জন্য সর্বোচ্চ অর্ডার সীমায় পৌঁছেছেন।",
  },
  CHAT_MESSAGE: {
    action: "chat_message",
    maxCount: 15,
    intervalMinutes: 1,
    message: "আপনি খুব দ্রুত মেসেজ পাঠাচ্ছেন। অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন।",
  },
} as const;

/**
 * Check rate limit using user_activity table.
 * Returns true if allowed, false if rate limited.
 * Also logs the action if allowed.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  userId?: string | null,
): Promise<boolean> {
  const identifier = userId || "anonymous";

  try {
    const { data, error } = await supabase.rpc("check_rate_limit", {
      _identifier: identifier,
      _action: config.action,
      _max_count: config.maxCount,
      _interval_minutes: config.intervalMinutes,
    });

    if (error) {
      console.error("Rate limit check failed:", error);
      return true; // Allow on error to not block users
    }

    if (!data) {
      toast.error(config.message || "সীমা অতিক্রম হয়েছে। পরে চেষ্টা করুন।");
      return false;
    }

    // Log the action for future rate limiting (only for authenticated users)
    if (userId) {
      await supabase.from("user_activity").insert({
        action: config.action,
        user_id: userId,
        resource_type: "rate_limit",
      });
    }

    return true;
  } catch {
    return true; // Allow on error
  }
}
