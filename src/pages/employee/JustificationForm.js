import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Form, 
  Input, 
  Button, 
  Upload, 
  message, 
  Card, 
  Typography, 
  Descriptions,
  Divider,
  Alert,
  Spin,
  Space
} from 'antd';
import { UploadOutlined, DollarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const JustificationForm = () => {
  const { requestId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [request, setRequest] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setFetching(true);
        setError(null);
        
        console.log('Fetching justification form data for request ID:', requestId); // Debug log
        
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        // Try the justification endpoint first
        let response;
        try {
          response = await api.get(`/api/cash-requests/${requestId}/justify`);
        } catch (justifyError) {
          console.log('Justify endpoint failed, trying regular request endpoint...', justifyError);
          // If justify endpoint fails, try the regular request endpoint
          response = await api.get(`/api/cash-requests/${requestId}`);
        }
        
        console.log('Justification form response:', response.data); // Debug log
        
        if (response.data.success) {
          const requestData = response.data.data;
          setRequest(requestData);
          
          // Check if user can submit justification
          if (requestData.status !== 'disbursed' && requestData.status !== 'justification_pending') {
            setError(`Cannot submit justification for request with status: ${requestData.status}`);
            return;
          }
          
          // Set initial form values if justification exists
          if (requestData.justification) {
            form.setFieldsValue({
              amountSpent: requestData.justification.amountSpent,
              balanceReturned: requestData.justification.balanceReturned,
              details: requestData.justification.details
            });
            
            // If existing attachments, you might want to show them here
            // This depends on your backend implementation
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch request details');
        }
      } catch (error) {
        console.error('Error fetching request for justification:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
        setError(errorMessage);
        // Don't automatically navigate away - let user see the error and decide
      } finally {
        setFetching(false);
      }
    };

    if (requestId) {
      fetchRequest();
    } else {
      setError('No request ID provided');
      setFetching(false);
    }
  }, [requestId, form]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      console.log('Submitting justification:', values); // Debug log
      
      const formData = new FormData();
      formData.append('amountSpent', values.amountSpent);
      formData.append('balanceReturned', values.balanceReturned);
      formData.append('details', values.details);
      
      // Add files to form data
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });

      const response = await api.post(
        `/api/cash-requests/${requestId}/justification`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('Justification submission response:', response.data); // Debug log

      if (response.data.success) {
        message.success('Justification submitted successfully!');
        navigate(`/employee/request/${requestId}`); // Navigate back to request details
      } else {
        throw new Error(response.data.message || 'Failed to submit justification');
      }
    } catch (error) {
      console.error('Justification submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit justification';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(`/employee/request/${requestId}`);
  };

  const uploadProps = {
    fileList,
    onChange: ({ fileList }) => setFileList(fileList),
    beforeUpload: () => false, // Prevent auto upload
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
    maxCount: 5,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  if (fetching) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading justification form...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Justification Form"
          description={error}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleGoBack}>Back to Request Details</Button>
              <Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Request Not Found"
          description="The request you are trying to access does not exist or you don't have permission to view it."
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={handleGoBack}>Back to Request Details</Button>
              <Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>
            </Space>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Cash Justification Form
          </Title>
          <Text type="secondary">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Text>
        </div>

        <Descriptions bordered column={1} size="middle">
          <Descriptions.Item label="Request ID">
            REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Original Amount Requested">
            <Text strong>XAF {Number(request.amountRequested || 0).toFixed(2)}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount Disbursed">
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              XAF {Number(request.amountApproved || request.disbursementDetails?.amount || 0).toFixed(2)}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Disbursement Date">
            {request.disbursementDetails?.disbursedAt || request.disbursementDetails?.date
              ? new Date(request.disbursementDetails.disbursedAt || request.disbursementDetails.date).toLocaleDateString('en-GB') 
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Disbursed By">
            {request.disbursementDetails?.disbursedBy?.fullName || 
             request.disbursementDetails?.disbursedBy?.name || 
             'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Text strong>{request.status?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="amountSpent"
            label="Amount Spent (XAF)"
            rules={[
              { required: true, message: 'Please enter amount spent' },
              {
                validator: (_, value) => {
                  const disbursedAmount = request.amountApproved || request.disbursementDetails?.amount || 0;
                  if (value && value > disbursedAmount) {
                    return Promise.reject(`Amount spent cannot exceed disbursed amount of XAF ${disbursedAmount.toFixed(2)}`);
                  }
                  if (value && value < 0) {
                    return Promise.reject('Amount spent cannot be negative');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input
              type="number"
              min={0}
              max={request.amountApproved || request.disbursementDetails?.amount || undefined}
              step={0.01}
              prefix="XAF"
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="balanceReturned"
            label="Balance Returned (XAF)"
            rules={[
              { required: true, message: 'Please enter balance returned (enter 0 if none)' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (value < 0) {
                    return Promise.reject('Balance returned cannot be negative');
                  }
                  const amountSpent = getFieldValue('amountSpent') || 0;
                  const disbursedAmount = request.amountApproved || request.disbursementDetails?.amount || 0;
                  const total = parseFloat(amountSpent) + parseFloat(value || 0);
                  if (total > disbursedAmount) {
                    return Promise.reject(`Total of amount spent and balance returned cannot exceed disbursed amount of XAF ${disbursedAmount.toFixed(2)}`);
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input
              type="number"
              min={0}
              step={0.01}
              prefix="XAF"
              placeholder="0.00"
            />
          </Form.Item>

          <Form.Item
            name="details"
            label="Detailed Explanation of Spending"
            rules={[
              { required: true, message: 'Please provide detailed spending explanation' },
              { min: 20, message: 'Details must be at least 20 characters long' }
            ]}
          >
            <TextArea 
              rows={6} 
              placeholder="Provide a detailed breakdown of how the funds were used, including dates, vendors, items purchased, etc..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item
            label="Supporting Documents"
            extra="Upload receipts, invoices, or other supporting documents (JPG, PNG, PDF, DOC, DOCX, XLS, XLSX - max 5 files, 10MB each)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Files</Button>
            </Upload>
          </Form.Item>

          <Form.Item>
            <Space size="middle">
              <Button 
                icon={<ArrowLeftOutlined />}
                onClick={handleGoBack}
              >
                Back to Request Details
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<DollarOutlined />}
              >
                Submit Justification
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default JustificationForm;