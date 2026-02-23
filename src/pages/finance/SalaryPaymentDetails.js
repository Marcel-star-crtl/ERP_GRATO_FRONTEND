import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Divider,
  Row,
  Col,
  Statistic,
  Alert,
  Spin,
  message,
  List,
  Avatar
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  PrinterOutlined,
  CalendarOutlined,
  BankOutlined,
  FileTextOutlined,
  DollarOutlined,
  UserOutlined,
  CheckCircleOutlined,
  FolderOpenOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { salaryPaymentAPI } from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;

const SalaryPaymentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    fetchPaymentDetails();
  }, [id]);

  const fetchPaymentDetails = async () => {
    try {
      setLoading(true);
      const response = await salaryPaymentAPI.getById(id);
      
      if (response.success) {
        setPayment(response.data);
      } else {
        message.error('Failed to load payment details');
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
      message.error(error.response?.data?.message || 'Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadDocument = async (doc) => {
    try {
      if (!doc.url) {
        message.error('Document URL not found');
        return;
      }

      // Get the API server URL properly
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001';
      const apiUrl = new URL(apiBaseUrl);
      const serverBase = `${apiUrl.protocol}//${apiUrl.host}`;

      // Build absolute URL for static files
      let absoluteUrl;
      
      if (doc.url.startsWith('http')) {
        // Already absolute URL
        absoluteUrl = doc.url;
      } else if (doc.url.startsWith('/uploads/')) {
        // It's a local file path - use server base + path
        absoluteUrl = serverBase + doc.url;
      } else if (doc.url.startsWith('/api/uploads/')) {
        // Remove the /api prefix
        const cleanPath = doc.url.replace('/api/uploads/', '/uploads/');
        absoluteUrl = serverBase + cleanPath;
      } else {
        // Try to use it as-is
        absoluteUrl = serverBase + doc.url;
      }

      console.log('📥 Downloading document from:', absoluteUrl);

      // Fetch the file as a blob
      const fileResponse = await fetch(absoluteUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.statusText} (${fileResponse.status})`);
      }

      const blob = await fileResponse.blob();

      // Verify we got a valid file
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      // Create blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      message.success(`Downloaded ${doc.name}`);
    } catch (error) {
      console.error('Download error:', error);
      message.error(`Failed to download document: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" tip="Loading payment details..." />
      </div>
    );
  }

  if (!payment) {
    return (
      <Card>
        <Alert
          message="Payment Not Found"
          description="The requested salary payment could not be found."
          type="error"
          showIcon
          action={
            <Button onClick={() => navigate('/finance/salary-payments')}>
              Back to List
            </Button>
          }
        />
      </Card>
    );
  }

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (text) => (
        <Space>
          <BankOutlined />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Budget Code',
      dataIndex: 'budgetCode',
      key: 'budgetCode',
      render: (budgetCode) => budgetCode ? (
        <div>
          <Text strong>{budgetCode.code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {budgetCode.name}
          </Text>
        </div>
      ) : (
        <Text type="secondary">N/A</Text>
      )
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
          {amount.toLocaleString()}
        </Text>
      ),
      align: 'right'
    },
    {
      title: 'Budget Status',
      key: 'budgetStatus',
      render: (_, record) => {
        if (!record.budgetCode) return null;
        
        const utilization = Math.round(
          (record.budgetCode.used / record.budgetCode.budget) * 100
        );
        
        return (
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Used: XAF {record.budgetCode.used.toLocaleString()} / {record.budgetCode.budget.toLocaleString()}
            </Text>
            <br />
            <Tag color={utilization >= 90 ? 'red' : utilization >= 75 ? 'orange' : 'green'}>
              {utilization}% Utilized
            </Tag>
          </div>
        );
      }
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      render: (notes) => notes || <Text type="secondary">-</Text>
    }
  ];

  // ✅ Construct base URL for documents
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Space style={{ justifyContent: 'space-between', width: '100%', display: 'flex' }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/finance/salary-payments')}
            >
              Back to List
            </Button>
            <Title level={3} style={{ margin: 0 }}>
              Salary Payment Details
            </Title>
          </Space>
          <Space>
            <Button icon={<PrinterOutlined />} onClick={handlePrint}>
              Print
            </Button>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={() => message.info('Export feature coming soon')}
            >
              Export PDF
            </Button>
          </Space>
        </Space>
      </Card>

      {/* Status Banner */}
      <Alert
        message={
          <Space>
            <CheckCircleOutlined />
            <Text strong>Payment Processed Successfully</Text>
          </Space>
        }
        description={`Processed on ${moment(payment.processedAt).format('MMMM DD, YYYY [at] HH:mm A')}`}
        type="success"
        showIcon={false}
        style={{ marginBottom: '24px' }}
      />

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Amount"
              value={payment.totalAmount}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#1890ff', fontSize: '24px' }}
              formatter={(value) => `XAF ${value.toLocaleString()}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Departments Paid"
              value={payment.departmentPayments?.length || 0}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Payment Period"
              value={`${moment().month(payment.paymentPeriod.month - 1).format('MMMM')} ${payment.paymentPeriod.year}`}
              prefix={<CalendarOutlined />}
              valueStyle={{ fontSize: '20px' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Payment Information */}
      <Card title="Payment Information" style={{ marginBottom: '24px' }}>
        <Descriptions bordered column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Payment ID">
            <Text code>{payment._id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color="green" icon={<CheckCircleOutlined />}>
              {payment.status.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Payment Month">
            {moment().month(payment.paymentPeriod.month - 1).format('MMMM')}
          </Descriptions.Item>
          <Descriptions.Item label="Payment Year">
            {payment.paymentPeriod.year}
          </Descriptions.Item>
          <Descriptions.Item label="Submitted By">
            <Space>
              <UserOutlined />
              {payment.submittedBy?.fullName || payment.submittedBy?.email}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Processed Date">
            {moment(payment.processedAt).format('MMMM DD, YYYY HH:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="Total Amount" span={2}>
            <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
              XAF {payment.totalAmount.toLocaleString()}
            </Text>
          </Descriptions.Item>
          {payment.description && (
            <Descriptions.Item label="Description" span={2}>
              {payment.description}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* Department Payments Breakdown */}
      <Card 
        title={
          <Space>
            <BankOutlined />
            <Text strong>Department Payments Breakdown</Text>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Table
          dataSource={payment.departmentPayments}
          columns={departmentColumns}
          rowKey={(record, index) => index}
          pagination={false}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={2}>
                <Text strong style={{ fontSize: '16px' }}>Total Amount:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                  XAF {payment.totalAmount.toLocaleString()}
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={3} colSpan={2} />
            </Table.Summary.Row>
          )}
        />
      </Card>

      {/* Supporting Documents */}
      {payment.supportingDocuments && payment.supportingDocuments.length > 0 && (
        <Card 
          title={
            <Space>
              <FolderOpenOutlined />
              <Text strong>Supporting Documents ({payment.supportingDocuments.length})</Text>
            </Space>
          }
        >
          <List
            dataSource={payment.supportingDocuments}
            renderItem={(doc, index) => {
              const documentUrl = doc.url.startsWith('http') 
                ? doc.url 
                : `${baseURL}${doc.url}`;

              return (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => window.open(documentUrl, '_blank')}
                    >
                      View
                    </Button>,
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      onClick={() => handleDownloadDocument(doc)}
                    >
                      Download
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<FileTextOutlined />} 
                        style={{ 
                          backgroundColor: doc.mimetype?.includes('pdf') ? '#ff4d4f' : '#1890ff' 
                        }} 
                      />
                    }
                    title={
                      <Space>
                        <Text strong>{doc.name}</Text>
                        {doc.mimetype?.includes('pdf') && <Tag color="red">PDF</Tag>}
                        {doc.mimetype?.includes('image') && <Tag color="blue">Image</Tag>}
                      </Space>
                    }
                    description={
                      <Space split={<Divider type="vertical" />}>
                        <Text type="secondary">
                          {(doc.size / 1024).toFixed(2)} KB
                        </Text>
                        <Text type="secondary">
                          {doc.mimetype}
                        </Text>
                        <Text type="secondary">
                          Uploaded: {moment(doc.uploadedAt).format('MMM DD, YYYY HH:mm')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </Card>
      )}

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          .ant-card-extra,
          .ant-btn,
          .ant-breadcrumb {
            display: none !important;
          }
          
          .ant-card {
            box-shadow: none !important;
            border: 1px solid #d9d9d9 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SalaryPaymentDetails;