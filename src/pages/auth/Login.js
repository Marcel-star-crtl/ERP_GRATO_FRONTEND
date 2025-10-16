import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, Row, Col, App, ConfigProvider } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useDispatch } from 'react-redux';
import { login } from '../../features/auth/authSlice';
import api from '../../services/api';

const { Title, Link } = Typography;

const LoginForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { message } = App.useApp();

  // Enhanced role-based redirect logic
  const getRedirectPath = (userRole) => {
    const redirectPaths = {
      'employee': '/dashboard', 
      'supervisor': '/dashboard', 
      'finance': '/dashboard', 
      'hr': '/dashboard',   
      'it': '/dashboard', 
      'admin': '/dashboard', 
      'supplier': '/supplier/dashboard' 
    };

    return redirectPaths[userRole] || '/dashboard';
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Use the api instance directly instead of dispatch
      const response = await api.post('/api/auth/login', values);

      // Dispatch the login action with the response data
      dispatch(login(response.data));
      localStorage.setItem('token', response.data.token);

      // Get user role from response
      const userRole = response.data.user.role;

      // Show success message first
      message.success(`Welcome back! Logging in as ${userRole}...`);

      // Get appropriate redirect path based on role
      const redirectPath = getRedirectPath(userRole);

      // Small delay to show success message before navigation
      setTimeout(() => {
        navigate(redirectPath, { replace: true });
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#dc3545',
          colorLink: '#1890ff',
          borderRadius: 6,
        },
      }}
    >
      <style>
        {`
          .login-submit-btn.ant-btn-primary,
          .login-submit-btn.ant-btn-primary:hover,
          .login-submit-btn.ant-btn-primary:focus,
          .login-submit-btn.ant-btn-primary:active,
          body .login-submit-btn.ant-btn-primary,
          body .ant-app .login-submit-btn.ant-btn-primary {
            background-color: #dc3545 !important;
            background: #dc3545 !important;
            border-color: #dc3545 !important;
            color: #ffffff !important;
          }
          
          .login-submit-btn.ant-btn-primary:hover,
          body .login-submit-btn.ant-btn-primary:hover {
            background-color: #c82333 !important;
            background: #c82333 !important;
            border-color: #c82333 !important;
          }
          
          .login-submit-btn.ant-btn-primary span {
            color: #ffffff !important;
          }
        `}
      </style>
      <Row justify="center" align="middle" style={{ 
        minHeight: '100vh', 
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8edf2 100%)'
      }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card style={{ 
            boxShadow: '0 8px 24px rgba(220, 53, 69, 0.12)',
            borderTop: '4px solid #dc3545'
          }}>
            {/* Company Logo */}
            <div style={{ 
              textAlign: 'center', 
              marginBottom: 32,
              paddingTop: 8,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <img 
                src="/assets/company-logo.jpg" 
                alt="Company Logo" 
                style={{ 
                  maxWidth: '110px',
                  height: 'auto',
                  marginBottom: 16,
                  display: 'block'
                }}
              />
            </div>

            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <Title level={3} style={{ 
                color: '#2c3e50',
                marginBottom: 8,
                fontWeight: 600
              }}>
                Login to Enterprise Management System
              </Title>
              <Typography.Text style={{ 
                color: '#7f8c8d',
                fontSize: '14px'
              }}>
                Access all services from one unified dashboard
              </Typography.Text>
            </div>

            <Form
              form={form}
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
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
                  prefix={<MailOutlined style={{ color: '#95a5a6' }} />} 
                  placeholder="Email or Phone" 
                  size="large"
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef'
                  }}
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
                  prefix={<LockOutlined style={{ color: '#95a5a6' }} />}
                  type="password"
                  placeholder="Password"
                  size="large"
                  style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e9ecef'
                  }}
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 16 }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  block
                  size="large"
                  loading={loading}
                  className="login-submit-btn"
                  style={{
                    height: 48,
                    fontSize: 16,
                    fontWeight: 500,
                    backgroundColor: '#dc3545 !important',
                    borderColor: '#dc3545 !important',
                    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.25)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#c82333';
                    e.currentTarget.style.borderColor = '#c82333';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#dc3545';
                    e.currentTarget.style.borderColor = '#dc3545';
                  }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form.Item>

              {/* <div style={{ textAlign: 'center', marginTop: 20 }}>
                <Link 
                  onClick={() => navigate('/forgot-password')}
                  style={{ color: '#1890ff' }}
                >
                  Forgot password?
                </Link>
                <span style={{ margin: '0 8px', color: '#d0d0d0' }}>|</span>
                <Link 
                  onClick={() => navigate('/register')}
                  style={{ color: '#1890ff' }}
                >
                  Register new account
                </Link>
              </div> */}

              {/* Role information */}
              <div style={{ 
                marginTop: 24, 
                padding: 16, 
                backgroundColor: '#fef5f6', 
                borderRadius: 6,
                textAlign: 'center',
                border: '1px solid #fce4e6'
              }}>
                {/* <Typography.Text style={{ 
                  fontSize: '12px',
                  color: '#7f8c8d'
                }}>
                  All roles access the same unified dashboard with role-appropriate features
                </Typography.Text> */}
              </div>
            </Form>
          </Card>
        </Col>
      </Row>
    </ConfigProvider>
  );
};

// Wrap with App component to provide context
const Login = () => {
  return (
    <App>
      <LoginForm />
    </App>
  );
};

export default Login;



