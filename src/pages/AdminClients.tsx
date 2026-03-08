import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2, Edit, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/layout/AppLayout";

const mockClients = [
  { id: 1, name: "Ahmet Yılmaz", email: "ahmet@firma.com", company: "Firma A", status: "active", lastLogin: "2 saat önce" },
  { id: 2, name: "Ayşe Demir", email: "ayse@sirket.com", company: "Şirket B", status: "active", lastLogin: "1 gün önce" },
  { id: 3, name: "Mehmet Kaya", email: "mehmet@isletme.com", company: "İşletme C", status: "inactive", lastLogin: "2 hafta önce" },
  { id: 4, name: "Fatma Çelik", email: "fatma@ticaret.com", company: "Ticaret D", status: "active", lastLogin: "5 saat önce" },
  { id: 5, name: "Ali Öztürk", email: "ali@market.com", company: "Market E", status: "active", lastLogin: "3 gün önce" },
];

const AdminClients = () => {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = mockClients.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()) || c.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Müşteri Yönetimi</h1>
            <p className="text-sm text-muted-foreground mt-1">{mockClients.length} müşteri kayıtlı</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">
                <Plus className="h-4 w-4 mr-1.5" />
                Yeni Müşteri
              </Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Yeni Müşteri Ekle</DialogTitle>
              </DialogHeader>
              <NewClientForm onClose={() => setDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Müşteri ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Müşteri</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Şirket</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Son Giriş</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3">
                      <div>
                        <div className="text-sm font-medium text-foreground">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">{client.company}</td>
                    <td className="px-5 py-3">
                      <Badge variant={client.status === "active" ? "default" : "secondary"} className={client.status === "active" ? "bg-accent/10 text-accent border-accent/20 text-xs" : "bg-secondary text-muted-foreground text-xs"}>
                        {client.status === "active" ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{client.lastLogin}</td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border">
                          <DropdownMenuItem className="text-sm cursor-pointer"><Eye className="h-3.5 w-3.5 mr-2" /> Detay</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer"><Edit className="h-3.5 w-3.5 mr-2" /> Düzenle</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer">
                            {client.status === "active" ? <><UserX className="h-3.5 w-3.5 mr-2" /> Pasif Yap</> : <><UserCheck className="h-3.5 w-3.5 mr-2" /> Aktif Yap</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Sil</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

function NewClientForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Create user via auth
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
        <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">E-posta</Label>
        <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Şirket</Label>
        <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Şifre</Label>
        <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 text-sm border-border">İptal</Button>
        <Button type="submit" className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90">Oluştur</Button>
      </div>
    </form>
  );
}

export default AdminClients;
