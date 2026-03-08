import { motion } from "framer-motion";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

interface ChartData {
  date: string;
  sales: number;
  orders: number;
  newCustomers: number;
  profit: number;
  returningCustomers: number;
}

interface DashboardChartsProps {
  chartData: ChartData[];
  totalNewCustomers: number;
  totalReturningCustomers: number;
}

const DONUT_COLORS = ["hsl(210, 100%, 56%)", "hsl(160, 84%, 39%)"];

export function DashboardCharts({ chartData, totalNewCustomers, totalReturningCustomers }: DashboardChartsProps) {
  if (chartData.length === 0) return null;

  const donutData = [
    { name: "Yeni Müşteri", value: totalNewCustomers },
    { name: "Tekrar Eden", value: totalReturningCustomers },
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Sales Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Satış Trendi</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
            <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: '8px', color: 'hsl(0, 0%, 95%)', fontSize: 12 }} />
            <Area type="monotone" dataKey="sales" stroke="hsl(210, 100%, 56%)" fill="url(#salesGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Orders & Customers Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Sipariş & Müşteri</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
            <XAxis dataKey="date" tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(0, 0%, 55%)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: '8px', color: 'hsl(0, 0%, 95%)', fontSize: 12 }} />
            <Bar dataKey="orders" fill="hsl(210, 100%, 56%)" radius={[4, 4, 0, 0]} name="Sipariş" />
            <Bar dataKey="newCustomers" fill="hsl(160, 84%, 39%)" radius={[4, 4, 0, 0]} name="Yeni Müşteri" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Customer Donut */}
      {donutData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="glass rounded-xl p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Müşteri Dağılımı</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {donutData.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 8%)', border: '1px solid hsl(0, 0%, 16%)', borderRadius: '8px', color: 'hsl(0, 0%, 95%)', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'hsl(0, 0%, 55%)' }} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}
