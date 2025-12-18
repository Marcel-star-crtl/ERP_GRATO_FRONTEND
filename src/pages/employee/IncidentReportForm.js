import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  DatePicker,
  TimePicker,
  Upload,
  Checkbox,
  Radio,
  Steps,
  Divider,
  Tag,
  Spin
} from 'antd';
import { 
  SafetyCertificateOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { incidentReportsAPI } from '../../services/incidentReportAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const IncidentReportForm = ({ editMode = false }) => {
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [incidentType, setIncidentType] = useState('');
  const [severityLevel, setSeverityLevel] = useState('');
  const [injuriesReported, setInjuriesReported] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [approvalChain, setApprovalChain] = useState([]);
  
  // CRITICAL: Store form values across steps
  const [formValues, setFormValues] = useState({});
  
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Load approval chain preview and, if editing, load incident data
  useEffect(() => {
    const loadApprovalChain = async () => {
      try {
        const response = await incidentReportsAPI.getApprovalChainPreview();
        if (response.success) {
          setApprovalChain(response.data);
        }
      } catch (error) {
        console.error('Error loading approval chain:', error);
      }
    };

    loadApprovalChain();
  }, []);

  // If editing, fetch incident data and prefill form
  useEffect(() => {
    if (editMode && id) {
      const fetchIncident = async () => {
        setLoading(true);
        try {
          const response = await incidentReportsAPI.getReportById(id);
          if (response.success && response.data) {
            const data = response.data;
            // Convert all date/time fields to dayjs objects
            const initialValues = {
              ...data,
              incidentDate: data.incidentDate ? dayjs(data.incidentDate) : undefined,
              incidentTime: data.incidentTime ? dayjs(data.incidentTime, 'HH:mm') : undefined,
              notificationTime: data.notificationTime ? dayjs(data.notificationTime, 'HH:mm') : undefined,
              // Add more mappings as needed
            };
            setFormValues(initialValues);
            form.setFieldsValue(initialValues);
            // Set fileList for Upload component
            if (data.attachments && Array.isArray(data.attachments)) {
              setFileList(
                data.attachments.map((file, idx) => ({
                  uid: file._id || file.url || idx,
                  name: file.name,
                  status: 'done',
                  url: file.url,
                  type: file.mimetype,
                }))
              );
            }
          } else {
            message.error(response.message || 'Failed to load incident report');
          }
        } catch (err) {
          message.error('Failed to load incident report');
        } finally {
          setLoading(false);
        }
      };
      fetchIncident();
    }
  }, [editMode, id, form]);

  // Initialize form with stored values when component mounts (for new or after fetch)
  useEffect(() => {
    form.setFieldsValue(formValues);
  }, [form, formValues]);

  const incidentTypes = {
    'injury': {
      label: 'Injury/Accident',
      icon: <MedicineBoxOutlined />,
      color: 'red',
      description: 'Any incident resulting in physical injury to a person',
      examples: 'Cuts, bruises, sprains, fractures, burns, etc.',
      requiredInfo: ['Medical attention details', 'Injury description', 'Body parts affected']
    },
    'near_miss': {
      label: 'Near Miss',
      icon: <WarningOutlined />,
      color: 'orange',
      description: 'An incident that could have resulted in injury or damage but didn\'t',
      examples: 'Slippery floors, falling objects, equipment malfunction without injury',
      requiredInfo: ['Potential consequences', 'What prevented injury/damage']
    },
    'equipment': {
      label: 'Equipment/Property Damage',
      icon: <ExclamationCircleOutlined />,
      color: 'yellow',
      description: 'Damage to equipment, property, or assets',
      examples: 'Broken equipment, damaged furniture, vehicle accidents, facility damage',
      requiredInfo: ['Damage description', 'Estimated cost', 'Equipment details']
    },
    'environmental': {
      label: 'Environmental Incident',
      icon: <EnvironmentOutlined />,
      color: 'green',
      description: 'Environmental spills, releases, or contamination',
      examples: 'Chemical spills, oil leaks, waste disposal issues, air quality concerns',
      requiredInfo: ['Substance involved', 'Quantity', 'Containment measures']
    },
    'security': {
      label: 'Security Incident',
      icon: <SafetyCertificateOutlined />,
      color: 'purple',
      description: 'Security breaches, theft, or unauthorized access',
      examples: 'Theft, vandalism, unauthorized entry, data breach, violence',
      requiredInfo: ['Security measures affected', 'Items involved', 'Access details']
    },
    'fire': {
      label: 'Fire/Emergency',
      icon: <ExclamationCircleOutlined />,
      color: 'red',
      description: 'Fire incidents or emergency situations',
      examples: 'Fires, explosions, gas leaks, electrical hazards, evacuations',
      requiredInfo: ['Emergency response actions', 'Evacuation details', 'Fire department contact']
    },
    'other': {
      label: 'Other Incident',
      icon: <InfoCircleOutlined />,
      color: 'blue',
      description: 'Any other safety or operational incident not listed above',
      examples: 'Unusual occurrences, procedural violations, other safety concerns',
      requiredInfo: ['Detailed description', 'Impact assessment']
    }
  };

  const severityLevels = [
    {
      value: 'critical',
      label: 'Critical',
      color: 'red',
      description: 'Fatality, major injury, significant damage, or major environmental impact',
      examples: 'Death, permanent disability, major fire, significant spill'
    },
    {
      value: 'high',
      label: 'High',
      color: 'orange',
      description: 'Serious injury, moderate damage, or noticeable environmental impact',
      examples: 'Hospital treatment required, equipment damage >$5000, minor spill'
    },
    {
      value: 'medium',
      label: 'Medium',
      color: 'yellow',
      description: 'Minor injury, limited damage, or minimal environmental impact',
      examples: 'First aid treatment, equipment damage <$5000, contained spill'
    },
    {
      value: 'low',
      label: 'Low',
      color: 'green',
      description: 'No injury, minimal damage, or no environmental impact',
      examples: 'Near miss, minor property damage, no treatment required'
    }
  ];

  const steps = [
    {
      title: 'Incident Details',
      icon: <InfoCircleOutlined />,
      description: 'What happened?'
    },
    {
      title: 'Location & Time',
      icon: <EnvironmentOutlined />,
      description: 'When and where?'
    },
    {
      title: 'People Involved',
      icon: <UserOutlined />,
      description: 'Who was involved?'
    },
    {
      title: 'Review & Submit',
      icon: <CheckCircleOutlined />,
      description: 'Final review'
    }
  ];

  // Save form values before step change
  const saveCurrentFormValues = async () => {
    try {
      const currentValues = await form.getFieldsValue();
      setFormValues(prev => ({ ...prev, ...currentValues }));
      console.log('Saved form values:', { ...formValues, ...currentValues });
    } catch (error) {
      console.error('Error saving form values:', error);
    }
  };

  const handleNext = async () => {
    try {
      // Save current step values first
      await saveCurrentFormValues();
      
      // Validate current step fields only
      let fieldsToValidate = [];
      
      switch (currentStep) {
        case 0:
          fieldsToValidate = ['title', 'incidentType', 'severity', 'description'];
          break;
        case 1:
          fieldsToValidate = ['incidentDate', 'incidentTime', 'location', 'specificLocation'];
          break;
        case 2:
          fieldsToValidate = ['injuriesReported', 'immediateActions'];
          if (form.getFieldValue('supervisorNotified') === 'yes') {
            fieldsToValidate.push('supervisorName');
          }
          break;
        default:
          break;
      }

      await form.validateFields(fieldsToValidate);
      
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error) {
      console.log('Validation failed:', error);
      message.error('Please fill in all required fields before continuing');
    }
  };

  const handlePrevious = async () => {
    // Save current step values before going back
    await saveCurrentFormValues();
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      // Get all form values and merge with saved values
      const currentValues = await form.getFieldsValue();
      const allValues = { ...formValues, ...currentValues };
      
      console.log('=== FORM SUBMIT DEBUG ===');
      console.log('All merged values:', allValues);
      console.log('Description value:', allValues.description);
      console.log('Description length:', allValues.description?.length);
      console.log('Title value:', allValues.title);
      console.log('Incident type:', allValues.incidentType);
      console.log('Severity:', allValues.severity);
      console.log('========================');
      
      // Validate required fields
      if (!allValues.description || allValues.description.length < 20) {
        message.error('Description must be at least 20 characters long');
        return;
      }
      
      if (!allValues.title || allValues.title.length < 5) {
        message.error('Title must be at least 5 characters long');
        return;
      }
  
      if (!allValues.incidentType || !allValues.severity) {
        message.error('Please select incident type and severity');
        return;
      }
  
      if (!allValues.location || !allValues.specificLocation) {
        message.error('Please provide location details');
        return;
      }
  
      if (!allValues.incidentDate || !allValues.incidentTime) {
        message.error('Please provide incident date and time');
        return;
      }
  
      if (!allValues.immediateActions) {
        message.error('Please describe immediate actions taken');
        return;
      }
      
      // Create FormData for file uploads
      const formData = new FormData();
      
      console.log('Building FormData with values:', Object.keys(allValues));
      
      // Define all possible fields and avoid duplicates
      const fieldMappings = {
        // Basic incident information
        title: allValues.title,
        incidentType: allValues.incidentType,
        severity: allValues.severity,
        description: allValues.description,
        
        // Location and time
        location: allValues.location,
        specificLocation: allValues.specificLocation,
        weatherConditions: allValues.weatherConditions,
        lightingConditions: allValues.lightingConditions,
        
        // People and witnesses
        witnesses: allValues.witnesses,
        supervisorName: allValues.supervisorName,
        
        // Actions and analysis
        immediateActions: allValues.immediateActions,
        contributingFactors: allValues.contributingFactors,
        rootCause: allValues.rootCause,
        preventiveMeasures: allValues.preventiveMeasures,
        additionalComments: allValues.additionalComments,
        
        // Contact information - SINGLE ENTRY ONLY
        reporterPhone: Array.isArray(allValues.reporterPhone) ? allValues.reporterPhone[0] : allValues.reporterPhone
      };
  
      // Add basic fields (avoid duplicates by using explicit mapping)
      Object.entries(fieldMappings).forEach(([field, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          formData.append(field, value);
          console.log(`Added ${field}:`, value);
        }
      });
  
      // Handle date and time fields
      if (allValues.incidentDate) {
        const incidentDateISO = allValues.incidentDate.toISOString();
        formData.append('incidentDate', incidentDateISO);
        console.log('Added incidentDate:', incidentDateISO);
      }
  
      if (allValues.incidentTime) {
        const incidentTimeFormatted = allValues.incidentTime.format('HH:mm');
        formData.append('incidentTime', incidentTimeFormatted);
        console.log('Added incidentTime:', incidentTimeFormatted);
      }
  
      if (allValues.notificationTime) {
        formData.append('notificationTime', allValues.notificationTime.format('HH:mm'));
      }
  
      // Handle boolean fields - single entry only
      formData.append('injuriesReported', injuriesReported ? 'yes' : 'no');
      formData.append('emergencyServicesContacted', allValues.emergencyServicesContacted === 'yes' ? 'yes' : 'no');
      formData.append('supervisorNotified', allValues.supervisorNotified === 'yes' ? 'yes' : 'no');
      formData.append('followUpRequired', allValues.followUpRequired === true ? 'true' : 'false');
  
      console.log('Added boolean fields');
  
      // Handle array fields (people involved, witnesses as arrays if needed)
      if (allValues.peopleInvolved && allValues.peopleInvolved.length > 0) {
        formData.append('peopleInvolved', JSON.stringify(allValues.peopleInvolved));
      }
  
      // Handle conditional data based on incident type and injuries
      if (injuriesReported && allValues.bodyPartsAffected) {
        const injuryDetails = {
          bodyPartsAffected: allValues.bodyPartsAffected || [],
          injuryType: allValues.injuryType || [],
          medicalAttentionRequired: allValues.medicalAttentionRequired,
          medicalProvider: allValues.medicalProvider,
          hospitalName: allValues.hospitalName,
          treatmentReceived: allValues.treatmentReceived,
          workRestrictions: allValues.workRestrictions
        };
        formData.append('injuryDetails', JSON.stringify(injuryDetails));
        console.log('Added injuryDetails:', injuryDetails);
      }
  
      if (allValues.incidentType === 'equipment' && allValues.equipmentInvolved) {
        const equipmentDetails = {
          equipmentInvolved: allValues.equipmentInvolved,
          equipmentCondition: allValues.equipmentCondition,
          damageDescription: allValues.damageDescription,
          estimatedCost: allValues.estimatedCost ? parseFloat(allValues.estimatedCost) : undefined
        };
        formData.append('equipmentDetails', JSON.stringify(equipmentDetails));
        console.log('Added equipmentDetails:', equipmentDetails);
      }
  
      if (allValues.incidentType === 'environmental' && allValues.substanceInvolved) {
        const environmentalDetails = {
          substanceInvolved: allValues.substanceInvolved,
          quantityReleased: allValues.quantityReleased,
          containmentMeasures: allValues.containmentMeasures,
          environmentalImpact: allValues.environmentalImpact
        };
        formData.append('environmentalDetails', JSON.stringify(environmentalDetails));
        console.log('Added environmentalDetails:', environmentalDetails);
      }
  
      // Add files
      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
          console.log(`Added file ${index}:`, file.originFileObj.name);
        }
      });
  
      // Debug: Log all FormData entries and count fields
      console.log('Final FormData entries:');
      let fieldCount = 0;
      for (let pair of formData.entries()) {
        fieldCount++;
        if (pair[1] instanceof File) {
          console.log(`${fieldCount}. ${pair[0]}: File - ${pair[1].name}`);
        } else {
          console.log(`${fieldCount}. ${pair[0]}:`, pair[1]);
        }
      }
      console.log('Total field count:', fieldCount);
  
      if (fieldCount > 50) {
        console.warn('WARNING: Field count exceeds multer limit of 50!');
        message.error('Too many form fields. Please reduce the amount of data and try again.');
        return;
      }
  
      console.log('Submitting incident report...');
      
      let response;
      if (editMode && id) {
        response = await incidentReportsAPI.updateReport(id, formData);
      } else {
        response = await incidentReportsAPI.create(formData);
      }

      if (response.success) {
        message.success({
          content: editMode ? 'Incident report updated successfully!' : 'Incident report submitted successfully! You will receive email notifications as it progresses through the review process.',
          duration: 6
        });
        // Navigate to reports list
        navigate('/employee/incident-reports', { 
          state: { 
            newReportId: response.data._id,
            message: editMode ? 'Report updated successfully' : 'Report submitted successfully'
          }
        });
      } else {
        throw new Error(response.message || (editMode ? 'Failed to update report' : 'Failed to submit report'));
      }
    } catch (error) {
      console.error('Error submitting incident report:', error);
      
      let errorMessage = 'Failed to submit incident report. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = ({ fileList: newFileList }) => {
    // Limit file size to 10MB and count to 5 files
    const validFileList = newFileList.filter(file => {
      const isValidSize = file.size ? file.size / 1024 / 1024 < 10 : true;
      if (!isValidSize) {
        message.error(`${file.name} is larger than 10MB`);
        return false;
      }
      return true;
    }).slice(0, 5); // Limit to 5 files

    setFileList(validFileList);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>Step 1: Incident Details</Title>
            
            <Form.Item
              name="title"
              label="Incident Title"
              rules={[
                { required: true, message: 'Please enter incident title' },
                { min: 10, message: 'Title must be at least 10 characters long' }
              ]}
            >
              <Input 
                placeholder="Brief description of what happened"
                maxLength={100}
                showCount
              />
            </Form.Item>

            <Form.Item
              name="incidentType"
              label="Incident Type"
              rules={[{ required: true, message: 'Please select incident type' }]}
            >
              <Select 
                placeholder="Select the type of incident"
                onChange={(value) => setIncidentType(value)}
              >
                {Object.entries(incidentTypes).map(([key, type]) => (
                  <Option key={key} value={key}>
                    <Space>
                      {type.icon}
                      <span>{type.label}</span>
                    </Space>
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {incidentType && (
              <Alert
                message={`${incidentTypes[incidentType].label} - Information Required`}
                description={
                  <div>
                    <p><strong>Description:</strong> {incidentTypes[incidentType].description}</p>
                    <p><strong>Examples:</strong> {incidentTypes[incidentType].examples}</p>
                    <p><strong>Required Information:</strong> {incidentTypes[incidentType].requiredInfo.join(', ')}</p>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

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
                          </div>
                        </Space>
                      </Radio>
                    </Card>
                  ))}
                </Space>
              </Radio.Group>
            </Form.Item>

            <Form.Item
              name="description"
              label="Detailed Description of Incident"
              rules={[
                { required: true, message: 'Please provide detailed description' },
                { min: 20, message: 'Description must be at least 20 characters long' }
              ]}
            >
              <TextArea
                rows={4}
                placeholder="Describe exactly what happened, in chronological order. Include as much detail as possible..."
                showCount
                maxLength={2000}
              />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Step 2: Location & Time Information</Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="incidentDate"
                  label="Date of Incident"
                  rules={[{ required: true, message: 'Please select incident date' }]}
                >
                  <DatePicker 
                    style={{ width: '100%' }}
                    placeholder="Select incident date"
                    disabledDate={(current) => current && current > dayjs().endOf('day')}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="incidentTime"
                  label="Time of Incident"
                  rules={[{ required: true, message: 'Please select incident time' }]}
                >
                  <TimePicker 
                    style={{ width: '100%' }}
                    placeholder="Select incident time"
                    format="HH:mm"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="location"
              label="General Location"
              rules={[{ required: true, message: 'Please specify location' }]}
            >
              <Select placeholder="Select general location">
                <Option value="main_office">Main Office Building</Option>
                <Option value="warehouse">Warehouse</Option>
                <Option value="parking_lot">Parking Lot</Option>
                <Option value="reception">Reception Area</Option>
                <Option value="conference_room">Conference Room</Option>
                {/* <Option value="cafeteria">Cafeteria</Option> */}
                <Option value="restroom">Restroom</Option>
                {/* <Option value="stairwell">Stairwell</Option> */}
                {/* <Option value="elevator">Elevator</Option> */}
                <Option value="outdoor_area">Outdoor Area</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="specificLocation"
              label="Specific Location Details"
              rules={[{ required: true, message: 'Please provide specific location details' }]}
            >
              <Input 
                placeholder="e.g., 2nd floor hallway near water cooler, Loading dock bay 3, etc."
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="weatherConditions"
                  label="Weather Conditions (if applicable)"
                >
                  <Select placeholder="Select weather conditions">
                    <Option value="clear">Clear/Sunny</Option>
                    <Option value="cloudy">Cloudy</Option>
                    <Option value="rainy">Rainy</Option>
                    <Option value="stormy">Stormy</Option>
                    <Option value="foggy">Foggy</Option>
                    <Option value="windy">Windy</Option>
                    <Option value="na">Not Applicable (Indoor)</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lightingConditions"
                  label="Lighting Conditions"
                >
                  <Select placeholder="Select lighting conditions">
                    <Option value="adequate">Adequate lighting</Option>
                    <Option value="poor">Poor lighting</Option>
                    <Option value="dark">Dark</Option>
                    <Option value="bright">Very bright</Option>
                    <Option value="glare">Glare present</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Step 3: People Involved & Injuries</Title>
            
            <Form.Item
              name="injuriesReported"
              label="Were there any injuries?"
              rules={[{ required: true, message: 'Please indicate if there were injuries' }]}
            >
              <Radio.Group onChange={(e) => setInjuriesReported(e.target.value === 'yes')}>
                <Radio value="yes">Yes, there were injuries</Radio>
                <Radio value="no">No injuries occurred</Radio>
              </Radio.Group>
            </Form.Item>

            {injuriesReported && (
              <>
                <Alert
                  message="Injury Details Required"
                  description="Since injuries were reported, please provide detailed information about the injuries and medical treatment."
                  type="warning"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Form.Item
                  name="bodyPartsAffected"
                  label="Body Parts Affected"
                  rules={[{ required: injuriesReported, message: 'Please specify body parts affected' }]}
                >
                  <Checkbox.Group>
                    <Row>
                      <Col span={8}><Checkbox value="head">Head</Checkbox></Col>
                      <Col span={8}><Checkbox value="neck">Neck</Checkbox></Col>
                      <Col span={8}><Checkbox value="back">Back</Checkbox></Col>
                      <Col span={8}><Checkbox value="chest">Chest</Checkbox></Col>
                      <Col span={8}><Checkbox value="arms">Arms</Checkbox></Col>
                      <Col span={8}><Checkbox value="hands">Hands</Checkbox></Col>
                      <Col span={8}><Checkbox value="legs">Legs</Checkbox></Col>
                      <Col span={8}><Checkbox value="feet">Feet</Checkbox></Col>
                      <Col span={8}><Checkbox value="other">Other</Checkbox></Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  name="injuryType"
                  label="Type of Injury"
                  rules={[{ required: injuriesReported, message: 'Please specify injury type' }]}
                >
                  <Checkbox.Group>
                    <Row>
                      <Col span={8}><Checkbox value="cut">Cut/Laceration</Checkbox></Col>
                      <Col span={8}><Checkbox value="bruise">Bruise/Contusion</Checkbox></Col>
                      <Col span={8}><Checkbox value="sprain">Sprain/Strain</Checkbox></Col>
                      <Col span={8}><Checkbox value="fracture">Fracture</Checkbox></Col>
                      <Col span={8}><Checkbox value="burn">Burn</Checkbox></Col>
                      <Col span={8}><Checkbox value="puncture">Puncture</Checkbox></Col>
                      <Col span={8}><Checkbox value="concussion">Concussion</Checkbox></Col>
                      <Col span={8}><Checkbox value="other">Other</Checkbox></Col>
                    </Row>
                  </Checkbox.Group>
                </Form.Item>

                <Form.Item
                  name="medicalAttentionRequired"
                  label="Medical Attention Required"
                  rules={[{ required: injuriesReported, message: 'Please specify medical attention required' }]}
                >
                  <Radio.Group>
                    <Radio value="none">No medical attention</Radio>
                    <Radio value="first_aid">First aid only</Radio>
                    <Radio value="medical_center">Company medical center</Radio>
                    <Radio value="hospital">Hospital/Emergency room</Radio>
                    <Radio value="doctor">Doctor visit</Radio>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prevValues, currentValues) => 
                    prevValues.medicalAttentionRequired !== currentValues.medicalAttentionRequired
                  }
                >
                  {({ getFieldValue }) =>
                    ['hospital', 'doctor', 'medical_center'].includes(getFieldValue('medicalAttentionRequired')) ? (
                      <>
                        <Form.Item name="medicalProvider" label="Medical Provider/Hospital Name">
                          <Input placeholder="Name of hospital, clinic, or medical provider" />
                        </Form.Item>
                        <Form.Item name="treatmentReceived" label="Treatment Received">
                          <TextArea
                            rows={2}
                            placeholder="Describe the treatment received..."
                            showCount
                            maxLength={300}
                          />
                        </Form.Item>
                      </>
                    ) : null
                  }
                </Form.Item>

                <Form.Item
                  name="workRestrictions"
                  label="Work Restrictions"
                >
                  <Radio.Group>
                    <Radio value="none">No restrictions</Radio>
                    <Radio value="light_duty">Light duty</Radio>
                    <Radio value="time_off">Time off work</Radio>
                    <Radio value="other">Other restrictions</Radio>
                  </Radio.Group>
                </Form.Item>
              </>
            )}

            <Divider />

            <Form.Item
              name="witnesses"
              label="Witnesses"
            >
              <TextArea
                rows={2}
                placeholder="List names and contact information of any witnesses to the incident..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="supervisorNotified"
                  label="Was supervisor notified?"
                  rules={[{ required: true, message: 'Please indicate if supervisor was notified' }]}
                >
                  <Radio.Group>
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="emergencyServicesContacted"
                  label="Emergency services contacted?"
                >
                  <Radio.Group>
                    <Radio value="yes">Yes</Radio>
                    <Radio value="no">No</Radio>
                  </Radio.Group>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => 
                prevValues.supervisorNotified !== currentValues.supervisorNotified
              }
            >
              {({ getFieldValue }) =>
                getFieldValue('supervisorNotified') === 'yes' ? (
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item name="supervisorName" label="Supervisor Name">
                        <Input placeholder="Name of supervisor notified" />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="notificationTime" label="Time Notified">
                        <TimePicker 
                          style={{ width: '100%' }}
                          placeholder="Time supervisor was notified"
                          format="HH:mm"
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ) : null
              }
            </Form.Item>

            <Form.Item
              name="immediateActions"
              label="Immediate Actions Taken"
              rules={[{ required: true, message: 'Please describe immediate actions taken' }]}
            >
              <TextArea
                rows={3}
                placeholder="Describe what actions were taken immediately after the incident (first aid, area secured, equipment shut down, etc.)"
                showCount
                maxLength={800}
              />
            </Form.Item>

            {/* Conditional fields based on incident type */}
            {incidentType === 'equipment' && (
              <>
                <Divider>Equipment Details</Divider>
                <Form.Item name="equipmentInvolved" label="Equipment Involved">
                  <Input placeholder="Name/model of equipment involved" />
                </Form.Item>
                <Form.Item name="damageDescription" label="Damage Description">
                  <TextArea rows={2} placeholder="Describe the damage..." />
                </Form.Item>
                <Form.Item name="estimatedCost" label="Estimated Repair Cost">
                  <Input prefix="XAF" placeholder="0.00" />
                </Form.Item>
              </>
            )}

            {incidentType === 'environmental' && (
              <>
                <Divider>Environmental Details</Divider>
                <Form.Item name="substanceInvolved" label="Substance Involved">
                  <Input placeholder="What substance was involved?" />
                </Form.Item>
                <Form.Item name="quantityReleased" label="Quantity Released">
                  <Input placeholder="Approximate quantity" />
                </Form.Item>
                <Form.Item name="containmentMeasures" label="Containment Measures">
                  <TextArea rows={2} placeholder="What containment measures were taken?" />
                </Form.Item>
              </>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <Title level={4}>Step 4: Review & Additional Information</Title>
            
            <Card>
              <Title level={5}>Incident Summary</Title>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Type:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {incidentType && incidentTypes[incidentType]?.label}
                  </div>
                  
                  <Text strong>Severity:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {severityLevel && (
                      <Tag color={severityLevels.find(s => s.value === severityLevel)?.color}>
                        {severityLevels.find(s => s.value === severityLevel)?.label}
                      </Tag>
                    )}
                  </div>

                  <Text strong>Location:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {formValues.location} - {formValues.specificLocation}
                  </div>

                  <Text strong>Date & Time:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    {formValues.incidentDate?.format('MMMM DD, YYYY')} at {formValues.incidentTime?.format('HH:mm')}
                  </div>
                </Col>
                <Col span={12}>
                  <Text strong>Injuries:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={injuriesReported ? 'red' : 'green'}>
                      {injuriesReported ? 'Injuries Reported' : 'No Injuries'}
                    </Tag>
                  </div>

                  <Text strong>Supervisor Notified:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={formValues.supervisorNotified === 'yes' ? 'green' : 'orange'}>
                      {formValues.supervisorNotified === 'yes' ? 'Yes' : 'No'}
                    </Tag>
                  </div>

                  <Text strong>Emergency Services:</Text>
                  <div style={{ marginBottom: '8px' }}>
                    <Tag color={formValues.emergencyServicesContacted === 'yes' ? 'red' : 'green'}>
                      {formValues.emergencyServicesContacted === 'yes' ? 'Contacted' : 'Not Contacted'}
                    </Tag>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Approval Chain Preview */}
            {approvalChain.length > 0 && (
              <Card size="small" title="Review Process" style={{ marginTop: '16px' }}>
                <Text type="secondary">Your report will be reviewed in the following order:</Text>
                <div style={{ marginTop: '8px' }}>
                  {approvalChain.map((step, index) => (
                    <Tag key={index} color="blue" style={{ margin: '2px' }}>
                      {step.level}. {step.approver} ({step.role})
                    </Tag>
                  ))}
                </div>
              </Card>
            )}

            <Form.Item
              name="contributingFactors"
              label="Contributing Factors"
              style={{ marginTop: '16px' }}
            >
              <TextArea
                rows={3}
                placeholder="What factors contributed to this incident? (e.g., poor lighting, wet floor, equipment failure, inadequate training)"
                showCount
                maxLength={800}
              />
            </Form.Item>

            <Form.Item
              name="preventiveMeasures"
              label="Suggested Preventive Measures"
            >
              <TextArea
                rows={3}
                placeholder="What could be done to prevent similar incidents in the future?"
                showCount
                maxLength={800}
              />
            </Form.Item>

            <Form.Item
              name="additionalComments"
              label="Additional Comments"
            >
              <TextArea
                rows={2}
                placeholder="Any additional information that may be relevant to this incident..."
                showCount
                maxLength={500}
              />
            </Form.Item>

            <Form.Item name="followUpRequired" valuePropName="checked">
              <Checkbox>Follow-up investigation required</Checkbox>
            </Form.Item>

            {/* <Form.Item
              name="reporterPhone"
              label="Your Phone Number"
              rules={[{ required: true, message: 'Please provide your phone number' }]}
              initialValue={user?.phone || ''}
            >
              <Input 
                placeholder="Phone number for follow-up contact"
              />
            </Form.Item> */}

            <Form.Item
              name="attachments"
              label="Supporting Documents/Photos"
            >
              <Upload
                multiple
                fileList={fileList}
                onChange={handleFileUpload}
                beforeUpload={() => false}
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                maxCount={5}
              >
                <Button icon={<UploadOutlined />}>
                  Attach Files (Max 5 files, 10MB each)
                </Button>
              </Upload>
              <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Photos of incident scene, medical reports, witness statements (JPG, PNG, PDF, DOC files)
              </Text>
            </Form.Item>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading form...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <Card>
        <Title level={2} style={{ marginBottom: '24px' }}>
          <SafetyCertificateOutlined /> Incident Report Form
        </Title>

        <Alert
          message="Important Safety Notice"
          description="Report all incidents immediately, regardless of severity. This helps us maintain a safe workplace for everyone. All reports are confidential and will be investigated appropriately."
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
          initialValues={{
            reporterPhone: user?.phone || ''
          }}
          preserve={false}
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
              
              <Button onClick={() => navigate('/employee/incident-reports')}>
                Cancel
              </Button>

              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={handleNext}>
                  Next Step
                </Button>
              ) : (
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                  icon={<SafetyCertificateOutlined />}
                >
                  Submit Incident Report
                </Button>
              )}
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default IncidentReportForm;



