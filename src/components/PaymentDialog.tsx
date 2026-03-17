import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, CheckCircle2, Smartphone, CreditCard } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: string; // 'service' | 'course' | 'ebook'
  itemId?: string;
  itemTitle: string;
  amount: number;
  onSuccess?: () => void;
}

type PaymentSetting = {
  id: string;
  method_name: string;
  method_type: string;
  account_number: string | null;
  account_name: string | null;
  instructions: string | null;
  is_active: boolean;
  sort_order: number;
  icon_url: string | null;
};

const PaymentDialog = ({ open, onOpenChange, itemType, itemId, itemTitle, amount, onSuccess }: PaymentDialogProps) => {
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<PaymentSetting | null>(null);
  const [transactionId, setTransactionId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: methods } = useQuery({
    queryKey: ["payment-settings-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_settings")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      return (data as PaymentSetting[]) ?? [];
    },
    enabled: open,
  });

  const mobileMethods = methods?.filter(m => m.method_type === "mobile_banking") ?? [];

  const copyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopied(true);
    toast.success("নম্বর কপি হয়েছে!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!selectedMethod) { toast.error("পেমেন্ট মেথড নির্বাচন করুন"); return; }
    if (!transactionId.trim()) { toast.error("ট্রানজেকশন আইডি দিন"); return; }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: user?.id || null,
        payment_type: selectedMethod.method_type,
        item_type: itemType,
        item_id: itemId || null,
        item_title: itemTitle,
        amount,
        payment_method: selectedMethod.method_name,
        transaction_id: transactionId.trim(),
        sender_number: senderNumber.trim() || null,
      });
      if (error) throw error;
      toast.success("পেমেন্ট তথ্য সফলভাবে জমা হয়েছে! যাচাই করা হলে আপনাকে জানানো হবে।");
      onOpenChange(false);
      setSelectedMethod(null);
      setTransactionId("");
      setSenderNumber("");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err.message || "পেমেন্ট জমা দিতে সমস্যা হয়েছে");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-bangla">পেমেন্ট করুন</DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{itemTitle}</span>
            <span className="text-muted-foreground"> — ৳{amount}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select Method */}
        {!selectedMethod ? (
          <div className="space-y-3">
            <p className="text-sm font-medium font-bangla">পেমেন্ট মেথড নির্বাচন করুন:</p>
            <div className="grid gap-2">
              {mobileMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m)}
                  className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent/10 hover:border-primary/30 transition-all text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{m.method_name}</p>
                    {m.account_number && (
                      <p className="text-xs text-muted-foreground">{m.account_number}</p>
                    )}
                  </div>
                </button>
              ))}
              {mobileMethods.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4 font-bangla">
                  কোনো পেমেন্ট মেথড এখনো সেটআপ করা হয়নি। অনুগ্রহ করে পরে চেষ্টা করুন।
                </p>
              )}
            </div>
          </div>
        ) : (
          /* Step 2: Payment Details */
          <div className="space-y-4">
            <button
              onClick={() => setSelectedMethod(null)}
              className="text-xs text-primary hover:underline font-bangla"
            >
              ← অন্য মেথড নির্বাচন করুন
            </button>

            <div className="rounded-xl border bg-accent/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{selectedMethod.method_name}</Badge>
                <span className="text-lg font-bold text-primary">৳{amount}</span>
              </div>
              {selectedMethod.account_number && (
                <div className="flex items-center justify-between bg-card rounded-lg p-3 border">
                  <div>
                    <p className="text-xs text-muted-foreground">অ্যাকাউন্ট নম্বর</p>
                    <p className="font-mono font-bold text-base">{selectedMethod.account_number}</p>
                    {selectedMethod.account_name && (
                      <p className="text-xs text-muted-foreground">{selectedMethod.account_name}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => copyNumber(selectedMethod.account_number!)}
                  >
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              )}
              {selectedMethod.instructions && (
                <p className="text-xs text-muted-foreground font-bangla whitespace-pre-line">{selectedMethod.instructions}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium font-bangla">
                ট্রানজেকশন আইডি / TrxID <span className="text-destructive">*</span>
              </label>
              <Input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="যেমন: TXN1234ABCD"
                className="mt-1 rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium font-bangla">প্রেরকের নম্বর</label>
              <Input
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="mt-1 rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="rounded-xl" onClick={() => onOpenChange(false)}>
                বাতিল
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 rounded-xl font-semibold"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "পেমেন্ট জমা দিন"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
