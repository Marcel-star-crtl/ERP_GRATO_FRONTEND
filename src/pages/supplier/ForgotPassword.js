import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Row, Col, App } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const { Title, Text } = Typography;

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/supplier/forgot-password', {
        email: values.email
      });

      if (response.data.success) {
        setEmailSent(true);
        message.success('Password reset link sent to your email');
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Title level={3}>Check Your Email</Title>
              <Text>We've sent a password reset link to your email address.</Text>
              <div style={{ marginTop: 20 }}>
                <Link to="/supplier/login">
                  <Button type="primary">Back to Login</Button>
                </Link>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Col xs={24} sm={20} md={16} lg={12} xl={8}>
        <Card>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={3}>Forgot Password</Title>
            <Text type="secondary">Enter your email to receive a password reset link</Text>
          </div>

          <Form form={form} onFinish={handleSubmit} layout="vertical">
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder="Email Address"
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
                Send Reset Link
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Link to="/supplier/login">Back to Login</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ForgotPassword;