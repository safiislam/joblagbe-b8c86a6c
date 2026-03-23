import { toast } from "sonner";

/**
 * Check if user is logged in before performing an action.
 * Shows a Bengali toast message and returns false if not logged in.
 */
export const requireAuth = (
  user: { id: string } | null | undefined,
  navigate: (path: string) => void
): boolean => {
  if (!user) {
    toast.error("এই কাজটি করতে আপনাকে লগইন করতে হবে", {
      action: {
        label: "লগইন",
        onClick: () => navigate("/login"),
      },
    });
    return false;
  }
  return true;
};
