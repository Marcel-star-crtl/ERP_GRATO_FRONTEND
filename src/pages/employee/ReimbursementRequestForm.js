import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DOMPurify from 'dompurify';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  Card,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Tag,
  Statistic,
  Switch,
  Tooltip,
  Table,
  App
} from 'antd';
import {
  UploadOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { cashRequestAPI } from '../../services/cashRequestAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ReimbursementRequestForm = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  // Itemized breakdown state (MANDATORY)
  const [useItemizedBreakdown] = useState(true); // Always true - itemized breakdown is mandatory
  const [itemizedExpenses, setItemizedExpenses] = useState([]);
  const [itemizedTotal, setItemizedTotal] = useState(0);
  const [limitStatus, setLimitStatus] = useState(null);
  const [loadingLimit, setLoadingLimit] = useState(true);
  const [advanceReceived, setAdvanceReceived] = useState(0);
  const [amountSpent, setAmountSpent] = useState(0);
  const navigate = useNavigate();

  // Calculate reimbursement due
  const reimbursementDue = itemizedTotal - advanceReceived;
  // Reimbursement Amount always equals Reimbursement Due
  const amountRequested = reimbursementDue;
  // Reimbursement Amount always equals Reimbursement Due
  const reimbursementAmount = reimbursementDue;
  const { user, token } = useSelector((state) => state.auth);

  const requestTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'emergency', label: 'Emergency Expenses' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'training', label: 'Training & Development' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'perdiem', label: 'Per Diem' },
    { value: 'utility', label: 'Utility (Electricity, Water, etc.)' },
    { value: 'staff-transportation', label: 'Staff Transportation' },
    { value: 'staff-entertainment', label: 'Staff Entertainment' },
    { value: 'toll-gates', label: 'Toll Gates' },
    { value: 'office-items', label: 'Office Items' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    if (!token) {
      message.error('Please login to access this page');
      navigate('/login');
      return;
    }
    fetchLimitStatus();
  }, [token, navigate]);

  // Calculate itemized total
  useEffect(() => {
    if (useItemizedBreakdown) {
      const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      setItemizedTotal(total);
      // Optionally, set amountSpent to total for strict matching:
      // setAmountSpent(total);
      form.setFieldValue('amountRequested', total - advanceReceived);
    }
  }, [itemizedExpenses, useItemizedBreakdown, amountSpent, advanceReceived, reimbursementDue, form]);

  const fetchLimitStatus = async () => {
    try {
      setLoadingLimit(true);
      const response = await cashRequestAPI.getReimbursementLimitStatus();
      
      if (response.success || response.data) {
        const data = response.data || response;
        setLimitStatus(data);
        
        if (!data.canSubmit) {
          message.warning({
            content: `You have reached your monthly reimbursement limit (${data.count}/${data.limit})`,
            duration: 5
          });
        }
      }
    } catch (error) {
      console.error('Error fetching limit status:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        message.error('Failed to check reimbursement limit');
      }
    } finally {
      setLoadingLimit(false);
    }
  };

  // Itemized breakdown handlers
  const addExpenseItem = () => {
    setItemizedExpenses([
      ...itemizedExpenses,
      {
        key: Date.now(),
        description: '',
        amount: 0,
        category: '',
        receiptNumber: ''
      }
    ]);
  };

  const removeExpenseItem = (key) => {
    setItemizedExpenses(itemizedExpenses.filter(item => item.key !== key));
  };

  const updateExpenseItem = (key, field, value) => {
    setItemizedExpenses(itemizedExpenses.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmit = async (values) => {
    try {
      console.log('\n=== SUBMITTING REIMBURSEMENT REQUEST ===');
      if (!limitStatus?.canSubmit) {
        message.error('You have reached your monthly reimbursement limit');
        return;
      }
      if (!values.requestType) {
        message.error('Please select an expense category');
        return;
      }
      if (amountSpent <= 0) {
        message.error('Please enter the total amount spent');
        return;
      }
      if (advanceReceived < 0 || advanceReceived > amountSpent) {
        message.error('Advance cannot exceed total spent.');
        return;
      }
      if (reimbursementDue < 0) {
        message.error('Reimbursement due cannot be negative.');
        return;
      }
      if (reimbursementDue > 100000) {
        message.error('Reimbursement amount cannot exceed XAF 100,000');
        return;
      }
      // Validation for itemized breakdown (MANDATORY)
      if (itemizedExpenses.length === 0) {
        message.error('Please add at least one expense item to the itemized breakdown');
        return;
      }
      const invalidItems = itemizedExpenses.filter(item => 
        !item.description || !item.amount || parseFloat(item.amount) <= 0
      );
      if (invalidItems.length > 0) {
        message.error('All expense items must have a description and valid amount');
        return;
      }
      const discrepancy = Math.abs(itemizedTotal - amountSpent);
      if (discrepancy > 1) {
        message.error(
          `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match total amount spent (XAF ${amountSpent.toLocaleString()})`
        );
        return;
      }
      if (fileList.length === 0) {
        message.error('Receipt documents are mandatory for reimbursement requests');
        return;
      }
      setLoading(true);
      console.log('Files to upload:', fileList.length);
      const formData = new FormData();
      formData.append('requestMode', 'reimbursement');
      formData.append('requestType', values.requestType);
      formData.append('amountSpent', Number(itemizedTotal));
      formData.append('advanceReceived', Number(advanceReceived));
      // Always set amountRequested to reimbursementDue (backend expects this)
      formData.append('amountRequested', Number(itemizedTotal) - Number(advanceReceived));
      formData.append('purpose', values.purpose);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));
      // Add itemized breakdown if used
      if (useItemizedBreakdown && itemizedExpenses.length > 0) {
        const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
        formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
        console.log('📋 Itemized breakdown:', cleanedBreakdown);
      }
      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('receiptDocuments', file.originFileObj, file.name);
          console.log(`   ${index + 1}. ✓ Added receipt: ${file.name}`);
        }
      });
      console.log('\n📦 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`   ${pair[0]}: [File] ${pair[1].name}`);
        } else {
          console.log(`   ${pair[0]}:`, pair[1]);
        }
      }
      console.log('\n🌐 Sending request...');
      const response = await cashRequestAPI.createReimbursementRequest(formData);
      console.log('✅ Response:', response);
      if (response.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Reimbursement request submitted successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>📎 {fileList.length} receipt(s) uploaded</div>
                <div>📋 Itemized breakdown: {itemizedExpenses.length} items</div>
                <div>📊 Monthly limit: {response.limitInfo?.monthlyUsed}/{response.limitInfo?.monthlyLimit} used</div>
                <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
                  ✅ No justification required - Completed after disbursement
                </div>
              </div>
            </div>
          ),
          duration: 6
        });
        setTimeout(() => {
          navigate('/employee/cash-requests');
        }, 1500);
      } else {
        throw new Error(response.message || 'Reimbursement submission failed');
      }
    } catch (error) {
      console.error('❌ Submission error:', error);
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit reimbursement request';
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
      console.log('=== SUBMISSION COMPLETED ===\n');
    }
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(`${file.name} is too large. Maximum size is 10MB.`);
        return Upload.LIST_IGNORE;
      }

      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];

      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        message.error(`${file.name} is not a supported file type`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length >= 10) {
        message.error('Maximum 10 files allowed');
        return Upload.LIST_IGNORE;
      }

      setFileList([...fileList, {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        size: file.size,
        type: file.type,
        originFileObj: file
      }]);
      
      return false;
    },
    fileList,
    multiple: true,
    listType: 'picture',
    maxCount: 10,
    accept: 'image/*,.pdf'
  };

  // Expense columns for itemized table
  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (
        <Input
          placeholder="e.g., Taxi fare to client meeting"
          value={text}
          onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
        />
      ),
      width: '30%'
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
          {requestTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      ),
      width: '25%'
    },
    {
      title: 'Receipt #',
      dataIndex: 'receiptNumber',
      key: 'receiptNumber',
      render: (text, record) => (
        <Input
          placeholder="Optional"
          value={text}
          onChange={(e) => updateExpenseItem(record.key, 'receiptNumber', e.target.value)}
        />
      ),
      width: '15%'
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
      width: '20%'
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

  if (loadingLimit) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Loading reimbursement status...</Text>
        </div>
      </Card>
    );
  }

  if (limitStatus && !limitStatus.canSubmit) {
    return (
      <Card>
        <Alert
          message="Monthly Reimbursement Limit Reached"
          description={
            <div>
              <Paragraph>
                You have submitted {limitStatus.count} reimbursement requests this month, 
                which is the maximum allowed limit of {limitStatus.limit} requests.
              </Paragraph>
              <Paragraph>
                Please wait until next month to submit additional reimbursement requests.
              </Paragraph>
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button onClick={() => navigate('/employee/cash-requests')}>
            Back to My Requests
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={3}>
        <DollarOutlined /> New Reimbursement Request
      </Title>

      {/* Reimbursement Calculation Section */}
      <Card style={{ marginBottom: 24, background: '#f6ffed', border: '1px solid #b7eb8f' }}>
        <Title level={4} style={{ marginBottom: 0 }}>Reimbursement Calculation</Title>
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Form.Item label="Total Amount Spent (XAF)" style={{ marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                min={1}
                value={amountSpent}
                onChange={v => setAmountSpent(Number(v) || 0)}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/,/g, '')}
                placeholder="e.g. 30,000"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item label="Advance Received (XAF)" style={{ marginBottom: 0 }}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={amountSpent}
                value={advanceReceived}
                onChange={v => setAdvanceReceived(Number(v) || 0)}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/,/g, '')}
                placeholder="e.g. 20,000"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Statistic
              title="Reimbursement Due"
              value={reimbursementDue}
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
              prefix="XAF"
            />
          </Col>
        </Row>
        <Text type="secondary">
          Enter the total you spent and any advance you received. The system will calculate your reimbursement due.
        </Text>
      </Card>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Alert
          message="Reimbursement Request Guidelines"
          description={
            <div>
              <Text>
                Submit this form to request reimbursement for expenses you have already paid from personal funds. If you received an advance, enter the amount. If not, leave it as 0.
              </Text>
              <Divider style={{ margin: '12px 0' }} />
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>Maximum Amount:</strong> XAF 100,000 per request</li>
                <li><strong>Monthly Limit:</strong> {limitStatus?.limit || 5} reimbursement requests per month</li>
                <li><strong>Receipt Documents:</strong> Mandatory for all reimbursement requests</li>
                <li><strong>Itemized Breakdown:</strong> Required - must match receipts uploaded</li>
                <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
                <li style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  <CheckCircleOutlined /> No justification required - Request completes after disbursement
                </li>
              </ul>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />

        {limitStatus && (
          <Alert
            message={`Monthly Limit Status: ${limitStatus.count}/${limitStatus.limit} used, ${limitStatus.remaining} remaining`}
            type={limitStatus.remaining <= 1 ? 'warning' : 'success'}
            showIcon
          />
        )}
      </Space>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="requestType"
              label="Expense Category"
              rules={[{ required: true, message: 'Please select expense category' }]}
            >
              <Select placeholder="Select expense category">
                {requestTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item
              name="urgency"
              label="Urgency Level"
              rules={[{ required: true, message: 'Please select urgency level' }]}
            >
              <Select placeholder="Select urgency level">
                <Option value="low">
                  <Tag color="green">Low</Tag> - Standard processing
                </Option>
                <Option value="medium">
                  <Tag color="orange">Medium</Tag> - Moderate priority
                </Option>
                <Option value="high">
                  <Tag color="red">High</Tag> - High priority
                </Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        {/* Amount field - Auto-calculated from reimbursement calculation */}
        <Form.Item
          name="amountRequested"
          label="Reimbursement Due (Auto-calculated)"
          rules={[{ required: true, message: 'Please enter the amounts above' }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            disabled
            value={reimbursementDue}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            prefix={<DollarOutlined />}
          />
        </Form.Item>

        {/* Itemized Expenses Section - MANDATORY */}
        <Card 
          title={
            <Space>
              <FileTextOutlined />
              <Text strong>Itemized Expenses</Text>
              <Tag color="red">Required</Tag>
              <Tag color="blue">Must Match Receipts</Tag>
            </Space>
          }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={addExpenseItem}
                disabled={itemizedExpenses.length >= 20}
              >
                Add Item
              </Button>
            }
            style={{ marginBottom: '24px' }}
          >
            {itemizedExpenses.length === 0 ? (
              <Alert
                message="No expense items added yet"
                description="Click 'Add Item' to start itemizing your reimbursement expenses. Each item MUST correspond to a receipt. Itemized breakdown is MANDATORY."
                type="warning"
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
                        <Table.Summary.Cell index={0} colSpan={3}>
                          <Text strong>Total Reimbursement Amount</Text>
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
                <Alert
                  message="Ensure each item matches a receipt in your upload"
                  type="warning"
                  showIcon
                  style={{ marginTop: '12px' }}
                />
              </>
            )}
          </Card>

        <Form.Item
          name="purpose"
          label="Purpose of Expense"
          rules={[{ 
            required: true,
            message: 'Please provide a detailed purpose'
          }]}
        >
          <ReactQuill
            theme="snow"
            placeholder="Describe what these expenses were for..."
            style={{ minHeight: '120px' }}
            modules={{
              toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['clean']
              ]
            }}
          />
        </Form.Item>

        <Form.Item
          name="requiredDate"
          label="Date of Expense"
          rules={[{ required: true, message: 'Please select the date of expense' }]}
          extra="Select the date when you incurred these expenses"
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabledDate={(current) => current && current > dayjs().endOf('day')}
            placeholder="Select expense date"
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Receipt Documents
              <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>
            </span>
          }
          extra={
            <div>
              <div>Upload clear images or PDFs of all receipts (max 10 files, 10MB each)</div>
              <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
                Receipt documents are MANDATORY for all reimbursement requests
              </div>
              {itemizedExpenses.length > 0 && (
                <div style={{ color: '#1890ff', fontWeight: 'bold', marginTop: '4px' }}>
                  Upload {itemizedExpenses.length} receipt(s) to match your itemized breakdown
                </div>
              )}
            </div>
          }
          required
        >
          <Upload {...uploadProps}>
            {fileList.length >= 10 ? null : (
              <Button icon={<UploadOutlined />} block>
                Upload Receipt Documents (Required) - {fileList.length} file(s) selected
              </Button>
            )}
          </Upload>
        </Form.Item>

        <Card style={{ marginBottom: '24px', backgroundColor: '#f0f2f5' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Reimbursement Amount"
                value={form.getFieldValue('amountRequested') || 0}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="XAF"
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Receipt Documents"
                value={fileList.length}
                valueStyle={{ color: fileList.length === 0 ? '#ff4d4f' : '#52c41a' }}
                prefix={<UploadOutlined />}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Expense Items (Required)"
                value={itemizedExpenses.length}
                valueStyle={{ color: itemizedExpenses.length === 0 ? '#ff4d4f' : '#1890ff' }}
                prefix={<FileTextOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Alert
          message="No Justification Required"
          description="Unlike cash advances, reimbursements do not require a separate justification submission after disbursement. Your request will be marked as complete once the funds are disbursed to you."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/employee/cash-requests')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={
                loading || 
                !limitStatus?.canSubmit || 
                fileList.length === 0
              }
            >
              {loading ? 'Submitting...' : 'Submit Reimbursement Request'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

const ReimbursementRequestFormWrapper = () => (
  <App>
    <ReimbursementRequestForm />
  </App>
);

export default ReimbursementRequestFormWrapper;


