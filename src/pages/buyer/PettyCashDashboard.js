import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Badge,
  Modal,
  Descriptions,
  Timeline,
  message,
  Spin,
  Alert,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  FileTextOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { pettyCashAPI } from '../../services/pettyCashAPI';

const { Title, Text } = Typography;

const PettyCashDashboard = () => {
  const [pettyCashForms, setPettyCashForms] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedForm, setSelectedForm] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Load petty cash forms on mount
  useEffect(() => {
    loadPettyCashForms();
    loadStats();
  }, []);

  const loadPettyCashForms = async () => {
    try {
      setLoading(true);
      const response = await pettyCashAPI.getBuyerPettyCashForms();
      
      if (response.success) {
        setPettyCashForms(response.data || []);
      } else {
        message.error(response.message || 'Failed to load petty cash forms');
      }
    } catch (error) {
      console.error('Error loading petty cash forms:', error);
      message.error('Error loading petty cash forms');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await pettyCashAPI.getBuyerPettyCashStats();
      
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleViewDetails = async (form) => {
    try {
      setLoading(true);
      const response = await pettyCashAPI.getPettyCashFormDetails(form.id);
      
      if (response.success) {
        setSelectedForm(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('Failed to load form details');
      }
    } catch (error) {
      console.error('Error loading form details:', error);
      message.error('Error loading form details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (form) => {
    try {
      setDownloading(true);
      message.loading({ content: 'Generating PDF...', key: 'download' });
      
      const blob = await pettyCashAPI.downloadPettyCashFormPDF(form.id);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Petty_Cash_Form_${form.pettyCashFormNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.success({ content: 'PDF downloaded successfully', key: 'download' });
      
      // Reload forms to update download count
      await loadPettyCashForms();
      await loadStats();
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error({ content: 'Failed to download PDF', key: 'download' });
    } finally {
      setDownloading(false);
    }
  };

  const columns = [
    {
      title: 'Form Number',
      dataIndex: 'pettyCashFormNumber',
      key: 'pettyCashFormNumber',
      render: (text) => <Text code strong>{text}</Text>,
      width: 150
    },
    {
      title: 'Requisition',
      key: 'requisition',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.requisitionNumber}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text>{record.employee.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee.department}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Amount',
      dataIndex: 'amountRequested',
      key: 'amountRequested',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {amount?.toLocaleString()}
        </Text>
      ),
      width: 120,
      align: 'right'
    },
    {
      title: 'Generated',
      dataIndex: 'generatedDate',
      key: 'generatedDate',
      render: (date) => (
        <div>
          <ClockCircleOutlined /> {moment(date).format('MMM DD, YYYY')}
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(date).fromNow()}
          </Text>
        </div>
      ),
      width: 130
    },
    {
      title: 'Downloads',
      dataIndex: 'downloadedCount',
      key: 'downloadedCount',
      render: (count, record) => (
        <div>
          <Badge count={count} style={{ backgroundColor: '#52c41a' }} />
          {record.lastDownloadDate && (
            <div style={{ marginTop: '4px' }}>
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Last: {moment(record.lastDownloadDate).format('MMM DD, HH:mm')}
              </Text>
            </div>
          )}
        </div>
      ),
      width: 100,
      align: 'center'
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => {
        const colorMap = {
          'High': 'red',
          'Medium': 'orange',
          'Low': 'green'
        };
        return <Tag color={colorMap[urgency]}>{urgency}</Tag>;
      },
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'pending_download': { color: 'orange', text: 'Pending Download', icon: <ClockCircleOutlined /> },
          'downloaded': { color: 'blue', text: 'Downloaded', icon: <CheckCircleOutlined /> },
          'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
        };
        const statusInfo = statusMap[status] || statusMap['pending_download'];
        return (
          <Tag color={statusInfo.color} icon={statusInfo.icon}>
            {statusInfo.text}
          </Tag>
        );
      },
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPDF(record)}
            loading={downloading}
          >
            Download
          </Button>
        </Space>
      ),
      width: 150,
      fixed: 'right'
    }
  ];

  const renderStats = () => {
    if (!stats) return null;

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Statistic
            title="Total Forms"
            value={stats.total}
            prefix={<FileTextOutlined />}
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Pending Download"
            value={stats.pendingDownload}
            prefix={<ClockCircleOutlined />}
            valueStyle={{ color: '#faad14' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Downloaded"
            value={stats.downloaded}
            prefix={<CheckCircleOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="Total Amount"
            value={stats.totalAmount}
            prefix="XAF"
            formatter={(value) => value.toLocaleString()}
            valueStyle={{ color: '#722ed1' }}
          />
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2} style={{ marginBottom: '24px' }}>
          <FileTextOutlined /> Petty Cash Forms
        </Title>

        {stats && stats.pendingDownload > 0 && (
          <Alert
            message={`${stats.pendingDownload} Petty Cash Form${stats.pendingDownload !== 1 ? 's' : ''} Awaiting Download`}
            description="Please download and review the pending petty cash forms. These forms are ready for processing."
            type="warning"
            showIcon
            closable
            style={{ marginBottom: '24px' }}
            action={
              <Button size="small" type="primary" onClick={loadPettyCashForms}>
                Refresh
              </Button>
            }
          />
        )}

        {renderStats()}

        <Table
          columns={columns}
          dataSource={pettyCashForms}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} forms`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Petty Cash Form Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedForm(null);
        }}
        width={900}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              if (selectedForm) {
                handleDownloadPDF({
                  id: selectedForm.requisition.id,
                  pettyCashFormNumber: selectedForm.pettyCashForm.formNumber
                });
              }
            }}
            loading={downloading}
          >
            Download PDF
          </Button>
        ]}
      >
        {selectedForm && (
          <div>
            <Card size="small" title="Form Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Form Number">
                  <Text code strong>{selectedForm.pettyCashForm.formNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Generated Date">
                  {moment(selectedForm.pettyCashForm.generatedDate).format('MMM DD, YYYY HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="green">{selectedForm.pettyCashForm.status.replace(/_/g, ' ').toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Downloaded">
                  {selectedForm.pettyCashForm.downloadedCount} time(s)
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Requisition Details" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requisition Number">
                  {selectedForm.requisition.requisitionNumber}
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  {selectedForm.requisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag>{selectedForm.requisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  <Tag color={
                    selectedForm.requisition.urgency === 'High' ? 'red' :
                    selectedForm.requisition.urgency === 'Medium' ? 'orange' : 'green'
                  }>
                    {selectedForm.requisition.urgency}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color: '#1890ff' }}>
                    XAF {selectedForm.requisition.budgetXAF?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Delivery Location">
                  {selectedForm.requisition.deliveryLocation}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Employee Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Name">
                  {selectedForm.employee.name}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {selectedForm.employee.email}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedForm.employee.department}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {selectedForm.employee.phone || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title="Items" style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description'
                  },
                  {
                    title: 'Quantity',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    align: 'center',
                    width: 100
                  },
                  {
                    title: 'Unit',
                    dataIndex: 'measuringUnit',
                    key: 'measuringUnit',
                    align: 'center',
                    width: 100
                  },
                  {
                    title: 'Est. Price',
                    dataIndex: 'estimatedPrice',
                    key: 'estimatedPrice',
                    align: 'right',
                    width: 120,
                    render: (price) => price ? `XAF ${price.toLocaleString()}` : 'TBD'
                  }
                ]}
                dataSource={selectedForm.requisition.items}
                pagination={false}
                size="small"
              />
            </Card>

            <Card size="small" title="Approval History" style={{ marginBottom: '16px' }}>
              <Timeline>
                {selectedForm.approvalChain.map((step, index) => (
                  <Timeline.Item
                    key={index}
                    color={
                      step.status === 'approved' ? 'green' :
                      step.status === 'rejected' ? 'red' : 'gray'
                    }
                  >
                    <div>
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      <br />
                      <Text type="secondary">{step.approver.role}</Text>
                      <br />
                      <Tag color={
                        step.status === 'approved' ? 'green' :
                        step.status === 'rejected' ? 'red' : 'orange'
                      }>
                        {step.status.toUpperCase()}
                      </Tag>
                      {step.actionDate && (
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          {moment(step.actionDate).format('MMM DD, YYYY')} {step.actionTime}
                        </Text>
                      )}
                      {step.comments && (
                        <div style={{ marginTop: '4px' }}>
                          <Text style={{ fontSize: '12px' }}>{step.comments}</Text>
                        </div>
                      )}
                    </div>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            {selectedForm.pettyCashForm.downloadHistory?.length > 0 && (
              <Card size="small" title="Download History">
                <Timeline>
                  {selectedForm.pettyCashForm.downloadHistory.map((download, index) => (
                    <Timeline.Item key={index} color="blue">
                      <div>
                        <Text>Downloaded by you</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {moment(download.downloadDate).format('MMM DD, YYYY HH:mm:ss')}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          IP: {download.ipAddress}
                        </Text>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PettyCashDashboard;