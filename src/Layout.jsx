import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import GesiLogo from "./components/shared/GesiLogo";
import { Toaster } from "sonner";
import {
  Home, FileText, CreditCard, ShoppingBag, MessageCircle,
  LayoutDashboard, Users, Target, Kanban, FileCheck, FolderOpen,
  ClipboardList, Calendar, DollarSign, Package, Settings, Bell,
  BarChart3, Zap, ChevronLeft, ChevronRight, LogOut, Menu, X, Building2,
  Truck, Warehouse, Receipt, UserCheck, Briefcase, Mail, Wrench,
  TrendingUp
} from "lucide-react";

const customerNav = [
  { name: "סטטוס", icon: Home, page: "CustomerHome" },
  { name: "מסמכים", icon: FileText, page: "CustomerDocuments" },
  { name: "תשלומים", icon: CreditCard, page: "CustomerPayments" },
  { name: "חנות", icon: ShoppingBag, page: "CustomerStore" },
  { name: "צ'אט", icon: MessageCircle, page: "CustomerChat" },
];

const crmNav = [
  { section: "ראשי", items: [
    { name: "דשבורד", icon: LayoutDashboard, page: "CrmDashboard" },
    { name: "לידים", icon: Target, page: "CrmLeads" },
    { name: "אנשי קשר", icon: Users, page: "CrmContacts" },
    { name: "חברות", icon: Building2, page: "CrmCompanies" },
  ]},
  { section: "ניהול", items: [
    { name: "הצעות מחיר", icon: FileCheck, page: "CrmQuotes" },
    { name: "מסמכים", icon: FolderOpen, page: "CrmDocuments" },
    { name: "פרויקטים", icon: ClipboardList, page: "CrmProjects" },
    { name: "ניהול פרויקטים", icon: Kanban, page: "CrmProjectManagement" },
    { name: "משימות", icon: Calendar, page: "CrmTasks" },
  ]},
  { section: "כספים", items: [
    { name: "תשלומים", icon: DollarSign, page: "CrmPayments" },
    { name: "הוצאות", icon: Receipt, page: "CrmExpenses" },
    { name: "שכר", icon: Briefcase, page: "CrmPayroll" },
    { name: "מוצרים", icon: Package, page: "CrmProducts" },
  ]},
  { section: "תפעול", items: [
    { name: "עובדים", icon: UserCheck, page: "CrmEmployees" },
    { name: "נוכחות", icon: Calendar, page: "CrmAttendance" },
    { name: "ספקים", icon: Truck, page: "CrmSuppliers" },
    { name: "מחסן", icon: Warehouse, page: "CrmInventory" },
  ]},
  { section: "דוחות", items: [
    { name: "ביצועי סוכנים", icon: TrendingUp, page: "CrmAgentPerformance" },
    { name: "לוח שנה", icon: Calendar, page: "CrmCalendar" },
    { name: "דוחות כלליים", icon: BarChart3, page: "CrmReportsHub" },
    { name: "פיננסי", icon: TrendingUp, page: "CrmFinancials" },
  ]},
  { section: "כלים", items: [
    { name: "תיבת דואר", icon: Mail, page: "CrmInbox" },
    { name: "צ'אט", icon: MessageCircle, page: "CrmChatCenter" },
    { name: "כלים", icon: Wrench, page: "CrmTools" },
  ]},
  { section: "מערכת", items: [
    { name: "הגדרות", icon: Settings, page: "CrmSettings" },
  ]},
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUser = async () => {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const me = await base44.auth.me();
        setUser(me);
      }
      setLoading(false);
    };
    loadUser();
  }, []);

  const isCustomerPage = currentPageName?.startsWith("Customer");
  const isCrmPage = currentPageName?.startsWith("Crm");
  const isLanding = !isCustomerPage && !isCrmPage;

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#dce8ef' }}>
        <div className="w-12 h-12 border-4 border-[#b0c8d4] border-t-[#0ea5a0] rounded-full animate-spin" />
      </div>
    );
  }

  // Landing / Portal selector
  if (isLanding) {
    return (
      <div className="min-h-screen" style={{ background: '#dce8ef' }}>
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  // Customer Mobile Layout
  if (isCustomerPage) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#dce8ef' }}>
        <Toaster position="top-center" richColors />
        <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b"
          style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderColor: 'rgba(14,165,160,0.12)' }}>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("CustomerHome")}>
              <GesiLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("CustomerNotifications")} className="relative p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <Bell className="w-5 h-5 text-slate-400" />
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{ background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(12px)', borderColor: 'rgba(14,165,160,0.12)' }}>
          <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
            {customerNav.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'text-[#0ea5a0]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{item.name}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-[#0ea5a0] mt-0.5" />}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    );
  }

  // CRM Desktop Layout
  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#dce8ef' }}>
      <Toaster position="top-center" richColors />
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(12px)', borderColor: 'rgba(14,165,160,0.12)' }}>
        <div className="flex items-center gap-3">
          <GesiLogo size="sm" />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-slate-100 transition-colors z-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 lg:left-0 z-[60] h-full flex flex-col border-l lg:border-r transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-20' : 'w-[80vw] max-w-[280px] lg:w-64'}
      `} style={{ background: '#ffffff', borderColor: '#d1e3ec', boxShadow: '2px 0 12px rgba(15,23,42,0.06)' }}>
        
        {/* Logo - mobile */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b" style={{ borderColor: '#e2edf3' }}>
          <GesiLogo size="sm" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Logo - desktop */}
        <div className="hidden lg:flex p-4 items-center justify-between border-b" style={{ borderColor: '#e2edf3' }}>
          {!sidebarCollapsed && <GesiLogo size="sm" />}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {sidebarCollapsed
              ? <ChevronLeft className="w-4 h-4 text-slate-400" />
              : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
          {crmNav.map(section => (
            <div key={section.section}>
              {!sidebarCollapsed && (
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1.5 px-3">
                  {section.section}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 group ${
                        isActive
                          ? 'bg-[#0ea5a0]/10 text-[#0ea5a0]'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 w-[3px] h-5 rounded-r-full bg-[#0ea5a0]" />}
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#0ea5a0]' : ''}`} />
                      {!sidebarCollapsed && <span className="text-sm font-medium lg:inline">{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t" style={{ borderColor: '#e2edf3' }}>
          {user && !sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-[#0ea5a0]/15 flex items-center justify-center text-[#0ea5a0] text-sm font-bold flex-shrink-0">
                {user.full_name?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-700 truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-slate-400">{user.role || "user"}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all w-full"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm">התנתק</span>}
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-[65px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}