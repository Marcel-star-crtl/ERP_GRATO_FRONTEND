import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Typography, Card, Row, Col, App } from 'antd';
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
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3}>Login to Enterprise Management System</Title>
            <Typography.Text type="secondary">
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
                prefix={<MailOutlined />} 
                placeholder="Email or Phone" 
                size="large"
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
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block
                size="large"
                loading={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link onClick={() => navigate('/forgot-password')}>
                Forgot password?
              </Link>
              <span style={{ margin: '0 8px' }}>|</span>
              <Link onClick={() => navigate('/register')}>
                Register new account
              </Link>
            </div>

            {/* Role information */}
            <div style={{ 
              marginTop: 24, 
              padding: 16, 
              backgroundColor: '#f8f9fa', 
              borderRadius: 4,
              textAlign: 'center'
            }}>
              <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                All roles access the same unified dashboard with role-appropriate features
              </Typography.Text>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
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









// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Form, Input, Button, Typography, Card, Row, Col, message } from 'antd';
// import { LockOutlined, MailOutlined } from '@ant-design/icons';
// import { useDispatch } from 'react-redux';
// import { login } from '../../features/auth/authSlice';
// import api from '../../services/api';

// const { Title, Link } = Typography;

// const Login = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();
//   const dispatch = useDispatch();
//   const [messageApi, contextHolder] = message.useMessage();

//   const onFinish = async (values) => {
//     try {
//       setLoading(true);
//       const response = await api.post('/auth/login', values);
      
//       dispatch(login(response.data));
//       localStorage.setItem('token', response.data.token);
      
//       // Get user role from response
//       const userRole = response.data.user.role;
      
//       // Redirect based on role
//       let redirectPath = '/pettycash'; 
      
//       if (userRole === 'employee') {
//         redirectPath = '/employee/requests';
//       } else if (userRole === 'supervisor') {
//         redirectPath = '/supervisor/requests';
//       } else if (userRole === 'finance') {
//         redirectPath = '/finance/requests';
//       } else if (userRole === 'admin') {
//         redirectPath = '/pettycash';
//       }
      
//       navigate(redirectPath);
//       messageApi.success('Login successful!');
      
//     } catch (error) {
//       const errorMsg = error.response?.data?.message || 'Login failed';
//       messageApi.error(errorMsg);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
//       {contextHolder}
//       <Col xs={24} sm={20} md={16} lg={12} xl={8}>
//         <Card style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
//           <div style={{ textAlign: 'center', marginBottom: 24 }}>
//             <Title level={3}>Login to PettyCash System</Title>
//           </div>
          
//           <Form
//             form={form}
//             name="login"
//             initialValues={{ remember: true }}
//             onFinish={onFinish}
//             layout="vertical"
//           >
//             <Form.Item
//               name="email"
//               rules={[
//                 { 
//                   required: true, 
//                   message: 'Please input your email or phone!' 
//                 }
//               ]}
//             >
//               <Input 
//                 prefix={<MailOutlined />} 
//                 placeholder="Email or Phone" 
//               />
//             </Form.Item>

//             <Form.Item
//               name="password"
//               rules={[
//                 { 
//                   required: true, 
//                   message: 'Please input your password!' 
//                 }
//               ]}
//             >
//               <Input.Password
//                 prefix={<LockOutlined />}
//                 type="password"
//                 placeholder="Password"
//               />
//             </Form.Item>

//             <Form.Item>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 block
//                 loading={loading}
//               >
//                 Log in
//               </Button>
//             </Form.Item>

//             <div style={{ textAlign: 'center' }}>
//               <Link onClick={() => navigate('/forgot-password')}>
//                 Forgot password?
//               </Link>
//               <span style={{ margin: '0 8px' }}>|</span>
//               <Link onClick={() => navigate('/register')}>
//                 Register new account
//               </Link>
//             </div>
//           </Form>
//         </Card>
//       </Col>
//     </Row>
//   );
// };

// export default Login;