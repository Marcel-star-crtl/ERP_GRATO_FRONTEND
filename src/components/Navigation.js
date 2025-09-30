import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Badge, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  DollarOutlined,
  FileTextOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  ShopOutlined,
  TeamOutlined,
  SafetyOutlined,
  LaptopOutlined,
  BulbOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  ToolOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  BellOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const Navigation = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Generate menu items based on user role
  const getMenuItems = (role) => {
    const menuConfig = {
      employee: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'cash-requests',
          icon: <DollarOutlined />,
          label: 'Cash Requests',
          path: '/employee/cash-request/new'
        },
        {
          key: 'invoices',
          icon: <FileTextOutlined />,
          label: 'Invoice Uploads',
          path: '/employee/invoices'
        },
        {
          key: 'incident-reports',
          icon: <SafetyOutlined />,
          label: 'Incident Reports',
          path: '/employee/incident-reports'
        },
        {
          key: 'it-support',
          icon: <LaptopOutlined />,
          label: 'IT Support',
          path: '/employee/it-support'
        },
        {
          key: 'suggestions',
          icon: <BulbOutlined />,
          label: 'Suggestions',
          path: '/employee/suggestions'
        },
        {
          key: 'sick-leave',
          icon: <MedicineBoxOutlined />,
          label: 'Sick Leave',
          path: '/employee/sick-leave'
        }
      ],
      supervisor: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'cash-approvals',
          icon: <DollarOutlined />,
          label: 'Cash Approvals',
          path: '/supervisor/cash-approvals',
          badge: 3
        },
        {
          key: 'invoice-approvals',
          icon: <FileTextOutlined />,
          label: 'Invoice Approvals',
          path: '/supervisor/invoice-approvals',
          badge: 5
        },
        {
          key: 'incident-management',
          icon: <SafetyOutlined />,
          label: 'Incident Management',
          path: '/supervisor/incident-reports',
          badge: 2
        },
        {
          key: 'sick-leave-approvals',
          icon: <MedicineBoxOutlined />,
          label: 'Sick Leave Approvals',
          path: '/supervisor/sick-leave',
          badge: 1
        }
      ],
      finance: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'petty-cash',
          icon: <DollarOutlined />,
          label: 'Petty Cash',
          path: '/pettycash/dashboard'
        },
        {
          key: 'cash-approvals',
          icon: <CheckCircleOutlined />,
          label: 'Cash Approvals',
          path: '/finance/cash-approvals',
          badge: 8
        },
        {
          key: 'invoice-management',
          icon: <FileTextOutlined />,
          label: 'Invoice Management',
          path: '/finance/invoice-management',
          badge: 12
        },
        {
          key: 'analytics',
          icon: <BarChartOutlined />,
          label: 'Financial Analytics',
          path: '/finance/invoice-analytics'
        }
      ],
      hr: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'incident-management',
          icon: <SafetyOutlined />,
          label: 'Incident Management',
          path: '/hr/incident-reports',
          badge: 4
        },
        {
          key: 'suggestions',
          icon: <BulbOutlined />,
          label: 'Employee Suggestions',
          path: '/hr/suggestions',
          badge: 7
        },
        {
          key: 'sick-leave',
          icon: <MedicineBoxOutlined />,
          label: 'Sick Leave Management',
          path: '/hr/sick-leave',
          badge: 2
        },
        {
          key: 'employee-welfare',
          icon: <HeartOutlined />,
          label: 'Employee Welfare',
          path: '/hr/employee-welfare'
        }
      ],
      it: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'it-dashboard',
          icon: <LaptopOutlined />,
          label: 'IT Dashboard',
          path: '/it/dashboard'
        },
        {
          key: 'support-requests',
          icon: <LaptopOutlined />,
          label: 'Support Requests',
          path: '/it/support-requests',
          badge: 15
        },
        {
          key: 'inventory',
          icon: <ToolOutlined />,
          label: 'Inventory Management',
          path: '/it/inventory'
        }
      ],
      admin: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/dashboard'
        },
        {
          key: 'petty-cash',
          icon: <DollarOutlined />,
          label: 'Petty Cash Admin',
          path: '/pettycash/dashboard'
        },
        {
          key: 'suppliers',
          icon: <ShopOutlined />,
          label: 'Supplier Management',
          path: '/admin/suppliers',
          badge: 3
        },
        {
          key: 'analytics',
          icon: <BarChartOutlined />,
          label: 'System Analytics',
          path: '/admin/analytics'
        },
        {
          key: 'incidents',
          icon: <SafetyOutlined />,
          label: 'Incident Oversight',
          path: '/admin/incident-reports',
          badge: 6
        },
        {
          key: 'it-admin',
          icon: <LaptopOutlined />,
          label: 'IT Administration',
          path: '/admin/it-support',
          badge: 2
        },
        {
          key: 'settings',
          icon: <SettingOutlined />,
          label: 'System Settings',
          path: '/admin/system-settings'
        }
      ],
      supplier: [
        {
          key: 'dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          path: '/supplier/dashboard'
        },
        {
          key: 'portal',
          icon: <ShopOutlined />,
          label: 'Supplier Portal',
          path: '/supplier/portal'
        },
        {
          key: 'invoices',
          icon: <FileTextOutlined />,
          label: 'My Invoices',
          path: '/supplier/invoices',
          badge: 2
        },
        {
          key: 'profile',
          icon: <UserOutlined />,
          label: 'Company Profile',
          path: '/supplier/profile'
        }
      ]
    };

    return menuConfig[role] || [];
  };

  const menuItems = getMenuItems(user?.role).map(item => ({
    key: item.key,
    icon: item.badge ? (
      <Badge count={item.badge} size="small" offset={[10, 0]}>
        {item.icon}
      </Badge>
    ) : item.icon,
    label: item.label,
    onClick: () => navigate(item.path)
  }));

  // Get current selected key based on location
  const getCurrentKey = () => {
    const path = location.pathname;
    const menuConfig = getMenuItems(user?.role);
    const currentItem = menuConfig.find(item => 
      path.startsWith(item.path) || 
      (item.key === 'dashboard' && path === '/dashboard')
    );
    return currentItem?.key || 'dashboard';
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.role === 'supplier' ? 'Company Profile' : 'Profile',
      onClick: () => navigate(user?.role === 'supplier' ? '/supplier/profile' : '/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate(user?.role === 'supplier' ? '/supplier/settings' : '/settings')
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const getRoleDisplayName = (role) => {
    const roleNames = {
      employee: 'Employee',
      supervisor: 'Supervisor',
      finance: 'Finance Manager',
      hr: 'HR Manager',
      it: 'IT Administrator',
      admin: 'System Administrator',
      supplier: 'Supplier'
    };
    return roleNames[role] || role;
  };

  const getRoleColor = (role) => {
    const roleColors = {
      employee: '#52c41a',
      supervisor: '#1890ff',
      finance: '#722ed1',
      hr: '#fa8c16',
      it: '#13c2c2',
      admin: '#eb2f96',
      supplier: '#1890ff'
    };
    return roleColors[role] || '#595959';
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          boxShadow: '2px 0 6px rgba(0,21,41,.35)',
          zIndex: 100
        }}
      >
        {/* Logo/Brand */}
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
          background: 'linear-gradient(135deg, #1890ff, #722ed1)'
        }}>
          {!collapsed ? (
            <Space>
              <Avatar 
                size="small" 
                style={{ backgroundColor: 'white', color: '#1890ff' }}
                icon={user?.role === 'supplier' ? <ShopOutlined /> : <SettingOutlined />}
              />
              <Text strong style={{ color: 'white', fontSize: '16px' }}>
                {user?.role === 'supplier' ? 'Supplier' : 'Grato Eng'}
              </Text>
            </Space>
          ) : (
            <Avatar 
              style={{ backgroundColor: 'white', color: '#1890ff' }}
              icon={user?.role === 'supplier' ? <ShopOutlined /> : <SettingOutlined />}
            />
          )}
        </div>

        {/* Navigation Menu */}
        <Menu
          mode="inline"
          selectedKeys={[getCurrentKey()]}
          items={menuItems}
          style={{ borderRight: 0, paddingTop: '8px' }}
        />

        {/* User info at bottom when expanded */}
        {!collapsed && (
          <div style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '16px', 
            right: '16px',
            padding: '12px',
            background: '#fafafa',
            borderRadius: '8px',
            border: '1px solid #f0f0f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <Avatar 
                size="small" 
                style={{ backgroundColor: getRoleColor(user?.role) }}
                icon={user?.role === 'supplier' ? <ShopOutlined /> : <UserOutlined />}
              />
              <div style={{ marginLeft: '8px', flex: 1, minWidth: 0 }}>
                <Text 
                  strong 
                  style={{ 
                    fontSize: '12px', 
                    display: 'block',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {user?.companyName || user?.fullName}
                </Text>
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '11px',
                    display: 'block'
                  }}
                >
                  {getRoleDisplayName(user?.role)}
                </Text>
              </div>
            </div>
          </div>
        )}
      </Sider>

      <Layout>
        <Header style={{ 
          padding: '0 24px', 
          background: '#fff', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          {/* Collapse Button */}
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ fontSize: '16px', width: 64, height: 64 }}
          />

          {/* Header Title */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
              {user?.role === 'supplier' 
                ? 'Supplier Portal - Grato Engineering Services'
                : 'Grato Engineering Management System'
              }
            </Text>
          </div>

          {/* User Menu */}
          <Space>
            <Badge count={5} size="small">
              <Button 
                type="text" 
                icon={<BellOutlined />} 
                style={{ fontSize: '16px' }}
              />
            </Badge>
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  style={{ backgroundColor: getRoleColor(user?.role) }}
                  icon={user?.role === 'supplier' ? <ShopOutlined /> : <UserOutlined />}
                />
                <Text strong>{user?.companyName || user?.fullName}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ 
          margin: '0',
          minHeight: 280,
          background: '#f0f2f5'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default Navigation;