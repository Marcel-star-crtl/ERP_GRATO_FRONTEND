import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  DatePicker,
  Upload,
  message,
  Typography,
  Space,
  Alert,
  Row,
  Col,
  Checkbox,
  TimePicker,
  Steps,
  Tag,
  Divider,
  Tooltip,
  Switch,
  InputNumber,
  List,
  Avatar
} from 'antd';
import {
  CalendarOutlined,
  UploadOutlined,
  UserOutlined,
  PhoneOutlined,
  SaveOutlined,
  SendOutlined,
  ArrowLeftOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  MedicineBoxOutlined,
  HomeOutlined,
  TeamOutlined,
  BookOutlined,
  RestOutlined,
  WarningOutlined,
  HeartOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import leaveApi from '../../services/leaveApi';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Step } = Steps;

export const LeaveRequestForm = ({ editMode = false, initialData = null, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [leaveTypes, setLeaveTypes] = useState({});
  const [leavePolicies, setLeavePolicies] = useState({});
  const [leaveBalances, setLeaveBalances] = useState({});
  const [medicalCertificate, setMedicalCertificate] = useState([]);
  const [supportingDocuments, setSupportingDocuments] = useState([]);
  const [selectedLeaveType, setSelectedLeaveType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [urgencyLevel, setUrgencyLevel] = useState('medium');
  const [isPartialDay, setIsPartialDay] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(0);
  const [approvalChain, setApprovalChain] = useState([]);
  const [certificateRequired, setCertificateRequired] = useState('not_required');
  const [leaveTypesLoading, setLeaveTypesLoading] = useState(false);
  const [storedFormData, setStoredFormData] = useState({}); // Manual form data storage

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeFormData = async () => {
      await Promise.all([
        fetchLeaveTypes(),
        fetchLeavePolicies(),
        fetchLeaveBalances()
      ]);
      initializeForm();
    };
    
    initializeFormData();
  }, []);

  useEffect(() => {
    if (selectedLeaveType) {
      const category = leaveApi.getLeaveCategory(selectedLeaveType);
      setSelectedCategory(category);
      setCertificateRequired(leaveApi.isMedicalCertificateRequired(selectedLeaveType, estimatedDuration));

      // Auto-set urgency based on leave type
      if (selectedLeaveType.includes('emergency')) {
        setUrgencyLevel('critical');
        form.setFieldsValue({ urgency: 'critical', priority: 'urgent' });
      } else if (selectedLeaveType === 'medical_appointment') {
        setUrgencyLevel('low');
        form.setFieldsValue({ urgency: 'low', priority: 'routine' });
      }
    }
  }, [selectedLeaveType, estimatedDuration]);

  useEffect(() => {
    if (user?.fullName && user?.department && selectedCategory && estimatedDuration) {
      fetchApprovalChainPreview();
    }
  }, [user, selectedCategory, estimatedDuration]);

  const fetchLeaveTypes = async () => {
    try {
      setLeaveTypesLoading(true);
      console.log('Fetching leave types...');
      
      const response = await leaveApi.getLeaveTypes();
      console.log('Leave types response:', response);
      
      if (response.success && response.data) {
        setLeaveTypes(response.data);
        console.log('Leave types set:', response.data);
      } else {
        console.error('Invalid response format:', response);
        // Fallback: Set default leave types if API fails
        setLeaveTypes(getDefaultLeaveTypes());
        message.warning('Using default leave types. Some options may be limited.');
      }
    } catch (error) {
      console.error('Error fetching leave types:', error);
      // Set fallback leave types
      setLeaveTypes(getDefaultLeaveTypes());
      message.error('Failed to load leave types. Using default options.');
    } finally {
      setLeaveTypesLoading(false);
    }
  };

  // Fallback leave types in case API fails
  const getDefaultLeaveTypes = () => {
    return {
      medical: {
        category: 'Medical Leave',
        types: [
          { value: 'sick_leave', label: 'Sick Leave', description: 'General illness requiring time off work', requiresCertificate: true },
          { value: 'medical_appointment', label: 'Medical Appointment', description: 'Scheduled medical consultation', requiresCertificate: false },
          { value: 'emergency_medical', label: 'Emergency Medical Leave', description: 'Urgent medical situation', requiresCertificate: true },
          { value: 'mental_health', label: 'Mental Health Leave', description: 'Mental health and wellness support', requiresCertificate: true },
        ]
      },
      vacation: {
        category: 'Vacation Leave',
        types: [
          { value: 'annual_leave', label: 'Annual Leave', description: 'Regular vacation time', requiresCertificate: false }
        ]
      },
      personal: {
        category: 'Personal Leave',
        types: [
          { value: 'personal_time_off', label: 'Personal Time Off', description: 'Personal matters and appointments', requiresCertificate: false },
          { value: 'wellness_day', label: 'Wellness Day', description: 'Personal wellness and self-care', requiresCertificate: false }
        ]
      },
      family: {
        category: 'Family Leave',
        types: [
          { value: 'family_care', label: 'Family Care Leave', description: 'Caring for sick family member', requiresCertificate: false },
          { value: 'child_sick_care', label: 'Child Sick Care', description: 'Caring for sick child', requiresCertificate: false }
        ]
      },
      emergency: {
        category: 'Emergency Leave',
        types: [
          { value: 'emergency_leave', label: 'Emergency Leave', description: 'Unexpected urgent situations', requiresCertificate: false }
        ]
      },
      bereavement: {
        category: 'Bereavement Leave',
        types: [
          { value: 'bereavement_leave', label: 'Bereavement Leave', description: 'Death of family member or close friend', requiresCertificate: false }
        ]
      }
    };
  };

  const fetchLeavePolicies = async () => {
    try {
      const response = await leaveApi.getLeavePolicies();
      if (response.success) {
        setLeavePolicies(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching leave policies:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await leaveApi.getEmployeeLeaveBalance();
      if (response.success) {
        setLeaveBalances(response.data || {});
      }
    } catch (error) {
      console.error('Error fetching leave balances:', error);
    }
  };

  const fetchApprovalChainPreview = async () => {
    try {
      const response = await leaveApi.getApprovalChainPreview(
        user.fullName, 
        user.department, 
        selectedCategory, 
        estimatedDuration
      );
      if (response.success) {
        setApprovalChain(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching approval chain:', error);
    }
  };

  const initializeForm = () => {
    const initialValues = {
      employeeName: user?.fullName || '',
      department: user?.department || '',
      position: user?.position || '',
      employeeId: user?.employeeId || '',
      email: user?.email || '',
      submissionDate: dayjs(),
      urgency: 'medium',
      priority: 'routine',
      leaveType: 'personal_time_off',
      ...initialData
    };

    form.setFieldsValue(initialValues);

    if (initialData) {
      setSelectedLeaveType(initialData.leaveType || '');
      setUrgencyLevel(initialData.urgency || 'medium');
      setIsPartialDay(initialData.isPartialDay || false);
      setEstimatedDuration(initialData.totalDays || 0);

      if (initialData.startDate && initialData.endDate) {
        form.setFieldsValue({
          leaveDates: [dayjs(initialData.startDate), dayjs(initialData.endDate)]
        });
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Get all form values, not just current step
      const allValues = form.getFieldsValue();
      
      // Combine with manually stored form data as fallback
      const combinedValues = { ...(storedFormData || {}), ...allValues };
      
      // Debug: Log form values to console
      console.log('=== FORM SUBMISSION DEBUG ===');
      console.log('Form submission - All values:', allValues);
      console.log('Form submission - Manual form data:', storedFormData);
      console.log('Form submission - Combined values:', combinedValues);
      console.log('Form submission - Values parameter:', values);
      console.log('Form submission - Leave dates:', combinedValues.leaveDates);
      console.log('Form submission - Leave dates type:', typeof combinedValues.leaveDates);
      console.log('Form submission - Leave dates length:', combinedValues.leaveDates?.length);
      console.log('Form submission - First date:', combinedValues.leaveDates?.[0]);
      console.log('Form submission - Second date:', combinedValues.leaveDates?.[1]);
      console.log('==========================');
      
      // Validation - Check if dates are selected
      if (!combinedValues.leaveDates || !combinedValues.leaveDates[0] || !combinedValues.leaveDates[1]) {
        console.error('Date validation failed:', {
          leaveDates: combinedValues.leaveDates,
          hasFirstDate: !!(combinedValues.leaveDates && combinedValues.leaveDates[0]),
          hasSecondDate: !!(combinedValues.leaveDates && combinedValues.leaveDates[1])
        });
        message.error('Please select leave start and end dates');
        setCurrentStep(0); // Go back to first step where dates are selected
        setLoading(false);
        return;
      }

      // Validation
      if (certificateRequired === 'required' && medicalCertificate.length === 0) {
        message.error('Medical certificate is required for this type of leave');
        setLoading(false);
        return;
      }

      // Check leave balance
      const balance = leaveBalances[selectedCategory];
      if (balance && balance.remainingDays < estimatedDuration) {
        message.error(`Insufficient ${selectedCategory} leave balance. You have ${balance.remainingDays} days remaining.`);
        setLoading(false);
        return;
      }

      // Prepare form data
      const formData = new FormData();

      // Add basic leave information
      formData.append('leaveType', combinedValues.leaveType);
      formData.append('startDate', combinedValues.leaveDates[0].format('YYYY-MM-DD'));
      formData.append('endDate', combinedValues.leaveDates[1].format('YYYY-MM-DD'));
      formData.append('totalDays', estimatedDuration);
      formData.append('isPartialDay', isPartialDay);
      formData.append('urgency', combinedValues.urgency);
      formData.append('priority', combinedValues.priority || 'routine');
      formData.append('reason', combinedValues.reason);

      // Add optional fields
      if (combinedValues.description) formData.append('description', combinedValues.description);

      // Medical information (for medical leaves)
      if (selectedCategory === 'medical') {
        if (combinedValues.symptoms) formData.append('symptoms', combinedValues.symptoms);
        if (combinedValues.doctorName) formData.append('doctorName', combinedValues.doctorName);
        if (combinedValues.hospitalName) formData.append('hospitalName', combinedValues.hospitalName);
        if (combinedValues.doctorContact) formData.append('doctorContact', combinedValues.doctorContact);
        if (combinedValues.treatmentReceived) formData.append('treatmentReceived', combinedValues.treatmentReceived);
        if (combinedValues.diagnosisCode) formData.append('diagnosisCode', combinedValues.diagnosisCode);
        if (combinedValues.expectedRecoveryDate) formData.append('expectedRecoveryDate', combinedValues.expectedRecoveryDate.format('YYYY-MM-DD'));
        if (combinedValues.isRecurring) formData.append('isRecurring', combinedValues.isRecurring);
      }

      // Add emergency contact
      if (combinedValues.emergencyContactName) formData.append('emergencyContactName', combinedValues.emergencyContactName);
      if (combinedValues.emergencyContactPhone) formData.append('emergencyContactPhone', combinedValues.emergencyContactPhone);
      if (combinedValues.emergencyContactRelation) formData.append('emergencyContactRelation', combinedValues.emergencyContactRelation);
      if (combinedValues.emergencyContactAddress) formData.append('emergencyContactAddress', combinedValues.emergencyContactAddress);

      // Add work coverage and return plan
      if (combinedValues.workCoverage) formData.append('workCoverage', combinedValues.workCoverage);
      if (combinedValues.returnToWorkPlan) formData.append('returnToWorkPlan', combinedValues.returnToWorkPlan);
      if (combinedValues.additionalNotes) formData.append('additionalNotes', combinedValues.additionalNotes);

      // Add partial day times
      if (isPartialDay) {
        if (combinedValues.partialStartTime) formData.append('partialStartTime', combinedValues.partialStartTime.format('HH:mm'));
        if (combinedValues.partialEndTime) formData.append('partialEndTime', combinedValues.partialEndTime.format('HH:mm'));
      }

      // Add files
      if (medicalCertificate.length > 0) {
        formData.append('medicalCertificate', medicalCertificate[0]);
      }

      supportingDocuments.forEach((file) => {
        formData.append('supportingDocuments', file);
      });

      // Submit to API
      let response;
      if (editMode && initialData?._id) {
        response = await leaveApi.updateLeave(initialData._id, formData);
      } else {
        response = await leaveApi.createLeave(formData);
      }

      if (response.success) {
        message.success(`Leave request ${editMode ? 'updated' : 'submitted'} successfully!`);

        if (response.notifications) {
          const { sent, failed } = response.notifications;
          if (sent > 0) {
            message.success(`${sent} notification(s) sent successfully`);
          }
          if (failed > 0) {
            message.warning(`${failed} notification(s) failed to send`);
          }
        }

        navigate('/employee/leave');
      } else {
        throw new Error(response.message || 'Failed to submit request');
      }

    } catch (error) {
      console.error('Submission error:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit leave request';
      message.error(errorMessage);

      if (error.response?.status === 400) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          Object.keys(validationErrors).forEach(field => {
            form.setFields([{
              name: field,
              errors: [validationErrors[field]]
            }]);
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      const values = form.getFieldsValue();
      const draftData = {
        leaveType: values.leaveType || 'personal_time_off',
        startDate: values.leaveDates?.[0]?.format('YYYY-MM-DD'),
        endDate: values.leaveDates?.[1]?.format('YYYY-MM-DD'),
        totalDays: estimatedDuration,
        urgency: values.urgency || 'medium',
        priority: values.priority || 'routine',
        reason: values.reason || 'Draft - to be completed',
        description: values.description,
        symptoms: values.symptoms,
        doctorName: values.doctorName,
        hospitalName: values.hospitalName,
        doctorContact: values.doctorContact,
        emergencyContactName: values.emergencyContactName,
        emergencyContactPhone: values.emergencyContactPhone,
        emergencyContactRelation: values.emergencyContactRelation,
        workCoverage: values.workCoverage,
        returnToWorkPlan: values.returnToWorkPlan,
        additionalNotes: values.additionalNotes
      };

      const response = await leaveApi.saveDraft(draftData);

      if (response.success) {
        message.success('Draft saved successfully!');
        navigate('/employee/leave');
      } else {
        throw new Error(response.message || 'Failed to save draft');
      }

    } catch (error) {
      console.error('Save draft error:', error);
      message.error(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveTypeChange = (value) => {
    setSelectedLeaveType(value);

    // Auto-adjust form based on leave type
    if (value.includes('emergency')) {
      setUrgencyLevel('critical');
      form.setFieldsValue({ urgency: 'critical', priority: 'urgent' });
    } else if (value === 'medical_appointment') {
      setUrgencyLevel('low');
      form.setFieldsValue({ urgency: 'low', priority: 'routine' });
    } else if (value === 'annual_leave') {
      setUrgencyLevel('low');
      form.setFieldsValue({ urgency: 'low', priority: 'routine' });
    }
  };

  const handleDateChange = (dates) => {
    if (dates && dates.length === 2) {
      const startDate = dates[0];
      const endDate = dates[1];
      const duration = endDate.diff(startDate, 'day') + 1;
      setEstimatedDuration(isPartialDay ? 0.5 : duration);
    } else {
      setEstimatedDuration(0);
    }
  };

  const medicalCertificateProps = {
    onRemove: () => setMedicalCertificate([]),
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isValidType) {
        message.error('You can only upload PDF files or images!');
        return false;
      }
      if (!isLt5M) {
        message.error('File must be smaller than 5MB!');
        return false;
      }

      setMedicalCertificate([file]);
      return false;
    },
    fileList: medicalCertificate,
    accept: '.pdf,image/*',
    maxCount: 1
  };

  const supportingDocsProps = {
    onRemove: (file) => {
      setSupportingDocuments(supportingDocuments.filter(item => item.uid !== file.uid));
    },
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf' || file.type.startsWith('image/');
      const isLt5M = file.size / 1024 / 1024 < 5;

      if (!isValidType) {
        message.error('You can only upload PDF files or images!');
        return false;
      }
      if (!isLt5M) {
        message.error('File must be smaller than 5MB!');
        return false;
      }

      setSupportingDocuments([...supportingDocuments, file]);
      return false;
    },
    fileList: supportingDocuments,
    accept: '.pdf,image/*',
    multiple: true,
    maxCount: 3
  };

  const steps = [
    { 
      title: 'Leave Type & Details', 
      description: 'Select leave type and basic information',
      icon: <CalendarOutlined />
    },
    { 
      title: 'Specific Information', 
      description: 'Category-specific details and documentation',
      icon: <FileTextOutlined />
    },
    { 
      title: 'Contact & Coverage', 
      description: 'Emergency contact and work coverage',
      icon: <UserOutlined />
    }
  ];

  const getCategoryIcon = (category) => {
    const icons = {
      medical: <MedicineBoxOutlined />,
      vacation: <RestOutlined />,
      personal: <UserOutlined />,
      family: <TeamOutlined />,
      emergency: <WarningOutlined />,
      bereavement: <HeartOutlined />,
      study: <BookOutlined />,
      maternity: '🤱',
      paternity: '👨‍👩‍👧‍👦',
      compensatory: '⏰',
      sabbatical: '🎓',
      unpaid: '💸'
    };
    return icons[category] || <CalendarOutlined />;
  };

  const renderLeaveTypeOptions = () => {
    console.log('Rendering leave type options, leaveTypes:', leaveTypes);
    
    if (!leaveTypes || Object.keys(leaveTypes).length === 0) {
      return (
        <Option value="" disabled>
          {leaveTypesLoading ? 'Loading leave types...' : 'No leave types available'}
        </Option>
      );
    }

    return Object.entries(leaveTypes).map(([category, categoryData]) => {
      console.log('Rendering category:', category, categoryData);
      
      if (!categoryData || !categoryData.types) {
        console.warn(`Invalid category data for ${category}:`, categoryData);
        return null;
      }

      return (
        <Select.OptGroup 
          key={category} 
          label={
            <span>
              {getCategoryIcon(category)} {categoryData.category}
            </span>
          }
        >
          {categoryData.types.map(type => (
            <Option key={type.value} value={type.value}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{type.label}</div>
                <div style={{ fontSize: '11px', color: '#666' }}>
                  {type.description}
                </div>
                {type.requiresCertificate && (
                  <Tag size="small" color="orange" style={{ marginTop: '2px' }}>
                    Certificate Required
                  </Tag>
                )}
              </div>
            </Option>
          ))}
        </Select.OptGroup>
      );
    }).filter(Boolean);
  };

  const renderBalanceInfo = () => {
    const balance = leaveBalances[selectedCategory];
    if (!balance) return null;

    const warningThreshold = balance.totalDays * 0.2; // 20% of total
    const isLowBalance = balance.remainingDays <= warningThreshold;

    return (
      <Alert
        type={isLowBalance ? "warning" : "info"}
        message={`${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Leave Balance`}
        description={
          <div>
            <Text>Available: <Text strong>{balance.remainingDays} days</Text> out of {balance.totalDays} total</Text>
            <br />
            <Text type="secondary">Used: {balance.usedDays} days | Pending: {balance.pendingDays} days</Text>
            {estimatedDuration > balance.remainingDays && (
              <div style={{ color: '#ff4d4f', marginTop: '4px' }}>
                <WarningOutlined /> Insufficient balance for this request
              </div>
            )}
          </div>
        }
        style={{ marginBottom: '16px' }}
      />
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div>
            <Title level={4}>Leave Request Details</Title>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="leaveType"
                  label="Leave Type"
                  rules={[{ required: true, message: 'Please select a leave type' }]}
                >
                  <Select 
                    placeholder={leaveTypesLoading ? "Loading leave types..." : "Select leave type"}
                    onChange={handleLeaveTypeChange}
                    size="large"
                    showSearch
                    optionFilterProp="children"
                    loading={leaveTypesLoading}
                    notFoundContent={leaveTypesLoading ? "Loading..." : "No leave types found"}
                  >
                    {renderLeaveTypeOptions()}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Row gutter={8}>
                  <Col span={12}>
                    <Form.Item
                      name="urgency"
                      label="Urgency Level"
                      rules={[{ required: true, message: 'Please select urgency level' }]}
                    >
                      <Select placeholder="Select urgency" size="large">
                        <Option value="low">
                          <Tag color="green">Low</Tag> Routine, advance planned
                        </Option>
                        <Option value="medium">
                          <Tag color="yellow">Medium</Tag> Standard request
                        </Option>
                        <Option value="high">
                          <Tag color="orange">High</Tag> Urgent, short notice
                        </Option>
                        <Option value="critical">
                          <Tag color="red">Critical</Tag> Emergency situation
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="priority"
                      label="Priority"
                      rules={[{ required: true, message: 'Please select priority' }]}
                    >
                      <Select placeholder="Select priority" size="large">
                        <Option value="routine">Routine</Option>
                        <Option value="important">Important</Option>
                        <Option value="urgent">Urgent</Option>
                        <Option value="critical">Critical</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
              </Col>
            </Row>

            {/* Debug Info - Remove in production */}
            {process.env.NODE_ENV === 'development' && (
              <Alert
                message="Debug Info"
                description={
                  <div>
                    <p>Leave Types Count: {Object.keys(leaveTypes).length}</p>
                    <p>Leave Types Loading: {leaveTypesLoading ? 'Yes' : 'No'}</p>
                    <p>Selected Leave Type: {selectedLeaveType || 'None'}</p>
                    <p>Selected Category: {selectedCategory || 'None'}</p>
                  </div>
                }
                type="info"
                style={{ marginBottom: '16px' }}
                closable
              />
            )}

            {selectedCategory && renderBalanceInfo()}

            <Row gutter={16}>
              <Col span={16}>
                <Form.Item
                  name="leaveDates"
                  label="Leave Period"
                  rules={[{ required: true, message: 'Please select leave dates' }]}
                >
                  <RangePicker
                    style={{ width: '100%' }}
                    size="large"
                    disabledDate={(current) => {
                      // Allow past dates only for emergency and medical leaves
                      const allowPastDates = ['emergency_leave', 'sick_leave', 'emergency_medical'].includes(selectedLeaveType);
                      return !allowPastDates && current && current < dayjs().startOf('day');
                    }}
                    onChange={handleDateChange}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Duration" style={{ marginBottom: 0 }}>
                  <div style={{ 
                    padding: '8px 12px', 
                    border: '1px solid #d9d9d9', 
                    borderRadius: '6px',
                    backgroundColor: '#f5f5f5',
                    textAlign: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold'
                  }}>
                    {estimatedDuration} {estimatedDuration === 1 ? 'day' : 'days'}
                  </div>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item style={{ marginBottom: '16px' }}>
              <Checkbox 
                checked={isPartialDay} 
                onChange={(e) => {
                  setIsPartialDay(e.target.checked);
                  if (e.target.checked) {
                    setEstimatedDuration(0.5);
                  } else {
                    handleDateChange(form.getFieldValue('leaveDates'));
                  }
                }}
              >
                This is a partial day leave (specify hours below)
              </Checkbox>
            </Form.Item>

            {isPartialDay && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="partialStartTime"
                    label="Leave Start Time"
                    rules={[{ required: isPartialDay, message: 'Please select start time' }]}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" size="large" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="partialEndTime"
                    label="Leave End Time"
                    rules={[{ required: isPartialDay, message: 'Please select end time' }]}
                  >
                    <TimePicker style={{ width: '100%' }} format="HH:mm" size="large" />
                  </Form.Item>
                </Col>
              </Row>
            )}

            <Form.Item
              name="reason"
              label="Reason for Leave"
              rules={[
                { required: true, message: 'Please provide reason for leave' },
                { min: 10, message: 'Please provide a detailed reason (minimum 10 characters)' }
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Describe the reason for your leave request..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            <Form.Item name="description" label="Additional Description (Optional)">
              <TextArea
                rows={2}
                placeholder="Any additional context or information..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </div>
        );

      case 1:
        return (
          <div>
            <Title level={4}>Category-Specific Information</Title>

            {selectedCategory === 'medical' && (
              <>
                <Alert
                  message="Medical Leave Requirements"
                  description={
                    certificateRequired === 'required' 
                      ? "Medical certificate is REQUIRED for this leave request"
                      : certificateRequired === 'recommended'
                      ? "Medical certificate is recommended for this leave request"
                      : "Medical certificate may be requested if needed"
                  }
                  type={certificateRequired === 'required' ? "warning" : "info"}
                  showIcon
                  style={{ marginBottom: '20px' }}
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="symptoms" label="Symptoms (if applicable)">
                      <TextArea
                        rows={2}
                        placeholder="Describe symptoms you're experiencing..."
                        showCount
                        maxLength={200}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="treatmentReceived" label="Treatment/Diagnosis">
                      <TextArea
                        rows={2}
                        placeholder="Brief description of treatment or diagnosis..."
                        showCount
                        maxLength={200}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name="doctorName"
                      label="Doctor's Name"
                      rules={selectedLeaveType !== 'wellness_day' ? [
                        { required: true, message: 'Please enter doctor\'s name' }
                      ] : []}
                    >
                      <Input 
                        placeholder="Dr. John Smith"
                        prefix={<UserOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name="hospitalName"
                      label="Hospital/Clinic Name"
                      rules={selectedLeaveType !== 'wellness_day' ? [
                        { required: true, message: 'Please enter hospital/clinic name' }
                      ] : []}
                    >
                      <Input 
                        placeholder="General Hospital"
                        prefix={<MedicineBoxOutlined />}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item name="doctorContact" label="Doctor's Contact">
                      <Input 
                        placeholder="+237 123 456 789"
                        prefix={<PhoneOutlined />}
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="diagnosisCode" label="Diagnosis Code (if available)">
                      <Input placeholder="ICD-10 code or medical reference" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="expectedRecoveryDate" label="Expected Recovery Date">
                      <DatePicker 
                        style={{ width: '100%' }} 
                        placeholder="Select expected recovery date"
                      />
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item name="isRecurring" valuePropName="checked">
                  <Checkbox>
                    This is a recurring medical condition requiring ongoing treatment
                  </Checkbox>
                </Form.Item>
              </>
            )}

            {(selectedCategory === 'vacation' || selectedCategory === 'personal') && (
              <Alert
                message="Vacation & Personal Leave"
                description="Enjoy your time off! Remember that taking breaks is important for your wellbeing and productivity. Please provide work coverage details in the next step."
                type="info"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {selectedCategory === 'family' && (
              <Alert
                message="Family Leave"
                description="Family responsibilities are important. This leave is fully supported and confidential. Please provide emergency contact information for family-related matters."
                type="info"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {selectedCategory === 'emergency' && (
              <Alert
                message="Emergency Leave"
                description="For emergency situations, please also contact your supervisor immediately by phone. Submit this request as soon as possible."
                type="error"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {selectedCategory === 'bereavement' && (
              <Alert
                message="Bereavement Leave"
                description="We extend our deepest condolences during this difficult time. Take the time you need, and reach out to HR if you need additional support."
                type="info"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {selectedCategory === 'study' && (
              <Alert
                message="Study Leave"
                description="Professional development is encouraged! Please provide details about the training, course, or examination you'll be attending."
                type="info"
                showIcon
                style={{ marginBottom: '20px' }}
              />
            )}

            {/* Document Upload Section */}
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label={`Medical Certificate ${certificateRequired === 'required' ? '(REQUIRED)' : '(Optional)'}`}
                  extra="Upload medical certificate (PDF or image, max 5MB)"
                >
                  <Upload.Dragger {...medicalCertificateProps}>
                    <p><FileTextOutlined style={{ fontSize: '24px' }} /></p>
                    <p>Click or drag medical certificate here</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      PDF, JPG, PNG formats accepted
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Supporting Documents (Optional)"
                  extra="Additional documents (max 3 files, 5MB each)"
                >
                  <Upload.Dragger {...supportingDocsProps}>
                    <p><UploadOutlined style={{ fontSize: '24px' }} /></p>
                    <p>Click or drag additional documents here</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Prescriptions, certificates, etc.
                    </p>
                  </Upload.Dragger>
                </Form.Item>
              </Col>
            </Row>
          </div>
        );

      case 2:
        return (
          <div>
            <Title level={4}>Contact Information & Work Coverage</Title>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="emergencyContactName"
                  label="Emergency Contact Name"
                  rules={[{ required: true, message: 'Please enter emergency contact name' }]}
                >
                  <Input 
                    placeholder="Full name of emergency contact"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="emergencyContactPhone"
                  label="Emergency Contact Phone"
                  rules={[{ required: true, message: 'Please enter emergency contact phone' }]}
                >
                  <Input 
                    placeholder="+237 123 456 789"
                    prefix={<PhoneOutlined />}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="emergencyContactRelation"
                  label="Relationship"
                  rules={[{ required: true, message: 'Please specify relationship' }]}
                >
                  <Select placeholder="Select relationship">
                    <Option value="spouse">Spouse</Option>
                    <Option value="parent">Parent</Option>
                    <Option value="sibling">Sibling</Option>
                    <Option value="child">Child</Option>
                    <Option value="friend">Friend</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="emergencyContactAddress" label="Emergency Contact Address (Optional)">
              <TextArea
                rows={2}
                placeholder="Full address of emergency contact (optional)..."
                showCount
                maxLength={200}
              />
            </Form.Item>

            <Form.Item name="workCoverage" label="Work Coverage Arrangements">
              <TextArea
                rows={3}
                placeholder="Who will handle your responsibilities during your absence? Any handover notes or specific instructions..."
                showCount
                maxLength={400}
              />
            </Form.Item>

            <Form.Item name="returnToWorkPlan" label="Return to Work Plan (Optional)">
              <TextArea
                rows={2}
                placeholder="Any special arrangements needed for your return? Gradual return, work accommodations, follow-up appointments, etc..."
                showCount
                maxLength={300}
              />
            </Form.Item>

            <Form.Item name="additionalNotes" label="Additional Notes">
              <TextArea
                rows={3}
                placeholder="Any additional information relevant to your leave request..."
                showCount
                maxLength={400}
              />
            </Form.Item>

            {/* Approval Chain Preview */}
            {approvalChain.length > 0 && (
              <Card size="small" title="Approval Process" style={{ marginTop: '16px' }}>
                <Text type="secondary">Your request will be reviewed by:</Text>
                <List
                  size="small"
                  dataSource={approvalChain}
                  renderItem={(step, index) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar style={{ backgroundColor: '#1890ff' }}>{step.level}</Avatar>}
                        title={`${step.approver} (${step.role})`}
                        description={step.department}
                      />
                    </List.Item>
                  )}
                  style={{ marginTop: '8px' }}
                />
              </Card>
            )}

            <Alert
              message="Leave Policy Reminders"
              description={
                <div>
                  <p><strong>Processing Time:</strong> Most requests are processed within 24-48 hours</p>
                  <p><strong>Emergency Requests:</strong> Contact your supervisor immediately for urgent matters</p>
                  <p><strong>Documentation:</strong> Keep copies of all medical certificates and supporting documents</p>
                  <p><strong>Return to Work:</strong> A medical clearance may be required for certain medical leaves</p>
                  <p><strong>Confidentiality:</strong> All personal and medical information is kept confidential</p>
                </div>
              }
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Space align="center">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={onCancel || (() => navigate('/employee/leave'))}
            >
              Back
            </Button>
            <div>
              <Title level={2} style={{ margin: 0 }}>
                <CalendarOutlined /> {editMode ? 'Edit' : 'New'} Leave Request
              </Title>
              <Text type="secondary">Submit a leave request for approval</Text>
            </div>
          </Space>
        </div>

        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Text strong>Employee:</Text><br />
              <Text>{user?.fullName}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Department:</Text><br />
              <Text>{user?.department}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Position:</Text><br />
              <Text>{user?.position}</Text>
            </Col>
            <Col span={6}>
              <Text strong>Employee ID:</Text><br />
              <Text>{user?.employeeId}</Text>
            </Col>
          </Row>
        </Card>

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

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          {renderStepContent()}

          <Divider />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              {currentStep > 0 && (
                <Button onClick={() => {
                  // Save current form data before going back
                  const currentValues = form.getFieldsValue();
                  setStoredFormData(prevData => ({ ...(prevData || {}), ...currentValues }));
                  setCurrentStep(currentStep - 1);
                }}>
                  Previous
                </Button>
              )}
            </div>

            <div>
              {/* Debug button - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <Button 
                  size="small"
                  onClick={() => {
                    const currentValues = form.getFieldsValue();
                    console.log('=== DEBUG FORM STATE ===');
                    console.log('Current step:', currentStep);
                    console.log('All form values:', currentValues);
                    console.log('Leave dates:', currentValues.leaveDates);
                    console.log('Selected leave type:', selectedLeaveType);
                    console.log('Selected category:', selectedCategory);
                    console.log('Estimated duration:', estimatedDuration);
                    console.log('========================');
                    
                    // Show form state in an alert as well
                    const hasLeaveDates = !!(currentValues.leaveDates && currentValues.leaveDates[0] && currentValues.leaveDates[1]);
                    message.info(`Form State: Step ${currentStep}, Leave Type: ${selectedLeaveType}, Has Dates: ${hasLeaveDates}`);
                  }}
                  style={{ marginRight: '8px' }}
                >
                  Debug Form
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button 
                  type="primary" 
                  onClick={() => {
                    // Save current form data before moving to next step
                    const currentValues = form.getFieldsValue();
                    setStoredFormData(prevData => ({ ...(prevData || {}), ...currentValues }));
                    
                    // Validate current step before moving to next
                    if (currentStep === 0) {
                      console.log('Step 0 validation - Current values:', currentValues);
                      console.log('Step 0 validation - Selected leave type:', selectedLeaveType);
                      
                      if (!selectedLeaveType) {
                        message.error('Please select a leave type');
                        return;
                      }
                      if (!currentValues.leaveDates || !currentValues.leaveDates[0] || !currentValues.leaveDates[1]) {
                        message.error('Please select leave start and end dates');
                        return;
                      }
                      if (!currentValues.reason || currentValues.reason.trim().length < 10) {
                        message.error('Please provide a detailed reason for leave');
                        return;
                      }
                    }
                    console.log('Moving to step:', currentStep + 1);
                    setCurrentStep(currentStep + 1);
                  }}
                  disabled={!selectedLeaveType}
                >
                  Next
                </Button>
              ) : (
                <Space>
                  <Button 
                    icon={<SaveOutlined />}
                    onClick={handleSaveDraft}
                    loading={loading}
                  >
                    Save Draft
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading} 
                    icon={<SendOutlined />}
                    disabled={certificateRequired === 'required' && medicalCertificate.length === 0}
                  >
                    {editMode ? 'Update Request' : 'Submit Request'}
                  </Button>
                </Space>
              )}
            </div>
          </div>
        </Form>

        {/* Contextual warnings */}
        {urgencyLevel === 'critical' && (
          <Alert
            message="Emergency Leave Notice"
            description="For emergency situations, please also contact your supervisor immediately by phone to ensure urgent matters are handled promptly."
            type="error"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}

        {estimatedDuration > 5 && selectedCategory !== 'vacation' && (
          <Alert
            message="Extended Leave Notice"
            description="For leave exceeding 5 days, additional documentation may be required and your case will receive special HR review."
            type="warning"
            showIcon
            style={{ marginTop: '16px' }}
          />
        )}
      </Card>
    </div>
  );
};

export default LeaveRequestForm;


