import React, { Component } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import { Provider, useSelector } from 'react-redux';
import { store } from './store/store'; 
import PettyCashLayout from './components/PettyCashLayout';
import PCDashboard from './pages/PettyCash/Dashboard';
import PCRequests from './pages/PettyCash/Requests';
import PCRequestForm from './pages/PettyCash/RequestForm';
import AccountSettings from './pages/PettyCash/AccountSettings';
import Position from './pages/PettyCash/Possition';
import Display from './pages/PettyCash/Display';
import RequestDetails from './pages/PettyCash/RequestDetails';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/ProtectedRoute';
import ExternalQuoteForm from './components/ExternalQuoteForm';

// Employee components - Existing
import EmployeeCashRequests from './pages/employee/EmployeeCashRequests';
import EmployeeInvoices from './pages/employee/EmployeeInvoices';
import CashRequestForm from './pages/employee/CashRequestForm';
import JustificationForm from './pages/employee/JustificationForm';

// Employee components - New Services
import EmployeeIncidentReports from './pages/employee/EmployeeIncidentReports';
import EmployeeIncidentReportDetails from './pages/employee/EmployeeIncidentReportDetails';
import EmployeeITSupport from './pages/employee/EmployeeITSupport';
import EmployeeSuggestions from './pages/employee/EmployeeSuggestions';
import EmployeeSickLeave from './pages/employee/EmployeeLeaveManagement';
import EmployeeLeaveDetail from './pages/employee/EmployeeLeaveDetail';
import SuggestionDetails from './pages/employee/SuggestionDetails';

// Employee components - Purchase Requisitions
import EmployeePurchaseRequisitions from './pages/employee/EmployeePurchaseRequisitions';
import PurchaseRequisitionForm from './pages/employee/PurchaseRequisitionForm';

// Employee form components - New Services
import IncidentReportForm from './pages/employee/IncidentReportForm';
import ITMaterialRequestForm from './pages/employee/ITMaterialRequestForm';
import ITIssueReportForm from './pages/employee/ITIssueReportForm';
import SuggestionForm from './pages/employee/SuggestionForm';
import SickLeaveForm from './pages/employee/LeaveRequestForm';

// Supplier components
import SupplierPortal from './pages/supplier/SupplierPortal';
import SupplierInvoices from './pages/supplier/SupplierInvoices';
import SupplierProfile from './pages/supplier/SupplierProfile';
import SupplierDashboard from './pages/supplier/SupplierInvoices';
import SupplierLogin from './pages/supplier/SupplierLogin';
import SupplierRegistration from './pages/supplier/SupplierRegistration';

// Supervisor components
import SupervisorCashApprovals from './pages/supervisor/SupervisorCashApprovals';
import SupervisorInvoiceApprovals from './pages/supervisor/SupervisorInvoiceApprovals';
import SupervisorIncidentReports from './pages/supervisor/SupervisorIncidentReports';
import SupervisorSickLeaveApprovals from './pages/supervisor/SupervisorSickLeaveApprovals';
import SupervisorTeamDashboard from './pages/supervisor/SupervisorTeamDashboard';
import SupervisorPurchaseRequisitions from './pages/supervisor/SupervisorPurchaseRequisitions';
import SupervisorBudgetCodeApprovals from './pages/supervisor/SupervisorBudgetCodeApprovals';
import SupervisorITApprovals from './pages/supervisor/SupervisorITApprovals';
import SupervisorSuggestions from './pages/supervisor/SupervisorSuggestions';
import SupervisorJustificationForm from './pages/supervisor/SupervisorJustificationForm';

