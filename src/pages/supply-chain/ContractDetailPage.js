import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Tag,
  Button,
  Space,
  Row,
  Col,
  Statistic,
  Timeline,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Upload,
  message,
  Spin,
  Progress,
  Tabs,
  List,
  Avatar,
  Divider
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  ReloadOutlined,
  AuditOutlined,
  CalendarOutlined,
  DownloadOutlined,
  LinkOutlined,
  UnlinkOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
  InboxOutlined
} from '@ant-design/icons';
import moment from 'moment';
import unifiedSupplierAPI from '../../services/unifiedSupplierAPI';

const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const ContractDetailPage = () => {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contract, setContract] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modal states
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);
  const [amendmentModalVisible, setAmendmentModalVisible] = useState(false);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const [linkInvoiceModalVisible, setLinkInvoiceModalVisible] = useState(false);
  
  // Forms
  const [renewalForm] = Form.useForm();
  const [amendmentForm] = Form.useForm();
  const [milestoneForm] = Form.useForm();
  const [linkInvoiceForm] = Form.useForm();
  
  const [uploadedDocuments, setUploadedDocuments] = useState([]);

  useEffect(() => {
    fetchContractDetails();
  }, [contractId]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await unifiedSupplierAPI.getContractWithInvoices(contractId);
      if (response.success) {
        setContract(response.data);
      }
    } catch (error) {
      message.error('Failed to load contract details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenewContract = async (values) => {
    try {
      setActionLoading(true);
      const renewalData = {
        ...values,
        newEndDate: values.newEndDate.format('YYYY-MM-DD')
      };
      
      await unifiedSupplierAPI.renewContract(contractId, renewalData);
      message.success('Contract renewed successfully');
      setRenewalModalVisible(false);
      renewalForm.resetFields();
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to renew contract');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateAmendment = async (values) => {
    try {
      setActionLoading(true);
      const amendmentData = {
        ...values,
        effectiveDate: values.effectiveDate.format('YYYY-MM-DD')
      };
      
      await unifiedSupplierAPI.createAmendment(contractId, amendmentData, uploadedDocuments);
      message.success('Amendment created successfully');
      setAmendmentModalVisible(false);
      amendmentForm.resetFields();
      setUploadedDocuments([]);
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to create amendment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddMilestone = async (values) => {
    try {
      setActionLoading(true);
      const milestoneData = {
        ...values,
        dueDate: values.dueDate.format('YYYY-MM-DD')
      };
      
      await unifiedSupplierAPI.addMilestone(contractId, milestoneData);
      message.success('Milestone added successfully');
      setMilestoneModalVisible(false);
      milestoneForm.resetFields();
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to add milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkInvoice = async (values) => {
    try {
      setActionLoading(true);
      await unifiedSupplierAPI.linkInvoiceToContract(contractId, values.invoiceId);
      message.success('Invoice linked to contract successfully');
      setLinkInvoiceModalVisible(false);
      linkInvoiceForm.resetFields();
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to link invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlinkInvoice = async (invoiceId) => {
    try {
      setActionLoading(true);
      await unifiedSupplierAPI.unlinkInvoiceFromContract(contractId, invoiceId);
      message.success('Invoice unlinked successfully');
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to unlink invoice');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus, reason = '') => {
    try {
      setActionLoading(true);
      await unifiedSupplierAPI.updateContractStatus(contractId, {
        status: newStatus,
        reason
      });
      message.success(`Contract status updated to ${newStatus}`);
      await fetchContractDetails();
    } catch (error) {
      message.error(error.message || 'Failed to update status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', icon: <EditOutlined /> },
      pending_approval: { color: 'orange', icon: <ClockCircleOutlined /> },
      active: { color: 'green', icon: <CheckCircleOutlined /> },
      expiring_soon: { color: 'gold', icon: <ClockCircleOutlined /> },
      expired: { color: 'red', icon: <ClockCircleOutlined /> },
      terminated: { color: 'red', icon: <ClockCircleOutlined /> },
      renewed: { color: 'purple', icon: <CheckCircleOutlined /> },
      suspended: { color: 'orange', icon: <ClockCircleOutlined /> }
    };
    
    const config = statusMap[status] || { color: 'default' };
    return (
      <Tag color={config.color} icon={config.icon}>
        {unifiedSupplierAPI.getContractStatusLabel(status)}
      </Tag>
    );
  };

  const invoiceColumns = [
    {
      title: 'Invoice Number',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <span>
          {unifiedSupplierAPI.formatCurrency(
            record.invoiceAmount || 0,
            record.currency || 'XAF'
          )}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'approvalStatus',
      key: 'approvalStatus',
      render: (status) => {
        const colors = {
          pending_finance_assignment: 'orange',
          pending_department_approval: 'blue',
          approved: 'green',
          paid: 'purple',
          rejected: 'red'
        };
        return <Tag color={colors[status]}>{status?.replace(/_/g, ' ').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Date',
      dataIndex: 'uploadedDate',
      key: 'uploadedDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/invoices/${record._id}`)}
          >
            View
          </Button>
          <Button
            size="small"
            danger
            icon={<UnlinkOutlined />}
            onClick={() => {
              Modal.confirm({
                title: 'Unlink Invoice',
                content: 'Are you sure you want to unlink this invoice from the contract?',
                onOk: () => handleUnlinkInvoice(record._id)
              });
            }}
          >
            Unlink
          </Button>
        </Space>
      )
    }
  ];

  const milestoneColumns = [
    {
      title: 'Milestone',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          pending: 'default',
          in_progress: 'blue',
          completed: 'green',
          overdue: 'red'
        };
        return <Tag color={colors[status]}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Responsible',
      dataIndex: 'responsibleParty',
      key: 'responsibleParty'
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!contract) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <h3>Contract not found</h3>
          <Button type="primary" onClick={() => navigate('/supply-chain/contracts')}>
            Back to Contracts
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/supply-chain/contracts')}
              >
                Back
              </Button>
              <div>
                <h2 style={{ margin: 0 }}>{contract.title}</h2>
                <Space>
                  <span style={{ fontFamily: 'monospace', color: '#666' }}>
                    {contract.contractNumber}
                  </span>
                  {getStatusTag(contract.status)}
                  <Tag color="blue">{contract.type}</Tag>
                  <Tag color="purple">{contract.category}</Tag>
                </Space>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/supply-chain/contracts/${contractId}/edit`)}
              >
                Edit
              </Button>
              {contract.renewal?.isRenewable && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => setRenewalModalVisible(true)}
                >
                  Renew
                </Button>
              )}
              <Button
                icon={<AuditOutlined />}
                onClick={() => setAmendmentModalVisible(true)}
              >
                Amendment
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  // Download contract logic
                  message.info('Download functionality to be implemented');
                }}
              >
                Download
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Contract Value"
              value={contract.financials?.totalValue || 0}
              prefix={<DollarOutlined />}
              suffix={contract.financials?.currency || 'XAF'}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Invoiced Amount"
              value={contract.invoiceTotal || 0}
              suffix={contract.financials?.currency || 'XAF'}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Remaining Value"
              value={contract.remainingValue || 0}
              suffix={contract.financials?.currency || 'XAF'}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Utilization"
              value={contract.utilizationPercentage || 0}
              suffix="%"
              valueStyle={{ 
                color: (contract.utilizationPercentage || 0) > 80 ? '#faad14' : '#52c41a' 
              }}
            />
            <Progress 
              percent={contract.utilizationPercentage || 0}
              showInfo={false}
              strokeColor={(contract.utilizationPercentage || 0) > 80 ? '#faad14' : '#1890ff'}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content Tabs */}
      <Card>
        <Tabs defaultActiveKey="overview">
          {/* Overview Tab */}
          <TabPane tab={<span><FileTextOutlined />Overview</span>} key="overview">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="Contract Information" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Contract Number">
                      <span style={{ fontFamily: 'monospace' }}>{contract.contractNumber}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Title">
                      {contract.title}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color="blue">{contract.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Category">
                      <Tag color="purple">{contract.category}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(contract.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Priority">
                      <Tag color={
                        contract.priority === 'Critical' ? 'red' :
                        contract.priority === 'High' ? 'orange' :
                        contract.priority === 'Medium' ? 'blue' : 'green'
                      }>
                        {contract.priority}
                      </Tag>
                      </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Financial Details" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Total Value">
                      {unifiedSupplierAPI.formatCurrency(
                        contract.financials?.totalValue || 0,
                        contract.financials?.currency || 'XAF'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">
                      {contract.financials?.paymentTerms || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Terms">
                      {contract.financials?.deliveryTerms || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Invoiced Amount">
                      {unifiedSupplierAPI.formatCurrency(
                        contract.invoiceTotal || 0,
                        contract.financials?.currency || 'XAF'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Remaining Value">
                      {unifiedSupplierAPI.formatCurrency(
                        contract.remainingValue || 0,
                        contract.financials?.currency || 'XAF'
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Utilization">
                      <Progress 
                        percent={contract.utilizationPercentage || 0}
                        size="small"
                        strokeColor={(contract.utilizationPercentage || 0) > 80 ? '#faad14' : '#1890ff'}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Description">
                  <p>{contract.description || 'No description provided'}</p>
                </Card>
              </Col>

              <Col span={12}>
                <Card size="small" title="Supplier Information" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Supplier">
                      <Space>
                        <TeamOutlined />
                        <span style={{ fontWeight: 'bold' }}>
                          {contract.supplier?.supplierName || 'N/A'}
                        </span>
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Contact Person">
                      {contract.supplier?.contactPerson || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      {contract.supplier?.contactEmail || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      {contract.supplier?.contactPhone || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Actions">
                      <Button
                        size="small"
                        type="link"
                        onClick={() => navigate(`/supply-chain/suppliers/${contract.supplier?.supplierId}/profile`)}
                      >
                        View Supplier Profile
                      </Button>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Contract Period" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Start Date">
                      <CalendarOutlined /> {moment(contract.dates?.startDate).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                      <CalendarOutlined /> {moment(contract.dates?.endDate).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Days Remaining">
                      {unifiedSupplierAPI.calculateDaysUntilExpiry(contract.dates?.endDate)} days
                    </Descriptions.Item>
                    <Descriptions.Item label="Signed Date">
                      {contract.dates?.signedDate 
                        ? moment(contract.dates.signedDate).format('DD/MM/YYYY')
                        : 'Not signed yet'
                      }
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card size="small" title="Management" style={{ marginBottom: '16px' }}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Contract Manager">
                      {contract.management?.contractManager?.fullName || 'Not assigned'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Department">
                      {contract.management?.department || 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Review Cycle">
                      {contract.management?.reviewCycle || 'N/A'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                {contract.renewal?.isRenewable && (
                  <Card size="small" title="Renewal Information">
                    <Descriptions column={1} size="small">
                      <Descriptions.Item label="Renewable">
                        <Tag color="green">Yes</Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Auto Renewal">
                        <Tag color={contract.renewal?.autoRenewal ? 'blue' : 'default'}>
                          {contract.renewal?.autoRenewal ? 'Enabled' : 'Disabled'}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label="Notice Period">
                        {contract.renewal?.renewalNoticePeriod || 'N/A'} days
                      </Descriptions.Item>
                      <Descriptions.Item label="Renewal History">
                        {contract.renewal?.renewalHistory?.length || 0} renewals
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}
              </Col>
            </Row>
          </TabPane>

          {/* Linked Invoices Tab */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Linked Invoices ({contract.linkedInvoices?.length || 0})
              </span>
            } 
            key="invoices"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={() => setLinkInvoiceModalVisible(true)}
              >
                Link Invoice
              </Button>
            </div>

            {contract.linkedInvoices && contract.linkedInvoices.length > 0 ? (
              <Table
                columns={invoiceColumns}
                dataSource={contract.linkedInvoices}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <h3>No Linked Invoices</h3>
                  <p>Link invoices to track spending against this contract</p>
                  <Button
                    type="primary"
                    icon={<LinkOutlined />}
                    onClick={() => setLinkInvoiceModalVisible(true)}
                  >
                    Link Invoice
                  </Button>
                </div>
              </Card>
            )}
          </TabPane>

          {/* Milestones Tab */}
          <TabPane 
            tab={
              <span>
                <CalendarOutlined />
                Milestones ({contract.milestones?.length || 0})
              </span>
            } 
            key="milestones"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<CalendarOutlined />}
                onClick={() => setMilestoneModalVisible(true)}
              >
                Add Milestone
              </Button>
            </div>

            {contract.milestones && contract.milestones.length > 0 ? (
              <Table
                columns={milestoneColumns}
                dataSource={contract.milestones}
                rowKey="_id"
                pagination={{ pageSize: 10 }}
                expandable={{
                  expandedRowRender: (record) => (
                    <div style={{ padding: '16px', backgroundColor: '#fafafa' }}>
                      <p><strong>Description:</strong> {record.description || 'No description'}</p>
                      {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
                      {record.completionDate && (
                        <p><strong>Completed On:</strong> {moment(record.completionDate).format('DD/MM/YYYY')}</p>
                      )}
                    </div>
                  ),
                }}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <CalendarOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <h3>No Milestones</h3>
                  <p>Add milestones to track contract deliverables</p>
                  <Button
                    type="primary"
                    icon={<CalendarOutlined />}
                    onClick={() => setMilestoneModalVisible(true)}
                  >
                    Add Milestone
                  </Button>
                </div>
              </Card>
            )}
          </TabPane>

          {/* Amendments Tab */}
          <TabPane 
            tab={
              <span>
                <AuditOutlined />
                Amendments ({contract.amendments?.length || 0})
              </span>
            } 
            key="amendments"
          >
            <div style={{ marginBottom: '16px' }}>
              <Button
                type="primary"
                icon={<AuditOutlined />}
                onClick={() => setAmendmentModalVisible(true)}
              >
                Create Amendment
              </Button>
            </div>

            {contract.amendments && contract.amendments.length > 0 ? (
              <List
                dataSource={contract.amendments}
                renderItem={(amendment) => (
                  <List.Item key={amendment._id}>
                    <List.Item.Meta
                      avatar={<Avatar icon={<AuditOutlined />} />}
                      title={
                        <Space>
                          <span>{amendment.type}</span>
                          <Tag color={
                            amendment.status === 'approved' ? 'green' :
                            amendment.status === 'rejected' ? 'red' :
                            amendment.status === 'pending_approval' ? 'orange' : 'default'
                          }>
                            {amendment.status?.replace('_', ' ').toUpperCase()}
                          </Tag>
                        </Space>
                      }
                      description={
                        <div>
                          <p>{amendment.description}</p>
                          <Space>
                            <span>Effective: {moment(amendment.effectiveDate).format('DD/MM/YYYY')}</span>
                            {amendment.financialImpact && (
                              <Tag color={
                                amendment.financialImpact.type === 'increase' ? 'red' :
                                amendment.financialImpact.type === 'decrease' ? 'green' : 'blue'
                              }>
                                {amendment.financialImpact.type === 'increase' ? '+' : 
                                 amendment.financialImpact.type === 'decrease' ? '-' : ''}
                                {unifiedSupplierAPI.formatCurrency(
                                  amendment.financialImpact.amount || 0,
                                  contract.financials?.currency || 'XAF'
                                )}
                              </Tag>
                            )}
                          </Space>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <AuditOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <h3>No Amendments</h3>
                  <p>Create amendments to modify contract terms</p>
                  <Button
                    type="primary"
                    icon={<AuditOutlined />}
                    onClick={() => setAmendmentModalVisible(true)}
                  >
                    Create Amendment
                  </Button>
                </div>
              </Card>
            )}
          </TabPane>

          {/* Documents Tab */}
          <TabPane 
            tab={
              <span>
                <FileTextOutlined />
                Documents ({contract.documents?.length || 0})
              </span>
            } 
            key="documents"
          >
            {contract.documents && contract.documents.length > 0 ? (
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={contract.documents}
                renderItem={(doc) => (
                  <List.Item>
                    <Card
                      size="small"
                      actions={[
                        <Button 
                          type="link" 
                          icon={<DownloadOutlined />}
                          onClick={() => {
                            window.open(doc.url, '_blank');
                          }}
                        >
                          Download
                        </Button>
                      ]}
                    >
                      <Card.Meta
                        avatar={<Avatar icon={<FileTextOutlined />} />}
                        title={doc.name}
                        description={
                          <div>
                            <div>Type: {doc.type}</div>
                            <div>Size: {(doc.size / 1024).toFixed(2)} KB</div>
                            <div>Uploaded: {moment(doc.uploadedAt).format('DD/MM/YYYY')}</div>
                          </div>
                        }
                      />
                    </Card>
                  </List.Item>
                )}
              />
            ) : (
              <Card>
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <FileTextOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                  <h3>No Documents</h3>
                  <p>Contract documents will appear here</p>
                </div>
              </Card>
            )}
          </TabPane>

          {/* History Tab */}
          <TabPane tab={<span><ClockCircleOutlined />History</span>} key="history">
            <Timeline>
              <Timeline.Item color="green">
                <strong>Contract Created</strong>
                <br />
                {moment(contract.createdAt).format('DD/MM/YYYY HH:mm')}
                <br />
                By: {contract.createdBy?.fullName || 'System'}
              </Timeline.Item>

              {contract.dates?.signedDate && (
                <Timeline.Item color="blue">
                  <strong>Contract Signed</strong>
                  <br />
                  {moment(contract.dates.signedDate).format('DD/MM/YYYY')}
                </Timeline.Item>
              )}

              {contract.amendments?.map((amendment, index) => (
                <Timeline.Item color="orange" key={`amendment-${index}`}>
                  <strong>Amendment: {amendment.type}</strong>
                  <br />
                  {moment(amendment.createdAt).format('DD/MM/YYYY HH:mm')}
                  <br />
                  {amendment.description}
                </Timeline.Item>
              ))}

              {contract.renewal?.renewalHistory?.map((renewal, index) => (
                <Timeline.Item color="purple" key={`renewal-${index}`}>
                  <strong>Contract Renewed</strong>
                  <br />
                  {moment(renewal.renewalDate).format('DD/MM/YYYY')}
                  <br />
                  Extended from {moment(renewal.previousEndDate).format('DD/MM/YYYY')} 
                  to {moment(renewal.newEndDate).format('DD/MM/YYYY')}
                </Timeline.Item>
              ))}

              <Timeline.Item>
                <strong>Last Updated</strong>
                <br />
                {moment(contract.updatedAt).format('DD/MM/YYYY HH:mm')}
              </Timeline.Item>
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>

      {/* Action Buttons at Bottom */}
      <Card style={{ marginTop: '24px' }}>
        <Space>
          {contract.status === 'active' && (
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: 'Terminate Contract',
                  content: 'Are you sure you want to terminate this contract?',
                  onOk: () => handleUpdateStatus('terminated', 'Manual termination')
                });
              }}
            >
              Terminate Contract
            </Button>
          )}

          {contract.status === 'active' && (
            <Button
              onClick={() => {
                Modal.confirm({
                  title: 'Suspend Contract',
                  content: 'Are you sure you want to suspend this contract?',
                  onOk: () => handleUpdateStatus('suspended', 'Manual suspension')
                });
              }}
            >
              Suspend Contract
            </Button>
          )}

          {contract.status === 'suspended' && (
            <Button
              type="primary"
              onClick={() => handleUpdateStatus('active', 'Contract reactivated')}
            >
              Reactivate Contract
            </Button>
          )}
        </Space>
      </Card>

      {/* Renewal Modal */}
      <Modal
        title="Renew Contract"
        open={renewalModalVisible}
        onCancel={() => {
          setRenewalModalVisible(false);
          renewalForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={actionLoading}>
          <Form
            form={renewalForm}
            layout="vertical"
            onFinish={handleRenewContract}
            initialValues={{
              renewalType: 'standard',
              newEndDate: moment(contract.dates?.endDate).add(1, 'year')
            }}
          >
            <Form.Item
              name="renewalType"
              label="Renewal Type"
              rules={[{ required: true, message: 'Please select renewal type' }]}
            >
              <Select>
                <Option value="standard">Standard Renewal</Option>
                <Option value="modified">Modified Terms</Option>
                <Option value="extension">Simple Extension</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="newEndDate"
              label="New End Date"
              rules={[{ required: true, message: 'Please select new end date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="notes" label="Renewal Notes">
              <TextArea rows={3} placeholder="Notes about the renewal..." />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setRenewalModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Renew Contract
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Amendment Modal */}
      <Modal
        title="Create Amendment"
        open={amendmentModalVisible}
        onCancel={() => {
          setAmendmentModalVisible(false);
          amendmentForm.resetFields();
          setUploadedDocuments([]);
        }}
        footer={null}
        width={700}
      >
        <Spin spinning={actionLoading}>
          <Form
            form={amendmentForm}
            layout="vertical"
            onFinish={handleCreateAmendment}
          >
            <Form.Item
              name="type"
              label="Amendment Type"
              rules={[{ required: true, message: 'Please select amendment type' }]}
            >
              <Select>
                <Option value="Price Adjustment">Price Adjustment</Option>
                <Option value="Scope Change">Scope Change</Option>
                <Option value="Term Extension">Term Extension</Option>
                <Option value="Performance Modification">Performance Modification</Option>
                <Option value="Compliance Update">Compliance Update</Option>
                <Option value="General Amendment">General Amendment</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea rows={3} placeholder="Describe the amendment..." />
            </Form.Item>

            <Form.Item
              name="effectiveDate"
              label="Effective Date"
              rules={[{ required: true, message: 'Please select effective date' }]}
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['financialImpact', 'amount']} label="Financial Impact (XAF)">
                  <Input type="number" placeholder="0" min={0} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['financialImpact', 'type']} label="Impact Type">
                  <Select placeholder="Select type">
                    <Option value="increase">Increase</Option>
                    <Option value="decrease">Decrease</Option>
                    <Option value="neutral">No Change</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Amendment Documents">
              <Dragger
                multiple
                fileList={uploadedDocuments}
                onChange={({ fileList }) => setUploadedDocuments(fileList)}
                beforeUpload={() => false}
                accept=".pdf,.doc,.docx"
              >
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Click or drag files to upload</p>
                <p className="ant-upload-hint">Support for PDF, DOC, DOCX files</p>
              </Dragger>
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setAmendmentModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Create Amendment
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Milestone Modal */}
      <Modal
        title="Add Milestone"
        open={milestoneModalVisible}
        onCancel={() => {
          setMilestoneModalVisible(false);
          milestoneForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Spin spinning={actionLoading}>
          <Form
            form={milestoneForm}
            layout="vertical"
            onFinish={handleAddMilestone}
          >
            <Form.Item
              name="name"
              label="Milestone Name"
              rules={[{ required: true, message: 'Please enter milestone name' }]}
            >
              <Input placeholder="Contract Signing" />
            </Form.Item>

            <Form.Item name="description" label="Description">
              <TextArea rows={2} placeholder="Description of the milestone..." />
            </Form.Item>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="dueDate"
                  label="Due Date"
                  rules={[{ required: true, message: 'Please select due date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="responsibleParty"
                  label="Responsible Party"
                  rules={[{ required: true, message: 'Please select responsible party' }]}
                >
                  <Select>
                    <Option value="supplier">Supplier</Option>
                    <Option value="client">Client</Option>
                    <Option value="both">Both Parties</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes">
              <TextArea rows={2} placeholder="Additional notes..." />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setMilestoneModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Add Milestone
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Link Invoice Modal */}
      <Modal
        title="Link Invoice to Contract"
        open={linkInvoiceModalVisible}
        onCancel={() => {
          setLinkInvoiceModalVisible(false);
          linkInvoiceForm.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Spin spinning={actionLoading}>
          <Form
            form={linkInvoiceForm}
            layout="vertical"
            onFinish={handleLinkInvoice}
          >
            <Form.Item
              name="invoiceId"
              label="Invoice ID"
              rules={[{ required: true, message: 'Please enter invoice ID' }]}
            >
              <Input placeholder="Enter invoice ID or number" />
            </Form.Item>

            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setLinkInvoiceModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={actionLoading}>
                  Link Invoice
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default ContractDetailPage;