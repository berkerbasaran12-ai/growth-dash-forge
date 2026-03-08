import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadProps {
  avatarUrl: string | null;
  onUploaded: (url: string) => void;
  size?: "sm" | "lg";
}

export function AvatarUpload({ avatarUrl, onUploaded, size = "lg" }: AvatarUploadProps) {
  const { user, profile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const sizeClass = size === "lg" ? "h-20 w-20" : "h-10 w-10";
  const initials = profile?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen bir resim dosyası seçin");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Dosya boyutu 2MB'dan küçük olmalı");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      onUploaded(publicUrl);
      toast.success("Profil fotoğrafı güncellendi");
    } catch (err: any) {
      toast.error("Yükleme başarısız: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative group inline-block">
      <Avatar className={sizeClass}>
        <AvatarImage src={avatarUrl || undefined} alt="Profil" />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
          {initials}
        </AvatarFallback>
      </Avatar>
      {size === "lg" && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
        </Button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
    </div>
  );
}
