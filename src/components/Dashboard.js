import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Space,
  Statistic,
  Alert,
  Badge,
  Divider,
  Tag,
  Tooltip,
  Collapse
} from 'antd';
import {
  DollarOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  BarChartOutlined,
  BankOutlined,
  UserOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  ToolOutlined,
  BulbOutlined,
  MedicineBoxOutlined,
  SafetyCertificateOutlined,
  LaptopOutlined,
  CrownOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  ContactsOutlined,
  SolutionOutlined,
  FundOutlined,
  DeliveredProcedureOutlined,
  DatabaseOutlined,
  PlusOutlined,
  ProjectOutlined,
  PlayCircleOutlined,
  DownOutlined,
  UpOutlined,
  ShareAltOutlined,
  FolderOutlined,
  UploadOutlined,
  FileOutlined,
  FolderPlusOutlined,
  HistoryOutlined,
  LockOutlined

} from '@ant-design/icons';
import api from '../services/api';
// import SharePointPortal from '../pages/SharePoint/SharePointPortal';
// import sharepointAPI from '../../src/services/sharepointAPI';

const { Title, Text, Paragraph } = Typography;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [expandedCards, setExpandedCards] = useState({});
  const [stats, setStats] = useState({
    cashRequests: { pending: 0, total: 0 },
    invoices: { pending: 0, total: 0 },
    incidentReports: { pending: 0, total: 0 },
    itSupport: { pending: 0, total: 0 },
    suggestions: { pending: 0, total: 0 },
    sickLeave: { pending: 0, total: 0 },
    purchaseRequisitions: { pending: 0, total: 0 },
    buyerRequisitions: { pending: 0, inProgress: 0, quotesReceived: 0, completed: 0 },
    quotes: { pending: 0, evaluated: 0, selected: 0 },
    suppliers: { active: 0, pending: 0 },
    purchaseOrders: { active: 0, delivered: 0 },
    projects: { pending: 0, inProgress: 0, completed: 0, total: 0 },
    actionItems: { pending: 0, total: 0 },
    sharepoint: { pending: 0, total: 12 }
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      const apiCalls = [];
      
      if (user?.role === 'supervisor') {
        apiCalls.push(api.get('/api/cash-requests/supervisor/stats').catch(() => ({ data: { pending: 0, total: 0 } })));
        apiCalls.push(api.get('/api/it-support/supervisor').catch(() => ({ data: [] })));
        apiCalls.push(api.get('/api/sick-leave/supervisor/stats').catch(() => ({ data: { pending: 0, total: 0 } })));
        apiCalls.push(api.get('/api/suggestions/supervisor/stats').catch(() => ({ data: { pending: 0, total: 0 } })));
      } else {
        apiCalls.push(api.get('/api/cash-requests/dashboard-stats').catch(() => ({ data: { pending: 0, total: 0 } })));
        apiCalls.push(api.get('/api/it-support/dashboard/stats').catch(() => ({ data: { summary: { pending: 0, total: 0 } } })));
        apiCalls.push(api.get('/api/sick-leave/dashboard-stats').catch(() => ({ data: { pending: 0, total: 0 } })));
        apiCalls.push(api.get('/api/suggestions/dashboard-stats').catch(() => ({ data: { pending: 0, total: 0 } })));
      }

      const [cashRequestsResponse, itSupportResponse, sickLeaveResponse, suggestionsResponse] = await Promise.allSettled(apiCalls);

      const cashStats = cashRequestsResponse.status === 'fulfilled' 
        ? cashRequestsResponse.value.data 
        : { pending: 0, total: 0 };
        
      let itStats = { pending: 0, total: 0 };
      if (itSupportResponse.status === 'fulfilled') {
        if (user?.role === 'supervisor') {
          const requests = itSupportResponse.value.data || [];
          itStats = {
            pending: requests.filter(r => ['pending_supervisor', 'pending_it_review'].includes(r.status)).length,
            total: requests.length
          };
        } else {
          itStats = itSupportResponse.value.data?.summary || { pending: 0, total: 0 };
        }
      }
        
      const leaveStats = sickLeaveResponse.status === 'fulfilled' 
        ? sickLeaveResponse.value.data 
        : { pending: 0, total: 0 };
        
      const suggestionsStats = suggestionsResponse.status === 'fulfilled' 
        ? suggestionsResponse.value.data 
        : { pending: 0, total: 0 };

      setStats({
        cashRequests: cashStats,
        invoices: { pending: 5, total: 23 }, 
        incidentReports: { pending: 1, total: 8 }, 
        itSupport: { pending: itStats.pending, total: itStats.total },
        suggestions: { pending: suggestionsStats.pending, total: suggestionsStats.total },
        sickLeave: { pending: leaveStats.pending, total: leaveStats.total },
        purchaseRequisitions: { pending: 2, total: 8 }, 
        buyerRequisitions: { pending: 5, inProgress: 8, quotesReceived: 3, completed: 12 },
        quotes: { pending: 15, evaluated: 8, selected: 3 },
        suppliers: { active: 25, pending: 3 },
        purchaseOrders: { active: 6, delivered: 18 },
        projects: { pending: 4, inProgress: 6, completed: 15, total: 25 },
        actionItems: { pending: 3, total: 12 },
        sharepoint: { pending: 0, total: 12 }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats({
        cashRequests: { pending: 0, total: 0 },
        invoices: { pending: 0, total: 0 },
        incidentReports: { pending: 0, total: 0 },
        itSupport: { pending: 0, total: 0 },
        suggestions: { pending: 0, total: 0 },
        sickLeave: { pending: 0, total: 0 },
        purchaseRequisitions: { pending: 0, total: 0 },
        buyerRequisitions: { pending: 0, inProgress: 0, quotesReceived: 0, completed: 0 },
        quotes: { pending: 0, evaluated: 0, selected: 0 },
        suppliers: { active: 0, pending: 0 },
        purchaseOrders: { active: 0, delivered: 0 },
        projects: { pending: 0, inProgress: 0, completed: 0, total: 0 },
        actionItems: { pending: 0, total: 0 },
        sharepoint: { pending: 0, total: 0 }
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleCardExpansion = (cardKey) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardKey]: !prev[cardKey]
    }));
  };

  const getRoleCapabilities = (role) => {
    const capabilities = {
      employee: {
        level: 1,
        canView: ['all'],
        canManage: [],
        canApprove: [],
        hasTeamAccess: false
      },
      supervisor: {
        level: 2,
        canView: ['all'],
        canManage: ['team-incidents', 'team-sick-leave'],
        canApprove: ['cash-requests', 'sick-leave', 'purchase-requisitions'],
        hasTeamAccess: true
      },
      finance: {
        level: 3,
        canView: ['all'],
        canManage: ['cash-requests', 'invoices', 'financial-reports'],
        canApprove: ['cash-requests', 'invoices'],
        hasTeamAccess: true
      },
      hr: {
        level: 3,
        canView: ['all'],
        canManage: ['incident-reports', 'suggestions', 'sick-leave', 'employee-welfare'],
        canApprove: ['sick-leave', 'incident-reports'],
        hasTeamAccess: true
      },
      it: {
        level: 3,
        canView: ['all'],
        canManage: ['it-support', 'it-inventory', 'system-maintenance'],
        canApprove: ['it-requests'],
        hasTeamAccess: true
      },
      supply_chain: {
        level: 3,
        canView: ['all'],
        canManage: ['purchase-requisitions', 'procurement', 'vendor-management'],
        canApprove: ['purchase-requisitions'],
        hasTeamAccess: true
      },
      buyer: {
        level: 3,
        canView: ['all'],
        canManage: ['assigned-requisitions', 'supplier-sourcing', 'quote-evaluation', 'purchase-orders'],
        canApprove: ['quotes', 'supplier-selection', 'purchase-orders'],
        hasTeamAccess: true
      },
      admin: {
        level: 4,
        canView: ['all'],
        canManage: ['all'],
        canApprove: ['all'],
        hasTeamAccess: true
      }
    };

    return capabilities[role] || capabilities.employee;
  };

  const getModuleCards = () => {
    const userCapabilities = getRoleCapabilities(user?.role);

    const modules = [
      {
        key: 'pettycash',
        title: 'Petty Cash Management',
        description: 'Manage cash requests, approvals, and justifications',
        icon: <DollarOutlined style={{ fontSize: '48px', color: '#52c41a' }} />,
        color: '#f6ffed',
        borderColor: '#52c41a',
        stats: stats.cashRequests,
        managementRoles: ['finance', 'hr', 'admin'],
        actions: {
          base: [
            { label: 'My Requests', path: '/employee/cash-requests', icon: <UserOutlined /> },
            { label: 'New Request', path: '/employee/cash-request/new', icon: <ArrowRightOutlined /> }
          ],
          supervisor: [
            { label: 'Team Requests', path: '/supervisor/cash-approvals', icon: <TeamOutlined />, badge: true }
          ],
          finance: [
            { label: 'Finance Dashboard', path: '/finance/cash-approvals', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Cash Requests', path: '/supervisor/cash-approvals', icon: <TeamOutlined />, badge: true },
            { label: 'All Requests', path: '/finance/cash-management', icon: <BarChartOutlined /> },
            { label: 'Financial Reports', path: '/finance/cash-reports', icon: <FileTextOutlined /> }
          ],
          hr: [
            { label: 'Team Requests', path: '/supervisor/cash-approvals', icon: <TeamOutlined />, badge: true }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/cash-approvals', icon: <SettingOutlined />, primary: true },
            { label: 'Team Requests', path: '/supervisor/cash-approvals', icon: <TeamOutlined />, badge: true },
            { label: 'System Analytics', path: '/admin/cash-analytics', icon: <BarChartOutlined /> },
            { label: 'User Management', path: '/admin/cash-users', icon: <TeamOutlined /> }
          ]
        }
      },
      ...(user?.role === 'supply_chain' || user?.role === 'supervisor' || user?.role === 'admin' ? [{
        key: 'project-management',
        title: 'Project Management',
        description: 'Create and manage organizational projects, track progress, allocate resources, and monitor timelines',
        icon: <ProjectOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
        color: '#e6fffb',
        borderColor: '#13c2c2',
        stats: stats.projects,
        managementRoles: ['supply_chain', 'supervisor', 'admin'],
        actions: {
          supply_chain: [
            { label: 'Project Portal', path: '/supply-chain/project-management', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Create Project', path: '/supply-chain/projects/new', icon: <PlusOutlined /> },
            { label: 'Active Projects', path: '/supply-chain/projects/active', icon: <PlayCircleOutlined />, badge: true },
            { label: 'Project Analytics', path: '/supply-chain/projects/analytics', icon: <BarChartOutlined /> }
          ],
          supervisor: [
            { label: 'My Projects', path: '/supervisor/projects', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Projects', path: '/supervisor/projects/team', icon: <TeamOutlined /> },
            { label: 'Create Project', path: '/supervisor/projects/new', icon: <PlusOutlined /> },
            { label: 'Progress Reports', path: '/supervisor/projects/reports', icon: <BarChartOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/project-management', icon: <SettingOutlined />, primary: true },
            { label: 'All Projects', path: '/admin/projects', icon: <ProjectOutlined /> },
            { label: 'Project Analytics', path: '/admin/projects/analytics', icon: <BarChartOutlined /> },
            { label: 'Resource Planning', path: '/admin/projects/resources', icon: <TeamOutlined /> }
          ]
        }
      }] : []),
      {
        key: 'purchase-requisitions',
        title: 'Purchase Requisitions',
        description: user?.role === 'buyer'
          ? 'Manage assigned requisitions, source suppliers, and handle procurement workflow'
          : 'Request procurement through enhanced approval workflow with finance verification and buyer assignment',
        icon: <ShoppingCartOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
        color: '#f9f0ff',
        borderColor: '#722ed1',
        stats: user?.role === 'buyer' ? stats.buyerRequisitions : stats.purchaseRequisitions,
        managementRoles: ['finance', 'supply_chain', 'buyer', 'hr', 'it', 'admin', 'employee'],
        actions: {
          base: [
            { label: 'My Requisitions', path: '/employee/purchase-requisitions', icon: <UserOutlined /> },
            { label: 'New Requisition', path: '/employee/purchase-requisitions/new', icon: <ArrowRightOutlined /> },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> }
          ],
          supervisor: [
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> }
          ],
          finance: [
            { label: 'Budget Verification', path: '/finance/purchase-requisitions', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> },
            { label: 'Finance Dashboard', path: '/finance/dashboard', icon: <BankOutlined /> },
            { label: 'Budget Analytics', path: '/finance/purchase-analytics', icon: <BarChartOutlined /> }
          ],
          hr: [
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> }
          ],
          it: [
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> }
          ],
          supply_chain: [
            { label: 'SC Dashboard', path: '/supply-chain/requisitions', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Head Approval', path: '/supply-chain/head-approval', icon: <CheckCircleOutlined />, badge: true },
            { label: 'Procurement Planning', path: '/supply-chain/procurement-planning', icon: <TruckOutlined /> },
            { label: 'Item Management', path: '/supply-chain/item-management', icon: <DatabaseOutlined /> },
            { label: 'Vendor Management', path: '/supply-chain/vendors', icon: <TeamOutlined /> },
            { label: 'Contract Management', path: '/supply-chain/contracts', icon: <FileTextOutlined /> }
          ],
          buyer: [
            { label: 'My Assignments', path: '/buyer/requisitions', icon: <CrownOutlined />, primary: true, badge: true }
          ],
          employee: [
            { label: 'My Requisitions', path: '/employee/purchase-requisitions', icon: <UserOutlined /> },
            { label: 'New Requisition', path: '/employee/purchase-requisitions/new', icon: <ArrowRightOutlined /> },
            { label: 'Request Items', path: '/employee/item-requests', icon: <PlusOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/purchase-requisitions', icon: <SettingOutlined />, primary: true },
            { label: 'Team Requisitions', path: '/supervisor/purchase-requisitions', icon: <TeamOutlined />, badge: true },
            { label: 'Budget Code Approvals', path: '/admin/budget-codes', icon: <BankOutlined />, badge: true },
            { label: 'System Analytics', path: '/admin/purchase-analytics', icon: <BarChartOutlined /> },
            { label: 'Workflow Management', path: '/admin/workflow-config', icon: <SettingOutlined /> },
            { label: 'Buyer Management', path: '/admin/buyer-management', icon: <TeamOutlined /> },
            { label: 'System Configuration', path: '/admin/system-config', icon: <SettingOutlined /> },
            { label: 'Report Generation', path: '/admin/reports', icon: <FileTextOutlined /> }
          ]
        }
      },
      ...(user?.role === 'buyer' || user?.role === 'admin' ? [{
        key: 'buyer-procurement',
        title: 'Procurement Management',
        description: 'Comprehensive procurement workflow: sourcing, quotes, purchase orders, and delivery tracking',
        icon: <SolutionOutlined style={{ fontSize: '48px', color: '#fa8c16' }} />,
        color: '#fff7e6',
        borderColor: '#fa8c16',
        stats: stats.quotes,
        managementRoles: ['buyer', 'admin'],
        actions: {
          buyer: [
            { label: 'Procurement Dashboard', path: '/buyer/dashboard', icon: <CrownOutlined />, primary: true },
            { label: 'Quote Evaluation', path: '/buyer/quotes', icon: <BarChartOutlined />, badge: true },
            { label: 'Purchase Orders', path: '/buyer/purchase-orders', icon: <FileTextOutlined /> },
            { label: 'Performance Analytics', path: '/buyer/analytics/performance', icon: <FundOutlined /> }
          ],
          admin: [
            { label: 'Buyer Performance', path: '/admin/buyer-analytics', icon: <BarChartOutlined />, primary: true },
            { label: 'Procurement Reports', path: '/admin/procurement-reports', icon: <FileTextOutlined /> },
            { label: 'Buyer Management', path: '/admin/buyer-management', icon: <TeamOutlined /> }
          ]
        }
      }] : []),
      ...(user?.role === 'buyer' || user?.role === 'supply_chain' || user?.role === 'admin' ? [{
        key: 'supplier-management',
        title: 'Supplier Relations',
        description: user?.role === 'buyer'
          ? 'Manage supplier relationships, performance tracking, and communication'
          : 'Comprehensive supplier database and vendor management',
        icon: <ContactsOutlined style={{ fontSize: '48px', color: '#eb2f96' }} />,
        color: '#fff0f6',
        borderColor: '#eb2f96',
        stats: stats.suppliers,
        managementRoles: ['buyer', 'supply_chain', 'admin'],
        actions: {
          buyer: [
            { label: 'Supplier Dashboard', path: '/buyer/suppliers', icon: <CrownOutlined />, primary: true },
            { label: 'Performance Review', path: '/buyer/suppliers/performance', icon: <BarChartOutlined /> },
            { label: 'Communication Log', path: '/buyer/suppliers/communication', icon: <TeamOutlined /> },
            { label: 'Supplier Analytics', path: '/buyer/analytics/suppliers', icon: <FundOutlined /> }
          ],
          supply_chain: [
            { label: 'Supplier Management', path: '/supply-chain/suppliers', icon: <CrownOutlined />, primary: true },
            { label: 'Supplier Onboarding', path: '/supply-chain/vendor-onboarding', icon: <UserOutlined /> },
            { label: 'Contract Management', path: '/supply-chain/contracts', icon: <FileTextOutlined /> },
            { label: 'Performance Tracking', path: '/supply-chain/supplier-performance', icon: <BarChartOutlined /> }
          ],
          admin: [
            { label: 'Supplier Analytics', path: '/admin/supplier-analytics', icon: <BarChartOutlined />, primary: true },
            { label: 'Supplier Database', path: '/admin/suppliers', icon: <TeamOutlined /> }
          ]
        }
      }] : []),
      {
        key: 'invoices',
        title: 'Invoice Management',
        description: 'Upload, track, and approve invoice submissions',
        icon: <FileTextOutlined style={{ fontSize: '48px', color: '#1890ff' }} />,
        color: '#f0f8ff',
        borderColor: '#1890ff',
        stats: stats.invoices,
        managementRoles: ['finance', 'hr', 'it', 'admin', 'supervisor'],
        actions: {
          base: [
            { label: 'My Invoices', path: '/employee/invoices', icon: <UserOutlined /> }
          ],
          supervisor: [
            { label: 'Team Invoices', path: '/supervisor/invoice-approvals', icon: <TeamOutlined />, badge: true }
          ],
          finance: [
            { label: 'Invoice Dashboard', path: '/finance/invoice-management', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Invoices', path: '/supervisor/invoice-approvals', icon: <TeamOutlined />, badge: true },
            { label: 'Supplier Management', path: '/finance/suppliers', icon: <BankOutlined /> },
            { label: 'Invoice Analytics', path: '/finance/invoice-analytics', icon: <BarChartOutlined /> },
            { label: 'Payment Processing', path: '/finance/payments', icon: <DollarOutlined /> },
            { label: 'Financial Reports', path: '/finance/financial-reports', icon: <FileTextOutlined /> },
            { label: 'Budget Management', path: '/finance/budget-management', icon: <FundOutlined /> }
          ],
          hr: [
            { label: 'Team Invoices', path: '/supervisor/invoice-approvals', icon: <TeamOutlined />, badge: true }
          ],
          it: [
            { label: 'Team Invoices', path: '/supervisor/invoice-approvals', icon: <TeamOutlined />, badge: true }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/invoice-management', icon: <SettingOutlined />, primary: true },
            { label: 'Team Invoices', path: '/supervisor/invoice-approvals', icon: <TeamOutlined />, badge: true },
            { label: 'System Settings', path: '/admin/invoice-approvals', icon: <SettingOutlined /> }
          ]
        }
      },
      {
        key: 'incident-reports',
        title: 'Incident Reports',
        description: 'Report workplace incidents and safety issues',
        icon: <ExclamationCircleOutlined style={{ fontSize: '48px', color: '#faad14' }} />,
        color: '#fffbf0',
        borderColor: '#faad14',
        stats: stats.incidentReports,
        managementRoles: ['hr', 'admin'],
        actions: {
          base: [
            { label: 'My Reports', path: '/employee/incident-reports', icon: <UserOutlined /> },
            { label: 'New Report', path: '/employee/incident-reports/new', icon: <ArrowRightOutlined /> }
          ],
          supervisor: [
            { label: 'Team Reports', path: '/supervisor/incident-reports', icon: <TeamOutlined />, badge: true },
            { label: 'Safety Review', path: '/supervisor/safety-review', icon: <SafetyCertificateOutlined /> }
          ],
          hr: [
            { label: 'HR Dashboard', path: '/hr/incident-reports', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Reports', path: '/supervisor/incident-reports', icon: <TeamOutlined />, badge: true },
            { label: 'Investigation Tools', path: '/hr/incident-investigation', icon: <EyeOutlined /> },
            { label: 'Safety Analytics', path: '/hr/incident-reports/analytics', icon: <BarChartOutlined /> },
            { label: 'Policy Management', path: '/hr/safety-policies', icon: <SafetyCertificateOutlined /> },
            { label: 'Compliance Tracking', path: '/hr/compliance-tracking', icon: <CheckCircleOutlined /> },
            { label: 'Training Programs', path: '/hr/safety-training', icon: <BulbOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/incident-reports', icon: <SettingOutlined />, primary: true },
            { label: 'Team Reports', path: '/supervisor/incident-reports', icon: <TeamOutlined />, badge: true },
            { label: 'Compliance Reports', path: '/admin/incident-compliance', icon: <FileTextOutlined /> }
          ]
        }
      },
      {
        key: 'it-support',
        title: 'IT Support',
        description: 'Request IT materials and report device issues',
        icon: <LaptopOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
        color: '#f9f0ff',
        borderColor: '#722ed1',
        stats: stats.itSupport,
        managementRoles: ['it', 'admin'],
        actions: {
          base: [
            { label: 'My Requests', path: '/employee/it-support', icon: <UserOutlined /> },
            { label: 'Request Materials', path: '/employee/it-support/materials/new', icon: <ArrowRightOutlined /> },
            { label: 'Report Issue', path: '/employee/it-support/issues/new', icon: <ExclamationCircleOutlined /> }
          ],
          supervisor: [
            { label: 'Team IT Requests', path: '/supervisor/it-support', icon: <TeamOutlined />, badge: true }
          ],
          it: [
            { label: 'IT Dashboard', path: '/it/support-requests', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team IT Requests', path: '/supervisor/it-support', icon: <TeamOutlined />, badge: true },
            { label: 'Asset Management', path: '/it/asset-management', icon: <ToolOutlined /> },
            { label: 'Inventory Control', path: '/it/inventory', icon: <BarChartOutlined /> },
            { label: 'System Monitoring', path: '/it/system-monitoring', icon: <EyeOutlined /> },
            { label: 'User Management', path: '/it/user-accounts', icon: <UserOutlined /> },
            { label: 'Security Management', path: '/it/security', icon: <SafetyCertificateOutlined /> },
            { label: 'Network Management', path: '/it/network', icon: <LaptopOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/it-support', icon: <SettingOutlined />, primary: true },
            { label: 'Team IT Requests', path: '/supervisor/it-support', icon: <TeamOutlined />, badge: true },
            { label: 'IT Budget', path: '/admin/it-budget', icon: <DollarOutlined /> }
          ]
        }
      },
      {
        key: 'suggestions',
        title: 'Employee Suggestions',
        description: 'Submit anonymous suggestions and feedback',
        icon: <BulbOutlined style={{ fontSize: '48px', color: '#13c2c2' }} />,
        color: '#e6fffb',
        borderColor: '#13c2c2',
        stats: stats.suggestions,
        managementRoles: ['hr', 'admin'],
        actions: {
          base: [
            { label: 'My Suggestions', path: '/employee/suggestions', icon: <UserOutlined /> },
            { label: 'New Suggestion', path: '/employee/suggestions/new', icon: <ArrowRightOutlined /> }
          ],
          supervisor: [
            { label: 'Team Feedback', path: '/supervisor/team-suggestions', icon: <TeamOutlined />, badge: true }
          ],
          hr: [
            { label: 'HR Dashboard', path: '/hr/suggestions', icon: <CrownOutlined />, primary: true },
            { label: 'Team Feedback', path: '/supervisor/team-suggestions', icon: <TeamOutlined />, badge: true },
            { label: 'Feedback Analysis', path: '/hr/suggestions/analytics', icon: <BarChartOutlined /> },
            { label: 'Implementation Tracking', path: '/hr/suggestion-implementation', icon: <CheckCircleOutlined /> },
            { label: 'Employee Engagement', path: '/hr/employee-engagement', icon: <TeamOutlined /> },
            { label: 'Survey Management', path: '/hr/surveys', icon: <FileTextOutlined /> },
            { label: 'Recognition Programs', path: '/hr/recognition', icon: <CrownOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/suggestions', icon: <SettingOutlined />, primary: true },
            { label: 'Team Feedback', path: '/supervisor/team-suggestions', icon: <TeamOutlined />, badge: true },
            { label: 'Strategic Planning', path: '/admin/strategic-suggestions', icon: <BulbOutlined /> }
          ]
        }
      },
      {
        key: 'sick-leave',
        title: 'Leave Requests',
        description: 'Submit and track sick leave applications',
        icon: <MedicineBoxOutlined style={{ fontSize: '48px', color: '#f5222d' }} />,
        color: '#fff1f0',
        borderColor: '#f5222d',
        stats: stats.sickLeave,
        managementRoles: ['hr', 'supervisor', 'admin'],
        actions: {
          base: [
            { label: 'My Leave Requests', path: '/employee/leave', icon: <UserOutlined /> },
            { label: 'New Request', path: '/employee/leave/new', icon: <ArrowRightOutlined /> }
          ],
          supervisor: [
            { label: 'Team Leave Dashboard', path: '/supervisor/sick-leave', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Approval Queue', path: '/supervisor/sick-leave/pending', icon: <ClockCircleOutlined /> },
            { label: 'Team Calendar', path: '/supervisor/team-calendar', icon: <TeamOutlined /> }
          ],
          hr: [
            { label: 'HR Dashboard', path: '/hr/sick-leave', icon: <CrownOutlined />, primary: true },
            { label: 'Team Leave', path: '/supervisor/sick-leave', icon: <TeamOutlined />, badge: true },
            { label: 'Leave Analytics', path: '/hr/sick-leave/analytics', icon: <BarChartOutlined /> },
            { label: 'Policy Management', path: '/hr/leave-policies', icon: <SafetyCertificateOutlined /> },
            { label: 'Medical Certificates', path: '/hr/medical-certificates', icon: <MedicineBoxOutlined /> },
            { label: 'Leave Balance Management', path: '/hr/leave-balances', icon: <CheckCircleOutlined /> },
            { label: 'Holiday Calendar', path: '/hr/holiday-calendar', icon: <TeamOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/sick-leave', icon: <SettingOutlined />, primary: true },
            { label: 'Team Leave', path: '/supervisor/sick-leave', icon: <TeamOutlined />, badge: true },
            { label: 'Compliance Reports', path: '/admin/leave-compliance', icon: <FileTextOutlined /> }
          ]
        }
      },
      {
        key: 'action-items',
        title: 'Action Items & Tasks',
        description: 'Track and manage your daily tasks and project action items',
        icon: <CheckCircleOutlined style={{ fontSize: '48px', color: '#722ed1' }} />,
        color: '#f9f0ff',
        borderColor: '#722ed1',
        stats: stats.actionItems,
        managementRoles: ['supply_chain', 'admin'],
        actions: {
          base: [
            { label: 'My Tasks', path: '/action-items', icon: <UserOutlined /> },
            { label: 'New Task', path: '/action-items/new', icon: <PlusOutlined /> }
          ],
          supply_chain: [
            { label: 'Task Management', path: '/supply-chain/action-items', icon: <CrownOutlined />, primary: true, badge: true },
            { label: 'Team Tasks', path: '/supply-chain/action-items?view=team', icon: <TeamOutlined /> },
            { label: 'Project Tasks', path: '/supply-chain/action-items?view=projects', icon: <ProjectOutlined /> }
          ],
          supervisor: [
            { label: 'Team Reports', path: '/supervisor/incident-reports', icon: <TeamOutlined />, badge: true }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/admin/action-items', icon: <SettingOutlined />, primary: true },
            { label: 'All Tasks', path: '/admin/action-items?view=all', icon: <CheckCircleOutlined /> }
          ]
        }
      },
      {
        key: 'sharepoint',
        title: 'File Sharing Portal',
        description: 'Upload, organize, and share files across departments and company-wide',
        icon: <ShareAltOutlined style={{ fontSize: '48px', color: '#667eea' }} />,
        color: '#f0ebff',
        borderColor: '#667eea',
        stats: stats.sharepoint,
        managementRoles: ['admin', 'supervisor', 'finance', 'hr', 'it', 'supply_chain', 'buyer', 'employee'],
        actions: {
          base: [
            { label: 'Browse Files', path: '/sharepoint/portal', icon: <FolderOutlined /> },
            { label: 'Upload Files', path: '/sharepoint/portal', icon: <UploadOutlined /> },
            { label: 'My Uploads', path: '/sharepoint/my-files', icon: <FileOutlined /> }
          ],
          admin: [
            { label: 'Admin Dashboard', path: '/sharepoint/admin', icon: <CrownOutlined />, primary: true },
            { label: 'Browse Files', path: '/sharepoint/portal', icon: <FolderOutlined /> },
            { label: 'Storage Stats', path: '/sharepoint/analytics', icon: <BarChartOutlined /> },
            { label: 'Activity Log', path: '/sharepoint/activity', icon: <HistoryOutlined /> }
          ]
        }
      }
    ];

    return modules.map(module => {
      const hasManagementAccess = module.managementRoles.includes(user?.role);

      const availableActions = [];

      availableActions.push(...(module.actions.base || []));

      if (module.actions[user?.role]) {
        availableActions.push(...module.actions[user?.role]);
      }

      const visibleActions = availableActions.slice(0, 3);
      const expandableActions = availableActions.slice(3);
      const isExpanded = expandedCards[module.key];

      return (
        <Col xs={24} sm={24} md={12} lg={8} xl={8} key={module.key}>
          <Card
            hoverable
            style={{
              height: '100%',
              backgroundColor: module.color,
              border: `2px solid ${module.borderColor}`,
              borderRadius: '12px',
              position: 'relative'
            }}
            bodyStyle={{ padding: '24px' }}
          >
            {hasManagementAccess && (
              <div style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                zIndex: 1
              }}>
                <Tooltip title="You have management access to this module">
                  <Badge
                    count={<CrownOutlined style={{ color: '#faad14' }} />}
                    style={{ backgroundColor: 'transparent' }}
                  />
                </Tooltip>
              </div>
            )}

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              {module.icon}
              <Title level={4} style={{ margin: '16px 0 8px 0', color: '#333' }}>
                {module.title}
                {hasManagementAccess && (
                  <Tag color="gold" style={{ marginLeft: '8px', fontSize: '10px' }}>
                    MANAGER
                  </Tag>
                )}
              </Title>
              <Paragraph type="secondary" style={{ margin: 0, fontSize: '12px' }}>
                {module.description}
              </Paragraph>
            </div>

            <Divider />

            {user?.role === 'buyer' && module.key === 'purchase-requisitions' ? (
              <Row gutter={[8, 8]} style={{ marginBottom: '20px' }}>
                <Col span={12}>
                  <Statistic
                    title="Pending"
                    value={module.stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="In Progress"
                    value={module.stats.inProgress}
                    prefix={<ShoppingCartOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Quoted"
                    value={module.stats.quotesReceived}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Completed"
                    value={module.stats.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            ) : user?.role === 'buyer' && module.key === 'buyer-procurement' ? (
              <Row gutter={[8, 8]} style={{ marginBottom: '20px' }}>
                <Col span={12}>
                  <Statistic
                    title="Pending Quotes"
                    value={module.stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Evaluated"
                    value={module.stats.evaluated}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  />
                </Col>
                <Col span={24}>
                  <Statistic
                    title="POs Created"
                    value={module.stats.selected}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            ) : user?.role === 'buyer' && module.key === 'supplier-management' ? (
              <Row gutter={[8, 8]} style={{ marginBottom: '20px' }}>
                <Col span={12}>
                  <Statistic
                    title="Active"
                    value={module.stats.active}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Pending"
                    value={module.stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            ) : module.key === 'project-management' ? (
              <Row gutter={[8, 8]} style={{ marginBottom: '20px' }}>
                <Col span={12}>
                  <Statistic
                    title="Pending"
                    value={module.stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="In Progress"
                    value={module.stats.inProgress}
                    prefix={<PlayCircleOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Completed"
                    value={module.stats.completed}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: '#52c41a', fontSize: '16px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total"
                    value={module.stats.total}
                    prefix={<ProjectOutlined />}
                    valueStyle={{ color: '#722ed1', fontSize: '16px' }}
                  />
                </Col>
              </Row>
            ) : (
              <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
                <Col span={12}>
                  <Statistic
                    title="Pending"
                    value={module.stats.pending}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: '#faad14', fontSize: '18px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Total"
                    value={module.stats.total}
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff', fontSize: '18px' }}
                  />
                </Col>
              </Row>
            )}

            <Space direction="vertical" style={{ width: '100%' }} size="small">
              {visibleActions.map((action, index) => {
                const isPrimary = action.primary || (hasManagementAccess && index === 0);
                const showBadge = action.badge && (
                  user?.role === 'buyer' && module.key === 'purchase-requisitions'
                    ? module.stats.pending + module.stats.inProgress > 0
                    : module.stats.pending > 0
                );

                return (
                  <Button
                    key={index}
                    type={isPrimary ? "primary" : "default"}
                    block
                    icon={action.icon || <ArrowRightOutlined />}
                    onClick={() => navigate(action.path)}
                    style={{
                      borderColor: isPrimary ? module.borderColor : undefined,
                      fontSize: '12px',
                      ...(isPrimary && {
                        backgroundColor: module.borderColor,
                        borderColor: module.borderColor
                      })
                    }}
                  >
                    {action.label}
                    {showBadge && (
                      <Badge
                        count={
                          user?.role === 'buyer' && module.key === 'purchase-requisitions'
                            ? module.stats.pending + module.stats.inProgress
                            : module.stats.pending
                        }
                        style={{ marginLeft: '8px' }}
                        size="small"
                      />
                    )}
                  </Button>
                );
              })}

              {expandableActions.length > 0 && (
                <>
                  <Collapse
                    ghost
                    activeKey={isExpanded ? ['1'] : []}
                    onChange={() => toggleCardExpansion(module.key)}
                    style={{ 
                      backgroundColor: 'transparent',
                      border: 'none'
                    }}
                    items={[
                      {
                        key: '1',
                        label: (
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            fontSize: '11px',
                            color: '#666',
                            padding: '4px 0'
                          }}>
                            <span style={{ marginRight: '8px' }}>
                              {expandableActions.length} more option{expandableActions.length !== 1 ? 's' : ''}
                            </span>
                            {isExpanded ? <UpOutlined /> : <DownOutlined />}
                          </div>
                        ),
                        children: (
                          <Space direction="vertical" style={{ width: '100%' }} size="small">
                            {expandableActions.map((action, index) => {
                              const showBadge = action.badge && (
                                user?.role === 'buyer' && module.key === 'purchase-requisitions'
                                  ? module.stats.pending + module.stats.inProgress > 0
                                  : module.stats.pending > 0
                              );

                              return (
                                <Button
                                  key={`exp-${index}`}
                                  type="default"
                                  block
                                  icon={action.icon || <ArrowRightOutlined />}
                                  onClick={() => navigate(action.path)}
                                  style={{
                                    fontSize: '12px',
                                    opacity: 0.9
                                  }}
                                >
                                  {action.label}
                                  {showBadge && (
                                    <Badge
                                      count={
                                        user?.role === 'buyer' && module.key === 'purchase-requisitions'
                                          ? module.stats.pending + module.stats.inProgress
                                          : module.stats.pending
                                      }
                                      style={{ marginLeft: '8px' }}
                                      size="small"
                                    />
                                  )}
                                </Button>
                              );
                            })}
                          </Space>
                        ),
                        showArrow: false
                      }
                    ]}
                  />
                </>
              )}
            </Space>
          </Card>
        </Col>
      );
    });
  };

  const getRoleInfo = () => {
    const roleConfig = {
      employee: {
        title: 'Employee Dashboard',
        description: 'Access all services and submit requests',
        icon: <UserOutlined />,
        color: '#1890ff'
      },
      supervisor: {
        title: 'Supervisor Dashboard',
        description: 'All services + team management and approvals',
        icon: <TeamOutlined />,
        color: '#52c41a'
      },
      finance: {
        title: 'Finance Dashboard',
        description: 'All services + financial management and team oversight',
        icon: <BankOutlined />,
        color: '#722ed1'
      },
      hr: {
        title: 'HR Dashboard',
        description: 'All services + HR management and team employee relations',
        icon: <SafetyCertificateOutlined />,
        color: '#13c2c2'
      },
      it: {
        title: 'IT Dashboard',
        description: 'All services + IT infrastructure and team support management',
        icon: <ToolOutlined />,
        color: '#722ed1'
      },
      supply_chain: {
        title: 'Supply Chain Dashboard',
        description: 'All services + procurement and team vendor management',
        icon: <ShoppingCartOutlined />,
        color: '#fa8c16'
      },
      buyer: {
        title: 'Buyer Dashboard',
        description: 'All services + specialized procurement workflow management',
        icon: <SolutionOutlined />,
        color: '#eb2f96'
      },
      admin: {
        title: 'Administrator Dashboard',
        description: 'Full system access and comprehensive team management',
        icon: <SettingOutlined />,
        color: '#fa541c'
      }
    };

    return roleConfig[user?.role] || roleConfig.employee;
  };

  const roleInfo = getRoleInfo();
  const userCapabilities = getRoleCapabilities(user?.role);

  const getTotalPending = () => {
    if (user?.role === 'buyer') {
      return (
        (stats.buyerRequisitions.pending || 0) +
        (stats.buyerRequisitions.inProgress || 0) +
        (stats.quotes.pending || 0) +
        Object.values(stats).reduce((sum, stat) => sum + (stat.pending || 0), 0)
      );
    }
    return Object.values(stats).reduce((sum, stat) => sum + (stat.pending || 0), 0);
  };

  const totalPending = getTotalPending();

  const managementModules = ['pettycash', 'purchase-requisitions', 'buyer-procurement', 'supplier-management', 'invoices', 'incident-reports', 'it-support', 'suggestions', 'sick-leave']
    .filter(module => {
      const moduleConfig = {
        'pettycash': ['finance', 'hr', 'admin'],
        'purchase-requisitions': ['supply_chain', 'buyer', 'hr', 'it', 'finance', 'admin'],
        'buyer-procurement': ['buyer', 'admin'],
        'supplier-management': ['buyer', 'supply_chain', 'admin'],
        'invoices': ['finance', 'hr', 'it', 'admin'],
        'incident-reports': ['hr', 'admin'],
        'it-support': ['it', 'admin'],
        'suggestions': ['hr', 'admin'],
        'sick-leave': ['hr', 'supervisor', 'admin']
      };
      return moduleConfig[module]?.includes(user?.role);
    });

  return (
    <div style={{ padding: '24px' }}>
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" gutter={[16, 16]}>
          <Col>
            <div style={{
              fontSize: '48px',
              color: roleInfo.color,
              background: `${roleInfo.color}15`,
              padding: '16px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {roleInfo.icon}
              {userCapabilities.level > 1 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: '#faad14',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CrownOutlined style={{ fontSize: '12px', color: 'white' }} />
                </div>
              )}
            </div>
          </Col>
          <Col flex="auto">
            <Title level={2} style={{ margin: 0, color: roleInfo.color }}>
              Welcome back, {user?.fullName || user?.email}!
            </Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>
              {roleInfo.description}
            </Text>
            <div style={{ marginTop: '8px' }}>
              <Tag color={roleInfo.color} style={{ textTransform: 'capitalize' }}>
                {user?.role} Access
              </Tag>
              {user?.department && (
                <Tag color="blue">{user.department}</Tag>
              )}
              {managementModules.length > 0 && (
                <Tag color="gold" icon={<CrownOutlined />}>
                  {managementModules.length} Management Module{managementModules.length !== 1 ? 's' : ''}
                </Tag>
              )}
              {userCapabilities.hasTeamAccess && (
                <Tag color="green" icon={<TeamOutlined />}>
                  Team Access Enabled
                </Tag>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {userCapabilities.level > 1 && (
        <Alert
          message={`Enhanced Access Level ${userCapabilities.level}${userCapabilities.hasTeamAccess ? ' - Team Management Enabled' : ''}`}
          description={
            <div>
              <Text strong>Management Access:</Text> {managementModules.join(', ')}
              <br />
              <Text type="secondary">
                You have administrative privileges for {managementModules.length} module{managementModules.length !== 1 ? 's' : ''}
                while maintaining access to all employee services.
              </Text>
              {userCapabilities.hasTeamAccess && (
                <>
                  <br />
                  <Text strong style={{ color: '#52c41a' }}>Team Access:</Text>
                  <Text type="secondary"> You can view and approve requests from your team members across all modules.</Text>
                </>
              )}
              {user?.role === 'buyer' && (
                <>
                  <br />
                  <Text strong style={{ color: '#eb2f96' }}>Buyer Specialization:</Text>
                  <Text type="secondary"> Complete procurement workflow management from requisition to delivery.</Text>
                </>
              )}
            </div>
          }
          type="info"
          showIcon
          icon={<CrownOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {totalPending > 0 && (
        <Alert
          message={`${totalPending} Pending Actions Required`}
          description={
            <Space wrap>
              {user?.role === 'buyer' && (
                <>
                  {stats.buyerRequisitions.pending > 0 && (
                    <Text><ShoppingCartOutlined /> {stats.buyerRequisitions.pending} new requisition{stats.buyerRequisitions.pending !== 1 ? 's' : ''}</Text>
                  )}
                  {stats.buyerRequisitions.inProgress > 0 && (
                    <Text><SolutionOutlined /> {stats.buyerRequisitions.inProgress} sourcing in progress</Text>
                  )}
                  {stats.quotes.pending > 0 && (
                    <Text><FileTextOutlined /> {stats.quotes.pending} quote{stats.quotes.pending !== 1 ? 's' : ''} to evaluate</Text>
                  )}
                </>
              )}
              {stats.cashRequests.pending > 0 && (
                <Text><DollarOutlined /> {stats.cashRequests.pending} cash request{stats.cashRequests.pending !== 1 ? 's' : ''}</Text>
              )}
              {stats.purchaseRequisitions.pending > 0 && user?.role !== 'buyer' && (
                <Text><ShoppingCartOutlined /> {stats.purchaseRequisitions.pending} purchase requisition{stats.purchaseRequisitions.pending !== 1 ? 's' : ''}</Text>
              )}
              {stats.invoices.pending > 0 && (
                <Text><FileTextOutlined /> {stats.invoices.pending} invoice{stats.invoices.pending !== 1 ? 's' : ''}</Text>
              )}
              {stats.incidentReports.pending > 0 && (
                <Text><ExclamationCircleOutlined /> {stats.incidentReports.pending} incident report{stats.incidentReports.pending !== 1 ? 's' : ''}</Text>
              )}
              {stats.itSupport.pending > 0 && (
                <Text><LaptopOutlined /> {stats.itSupport.pending} IT request{stats.itSupport.pending !== 1 ? 's' : ''}</Text>
              )}
              {stats.sickLeave.pending > 0 && (
                <Text><MedicineBoxOutlined /> {stats.sickLeave.pending} sick leave request{stats.sickLeave.pending !== 1 ? 's' : ''}</Text>
              )}
            </Space>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      <Title level={3} style={{ marginBottom: '24px' }}>
        Service Modules
        <Text type="secondary" style={{ fontSize: '14px', marginLeft: '16px' }}>
          All services available • Enhanced management for your role{userCapabilities.hasTeamAccess && ' • Team access enabled'}
        </Text>
      </Title>

      <Row gutter={[24, 24]}>
        {getModuleCards()}
      </Row>

      <Card style={{ marginTop: '24px' }} title="Quick Links">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Button
              block
              icon={<UserOutlined />}
              onClick={() => navigate('/account-settings')}
            >
              Account Settings
            </Button>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Button
              block
              icon={<BarChartOutlined />}
              onClick={() => navigate('/analytics')}
              disabled={userCapabilities.level < 2}
            >
              Analytics Dashboard
            </Button>
          </Col>
          {user?.role === 'buyer' && (
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                icon={<FundOutlined />}
                onClick={() => navigate('/buyer/analytics/performance')}
              >
                Performance Reports
              </Button>
            </Col>
          )}
          {['hr', 'admin'].includes(user?.role) && (
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                icon={<SafetyCertificateOutlined />}
                onClick={() => navigate('/employee-welfare')}
              >
                Employee Welfare
              </Button>
            </Col>
          )}
          {user?.role === 'admin' && (
            <Col xs={24} sm={12} md={6}>
              <Button
                block
                icon={<SettingOutlined />}
                onClick={() => navigate('/system-settings')}
              >
                System Settings
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {user?.role === 'buyer' && (
        <Card style={{ marginTop: '24px' }} title="Procurement Performance Summary">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={6}>
              <Statistic
                title="Active Requisitions"
                value={stats.buyerRequisitions.pending + stats.buyerRequisitions.inProgress}
                prefix={<ShoppingCartOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Quotes Pending"
                value={stats.quotes.pending}
                prefix={<FileTextOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Active Suppliers"
                value={stats.suppliers.active}
                prefix={<ContactsOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={6}>
              <Statistic
                title="Completed This Month"
                value={stats.buyerRequisitions.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          <Divider />

          <Space>
            <Button
              type="primary"
              icon={<BarChartOutlined />}
              onClick={() => navigate('/buyer/analytics')}
            >
              View Detailed Analytics
            </Button>
            <Button
              icon={<FileTextOutlined />}
              onClick={() => navigate('/buyer/reports')}
            >
              Generate Reports
            </Button>
            <Button
              icon={<ContactsOutlined />}
              onClick={() => navigate('/buyer/suppliers')}
            >
              Manage Suppliers
            </Button>
          </Space>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;


