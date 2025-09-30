import React from 'react';
import { Menu, Dropdown, Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import {
  HomeOutlined,
  SettingOutlined,
  HistoryOutlined,
  LogoutOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  UserOutlined,
  FundOutlined,
  PrinterOutlined,
  DashboardOutlined,
  MoneyCollectFilled
} from '@ant-design/icons';

const NavBar = () => {
  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
    window.location = '/login';
  };

  const historyMenu = (
    <Menu>
      <Menu.Item key="bills" icon={<FileTextOutlined />}>
        <Link to="/pettycash/requests?category=bills">Bills</Link>
      </Menu.Item>
      <Menu.Item key="advance" icon={<MoneyCollectOutlined />}>
        <Link to="/pettycash/requests?category=advance">Advance</Link>
      </Menu.Item>
      <Menu.Item key="staff-adv" icon={<UserOutlined />}>
        <Link to="/pettycash/requests?category=staff-adv">Staff Adv.</Link>
      </Menu.Item>
      <Menu.Item key="cash-sales" icon={<MoneyCollectOutlined />}>
        <Link to="/pettycash/requests?category=cash-sales">Cash Sales</Link>
      </Menu.Item>
      <Menu.Item key="fund-in" icon={<FundOutlined />}>
        <Link to="/pettycash/requests?category=fund-in">Fund-In</Link>
      </Menu.Item>
      <Menu.Item key="make-cheque" icon={<PrinterOutlined />}>
        <Link to="/pettycash/requests?category=make-cheque">Make Cheque</Link>
      </Menu.Item>
    </Menu>
  );

  return (
    <Menu mode="horizontal" theme="light" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <Menu.Item key="home" icon={<HomeOutlined />}>
        <Link to="/pettycash">Home</Link>
      </Menu.Item>

      <Menu.Item key="Request" icon={<UserOutlined />}>
        <Link to="/pettycash/cash-requests">Requests</Link>
      </Menu.Item>
      
      <Menu.Item key="display" icon={<DashboardOutlined />}>
        <Link to="/pettycash/display">Display</Link>
      </Menu.Item>
      
      <Menu.Item key="position" icon={<MoneyCollectFilled />}>
        <Link to="/pettycash/position">Position</Link>
      </Menu.Item>
      
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        <Link to="/pettycash/settings">Settings</Link>
      </Menu.Item>
      
      <Menu.Item key="history">
        <Dropdown overlay={historyMenu} placement="bottomLeft">
          <span>
            <HistoryOutlined style={{ marginRight: 4 }} />
            History
          </span>
        </Dropdown>
      </Menu.Item>
      
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} style={{ marginLeft: 'auto' }}>
        Logout
      </Menu.Item>
    </Menu>
  );
};

export default NavBar;







