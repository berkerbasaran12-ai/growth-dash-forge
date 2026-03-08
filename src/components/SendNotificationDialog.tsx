import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface ClientProfile {
  user_id: string;
  full_name: string;
  email: string;
}

export function SendNotificationDialog() {
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fetchClients = async () => {
      const { data } = await supabase.from("profiles").select("user_id, full_name, email");
      if (data) setClients(data);
    };
    fetchClients();
  }, [open]);

  const handleSend = async () => {
    if (!selectedUserId || !title.trim()) {
      toast.error("Lütfen müşteri ve başlık seçin");
      return;
    }

    setSending(true);
    try {
      const targets = selectedUserId === "all"
        ? clients.map((c) => ({ user_id: c.user_id, title, message, is_read: false }))
        : [{ user_id: selectedUserId, title, message, is_read: false }];

      const { error } = await supabase.from("notifications").insert(targets);
      if (error) throw error;

      toast.success(selectedUserId === "all" ? "Tüm müşterilere bildirim gönderildi" : "Bildirim gönderildi");
      setOpen(false);
      setTitle("");
      setMessage("");
      setSelectedUserId("");
    } catch (err: any) {
      toast.error("Gönderilemedi: " + err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Send className="h-3.5 w-3.5" /> Bildirim Gönder
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bildirim Gönder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Alıcı</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Müşteri seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Müşteriler</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.user_id} value={c.user_id}>
                    {c.full_name || c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Başlık</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bildirim başlığı" className="h-9" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mesaj</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Bildirim mesajı (isteğe bağlı)" rows={3} />
          </div>
          <Button onClick={handleSend} disabled={sending} className="w-full">
            {sending ? "Gönderiliyor..." : "Gönder"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
