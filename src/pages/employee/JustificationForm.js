import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Card,
  Typography,
  Descriptions,
  Divider,
  Alert,
  Spin,
  Space,
  Table,
  InputNumber,
  Select,
  Tag
} from 'antd';
import {
  UploadOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const JustificationForm = () => {
  const { requestId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [request, setRequest] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const [itemizedExpenses, setItemizedExpenses] = useState([]);
  const [itemizedTotal, setItemizedTotal] = useState(0);

  const navigate = useNavigate();

  const expenseTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'perdiem', label: 'Per Diem' },
    { value: 'bills', label: 'Bills' },
    { value: 'staff-transportation', label: 'Staff Transportation' },
    { value: 'toll-gates', label: 'Toll Gates' },
    { value: 'office-items', label: 'Office Items' },
    { value: 'meals', label: 'Meals' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch request details
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setFetching(true);
        setError(null);

        if (!requestId) {
          throw new Error('No request ID provided');
        }

        const response = await api.get(`/cash-requests/${requestId}`);

        if (response.data.success) {
          const requestData = response.data.data;
          setRequest(requestData);

          // Load existing justification if it exists
          if (requestData.justification) {
            form.setFieldsValue({
              details: requestData.justification.details
            });
            if (requestData.justification.itemizedBreakdown) {
              setItemizedExpenses(requestData.justification.itemizedBreakdown);
            }
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch request details');
        }
      } catch (error) {
        console.error('Error fetching request:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
        setError(errorMessage);
      } finally {
        setFetching(false);
      }
    };

    if (requestId) {
      fetchRequest();
    } else {
      setError('No request ID provided');
      setFetching(false);
    }
  }, [requestId, form]);

  // Auto-calculate balance when itemized expenses change
  useEffect(() => {
    const total = itemizedExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
    setItemizedTotal(total);
  }, [itemizedExpenses]);

  const handleGoBack = () => {
    navigate(`/employee/request/${requestId}`);
  };

  const addExpenseItem = () => {
    const newId = Date.now();
    setItemizedExpenses([
      ...itemizedExpenses,
      { id: newId, description: '', category: '', amount: 0 }
    ]);
  };

  const removeExpenseItem = (id) => {
    setItemizedExpenses(itemizedExpenses.filter(item => item.id !== id));
  };

  const updateExpenseItem = (id, field, value) => {
    setItemizedExpenses(
      itemizedExpenses.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '35%',
      render: (text, record) => (
        <Input
          placeholder="Enter description"
          value={record.description}
          onChange={(e) => updateExpenseItem(record.id, 'description', e.target.value)}
        />
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '30%',
      render: (text, record) => (
        <Select
          placeholder="Select category"
          value={record.category || undefined}
          onChange={(value) => updateExpenseItem(record.id, 'category', value)}
          style={{ width: '100%' }}
        >
          {expenseTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      width: '25%',
      render: (text, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1}
          value={record.amount}
          onChange={(value) => updateExpenseItem(record.id, 'amount', value || 0)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeExpenseItem(record.id)}
        />
      )
    }
  ];

  const uploadProps = {
    fileList,
    onChange: ({ fileList }) => setFileList(fileList),
    beforeUpload: () => false,
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
    maxCount: 10,
  };

  const handleSubmit = async (values) => {
    try {
      // Validate itemized expenses
      if (itemizedExpenses.length === 0) {
        message.error('Please add at least one expense item');
        return;
      }

      const invalidItems = itemizedExpenses.filter(
        item => !item.description || !item.category || !item.amount
      );
      if (invalidItems.length > 0) {
        message.error('Please fill in all fields for each expense item');
        return;
      }

      setLoading(true);

      const disbursedAmount = request.totalDisbursed || request.disbursementDetails?.amount || 0;
      const balanceReturned = disbursedAmount - itemizedTotal;

      const formData = new FormData();
      formData.append('amountSpent', itemizedTotal);
      formData.append('balanceReturned', balanceReturned);
      formData.append('details', values.details);
      formData.append('itemizedBreakdown', JSON.stringify(itemizedExpenses));

      // Add files to form data
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });

      const response = await api.post(
        `/cash-requests/${requestId}/justification`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      if (response.data.success) {
        message.success('Justification submitted successfully!');
        navigate(`/employee/request/${requestId}`);
      } else {
        throw new Error(response.data.message || 'Failed to submit justification');
      }
    } catch (error) {
      console.error('Justification submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit justification';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading justification form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Justification Form"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleGoBack}>Back to Request Details</Button>
              <Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Request Not Found"
          description="The request you are trying to access does not exist."
          type="error"
          showIcon
          action={<Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>}
        />
      </div>
    );
  }

  const disbursedAmount = request.totalDisbursed || request.disbursementDetails?.amount || 0;
  const balanceReturned = disbursedAmount - itemizedTotal;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>Cash Justification Form</Title>
          <Text type="secondary">REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}</Text>
        </div>

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Request ID">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Amount Disbursed">
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              XAF {Number(disbursedAmount || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Total Spent">
            <Text strong>XAF {itemizedTotal.toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Balance Returned / Amount Owed (XAF)">
            <Text strong style={{ color: balanceReturned >= 0 ? '#52c41a' : '#ff4d4f', fontSize: '16px' }}>
              {balanceReturned >= 0 ? '+' : '-'} XAF {Math.abs(balanceReturned).toLocaleString()}
            </Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Itemized Expenses Section - COMPULSORY */}
          <Card
            title={
              <Space>
                <FileTextOutlined />
                <Text strong>Itemized Expenses</Text>
                <Tag color="red">Required</Tag>
              </Space>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={addExpenseItem}
                size="small"
              >
                Add Expense
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            <Table
              columns={expenseColumns}
              dataSource={itemizedExpenses}
              rowKey="id"
              pagination={false}
              size="middle"
            />
            {itemizedExpenses.length === 0 && (
              <Alert
                message="No expenses added"
                description="Click 'Add Expense' button above to start adding itemized expenses."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
            <div style={{ marginTop: '16px', textAlign: 'right', borderTop: '1px solid #f0f0f0', paddingTop: '16px' }}>
              <Text strong>Total Amount Spent: </Text>
              <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
                XAF {itemizedTotal.toLocaleString()}
              </Text>
            </div>
          </Card>

          <Form.Item
            name="details"
            label="Detailed Explanation of Spending"
            rules={[
              { required: true, message: 'Please provide detailed spending explanation' },
              { min: 20, message: 'Details must be at least 20 characters long' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Provide a detailed explanation of how the funds were used, including dates, vendors, items purchased, etc..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label="Supporting Documents (Optional)"
            extra="Upload receipts, invoices, or other supporting documents (JPG, PNG, PDF, DOC, DOCX, XLS, XLSX - max 10 files, 10MB each)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Files ({fileList.length}/10)</Button>
            </Upload>
            {fileList.length > 0 && (
              <Alert
                message={`${fileList.length} file(s) ready to upload`}
                type="success"
                showIcon
                style={{ marginTop: '8px' }}
              />
            )}
          </Form.Item>

          <Form.Item>
            <Space size="middle">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
              >
                Back to Request Details
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<DollarOutlined />}
              >
                Submit Justification
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default JustificationForm;