// Finance components
import FinanceApprovalList from './pages/finance/FinanceApprovalList';
import FinanceCashApprovals from './pages/finance/FinanceCashApprovals';
import FinanceInvoiceManagement from './pages/finance/FinanceInvoiceManagement';
import FinanceCashApprovalForm from './pages/finance/FinanceCashApprovalForm';
import InvoiceAnalytics from './pages/finance/InvoiceAnalytics';
import FinanceInvoiceApproval from './pages/finance/FinanceInvoiceApproval';
import FinanceDashboard from './pages/finance/FinanceDashboard';
import FinanceReports from './pages/finance/FinanceReports';
import FinanceSupplierManagement from './pages/finance/FinanceSupplierManagement';
import FinancePaymentProcessing from './pages/finance/FinancePaymentProcessing';
import FinancePurchaseRequisitions from './pages/finance/FinancePurchaseRequisitions';
import FinanceITApprovals from './pages/finance/FinanceITApprovals';
import FinanceBudgetCodeApprovals from './pages/finance/FinanceBudgetCodeApprovals';

// Supply Chain components
import SupplyChainRequisitionManagement from './pages/supply-chain/SupplyChainRequisitionManagement';
import SupplyChainDashboard from './pages/supply-chain/SupplyChainDashboard';
import SupplyChainProcurementPlanning from './pages/supply-chain/SupplyChainProcurementPlanning';
import SupplyChainVendorManagement from './pages/supply-chain/SupplyChainVendorManagement';
import SupplyChainAnalytics from './pages/supply-chain/SupplyChainAnalytics';
import SupplyChainBuyerAssignment from './pages/supply-chain/SupplyChainBuyerAssignment';
import SupplyChainVendorOnboarding from './pages/supply-chain/SupplyChainSupplierOnboarding';
import SupplyChainContracts from './pages/supply-chain/SupplyChainContractManagement';
import SupplyChainProjectManagement from './pages/supply-chain/SupplyChainProjectManagement';

// Buyer components
import BuyerRequisitionPortal from './pages/buyer/BuyerRequisitionPortal';
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BuyerProcurementTasks from './pages/buyer/BuyerProcurementTasks';
import BuyerQuoteManagement from './pages/buyer/BuyerQuoteManagement';
import BuyerSupplierManagement from './pages/buyer/BuyerSupplierManagement';
import BuyerPurchaseOrders from './pages/buyer/BuyerPurchaseOrders';
import BuyerDeliveryTracking from './pages/buyer/BuyerDeliveryTracking';
import BuyerPerformanceAnalytics from './pages/buyer/BuyerPerformanceAnalytics';

// HR components
import HRIncidentReports from './pages/hr/HRIncidentReports';
import HRSuggestions from './pages/hr/HRSuggestions';
import HRSickLeaveManagement from './pages/hr/HRLeaveManagement';
import HREmployeeWelfare from './pages/hr/HREmployeeWelfare';
import HRDashboard from './pages/hr/HRDashboard';
import HRPolicyManagement from './pages/hr/HRPolicyManagement';
import HREmployeeEngagement from './pages/hr/HREmployeeEngagement';

// IT components
import ITSupportRequests from './pages/it/ITSupportRequests';
import ITInventoryManagement from './pages/it/ITInventoryManagement';
import ITDashboard from './pages/it/ITDashboard';
import ITAssetManagement from './pages/it/ITAssetManagement';
import ITSystemMonitoring from './pages/it/ITSystemMonitoring';
import ITUserAccountManagement from './pages/it/ITUserAccountManagement';

// Admin components
import AdminRequestsList from './pages/admin/AdminRequestsList';
import AdminRequestDetails from './pages/admin/AdminRequestDetails';
import AdminIncidentReports from './pages/admin/AdminIncidentReports';
import AdminITSupport from './pages/admin/AdminITSupport';
import AdminSuggestions from './pages/admin/AdminSuggestions';
import AdminSickLeave from './pages/admin/AdminSickLeave';
import AdminAnalyticsDashboard from './pages/admin/AdminAnalyticsDashboard';
import AdminSystemSettings from './pages/admin/AdminSystemSettings';
import AdminSupplierManagement from './pages/admin/AdminSupplierManagement';
import AdminUserManagement from './pages/admin/AdminUserManagement';
import AdminPurchaseRequisitions from './pages/admin/AdminPurchaseRequisitions';
import AdminBudgetCodeApprovals from './pages/admin/BudgetCodeApprovals';
import AdminCashApprovals from './pages/admin/AdminCashApprovals';

