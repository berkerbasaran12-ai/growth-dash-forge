import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Edit, Trash2, MoreHorizontal, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminKnowledge = () => {
  const [search, setSearch] = useState("");
  const [content, setContent] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editCat, setEditCat] = useState<any>(null);
  const [catForm, setCatForm] = useState({ name: "", icon: "📚", thumbnail_url: "" });

  const fetchData = async () => {
    const [contentRes, catRes] = await Promise.all([
      supabase.from("kb_content").select("*, kb_categories(name, icon)").order("sort_order"),
      supabase.from("kb_categories").select("*").order("sort_order"),
    ]);
    if (contentRes.data) setContent(contentRes.data);
    if (catRes.data) setCategories(catRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async (data: any) => {
    if (editItem) {
      const { error } = await supabase.from("kb_content").update(data).eq("id", editItem.id);
      if (error) { toast.error(error.message); return; }
      toast.success("İçerik güncellendi");
    } else {
      const { error } = await supabase.from("kb_content").insert(data);
      if (error) { toast.error(error.message); return; }
      toast.success("İçerik oluşturuldu");
    }
    setDialogOpen(false);
    setEditItem(null);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu içeriği silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("kb_content").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("İçerik silindi"); fetchData(); }
  };

  const filtered = content.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) return;
    if (editCat) {
      const { error } = await supabase.from("kb_categories").update({ name: catForm.name, icon: catForm.icon, thumbnail_url: catForm.thumbnail_url }).eq("id", editCat.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Kategori güncellendi");
    } else {
      const { error } = await supabase.from("kb_categories").insert({ name: catForm.name, icon: catForm.icon, thumbnail_url: catForm.thumbnail_url });
      if (error) { toast.error(error.message); return; }
      toast.success("Kategori oluşturuldu");
    }
    setCatDialogOpen(false);
    setEditCat(null);
    setCatForm({ name: "", icon: "📚", thumbnail_url: "" });
    fetchData();
  };

  const handleDeleteCat = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("kb_categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Kategori silindi"); fetchData(); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">İçerik Yönetimi</h1>
            <p className="text-sm text-muted-foreground mt-1">{content.length} içerik</p>
          </div>
          <Button size="sm" className="bg-primary hover:bg-primary/90 h-9" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-1.5" /> Yeni İçerik
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="İçerik ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>

        {/* Categories Management */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-foreground">Kategoriler</h3>
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setEditCat(null); setCatForm({ name: "", icon: "📚" }); setCatDialogOpen(true); }}>
              <Plus className="h-3 w-3 mr-1" /> Ekle
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div key={cat.id} className="inline-flex items-center gap-1.5 bg-secondary rounded-lg px-3 py-1.5 text-xs text-foreground group">
                <span>{cat.icon} {cat.name}</span>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground" onClick={() => { setEditCat(cat); setCatForm({ name: cat.name, icon: cat.icon || "📚" }); setCatDialogOpen(true); }}>
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteCat(cat.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {categories.length === 0 && <span className="text-xs text-muted-foreground">Henüz kategori yok</span>}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Başlık</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Kategori</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Tip</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm font-medium text-foreground">{item.title}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">{item.kb_categories ? `${item.kb_categories.icon} ${item.kb_categories.name}` : "-"}</td>
                    <td className="px-5 py-3"><Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground capitalize">{item.content_type}</Badge></td>
                    <td className="px-5 py-3">
                      <Badge className={item.status === "published" ? "bg-accent/10 text-accent border-accent/20 text-xs" : "bg-warning/10 text-warning border-warning/20 text-xs"}>
                        {item.status === "published" ? "Yayında" : "Taslak"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass border-border">
                          <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => { setEditItem(item); setDialogOpen(true); }}><Edit className="h-3.5 w-3.5 mr-2" /> Düzenle</DropdownMenuItem>
                          <DropdownMenuItem className="text-sm cursor-pointer text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-3.5 w-3.5 mr-2" /> Sil</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">İçerik bulunamadı</td></tr>}
              </tbody>
            </table>
          </div>
        </motion.div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditItem(null); }}>
          <DialogContent className="glass border-border max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground">{editItem ? "İçerik Düzenle" : "Yeni İçerik"}</DialogTitle></DialogHeader>
            <ContentForm categories={categories} initialData={editItem} onSave={handleSave} />
          </DialogContent>
        </Dialog>

        {/* Category Dialog */}
        <Dialog open={catDialogOpen} onOpenChange={(open) => { setCatDialogOpen(open); if (!open) { setEditCat(null); setCatForm({ name: "", icon: "📚" }); } }}>
          <DialogContent className="glass border-border max-w-sm">
            <DialogHeader><DialogTitle className="text-foreground">{editCat ? "Kategori Düzenle" : "Yeni Kategori"}</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">İkon</Label>
                <Input value={catForm.icon} onChange={e => setCatForm({ ...catForm, icon: e.target.value })} className="bg-secondary border-border h-9 text-sm w-20" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Kategori Adı</Label>
                <Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} className="bg-secondary border-border h-9 text-sm" required />
              </div>
              <Button className="w-full h-9 text-sm bg-primary hover:bg-primary/90" onClick={handleSaveCat}>
                <Save className="h-4 w-4 mr-1.5" /> Kaydet
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

function ContentForm({ categories, initialData, onSave }: { categories: any[]; initialData?: any; onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category_id: initialData?.category_id || '',
    content_type: initialData?.content_type || 'video',
    content_url: initialData?.content_url || '',
    status: initialData?.status || 'draft',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, category_id: form.category_id || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Başlık</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="bg-secondary border-border h-9 text-sm" required /></div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Açıklama</Label><Textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-secondary border-border text-sm min-h-[80px]" required /></div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kategori</Label>
          <Select value={form.category_id} onValueChange={v => setForm({...form, category_id: v})}>
            <SelectTrigger className="bg-secondary border-border h-9 text-sm"><SelectValue placeholder="Seçin" /></SelectTrigger>
            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">İçerik Tipi</Label>
          <Select value={form.content_type} onValueChange={v => setForm({...form, content_type: v})}>
            <SelectTrigger className="bg-secondary border-border h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="link">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">İçerik URL</Label><Input value={form.content_url} onChange={e => setForm({...form, content_url: e.target.value})} placeholder="https://..." className="bg-secondary border-border h-9 text-sm" /></div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Durum</Label>
        <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
          <SelectTrigger className="bg-secondary border-border h-9 text-sm"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full h-9 text-sm bg-primary hover:bg-primary/90"><Save className="h-4 w-4 mr-1.5" /> Kaydet</Button>
    </form>
  );
}

export default AdminKnowledge;
