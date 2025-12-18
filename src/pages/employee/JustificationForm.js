
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
  Space,
  Table,
  InputNumber,
  Select,
  Switch,
  Tooltip,
  Tag
} from 'antd';
import { 
  UploadOutlined, 
  DollarOutlined, 
  ArrowLeftOutlined,
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const JustificationForm = () => {
  const { requestId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [request, setRequest] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);
  
  // Itemized breakdown state
  const [useItemizedBreakdown, setUseItemizedBreakdown] = useState(false);
  const [itemizedExpenses, setItemizedExpenses] = useState([]);
  const [itemizedTotal, setItemizedTotal] = useState(0);
  
  const navigate = useNavigate();

  const expenseTypes = [
    { value: 'travel', label: 'Travel Expenses' },
    { value: 'office-supplies', label: 'Office Supplies' },
    { value: 'client-entertainment', label: 'Client Entertainment' },
    { value: 'project-materials', label: 'Project Materials' },
    { value: 'accommodation', label: 'Accommodation' },
    { value: 'perdiem', label: 'Per Diem' },
    { value: 'bills', label: 'Bills' },
    { value: 'staff-transportation', label: 'Staff Transportation' },
    { value: 'toll-gates', label: 'Toll Gates' },
    { value: 'office-items', label: 'Office Items' },
    { value: 'meals', label: 'Meals' },
    { value: 'fuel', label: 'Fuel' },
    { value: 'other', label: 'Other' }
  ];

  // Calculate itemized total
  useEffect(() => {
    if (useItemizedBreakdown) {
      const total = itemizedExpenses.reduce((sum, item) => 
        sum + (parseFloat(item.amount) || 0), 0
      );
      setItemizedTotal(total);
      form.setFieldValue('amountSpent', total);
      
      // Auto-calculate balance returned
      const disbursedAmount = request?.disbursementDetails?.amount || 0;
      const balance = disbursedAmount - total;
      form.setFieldValue('balanceReturned', Math.max(0, balance));
    }
  }, [itemizedExpenses, useItemizedBreakdown, form, request]);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setFetching(true);
        setError(null);
        
        console.log('Fetching justification form data for request ID:', requestId);
        
        if (!requestId) {
          throw new Error('No request ID provided');
        }

        let response;
        try {
          response = await api.get(`/cash-requests/employee/${requestId}/justification`);
        } catch (justifyError) {
          console.log('Justify endpoint failed, trying regular request endpoint...', justifyError);
          response = await api.get(`/cash-requests/${requestId}`);
        }
        
        console.log('Justification form response:', response.data);
        
        if (response.data.success) {
          const requestData = response.data.data;
          setRequest(requestData);
          
          // ✅ FIXED: Accept all disbursed and justification statuses
          const validStatuses = [
            'disbursed',
            'fully_disbursed',
            'partially_disbursed',
            'justification_pending',
            'justification_pending_supervisor',
            'justification_pending_finance',
            'justification_rejected_supervisor',
            'justification_rejected_finance'
          ];
          
          const canSubmitJustification = validStatuses.includes(requestData.status);
          
          if (!canSubmitJustification) {
            setError(`Cannot submit justification for request with status: ${requestData.status}. Request must be disbursed first.`);
            return;
          }
          
          // Load existing justification if available
          if (requestData.justification) {
            form.setFieldsValue({
              amountSpent: requestData.justification.amountSpent,
              balanceReturned: requestData.justification.balanceReturned,
              details: requestData.justification.details
            });
            
            // Load existing itemized breakdown
            if (requestData.justification.itemizedBreakdown && 
                requestData.justification.itemizedBreakdown.length > 0) {
              setUseItemizedBreakdown(true);
              setItemizedExpenses(
                requestData.justification.itemizedBreakdown.map((item, index) => ({
                  key: Date.now() + index,
                  description: item.description,
                  amount: item.amount,
                  category: item.category || ''
                }))
              );
            }
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch request details');
        }
      } catch (error) {
        console.error('Error fetching request for justification:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
        setError(errorMessage);
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

  // Itemized breakdown handlers
  const addExpenseItem = () => {
    setItemizedExpenses([
      ...itemizedExpenses,
      {
        key: Date.now(),
        description: '',
        amount: 0,
        category: ''
      }
    ]);
  };

  const removeExpenseItem = (key) => {
    setItemizedExpenses(itemizedExpenses.filter(item => item.key !== key));
  };

  const updateExpenseItem = (key, field, value) => {
    setItemizedExpenses(itemizedExpenses.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  const handleToggleItemizedBreakdown = (checked) => {
    setUseItemizedBreakdown(checked);
    if (!checked) {
      setItemizedExpenses([]);
      setItemizedTotal(0);
    } else {
      // Auto-add first item
      addExpenseItem();
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      console.log('Submitting justification:', values);

      // Validation for itemized breakdown
      if (useItemizedBreakdown) {
        if (itemizedExpenses.length === 0) {
          message.error('Please add at least one expense item or disable itemized breakdown');
          return;
        }

        const invalidItems = itemizedExpenses.filter(item => 
          !item.description || !item.amount || parseFloat(item.amount) <= 0
        );

        if (invalidItems.length > 0) {
          message.error('All expense items must have a description and valid amount');
          return;
        }

        const discrepancy = Math.abs(itemizedTotal - parseFloat(values.amountSpent));
        if (discrepancy > 1) {
          message.error(
            `Itemized total (XAF ${itemizedTotal.toLocaleString()}) must match amount spent (XAF ${parseFloat(values.amountSpent).toLocaleString()})`
          );
          return;
        }
      }
      
      const formData = new FormData();
      formData.append('amountSpent', values.amountSpent);
      formData.append('balanceReturned', values.balanceReturned);
      formData.append('details', values.details);
      
      // Add itemized breakdown if used
      if (useItemizedBreakdown && itemizedExpenses.length > 0) {
        const cleanedBreakdown = itemizedExpenses.map(({ key, ...rest }) => rest);
        formData.append('itemizedBreakdown', JSON.stringify(cleanedBreakdown));
        console.log('Itemized breakdown:', cleanedBreakdown);
      }
      
      // Add files to form data
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('attachments', file.originFileObj);
        }
      });

      const response = await api.post(
        `/cash-requests/${requestId}/justification`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );

      console.log('Justification submission response:', response.data);

      if (response.data.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Justification submitted successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                {fileList.length > 0 && (
                  <div>📎 {fileList.length} document(s) uploaded</div>
                )}
                {useItemizedBreakdown && (
                  <div>📋 Itemized breakdown included ({itemizedExpenses.length} items)</div>
                )}
              </div>
            </div>
          ),
          duration: 5
        });
        navigate(`/employee/request/${requestId}`);
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
    beforeUpload: () => false,
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
    maxCount: 10,
    onRemove: (file) => {
      const index = fileList.indexOf(file);
      const newFileList = fileList.slice();
      newFileList.splice(index, 1);
      setFileList(newFileList);
    }
  };

  // Expense columns for itemized table
  const expenseColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text, record) => (
        <Input
          placeholder="e.g., Taxi from office to client site"
          value={text}
          onChange={(e) => updateExpenseItem(record.key, 'description', e.target.value)}
        />
      ),
      width: '35%'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select category"
          value={text || undefined}
          onChange={(value) => updateExpenseItem(record.key, 'category', value)}
          allowClear
        >
          {expenseTypes.map(type => (
            <Option key={type.value} value={type.value}>
              {type.label}
            </Option>
          ))}
        </Select>
      ),
      width: '30%'
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      render: (text, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1}
          placeholder="0"
          value={text}
          onChange={(value) => updateExpenseItem(record.key, 'amount', value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/,/g, '')}
        />
      ),
      width: '25%'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeExpenseItem(record.key)}
        />
      ),
      width: '10%'
    }
  ];

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

  const disbursedAmount = request.disbursementDetails?.amount || request.amountApproved || 0;

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
            <Text strong>XAF {Number(request.amountRequested || 0).toLocaleString()}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Amount Disbursed">
            <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
              {/* ✅ FIXED: Use totalDisbursed instead of disbursementDetails */}
              XAF {Number(request.totalDisbursed || request.disbursementDetails?.amount || 0).toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Disbursement Date">
            {/* ✅ FIXED: Get date from disbursements array */}
            {request.disbursements && request.disbursements.length > 0
              ? new Date(request.disbursements[request.disbursements.length - 1].date).toLocaleDateString('en-GB')
              : request.disbursementDetails?.disbursedAt || request.disbursementDetails?.date
              ? new Date(request.disbursementDetails.disbursedAt || request.disbursementDetails.date).toLocaleDateString('en-GB')
              : 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Disbursed By">
            {/* ✅ FIXED: Get disbursedBy from disbursements array */}
            {request.disbursements && request.disbursements.length > 0
              ? request.disbursements[request.disbursements.length - 1].disbursedBy?.fullName || 
                request.disbursements[request.disbursements.length - 1].disbursedBy?.name || 
                'N/A'
              : request.disbursementDetails?.disbursedBy?.fullName || 
                request.disbursementDetails?.disbursedBy?.name || 
                'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Current Status">
            <Text strong>{request.status?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Itemized Breakdown Toggle */}
        <Card 
          style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
          bodyStyle={{ padding: '16px' }}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space align="center">
              <Switch 
                checked={useItemizedBreakdown}
                onChange={handleToggleItemizedBreakdown}
              />
              <Text strong>Add Itemized Breakdown</Text>
              <Tag color="green" icon={<CheckCircleOutlined />}>
                Recommended
              </Tag>
              <Tooltip title="Adding itemized breakdown helps approvers understand your expenses better and speeds up approval">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </Space>
            
            {!useItemizedBreakdown && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Providing detailed breakdown is optional but recommended for transparency
              </Text>
            )}
          </Space>
        </Card>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {!useItemizedBreakdown ? (
            <Form.Item
              name="amountSpent"
              label="Amount Spent (XAF)"
              rules={[
                { required: true, message: 'Please enter amount spent' },
                {
                  validator: (_, value) => {
                    if (value && value > disbursedAmount) {
                      return Promise.reject(`Amount spent cannot exceed disbursed amount of XAF ${disbursedAmount.toLocaleString()}`);
                    }
                    if (value && value < 0) {
                      return Promise.reject('Amount spent cannot be negative');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                max={disbursedAmount}
                step={1}
                placeholder="Enter amount spent"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => value.replace(/,/g, '')}
              />
            </Form.Item>
          ) : (
            <Form.Item
              name="amountSpent"
              label="Total Amount Spent (Auto-calculated from breakdown)"
              rules={[{ required: true, message: 'Please add expense items' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                disabled
                value={itemizedTotal}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                prefix={<DollarOutlined />}
              />
            </Form.Item>
          )}

          {/* Itemized Expenses Section */}
          {useItemizedBreakdown && (
            <Card 
              title={
                <Space>
                  <FileTextOutlined />
                  <Text strong>Itemized Expenses</Text>
                  <Tag color="blue">Detailed Breakdown</Tag>
                </Space>
              }
              extra={
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={addExpenseItem}
                  disabled={itemizedExpenses.length >= 50}
                >
                  Add Item
                </Button>
              }
              style={{ marginBottom: '24px' }}
            >
              {itemizedExpenses.length === 0 ? (
                <Alert
                  message="No expense items added yet"
                  description="Click 'Add Item' to start adding your itemized expenses"
                  type="info"
                  showIcon
                />
              ) : (
                <>
                  <Table
                    dataSource={itemizedExpenses}
                    columns={expenseColumns}
                    pagination={false}
                    size="small"
                    rowKey="key"
                    summary={() => (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={2}>
                            <Text strong>Total Amount Spent</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={1}>
                            <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                              XAF {itemizedTotal.toLocaleString()}
                            </Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={2} />
                        </Table.Summary.Row>
                      </Table.Summary>
                    )}
                  />
                  
                  {itemizedTotal > disbursedAmount && (
                    <Alert
                      message="Warning: Total exceeds disbursed amount"
                      description={`Your itemized total (XAF ${itemizedTotal.toLocaleString()}) exceeds the disbursed amount (XAF ${disbursedAmount.toLocaleString()})`}
                      type="warning"
                      showIcon
                      style={{ marginTop: '16px' }}
                    />
                  )}
                </>
              )}
            </Card>
          )}

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
                  const total = parseFloat(amountSpent) + parseFloat(value || 0);
                  const diff = Math.abs(total - disbursedAmount);
                  if (diff > 0.01) {
                    return Promise.reject(
                      `Total of amount spent (${amountSpent.toLocaleString()}) and balance returned (${value?.toLocaleString() || 0}) ` +
                      `must equal disbursed amount (${disbursedAmount.toLocaleString()})`
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
            extra={useItemizedBreakdown ? "Auto-calculated based on itemized expenses" : "Amount returned to company if you didn't spend all the disbursed funds"}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              step={1}
              placeholder="0"
              disabled={useItemizedBreakdown}
              formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={(value) => value.replace(/,/g, '')}
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
              maxLength={2000}
            />
          </Form.Item>

          <Form.Item
            label="Supporting Documents (Optional)"
            extra="Upload receipts, invoices, or other supporting documents (JPG, PNG, PDF, DOC, DOCX, XLS, XLSX - max 10 files, 10MB each)"
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>Select Files ({fileList.length}/10)</Button>
            </Upload>
            {fileList.length > 0 && (
              <Alert
                message={`${fileList.length} file(s) ready to upload`}
                type="success"
                showIcon
                style={{ marginTop: '8px' }}
              />
            )}
          </Form.Item>

          <Alert
            message="Submission Guidelines"
            description={
              <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
                <li>Amount spent + Balance returned must equal disbursed amount</li>
                {useItemizedBreakdown && (
                  <li>Itemized breakdown total must match amount spent</li>
                )}
                <li>Supporting documents are optional but recommended</li>
                <li>Provide detailed explanation of all expenses</li>
                <li>Justification will go through approval chain</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

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








// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Form, 
//   Input, 
//   Button, 
//   Upload, 
//   message, 
//   Card, 
//   Typography, 
//   Descriptions,
//   Divider,
//   Alert,
//   Spin,
//   Space
// } from 'antd';
// import { UploadOutlined, DollarOutlined, ArrowLeftOutlined } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const JustificationForm = () => {
//   const { requestId } = useParams();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [fileList, setFileList] = useState([]);
//   const [request, setRequest] = useState(null);
//   const [fetching, setFetching] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchRequest = async () => {
//       try {
//         setFetching(true);
//         setError(null);
        
//         console.log('Fetching justification form data for request ID:', requestId); // Debug log
        
//         if (!requestId) {
//           throw new Error('No request ID provided');
//         }

//         // Try the justification endpoint first
//         let response;
//         try {
//           response = await api.get(`/cash-requests/${requestId}/justify`);
//         } catch (justifyError) {
//           console.log('Justify endpoint failed, trying regular request endpoint...', justifyError);
//           // If justify endpoint fails, try the regular request endpoint
//           response = await api.get(`/cash-requests/${requestId}`);
//         }
        
//         console.log('Justification form response:', response.data); // Debug log
        
//         if (response.data.success) {
//           const requestData = response.data.data;
//           setRequest(requestData);
          
//           // Check if user can submit justification
//           if (requestData.status !== 'disbursed' && requestData.status !== 'justification_pending') {
//             setError(`Cannot submit justification for request with status: ${requestData.status}`);
//             return;
//           }
          
//           // Set initial form values if justification exists
//           if (requestData.justification) {
//             form.setFieldsValue({
//               amountSpent: requestData.justification.amountSpent,
//               balanceReturned: requestData.justification.balanceReturned,
//               details: requestData.justification.details
//             });
            
//             // If existing attachments, you might want to show them here
//             // This depends on your backend implementation
//           }
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch request details');
//         }
//       } catch (error) {
//         console.error('Error fetching request for justification:', error);
//         const errorMessage = error.response?.data?.message || error.message || 'Failed to load request details';
//         setError(errorMessage);
//         // Don't automatically navigate away - let user see the error and decide
//       } finally {
//         setFetching(false);
//       }
//     };

//     if (requestId) {
//       fetchRequest();
//     } else {
//       setError('No request ID provided');
//       setFetching(false);
//     }
//   }, [requestId, form]);

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);
      
//       console.log('Submitting justification:', values); // Debug log
      
//       const formData = new FormData();
//       formData.append('amountSpent', values.amountSpent);
//       formData.append('balanceReturned', values.balanceReturned);
//       formData.append('details', values.details);
      
//       // Add files to form data
//       fileList.forEach(file => {
//         if (file.originFileObj) {
//           formData.append('attachments', file.originFileObj);
//         }
//       });

//       const response = await api.post(
//         `/cash-requests/${requestId}/justification`, 
//         formData, 
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           }
//         }
//       );

//       console.log('Justification submission response:', response.data); // Debug log

//       if (response.data.success) {
//         message.success('Justification submitted successfully!');
//         navigate(`/employee/request/${requestId}`); // Navigate back to request details
//       } else {
//         throw new Error(response.data.message || 'Failed to submit justification');
//       }
//     } catch (error) {
//       console.error('Justification submission error:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to submit justification';
//       message.error(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleGoBack = () => {
//     navigate(`/employee/request/${requestId}`);
//   };

//   const uploadProps = {
//     fileList,
//     onChange: ({ fileList }) => setFileList(fileList),
//     beforeUpload: () => false, // Prevent auto upload
//     multiple: true,
//     accept: 'image/*,.pdf,.doc,.docx,.xlsx,.xls',
//     maxCount: 5,
//     onRemove: (file) => {
//       const index = fileList.indexOf(file);
//       const newFileList = fileList.slice();
//       newFileList.splice(index, 1);
//       setFileList(newFileList);
//     }
//   };

//   if (fetching) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading justification form...</div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Error Loading Justification Form"
//           description={error}
//           type="error"
//           showIcon
//           action={
//             <Space>
//               <Button onClick={handleGoBack}>Back to Request Details</Button>
//               <Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>
//             </Space>
//           }
//         />
//       </div>
//     );
//   }

//   if (!request) {
//     return (
//       <div style={{ padding: '24px' }}>
//         <Alert
//           message="Request Not Found"
//           description="The request you are trying to access does not exist or you don't have permission to view it."
//           type="error"
//           showIcon
//           action={
//             <Space>
//               <Button onClick={handleGoBack}>Back to Request Details</Button>
//               <Button onClick={() => navigate('/employee/requests')}>Back to Requests</Button>
//             </Space>
//           }
//         />
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={3} style={{ margin: 0 }}>
//             Cash Justification Form
//           </Title>
//           <Text type="secondary">
//             REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
//           </Text>
//         </div>

//         <Descriptions bordered column={1} size="middle">
//           <Descriptions.Item label="Request ID">
//             REQ-{request._id?.slice(-6).toUpperCase() || 'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Original Amount Requested">
//             <Text strong>XAF {Number(request.amountRequested || 0).toFixed(2)}</Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Amount Disbursed">
//             <Text strong style={{ fontSize: '16px', color: '#1890ff' }}>
//               XAF {Number(request.amountApproved || request.disbursementDetails?.amount || 0).toFixed(2)}
//             </Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Disbursement Date">
//             {request.disbursementDetails?.disbursedAt || request.disbursementDetails?.date
//               ? new Date(request.disbursementDetails.disbursedAt || request.disbursementDetails.date).toLocaleDateString('en-GB') 
//               : 'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Disbursed By">
//             {request.disbursementDetails?.disbursedBy?.fullName || 
//              request.disbursementDetails?.disbursedBy?.name || 
//              'N/A'}
//           </Descriptions.Item>
//           <Descriptions.Item label="Current Status">
//             <Text strong>{request.status?.replace('_', ' ').toUpperCase() || 'N/A'}</Text>
//           </Descriptions.Item>
//         </Descriptions>

//         <Divider />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//         >
//           <Form.Item
//             name="amountSpent"
//             label="Amount Spent (XAF)"
//             rules={[
//               { required: true, message: 'Please enter amount spent' },
//               {
//                 validator: (_, value) => {
//                   const disbursedAmount = request.amountApproved || request.disbursementDetails?.amount || 0;
//                   if (value && value > disbursedAmount) {
//                     return Promise.reject(`Amount spent cannot exceed disbursed amount of XAF ${disbursedAmount.toFixed(2)}`);
//                   }
//                   if (value && value < 0) {
//                     return Promise.reject('Amount spent cannot be negative');
//                   }
//                   return Promise.resolve();
//                 }
//               }
//             ]}
//           >
//             <Input
//               type="number"
//               min={0}
//               max={request.amountApproved || request.disbursementDetails?.amount || undefined}
//               step={0.01}
//               prefix="XAF"
//               placeholder="0.00"
//             />
//           </Form.Item>

//           <Form.Item
//             name="balanceReturned"
//             label="Balance Returned (XAF)"
//             rules={[
//               { required: true, message: 'Please enter balance returned (enter 0 if none)' },
//               ({ getFieldValue }) => ({
//                 validator(_, value) {
//                   if (value < 0) {
//                     return Promise.reject('Balance returned cannot be negative');
//                   }
//                   const amountSpent = getFieldValue('amountSpent') || 0;
//                   const disbursedAmount = request.amountApproved || request.disbursementDetails?.amount || 0;
//                   const total = parseFloat(amountSpent) + parseFloat(value || 0);
//                   if (total > disbursedAmount) {
//                     return Promise.reject(`Total of amount spent and balance returned cannot exceed disbursed amount of XAF ${disbursedAmount.toFixed(2)}`);
//                   }
//                   return Promise.resolve();
//                 },
//               }),
//             ]}
//           >
//             <Input
//               type="number"
//               min={0}
//               step={0.01}
//               prefix="XAF"
//               placeholder="0.00"
//             />
//           </Form.Item>

//           <Form.Item
//             name="details"
//             label="Detailed Explanation of Spending"
//             rules={[
//               { required: true, message: 'Please provide detailed spending explanation' },
//               { min: 20, message: 'Details must be at least 20 characters long' }
//             ]}
//           >
//             <TextArea 
//               rows={6} 
//               placeholder="Provide a detailed breakdown of how the funds were used, including dates, vendors, items purchased, etc..."
//               showCount
//               maxLength={1000}
//             />
//           </Form.Item>

//           <Form.Item
//             label="Supporting Documents"
//             extra="Upload receipts, invoices, or other supporting documents (JPG, PNG, PDF, DOC, DOCX, XLS, XLSX - max 5 files, 10MB each)"
//           >
//             <Upload {...uploadProps}>
//               <Button icon={<UploadOutlined />}>Select Files</Button>
//             </Upload>
//           </Form.Item>

//           <Form.Item>
//             <Space size="middle">
//               <Button 
//                 icon={<ArrowLeftOutlined />}
//                 onClick={handleGoBack}
//               >
//                 Back to Request Details
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 loading={loading}
//                 icon={<DollarOutlined />}
//               >
//                 Submit Justification
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default JustificationForm;