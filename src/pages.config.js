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
import Home from './pages/Home';
import CustomerHome from './pages/CustomerHome';
import CustomerDocuments from './pages/CustomerDocuments';
import CustomerPayments from './pages/CustomerPayments';
import CustomerStore from './pages/CustomerStore';
import CustomerChat from './pages/CustomerChat';
import CustomerNotifications from './pages/CustomerNotifications';
import CrmDashboard from './pages/CrmDashboard';
import CrmLeads from './pages/CrmLeads';
import CrmDeals from './pages/CrmDeals';
import CrmCustomers from './pages/CrmCustomers';
import CrmProjects from './pages/CrmProjects';
import CrmQuotes from './pages/CrmQuotes';
import CrmDocuments from './pages/CrmDocuments';
import CrmTasks from './pages/CrmTasks';
import CrmPayments from './pages/CrmPayments';
import CrmProducts from './pages/CrmProducts';
import CrmChatCenter from './pages/CrmChatCenter';
import CrmReports from './pages/CrmReports';
import CrmSettings from './pages/CrmSettings';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "CustomerHome": CustomerHome,
    "CustomerDocuments": CustomerDocuments,
    "CustomerPayments": CustomerPayments,
    "CustomerStore": CustomerStore,
    "CustomerChat": CustomerChat,
    "CustomerNotifications": CustomerNotifications,
    "CrmDashboard": CrmDashboard,
    "CrmLeads": CrmLeads,
    "CrmDeals": CrmDeals,
    "CrmCustomers": CrmCustomers,
    "CrmProjects": CrmProjects,
    "CrmQuotes": CrmQuotes,
    "CrmDocuments": CrmDocuments,
    "CrmTasks": CrmTasks,
    "CrmPayments": CrmPayments,
    "CrmProducts": CrmProducts,
    "CrmChatCenter": CrmChatCenter,
    "CrmReports": CrmReports,
    "CrmSettings": CrmSettings,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};