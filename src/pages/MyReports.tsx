import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Calendar,
  Plus,
  TrendingUp,
  TrendingDown,
  FileText,
  Trash2,
  ChevronRight,
  Loader2,
  Users,
  Target,
  CheckCircle2,
  UserCheck,
  Megaphone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SalesFunnel } from "@/components/dashboard/SalesFunnel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function MyReports() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: reports, isLoading, refetch } = useQuery({
    queryKey: ["weekly_reports", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("weekly_reports" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("week_start", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!user,
  });

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("weekly_reports" as any)
      .delete()
      .eq("id", id);
    if (error) {
      toast({ title: "Hata", description: "Rapor silinemedi.", variant: "destructive" });
    } else {
      toast({ title: "Silindi", description: "Rapor başarıyla silindi." });
      refetch();
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 0 }).format(val);

  const formatWeek = (start: string, end: string) => {
    const s = format(new Date(start), "dd MMM", { locale: tr });
    const e = format(new Date(end), "dd MMM yyyy", { locale: tr });
    return `${s} - ${e}`;
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Raporlarım</h1>
            <p className="text-sm text-muted-foreground mt-1">Haftalık raporlarınızı görüntüleyin ve yönetin</p>
          </div>
          <Button onClick={() => navigate("/reports/new")} className="rounded-xl">
            <Plus className="h-4 w-4 mr-2" /> Yeni Rapor
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !reports || reports.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Henüz rapor yok</h3>
            <p className="text-sm text-muted-foreground mb-6">
              İlk haftalık raporunuzu oluşturmaya başlayın
            </p>
            <Button onClick={() => navigate("/reports/new")} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" /> Rapor Oluştur
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {reports.map((report: any) => {
              const isExpanded = expandedId === report.id;
              const profitPositive = report.net_profit >= 0;

              return (
                <Card
                  key={report.id}
                  className="overflow-hidden transition-all duration-200 hover:shadow-md"
                >
                  {/* Header row */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : report.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">
                        {formatWeek(report.week_start, report.week_end)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(report.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Net Kar</p>
                        <p className={`text-sm font-bold ${profitPositive ? "text-green-600 dark:text-green-400" : "text-destructive"}`}>
                          {formatCurrency(report.net_profit)}
                        </p>
                      </div>
                      <Badge variant={profitPositive ? "default" : "destructive"} className="text-xs">
                        {profitPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {profitPositive ? "Kâr" : "Zarar"}
                      </Badge>
                      <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4">
                      <Separator />

                      {/* Financial summary */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Yeni Müşteri Cirosu</p>
                          <p className="font-semibold text-foreground">{formatCurrency(report.new_customer_revenue)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Mevcut Müşteri Cirosu</p>
                          <p className="font-semibold text-foreground">{formatCurrency(report.existing_customer_revenue)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Toplam Ciro</p>
                          <p className="font-semibold text-primary">{formatCurrency(report.total_revenue)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Reklam</p>
                          <p className="font-semibold text-foreground">{formatCurrency(report.ad_spend)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Operasyonel</p>
                          <p className="font-semibold text-foreground">{formatCurrency(report.operational_spend)}</p>
                        </div>
                        <div className="bg-muted/30 rounded-lg p-3">
                          <p className="text-xs text-muted-foreground">Toplam Harcama</p>
                          <p className="font-semibold text-destructive">{formatCurrency(report.total_expenses)}</p>
                        </div>
                      </div>

                      {/* Metrics */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Lead</p>
                            <p className="font-semibold text-foreground">{report.leads_count}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Toplantı</p>
                            <p className="font-semibold text-foreground">{report.meetings_held} / {report.meetings_planned}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Satış</p>
                            <p className="font-semibold text-foreground">{report.sales_closed}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-3">
                          <TrendingUp className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Dönüşüm</p>
                            <p className="font-semibold text-foreground">
                              {report.leads_count > 0
                                ? `%${((report.sales_closed / report.leads_count) * 100).toFixed(0)}`
                                : "%0"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {(report.weekly_notes || report.challenges || report.next_week_plan) && (
                        <div className="space-y-2 text-sm">
                          {report.weekly_notes && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">📝 Haftalık Notlar</p>
                              <p className="text-foreground">{report.weekly_notes}</p>
                            </div>
                          )}
                          {report.challenges && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">⚠️ Zorluklar</p>
                              <p className="text-foreground">{report.challenges}</p>
                            </div>
                          )}
                          {report.next_week_plan && (
                            <div className="bg-muted/30 rounded-lg p-3">
                              <p className="text-xs text-muted-foreground mb-1">🎯 Gelecek Hafta Planı</p>
                              <p className="text-foreground">{report.next_week_plan}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4 mr-1" /> Sil
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Raporu silmek istediğinize emin misiniz?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. Rapor kalıcı olarak silinecektir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(report.id)}>Sil</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
