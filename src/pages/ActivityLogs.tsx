import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, Search, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

const actionLabels: Record<string, { label: string; color: string }> = {
  login: { label: "Giriş", color: "bg-accent/10 text-accent border-accent/20" },
  logout: { label: "Çıkış", color: "bg-muted text-muted-foreground border-border" },
  data_entry_marketing: { label: "Pazarlama Verisi", color: "bg-primary/10 text-primary border-primary/20" },
  data_entry_sales: { label: "Satış Verisi", color: "bg-warning/10 text-warning border-warning/20" },
  profile_update: { label: "Profil Güncelleme", color: "bg-accent/10 text-accent border-accent/20" },
  password_change: { label: "Şifre Değişikliği", color: "bg-destructive/10 text-destructive border-destructive/20" },
  client_create: { label: "Müşteri Oluşturma", color: "bg-accent/10 text-accent border-accent/20" },
  client_delete: { label: "Müşteri Silme", color: "bg-destructive/10 text-destructive border-destructive/20" },
  client_toggle: { label: "Müşteri Durumu", color: "bg-warning/10 text-warning border-warning/20" },
};

const ActivityLogs = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*, profiles!activity_logs_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(200);
    
    // If join fails, fetch separately
    if (data && data.length > 0 && !data[0].profiles) {
      const userIds = [...new Set(data.map(l => l.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      const enriched = data.map(l => ({ ...l, profile: profileMap.get(l.user_id) || null }));
      setLogs(enriched);
    } else {
      setLogs((data || []).map(l => ({ ...l, profile: l.profiles || null })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = logs.filter(
    (l) =>
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.details?.toLowerCase().includes(search.toLowerCase()) ||
      l.profile?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.profile?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Aktivite Logu</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistem aktivitelerini takip edin</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} className="h-9">
            <RefreshCw className="h-4 w-4 mr-1.5" /> Yenile
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Log ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-secondary border-border h-9"
          />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Tarih</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Kullanıcı</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlem</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Detay</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Yükleniyor...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Henüz aktivite kaydı yok</td></tr>
                ) : (
                  filtered.map((log) => {
                    const actionInfo = actionLabels[log.action] || { label: log.action, color: "bg-secondary text-muted-foreground border-border" };
                    return (
                      <tr key={log.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                        <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {format(parseISO(log.created_at), "dd MMM yyyy HH:mm", { locale: tr })}
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-sm text-foreground">{log.profile?.full_name || "—"}</div>
                          <div className="text-xs text-muted-foreground">{log.profile?.email || "—"}</div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant="outline" className={`text-[10px] ${actionInfo.color}`}>
                            {actionInfo.label}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground max-w-xs truncate">
                          {log.details || "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default ActivityLogs;
