import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CHANNELS = [
  { value: "google_ads", label: "Google Ads" },
  { value: "meta", label: "Meta (FB/IG)" },
  { value: "seo", label: "SEO" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "other", label: "Diğer" },
];

export function MarketingEntryForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    channel: "google_ads",
    spend: "", traffic: "", conversions: "", leads: "",
    cpc: "", cpm: "", engagement_rate: "", roas: "",
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };
  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tarih</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kanal</Label>
          <Select value={form.channel} onValueChange={v => set("channel", v)}>
            <SelectTrigger className="bg-secondary border-border h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>{CHANNELS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Harcama (₺)</Label>
          <Input type="number" placeholder="0" value={form.spend} onChange={e => set("spend", e.target.value)} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Trafik</Label>
          <Input type="number" placeholder="0" value={form.traffic} onChange={e => set("traffic", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Dönüşüm</Label>
          <Input type="number" placeholder="0" value={form.conversions} onChange={e => set("conversions", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Lead (MQL)</Label>
          <Input type="number" placeholder="0" value={form.leads} onChange={e => set("leads", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CPC (₺)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.cpc} onChange={e => set("cpc", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">CPM (₺)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.cpm} onChange={e => set("cpm", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Etkileşim Oranı (%)</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.engagement_rate} onChange={e => set("engagement_rate", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">ROAS</Label>
          <Input type="number" step="0.01" placeholder="0.00" value={form.roas} onChange={e => set("roas", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
      </div>
      <Button type="submit" className="w-full h-9 text-sm bg-primary hover:bg-primary/90">Kaydet</Button>
    </form>
  );
}

export function SalesEntryForm({ onSave }: { onSave: (data: any) => void }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    total_sales: "", order_count: "", new_customers: "", returning_customers: "",
    net_profit: "", win_rate: "", avg_deal_value: "", appointments: "",
    churn_rate: "", ltv: "", leads_received: "",
  });

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(form); };
  const set = (key: string, val: string) => setForm({ ...form, [key]: val });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tarih</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Toplam Satış (₺)</Label>
          <Input type="number" placeholder="0" value={form.total_sales} onChange={e => set("total_sales", e.target.value)} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sipariş Adedi</Label>
          <Input type="number" placeholder="0" value={form.order_count} onChange={e => set("order_count", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Gelen Lead</Label>
          <Input type="number" placeholder="0" value={form.leads_received} onChange={e => set("leads_received", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Randevu Sayısı</Label>
          <Input type="number" placeholder="0" value={form.appointments} onChange={e => set("appointments", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kapatma Oranı (%)</Label>
          <Input type="number" step="0.1" placeholder="0" value={form.win_rate} onChange={e => set("win_rate", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ort. Anlaşma Değeri (₺)</Label>
          <Input type="number" placeholder="0" value={form.avg_deal_value} onChange={e => set("avg_deal_value", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Yeni Müşteri</Label>
          <Input type="number" placeholder="0" value={form.new_customers} onChange={e => set("new_customers", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tekrar Eden Müşteri</Label>
          <Input type="number" placeholder="0" value={form.returning_customers} onChange={e => set("returning_customers", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Kayıp Oranı (%)</Label>
          <Input type="number" step="0.1" placeholder="0" value={form.churn_rate} onChange={e => set("churn_rate", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">LTV (₺)</Label>
          <Input type="number" placeholder="0" value={form.ltv} onChange={e => set("ltv", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Net Kar (₺)</Label>
          <Input type="number" placeholder="0" value={form.net_profit} onChange={e => set("net_profit", e.target.value)} className="bg-secondary border-border h-9 text-sm" />
        </div>
      </div>
      <Button type="submit" className="w-full h-9 text-sm bg-primary hover:bg-primary/90">Kaydet</Button>
    </form>
  );
}
