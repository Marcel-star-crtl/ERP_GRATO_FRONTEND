import React, { useState, useEffect, useSelector } from 'react';
import { useNavigate } from 'react-router-dom';
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
    Text
  } from 'antd';

/**
 * Role Access Helper - Defines the hierarchical access system
 * 
 * HIERARCHY LEVELS:
 * Level 1: Employee - Base access to all employee services
 * Level 2: Supervisor - Employee access + team management capabilities
 * Level 3: Specialist (Finance/HR/IT) - Employee access + domain expertise management
 * Level 4: Admin - Full system access + all management capabilities
 */

export const ROLE_HIERARCHY = {
  employee: {
    level: 1,
    name: 'Employee',
    description: 'Base access to all employee services',
    capabilities: ['submit_requests', 'view_own_data', 'use_all_services']
  },
  supervisor: {
    level: 2,
    name: 'Supervisor',
    description: 'Employee access + team management',
    capabilities: [
      'submit_requests', 
      'view_own_data', 
      'use_all_services',
      'approve_team_requests',
      'view_team_data',
      'manage_team_leave'
    ],
    managementDomains: ['team_management', 'approvals']
  },
  finance: {
    level: 3,
    name: 'Finance Manager',
    description: 'Employee access + financial management',
    capabilities: [
      'submit_requests', 
      'view_own_data', 
      'use_all_services',
      'manage_cash_requests',
      'manage_invoices',
      'process_payments',
      'financial_reporting'
    ],
    managementDomains: ['cash_requests', 'invoices', 'payments', 'suppliers']
  },
  hr: {
    level: 3,
    name: 'HR Manager',
    description: 'Employee access + HR management',
    capabilities: [
      'submit_requests', 
      'view_own_data', 
      'use_all_services',
      'manage_incidents',
      'manage_suggestions',
      'manage_leave_policies',
      'employee_welfare',
      'policy_management'
    ],
    managementDomains: ['incident_reports', 'suggestions', 'sick_leave', 'employee_welfare']
  },
  it: {
    level: 3,
    name: 'IT Manager',
    description: 'Employee access + IT infrastructure management',
    capabilities: [
      'submit_requests', 
      'view_own_data', 
      'use_all_services',
      'manage_it_requests',
      'asset_management',
      'system_monitoring',
      'user_account_management'
    ],
    managementDomains: ['it_support', 'asset_management', 'system_monitoring']
  },
  admin: {
    level: 4,
    name: 'System Administrator',
    description: 'Full system access and management',
    capabilities: [
      'submit_requests', 
      'view_own_data', 
      'use_all_services',
      'manage_all_modules',
      'system_configuration',
      'user_management',
      'advanced_analytics',
      'system_settings'
    ],
    managementDomains: ['all']
  }
};

export const MODULE_ACCESS_MATRIX = {
  'pettycash': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['finance', 'admin'],
    approvalAccess: ['supervisor', 'finance', 'admin']
  },
  'invoices': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['finance', 'admin'],
    approvalAccess: ['supervisor', 'finance', 'admin']
  },
  'incident-reports': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['hr', 'admin'],
    approvalAccess: ['supervisor', 'hr', 'admin']
  },
  'it-support': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['it', 'admin'],
    approvalAccess: ['it', 'admin']
  },
  'suggestions': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['hr', 'admin'],
    approvalAccess: ['hr', 'admin']
  },
  'sick-leave': {
    baseAccess: ['employee', 'supervisor', 'finance', 'hr', 'it', 'admin'],
    managementAccess: ['hr', 'supervisor', 'admin'],
    approvalAccess: ['supervisor', 'hr', 'admin']
  }
};

/**
 * Check if user has base access to a module
 */
export const hasBaseAccess = (userRole, moduleName) => {
  const moduleConfig = MODULE_ACCESS_MATRIX[moduleName];
  return moduleConfig?.baseAccess.includes(userRole) || false;
};

/**
 * Check if user has management access to a module
 */
