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
  type: "sales" | "marketing";
}

function exportCSV(metrics: any[], type: string) {
  let headers: string[];
  let mapRow: (r: any) => any[];

  if (type === "marketing") {
    headers = ["Tarih", "Kanal", "Harcama", "Trafik", "Dönüşüm", "Lead", "CPC", "CPM", "Etkileşim %", "ROAS"];
    mapRow = r => [r.date, r.channel, r.spend, r.traffic, r.conversions, r.leads, r.cpc, r.cpm, r.engagement_rate, r.roas];
  } else {
    headers = ["Tarih", "Satış", "Sipariş", "Lead", "Randevu", "Kapatma %", "ACV", "Yeni Müşteri", "Tekrar Müş.", "Kayıp %", "LTV", "Net Kar"];
    mapRow = r => [r.date, r.total_sales, r.order_count, r.leads_received, r.appointments, r.win_rate, r.avg_deal_value, r.new_customers, r.returning_customers, r.churn_rate, r.ltv, r.net_profit];
  }

  const csv = [headers.join(","), ...metrics.map(r => mapRow(r).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-verileri-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const CHANNEL_LABELS: Record<string, string> = {
  google_ads: "Google Ads", meta: "Meta", seo: "SEO", linkedin: "LinkedIn", other: "Diğer",
};

export function MetricsTable({ metrics, canEdit, onRefresh, type }: MetricsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>({});
  const table = type === "marketing" ? "marketing_metrics" : "sales_metrics";

  const startEdit = (row: any) => {
    setEditingId(row.id);
    if (type === "marketing") {
      setEditData({ spend: Number(row.spend), traffic: row.traffic, conversions: row.conversions, leads: row.leads, cpc: Number(row.cpc), cpm: Number(row.cpm), engagement_rate: Number(row.engagement_rate), roas: Number(row.roas) });
    } else {
      setEditData({ total_sales: Number(row.total_sales), order_count: row.order_count, leads_received: row.leads_received, appointments: row.appointments, win_rate: Number(row.win_rate), avg_deal_value: Number(row.avg_deal_value), new_customers: row.new_customers, returning_customers: row.returning_customers, churn_rate: Number(row.churn_rate), ltv: Number(row.ltv), net_profit: Number(row.net_profit) });
    }
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const { error } = await supabase.from(table).update(editData).eq("id", editingId);
    if (error) toast.error("Güncellenemedi");
    else { toast.success("Güncellendi"); onRefresh(); }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu veriyi silmek istediğinizden emin misiniz?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else { toast.success("Silindi"); onRefresh(); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-xl overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Geçmiş Veriler</h3>
        {metrics.length > 0 && (
          <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => exportCSV(metrics, type)}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> CSV İndir
          </Button>
        )}
      </div>
      <div className="overflow-x-auto">
        {type === "marketing" ? (
          <MarketingTable metrics={metrics} canEdit={canEdit} editingId={editingId} editData={editData} setEditData={setEditData} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={() => setEditingId(null)} handleDelete={handleDelete} />
        ) : (
          <SalesTable metrics={metrics} canEdit={canEdit} editingId={editingId} editData={editData} setEditData={setEditData} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={() => setEditingId(null)} handleDelete={handleDelete} />
        )}
      </div>
    </motion.div>
  );
}

function EditInput({ value, onChange, className = "w-20" }: { value: any; onChange: (v: number) => void; className?: string }) {
  return <Input type="number" className={`h-7 text-xs bg-secondary border-border text-right ml-auto ${className}`} value={value} onChange={e => onChange(Number(e.target.value))} />;
}

function ActionButtons({ row, canEdit, editingId, startEdit, saveEdit, cancelEdit, handleDelete }: any) {
  if (!canEdit) return null;
  if (editingId === row.id) {
    return (
      <td className="px-3 py-3 text-right">
        <div className="flex gap-1 justify-end">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-accent" onClick={saveEdit}><Check className="h-3.5 w-3.5" /></Button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground" onClick={cancelEdit}><X className="h-3.5 w-3.5" /></Button>
        </div>
      </td>
    );
  }
  return (
    <td className="px-3 py-3 text-right">
      <div className="flex gap-1 justify-end">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground" onClick={() => startEdit(row)}><Edit className="h-3.5 w-3.5" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(row.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </td>
  );
}

function MarketingTable({ metrics, canEdit, editingId, editData, setEditData, startEdit, saveEdit, cancelEdit, handleDelete }: any) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {["Tarih", "Kanal", "Harcama", "Trafik", "Dönüşüm", "Lead", "CPC", "CPM", "Etkileşim %", "ROAS"].map((h, i) => (
            <th key={h} className={`text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-3 ${i < 2 ? "text-left" : "text-right"}`}>{h}</th>
          ))}
          {canEdit && <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-3">İşlem</th>}
        </tr>
      </thead>
      <tbody>
        {metrics.length === 0 ? (
          <tr><td colSpan={canEdit ? 11 : 10} className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz veri yok</td></tr>
        ) : metrics.map((row: any) => (
          <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
            <td className="px-3 py-3 text-sm text-foreground">{format(parseISO(row.date), "dd MMM", { locale: tr })}</td>
            <td className="px-3 py-3 text-sm text-foreground">{CHANNEL_LABELS[row.channel] || row.channel}</td>
            {editingId === row.id ? (
              <>
                <td className="px-1 py-1"><EditInput value={editData.spend} onChange={v => setEditData({ ...editData, spend: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.traffic} onChange={v => setEditData({ ...editData, traffic: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.conversions} onChange={v => setEditData({ ...editData, conversions: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.leads} onChange={v => setEditData({ ...editData, leads: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.cpc} onChange={v => setEditData({ ...editData, cpc: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.cpm} onChange={v => setEditData({ ...editData, cpm: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.engagement_rate} onChange={v => setEditData({ ...editData, engagement_rate: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.roas} onChange={v => setEditData({ ...editData, roas: v })} /></td>
              </>
            ) : (
              <>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">₺{Number(row.spend).toLocaleString("tr-TR")}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.traffic}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.conversions}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.leads}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">₺{Number(row.cpc).toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">₺{Number(row.cpm).toFixed(2)}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">%{Number(row.engagement_rate).toFixed(1)}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-accent">{Number(row.roas).toFixed(2)}x</td>
              </>
            )}
            <ActionButtons row={row} canEdit={canEdit} editingId={editingId} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={cancelEdit} handleDelete={handleDelete} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function SalesTable({ metrics, canEdit, editingId, editData, setEditData, startEdit, saveEdit, cancelEdit, handleDelete }: any) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-border">
          {["Tarih", "Satış (₺)", "Sipariş", "Lead", "Randevu", "Kapatma %", "ACV (₺)", "Yeni Müş.", "Tekrar Müş.", "Kayıp %", "LTV (₺)", "Net Kar (₺)"].map((h, i) => (
            <th key={h} className={`text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-3 ${i === 0 ? "text-left" : "text-right"}`}>{h}</th>
          ))}
          {canEdit && <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-3">İşlem</th>}
        </tr>
      </thead>
      <tbody>
        {metrics.length === 0 ? (
          <tr><td colSpan={canEdit ? 13 : 12} className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz veri yok</td></tr>
        ) : metrics.map((row: any) => (
          <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
            <td className="px-3 py-3 text-sm text-foreground">{format(parseISO(row.date), "dd MMM", { locale: tr })}</td>
            {editingId === row.id ? (
              <>
                <td className="px-1 py-1"><EditInput value={editData.total_sales} onChange={v => setEditData({ ...editData, total_sales: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.order_count} onChange={v => setEditData({ ...editData, order_count: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.leads_received} onChange={v => setEditData({ ...editData, leads_received: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.appointments} onChange={v => setEditData({ ...editData, appointments: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.win_rate} onChange={v => setEditData({ ...editData, win_rate: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.avg_deal_value} onChange={v => setEditData({ ...editData, avg_deal_value: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.new_customers} onChange={v => setEditData({ ...editData, new_customers: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.returning_customers} onChange={v => setEditData({ ...editData, returning_customers: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.churn_rate} onChange={v => setEditData({ ...editData, churn_rate: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.ltv} onChange={v => setEditData({ ...editData, ltv: v })} /></td>
                <td className="px-1 py-1"><EditInput value={editData.net_profit} onChange={v => setEditData({ ...editData, net_profit: v })} /></td>
              </>
            ) : (
              <>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{Number(row.total_sales).toLocaleString("tr-TR")}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.order_count}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.leads_received || 0}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.appointments || 0}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">%{Number(row.win_rate || 0).toFixed(1)}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{Number(row.avg_deal_value || 0).toLocaleString("tr-TR")}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{row.new_customers}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">%{Number(row.churn_rate || 0).toFixed(1)}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-foreground">{Number(row.ltv || 0).toLocaleString("tr-TR")}</td>
                <td className="px-3 py-3 text-sm text-right font-mono text-accent">{Number(row.net_profit).toLocaleString("tr-TR")}</td>
              </>
            )}
            <ActionButtons row={row} canEdit={canEdit} editingId={editingId} startEdit={startEdit} saveEdit={saveEdit} cancelEdit={cancelEdit} handleDelete={handleDelete} />
          </tr>
        ))}
      </tbody>
    </table>
  );
}
