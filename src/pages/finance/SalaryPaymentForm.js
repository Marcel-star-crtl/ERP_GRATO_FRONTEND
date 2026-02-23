import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Table,
  message,
  Alert,
  Upload,
  Divider,
  Descriptions,
  Progress,
  Tag
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  DollarOutlined,
  UploadOutlined,
  BankOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { budgetCodesAPI } from '../../services/cashRequestAPI';
import { salaryPaymentAPI } from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const DEPARTMENTS = [
  'Roll Out',
  'Technical Roll Out',
  'Operations',
  'IT',
  'Technical',
  'Technical Operations',
  'Technical Refurbishment',
  'Technical QHSE',
  'Finance',
  'HR',
  'Marketing',
  'Supply Chain',
  'Facilities',
  'Business',
  'CEO Office'
];

const SalaryPaymentForm = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);
  const [departmentPayments, setDepartmentPayments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [selectedBudgetDetails, setSelectedBudgetDetails] = useState({});

  useEffect(() => {
    fetchBudgetCodes();
  }, []);

  const fetchBudgetCodes = async () => {
    try {
      setLoadingBudgetCodes(true);
      const response = await budgetCodesAPI.getAvailableBudgetCodes();
      
      if (response.success && Array.isArray(response.data)) {
        setBudgetCodes(response.data);
        message.success(`Loaded ${response.data.length} active budget codes`);
      } else {
        setBudgetCodes([]);
        message.warning('No budget codes available');
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      message.error('Failed to load budget codes');
      setBudgetCodes([]);
    } finally {
      setLoadingBudgetCodes(false);
    }
  };

  const totalAmount = useMemo(() => {
    return departmentPayments.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [departmentPayments]);

  const handleAddDepartment = () => {
    setDepartmentPayments([
      ...departmentPayments,
      {
        key: Date.now(),
        department: '',
        budgetCode: '',
        amount: 0,
        notes: ''
      }
    ]);
  };

  const handleRemoveDepartment = (key) => {
    setDepartmentPayments(departmentPayments.filter(item => item.key !== key));
  };

  const handleUpdateDepartment = (key, field, value) => {
    setDepartmentPayments(departmentPayments.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        
        // When budget code changes, fetch its details
        if (field === 'budgetCode' && value) {
          const budgetCode = budgetCodes.find(bc => bc._id === value);
          if (budgetCode) {
            setSelectedBudgetDetails(prev => ({
              ...prev,
              [key]: {
                code: budgetCode.code,
                name: budgetCode.name,
                totalBudget: budgetCode.budget,
                used: budgetCode.used,
                available: budgetCode.budget - budgetCode.used
              }
            }));
          }
        }
        
        return updated;
      }
      return item;
    }));
  };

  const validateFile = (file) => {
    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error(`${file.name} exceeds 10MB limit`);
      return false;
    }
    return true;
  };

  const uploadProps = {
    onRemove: (file) => {
      const index = attachments.indexOf(file);
      const newFileList = attachments.slice();
      newFileList.splice(index, 1);
      setAttachments(newFileList);
    },
    beforeUpload: (file) => {
      if (!validateFile(file)) return Upload.LIST_IGNORE;
      
      const fileWithOrigin = {
        uid: file.uid || `${Date.now()}-${Math.random()}`,
        name: file.name,
        status: 'done',
        size: file.size,
        type: file.type,
        originFileObj: file
      };
      
      setAttachments([...attachments, fileWithOrigin]);
      return false;
    },
    fileList: attachments,
    multiple: true,
    maxCount: 10,
    accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'
  };

  const handleSubmit = async (values) => {
    try {
      if (departmentPayments.length === 0) {
        message.error('Please add at least one department payment');
        return;
      }

      // Validate all entries
      const invalidEntries = departmentPayments.filter(item =>
        !item.department || !item.budgetCode || !item.amount || parseFloat(item.amount) <= 0
      );

      if (invalidEntries.length > 0) {
        message.error('All entries must have department, budget code, and valid amount');
        return;
      }

      // Check budget availability
      for (const payment of departmentPayments) {
        const details = selectedBudgetDetails[payment.key];
        if (details && parseFloat(payment.amount) > details.available) {
          message.error(
            `Insufficient budget for ${payment.department}. Available: XAF ${details.available.toLocaleString()}`
          );
          return;
        }
      }

      setLoading(true);

      const formData = new FormData();
      
      formData.append('paymentPeriod', JSON.stringify({
        month: values.paymentMonth.month() + 1,
        year: values.paymentMonth.year()
      }));
      
      const cleanedPayments = departmentPayments.map(({ key, ...rest }) => rest);
      formData.append('departmentPayments', JSON.stringify(cleanedPayments));
      
      if (values.description) {
        formData.append('description', values.description);
      }
      
      attachments.forEach(file => {
        if (file.originFileObj) {
          formData.append('supportingDocuments', file.originFileObj, file.name);
        }
      });

      const response = await salaryPaymentAPI.create(formData);

      if (response.success) {
        message.success({
          content: (
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                ✅ Salary payment processed successfully!
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>💰 Total: XAF {totalAmount.toLocaleString()}</div>
                <div>🏢 {departmentPayments.length} department(s)</div>
                {response.metadata?.documentsUploaded > 0 && (
                  <div>📎 {response.metadata.documentsUploaded} document(s) uploaded</div>
                )}
              </div>
            </div>
          ),
          duration: 5
        });
        
        setTimeout(() => {
          navigate('/finance/salary-payments');
        }, 1500);
      }

    } catch (error) {
      console.error('Submission error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to process salary payment';
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: '25%',
      render: (text, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select department"
          value={text || undefined}
          onChange={(value) => handleUpdateDepartment(record.key, 'department', value)}
        >
          {DEPARTMENTS.map(dept => (
            <Option key={dept} value={dept}>{dept}</Option>
          ))}
        </Select>
      )
    },
    {
      title: 'Budget Code',
      dataIndex: 'budgetCode',
      key: 'budgetCode',
      width: '25%',
      render: (text, record) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select budget code"
          value={text || undefined}
          onChange={(value) => handleUpdateDepartment(record.key, 'budgetCode', value)}
          loading={loadingBudgetCodes}
          showSearch
          optionFilterProp="children"
        >
          {budgetCodes.map(code => {
            const available = code.budget - code.used;
            const utilizationRate = Math.round((code.used / code.budget) * 100);
            
            return (
              <Option key={code._id} value={code._id}>
                <div>
                  <Text strong>{code.code}</Text> - {code.name}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    Available: XAF {available.toLocaleString()}
                    <Tag
                      color={utilizationRate >= 90 ? 'red' : utilizationRate >= 75 ? 'orange' : 'green'}
                      style={{ marginLeft: '4px' }}
                      size="small"
                    >
                      {utilizationRate}% used
                    </Tag>
                  </Text>
                </div>
              </Option>
            );
          })}
        </Select>
      )
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      width: '20%',
      render: (text, record) => (
        <InputNumber
          style={{ width: '100%' }}
          min={0}
          step={1000}
          placeholder="0"
          value={text}
          onChange={(value) => handleUpdateDepartment(record.key, 'amount', value)}
          formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={(value) => value.replace(/,/g, '')}
        />
      )
    },
    {
      title: 'Notes (Optional)',
      dataIndex: 'notes',
      key: 'notes',
      width: '25%',
      render: (text, record) => (
        <Input
          placeholder="Additional notes"
          value={text}
          onChange={(e) => handleUpdateDepartment(record.key, 'notes', e.target.value)}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: '5%',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveDepartment(record.key)}
        />
      )
    }
  ];

  return (
    <Card>
      <Title level={3}>
        <BankOutlined /> Salary Payment Processing
      </Title>

      <Alert
        message="Bulk Salary Payment by Department"
        description={
          <div>
            <Text>Process salary payments for multiple departments in a single submission.</Text>
            <Divider style={{ margin: '12px 0' }} />
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li><strong>Department-based:</strong> Select departments and allocate budget codes</li>
              <li><strong>No Approvals:</strong> Payments are processed immediately</li>
              <li><strong>Budget Validation:</strong> Real-time budget availability checks</li>
              <li><strong>Supporting Documents:</strong> Upload payroll summaries and reports</li>
            </ul>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Form.Item
              name="paymentMonth"
              label="Payment Period (Month/Year)"
              rules={[{ required: true, message: 'Please select payment period' }]}
              initialValue={moment()}
            >
              <DatePicker
                picker="month"
                style={{ width: '100%' }}
                format="MMMM YYYY"
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={12}>
            <Form.Item label="Submitted By">
              <Input value={user?.fullName || user?.email} disabled />
            </Form.Item>
          </Col>
        </Row>

        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <BankOutlined />
                <Text strong>Department Payments ({departmentPayments.length})</Text>
              </Space>
              <Space>
                {totalAmount > 0 && (
                  <Text type="secondary">
                    Total: <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                      XAF {totalAmount.toLocaleString()}
                    </Text>
                  </Text>
                )}
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAddDepartment}
                  disabled={loadingBudgetCodes || budgetCodes.length === 0}
                >
                  Add Department
                </Button>
              </Space>
            </div>
          }
          style={{ marginBottom: '24px' }}
        >
          {departmentPayments.length === 0 ? (
            <Alert
              message="No departments added yet"
              description="Click 'Add Department' to start adding salary payments"
              type="info"
              showIcon
            />
          ) : (
            <>
              <Table
                dataSource={departmentPayments}
                columns={columns}
                pagination={false}
                rowKey="key"
                size="small"
                scroll={{ x: 800 }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Total Amount:</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                        XAF {totalAmount.toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3} colSpan={2} />
                  </Table.Summary.Row>
                )}
              />

              {/* Budget Details for Selected Codes */}
              {Object.keys(selectedBudgetDetails).length > 0 && (
                <Card size="small" title="Budget Code Details" style={{ marginTop: '16px' }}>
                  {departmentPayments.map(payment => {
                    const details = selectedBudgetDetails[payment.key];
                    if (!details || !payment.budgetCode) return null;

                    const willExceed = parseFloat(payment.amount) > details.available;
                    const remainingAfter = details.available - parseFloat(payment.amount || 0);

                    return (
                      <div key={payment.key} style={{ marginBottom: '16px' }}>
                        <Descriptions
                          size="small"
                          column={2}
                          bordered
                          title={
                            <Space>
                              <Text strong>{payment.department}</Text>
                              <Tag color="blue">{details.code}</Tag>
                            </Space>
                          }
                        >
                          <Descriptions.Item label="Budget Code">
                            {details.name}
                          </Descriptions.Item>
                          <Descriptions.Item label="Total Budget">
                            XAF {details.totalBudget.toLocaleString()}
                          </Descriptions.Item>
                          <Descriptions.Item label="Used">
                            XAF {details.used.toLocaleString()}
                          </Descriptions.Item>
                          <Descriptions.Item label="Available">
                            <Text strong style={{ color: '#52c41a' }}>
                              XAF {details.available.toLocaleString()}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="Payment Amount" span={2}>
                            <Text strong style={{ color: willExceed ? '#f5222d' : '#1890ff' }}>
                              XAF {(payment.amount || 0).toLocaleString()}
                            </Text>
                          </Descriptions.Item>
                        </Descriptions>
                        
                        {payment.amount > 0 && (
                          <div style={{
                            marginTop: '8px',
                            padding: '12px',
                            backgroundColor: willExceed ? '#fff2e8' : '#f6ffed',
                            borderRadius: '4px',
                            border: `1px solid ${willExceed ? '#ffbb96' : '#b7eb8f'}`
                          }}>
                            <Space>
                              {willExceed ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                              <Text strong>Remaining After Payment: </Text>
                              <Text style={{
                                color: willExceed ? '#ff4d4f' : '#52c41a',
                                fontWeight: 'bold'
                              }}>
                                XAF {remainingAfter.toLocaleString()}
                              </Text>
                            </Space>
                            {willExceed && (
                              <div style={{ marginTop: '8px' }}>
                                <Text type="danger">
                                  ⚠️ Insufficient budget! Please reduce amount or select different budget code.
                                </Text>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </Card>
              )}
            </>
          )}
        </Card>

        <Form.Item
          name="description"
          label="Description (Optional)"
        >
          <TextArea
            rows={3}
            placeholder="Additional notes about this salary payment batch..."
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Form.Item
          label="Supporting Documents (Optional)"
          extra="Upload payroll reports, summaries, or other supporting documents (max 10 files, 10MB each)"
        >
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} block>
              Upload Documents ({attachments.length}/10)
            </Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button onClick={() => navigate('/finance/salary-payments')}>
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={loading || departmentPayments.length === 0}
              icon={<CheckCircleOutlined />}
            >
              {loading ? 'Processing...' : 'Process Payment'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default SalaryPaymentForm;