// sharepoint
import SharePointPortal from './pages/SharePoint/SharePointPortal';
import SharePointAdmin from './pages/SharePoint/SharePointAdmin';
import SharePointAnalytics from './pages/admin/SharePointAnalytics';
import MyUploads from './pages/SharePoint/MyUploads';
import AdminDashboard from './pages/SharePoint/AdminDashboard';
import Analytics from './pages/SharePoint/Analytics';

// Item Components
import SupplyChainItemManagement from './pages/supply-chain/SupplyChainItemManagement';
import EmployeeItemRequests from './pages/employee/EmployeeItemRequests';

// Action Components
import ActionItemsManagement from './pages/supply-chain/ActionItemsManagement';
import EmployeeActionItems from './pages/employee/EmployeeItemRequests';


// Common components
import Dashboard from './components/Dashboard';
import './App.css';

// Enhanced ProtectedRoute component that handles hierarchical access
const EnhancedProtectedRoute = ({ children, allowedRoles, fallbackRole = null }) => {
  const { user } = useSelector((state) => state.auth);
  
  // Define role hierarchy levels
  const roleHierarchy = {
    employee: 1,
    supervisor: 2,
    finance: 3,
    hr: 3,
    it: 3,
    supply_chain: 3,
    buyer: 3,
    admin: 4
  };

  const userRole = user?.role;
  const userLevel = roleHierarchy[userRole] || 0;

  // If specific roles are required, check if user has one of them
  if (allowedRoles && allowedRoles.length > 0) {
    const hasDirectAccess = allowedRoles.includes(userRole);
    
    // If user doesn't have direct access, check if they should get fallback access
    if (!hasDirectAccess && fallbackRole && userRole !== fallbackRole) {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Admin always has access unless explicitly restricted
    if (userRole === 'admin' && !hasDirectAccess && !allowedRoles.includes('admin-restricted')) {
      return <ProtectedRoute>{children}</ProtectedRoute>;
    }
    
    if (!hasDirectAccess && userRole !== 'admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/supplier/login" element={<SupplierLogin />} />
        <Route path="/supplier/register" element={<SupplierRegistration />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* External Quote Routes */}
        <Route 
          path="/external-quote" 
          element={
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: '#f5f5f5'
            }}>
              <div style={{ 
                maxWidth: '600px',
                padding: '40px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h1 style={{ color: '#1890ff', marginBottom: '16px' }}>External Quote Submission</h1>
                <p style={{ fontSize: '16px', color: '#666', lineHeight: '1.6' }}>
                  This page is for external suppliers who have received an RFQ invitation.
                  Please use the invitation link provided in your email to submit your quote.
                </p>
                <div style={{ 
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: '#f6ffed',
                  borderRadius: '6px',
                  border: '1px solid #b7eb8f'
                }}>
                  <p style={{ margin: 0, color: '#52c41a' }}>
                    📧 Check your email for the secure invitation link to get started.
                  </p>
                </div>
              </div>
            </div>
          } 
        />
        <Route path="/external-quote/:token" element={<ExternalQuoteForm />} />
        <Route path="/external-quote/:token/status" element={<ExternalQuoteForm />} />
        <Route path="/external-quote/:token/edit" element={<ExternalQuoteForm />} />

        {/* Main Dashboard */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <PettyCashLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
        </Route>

        {/* Supplier Routes */}
        <Route 
          path="/supplier" 
          element={
            <EnhancedProtectedRoute allowedRoles={['supplier']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/supplier/dashboard" replace />} />
          <Route path="dashboard" element={<SupplierDashboard />} />
          <Route path="portal" element={<SupplierPortal />} />
          <Route path="invoices" element={<SupplierInvoices />} />
          <Route path="invoices/submit" element={<SupplierPortal />} />
          <Route path="invoices/:invoiceId" element={<RequestDetails />} />
          <Route path="profile" element={<SupplierProfile />} />
          <Route path="settings" element={<SupplierProfile />} />
        </Route>

        {/* Employee Routes */}
        <Route 
          path="/employee" 
          element={
            <ProtectedRoute>
              <PettyCashLayout />
            </ProtectedRoute>
          }
        >
          <Route path="cash-requests" element={<EmployeeCashRequests />} />
          <Route path="cash-request/new" element={<CashRequestForm />} />
          <Route path="cash-request/:requestId" element={<RequestDetails />} /> 
          <Route path="cash-request/:requestId/justify" element={<JustificationForm />} />
          <Route path="purchase-requisitions" element={<EmployeePurchaseRequisitions />} />
          <Route path="purchase-requisitions/new" element={<PurchaseRequisitionForm />} />
          <Route path="purchase-requisitions/:requisitionId" element={<RequestDetails />} />
          <Route path="invoices" element={<EmployeeInvoices />} />
          <Route path="incident-reports" element={<EmployeeIncidentReports />} />
          <Route path="incident-reports/new" element={<IncidentReportForm />} />
          <Route path="incident-reports/:id" element={<EmployeeIncidentReportDetails />} />
          <Route path="incident-reports/:id/edit" element={<IncidentReportForm editMode={true} />} />
          <Route path="it-support" element={<EmployeeITSupport />} />
          <Route path="it-support/materials/new" element={<ITMaterialRequestForm />} />
          <Route path="it-support/issues/new" element={<ITIssueReportForm />} />
          <Route path="it-support/:requestId" element={<RequestDetails />} />
          <Route path="suggestions" element={<EmployeeSuggestions />} />
          <Route path="suggestions/new" element={<SuggestionForm />} />
          <Route path="suggestions/:suggestionId" element={<SuggestionDetails />} />
          <Route path="leave" element={<EmployeeSickLeave />} />
          <Route path="leave/new" element={<SickLeaveForm />} />
          <Route path="leave/:requestId" element={<EmployeeLeaveDetail />} />
          <Route path="sick-leave" element={<Navigate to="/employee/leave" replace />} />
          <Route path="sick-leave/new" element={<Navigate to="/employee/leave/new" replace />} />
          <Route path="item-requests" element={<EmployeeItemRequests />} />
          <Route path="item-requests/new" element={<EmployeeItemRequests />} />

          <Route path="action-items" element={<EmployeeActionItems />} />
          <Route path="action-items/new" element={<EmployeeActionItems />} />
        </Route>

        {/* Supervisor Routes */}
        {/* <Route 
          path="/supervisor" 
          element={
            <EnhancedProtectedRoute allowedRoles={['supervisor', 'hr', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        > */}
        <Route 
          path="/supervisor" 
          element={
            <EnhancedProtectedRoute allowedRoles={['supervisor', 'finance', 'hr', 'it', 'supply_chain', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SupervisorTeamDashboard />} />
          
          {/* Cash Approvals Routes */}
          <Route path="cash-approvals" element={<SupervisorCashApprovals />} />
          <Route path="cash-request/:requestId" element={<RequestDetails />} />
          <Route path="cash-approvals/justification/:requestId/review" element={<SupervisorJustificationForm />} />
          
          {/* Project Management Routes */}
          <Route path="projects" element={<SupplyChainProjectManagement />} />
          <Route path="projects/team" element={<SupplyChainProjectManagement />} />
          <Route path="projects/new" element={<SupplyChainProjectManagement />} />
          <Route path="projects/reports" element={<SupplyChainProjectManagement />} />
          <Route path="projects/:projectId" element={<RequestDetails />} />
          
          {/* Purchase Requisitions Routes */}
          <Route path="purchase-requisitions" element={<SupervisorPurchaseRequisitions />} />
          <Route path="purchase-requisitions/:requisitionId" element={<RequestDetails />} />
          
          {/* Invoice Approvals Routes */}
          <Route path="invoice-approvals" element={<SupervisorInvoiceApprovals />} />
          
          {/* Incident Reports Routes */}
          <Route path="incident-reports" element={<SupervisorIncidentReports />} />
          <Route path="incident-reports/pending" element={<SupervisorIncidentReports />} />
          <Route path="safety-review" element={<SupervisorIncidentReports />} />
          
          {/* Sick Leave Routes */}
          <Route path="sick-leave" element={<SupervisorSickLeaveApprovals />} />
          <Route path="sick-leave/pending" element={<SupervisorSickLeaveApprovals />} />
          <Route path="team-calendar" element={<SupervisorSickLeaveApprovals />} />
          
          {/* IT Support Routes */}
          <Route path="it-support" element={<SupervisorITApprovals />} />
          <Route path="it-support/:requestId" element={<RequestDetails />} />
          
          {/* Suggestions Routes */}
          <Route path="team-suggestions" element={<SupervisorSuggestions />} />
          
          {/* Budget Codes Routes */}
          <Route path="budget-codes" element={<SupervisorBudgetCodeApprovals />} />
          <Route path="budget-codes/:budgetId" element={<RequestDetails />} />
        </Route>

        {/* Buyer Routes */}
        <Route 
          path="/buyer" 
          element={
            <EnhancedProtectedRoute allowedRoles={['buyer', 'supply_chain', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<BuyerDashboard />} />
          <Route path="requisitions" element={<BuyerRequisitionPortal />} />
          <Route path="requisitions/:requisitionId" element={<RequestDetails />} />
          <Route path="procurement" element={<BuyerProcurementTasks />} />
          <Route path="procurement/:taskId" element={<RequestDetails />} />
          <Route path="quotes" element={<BuyerQuoteManagement />} />
          <Route path="quotes/:quoteId" element={<RequestDetails />} />
          <Route path="quotes/:quoteId/evaluate" element={<BuyerQuoteManagement />} />
          <Route path="quotes/:quoteId/compare" element={<BuyerQuoteManagement />} />
          <Route path="suppliers" element={<BuyerSupplierManagement />} />
          <Route path="suppliers/:supplierId" element={<RequestDetails />} />
          <Route path="suppliers/:supplierId/performance" element={<BuyerSupplierManagement />} />
          <Route path="suppliers/:supplierId/communication" element={<BuyerSupplierManagement />} />
          <Route path="purchase-orders" element={<BuyerPurchaseOrders />} />
          <Route path="purchase-orders/new" element={<BuyerPurchaseOrders />} />
          <Route path="purchase-orders/:poId" element={<RequestDetails />} />
          <Route path="purchase-orders/:poId/edit" element={<BuyerPurchaseOrders />} />
          <Route path="deliveries" element={<BuyerDeliveryTracking />} />
          <Route path="deliveries/:deliveryId" element={<RequestDetails />} />
          <Route path="deliveries/:deliveryId/track" element={<BuyerDeliveryTracking />} />
          <Route path="analytics" element={<BuyerPerformanceAnalytics />} />
          <Route path="analytics/procurement" element={<BuyerPerformanceAnalytics />} />
          <Route path="analytics/suppliers" element={<BuyerPerformanceAnalytics />} />
          <Route path="analytics/performance" element={<BuyerPerformanceAnalytics />} />
          <Route path="reports" element={<BuyerPerformanceAnalytics />} />
          <Route path="reports/procurement" element={<BuyerPerformanceAnalytics />} />
          <Route path="reports/savings" element={<BuyerPerformanceAnalytics />} />
        </Route>

        {/* Supply Chain Routes */}
        <Route 
          path="/supply-chain" 
          element={
            <EnhancedProtectedRoute allowedRoles={['supply_chain', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<SupplyChainDashboard />} />
          <Route path="requisitions" element={<SupplyChainRequisitionManagement />} />
          <Route path="requisitions/:requisitionId" element={<RequestDetails />} />
          <Route path="project-management" element={<SupplyChainProjectManagement />} />
          <Route path="projects" element={<SupplyChainProjectManagement />} />
          <Route path="projects/new" element={<SupplyChainProjectManagement />} />
          <Route path="projects/active" element={<SupplyChainProjectManagement />} />
          <Route path="projects/analytics" element={<SupplyChainProjectManagement />} />
          <Route path="projects/:projectId" element={<RequestDetails />} />
          <Route path="projects/:projectId/edit" element={<SupplyChainProjectManagement />} />
          <Route path="procurement-planning" element={<SupplyChainProcurementPlanning />} />
          <Route path="suppliers" element={<SupplyChainVendorManagement />} />
          <Route path="analytics" element={<SupplyChainAnalytics />} />
          <Route path="buyer-assignment" element={<SupplyChainBuyerAssignment />} />
          <Route path="vendor-onboarding" element={<SupplyChainVendorOnboarding />} />
          <Route path="contracts" element={<SupplyChainContracts />} />
          <Route path="item-management" element={<SupplyChainItemManagement />} />

          <Route path="action-items" element={<ActionItemsManagement />} />
          <Route path="action-items/:projectId" element={<ActionItemsManagement />} />
        </Route>
        
        {/* Finance Routes */}
        <Route 
          path="/finance" 
          element={
            <EnhancedProtectedRoute allowedRoles={['finance', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<FinanceDashboard />} />
          <Route path="cash-approvals" element={<FinanceCashApprovals />} />
          <Route path="cash-request/:requestId" element={<FinanceCashApprovalForm />} />
          <Route path="cash-management" element={<FinanceCashApprovals />} />
          <Route path="cash-reports" element={<FinanceReports />} />
          <Route path="purchase-requisitions" element={<FinancePurchaseRequisitions />} />
          <Route path="purchase-requisitions/:requisitionId" element={<RequestDetails />} />
          <Route path="it-approvals" element={<FinanceITApprovals />} />
          <Route path="it-approvals/:requestId" element={<RequestDetails />} />
          <Route path="invoice-management" element={<FinanceInvoiceApproval />} />
          <Route path="invoice-analytics" element={<InvoiceAnalytics />} />
          <Route path="suppliers" element={<FinanceSupplierManagement />} />
          <Route path="payments" element={<FinancePaymentProcessing />} />
          <Route path="reports" element={<FinanceReports />} />
          <Route path="analytics" element={<InvoiceAnalytics />} />
          {/* Budget Code Routes */}
          <Route path="budget-codes" element={<FinanceBudgetCodeApprovals />} />
          <Route path="budget-codes/pending" element={<FinanceBudgetCodeApprovals />} />
          <Route path="budget-codes/:budgetId" element={<RequestDetails />} />
          <Route path="budget-codes/:budgetId/approve" element={<FinanceBudgetCodeApprovals />} />
        </Route>

        {/* HR Routes */}
        <Route 
          path="/hr" 
          element={
            <EnhancedProtectedRoute allowedRoles={['hr', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="incident-reports" element={<HRIncidentReports />} />
          <Route path="incident-reports/analytics" element={<HRIncidentReports />} />
          <Route path="incident-reports/:reportId" element={<RequestDetails />} />
          <Route path="incident-investigation" element={<HRIncidentReports />} />
          <Route path="safety-policies" element={<HRPolicyManagement />} />
          <Route path="suggestions" element={<HRSuggestions />} />
          <Route path="suggestions/analytics" element={<HRSuggestions />} />
          <Route path="suggestions/:suggestionId" element={<RequestDetails />} />
          <Route path="suggestion-implementation" element={<HRSuggestions />} />
          <Route path="employee-engagement" element={<HREmployeeEngagement />} />
          <Route path="sick-leave" element={<HRSickLeaveManagement />} />
          <Route path="sick-leave/analytics" element={<HRSickLeaveManagement />} />
          <Route path="sick-leave/:leaveId" element={<RequestDetails />} />
          <Route path="leave-policies" element={<HRPolicyManagement />} />
          <Route path="medical-certificates" element={<HRSickLeaveManagement />} />
          <Route path="employee-welfare" element={<HREmployeeWelfare />} />
          <Route path="policy-management" element={<HRPolicyManagement />} />
        </Route>

        {/* IT Routes */}
        <Route 
          path="/it" 
          element={
            <EnhancedProtectedRoute allowedRoles={['it', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ITDashboard />} />
          <Route path="support-requests" element={<ITSupportRequests />} />
          <Route path="support-requests/:requestId" element={<RequestDetails />} />
          <Route path="asset-management" element={<ITAssetManagement />} />
          <Route path="inventory" element={<ITInventoryManagement />} />
          <Route path="system-monitoring" element={<ITSystemMonitoring />} />
          <Route path="user-accounts" element={<ITUserAccountManagement />} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <EnhancedProtectedRoute allowedRoles={['admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route path="dashboard" element={<AdminAnalyticsDashboard />} />
          <Route path="cash-management" element={<SupervisorCashApprovals />} />
          <Route path="cash-analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="cash-users" element={<AdminUserManagement />} />
          <Route path="purchase-requisitions" element={<AdminPurchaseRequisitions />} />
          <Route path="purchase-analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="procurement-budget" element={<AdminAnalyticsDashboard />} />
          <Route path="buyer-management" element={<AdminUserManagement />} />
          <Route path="workflow-config" element={<AdminSystemSettings />} />
          <Route path="project-management" element={<SupplyChainProjectManagement />} />
          <Route path="projects" element={<SupplyChainProjectManagement />} />
          <Route path="projects/analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="projects/resources" element={<SupplyChainProjectManagement />} />
          <Route path="projects/:projectId" element={<RequestDetails />} />
          <Route path="invoice-management" element={<AdminRequestsList />} />
          <Route path="invoice-settings" element={<AdminSystemSettings />} />
          <Route path="suppliers" element={<AdminSupplierManagement />} />
          <Route path="suppliers/dashboard" element={<AdminSupplierManagement />} />
          <Route path="suppliers/:supplierId" element={<RequestDetails />} />
          <Route path="incident-reports" element={<AdminIncidentReports />} />
          <Route path="incident-reports/dashboard" element={<AdminIncidentReports />} />
          <Route path="incident-reports/:reportId" element={<RequestDetails />} />
          <Route path="incident-compliance" element={<AdminIncidentReports />} />
          <Route path="it-support" element={<AdminITSupport />} />
          <Route path="it-support/dashboard" element={<AdminITSupport />} />
          <Route path="it-support/:requestId" element={<RequestDetails />} />
          <Route path="it-budget" element={<AdminAnalyticsDashboard />} />
          <Route path="suggestions" element={<AdminSuggestions />} />
          <Route path="suggestions/reports" element={<AdminSuggestions />} />
          <Route path="suggestions/:suggestionId" element={<RequestDetails />} />
          <Route path="strategic-suggestions" element={<AdminSuggestions />} />
          <Route path="sick-leave" element={<AdminSickLeave />} />
          <Route path="sick-leave/reports" element={<AdminSickLeave />} />
          <Route path="sick-leave/:leaveId" element={<RequestDetails />} />
          <Route path="leave-compliance" element={<AdminSickLeave />} />
          <Route path="analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="system-settings" element={<AdminSystemSettings />} />
          <Route path="user-management" element={<AdminUserManagement />} />
          <Route path='cash-approvals' element={<AdminCashApprovals/>} />
          <Route path="invoice-approvals" element={<SupervisorInvoiceApprovals />} />
          {/* Budget Code Management Routes */}
          <Route path="budget-codes" element={<AdminBudgetCodeApprovals />} />
          <Route path="budget-codes/pending" element={<AdminBudgetCodeApprovals />} />
          <Route path="budget-codes/analytics" element={<AdminAnalyticsDashboard />} />
          <Route path="budget-codes/:budgetId" element={<RequestDetails />} />
          <Route path="budget-code-config" element={<AdminSystemSettings />} />

          <Route path="action-items" element={<ActionItemsManagement />} />
          <Route path="action-items/:projectId" element={<ActionItemsManagement />} />
        </Route>

        {/* Legacy PettyCash Routes */}
        <Route 
          path="/pettycash" 
          element={
            <EnhancedProtectedRoute allowedRoles={['finance']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route index element={<PCDashboard />} />
          <Route path="dashboard" element={<PCDashboard />} />
          <Route path="requests" element={<PCRequests />} />
          <Route path="requests/new" element={<PCRequestForm />} />
          <Route path="requests/:id" element={<PCRequestForm editMode />} />
          <Route path="request-details/:id" element={<RequestDetails />} />
          <Route path="cash-requests" element={<AdminRequestsList />} />
          <Route path="cash-requests/:requestId" element={<AdminRequestDetails />} />
          <Route path="settings" element={<AccountSettings />} />
          <Route path="account-settings" element={<AccountSettings />} />
          <Route path="position" element={<Position />} />
          <Route path="display" element={<Display />} />
          <Route path="request-form" element={<PCRequestForm />} />
        </Route>

        <Route 
          path="/action-items" 
          element={
            <ProtectedRoute>
              <PettyCashLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<ActionItemsManagement />} />
        </Route>

        <Route 
          path="/sharepoint" 
          element={
            <ProtectedRoute>
              <PettyCashLayout />
            </ProtectedRoute>
          }
        >
          <Route path="portal" element={<SharePointPortal />} />
          <Route path="my-files" element={<MyUploads />} />
          <Route path="admin" element={<AdminDashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="manage" element={<AdminDashboard />} />
          <Route path="access" element={<AdminDashboard />} />
        </Route>

        {/* Universal Access Routes */}
        <Route 
          path="/account-settings" 
          element={
            <ProtectedRoute>
              <PettyCashLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountSettings />} />
        </Route>

        <Route 
          path="/analytics" 
          element={
            <EnhancedProtectedRoute allowedRoles={['supervisor', 'finance', 'hr', 'it', 'supply_chain', 'buyer', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route index element={<AdminAnalyticsDashboard />} />
        </Route>

        <Route 
          path="/employee-welfare" 
          element={
            <EnhancedProtectedRoute allowedRoles={['hr', 'admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route index element={<HREmployeeWelfare />} />
        </Route>

        <Route 
          path="/system-settings" 
          element={
            <EnhancedProtectedRoute allowedRoles={['admin']}>
              <PettyCashLayout />
            </EnhancedProtectedRoute>
          }
        >
          <Route index element={<AdminSystemSettings />} />
        </Route>

        {/* Fallback Route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: '#1890ff',
            colorPrimaryHover: '#40a9ff',
            colorPrimaryActive: '#096dd9',
            borderRadius: 4,
            colorBgContainer: '#ffffff',
            colorText: '#000000d9',
            colorTextBase: '#000000d9',
          },
          components: {
            Button: {
              colorPrimary: '#1890ff',
              colorPrimaryHover: '#40a9ff',
              colorPrimaryActive: '#096dd9',
              primaryColor: '#ffffff',
              colorPrimaryText: '#ffffff',
              colorTextDisabled: '#00000040',
            },
          },
        }}
      >
        <AntApp>
          <AppRoutes />
        </AntApp>
      </ConfigProvider>
    </Provider>
  );
};

export default App;

