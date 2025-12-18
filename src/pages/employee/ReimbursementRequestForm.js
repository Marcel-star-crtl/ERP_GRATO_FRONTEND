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
  Card,
  Typography,
  Space,
  Alert,
  Divider,
  Row,
  Col,
  Tag,
  Statistic,
  Switch,
  Tooltip,
  App
} from 'antd';
import {
  UploadOutlined,
  DollarOutlined,
  InfoCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { cashRequestAPI } from '../../services/cashRequestAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ReimbursementRequestForm = () => {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  
  const [limitStatus, setLimitStatus] = useState(null);
  const [loadingLimit, setLoadingLimit] = useState(true);
  
  const navigate = useNavigate();
  const { user, token } = useSelector((state) => state.auth);

  const requestTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'emergency', label: 'Emergency Expenses' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'training', label: 'Training & Development' },
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
    if (!token) {
      message.error('Please login to access this page');
      navigate('/login');
      return;
    }
    fetchLimitStatus();
  }, [token, navigate]);

  const fetchLimitStatus = async () => {
    try {
      setLoadingLimit(true);
      const response = await cashRequestAPI.getReimbursementLimitStatus();
      
      if (response.success || response.data) {
        const data = response.data || response;
        setLimitStatus(data);
        
        if (!data.canSubmit) {
          message.warning({
            content: `You have reached your monthly reimbursement limit (${data.count}/${data.limit})`,
            duration: 5
          });
        }
      }
    } catch (error) {
      console.error('Error fetching limit status:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        message.error('Failed to check reimbursement limit');
      }
    } finally {
      setLoadingLimit(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      console.log('\n=== SUBMITTING REIMBURSEMENT REQUEST ===');
      
      if (!limitStatus?.canSubmit) {
        message.error('You have reached your monthly reimbursement limit');
        return;
      }

      if (!values.requestType) {
        message.error('Please select an expense category');
        return;
      }
      
      const amount = values.amountRequested;
      if (!amount || amount <= 0) {
        message.error('Please enter a valid amount');
        return;
      }

      if (amount > 100000) {
        message.error('Reimbursement amount cannot exceed XAF 100,000');
        return;
      }

      if (fileList.length === 0) {
        message.error('Receipt documents are mandatory for reimbursement requests');
        return;
      }

      setLoading(true);
      console.log('Files to upload:', fileList.length);

      const formData = new FormData();
      
      formData.append('requestMode', 'reimbursement');
      formData.append('requestType', values.requestType);
      formData.append('amountRequested', amount);
      formData.append('purpose', values.purpose);
      formData.append('businessJustification', values.businessJustification);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('receiptDocuments', file.originFileObj, file.name);
          console.log(`   ${index + 1}. ✓ Added receipt: ${file.name}`);
        }
      });

      console.log('\n📦 FormData contents:');
      for (let pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`   ${pair[0]}: [File] ${pair[1].name}`);
        } else {
          console.log(`   ${pair[0]}:`, pair[1]);
        }
      }

      console.log('\n🌐 Sending request...');
      const response = await cashRequestAPI.createReimbursementRequest(formData);

      console.log('✅ Response:', response);

      if (response.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Reimbursement request submitted successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>📎 {fileList.length} receipt(s) uploaded</div>
                <div>📊 Monthly limit: {response.limitInfo?.monthlyUsed}/{response.limitInfo?.monthlyLimit} used</div>
                <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
                  ✅ No justification required - Completed after disbursement
                </div>
              </div>
            </div>
          ),
          duration: 6
        });
        
        setTimeout(() => {
          navigate('/employee/cash-requests');
        }, 1500);
      } else {
        throw new Error(response.message || 'Reimbursement submission failed');
      }

    } catch (error) {
      console.error('❌ Submission error:', error);
      
      if (error.response?.status === 401) {
        message.error('Your session has expired. Please login again.');
        navigate('/login');
      } else {
        const errorMessage = error.response?.data?.message || error.message || 'Failed to submit reimbursement request';
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
      console.log('=== SUBMISSION COMPLETED ===\n');
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
        message.error(`${file.name} is too large. Maximum size is 10MB.`);
        return Upload.LIST_IGNORE;
      }

      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf'
      ];

      if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
        message.error(`${file.name} is not a supported file type`);
        return Upload.LIST_IGNORE;
      }

      if (fileList.length >= 10) {
        message.error('Maximum 10 files allowed');
        return Upload.LIST_IGNORE;
      }

      setFileList([...fileList, {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        size: file.size,
        type: file.type,
        originFileObj: file
      }]);
      
      return false;
    },
    fileList,
    multiple: true,
    listType: 'picture',
    maxCount: 10,
    accept: 'image/*,.pdf'
  };

  if (loadingLimit) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>Loading reimbursement status...</Text>
        </div>
      </Card>
    );
  }

  if (limitStatus && !limitStatus.canSubmit) {
    return (
      <Card>
        <Alert
          message="Monthly Reimbursement Limit Reached"
          description={
            <div>
              <Paragraph>
                You have submitted {limitStatus.count} reimbursement requests this month, 
                which is the maximum allowed limit of {limitStatus.limit} requests.
              </Paragraph>
              <Paragraph>
                Please wait until next month to submit additional reimbursement requests.
              </Paragraph>
            </div>
          }
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button onClick={() => navigate('/employee/cash-requests')}>
            Back to My Requests
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <Title level={3}>
        <DollarOutlined /> New Reimbursement Request
      </Title>

      <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
        <Alert
          message="Reimbursement Request Guidelines"
          description={
            <div>
              <Text>
                Submit this form to request reimbursement for expenses you have already paid from personal funds.
              </Text>
              <Divider style={{ margin: '12px 0' }} />
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li><strong>Maximum Amount:</strong> XAF 100,000 per request</li>
                <li><strong>Monthly Limit:</strong> {limitStatus?.limit || 5} reimbursement requests per month</li>
                <li><strong>Receipt Documents:</strong> Mandatory for all reimbursement requests</li>
                <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
                <li style={{ color: '#52c41a', fontWeight: 'bold' }}>
                  <CheckCircleOutlined /> No justification required - Request completes after disbursement
                </li>
              </ul>
            </div>
          }
          type="info"
          icon={<InfoCircleOutlined />}
          showIcon
        />

        {limitStatus && (
          <Alert
            message={`Monthly Limit Status: ${limitStatus.count}/${limitStatus.limit} used, ${limitStatus.remaining} remaining`}
            type={limitStatus.remaining <= 1 ? 'warning' : 'success'}
            showIcon
          />
        )}
      </Space>

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="requestType"
              label="Expense Category"
              rules={[{ required: true, message: 'Please select expense category' }]}
            >
              <Select placeholder="Select expense category">
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

        <Form.Item
          name="amountRequested"
          label="Reimbursement Amount (XAF)"
          rules={[
            { required: true, message: 'Please enter amount' },
            { 
              validator: (_, value) => {
                if (value && value > 100000) {
                  return Promise.reject('Amount cannot exceed XAF 100,000');
                }
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
            max={100000}
            step={1000}
            placeholder="Enter reimbursement amount"
            formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={(value) => value.replace(/,/g, '')}
          />
        </Form.Item>

        <Form.Item
          name="purpose"
          label="Purpose of Expense"
          rules={[{ 
            required: true,
            min: 10,
            message: 'Please provide a detailed purpose (minimum 10 characters)'
          }]}
        >
          <TextArea 
            rows={3} 
            placeholder="Describe what these expenses were for"
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
            placeholder="Explain why these expenses were necessary for business operations"
            showCount
            maxLength={1000}
          />
        </Form.Item>

        <Form.Item
          name="requiredDate"
          label="Date of Expense"
          rules={[{ required: true, message: 'Please select the date of expense' }]}
          extra="Select the date when you incurred these expenses"
        >
          <DatePicker 
            style={{ width: '100%' }} 
            disabledDate={(current) => current && current > dayjs().endOf('day')}
            placeholder="Select expense date"
          />
        </Form.Item>

        <Form.Item
          label={
            <span>
              Receipt Documents
              <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>
            </span>
          }
          extra={
            <div>
              <div>Upload clear images or PDFs of all receipts (max 10 files, 10MB each)</div>
              <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
                Receipt documents are MANDATORY for all reimbursement requests
              </div>
            </div>
          }
          required
        >
          <Upload {...uploadProps}>
            {fileList.length >= 10 ? null : (
              <Button icon={<UploadOutlined />} block>
                Upload Receipt Documents (Required) - {fileList.length} file(s) selected
              </Button>
            )}
          </Upload>
        </Form.Item>

        <Card style={{ marginBottom: '24px', backgroundColor: '#f0f2f5' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Statistic
                title="Reimbursement Amount"
                value={form.getFieldValue('amountRequested') || 0}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix={<DollarOutlined />}
                suffix="XAF"
              />
            </Col>
            <Col xs={24} sm={12}>
              <Statistic
                title="Receipt Documents"
                value={fileList.length}
                valueStyle={{ color: fileList.length === 0 ? '#ff4d4f' : '#52c41a' }}
                prefix={<UploadOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Alert
          message="No Justification Required"
          description="Unlike cash advances, reimbursements do not require a separate justification submission after disbursement. Your request will be marked as complete once the funds are disbursed to you."
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/employee/cash-requests')}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              disabled={
                loading || 
                !limitStatus?.canSubmit || 
                fileList.length === 0
              }
            >
              {loading ? 'Submitting...' : 'Submit Reimbursement Request'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

const ReimbursementRequestFormWrapper = () => (
  <App>
    <ReimbursementRequestForm />
  </App>
);

export default ReimbursementRequestFormWrapper;









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
//   Card,
//   Typography,
//   Space,
//   Alert,
//   Divider,
//   Row,
//   Col,
//   Tag,
//   Statistic,
//   Switch,
//   Tooltip,
//   App
// } from 'antd';
// import {
//   UploadOutlined,
//   DollarOutlined,
//   InfoCircleOutlined,
//   WarningOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ReimbursementRequestForm = () => {
//   const [form] = Form.useForm();
//   const { message } = App.useApp();
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
  
//   const [limitStatus, setLimitStatus] = useState(null);
//   const [loadingLimit, setLoadingLimit] = useState(true);
  
//   const navigate = useNavigate();
//   const { user, token } = useSelector((state) => state.auth);

//   const requestTypes = [
//     { value: 'travel', label: 'Travel Expenses' },
//     { value: 'office-supplies', label: 'Office Supplies' },
//     { value: 'client-entertainment', label: 'Client Entertainment' },
//     { value: 'emergency', label: 'Emergency Expenses' },
//     { value: 'project-materials', label: 'Project Materials' },
//     { value: 'training', label: 'Training & Development' },
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
//     if (!token) {
//       message.error('Please login to access this page');
//       navigate('/login');
//       return;
//     }
//     fetchLimitStatus();
//   }, [token, navigate]);

//   const fetchLimitStatus = async () => {
//     try {
//       setLoadingLimit(true);
//       const response = await cashRequestAPI.getReimbursementLimitStatus();
      
//       if (response.success || response.data) {
//         const data = response.data || response;
//         setLimitStatus(data);
        
//         if (!data.canSubmit) {
//           message.warning({
//             content: `You have reached your monthly reimbursement limit (${data.count}/${data.limit})`,
//             duration: 5
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching limit status:', error);
      
//       if (error.response?.status === 401) {
//         message.error('Your session has expired. Please login again.');
//         navigate('/login');
//       } else {
//         message.error('Failed to check reimbursement limit');
//       }
//     } finally {
//       setLoadingLimit(false);
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       console.log('\n=== SUBMITTING REIMBURSEMENT REQUEST ===');
      
//       if (!limitStatus?.canSubmit) {
//         message.error('You have reached your monthly reimbursement limit');
//         return;
//       }

//       if (!values.requestType) {
//         message.error('Please select an expense category');
//         return;
//       }
      
//       const amount = values.amountRequested;
//       if (!amount || amount <= 0) {
//         message.error('Please enter a valid amount');
//         return;
//       }

//       if (amount > 100000) {
//         message.error('Reimbursement amount cannot exceed XAF 100,000');
//         return;
//       }

//       if (fileList.length === 0) {
//         message.error('Receipt documents are mandatory for reimbursement requests');
//         return;
//       }

//       setLoading(true);
//       console.log('Files to upload:', fileList.length);

//       const formData = new FormData();
      
//       formData.append('requestMode', 'reimbursement');
//       formData.append('requestType', values.requestType);
//       formData.append('amountRequested', amount);
//       formData.append('purpose', values.purpose);
//       formData.append('businessJustification', values.businessJustification);
//       formData.append('urgency', values.urgency);
//       formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

//       fileList.forEach((file, index) => {
//         if (file.originFileObj) {
//           formData.append('receiptDocuments', file.originFileObj, file.name);
//           console.log(`   ${index + 1}. ✓ Added receipt: ${file.name}`);
//         }
//       });

//       console.log('\n📦 FormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[1] instanceof File) {
//           console.log(`   ${pair[0]}: [File] ${pair[1].name}`);
//         } else {
//           console.log(`   ${pair[0]}:`, pair[1]);
//         }
//       }

//       console.log('\n🌐 Sending request...');
//       const response = await cashRequestAPI.createReimbursementRequest(formData);

//       console.log('✅ Response:', response);

//       if (response.success) {
//         message.success({
//           content: (
//             <div>
//               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                 ✅ Reimbursement request submitted successfully!
//               </div>
//               <div style={{ fontSize: '12px', marginTop: '8px' }}>
//                 <div>📎 {fileList.length} receipt(s) uploaded</div>
//                 <div>📊 Monthly limit: {response.limitInfo?.monthlyUsed}/{response.limitInfo?.monthlyLimit} used</div>
//                 <div style={{ color: '#52c41a', fontWeight: 'bold', marginTop: '4px' }}>
//                   ✅ No justification required - Completed after disbursement
//                 </div>
//               </div>
//             </div>
//           ),
//           duration: 6
//         });
        
//         setTimeout(() => {
//           navigate('/employee/cash-requests');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Reimbursement submission failed');
//       }

//     } catch (error) {
//       console.error('❌ Submission error:', error);
      
//       if (error.response?.status === 401) {
//         message.error('Your session has expired. Please login again.');
//         navigate('/login');
//       } else {
//         const errorMessage = error.response?.data?.message || error.message || 'Failed to submit reimbursement request';
//         message.error(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//       console.log('=== SUBMISSION COMPLETED ===\n');
//     }
//   };

//   const uploadProps = {
//     onRemove: (file) => {
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     },
//     beforeUpload: (file) => {
//       const isLt10M = file.size / 1024 / 1024 < 10;
//       if (!isLt10M) {
//         message.error(`${file.name} is too large. Maximum size is 10MB.`);
//         return Upload.LIST_IGNORE;
//       }

//       const allowedTypes = [
//         'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
//         'application/pdf'
//       ];

//       if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
//         message.error(`${file.name} is not a supported file type`);
//         return Upload.LIST_IGNORE;
//       }

//       if (fileList.length >= 10) {
//         message.error('Maximum 10 files allowed');
//         return Upload.LIST_IGNORE;
//       }

//       setFileList([...fileList, {
//         uid: file.uid || `${Date.now()}-${Math.random()}`,
//         name: file.name,
//         status: 'done',
//         size: file.size,
//         type: file.type,
//         originFileObj: file
//       }]);
      
//       return false;
//     },
//     fileList,
//     multiple: true,
//     listType: 'picture',
//     maxCount: 10,
//     accept: 'image/*,.pdf'
//   };

//   if (loadingLimit) {
//     return (
//       <Card>
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Text>Loading reimbursement status...</Text>
//         </div>
//       </Card>
//     );
//   }

//   if (limitStatus && !limitStatus.canSubmit) {
//     return (
//       <Card>
//         <Alert
//           message="Monthly Reimbursement Limit Reached"
//           description={
//             <div>
//               <Paragraph>
//                 You have submitted {limitStatus.count} reimbursement requests this month, 
//                 which is the maximum allowed limit of {limitStatus.limit} requests.
//               </Paragraph>
//               <Paragraph>
//                 Please wait until next month to submit additional reimbursement requests.
//               </Paragraph>
//             </div>
//           }
//           type="error"
//           showIcon
//           icon={<WarningOutlined />}
//         />
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <Button onClick={() => navigate('/employee/cash-requests')}>
//             Back to My Requests
//           </Button>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <Title level={3}>
//         <DollarOutlined /> New Reimbursement Request
//       </Title>

//       <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
//         <Alert
//           message="Reimbursement Request Guidelines"
//           description={
//             <div>
//               <Text>
//                 Submit this form to request reimbursement for expenses you have already paid from personal funds.
//               </Text>
//               <Divider style={{ margin: '12px 0' }} />
//               <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                 <li><strong>Maximum Amount:</strong> XAF 100,000 per request</li>
//                 <li><strong>Monthly Limit:</strong> {limitStatus?.limit || 5} reimbursement requests per month</li>
//                 <li><strong>Receipt Documents:</strong> Mandatory for all reimbursement requests</li>
//                 <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
//                 <li style={{ color: '#52c41a', fontWeight: 'bold' }}>
//                   <CheckCircleOutlined /> No justification required - Request completes after disbursement
//                 </li>
//               </ul>
//             </div>
//           }
//           type="info"
//           icon={<InfoCircleOutlined />}
//           showIcon
//         />

//         {limitStatus && (
//           <Alert
//             message={`Monthly Limit Status: ${limitStatus.count}/${limitStatus.limit} used, ${limitStatus.remaining} remaining`}
//             type={limitStatus.remaining <= 1 ? 'warning' : 'success'}
//             showIcon
//           />
//         )}
//       </Space>

//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12}>
//             <Form.Item
//               name="requestType"
//               label="Expense Category"
//               rules={[{ required: true, message: 'Please select expense category' }]}
//             >
//               <Select placeholder="Select expense category">
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

//         <Form.Item
//           name="amountRequested"
//           label="Reimbursement Amount (XAF)"
//           rules={[
//             { required: true, message: 'Please enter amount' },
//             { 
//               validator: (_, value) => {
//                 if (value && value > 100000) {
//                   return Promise.reject('Amount cannot exceed XAF 100,000');
//                 }
//                 if (value && value <= 0) {
//                   return Promise.reject('Amount must be greater than 0');
//                 }
//                 return Promise.resolve();
//               }
//             }
//           ]}
//         >
//           <InputNumber
//             style={{ width: '100%' }}
//             min={0}
//             max={100000}
//             step={1000}
//             placeholder="Enter reimbursement amount"
//             formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//             parser={(value) => value.replace(/,/g, '')}
//           />
//         </Form.Item>

//         <Form.Item
//           name="purpose"
//           label="Purpose of Expense"
//           rules={[{ 
//             required: true,
//             min: 10,
//             message: 'Please provide a detailed purpose (minimum 10 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={3} 
//             placeholder="Describe what these expenses were for"
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
//             placeholder="Explain why these expenses were necessary for business operations"
//             showCount
//             maxLength={1000}
//           />
//         </Form.Item>

//         <Form.Item
//           name="requiredDate"
//           label="Date of Expense"
//           rules={[{ required: true, message: 'Please select the date of expense' }]}
//           extra="Select the date when you incurred these expenses"
//         >
//           <DatePicker 
//             style={{ width: '100%' }} 
//             disabledDate={(current) => current && current > dayjs().endOf('day')}
//             placeholder="Select expense date"
//           />
//         </Form.Item>

//         <Form.Item
//           label={
//             <span>
//               Receipt Documents
//               <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>
//             </span>
//           }
//           extra={
//             <div>
//               <div>Upload clear images or PDFs of all receipts (max 10 files, 10MB each)</div>
//               <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
//                 Receipt documents are MANDATORY for all reimbursement requests
//               </div>
//             </div>
//           }
//           required
//         >
//           <Upload {...uploadProps}>
//             {fileList.length >= 10 ? null : (
//               <Button icon={<UploadOutlined />} block>
//                 Upload Receipt Documents (Required) - {fileList.length} file(s) selected
//               </Button>
//             )}
//           </Upload>
//         </Form.Item>

//         <Card style={{ marginBottom: '24px', backgroundColor: '#f0f2f5' }}>
//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={12}>
//               <Statistic
//                 title="Reimbursement Amount"
//                 value={form.getFieldValue('amountRequested') || 0}
//                 precision={0}
//                 valueStyle={{ color: '#3f8600' }}
//                 prefix={<DollarOutlined />}
//                 suffix="XAF"
//               />
//             </Col>
//             <Col xs={24} sm={12}>
//               <Statistic
//                 title="Receipt Documents"
//                 value={fileList.length}
//                 valueStyle={{ color: fileList.length === 0 ? '#ff4d4f' : '#52c41a' }}
//                 prefix={<UploadOutlined />}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Alert
//           message="No Justification Required"
//           description="Unlike cash advances, reimbursements do not require a separate justification submission after disbursement. Your request will be marked as complete once the funds are disbursed to you."
//           type="success"
//           showIcon
//           icon={<CheckCircleOutlined />}
//           style={{ marginBottom: '24px' }}
//         />

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/employee/cash-requests')}>
//               Cancel
//             </Button>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               loading={loading}
//               disabled={
//                 loading || 
//                 !limitStatus?.canSubmit || 
//                 fileList.length === 0
//               }
//             >
//               {loading ? 'Submitting...' : 'Submit Reimbursement Request'}
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// const ReimbursementRequestFormWrapper = () => (
//   <App>
//     <ReimbursementRequestForm />
//   </App>
// );

// export default ReimbursementRequestFormWrapper;









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
//   Card,
//   Typography,
//   Space,
//   Alert,
//   Table,
//   Divider,
//   Row,
//   Col,
//   Tag,
//   Statistic,
//   Switch,
//   Tooltip,
//   App 
// } from 'antd';
// import {
//   UploadOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   InfoCircleOutlined,
//   DollarOutlined,
//   FileTextOutlined,
//   WarningOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ReimbursementRequestForm = () => {
//   const [form] = Form.useForm(); // ✅ Create form instance
//   const { message } = App.useApp(); // ✅ Use App context for message
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
  
//   const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
//   const [itemizedExpenses, setItemizedExpenses] = useState([]);
//   const [totalAmount, setTotalAmount] = useState(0);
//   const [manualAmount, setManualAmount] = useState(0);
  
//   const [limitStatus, setLimitStatus] = useState(null);
//   const [loadingLimit, setLoadingLimit] = useState(true);
  
//   const navigate = useNavigate();
//   const { user, token } = useSelector((state) => state.auth); // ✅ Get token from Redux

//   const requestTypes = [
//     { value: 'travel', label: 'Travel Expenses' },
//     { value: 'office-supplies', label: 'Office Supplies' },
//     { value: 'client-entertainment', label: 'Client Entertainment' },
//     { value: 'emergency', label: 'Emergency Expenses' },
//     { value: 'project-materials', label: 'Project Materials' },
//     { value: 'training', label: 'Training & Development' },
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
//     // ✅ Check authentication before fetching
//     if (!token) {
//       message.error('Please login to access this page');
//       navigate('/login');
//       return;
//     }
//     fetchLimitStatus();
//   }, [token, navigate]);

//   useEffect(() => {
//     if (useItemizedBreakdown) {
//       const total = itemizedExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
//       setTotalAmount(total);
//       form.setFieldsValue({ amountRequested: total });
//     } else {
//       form.setFieldsValue({ amountRequested: manualAmount });
//     }
//   }, [itemizedExpenses, useItemizedBreakdown, manualAmount, form]);

//   const fetchLimitStatus = async () => {
//     try {
//       setLoadingLimit(true);
//       const response = await cashRequestAPI.getReimbursementLimitStatus();
      
//       if (response.success || response.data) {
//         const data = response.data || response;
//         setLimitStatus(data);
        
//         if (!data.canSubmit) {
//           message.warning({
//             content: `You have reached your monthly reimbursement limit (${data.count}/${data.limit})`,
//             duration: 5
//           });
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching limit status:', error);
      
//       // ✅ Handle 401 errors specifically
//       if (error.response?.status === 401) {
//         message.error('Your session has expired. Please login again.');
//         navigate('/login');
//       } else {
//         message.error('Failed to check reimbursement limit');
//       }
//     } finally {
//       setLoadingLimit(false);
//     }
//   };

//   const handleToggleItemizedBreakdown = (checked) => {
//     setUseItemizedBreakdown(checked);
//     if (!checked) {
//       setItemizedExpenses([]);
//       setTotalAmount(0);
//     }
//   };

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

//   const handleSubmit = async (values) => {
//     try {
//       console.log('\n=== SUBMITTING REIMBURSEMENT REQUEST ===');
      
//       if (!limitStatus?.canSubmit) {
//         message.error('You have reached your monthly reimbursement limit');
//         return;
//       }

//       let finalAmount = 0;
      
//       if (useItemizedBreakdown) {
//         if (itemizedExpenses.length === 0) {
//           message.error('Please add at least one expense item');
//           return;
//         }

//         const invalidItems = itemizedExpenses.filter(item => 
//           !item.description || !item.amount || parseFloat(item.amount) <= 0 || !item.category
//         );

//         if (invalidItems.length > 0) {
//           message.error('All expense items must have a description, category, and valid amount');
//           return;
//         }

//         finalAmount = totalAmount;
//       } else {
//         if (!values.requestType) {
//           message.error('Please select an expense category');
//           return;
//         }
        
//         if (!manualAmount || manualAmount <= 0) {
//           message.error('Please enter a valid amount');
//           return;
//         }

//         finalAmount = manualAmount;
//       }

//       if (finalAmount > 100000) {
//         message.error('Reimbursement amount cannot exceed XAF 100,000');
//         return;
//       }

//       if (finalAmount === 0) {
//         message.error('Total amount must be greater than 0');
//         return;
//       }

//       if (fileList.length === 0) {
//         message.error('Receipt documents are mandatory for reimbursement requests');
//         return;
//       }

//       setLoading(true);
//       console.log('Files to upload:', fileList.length);

//       const formData = new FormData();
      
//       formData.append('requestMode', 'reimbursement');
//       formData.append('requestType', values.requestType);
//       formData.append('amountRequested', finalAmount);
//       formData.append('purpose', values.purpose);
//       formData.append('businessJustification', values.businessJustification);
//       formData.append('urgency', values.urgency);
//       formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

//       if (useItemizedBreakdown && itemizedExpenses.length > 0) {
//         const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
//         formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
//         console.log('📋 Itemized breakdown:', cleanedBreakdown);
//       } else {
//         formData.append('itemizedBreakdown', JSON.stringify([]));
//       }

//       fileList.forEach((file, index) => {
//         if (file.originFileObj) {
//           formData.append('receiptDocuments', file.originFileObj, file.name);
//           console.log(`   ${index + 1}. ✓ Added receipt: ${file.name}`);
//         }
//       });

//       console.log('\n📦 FormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[1] instanceof File) {
//           console.log(`   ${pair[0]}: [File] ${pair[1].name}`);
//         } else {
//           console.log(`   ${pair[0]}:`, pair[1]);
//         }
//       }

//       console.log('\n🌐 Sending request...');
//       const response = await cashRequestAPI.createReimbursementRequest(formData);

//       console.log('✅ Response:', response);

//       if (response.success) {
//         message.success({
//           content: (
//             <div>
//               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                 ✅ Reimbursement request submitted successfully!
//               </div>
//               <div style={{ fontSize: '12px', marginTop: '8px' }}>
//                 <div>📎 {fileList.length} receipt(s) uploaded</div>
//                 {useItemizedBreakdown && (
//                   <div>📋 {itemizedExpenses.length} expense items detailed</div>
//                 )}
//                 <div>📊 Monthly limit: {response.limitInfo?.monthlyUsed}/{response.limitInfo?.monthlyLimit} used</div>
//               </div>
//             </div>
//           ),
//           duration: 5
//         });
        
//         setTimeout(() => {
//           navigate('/employee/cash-requests');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Reimbursement submission failed');
//       }

//     } catch (error) {
//       console.error('❌ Submission error:', error);
      
//       if (error.response?.status === 401) {
//         message.error('Your session has expired. Please login again.');
//         navigate('/login');
//       } else {
//         const errorMessage = error.response?.data?.message || error.message || 'Failed to submit reimbursement request';
//         message.error(errorMessage);
//       }
//     } finally {
//       setLoading(false);
//       console.log('=== SUBMISSION COMPLETED ===\n');
//     }
//   };

//   const uploadProps = {
//     onRemove: (file) => {
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     },
//     beforeUpload: (file) => {
//       const isLt10M = file.size / 1024 / 1024 < 10;
//       if (!isLt10M) {
//         message.error(`${file.name} is too large. Maximum size is 10MB.`);
//         return Upload.LIST_IGNORE;
//       }

//       const allowedTypes = [
//         'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
//         'application/pdf'
//       ];

//       if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
//         message.error(`${file.name} is not a supported file type`);
//         return Upload.LIST_IGNORE;
//       }

//       if (fileList.length >= 10) {
//         message.error('Maximum 10 files allowed');
//         return Upload.LIST_IGNORE;
//       }

//       setFileList([...fileList, {
//         uid: file.uid || `${Date.now()}-${Math.random()}`,
//         name: file.name,
//         status: 'done',
//         size: file.size,
//         type: file.type,
//         originFileObj: file
//       }]);
      
//       return false;
//     },
//     fileList,
//     multiple: true,
//     listType: 'picture',
//     maxCount: 10,
//     accept: 'image/*,.pdf'
//   };

//   const expenseColumns = [
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (text, record) => (
//         <Input
//           placeholder="e.g., Taxi from airport to office"
//           value={text}
//           onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
//         />
//       ),
//       width: '35%'
//     },
//     {
//       title: 'Category',
//       dataIndex: 'category',
//       key: 'category',
//       render: (text, record) => (
//         <Select
//           style={{ width: '100%' }}
//           placeholder="Select category"
//           value={text || undefined}
//           onChange={(value) => updateExpenseItem(record.key, 'category', value)}
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

//   if (loadingLimit) {
//     return (
//       <Card>
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Text>Loading reimbursement status...</Text>
//         </div>
//       </Card>
//     );
//   }

//   if (limitStatus && !limitStatus.canSubmit) {
//     return (
//       <Card>
//         <Alert
//           message="Monthly Reimbursement Limit Reached"
//           description={
//             <div>
//               <Paragraph>
//                 You have submitted {limitStatus.count} reimbursement requests this month, 
//                 which is the maximum allowed limit of {limitStatus.limit} requests.
//               </Paragraph>
//               <Paragraph>
//                 Please wait until next month to submit additional reimbursement requests.
//               </Paragraph>
//             </div>
//           }
//           type="error"
//           showIcon
//           icon={<WarningOutlined />}
//         />
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <Button onClick={() => navigate('/employee/cash-requests')}>
//             Back to My Requests
//           </Button>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <Title level={3}>
//         <DollarOutlined /> New Reimbursement Request
//       </Title>

//       <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
//         <Alert
//           message="Reimbursement Request Guidelines"
//           description={
//             <div>
//               <Text>
//                 Submit this form to request reimbursement for expenses you have already paid from personal funds.
//               </Text>
//               <Divider style={{ margin: '12px 0' }} />
//               <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                 <li><strong>Maximum Amount:</strong> XAF 100,000 per request</li>
//                 <li><strong>Monthly Limit:</strong> {limitStatus?.limit || 5} reimbursement requests per month</li>
//                 <li><strong>Receipt Documents:</strong> Mandatory for all reimbursement requests</li>
//                 <li><strong>Itemized Breakdown:</strong> Optional but recommended</li>
//                 <li><strong>Approval Process:</strong> 4-level hierarchy (Supervisor → Dept Head → Head of Business → Finance)</li>
//               </ul>
//             </div>
//           }
//           type="info"
//           icon={<InfoCircleOutlined />}
//           showIcon
//         />

//         {limitStatus && (
//           <Alert
//             message={`Monthly Limit Status: ${limitStatus.count}/${limitStatus.limit} used, ${limitStatus.remaining} remaining`}
//             type={limitStatus.remaining <= 1 ? 'warning' : 'success'}
//             showIcon
//           />
//         )}
//       </Space>

//       {/* ✅ Connect form instance with form prop */}
//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Row gutter={[16, 16]}>
//           <Col xs={24} md={12}>
//             <Form.Item
//               name="requestType"
//               label="Main Expense Category"
//               rules={[{ required: !useItemizedBreakdown, message: 'Please select expense category' }]}
//               tooltip="If using itemized breakdown, this is optional"
//             >
//               <Select placeholder="Select expense category">
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

//         {/* ✅ Fixed Card with styles prop instead of bodyStyle */}
//         <Card 
//           style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//           styles={{ body: { padding: '16px' } }}
//         >
//           <Space direction="vertical" style={{ width: '100%' }}>
//             <Space align="center">
//               <Switch 
//                 checked={useItemizedBreakdown}
//                 onChange={handleToggleItemizedBreakdown}
//               />
//               <Text strong>Use Itemized Breakdown</Text>
//               <Tag color="green" icon={<CheckCircleOutlined />}>
//                 Recommended
//               </Tag>
//               <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better">
//                 <InfoCircleOutlined style={{ color: '#1890ff' }} />
//               </Tooltip>
//             </Space>
            
//             {!useItemizedBreakdown && (
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Using single amount mode - select category above
//               </Text>
//             )}
//           </Space>
//         </Card>

//         {!useItemizedBreakdown ? (
//           <Form.Item
//             name="amountRequested"
//             label="Reimbursement Amount (XAF)"
//             rules={[
//               { required: true, message: 'Please enter amount' },
//               { 
//                 validator: (_, value) => {
//                   if (value && value > 100000) {
//                     return Promise.reject('Amount cannot exceed XAF 100,000');
//                   }
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
//               max={100000}
//               step={1000}
//               placeholder="Enter reimbursement amount"
//               formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               parser={(value) => value.replace(/,/g, '')}
//               onChange={(value) => setManualAmount(value || 0)}
//             />
//           </Form.Item>
//         ) : (
//           <>
//             <Card 
//               title={
//                 <Space>
//                   <FileTextOutlined />
//                   <Text strong>Itemized Expenses</Text>
//                 </Space>
//               }
//               extra={
//                 <Button 
//                   type="primary" 
//                   icon={<PlusOutlined />}
//                   onClick={addExpenseItem}
//                   disabled={itemizedExpenses.length >= 20}
//                 >
//                   Add Item
//                 </Button>
//               }
//               style={{ marginBottom: '24px' }}
//             >
//               {itemizedExpenses.length === 0 ? (
//                 <Alert
//                   message="No expense items added yet"
//                   description="Click 'Add Item' to start adding your itemized expenses"
//                   type="info"
//                   showIcon
//                 />
//               ) : (
//                 <>
//                   <Table
//                     dataSource={itemizedExpenses}
//                     columns={expenseColumns}
//                     pagination={false}
//                     size="small"
//                     rowKey="key"
//                     summary={() => (
//                       <Table.Summary fixed>
//                         <Table.Summary.Row>
//                           <Table.Summary.Cell index={0} colSpan={2}>
//                             <Text strong>Total Amount</Text>
//                           </Table.Summary.Cell>
//                           <Table.Summary.Cell index={1}>
//                             <Text strong style={{ color: totalAmount > 100000 ? '#ff4d4f' : '#1890ff', fontSize: '16px' }}>
//                               XAF {totalAmount.toLocaleString()}
//                             </Text>
//                           </Table.Summary.Cell>
//                           <Table.Summary.Cell index={2} />
//                         </Table.Summary.Row>
//                       </Table.Summary>
//                     )}
//                   />

//                   {totalAmount > 100000 && (
//                     <Alert
//                       message="Amount exceeds limit"
//                       description="Reimbursement amount cannot exceed XAF 100,000"
//                       type="error"
//                       showIcon
//                       style={{ marginTop: '16px' }}
//                     />
//                   )}
//                 </>
//               )}
//             </Card>

//             <Form.Item name="amountRequested" hidden>
//               <Input />
//             </Form.Item>
//           </>
//         )}

//         <Form.Item
//           name="purpose"
//           label="Purpose of Expense"
//           rules={[{ 
//             required: true,
//             min: 10,
//             message: 'Please provide a detailed purpose (minimum 10 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={3} 
//             placeholder="Describe what these expenses were for"
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
//             placeholder="Explain why these expenses were necessary for business operations"
//             showCount
//             maxLength={1000}
//           />
//         </Form.Item>

//         <Form.Item
//           name="requiredDate"
//           label="Date of Expense"
//           rules={[{ required: true, message: 'Please select the date of expense' }]}
//           extra="Select the date when you incurred these expenses"
//         >
//           <DatePicker 
//             style={{ width: '100%' }} 
//             disabledDate={(current) => current && current > dayjs().endOf('day')}
//             placeholder="Select expense date"
//           />
//         </Form.Item>

//         <Form.Item
//           label={
//             <span>
//               Receipt Documents
//               <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>
//             </span>
//           }
//           extra={
//             <div>
//               <div>Upload clear images or PDFs of all receipts (max 10 files, 10MB each)</div>
//               <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
//                 Receipt documents are MANDATORY for all reimbursement requests
//               </div>
//             </div>
//           }
//           required
//         >
//           <Upload {...uploadProps}>
//             {fileList.length >= 10 ? null : (
//               <Button icon={<UploadOutlined />} block>
//                 Upload Receipt Documents (Required) - {fileList.length} file(s) selected
//               </Button>
//             )}
//           </Upload>
//         </Form.Item>

//         <Card style={{ marginBottom: '24px', backgroundColor: '#f0f2f5' }}>
//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title="Total Reimbursement Amount"
//                 value={useItemizedBreakdown ? totalAmount : manualAmount}
//                 precision={0}
//                 valueStyle={{ 
//                   color: (useItemizedBreakdown ? totalAmount : manualAmount) > 100000 ? '#ff4d4f' : '#3f8600' 
//                 }}
//                 prefix={<DollarOutlined />}
//                 suffix="XAF"
//               />
//             </Col>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title={useItemizedBreakdown ? 'Expense Items' : 'Mode'}
//                 value={useItemizedBreakdown ? itemizedExpenses.length : 'Single Amount'}
//                 valueStyle={{ color: '#1890ff' }}
//                 prefix={<FileTextOutlined />}
//               />
//             </Col>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title="Receipt Documents"
//                 value={fileList.length}
//                 valueStyle={{ color: fileList.length === 0 ? '#ff4d4f' : '#52c41a' }}
//                 prefix={<UploadOutlined />}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/employee/cash-requests')}>
//               Cancel
//             </Button>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               loading={loading}
//               disabled={
//                 loading || 
//                 !limitStatus?.canSubmit || 
//                 fileList.length === 0 ||
//                 (useItemizedBreakdown ? totalAmount : manualAmount) > 100000 ||
//                 (useItemizedBreakdown ? totalAmount : manualAmount) === 0
//               }
//             >
//               {loading ? 'Submitting...' : 'Submit Reimbursement Request'}
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// // ✅ Wrap with App provider to enable message context
// const ReimbursementRequestFormWrapper = () => (
//   <App>
//     <ReimbursementRequestForm />
//   </App>
// );

// export default ReimbursementRequestFormWrapper;










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
//   Statistic,
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
//   WarningOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import dayjs from 'dayjs';
// import { cashRequestAPI } from '../../services/cashRequestAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// const ReimbursementRequestForm = () => {
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
  
//   // Itemized breakdown toggle
//   const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
//   const [itemizedExpenses, setItemizedExpenses] = useState([]);
//   const [totalAmount, setTotalAmount] = useState(0);
  
//   // Single amount mode
//   const [singleAmount, setSingleAmount] = useState(0);
//   const [singleCategory, setSingleCategory] = useState(null);
  
//   const [limitStatus, setLimitStatus] = useState(null);
//   const [loadingLimit, setLoadingLimit] = useState(true);
  
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
//     { value: 'utility', label: 'Utility (Electricity, Water, etc.)' },
//     { value: 'staff-transportation', label: 'Staff Transportation' },
//     { value: 'staff-entertainment', label: 'Staff Entertainment' },
//     { value: 'toll-gates', label: 'Toll Gates' },
//     { value: 'office-items', label: 'Office Items' },
//     { value: 'other', label: 'Other' }
//   ];

//   useEffect(() => {
//     fetchLimitStatus();
//   }, []);

//   // Calculate total for itemized breakdown
//   useEffect(() => {
//     if (useItemizedBreakdown) {
//       const total = itemizedExpenses.reduce((sum, item) => 
//         sum + (parseFloat(item.amount) || 0), 0
//       );
//       setTotalAmount(total);
//       form.setFieldValue('amountRequested', total);
//     } else {
//       form.setFieldValue('amountRequested', singleAmount);
//     }
//   }, [itemizedExpenses, useItemizedBreakdown, singleAmount, form]);

//   const fetchLimitStatus = async () => {
//     try {
//       setLoadingLimit(true);
//       const response = await cashRequestAPI.getReimbursementLimitStatus();
      
//       if (response.success) {
//         setLimitStatus(response.data);
        
//         if (!response.data.canSubmit) {
//           message.warning(
//             `You have reached your monthly reimbursement limit (${response.data.count}/${response.data.limit})`
//           );
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching limit status:', error);
//       message.error('Failed to check reimbursement limit');
//     } finally {
//       setLoadingLimit(false);
//     }
//   };

//   const handleToggleItemizedBreakdown = (checked) => {
//     setUseItemizedBreakdown(checked);
//     if (!checked) {
//       setItemizedExpenses([]);
//       setTotalAmount(0);
//     } else {
//       setSingleAmount(0);
//       setSingleCategory(null);
//     }
//   };

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

//   const handleSubmit = async (values) => {
//     try {
//       console.log('\n=== REIMBURSEMENT SUBMISSION ===');
//       console.log('Mode:', useItemizedBreakdown ? 'Itemized' : 'Single Amount');
//       console.log('Values:', values);

//       // Validations
//       if (!limitStatus?.canSubmit) {
//         message.error('You have reached your monthly reimbursement limit');
//         return;
//       }

//       // Amount validation
//       const requestAmount = useItemizedBreakdown ? totalAmount : singleAmount;
      
//       if (requestAmount <= 0) {
//         message.error('Please enter a valid amount greater than 0');
//         return;
//       }

//       if (requestAmount > 100000) {
//         message.error('Reimbursement amount cannot exceed XAF 100,000');
//         return;
//       }

//       // Itemized breakdown validation (if used)
//       if (useItemizedBreakdown) {
//         if (itemizedExpenses.length === 0) {
//           message.error('Please add at least one expense item or disable itemized breakdown');
//           return;
//         }

//         const invalidItems = itemizedExpenses.filter(item => 
//           !item.description || !item.amount || parseFloat(item.amount) <= 0 || !item.category
//         );

//         if (invalidItems.length > 0) {
//           message.error('All expense items must have a description, category, and valid amount');
//           return;
//         }
//       } else {
//         // Single amount validation
//         if (!singleCategory) {
//           message.error('Please select an expense category');
//           return;
//         }
//       }

//       // Receipt validation
//       if (fileList.length === 0) {
//         message.error('Receipt documents are mandatory for reimbursement requests');
//         return;
//       }

//       setLoading(true);
//       console.log('Files to upload:', fileList.length);

//       const formData = new FormData();
      
//       // Basic fields
//       formData.append('requestMode', 'reimbursement');
//       formData.append('requestType', useItemizedBreakdown ? 
//         (itemizedExpenses[0]?.category || 'other') : 
//         singleCategory
//       );
//       formData.append('amountRequested', requestAmount);
//       formData.append('purpose', values.purpose);
//       formData.append('businessJustification', values.businessJustification);
//       formData.append('urgency', values.urgency);
//       formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));

//       // Itemized breakdown (if used)
//       if (useItemizedBreakdown && itemizedExpenses.length > 0) {
//         const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
//         formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
//         console.log('Itemized breakdown:', cleanedBreakdown);
//       } else {
//         // For single amount, create a simple breakdown
//         formData.append('itemizedBreakdown', JSON.stringify([{
//           description: values.purpose,
//           amount: singleAmount,
//           category: singleCategory
//         }]));
//       }

//       // Receipt files
//       fileList.forEach((file, index) => {
//         const fileToUpload = file.originFileObj || file;
        
//         if (fileToUpload instanceof File) {
//           formData.append('receiptDocuments', fileToUpload, file.name);
//           console.log(`✓ Added receipt ${index + 1}: ${file.name}`);
//         }
//       });

//       // Debug FormData
//       console.log('\nFormData contents:');
//       for (let pair of formData.entries()) {
//         if (pair[1] instanceof File) {
//           console.log(`  ${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
//         } else {
//           console.log(`  ${pair[0]}: ${pair[1]}`);
//         }
//       }

//       const response = await cashRequestAPI.createReimbursementRequest(formData);

//       console.log('Response:', response);

//       if (response.success) {
//         message.success({
//           content: (
//             <div>
//               <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
//                 ✅ Reimbursement request submitted successfully!
//               </div>
//               <div style={{ fontSize: '12px', marginTop: '8px' }}>
//                 <div>Reference: {response.data?.displayId || 'REQ-' + response.data?._id?.slice(-6)?.toUpperCase()}</div>
//                 <div>Amount: XAF {requestAmount.toLocaleString()}</div>
//                 <div>Monthly limit: {response.limitInfo?.monthlyUsed}/{response.limitInfo?.monthlyLimit} used</div>
//               </div>
//             </div>
//           ),
//           duration: 6
//         });
        
//         setTimeout(() => {
//           navigate('/employee/cash-requests');
//         }, 1500);
//       } else {
//         throw new Error(response.message || 'Reimbursement submission failed');
//       }
//     } catch (error) {
//       console.error('=== SUBMISSION ERROR ===');
//       console.error('Error:', error);

//       const errorMessage = error.response?.data?.message || error.message || 
//         'Failed to submit reimbursement request. Please try again.';
      
//       message.error({
//         content: errorMessage,
//         duration: 5
//       });
//     } finally {
//       setLoading(false);
//       console.log('=== SUBMISSION COMPLETED ===\n');
//     }
//   };

//   const uploadProps = {
//     onRemove: (file) => {
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     },
//     beforeUpload: (file) => {
//       const allowedTypes = [
//         'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
//         'application/pdf'
//       ];

//       const isValidType = allowedTypes.includes(file.type) || file.type.startsWith('image/');
//       const isLt10M = file.size / 1024 / 1024 < 10;

//       if (!isValidType) {
//         message.error(`${file.name} is not a valid file type. Only images and PDFs are allowed.`);
//         return Upload.LIST_IGNORE;
//       }
      
//       if (!isLt10M) {
//         message.error(`${file.name} is too large. File must be smaller than 10MB.`);
//         return Upload.LIST_IGNORE;
//       }

//       if (fileList.length >= 10) {
//         message.error('Maximum 10 receipt documents allowed');
//         return Upload.LIST_IGNORE;
//       }

//       setFileList(prevList => [...prevList, {
//         uid: file.uid || `${Date.now()}-${Math.random()}`,
//         name: file.name,
//         status: 'done',
//         type: file.type,
//         size: file.size,
//         originFileObj: file
//       }]);

//       console.log('✓ Receipt added:', file.name);
      
//       return false; // Prevent auto upload
//     },
//     fileList: fileList.map(file => ({
//       uid: file.uid,
//       name: file.name,
//       status: file.status || 'done',
//       type: file.type,
//       size: file.size
//     })),
//     accept: 'image/*,.pdf',
//     multiple: true,
//     listType: 'picture',
//     showUploadList: {
//       showPreviewIcon: true,
//       showDownloadIcon: false,
//       showRemoveIcon: true
//     }
//   };

//   const expenseColumns = [
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (text, record) => (
//         <Input
//           placeholder="e.g., Taxi from airport to office"
//           value={text}
//           onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
//         />
//       ),
//       width: '35%'
//     },
//     {
//       title: 'Category',
//       dataIndex: 'category',
//       key: 'category',
//       render: (text, record) => (
//         <Select
//           style={{ width: '100%' }}
//           placeholder="Select category"
//           value={text || undefined}
//           onChange={(value) => updateExpenseItem(record.key, 'category', value)}
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

//   if (loadingLimit) {
//     return (
//       <Card>
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Text>Loading reimbursement status...</Text>
//         </div>
//       </Card>
//     );
//   }

//   if (limitStatus && !limitStatus.canSubmit) {
//     return (
//       <Card>
//         <Alert
//           message="Monthly Reimbursement Limit Reached"
//           description={
//             <div>
//               <Paragraph>
//                 You have submitted {limitStatus.count} reimbursement requests this month, 
//                 which is the maximum allowed limit of {limitStatus.limit} requests.
//               </Paragraph>
//               <Paragraph>
//                 Please wait until next month to submit additional reimbursement requests.
//               </Paragraph>
//             </div>
//           }
//           type="error"
//           showIcon
//           icon={<WarningOutlined />}
//         />
//         <div style={{ marginTop: '20px', textAlign: 'center' }}>
//           <Button onClick={() => navigate('/employee/cash-requests')}>
//             Back to My Requests
//           </Button>
//         </div>
//       </Card>
//     );
//   }

//   return (
//     <Card>
//       <Title level={3}>
//         <DollarOutlined /> New Reimbursement Request
//       </Title>

//       <Space direction="vertical" style={{ width: '100%', marginBottom: '24px' }}>
//         <Alert
//           message="Reimbursement Request Guidelines"
//           description={
//             <div>
//               <Text>
//                 Submit this form to request reimbursement for expenses you have already paid from personal funds.
//               </Text>
//               <Divider style={{ margin: '12px 0' }} />
//               <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//                 <li><strong>Maximum Amount:</strong> XAF 100,000 per request</li>
//                 <li><strong>Monthly Limit:</strong> 5 reimbursement requests per month</li>
//                 <li><strong>Receipt Documents:</strong> Mandatory - must upload clear receipts</li>
//                 <li><strong>Itemized Breakdown:</strong> Optional but recommended for faster approval</li>
//                 <li><strong>Approval Process:</strong> Same 4-level hierarchy as cash advances</li>
//               </ul>
//             </div>
//           }
//           type="info"
//           icon={<InfoCircleOutlined />}
//           showIcon
//         />

//         {limitStatus && (
//           <Alert
//             message={`Monthly Limit Status: ${limitStatus.count}/${limitStatus.limit} used, ${limitStatus.remaining} remaining`}
//             type={limitStatus.remaining <= 1 ? 'warning' : 'success'}
//             showIcon
//           />
//         )}
//       </Space>

//       <Form form={form} layout="vertical" onFinish={handleSubmit}>
//         <Row gutter={[16, 16]}>
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

//           <Col xs={24} md={12}>
//             <Form.Item
//               name="requiredDate"
//               label="Date of Expense"
//               rules={[{ required: true, message: 'Please select the date of expense' }]}
//               extra="Select the date when you incurred these expenses"
//             >
//               <DatePicker 
//                 style={{ width: '100%' }} 
//                 disabledDate={(current) => current && current > dayjs().endOf('day')}
//                 placeholder="Select expense date"
//               />
//             </Form.Item>
//           </Col>
//         </Row>

//         <Form.Item
//           name="purpose"
//           label="Purpose of Expense"
//           rules={[{ 
//             required: true,
//             min: 10,
//             message: 'Please provide a detailed purpose (minimum 10 characters)'
//           }]}
//         >
//           <TextArea 
//             rows={3} 
//             placeholder="Describe what these expenses were for"
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
//             placeholder="Explain why these expenses were necessary for business operations"
//             showCount
//             maxLength={1000}
//           />
//         </Form.Item>

//         <Divider />

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
//               <Text strong>Use Itemized Breakdown</Text>
//               <Tag color="green" icon={<CheckCircleOutlined />}>
//                 Recommended
//               </Tag>
//               <Tooltip title="Adding itemized breakdown with categories helps approvers understand your expenses better">
//                 <InfoCircleOutlined style={{ color: '#1890ff' }} />
//               </Tooltip>
//             </Space>
            
//             {!useItemizedBreakdown && (
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Itemized breakdown is optional. You can enter a single total amount instead.
//               </Text>
//             )}
//           </Space>
//         </Card>

//         {/* SINGLE AMOUNT MODE */}
//         {!useItemizedBreakdown && (
//           <>
//             <Row gutter={[16, 16]}>
//               <Col xs={24} md={12}>
//                 <Form.Item
//                   label="Expense Category"
//                   rules={[{ required: true, message: 'Please select a category' }]}
//                 >
//                   <Select
//                     placeholder="Select expense category"
//                     value={singleCategory}
//                     onChange={setSingleCategory}
//                   >
//                     {requestTypes.map(type => (
//                       <Option key={type.value} value={type.value}>
//                         {type.label}
//                       </Option>
//                     ))}
//                   </Select>
//                 </Form.Item>
//               </Col>

//               <Col xs={24} md={12}>
//                 <Form.Item
//                   label="Total Amount (XAF)"
//                   rules={[{ required: true, message: 'Please enter amount' }]}
//                 >
//                   <InputNumber
//                     style={{ width: '100%' }}
//                     min={0}
//                     max={100000}
//                     step={1000}
//                     placeholder="Enter total amount"
//                     value={singleAmount}
//                     onChange={setSingleAmount}
//                     formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                     parser={(value) => value.replace(/,/g, '')}
//                   />
//                 </Form.Item>
//               </Col>
//             </Row>

//             {singleAmount > 100000 && (
//               <Alert
//                 message="Amount exceeds limit"
//                 description="Reimbursement amount cannot exceed XAF 100,000"
//                 type="error"
//                 showIcon
//                 style={{ marginBottom: '16px' }}
//               />
//             )}
//           </>
//         )}

//         {/* ITEMIZED BREAKDOWN MODE */}
//         {useItemizedBreakdown && (
//           <Card 
//             title={
//               <Space>
//                 <FileTextOutlined />
//                 <Text strong>Itemized Expenses</Text>
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
//                 description="Click 'Add Item' to start adding your itemized expenses with categories"
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
//                           <Text strong style={{ color: totalAmount > 100000 ? '#ff4d4f' : '#1890ff', fontSize: '16px' }}>
//                             XAF {totalAmount.toLocaleString()}
//                           </Text>
//                         </Table.Summary.Cell>
//                         <Table.Summary.Cell index={2} />
//                       </Table.Summary.Row>
//                     </Table.Summary>
//                   )}
//                 />

//                 {totalAmount > 100000 && (
//                   <Alert
//                     message="Amount exceeds limit"
//                     description="Reimbursement amount cannot exceed XAF 100,000"
//                     type="error"
//                     showIcon
//                     style={{ marginTop: '16px' }}
//                   />
//                 )}
//               </>
//             )}
//           </Card>
//         )}

//         <Form.Item name="amountRequested" hidden>
//           <Input />
//         </Form.Item>

//         {/* Receipt Upload */}
//         <Form.Item
//           label={
//             <span>
//               Receipt Documents
//               <span style={{ color: '#ff4d4f', marginLeft: '4px' }}>*</span>
//             </span>
//           }
//           extra={
//             <div>
//               <div>Upload clear images or PDFs of all receipts (max 10 files, 10MB each)</div>
//               <div style={{ color: '#ff4d4f', fontWeight: 'bold', marginTop: '4px' }}>
//                 Receipt documents are MANDATORY for all reimbursement requests
//               </div>
//             </div>
//           }
//           required
//         >
//           <Upload {...uploadProps}>
//             {fileList.length >= 10 ? null : (
//               <Button icon={<UploadOutlined />} block>
//                 Upload Receipt Documents (Required) - {fileList.length} file(s) selected
//               </Button>
//             )}
//           </Upload>
//         </Form.Item>

//         {/* Summary Card */}
//         <Card style={{ marginBottom: '24px', backgroundColor: '#f0f2f5' }}>
//           <Row gutter={[16, 16]}>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title="Total Reimbursement Amount"
//                 value={useItemizedBreakdown ? totalAmount : singleAmount}
//                 precision={0}
//                 valueStyle={{ 
//                   color: (useItemizedBreakdown ? totalAmount : singleAmount) > 100000 ? '#ff4d4f' : '#3f8600' 
//                 }}
//                 prefix={<DollarOutlined />}
//                 suffix="XAF"
//               />
//             </Col>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title={useItemizedBreakdown ? "Expense Items" : "Mode"}
//                 value={useItemizedBreakdown ? itemizedExpenses.length : "Single Amount"}
//                 valueStyle={{ color: '#1890ff' }}
//                 prefix={<FileTextOutlined />}
//               />
//             </Col>
//             <Col xs={24} sm={8}>
//               <Statistic
//                 title="Receipt Documents"
//                 value={fileList.length}
//                 valueStyle={{ color: fileList.length === 0 ? '#ff4d4f' : '#52c41a' }}
//                 prefix={<UploadOutlined />}
//               />
//             </Col>
//           </Row>
//         </Card>

//         <Form.Item>
//           <Space>
//             <Button onClick={() => navigate('/employee/cash-requests')}>
//               Cancel
//             </Button>
//             <Button 
//               type="primary" 
//               htmlType="submit" 
//               loading={loading}
//               disabled={
//                 loading || 
//                 !limitStatus?.canSubmit || 
//                 fileList.length === 0 ||
//                 (useItemizedBreakdown ? 
//                   (itemizedExpenses.length === 0 || totalAmount > 100000 || totalAmount === 0) : 
//                   (singleAmount > 100000 || singleAmount === 0 || !singleCategory)
//                 )
//               }
//             >
//               {loading ? 'Submitting...' : 'Submit Reimbursement Request'}
//             </Button>
//           </Space>
//         </Form.Item>
//       </Form>
//     </Card>
//   );
// };

// export default ReimbursementRequestForm;

