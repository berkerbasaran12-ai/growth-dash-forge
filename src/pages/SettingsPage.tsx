import { useState } from "react";
import { motion } from "framer-motion";
import { User, Lock, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppLayout } from "@/components/layout/AppLayout";

const SettingsPage = () => {
  const [profile, setProfile] = useState({ name: "Ahmet Yılmaz", email: "ahmet@firma.com", company: "Firma A" });

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-semibold text-foreground tracking-tight">Ayarlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Profil bilgilerinizi yönetin</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Profil Bilgileri</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
              <Input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">E-posta</Label>
              <Input value={profile.email} readOnly className="bg-muted border-border h-9 text-sm text-muted-foreground" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Şirket</Label>
              <Input value={profile.company} onChange={e => setProfile({...profile, company: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">Kaydet</Button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass rounded-xl p-6 space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <Lock className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-medium text-foreground">Şifre Değiştir</h2>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Mevcut Şifre</Label>
              <Input type="password" className="bg-secondary border-border h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Yeni Şifre</Label>
              <Input type="password" className="bg-secondary border-border h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Yeni Şifre (Tekrar)</Label>
              <Input type="password" className="bg-secondary border-border h-9 text-sm" />
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">Şifreyi Güncelle</Button>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default SettingsPage;
