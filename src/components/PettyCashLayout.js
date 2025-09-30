import React from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import NavBar from './Navbar';

const { Content } = Layout;

const PettyCashLayout = () => (
  <Layout style={{ minHeight: '100vh' }}>
    <NavBar />
    <Content style={{ padding: '24px' }}>
      <Outlet />
    </Content>
  </Layout>
);

export default PettyCashLayout;

