import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Typography, 
  Space, 
  Row, 
  Col,
  message,
  Alert,
  Upload,
  Checkbox,
  DatePicker,
  Steps,
  Divider,
  Tag,
  Radio
} from 'antd';
import { 
  BugOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  ToolOutlined,
  DesktopOutlined,
  WifiOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { itSupportAPI } from '../../services/api'; 
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const ITIssueReportForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [issueCategory, setIssueCategory] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [fileList, setFileList] = useState([]);
  const [troubleshootingAttempted, setTroubleshootingAttempted] = useState(false);
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const issueCategories = {
    'hardware': {
      label: 'Hardware Issues',
      icon: <DesktopOutlined />,
      subcategories: [
        'Computer won\'t start',
        'Blue screen/System crash',
        'Overheating issues',
        'Hard drive failure',
        'Memory/RAM problems',
        'Monitor display issues',
        'Keyboard not working',
        'Mouse not responding',
        'Printer problems',
        'Scanner malfunctions',
        'Audio/Speaker issues',
        'USB ports not working',
        'Power supply problems',
        'Other hardware issue'
      ]
    },
    'software': {
      label: 'Software Issues',
      icon: <BugOutlined />,
      subcategories: [
        'Application crashes/freezes',
        'Software won\'t install',
        'Software licensing issues',
        'Performance problems/slow',
        'Data corruption/loss',
        'Operating system errors',
        'Driver problems',
        'Update/upgrade issues',
        'Compatibility problems',
        'File access issues',
        'Email application problems',
        'Browser issues',
        'Antivirus problems',
        'Other software issue'
      ]
    },
    'network': {
      label: 'Network/Connectivity',
      icon: <WifiOutlined />,
      subcategories: [
        'No internet connection',
        'Slow internet speed',
        'WiFi connection problems',
        'Email not working',
        'Network drive access',
        'VPN connection issues',
        'Shared folder problems',
        'Remote access issues',
        'Network printer offline',
        'Server connection problems',
        'Website access blocked',
        'Other network issue'
      ]
    },
    'security': {
      label: 'Security Issues',
      icon: <SafetyCertificateOutlined />,
      subcategories: [
        'Suspected malware/virus',
        'Phishing email received',
        'Unusual system behavior',
        'Unauthorized access attempt',
        'Password/login problems',
        'Account lockout',
        'Security software alerts',
        'Data breach concerns',
        'Suspicious network activity',
        'Other security issue'
      ]
    },
    'mobile': {
      label: 'Mobile Device Issues',
      icon: <PrinterOutlined />,
      subcategories: [
        'Phone/tablet not working',
        'App crashes on mobile',
        'Mobile connectivity issues',
        'Email sync problems',
        'Battery drain issues',
        'Storage space problems',
        'Mobile security concerns',
        'Other mobile issue'
      ]
    },
    'other': {
      label: 'Other IT Issues',
      icon: <ToolOutlined />,
      subcategories: [
        'General IT support needed',
        'Training request',
        'Equipment recommendation',
        'System optimization',
        'Data backup request',
        'Other issue not listed'
      ]
    }
  };

  const severityLevels = [
    {
      value: 'critical',
      label: 'Critical',
      color: 'red',
      description: 'Complete work stoppage, system down, security breach',
      examples: 'Server down, complete network failure, data breach, ransomware',
      sla: '1-2 hours'
    },
    {
      value: 'high',
      label: 'High',
      color: 'orange', 
      description: 'Major functionality affected, multiple users impacted',
      examples: 'Email down for department, major application crash, printer offline',
      sla: '4-8 hours'
    },
    {
      value: 'medium',
      label: 'Medium',
      color: 'yellow',
      description: 'Moderate impact, workaround available',
      examples: 'Single user software issue, minor network problem, slow performance',
      sla: '24-48 hours'
    },
    {
      value: 'low',
      label: 'Low',
      color: 'green',
      description: 'Minor issue, little to no impact on productivity',
      examples: 'Enhancement request, minor bug, cosmetic issues',
      sla: '3-5 days'
    }
  ];

  const troubleshootingSteps = {
    'hardware': [
      'Checked all cable connections',
      'Restarted the device/computer',
      'Checked power supply and connections',
      'Tried using a different device/component',
      'Checked device manager for errors'
    ],
    'software': [
      'Restarted the application',
      'Restarted the computer',
      'Checked for software updates',
      'Ran the program as administrator',
      'Checked system resources (memory/disk space)',
      'Scanned for malware/viruses'
    ],
    'network': [
      'Checked network cable connections',
      'Restarted network equipment (router/modem)',
      'Tried connecting to different network',
      'Flushed DNS cache',
      'Disabled and re-enabled network adapter',
      'Checked with other users in area'
    ],
    'security': [
      'Ran full antivirus scan',
      'Changed passwords for affected accounts',
      'Checked recent downloads/emails',
      'Reviewed system logs',
      'Isolated affected system from network'
    ],
    'mobile': [
      'Restarted the mobile device',
      'Checked mobile data/WiFi connection',
      'Updated mobile applications',
      'Cleared application cache',
      'Checked storage space availability'
    ],
    'other': [
      'Attempted basic troubleshooting steps',
      'Consulted user manuals/help documentation',
      'Asked colleagues for assistance'
    ]
  };

  const steps = [
    {
      title: 'Issue Details',
      icon: <BugOutlined />,
      description: 'Describe the problem'
    },
    {
      title: 'Impact & Priority',
      icon: <WarningOutlined />,
      description: 'Assess urgency'
    },
    {
      title: 'Troubleshooting',
      icon: <ToolOutlined />,
      description: 'What you\'ve tried'
    },
    {
      title: 'Review & Submit',
      icon: <CheckCircleOutlined />,
      description: 'Final review'
    }
  ];

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['issueTitle', 'category', 'subcategory', 'issueDescription', 'location']);
      } else if (currentStep === 1) {
        await form.validateFields(['severity', 'businessImpact', 'affectedUsers', 'workaroundAvailable']);
      } else if (currentStep === 2) {
        await form.validateFields(['troubleshootingAttempted', 'preferredContactMethod']);
      }
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.log('Validation failed:', error);
    }
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const issueData = {
        title: values.issueTitle,
        description: values.issueDescription,
        category: values.category,
        subcategory: values.subcategory,
        severity: values.severity,
        urgency: values.urgency || 'normal',
        location: values.location,
        deviceDetails: {
          deviceType: values.deviceType,
          brand: values.deviceBrand,
          model: values.deviceModel,
          serialNumber: values.serialNumber,
          operatingSystem: values.operatingSystem,
          purchaseDate: values.purchaseDate?.toISOString()
        },
        issueDetails: {
          firstOccurred: values.firstOccurred?.toISOString(),
          frequency: values.frequency,
          reproducible: values.reproducible,
          errorMessages: values.errorMessages,
          stepsToReproduce: values.stepsToReproduce,
          affectedUsers: values.affectedUsers,
          workaroundAvailable: values.workaroundAvailable === 'yes' ? 'yes' : values.workaroundAvailable === 'partial' ? 'partial' : 'no',
          workaroundDescription: values.workaroundDescription
        },
        businessImpact: values.businessImpact,
        troubleshootingAttempted: troubleshootingAttempted,
        troubleshootingSteps: values.troubleshootingSteps || [],
        contactInfo: {
          phone: values.contactPhone,
          email: user.email,
          alternateContact: values.alternateContact
        },
        preferredContactMethod: values.preferredContactMethod,
        attachments: fileList
      };

      console.log('Submitting IT issue report:', issueData);
      
      const response = await itSupportAPI.createTechnicalIssue(issueData);
      
      if (response.success) {
        message.success(`IT issue report submitted successfully! Ticket number: ${response.data.ticketNumber}`);
        navigate('/employee/it-support');
      } else {
        throw new Error(response.message || 'Failed to submit issue report');
      }
    } catch (error) {
      console.error('Error submitting issue report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit issue report';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = ({ fileList }) => {
    setFileList(fileList);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>Step 1: Issue Details</Title>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="issueTitle"
                  label="Issue Title"
                  rules={[{ required: true, message: 'Please enter a brief issue title' }]}
                >
                  <Input 
                    placeholder="Brief description of the problem"
                    maxLength={100}
                    showCount
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="category"
                  label="Issue Category"
                  rules={[{ required: true, message: 'Please select issue category' }]}
                >
                  <Select 
                    placeholder="Select the type of issue"
                    onChange={(value) => {
                      setIssueCategory(value);
                      form.setFieldsValue({ subcategory: undefined });
                    }}
                  >
                    {Object.entries(issueCategories).map(([key, category]) => (
                      <Option key={key} value={key}>
                        <Space>
                          {category.icon}
                          {category.label}
                        </Space>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="subcategory"
                  label="Specific Issue"
                  rules={[{ required: true, message: 'Please select specific issue' }]}
                >
                  <Select 
                    placeholder="Select specific issue"
                    disabled={!issueCategory}
                  >
                    {issueCategory && issueCategories[issueCategory]?.subcategories.map(sub => (
                      <Option key={sub} value={sub}>{sub}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="location"
                  label="Location"
                  rules={[{ required: true, message: 'Please specify your location' }]}
                >
                  <Input 
                    placeholder="Office location, desk number, room"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="issueDescription"
              label="Detailed Description"
              rules={[{ required: true, message: 'Please provide detailed description' }]}
            >
              <TextArea
                rows={4}
                placeholder="Describe the issue in detail. Include what happened, when it started, and any error messages you saw..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Divider orientation="left">Device Information (if applicable)</Divider>
            
            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="deviceType" label="Device Type">
                  <Select placeholder="Select device type">
                    <Option value="desktop">Desktop Computer</Option>
                    <Option value="laptop">Laptop</Option>
                    <Option value="printer">Printer</Option>
                    <Option value="phone">Phone</Option>
                    <Option value="tablet">Tablet</Option>
                    <Option value="monitor">Monitor</Option>
                    <Option value="server">Server</Option>
                    <Option value="network_equipment">Network Equipment</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="deviceBrand" label="Brand">
                  <Input placeholder="e.g., Dell, HP, Apple" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="deviceModel" label="Model">
                  <Input placeholder="e.g., Latitude 5520, ThinkPad X1" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item name="serialNumber" label="Serial Number">
                  <Input placeholder="Device serial number (if known)" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="operatingSystem" label="Operating System">
                  <Select placeholder="Select OS">
                    <Option value="windows_11">Windows 11</Option>
                    <Option value="windows_10">Windows 10</Option>
                    <Option value="macos">macOS</Option>
                    <Option value="linux">Linux</Option>
                    <Option value="ios">iOS</Option>
                    <Option value="android">Android</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item name="purchaseDate" label="Purchase Date">
                  <DatePicker 
                    placeholder="When was device purchased?"
                    style={{ width: '100%' }}
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Step 2: Impact & Priority Assessment</Title>
            
            <Form.Item
              name="severity"
              label="Severity Level"
              rules={[{ required: true, message: 'Please select severity level' }]}
            >
              <Radio.Group 
                onChange={(e) => setSeverityLevel(e.target.value)}
                style={{ width: '100%' }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  {severityLevels.map(level => (
                    <Card 
                      key={level.value}
                      size="small"
                      style={{ 
                        cursor: 'pointer',
                        border: severityLevel === level.value ? `2px solid ${level.color === 'yellow' ? '#faad14' : level.color}` : '1px solid #d9d9d9'
                      }}
                    >
                      <Radio value={level.value}>
                        <Space align="start">
                          <Tag color={level.color}>{level.label}</Tag>
                          <div>
                            <Text strong>{level.description}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Examples: {level.examples}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              <ClockCircleOutlined /> Target Response: {level.sla}
                            </Text>
                          </div>
                        </Space>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="businessImpact"
                  label="Business Impact"
                  rules={[{ required: true, message: 'Please describe business impact' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="How is this issue affecting your work or the business?"
                    showCount
                    maxLength={300}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="affectedUsers"
                  label="Users Affected"
                  rules={[{ required: true, message: 'Please specify affected users' }]}
                >
                  <Select placeholder="How many users are affected?">
                    <Option value="just_me">Just me</Option>
                    <Option value="my_team">My team (2-5 people)</Option>
                    <Option value="department">My department (5-20 people)</Option>
                    <Option value="multiple_departments">Multiple departments (20+ people)</Option>
                    <Option value="entire_company">Entire company</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="firstOccurred"
                  label="When did this issue first occur?"
                >
                  <DatePicker 
                    showTime
                    style={{ width: '100%' }}
                    placeholder="Select date and time"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="frequency"
                  label="How often does this occur?"
                >
                  <Select placeholder="Select frequency">
                    <Option value="once">Just once</Option>
                    <Option value="intermittent">Intermittent</Option>
                    <Option value="frequent">Frequently</Option>
                    <Option value="constant">Constantly</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="workaroundAvailable"
              label="Is there a workaround available?"
              rules={[{ required: true, message: 'Please indicate if workaround exists' }]}
            >
              <Radio.Group>
                <Radio value="yes">Yes, I can work around this issue</Radio>
                <Radio value="no">No, this completely blocks my work</Radio>
                <Radio value="partial">Partial workaround available</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.workaroundAvailable !== currentValues.workaroundAvailable
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('workaroundAvailable') === 'yes' || getFieldValue('workaroundAvailable') === 'partial' ? (
                  <Form.Item
                    name="workaroundDescription"
                    label="Describe the workaround"
                  >
                    <TextArea
                      rows={2}
                      placeholder="Describe how you're working around this issue"
                      showCount
                      maxLength={200}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Step 3: Troubleshooting Attempts</Title>
            
            <Alert
              message="Help Us Help You Faster"
              description="Let us know what troubleshooting steps you've already tried. This helps us avoid duplicating efforts and speeds up resolution."
              type="info"
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Form.Item
              name="troubleshootingAttempted"
              label="Have you attempted any troubleshooting steps?"
              rules={[{ required: true, message: 'Please indicate if you tried troubleshooting' }]}
            >
              <Radio.Group onChange={(e) => setTroubleshootingAttempted(e.target.value === 'yes')}>
                <Radio value="yes">Yes, I tried some troubleshooting steps</Radio>
                <Radio value="no">No, I haven't tried anything yet</Radio>
              </Radio.Group>
            </Form.Item>

            {troubleshootingAttempted && (
              <Form.Item
                name="troubleshootingSteps"
                label="What troubleshooting steps did you try?"
              >
                <Checkbox.Group>
                  <Space direction="vertical">
                    {issueCategory && troubleshootingSteps[issueCategory]?.map(step => (
                      <Checkbox key={step} value={step}>
                        {step}
                      </Checkbox>
                    ))}
                    <Checkbox value="other">Other (specify below)</Checkbox>
                  </Space>
                </Checkbox.Group>
              </Form.Item>
            )}

            <Form.Item
              name="stepsToReproduce"
              label="Steps to Reproduce the Issue"
            >
              <TextArea
                rows={4}
                placeholder="If the issue is reproducible, please list the exact steps that cause it to happen..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item
              name="errorMessages"
              label="Error Messages"
            >
              <TextArea
                rows={3}
                placeholder="Copy and paste any error messages you've seen (exact text is helpful)"
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="reproducible"
                  label="Is this issue reproducible?"
                >
                  <Radio.Group>
                    <Radio value="always">Always happens</Radio>
                    <Radio value="sometimes">Sometimes happens</Radio>
                    <Radio value="once">Happened only once</Radio>
                    <Radio value="unknown">Not sure</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="preferredContactMethod"
                  label="Preferred Contact Method"
                  rules={[{ required: true, message: 'Please select contact method' }]}
                >
                  <Select placeholder="How should we contact you?">
                    <Option value="email">Email</Option>
                    <Option value="phone">Phone Call</Option>
                    <Option value="in_person">Visit my desk</Option>
                    <Option value="teams">Microsoft Teams</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="contactPhone"
                  label="Phone Number"
                  rules={[{ required: true, message: 'Please provide your phone number' }]}
                >
                  <Input 
                    placeholder="Your direct phone number"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="alternateContact"
                  label="Alternate Contact (Optional)"
                >
                  <Input 
                    placeholder="Colleague who can also help with this issue"
                  />
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 3:
        return (
          <div>
            <Title level={4}>Step 4: Review & Submit</Title>
            
            <Card>
              <Title level={5}>Request Summary</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Issue Title:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {form.getFieldValue('issueTitle') || 'Not specified'}
                  </div>
                  
                  <Text strong>Category:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {issueCategory && issueCategories[issueCategory]?.label} - {form.getFieldValue('subcategory')}
                  </div>

                  <Text strong>Severity:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {severityLevel && (
                      <Tag color={severityLevels.find(s => s.value === severityLevel)?.color}>
                        {severityLevels.find(s => s.value === severityLevel)?.label}
                      </Tag>
                    )}
                  </div>

                  <Text strong>Users Affected:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {form.getFieldValue('affectedUsers')?.replace('_', ' ') || 'Not specified'}
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Location:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {form.getFieldValue('location') || 'Not specified'}
                  </div>

                  <Text strong>Device:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {form.getFieldValue('deviceType') ? 
                      `${form.getFieldValue('deviceBrand')} ${form.getFieldValue('deviceModel')} ${form.getFieldValue('deviceType')}`.trim() :
                      'Not specified'
                    }
                  </div>

                  <Text strong>Workaround Available:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={form.getFieldValue('workaroundAvailable') === 'yes' ? 'green' : 'red'}>
                      {form.getFieldValue('workaroundAvailable')?.toUpperCase() || 'NOT SPECIFIED'}
                    </Tag>
                  </div>

                  <Text strong>Troubleshooting Attempted:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={troubleshootingAttempted ? 'green' : 'orange'}>
                      {troubleshootingAttempted ? 'YES' : 'NO'}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item
              name="additionalNotes"
              label="Additional Notes (Optional)"
              style={{ marginTop: '16px' }}
            >
              <TextArea
                rows={3}
                placeholder="Any additional information that might be helpful..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            <Form.Item
              name="attachments"
              label="Attach Screenshots or Files"
            >
              <Upload
                multiple
                fileList={fileList}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.log"
              >
                <Button icon={<UploadOutlined />}>
                  Attach Files
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Screenshots, error logs, or related documents (Images, PDF, DOC, TXT, LOG files)
              </Text>
            </Form.Item>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Space align="center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/employee/it-support')}
            >
              Back
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <BugOutlined /> IT Issue Report Form
              </Title>
              <Text type="secondary">Report technical issues and get IT support</Text>
            </div>
          </Space>
        </div>

        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
              status={
                index === currentStep ? 'process' :
                index < currentStep ? 'finish' : 'wait'
              }
            />
          ))}
        </Steps>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          {renderStepContent()}

          <Divider />

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              {currentStep > 0 && (
                <Button onClick={handlePrevious}>
                  Previous
                </Button>
              )}
              
              <Button onClick={() => navigate('/employee/it-support')}>
                Cancel
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<BugOutlined />}
                >
                  Submit Issue Report
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ITIssueReportForm;



