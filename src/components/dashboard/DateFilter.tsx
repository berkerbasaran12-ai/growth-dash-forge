import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DateFilterProps {
  dateFilter: string;
  onFilterChange: (value: string) => void;
  customRange: { from: Date | undefined; to: Date | undefined };
  onCustomRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export function DateFilter({ dateFilter, onFilterChange, customRange, onCustomRangeChange }: DateFilterProps) {
  const handlePresetChange = (val: string) => {
    onFilterChange(val);
    if (val !== "custom") {
      onCustomRangeChange({ from: undefined, to: undefined });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={dateFilter} onValueChange={handlePresetChange}>
        <SelectTrigger className="w-[160px] bg-secondary border-border h-9 text-sm">
          <CalendarIcon className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Bugün</SelectItem>
          <SelectItem value="7d">Son 7 Gün</SelectItem>
          <SelectItem value="30d">Son 30 Gün</SelectItem>
          <SelectItem value="custom">Özel Aralık</SelectItem>
        </SelectContent>
      </Select>

      {dateFilter === "custom" && (
        <div className="flex items-center gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs bg-secondary border-border", !customRange.from && "text-muted-foreground")}>
                {customRange.from ? format(customRange.from, "dd MMM", { locale: tr }) : "Başlangıç"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customRange.from} onSelect={(d) => onCustomRangeChange({ ...customRange, from: d })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">–</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-9 text-xs bg-secondary border-border", !customRange.to && "text-muted-foreground")}>
                {customRange.to ? format(customRange.to, "dd MMM", { locale: tr }) : "Bitiş"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customRange.to} onSelect={(d) => onCustomRangeChange({ ...customRange, to: d })} className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
