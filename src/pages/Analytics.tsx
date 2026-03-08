import { useState, useEffect, useMemo } from "react";
import { format, subWeeks, parseISO, startOfWeek } from "date-fns";
import { tr } from "date-fns/locale";
import {
  TrendingUp, DollarSign, Users, Target, BarChart3, Percent,
  Zap, CheckCircle2, AlertTriangle, Info, Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from "recharts";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const Analytics = () => {
  const { user, effectiveUserId } = useAuth();
  const targetUserId = effectiveUserId;

  const [salesMetrics, setSalesMetrics] = useState<any[]>([]);
  const [marketingMetrics, setMarketingMetrics] = useState<any[]>([]);
  const [financialEntries, setFinancialEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const weeks12Ago = format(subWeeks(new Date(), 12), "yyyy-MM-dd");

  useEffect(() => {
    if (!targetUserId) return;
    setLoading(true);
    Promise.all([
      supabase.from("sales_metrics").select("*").eq("user_id", targetUserId).gte("date", weeks12Ago).order("date"),
      supabase.from("marketing_metrics").select("*").eq("user_id", targetUserId).gte("date", weeks12Ago).order("date"),
      supabase.from("financial_entries").select("*").eq("user_id", targetUserId).gte("date", weeks12Ago).order("date"),
    ]).then(([s, m, f]) => {
      setSalesMetrics(s.data || []);
      setMarketingMetrics(m.data || []);
      setFinancialEntries(f.data || []);
      setLoading(false);
    });
  }, [targetUserId]);

  // Aggregations
  const sum = (arr: any[], key: string) => arr.reduce((s, m) => s + Number(m[key] || 0), 0);
  const avg = (arr: any[], key: string) => arr.length > 0 ? sum(arr, key) / arr.length : 0;

  const totalSales = sum(salesMetrics, "total_sales");
  const totalExpenses = financialEntries.filter(e => e.type === "expense").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalIncome = financialEntries.filter(e => e.type === "income").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit = totalSales > 0 ? totalSales - totalExpenses : totalIncome - totalExpenses;
  const ciro = totalSales > 0 ? totalSales : totalIncome;

  const totalLeads = sum(salesMetrics, "leads_received");
  const totalOrders = sum(salesMetrics, "order_count");
  const totalAppointments = sum(salesMetrics, "appointments");
  const closedSales = totalOrders;
  const winRate = avg(salesMetrics, "win_rate");
  const conversionRate = totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0;

  const mktSpend = sum(marketingMetrics, "spend");
  const mktLeads = sum(marketingMetrics, "leads");
  const cac = mktLeads > 0 ? mktSpend / mktLeads : 0;
  const roi = mktSpend > 0 ? ((ciro - mktSpend) / mktSpend) * 100 : 0;
  const roas = mktSpend > 0 ? (ciro / mktSpend) * 100 : 0;
  const profitability = ciro > 0 ? (netProfit / ciro) * 100 : 0;

  const avgWeeklyCiro = salesMetrics.length > 0 ? ciro / Math.max(1, Math.ceil(salesMetrics.length / 7)) : 0;
  const weeklyAvgExpense = totalExpenses / 12;

  // Trend chart data - weekly
  const trendData = useMemo(() => {
    const weekMap: Record<string, { week: string; ciro: number; masraf: number }> = {};
    salesMetrics.forEach((m: any) => {
      const wk = format(startOfWeek(parseISO(m.date), { weekStartsOn: 1 }), "dd MMM", { locale: tr });
      if (!weekMap[wk]) weekMap[wk] = { week: wk, ciro: 0, masraf: 0 };
      weekMap[wk].ciro += Number(m.total_sales);
    });
    financialEntries.filter((e: any) => e.type === "expense").forEach((e: any) => {
      const wk = format(startOfWeek(parseISO(e.date), { weekStartsOn: 1 }), "dd MMM", { locale: tr });
      if (!weekMap[wk]) weekMap[wk] = { week: wk, ciro: 0, masraf: 0 };
      weekMap[wk].masraf += Number(e.amount);
    });
    return Object.values(weekMap);
  }, [salesMetrics, financialEntries]);

  // Leads & Sales bar chart
  const leadsBarData = useMemo(() => {
    const weekMap: Record<string, { week: string; leads: number; sales: number }> = {};
    salesMetrics.forEach((m: any) => {
      const wk = format(startOfWeek(parseISO(m.date), { weekStartsOn: 1 }), "dd MMM", { locale: tr });
      if (!weekMap[wk]) weekMap[wk] = { week: wk, leads: 0, sales: 0 };
      weekMap[wk].leads += Number(m.leads_received || 0);
      weekMap[wk].sales += Number(m.order_count || 0);
    });
    return Object.values(weekMap);
  }, [salesMetrics]);

  // Funnel data
  const funnelSteps = [
    { label: "Leads", value: totalLeads, pct: 100 },
    { label: "Planlanan", value: totalAppointments, pct: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0 },
    { label: "Toplantı", value: totalAppointments, pct: totalLeads > 0 ? (totalAppointments / totalLeads) * 100 : 0 },
    { label: "Satış", value: closedSales, pct: totalLeads > 0 ? (closedSales / totalLeads) * 100 : 0 },
  ];

  // Pie data for funnel
  const funnelPie = [
    { name: "Leads", value: totalLeads || 1 },
    { name: "Sales", value: closedSales || 0 },
    { name: "Meetings", value: totalAppointments || 0 },
  ];

  const getStatusBadge = (value: number, thresholds: { good: number; mid: number }) => {
    if (value >= thresholds.good) return <Badge className="bg-primary/20 text-primary border-0">✓ İyi</Badge>;
    if (value >= thresholds.mid) return <Badge variant="outline" className="text-amber-500 border-amber-300">● Orta</Badge>;
    return <Badge variant="outline" className="text-destructive border-destructive/30">▲ Geliştirilsin</Badge>;
  };

  // All metrics summary table
  const allMetrics = [
    { name: "Net Kar", value: `₺${netProfit.toLocaleString("tr-TR")}`, status: netProfit > 0 ? "good" : "bad" },
    { name: "Toplam Ciro", value: `₺${ciro.toLocaleString("tr-TR")}`, status: ciro > 0 ? "good" : "bad" },
    { name: "Toplam Masraf", value: `₺${totalExpenses.toLocaleString("tr-TR")}`, status: totalExpenses < ciro * 0.5 ? "good" : "mid" },
    { name: "Satış Kapama Oranı", value: `${winRate.toFixed(0)}%`, status: winRate >= 25 ? "good" : "mid" },
    { name: "Dönüşüm Oranı", value: `${conversionRate.toFixed(0)}%`, status: conversionRate >= 10 ? "good" : "mid" },
  ];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 max-w-7xl">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">Detaylı Analiz Paneli</h1>
          <p className="text-sm text-muted-foreground mt-1">Son 12 haftalık kapsamlı iş zekası ve performans özeti</p>
        </div>

        {/* 12 Haftalık Özet */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> 12 Haftalık Özet
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Net Kar</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">₺{netProfit.toLocaleString("tr-TR")}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Ciro</p>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">₺{ciro.toLocaleString("tr-TR")}</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Dönüşüm Oranı</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{conversionRate.toFixed(0)}%</p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-muted-foreground">Kapama Oranı</p>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold text-foreground">{winRate.toFixed(0)}%</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Trend Analizi */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Trend Analizi (12 Hafta)
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="border-border lg:col-span-2">
              <CardHeader><CardTitle className="text-sm">Gelir & Kâr Trendi</CardTitle>
                <p className="text-xs text-muted-foreground">Haftalık performans eğilimi</p>
              </CardHeader>
              <CardContent>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="week" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip formatter={(v: number) => `₺${v.toLocaleString("tr-TR")}`} />
                      <Legend />
                      <Line type="monotone" dataKey="ciro" name="Ciro" stroke="hsl(var(--primary))" strokeWidth={2} dot />
                      <Line type="monotone" dataKey="masraf" name="Masraf" stroke="hsl(var(--destructive))" strokeWidth={2} dot />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Henüz veri yok</div>
                )}
              </CardContent>
            </Card>
            <Card className="border-border bg-accent/20">
              <CardHeader><CardTitle className="text-sm">Anahtar Göstergeler</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Toplam Leads", value: totalLeads },
                  { label: "Kapalı Satışlar", value: closedSales },
                  { label: "Toplantılar", value: totalAppointments },
                  { label: "ROAS", value: `${roas.toFixed(0)}%` },
                  { label: "Avg Haftalık Ciro", value: `₺${avgWeeklyCiro.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-bold text-foreground">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Satış Hunisi Analizi */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" /> Satış Hunisi Analizi
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm flex items-center justify-between">
                <span>Satış Hunisi</span>
                <span className="text-lg font-bold">{conversionRate.toFixed(0)}%</span>
              </CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {funnelSteps.map((step, i) => {
                  const colors = ["bg-primary", "bg-blue-400", "bg-amber-400", "bg-green-500"];
                  const lossFromPrev = i > 0 ? funnelSteps[i - 1].pct - step.pct : 0;
                  return (
                    <div key={i}>
                      {i > 0 && (
                        <p className="text-xs text-destructive mb-1">↓ {lossFromPrev.toFixed(0)}% kayıp</p>
                      )}
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{step.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{step.value}</span>
                          <Badge variant="outline" className="text-xs">{step.pct.toFixed(0)}%</Badge>
                        </div>
                      </div>
                      <Progress value={step.pct} className="h-2" />
                    </div>
                  );
                })}
                <div className="flex items-center justify-around pt-3 border-t border-border">
                  {[
                    { label: "Leads", value: totalLeads },
                    { label: "Plan", value: totalAppointments },
                    { label: "Mtg", value: totalAppointments },
                    { label: "Satış", value: closedSales },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <p className="text-lg font-bold text-primary">{item.value}</p>
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader><CardTitle className="text-sm">Dönüşüm Kanalları</CardTitle>
                <p className="text-xs text-muted-foreground">Lead → Satış akışı</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={funnelPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {funnelPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* İleri Metrikler */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> İleri Metrikler
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "CAC", value: `₺${cac.toFixed(0)}`, icon: Target },
              { label: "ROI", value: `${roi.toFixed(0)}%`, icon: TrendingUp },
              { label: "ROAS", value: `${roas.toFixed(0)}%`, icon: BarChart3 },
              { label: "Karlılık", value: `${profitability.toFixed(0)}%`, icon: DollarSign },
            ].map((item, i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-5 pb-4 px-5">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{item.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Leads & Satış Trendi */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Leads & Satış Trendi
          </h2>
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-sm">Haftalık Leads vs Kapalı Satışlar</CardTitle>
              <p className="text-xs text-muted-foreground">12 haftalık dönüşüm analizi</p>
            </CardHeader>
            <CardContent>
              {leadsBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={leadsBarData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="leads" name="Leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sales" name="Satış" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">Henüz veri yok</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Masraf Analizi */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Masraf Analizi
          </h2>
          <Card className="border-border">
            <CardHeader><CardTitle className="text-sm">Toplam Masraf Dağılımı</CardTitle>
              <p className="text-xs text-muted-foreground">12 haftalık harcama özeti</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Toplam Masraf</p>
                  <p className="text-xl font-bold text-foreground mt-1">₺{totalExpenses.toLocaleString("tr-TR")}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-xs text-muted-foreground">Haftalık Ort.</p>
                  <p className="text-xl font-bold text-foreground mt-1">₺{weeklyAvgExpense.toLocaleString("tr-TR", { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/30">
                  <p className="text-xs text-muted-foreground">Reklam Harcı</p>
                  <p className="text-xl font-bold text-primary mt-1">₺{mktSpend.toLocaleString("tr-TR")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performans Değerlendirmesi */}
        <div>
          <h2 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" /> Performans Değerlendirmesi
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Karlılık Sağlığı", value: profitability, thresholds: { good: 40, mid: 20 } },
              { label: "Satış Verimliliği", value: winRate, thresholds: { good: 30, mid: 15 } },
              { label: "Lead Kalitesi", value: conversionRate, thresholds: { good: 10, mid: 5 } },
              { label: "Yatırım Getirisi", value: roi, thresholds: { good: 100, mid: 50 } },
            ].map((item, i) => (
              <Card key={i} className="border-border">
                <CardContent className="pt-5 pb-4 px-5">
                  <p className="text-sm text-muted-foreground mb-2">{item.label}</p>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-foreground">{item.value.toFixed(0)}%</p>
                    {getStatusBadge(item.value, item.thresholds)}
                  </div>
                  <Progress value={Math.min(item.value, 100)} className="h-1.5 mt-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Tüm Metrikler Özeti */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Tüm Metrikler Özeti</h2>
          <Card className="border-border">
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrik</TableHead>
                    <TableHead className="text-right">Değer</TableHead>
                    <TableHead className="text-right">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMetrics.map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell className="text-right">{m.value}</TableCell>
                      <TableCell className="text-right">
                        {m.status === "good" ? (
                          <Badge className="bg-primary/20 text-primary border-0">✓ İyi</Badge>
                        ) : m.status === "mid" ? (
                          <Badge variant="outline" className="text-amber-500 border-amber-300">● Orta</Badge>
                        ) : (
                          <Badge variant="outline" className="text-destructive border-destructive/30">▲ Düşük</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
