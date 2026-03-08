import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, GripVertical, FileUp, Link, Type, Save, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TemplateItem {
  id?: string;
  title: string;
  description: string;
  item_type: string;
  is_required: boolean;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  created_at: string;
  items?: TemplateItem[];
}

const itemTypeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  file: { label: "Dosya Yükleme", icon: <FileUp className="h-3.5 w-3.5" /> },
  link: { label: "Link / URL", icon: <Link className="h-3.5 w-3.5" /> },
  text: { label: "Metin", icon: <Type className="h-3.5 w-3.5" /> },
};

const OnboardingTemplates = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [saving, setSaving] = useState(false);

  // New template dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const fetchTemplates = async () => {
    setLoading(true);
    const { data } = await supabase.from("onboarding_templates").select("*").order("created_at", { ascending: false });
    setTemplates(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleCreateTemplate = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase.from("onboarding_templates").insert({ name: newName.trim() });
    if (error) { toast.error(error.message); return; }
    toast.success("Şablon oluşturuldu");
    setNewName("");
    setDialogOpen(false);
    fetchTemplates();
  };

  const handleDeleteTemplate = async (id: string) => {
    const { error } = await supabase.from("onboarding_templates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Şablon silindi");
    if (expandedId === id) setExpandedId(null);
    fetchTemplates();
  };

  const handleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const { data } = await supabase.from("onboarding_template_items").select("*").eq("template_id", id).order("sort_order");
    setItems((data || []).map((d: any) => ({ id: d.id, title: d.title, description: d.description || "", item_type: d.item_type, is_required: d.is_required, sort_order: d.sort_order })));
  };

  const addItem = () => {
    setItems([...items, { title: "", description: "", item_type: "text", is_required: false, sort_order: items.length }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const handleSaveItems = async () => {
    if (!expandedId) return;
    setSaving(true);

    // Delete existing items
    await supabase.from("onboarding_template_items").delete().eq("template_id", expandedId);

    // Insert new
    if (items.length > 0) {
      const inserts = items.map((item, i) => ({
        template_id: expandedId,
        title: item.title,
        description: item.description,
        item_type: item.item_type,
        is_required: item.is_required,
        sort_order: i,
      }));
      const { error } = await supabase.from("onboarding_template_items").insert(inserts);
      if (error) { toast.error(error.message); setSaving(false); return; }
    }

    toast.success("Maddeler kaydedildi");
    setSaving(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">Onboarding Şablonları</h1>
            <p className="text-sm text-muted-foreground mt-1">Müşterilerden toplanacak bilgilerin şablonlarını yönetin.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Yeni Şablon</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni Onboarding Şablonu</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Şablon Adı</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Standart Onboarding" className="bg-secondary border-border h-9 text-sm" />
                </div>
                <Button onClick={handleCreateTemplate} disabled={!newName.trim()} className="w-full">Oluştur</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 glass rounded-xl">
            <p className="text-muted-foreground text-sm">Henüz şablon oluşturulmamış.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4">
                  <button onClick={() => handleExpand(t.id)} className="flex items-center gap-3 flex-1 text-left">
                    {expandedId === t.id ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    <span className="text-sm font-medium text-foreground">{t.name}</span>
                  </button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteTemplate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {expandedId === t.id && (
                  <div className="border-t border-border px-5 py-4 space-y-4">
                    {items.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-2">Henüz madde eklenmemiş.</p>
                    ) : (
                      <div className="space-y-3">
                        {items.map((item, i) => (
                          <div key={i} className="bg-secondary/30 rounded-lg p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <span className="text-xs text-muted-foreground font-mono mt-2">{i + 1}.</span>
                              <div className="flex-1 space-y-3">
                                <Input
                                  value={item.title}
                                  onChange={(e) => updateItem(i, "title", e.target.value)}
                                  placeholder="Madde başlığı"
                                  className="bg-background border-border h-9 text-sm"
                                />
                                <Textarea
                                  value={item.description}
                                  onChange={(e) => updateItem(i, "description", e.target.value)}
                                  placeholder="Açıklama (isteğe bağlı)"
                                  rows={2}
                                  className="bg-background border-border text-sm"
                                />
                                <div className="flex items-center gap-4 flex-wrap">
                                  <Select value={item.item_type} onValueChange={(v) => updateItem(i, "item_type", v)}>
                                    <SelectTrigger className="w-44 h-9 text-sm bg-background border-border">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="file">📎 Dosya Yükleme</SelectItem>
                                      <SelectItem value="link">🔗 Link / URL</SelectItem>
                                      <SelectItem value="text">📝 Metin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <label className="flex items-center gap-2 cursor-pointer">
                                    <Checkbox checked={item.is_required} onCheckedChange={(c) => updateItem(i, "is_required", !!c)} />
                                    <span className="text-xs text-muted-foreground">Zorunlu</span>
                                  </label>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0" onClick={() => removeItem(i)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={addItem} className="gap-1.5">
                        <Plus className="h-3.5 w-3.5" /> Madde Ekle
                      </Button>
                      <Button size="sm" onClick={handleSaveItems} disabled={saving} className="gap-1.5">
                        <Save className="h-3.5 w-3.5" /> Kaydet
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default OnboardingTemplates;
