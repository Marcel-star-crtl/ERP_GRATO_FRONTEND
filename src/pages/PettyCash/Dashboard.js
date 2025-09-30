import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Button,
  Row,
  Col,
  Card,
  Divider,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  message,
  Spin,
  Alert,
  App
} from 'antd';
import {
  HomeOutlined,
  SettingOutlined,
  LogoutOutlined,
  FileTextOutlined,
  MoneyCollectOutlined,
  UserOutlined,
  FundOutlined,
  PrinterOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  createTransaction,
  fetchDashboardStats,
  fetchCompanySettings,
  clearError
} from '../../features/pettyCash/pettyCashSlice';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const PCDashboard = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [currentForm, setCurrentForm] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const {
    dashboardStats,
    companySettings,
    loading,
    error,
    saving
  } = useSelector((state) => state.pettyCash);

  // Check authentication and token validity
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    // Verify token structure
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length !== 3) {
        throw new Error('Invalid token format');
      }

      const payload = JSON.parse(atob(tokenParts[1]));
      if (!payload.exp) {
        throw new Error('Token missing expiration');
      }

      // Check if token is expired
      const currentTime = Date.now() / 1000;
      if (payload.exp < currentTime) {
        throw new Error('Token expired');
      }

      setAuthChecked(true);
      // Fetch company settings first, then dashboard stats
      const fetchData = async () => {
        const companySettingsResult = await dispatch(fetchCompanySettings());
        if (companySettingsResult.meta.requestStatus === 'fulfilled') {
          dispatch(fetchDashboardStats());
        }
      };
      fetchData();

    } catch (err) {
      console.error('Token validation error:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (error) {
      console.error('Dashboard page error:', error);

      // Handle specific error cases for company settings or authentication
      if (error.toLowerCase().includes('company settings not found') ||
          error.toLowerCase().includes('404') ||
          error.toLowerCase().includes('company')) {
        message.warning('Company settings must be configured first.');
      } else if (error.toLowerCase().includes('unauthorized') ||
                 error.toLowerCase().includes('token')) {
        message.error('Authentication error. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        message.error(`Error: ${error}`);
      }
    }
  }, [error, navigate]);

  const showForm = (formType) => {
    setCurrentForm(formType);
    setVisible(true);
  };

  const handleCancel = () => {
    setVisible(false);
    form.resetFields();
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await dispatch(createTransaction({
        ...values,
        type: currentForm,
        date: values.date.format('YYYY-MM-DD')
      })).unwrap();

      message.success(`${getFormTitle()} submitted successfully`);
      setVisible(false);
      form.resetFields();
      // No need to dispatch fetchDashboardStats here, as it's already done in the createTransaction thunk
    } catch (err) {
      console.error('Failed to submit transaction:', err);
      if (!err.response) {
        message.error('Network error - please check your connection');
      } else {
        message.error(`Submission failed: ${err.message || 'Unknown error'}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleGoToSettings = () => {
    navigate('/account-settings');
  };

  // Helper function for rendering forms
  const renderForm = () => {
    switch(currentForm) {
      case 'bill':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="Bill Name"
              name="billName"
              rules={[{ required: true, message: 'Please enter bill name' }]}
            >
              <Input placeholder="e.g. Office Supplies" />
            </Form.Item>

            <Form.Item
              label="Bill No"
              name="billNo"
            >
              <Input placeholder="Enter Bill no." />
            </Form.Item>

            <Form.Item
              label="Payee"
              name="payee"
              rules={[{ required: true, message: 'Please enter payee' }]}
            >
              <Input placeholder="Amount collected by" />
            </Form.Item>

            <Form.Item
              label="Allocation"
              name="allocation"
              rules={[{ required: true, message: 'Please select allocation' }]}
            >
              <Select placeholder="Expense AC">
                <Option value="office">Office Supplies</Option>
                <Option value="travel">Travel Expenses</Option>
                <Option value="utilities">Utilities</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="Enter Amount" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      case 'make-cheque':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="P.V / Cheque No"
              name="chequeNo"
              rules={[{ required: true, message: 'Please enter P.V/Cheque No' }]}
            >
              <Input placeholder="Enter P.V No" />
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="Enter Amount" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      case 'fund-in':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="Source of the fund"
              name="source"
              rules={[{ required: true, message: 'Please select source' }]}
            >
              <Select placeholder="Select source">
                <Option value="managed">Managed</Option>
                <Option value="bank">Bank</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="Enter Amount" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      case 'cash-sales':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="R.V No"
              name="rvNo"
              rules={[{ required: true, message: 'Please enter R.V No' }]}
            >
              <Input placeholder="Enter R.V No" />
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="Enter Amount" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      case 'advance':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="Emp.Name"
              name="empName"
              rules={[{ required: true, message: 'Please enter employee name' }]}
            >
              <Input placeholder="e.g. John" />
            </Form.Item>

            <Form.Item
              label="Emp.Code"
              name="empCode"
              rules={[{ required: true, message: 'Please enter employee code' }]}
            >
              <Input placeholder="e.g. E303" />
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="e.g. 5000" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      case 'adv-salary':
        return (
          <>
            <Form.Item
              label="Date"
              name="date"
              rules={[{ required: true, message: 'Please select date' }]}
            >
              <DatePicker style={{ width: '100%' }} format="MM/DD/YYYY" />
            </Form.Item>

            <Form.Item
              label="Emp Name"
              name="empName"
              rules={[{ required: true, message: 'Please enter employee name' }]}
            >
              <Input placeholder="e.g. Anotony" />
            </Form.Item>

            <Form.Item
              label="Emp Code"
              name="empCode"
              rules={[{ required: true, message: 'Please enter employee code' }]}
            >
              <Input placeholder="e.g. E3598" />
            </Form.Item>

            <Form.Item
              label="Amount"
              name="amount"
              rules={[{
                required: true,
                message: 'Please enter amount'
              }, {
                pattern: new RegExp(/^[0-9]+(\.[0-9]{1,2})?$/),
                message: 'Please enter a valid amount (e.g., 100 or 100.00)'
              }]}
            >
              <Input type="number" placeholder="e.g. 2000" step="0.01" />
            </Form.Item>

            <Form.Item
              label="Comment"
              name="comment"
            >
              <TextArea rows={4} />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  const getFormTitle = () => {
    const titles = {
      'bill': 'BILL',
      'make-cheque': 'MAKE CHEQUE',
      'fund-in': 'OTHER FUND-IN',
      'cash-sales': 'CASH SALES',
      'advance': 'ADVANCE',
      'adv-salary': 'ADV.SALARY'
    };
    return titles[currentForm] || currentForm.toUpperCase();
  };

  // If authentication is not yet checked, show a spin loader.
  if (!authChecked) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }} />;
  }

  // Display specific error message and button if company settings are not found
  if (error && error.toLowerCase().includes('company settings not found') && !companySettings) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Alert
          message="Setup Required"
          description="Company settings are not configured. Please go to Account Settings to set up your company's opening balance and details."
          type="warning"
          showIcon
          style={{ marginBottom: 24, maxWidth: 600, margin: 'auto' }}
        />
        <Button
          type="primary"
          icon={<SettingOutlined />}
          onClick={handleGoToSettings}
          size="large"
        >
          Go to Company Settings
        </Button>
      </div>
    );
  }

  // Show loading while fetching dashboard stats (after auth and company settings are checked)
  if (loading && !dashboardStats) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }} />;
  }

  // Render the dashboard content
  return (
    <App>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{
          background: '#fff',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 4px rgba(0, 21, 41, 0.08)',
          height: '64px',
          lineHeight: '64px'
        }}>
          <Title level={4} style={{ margin: 0 }}>
            <HomeOutlined style={{ marginRight: 8 }} />
            Pettycash Grato
          </Title>

          <div>
            {/* Navigating to account settings */}
            <Button
              type="text"
              icon={<SettingOutlined />}
              onClick={handleGoToSettings}
              title="Account Settings"
            />
            <Button
              type="text"
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              title="Logout"
            />
            <Text strong style={{ marginLeft: 8 }}>
              <UserOutlined style={{ marginRight: 4 }} />
              Admin
            </Text>
          </div>
        </Header>

        <Content style={{ padding: '24px' }}>
          {/* Display general errors */}
          {error && !error.toLowerCase().includes('company settings not found') && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: 24 }}
              onClose={() => dispatch(clearError())}
            />
          )}

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<FileTextOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('bill')}
                disabled={!companySettings}
              >
                BILLS
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<MoneyCollectOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('advance')}
                disabled={!companySettings}
              >
                ADVANCE
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<UserOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('adv-salary')}
                disabled={!companySettings}
              >
                STAFF ADV.
              </Button>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<MoneyCollectOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('cash-sales')}
                disabled={!companySettings}
              >
                CASH SALES
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<FundOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('fund-in')}
                disabled={!companySettings}
              >
                FUND-IN
              </Button>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Button
                type="primary"
                block
                size="large"
                icon={<PrinterOutlined />}
                style={{ height: '80px', fontSize: '16px' }}
                onClick={() => showForm('make-cheque')}
                disabled={!companySettings}
              >
                MAKE CHEQUE
              </Button>
            </Col>
          </Row>

          <Card
            title="DISPLAY POSITION"
            bordered={false}
            headStyle={{
              fontSize: '18px',
              fontWeight: 'bold',
              padding: '0 0 16px 0'
            }}
          >
            <Row gutter={24}>
              <Col xs={24} sm={12}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: '16px' }}>CURRENT BALANCE</Text>
                  <Title level={2} style={{ margin: '8px 0' }}>
                    {dashboardStats?.currentBalance?.toFixed(2) || '0.00'}
                  </Title>
                </div>
              </Col>
              <Col xs={24} sm={12}>
                <div style={{ textAlign: 'center' }}>
                  <Text strong style={{ fontSize: '16px' }}>LAST TRANSACTION</Text>
                  <Title level={4} style={{ margin: '8px 0' }}>
                    {dashboardStats?.lastTransaction?.amount?.toFixed(2) || '0.00'}
                  </Title>
                  <Text type="secondary">
                    {/* Prioritize 'comment', then 'billName', then a generic description */}
                    {dashboardStats?.lastTransaction?.comment ||
                     dashboardStats?.lastTransaction?.billName ||
                     'No transactions yet'}
                  </Text>
                </div>
              </Col>
            </Row>
            <Divider />
            <Button
              type="link"
              icon={<PrinterOutlined />}
              style={{ float: 'right' }}
              onClick={() => navigate('/position')}
              disabled={!companySettings}
            >
              Print Position
            </Button>
          </Card>

          <Modal
            title={getFormTitle()}
            open={visible}
            onOk={handleSubmit}
            onCancel={handleCancel}
            width={700}
            okText="Submit"
            cancelText="Cancel"
            confirmLoading={saving}
            destroyOnClose
          >
            <Form
              form={form}
              layout="vertical"
              name={`${currentForm}_form`}
            >
              {renderForm()}
            </Form>
          </Modal>
        </Content>
      </Layout>
    </App>
  );
};

export default PCDashboard;





