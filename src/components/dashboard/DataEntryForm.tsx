import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DataEntryFormProps {
  onSave: (data: any) => void;
}

export function DataEntryForm({ onSave }: DataEntryFormProps) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    totalSales: '', orderCount: '', newCustomers: '', returningCustomers: '', netProfit: '',
  });

  const avgCart = formData.totalSales && formData.orderCount
    ? (Number(formData.totalSales) / Number(formData.orderCount)).toFixed(2) : '0.00';

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tarih</Label>
          <Input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Toplam Satış (₺)</Label>
          <Input type="number" placeholder="0.00" value={formData.totalSales} onChange={e => setFormData({...formData, totalSales: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Sipariş Adedi</Label>
          <Input type="number" placeholder="0" value={formData.orderCount} onChange={e => setFormData({...formData, orderCount: e.target.value})} className="bg-secondary border-border h-9 text-sm" required />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ort. Sepet Değeri (₺)</Label>
          <Input type="text" value={avgCart} readOnly className="bg-muted border-border h-9 text-sm text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Yeni Müşteri</Label>
          <Input type="number" placeholder="0" value={formData.newCustomers} onChange={e => setFormData({...formData, newCustomers: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Tekrar Eden Müşteri</Label>
          <Input type="number" placeholder="0" value={formData.returningCustomers} onChange={e => setFormData({...formData, returningCustomers: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Net Kar (₺)</Label>
          <Input type="number" placeholder="0.00" value={formData.netProfit} onChange={e => setFormData({...formData, netProfit: e.target.value})} className="bg-secondary border-border h-9 text-sm" />
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 h-9 text-sm bg-primary hover:bg-primary/90">Kaydet</Button>
      </div>
    </form>
  );
}
