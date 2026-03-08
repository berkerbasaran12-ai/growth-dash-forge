import { useState, useMemo, useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, getMonth, getYear } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  Clock,
  ArrowLeft,
  BarChart3,
  Megaphone,
  Settings2,
  Handshake,
  Briefcase,
  Gem,
  Wallet,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  FileText,
  Loader2,
} from "lucide-react";

const TOTAL_STEPS = 4;

// Generate weeks for a given month
function getWeeksForMonth(year: number, month: number) {
  const weeks: { start: Date; end: Date; isCurrent: boolean }[] = [];
  const now = new Date();
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });

  let date = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  // Start from the Monday of the week containing the 1st
  let weekStart = startOfWeek(date, { weekStartsOn: 1 });

  while (weekStart <= monthEnd) {
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weeks.push({
      start: new Date(weekStart),
      end: new Date(weekEnd),
      isCurrent: weekStart.getTime() === currentWeekStart.getTime(),
    });
    weekStart = addWeeks(weekStart, 1);
  }

  return weeks;
}

function formatWeekRange(start: Date, end: Date) {
  const s = format(start, "dd MMM", { locale: tr });
  const e = format(end, "dd MMM", { locale: tr });
  return `${s} - ${e}`;
}

interface WeeklyPayment {
  id: string;
  amount: number;
  payment_date: string;
  status: string;
  notes: string | null;
  client_user_id: string;
}

