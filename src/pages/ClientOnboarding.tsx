import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Circle, FileUp, Link as LinkIcon, Type, Upload, ExternalLink, X } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ClientOnboarding = () => {
  const { effectiveUserId } = useAuth();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [items, setItems] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    const { data: cls } = await supabase
      .from("onboarding_checklists")
      .select("*")
      .eq("client_user_id", effectiveUserId)
      .order("created_at", { ascending: false });

    const checklistList = cls || [];
    setChecklists(checklistList);

    if (checklistList.length > 0) {
      const ids = checklistList.map((c: any) => c.id);
      const { data: itms } = await supabase
        .from("onboarding_checklist_items")
        .select("*")
        .in("checklist_id", ids)
        .order("sort_order");

      const grouped: Record<string, any[]> = {};
      (itms || []).forEach((item: any) => {
        if (!grouped[item.checklist_id]) grouped[item.checklist_id] = [];
        grouped[item.checklist_id].push(item);
      });
      setItems(grouped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [effectiveUserId]);

  const handleTextSave = async (itemId: string, value: string) => {
    const { error } = await supabase
      .from("onboarding_checklist_items")
      .update({ response_text: value, is_completed: !!value.trim(), completed_at: value.trim() ? new Date().toISOString() : null })
      .eq("id", itemId);
    if (error) toast.error(error.message);
    else { toast.success("Kaydedildi"); fetchData(); }
  };

  const handleFileUpload = async (itemId: string, file: File) => {
    setUploading(itemId);
    const ext = file.name.split(".").pop();
    const fileName = `onboarding/${effectiveUserId}/${itemId}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("kb-files").upload(fileName, file);
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data: urlData } = supabase.storage.from("kb-files").getPublicUrl(fileName);

    await supabase
      .from("onboarding_checklist_items")
      .update({ response_file_url: urlData.publicUrl, is_completed: true, completed_at: new Date().toISOString() })
      .eq("id", itemId);

    toast.success("Dosya yüklendi");
    setUploading(null);
    fetchData();
  };

  const handleRemoveFile = async (itemId: string) => {
    await supabase
      .from("onboarding_checklist_items")
      .update({ response_file_url: "", is_completed: false, completed_at: null })
      .eq("id", itemId);
    toast.success("Dosya kaldırıldı");
    fetchData();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (checklists.length === 0) {
    return (
      <AppLayout>
        <div className="text-center py-16 glass rounded-xl max-w-2xl mx-auto">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
          <h2 className="text-lg font-medium text-foreground">Henüz bir onboarding listesi atanmamış</h2>
          <p className="text-sm text-muted-foreground mt-1">Ekibiniz size bir checklist atadığında burada görünecek.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Onboarding</h1>
          <p className="text-sm text-muted-foreground mt-1">Aşağıdaki bilgileri tamamlayarak sürecinizi hızlandırın.</p>
        </div>

        {checklists.map((cl) => {
          const clItems = items[cl.id] || [];
          const completed = clItems.filter((i: any) => i.is_completed).length;
          const total = clItems.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          return (
            <motion.div key={cl.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-medium text-foreground">{cl.name}</h2>
                <Badge variant={pct === 100 ? "default" : "secondary"} className={pct === 100 ? "bg-accent/10 text-accent border-accent/20" : ""}>
                  {completed}/{total} tamamlandı
                </Badge>
              </div>
              <Progress value={pct} className="h-2" />

              <div className="space-y-4">
                {clItems.map((item: any) => (
                  <div key={item.id} className={`rounded-lg border p-4 space-y-3 transition-colors ${item.is_completed ? "border-accent/30 bg-accent/5" : "border-border bg-secondary/20"}`}>
                    <div className="flex items-start gap-3">
                      {item.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{item.title}</span>
                          {item.is_required && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Zorunlu</Badge>}
                        </div>
                        {item.description && <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>}
                      </div>
                    </div>

                    {/* File type */}
                    {item.item_type === "file" && (
                      <div className="pl-8">
                        {item.response_file_url ? (
                          <div className="flex items-center gap-2">
                            <a href={item.response_file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <ExternalLink className="h-3 w-3" /> Yüklenen dosya
                            </a>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive" onClick={() => handleRemoveFile(item.id)}>
                              <X className="h-3 w-3 mr-1" /> Kaldır
                            </Button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-border rounded-lg px-4 py-3 hover:bg-secondary/50 transition-colors">
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{uploading === item.id ? "Yükleniyor..." : "Dosya seçin (PNG, JPG, PDF)"}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,application/pdf"
                              className="hidden"
                              disabled={uploading === item.id}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleFileUpload(item.id, f);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    )}

                    {/* Link type */}
                    {item.item_type === "link" && (
                      <div className="pl-8">
                        <LinkInput
                          value={item.response_text || ""}
                          onSave={(v) => handleTextSave(item.id, v)}
                        />
                      </div>
                    )}

                    {/* Text type */}
                    {item.item_type === "text" && (
                      <div className="pl-8">
                        <TextInput
                          value={item.response_text || ""}
                          onSave={(v) => handleTextSave(item.id, v)}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </AppLayout>
  );
};

function LinkInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex gap-2">
      <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="https://..." className="bg-background border-border h-9 text-sm flex-1" />
      <Button size="sm" variant="outline" className="h-9 shrink-0" onClick={() => onSave(val)} disabled={val === value}>Kaydet</Button>
    </div>
  );
}

function TextInput({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [val, setVal] = useState(value);
  return (
    <div className="space-y-2">
      <Textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder="Bilginizi girin..." rows={3} className="bg-background border-border text-sm" />
      <Button size="sm" variant="outline" onClick={() => onSave(val)} disabled={val === value}>Kaydet</Button>
    </div>
  );
}

export default ClientOnboarding;
