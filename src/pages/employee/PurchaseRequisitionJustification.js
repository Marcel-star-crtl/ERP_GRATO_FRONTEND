import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  InputNumber,
  Table,
  Upload,
  message,
  Alert,
  Descriptions,
  Divider,
  Row,
  Col,
  Statistic,
  Modal
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  InboxOutlined,
  SendOutlined,
  DollarOutlined,
  FileTextOutlined,
  UploadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Dragger } = Upload;

const PurchaseRequisitionJustification = () => {
  const { requisitionId } = useParams(); // ✅ FIXED: Changed from requestId to requisitionId
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const isBuyer = ['buyer', 'supply_chain', 'admin'].includes(user?.role);
  const basePath = isBuyer ? '/buyer/requisitions' : '/employee/purchase-requisitions';
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [requisition, setRequisition] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    fetchRequisition();
  }, [requisitionId]); // ✅ FIXED: Changed dependency from requestId to requisitionId

  useEffect(() => {
    const total = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    setTotalSpent(total);
    form.setFieldsValue({ totalSpent: total });
    
    const approvedAmount = requisition?.budgetXAF || 0;
    const change = approvedAmount - total;
    form.setFieldsValue({ changeReturned: change > 0 ? change : 0 });
  }, [expenses, requisition, form]);

  const fetchRequisition = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/purchase-requisitions/${requisitionId}`); // ✅ FIXED: Changed from requestId
      
      if (response.data.success) {
        setRequisition(response.data.data);
      }
    } catch (error) {
      message.error('Failed to load requisition details');
      navigate(basePath);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = () => {
    setExpenses([...expenses, {
      key: Date.now(),
      description: '',
      amount: 0,
      category: '',
      date: new Date().toISOString().split('T')[0]
    }]);
  };

  const handleRemoveExpense = (key) => {
    setExpenses(expenses.filter(exp => exp.key !== key));
  };

  const handleExpenseChange = (key, field, value) => {
    setExpenses(expenses.map(exp => 
      exp.key === key ? { ...exp, [field]: value } : exp
    ));
  };

  const handleSubmit = async (values) => {
    if (expenses.length === 0) {
      message.error('Please add at least one expense');
      return;
    }

    if (receipts.length === 0) {
      Modal.confirm({
        title: 'No Receipts Uploaded',
        content: 'Are you sure you want to submit without any receipts? This may cause delays in approval.',
        onOk: () => submitJustification(values)
      });
      return;
    }

    submitJustification(values);
  };

  const submitJustification = async (values) => {
    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('actualExpenses', JSON.stringify(expenses));
      formData.append('totalSpent', values.totalSpent);
      formData.append('changeReturned', values.changeReturned || 0);
      formData.append('justificationSummary', values.justificationSummary);

      receipts.forEach((file) => {
        if (file.originFileObj) {
          formData.append('receipts', file.originFileObj);
        }
      });

      const response = await api.post(`/purchase-requisitions/${requisitionId}/justify`, formData, { // ✅ FIXED: Changed from requestId
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        message.success('Justification submitted successfully!');
        navigate(`${basePath}/${requisitionId}`);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to submit justification');
    } finally {
      setLoading(false);
    }
  };

  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (_, record) => (
        <Input
          placeholder="Item description"
          value={record.description}
          onChange={(e) => handleExpenseChange(record.key, 'description', e.target.value)}
        />
      )
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (_, record) => (
        <InputNumber
          style={{ width: '100%' }}
          value={record.amount}
          onChange={(value) => handleExpenseChange(record.key, 'amount', value)}
          min={0}
          precision={0}
        />
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (_, record) => (
        <Input
          placeholder="Category"
          value={record.category}
          onChange={(e) => handleExpenseChange(record.key, 'category', e.target.value)}
        />
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveExpense(record.key)}
        />
      )
    }
  ];

  if (!requisition) {
    return null;
  }

  const approvedAmount = requisition.budgetXAF || 0;
  const changeReturned = approvedAmount - totalSpent;
  const variance = ((totalSpent - approvedAmount) / approvedAmount) * 100;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={3}>
          <FileTextOutlined /> Submit Purchase Justification & Receipts - {requisition.title}
        </Title>

        <Alert
          message={isBuyer ? "Purchase Justification" : "Post-Purchase Expense Justification"}
          description={
            isBuyer
              ? "Provide a detailed breakdown of how this purchase is justified, including supporting receipts and expense details."
              : "After receiving your disbursement, you must submit a detailed breakdown of how the money was spent along with supporting receipts."
          }
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Requisition Summary */}
        <Alert
          message="Purchase Requisition Details"
          description={
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Requisition Number">
                {requisition.requisitionNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Approved Amount">
                <Text strong>XAF {approvedAmount.toLocaleString()}</Text>
              </Descriptions.Item>
            </Descriptions>
          }
          type="info"
          style={{ marginBottom: '24px' }}
        />

        {/* Financial Summary */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Statistic
              title="Approved Amount"
              value={approvedAmount}
              precision={0}
              prefix="XAF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Total Spent"
              value={totalSpent}
              precision={0}
              prefix="XAF"
              valueStyle={{ color: totalSpent > approvedAmount ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title={changeReturned >= 0 ? "Change to Return" : "Overspent"}
              value={Math.abs(changeReturned)}
              precision={0}
              prefix={changeReturned >= 0 ? "+" : "-"}
              valueStyle={{ color: changeReturned >= 0 ? '#52c41a' : '#ff4d4f' }}
            />
          </Col>
        </Row>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* Actual Expenses */}
          <Card size="small" title="Actual Expenses" style={{ marginBottom: '24px' }}>
            <Button
              type="dashed"
              onClick={handleAddExpense}
              icon={<PlusOutlined />}
              style={{ marginBottom: '16px' }}
              block
            >
              Add Expense
            </Button>

            <Table
              columns={expenseColumns}
              dataSource={expenses}
              pagination={false}
              size="small"
              rowKey="key"
            />
          </Card>

          {/* Upload Receipts */}
          <Card size="small" title="Upload Receipts" style={{ marginBottom: '24px' }}>
            <Dragger
              multiple
              fileList={receipts}
              onChange={({ fileList }) => setReceipts(fileList)}
              beforeUpload={() => false}
              accept=".pdf,.jpg,.jpeg,.png"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag receipts to upload</p>
              <p className="ant-upload-hint">Support for PDF, JPG, PNG files (Max 10 files)</p>
            </Dragger>
          </Card>

          {/* Justification Summary */}
          <Form.Item
            name="justificationSummary"
            label="Overall Justification Summary"
            rules={[{ required: true, message: 'Please provide a justification summary' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explain how the funds were used and any significant variances..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          {/* Hidden fields */}
          <Form.Item name="totalSpent" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="changeReturned" hidden>
            <Input />
          </Form.Item>

          {/* Action Buttons */}
          <Space>
            <Button onClick={() => navigate(`${basePath}/${requisitionId}`)}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SendOutlined />}
            >
              Submit Justification
            </Button>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default PurchaseRequisitionJustification;