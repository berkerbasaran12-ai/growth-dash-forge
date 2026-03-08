import { useState, useEffect, useMemo } from "react";
import { format, parseISO, subDays, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DollarSign, TrendingUp, AlertCircle, Plus, Trash2, Calendar,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateFilter } from "@/components/dashboard/DateFilter";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const CATEGORY_TYPES = ["Operasyonel", "Outsource", "Maaş", "Reklam", "Temettü"];

interface ExpenseCategory {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface FinancialEntry {
  id: string;
  type: string;
  category_id: string | null;
  amount: number;
  description: string;
  date: string;
}

interface SalaryRecord {
  id: string;
  employee_name: string;
  amount: number;
  month: string;
}

const Finance = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [dateFilter, setDateFilter] = useState("30d");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Dialog states
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [entryDialogOpen, setEntryDialogOpen] = useState(false);
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);

  // Form states
  const [catForm, setCatForm] = useState({ name: "", type: "Operasyonel", color: "#3b82f6" });
  const [entryForm, setEntryForm] = useState({ type: "income", category_id: "", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
  const [salaryForm, setSalaryForm] = useState({ employee_name: "", amount: "", month: format(new Date(), "yyyy-MM") });

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "custom" && customRange.from && customRange.to) {
      return { from: customRange.from, to: customRange.to };
    }
    let days: number;
    switch (dateFilter) { case "today": days = 1; break; case "7d": days = 7; break; default: days = 30; }
    const from = dateFilter === "today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : subDays(now, days);
    return { from, to: now };
  };

  const fetchAll = async () => {
    if (!user) return;
    const { from, to } = getDateRange();
    const fmtFrom = format(from, "yyyy-MM-dd");
    const fmtTo = format(to, "yyyy-MM-dd");

    const [catRes, entryRes, salaryRes] = await Promise.all([
      supabase.from("expense_categories").select("*").eq("user_id", user.id),
      supabase.from("financial_entries").select("*").eq("user_id", user.id).gte("date", fmtFrom).lte("date", fmtTo).order("date", { ascending: false }),
      supabase.from("salary_records").select("*").eq("user_id", user.id).order("month", { ascending: false }),
    ]);

    setCategories((catRes.data || []) as unknown as ExpenseCategory[]);
    setEntries((entryRes.data || []) as unknown as FinancialEntry[]);
    setSalaries((salaryRes.data || []) as unknown as SalaryRecord[]);
  };

  useEffect(() => { fetchAll(); }, [user, dateFilter, customRange.from?.getTime(), customRange.to?.getTime()]);

  // Aggregates
  const totalIncome = useMemo(() => entries.filter(e => e.type === "income").reduce((s, e) => s + Number(e.amount), 0), [entries]);
  const totalExpense = useMemo(() => entries.filter(e => e.type === "expense").reduce((s, e) => s + Number(e.amount), 0), [entries]);
  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const formatK = (n: number) => {
    if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toLocaleString("tr-TR");
  };

  // Chart data - grouped by week
  const trendData = useMemo(() => {
    const grouped: Record<string, { date: string; income: number; expense: number }> = {};
    entries.forEach(e => {
      const weekKey = format(parseISO(e.date), "dd MMM", { locale: tr });
      if (!grouped[weekKey]) grouped[weekKey] = { date: weekKey, income: 0, expense: 0 };
      if (e.type === "income") grouped[weekKey].income += Number(e.amount);
      else grouped[weekKey].expense += Number(e.amount);
    });
    return Object.values(grouped).reverse();
  }, [entries]);

  // Pie chart data - expenses by category
  const pieData = useMemo(() => {
    const catMap: Record<string, { name: string; value: number; color: string }> = {};
    entries.filter(e => e.type === "expense").forEach(e => {
      const cat = categories.find(c => c.id === e.category_id);
      const key = cat?.id || "uncategorized";
      const name = cat?.name || "Diğer";
      const color = cat?.color || "#94a3b8";
      if (!catMap[key]) catMap[key] = { name, value: 0, color };
      catMap[key].value += Number(e.amount);
    });
    return Object.values(catMap);
  }, [entries, categories]);

  const recentExpenses = useMemo(() => entries.filter(e => e.type === "expense").slice(0, 10), [entries]);

  // Handlers
  const saveCategory = async () => {
    if (!user || !catForm.name.trim()) return;
    const { error } = await supabase.from("expense_categories").insert({
      user_id: user.id, name: catForm.name, type: catForm.type, color: catForm.color,
    });
    if (error) toast.error("Kaydedilemedi");
    else { toast.success("Kategori eklendi"); setCatDialogOpen(false); setCatForm({ name: "", type: "Operasyonel", color: "#3b82f6" }); fetchAll(); }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from("expense_categories").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else { toast.success("Kategori silindi"); fetchAll(); }
  };

  const saveEntry = async () => {
    if (!user || !entryForm.amount) return;
    const { error } = await supabase.from("financial_entries").insert({
      user_id: user.id, type: entryForm.type,
      category_id: entryForm.category_id || null,
      amount: Number(entryForm.amount), description: entryForm.description, date: entryForm.date,
    });
    if (error) toast.error("Kaydedilemedi");
    else {
      toast.success(entryForm.type === "income" ? "Gelir eklendi" : "Gider eklendi");
      setEntryDialogOpen(false);
      setEntryForm({ type: "income", category_id: "", amount: "", description: "", date: format(new Date(), "yyyy-MM-dd") });
      fetchAll();
    }
  };

  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from("financial_entries").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else { toast.success("Kayıt silindi"); fetchAll(); }
  };

  const saveSalary = async () => {
    if (!user || !salaryForm.employee_name || !salaryForm.amount) return;
    const { error } = await supabase.from("salary_records").insert({
      user_id: user.id, employee_name: salaryForm.employee_name,
      amount: Number(salaryForm.amount), month: salaryForm.month + "-01",
    });
    if (error) toast.error("Kaydedilemedi");
    else {
      toast.success("Maaş kaydedildi");
      setSalaryDialogOpen(false);
      setSalaryForm({ employee_name: "", amount: "", month: format(new Date(), "yyyy-MM") });
      fetchAll();
    }
  };

  const deleteSalary = async (id: string) => {
    const { error } = await supabase.from("salary_records").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else { toast.success("Kayıt silindi"); fetchAll(); }
  };

  const { from, to } = getDateRange();

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground tracking-tight">Gelir Gider Tablosu</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Finansal verilerinizi yönetin ve analiz edin</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <DateFilter dateFilter={dateFilter} onFilterChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
          </div>
        </div>

        {/* Date range info */}
        <Card className="border-border">
          <CardContent className="flex items-center gap-2 py-3 px-5">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Gösterilen Aralık: {format(from, "dd MMM yyyy", { locale: tr })} — {format(to, "dd MMM yyyy", { locale: tr })}
            </span>
          </CardContent>
        </Card>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Kategori Ekle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Yeni Gider Kategorisi</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Kategori Adı</Label>
                  <Input placeholder="ör: Pazarlama" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Tip</Label>
                  <Select value={catForm.type} onValueChange={v => setCatForm({ ...catForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Renk</Label>
                  <div className="flex items-center gap-3">
                    <input type="color" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="w-12 h-10 rounded-lg border border-border cursor-pointer" />
                    <Input value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} className="flex-1" />
                  </div>
                </div>
                <Button onClick={saveCategory} className="w-full">Kategori Ekle</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={entryDialogOpen} onOpenChange={setEntryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Gelir/Gider Ekle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Gelir/Gider Ekle</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Tip</Label>
                  <Select value={entryForm.type} onValueChange={v => setEntryForm({ ...entryForm, type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Gelir</SelectItem>
                      <SelectItem value="expense">Gider</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {entryForm.type === "expense" && (
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={entryForm.category_id} onValueChange={v => setEntryForm({ ...entryForm, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Tutar (₺)</Label>
                  <Input type="number" value={entryForm.amount} onChange={e => setEntryForm({ ...entryForm, amount: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input value={entryForm.description} onChange={e => setEntryForm({ ...entryForm, description: e.target.value })} placeholder="Açıklama yazın" />
                </div>
                <div className="space-y-2">
                  <Label>Tarih</Label>
                  <Input type="date" value={entryForm.date} onChange={e => setEntryForm({ ...entryForm, date: e.target.value })} />
                </div>
                <Button onClick={saveEntry} className="w-full">Kaydet</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={salaryDialogOpen} onOpenChange={setSalaryDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-4 w-4" /> Maaş Ekle</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Maaş Kaydı Ekle</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Çalışan Adı</Label>
                  <Input value={salaryForm.employee_name} onChange={e => setSalaryForm({ ...salaryForm, employee_name: e.target.value })} placeholder="Ad Soyad" />
                </div>
                <div className="space-y-2">
                  <Label>Tutar (₺)</Label>
                  <Input type="number" value={salaryForm.amount} onChange={e => setSalaryForm({ ...salaryForm, amount: e.target.value })} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Ay</Label>
                  <Input type="month" value={salaryForm.month} onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })} />
                </div>
                <Button onClick={saveSalary} className="w-full">Kaydet</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">Toplam Gelir</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatK(totalIncome)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">Toplam Gider</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatK(totalExpense)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">Net Kar</p>
              <p className={`text-2xl font-bold mt-1 ${netProfit >= 0 ? "text-primary" : "text-destructive"}`}>{formatK(netProfit)}</p>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-5 pb-4 px-5">
              <p className="text-sm text-muted-foreground">Kar Marjı</p>
              <p className={`text-2xl font-bold mt-1 ${profitMargin >= 0 ? "text-primary" : "text-destructive"}`}>%{profitMargin.toFixed(1)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base">Gider Dağılımı</CardTitle></CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} %${(percent * 100).toFixed(0)}`}>
                      {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `₺${v.toLocaleString("tr-TR")}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">Veri yok</div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-base">Gelir-Gider Trendi</CardTitle></CardHeader>
            <CardContent>
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(v: number) => `₺${v.toLocaleString("tr-TR")}`} />
                    <Legend />
                    <Line type="monotone" dataKey="income" name="Gelir" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="expense" name="Gider" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px] text-sm text-muted-foreground">Veri yok</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border">
            <CardHeader><CardTitle className="text-base">Son Giderler</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tip</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Tarih</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentExpenses.length > 0 ? recentExpenses.map(e => {
                    const cat = categories.find(c => c.id === e.category_id);
                    return (
                      <TableRow key={e.id}>
                        <TableCell>
                          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: cat?.color || "#94a3b8" }} />
                          {e.description || "—"}
                        </TableCell>
                        <TableCell>{cat?.name || "—"}</TableCell>
                        <TableCell>₺{Number(e.amount).toLocaleString("tr-TR")}</TableCell>
                        <TableCell>{format(parseISO(e.date), "dd.MM.yyyy")}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteEntry(e.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  }) : (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Henüz gider kaydı yok</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader><CardTitle className="text-base">Maaş Kayıtları</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Çalışan</TableHead>
                    <TableHead>Tutar</TableHead>
                    <TableHead>Ay</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.length > 0 ? salaries.map(s => (
                    <TableRow key={s.id}>
                      <TableCell>{s.employee_name}</TableCell>
                      <TableCell>₺{Number(s.amount).toLocaleString("tr-TR")}</TableCell>
                      <TableCell>{format(parseISO(s.month), "MMMM yyyy", { locale: tr })}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteSalary(s.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Henüz maaş kaydı yok</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Categories */}
        <Card className="border-border">
          <CardHeader><CardTitle className="text-base">Gider Kategorileri</CardTitle></CardHeader>
          <CardContent>
            {categories.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {categories.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0" onClick={() => deleteCategory(c.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Henüz kategori oluşturulmadı</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Finance;
