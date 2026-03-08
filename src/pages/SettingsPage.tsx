import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/AvatarUpload";

const SettingsPage = () => {
  const { profile, user } = useAuth();
  const [name, setName] = useState(profile?.full_name || "");
  const [company, setCompany] = useState(profile?.company || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleProfileSave = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ full_name: name, company }).eq("user_id", user.id);
    if (error) toast.error(error.message);
    else toast.success("Profil güncellendi");
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) { toast.error("Şifreler eşleşmiyor"); return; }
    if (newPassword.length < 6) { toast.error("Şifre en az 6 karakter olmalı"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else { toast.success("Şifre güncellendi"); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Profil bilgilerinizi yönetin</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-5 pb-4 border-b border-border">
            <AvatarUpload avatarUrl={avatarUrl} onUploaded={(url) => setAvatarUrl(url)} size="lg" />
            <div>
              <h2 className="text-sm font-medium text-foreground">Profil Bilgileri</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Fotoğrafınızı değiştirmek için üzerine gelin</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Ad Soyad</Label><Input value={name} onChange={e => setName(e.target.value)} className="bg-secondary border-border h-9 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">E-posta</Label><Input value={profile?.email || ""} readOnly className="bg-muted border-border h-9 text-sm text-muted-foreground" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Şirket</Label><Input value={company} onChange={e => setCompany(e.target.value)} className="bg-secondary border-border h-9 text-sm" /></div>
            <Button size="sm" onClick={handleProfileSave} className="bg-primary hover:bg-primary/90 h-9">Kaydet</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Şifre Değiştir</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Yeni Şifre</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="bg-secondary border-border h-9 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="bg-secondary border-border h-9 text-sm" /></div>
            <Button size="sm" onClick={handlePasswordChange} className="bg-primary hover:bg-primary/90 h-9">Şifreyi Güncelle</Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
