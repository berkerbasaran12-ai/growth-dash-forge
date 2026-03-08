import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subDays, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { MetricsTable } from "@/components/dashboard/MetricsTable";
import { GoalTracker } from "@/components/dashboard/GoalTracker";
import { DateFilter } from "@/components/dashboard/DateFilter";
import { DataEntryForm } from "@/components/dashboard/DataEntryForm";

const Dashboard = () => {
  const { user, effectiveUserId, isTeamMember, teamMembership } = useAuth();
  const [dateFilter, setDateFilter] = useState("7d");
  const [customRange, setCustomRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [prevMetrics, setPrevMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const canEdit = !isTeamMember || teamMembership?.permission === "full";

  const getDateRange = () => {
    const now = new Date();
    if (dateFilter === "custom" && customRange.from && customRange.to) {
      const diff = customRange.to.getTime() - customRange.from.getTime();
      const prevFrom = new Date(customRange.from.getTime() - diff);
      const prevTo = new Date(customRange.from.getTime() - 1);
      return {
        from: customRange.from,
        to: customRange.to,
        prevFrom,
        prevTo,
      };
    }
    let days: number;
    switch (dateFilter) {
      case "today": days = 1; break;
      case "30d": days = 30; break;
      default: days = 7;
    }
    const from = dateFilter === "today" ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : subDays(now, days);
    return {
      from,
      to: now,
      prevFrom: subDays(from, days),
      prevTo: subDays(from, 1),
    };
  };

  const fetchMetrics = async () => {
    if (!effectiveUserId) return;
    setLoading(true);
    const { from, to, prevFrom, prevTo } = getDateRange();

    const [currentRes, prevRes] = await Promise.all([
      supabase.from("sales_metrics").select("*").eq("user_id", effectiveUserId)
        .gte("date", format(from, "yyyy-MM-dd"))
        .lte("date", format(to, "yyyy-MM-dd"))
        .order("date", { ascending: true }),
      supabase.from("sales_metrics").select("*").eq("user_id", effectiveUserId)
        .gte("date", format(prevFrom, "yyyy-MM-dd"))
        .lte("date", format(prevTo, "yyyy-MM-dd")),
    ]);

    if (currentRes.error) toast.error("Veriler yüklenemedi");
    else setMetrics(currentRes.data || []);
    setPrevMetrics(prevRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchMetrics(); }, [effectiveUserId, dateFilter, customRange.from?.getTime(), customRange.to?.getTime()]);

  const sum = (arr: any[], key: string) => arr.reduce((s, m) => s + Number(m[key] || 0), 0);
  const totalSales = sum(metrics, "total_sales");
  const totalOrders = sum(metrics, "order_count");
  const avgCart = totalOrders > 0 ? totalSales / totalOrders : 0;
  const totalNewCustomers = sum(metrics, "new_customers");
  const totalReturningCustomers = sum(metrics, "returning_customers");

  const prevTotalSales = sum(prevMetrics, "total_sales");
  const prevTotalOrders = sum(prevMetrics, "order_count");
  const prevAvgCart = prevTotalOrders > 0 ? prevTotalSales / prevTotalOrders : 0;
  const prevNewCustomers = sum(prevMetrics, "new_customers");

  // Current month sales for goal tracker
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const currentMonthSales = metrics
    .filter(m => m.date >= monthStart && m.date <= monthEnd)
    .reduce((s, m) => s + Number(m.total_sales), 0);

  const chartData = metrics.map((m) => ({
    date: format(parseISO(m.date), "dd MMM", { locale: tr }),
    sales: Number(m.total_sales),
    orders: m.order_count,
    newCustomers: m.new_customers,
    returningCustomers: m.returning_customers,
    profit: Number(m.net_profit),
  }));

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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Satış metriklerinizi takip edin</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <DateFilter
              dateFilter={dateFilter}
              onFilterChange={setDateFilter}
              customRange={customRange}
              onCustomRangeChange={setCustomRange}
            />
            {canEdit && (
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
            )}
          </div>
        </div>

        {/* Goal Tracker */}
        <GoalTracker effectiveUserId={effectiveUserId} currentMonthSales={currentMonthSales} canEdit={canEdit} />

        {/* Summary Cards with Trend */}
        <SummaryCards
          totalSales={totalSales} totalOrders={totalOrders} avgCart={avgCart} totalNewCustomers={totalNewCustomers}
          prevTotalSales={prevTotalSales} prevTotalOrders={prevTotalOrders} prevAvgCart={prevAvgCart} prevNewCustomers={prevNewCustomers}
        />

        {/* Charts including Donut */}
        <DashboardCharts chartData={chartData} totalNewCustomers={totalNewCustomers} totalReturningCustomers={totalReturningCustomers} />

        {/* Data Table with Edit/Delete/CSV */}
        <MetricsTable metrics={metrics} canEdit={canEdit} onRefresh={fetchMetrics} />
      </div>
    </AppLayout>
  );
};

export default Dashboard;
