import { useState, useEffect } from "react";
import { Plus, Megaphone, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Target, BarChart3,
  MousePointerClick, Eye, Percent, Repeat, CalendarCheck, UserMinus, Gem,
} from "lucide-react";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { MarketingCharts, SalesCharts } from "@/components/dashboard/DashboardCharts";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { MarketingEntryForm, SalesEntryForm } from "@/components/dashboard/DataEntryForm";

const Dashboard = () => {
  const { effectiveUserId, isTeamMember, teamMembership } = useAuth();
  const [tab, setTab] = useState("marketing");
  const [dateFilter, setDateFilter] = useState("7d");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dialogOpen, setDialogOpen] = useState(false);

  const [salesMetrics, setSalesMetrics] = useState<any[]>([]);
  const [prevSalesMetrics, setPrevSalesMetrics] = useState<any[]>([]);
  const [marketingMetrics, setMarketingMetrics] = useState<any[]>([]);
  const [prevMarketingMetrics, setPrevMarketingMetrics] = useState<any[]>([]);

  const canEdit = !isTeamMember || teamMembership?.permission === "full";

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "custom" && customRange.from && customRange.to) {
      const diff = customRange.to.getTime() - customRange.from.getTime();
      return { from: customRange.from, to: customRange.to, prevFrom: new Date(customRange.from.getTime() - diff), prevTo: new Date(customRange.from.getTime() - 1) };
    }
    let days: number;
    switch (dateFilter) { case "today": days = 1; break; case "30d": days = 30; break; default: days = 7; }
    const from = dateFilter === "today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : subDays(now, days);
    return { from, to: now, prevFrom: subDays(from, days), prevTo: subDays(from, 1) };
  };

  const fetchData = async () => {
    if (!effectiveUserId) return;
    const { from, to, prevFrom, prevTo } = getDateRange();
    const fmtFrom = format(from, "yyyy-MM-dd");
    const fmtTo = format(to, "yyyy-MM-dd");
    const fmtPrevFrom = format(prevFrom, "yyyy-MM-dd");
    const fmtPrevTo = format(prevTo, "yyyy-MM-dd");

    const [salesCur, salesPrev, mktCur, mktPrev] = await Promise.all([
      supabase.from("sales_metrics").select("*").eq("user_id", effectiveUserId).gte("date", fmtFrom).lte("date", fmtTo).order("date"),
      supabase.from("sales_metrics").select("*").eq("user_id", effectiveUserId).gte("date", fmtPrevFrom).lte("date", fmtPrevTo),
      supabase.from("marketing_metrics").select("*").eq("user_id", effectiveUserId).gte("date", fmtFrom).lte("date", fmtTo).order("date"),
      supabase.from("marketing_metrics").select("*").eq("user_id", effectiveUserId).gte("date", fmtPrevFrom).lte("date", fmtPrevTo),
    ]);

    setSalesMetrics(salesCur.data || []);
    setPrevSalesMetrics(salesPrev.data || []);
    setMarketingMetrics(mktCur.data || []);
    setPrevMarketingMetrics(mktPrev.data || []);
  };

  useEffect(() => { fetchData(); }, [effectiveUserId, dateFilter, customRange.from?.getTime(), customRange.to?.getTime()]);

  const sum = (arr: any[], key: string) => arr.reduce((s, m) => s + Number(m[key] || 0), 0);
  const avg = (arr: any[], key: string) => arr.length > 0 ? sum(arr, key) / arr.length : 0;

  // Marketing aggregates
  const mTotalSpend = sum(marketingMetrics, "spend");
  const mTotalLeads = sum(marketingMetrics, "leads");
  const mTotalTraffic = sum(marketingMetrics, "traffic");
  const mTotalConversions = sum(marketingMetrics, "conversions");
  const mCAC = mTotalLeads > 0 ? mTotalSpend / mTotalLeads : 0;
  const mConvRate = mTotalTraffic > 0 ? (mTotalConversions / mTotalTraffic) * 100 : 0;
  const mAvgCPC = avg(marketingMetrics, "cpc");
  const mAvgROAS = avg(marketingMetrics, "roas");

  const pmTotalSpend = sum(prevMarketingMetrics, "spend");
  const pmTotalLeads = sum(prevMarketingMetrics, "leads");
  const pmTotalTraffic = sum(prevMarketingMetrics, "traffic");
  const pmTotalConversions = sum(prevMarketingMetrics, "conversions");
  const pmCAC = pmTotalLeads > 0 ? pmTotalSpend / pmTotalLeads : 0;
  const pmConvRate = pmTotalTraffic > 0 ? (pmTotalConversions / pmTotalTraffic) * 100 : 0;
  const pmAvgCPC = avg(prevMarketingMetrics, "cpc");
  const pmAvgROAS = avg(prevMarketingMetrics, "roas");

  const marketingCards = [
    { title: "CAC", value: `₺${mCAC.toFixed(0)}`, icon: Target, current: mCAC, previous: pmCAC },
    { title: "MQL (Lead)", value: mTotalLeads.toString(), icon: Users, current: mTotalLeads, previous: pmTotalLeads },
    { title: "Dönüşüm Oranı", value: `%${mConvRate.toFixed(1)}`, icon: MousePointerClick, current: mConvRate, previous: pmConvRate },
    { title: "ROAS", value: `${mAvgROAS.toFixed(2)}x`, icon: TrendingUp, current: mAvgROAS, previous: pmAvgROAS },
  ];

  // Channel breakdown
  const channelBreakdown = Object.values(
    marketingMetrics.reduce((acc: any, m: any) => {
      if (!acc[m.channel]) acc[m.channel] = { channel: m.channel, spend: 0, leads: 0, conversions: 0 };
      acc[m.channel].spend += Number(m.spend);
      acc[m.channel].leads += Number(m.leads);
      acc[m.channel].conversions += Number(m.conversions);
      return acc;
    }, {})
  ) as any[];

  // Marketing chart data (aggregated by date)
  const mktChartData = Object.values(
    marketingMetrics.reduce((acc: any, m: any) => {
      const key = m.date;
      if (!acc[key]) acc[key] = { date: format(parseISO(m.date), "dd MMM", { locale: tr }), spend: 0, traffic: 0, conversions: 0, leads: 0 };
      acc[key].spend += Number(m.spend);
      acc[key].traffic += Number(m.traffic);
      acc[key].conversions += Number(m.conversions);
      acc[key].leads += Number(m.leads);
      return acc;
    }, {})
  ) as any[];

  // Sales aggregates
  const sTotalSales = sum(salesMetrics, "total_sales");
  const sTotalOrders = sum(salesMetrics, "order_count");
  const sWinRate = avg(salesMetrics, "win_rate");
  const sACV = avg(salesMetrics, "avg_deal_value");
  const sAppointments = sum(salesMetrics, "appointments");
  const sChurnRate = avg(salesMetrics, "churn_rate");
  const sLTV = avg(salesMetrics, "ltv");
  const sNewCustomers = sum(salesMetrics, "new_customers");
  const sReturning = sum(salesMetrics, "returning_customers");
  const sNetProfit = sum(salesMetrics, "net_profit");

  const psTotalSales = sum(prevSalesMetrics, "total_sales");
  const psTotalOrders = sum(prevSalesMetrics, "order_count");
  const psWinRate = avg(prevSalesMetrics, "win_rate");
  const psACV = avg(prevSalesMetrics, "avg_deal_value");
  const psAppointments = sum(prevSalesMetrics, "appointments");
  const psChurnRate = avg(prevSalesMetrics, "churn_rate");
  const psLTV = avg(prevSalesMetrics, "ltv");
  const psNewCustomers = sum(prevSalesMetrics, "new_customers");

  const salesCards = [
    { title: "Toplam Satış", value: `₺${sTotalSales.toLocaleString("tr-TR")}`, icon: DollarSign, current: sTotalSales, previous: psTotalSales },
    { title: "Kapatma Oranı", value: `%${sWinRate.toFixed(1)}`, icon: Percent, current: sWinRate, previous: psWinRate },
    { title: "Ort. Anlaşma", value: `₺${sACV.toFixed(0)}`, icon: Gem, current: sACV, previous: psACV },
    { title: "Randevu", value: sAppointments.toString(), icon: CalendarCheck, current: sAppointments, previous: psAppointments },
  ];

  const salesChartData = salesMetrics.map(m => ({
    date: format(parseISO(m.date), "dd MMM", { locale: tr }),
    sales: Number(m.total_sales),
    orders: m.order_count,
    newCustomers: m.new_customers,
    returningCustomers: m.returning_customers,
    profit: Number(m.net_profit),
  }));

  const handleSaveMarketing = async (form: any) => {
    if (!effectiveUserId) return;
    const { error } = await supabase.from("marketing_metrics").upsert({
      user_id: effectiveUserId, date: form.date, channel: form.channel,
      spend: Number(form.spend || 0), traffic: Number(form.traffic || 0),
      conversions: Number(form.conversions || 0), leads: Number(form.leads || 0),
      cpc: Number(form.cpc || 0), cpm: Number(form.cpm || 0),
      engagement_rate: Number(form.engagement_rate || 0), roas: Number(form.roas || 0),
    }, { onConflict: "user_id,date,channel" });
    if (error) toast.error("Kaydedilemedi: " + error.message);
    else { toast.success("Pazarlama verisi kaydedildi"); fetchData(); }
    setDialogOpen(false);
  };

  const handleSaveSales = async (form: any) => {
    if (!effectiveUserId) return;
    const { error } = await supabase.from("sales_metrics").upsert({
      user_id: effectiveUserId, date: form.date,
      total_sales: Number(form.total_sales || 0), order_count: Number(form.order_count || 0),
      new_customers: Number(form.new_customers || 0), returning_customers: Number(form.returning_customers || 0),
      net_profit: Number(form.net_profit || 0), win_rate: Number(form.win_rate || 0),
      avg_deal_value: Number(form.avg_deal_value || 0), appointments: Number(form.appointments || 0),
      churn_rate: Number(form.churn_rate || 0), ltv: Number(form.ltv || 0),
      leads_received: Number(form.leads_received || 0),
    }, { onConflict: "user_id,date" });
    if (error) toast.error("Kaydedilemedi: " + error.message);
    else { toast.success("Satış verisi kaydedildi"); fetchData(); }
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Pazarlama ve satış metriklerinizi takip edin</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateFilter dateFilter={dateFilter} onFilterChange={setDateFilter} customRange={customRange} onCustomRangeChange={setCustomRange} />
            {canEdit && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90 h-9">
                    <Plus className="h-4 w-4 mr-1.5" /> Veri Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-border max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">
                      {tab === "marketing" ? "Pazarlama Verisi Ekle" : "Satış Verisi Ekle"}
                    </DialogTitle>
                  </DialogHeader>
                  {tab === "marketing" ? (
                    <MarketingEntryForm onSave={handleSaveMarketing} />
                  ) : (
                    <SalesEntryForm onSave={handleSaveSales} />
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="bg-secondary border border-border">
            <TabsTrigger value="marketing" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <Megaphone className="h-3.5 w-3.5" /> Pazarlama
            </TabsTrigger>
            <TabsTrigger value="sales" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5">
              <HandCoins className="h-3.5 w-3.5" /> Satış
            </TabsTrigger>
          </TabsList>

          <TabsContent value="marketing" className="space-y-6 mt-6">
            <SummaryCards cards={marketingCards} />
            <MarketingCharts chartData={mktChartData} channelBreakdown={channelBreakdown} />
            <MetricsTable metrics={marketingMetrics} canEdit={canEdit} onRefresh={fetchData} type="marketing" />
          </TabsContent>

          <TabsContent value="sales" className="space-y-6 mt-6">
            <SummaryCards cards={salesCards} />
            <SalesCharts chartData={salesChartData} totalNewCustomers={sNewCustomers} totalReturningCustomers={sReturning} />
            <MetricsTable metrics={salesMetrics} canEdit={canEdit} onRefresh={fetchData} type="sales" />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
