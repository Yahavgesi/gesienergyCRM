import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export default function ROIAnalysis({ quote }) {
  const systemCost = quote.system_cost || 0;
  const systemPowerKw = quote.system_power_kw || 0;
  const selectedRate = quote.selected_rate || 'fixed';
  const isCommercial = quote.template_type === 'commercial';

  const roiData = useMemo(() => {
    const data = [];
    let cumulativeIncome = 0;
    const annualProduction = systemPowerKw * 1590;
    const insuranceCost = systemCost * 0.01;
    const interestRate = 0.07;
    const urbanPremium = quote.urban_premium ? 0.06 : 0;
    const loanYears = 8;
    const annualPrincipalPayment = systemCost / loanYears;
    let remainingPrincipal = systemCost;

    let commercialWeightedRate = 0;
    if (isCommercial) {
      const acPowerKw = quote.ac_power_kw || systemPowerKw * 0.85;
      const tariffs = { tier1_0_15: 48, tier2_15_100: 37.31, tier3_100_300: 34.37, tier4_300_630: 28.44 };
      let weightedSum = 0;
      if (acPowerKw <= 15) weightedSum = acPowerKw * tariffs.tier1_0_15;
      else if (acPowerKw <= 100) weightedSum = (15 * tariffs.tier1_0_15) + ((acPowerKw - 15) * tariffs.tier2_15_100);
      else if (acPowerKw <= 300) weightedSum = (15 * tariffs.tier1_0_15) + (85 * tariffs.tier2_15_100) + ((acPowerKw - 100) * tariffs.tier3_100_300);
      else weightedSum = (15 * tariffs.tier1_0_15) + (85 * tariffs.tier2_15_100) + (200 * tariffs.tier3_100_300) + ((acPowerKw - 300) * tariffs.tier4_300_630);
      commercialWeightedRate = weightedSum / acPowerKw / 100;
    }

    for (let year = 1; year <= 25; year++) {
      const degradation = Math.pow(1 - 0.003, year - 1);
      const annualYield = annualProduction * degradation;
      let baseRate;
      if (isCommercial) baseRate = commercialWeightedRate;
      else if (selectedRate === 'accelerated') baseRate = year <= 5 ? 0.60 : 0.39;
      else if (selectedRate === 'fixed') baseRate = 0.48;
      else if (selectedRate === 'indexed') baseRate = 0.387 * Math.pow(1.03, year - 1);
      else baseRate = 0.48;
      const rate = isCommercial ? baseRate : (baseRate + (year <= 17 ? urbanPremium : 0));
      const grossIncome = annualYield * rate;
      const annualIncome = grossIncome - insuranceCost;
      const annualInterest = year <= loanYears && remainingPrincipal > 0 ? Math.round(remainingPrincipal * interestRate) : 0;
      const principalPayment = year <= loanYears ? Math.round(annualPrincipalPayment) : 0;
      if (year <= loanYears) remainingPrincipal = Math.max(0, remainingPrincipal - principalPayment);
      cumulativeIncome += annualIncome;
      data.push({ year, yield: Math.round(annualYield), insurance: Math.round(insuranceCost), grossIncome: Math.round(grossIncome), income: Math.round(annualIncome), cumulative: Math.round(cumulativeIncome), systemCost, rate: rate.toFixed(2), principalPayment, annualInterest, remainingPrincipal: year <= loanYears ? Math.round(remainingPrincipal) : 0 });
    }
    return data;
  }, [systemCost, systemPowerKw, selectedRate, quote.urban_premium]);

  const firstYearGrossIncome = roiData[0]?.grossIncome || 1;
  const paybackYear = systemCost > 0 ? Math.ceil(systemCost / firstYearGrossIncome) : 0;

  return (
    <TooltipProvider>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">תפוקה והכנסות שנתיות</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roiData.filter((_, i) => i % 2 === 0 || i === 24)} margin={{ left: 0, right: 50 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis position="right" width={45} />
                <Tooltip formatter={value => value.toLocaleString()} />
                <Legend />
                <Bar dataKey="yield" fill="#10b981" name="תפוקה (kWh)" />
                <Bar dataKey="income" fill="#3b82f6" name="הכנסה (₪)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">הצטברות הכנסות מול עלות</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roiData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip formatter={value => `₪${value.toLocaleString()}`} />
                <Legend />
                <Line type="monotone" dataKey="cumulative" stroke="#10b981" strokeWidth={3} name="הכנסה מצטברת" />
                <Line type="monotone" dataKey="systemCost" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="עלות מערכת" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6">
            <h3 className="text-2xl font-bold text-white">טבלת החזר השקעה - 25 שנה</h3>
            <p className="text-emerald-50 mt-1">החזר השקעה צפוי: שנה {paybackYear}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['שנה', 'תעריף (אג\')', 'תפוקה (kWh)', 'הכנסה ברוטו (₪)', 'ביטוח (₪)', 'ריבית 7% (₪)', 'החזר קרן (₪)', 'קרן נותרת (₪)', 'הכנסה מצטברת (₪)'].map(h => (
                    <th key={h} className="text-right p-4 font-bold text-gray-700 text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roiData.map(row => (
                  <tr key={row.year} className={`border-b hover:bg-gray-50 transition-colors ${row.remainingPrincipal === 0 ? 'bg-emerald-50' : ''}`}>
                    <td className="text-right p-4 font-semibold">{row.year}</td>
                    <td className="text-right p-4 text-blue-600 font-medium">{(parseFloat(row.rate) * 100).toFixed(2)}</td>
                    <td className="text-right p-4">{row.yield.toLocaleString()}</td>
                    <td className="text-right p-4 text-emerald-600 font-semibold">₪{row.grossIncome.toLocaleString()}</td>
                    <td className="text-right p-4 text-red-600">₪{row.insurance.toLocaleString()}</td>
                    <td className="text-right p-4 text-orange-600">₪{row.annualInterest.toLocaleString()}</td>
                    <td className="text-right p-4 text-purple-600 font-semibold">{row.principalPayment === 0 ? '-' : `₪${row.principalPayment.toLocaleString()}`}</td>
                    <td className="text-right p-4 font-bold">{row.remainingPrincipal === 0 && row.year > 1 ? '✓ שולם' : row.remainingPrincipal === 0 ? '-' : `₪${row.remainingPrincipal.toLocaleString()}`}</td>
                    <td className="text-right p-4 font-bold text-lg">₪{row.cumulative.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}