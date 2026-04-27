import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = {
  'SolarEdge': '#E31E24', 'Huawei': '#3b82f6', 'SMA': '#f59e0b',
  'Enphase': '#8b5cf6', 'Fronius': '#06b6d4', 'Sungrow': '#FF6B00', 'Other': '#6b7280',
};

const LOGOS = {
  'SolarEdge': 'https://cdn.worldvectorlogo.com/logos/solaredge.svg',
  'Sungrow': 'https://www.sungrowpower.com/static/new-sungrow-pc/images/common/logo.png',
  'Huawei': 'https://upload.wikimedia.org/wikipedia/commons/0/04/Huawei_Standard_logo.svg',
};

export default function InverterDistributionChart({ currentInverter }) {
  const { data: quotes } = useQuery({
    queryKey: ['quotes-inverter-stats'],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      const allQuotes = await base44.entities.Quote.list('-created_date', 1000);
      return allQuotes.filter(q => {
        const createdDate = new Date(q.created_date);
        return createdDate >= oneYearAgo && q.status !== 'draft' && q.status !== 'rejected' && q.inverter_type;
      });
    },
    initialData: [],
  });

  const chartData = useMemo(() => {
    if (!quotes || quotes.length === 0) return [];
    const inverterCounts = {};
    quotes.forEach(quote => {
      let manufacturer = (quote.inverter_type || 'Other').split(' ')[0];
      if (manufacturer.toLowerCase().includes('sungrow')) manufacturer = 'Sungrow';
      inverterCounts[manufacturer] = (inverterCounts[manufacturer] || 0) + 1;
    });
    const total = quotes.length;
    return Object.entries(inverterCounts).map(([name, count]) => ({ name, value: count, percentage: ((count / total) * 100).toFixed(0) })).sort((a, b) => b.value - a.value);
  }, [quotes]);

  const currentManufacturer = currentInverter ? currentInverter.split(' ')[0] : null;

  if (!chartData || chartData.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
      <Card className="overflow-hidden border-2 border-emerald-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center"><TrendingUp className="w-6 h-6 text-white" /></div>
            <div>
              <CardTitle className="text-xl text-gray-800">בחירת ממירים בקרב לקוחות ג׳סי</CardTitle>
              <p className="text-sm text-gray-600 mt-1">התפלגות הבחירות בשנה האחרונה</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" labelLine={false} label={false} outerRadius={120} fill="#8884d8" dataKey="value" animationBegin={0} animationDuration={800} stroke="#ffffff" strokeWidth={4}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#6b7280'} opacity={currentManufacturer === entry.name ? 1 : 0.85} />
                ))}
              </Pie>
              <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0];
                  return (
                    <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
                      <p className="font-bold text-gray-800">{data.name}</p>
                      <p className="text-sm text-gray-600">{data.payload.percentage}%</p>
                      {currentManufacturer === data.name && <p className="text-xs text-emerald-600 font-semibold mt-1">✓ הבחירה שלך</p>}
                    </div>
                  );
                }
                return null;
              }} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            {chartData.map((entry, index) => (
              <div key={index} className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl transition-all bg-white shadow-md border-2 ${currentManufacturer === entry.name ? 'border-emerald-500 shadow-lg' : 'border-gray-100'}`}>
                <div className="h-10 flex items-center justify-center w-full px-2">
                  {LOGOS[entry.name] ? (
                    <img src={LOGOS[entry.name]} alt={entry.name} className="max-h-10 max-w-full object-contain"
                      onError={e => { e.target.parentElement.innerHTML = `<p class="text-base font-black tracking-tight" style="color: ${COLORS[entry.name] || '#6b7280'}">${entry.name}</p>`; }} />
                  ) : (
                    <p className="text-base font-black tracking-tight" style={{ color: COLORS[entry.name] || '#6b7280' }}>{entry.name}</p>
                  )}
                </div>
                <div className="px-4 py-2 rounded-full text-white font-bold text-sm" style={{ backgroundColor: COLORS[entry.name] || '#6b7280' }}>{entry.percentage}%</div>
                {currentManufacturer === entry.name && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg"><span className="text-white text-xs font-bold">✓</span></div>
                )}
              </div>
            ))}
          </div>
          
          {currentManufacturer && chartData.some(d => d.name === currentManufacturer) && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-gray-700 text-center">
                <span className="font-bold text-emerald-700">{chartData.find(d => d.name === currentManufacturer)?.percentage}%</span>
                {' '}מהלקוחות שלנו בחרו ב{currentManufacturer} - בחירה מצוינת! ✨
              </p>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}