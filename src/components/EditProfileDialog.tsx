import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const EditProfileDialog = ({ open, onOpenChange }: Props) => {
  const { user, profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 300 * 1024) {
      toast.error("ছবির সাইজ সর্বোচ্চ ৩০০KB হতে হবে");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });

    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    setAvatarUrl(`${urlData.publicUrl}?t=${Date.now()}`);
    setUploading(false);
    toast.success("Photo uploaded!");
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated!");
      await refreshProfile();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-3 py-2">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-muted">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <p className="text-xs text-muted-foreground">Click camera icon to change photo (max 300KB)</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your full name" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880 1XXX-XXXXXX" />
          </div>

          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="opacity-60" />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