export const hasManagementAccess = (userRole, moduleName) => {
  const moduleConfig = MODULE_ACCESS_MATRIX[moduleName];
  return moduleConfig?.managementAccess.includes(userRole) || false;
};

/**
 * Check if user has approval access to a module
 */
export const hasApprovalAccess = (userRole, moduleName) => {
  const moduleConfig = MODULE_ACCESS_MATRIX[moduleName];
  return moduleConfig?.approvalAccess.includes(userRole) || false;
};

/**
 * Get user's access level for a specific module
 */
export const getUserAccessLevel = (userRole, moduleName) => {
  if (hasManagementAccess(userRole, moduleName)) {
    return 'management';
  }
  if (hasApprovalAccess(userRole, moduleName)) {
    return 'approval';
  }
  if (hasBaseAccess(userRole, moduleName)) {
    return 'basic';
  }
  return 'none';
};

/**
 * Get all modules where user has management access
 */
export const getUserManagedModules = (userRole) => {
  return Object.keys(MODULE_ACCESS_MATRIX).filter(module => 
    hasManagementAccess(userRole, module)
  );
};

/**
 * Get role information
 */
export const getRoleInfo = (userRole) => {
  return ROLE_HIERARCHY[userRole] || ROLE_HIERARCHY.employee;
};

/**
 * Route access helper - determines if user should have access to specific routes
 */
export const getRouteAccess = (userRole, routePath) => {
  const roleInfo = getRoleInfo(userRole);
  
  // Admin has access to everything
  if (userRole === 'admin') {
    return { hasAccess: true, accessLevel: 'full' };
  }
  
  // Extract module from route
  const pathParts = routePath.split('/');
  const moduleOrRole = pathParts[1]; // e.g., 'employee', 'finance', 'hr'
  const moduleName = pathParts[2]; // e.g., 'cash-requests', 'invoices'
  
  // Employee routes - everyone has access
  if (moduleOrRole === 'employee') {
    return { hasAccess: true, accessLevel: 'basic' };
  }
  
  // Role-specific management routes
  if (moduleOrRole === userRole) {
    return { hasAccess: true, accessLevel: 'management' };
  }
  
  // Cross-role access based on hierarchy
  const targetRoleLevel = ROLE_HIERARCHY[moduleOrRole]?.level || 0;
  const userLevel = roleInfo.level;
  
  // Higher level roles can access lower level routes
  if (userLevel > targetRoleLevel) {
    return { hasAccess: true, accessLevel: 'elevated' };
  }
  
  return { hasAccess: false, accessLevel: 'none' };
};

/**
 * Enhanced Protected Route Component
 */
