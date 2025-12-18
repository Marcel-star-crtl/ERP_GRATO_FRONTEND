import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  Timeline
} from 'antd';
import {
  UploadOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  EditOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const EditCashRequestForm = () => {
  const { requestId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [request, setRequest] = useState(null);
  const [editHistory, setEditHistory] = useState([]);
  
  // Itemized breakdown state
  const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
  const [itemizedExpenses, setItemizedExpenses] = useState([]);
  const [itemizedTotal, setItemizedTotal] = useState(0);
  
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  
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

  useEffect(() => {
    fetchRequestData();
    fetchProjects();
  }, [requestId]);

  // Calculate itemized total
  useEffect(() => {
    if (useItemizedBreakdown) {
      const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
      setItemizedTotal(total);
      form.setFieldValue('amountRequested', total);
    }
  }, [itemizedExpenses, useItemizedBreakdown, form]);

  const fetchRequestData = async () => {
    try {
      setLoading(true);
      
      // Fetch request details
      const response = await api.get(`/cash-requests/${requestId}`);
      
      if (response.data.success) {
        const requestData = response.data.data;
        setRequest(requestData);
        
        // Pre-fill form
        form.setFieldsValue({
          requestType: requestData.requestType,
          amountRequested: requestData.amountRequested,
          purpose: requestData.purpose,
          businessJustification: requestData.businessJustification,
          urgency: requestData.urgency,
          requiredDate: requestData.requiredDate ? dayjs(requestData.requiredDate) : null,
          projectId: requestData.projectId?._id || null
        });
        
        // Pre-fill itemized breakdown if exists
        if (requestData.itemizedBreakdown && requestData.itemizedBreakdown.length > 0) {
          setUseItemizedBreakdown(true);
          setItemizedExpenses(requestData.itemizedBreakdown.map((item, index) => ({
            ...item,
            key: Date.now() + index
          })));
        }
        
        // Fetch edit history
        const historyResponse = await api.get(`/cash-requests/${requestId}/edit-history`);
        if (historyResponse.data.success) {
          setEditHistory(historyResponse.data.data.editHistory || []);
        }
      }
    } catch (error) {
      console.error('Error fetching request:', error);
      message.error('Failed to load request data');
      navigate('/employee/cash-requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects/active');
      if (response.data.success) {
        setProjects(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // Itemized breakdown handlers (same as create form)
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
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log('\n=== EDITING CASH REQUEST ===');
      console.log('Request ID:', requestId);
      console.log('Form Values:', values);

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
            `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match requested amount`
          );
          return;
        }
      }

      setSubmitting(true);

      const formData = new FormData();
      
      // Add basic fields
      formData.append('requestType', values.requestType);
      formData.append('amountRequested', values.amountRequested);
      formData.append('purpose', values.purpose);
      formData.append('businessJustification', values.businessJustification);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));
      
      // Add edit reason
      formData.append('editReason', values.editReason || 'User edited request');

      // Add itemized breakdown if used
      if (useItemizedBreakdown && itemizedExpenses.length > 0) {
        const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
        formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
      }

      // Add project if selected
      if (values.projectId) {
        formData.append('projectId', values.projectId);
      }

      // Add NEW attachments only
      if (fileList && fileList.length > 0) {
        fileList.forEach((file) => {
          if (file.originFileObj) {
            formData.append('attachments', file.originFileObj, file.name);
          }
        });
      }

      console.log('Sending edit request...');
      const response = await api.put(`/cash-requests/${requestId}/edit`, formData);

      if (response.data.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Request edited and resubmitted successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>Edit #{response.data.metadata.totalEdits}</div>
                <div>Approval chain reset to Level 1</div>
              </div>
            </div>
          ),
          duration: 5
        });
        
        setTimeout(() => {
          navigate('/employee/cash-requests');
        }, 1500);
      }

    } catch (error) {
      console.error('Edit error:', error);
      message.error({
        content: error.response?.data?.message || 'Failed to edit request',
        duration: 5
      });
    } finally {
      setSubmitting(false);
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
        message.error(`${file.originalname} is too large. Maximum size is 10MB.`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length >= 10) {
        message.error('Maximum 10 new files allowed');
        return Upload.LIST_IGNORE;
      }

      const fileWithOrigin = {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        size: file.size,
        type: file.mimetype,
        originFileObj: file
      };
      
      setFileList([...fileList, fileWithOrigin]);
      return false;
    },
    fileList,
    multiple: true,
    listType: 'picture',
    maxCount: 10
  };

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

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading request data...</div>
      </div>
    );
  }

  return (
    <Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={3} style={{ margin: 0 }}>
          <EditOutlined /> Edit Cash Request
        </Title>
        <Space>
          <Text type="secondary">
            REQ-{requestId.slice(-6).toUpperCase()}
          </Text>
          {request?.totalEdits > 0 && (
            <Tag color="orange">Edit #{request.totalEdits + 1}</Tag>
          )}
        </Space>
      </div>

      {/* Edit Warning Alert */}
      <Alert
        message="Editing This Request"
        description={
          <div>
            <p><strong>Important:</strong> When you submit your edits:</p>
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>The approval process will restart from Level 1 (Supervisor)</li>
              <li>All previous approval decisions will be reset</li>
              <li>Your changes will be tracked in the edit history</li>
              <li>Approvers will be notified that this is an edited request</li>
            </ul>
          </div>
        }
        type="warning"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />

      {/* Show Edit History */}
      {editHistory && editHistory.length > 0 && (
        <>
          <Divider orientation="left">
            <Title level={5} style={{ margin: 0 }}>
              <HistoryOutlined /> Edit History ({editHistory.length} previous edit{editHistory.length > 1 ? 's' : ''})
            </Title>
          </Divider>
          
          <Timeline style={{ marginBottom: '24px' }}>
            {editHistory.map((edit, index) => (
              <Timeline.Item key={index} color="blue">
                <div>
                  <Text strong>Edit #{edit.editNumber}</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(edit.editedAt).toLocaleString('en-GB', { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </Text>
                  <br />
                  <Text type="secondary">Previous Status: {edit.previousStatus?.replace(/_/g, ' ')}</Text>
                  {edit.reason && (
                    <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                      <Text italic>Reason: "{edit.reason}"</Text>
                    </div>
                  )}
                  {edit.changes && Object.keys(edit.changes).length > 0 && (
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary">
                        Fields changed: {Object.keys(edit.changes).join(', ')}
                      </Text>
                    </div>
                  )}
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
          
          <Divider />
        </>
      )}

      {/* Show Existing Attachments */}
      {request?.attachments && request.attachments.length > 0 && (
        <Alert
          message="Existing Attachments"
          description={
            <div>
              <p>This request has {request.attachments.length} existing attachment(s). They will be kept unless you delete the entire request.</p>
              <div style={{ marginTop: '8px' }}>
                {request.attachments.map((file, index) => (
                  <Tag key={index} color="blue" style={{ marginBottom: '4px' }}>
                    {file.name}
                  </Tag>
                ))}
              </div>
            </div>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

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
              <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </Space>
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

        {/* Edit Reason */}
        <Form.Item
          name="editReason"
          label="Reason for Edit (Optional but Recommended)"
          extra="Explain why you're editing this request - helps approvers understand the changes"
        >
          <TextArea 
            rows={2} 
            placeholder="e.g., Correcting amount, Adding more details, Changing expense type, etc."
            showCount
            maxLength={200}
          />
        </Form.Item>

        {/* New Attachments */}
        <Form.Item
          label="Add New Supporting Documents (Optional)"
          extra="Upload additional documents. Existing attachments will be kept."
        >
          <Upload {...uploadProps}>
            {fileList.length >= 10 ? null : (
              <Button icon={<UploadOutlined />} block>
                Add New Documents ({fileList.length}/10)
              </Button>
            )}
          </Upload>
          {fileList.length > 0 && (
            <Alert
              message={`${fileList.length} new file(s) will be added`}
              type="success"
              showIcon
              style={{ marginTop: '8px' }}
            />
          )}
        </Form.Item>

        {/* Submit Buttons */}
        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/employee/cash-requests')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={submitting}
              disabled={submitting}
              icon={<EditOutlined />}
            >
              {submitting ? 'Saving Changes...' : 'Save Changes & Resubmit'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default EditCashRequestForm;