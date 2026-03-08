import { useState } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Download, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MetricsTableProps {
  metrics: any[];
  canEdit: boolean;
  onRefresh: () => void;
}

function exportCSV(metrics: any[]) {
  const headers = ["Tarih", "Satış (₺)", "Sipariş", "Ort. Sepet (₺)", "Yeni Müşteri", "Tekrar Eden Müşteri", "Net Kar (₺)"];
  const rows = metrics.map(r => [
    r.date,
    Number(r.total_sales),
    r.order_count,
    Number(r.avg_cart_value || 0).toFixed(0),
    r.new_customers,
    r.returning_customers,
    Number(r.net_profit),
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `satis-verileri-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function MetricsTable({ metrics, canEdit, onRefresh }: MetricsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});

  const startEdit = (row: any) => {
    setEditingId(row.id);
    setEditData({
      total_sales: Number(row.total_sales),
      order_count: row.order_count,
      new_customers: row.new_customers,
      returning_customers: row.returning_customers,
      net_profit: Number(row.net_profit),
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from("sales_metrics").update(editData).eq("id", editingId);
    if (error) toast.error("Güncellenemedi");
    else { toast.success("Güncellendi"); onRefresh(); }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu veriyi silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from("sales_metrics").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else { toast.success("Silindi"); onRefresh(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Geçmiş Veriler</h3>
        {metrics.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => exportCSV(metrics)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV İndir
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Tarih</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Satış (₺)</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Sipariş</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Ort. Sepet (₺)</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Yeni Müşteri</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Net Kar (₺)</th>
              {canEdit && <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlem</th>}
            </tr>
          </thead>
          <tbody>
            {metrics.length === 0 ? (
              <tr><td colSpan={canEdit ? 7 : 6} className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz veri yok. "Veri Ekle" ile başlayın.</td></tr>
            ) : metrics.map((row) => (
              <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                <td className="px-5 py-3 text-sm text-foreground">{format(parseISO(row.date), "dd MMM yyyy", { locale: tr })}</td>
                {editingId === row.id ? (
                  <>
                    <td className="px-2 py-1"><Input type="number" className="h-7 text-xs bg-secondary border-border text-right w-24 ml-auto" value={editData.total_sales} onChange={e => setEditData({ ...editData, total_sales: Number(e.target.value) })} /></td>
                    <td className="px-2 py-1"><Input type="number" className="h-7 text-xs bg-secondary border-border text-right w-20 ml-auto" value={editData.order_count} onChange={e => setEditData({ ...editData, order_count: Number(e.target.value) })} /></td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{editData.order_count > 0 ? (editData.total_sales / editData.order_count).toFixed(0) : "0"}</td>
                    <td className="px-2 py-1"><Input type="number" className="h-7 text-xs bg-secondary border-border text-right w-20 ml-auto" value={editData.new_customers} onChange={e => setEditData({ ...editData, new_customers: Number(e.target.value) })} /></td>
                    <td className="px-2 py-1"><Input type="number" className="h-7 text-xs bg-secondary border-border text-right w-24 ml-auto" value={editData.net_profit} onChange={e => setEditData({ ...editData, net_profit: Number(e.target.value) })} /></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => setEditingId(null)}><X className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{Number(row.total_sales).toLocaleString("tr-TR")}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.order_count}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{Number(row.avg_cart_value || 0).toFixed(0)}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.new_customers}</td>
                    <td className="px-5 py-3 text-sm text-right text-accent font-mono">{Number(row.net_profit).toLocaleString("tr-TR")}</td>
                    {canEdit && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(row)}><Edit className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
