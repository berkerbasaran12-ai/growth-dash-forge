import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Users, CreditCard, StickyNote, Plus, X, Save, Trash2, BookOpen, BarChart3, Send, Copy, ClipboardCheck } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ClientOnboardingTab } from "@/components/ClientOnboardingTab";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

const ClientDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accessCategoryIds, setAccessCategoryIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Editable fields
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [saving, setSaving] = useState(false);

  // New note
  const [newNote, setNewNote] = useState("");

  const fetchAll = async () => {
    if (!userId) return;
    setLoading(true);

    const [profileRes, teamRes, servicesRes, paymentsRes, notesRes, catsRes, accessRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("team_members").select("*, profiles!team_members_member_user_id_fkey(full_name, email)").eq("client_user_id", userId),
      supabase.from("client_services").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("client_payments").select("*, client_services(service_name)").eq("client_user_id", userId).order("payment_date", { ascending: false }),
      supabase.from("client_notes").select("*").eq("client_user_id", userId).order("created_at", { ascending: false }),
      supabase.from("kb_categories").select("*").order("sort_order"),
      supabase.from("kb_category_access").select("category_id").eq("user_id", userId),
    ]);

    if (profileRes.data) {
      setClient(profileRes.data);
      setEditName(profileRes.data.full_name || "");
      setEditCompany(profileRes.data.company || "");
    }
    setTeamMembers(teamRes.data || []);
    setServices(servicesRes.data || []);
    setPayments(paymentsRes.data || []);
    setNotes(notesRes.data || []);
    setCategories(catsRes.data || []);
    setAccessCategoryIds((accessRes.data || []).map((a: any) => a.category_id));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [userId]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: editName, company: editCompany }).eq("user_id", userId);
    if (error) toast.error(error.message);
    else toast.success("Profil güncellendi");
    setSaving(false);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !user) return;
    const { error } = await supabase.from("client_notes").insert({
      client_user_id: userId,
      admin_user_id: user.id,
      content: newNote.trim(),
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Not eklendi");
      setNewNote("");
      fetchAll();
    }
  };

  const handleDeleteNote = async (id: string) => {
    const { error } = await supabase.from("client_notes").delete().eq("id", id);
    if (error) toast.error(error.message);
    else fetchAll();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!client) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Müşteri bulunamadı</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/clients")}>Geri Dön</Button>
        </div>
      </AppLayout>
    );
  }

  const initials = client.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <AppLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate("/admin/clients")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 shrink-0">
              <AvatarImage src={client.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground truncate">{client.full_name || client.email}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">{client.company || "Şirket belirtilmemiş"} · {client.email}</p>
            </div>
          </div>
          <Badge variant={client.is_active ? "default" : "secondary"} className={`self-start sm:ml-auto shrink-0 ${client.is_active ? "bg-accent/10 text-accent border-accent/20" : ""}`}>
            {client.is_active ? "Aktif" : "Pasif"}
          </Badge>
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => navigate(`/dashboard?client=${userId}`)}>
            <BarChart3 className="h-4 w-4 mr-1.5" /> Paneli Görüntüle
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-4">
          <TabsList className="bg-secondary w-full overflow-x-auto flex justify-start">
            <TabsTrigger value="info" className="gap-1.5 text-xs sm:text-sm"><Building2 className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Bilgiler</span></TabsTrigger>
            <TabsTrigger value="team" className="gap-1.5 text-xs sm:text-sm"><Users className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Ekip</span></TabsTrigger>
            <TabsTrigger value="akademi" className="gap-1.5 text-xs sm:text-sm"><BookOpen className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Akademi</span></TabsTrigger>
            <TabsTrigger value="services" className="gap-1.5 text-xs sm:text-sm"><CreditCard className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Hizmetler</span></TabsTrigger>
            <TabsTrigger value="notes" className="gap-1.5 text-xs sm:text-sm"><StickyNote className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Notlar</span></TabsTrigger>
          </TabsList>

          {/* INFO TAB */}
          <TabsContent value="info">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ad Soyad</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-secondary border-border h-9 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">E-posta</Label>
                <Input value={client.email} readOnly className="bg-muted border-border h-9 text-sm text-muted-foreground" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Şirket</Label>
                <Input value={editCompany} onChange={(e) => setEditCompany(e.target.value)} className="bg-secondary border-border h-9 text-sm" />
              </div>
              <Button size="sm" onClick={handleSaveProfile} disabled={saving} className="gap-1.5">
                <Save className="h-3.5 w-3.5" /> Kaydet
              </Button>
            </motion.div>
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6">
              <TeamManagement clientUserId={userId!} onChanged={fetchAll} />
            </motion.div>
          </TabsContent>

          {/* AKADEMI ACCESS TAB */}
          <TabsContent value="akademi">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground">Havana Akademi Kategori Erişimi</h3>
                <p className="text-xs text-muted-foreground mt-1">Bu müşterinin erişebileceği Akademi kategorilerini seçin. Hiçbiri seçilmezse hiçbir içerik görünmez.</p>
              </div>
              <div className="space-y-1">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-secondary cursor-pointer transition-colors">
                    <Checkbox
                      checked={accessCategoryIds.includes(cat.id)}
                      onCheckedChange={async (checked) => {
                        if (checked) {
                          await supabase.from("kb_category_access").insert({ category_id: cat.id, user_id: userId });
                          setAccessCategoryIds((prev) => [...prev, cat.id]);
                        } else {
                          await supabase.from("kb_category_access").delete().eq("category_id", cat.id).eq("user_id", userId);
                          setAccessCategoryIds((prev) => prev.filter((id) => id !== cat.id));
                        }
                      }}
                    />
                    <span className="text-sm text-foreground">{cat.icon} {cat.name}</span>
                  </label>
                ))}
                {categories.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Henüz kategori oluşturulmamış.</p>}
              </div>
            </motion.div>
          </TabsContent>

          {/* SERVICES & PAYMENTS TAB */}
          <TabsContent value="services">
            <div className="space-y-4">
              {/* Services */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Hizmetler</h3>
                  <AddServiceDialog clientUserId={userId!} onAdded={fetchAll} />
                </div>
                {services.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Henüz hizmet eklenmemiş.</p>
                ) : (
                  <div className="space-y-2">
                    {services.map((s) => (
                      <div key={s.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{s.service_name}</p>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">
                            {Number(s.amount).toLocaleString("tr-TR")} {s.currency}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {s.billing_cycle === "monthly" ? "Aylık" : s.billing_cycle === "yearly" ? "Yıllık" : "Tek seferlik"}
                          </p>
                          <Badge variant={s.is_active ? "default" : "secondary"} className={`text-xs mt-1 ${s.is_active ? "bg-accent/10 text-accent border-accent/20" : ""}`}>
                            {s.is_active ? "Aktif" : "Pasif"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Payments */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-foreground">Ödemeler</h3>
                  <AddPaymentDialog clientUserId={userId!} services={services} onAdded={fetchAll} />
                </div>
                {payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Henüz ödeme kaydı yok.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-3 py-2">Tarih</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-3 py-2">Hizmet</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-3 py-2">Tutar</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-3 py-2">Durum</th>
                          <th className="text-left text-xs font-medium text-muted-foreground uppercase px-3 py-2">Not</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-b border-border/50">
                            <td className="px-3 py-2.5 text-sm text-foreground">{format(new Date(p.payment_date), "dd MMM yyyy", { locale: tr })}</td>
                            <td className="px-3 py-2.5 text-sm text-foreground">{p.client_services?.service_name || "—"}</td>
                            <td className="px-3 py-2.5 text-sm font-medium text-foreground">{Number(p.amount).toLocaleString("tr-TR")} {p.currency}</td>
                            <td className="px-3 py-2.5">
                              <Badge variant={p.status === "paid" ? "default" : "secondary"} className={`text-xs ${p.status === "paid" ? "bg-accent/10 text-accent border-accent/20" : p.status === "overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : ""}`}>
                                {p.status === "paid" ? "Ödendi" : p.status === "pending" ? "Beklemede" : p.status === "overdue" ? "Gecikmiş" : p.status}
                              </Badge>
                            </td>
                            <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[200px] truncate">{p.notes || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </motion.div>
            </div>
          </TabsContent>

          {/* NOTES TAB */}
          <TabsContent value="notes">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-xl p-6 space-y-4">
              <div className="flex gap-2">
                <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Müşteri hakkında not ekleyin..." rows={2} className="bg-secondary border-border text-sm" />
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()} className="shrink-0 self-end">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Ekle
                </Button>
              </div>
              {notes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Henüz not yok.</p>
              ) : (
                <div className="space-y-2">
                  {notes.map((n) => (
                    <div key={n.id} className="bg-secondary/30 rounded-lg px-4 py-3 group">
                      <div className="flex items-start justify-between">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{n.content}</p>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0" onClick={() => handleDeleteNote(n.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{format(new Date(n.created_at), "dd MMM yyyy HH:mm", { locale: tr })}</p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

// Add Service Dialog
function AddServiceDialog({ clientUserId, onAdded }: { clientUserId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ service_name: "", description: "", amount: "", billing_cycle: "monthly" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("client_services").insert({
      client_user_id: clientUserId,
      service_name: form.service_name,
      description: form.description,
      amount: Number(form.amount),
      billing_cycle: form.billing_cycle,
    });
    if (error) toast.error(error.message);
    else { toast.success("Hizmet eklendi"); setOpen(false); setForm({ service_name: "", description: "", amount: "", billing_cycle: "monthly" }); onAdded(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Hizmet Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Yeni Hizmet Ekle</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hizmet Adı</Label>
            <Input value={form.service_name} onChange={(e) => setForm({ ...form, service_name: e.target.value })} className="h-9" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Açıklama</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="h-9" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tutar (TRY)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-9" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ödeme Periyodu</Label>
              <Select value={form.billing_cycle} onValueChange={(v) => setForm({ ...form, billing_cycle: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Aylık</SelectItem>
                  <SelectItem value="yearly">Yıllık</SelectItem>
                  <SelectItem value="one_time">Tek Seferlik</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Kaydediliyor..." : "Ekle"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Add Payment Dialog
function AddPaymentDialog({ clientUserId, services, onAdded }: { clientUserId: string; services: any[]; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ service_id: "", amount: "", status: "paid", payment_date: new Date().toISOString().split("T")[0], notes: "" });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("client_payments").insert({
      client_user_id: clientUserId,
      service_id: form.service_id || null,
      amount: Number(form.amount),
      status: form.status,
      payment_date: form.payment_date,
      notes: form.notes,
    });
    if (error) toast.error(error.message);
    else { toast.success("Ödeme kaydedildi"); setOpen(false); setForm({ service_id: "", amount: "", status: "paid", payment_date: new Date().toISOString().split("T")[0], notes: "" }); onAdded(); }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 h-8"><Plus className="h-3.5 w-3.5" /> Ödeme Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Yeni Ödeme Kaydı</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hizmet</Label>
            <Select value={form.service_id} onValueChange={(v) => setForm({ ...form, service_id: v })}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Hizmet seçin (isteğe bağlı)" /></SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.service_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tutar (TRY)</Label>
              <Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="h-9" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tarih</Label>
              <Input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} className="h-9" required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Durum</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Ödendi</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="overdue">Gecikmiş</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Not</Label>
            <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-9" placeholder="İsteğe bağlı" />
          </div>
          <Button type="submit" disabled={saving} className="w-full">{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Team Management
function TeamManagement({ clientUserId, onChanged }: { clientUserId: string; onChanged: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState("view");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const callAdminFunction = async (action: string, payload: any) => {
    const res = await supabase.functions.invoke("admin-users", { body: { action, ...payload } });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const fetchTeam = async () => {
    try {
      const data = await callAdminFunction("list_team", { client_user_id: clientUserId });
      setMembers(data.members || []);
      setInvites(data.invites || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => { fetchTeam(); }, [clientUserId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await callAdminFunction("create_invite", {
        client_user_id: clientUserId,
        email: inviteEmail,
        permission: invitePermission,
      });
      const link = `${window.location.origin}/invite?token=${data.invite.token}`;
      setInviteLink(link);
      setInviteEmail("");
      toast.success("Davet oluşturuldu");
      fetchTeam();
      onChanged();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    toast.success("Link kopyalandı!");
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await callAdminFunction("remove_team_member", { member_id: memberId });
      toast.success("Ekip üyesi kaldırıldı");
      fetchTeam();
      onChanged();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCancelInvite = async (inviteId: string) => {
    try {
      await callAdminFunction("cancel_invite", { invite_id: inviteId });
      toast.success("Davet iptal edildi");
      fetchTeam();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div className="space-y-5">
      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">Ekip Üyesi Davet Et</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">E-posta</Label>
            <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="ekip@email.com" className="bg-secondary border-border h-9 text-sm" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Yetki</Label>
            <Select value={invitePermission} onValueChange={setInvitePermission}>
              <SelectTrigger className="bg-secondary border-border h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="view">Sadece Görüntüleme</SelectItem>
                <SelectItem value="full">Tam Erişim</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" disabled={loading} size="sm" className="bg-primary hover:bg-primary/90 h-9">
          <Send className="h-3.5 w-3.5 mr-1.5" /> Davet Oluştur
        </Button>
      </form>

      {inviteLink && (
        <div className="bg-secondary/50 rounded-lg p-3 space-y-2">
          <p className="text-xs text-muted-foreground">Davet linki oluşturuldu. Bu linki ekip üyesiyle paylaşın:</p>
          <div className="flex items-center gap-2">
            <Input value={inviteLink} readOnly className="bg-secondary border-border h-8 text-xs font-mono" />
            <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={handleCopyLink}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Active Members */}
      {members.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Aktif Üyeler</h4>
          <div className="space-y-1">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-foreground">{m.profiles?.full_name || m.profiles?.email || "—"}</span>
                  <Badge variant="secondary" className="ml-2 text-[10px]">{m.permission === "full" ? "Tam Erişim" : "Görüntüleme"}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveMember(m.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Invites */}
      {invites.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bekleyen Davetler</h4>
          <div className="space-y-1">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                <div>
                  <span className="text-sm text-foreground">{inv.email}</span>
                  <Badge variant="outline" className="ml-2 text-[10px] border-yellow-500/30 text-yellow-500">Bekliyor</Badge>
                  <Badge variant="secondary" className="ml-1 text-[10px]">{inv.permission === "full" ? "Tam Erişim" : "Görüntüleme"}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleCancelInvite(inv.id)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {members.length === 0 && invites.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Henüz ekip üyesi veya davet yok.</p>
      )}
    </div>
  );
}

export default ClientDetail;
