import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Wrench, Calculator, FileText, Zap, MapPin, BarChart3, Upload, Download, Link2, QrCode, Hash, Layers, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOOL_SECTIONS = [
  {
    title: 'מחשבונים סולאריים',
    tools: [
      { id: 'kwp_calc', label: 'מחשבון kWp', icon: Zap, desc: 'חישוב גודל מערכת לפי צריכה' },
      { id: 'roi_calc', label: 'מחשבון ROI', icon: BarChart3, desc: 'חישוב החזר השקעה' },
      { id: 'roof_calc', label: 'מחשבון גג', icon: Layers, desc: 'כמות פאנלים לפי שטח' },
    ]
  },
  {
    title: 'כלי ייצוא/ייבוא',
    tools: [
      { id: 'export_leads', label: 'ייצוא לידים', icon: Download, desc: 'ייצוא לקובץ CSV' },
      { id: 'export_contacts', label: 'ייצוא אנשי קשר', icon: Download, desc: 'ייצוא לקובץ CSV' },
      { id: 'export_projects', label: 'ייצוא פרויקטים', icon: Download, desc: 'ייצוא לקובץ Excel' },
    ]
  },
  {
    title: 'כלי מערכת',
    tools: [
      { id: 'qr_gen', label: 'מחולל QR', icon: QrCode, desc: 'יצירת QR לקישורים' },
      { id: 'url_short', label: 'קיצור לינקים', icon: Link2, desc: 'קיצור URL לשיתוף' },
      { id: 'id_gen', label: 'מחולל מזהים', icon: Hash, desc: 'יצירת מזהים ייחודיים' },
    ]
  },
];

