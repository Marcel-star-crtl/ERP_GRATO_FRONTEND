import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Form, Input, Button, Select, DatePicker, InputNumber, Upload, message, Card, Typography, Space, Alert, Spin } from 'antd';
import { UploadOutlined, PlusOutlined, InfoCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import cashRequestAPI from '../../services/cashRequestAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CashRequestForm = ({ editMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectsLoaded, setProjectsLoaded] = useState(false);
  const [selectedRequestType, setSelectedRequestType] = useState(null);
  const [requestAmount, setRequestAmount] = useState(0);
  
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const requestTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'emergency', label: 'Emergency Expenses' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'training', label: 'Training & Development' },
    { value: 'other', label: 'Other' }
  ];

  // Fetch projects when user focuses on the project code field
  const handleProjectFieldFocus = async () => {
    if (!projectsLoaded && projects.length === 0) {
      await fetchActiveProjects();
    }
  };

  const fetchActiveProjects = async () => {
    try {
      setLoadingProjects(true);
      console.log('=== FETCHING ACTIVE PROJECTS ===');
      console.log('API Base URL:', process.env.REACT_APP_API_UR || 'http://localhost:5001/api');
      
      const response = await cashRequestAPI.get('/projects/active');
      
      console.log('Projects API Response:', response);
      console.log('Response data:', response.data);

      if (response.data.success) {
        const projectsList = response.data.data || [];
        console.log(`Successfully fetched ${projectsList.length} projects`);
        
        setProjects(projectsList);
        setProjectsLoaded(true);
        
        if (projectsList.length === 0) {
          message.info('No active projects found. You can still submit without selecting a project.');
        } else {
          message.success(`Loaded ${projectsList.length} active projects`);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
    } catch (error) {
      console.error('=== ERROR FETCHING PROJECTS ===');
      console.error('Error details:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      // More specific error handling
      if (error.response) {
        // Server responded with error status
        console.error('Server error status:', error.response.status);
        console.error('Server error data:', error.response.data);
        
        if (error.response.status === 404) {
          message.warning('Projects endpoint not found. Please contact your administrator.');
        } else if (error.response.status === 401) {
          message.error('Not authorized to view projects. Please log in again.');
        } else {
          message.error(`Failed to load projects: ${error.response.data?.message || error.message}`);
        }
      } else if (error.request) {
        // Request made but no response
        console.error('No response received:', error.request);
        message.error('No response from server. Please check your connection.');
      } else {
        // Error setting up request
        console.error('Request setup error:', error.message);
        message.error('Failed to load projects. You can still submit without selecting a project.');
      }
      
      setProjects([]);
      setProjectsLoaded(true); // Mark as loaded to prevent repeated attempts
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleProjectChange = (projectId) => {
    console.log('=== PROJECT SELECTED ===');
    console.log('Project ID:', projectId);
    
    if (projectId) {
      const project = projects.find(p => p._id === projectId);
      console.log('Project details:', project);
      
      setSelectedProject(project);
      
      // Display budget information if available
      if (project && project.budgetCodeId) {
        // Check for different field names that might contain the remaining budget
        const remaining = project.budgetCodeId.remaining || 
                         project.budgetCodeId.available || 
                         (project.budgetCodeId.budget && project.budgetCodeId.used ? 
                           project.budgetCodeId.budget - project.budgetCodeId.used : 0);
        
        console.log('Budget Code Details:', {
          code: project.budgetCodeId.code,
          name: project.budgetCodeId.name,
          budget: project.budgetCodeId.budget || project.budgetCodeId.totalBudget,
          used: project.budgetCodeId.used,
          remaining: project.budgetCodeId.remaining,
          available: project.budgetCodeId.available,
          calculated_remaining: remaining
        });
        
        console.log(`Project budget available: XAF ${remaining.toLocaleString()}`);
        
        if (remaining <= 0) {
          message.warning('Selected project has no remaining budget. Finance will need to assign additional funds or select a different budget code.');
        } else {
          message.success(`Project budget available: XAF ${remaining.toLocaleString()}`);
        }
      } else {
        console.log('Project has no assigned budget code');
        message.info('Selected project has no budget code assigned. Finance will assign one during approval.');
      }
    } else {
      setSelectedProject(null);
      console.log('Project selection cleared');
    }
  };

  // Determine if supporting documents are required
  const areDocumentsRequired = () => {
    // Documents are compulsory for:
    // 1. Amounts above 100,000 XAF
    // 2. Travel expenses (need receipts/proofs)
    // 3. Project materials (need quotes/invoices)
    // 4. Training requests (need brochures/invoices)
    // 5. Client entertainment (need receipts)
    
    const highValueThreshold = 100000;
    const documentRequiredTypes = ['travel', 'project-materials', 'training', 'client-entertainment'];
    
    if (requestAmount >= highValueThreshold) {
      return true;
    }
    
    if (selectedRequestType && documentRequiredTypes.includes(selectedRequestType)) {
      return true;
    }
    
    return false;
  };

  const getDocumentRequirementMessage = () => {
    if (requestAmount >= 100000) {
      return `Supporting documents are REQUIRED for requests above XAF 100,000`;
    }
    
    const typeMessages = {
      'travel': 'Supporting documents are REQUIRED for travel expenses (quotes, receipts, itinerary, etc.)',
      'project-materials': 'Supporting documents are REQUIRED for project materials (quotes, invoices, specifications)',
      'training': 'Supporting documents are REQUIRED for training requests (brochures, invoices, course details)',
      'client-entertainment': 'Supporting documents are REQUIRED for client entertainment (receipts, guest list, etc.)'
    };
    
    return typeMessages[selectedRequestType] || 'Supporting documents may be required based on request details';
  };

  const handleSubmit = async (values) => {
    try {
      const amount = parseFloat(values.amountRequested);
      if (isNaN(amount) || amount <= 0) {
        message.error('Please enter a valid amount greater than 0');
        return;
      }

      // Check if supporting documents are required
      if (areDocumentsRequired() && fileList.length === 0) {
        message.error({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Supporting Documents Required</div>
              <div>{getDocumentRequirementMessage()}</div>
            </div>
          ),
          duration: 8
        });
        return;
      }

      // Check budget availability if project is selected
      if (selectedProject && selectedProject.budgetCodeId) {
        // Use the same logic as handleProjectChange to get available budget
        const availableBudget = selectedProject.budgetCodeId.remaining || 
                               selectedProject.budgetCodeId.available || 
                               (selectedProject.budgetCodeId.budget && selectedProject.budgetCodeId.used ? 
                                 selectedProject.budgetCodeId.budget - selectedProject.budgetCodeId.used : 0);
        
        console.log('Budget validation:', {
          requestedAmount: amount,
          availableBudget,
          budgetDetails: selectedProject.budgetCodeId
        });
        
        if (availableBudget > 0 && amount > availableBudget) {
          const proceed = window.confirm(
            `Warning: Requested amount (XAF ${amount.toLocaleString()}) exceeds available budget (XAF ${availableBudget.toLocaleString()}). ` +
            `Finance may need to allocate additional funds or select a different budget code. Continue?`
          );
          
          if (!proceed) {
            return;
          }
        } else if (availableBudget <= 0) {
          const proceed = window.confirm(
            `Warning: Selected project has no available budget (XAF ${availableBudget.toLocaleString()}). ` +
            `Finance will need to allocate funds to this project. Continue?`
          );
          
          if (!proceed) {
            return;
          }
        }
      }

      setLoading(true);
      console.log('=== SUBMITTING CASH REQUEST ===');
      console.log('Form values:', values);
      console.log('Selected project:', selectedProject);

      const formData = new FormData();
      formData.append('requestType', values.requestType);
      formData.append('amountRequested', amount); 
      formData.append('purpose', values.purpose);
      formData.append('businessJustification', values.businessJustification);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

      // Add project information
      if (values.projectCode) {
        // projectCode now contains the projectId from the select
        formData.append('projectId', values.projectCode);
        console.log('Project ID attached to request:', values.projectCode);
      }

      // Add file attachments
      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj, file.name);
        } else if (file instanceof File) {
          formData.append('attachments', file, file.name);
        }
      });

      // Debug FormData
      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`${pair[0]}: File - ${pair[1].name} (${pair[1].size} bytes)`);
        } else {
          console.log(`${pair[0]}:`, pair[1]);
        }
      }

      // Submit to backend
      const response = await cashRequestAPI.post('/cash-requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      console.log('=== REQUEST SUBMITTED SUCCESSFULLY ===');
      console.log('Response:', response.data);

      if (response.data.success) {
        message.success(
          <div>
            <div>Cash request submitted successfully!</div>
            <div style={{ fontSize: '12px', marginTop: '4px', opacity: 0.8 }}>
              Reference: {response.data.data?.displayId || response.data.data?._id?.slice(-6)?.toUpperCase()}
            </div>
          </div>
        );
        navigate('/employee/requests');
      } else {
        message.error(response.data.message || 'Request submission failed');
      }
    } catch (error) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error:', error);

      if (error.response) {
        const { status, data } = error.response;
        console.error('Error status:', status);
        console.error('Error data:', data);

        if (status === 400 && data.message?.includes('approval chain')) {
          message.error('Unable to determine approval chain for your department. Please contact HR.');
        } else if (status === 413) {
          message.error('Files too large. Please reduce file sizes and try again.');
        } else if (data?.message) {
          message.error(data.message);
        } else {
          message.error('Failed to submit request. Please try again.');
        }
      } else if (error.request) {
        message.error('No response from server. Please check your connection.');
      } else {
        message.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
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
      const allowedTypes = [
        'image/', 'application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv', 'application/rtf'
      ];

      const isValidType = allowedTypes.some(type => file.type.startsWith(type));
      const isLt10M = file.size / 1024 / 1024 < 10;

      if (!isValidType) {
        message.error('You can upload images, PDFs, Word docs, Excel files, text files, and other documents!');
        return false;
      }
      if (!isLt10M) {
        message.error('File must be smaller than 10MB!');
        return false;
      }

      setFileList([...fileList, file]);
      return false; 
    },
    fileList,
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf',
    multiple: true,
    listType: 'text',
    showUploadList: {
      showPreviewIcon: true,
      showDownloadIcon: false,
      showRemoveIcon: true
    }
  };

  return (
    <Card>
      <Title level={3}>{editMode ? 'Edit' : 'New'} Cash Request</Title>

      {/* Information Alert */}
      <Alert
        message="Automatic Approval Process with Budget Tracking"
        description={
          <div>
            <Text>Your request will be automatically routed through the approval chain. If you select a project, the budget will be tracked automatically.</Text>
            <br />
            <Text type="secondary">
              Current Employee: <Text strong>{user?.fullName}</Text> | 
              Department: <Text strong>{user?.department}</Text>
            </Text>
          </div>
        }
        type="info"
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '24px' }}
        showIcon
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="requestType"
          label="Request Type"
          rules={[{ required: true, message: 'Please select a request type' }]}
        >
          <Select 
            placeholder="Select request type"
            onChange={(value) => {
              setSelectedRequestType(value);
              // Show information about document requirements
              const documentRequiredTypes = ['travel', 'project-materials', 'training', 'client-entertainment'];
              if (documentRequiredTypes.includes(value)) {
                message.info(`Note: Supporting documents will be required for ${requestTypes.find(t => t.value === value)?.label}`, 4);
              }
            }}
          >
            {requestTypes.map(type => (
              <Option key={type.value} value={type.value}>
                {type.label}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="amountRequested"
          label="Amount Requested (XAF)"
          rules={[{ 
            required: true, 
            message: 'Please enter the amount'
          }, {
            type: 'number',
            min: 1,
            message: 'Amount must be greater than 0'
          }]}
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            step={1}
            placeholder="Enter amount (e.g., 50000)"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/,/g, '')}
            controls={false}
            onChange={(value) => {
              setRequestAmount(value || 0);
              // Show document requirement warning for high amounts
              if (value >= 100000) {
                message.warning('Note: Supporting documents are REQUIRED for amounts above XAF 100,000', 5);
              }
            }}
          />
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Purpose"
          rules={[{ 
            required: true,
            min: 10,
            message: 'Please provide a detailed purpose (minimum 10 characters)'
          }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Describe what the cash will be used for"
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
            placeholder="Explain why this request is necessary for business operations and how it aligns with company objectives"
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item
          name="urgency"
          label="Urgency Level"
          rules={[{ required: true, message: 'Please select urgency level' }]}
          extra="Higher urgency requests may receive priority in the approval process"
        >
          <Select placeholder="Select urgency level">
            <Option value="low">
              <span style={{ color: '#52c41a' }}>● Low</span> - Standard processing (5-7 business days)
            </Option>
            <Option value="medium">
              <span style={{ color: '#faad14' }}>● Medium</span> - Moderate priority (3-5 business days)
            </Option>
            <Option value="high">
              <span style={{ color: '#f5222d' }}>● High</span> - High priority (1-3 business days)
            </Option>
            <Option value="urgent">
              <span style={{ color: '#722ed1' }}>● Urgent</span> - Immediate attention required
            </Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="requiredDate"
          label="Required By Date"
          rules={[{ required: true, message: 'Please select when you need this cash' }]}
          extra="Select the date when you need the funds to be available"
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabledDate={(current) => current && current < dayjs().startOf('day')}
            placeholder="Select required date"
          />
        </Form.Item>

        {/* PROJECT SELECTION - Using existing Project Code field */}
        <Form.Item
          name="projectCode"
          label="Project Code (Optional)"
          extra="Click here to select a project. If you select a project with a budget code, funds will be deducted automatically upon approval."
        >
          <Select
            placeholder="Click to load and select a project (optional)"
            allowClear
            loading={loadingProjects}
            onFocus={handleProjectFieldFocus}
            onChange={handleProjectChange}
            showSearch
            notFoundContent={loadingProjects ? <Spin size="small" /> : (projectsLoaded ? 'No projects found' : 'Click to load projects')}
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {projects.map(project => (
              <Option key={project._id} value={project._id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{project.name} ({project.department})</span>
                  {project.budgetCodeId && (
                    <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      Budget: XAF {project.budgetCodeId.remaining?.toLocaleString() || '0'}
                    </span>
                  )}
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        {/* Budget Information Display */}
        {selectedProject && (
          <Alert
            message="Project Budget Information"
            description={
              <div>
                <p><strong>Project:</strong> {selectedProject.name}</p>
                <p><strong>Department:</strong> {selectedProject.department}</p>
                {selectedProject.budgetCodeId ? (
                  (() => {
                    // Calculate available budget using the same logic
                    const totalBudget = selectedProject.budgetCodeId.budget || selectedProject.budgetCodeId.totalBudget || 0;
                    const used = selectedProject.budgetCodeId.used || 0;
                    const remaining = selectedProject.budgetCodeId.remaining || 
                                    selectedProject.budgetCodeId.available || 
                                    (totalBudget - used);
                    
                    return (
                      <>
                        <p><strong>Budget Code:</strong> {selectedProject.budgetCodeId.code} - {selectedProject.budgetCodeId.name}</p>
                        <p><strong>Total Budget:</strong> XAF {totalBudget.toLocaleString()}</p>
                        <p><strong>Used:</strong> XAF {used.toLocaleString()}</p>
                        <p><strong>Available:</strong> <Text strong style={{ color: remaining > 0 ? '#52c41a' : '#f5222d' }}>
                          XAF {remaining.toLocaleString()}
                        </Text></p>
                        {remaining <= 0 && (
                          <p style={{ color: '#f5222d', marginTop: '8px' }}>
                            <ExclamationCircleOutlined /> No budget available. Finance will need to allocate additional funds.
                          </p>
                        )}
                      </>
                    );
                  })()
                ) : (
                  <p style={{ color: '#faad14' }}>
                    <InfoCircleOutlined /> This project does not have a budget code assigned yet. Finance will assign one during approval.
                  </p>
                )}
              </div>
            }
            type={selectedProject.budgetCodeId ? 
              ((() => {
                const remaining = selectedProject.budgetCodeId.remaining || 
                                selectedProject.budgetCodeId.available || 
                                ((selectedProject.budgetCodeId.budget || selectedProject.budgetCodeId.totalBudget || 0) - 
                                 (selectedProject.budgetCodeId.used || 0));
                return remaining > 0 ? "success" : "warning";
              })()) : "warning"}
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {!selectedProject && projectsLoaded && (
          <Alert
            message="No Project Selected"
            description="You haven't selected a project. Finance will assign this request to an appropriate budget code during the approval process."
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form.Item
          label={
            <span>
              Supporting Documents
              {areDocumentsRequired() && (
                <span style={{ color: '#f5222d', marginLeft: '4px' }}>*</span>
              )}
            </span>
          }
          extra={
            <div>
              <div>Upload receipts, quotes, or other supporting documents (Images or PDF, max 5 files, 10MB each)</div>
              {areDocumentsRequired() && (
                <div style={{ color: '#f5222d', fontWeight: 'bold', marginTop: '4px' }}>
                  {getDocumentRequirementMessage()}
                </div>
              )}
            </div>
          }
          rules={areDocumentsRequired() ? [
            {
              validator: () => {
                if (fileList.length === 0) {
                  return Promise.reject(new Error('Supporting documents are required for this request type/amount'));
                }
                return Promise.resolve();
              }
            }
          ] : []}
        >
          <Upload {...uploadProps}>
            {fileList.length >= 5 ? null : (
              <div style={{
                borderColor: areDocumentsRequired() && fileList.length === 0 ? '#f5222d' : undefined,
                borderWidth: areDocumentsRequired() && fileList.length === 0 ? '2px' : undefined
              }}>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>
                  {areDocumentsRequired() ? 'Upload Required Documents' : 'Upload Documents'}
                </div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/employee/requests')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={loading}
            >
              {loading ? 'Submitting...' : (editMode ? 'Update Request' : 'Submit Request')}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CashRequestForm;




