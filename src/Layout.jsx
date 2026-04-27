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
      <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a1a1f' }}>
        <div className="w-12 h-12 border-4 border-[#142e38] border-t-[#2dd4a8] rounded-full animate-spin" />
      </div>
    );
  }

  // Landing / Portal selector
  if (isLanding) {
    return (
      <div className="min-h-screen" style={{ background: '#0a1a1f' }}>
        <Toaster position="top-center" richColors />
        {children}
      </div>
    );
  }

  // Customer Mobile Layout
  if (isCustomerPage) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a1a1f' }}>
        <Toaster position="top-center" richColors />
        {/* Customer Header */}
        <header className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between border-b"
          style={{ background: 'rgba(10,26,31,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(45,212,168,0.08)' }}>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl("CustomerHome")}>
              <GesiLogo size="sm" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl("CustomerNotifications")} className="relative p-2 rounded-xl hover:bg-[#142e38] transition-colors">
              <Bell className="w-5 h-5 text-gray-400" />
            </Link>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto pb-20">
          {children}
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{ background: 'rgba(10,26,31,0.98)', backdropFilter: 'blur(12px)', borderColor: 'rgba(45,212,168,0.08)' }}>
          <div className="flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
            {customerNav.map(item => {
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                    isActive ? 'text-[#2dd4a8]' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'drop-shadow-[0_0_6px_rgba(45,212,168,0.5)]' : ''}`} />
                  <span className="text-[10px] font-medium">{item.name}</span>
                  {isActive && <div className="w-1 h-1 rounded-full bg-[#2dd4a8] mt-0.5" />}
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
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: '#0a1a1f' }}>
      <Toaster position="top-center" richColors />
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 px-4 py-3 flex items-center justify-between border-b"
        style={{ background: 'rgba(10,26,31,0.95)', backdropFilter: 'blur(12px)', borderColor: 'rgba(45,212,168,0.08)' }}>
        <div className="flex items-center gap-3">
          <GesiLogo size="sm" />
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl hover:bg-[#142e38] transition-colors z-50"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative inset-y-0 right-0 lg:left-0 z-[60] h-full flex flex-col border-l lg:border-r transition-transform duration-300
        ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${sidebarCollapsed ? 'lg:w-20' : 'w-[80vw] max-w-[300px] lg:w-64'}
      `} style={{ background: '#0d1f26', borderColor: 'rgba(45,212,168,0.08)' }}>
        
        {/* Logo */}
        <div className="lg:hidden p-4 flex items-center justify-between border-b" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
          <GesiLogo size="sm" />
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg hover:bg-[#142e38] transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="hidden lg:flex p-4 items-center justify-between border-b" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
          {!sidebarCollapsed && <GesiLogo size="sm" />}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-[#142e38] transition-colors"
          >
            {sidebarCollapsed ? <ChevronLeft className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {crmNav.map(section => (
            <div key={section.section}>
              <p className="lg:hidden text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2 px-3">
                {section.section}
              </p>
              {!sidebarCollapsed && (
                <p className="hidden lg:block text-[10px] uppercase font-semibold text-gray-500 tracking-wider mb-2 px-3">
                  {section.section}
                </p>
              )}
              <div className="space-y-1">
                {section.items.map(item => {
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-[#2dd4a8]/10 text-[#2dd4a8]' 
                          : 'text-gray-400 hover:text-white hover:bg-[#142e38]'
                      }`}
                    >
                      {isActive && <div className="absolute left-0 w-[3px] h-6 rounded-r-full bg-[#2dd4a8]" />}
                      <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#2dd4a8]' : ''}`} />
                      <span className="text-sm font-medium lg:inline">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'rgba(45,212,168,0.08)' }}>
          {user && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 lg:hidden">
              <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-[#2dd4a8] text-sm font-bold">
                {user.full_name?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-gray-500">{user.role || "user"}</p>
              </div>
            </div>
          )}
          {user && !sidebarCollapsed && (
            <div className="hidden lg:flex items-center gap-3 px-3 py-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-[#2dd4a8]/20 flex items-center justify-center text-[#2dd4a8] text-sm font-bold">
                {user.full_name?.[0] || user.email?.[0] || "U"}
              </div>
              <div className="truncate">
                <p className="text-xs font-medium text-white truncate">{user.full_name || user.email}</p>
                <p className="text-[10px] text-gray-500">{user.role || "user"}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => base44.auth.logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/5 transition-all w-full"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm lg:inline">התנתק</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pt-[65px] lg:pt-0">
        {children}
      </main>
    </div>
  );
}