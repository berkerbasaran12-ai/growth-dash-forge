import { useState } from "react";
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
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from "recharts";
import { AppLayout } from "@/components/layout/AppLayout";

// Mock data
const mockData = [
  { date: "01 Mar", sales: 12500, orders: 45, newCustomers: 8, profit: 3200 },
  { date: "02 Mar", sales: 15800, orders: 52, newCustomers: 12, profit: 4100 },
  { date: "03 Mar", sales: 11200, orders: 38, newCustomers: 5, profit: 2800 },
  { date: "04 Mar", sales: 18900, orders: 61, newCustomers: 15, profit: 5200 },
  { date: "05 Mar", sales: 22100, orders: 73, newCustomers: 18, profit: 6400 },
  { date: "06 Mar", sales: 19500, orders: 58, newCustomers: 10, profit: 5100 },
  { date: "07 Mar", sales: 24300, orders: 82, newCustomers: 22, profit: 7200 },
];

const summaryCards = [
  { title: "Toplam Satış", value: "₺124,300", change: "+12.5%", up: true, icon: DollarSign },
  { title: "Sipariş Adedi", value: "409", change: "+8.2%", up: true, icon: ShoppingCart },
  { title: "Ort. Sepet", value: "₺303.91", change: "+3.7%", up: true, icon: TrendingUp },
  { title: "Yeni Müşteri", value: "90", change: "-2.1%", up: false, icon: Users },
];

const Dashboard = () => {
  const [dateFilter, setDateFilter] = useState("7d");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        {/* Header */}
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
                <SelectItem value="custom">Özel Tarih</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">
                  <Plus className="h-4 w-4 mr-1.5" />
                  Veri Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-border">
                <DialogHeader>
                  <DialogTitle className="text-foreground">Yeni Satış Verisi</DialogTitle>
                </DialogHeader>
                <DataEntryForm onClose={() => setDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-5 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.title}</span>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-semibold text-foreground">{card.value}</span>
                <span className={`flex items-center text-xs font-medium ${card.up ? 'text-accent' : 'text-destructive'}`}>
                  {card.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {card.change}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">Satış Trendi</h3>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 8%)',
                    border: '1px solid hsl(0, 0%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(0, 0%, 95%)',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="hsl(210, 100%, 56%)" fill="url(#salesGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-xl p-5"
          >
            <h3 className="text-sm font-medium text-foreground mb-4">Sipariş & Müşteri</h3>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={mockData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 8%)',
                    border: '1px solid hsl(0, 0%, 16%)',
                    borderRadius: '8px',
                    color: 'hsl(0, 0%, 95%)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="orders" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="newCustomers" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Data Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl overflow-hidden"
        >
          <div className="p-5 border-b border-border">
            <h3 className="text-sm font-medium text-foreground">Geçmiş Veriler</h3>
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
                </tr>
              </thead>
              <tbody>
                {mockData.map((row) => (
                  <tr key={row.date} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 text-sm text-foreground">{row.date}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.sales.toLocaleString()}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.orders}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{(row.sales / row.orders).toFixed(0)}</td>
                    <td className="px-5 py-3 text-sm text-right text-foreground font-mono">{row.newCustomers}</td>
                    <td className="px-5 py-3 text-sm text-right text-accent font-mono">{row.profit.toLocaleString()}</td>
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

function DataEntryForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    totalSales: '',
    orderCount: '',
    newCustomers: '',
    returningCustomers: '',
    netProfit: '',
  });

  const avgCart = formData.totalSales && formData.orderCount
    ? (Number(formData.totalSales) / Number(formData.orderCount)).toFixed(2)
    : '0.00';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save to database
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tarih</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Toplam Satış (₺)</Label>
          <Input type="number" placeholder="0.00" value={formData.totalSales} onChange={e => setFormData({...formData, totalSales: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sipariş Adedi</Label>
          <Input type="number" placeholder="0" value={formData.orderCount} onChange={e => setFormData({...formData, orderCount: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
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
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-9 text-sm border-border">İptal</Button>
        <Button type="submit" className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90">Kaydet</Button>
      </div>
    </form>
  );
}

export default Dashboard;
