// src/pages/hr/EmployeeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Space,
  message,
  Divider,
  Typography,
  Steps,
  Alert,
  Spin
} from 'antd';
import {
  UserOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  BankOutlined,
  IdcardOutlined,
  TeamOutlined,
  PlusOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [employeeData, setEmployeeData] = useState(null);

  const isEditMode = !!id;

  useEffect(() => {
    if (isEditMode) {
      fetchEmployeeData();
    }
  }, [id]);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/hr/employees/${id}`);
      const employee = response.data.data;
      
      setEmployeeData(employee);
      
      // Populate form with existing data
      form.setFieldsValue({
        fullName: employee.fullName,
        email: employee.email,
        department: employee.department,
        position: employee.position,
        role: employee.role,
        departmentRole: employee.departmentRole,
        
        // Employment details
        employeeId: employee.employmentDetails?.employeeId,
        contractType: employee.employmentDetails?.contractType,
        employmentStatus: employee.employmentDetails?.employmentStatus,
        startDate: employee.employmentDetails?.startDate ? dayjs(employee.employmentDetails.startDate) : null,
        contractEndDate: employee.employmentDetails?.contractEndDate ? dayjs(employee.employmentDetails.contractEndDate) : null,
        probationEndDate: employee.employmentDetails?.probationEndDate ? dayjs(employee.employmentDetails.probationEndDate) : null,
        
        // Salary
        salaryAmount: employee.employmentDetails?.salary?.amount,
        salaryCurrency: employee.employmentDetails?.salary?.currency || 'XAF',
        paymentFrequency: employee.employmentDetails?.salary?.paymentFrequency,
        
        // Government IDs
        cnpsNumber: employee.employmentDetails?.governmentIds?.cnpsNumber,
        taxPayerNumber: employee.employmentDetails?.governmentIds?.taxPayerNumber,
        nationalIdNumber: employee.employmentDetails?.governmentIds?.nationalIdNumber,
        
        // Emergency contacts
        emergencyContacts: employee.employmentDetails?.emergencyContacts || [],
        
        hrNotes: employee.employmentDetails?.hrNotes
      });
      
    } catch (error) {
      console.error('Error fetching employee:', error);
      message.error('Failed to load employee data');
      navigate('/hr/employees');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const payload = {
        fullName: values.fullName,
        email: values.email,
        department: values.department,
        position: values.position,
        role: values.role || 'employee',
        departmentRole: values.departmentRole || 'staff',
        
        employmentDetails: {
          employeeId: values.employeeId,
          contractType: values.contractType,
          employmentStatus: values.employmentStatus,
          startDate: values.startDate?.format('YYYY-MM-DD'),
          contractEndDate: values.contractEndDate?.format('YYYY-MM-DD'),
          probationEndDate: values.probationEndDate?.format('YYYY-MM-DD'),
          
          salary: {
            amount: values.salaryAmount,
            currency: values.salaryCurrency,
            paymentFrequency: values.paymentFrequency
          },
          
          governmentIds: {
            cnpsNumber: values.cnpsNumber,
            taxPayerNumber: values.taxPayerNumber,
            nationalIdNumber: values.nationalIdNumber
          },
          
          emergencyContacts: values.emergencyContacts || [],
          hrNotes: values.hrNotes
        }
      };

      if (isEditMode) {
        await api.put(`/hr/employees/${id}`, payload);
        message.success('Employee updated successfully');
      } else {
        // Generate password for new employee
        payload.password = generateTemporaryPassword();
        
        const response = await api.post('/hr/employees', payload);
        message.success('Employee created successfully. Login credentials sent to their email.');
        navigate(`/hr/employees/${response.data.data._id}`);
        return;
      }
      
      navigate(`/hr/employees/${id}`);
      
    } catch (error) {
      console.error('Error saving employee:', error);
      message.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setSubmitting(false);
    }
  };

  const generateTemporaryPassword = () => {
    // Generate a secure temporary password
    return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  };

  const calculateProbationEndDate = (startDate) => {
    if (startDate) {
      // Default probation period is 3 months
      return dayjs(startDate).add(3, 'months');
    }
    return null;
  };

  const handleStartDateChange = (date) => {
    if (date && form.getFieldValue('contractType') === 'Probation') {
      form.setFieldsValue({
        probationEndDate: calculateProbationEndDate(date)
      });
    }
  };

  const handleContractTypeChange = (contractType) => {
    const startDate = form.getFieldValue('startDate');
    
    if (contractType === 'Probation' && startDate) {
      form.setFieldsValue({
        probationEndDate: calculateProbationEndDate(startDate),
        employmentStatus: 'Probation'
      });
    } else if (contractType === 'Permanent') {
      form.setFieldsValue({
        contractEndDate: null
      });
    }
  };

  const steps = [
    {
      title: 'Personal Info',
      icon: <UserOutlined />
    },
    {
      title: 'Employment',
      icon: <IdcardOutlined />
    },
    {
      title: 'Emergency Contact',
      icon: <PhoneOutlined />
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/hr/employees')}
            style={{ marginBottom: '16px' }}
          >
            Back to Employees
          </Button>
          
          <Title level={2}>
            {isEditMode ? 'Edit Employee' : 'Add New Employee'}
          </Title>
          
          {!isEditMode && (
            <Alert
              message="Employee Account Creation"
              description="A temporary password will be generated and sent to the employee's email. They will be prompted to change it on first login. Documents can be uploaded after creating the account."
              type="info"
              showIcon
              style={{ marginTop: '16px' }}
            />
          )}
        </div>

        {/* Progress Steps */}
        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          {steps.map((step, index) => (
            <Steps.Step
              key={index}
              title={step.title}
              icon={step.icon}
              onClick={() => setCurrentStep(index)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </Steps>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            salaryCurrency: 'XAF',
            paymentFrequency: 'Monthly',
            role: 'employee',
            departmentRole: 'staff',
            employmentStatus: 'Probation',
            contractType: 'Probation'
          }}
        >
          {/* Step 1: Personal Information */}
          {currentStep === 0 && (
            <>
              <Divider orientation="left">
                <UserOutlined /> Personal Information
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="fullName"
                    label="Full Name"
                    rules={[
                      { required: true, message: 'Please enter full name' }
                    ]}
                  >
                    <Input 
                      placeholder="e.g., Tom Grato" 
                      prefix={<UserOutlined />}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email Address"
                    rules={[
                      { required: true, message: 'Please enter email' },
                      { type: 'email', message: 'Please enter valid email' }
                    ]}
                  >
                    <Input 
                      placeholder="john.doe@company.com" 
                      prefix={<MailOutlined />}
                      disabled={isEditMode}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="department"
                    label="Department"
                    rules={[
                      { required: true, message: 'Please select department' }
                    ]}
                  >
                    <Select placeholder="Select department">
                      <Option value="Technical">Technical</Option>
                      <Option value="Business Development & Supply Chain">Business Development & Supply Chain</Option>
                      <Option value="HR & Admin">HR & Admin</Option>
                      <Option value="Executive">Executive</Option>
                      <Option value="Finance">Finance</Option>
                      <Option value="Operations">Operations</Option>
                      <Option value="IT">IT</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="position"
                    label="Position/Job Title"
                    rules={[
                      { required: true, message: 'Please enter position' }
                    ]}
                  >
                    <Input placeholder="e.g., Software Developer" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="role"
                    label="System Role"
                    tooltip="Determines system access permissions"
                  >
                    <Select placeholder="Select role">
                      <Option value="employee">Employee</Option>
                      <Option value="supervisor">Supervisor</Option>
                      <Option value="hr">HR</Option>
                      <Option value="finance">Finance</Option>
                      <Option value="supply_chain">Supply Chain</Option>
                      <Option value="buyer">Buyer</Option>
                      <Option value="it">IT</Option>
                      <Option value="hse">HSE</Option>
                      <Option value="admin">Admin</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="departmentRole"
                    label="Department Role"
                  >
                    <Select placeholder="Select department role">
                      <Option value="staff">Staff</Option>
                      <Option value="coordinator">Coordinator</Option>
                      <Option value="supervisor">Supervisor</Option>
                      <Option value="head">Department Head</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <div style={{ textAlign: 'right', marginTop: '24px' }}>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(1)}
                >
                  Next: Employment Details
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Employment Details */}
          {currentStep === 1 && (
            <>
              <Divider orientation="left">
                <IdcardOutlined /> Employment Details
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="employeeId"
                    label="Employee ID"
                    tooltip="Company-specific employee identification number"
                  >
                    <Input placeholder="e.g., EMP-001" prefix={<IdcardOutlined />} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="contractType"
                    label="Contract Type"
                    rules={[
                      { required: true, message: 'Please select contract type' }
                    ]}
                  >
                    <Select 
                      placeholder="Select contract type"
                      onChange={handleContractTypeChange}
                    >
                      <Option value="Probation">Probation</Option>
                      <Option value="Permanent">Permanent</Option>
                      <Option value="Fixed-Term Contract">Fixed-Term Contract</Option>
                      <Option value="Intern">Intern</Option>
                      <Option value="Consultant">Consultant</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="employmentStatus"
                    label="Employment Status"
                    rules={[
                      { required: true, message: 'Please select status' }
                    ]}
                  >
                    <Select placeholder="Select status">
                      <Option value="Probation">Probation</Option>
                      <Option value="Active">Active</Option>
                      <Option value="On Leave">On Leave</Option>
                      <Option value="Suspended">Suspended</Option>
                      <Option value="Notice Period">Notice Period</Option>
                      <Option value="Inactive">Inactive</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="startDate"
                    label="Start Date"
                    rules={[
                      { required: true, message: 'Please select start date' }
                    ]}
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      onChange={handleStartDateChange}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="probationEndDate"
                    label="Probation End Date"
                    tooltip="Automatically calculated as 3 months from start date"
                  >
                    <DatePicker 
                      style={{ width: '100%' }}
                      disabled
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="contractEndDate"
                    label="Contract End Date"
                    tooltip="Only for fixed-term contracts"
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                <BankOutlined /> Compensation
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="salaryAmount"
                    label="Salary Amount"
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="500000"
                      min={0}
                      formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="salaryCurrency"
                    label="Currency"
                  >
                    <Select>
                      <Option value="XAF">XAF (CFA Franc)</Option>
                      <Option value="USD">USD</Option>
                      <Option value="EUR">EUR</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="paymentFrequency"
                    label="Payment Frequency"
                  >
                    <Select>
                      <Option value="Monthly">Monthly</Option>
                      <Option value="Bi-weekly">Bi-weekly</Option>
                      <Option value="Weekly">Weekly</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Divider orientation="left">
                <IdcardOutlined /> Government IDs
              </Divider>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name="cnpsNumber"
                    label="CNPS Registration Number"
                  >
                    <Input placeholder="CNPS Number" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="taxPayerNumber"
                    label="Taxpayer Registration Number"
                  >
                    <Input placeholder="Tax ID" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="nationalIdNumber"
                    label="National ID Number"
                  >
                    <Input placeholder="National ID" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="hrNotes"
                label="HR Notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Internal notes (not visible to employee)"
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <Button onClick={() => setCurrentStep(0)}>
                  Previous
                </Button>
                <Button
                  type="primary"
                  onClick={() => setCurrentStep(2)}
                >
                  Next: Emergency Contact
                </Button>
              </div>
            </>
          )}

          {/* Step 3: Emergency Contacts */}
          {currentStep === 2 && (
            <>
              <Divider orientation="left">
                <PhoneOutlined /> Emergency Contacts
              </Divider>

              <Alert
                message="Emergency Contact Information"
                description="Add at least one emergency contact person who can be reached in case of emergencies."
                type="info"
                showIcon
                style={{ marginBottom: '24px' }}
              />

              <Form.List name="emergencyContacts">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map((field, index) => (
                      <Card
                        key={field.key}
                        size="small"
                        title={`Emergency Contact ${index + 1}`}
                        extra={
                          fields.length > 1 && (
                            <Button
                              type="link"
                              danger
                              onClick={() => remove(field.name)}
                            >
                              Remove
                            </Button>
                          )
                        }
                        style={{ marginBottom: '16px' }}
                      >
                        <Row gutter={16}>
                          <Col xs={24} md={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'name']}
                              label="Contact Name"
                              rules={[
                                { required: true, message: 'Please enter contact name' }
                              ]}
                            >
                              <Input placeholder="e.g., Tom Grato" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'relationship']}
                              label="Relationship"
                              rules={[
                                { required: true, message: 'Please enter relationship' }
                              ]}
                            >
                              <Input placeholder="e.g., Spouse, Parent, Sibling" />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'phone']}
                              label="Phone Number"
                              rules={[
                                { required: true, message: 'Please enter phone number' }
                              ]}
                            >
                              <Input placeholder="+237 XXX XXX XXX" prefix={<PhoneOutlined />} />
                            </Form.Item>
                          </Col>

                          <Col xs={24} md={12}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'email']}
                              label="Email (Optional)"
                              rules={[
                                { type: 'email', message: 'Please enter valid email' }
                              ]}
                            >
                              <Input placeholder="contact@email.com" prefix={<MailOutlined />} />
                            </Form.Item>
                          </Col>

                          <Col xs={24}>
                            <Form.Item
                              {...field}
                              name={[field.name, 'isPrimary']}
                              valuePropName="checked"
                            >
                              <input type="checkbox" /> Set as primary contact
                            </Form.Item>
                          </Col>
                        </Row>
                      </Card>
                    ))}

                    <Button
                      type="dashed"
                      onClick={() => add()}
                      block
                      icon={<PlusOutlined />}
                      style={{ marginBottom: '24px' }}
                    >
                      Add Emergency Contact
                    </Button>
                  </>
                )}
              </Form.List>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                <Button onClick={() => setCurrentStep(1)}>
                  Previous
                </Button>
                <Space>
                  <Button onClick={() => navigate('/hr/employees')}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={submitting}
                    icon={<SaveOutlined />}
                  >
                    {isEditMode ? 'Update Employee' : 'Create Employee'}
                  </Button>
                </Space>
              </div>
            </>
          )}
        </Form>
      </Card>
    </div>
  );
};

export default EmployeeForm;