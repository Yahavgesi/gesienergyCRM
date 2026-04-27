import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Shield, Clock, Smartphone, BarChart3, TrendingUp, Zap, Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ROIAnalysis from './ROIAnalysis';

export default function GroupPurchaseQuoteView({ quote }) {
  const [pricingItems, setPricingItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPricingItems(); }, [quote.id]);

  const loadPricingItems = async () => {
    if (!quote.id) { setLoading(false); return; }
    try {
      const items = await base44.entities.GroupPurchasePricingItem.filter({ quote_id: quote.id }, 'order_index', 100);
      setPricingItems(items);
    } catch (error) { console.error('Error loading pricing items:', error); }
    finally { setLoading(false); }
  };

  const advantages = [
    { title: 'קיצור זמני התהליך', subtitle: 'רובד במספי חודשים', icon: Clock, gradient: 'from-emerald-500 to-teal-600' },
    { title: 'מענה מהיר ואיכותי', subtitle: 'במהלך הרכישה ואחריה', icon: CheckCircle, gradient: 'from-teal-500 to-green-600' },
    { title: 'איכות ביצוע ובקרת איכות', subtitle: 'קפדנים ביותר', icon: Shield, gradient: 'from-green-500 to-emerald-600' },
  ];

  const steps = [
    'איכון הבתים, המודלים שנתקים וסגום יחד עם היום.',
    'סיכום תנאי שירות המעולה.',
    'תחילת תהליך ביורוקרטי והוצאת אישורים.',
    'בנייה מודול סופי ותכנון מפורט.',
    'מכונות הבית, תחילת עבודי תכנון והתקנה.',
    'חיבור המערכת הסולארית ומעבר לשירות.',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-emerald-600 font-bold text-xl">טוען פרזנטציה...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0" dir="rtl">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-emerald-600 via-teal-600 to-green-600 overflow-hidden flex items-center justify-center">
        <div className="absolute top-8 right-8 z-20">
          <motion.img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697675ecdcb2e6276807d663/cb9410203_Artboard1copy3.png" alt="Gesi Energy" className="h-24 drop-shadow-2xl" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} />
        </div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight drop-shadow-2xl">ALL THE WAY HOME</h1>
            <p className="text-2xl md:text-3xl text-white/95 mb-12 leading-relaxed drop-shadow-lg">נשמח להוביל אתכם<br/>כל הדרך הביתה, ג׳סי פתרונות.</p>
          </motion.div>
        </div>
      </section>

      {/* Advantages */}
      <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">יתרונות</h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full" />
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {advantages.map((adv, index) => {
              const IconComponent = adv.icon;
              return (
                <motion.div key={index} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all border-2 border-emerald-100">
                  <div className={`w-16 h-16 bg-gradient-to-br ${adv.gradient} rounded-2xl flex items-center justify-center mb-6 mx-auto`}><IconComponent className="w-8 h-8 text-white" /></div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{adv.title}</h3>
                  <p className="text-gray-600 text-center">{adv.subtitle}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-24 px-6 bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">השלבים ביחד איתנו</h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full" />
          </motion.div>
          <div className="space-y-6">
            {steps.map((step, index) => (
              <motion.div key={index} initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 bg-white rounded-2xl p-6 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xl">{index + 1}</div>
                <p className="text-lg text-gray-700 leading-relaxed pt-2">{step}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="py-24 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">מערכת לדוגמא - {quote.system_power_kw} קילוואט</h2>
            <div className="w-32 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl p-8 mb-12 border-2 border-emerald-200">
            <div className="grid md:grid-cols-4 gap-6">
              {[['הספק מערכת', `${quote.system_power_kw || 22.4}`, 'קילוואט'], ['מספר פאנלים', `${quote.panel_count || 56}`, 'יחידות'], ['עלות מערכת', `₪${(quote.system_cost || 0).toLocaleString()}`, 'כולל מע״מ'], ['מחיר לקילוואט', `₪${(quote.cost_per_kw || 0).toLocaleString()}`, 'מותקן']].map(([label, val, sub]) => (
                <div key={label} className="bg-white rounded-2xl p-6 text-center shadow-lg">
                  <p className="text-sm text-gray-600 mb-2">{label}</p>
                  <p className="text-3xl font-black text-emerald-600">{val}</p>
                  <p className="text-xs text-gray-500 mt-1">{sub}</p>
                </div>
              ))}
            </div>
          </motion.div>
          <ROIAnalysis quote={quote} />
        </div>
      </section>

      {/* Pricing Table */}
      {pricingItems.length > 0 && (
        <section className="py-24 px-6 bg-gradient-to-br from-gray-50 to-emerald-50">
          <div className="container mx-auto max-w-7xl">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">טבלת מחירים</h2>
              <div className="w-32 h-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 mx-auto rounded-full" />
            </motion.div>
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                      <th className="p-4 text-right font-bold text-lg">גודל מערכת</th>
                      <th colSpan="3" className="p-4 text-center font-bold text-lg">SunGrow</th>
                      <th colSpan="3" className="p-4 text-center font-bold text-lg">SolarEdge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingItems.map((item, index) => (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-emerald-50 transition-colors`}>
                        <td className="p-4 font-bold text-gray-900 text-lg border-l-4 border-emerald-500">{item.system_size}</td>
                        <td className="p-4 text-center font-semibold text-orange-700 bg-orange-50">₪{item.sungrow_12_15?.toLocaleString()}</td>
                        <td className="p-4 text-center font-semibold text-orange-700 bg-orange-50">₪{item.sungrow_15_18?.toLocaleString()}</td>
                        <td className="p-4 text-center font-semibold text-orange-700 bg-orange-50">₪{item.sungrow_18_22?.toLocaleString()}</td>
                        <td className="p-4 text-center font-semibold text-blue-700 bg-blue-50">₪{item.solaredge_12_16?.toLocaleString()}</td>
                        <td className="p-4 text-center font-semibold text-blue-700 bg-blue-50">₪{item.solaredge_15_18?.toLocaleString()}</td>
                        <td className="p-4 text-center font-semibold text-blue-700 bg-blue-50">₪{item.solaredge_18_22?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-green-600">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">מעוניינים להצטרף?</h2>
          <p className="text-xl text-white/90 mb-8">צרו קשר עוד היום ונתחיל את התהליך יחד</p>
          {quote.sales_agent_phone && (
            <div className="inline-block bg-white rounded-2xl p-8 shadow-2xl">
              <p className="text-gray-600 mb-2">איש קשר:</p>
              <p className="text-2xl font-bold text-gray-900 mb-4">{quote.sales_agent_name}</p>
              <a href={`tel:${quote.sales_agent_phone}`} className="text-3xl font-black text-emerald-600">{quote.sales_agent_phone}</a>
              {quote.sales_agent_email && <p className="text-gray-600 mt-4">{quote.sales_agent_email}</p>}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}