export const EnhancedProtectedRoute = ({ children, requiredRoles = [], requiredLevel = 0, moduleName = null }) => {
const Navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role;
  const roleInfo = getRoleInfo(userRole);
  
  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Check specific role requirements
  if (requiredRoles.length > 0 && !requiredRoles.includes(userRole)) {
    // Admin always has access unless explicitly restricted
    if (userRole !== 'admin' || requiredRoles.includes('admin-restricted')) {
      return <Navigate to="/dashboard" replace />;
    }
  }
  
  // Check level requirements
  if (requiredLevel > 0 && roleInfo.level < requiredLevel) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Check module-specific access
  if (moduleName && !hasBaseAccess(userRole, moduleName)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

/**
 * Access Control Hook - for use in components
 */
export const useAccessControl = () => {
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role || 'employee';
  const roleInfo = getRoleInfo(userRole);
  
  return {
    userRole,
    roleInfo,
    hasBaseAccess: (moduleName) => hasBaseAccess(userRole, moduleName),
    hasManagementAccess: (moduleName) => hasManagementAccess(userRole, moduleName),
    hasApprovalAccess: (moduleName) => hasApprovalAccess(userRole, moduleName),
    getUserAccessLevel: (moduleName) => getUserAccessLevel(userRole, moduleName),
    getManagedModules: () => getUserManagedModules(userRole),
    canAccessRoute: (routePath) => getRouteAccess(userRole, routePath),
    isAdmin: userRole === 'admin',
    isManager: roleInfo.level >= 3,
    isSupervisor: roleInfo.level >= 2
  };
};

/**
 * Role-based component renderer
 */
export const RoleBasedComponent = ({ 
  role, 
  roles = [], 
  minLevel = 0, 
  moduleName = null, 
  accessType = 'basic', 
  children, 
  fallback = null 
}) => {
  const { userRole, roleInfo, hasBaseAccess, hasManagementAccess, hasApprovalAccess } = useAccessControl();
  
  let hasAccess = false;
  
  // Check specific role
  if (role && userRole === role) {
    hasAccess = true;
  }
  
  // Check role list
  if (roles.length > 0 && roles.includes(userRole)) {
    hasAccess = true;
  }
  
  // Check minimum level
  if (minLevel > 0 && roleInfo.level >= minLevel) {
    hasAccess = true;
  }
  
  // Check module access
  if (moduleName) {
    switch (accessType) {
      case 'management':
        hasAccess = hasManagementAccess(moduleName);
        break;
      case 'approval':
        hasAccess = hasApprovalAccess(moduleName);
        break;
      case 'basic':
      default:
        hasAccess = hasBaseAccess(moduleName);
        break;
    }
  }
  
  // Admin override (unless explicitly restricted)
  if (userRole === 'admin' && !roles.includes('admin-restricted')) {
    hasAccess = true;
  }
  
  return hasAccess ? children : fallback;
};

/**
 * Generate navigation items based on user role
 */
export const generateNavigationItems = (userRole) => {
  const roleInfo = getRoleInfo(userRole);
  const managedModules = getUserManagedModules(userRole);
  
  const navigationItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: 'DashboardOutlined',
      accessLevel: 'all'
    }
  ];
  
  // Employee Services - Available to all
  navigationItems.push({
    key: 'employee-services',
    label: 'Employee Services',
    icon: 'UserOutlined',
    children: [
      {
        key: 'my-requests',
        label: 'My Cash Requests',
        path: '/employee/cash-requests',
        icon: 'DollarOutlined'
      },
      {
        key: 'my-invoices',
        label: 'My Invoices',
        path: '/employee/invoices',
        icon: 'FileTextOutlined'
      },
      {
        key: 'incident-reports',
        label: 'Incident Reports',
        path: '/employee/incident-reports',
        icon: 'ExclamationCircleOutlined'
      },
      {
        key: 'it-support',
        label: 'IT Support',
        path: '/employee/it-support',
        icon: 'LaptopOutlined'
      },
      {
        key: 'suggestions',
        label: 'Suggestions',
        path: '/employee/suggestions',
        icon: 'BulbOutlined'
      },
      {
        key: 'sick-leave',
        label: 'Sick Leave',
        path: '/employee/sick-leave',
        icon: 'MedicineBoxOutlined'
      }
    ]
  });
  
  // Management Sections - Based on role
  if (roleInfo.level >= 2) {
    const managementItems = [];
    
    // Supervisor Management
    if (userRole === 'supervisor' || userRole === 'admin') {
      managementItems.push({
        key: 'team-management',
        label: 'Team Management',
        path: '/supervisor/dashboard',
        icon: 'TeamOutlined',
        children: [
          {
            key: 'team-approvals',
            label: 'Team Approvals',
            path: '/supervisor/cash-approvals',
            icon: 'CheckCircleOutlined'
          },
          {
            key: 'team-leave',
            label: 'Team Leave',
            path: '/supervisor/sick-leave',
            icon: 'CalendarOutlined'
          }
        ]
      });
    }
    
    // Finance Management
    if (hasManagementAccess(userRole, 'pettycash') || hasManagementAccess(userRole, 'invoices')) {
      managementItems.push({
        key: 'finance-management',
        label: 'Finance Management',
        path: '/finance/dashboard',
        icon: 'BankOutlined',
        children: [
          {
            key: 'cash-management',
            label: 'Cash Management',
            path: '/finance/cash-approvals',
            icon: 'DollarOutlined'
          },
          {
            key: 'invoice-management',
            label: 'Invoice Management',
            path: '/finance/invoice-management',
            icon: 'FileTextOutlined'
          },
          {
            key: 'supplier-management',
            label: 'Supplier Management',
            path: '/finance/suppliers',
            icon: 'ShopOutlined'
          }
        ]
      });
    }
    
    // HR Management
    if (hasManagementAccess(userRole, 'incident-reports') || 
        hasManagementAccess(userRole, 'suggestions') || 
        hasManagementAccess(userRole, 'sick-leave')) {
      managementItems.push({
        key: 'hr-management',
        label: 'HR Management',
        path: '/hr/dashboard',
        icon: 'SafetyCertificateOutlined',
        children: [
          {
            key: 'incident-management',
            label: 'Incident Management',
            path: '/hr/incident-reports',
            icon: 'ExclamationCircleOutlined'
          },
          {
            key: 'suggestion-management',
            label: 'Suggestion Management',
            path: '/hr/suggestions',
            icon: 'BulbOutlined'
          },
          {
            key: 'leave-management',
            label: 'Leave Management',
            path: '/hr/sick-leave',
            icon: 'MedicineBoxOutlined'
          },
          {
            key: 'employee-welfare',
            label: 'Employee Welfare',
            path: '/hr/employee-welfare',
            icon: 'HeartOutlined'
          }
        ]
      });
    }
    
    // IT Management
    if (hasManagementAccess(userRole, 'it-support')) {
      managementItems.push({
        key: 'it-management',
        label: 'IT Management',
        path: '/it/dashboard',
        icon: 'ToolOutlined',
        children: [
          {
            key: 'support-requests',
            label: 'Support Requests',
            path: '/it/support-requests',
            icon: 'CustomerServiceOutlined'
          },
          {
            key: 'asset-management',
            label: 'Asset Management',
            path: '/it/asset-management',
            icon: 'LaptopOutlined'
          },
          {
            key: 'system-monitoring',
            label: 'System Monitoring',
            path: '/it/system-monitoring',
            icon: 'MonitorOutlined'
          }
        ]
      });
    }
    
    if (managementItems.length > 0) {
      navigationItems.push(...managementItems);
    }
  }
  
  // Admin Only Sections
  if (userRole === 'admin') {
    navigationItems.push({
      key: 'system-administration',
      label: 'System Administration',
      icon: 'SettingOutlined',
      children: [
        {
          key: 'user-management',
          label: 'User Management',
          path: '/admin/user-management',
          icon: 'UserOutlined'
        },
        {
          key: 'system-analytics',
          label: 'System Analytics',
          path: '/admin/analytics',
          icon: 'BarChartOutlined'
        },
        {
          key: 'system-settings',
          label: 'System Settings',
          path: '/admin/system-settings',
          icon: 'SettingOutlined'
        }
      ]
    });
  }
  
  return navigationItems;
};

/**
 * Access Summary Component - Shows user's access overview
 */
export const AccessSummary = ({ user }) => {
  const roleInfo = getRoleInfo(user?.role);
  const managedModules = getUserManagedModules(user?.role);
  
  return (
    <Card title="Access Summary" style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Text strong>Role: </Text>
          <Tag color="blue">{roleInfo.name}</Tag>
          <Tag color="green">Level {roleInfo.level}</Tag>
        </Col>
        <Col span={24}>
          <Text strong>Description: </Text>
          <Text type="secondary">{roleInfo.description}</Text>
        </Col>
        {managedModules.length > 0 && (
          <Col span={24}>
            <Text strong>Management Access: </Text>
            {managedModules.map(module => (
              <Tag key={module} color="gold">{module.replace('-', ' ')}</Tag>
            ))}
          </Col>
        )}
        <Col span={24}>
          <Text strong>Capabilities: </Text>
          <div style={{ marginTop: 8 }}>
            {roleInfo.capabilities?.map(capability => (
              <Tag key={capability} style={{ marginBottom: 4 }}>
                {capability.replace('_', ' ')}
              </Tag>
            ))}
          </div>
        </Col>
      </Row>
    </Card>
  );
};

