import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { type LucideIcon } from "lucide-react";

interface CardDef {
  title: string;
  value: string;
  icon: LucideIcon;
  current: number;
  previous: number;
  suffix?: string;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const pct = pctChange(current, previous);
  if (pct === null) return null;
  const isUp = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${isUp ? "text-accent" : "text-destructive"}`}>
      {isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

export function SummaryCards({ cards }: { cards: CardDef[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <motion.div key={card.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="glass rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{card.title}</span>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-semibold text-foreground">{card.value}</span>
            <TrendBadge current={card.current} previous={card.previous} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}
