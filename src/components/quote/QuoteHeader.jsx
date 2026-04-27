import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, User, Phone, Mail, MessageCircle } from 'lucide-react';

export default function QuoteHeader({ quote }) {
  const whatsappNumber = quote?.sales_agent_phone?.replace(/\D/g, '');
  const whatsappLink = whatsappNumber ? `https://wa.me/${whatsappNumber}` : null;

  return (
    <section className="relative py-32 px-6 bg-gradient-to-br from-[#10B981] via-[#1FD5A8] to-[#00E5A0] overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-[#2C3E50] via-[#10B981] to-[#00E5A0]" />

      <div className="container mx-auto max-w-5xl relative">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, type: "spring" }} className="text-center mb-16">
          <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: "spring", bounce: 0.6 }} className="mb-8">
            <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/697675ecdcb2e6276807d663/cb9410203_Artboard1copy3.png" alt="GESI Energy" className="h-24 md:h-32 lg:h-40 mx-auto drop-shadow-2xl" />
          </motion.div>
          
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4, type: "spring", bounce: 0.5 }}
            className="inline-block px-10 py-4 bg-white/95 backdrop-blur-sm rounded-full mb-8 shadow-2xl">
            <span className="text-base font-black text-transparent bg-gradient-to-r from-[#2C3E50] to-[#10B981] bg-clip-text">☀️ הצעת מחיר מערכת סולארית</span>
          </motion.div>
          
          <h1 className="text-3xl md:text-5xl lg:text-7xl font-black text-white mb-6 drop-shadow-2xl leading-tight px-4">
            הפתרון האנרגטי<br />המושלם עבורכם
          </h1>
          
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl text-white mb-6 font-bold drop-shadow-lg">
            לכבוד: {quote?.customer_name}
          </motion.p>
          
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 }}
            className="inline-block bg-white/20 backdrop-blur-md px-4 md:px-8 py-3 md:py-4 rounded-2xl border-2 border-white/30 mx-4">
            <p className="text-base md:text-2xl lg:text-3xl font-bold text-white flex flex-col md:flex-row items-center gap-2 md:gap-3 justify-center text-center">
              <MapPin className="w-5 h-5 md:w-7 md:h-7" />
              <span>{quote?.project_address} {quote?.city && `, ${quote.city}`}</span>
            </p>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, type: "spring" }}
          className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 md:p-10 shadow-2xl border-4 border-white/50 mx-4">
          <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="flex items-center gap-4 md:gap-5 justify-center md:justify-start">
              <motion.div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-[#10B981] to-[#00E5A0] rounded-2xl flex items-center justify-center shadow-xl"
                whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }} transition={{ duration: 0.5 }}>
                <User className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </motion.div>
              <div className="text-right">
                <p className="text-xs md:text-sm text-gray-600 font-medium">מנהל/ת מכירות</p>
                <p className="font-black text-lg md:text-xl text-[#2C3E50]">{quote?.sales_agent_name || 'לא צוין'}</p>
                <p className="text-xs md:text-sm text-gray-500 font-medium">ג׳סי פתרונות</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 justify-center">
              {quote?.sales_agent_email && (
                <motion.a href={`mailto:${quote.sales_agent_email}`} className="flex items-center justify-center gap-2 md:gap-3 bg-white text-[#2C3E50] px-5 md:px-8 py-3 md:py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 border-2 border-white/50 text-sm md:text-base" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Mail className="w-5 h-5 md:w-6 md:h-6 text-[#10B981]" /><span>אימייל</span>
                </motion.a>
              )}
              {quote?.sales_agent_phone && (
                <motion.a href={`tel:${quote.sales_agent_phone}`} className="flex items-center justify-center gap-2 md:gap-3 bg-white text-[#2C3E50] px-5 md:px-8 py-3 md:py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 border-2 border-white/50 text-sm md:text-base" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }}>
                  <Phone className="w-5 h-5 md:w-6 md:h-6 text-[#10B981]" /><span>התקשר</span>
                </motion.a>
              )}
              {whatsappLink && (
                <motion.a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 md:gap-3 bg-white text-[#2C3E50] px-5 md:px-8 py-3 md:py-4 rounded-2xl font-bold hover:shadow-2xl transition-all duration-300 border-2 border-white/50 text-sm md:text-base" whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.98 }}>
                  <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-[#25D366]" /><span>WhatsApp</span>
                </motion.a>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}