export default function ReportBuilder() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1 state
  const [browseDate, setBrowseDate] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState<{ start: Date; end: Date } | null>(null);
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);

  // Step 2 state
  const [includePayments, setIncludePayments] = useState(true);
  const [weeklyPayments, setWeeklyPayments] = useState<WeeklyPayment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);

  const [newCustomerRevenue, setNewCustomerRevenue] = useState("");
  const [existingCustomerRevenue, setExistingCustomerRevenue] = useState("");
  const [adSpend, setAdSpend] = useState("");
  const [operationalSpend, setOperationalSpend] = useState("");
  const [outsourceSpend, setOutsourceSpend] = useState("");
  const [salarySpend, setSalarySpend] = useState("");
  const [dividendSpend, setDividendSpend] = useState("");

  const [leadsCount, setLeadsCount] = useState("");
  const [meetingsPlanned, setMeetingsPlanned] = useState("");
  const [meetingsHeld, setMeetingsHeld] = useState("");
  const [salesClosed, setSalesClosed] = useState("");

  // Step 3 state
  const [weeklyNotes, setWeeklyNotes] = useState("");
  const [challenges, setChallenges] = useState("");
  const [nextWeekPlan, setNextWeekPlan] = useState("");

  // Step 4 - summary/submit
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Calculations
  const totalRevenue = (parseFloat(newCustomerRevenue) || 0) + (parseFloat(existingCustomerRevenue) || 0);
  const totalExpenses =
    (parseFloat(adSpend) || 0) +
    (parseFloat(operationalSpend) || 0) +
    (parseFloat(outsourceSpend) || 0) +
    (parseFloat(salarySpend) || 0) +
    (parseFloat(dividendSpend) || 0);
  const netProfit = totalRevenue - totalExpenses;

  const browseYear = getYear(browseDate);
  const browseMonth = getMonth(browseDate);
  const weeks = useMemo(() => getWeeksForMonth(browseYear, browseMonth), [browseYear, browseMonth]);
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  // Fetch payments when week is selected
  useEffect(() => {
    if (!selectedWeek || !user) return;
    const fetchPayments = async () => {
      setLoadingPayments(true);
      const startStr = format(selectedWeek.start, "yyyy-MM-dd");
      const endStr = format(selectedWeek.end, "yyyy-MM-dd");

      const { data } = await supabase
        .from("client_payments")
        .select("*")
        .gte("payment_date", startStr)
        .lte("payment_date", endStr);

      setWeeklyPayments(data || []);
      setLoadingPayments(false);
    };
    fetchPayments();
  }, [selectedWeek, user]);

  const handlePrevMonth = () => setBrowseDate(new Date(browseYear, browseMonth - 1, 1));
  const handleNextMonth = () => setBrowseDate(new Date(browseYear, browseMonth + 1, 1));

  const canGoNext = () => {
    if (step === 1) return !!selectedWeek;
    if (step === 2) {
      return (
        newCustomerRevenue !== "" &&
        existingCustomerRevenue !== "" &&
        adSpend !== "" &&
        operationalSpend !== "" &&
        outsourceSpend !== "" &&
        salarySpend !== "" &&
        leadsCount !== "" &&
        meetingsPlanned !== "" &&
        meetingsHeld !== "" &&
        salesClosed !== ""
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user || !selectedWeek) return;
    setSubmitting(true);

    try {
      const weekStart = format(selectedWeek.start, "yyyy-MM-dd");
      const weekEnd = format(selectedWeek.end, "yyyy-MM-dd");

      // Save to weekly_reports table
      const { error: reportError } = await supabase.from("weekly_reports" as any).insert({
        user_id: user.id,
        week_start: weekStart,
        week_end: weekEnd,
        new_customer_revenue: parseFloat(newCustomerRevenue) || 0,
        existing_customer_revenue: parseFloat(existingCustomerRevenue) || 0,
        total_revenue: totalRevenue,
        ad_spend: parseFloat(adSpend) || 0,
        operational_spend: parseFloat(operationalSpend) || 0,
        outsource_spend: parseFloat(outsourceSpend) || 0,
        salary_spend: parseFloat(salarySpend) || 0,
        dividend_spend: parseFloat(dividendSpend) || 0,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        leads_count: parseInt(leadsCount) || 0,
        meetings_planned: parseInt(meetingsPlanned) || 0,
        meetings_held: parseInt(meetingsHeld) || 0,
        sales_closed: parseInt(salesClosed) || 0,
        weekly_notes: weeklyNotes,
        challenges,
        next_week_plan: nextWeekPlan,
        include_payments: includePayments,
      });

      if (reportError) throw reportError;

      // Also insert into sales_metrics for analytics
      const { error: salesError } = await supabase.from("sales_metrics").insert({
        user_id: user.id,
        date: weekStart,
        total_sales: totalRevenue,
        net_profit: netProfit,
        new_customers: parseInt(salesClosed) || 0,
        returning_customers: 0,
        order_count: (parseInt(salesClosed) || 0),
        leads_received: parseInt(leadsCount) || 0,
        appointments: parseInt(meetingsPlanned) || 0,
        win_rate: parseInt(leadsCount) > 0 ? ((parseInt(salesClosed) || 0) / (parseInt(leadsCount) || 1)) * 100 : 0,
        avg_deal_value: parseInt(salesClosed) > 0 ? totalRevenue / parseInt(salesClosed) : 0,
        ltv: 0,
        churn_rate: 0,
      });

      if (salesError) throw salesError;

      // Insert marketing_metrics
      const { error: marketingError } = await supabase.from("marketing_metrics").insert({
        user_id: user.id,
        date: weekStart,
        spend: parseFloat(adSpend) || 0,
        traffic: 0,
        conversions: parseInt(salesClosed) || 0,
        leads: parseInt(leadsCount) || 0,
        cpc: 0,
        cpm: 0,
        engagement_rate: 0,
        roas: (parseFloat(adSpend) || 0) > 0 ? totalRevenue / (parseFloat(adSpend) || 1) : 0,
      });

      if (marketingError) throw marketingError;

      // Log activity
      await supabase.from("activity_logs").insert({
        user_id: user.id,
        action: "weekly_report_created",
        details: `Haftalık rapor oluşturuldu: ${formatWeekRange(selectedWeek.start, selectedWeek.end)}`,
        metadata: {
          week_start: weekStart,
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          net_profit: netProfit,
          notes: weeklyNotes,
          challenges,
          next_week_plan: nextWeekPlan,
        },
      });

      setSubmitted(true);
      toast({ title: "Rapor başarıyla oluşturuldu!", description: `${formatWeekRange(selectedWeek.start, selectedWeek.end)} haftası için rapor kaydedildi.` });
    } catch (err: any) {
      toast({ title: "Hata", description: err.message || "Rapor kaydedilemedi.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedWeek(null);
    setNewCustomerRevenue("");
    setExistingCustomerRevenue("");
    setAdSpend("");
    setOperationalSpend("");
    setOutsourceSpend("");
    setSalarySpend("");
    setDividendSpend("");
    setLeadsCount("");
    setMeetingsPlanned("");
    setMeetingsHeld("");
    setSalesClosed("");
    setWeeklyNotes("");
    setChallenges("");
    setNextWeekPlan("");
    setSubmitted(false);
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(val);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-6 px-4">
        <Card className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-foreground">Haftalık Rapor Oluştur</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Adım <span className="font-bold text-foreground">{step}</span> / {TOTAL_STEPS}
            </p>
            <Progress value={(step / TOTAL_STEPS) * 100} className="mt-3 h-2" />
          </div>

          {/* Step 1: Week Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <Label className="text-base font-semibold">Hafta Seçin</Label>
              <button
                onClick={() => setWeekPickerOpen(!weekPickerOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-xl bg-background hover:bg-accent/50 transition-colors text-left"
              >
                <Calendar className="h-5 w-5 text-muted-foreground shrink-0" />
                <span className={selectedWeek ? "text-foreground" : "text-muted-foreground"}>
                  {selectedWeek ? formatWeekRange(selectedWeek.start, selectedWeek.end) : "Rapor için hafta seçin"}
                </span>
              </button>

              {weekPickerOpen && (
                <div className="border border-border rounded-xl p-4 bg-background space-y-3">
                  {/* Month nav */}
                  <div className="flex items-center justify-between">
                    <Button variant="outline" size="icon" onClick={handlePrevMonth} className="rounded-full h-9 w-9">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-foreground">
                      {format(browseDate, "MMMM yyyy", { locale: tr })}
                    </span>
                    <Button variant="outline" size="icon" onClick={handleNextMonth} className="rounded-full h-9 w-9">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Current week shortcut */}
                  <button
                    onClick={() => {
                      const end = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
                      setSelectedWeek({ start: currentWeekStart, end });
                      setWeekPickerOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 border border-border rounded-xl hover:bg-accent/50 transition-colors"
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">Bu Hafta</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {formatWeekRange(currentWeekStart, endOfWeek(currentWeekStart, { weekStartsOn: 1 }))}
                    </Badge>
                  </button>

                  <Separator />

                  {/* Weeks list */}
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {weeks.map((w, i) => {
                      const isSelected =
                        selectedWeek && w.start.getTime() === selectedWeek.start.getTime();
                      return (
                        <button
                          key={i}
                          onClick={() => {
                            setSelectedWeek({ start: w.start, end: w.end });
                            setWeekPickerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
                            isSelected
                              ? "bg-primary/10 border border-primary"
                              : w.isCurrent
                              ? "bg-accent/50 border border-border"
                              : "hover:bg-accent/30"
                          }`}
                        >
                          {w.isCurrent && <Clock className="h-4 w-4 text-primary shrink-0" />}
                          <div>
                            <span className="text-sm font-medium text-foreground">
                              {formatWeekRange(w.start, w.end)}
                            </span>
                            {w.isCurrent && (
                              <p className="text-xs text-muted-foreground">Mevcut hafta</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Financial Data & Metrics */}
          {step === 2 && (
            <div className="space-y-8">
              <h2 className="text-lg font-semibold text-foreground">Geçen Hafta Sonuçları</h2>

              {/* Weekly Payment Summary */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Haftalık Tahsilat Özeti</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="includePayments"
                      checked={includePayments}
                      onCheckedChange={(v) => setIncludePayments(!!v)}
                    />
                    <Label htmlFor="includePayments" className="text-sm text-muted-foreground cursor-pointer">
                      Rapora Ekle
                    </Label>
                  </div>
                </div>
                <Card className="p-4 bg-muted/30">
                  {loadingPayments ? (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" /> Yükleniyor...
                    </div>
                  ) : weeklyPayments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bu hafta için tahsilat bulunamadı.</p>
                  ) : (
                    <div className="space-y-2">
                      {weeklyPayments.map((p) => (
                        <div key={p.id} className="flex justify-between text-sm">
                          <span className="text-foreground">{p.notes || "Ödeme"}</span>
                          <span className="font-medium text-foreground">{formatCurrency(p.amount)}</span>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between text-sm font-bold">
                        <span>Toplam</span>
                        <span className="text-primary">
                          {formatCurrency(weeklyPayments.reduce((s, p) => s + p.amount, 0))}
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <Separator />

              {/* Revenue */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Finansal Sorular (TL bazında)</h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm">
                      Geçen hafta yeni müşterilerden elde edilen ciro? (₺) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={newCustomerRevenue}
                      onChange={(e) => setNewCustomerRevenue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Geçen hafta eski/düzenli müşterilerden elde edilen ciro? (₺) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={existingCustomerRevenue}
                      onChange={(e) => setExistingCustomerRevenue(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Ad Spend */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Reklam Harcamaları</h3>
                </div>
                <div>
                  <Label className="text-sm">
                    Toplam reklam harcama (₺) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Facebook, Google Ads ve diğer reklam platformlarındaki harcamaların toplam tutarı
                  </p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={adSpend}
                    onChange={(e) => setAdSpend(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    💡 Detaylı reklam harcamalarını Gelir-Gider sayfasında kaydedebilirsin
                  </p>
                </div>
              </div>

              <Separator />

              {/* Operational */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Operasyonel Harcamalar</h3>
                </div>
                <div>
                  <Label className="text-sm">
                    Toplam operasyonel harcama (₺) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">İşletme giderleri toplam tutarı</p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={operationalSpend}
                    onChange={(e) => setOperationalSpend(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    💡 Detaylı operasyonel giderleri Gelir-Gider sayfasında kaydedebilirsin
                  </p>
                </div>
              </div>

              <Separator />

              {/* Outsource */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Handshake className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Dış Kaynak Harcamaları</h3>
                </div>
                <div>
                  <Label className="text-sm">
                    Toplam dış kaynak harcama (₺) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Freelancer ve tedarikçi harcamaları toplam tutarı</p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={outsourceSpend}
                    onChange={(e) => setOutsourceSpend(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    💡 Detaylı dış kaynak harcamalarını Gelir-Gider sayfasında kaydedebilirsin
                  </p>
                </div>
              </div>

              <Separator />

              {/* Salary */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Maaş Giderleri</h3>
                </div>
                <div>
                  <Label className="text-sm">
                    Toplam maaş tutarı (₺) <span className="text-destructive">*</span>
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Tüm çalışanların toplam maaşı</p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={salarySpend}
                    onChange={(e) => setSalarySpend(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    💡 Maaş ödeme detaylarını Gelir-Gider sayfasında kaydedebilirsin (çalışan adı, ödeme tarihi, vb.)
                  </p>
                </div>
              </div>

              <Separator />

              {/* Dividend */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Gem className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Temettü / Kişisel Ödeme</h3>
                </div>
                <div>
                  <Label className="text-sm">Toplam temettü / kişisel ödeme (₺)</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">Kendinize ödediğiniz temettü/kâr payı tutarı</p>
                  <Input
                    type="number"
                    placeholder="0"
                    value={dividendSpend}
                    onChange={(e) => setDividendSpend(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    💡 Detaylı temettü ödemelerini Gelir-Gider sayfasında kaydedebilirsin
                  </p>
                </div>
              </div>

              <Separator />

              {/* Net Profit Auto */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Net Kar (Otomatik Hesaplama)</h3>
                </div>
                <Card className={`p-4 ${netProfit >= 0 ? "bg-green-500/10 border-green-500/30" : "bg-destructive/10 border-destructive/30"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Net Kar:</span>
                    <span className={`text-xl font-bold ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                      {formatCurrency(netProfit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Ciro:</span>
                    <span className="font-medium text-foreground">{formatCurrency(totalRevenue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Toplam Harcama:</span>
                    <span className="font-medium text-foreground">{formatCurrency(totalExpenses)}</span>
                  </div>
                </Card>
              </div>

              <Separator />

              {/* Metrics */}
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">Metrikler</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">
                      Geçen hafta toplam kaç lead aldınız? (adet) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={leadsCount}
                      onChange={(e) => setLeadsCount(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Geçen hafta kaç toplantı planlandı? (adet) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={meetingsPlanned}
                      onChange={(e) => setMeetingsPlanned(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Geçen hafta kaç toplantı gerçekleşti? (adet) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={meetingsHeld}
                      onChange={(e) => setMeetingsHeld(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">
                      Geçen hafta kaç satış kapandı? (adet) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={salesClosed}
                      onChange={(e) => setSalesClosed(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Notes & Plans */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Notlar & Planlama</h2>

              <div className="space-y-3">
                <Label className="text-sm font-medium">📝 Haftalık Notlar</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Bu hafta neler yaşandı? Önemli gelişmeler..."
                  value={weeklyNotes}
                  onChange={(e) => setWeeklyNotes(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">⚠️ Karşılaşılan Zorluklar</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Bu hafta karşılaşılan sorunlar veya engeller..."
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">🎯 Gelecek Hafta Planı</Label>
                <textarea
                  className="w-full min-h-[100px] rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Gelecek hafta için hedefler ve planlar..."
                  value={nextWeekPlan}
                  onChange={(e) => setNextWeekPlan(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Step 4: Summary & Submit */}
          {step === 4 && !submitted && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground">Rapor Özeti</h2>

              <Card className="p-4 bg-muted/30 space-y-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">
                    {selectedWeek && formatWeekRange(selectedWeek.start, selectedWeek.end)}
                  </span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Yeni Müşteri Cirosu</p>
                    <p className="font-semibold text-foreground">{formatCurrency(parseFloat(newCustomerRevenue) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Mevcut Müşteri Cirosu</p>
                    <p className="font-semibold text-foreground">{formatCurrency(parseFloat(existingCustomerRevenue) || 0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Ciro</p>
                    <p className="font-semibold text-primary">{formatCurrency(totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Harcama</p>
                    <p className="font-semibold text-destructive">{formatCurrency(totalExpenses)}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">Net Kar</span>
                  <span className={`text-lg font-bold ${netProfit >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                    {formatCurrency(netProfit)}
                  </span>
                </div>

                <Separator />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Lead</p>
                      <p className="font-semibold text-foreground">{leadsCount || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Toplantı</p>
                      <p className="font-semibold text-foreground">{meetingsHeld || 0} / {meetingsPlanned || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Satış</p>
                      <p className="font-semibold text-foreground">{salesClosed || 0}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Dönüşüm</p>
                      <p className="font-semibold text-foreground">
                        {parseInt(leadsCount) > 0
                          ? `%${((parseInt(salesClosed) || 0) / parseInt(leadsCount) * 100).toFixed(0)}`
                          : "%0"}
                      </p>
                    </div>
                  </div>
                </div>

                {(weeklyNotes || challenges || nextWeekPlan) && (
                  <>
                    <Separator />
                    <div className="space-y-2 text-sm">
                      {weeklyNotes && (
                        <div>
                          <p className="text-muted-foreground text-xs">Haftalık Notlar</p>
                          <p className="text-foreground">{weeklyNotes}</p>
                        </div>
                      )}
                      {challenges && (
                        <div>
                          <p className="text-muted-foreground text-xs">Zorluklar</p>
                          <p className="text-foreground">{challenges}</p>
                        </div>
                      )}
                      {nextWeekPlan && (
                        <div>
                          <p className="text-muted-foreground text-xs">Gelecek Hafta Planı</p>
                          <p className="text-foreground">{nextWeekPlan}</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Card>
            </div>
          )}

          {/* Success */}
          {step === 4 && submitted && (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Rapor Başarıyla Oluşturuldu!</h2>
              <p className="text-sm text-muted-foreground">
                {selectedWeek && formatWeekRange(selectedWeek.start, selectedWeek.end)} haftası için veriler kaydedildi.
              </p>
              <Button onClick={resetForm} className="mt-4">
                <FileText className="h-4 w-4 mr-2" /> Yeni Rapor Oluştur
              </Button>
            </div>
          )}

          {/* Footer Buttons */}
          {!(step === 4 && submitted) && (
            <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-border">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" /> Geri
                </Button>
              )}
              <Button variant="outline" onClick={resetForm} className="rounded-xl">
                İptal
              </Button>
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()} className="rounded-xl">
                  Sonraki <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Raporu Kaydet
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
}
