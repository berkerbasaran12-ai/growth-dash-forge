import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Target, Edit, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

interface GoalTrackerProps {
  effectiveUserId: string | null;
  currentMonthSales: number;
  canEdit: boolean;
}

export function GoalTracker({ effectiveUserId, currentMonthSales, canEdit }: GoalTrackerProps) {
  const [goal, setGoal] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");

  const monthKey = format(startOfMonth(new Date()), "yyyy-MM-dd");

  useEffect(() => {
    if (!effectiveUserId) return;
    supabase
      .from("sales_goals")
      .select("target_sales")
      .eq("user_id", effectiveUserId)
      .eq("month", monthKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setGoal(Number(data.target_sales));
      });
  }, [effectiveUserId, monthKey]);

  const saveGoal = async () => {
    if (!effectiveUserId) return;
    const val = Number(inputVal);
    if (!val || val <= 0) return;
    const { error } = await supabase.from("sales_goals").upsert(
      { user_id: effectiveUserId, month: monthKey, target_sales: val },
      { onConflict: "user_id,month" }
    );
    if (error) toast.error("Hedef kaydedilemedi");
    else { setGoal(val); toast.success("Hedef kaydedildi"); }
    setEditing(false);
  };

  const progress = goal && goal > 0 ? Math.min((currentMonthSales / goal) * 100, 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {format(new Date(), "MMMM yyyy", { locale: tr })} Hedefi
          </span>
        </div>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => { setInputVal(goal?.toString() || ""); setEditing(true); }}>
            <Edit className="h-3 w-3 mr-1" /> {goal ? "Düzenle" : "Belirle"}
          </Button>
        )}
      </div>
      {editing ? (
        <div className="flex items-center gap-2">
          <Input type="number" placeholder="Hedef satış (₺)" value={inputVal} onChange={e => setInputVal(e.target.value)} className="h-8 text-sm bg-secondary border-border flex-1" />
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-accent" onClick={saveGoal}><Check className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground" onClick={() => setEditing(false)}><X className="h-4 w-4" /></Button>
        </div>
      ) : goal ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>₺{currentMonthSales.toLocaleString("tr-TR")}</span>
            <span>₺{goal.toLocaleString("tr-TR")}</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">{progress.toFixed(1)}% tamamlandı</p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Henüz hedef belirlenmedi</p>
      )}
    </motion.div>
  );
}
