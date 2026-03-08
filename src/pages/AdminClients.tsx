import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, MoreHorizontal, UserCheck, UserX, Trash2, Users, Copy, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logActivity } from "@/hooks/useActivityLog";

const AdminClients = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teamDialogClient, setTeamDialogClient] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);

  const fetchClients = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (profiles) setClients(profiles);
  };

  useEffect(() => { fetchClients(); }, []);

  const callAdminFunction = async (action: string, payload: any) => {
    const res = await supabase.functions.invoke("admin-users", {
      body: { action, ...payload },
    });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  };

  const handleCreateClient = async (formData: { name: string; email: string; company: string; password: string }) => {
    try {
      await callAdminFunction("create_user", {
        email: formData.email,
        password: formData.password,
        full_name: formData.name,
        company: formData.company,
      });
      toast.success("Müşteri oluşturuldu");
      logActivity("client_create", `${formData.name} (${formData.email}) müşterisi oluşturuldu`);
      setDialogOpen(false);
      fetchClients();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await callAdminFunction("toggle_active", { user_id: userId, is_active: !currentActive });
      toast.success(currentActive ? "Müşteri pasif yapıldı" : "Müşteri aktif yapıldı");
      logActivity("client_toggle", `Müşteri ${currentActive ? "pasif" : "aktif"} yapıldı`);
      fetchClients();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bu müşteriyi silmek istediğinizden emin misiniz?")) return;
    try {
      await callAdminFunction("delete_user", { user_id: userId });
      toast.success("Müşteri silindi");
      fetchClients();
    } catch (err: any) { toast.error(err.message); }
  };

  const filtered = clients.filter(
    (c) => c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="space-y-6 max-w-7xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Müşteri Yönetimi</h1>
            <p className="text-sm text-muted-foreground mt-1">{clients.length} müşteri kayıtlı</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-primary hover:bg-primary/90 h-9"><Plus className="h-4 w-4 mr-1.5" /> Yeni Müşteri</Button>
            </DialogTrigger>
            <DialogContent className="glass border-border">
              <DialogHeader><DialogTitle className="text-foreground">Yeni Müşteri Ekle</DialogTitle></DialogHeader>
              <NewClientForm onSubmit={handleCreateClient} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Müşteri ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-secondary border-border h-9" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Müşteri</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Şirket</th>
                  <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">Durum</th>
                  <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-5 py-3">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3 cursor-pointer" onClick={() => navigate(`/admin/clients/${client.user_id}`)}>
                      <div><div className="text-sm font-medium text-foreground hover:text-primary transition-colors">{client.full_name || "-"}</div><div className="text-xs text-muted-foreground">{client.email}</div></div>
                    </td>
                    <td className="px-5 py-3 text-sm text-foreground">{client.company || "-"}</td>
                    <td className="px-5 py-3">
                      <Badge variant={client.is_active ? "default" : "secondary"} className={client.is_active ? "bg-accent/10 text-accent border-accent/20 text-xs" : "bg-secondary text-muted-foreground text-xs"}>
                        {client.is_active ? "Aktif" : "Pasif"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground" onClick={() => setTeamDialogClient(client)}>
                          <Users className="h-4 w-4 mr-1" />
                          <span className="text-xs">Ekip</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass border-border">
                            <DropdownMenuItem className="text-sm cursor-pointer" onClick={() => handleToggleActive(client.user_id, client.is_active)}>
                              {client.is_active ? <><UserX className="h-3.5 w-3.5 mr-2" /> Pasif Yap</> : <><UserCheck className="h-3.5 w-3.5 mr-2" /> Aktif Yap</>}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-sm cursor-pointer text-destructive" onClick={() => handleDelete(client.user_id)}>
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">Müşteri bulunamadı</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Team Management Dialog */}
      <Dialog open={!!teamDialogClient} onOpenChange={(open) => !open && setTeamDialogClient(null)}>
        <DialogContent className="glass border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Ekip Yönetimi — {teamDialogClient?.full_name || teamDialogClient?.email}
            </DialogTitle>
          </DialogHeader>
          {teamDialogClient && (
            <TeamManagement client={teamDialogClient} callAdminFunction={callAdminFunction} />
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

function TeamManagement({ client, callAdminFunction }: { client: any; callAdminFunction: (action: string, payload: any) => Promise<any> }) {
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePermission, setInvitePermission] = useState("view");
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");

  const fetchTeam = async () => {
    try {
      const data = await callAdminFunction("list_team", { client_user_id: client.user_id });
      setMembers(data.members || []);
      setInvites(data.invites || []);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => { fetchTeam(); }, [client.user_id]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await callAdminFunction("create_invite", {
        client_user_id: client.user_id,
        email: inviteEmail,
        permission: invitePermission,
      });
      const link = `${window.location.origin}/invite?token=${data.invite.token}`;
      setInviteLink(link);
      setInviteEmail("");
      toast.success("Davet oluşturuldu");
      fetchTeam();
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
    <div className="space-y-5 pt-2">
      {/* Invite Form */}
      <form onSubmit={handleInvite} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">E-posta</Label>
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ekip@email.com"
              className="bg-secondary border-border h-9 text-sm"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Yetki</Label>
            <Select value={invitePermission} onValueChange={setInvitePermission}>
              <SelectTrigger className="bg-secondary border-border h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
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

      {/* Generated Link */}
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
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {m.permission === "full" ? "Tam Erişim" : "Görüntüleme"}
                  </Badge>
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
                  <Badge variant="secondary" className="ml-1 text-[10px]">
                    {inv.permission === "full" ? "Tam Erişim" : "Görüntüleme"}
                  </Badge>
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

function NewClientForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [formData, setFormData] = useState({ name: '', email: '', company: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Ad Soyad</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="bg-secondary border-border h-9 text-sm" required /></div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">E-posta</Label><Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="bg-secondary border-border h-9 text-sm" required /></div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Şirket</Label><Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} className="bg-secondary border-border h-9 text-sm" /></div>
      <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Şifre</Label><Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="bg-secondary border-border h-9 text-sm" required minLength={6} /></div>
      <Button type="submit" disabled={loading} className="w-full h-9 text-sm bg-primary hover:bg-primary/90">
        {loading ? <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> : "Oluştur"}
      </Button>
    </form>
  );
}

export default AdminClients;
