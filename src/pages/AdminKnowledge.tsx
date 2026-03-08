import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, Eye, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/layout/AppLayout";

const mockContent = [
  { id: 1, title: "Dashboard'a Nasıl Veri Girilir?", category: "Dashboard Kullanımı", type: "video", status: "published", date: "01 Mar 2024" },
  { id: 2, title: "Satış Raporlarını Anlama", category: "Veri Analizi", type: "pdf", status: "published", date: "28 Şub 2024" },
  { id: 3, title: "E-Ticaret Satış Stratejileri", category: "Satış Stratejileri", type: "video", status: "draft", date: "25 Şub 2024" },
  { id: 4, title: "Google Ads Optimizasyonu", category: "Pazarlama İpuçları", type: "link", status: "published", date: "20 Şub 2024" },
];

const AdminKnowledge = () => {
  const [search, setSearch] = useState("");

  const filtered = mockContent.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Bilgi Bankası Yönetimi</h1>
            <p className="text-sm text-muted-foreground mt-1">{mockContent.length} içerik</p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">
            <Plus className="h-4 w-4 mr-1.5" />
            Yeni İçerik
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="İçerik ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Başlık</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Tip</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Tarih</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{item.title}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{item.category}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground capitalize">{item.type}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={item.status === "published" ? "default" : "secondary"} className={item.status === "published" ? "bg-accent/10 text-accent border-accent/20 text-xs" : "bg-warning/10 text-warning border-warning/20 text-xs"}>
                        {item.status === "published" ? "Yayında" : "Taslak"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{item.date}</td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border">
                          <DropdownMenuItem className="text-sm cursor-pointer"><Eye className="h-3.5 w-3.5 mr-2" /> Önizle</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer"><Edit className="h-3.5 w-3.5 mr-2" /> Düzenle</DropdownMenuItem>
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

export default AdminKnowledge;
