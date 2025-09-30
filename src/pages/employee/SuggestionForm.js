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
  Switch,
  Divider,
  Tag,
  Radio,
  Steps,
  Tooltip
} from 'antd';
import { 
  BulbOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  ToolOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  SmileOutlined,
  CheckCircleOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  StarOutlined,
  ThunderboltOutlined,
  HeartOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import { suggestions as suggestionsAPI } from '../../services/suggestionAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const SuggestionForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [fileList, setFileList] = useState([]);
  
  const [formData, setFormData] = useState({});
  
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const suggestionCategories = {
    'workplace_improvement': {
      label: 'Workplace Improvement',
      icon: <EnvironmentOutlined />,
      color: 'green',
      description: 'Suggestions to improve the physical work environment, office layout, or workplace conditions'
    },
    'technology': {
      label: 'Technology & IT',
      icon: <ToolOutlined />,
      color: 'blue',
      description: 'Ideas for new technology, software, or IT improvements to enhance productivity'
    },
    'process_improvement': {
      label: 'Process Improvement',
      icon: <ThunderboltOutlined />,
      color: 'purple',
      description: 'Suggestions to streamline processes, reduce waste, or improve operational efficiency'
    },
    'hr_policy': {
      label: 'HR & Policies',
      icon: <TeamOutlined />,
      color: 'orange',
      description: 'Ideas related to human resources, policies, benefits, or employee programs'
    },
    'environmental': {
      label: 'Environmental & Sustainability',
      icon: <SafetyCertificateOutlined />,
      color: 'green',
      description: 'Suggestions to reduce environmental impact and promote sustainability'
    },
    'team_building': {
      label: 'Team Building & Culture',
      icon: <SmileOutlined />,
      color: 'pink',
      description: 'Ideas to improve team collaboration, company culture, or employee engagement'
    },
    'cost_saving': {
      label: 'Cost Saving',
      icon: <DollarOutlined />,
      color: 'gold',
      description: 'Ideas that could help reduce costs or increase revenue for the company'
    },
    'safety': {
      label: 'Safety & Security',
      icon: <SafetyCertificateOutlined />,
      color: 'red',
      description: 'Suggestions to improve workplace safety, security, or health measures'
    },
    'customer_service': {
      label: 'Customer Service',
      icon: <HeartOutlined />,
      color: 'cyan',
      description: 'Ideas to improve customer experience, satisfaction, or service delivery'
    },
    'other': {
      label: 'Other Ideas',
      icon: <BulbOutlined />,
      color: 'gray',
      description: 'Any other innovative ideas that don\'t fit into the above categories'
    }
  };

  const priorityLevels = [
    { value: 'critical', label: 'Critical', color: 'red', description: 'Urgent issue requiring immediate attention' },
    { value: 'high', label: 'High', color: 'orange', description: 'Important improvement with significant impact' },
    { value: 'medium', label: 'Medium', color: 'yellow', description: 'Good idea with moderate impact' },
    { value: 'low', label: 'Low', color: 'green', description: 'Nice-to-have enhancement' }
  ];

  const implementationTimeframes = [
    { value: 'immediate', label: 'Immediate (< 1 month)', description: 'Quick wins that can be implemented right away' },
    { value: 'short_term', label: 'Short-term (1-3 months)', description: 'Projects requiring some planning and resources' },
    { value: 'medium_term', label: 'Medium-term (3-6 months)', description: 'Initiatives requiring significant planning' },
    { value: 'long_term', label: 'Long-term (6+ months)', description: 'Major projects or strategic initiatives' },
    { value: 'unknown', label: 'Not sure', description: 'Let the evaluation team assess the timeframe' }
  ];

  const steps = [
    { title: 'Suggestion Details', icon: <BulbOutlined />, description: 'What\'s your idea?' },
    { title: 'Impact & Benefits', icon: <StarOutlined />, description: 'How will it help?' },
    { title: 'Implementation', icon: <CheckCircleOutlined />, description: 'How to make it happen?' }
  ];

  const saveCurrentStepData = async () => {
    const currentValues = form.getFieldsValue();
    const updatedFormData = { ...formData, ...currentValues };
    setFormData(updatedFormData);
    console.log('DEBUG - Saving step data:', updatedFormData);
    return updatedFormData;
  };

  const handleNext = async () => {
    try {
      let fieldsToValidate = [];
      
      switch (currentStep) {
        case 0:
          fieldsToValidate = ['title', 'description', 'category', 'priority'];
          break;
        case 1:
          fieldsToValidate = ['expectedBenefit'];
          break;
        case 2:
          break;
        default:
          fieldsToValidate = [];
      }

      if (fieldsToValidate.length > 0) {
        await form.validateFields(fieldsToValidate);
      }
      
      // Save current step data
      await saveCurrentStepData();
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.log('Step validation failed:', error);
    }
  };

  const handlePrevious = async () => {
    await saveCurrentStepData();
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const finalFormData = await saveCurrentStepData();
      
      console.log('DEBUG - Final form data with all steps:', finalFormData);

      const requiredFields = ['title', 'description', 'category', 'priority', 'expectedBenefit'];
      const missingFields = [];
      
      requiredFields.forEach(field => {
        const value = finalFormData[field];
        if (!value || (typeof value === 'string' && value.trim().length === 0)) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        message.error(`Please fill in the following required fields: ${missingFields.join(', ')}`);
        console.log('DEBUG - Missing fields:', missingFields);
        console.log('DEBUG - Current form data:', finalFormData);
        
        // Navigate to the step with the first missing field
        const firstMissingField = missingFields[0];
        if (['title', 'description', 'category', 'priority'].includes(firstMissingField)) {
          setCurrentStep(0);
        } else if (['expectedBenefit'].includes(firstMissingField)) {
          setCurrentStep(1);
        }
        return;
      }

      // Additional validation for field lengths
      if (finalFormData.title && finalFormData.title.trim().length < 5) {
        message.error('Title must be at least 5 characters long');
        setCurrentStep(0);
        return;
      }

      if (finalFormData.description && finalFormData.description.trim().length < 20) {
        message.error('Description must be at least 20 characters long');
        setCurrentStep(0);
        return;
      }

      if (finalFormData.expectedBenefit && finalFormData.expectedBenefit.trim().length < 10) {
        message.error('Expected benefit must be at least 10 characters long');
        setCurrentStep(1);
        return;
      }

      // Prepare the suggestion data
      const suggestionData = {
        suggestionId: `SUG-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        
        // Required fields
        title: finalFormData.title.trim(),
        description: finalFormData.description.trim(),
        category: finalFormData.category,
        priority: finalFormData.priority,
        expectedBenefit: finalFormData.expectedBenefit.trim(),

        // Optional arrays
        impactAreas: Array.isArray(finalFormData.impactAreas) ? finalFormData.impactAreas : [],
        beneficiaries: Array.isArray(finalFormData.beneficiaries) ? finalFormData.beneficiaries : [],
        
        // Optional fields
        successMetrics: finalFormData.successMetrics?.trim() || '',
        estimatedCost: finalFormData.estimatedCost || 'unknown',
        costJustification: finalFormData.costJustification?.trim() || '',
        estimatedTimeframe: finalFormData.estimatedTimeframe || 'unknown',
        requiredResources: finalFormData.requiredResources?.trim() || '',
        implementationSteps: finalFormData.implementationSteps?.trim() || '',
        potentialChallenges: finalFormData.potentialChallenges?.trim() || '',
        similarAttempts: finalFormData.similarAttempts || 'no',
        previousAttemptDetails: finalFormData.previousAttemptDetails?.trim() || '',
        additionalNotes: finalFormData.additionalNotes?.trim() || '',
        followUpWilling: Boolean(finalFormData.followUpWilling),
        isAnonymous: isAnonymous
      };

      console.log('DEBUG - Final suggestion data to be sent:', suggestionData);

      const response = await suggestionsAPI.createSuggestion(suggestionData, fileList);

      if (response.success || response.message) {
        message.success('Suggestion submitted successfully! Thank you for your innovative idea.');
        navigate('/employee/suggestions');
      } else {
        throw new Error(response.message || 'Failed to submit suggestion');
      }
    } catch (error) {
      console.error('Error submitting suggestion:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit suggestion. Please try again.';
      message.error(errorMessage);
      
      if (error.response?.data) {
        console.error('Server error details:', error.response.data);
      }
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
            <Title level={4}>Step 1: Suggestion Details</Title>

            <Form.Item
              name="title"
              label={<span><span style={{color: 'red'}}>*</span> Suggestion Title</span>}
              rules={[
                { required: true, message: 'Please enter a suggestion title' },
                { min: 5, message: 'Title must be at least 5 characters long' }
              ]}
            >
              <Input 
                placeholder="Give your suggestion a clear, descriptive title"
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="category"
              label={<span><span style={{color: 'red'}}>*</span> Category</span>}
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select 
                placeholder="Select the category that best fits your suggestion"
                onChange={(value) => setSelectedCategory(value)}
              >
                {Object.entries(suggestionCategories).map(([key, category]) => (
                  <Option key={key} value={key}>
                    <Space>
                      {category.icon}
                      <span>{category.label}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedCategory && (
              <Alert
                message={`${suggestionCategories[selectedCategory].label} - Category Information`}
                description={suggestionCategories[selectedCategory].description}
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form.Item
              name="description"
              label={<span><span style={{color: 'red'}}>*</span> Detailed Description</span>}
              rules={[
                { required: true, message: 'Please provide a detailed description' },
                { min: 20, message: 'Description must be at least 20 characters long' }
              ]}
            >
              <TextArea
                rows={5}
                placeholder="Describe your suggestion in detail. What exactly are you proposing? How would it work? Be as specific as possible..."
                showCount
                maxLength={2000}
              />
            </Form.Item>

            <Form.Item
              name="priority"
              label={<span><span style={{color: 'red'}}>*</span> Priority Level</span>}
              rules={[{ required: true, message: 'Please select priority level' }]}
            >
              <Radio.Group>
                <Space direction="vertical">
                  {priorityLevels.map(level => (
                    <Radio key={level.value} value={level.value}>
                      <Tag color={level.color}>{level.label}</Tag>
                      <Text type="secondary">{level.description}</Text>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item name="similarAttempts" label="Has this been tried before?">
              <Radio.Group>
                <Radio value="no">No, this is a new idea</Radio>
                <Radio value="yes">Yes, but I have improvements</Radio>
                <Radio value="unsure">Not sure</Radio>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.similarAttempts !== currentValues.similarAttempts
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('similarAttempts') === 'yes' ? (
                  <Form.Item name="previousAttemptDetails" label="Previous Attempt Details">
                    <TextArea
                      rows={2}
                      placeholder="What was tried before? What would you do differently?"
                      maxLength={300}
                    />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Step 2: Impact & Benefits</Title>

            <Form.Item
              name="expectedBenefit"
              label={<span><span style={{color: 'red'}}>*</span> Expected Benefits</span>}
              rules={[
                { required: true, message: 'Please describe the expected benefits' },
                { min: 10, message: 'Expected benefits must be at least 10 characters long' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="What benefits will this suggestion bring? How will it improve things? Be specific about the positive impact..."
                maxLength={1000}
                showCount
              />
            </Form.Item>

            <Form.Item name="impactAreas" label="Impact Areas">
              <Select mode="multiple" placeholder="Select areas that will be impacted" allowClear>
                <Option value="cost_reduction">Cost Reduction</Option>
                <Option value="time_savings">Time Savings</Option>
                <Option value="quality_improvement">Quality Improvement</Option>
                <Option value="employee_satisfaction">Employee Satisfaction</Option>
                <Option value="customer_satisfaction">Customer Satisfaction</Option>
                <Option value="efficiency">Efficiency</Option>
                <Option value="safety">Safety</Option>
                <Option value="environmental">Environmental Impact</Option>
                <Option value="innovation">Innovation</Option>
                <Option value="communication">Communication</Option>
                <Option value="productivity">Productivity</Option>
              </Select>
            </Form.Item>

            <Form.Item name="beneficiaries" label="Who will benefit?">
              <Select mode="multiple" placeholder="Select who will benefit from this suggestion" allowClear>
                <Option value="all_employees">All Employees</Option>
                <Option value="my_department">My Department</Option>
                <Option value="specific_department">Specific Department</Option>
                <Option value="management">Management</Option>
                <Option value="customers">Customers</Option>
                <Option value="vendors">Vendors/Partners</Option>
                <Option value="company">Company Overall</Option>
                <Option value="environment">Environment</Option>
              </Select>
            </Form.Item>

            <Form.Item name="successMetrics" label="How would you measure success?">
              <TextArea
                rows={3}
                placeholder="How would we know if this suggestion is successful? What metrics or indicators would show its effectiveness?"
                maxLength={500}
              />
            </Form.Item>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Step 3: Implementation Details</Title>

            <Form.Item name="estimatedTimeframe" label="Estimated Implementation Timeframe">
              <Radio.Group>
                <Space direction="vertical">
                  {implementationTimeframes.map(timeframe => (
                    <Radio key={timeframe.value} value={timeframe.value}>
                      <Text strong>{timeframe.label}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px', marginLeft: '24px' }}>
                        {timeframe.description}
                      </Text>
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="estimatedCost" label="Estimated Cost">
                  <Select placeholder="Select cost range">
                    <Option value="none">No cost / Free</Option>
                    <Option value="very_low">Very Low (&lt; 50,000 XAF)</Option>
                    <Option value="low">Low (50,000 - 200,000 XAF)</Option>
                    <Option value="medium">Medium (200,000 - 1,000,000 XAF)</Option>
                    <Option value="high">High (1,000,000 - 5,000,000 XAF)</Option>
                    <Option value="very_high">Very High (&gt; 5,000,000 XAF)</Option>
                    <Option value="unknown">Not sure</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="costJustification" label="Cost Justification">
                  <TextArea
                    rows={2}
                    placeholder="If there's a cost, explain why the investment is worth it..."
                    maxLength={200}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="requiredResources" label="Required Resources">
              <TextArea
                rows={2}
                placeholder="What resources would be needed? (people, equipment, software, space, etc.)"
                maxLength={400}
              />
            </Form.Item>

            <Form.Item name="implementationSteps" label="Implementation Steps">
              <TextArea
                rows={3}
                placeholder="What are the key steps to implement this suggestion? Break it down into phases if needed..."
                maxLength={600}
              />
            </Form.Item>

            <Form.Item name="potentialChallenges" label="Potential Challenges">
              <TextArea
                rows={2}
                placeholder="What challenges or obstacles might we face? How could they be overcome?"
                maxLength={400}
              />
            </Form.Item>

            <Form.Item name="followUpWilling" valuePropName="checked">
              <Space>
                <span>I'm willing to help with follow-up discussions or implementation</span>
                <Tooltip title="Check this if you'd like to be involved in further discussions about your suggestion">
                  <InfoCircleOutlined />
                </Tooltip>
              </Space>
            </Form.Item>

            <Form.Item name="additionalNotes" label="Additional Notes">
              <TextArea
                rows={2}
                placeholder="Any other information that might be helpful..."
                maxLength={300}
              />
            </Form.Item>

            <Form.Item label="Supporting Documents">
              <Upload
                multiple
                fileList={fileList}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.ppt,.pptx"
              >
                <Button icon={<UploadOutlined />}>Attach Files</Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Diagrams, mockups, research, examples, or any supporting materials
              </Text>
            </Form.Item>

            {/* Summary Card */}
            <Card style={{ marginTop: '24px', backgroundColor: '#f9f9f9' }}>
              <Title level={5}>
                <BulbOutlined /> Suggestion Summary
              </Title>
              <Text type="secondary">Review your suggestion before submitting:</Text>
              <div style={{ marginTop: '12px' }}>
                <Row gutter={16}>
                  <Col span={12}>
                    <div><Text strong>Title:</Text> {formData.title || 'Not filled'}</div>
                    <div><Text strong>Category:</Text> {formData.category || 'Not selected'}</div>
                    <div><Text strong>Priority:</Text> {formData.priority || 'Not selected'}</div>
                  </Col>
                  <Col span={12}>
                    <div><Text strong>Cost:</Text> {formData.estimatedCost || 'Not specified'}</div>
                    <div><Text strong>Timeframe:</Text> {formData.estimatedTimeframe || 'Not specified'}</div>
                    <div><Text strong>Anonymous:</Text> {isAnonymous ? 'Yes' : 'No'}</div>
                  </Col>
                </Row>
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ marginBottom: '24px' }}>
          <BulbOutlined /> Submit Your Suggestion
        </Title>

        <Alert
          message="Share Your Great Ideas!"
          description="Your suggestions help make our workplace better for everyone. Whether it's a small improvement or a big innovation, we want to hear from you!"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map((step, index) => (
            <Step
              key={index}
              title={step.title}
              description={step.description}
              icon={step.icon}
            />
          ))}
        </Steps>

        <Form form={form} layout="vertical" autoComplete="off">
          {renderStepContent()}

          <Divider />

          <Row align="middle" style={{ marginBottom: '24px' }}>
            <Col flex="auto">
              <Text strong>Anonymous Submission</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Submit this suggestion anonymously. Your identity will not be visible to other employees.
              </Text>
            </Col>
            <Col>
              <Switch
                checked={isAnonymous}
                onChange={setIsAnonymous}
                checkedChildren={<EyeInvisibleOutlined />}
                unCheckedChildren={<EyeOutlined />}
              />
            </Col>
          </Row>

          <Row justify="space-between">
            <Col>
              {currentStep > 0 && (
                <Button onClick={handlePrevious}>Previous</Button>
              )}
            </Col>
            <Col>
              <Space>
                <Button onClick={() => navigate('/employee/suggestions')}>Cancel</Button>
                {currentStep < steps.length - 1 ? (
                  <Button type="primary" onClick={handleNext}>Next Step</Button>
                ) : (
                  <Button
                    type="primary"
                    loading={loading}
                    onClick={handleSubmit}
                    icon={<BulbOutlined />}
                  >
                    Submit Suggestion
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    </div>
  );
};

export default SuggestionForm;




