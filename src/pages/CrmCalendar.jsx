import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import {
  format, startOfWeek, endOfWeek, eachDayOfInterval,
  startOfMonth, endOfMonth, isSameDay, isToday, addDays,
  addWeeks, subWeeks, addMonths, subMonths, parseISO
} from "date-fns";
import { he } from "date-fns/locale";
import { ChevronRight, ChevronLeft, Calendar, Bell, ClipboardList, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const VIEW_OPTIONS = [
  { value: "week", label: "שבוע" },
  { value: "month", label: "חודש" },
  { value: "day", label: "היום" },
];

const EVENT_TYPES = {
  follow_up: { label: "מעקב ליד", color: "#f59e0b", bg: "#fef3c7", icon: Bell },
  installation: { label: "התקנה", color: "#0ea5a0", bg: "#ccfbf1", icon: ClipboardList },
  task_due: { label: "משימה", color: "#8b5cf6", bg: "#ede9fe", icon: Target },
  grid_connection: { label: "חיבור לרשת", color: "#22c55e", bg: "#dcfce7", icon: Zap },
  estimated_completion: { label: "סיום פרויקט", color: "#3b82f6", bg: "#dbeafe", icon: ClipboardList },
};

const DAYS_HE = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

export default function CrmCalendar() {
  const navigate = useNavigate();
  const [view, setView] = useState("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: leads = [] } = useQuery({
    queryKey: ['calendar-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['calendar-projects'],
    queryFn: () => base44.entities.Project.list('-created_date', 200),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['calendar-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 200),
  });

  // Build events map: date -> events[]
  const eventsByDate = useMemo(() => {
    const map = {};

    const addEvent = (dateStr, event) => {
      if (!dateStr) return;
      const key = dateStr.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(event);
    };

    leads.forEach(lead => {
      if (lead.next_follow_up) {
        addEvent(lead.next_follow_up, {
          type: 'follow_up',
          label: `מעקב: ${lead.full_name}`,
          id: lead.id,
          page: `LeadCard?id=${lead.id}`,
          sub: lead.assigned_agent || '',
          priority: lead.priority,
        });
      }
    });

    projects.forEach(proj => {
      if (proj.installation_date) {
        addEvent(proj.installation_date, {
          type: 'installation',
          label: `התקנה: ${proj.customer_name}`,
          id: proj.id,
          page: `ProjectCard?id=${proj.id}`,
          sub: `${proj.kwp || '?'} kWp`,
        });
      }
      if (proj.grid_connection_date) {
        addEvent(proj.grid_connection_date, {
          type: 'grid_connection',
          label: `חיבור: ${proj.customer_name}`,
          id: proj.id,
          page: `ProjectCard?id=${proj.id}`,
          sub: proj.city || '',
        });
      }
      if (proj.estimated_completion) {
        addEvent(proj.estimated_completion, {
          type: 'estimated_completion',
          label: `סיום: ${proj.title}`,
          id: proj.id,
          page: `ProjectCard?id=${proj.id}`,
          sub: proj.customer_name || '',
        });
      }
    });

    tasks.forEach(task => {
      if (task.due_date) {
        addEvent(task.due_date, {
          type: 'task_due',
          label: task.title,
          id: task.id,
          page: null,
          sub: task.assigned_to || '',
        });
      }
    });

    return map;
  }, [leads, projects, tasks]);

  // Navigation
  const goNext = () => {
    if (view === 'week') setCurrentDate(d => addWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => addMonths(d, 1));
    else setCurrentDate(d => addDays(d, 1));
  };
  const goPrev = () => {
    if (view === 'week') setCurrentDate(d => subWeeks(d, 1));
    else if (view === 'month') setCurrentDate(d => subMonths(d, 1));
    else setCurrentDate(d => addDays(d, -1));
  };
  const goToday = () => setCurrentDate(new Date());

  // Days to show
  const daysToShow = useMemo(() => {
    if (view === 'day') return [currentDate];
    if (view === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start, end: addDays(start, 6) });
    }
    // month
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const calStart = startOfWeek(start, { weekStartsOn: 0 });
    const calEnd = endOfWeek(end, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [view, currentDate]);

  // Count events for period
  const periodEventCount = daysToShow.reduce((s, d) => s + (eventsByDate[format(d, 'yyyy-MM-dd')]?.length || 0), 0);

  const title = view === 'day'
    ? format(currentDate, 'EEEE, d בMMMM yyyy', { locale: he })
    : view === 'week'
    ? `${format(daysToShow[0], 'd MMM', { locale: he })} — ${format(daysToShow[6], 'd MMM yyyy', { locale: he })}`
    : format(currentDate, 'MMMM yyyy', { locale: he });

  const selectedEvents = selectedDay ? (eventsByDate[format(selectedDay, 'yyyy-MM-dd')] || []) : [];

  return (
    <div className="p-4 lg:p-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#0ea5a0]" />
          <div>
            <h1 className="text-2xl font-bold text-slate-800">לוח שנה</h1>
            <p className="text-xs text-slate-400">{periodEventCount} אירועים בתצוגה</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToday} className="border-slate-200 text-slate-600 text-xs">היום</Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={goPrev}><ChevronRight className="w-4 h-4" /></Button>
            <span className="text-sm font-medium text-slate-700 min-w-[180px] text-center">{title}</span>
            <Button variant="ghost" size="icon" className="w-8 h-8" onClick={goNext}><ChevronLeft className="w-4 h-4" /></Button>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {VIEW_OPTIONS.map(v => (
              <button key={v.value} onClick={() => setView(v.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === v.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(EVENT_TYPES).map(([key, et]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: et.color }} />
            {et.label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Day headers */}
        {view !== 'day' && (
          <div className={`grid border-b border-slate-200 bg-slate-50`} style={{ gridTemplateColumns: `repeat(7, 1fr)` }}>
            {DAYS_HE.map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500">{d}</div>
            ))}
          </div>
        )}

        {/* Day view */}
        {view === 'day' && (
          <DayView day={currentDate} events={eventsByDate[format(currentDate, 'yyyy-MM-dd')] || []} onEventClick={(e) => e.page && navigate(createPageUrl(e.page))} />
        )}

        {/* Week view */}
        {view === 'week' && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {daysToShow.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[key] || [];
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[120px] p-2 border-r border-b border-slate-100 cursor-pointer transition-colors ${isToday(day) ? 'bg-[#0ea5a0]/5' : 'hover:bg-slate-50'} ${isSelected ? 'ring-2 ring-inset ring-[#0ea5a0]' : ''}`}>
                  <div className={`text-sm font-semibold mb-1.5 w-7 h-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#0ea5a0] text-white' : 'text-slate-700'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((evt, i) => (
                      <EventChip key={i} event={evt} onClick={e => { e.stopPropagation(); evt.page && navigate(createPageUrl(evt.page)); }} />
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-slate-400 pr-1">+{dayEvents.length - 3} נוספים</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Month view */}
        {view === 'month' && (
          <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {daysToShow.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[key] || [];
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              return (
                <div key={key}
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`min-h-[80px] p-1.5 border-r border-b border-slate-100 cursor-pointer transition-colors ${!isCurrentMonth ? 'bg-slate-50/50' : isToday(day) ? 'bg-[#0ea5a0]/5' : 'hover:bg-slate-50'} ${isSelected ? 'ring-2 ring-inset ring-[#0ea5a0]' : ''}`}>
                  <div className={`text-xs font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#0ea5a0] text-white' : isCurrentMonth ? 'text-slate-700' : 'text-slate-300'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((evt, i) => (
                      <EventChip key={i} event={evt} compact onClick={e => { e.stopPropagation(); evt.page && navigate(createPageUrl(evt.page)); }} />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[9px] text-slate-400">+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected day events panel */}
      {selectedDay && selectedEvents.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
            <h3 className="text-sm font-semibold text-slate-700">
              {format(selectedDay, 'EEEE, d בMMMM', { locale: he })} — {selectedEvents.length} אירועים
            </h3>
          </div>
          <div className="p-4 space-y-2">
            {selectedEvents.map((evt, i) => {
              const et = EVENT_TYPES[evt.type] || EVENT_TYPES.task_due;
              const Icon = et.icon;
              return (
                <div key={i}
                  onClick={() => evt.page && navigate(createPageUrl(evt.page))}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity`}
                  style={{ borderColor: et.color + '40', background: et.bg }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: et.color + '20' }}>
                    <Icon className="w-4 h-4" style={{ color: et.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{evt.label}</p>
                    {evt.sub && <p className="text-xs text-slate-500">{evt.sub}</p>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: et.color + '20', color: et.color }}>{et.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming events sidebar summary */}
      <UpcomingEvents eventsByDate={eventsByDate} navigate={navigate} />
    </div>
  );
}

function EventChip({ event, compact, onClick }) {
  const et = EVENT_TYPES[event.type] || EVENT_TYPES.task_due;
  return (
    <div onClick={onClick}
      className={`flex items-center gap-1 rounded px-1 py-0.5 cursor-pointer hover:opacity-80 transition-opacity truncate ${compact ? '' : ''}`}
      style={{ background: et.bg }}>
      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: et.color }} />
      <span className="text-[10px] font-medium truncate" style={{ color: et.color }}>{event.label}</span>
    </div>
  );
}

function DayView({ day, events, onEventClick }) {
  if (events.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="text-sm">אין אירועים ביום זה</p>
      </div>
    );
  }
  return (
    <div className="p-4 space-y-3">
      {events.map((evt, i) => {
        const et = EVENT_TYPES[evt.type] || EVENT_TYPES.task_due;
        const Icon = et.icon;
        return (
          <div key={i} onClick={() => onEventClick(evt)}
            className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity"
            style={{ borderColor: et.color + '40', background: et.bg }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: et.color + '20' }}>
              <Icon className="w-5 h-5" style={{ color: et.color }} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-800">{evt.label}</p>
              {evt.sub && <p className="text-sm text-slate-500">{evt.sub}</p>}
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: et.color + '20', color: et.color }}>{et.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function UpcomingEvents({ eventsByDate, navigate }) {
  const upcoming = [];
  const today = new Date();
  for (let i = 0; i <= 7; i++) {
    const d = addDays(today, i);
    const key = format(d, 'yyyy-MM-dd');
    const evts = eventsByDate[key] || [];
    evts.forEach(e => upcoming.push({ ...e, date: d, dateKey: key }));
  }

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="text-sm font-semibold text-slate-700">7 ימים הקרובים — {upcoming.length} אירועים</h2>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {upcoming.slice(0, 12).map((evt, i) => {
          const et = EVENT_TYPES[evt.type] || EVENT_TYPES.task_due;
          const Icon = et.icon;
          return (
            <div key={i} onClick={() => evt.page && navigate(createPageUrl(evt.page))}
              className="flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer hover:opacity-80 transition-opacity"
              style={{ borderColor: et.color + '30', background: et.bg }}>
              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: et.color }} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-800 truncate">{evt.label}</p>
                <p className="text-[10px] text-slate-500">{isToday(evt.date) ? 'היום' : format(evt.date, 'EEEE d/M', { locale: he })}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}