import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: 'hsl(0, 0%, 8%)',
  border: '1px solid hsl(0, 0%, 16%)',
  borderRadius: '8px',
  color: 'hsl(0, 0%, 95%)',
  fontSize: 12,
};

const GRID_STROKE = "hsl(0, 0%, 16%)";
const AXIS_TICK = { fill: 'hsl(0, 0%, 55%)', fontSize: 12 };
const CHANNEL_COLORS: Record<string, string> = {
  google_ads: "hsl(210, 100%, 56%)",
  meta: "hsl(280, 67%, 60%)",
  seo: "hsl(160, 84%, 39%)",
  linkedin: "hsl(38, 92%, 50%)",
  other: "hsl(350, 80%, 55%)",
};

const CHANNEL_LABELS: Record<string, string> = {
  google_ads: "Google Ads",
  meta: "Meta",
  seo: "SEO",
  linkedin: "LinkedIn",
  other: "Diğer",
};

interface MarketingChartsProps {
  chartData: { date: string; spend: number; traffic: number; conversions: number; leads: number }[];
  channelBreakdown: { channel: string; spend: number; leads: number; conversions: number }[];
}

export function MarketingCharts({ chartData, channelBreakdown }: MarketingChartsProps) {
  if (chartData.length === 0) return null;

  const donutData = channelBreakdown.filter(c => c.spend > 0).map(c => ({
    name: CHANNEL_LABELS[c.channel] || c.channel,
    value: c.spend,
    color: CHANNEL_COLORS[c.channel] || CHANNEL_COLORS.other,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Harcama & Lead Trendi</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(280, 67%, 60%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(280, 67%, 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="spend" stroke="hsl(280, 67%, 60%)" fill="url(#spendGrad)" strokeWidth={2} name="Harcama (₺)" />
            <Area type="monotone" dataKey="leads" stroke="hsl(160, 84%, 39%)" fill="transparent" strokeWidth={2} name="Lead" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Trafik & Dönüşüm</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="traffic" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} name="Trafik" />
            <Bar dataKey="conversions" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} name="Dönüşüm" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {donutData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-5 lg:col-span-2">
          <h3 className="text-sm font-medium text-foreground mb-4">Kanal Bazlı Harcama Dağılımı</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={3} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => `₺${v.toLocaleString("tr-TR")}`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

interface SalesChartsProps {
  chartData: { date: string; sales: number; orders: number; newCustomers: number; returningCustomers: number; profit: number }[];
  totalNewCustomers: number;
  totalReturningCustomers: number;
}

export function SalesCharts({ chartData, totalNewCustomers, totalReturningCustomers }: SalesChartsProps) {
  if (chartData.length === 0) return null;

  const donutData = [
    { name: "Yeni Müşteri", value: totalNewCustomers },
    { name: "Tekrar Eden", value: totalReturningCustomers },
  ].filter(d => d.value > 0);

  const DONUT_COLORS = ["hsl(210, 100%, 56%)", "hsl(160, 84%, 39%)"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Satış Trendi</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="salesGrad2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Area type="monotone" dataKey="sales" stroke="hsl(210, 100%, 56%)" fill="url(#salesGrad2)" strokeWidth={2} name="Satış (₺)" />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Sipariş & Müşteri</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
            <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="orders" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} name="Sipariş" />
            <Bar dataKey="newCustomers" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Yeni Müşteri" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {donutData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Müşteri Dağılımı</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
