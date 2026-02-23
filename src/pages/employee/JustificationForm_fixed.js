
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
import '../../styles/dropdownZIndex.css';

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
  
  // Itemized breakdown state
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

  // Calculate itemized total
  useEffect(() => {
    if (itemizedExpenses.length > 0) {
      const total = itemizedExpenses.reduce((sum, item) => 
        sum + (parseFloat(item.amount) || 0), 0
      );
      setItemizedTotal(total);
      form.setFieldValue('amountSpent', total);
      
      // Auto-calculate balance returned (can be negative if spent more than disbursed)
      const disbursedAmount = request?.totalDisbursed || request?.disbursementDetails?.amount || 0;
      const balance = disbursedAmount - total;
      form.setFieldValue('balanceReturned', balance);
    }
  }, [itemizedExpenses, form, request]);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setFetching(true);
        setError(null);
        
        console.log('Fetching justification form data for request ID:', requestId);
        
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        let response;
        try {
          response = await api.get(`/cash-requests/employee/${requestId}/justification`);
        } catch (justifyError) {
          console.log('Justify endpoint failed, trying regular request endpoint...', justifyError);
          response = await api.get(`/cash-requests/${requestId}`);
        }
        
        console.log('Justification form response:', response.data);
        
        if (response.data.success) {
          const requestData = response.data.data;
          setRequest(requestData);
          
          const validStatuses = [
            'disbursed',
            'fully_disbursed',
            'partially_disbursed',
            'justification_pending',
            'justification_pending_supervisor',
            'justification_pending_finance',
            'justification_rejected_supervisor',
            'justification_rejected_finance'
          ];
          
          const canSubmitJustification = validStatuses.includes(requestData.status);
          
          if (!canSubmitJustification) {
            setError(`Cannot submit justification for request with status: ${requestData.status}. Request must be disbursed first.`);
            return;
          }
          
          // Load existing justification if available
          if (requestData.justification) {
            form.setFieldsValue({
              amountSpent: requestData.justification.amountSpent,
              balanceReturned: requestData.justification.balanceReturned,
              details: requestData.justification.details
            });
            
            // Load existing itemized breakdown
            if (requestData.justification.itemizedBreakdown && 
                requestData.justification.itemizedBreakdown.length > 0) {
              setItemizedExpenses(
                requestData.justification.itemizedBreakdown.map((item, index) => ({
                  key: Date.now() + index,
                  description: item.description,
                  amount: item.amount,
                  category: item.category || ''
                }))
              );
            } else {
              // If no itemized breakdown exists, add one empty item
              setItemizedExpenses([{
                key: Date.now(),
                description: '',
                amount: 0,
                category: ''
              }]);
            }
          } else {
            // If no justification data, add empty itemized item
            setItemizedExpenses([{
              key: Date.now(),
              description: '',
              amount: 0,
              category: ''
            }]);
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch request details');
        }
      } catch (error) {
        console.error('Error fetching request for justification:', error);
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

  // Itemized breakdown handlers
  const addExpenseItem = () => {
    setItemizedExpenses([
      ...itemizedExpenses,
      {
        key: Date.now(),
        description: '',
        amount: 0,
        category: ''
      }
    ]);
  };

  const removeExpenseItem = (key) => {
    if (itemizedExpenses.length > 1) {
      setItemizedExpenses(itemizedExpenses.filter(item => item.key !== key));
    } else {
      message.warning('At least one expense item is required');
    }
  };

  const updateExpenseItem = (key, field, value) => {
    setItemizedExpenses(itemizedExpenses.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      console.log('Submitting justification:', values);

      // Validation for itemized breakdown
      if (itemizedExpenses.length === 0) {
        message.error('Please add at least one expense item');
        return;
      }

      const invalidItems = itemizedExpenses.filter(item => 
        !item.description || !item.amount || parseFloat(item.amount) <= 0
      );

      if (invalidItems.length > 0) {
        message.error('All expense items must have a description and valid amount');
        return;
      }

      const discrepancy = Math.abs(itemizedTotal - parseFloat(values.amountSpent));
      if (discrepancy > 1) {
        message.error(
          `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match amount spent (XAF ${parseFloat(values.amountSpent).toLocaleString()})`
        );
        return;
      }
      
      const formData = new FormData();
      formData.append('amountSpent', values.amountSpent);
      formData.append('balanceReturned', values.balanceReturned);
      formData.append('details', values.details);
      
      // Add itemized breakdown (now compulsory)
      if (itemizedExpenses.length > 0) {
        const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
        formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
        console.log('Itemized breakdown:', cleanedBreakdown);
      }
      
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

      console.log('Justification submission response:', response.data);

      if (response.data.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Justification submitted successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                {fileList.length > 0 && (
                  <div>📎 {fileList.length} document(s) uploaded</div>
                )}
                <div>📋 Itemized breakdown included ({itemizedExpenses.length} items)</div>
              </div>
            </div>
          ),
          duration: 5
        });
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

  const handleGoBack = () => {
    navigate(`/employee/request/${requestId}`);
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList }) => setFileList(fileList),
    beforeUpload: () => false,
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
    maxCount: 10,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  // Expense columns for itemized table
  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (
        <Input
          placeholder="e.g., Taxi from office to client site"
          value={text}
          onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
        />
      ),
      width: '35%'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select category"
          value={text || undefined}
          onChange={(value) => updateExpenseItem(record.key, 'category', value)}
          allowClear
        >
          {expenseTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      ),
      width: '30%'
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1}
          placeholder="0"
          value={text}
          onChange={(value) => updateExpenseItem(record.key, 'amount', value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/,/g, '')}
        />
      ),
      width: '25%'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeExpenseItem(record.key)}
        />
      ),
      width: '10%'
    }
  ];

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
          description="The request you are trying to access does not exist or you don't have permission to view it."
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

  const disbursedAmount = request.totalDisbursed || request.disbursementDetails?.amount || 0;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Cash Justification Form
          </Title>
          <Text type="secondary">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Text>
        </div>

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Request ID">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Original Amount Requested">
            <Text strong>XAF {Number(request.amountRequested || 0).toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount Disbursed">
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              XAF {Number(disbursedAmount).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Disbursement Date">
            {request.disbursements && request.disbursements.length > 0
              ? new Date(request.disbursements[request.disbursements.length - 1].date).toLocaleDateString('en-GB')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Disbursed By">
            {request.disbursements && request.disbursements.length > 0
              ? request.disbursements[request.disbursements.length - 1].disbursedBy?.fullName || 'N/A'
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Text strong>{request.status?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="amountSpent"
            label="Total Amount Spent (XAF)"
            rules={[{ required: true, message: 'Please add expense items' }]}
            extra="Auto-calculated from itemized expenses below"
          >
            <InputNumber
              style={{ width: '100%' }}
              disabled
              value={itemizedTotal}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              prefix={<DollarOutlined />}
            />
          </Form.Item>

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
                disabled={itemizedExpenses.length >= 50}
              >
                Add Item
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            {itemizedExpenses.length === 0 ? (
              <Alert
                message="No expense items added yet"
                description="Click 'Add Item' to start adding your itemized expenses"
                type="info"
                showIcon
              />
            ) : (
              <>
                <Table
                  dataSource={itemizedExpenses}
                  columns={expenseColumns}
                  pagination={false}
                  size="small"
                  rowKey="key"
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={2}>
                          <Text strong>Total Amount Spent</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                            XAF {itemizedTotal.toLocaleString()}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} />
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
                
                {itemizedTotal > disbursedAmount && (
                  <Alert
                    message="Extra Spending Detected"
                    description={`Your itemized total (XAF ${itemizedTotal.toLocaleString()}) exceeds the disbursed amount (XAF ${disbursedAmount.toLocaleString()}). You are claiming XAF ${(itemizedTotal - disbursedAmount).toLocaleString()} in reimbursement for extra spending from your own pocket.`}
                    type="info"
                    showIcon
                    style={{ marginTop: '16px' }}
                  />
                )}
              </>
            )}
          </Card>

          <Form.Item
            name="balanceReturned"
            label="Balance Returned / Amount Owed (XAF)"
            rules={[
              { required: true, message: 'Required field' },
            ]}
            extra="Positive = money returned to company | Negative = reimbursement owed to you"
          >
            <InputNumber
              style={{ width: '100%' }}
              step={1}
              placeholder="Auto-calculated"
              disabled
              formatter={(value) => {
                if (value === null || value === undefined) return '';
                const formatted = `${Math.abs(value)}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                if (value > 0) {
                  return `+ XAF ${formatted}`;
                } else if (value < 0) {
                  return `- XAF ${formatted}`;
                }
                return `XAF 0`;
              }}
              parser={(value) => {
                const num = value.replace(/[^\d-]/g, '');
                return parseInt(num) || 0;
              }}
            />
          </Form.Item>

          <Form.Item
            name="details"
            label="Detailed Explanation of Spending"
            rules={[
              { required: true, message: 'Please provide detailed spending explanation' },
              { min: 20, message: 'Details must be at least 20 characters long' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="Provide a detailed breakdown of how the funds were used, including dates, vendors, items purchased, etc..."
              showCount
              maxLength={2000}
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

          <Alert
            message="Submission Guidelines"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>Itemized breakdown is required with at least one expense item</li>
                <li>All items must have description, category, and amount</li>
                <li>Supporting documents are optional but recommended</li>
                <li>Provide detailed explanation of all expenses</li>
                <li>Justification will go through approval chain</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

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
