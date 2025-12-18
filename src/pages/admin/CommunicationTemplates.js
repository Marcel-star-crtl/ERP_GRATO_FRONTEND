import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Row,
  Col,
  Button,
  Space,
  Tag,
  Typography,
  Empty,
  Modal,
  Form,
  Input,
  message,
  Spin,
  Tooltip,
  Dropdown,
  Menu,
  Badge
} from 'antd';
import {
  FileTextOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  EyeOutlined,
  MoreOutlined,
  SaveOutlined,
  SendOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const CommunicationTemplates = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [saveTemplateModalVisible, setSaveTemplateModalVisible] = useState(false);
  const [selectedCommunication, setSelectedCommunication] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/communications/templates/list');
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleUseTemplate = (template) => {
    const basePath = user.role === 'admin' ? '/admin' : '/hr';
    navigate(`${basePath}/communications/new`, {
      state: {
        template: {
          title: template.title,
          content: template.content,
          messageType: template.messageType,
          priority: template.priority,
          recipients: template.recipients,
          deliveryMethod: template.deliveryMethod
        }
      }
    });
  };

  const handleSaveAsTemplate = async (values) => {
    try {
      if (!selectedCommunication) return;
      
      await api.post(`/communications/${selectedCommunication._id}/save-template`, {
        templateName: values.templateName
      });
      
      message.success('Template saved successfully');
      setSaveTemplateModalVisible(false);
      form.resetFields();
      fetchTemplates();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = (templateId) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/communications/${templateId}`);
          message.success('Template deleted');
          fetchTemplates();
        } catch (error) {
          message.error('Failed to delete template');
        }
      }
    });
  };

  const getActionMenu = (template) => (
    <Menu>
      <Menu.Item
        key="use"
        icon={<CopyOutlined />}
        onClick={() => handleUseTemplate(template)}
      >
        Use Template
      </Menu.Item>
      
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => {
          const basePath = user.role === 'admin' ? '/admin' : '/hr';
          navigate(`${basePath}/communications/${template._id}`);
        }}
      >
        View Details
      </Menu.Item>
      
      <Menu.Divider />
      
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => handleDeleteTemplate(template._id)}
        disabled={template.sender?._id !== user._id && user.role !== 'admin'}
      >
        Delete
      </Menu.Item>
    </Menu>
  );

  const getTypeColor = (type) => {
    const colors = {
      announcement: 'blue',
      policy: 'purple',
      emergency: 'red',
      newsletter: 'green',
      general: 'default',
      training: 'orange',
      event: 'cyan'
    };
    return colors[type] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      urgent: 'red',
      important: 'orange',
      normal: 'default'
    };
    return colors[priority] || 'default';
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={2}>
              <FileTextOutlined /> Message Templates
            </Title>
            <Text type="secondary">
              Reusable message templates for common communications
            </Text>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                const basePath = user.role === 'admin' ? '/admin' : '/hr';
                navigate(`${basePath}/communications/new`);
              }}
            >
              Create New Message
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Templates Grid */}
      {templates.length > 0 ? (
        <Row gutter={[16, 16]}>
          {templates.map((template) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={template._id}>
              <Card
                hoverable
                style={{ height: '100%' }}
                actions={[
                  <Tooltip title="Use Template">
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => handleUseTemplate(template)}
                    />
                  </Tooltip>,
                  <Tooltip title="View Details">
                    <Button
                      type="text"
                      icon={<EyeOutlined />}
                      onClick={() => {
                        const basePath = user.role === 'admin' ? '/admin' : '/hr';
                        navigate(`${basePath}/communications/${template._id}`);
                      }}
                    />
                  </Tooltip>,
                  <Dropdown overlay={getActionMenu(template)} trigger={['click']}>
                    <Button type="text" icon={<MoreOutlined />} />
                  </Dropdown>
                ]}
              >
                <Card.Meta
                  title={
                    <div style={{ marginBottom: '8px' }}>
                      <Text strong ellipsis>
                        {template.templateName || template.title}
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Tag color={getTypeColor(template.messageType)} size="small">
                            {template.messageType}
                          </Tag>
                          <Tag color={getPriorityColor(template.priority)} size="small">
                            {template.priority}
                          </Tag>
                        </div>
                        
                        <Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ fontSize: '12px', marginBottom: '8px', color: '#666' }}
                        >
                          {template.title}
                        </Paragraph>
                        
                        <div style={{ fontSize: '11px', color: '#999' }}>
                          <div>
                            <Text type="secondary">
                              Recipients: {template.recipients.targetType}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              By: {template.sender?.fullName}
                            </Text>
                          </div>
                          <div>
                            <Text type="secondary">
                              Created: {new Date(template.createdAt).toLocaleDateString()}
                            </Text>
                          </div>
                        </div>
                      </Space>
                    </div>
                  }
                />
              </Card>
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
          <Empty
            description="No templates found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
              Create a message and save it as a template for future use
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                const basePath = user.role === 'admin' ? '/admin' : '/hr';
                navigate(`${basePath}/communications/new`);
              }}
            >
              Create First Message
            </Button>
          </Empty>
        </Card>
      )}

      {/* Save Template Modal */}
      <Modal
        title="Save as Template"
        open={saveTemplateModalVisible}
        onOk={() => form.submit()}
        onCancel={() => {
          setSaveTemplateModalVisible(false);
          form.resetFields();
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveAsTemplate}
        >
          <Form.Item
            name="templateName"
            label="Template Name"
            rules={[
              { required: true, message: 'Please enter a template name' },
              { max: 100, message: 'Template name cannot exceed 100 characters' }
            ]}
          >
            <Input placeholder="e.g., Monthly Newsletter Template" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Add a description for this template..."
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CommunicationTemplates;