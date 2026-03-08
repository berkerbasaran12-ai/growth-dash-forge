import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingCart, Users, DollarSign, Plus, Calendar,
  ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const Dashboard = () => {
  const { user, effectiveUserId, isTeamMember, teamMembership } = useAuth();
  const [dateFilter, setDateFilter] = useState("7d");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = !isTeamMember || teamMembership?.permission === "full";

  const fetchMetrics = async () => {
    if (!effectiveUserId) return;
    setLoading(true);

    let fromDate: Date;
    const now = new Date();
    switch (dateFilter) {
      case "today": fromDate = new Date(now.setHours(0, 0, 0, 0)); break;
      case "30d": fromDate = subDays(now, 30); break;
      default: fromDate = subDays(now, 7);
    }

    const { data, error } = await supabase
      .from("sales_metrics")
      .select("*")
      .eq("user_id", effectiveUserId)
      .gte("date", format(fromDate, "yyyy-MM-dd"))
      .order("date", { ascending: true });

    if (error) { toast.error("Veriler yüklenemedi"); }
    else { setMetrics(data || []); }
    setLoading(false);
  };

  useEffect(() => { fetchMetrics(); }, [effectiveUserId, dateFilter]);

  const totalSales = metrics.reduce((s, m) => s + Number(m.total_sales), 0);
  const totalOrders = metrics.reduce((s, m) => s + m.order_count, 0);
  const avgCart = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalNewCustomers = metrics.reduce((s, m) => s + m.new_customers, 0);

  const chartData = metrics.map((m) => ({
    date: format(parseISO(m.date), "dd MMM", { locale: tr }),
    sales: Number(m.total_sales),
    orders: m.order_count,
    newCustomers: m.new_customers,
    profit: Number(m.net_profit),
  }));

  const summaryCards = [
    { title: "Toplam Satış", value: `₺${totalSales.toLocaleString("tr-TR")}`, icon: DollarSign },
    { title: "Sipariş Adedi", value: totalOrders.toString(), icon: ShoppingCart },
    { title: "Ort. Sepet", value: `₺${avgCart.toFixed(0)}`, icon: TrendingUp },
    { title: "Yeni Müşteri", value: totalNewCustomers.toString(), icon: Users },
  ];

  const handleSave = async (formData: any) => {
    if (!effectiveUserId) return;
    const { error } = await supabase.from("sales_metrics").upsert({
      user_id: effectiveUserId,
      date: formData.date,
      total_sales: Number(formData.totalSales),
      order_count: Number(formData.orderCount),
      new_customers: Number(formData.newCustomers),
      returning_customers: Number(formData.returningCustomers),
      net_profit: Number(formData.netProfit),
    }, { onConflict: "user_id,date" });

    if (error) toast.error("Kaydedilemedi: " + error.message);
    else { toast.success("Veri kaydedildi"); fetchMetrics(); }
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Satış metriklerinizi takip edin</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[160px] bg-secondary border-border h-9 text-sm">
                <Calendar className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Bugün</SelectItem>
                <SelectItem value="7d">Son 7 Gün</SelectItem>
                <SelectItem value="30d">Son 30 Gün</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">
                  <Plus className="h-4 w-4 mr-1.5" /> Veri Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader><DialogTitle className="text-foreground">Yeni Satış Verisi</DialogTitle></DialogHeader>
                <DataEntryForm onSave={handleSave} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.title}</span>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="text-2xl font-semibold text-foreground block">{card.value}</span>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {chartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Satış Trendi</h3>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: '8px', color: 'hsl(0, 0%, 95%)', fontSize: 12 }} />
                  <Area type="monotone" dataKey="sales" stroke="hsl(210, 100%, 56%)" fill="url(#salesGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Sipariş & Müşteri</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: '8px', color: 'hsl(0, 0%, 95%)', fontSize: 12 }} />
                  <Bar dataKey="orders" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="newCustomers" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}

        {/* Data Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-xl overflow-hidden">
          <div className="p-5 border-b border-border"><h3 className="text-sm font-medium text-foreground">Geçmiş Veriler</h3></div>
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
                </tr>
              </thead>
              <tbody>
                {metrics.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz veri yok. "Veri Ekle" ile başlayın.</td></tr>
                ) : metrics.map((row) => (
                  <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">{format(parseISO(row.date), "dd MMM yyyy", { locale: tr })}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{Number(row.total_sales).toLocaleString("tr-TR")}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.order_count}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{Number(row.avg_cart_value).toFixed(0)}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.new_customers}</td>
                    <td className="px-5 py-3 text-sm text-right text-accent font-mono">{Number(row.net_profit).toLocaleString("tr-TR")}</td>
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

function DataEntryForm({ onSave }: { onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    totalSales: '', orderCount: '', newCustomers: '', returningCustomers: '', netProfit: '',
  });

  const avgCart = formData.totalSales && formData.orderCount
    ? (Number(formData.totalSales) / Number(formData.orderCount)).toFixed(2) : '0.00';

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tarih</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Toplam Satış (₺)</Label>
          <Input type="number" placeholder="0.00" value={formData.totalSales} onChange={e => setFormData({...formData, totalSales: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sipariş Adedi</Label>
          <Input type="number" placeholder="0" value={formData.orderCount} onChange={e => setFormData({...formData, orderCount: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ort. Sepet Değeri (₺)</Label>
          <Input type="text" value={avgCart} readOnly className="bg-muted border-border h-9 text-sm text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Yeni Müşteri</Label>
          <Input type="number" placeholder="0" value={formData.newCustomers} onChange={e => setFormData({...formData, newCustomers: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tekrar Eden Müşteri</Label>
          <Input type="number" placeholder="0" value={formData.returningCustomers} onChange={e => setFormData({...formData, returningCustomers: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Net Kar (₺)</Label>
          <Input type="number" placeholder="0.00" value={formData.netProfit} onChange={e => setFormData({...formData, netProfit: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90">Kaydet</Button>
      </div>
    </form>
  );
}

export default Dashboard;