function KwpCalculator() {
  const [monthly, setMonthly] = useState('');
  const [result, setResult] = useState(null);
  const calc = () => {
    const kwh = parseFloat(monthly);
    if (!kwh) return;
    const kwp = (kwh / 30 / 4.5).toFixed(2);
    const panels = Math.ceil(kwp / 0.55);
    const area = (panels * 2.2).toFixed(1);
    setResult({ kwp, panels, area });
  };
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-400">צריכה חודשית ממוצעת (kWh)</Label>
        <Input value={monthly} onChange={e => setMonthly(e.target.value)} type="number" placeholder="600" className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
      </div>
      <Button onClick={calc} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>חשב</Button>
      {result && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'גודל מערכת', val: `${result.kwp} kWp` },
            { label: 'מספר פאנלים', val: `${result.panels} יח׳` },
            { label: 'שטח גג דרוש', val: `${result.area} מ״ר` },
          ].map(r => (
            <div key={r.label} className="bg-[#142e38]/70 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#2dd4a8]">{r.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoiCalculator() {
  const [kwp, setKwp] = useState('');
  const [price, setPrice] = useState('');
  const [tariff, setTariff] = useState('0.58');
  const [result, setResult] = useState(null);
  const calc = () => {
    const k = parseFloat(kwp), p = parseFloat(price), t = parseFloat(tariff);
    if (!k || !p || !t) return;
    const annualKwh = k * 1500;
    const annualSaving = annualKwh * t;
    const roi = (p / annualSaving).toFixed(1);
    setResult({ annualKwh: annualKwh.toLocaleString(), annualSaving: annualSaving.toLocaleString(), roi });
  };
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div><Label className="text-xs text-gray-400">גודל מערכת (kWp)</Label><Input value={kwp} onChange={e=>setKwp(e.target.value)} type="number" placeholder="10" className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white h-8 text-sm" /></div>
        <div><Label className="text-xs text-gray-400">עלות כוללת (₪)</Label><Input value={price} onChange={e=>setPrice(e.target.value)} type="number" placeholder="45000" className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white h-8 text-sm" /></div>
        <div><Label className="text-xs text-gray-400">מחיר חשמל (₪/kWh)</Label><Input value={tariff} onChange={e=>setTariff(e.target.value)} type="number" placeholder="0.58" className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white h-8 text-sm" /></div>
      </div>
      <Button onClick={calc} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>חשב ROI</Button>
      {result && (
        <div className="grid grid-cols-3 gap-3 mt-3">
          {[
            { label: 'ייצור שנתי', val: `${result.annualKwh} kWh` },
            { label: 'חיסכון שנתי', val: `₪${result.annualSaving}` },
            { label: 'החזר השקעה', val: `${result.roi} שנים` },
          ].map(r => (
            <div key={r.label} className="bg-[#142e38]/70 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-[#2dd4a8]">{r.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RoofCalculator() {
  const [area, setArea] = useState('');
  const [result, setResult] = useState(null);
  const calc = () => {
    const a = parseFloat(area);
    if (!a) return;
    const panels = Math.floor(a / 2.2);
    const kwp = (panels * 0.55).toFixed(1);
    setResult({ panels, kwp });
  };
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-400">שטח גג זמין (מ״ר)</Label>
        <Input value={area} onChange={e => setArea(e.target.value)} type="number" placeholder="50" className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
      </div>
      <Button onClick={calc} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>חשב</Button>
      {result && (
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[
            { label: 'מקסימום פאנלים', val: `${result.panels} יח׳` },
            { label: 'גודל מערכת', val: `${result.kwp} kWp` },
          ].map(r => (
            <div key={r.label} className="bg-[#142e38]/70 rounded-xl p-3 text-center">
              <p className="text-xl font-bold text-[#2dd4a8]">{r.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{r.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function QrGenerator() {
  const [url, setUrl] = useState('');
  const [qrUrl, setQrUrl] = useState('');
  const generate = () => {
    if (!url) return;
    setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
  };
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs text-gray-400">הכנס URL</Label>
        <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="mt-1 bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
      </div>
      <Button onClick={generate} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>צור QR</Button>
      {qrUrl && (
        <div className="flex flex-col items-center gap-3 mt-3">
          <img src={qrUrl} alt="QR Code" className="w-40 h-40 rounded-xl" />
          <a href={qrUrl} download="qr.png" className="text-xs text-[#2dd4a8] hover:underline">הורד QR</a>
        </div>
      )}
    </div>
  );
}

function AiSolarAdvisor() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `אתה יועץ מומחה לאנרגיה סולארית בישראל. ענה על השאלה הבאה בעברית בצורה מקצועית וברורה:\n\n${question}`,
    });
    setAnswer(res);
    setLoading(false);
  };
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder="שאל שאלה סולארית..." className="bg-[#142e38] border-[rgba(45,212,168,0.1)] text-white" />
        <Button onClick={ask} disabled={loading} size="sm" style={{ background: 'linear-gradient(135deg, #2dd4a8, #1fa882)' }}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'שאל'}
        </Button>
      </div>
      {answer && (
        <div className="bg-[#0f2229] border border-[rgba(45,212,168,0.1)] rounded-xl p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function CrmTools() {
  const [activeTool, setActiveTool] = useState('kwp_calc');

  const toolComponents = {
    kwp_calc: <KwpCalculator />,
    roi_calc: <RoiCalculator />,
    roof_calc: <RoofCalculator />,
    qr_gen: <QrGenerator />,
    ai_advisor: <AiSolarAdvisor />,
  };

  const allTools = [
    ...TOOL_SECTIONS[0].tools,
    ...TOOL_SECTIONS[1].tools,
    ...TOOL_SECTIONS[2].tools,
    { id: 'ai_advisor', label: 'יועץ AI סולארי', icon: Zap, desc: 'שאל שאלות מקצועיות' },
  ];

  const activeToolMeta = allTools.find(t => t.id === activeTool);

  return (
    <div className="p-4 lg:p-6 space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-white">כלים</h1>
        <p className="text-sm text-gray-400">מחשבונים, ייצוא נתונים וכלים שימושיים</p>
      </div>

      {/* AI Advisor Banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setActiveTool('ai_advisor')}
        className="cursor-pointer rounded-2xl p-5 border border-[#2dd4a8]/30 bg-gradient-to-r from-[#2dd4a8]/10 to-[#1fa882]/5 hover:border-[#2dd4a8]/50 transition-all">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#2dd4a8]/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#2dd4a8]" />
          </div>
          <div>
            <p className="text-base font-semibold text-white">יועץ AI סולארי</p>
            <p className="text-sm text-gray-400">קבל תשובות מיידיות על שאלות טכניות, רגולציה ומחירים</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Tool Selector */}
        <div className="space-y-4">
          {TOOL_SECTIONS.map(section => (
            <div key={section.title}>
              <p className="text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2">{section.title}</p>
              <div className="space-y-1">
                {section.tools.map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all ${activeTool === tool.id ? 'bg-[#2dd4a8]/10 text-[#2dd4a8] border border-[#2dd4a8]/20' : 'text-gray-400 hover:bg-[#142e38] hover:text-white'}`}>
                    <tool.icon className="w-4 h-4" />
                    <span>{tool.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Active Tool */}
        <div className="lg:col-span-3">
          {activeTool && (
            <motion.div key={activeTool} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="gesi-card p-5">
              <div className="flex items-center gap-3 mb-5">
                {activeToolMeta && (
                  <>
                    <div className="w-10 h-10 rounded-xl bg-[#2dd4a8]/10 flex items-center justify-center">
                      <activeToolMeta.icon className="w-5 h-5 text-[#2dd4a8]" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{activeToolMeta.label}</h3>
                      <p className="text-xs text-gray-400">{activeToolMeta.desc}</p>
                    </div>
                  </>
                )}
              </div>
              {toolComponents[activeTool] || (
                <div className="text-center py-12 text-gray-500">
                  <Wrench className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">כלי זה בפיתוח</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}