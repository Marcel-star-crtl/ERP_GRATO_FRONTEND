import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  InputNumber,
  Upload,
  message,
  Card,
  Typography,
  Space,
  Alert,
  Table,
  Divider,
  Row,
  Col,
  Tag,
  Switch,
  Tooltip,
  Spin,
  Descriptions
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { cashRequestAPI, projectsAPI, budgetCodesAPI } from '../../services/cashRequestAPI';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CashRequestForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  
  // Itemized breakdown state
  const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
  const [itemizedExpenses, setItemizedExpenses] = useState([]);
  const [itemizedTotal, setItemizedTotal] = useState(0);
  const [manualAmount, setManualAmount] = useState(0);
  
  const [projects, setProjects] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
  // Pending request check state
  const [canCreate, setCanCreate] = useState(true);
  const [pendingRequestInfo, setPendingRequestInfo] = useState(null);
  const [checkingPending, setCheckingPending] = useState(true);
  
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const requestTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'emergency', label: 'Emergency Expenses' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'training', label: 'Training & Development' },
    { value: 'expense', label: 'Expense' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'perdiem', label: 'Per Diem' },
    { value: 'utility', label: 'Utility (Electricity, Water, etc.)' },
    { value: 'staff-transportation', label: 'Staff Transportation' },
    { value: 'staff-entertainment', label: 'Staff Entertainment' },
    { value: 'toll-gates', label: 'Toll Gates' },
    { value: 'office-items', label: 'Office Items' },
    { value: 'other', label: 'Other' }
  ];

  // Check for pending requests on mount
  useEffect(() => {
    const checkPendingRequests = async () => {
      try {
        setCheckingPending(true);
        const response = await api.get('/cash-requests/check-pending');
        
        console.log('Pending check response:', response.data);
        
        if (response.data.hasPending) {
          setCanCreate(false);
          setPendingRequestInfo(response.data.pendingRequest);
        } else {
          setCanCreate(true);
          setPendingRequestInfo(null);
        }
      } catch (error) {
        console.error('Failed to check pending requests:', error);
        message.error('Failed to verify request status');
        // On error, allow creation but warn user
        setCanCreate(true);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPendingRequests();
  }, []);

  useEffect(() => {
    if (canCreate) {
      fetchProjects();
      fetchBudgetCodes();
    }
  }, [canCreate]);

  // Calculate itemized total
  useEffect(() => {
    if (useItemizedBreakdown) {
      const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      setItemizedTotal(total);
      form.setFieldValue('amountRequested', total);
    }
  }, [itemizedExpenses, useItemizedBreakdown, form]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getActiveProjects();
      if (response.success) {
        setProjects(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Failed to load projects');
    }
  };

  const fetchBudgetCodes = async () => {
    try {
      const response = await budgetCodesAPI.getAvailableBudgetCodes();
      if (response.success) {
        setBudgetCodes(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      message.error('Failed to load budget codes');
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
        category: ''
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

  const handleToggleItemizedBreakdown = (checked) => {
    setUseItemizedBreakdown(checked);
    if (!checked) {
      setItemizedExpenses([]);
      setItemizedTotal(0);
    } else {
      const currentAmount = form.getFieldValue('amountRequested');
      setManualAmount(currentAmount || 0);
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log('\n=== 🚀 SUBMITTING CASH REQUEST ===');
      console.log('Form Values:', values);
      console.log('Files to upload:', fileList.length);

      // Validation for itemized breakdown
      if (useItemizedBreakdown) {
        if (itemizedExpenses.length === 0) {
          message.error('Please add at least one expense item or disable itemized breakdown');
          return;
        }

        const invalidItems = itemizedExpenses.filter(item => 
          !item.description || !item.amount || parseFloat(item.amount) <= 0
        );

        if (invalidItems.length > 0) {
          message.error('All expense items must have a description and valid amount');
          return;
        }

        const discrepancy = Math.abs(itemizedTotal - parseFloat(values.amountRequested));
        if (discrepancy > 1) {
          message.error(
            `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match requested amount (XAF ${parseFloat(values.amountRequested).toLocaleString()})`
          );
          return;
        }
      }

      setLoading(true);

      const formData = new FormData();
      
      // Add basic fields
      formData.append('requestMode', 'advance');
      formData.append('requestType', values.requestType);
      formData.append('amountRequested', values.amountRequested);
      formData.append('purpose', values.purpose);
      formData.append('businessJustification', values.businessJustification);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

      // Add itemized breakdown if used
      if (useItemizedBreakdown && itemizedExpenses.length > 0) {
        const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
        formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
        console.log('📋 Itemized breakdown:', cleanedBreakdown);
      }

      // Add project if selected
      if (values.projectId) {
        formData.append('projectId', values.projectId);
        console.log('📁 Project ID:', values.projectId);
      }

      // Add files properly with originFileObj
      if (fileList && fileList.length > 0) {
        console.log(`\n📎 Adding ${fileList.length} file(s) to FormData...`);
        
        fileList.forEach((file, index) => {
          if (file.originFileObj) {
            formData.append('attachments', file.originFileObj, file.name);
            console.log(`   ${index + 1}. ✓ Added: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
          } else {
            console.warn(`   ${index + 1}. ⚠️  No originFileObj for: ${file.name}`);
          }
        });
      } else {
        console.log('📎 No attachments to upload');
      }

      // Debug: Log FormData contents
      console.log('\n📦 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`   ${pair[0]}: [File] ${pair[1].name} (${(pair[1].size / 1024).toFixed(2)} KB)`);
        } else {
          console.log(`   ${pair[0]}:`, pair[1]);
        }
      }

      console.log('\n🌐 Sending request to backend...');
      const response = await cashRequestAPI.create(formData);

      console.log('\n✅ Response received:', response);

      if (response.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Cash request submitted successfully!
              </div>
              {response.metadata && (
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  {response.metadata.attachmentsUploaded > 0 && (
                    <div>📎 {response.metadata.attachmentsUploaded} document(s) uploaded</div>
                  )}
                  {response.metadata.hasItemizedBreakdown && (
                    <div>📋 Itemized breakdown included</div>
                  )}
                  <div>🔄 {response.metadata.approvalLevels} approval levels required</div>
                </div>
              )}
            </div>
          ),
          duration: 5
        });
        
        setTimeout(() => {
          navigate('/employee/cash-requests');
        }, 1500);
      } else {
        throw new Error(response.message || 'Request submission failed');
      }

    } catch (error) {
      console.error('\n❌ Submission error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });

      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit request. Please try again.';
      
      message.error({
        content: errorMessage,
        duration: 5
      });
    } finally {
      setLoading(false);
      console.log('=== 🏁 SUBMISSION COMPLETED ===\n');
    }
  };

  // Upload props with proper file object structure
  const uploadProps = {
    onRemove: (file) => {
      console.log('🗑️  Removing file:', file.name);
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    },
    beforeUpload: (file) => {
      console.log('\n📤 Before upload:', file.name);
      console.log('   Size:', (file.size / 1024).toFixed(2), 'KB');
      console.log('   Type:', file.type);

      // Validate file size (10MB limit)
      const isLt10M = file.size / 1024 / 1024 < 10;
      if (!isLt10M) {
        message.error(`${file.name} is too large. Maximum size is 10MB.`);
        return Upload.LIST_IGNORE;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      if (!allowedTypes.includes(file.type)) {
        message.error(`${file.name} is not a supported file type`);
        return Upload.LIST_IGNORE;
      }

      // Check file limit
      if (fileList.length >= 10) {
        message.error('Maximum 10 files allowed');
        return Upload.LIST_IGNORE;
      }

      console.log('   ✅ File validation passed');
      
      // Create proper file object with originFileObj
      const fileWithOrigin = {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        size: file.size,
        type: file.type,
        originFileObj: file,
        thumbUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };
      
      setFileList([...fileList, fileWithOrigin]);
      
      return false; // Prevent auto-upload
    },
    fileList,
    multiple: true,
    listType: 'picture',
    maxCount: 10,
    accept: '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx'
  };

  // Expense columns for itemized table
  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (
        <Input
          placeholder="e.g., Transportation to client site"
          value={text}
          onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
        />
      ),
      width: '35%'
    },
    {
      title: 'Category/Type',
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

  // If still checking for pending requests
  if (checkingPending) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Checking request status...</div>
        </div>
      </Card>
    );
  }

  // If user has pending request - block creation
  if (!canCreate && pendingRequestInfo) {
    return (
      <Card>
        <Alert
          message="Cannot Create New Request"
          description={
            <div>
              <p>You already have a pending cash request that must be completed first.</p>
              <Divider style={{ margin: '12px 0' }} />
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="Request ID">
                  <Text code>REQ-{pendingRequestInfo.id.slice(-6).toUpperCase()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Text strong>
                    {pendingRequestInfo.type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#1890ff' }}>
                    XAF {pendingRequestInfo.amount.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="orange" icon={<WarningOutlined />}>
                    {pendingRequestInfo.status.replace(/_/g, ' ').toUpperCase()}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted">
                  {new Date(pendingRequestInfo.createdAt).toLocaleDateString('en-GB', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Descriptions.Item>
              </Descriptions>
              <Divider style={{ margin: '16px 0' }} />
              <Alert
                message="What you can do:"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                    <li>Wait for your pending request to be approved or rejected</li>
                    <li>If still pending first approval, you can <strong>delete</strong> it and create a new one</li>
                    <li>View the request details to check its current status</li>
                  </ul>
                }
                type="info"
                showIcon
                style={{ marginTop: '12px' }}
              />
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
          action={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                block
                onClick={() => navigate(`/employee/cash-request/${pendingRequestInfo.id}`)}
              >
                View Pending Request
              </Button>
              <Button 
                block
                onClick={() => navigate('/employee/cash-requests')}
              >
                Back to My Requests
              </Button>
            </Space>
          }
        />
      </Card>
    );
  }

  // Normal form rendering
  return (
    <Card>
      <Title level={3}>
        <DollarOutlined /> New Cash Advance Request
      </Title>

      <Alert
        message="Cash Advance Request Guidelines"
        description={
          <div>
            <Text>
              Submit this form to request cash advance for upcoming business expenses.
            </Text>
            <Divider style={{ margin: '12px 0' }} />
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>One Request at a Time:</strong> You can only have one pending request</li>
              <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
              <li><strong>Supporting Documents:</strong> Optional but recommended</li>
              <li><strong>Itemized Breakdown:</strong> Optional but helps with faster approval</li>
              <li><strong>Justification:</strong> Required after disbursement with receipts</li>
              <li><strong>Delete Option:</strong> You can delete a request before first approval</li>
            </ul>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="requestType"
              label="Expense Type"
              rules={[{ required: true, message: 'Please select expense type' }]}
            >
              <Select placeholder="Select expense type">
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

        {/* Itemized Breakdown Toggle */}
        <Card 
          style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center">
              <Switch 
                checked={useItemizedBreakdown}
                onChange={handleToggleItemizedBreakdown}
              />
              <Text strong>Add Itemized Breakdown</Text>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Recommended
              </Tag>
              <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better and can speed up approval">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </Space>
            
            {!useItemizedBreakdown && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Providing detailed breakdown is optional but recommended for transparency
              </Text>
            )}
          </Space>
        </Card>

        {/* Amount field */}
        {!useItemizedBreakdown ? (
          <Form.Item
            name="amountRequested"
            label="Amount Requested (XAF)"
            rules={[
              { required: true, message: 'Please enter amount' },
              { 
                validator: (_, value) => {
                  if (value && value <= 0) {
                    return Promise.reject('Amount must be greater than 0');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1000}
              placeholder="Enter requested amount"
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
              onChange={(value) => setManualAmount(value)}
            />
          </Form.Item>
        ) : (
          <Form.Item
            name="amountRequested"
            label="Total Amount (Auto-calculated from breakdown)"
            rules={[{ required: true, message: 'Please add expense items' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              disabled
              value={itemizedTotal}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              prefix={<DollarOutlined />}
            />
          </Form.Item>
        )}

        {/* Itemized Expenses Section */}
        {useItemizedBreakdown && (
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <Text strong>Itemized Expenses</Text>
                <Tag color="blue">Optional</Tag>
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
                          <Text strong>Total Amount</Text>
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
              </>
            )}
          </Card>
        )}

        <Form.Item
          name="purpose"
          label="Purpose of Request"
          rules={[{ 
            required: true,
            min: 10,
            message: 'Please provide a detailed purpose (minimum 10 characters)'
          }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Describe the purpose of this cash request"
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          name="businessJustification"
          label="Business Justification"
          rules={[{ 
            required: true,
            min: 20,
            message: 'Please provide a detailed justification (minimum 20 characters)'
          }]}
        >
          <TextArea 
            rows={4} 
            placeholder="Explain why this expense is necessary for business operations"
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item
          name="requiredDate"
          label="Required By Date"
          rules={[{ required: true, message: 'Please select required date' }]}
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabledDate={(current) => current && current < dayjs().startOf('day')}
          />
        </Form.Item>

        <Form.Item
          name="projectId"
          label="Project (Optional)"
          extra="Select if this expense is for a specific project"
        >
          <Select
            placeholder="Select project"
            allowClear
            onChange={(value) => {
              const project = projects.find(p => p._id === value);
              setSelectedProject(project);
            }}
          >
            {projects.map(project => (
              <Option key={project._id} value={project._id}>
                {project.code} - {project.name}
                {project.budgetCodeId && (
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    (Budget: XAF {project.budgetCodeId.remaining?.toLocaleString()})
                  </Text>
                )}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          label="Supporting Documents (Optional)"
          extra={`Upload any supporting documents (max 10 files, 10MB each). Supported: PDF, Word, Excel, Images`}
        >
          <Upload {...uploadProps}>
            {fileList.length >= 10 ? null : (
              <Button icon={<UploadOutlined />} block>
                Upload Documents ({fileList.length}/10)
              </Button>
            )}
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
          <Space>
            <Button onClick={() => navigate('/employee/cash-requests')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CashRequestForm;









// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Form,
//   Input,
//   Button,
//   Select,
//   DatePicker,
//   InputNumber,
//   Upload,
//   message,
//   Card,
//   Typography,
//   Space,
//   Alert,
//   Table,
//   Divider,
//   Row,
//   Col,
//   Tag,
//   Switch,
//   Tooltip
// } from 'antd';
// import {
//   UploadOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   InfoCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { cashRequestAPI, projectsAPI, budgetCodesAPI } from '../../services/cashRequestAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const CashRequestForm = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
  
//   // Itemized breakdown state
//   const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
//   const [itemizedExpenses, setItemizedExpenses] = useState([]);
//   const [itemizedTotal, setItemizedTotal] = useState(0);
//   const [manualAmount, setManualAmount] = useState(0);
  
//   const [projects, setProjects] = useState([]);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [selectedProject, setSelectedProject] = useState(null);
  
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);

//   const requestTypes = [
//     { value: 'travel', label: 'Travel Expenses' },
//     { value: 'office-supplies', label: 'Office Supplies' },
//     { value: 'client-entertainment', label: 'Client Entertainment' },
//     { value: 'emergency', label: 'Emergency Expenses' },
//     { value: 'project-materials', label: 'Project Materials' },
//     { value: 'training', label: 'Training & Development' },
//     { value: 'expense', label: 'Expense' },
//     { value: 'accommodation', label: 'Accommodation' },
//     { value: 'perdiem', label: 'Per Diem' },
//     { value: 'utility', label: 'Utility (Electricity, Water, etc.)' },
//     { value: 'staff-transportation', label: 'Staff Transportation' },
//     { value: 'staff-entertainment', label: 'Staff Entertainment' },
//     { value: 'toll-gates', label: 'Toll Gates' },
//     { value: 'office-items', label: 'Office Items' },
//     { value: 'other', label: 'Other' }
//   ];

//   useEffect(() => {
//     fetchProjects();
//     fetchBudgetCodes();
//   }, []);

//   // Calculate itemized total
//   useEffect(() => {
//     if (useItemizedBreakdown) {
//       const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
//       setItemizedTotal(total);
//       form.setFieldValue('amountRequested', total);
//     }
//   }, [itemizedExpenses, useItemizedBreakdown, form]);

//   const fetchProjects = async () => {
//     try {
//       const response = await projectsAPI.getActiveProjects();
//       if (response.success) {
//         setProjects(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       message.error('Failed to load projects');
//     }
//   };

//   const fetchBudgetCodes = async () => {
//     try {
//       const response = await budgetCodesAPI.getAvailableBudgetCodes();
//       if (response.success) {
//         setBudgetCodes(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching budget codes:', error);
//       message.error('Failed to load budget codes');
//     }
//   };

//   // Itemized breakdown handlers
//   const addExpenseItem = () => {
//     setItemizedExpenses([
//       ...itemizedExpenses,
//       {
//         key: Date.now(),
//         description: '',
//         amount: 0,
//         category: ''
//       }
//     ]);
//   };

//   const removeExpenseItem = (key) => {
//     setItemizedExpenses(itemizedExpenses.filter(item => item.key !== key));
//   };

//   const updateExpenseItem = (key, field, value) => {
//     setItemizedExpenses(itemizedExpenses.map(item => 
//       item.key === key ? { ...item, [field]: value } : item
//     ));
//   };

//   const handleToggleItemizedBreakdown = (checked) => {
//     setUseItemizedBreakdown(checked);
//     if (!checked) {
//       setItemizedExpenses([]);
//       setItemizedTotal(0);
//     } else {
//       const currentAmount = form.getFieldValue('amountRequested');
//       setManualAmount(currentAmount || 0);
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       console.log('\n=== 🚀 SUBMITTING CASH REQUEST ===');
//       console.log('Form Values:', values);
//       console.log('Files to upload:', fileList.length);

//       // Validation for itemized breakdown
//       if (useItemizedBreakdown) {
//         if (itemizedExpenses.length === 0) {
//           message.error('Please add at least one expense item or disable itemized breakdown');
//           return;
//         }

//         const invalidItems = itemizedExpenses.filter(item => 
//           !item.description || !item.amount || parseFloat(item.amount) <= 0
//         );

//         if (invalidItems.length > 0) {
//           message.error('All expense items must have a description and valid amount');
//           return;
//         }

//         const discrepancy = Math.abs(itemizedTotal - parseFloat(values.amountRequested));
//         if (discrepancy > 1) {
//           message.error(
//             `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match requested amount (XAF ${parseFloat(values.amountRequested).toLocaleString()})`
//           );
//           return;
//         }
//       }

//       setLoading(true);

//       const formData = new FormData();
      
//       // Add basic fields
//       formData.append('requestMode', 'advance');
//       formData.append('requestType', values.requestType);
//       formData.append('amountRequested', values.amountRequested);
//       formData.append('purpose', values.purpose);
//       formData.append('businessJustification', values.businessJustification);
//       formData.append('urgency', values.urgency);
//       formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

//       // Add itemized breakdown if used
//       if (useItemizedBreakdown && itemizedExpenses.length > 0) {
//         const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
//         formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
//         console.log('📋 Itemized breakdown:', cleanedBreakdown);
//       }

//       // Add project if selected
//       if (values.projectId) {
//         formData.append('projectId', values.projectId);
//         console.log('📁 Project ID:', values.projectId);
//       }

//       // ✅ FIXED: Add files properly with originFileObj
//       if (fileList && fileList.length > 0) {
//         console.log(`\n📎 Adding ${fileList.length} file(s) to FormData...`);
        
//         fileList.forEach((file, index) => {
//           if (file.originFileObj) {
//             formData.append('attachments', file.originFileObj, file.name);
//             console.log(`   ${index + 1}. ✓ Added: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
//           } else {
//             console.warn(`   ${index + 1}. ⚠️  No originFileObj for: ${file.name}`);
//           }
//         });
//       } else {
//         console.log('📎 No attachments to upload');
//       }

//       // Debug: Log FormData contents
//       console.log('\n📦 FormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[1] instanceof File) {
//           console.log(`   ${pair[0]}: [File] ${pair[1].name} (${(pair[1].size / 1024).toFixed(2)} KB)`);
//         } else {
//           console.log(`   ${pair[0]}:`, pair[1]);
//         }
//       }

//       console.log('\n🌐 Sending request to backend...');
//       const response = await cashRequestAPI.create(formData);

//       console.log('\n✅ Response received:', response);

//       if (response.success) {
//         message.success({
//           content: (
//             <div>
//               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                 ✅ Cash request submitted successfully!
//               </div>
//               {response.metadata && (
//                 <div style={{ fontSize: '12px', marginTop: '8px' }}>
//                   {response.metadata.attachmentsUploaded > 0 && (
//                     <div>📎 {response.metadata.attachmentsUploaded} document(s) uploaded</div>
//                   )}
//                   {response.metadata.hasItemizedBreakdown && (
//                     <div>📋 Itemized breakdown included</div>
//                   )}
//                   <div>🔄 {response.metadata.approvalLevels} approval levels required</div>
//                 </div>
//               )}
//             </div>
//           ),
//           duration: 5
//         });
        
//         setTimeout(() => {
//           navigate('/employee/cash-requests');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Request submission failed');
//       }

//     } catch (error) {
//       console.error('\n❌ Submission error:', error);
//       console.error('Error details:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });

//       const errorMessage = error.response?.data?.message || error.message || 'Failed to submit request. Please try again.';
      
//       message.error({
//         content: errorMessage,
//         duration: 5
//       });
//     } finally {
//       setLoading(false);
//       console.log('=== 🏁 SUBMISSION COMPLETED ===\n');
//     }
//   };

//   // ✅ FIXED: Upload props with proper file object structure
//   const uploadProps = {
//     onRemove: (file) => {
//       console.log('🗑️  Removing file:', file.name);
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     },
//     beforeUpload: (file) => {
//       console.log('\n📤 Before upload:', file.name);
//       console.log('   Size:', (file.size / 1024).toFixed(2), 'KB');
//       console.log('   Type:', file.type);

//       // Validate file size (10MB limit)
//       const isLt10M = file.size / 1024 / 1024 < 10;
//       if (!isLt10M) {
//         message.error(`${file.name} is too large. Maximum size is 10MB.`);
//         return Upload.LIST_IGNORE;
//       }

//       // Validate file type
//       const allowedTypes = [
//         'image/jpeg',
//         'image/png',
//         'image/gif',
//         'application/pdf',
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'application/vnd.ms-excel',
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//       ];

//       if (!allowedTypes.includes(file.type)) {
//         message.error(`${file.name} is not a supported file type`);
//         return Upload.LIST_IGNORE;
//       }

//       // Check file limit
//       if (fileList.length >= 10) {
//         message.error('Maximum 10 files allowed');
//         return Upload.LIST_IGNORE;
//       }

//       console.log('   ✅ File validation passed');
      
//       // ✅ FIX: Create proper file object with originFileObj
//       const fileWithOrigin = {
//         uid: file.uid || `${Date.now()}-${Math.random()}`,
//         name: file.name,
//         status: 'done',
//         size: file.size,
//         type: file.type,
//         originFileObj: file, // ✅ CRITICAL: Store the actual File object
//         thumbUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
//       };
      
//       setFileList([...fileList, fileWithOrigin]);
      
//       return false; // Prevent auto-upload
//     },
//     fileList,
//     multiple: true,
//     listType: 'picture',
//     maxCount: 10,
//     accept: '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx'
//   };

//   // Expense columns for itemized table
//   const expenseColumns = [
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (text, record) => (
//         <Input
//           placeholder="e.g., Transportation to client site"
//           value={text}
//           onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
//         />
//       ),
//       width: '35%'
//     },
//     {
//       title: 'Category/Type',
//       dataIndex: 'category',
//       key: 'category',
//       render: (text, record) => (
//         <Select
//           style={{ width: '100%' }}
//           placeholder="Select category"
//           value={text || undefined}
//           onChange={(value) => updateExpenseItem(record.key, 'category', value)}
//           allowClear
//         >
//           {requestTypes.map(type => (
//             <Option key={type.value} value={type.value}>
//               {type.label}
//             </Option>
//           ))}
//         </Select>
//       ),
//       width: '30%'
//     },
//     {
//       title: 'Amount (XAF)',
//       dataIndex: 'amount',
//       key: 'amount',
//       render: (text, record) => (
//         <InputNumber
//           style={{ width: '100%' }}
//           min={0}
//           step={1}
//           placeholder="0"
//           value={text}
//           onChange={(value) => updateExpenseItem(record.key, 'amount', value)}
//           formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={(value) => value.replace(/,/g, '')}
//         />
//       ),
//       width: '25%'
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (_, record) => (
//         <Button
//           type="text"
//           danger
//           icon={<DeleteOutlined />}
//           onClick={() => removeExpenseItem(record.key)}
//         />
//       ),
//       width: '10%'
//     }
//   ];

//   return (
//     <Card>
//       <Title level={3}>
//         <DollarOutlined /> New Cash Advance Request
//       </Title>

//       <Alert
//         message="Cash Advance Request Guidelines"
//         description={
//           <div>
//             <Text>
//               Submit this form to request cash advance for upcoming business expenses.
//             </Text>
//             <Divider style={{ margin: '12px 0' }} />
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
//               <li><strong>Supporting Documents:</strong> Optional but recommended</li>
//               <li><strong>Itemized Breakdown:</strong> Optional but helps with faster approval</li>
//               <li><strong>Justification:</strong> Required after disbursement with receipts</li>
//             </ul>
//           </div>
//         }
//         type="info"
//         icon={<InfoCircleOutlined />}
//         showIcon
//         style={{ marginBottom: '24px' }}
//       />

//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12}>
//             <Form.Item
//               name="requestType"
//               label="Expense Type"
//               rules={[{ required: true, message: 'Please select expense type' }]}
//             >
//               <Select placeholder="Select expense type">
//                 {requestTypes.map(type => (
//                   <Option key={type.value} value={type.value}>
//                     {type.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>

//           <Col xs={24} md={12}>
//             <Form.Item
//               name="urgency"
//               label="Urgency Level"
//               rules={[{ required: true, message: 'Please select urgency level' }]}
//             >
//               <Select placeholder="Select urgency level">
//                 <Option value="low">
//                   <Tag color="green">Low</Tag> - Standard processing
//                 </Option>
//                 <Option value="medium">
//                   <Tag color="orange">Medium</Tag> - Moderate priority
//                 </Option>
//                 <Option value="high">
//                   <Tag color="red">High</Tag> - High priority
//                 </Option>
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>

//         {/* Itemized Breakdown Toggle */}
//         <Card 
//           style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//           bodyStyle={{ padding: '16px' }}
//         >
//           <Space direction="vertical" style={{ width: '100%' }}>
//             <Space align="center">
//               <Switch 
//                 checked={useItemizedBreakdown}
//                 onChange={handleToggleItemizedBreakdown}
//               />
//               <Text strong>Add Itemized Breakdown</Text>
//               <Tag color="green" icon={<CheckCircleOutlined />}>
//                 Recommended
//               </Tag>
//               <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better and can speed up approval">
//                 <InfoCircleOutlined style={{ color: '#1890ff' }} />
//               </Tooltip>
//             </Space>
            
//             {!useItemizedBreakdown && (
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Providing detailed breakdown is optional but recommended for transparency
//               </Text>
//             )}
//           </Space>
//         </Card>

//         {/* Amount field */}
//         {!useItemizedBreakdown ? (
//           <Form.Item
//             name="amountRequested"
//             label="Amount Requested (XAF)"
//             rules={[
//               { required: true, message: 'Please enter amount' },
//               { 
//                 validator: (_, value) => {
//                   if (value && value <= 0) {
//                     return Promise.reject('Amount must be greater than 0');
//                   }
//                   return Promise.resolve();
//                 }
//               }
//             ]}
//           >
//             <InputNumber
//               style={{ width: '100%' }}
//               min={0}
//               step={1000}
//               placeholder="Enter requested amount"
//               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               parser={(value) => value.replace(/,/g, '')}
//               onChange={(value) => setManualAmount(value)}
//             />
//           </Form.Item>
//         ) : (
//           <Form.Item
//             name="amountRequested"
//             label="Total Amount (Auto-calculated from breakdown)"
//             rules={[{ required: true, message: 'Please add expense items' }]}
//           >
//             <InputNumber
//               style={{ width: '100%' }}
//               disabled
//               value={itemizedTotal}
//               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               prefix={<DollarOutlined />}
//             />
//           </Form.Item>
//         )}

//         {/* Itemized Expenses Section */}
//         {useItemizedBreakdown && (
//           <Card 
//             title={
//               <Space>
//                 <FileTextOutlined />
//                 <Text strong>Itemized Expenses</Text>
//                 <Tag color="blue">Optional</Tag>
//               </Space>
//             }
//             extra={
//               <Button 
//                 type="primary" 
//                 icon={<PlusOutlined />}
//                 onClick={addExpenseItem}
//                 disabled={itemizedExpenses.length >= 20}
//               >
//                 Add Item
//               </Button>
//             }
//             style={{ marginBottom: '24px' }}
//           >
//             {itemizedExpenses.length === 0 ? (
//               <Alert
//                 message="No expense items added yet"
//                 description="Click 'Add Item' to start adding your itemized expenses"
//                 type="info"
//                 showIcon
//               />
//             ) : (
//               <>
//                 <Table
//                   dataSource={itemizedExpenses}
//                   columns={expenseColumns}
//                   pagination={false}
//                   size="small"
//                   rowKey="key"
//                   summary={() => (
//                     <Table.Summary fixed>
//                       <Table.Summary.Row>
//                         <Table.Summary.Cell index={0} colSpan={2}>
//                           <Text strong>Total Amount</Text>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={1}>
//                           <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                             XAF {itemizedTotal.toLocaleString()}
//                           </Text>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={2} />
//                       </Table.Summary.Row>
//                     </Table.Summary>
//                   )}
//                 />
//               </>
//             )}
//           </Card>
//         )}

//         <Form.Item
//           name="purpose"
//           label="Purpose of Request"
//           rules={[{ 
//             required: true,
//             min: 10,
//             message: 'Please provide a detailed purpose (minimum 10 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={3} 
//             placeholder="Describe the purpose of this cash request"
//             showCount
//             maxLength={500}
//           />
//         </Form.Item>

//         <Form.Item
//           name="businessJustification"
//           label="Business Justification"
//           rules={[{ 
//             required: true,
//             min: 20,
//             message: 'Please provide a detailed justification (minimum 20 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={4} 
//             placeholder="Explain why this expense is necessary for business operations"
//             showCount
//             maxLength={1000}
//           />
//         </Form.Item>

//         <Form.Item
//           name="requiredDate"
//           label="Required By Date"
//           rules={[{ required: true, message: 'Please select required date' }]}
//         >
//           <DatePicker 
//             style={{ width: '100%' }} 
//             disabledDate={(current) => current && current < dayjs().startOf('day')}
//           />
//         </Form.Item>

//         <Form.Item
//           name="projectId"
//           label="Project (Optional)"
//           extra="Select if this expense is for a specific project"
//         >
//           <Select
//             placeholder="Select project"
//             allowClear
//             onChange={(value) => {
//               const project = projects.find(p => p._id === value);
//               setSelectedProject(project);
//             }}
//           >
//             {projects.map(project => (
//               <Option key={project._id} value={project._id}>
//                 {project.code} - {project.name}
//                 {project.budgetCodeId && (
//                   <Text type="secondary" style={{ marginLeft: '8px' }}>
//                     (Budget: XAF {project.budgetCodeId.remaining?.toLocaleString()})
//                   </Text>
//                 )}
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item
//           label="Supporting Documents (Optional)"
//           extra={`Upload any supporting documents (max 10 files, 10MB each). Supported: PDF, Word, Excel, Images`}
//         >
//           <Upload {...uploadProps}>
//             {fileList.length >= 10 ? null : (
//               <Button icon={<UploadOutlined />} block>
//                 Upload Documents ({fileList.length}/10)
//               </Button>
//             )}
//           </Upload>
//           {fileList.length > 0 && (
//             <Alert
//               message={`${fileList.length} file(s) ready to upload`}
//               type="success"
//               showIcon
//               style={{ marginTop: '8px' }}
//             />
//           )}
//         </Form.Item>

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/employee/cash-requests')}>
//               Cancel
//             </Button>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               loading={loading}
//               disabled={loading}
//             >
//               {loading ? 'Submitting...' : 'Submit Request'}
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// export default CashRequestForm;














// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useSelector } from 'react-redux';
// import {
//   Form,
//   Input,
//   Button,
//   Select,
//   DatePicker,
//   InputNumber,
//   Upload,
//   message,
//   Card,
//   Typography,
//   Space,
//   Alert,
//   Table,
//   Divider,
//   Row,
//   Col,
//   Tag,
//   Switch,
//   Tooltip
// } from 'antd';
// import {
//   UploadOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   InfoCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// // ✅ FIXED: Import the correct APIs
// import { cashRequestAPI, projectsAPI, budgetCodesAPI } from '../../services/cashRequestAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const CashRequestForm = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
  
//   // Itemized breakdown state
//   const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
//   const [itemizedExpenses, setItemizedExpenses] = useState([]);
//   const [itemizedTotal, setItemizedTotal] = useState(0);
//   const [manualAmount, setManualAmount] = useState(0);
  
//   const [projects, setProjects] = useState([]);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [selectedProject, setSelectedProject] = useState(null);
  
//   const navigate = useNavigate();
//   const { user } = useSelector((state) => state.auth);

//   const requestTypes = [
//     { value: 'travel', label: 'Travel Expenses' },
//     { value: 'office-supplies', label: 'Office Supplies' },
//     { value: 'client-entertainment', label: 'Client Entertainment' },
//     { value: 'emergency', label: 'Emergency Expenses' },
//     { value: 'project-materials', label: 'Project Materials' },
//     { value: 'training', label: 'Training & Development' },
//     { value: 'accommodation', label: 'Accommodation' },
//     { value: 'perdiem', label: 'Per Diem' },
//     { value: 'bills', label: 'Bills (Electricity, Water, etc.)' },
//     { value: 'staff-transportation', label: 'Staff Transportation' },
//     { value: 'staff-entertainment', label: 'Staff Entertainment' },
//     { value: 'toll-gates', label: 'Toll Gates' },
//     { value: 'office-items', label: 'Office Items' },
//     { value: 'other', label: 'Other' }
//   ];

//   useEffect(() => {
//     fetchProjects();
//     fetchBudgetCodes();
//   }, []);

//   // Calculate itemized total
//   useEffect(() => {
//     if (useItemizedBreakdown) {
//       const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
//       setItemizedTotal(total);
//       form.setFieldValue('amountRequested', total);
//     }
//   }, [itemizedExpenses, useItemizedBreakdown, form]);

//   // ✅ FIXED: Use projectsAPI instead of cashRequestAPI
//   const fetchProjects = async () => {
//     try {
//       const response = await projectsAPI.getActiveProjects();
//       if (response.success) {
//         setProjects(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       message.error('Failed to load projects');
//     }
//   };

//   // ✅ FIXED: Use budgetCodesAPI instead of cashRequestAPI
//   const fetchBudgetCodes = async () => {
//     try {
//       const response = await budgetCodesAPI.getAvailableBudgetCodes();
//       if (response.success) {
//         setBudgetCodes(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error fetching budget codes:', error);
//       message.error('Failed to load budget codes');
//     }
//   };

//   // Itemized breakdown handlers
//   const addExpenseItem = () => {
//     setItemizedExpenses([
//       ...itemizedExpenses,
//       {
//         key: Date.now(),
//         description: '',
//         amount: 0,
//         category: ''
//       }
//     ]);
//   };

//   const removeExpenseItem = (key) => {
//     setItemizedExpenses(itemizedExpenses.filter(item => item.key !== key));
//   };

//   const updateExpenseItem = (key, field, value) => {
//     setItemizedExpenses(itemizedExpenses.map(item => 
//       item.key === key ? { ...item, [field]: value } : item
//     ));
//   };

//   const handleToggleItemizedBreakdown = (checked) => {
//     setUseItemizedBreakdown(checked);
//     if (!checked) {
//       setItemizedExpenses([]);
//       setItemizedTotal(0);
//     } else {
//       const currentAmount = form.getFieldValue('amountRequested');
//       setManualAmount(currentAmount || 0);
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       console.log('\n=== 🚀 SUBMITTING CASH REQUEST ===');
//       console.log('Form Values:', values);
//       console.log('Files to upload:', fileList.length);

//       // Validation for itemized breakdown
//       if (useItemizedBreakdown) {
//         if (itemizedExpenses.length === 0) {
//           message.error('Please add at least one expense item or disable itemized breakdown');
//           return;
//         }

//         const invalidItems = itemizedExpenses.filter(item => 
//           !item.description || !item.amount || parseFloat(item.amount) <= 0
//         );

//         if (invalidItems.length > 0) {
//           message.error('All expense items must have a description and valid amount');
//           return;
//         }

//         const discrepancy = Math.abs(itemizedTotal - parseFloat(values.amountRequested));
//         if (discrepancy > 1) {
//           message.error(
//             `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match requested amount (XAF ${parseFloat(values.amountRequested).toLocaleString()})`
//           );
//           return;
//         }
//       }

//       setLoading(true);

//       const formData = new FormData();
      
//       // Add basic fields
//       formData.append('requestMode', 'advance');
//       formData.append('requestType', values.requestType);
//       formData.append('amountRequested', values.amountRequested);
//       formData.append('purpose', values.purpose);
//       formData.append('businessJustification', values.businessJustification);
//       formData.append('urgency', values.urgency);
//       formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

//       // Add itemized breakdown if used
//       if (useItemizedBreakdown && itemizedExpenses.length > 0) {
//         const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
//         formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
//         console.log('📋 Itemized breakdown:', cleanedBreakdown);
//       }

//       // Add project if selected
//       if (values.projectId) {
//         formData.append('projectId', values.projectId);
//         console.log('📁 Project ID:', values.projectId);
//       }

//       // ✅ Add files properly - check for originFileObj
//       if (fileList && fileList.length > 0) {
//         console.log(`\n📎 Adding ${fileList.length} file(s) to FormData...`);
        
//         fileList.forEach((file, index) => {
//           if (file.originFileObj) {
//             formData.append('attachments', file.originFileObj, file.name);
//             console.log(`   ${index + 1}. ✓ Added: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
//           } else {
//             console.warn(`   ${index + 1}. ⚠️  No originFileObj for: ${file.name}`);
//           }
//         });
//       } else {
//         console.log('📎 No attachments to upload');
//       }

//       // Debug: Log FormData contents
//       console.log('\n📦 FormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[1] instanceof File) {
//           console.log(`   ${pair[0]}: [File] ${pair[1].name} (${(pair[1].size / 1024).toFixed(2)} KB)`);
//         } else {
//           console.log(`   ${pair[0]}:`, pair[1]);
//         }
//       }

//       console.log('\n🌐 Sending request to backend...');
//       const response = await cashRequestAPI.create(formData);

//       console.log('\n✅ Response received:', response);

//       if (response.success) {
//         message.success({
//           content: (
//             <div>
//               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                 ✅ Cash request submitted successfully!
//               </div>
//               {response.metadata && (
//                 <div style={{ fontSize: '12px', marginTop: '8px' }}>
//                   {response.metadata.attachmentsUploaded > 0 && (
//                     <div>📎 {response.metadata.attachmentsUploaded} document(s) uploaded</div>
//                   )}
//                   {response.metadata.hasItemizedBreakdown && (
//                     <div>📋 Itemized breakdown included</div>
//                   )}
//                   <div>🔄 {response.metadata.approvalLevels} approval levels required</div>
//                 </div>
//               )}
//             </div>
//           ),
//           duration: 5
//         });
        
//         setTimeout(() => {
//           navigate('/employee/cash-requests');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Request submission failed');
//       }

//     } catch (error) {
//       console.error('\n❌ Submission error:', error);
//       console.error('Error details:', {
//         message: error.message,
//         response: error.response?.data,
//         status: error.response?.status
//       });

//       const errorMessage = error.response?.data?.message || error.message || 'Failed to submit request. Please try again.';
      
//       message.error({
//         content: errorMessage,
//         duration: 5
//       });
//     } finally {
//       setLoading(false);
//       console.log('=== 🏁 SUBMISSION COMPLETED ===\n');
//     }
//   };

//   const uploadProps = {
//     onRemove: (file) => {
//       console.log('🗑️  Removing file:', file.name);
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     },
//     beforeUpload: (file) => {
//       console.log('\n📤 Before upload:', file.name);
//       console.log('   Size:', (file.size / 1024).toFixed(2), 'KB');
//       console.log('   Type:', file.type);

//       // Validate file size (10MB limit)
//       const isLt10M = file.size / 1024 / 1024 < 10;
//       if (!isLt10M) {
//         message.error(`${file.name} is too large. Maximum size is 10MB.`);
//         return Upload.LIST_IGNORE;
//       }

//       // Validate file type
//       const allowedTypes = [
//         'image/jpeg',
//         'image/png',
//         'image/gif',
//         'application/pdf',
//         'application/msword',
//         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
//         'application/vnd.ms-excel',
//         'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
//       ];

//       if (!allowedTypes.includes(file.type)) {
//         message.error(`${file.name} is not a supported file type`);
//         return Upload.LIST_IGNORE;
//       }

//       // Check file limit
//       if (fileList.length >= 10) {
//         message.error('Maximum 10 files allowed');
//         return Upload.LIST_IGNORE;
//       }

//       console.log('   ✅ File validation passed');
      
//       // ✅ FIX: Create proper file object with originFileObj
//       const fileWithOrigin = {
//         uid: file.uid || `${Date.now()}-${Math.random()}`,
//         name: file.name,
//         status: 'done',
//         size: file.size,
//         type: file.type,
//         originFileObj: file, // ✅ CRITICAL: Store the actual File object
//         thumbUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
//       };
      
//       setFileList([...fileList, fileWithOrigin]);
      
//       return false; // Prevent auto-upload
//     },
//     fileList,
//     multiple: true,
//     listType: 'picture',
//     maxCount: 10,
//     accept: '.jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.xls,.xlsx'
//   };

//   // Expense columns for itemized table
//   const expenseColumns = [
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (text, record) => (
//         <Input
//           placeholder="e.g., Transportation to client site"
//           value={text}
//           onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
//         />
//       ),
//       width: '35%'
//     },
//     {
//       title: 'Category/Type',
//       dataIndex: 'category',
//       key: 'category',
//       render: (text, record) => (
//         <Select
//           style={{ width: '100%' }}
//           placeholder="Select category"
//           value={text || undefined}
//           onChange={(value) => updateExpenseItem(record.key, 'category', value)}
//           allowClear
//         >
//           {requestTypes.map(type => (
//             <Option key={type.value} value={type.value}>
//               {type.label}
//             </Option>
//           ))}
//         </Select>
//       ),
//       width: '30%'
//     },
//     {
//       title: 'Amount (XAF)',
//       dataIndex: 'amount',
//       key: 'amount',
//       render: (text, record) => (
//         <InputNumber
//           style={{ width: '100%' }}
//           min={0}
//           step={1}
//           placeholder="0"
//           value={text}
//           onChange={(value) => updateExpenseItem(record.key, 'amount', value)}
//           formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={(value) => value.replace(/,/g, '')}
//         />
//       ),
//       width: '25%'
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (_, record) => (
//         <Button
//           type="text"
//           danger
//           icon={<DeleteOutlined />}
//           onClick={() => removeExpenseItem(record.key)}
//         />
//       ),
//       width: '10%'
//     }
//   ];

//   return (
//     <Card>
//       <Title level={3}>
//         <DollarOutlined /> New Cash Advance Request
//       </Title>

//       <Alert
//         message="Cash Advance Request Guidelines"
//         description={
//           <div>
//             <Text>
//               Submit this form to request cash advance for upcoming business expenses.
//             </Text>
//             <Divider style={{ margin: '12px 0' }} />
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
//               <li><strong>Supporting Documents:</strong> Optional but recommended</li>
//               <li><strong>Itemized Breakdown:</strong> Optional but helps with faster approval</li>
//               <li><strong>Justification:</strong> Required after disbursement with receipts</li>
//             </ul>
//           </div>
//         }
//         type="info"
//         icon={<InfoCircleOutlined />}
//         showIcon
//         style={{ marginBottom: '24px' }}
//       />

//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12}>
//             <Form.Item
//               name="requestType"
//               label="Expense Type"
//               rules={[{ required: true, message: 'Please select expense type' }]}
//             >
//               <Select placeholder="Select expense type">
//                 {requestTypes.map(type => (
//                   <Option key={type.value} value={type.value}>
//                     {type.label}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>

//           <Col xs={24} md={12}>
//             <Form.Item
//               name="urgency"
//               label="Urgency Level"
//               rules={[{ required: true, message: 'Please select urgency level' }]}
//             >
//               <Select placeholder="Select urgency level">
//                 <Option value="low">
//                   <Tag color="green">Low</Tag> - Standard processing
//                 </Option>
//                 <Option value="medium">
//                   <Tag color="orange">Medium</Tag> - Moderate priority
//                 </Option>
//                 <Option value="high">
//                   <Tag color="red">High</Tag> - High priority
//                 </Option>
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>

//         {/* Itemized Breakdown Toggle */}
//         <Card 
//           style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//           bodyStyle={{ padding: '16px' }}
//         >
//           <Space direction="vertical" style={{ width: '100%' }}>
//             <Space align="center">
//               <Switch 
//                 checked={useItemizedBreakdown}
//                 onChange={handleToggleItemizedBreakdown}
//               />
//               <Text strong>Add Itemized Breakdown</Text>
//               <Tag color="green" icon={<CheckCircleOutlined />}>
//                 Recommended
//               </Tag>
//               <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better and can speed up approval">
//                 <InfoCircleOutlined style={{ color: '#1890ff' }} />
//               </Tooltip>
//             </Space>
            
//             {!useItemizedBreakdown && (
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Providing detailed breakdown is optional but recommended for transparency
//               </Text>
//             )}
//           </Space>
//         </Card>

//         {/* Amount field */}
//         {!useItemizedBreakdown ? (
//           <Form.Item
//             name="amountRequested"
//             label="Amount Requested (XAF)"
//             rules={[
//               { required: true, message: 'Please enter amount' },
//               { 
//                 validator: (_, value) => {
//                   if (value && value <= 0) {
//                     return Promise.reject('Amount must be greater than 0');
//                   }
//                   return Promise.resolve();
//                 }
//               }
//             ]}
//           >
//             <InputNumber
//               style={{ width: '100%' }}
//               min={0}
//               step={1000}
//               placeholder="Enter requested amount"
//               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               parser={(value) => value.replace(/,/g, '')}
//               onChange={(value) => setManualAmount(value)}
//             />
//           </Form.Item>
//         ) : (
//           <Form.Item
//             name="amountRequested"
//             label="Total Amount (Auto-calculated from breakdown)"
//             rules={[{ required: true, message: 'Please add expense items' }]}
//           >
//             <InputNumber
//               style={{ width: '100%' }}
//               disabled
//               value={itemizedTotal}
//               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               prefix={<DollarOutlined />}
//             />
//           </Form.Item>
//         )}

//         {/* Itemized Expenses Section */}
//         {useItemizedBreakdown && (
//           <Card 
//             title={
//               <Space>
//                 <FileTextOutlined />
//                 <Text strong>Itemized Expenses</Text>
//                 <Tag color="blue">Optional</Tag>
//               </Space>
//             }
//             extra={
//               <Button 
//                 type="primary" 
//                 icon={<PlusOutlined />}
//                 onClick={addExpenseItem}
//                 disabled={itemizedExpenses.length >= 20}
//               >
//                 Add Item
//               </Button>
//             }
//             style={{ marginBottom: '24px' }}
//           >
//             {itemizedExpenses.length === 0 ? (
//               <Alert
//                 message="No expense items added yet"
//                 description="Click 'Add Item' to start adding your itemized expenses"
//                 type="info"
//                 showIcon
//               />
//             ) : (
//               <>
//                 <Table
//                   dataSource={itemizedExpenses}
//                   columns={expenseColumns}
//                   pagination={false}
//                   size="small"
//                   rowKey="key"
//                   summary={() => (
//                     <Table.Summary fixed>
//                       <Table.Summary.Row>
//                         <Table.Summary.Cell index={0} colSpan={2}>
//                           <Text strong>Total Amount</Text>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={1}>
//                           <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                             XAF {itemizedTotal.toLocaleString()}
//                           </Text>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={2} />
//                       </Table.Summary.Row>
//                     </Table.Summary>
//                   )}
//                 />
//               </>
//             )}
//           </Card>
//         )}

//         <Form.Item
//           name="purpose"
//           label="Purpose of Request"
//           rules={[{ 
//             required: true,
//             min: 10,
//             message: 'Please provide a detailed purpose (minimum 10 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={3} 
//             placeholder="Describe the purpose of this cash request"
//             showCount
//             maxLength={500}
//           />
//         </Form.Item>

//         <Form.Item
//           name="businessJustification"
//           label="Business Justification"
//           rules={[{ 
//             required: true,
//             min: 20,
//             message: 'Please provide a detailed justification (minimum 20 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={4} 
//             placeholder="Explain why this expense is necessary for business operations"
//             showCount
//             maxLength={1000}
//           />
//         </Form.Item>

//         <Form.Item
//           name="requiredDate"
//           label="Required By Date"
//           rules={[{ required: true, message: 'Please select required date' }]}
//         >
//           <DatePicker 
//             style={{ width: '100%' }} 
//             disabledDate={(current) => current && current < dayjs().startOf('day')}
//           />
//         </Form.Item>

//         <Form.Item
//           name="projectId"
//           label="Project (Optional)"
//           extra="Select if this expense is for a specific project"
//         >
//           <Select
//             placeholder="Select project"
//             allowClear
//             onChange={(value) => {
//               const project = projects.find(p => p._id === value);
//               setSelectedProject(project);
//             }}
//           >
//             {projects.map(project => (
//               <Option key={project._id} value={project._id}>
//                 {project.code} - {project.name}
//                 {project.budgetCodeId && (
//                   <Text type="secondary" style={{ marginLeft: '8px' }}>
//                     (Budget: XAF {project.budgetCodeId.remaining?.toLocaleString()})
//                   </Text>
//                 )}
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Form.Item
//           label="Supporting Documents (Optional)"
//           extra={`Upload any supporting documents (max 10 files, 10MB each). Supported: PDF, Word, Excel, Images`}
//         >
//           <Upload {...uploadProps}>
//             {fileList.length >= 10 ? null : (
//               <Button icon={<UploadOutlined />} block>
//                 Upload Documents ({fileList.length}/10)
//               </Button>
//             )}
//           </Upload>
//           {fileList.length > 0 && (
//             <Alert
//               message={`${fileList.length} file(s) ready to upload`}
//               type="success"
//               showIcon
//               style={{ marginTop: '8px' }}
//             />
//           )}
//         </Form.Item>

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/employee/cash-requests')}>
//               Cancel
//             </Button>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               loading={loading}
//               disabled={loading}
//             >
//               {loading ? 'Submitting...' : 'Submit Request'}
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// export default CashRequestForm;



