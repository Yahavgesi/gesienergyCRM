import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Zap, X } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background: linear-gradient(135deg, #10B981 0%, #00E5A0 100%); width: 32px; height: 32px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);"><div style="width: 12px; height: 12px; background: white; border-radius: 50%; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg);"></div></div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});

const customers = [
  { name: 'משפחת קרמניסקי', city: 'אשקלון', power: '18.44', lat: 31.6688, lng: 34.5742 },
  { name: 'משפחת עוזאני', city: 'ראש העין', power: '15.58', lat: 32.0942, lng: 34.9594 },
  { name: 'משפחת אקשטיין', city: 'כפר סבא', power: '13.22', lat: 32.1769, lng: 34.9072 },
  { name: 'משפחת קריימרמן', city: 'קצרין', power: '22.1', lat: 32.9931, lng: 35.6933 },
  { name: 'משפחת דדון', city: 'חיפה', power: '23.56', lat: 32.8191, lng: 34.9983 },
  { name: 'משפחת עוזרי', city: 'קרית חיים', power: '15.46', lat: 32.8189, lng: 35.0622 },
  { name: 'משפחת בוכניק', city: 'גבעת אלונים', power: '12.23', lat: 32.7000, lng: 35.1500 },
  { name: 'משפחת ביטון', city: 'גבעת אלונים', power: '10.80', lat: 32.7050, lng: 35.1550 },
  { name: 'משפחת פרץ', city: 'קצרין', power: '22.4', lat: 32.9900, lng: 35.6900 },
  { name: 'משפחת זיתוני', city: 'קצרין', power: '25.96', lat: 32.9980, lng: 35.6980 },
  { name: 'משפחת גידו', city: 'בית הילל', power: '17.38', lat: 33.1750, lng: 35.5967 },
  { name: 'משפחת כהן', city: 'נהריה', power: '19.8', lat: 33.0078, lng: 35.0942 },
  { name: 'משפחת לוי', city: 'עכו', power: '21.5', lat: 32.9267, lng: 35.0833 },
  { name: 'חוות הגליל', city: 'כפר ורדים', power: '45.6', lat: 32.9850, lng: 35.2100 },
  { name: 'משפחת שפירא', city: 'כרמיאל', power: '16.4', lat: 32.9186, lng: 35.2958 },
  { name: 'משפחת דוד', city: 'עין שריד', power: '17.9', lat: 32.4950, lng: 34.9500 },
  { name: 'משפחת מזרחי', city: 'קדימה', power: '20.3', lat: 32.2850, lng: 34.9100 },
  { name: 'משק אלברט', city: 'בנימינה', power: '38.5', lat: 32.5250, lng: 34.9400 },
  { name: 'משפחת ששון', city: 'באר שבע', power: '24.8', lat: 31.2520, lng: 34.7915 },
  { name: 'חוות הנגב', city: 'להבים', power: '52.4', lat: 31.3700, lng: 34.8200 },
  { name: 'משפחת בן דוד', city: 'אשדוד', power: '22.6', lat: 31.8044, lng: 34.6553 },
  { name: 'משפחת אוחנה', city: 'קריית גת', power: '21.1', lat: 31.6100, lng: 34.7644 },
  { name: 'משק השפלה', city: 'גדרה', power: '41.2', lat: 31.8117, lng: 34.7758 },
  { name: 'קבוצת רכישה 19 בתים', city: 'טירת הכרמל', power: '342', lat: 32.7636, lng: 34.9697 },
];

export default function IsraelCustomersMap() {
  const [hoveredCustomer, setHoveredCustomer] = useState(null);

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-transparent bg-gradient-to-r from-[#2C3E50] to-[#10B981] bg-clip-text mb-4">חלק קטן מלקוחותינו</h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">אלה רק מכמה מהמאות הלקוחות המרוצים שלנו בכל רחבי הארץ</p>
          <div className="w-32 h-1.5 bg-gradient-to-r from-[#10B981] via-[#1FD5A8] to-[#00E5A0] mx-auto rounded-full mt-4" />
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="relative bg-white rounded-3xl shadow-2xl p-4 md:p-8 border-4 border-white ring-4 ring-[#10B981]/10 overflow-hidden">
          <div className="h-[500px] md:h-[600px] rounded-2xl overflow-hidden relative">
            <MapContainer center={[31.5, 34.9]} zoom={7} style={{ height: '100%', width: '100%' }} className="z-0">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap' />
              {customers.map((customer, index) => (
                <Marker key={index} position={[customer.lat, customer.lng]} icon={customIcon} eventHandlers={{ click: () => setHoveredCustomer(customer) }}>
                  <Popup>
                    <div className="text-center p-2">
                      <h4 className="font-black text-lg text-[#2C3E50]">{customer.name}</h4>
                      <p className="font-bold text-gray-700">{customer.city}</p>
                      <div className="bg-gradient-to-r from-[#10B981] to-[#00E5A0] px-4 py-2 rounded-lg mt-2">
                        <p className="text-2xl font-black text-white">{customer.power} <span className="text-sm">Kwp</span></p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <AnimatePresence>
            {hoveredCustomer && (
              <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} transition={{ type: "spring", bounce: 0.4 }} className="mt-6 relative z-20">
                <div className="bg-gradient-to-br from-[#10B981]/5 to-[#00E5A0]/5 rounded-2xl shadow-xl p-6 border border-[#10B981]/30 max-w-md mx-auto relative">
                  <button onClick={() => setHoveredCustomer(null)} className="absolute top-3 left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100">
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#10B981] to-[#00E5A0] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"><Zap className="w-8 h-8 text-white" /></div>
                    <div className="flex-1">
                      <h4 className="text-xl font-black text-[#2C3E50] mb-2">{hoveredCustomer.name}</h4>
                      <div className="flex items-center gap-2 text-gray-700 mb-3"><MapPin className="w-4 h-4 text-[#10B981]" /><span className="text-sm font-bold">{hoveredCustomer.city}</span></div>
                      <div className="bg-gradient-to-r from-[#10B981] to-[#00E5A0] px-4 py-2 rounded-lg shadow-md">
                        <p className="text-2xl font-black text-white text-center">{hoveredCustomer.power} <span className="text-sm font-medium">Kwp</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md"><div className="w-3 h-3 rounded-full bg-[#10B981]" /><span className="text-gray-700 font-medium">מיקום לקוח</span></div>
            <div className="bg-gradient-to-r from-[#10B981]/10 to-[#00E5A0]/10 px-4 py-2 rounded-full border-2 border-[#10B981]/20"><span className="text-gray-700 font-bold">{customers.length} לקוחות מרוצים</span></div>
          </div>
          {!hoveredCustomer && <p className="text-center text-gray-600 text-sm mt-4 font-medium">לחצו על הסמנים במפה לצפייה בפרטים 📍</p>}
        </motion.div>
      </div>
    </section>
  );
}