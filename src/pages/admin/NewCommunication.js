import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  Radio,
  DatePicker,
  Upload,
  message,
  Divider,
  Alert,
  Tag,
  Typography,
  Row,
  Col,
  Checkbox,
  Modal,
  Spin
} from 'antd';
import {
  SendOutlined,
  SaveOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  TeamOutlined
} from '@ant-design/icons';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const NewCommunication = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState('');
  const [fileList, setFileList] = useState([]);
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Load template if passed via navigation state
  useEffect(() => {
    if (location.state?.template) {
      const template = location.state.template;
      form.setFieldsValue({
        title: template.title,
        messageType: template.messageType,
        priority: template.priority,
        targetType: template.recipients?.targetType,
        departments: template.recipients?.departments,
        roles: template.recipients?.roles,
        deliveryEmail: template.deliveryMethod?.email,
        deliveryInApp: template.deliveryMethod?.inApp
      });
      setContent(template.content);
    }
  }, [location.state]);

  // Preview recipients count
  const handlePreviewRecipients = async () => {
    try {
      const values = await form.validateFields(['targetType', 'departments', 'roles', 'users']);
      
      setPreviewLoading(true);
      const response = await api.post('/communications/preview-recipients', {
        recipients: {
          targetType: values.targetType,
          departments: values.departments,
          roles: values.roles,
          users: values.users
        }
      });
      
      setRecipientPreview(response.data.data);
      message.success(`Will be sent to ${response.data.data.count} recipients`);
    } catch (error) {
      if (error.response) {
        message.error(error.response.data.message || 'Failed to preview recipients');
      }
    } finally {
      setPreviewLoading(false);
    }
  };

  // Handle file upload
  const handleFileChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const beforeUpload = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('File must be smaller than 10MB!');
      return Upload.LIST_IGNORE;
    }
    return false; // Prevent auto upload
  };

  // Submit form
  const handleSubmit = async (values, action) => {
    if (!content || content.trim() === '') {
      message.error('Please enter message content');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('content', content);
      formData.append('messageType', values.messageType);
      formData.append('priority', values.priority);
      
      formData.append('recipients', JSON.stringify({
        targetType: values.targetType,
        departments: values.departments || [],
        roles: values.roles || [],
        users: values.users || []
      }));
      
      formData.append('deliveryMethod', JSON.stringify({
        email: values.deliveryEmail !== false,
        inApp: values.deliveryInApp || false
      }));
      
      if (values.tags) {
        formData.append('tags', values.tags);
      }
      
      if (action === 'schedule' && values.scheduledFor) {
        formData.append('scheduledFor', values.scheduledFor.toISOString());
      }

      // Append attachments
      fileList.forEach((file) => {
        formData.append('attachments', file.originFileObj);
      });

      // Create communication
      const response = await api.post('/communications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const communicationId = response.data.data._id;

      // Send immediately if requested
      if (action === 'send') {
        await api.post(`/communications/${communicationId}/send`);
        message.success('Message is being sent!');
      } else if (action === 'schedule') {
        message.success('Message scheduled successfully!');
      } else {
        message.success('Draft saved successfully!');
      }

      navigate('/admin/communications');
    } catch (error) {
      console.error('Error creating communication:', error);
      message.error(error.response?.data?.message || 'Failed to create communication');
    } finally {
      setLoading(false);
    }
  };

  // Rich text editor modules
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <SendOutlined /> New Communication
        </Title>
        <Text type="secondary">
          Compose and send messages to employees across the organization
        </Text>
        
        <Divider />

        <Form
          form={form}
          layout="vertical"
          initialValues={{
            messageType: 'general',
            priority: 'normal',
            targetType: 'all',
            deliveryEmail: true,
            deliveryInApp: false
          }}
        >
          <Row gutter={24}>
            {/* Left Column */}
            <Col xs={24} lg={16}>
              {/* Basic Information */}
              <Card 
                title="Message Details" 
                size="small" 
                style={{ marginBottom: '16px' }}
              >
                <Form.Item
                  name="title"
                  label="Subject / Title"
                  rules={[
                    { required: true, message: 'Please enter a title' },
                    { max: 200, message: 'Title cannot exceed 200 characters' }
                  ]}
                >
                  <Input 
                    placeholder="e.g., Important Policy Update - Read Immediately"
                    size="large"
                  />
                </Form.Item>

                <Row gutter={16}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="messageType"
                      label="Message Type"
                      rules={[{ required: true }]}
                    >
                      <Select placeholder="Select type" size="large">
                        <Option value="general">General Message</Option>
                        <Option value="announcement">📢 Announcement</Option>
                        <Option value="policy">📋 Policy Update</Option>
                        <Option value="emergency">🚨 Emergency Alert</Option>
                        <Option value="newsletter">📰 Newsletter</Option>
                        <Option value="training">🎓 Training</Option>
                        <Option value="event">📅 Event</Option>
                      </Select>
                    </Form.Item>
                  </Col>

                  <Col xs={24} sm={12}>
                    <Form.Item
                      name="priority"
                      label="Priority Level"
                      rules={[{ required: true }]}
                    >
                      <Radio.Group size="large" buttonStyle="solid">
                        <Radio.Button value="normal">Normal</Radio.Button>
                        <Radio.Button value="important">⚠️ Important</Radio.Button>
                        <Radio.Button value="urgent">🚨 Urgent</Radio.Button>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="Message Content"
                  required
                >
                  <ReactQuill
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    modules={quillModules}
                    style={{ height: '300px', marginBottom: '50px' }}
                    placeholder="Write your message here..."
                  />
                </Form.Item>

                <Form.Item
                  label="Attachments (Optional)"
                  extra="Maximum 10 files, each up to 10MB"
                >
                  <Upload
                    fileList={fileList}
                    onChange={handleFileChange}
                    beforeUpload={beforeUpload}
                    multiple
                    maxCount={10}
                  >
                    <Button icon={<UploadOutlined />}>
                      Select Files
                    </Button>
                  </Upload>
                </Form.Item>

                <Form.Item
                  name="tags"
                  label="Tags (Optional)"
                  extra="Comma-separated tags for organization"
                >
                  <Input placeholder="e.g., hr, policy, 2024" />
                </Form.Item>
              </Card>
            </Col>

            {/* Right Column */}
            <Col xs={24} lg={8}>
              {/* Recipients */}
              <Card 
                title="Recipients" 
                size="small"
                extra={
                  <Button
                    size="small"
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={handlePreviewRecipients}
                    loading={previewLoading}
                  >
                    Preview
                  </Button>
                }
                style={{ marginBottom: '16px' }}
              >
                <Form.Item
                  name="targetType"
                  label="Send To"
                  rules={[{ required: true }]}
                >
                  <Radio.Group>
                    <Space direction="vertical">
                      <Radio value="all">
                        <TeamOutlined /> All Employees
                      </Radio>
                      <Radio value="department">Specific Departments</Radio>
                      <Radio value="role">Specific Roles</Radio>
                      <Radio value="custom">Custom Selection</Radio>
                    </Space>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues.targetType !== currentValues.targetType
                  }
                >
                  {({ getFieldValue }) => {
                    const targetType = getFieldValue('targetType');
                    
                    if (targetType === 'department') {
                      return (
                        <Form.Item
                          name="departments"
                          label="Select Departments"
                          rules={[{ required: true, message: 'Please select at least one department' }]}
                        >
                          <Checkbox.Group
                            options={[
                              { label: 'Finance', value: 'Finance' },
                              { label: 'HR', value: 'HR' },
                              { label: 'IT', value: 'IT' },
                              { label: 'Supply Chain', value: 'Supply Chain' },
                              { label: 'Technical', value: 'Technical' },
                              { label: 'Company', value: 'Company' }
                            ]}
                          />
                        </Form.Item>
                      );
                    }
                    
                    if (targetType === 'role') {
                      return (
                        <Form.Item
                          name="roles"
                          label="Select Roles"
                          rules={[{ required: true, message: 'Please select at least one role' }]}
                        >
                          <Checkbox.Group
                            options={[
                              { label: 'Employees', value: 'employee' },
                              { label: 'Supervisors', value: 'supervisor' },
                              { label: 'Finance', value: 'finance' },
                              { label: 'HR', value: 'hr' },
                              { label: 'IT', value: 'it' },
                              { label: 'Supply Chain', value: 'supply_chain' },
                              { label: 'Buyers', value: 'buyer' },
                              { label: 'Admins', value: 'admin' }
                            ]}
                          />
                        </Form.Item>
                      );
                    }
                    
                    if (targetType === 'custom') {
                      return (
                        <Alert
                          message="Custom selection coming soon"
                          description="This feature will allow selecting specific users"
                          type="info"
                          showIcon
                        />
                      );
                    }
                    
                    return null;
                  }}
                </Form.Item>

                {recipientPreview && (
                  <Alert
                    message={`${recipientPreview.count} recipients will receive this message`}
                    type="success"
                    showIcon
                    style={{ marginTop: '12px' }}
                    action={
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => setPreviewModalVisible(true)}
                      >
                        View
                      </Button>
                    }
                  />
                )}
              </Card>

              {/* Delivery Options */}
              <Card 
                title="Delivery Options" 
                size="small"
                style={{ marginBottom: '16px' }}
              >
                <Form.Item
                  name="deliveryEmail"
                  valuePropName="checked"
                >
                  <Checkbox>Send via Email</Checkbox>
                </Form.Item>

                <Form.Item
                  name="deliveryInApp"
                  valuePropName="checked"
                >
                  <Checkbox>Create In-App Notification</Checkbox>
                </Form.Item>

                <Alert
                  message="Email delivery is recommended"
                  description="Email ensures all employees receive the message even when not logged in"
                  type="info"
                  showIcon
                  style={{ fontSize: '12px' }}
                />
              </Card>

              {/* Scheduling */}
              <Card 
                title="Schedule (Optional)" 
                size="small"
                style={{ marginBottom: '16px' }}
              >
                <Form.Item
                  name="scheduledFor"
                  label="Schedule for later"
                  extra="Leave empty to save as draft"
                >
                  <DatePicker
                    showTime
                    format="YYYY-MM-DD HH:mm"
                    disabledDate={(current) => {
                      return current && current < moment().startOf('day');
                    }}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Card>

              {/* Action Buttons */}
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    size="large"
                    icon={<SendOutlined />}
                    onClick={() => form.validateFields().then(() => handleSubmit(form.getFieldsValue(), 'send'))}
                    loading={loading}
                    block
                  >
                    Send Immediately
                  </Button>

                  <Button
                    size="large"
                    icon={<ClockCircleOutlined />}
                    onClick={() => form.validateFields().then(() => handleSubmit(form.getFieldsValue(), 'schedule'))}
                    loading={loading}
                    block
                  >
                    Schedule for Later
                  </Button>

                  <Button
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={() => handleSubmit(form.getFieldsValue(), 'draft')}
                    loading={loading}
                    block
                  >
                    Save as Draft
                  </Button>

                  <Button
                    size="large"
                    onClick={() => navigate(-1)}
                    block
                  >
                    Cancel
                  </Button>
                </Space>
              </Card>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Recipient Preview Modal */}
      <Modal
        title="Recipient Preview"
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        footer={null}
        width={600}
      >
        {recipientPreview && (
          <div>
            <Alert
              message={`Total: ${recipientPreview.count} recipients`}
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Text strong>Sample Recipients:</Text>
            <div style={{ marginTop: '12px' }}>
              {recipientPreview.preview?.map((recipient, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #f0f0f0' 
                  }}
                >
                  <Text strong>{recipient.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {recipient.email} • {recipient.department} • {recipient.role}
                  </Text>
                </div>
              ))}
            </div>
            
            {recipientPreview.count > 10 && (
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '12px', display: 'block' }}>
                Showing first 10 of {recipientPreview.count} recipients
              </Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NewCommunication;