import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Form, Input, Button, Select, DatePicker, InputNumber, Upload, message, Card, Typography, Space, Alert } from 'antd';
import { UploadOutlined, PlusOutlined, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const CashRequestForm = ({ editMode }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
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

  const handleSubmit = async (values) => {
    try {
      const amount = parseFloat(values.amountRequested);
      if (isNaN(amount) || amount <= 0) {
        message.error('Please enter a valid amount greater than 0');
        return;
      }
  
      setLoading(true);
      
      const formData = new FormData();
      formData.append('requestType', values.requestType);
      formData.append('amountRequested', amount); 
      formData.append('purpose', values.purpose);
      formData.append('businessJustification', values.businessJustification);
      formData.append('urgency', values.urgency);
      formData.append('requiredDate', values.requiredDate.format('YYYY-MM-DD'));
      
      if (values.projectCode) {
        formData.append('projectCode', values.projectCode);
      }
      
      fileList.forEach((file, index) => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj, file.name);
        } else if (file instanceof File) {
          formData.append('attachments', file, file.name);
        }
      });
  
      // Debug log
      console.log('Submitting cash request:', {
        requestType: values.requestType,
        amount: amount,
        employee: user?.fullName,
        department: user?.department,
        attachments: fileList.length
      });
  
      // Submit to backend
      const response = await api.post('/api/cash-requests', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
  
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
      console.error('Submission error:', error);
      
      if (error.response) {
        const { status, data } = error.response;
        
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
        message="Automatic Approval Process"
        description={
          <div>
            <Text>Your request will be automatically routed through the appropriate approval chain based on your department hierarchy.</Text>
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
          <Select placeholder="Select request type">
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

        <Form.Item
          name="projectCode"
          label="Project Code (Optional)"
          extra="Enter the project code if this expense is related to a specific project"
        >
          <Input 
            placeholder="e.g., PROJ-2024-001" 
            style={{ textTransform: 'uppercase' }}
            onChange={(e) => {
              e.target.value = e.target.value.toUpperCase();
            }}
          />
        </Form.Item>

        <Form.Item
          label="Supporting Documents"
          extra="Upload receipts, quotes, or other supporting documents (Images or PDF, max 5 files, 5MB each)"
        >
          <Upload {...uploadProps}>
            {fileList.length >= 5 ? null : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
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




