import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, addMonths, subMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { Target, ChevronLeft, ChevronRight, Calendar, Star, Check, Plus, Trash2, AlertCircle, Edit2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface GoalItem {
  title: string;
  is_important: boolean;
  is_completed: boolean;
}

interface MonthlyGoalRecord {
  id: string;
  user_id: string;
  month: string;
  target_revenue: number;
  goals: GoalItem[];
  is_locked: boolean;
  created_at: string;
}

const MAX_GOALS = 15;
const MAX_IMPORTANT = 3;

const Goals = () => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [record, setRecord] = useState<MonthlyGoalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Edit form state
  const [editGoals, setEditGoals] = useState<GoalItem[]>([]);
  const [editRevenue, setEditRevenue] = useState("0");
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  const monthKey = format(currentMonth, "yyyy-MM-dd");

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("monthly_goals")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", monthKey)
      .maybeSingle();

    if (data) {
      const goals = Array.isArray(data.goals) ? data.goals : [];
      setRecord({
        ...data,
        goals: goals as unknown as GoalItem[],
      } as MonthlyGoalRecord);
    } else {
      setRecord(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user, monthKey]);

  const stats = useMemo(() => {
    if (!record) return { total: 0, important: 0, completed: 0, completedTotal: 0 };
    const goals = record.goals;
    return {
      total: goals.length,
      important: goals.filter(g => g.is_important).length,
      completed: goals.filter(g => g.is_completed).length,
      completedTotal: goals.length,
    };
  }, [record]);

  const openEdit = () => {
    if (record) {
      setEditGoals([...record.goals]);
      setEditRevenue(String(record.target_revenue));
    } else {
      setEditGoals([{ title: "", is_important: false, is_completed: false }]);
      setEditRevenue("0");
    }
    setAccepted(false);
    setEditOpen(true);
  };

  const addGoal = () => {
    if (editGoals.length >= MAX_GOALS) return;
    setEditGoals([...editGoals, { title: "", is_important: false, is_completed: false }]);
  };

  const removeGoal = (idx: number) => {
    if (editGoals.length <= 1) return;
    setEditGoals(editGoals.filter((_, i) => i !== idx));
  };

  const updateGoalTitle = (idx: number, title: string) => {
    const updated = [...editGoals];
    updated[idx] = { ...updated[idx], title };
    setEditGoals(updated);
  };

  const toggleImportant = (idx: number) => {
    const updated = [...editGoals];
    const currentImportantCount = updated.filter(g => g.is_important).length;
    if (!updated[idx].is_important && currentImportantCount >= MAX_IMPORTANT) {
      toast.error(`En fazla ${MAX_IMPORTANT} hedefi önemli olarak işaretleyebilirsiniz`);
      return;
    }
    updated[idx] = { ...updated[idx], is_important: !updated[idx].is_important };
    setEditGoals(updated);
  };

  const hasEmptyGoals = editGoals.some(g => !g.title.trim());

  const saveGoals = async () => {
    if (!user) return;
    if (hasEmptyGoals) {
      toast.error("Boş hedef bırakamazsınız");
      return;
    }
    if (!accepted && !record?.is_locked) {
      toast.error("Lütfen kuralları kabul edin");
      return;
    }
    setSaving(true);

    const payload = {
      user_id: user.id,
      month: monthKey,
      target_revenue: Number(editRevenue) || 0,
      goals: editGoals as unknown as import("@/integrations/supabase/types").Json,
      is_locked: true,
    };

    const { error } = record
      ? await supabase.from("monthly_goals").update(payload).eq("id", record.id)
      : await supabase.from("monthly_goals").insert({ ...payload, month: monthKey, user_id: user.id } as any);

    if (error) {
      toast.error("Kaydedilemedi: " + error.message);
    } else {
      toast.success("Hedefler kaydedildi");
      setEditOpen(false);
      fetchGoals();
    }
    setSaving(false);
  };

  const toggleCompleted = async (idx: number) => {
    if (!record) return;
    const updatedGoals = [...record.goals];
    updatedGoals[idx] = { ...updatedGoals[idx], is_completed: !updatedGoals[idx].is_completed };
    const { error } = await supabase
      .from("monthly_goals")
      .update({ goals: updatedGoals as unknown as import("@/integrations/supabase/types").Json })
      .eq("id", record.id);
    if (error) {
      toast.error("Güncellenemedi");
    } else {
      setRecord({ ...record, goals: updatedGoals });
    }
  };

  const sortedGoals = useMemo(() => {
    if (!record) return [];
    return [...record.goals]
      .map((g, i) => ({ ...g, originalIndex: i }))
      .sort((a, b) => Number(a.is_completed) - Number(b.is_completed));
  }, [record]);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Hedefler</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">Aylık hedeflerinizi belirleyin ve takip edin</p>
        </div>

        <Card className="border-border">
          <CardContent className="pt-8 pb-6">
            <div className="flex flex-col items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-7 w-7 text-primary" />
              </div>
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">Aylık Hedefler</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(currentMonth, "MMMM yyyy", { locale: tr })} ayı için belirlenen hedefleriniz
                </p>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/20">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">
                    {format(currentMonth, "MMMM yyyy", { locale: tr })}
                  </span>
                </div>
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Edit Button */}
              <Button onClick={openEdit} className="gap-2">
                <Edit2 className="h-4 w-4" /> Hedefleri Düzenle
              </Button>

              {/* Stats */}
              {record && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="gap-1">
                    <Target className="h-3 w-3" /> Toplam: {stats.completed}/{stats.total}
                  </Badge>
                  <Badge className="gap-1 bg-primary text-primary-foreground">
                    <Star className="h-3 w-3" /> Önemli: {stats.important}/{MAX_IMPORTANT}
                  </Badge>
                  <Badge variant="outline" className="gap-1 border-green-500 text-green-600">
                    <Check className="h-3 w-3" /> Tamamlanan: {stats.completed}/{stats.total}
                  </Badge>
                  {record.created_at && (
                    <Badge variant="outline" className="gap-1">
                      {format(new Date(record.created_at), "dd.MM.yyyy", { locale: tr })} tarihinde oluşturuldu
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Goals List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : record && record.goals.length > 0 ? (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground tracking-tight">Hedefleriniz</h3>
            {sortedGoals.map((goal, i) => (
              <Card key={i} className={`border-border transition-colors ${goal.is_completed ? "opacity-60" : ""}`}>
                <CardContent className="flex items-center gap-3 py-4 px-5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold shrink-0 ${goal.is_completed ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary"}`}>
                    {goal.is_completed ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`flex-1 text-sm ${goal.is_completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                    {goal.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {goal.is_important && (
                      <Badge className="bg-primary text-primary-foreground gap-1">
                        <Star className="h-3 w-3" /> Önemli
                      </Badge>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        checked={goal.is_completed}
                        onCheckedChange={() => toggleCompleted(goal.originalIndex)}
                      />
                      <span className="text-xs text-muted-foreground">Tamamlandı</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Target className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">Bu ay için henüz hedef belirlenmemiş</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={openEdit}>
                <Plus className="h-4 w-4" /> Hedef Belirle
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-border bg-muted/30">
          <CardContent className="flex gap-3 py-4 px-5">
            <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              Hedeflerinizi direkt listeden ✓ işareti koyarak tamamlayabilirsiniz. Tamamlanan hedefler en alta taşınır ve rengi değişir.
              Hedef metinlerini değiştirmek için "Düzenle" butonunu kullanabilirsiniz.
            </p>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Aylık Hedefleri Düzenle
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Mevcut hedeflerinizi düzenleyebilirsiniz. En fazla {MAX_GOALS} hedef girebilir, bunlardan {MAX_IMPORTANT} tanesini önemli olarak işaretleyebilirsiniz.
              </p>
            </DialogHeader>

            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Input type="month" value={format(currentMonth, "yyyy-MM")} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Bu Ayın Ciro Hedefi (₺)</Label>
                  <Input type="number" value={editRevenue} onChange={e => setEditRevenue(e.target.value)} placeholder="0" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-foreground">
                    Hedefleriniz ({editGoals.length}/{MAX_GOALS})
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    Önemli: {editGoals.filter(g => g.is_important).length}/{MAX_IMPORTANT}
                  </span>
                </div>

                <div className="space-y-3">
                  {editGoals.map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 rounded-lg border border-border">
                      <Input
                        value={goal.title}
                        onChange={e => updateGoalTitle(idx, e.target.value)}
                        placeholder={`${idx + 1}. hedefini yazın...`}
                        className="flex-1"
                      />
                      {!goal.title.trim() && goal.title !== undefined && editGoals.length > 1 && (
                        <span className="text-xs text-destructive mt-2 absolute -bottom-5">Hedef boş olamaz</span>
                      )}
                      <div className="flex items-center gap-2 shrink-0 mt-1">
                        <Checkbox
                          checked={goal.is_important}
                          onCheckedChange={() => toggleImportant(idx)}
                        />
                        <span className="text-sm text-foreground">Önemli</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeGoal(idx)}
                          disabled={editGoals.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  className="w-full mt-3 gap-2"
                  onClick={addGoal}
                  disabled={editGoals.length >= MAX_GOALS}
                >
                  <Plus className="h-4 w-4" /> Hedef Ekle ({editGoals.length}/{MAX_GOALS})
                </Button>
              </div>

              {/* Rules */}
              <Card className="border-border bg-muted/30">
                <CardContent className="py-4 px-5">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sm text-foreground mb-2">Kurallar:</p>
                      <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>En az 1, en fazla {MAX_GOALS} hedef girebilirsiniz</li>
                        <li>En fazla {MAX_IMPORTANT} hedefi "önemli" olarak işaretleyebilirsiniz</li>
                        <li>Hedeflerinizi kaydettikten sonra değiştiremezsiniz</li>
                        <li>Her ay için sadece bir kez hedef belirleyebilirsiniz</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Accept checkbox */}
              {!record?.is_locked && (
                <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-muted/20">
                  <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(!!v)} />
                  <span className="text-sm text-foreground">
                    Hedeflerimi kaydettikten sonra değiştiremeyeceğimi anlıyorum ve kabul ediyorum.
                  </span>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={saveGoals} disabled={saving || hasEmptyGoals} className="gap-2">
                  {saving ? "Kaydediliyor..." : "Hedefleri Güncelle"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default Goals;
