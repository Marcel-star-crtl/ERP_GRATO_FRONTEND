import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/auth/authSlice';
import api from '../../services/api';

const { Title, Link: AntLink } = Typography;

const SupplierLoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { message } = App.useApp();

  const handleLogin = async (values) => {
    try {
      setLoading(true);
     
      const response = await api.post('/api/suppliers/login', {
        email: values.email,
        password: values.password
      });

      if (response.data.success) {
        const { token, supplier } = response.data;
       
        // Store token
        localStorage.setItem('token', token);
       
        // Update Redux store
        dispatch(loginSuccess({
          user: {
            id: supplier.id,
            email: supplier.email,
            fullName: supplier.fullName,
            role: 'supplier',
            companyName: supplier.companyName,
            supplierType: supplier.supplierType,
            accountStatus: supplier.accountStatus
          },
          token
        }));

        message.success(`Welcome back, ${supplier.companyName}!`);
        navigate('/supplier/dashboard');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Supplier login error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3}>Login to Supplier Portal</Title>
          </div>
         
          <Form
            form={form}
            name="supplier-login"
            initialValues={{ remember: true }}
            onFinish={handleLogin}
            layout="vertical"
          >
            <Form.Item
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Please input your email or phone!'
                }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Email or Phone"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                {
                  required: true,
                  message: 'Please input your password!'
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                type="password"
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
              >
                Log in
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

const SupplierLogin = () => {
  return (
    <App>
      <SupplierLoginForm />
    </App>
  );
};

export default SupplierLogin;



