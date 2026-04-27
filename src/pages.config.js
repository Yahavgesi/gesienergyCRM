/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AdminDashboard from './pages/AdminDashboard';
import AllProjects from './pages/AllProjects';
import AttendanceTracking from './pages/AttendanceTracking';
import BankTransactions from './pages/BankTransactions';
import CustomerBalances from './pages/CustomerBalances';
import CustomerDetails from './pages/CustomerDetails';
import CustomerForm from './pages/CustomerForm';
import EmployeeManagement from './pages/EmployeeManagement';
import FinanceDashboard from './pages/FinanceDashboard';
import FinancialOverview from './pages/FinancialOverview';
import KnowledgeCenter from './pages/KnowledgeCenter';
import PasswordManager from './pages/PasswordManager';
import PayrollDashboard from './pages/PayrollDashboard';
import ProjectCalculator from './pages/ProjectCalculator';
import ProjectDetails from './pages/ProjectDetails';
import ProjectForm from './pages/ProjectForm';
import ProjectsDashboard from './pages/ProjectsDashboard';
import ProjectsOverview from './pages/ProjectsOverview';
import QuoteBuilder from './pages/QuoteBuilder';
import QuotesList from './pages/QuotesList';
import SupplierPayables from './pages/SupplierPayables';
import SupplierPaymentHistory from './pages/SupplierPaymentHistory';
import SuppliersDirectory from './pages/SuppliersDirectory';
import TemplateSelection from './pages/TemplateSelection';
import CompanyCard from './pages/CompanyCard';
import ContactCard from './pages/ContactCard';
import CrmChatCenter from './pages/CrmChatCenter';
import CrmCompanies from './pages/CrmCompanies';
import CrmContacts from './pages/CrmContacts';
import CrmCustomers from './pages/CrmCustomers';
import CrmDashboard from './pages/CrmDashboard';
import CrmDeals from './pages/CrmDeals';
import CrmDocuments from './pages/CrmDocuments';
import CrmLeads from './pages/CrmLeads';
import CrmPayments from './pages/CrmPayments';
import CrmProducts from './pages/CrmProducts';
import CrmProjects from './pages/CrmProjects';
import CrmQuotes from './pages/CrmQuotes';
import CrmReports from './pages/CrmReports';
import CrmSettings from './pages/CrmSettings';
import CrmTasks from './pages/CrmTasks';
import CustomerChat from './pages/CustomerChat';
import CustomerDocuments from './pages/CustomerDocuments';
import CustomerHome from './pages/CustomerHome';
import CustomerNotifications from './pages/CustomerNotifications';
import CustomerPayments from './pages/CustomerPayments';
import CustomerStore from './pages/CustomerStore';
import Home from './pages/Home';
import LeadCard from './pages/LeadCard';
import ProjectCard from './pages/ProjectCard';
import SystemFolder from './pages/SystemFolder';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "AllProjects": AllProjects,
    "AttendanceTracking": AttendanceTracking,
    "BankTransactions": BankTransactions,
    "CustomerBalances": CustomerBalances,
    "CustomerDetails": CustomerDetails,
    "CustomerForm": CustomerForm,
    "EmployeeManagement": EmployeeManagement,
    "FinanceDashboard": FinanceDashboard,
    "FinancialOverview": FinancialOverview,
    "KnowledgeCenter": KnowledgeCenter,
    "PasswordManager": PasswordManager,
    "PayrollDashboard": PayrollDashboard,
    "ProjectCalculator": ProjectCalculator,
    "ProjectDetails": ProjectDetails,
    "ProjectForm": ProjectForm,
    "ProjectsDashboard": ProjectsDashboard,
    "ProjectsOverview": ProjectsOverview,
    "QuoteBuilder": QuoteBuilder,
    "QuotesList": QuotesList,
    "SupplierPayables": SupplierPayables,
    "SupplierPaymentHistory": SupplierPaymentHistory,
    "SuppliersDirectory": SuppliersDirectory,
    "TemplateSelection": TemplateSelection,
    "CompanyCard": CompanyCard,
    "ContactCard": ContactCard,
    "CrmChatCenter": CrmChatCenter,
    "CrmCompanies": CrmCompanies,
    "CrmContacts": CrmContacts,
    "CrmCustomers": CrmCustomers,
    "CrmDashboard": CrmDashboard,
    "CrmDeals": CrmDeals,
    "CrmDocuments": CrmDocuments,
    "CrmLeads": CrmLeads,
    "CrmPayments": CrmPayments,
    "CrmProducts": CrmProducts,
    "CrmProjects": CrmProjects,
    "CrmQuotes": CrmQuotes,
    "CrmReports": CrmReports,
    "CrmSettings": CrmSettings,
    "CrmTasks": CrmTasks,
    "CustomerChat": CustomerChat,
    "CustomerDocuments": CustomerDocuments,
    "CustomerHome": CustomerHome,
    "CustomerNotifications": CustomerNotifications,
    "CustomerPayments": CustomerPayments,
    "CustomerStore": CustomerStore,
    "Home": Home,
    "LeadCard": LeadCard,
    "ProjectCard": ProjectCard,
    "SystemFolder": SystemFolder,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};