import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, CheckCircle2, Circle, ExternalLink, FileUp, Link as LinkIcon, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function ClientOnboardingTab({ clientUserId }: { clientUserId: string }) {
  const [checklists, setChecklists] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customName, setCustomName] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const [clRes, tplRes] = await Promise.all([
      supabase.from("onboarding_checklists").select("*").eq("client_user_id", clientUserId).order("created_at", { ascending: false }),
      supabase.from("onboarding_templates").select("*").order("created_at", { ascending: false }),
    ]);
    const checklistList = clRes.data || [];
    setChecklists(checklistList);
    setTemplates(tplRes.data || []);

    if (checklistList.length > 0) {
      const ids = checklistList.map((c: any) => c.id);
      const { data: itms } = await supabase.from("onboarding_checklist_items").select("*").in("checklist_id", ids).order("sort_order");
      const grouped: Record<string, any[]> = {};
      (itms || []).forEach((item: any) => {
        if (!grouped[item.checklist_id]) grouped[item.checklist_id] = [];
        grouped[item.checklist_id].push(item);
      });
      setItems(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [clientUserId]);

  const handleAssignTemplate = async () => {
    if (!selectedTemplateId && !customName.trim()) return;

    let name = customName.trim();
    let templateId: string | null = null;

    if (selectedTemplateId) {
      templateId = selectedTemplateId;
      const tpl = templates.find((t) => t.id === selectedTemplateId);
      if (tpl && !name) name = tpl.name;
    }

    if (!name) { toast.error("İsim gerekli"); return; }

    // Create checklist
    const { data: cl, error } = await supabase
      .from("onboarding_checklists")
      .insert({ client_user_id: clientUserId, template_id: templateId, name, status: "pending" })
      .select()
      .single();

    if (error || !cl) { toast.error(error?.message || "Hata"); return; }

    // If from template, copy items
    if (templateId) {
      const { data: tplItems } = await supabase.from("onboarding_template_items").select("*").eq("template_id", templateId).order("sort_order");
      if (tplItems && tplItems.length > 0) {
        const inserts = tplItems.map((ti: any) => ({
          checklist_id: cl.id,
          title: ti.title,
          description: ti.description || "",
          item_type: ti.item_type,
          is_required: ti.is_required,
          sort_order: ti.sort_order,
        }));
        await supabase.from("onboarding_checklist_items").insert(inserts);
      }
    }

    toast.success("Checklist atandı");
    setDialogOpen(false);
    setSelectedTemplateId("");
    setCustomName("");
    fetchData();
  };

  const handleDeleteChecklist = async (id: string) => {
    const { error } = await supabase.from("onboarding_checklists").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Checklist silindi"); fetchData(); }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-24"><div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Onboarding Checklists</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-3.5 w-3.5" /> Checklist Ata</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Checklist Ata</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              {templates.length > 0 && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Şablondan Oluştur</Label>
                  <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                    <SelectTrigger className="h-9 text-sm bg-secondary border-border">
                      <SelectValue placeholder="Şablon seçin (isteğe bağlı)" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Checklist Adı</Label>
                <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Ör: Standart Onboarding" className="bg-secondary border-border h-9 text-sm" />
              </div>
              <Button onClick={handleAssignTemplate} disabled={!selectedTemplateId && !customName.trim()} className="w-full">Ata</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {checklists.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Bu müşteriye henüz checklist atanmamış.</p>
      ) : (
        <div className="space-y-4">
          {checklists.map((cl) => {
            const clItems = items[cl.id] || [];
            const completed = clItems.filter((i: any) => i.is_completed).length;
            const total = clItems.length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

            return (
              <div key={cl.id} className="bg-secondary/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-foreground">{cl.name}</span>
                    <Badge variant={pct === 100 ? "default" : "secondary"} className={`ml-2 text-xs ${pct === 100 ? "bg-accent/10 text-accent border-accent/20" : ""}`}>
                      {completed}/{total}
                    </Badge>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteChecklist(cl.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Progress value={pct} className="h-1.5" />

                {clItems.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {clItems.map((item: any) => (
                      <div key={item.id} className="flex items-center gap-2 text-xs">
                        {item.is_completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        )}
                        <span className={`${item.is_completed ? "text-foreground" : "text-muted-foreground"}`}>{item.title}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0 ml-auto">
                          {item.item_type === "file" ? "📎" : item.item_type === "link" ? "🔗" : "📝"}
                        </Badge>
                        {item.is_completed && item.item_type === "file" && item.response_file_url && (
                          <a href={item.response_file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {item.is_completed && item.item_type === "link" && item.response_text && (
                          <a href={item.response_text} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
