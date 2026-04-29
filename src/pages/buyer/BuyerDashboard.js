import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
  Modal, Form, Input, Select, DatePicker, InputNumber, Tabs, Badge,
  Drawer, message, Alert, Divider, Tooltip, Steps, Checkbox, Rate,
  Timeline
} from 'antd';
import {
  ShoppingCartOutlined, EyeOutlined, SendOutlined, UserOutlined,
  DollarOutlined, CalendarOutlined, FileTextOutlined, CheckCircleOutlined,
  ClockCircleOutlined, MailOutlined, SettingOutlined, TruckOutlined,
  FilterOutlined, ExportOutlined, GlobalOutlined,
  CopyOutlined, DownloadOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
import EnhancedSupplierSelection from '../../components/EnhancedSupplierSelection';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const BuyerRequisitionPortal = () => {
  const navigate = useNavigate();

  const [requisitions,             setRequisitions]             = useState([]);
  const [allRequisitions,          setAllRequisitions]          = useState([]);
  const [selectedRequisition,      setSelectedRequisition]      = useState(null);
  const [detailDrawerVisible,      setDetailDrawerVisible]      = useState(false);
  const [sourcingDrawerVisible,    setSourcingDrawerVisible]    = useState(false);
  const [supplierSelectionVisible, setSupplierSelectionVisible] = useState(false);
  const [loading,                  setLoading]                  = useState(false);
  const [statsLoading,             setStatsLoading]             = useState(false);
  const [suppliers,                setSuppliers]                = useState([]);
  const [selectedSuppliers,        setSelectedSuppliers]        = useState([]);
  const [sourcingForm]   = Form.useForm();
  const [activeTab,      setActiveTab]      = useState('pending');
  const [currentStep,    setCurrentStep]    = useState(0);

  // ── fetch helpers ────────────────────────────────────────────────────────

  /** Full dataset — only used for header stats, never displayed directly */
  const loadAllRequisitionsForStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const res = await buyerRequisitionAPI.getAssignedRequisitions({});
      if (res.success) setAllRequisitions(res.data || []);
    } catch (err) {
      console.error('Stats load error:', err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  /** Tab-specific data */
  const loadRequisitions = useCallback(async () => {
    try {
      setLoading(true);

      const statusFilter = {
        pending:     { sourcingStatus: 'pending_sourcing' },
        in_progress: { sourcingStatus: 'in_progress'     },
        quoted:      { sourcingStatus: 'quotes_received' },
        completed:   { sourcingStatus: 'completed'       },
        // "justified" = disbursed (partially or fully) + justification workflow
        justified:   { justified: true },
        all:         {}
      };

      const filters = statusFilter[activeTab] ?? {};
      const res = await buyerRequisitionAPI.getAssignedRequisitions(filters);

      if (res.success) {
        setRequisitions(res.data || []);
        if (activeTab === 'all') setAllRequisitions(res.data || []);
      } else {
        message.error(res.message || 'Failed to load requisitions');
      }
    } catch (err) {
      message.error(err.message || 'Error loading requisitions');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { loadAllRequisitionsForStats(); }, [loadAllRequisitionsForStats]);
  useEffect(() => { loadRequisitions();             }, [loadRequisitions]);

  const loadSuppliers = async (category) => {
    if (!category) { message.warning('No category specified'); return; }
    try {
      setLoading(true);
      const res = await buyerRequisitionAPI.getSuppliersByCategory(category);
      setSuppliers(res.success ? (res.data || []) : []);
      if (!res.success) message.error(res.message || 'Failed to load suppliers');
    } catch (err) {
      message.error(err.message || 'Error loading suppliers');
      setSuppliers([]);
    } finally { setLoading(false); }
  };

  // ── stats always from the full dataset ──────────────────────────────────
  const stats = {
    pending:    allRequisitions.filter(r => r.sourcingStatus === 'pending_sourcing').length,
    inProgress: allRequisitions.filter(r => r.sourcingStatus === 'in_progress').length,
    quoted:     allRequisitions.filter(r => r.sourcingStatus === 'quotes_received').length,
    completed:  allRequisitions.filter(r => r.sourcingStatus === 'completed').length,
    // covers partially_disbursed + fully_disbursed + entire justification workflow
    justified:  allRequisitions.filter(r => r.sourcingStatus === 'justified').length
  };

  // ── display helpers ──────────────────────────────────────────────────────

  const getStatusTag = (status) => {
    const map = {
      // Frontend sourcingStatus values
      pending_sourcing:                    { color: 'orange',   text: 'Pending Sourcing'            },
      in_progress:                         { color: 'blue',     text: 'Sourcing in Progress'        },
      quotes_received:                     { color: 'purple',   text: 'Quotes Received'             },
      completed:                           { color: 'green',    text: 'Completed'                   },
      justified:                           { color: 'gold',     text: 'Needs Justification'         },
      // Raw backend statuses visible in the "All" tab
      partially_disbursed:                 { color: 'cyan',     text: 'Partially Disbursed'         },
      fully_disbursed:                     { color: 'geekblue', text: 'Fully Disbursed'             },
      justification_pending_supervisor:    { color: 'gold',     text: 'Justification – Supervisor'  },
      justification_pending_finance:       { color: 'gold',     text: 'Justification – Finance'    },
      justification_pending_supply_chain:  { color: 'gold',     text: 'Justification – SC'         },
      justification_pending_head:          { color: 'gold',     text: 'Justification – Head'       },
      justification_rejected:              { color: 'red',      text: 'Justification Rejected'     },
      justification_approved:              { color: 'green',    text: 'Justification Approved'     }
    };
    const s = map[status] || { color: 'default', text: status };
    return <Tag color={s.color}>{s.text}</Tag>;
  };

  const getUrgencyTag = (urgency) => {
    const map = { Low: 'green', Medium: 'orange', High: 'red', Urgent: 'volcano' };
    return <Tag color={map[urgency] || 'default'}>{urgency}</Tag>;
  };

  // ── event handlers ───────────────────────────────────────────────────────

  const handleViewDetails = async (record) => {
    try {
      setLoading(true);
      const res = await buyerRequisitionAPI.getRequisitionDetails(record.id);
      if (res.success) { setSelectedRequisition(res.data); setDetailDrawerVisible(true); }
      else message.error(res.message || 'Failed to load details');
    } catch (err) { message.error(err.message || 'Error loading details'); }
    finally { setLoading(false); }
  };

  const handleStartSourcing = async (record) => {
    try {
      setSelectedRequisition(record);
      await loadSuppliers(record.category);
      setSelectedSuppliers([]);
      sourcingForm.resetFields();
      sourcingForm.setFieldsValue({
        expectedDeliveryDate: record.expectedDeliveryDate
          ? moment(record.expectedDeliveryDate) : moment().add(14, 'days'),
        quotationDeadline:    moment().add(5, 'days'),
        paymentTerms:         '30 days',
        deliveryLocation:     record.deliveryLocation || '',
        evaluationCriteria:   { quality: 40, cost: 35, delivery: 25 }
      });
      setCurrentStep(0);
      setSourcingDrawerVisible(true);
    } catch (err) { message.error('Failed to initialise sourcing process'); }
  };

  const handleSupplierToggle = (id, checked) =>
    setSelectedSuppliers(prev => checked ? [...prev, id] : prev.filter(x => x !== id));

  const validateSourcingForm = async () => {
    try {
      await sourcingForm.validateFields();
      const edd = sourcingForm.getFieldValue('expectedDeliveryDate');
      const qd  = sourcingForm.getFieldValue('quotationDeadline');
      if (!edd) throw new Error('Expected delivery date is required');
      if (!qd)  throw new Error('Quotation deadline is required');
      if (qd.isAfter(edd)) throw new Error('Quotation deadline must be before delivery date');
      const c = sourcingForm.getFieldValue('evaluationCriteria');
      if (c) {
        const total = (c.quality || 0) + (c.cost || 0) + (c.delivery || 0);
        if (total !== 100) throw new Error(`Criteria weights must total 100% (currently ${total}%)`);
      }
      return true;
    } catch (err) {
      message.error(err.errorFields ? err.errorFields[0].errors[0] : err.message);
      return false;
    }
  };

  const handleSupplierSelectionConfirm = async (supplierData) => {
    try {
      if (!(await validateSourcingForm())) return;
      setLoading(true);

      const fv = sourcingForm.getFieldsValue(true);
      const rfqData = {
        selectedSuppliers:      supplierData.selectedSuppliers      || [],
        externalSupplierEmails: supplierData.externalSupplierEmails || [],
        expectedDeliveryDate:   fv.expectedDeliveryDate?.toISOString() ?? null,
        quotationDeadline:      fv.quotationDeadline?.toISOString()    ?? null,
        paymentTerms:           fv.paymentTerms        || '30 days',
        deliveryLocation:       fv.deliveryLocation    || selectedRequisition.deliveryLocation,
        specialRequirements:    fv.specialRequirements || '',
        evaluationCriteria:     fv.evaluationCriteria  || { quality: 40, cost: 35, delivery: 25 }
      };

      const validation = buyerRequisitionAPI.validateRFQData(rfqData);
      if (!validation.isValid) { validation.errors.forEach(e => message.error(e)); setLoading(false); return; }
      validation.warnings.forEach(w => message.warning(w));

      Modal.confirm({
        title: 'Confirm RFQ Submission',
        content: (
          <div>
            <p>Sending RFQ to:</p>
            <ul>
              <li><strong>Registered:</strong> {validation.totalSuppliers}</li>
              <li><strong>External:</strong>   {validation.totalExternalSuppliers}</li>
            </ul>
            <p>Deadline: {fv.quotationDeadline?.format('MMM DD, YYYY')}</p>
            <p>Delivery: {fv.expectedDeliveryDate?.format('MMM DD, YYYY')}</p>
            {validation.hasExternalSuppliers && (
              <Alert message="External suppliers receive email invitations." type="info" showIcon style={{ marginTop: 12 }} />
            )}
          </div>
        ),
        onOk: async () => {
          try {
            const res = await buyerRequisitionAPI.createAndSendRFQ(selectedRequisition.id, rfqData);
            if (res.success) {
              const { totalSuppliersInvited = 0, registeredSuppliersInvited = 0, externalSuppliersInvited = 0 } = res.data;
              message.success(
                `RFQ sent to ${totalSuppliersInvited} supplier(s) ` +
                `(${registeredSuppliersInvited} registered, ${externalSuppliersInvited} external)`
              );
              setSupplierSelectionVisible(false);
              setSourcingDrawerVisible(false);
              setCurrentStep(0);
              setSelectedSuppliers([]);
              setSelectedRequisition(null);
              await Promise.all([loadRequisitions(), loadAllRequisitionsForStats()]);
            } else {
              message.error(res.message || 'Failed to submit RFQ');
            }
          } catch (err) {
            message.error(err.message || 'Failed to submit RFQ');
          } finally { setLoading(false); }
        },
        onCancel: () => setLoading(false)
      });
    } catch (err) {
      message.error(err.message || 'Failed to process supplier selection');
      setLoading(false);
    }
  };

  const handleSubmitSourcing = async () => {
    if (await validateSourcingForm()) setSupplierSelectionVisible(true);
  };

  // ── table columns ────────────────────────────────────────────────────────

  const columns = [
    {
      title: 'Requisition Details', key: 'details', width: 210,
      render: (_, r) => (
        <Space direction="vertical" size="small">
          <Text strong>{r.title}</Text>
          <Space size="small">
            <Tag color="blue">{r.id}</Tag>
            <Tag color="green">{r.category}</Tag>
          </Space>
        </Space>
      )
    },
    {
      title: 'Requester', key: 'requester', width: 150,
      render: (_, r) => (
        <Space direction="vertical" size="small">
          <Text>{r.requester}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{r.department}</Text>
        </Space>
      )
    },
    {
      title: 'Budget', key: 'budget', width: 140,
      render: (_, r) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {r.budget?.toLocaleString() ?? '—'}
        </Text>
      )
    },
    {
      title: 'Items', dataIndex: 'items', key: 'items', align: 'center', width: 70,
      render: items => (
        <Badge count={Array.isArray(items) ? items.length : 0} showZero>
          <FileTextOutlined />
        </Badge>
      )
    },
    {
      title: 'Expected Delivery', key: 'delivery', width: 145,
      render: (_, r) => {
        if (!r.expectedDeliveryDate) return <Text type="secondary">Not set</Text>;
        const overdue = moment(r.expectedDeliveryDate).isBefore(moment());
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ color: overdue ? '#ff4d4f' : undefined }}>
              {moment(r.expectedDeliveryDate).format('MMM DD, YYYY')}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {moment(r.expectedDeliveryDate).fromNow()}
            </Text>
            {overdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
          </Space>
        );
      }
    },
    {
      title: 'Urgency', dataIndex: 'urgency', key: 'urgency', width: 100,
      render: getUrgencyTag
    },
    {
      title: 'Status', dataIndex: 'sourcingStatus', key: 'sourcingStatus', width: 190,
      render: getStatusTag
    },
    {
      title: 'Actions', key: 'actions', width: 200, fixed: 'right',
      render: (_, r) => (
        <Space wrap>
          <Tooltip title="View Details">
            <Button type="link" size="small" icon={<EyeOutlined />}
              onClick={() => handleViewDetails(r)} />
          </Tooltip>

          {r.sourcingStatus === 'pending_sourcing' && (
            <Tooltip title="Start Sourcing">
              <Button type="primary" size="small" icon={<SendOutlined />}
                onClick={() => handleStartSourcing(r)}>
                Source
              </Button>
            </Tooltip>
          )}

          {r.sourcingStatus === 'in_progress' && (
            <Tooltip title="Manage Sourcing">
              <Button size="small" icon={<SettingOutlined />}
                onClick={() => handleStartSourcing(r)}>
                Manage
              </Button>
            </Tooltip>
          )}

          {/* Justify button shown for all disbursed / justification-workflow rows */}
          {r.sourcingStatus === 'justified' && (
            <Tooltip title="Open Justification Form">
              <Button type="dashed" size="small" icon={<FileTextOutlined />}
                onClick={() => navigate(`/buyer/requisitions/${r.id}/justify`)}>
                Justify
              </Button>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  const sourcingSteps = [
    { title: 'Supplier Selection', description: 'Choose suppliers to invite' },
    { title: 'Sourcing Criteria',  description: 'Set evaluation criteria'    },
    { title: 'Review & Submit',    description: 'Send to suppliers'          }
  ];

  // ── render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>
            <ShoppingCartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Purchase Requisition Management
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<ExportOutlined />}>Export Report</Button>
            <Button icon={<FilterOutlined />}>Filters</Button>
          </Space>
        </Col>
      </Row>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {[
          { title: 'Pending Sourcing', value: stats.pending,    icon: <ClockCircleOutlined />, color: '#faad14' },
          { title: 'In Progress',      value: stats.inProgress, icon: <SendOutlined />,        color: '#1890ff' },
          { title: 'Quotes Received',  value: stats.quoted,     icon: <MailOutlined />,        color: '#722ed1' },
          { title: 'Completed',        value: stats.completed,  icon: <CheckCircleOutlined />, color: '#52c41a' }
        ].map(s => (
          <Col span={6} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={statsLoading ? '…' : s.value}
                prefix={s.icon}
                valueStyle={{ color: s.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Alerts */}
      {stats.pending > 0 && (
        <Alert
          message={`${stats.pending} requisition(s) pending sourcing`}
          description="Ready for supplier selection and RFQ creation."
          type="warning" showIcon
          action={<Button size="small" type="primary" onClick={() => setActiveTab('pending')}>View</Button>}
          style={{ marginBottom: 16 }}
        />
      )}
      {stats.justified > 0 && (
        <Alert
          message={`${stats.justified} requisition(s) need justification`}
          description="Cash has been disbursed. Please complete the purchase justification form."
          type="info" showIcon
          action={<Button size="small" type="primary" onClick={() => setActiveTab('justified')}>View</Button>}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        style={{ marginBottom: 0 }}
        items={[
          {
            key: 'pending',
            label: <Badge count={stats.pending} offset={[10, 0]}>Pending Sourcing ({stats.pending})</Badge>
          },
          {
            key: 'in_progress',
            label: <Badge count={stats.inProgress} offset={[10, 0]}>In Progress ({stats.inProgress})</Badge>
          },
          { key: 'quoted',    label: `Quotes Received (${stats.quoted})`     },
          { key: 'completed', label: `Completed (${stats.completed})`        },
          {
            key: 'justified',
            label: <Badge count={stats.justified} offset={[10, 0]}>Needs Justification ({stats.justified})</Badge>
          },
          { key: 'all', label: `All Requisitions (${allRequisitions.length})` }
        ]}
      />

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={requisitions}
          loading={loading}
          rowKey="id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            defaultPageSize: 20,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} requisitions`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Supplier Selection Modal */}
      <EnhancedSupplierSelection
        visible={supplierSelectionVisible}
        onCancel={() => setSupplierSelectionVisible(false)}
        onConfirm={handleSupplierSelectionConfirm}
        loading={loading}
        category={selectedRequisition?.category}
      />

      {/* ── Detail Drawer ──────────────────────────────────────────────────── */}
      <Drawer
        title={<Title level={4}>Requisition Details</Title>}
        placement="right" width={800}
        open={detailDrawerVisible}
        onClose={() => { setDetailDrawerVisible(false); setSelectedRequisition(null); }}
      >
        {selectedRequisition && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card size="small">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Requisition ID:</Text>
                  <div><Text strong>{selectedRequisition.id}</Text></div>
                  <Text type="secondary">Title:</Text>
                  <div><Text strong>{selectedRequisition.title}</Text></div>
                  <Text type="secondary">Requester:</Text>
                  <div><UserOutlined style={{ marginRight: 8 }} />{selectedRequisition.requester}</div>
                  <Text type="secondary">Department:</Text>
                  <div><Text>{selectedRequisition.department}</Text></div>
                  <Text type="secondary">Request Date:</Text>
                  <div>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
                  </div>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Expected Delivery:</Text>
                  <div>
                    <TruckOutlined style={{ marginRight: 8 }} />
                    {selectedRequisition.expectedDeliveryDate
                      ? moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY')
                      : 'Not specified'}
                  </div>
                  <Text type="secondary">Budget:</Text>
                  <div>
                    <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                    <Text strong style={{ color: '#1890ff' }}>
                      XAF {selectedRequisition.budget?.toLocaleString() || '—'}
                    </Text>
                  </div>
                  <Text type="secondary">Urgency:</Text>
                  <div>{getUrgencyTag(selectedRequisition.urgency)}</div>
                  <Text type="secondary">Category:</Text>
                  <div><Tag color="blue">{selectedRequisition.category}</Tag></div>
                  <Text type="secondary">Status:</Text>
                  <div>{getStatusTag(selectedRequisition.sourcingStatus)}</div>
                  <Text type="secondary">Delivery Location:</Text>
                  <div>
                    <GlobalOutlined style={{ marginRight: 8 }} />
                    {selectedRequisition.deliveryLocation || 'Not specified'}
                  </div>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Items Requested">
              <Table
                columns={[
                  { title: 'Description',   dataIndex: 'description',   key: 'description'   },
                  { title: 'Quantity',       dataIndex: 'quantity',       key: 'quantity',      width: 80 },
                  { title: 'Unit',           dataIndex: 'unit',           key: 'unit',          width: 80 },
                  { title: 'Specifications', dataIndex: 'specifications', key: 'specifications' }
                ]}
                dataSource={selectedRequisition.items || []}
                pagination={false} size="small" rowKey={(_, i) => i}
              />
            </Card>

            <Card size="small" title="📝 Purchase Justification">
              <Alert
                message="Complete purchase justification"
                description="Use the justification form to provide the full breakdown and receipts."
                type="info" style={{ marginBottom: 16 }} showIcon
              />
              <Button type="primary" icon={<FileTextOutlined />}
                onClick={() => navigate(`/buyer/requisitions/${selectedRequisition?.id}/justify`)}>
                Open Justification Form
              </Button>
            </Card>

            {selectedRequisition.notes && (
              <Card size="small" title="Notes">
                <Paragraph>{selectedRequisition.notes}</Paragraph>
              </Card>
            )}

            {selectedRequisition.sourcingDetails && (
              <Card size="small" title="Sourcing Timeline">
                <Timeline size="small">
                  <Timeline.Item color="blue">
                    <Text strong>Assigned to Buyer</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="green">
                    <Text strong>Sourcing Initiated</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
                      </Text>
                    </div>
                    <div>
                      <Text type="secondary">
                        Sent to {selectedRequisition.sourcingDetails.selectedSuppliers?.length || 0} supplier(s)
                      </Text>
                    </div>
                  </Timeline.Item>
                  <Timeline.Item color="orange">
                    <Text strong>Expected Quote Response</Text>
                    <div>
                      <Text type="secondary">
                        {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
                      </Text>
                    </div>
                  </Timeline.Item>
                </Timeline>
              </Card>
            )}

            <Card size="small">
              <Space wrap>
                {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
                  <Button type="primary" icon={<SendOutlined />}
                    onClick={() => { setDetailDrawerVisible(false); handleStartSourcing(selectedRequisition); }}>
                    Start Sourcing Process
                  </Button>
                )}
                {selectedRequisition.sourcingStatus === 'in_progress' && (
                  <Button icon={<SettingOutlined />}
                    onClick={() => { setDetailDrawerVisible(false); handleStartSourcing(selectedRequisition); }}>
                    Manage Sourcing
                  </Button>
                )}
                {selectedRequisition.sourcingStatus === 'justified' && (
                  <Button type="primary" icon={<FileTextOutlined />}
                    onClick={() => navigate(`/buyer/requisitions/${selectedRequisition?.id}/justify`)}>
                    Open Justification Form
                  </Button>
                )}
                <Button icon={<CopyOutlined />}>Copy ID</Button>
                <Button icon={<DownloadOutlined />}>Download PDF</Button>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* ── Sourcing Drawer ────────────────────────────────────────────────── */}
      <Drawer
        title={<Title level={4}>Sourcing Management — {selectedRequisition?.title}</Title>}
        placement="right" width={1000}
        open={sourcingDrawerVisible}
        onClose={() => { setSourcingDrawerVisible(false); setSelectedRequisition(null); setCurrentStep(0); }}
        footer={
          <Row justify="space-between">
            <Col>
              <Space>
                <Button onClick={() => setSourcingDrawerVisible(false)}>Cancel</Button>
                {currentStep > 0 && (
                  <Button onClick={() => setCurrentStep(s => s - 1)}>Previous</Button>
                )}
              </Space>
            </Col>
            <Col>
              <Space>
                <Text type="secondary">Step {currentStep + 1} of {sourcingSteps.length}</Text>
                {currentStep < sourcingSteps.length - 1 ? (
                  <Button type="primary"
                    onClick={() => setCurrentStep(s => s + 1)}
                    disabled={currentStep === 0 && selectedSuppliers.length === 0}>
                    Next
                  </Button>
                ) : (
                  <Button type="primary" icon={<SendOutlined />}
                    loading={loading} onClick={handleSubmitSourcing}>
                    Select Suppliers
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        }
      >
        {selectedRequisition && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Steps current={currentStep}>
              {sourcingSteps.map((s, i) => (
                <Step key={i} title={s.title} description={s.description} />
              ))}
            </Steps>

            {currentStep === 0 && (
              <Alert
                message="Ready for Supplier Selection"
                description="Click 'Select Suppliers' to choose registered suppliers and add external supplier emails for this RFQ."
                type="info" showIcon
              />
            )}

            {currentStep === 1 && (
              <Card title="Sourcing Criteria" bordered={false}>
                <Form form={sourcingForm} layout="vertical">
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date"
                        rules={[{ required: true, message: 'Required' }]}>
                        <DatePicker style={{ width: '100%' }}
                          disabledDate={d => d && d < moment().add(1, 'day')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="quotationDeadline" label="Quotation Deadline"
                        rules={[{ required: true, message: 'Required' }]}>
                        <DatePicker style={{ width: '100%' }}
                          disabledDate={d => d && d < moment().add(1, 'day')} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="paymentTerms" label="Payment Terms"
                        rules={[{ required: true, message: 'Required' }]}>
                        <Select>
                          {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment']
                            .map(v => <Option key={v} value={v}>{v}</Option>)}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item name="deliveryLocation" label="Delivery Location">
                        <Input placeholder="Delivery address" />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Divider>Evaluation Criteria (must total 100%)</Divider>
                  <Row gutter={[16, 16]}>
                    {[['quality','Quality (%)'],['cost','Cost (%)'],['delivery','Delivery (%)']].map(([f, l]) => (
                      <Col span={8} key={f}>
                        <Form.Item name={['evaluationCriteria', f]} label={l}>
                          <InputNumber min={0} max={100} style={{ width: '100%' }}
                            formatter={v => `${v}%`} parser={v => v.replace('%', '')} />
                        </Form.Item>
                      </Col>
                    ))}
                  </Row>
                  <Form.Item name="specialRequirements" label="Special Requirements (Optional)">
                    <TextArea rows={3} placeholder="Any special conditions for this procurement…" />
                  </Form.Item>
                </Form>
              </Card>
            )}
          </Space>
        )}
      </Drawer>

    </div>
  );
};

export default BuyerRequisitionPortal;










// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   InputNumber,
//   Tabs,
//   Badge,
//   Drawer,
//   message,
//   Alert,
//   Divider,
//   Tooltip,
//   Steps,
//   Checkbox,
//   Rate,
//   Timeline,
//   Avatar,
//   List,
//   Upload,
//   Spin
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   EyeOutlined,
//   SendOutlined,
//   UserOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   FileTextOutlined,
//   StarOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   MailOutlined,
//   SettingOutlined,
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   TeamOutlined,
//   TruckOutlined,
//   BankOutlined,
//   BarChartOutlined,
//   FilterOutlined,
//   ExportOutlined,
//   PhoneOutlined,
//   GlobalOutlined,
//   SafetyCertificateOutlined,
//   TagOutlined,
//   CopyOutlined,
//   UploadOutlined,
//   DownloadOutlined,
//   ExclamationCircleOutlined,
//   SolutionOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
// import EnhancedSupplierSelection from '../../components/EnhancedSupplierSelection';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// const BuyerRequisitionPortal = () => {
//   const navigate = useNavigate();
//   const [requisitions, setRequisitions] = useState([]);
//   const [allRequisitions, setAllRequisitions] = useState([]); // For stats computation
//   const [selectedRequisition, setSelectedRequisition] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
//   const [supplierSelectionVisible, setSupplierSelectionVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [statsLoading, setStatsLoading] = useState(false);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedSuppliers, setSelectedSuppliers] = useState([]);
//   const [sourcingForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [currentStep, setCurrentStep] = useState(0);

//   // Load all requisitions once for stats (no filter)
//   const loadAllRequisitionsForStats = useCallback(async () => {
//     try {
//       setStatsLoading(true);
//       const response = await buyerRequisitionAPI.getAssignedRequisitions({});
//       if (response.success) {
//         setAllRequisitions(response.data || []);
//       }
//     } catch (error) {
//       console.error('Error loading stats data:', error);
//     } finally {
//       setStatsLoading(false);
//     }
//   }, []);

//   // Load requisitions for current tab
//   const loadRequisitions = useCallback(async () => {
//     try {
//       setLoading(true);

//       const statusFilter = {
//         'pending':     { sourcingStatus: 'pending_sourcing' },
//         'in_progress': { sourcingStatus: 'in_progress' },
//         'quoted':      { sourcingStatus: 'quotes_received' },
//         'completed':   { sourcingStatus: 'completed' },
//         'justified':   { justified: true },
//         'all':         {}
//       };

//       const filters = statusFilter[activeTab] || {};
//       console.log('Loading requisitions for tab:', activeTab, 'with filters:', filters);

//       const response = await buyerRequisitionAPI.getAssignedRequisitions(filters);

//       if (response.success) {
//         setRequisitions(response.data || []);
//         console.log('Loaded requisitions:', response.data?.length || 0);

//         // If on "all" tab, also update the stats pool
//         if (activeTab === 'all') {
//           setAllRequisitions(response.data || []);
//         }
//       } else {
//         message.error(response.message || 'Failed to load requisitions');
//       }
//     } catch (error) {
//       console.error('Error loading requisitions:', error);
//       message.error(error.message || 'Error loading requisitions. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   }, [activeTab]);

//   // On mount: load stats data once, then load tab data
//   useEffect(() => {
//     loadAllRequisitionsForStats();
//   }, [loadAllRequisitionsForStats]);

//   // On tab change: reload tab-specific data
//   useEffect(() => {
//     loadRequisitions();
//   }, [loadRequisitions]);

//   const loadSuppliers = async (category) => {
//     if (!category) {
//       message.warning('No category specified for supplier search');
//       return;
//     }
//     try {
//       setLoading(true);
//       const response = await buyerRequisitionAPI.getSuppliersByCategory(category);
//       if (response.success) {
//         setSuppliers(response.data || []);
//       } else {
//         message.error(response.message || 'Failed to load suppliers');
//         setSuppliers([]);
//       }
//     } catch (error) {
//       console.error('Error loading suppliers:', error);
//       message.error(error.message || 'Error loading suppliers. Please try again.');
//       setSuppliers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getFilteredRequisitions = () => {
//     return requisitions; // Already filtered by API call
//   };

//   // Compute stats from allRequisitions (full dataset, not tab-filtered)
//   const stats = {
//     pending:    allRequisitions.filter(r => r.sourcingStatus === 'pending_sourcing').length,
//     inProgress: allRequisitions.filter(r => r.sourcingStatus === 'in_progress').length,
//     quoted:     allRequisitions.filter(r => r.sourcingStatus === 'quotes_received').length,
//     completed:  allRequisitions.filter(r => r.sourcingStatus === 'completed').length,
//     justified:  allRequisitions.filter(r => r.sourcingStatus === 'justified').length
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_sourcing':  { color: 'orange',  text: 'Pending Sourcing' },
//       'in_progress':       { color: 'blue',    text: 'Sourcing in Progress' },
//       'quotes_received':   { color: 'purple',  text: 'Quotes Received' },
//       'completed':         { color: 'green',   text: 'Completed' },
//       'justified':         { color: 'gold',    text: 'Justified' }
//     };
//     const statusInfo = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'Low':    'green',
//       'Medium': 'orange',
//       'High':   'red',
//       'Urgent': 'volcano'
//     };
//     return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
//   };

//   const handleViewDetails = async (requisition) => {
//     try {
//       setLoading(true);
//       const response = await buyerRequisitionAPI.getRequisitionDetails(requisition.id);
//       if (response.success) {
//         setSelectedRequisition(response.data);
//         setDetailDrawerVisible(true);
//       } else {
//         message.error(response.message || 'Failed to load requisition details');
//       }
//     } catch (error) {
//       console.error('Error loading requisition details:', error);
//       message.error(error.message || 'Error loading requisition details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartSourcing = async (requisition) => {
//     try {
//       setSelectedRequisition(requisition);
//       await loadSuppliers(requisition.category);
//       setSelectedSuppliers([]);
//       sourcingForm.resetFields();
//       sourcingForm.setFieldsValue({
//         expectedDeliveryDate: requisition.expectedDeliveryDate
//           ? moment(requisition.expectedDeliveryDate)
//           : moment().add(14, 'days'),
//         quotationDeadline: moment().add(5, 'days'),
//         paymentTerms: '30 days',
//         deliveryLocation: requisition.deliveryLocation || '',
//         evaluationCriteria: { quality: 40, cost: 35, delivery: 25 }
//       });
//       setCurrentStep(0);
//       setSourcingDrawerVisible(true);
//     } catch (error) {
//       console.error('Error starting sourcing:', error);
//       message.error('Failed to initialize sourcing process');
//     }
//   };

//   const handleSupplierSelection = (supplierId, checked) => {
//     if (checked) {
//       setSelectedSuppliers(prev => [...prev, supplierId]);
//     } else {
//       setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
//     }
//   };

//   const handleSupplierSelectionConfirm = async (supplierData) => {
//     try {
//       const isValid = await validateSourcingForm();
//       if (!isValid) return;

//       setLoading(true);
//       const formValues = sourcingForm.getFieldsValue(true);

//       const rfqData = {
//         selectedSuppliers:      supplierData.selectedSuppliers || [],
//         externalSupplierEmails: supplierData.externalSupplierEmails || [],
//         expectedDeliveryDate:   formValues.expectedDeliveryDate
//           ? formValues.expectedDeliveryDate.toISOString() : null,
//         quotationDeadline:      formValues.quotationDeadline
//           ? formValues.quotationDeadline.toISOString() : null,
//         paymentTerms:           formValues.paymentTerms || '30 days',
//         deliveryLocation:       formValues.deliveryLocation || selectedRequisition.deliveryLocation,
//         specialRequirements:    formValues.specialRequirements || '',
//         evaluationCriteria:     formValues.evaluationCriteria || { quality: 40, cost: 35, delivery: 25 }
//       };

//       const validation = buyerRequisitionAPI.validateRFQData(rfqData);
//       if (!validation.isValid) {
//         validation.errors.forEach(e => message.error(e));
//         setLoading(false);
//         return;
//       }
//       validation.warnings.forEach(w => message.warning(w));

//       const totalSuppliers = validation.totalSuppliers + validation.totalExternalSuppliers;

//       Modal.confirm({
//         title: 'Confirm RFQ Submission',
//         content: (
//           <div>
//             <p>You are about to send an RFQ to the following suppliers:</p>
//             <ul>
//               <li><strong>Registered Suppliers:</strong> {validation.totalSuppliers}</li>
//               <li><strong>External Suppliers:</strong> {validation.totalExternalSuppliers}</li>
//               <li><strong>Total:</strong> {totalSuppliers} supplier(s)</li>
//             </ul>
//             <p>Quote deadline: {formValues.quotationDeadline?.format('MMM DD, YYYY')}</p>
//             <p>Expected delivery: {formValues.expectedDeliveryDate?.format('MMM DD, YYYY')}</p>
//             {validation.hasExternalSuppliers && (
//               <Alert
//                 message="External suppliers will receive invitation links via email to submit quotes without registering."
//                 type="info"
//                 showIcon
//                 style={{ marginTop: '12px' }}
//               />
//             )}
//           </div>
//         ),
//         onOk: async () => {
//           try {
//             const response = await buyerRequisitionAPI.createAndSendRFQ(
//               selectedRequisition.id,
//               rfqData
//             );
//             if (response.success) {
//               const {
//                 registeredSuppliersInvited = 0,
//                 externalSuppliersInvited = 0,
//                 totalSuppliersInvited
//               } = response.data;
//               message.success(
//                 `RFQ sent successfully! ${totalSuppliersInvited} supplier(s) invited ` +
//                 `(${registeredSuppliersInvited} registered, ${externalSuppliersInvited} external)`
//               );
//               setSupplierSelectionVisible(false);
//               setSourcingDrawerVisible(false);
//               setCurrentStep(0);
//               setSelectedSuppliers([]);
//               setSelectedRequisition(null);
//               // Refresh both tab data and stats
//               await loadRequisitions();
//               await loadAllRequisitionsForStats();
//             } else {
//               message.error(response.message || 'Failed to submit RFQ');
//             }
//           } catch (error) {
//             console.error('RFQ submission error:', error);
//             message.error(error.message || 'Failed to submit RFQ');
//           } finally {
//             setLoading(false);
//           }
//         },
//         onCancel: () => { setLoading(false); }
//       });
//     } catch (error) {
//       console.error('Error in supplier selection:', error);
//       message.error(error.message || 'Failed to process supplier selection');
//       setLoading(false);
//     }
//   };

//   const validateSourcingForm = async () => {
//     try {
//       await sourcingForm.validateFields();
//       const expectedDeliveryDate = sourcingForm.getFieldValue('expectedDeliveryDate');
//       const quotationDeadline    = sourcingForm.getFieldValue('quotationDeadline');

//       if (!expectedDeliveryDate) throw new Error('Expected delivery date is required');
//       if (!quotationDeadline)    throw new Error('Quotation deadline is required');
//       if (quotationDeadline.isAfter(expectedDeliveryDate))
//         throw new Error('Quotation deadline must be before expected delivery date');

//       const criteria = sourcingForm.getFieldValue('evaluationCriteria');
//       if (criteria) {
//         const total = (criteria.quality || 0) + (criteria.cost || 0) + (criteria.delivery || 0);
//         if (total !== 100)
//           throw new Error(`Evaluation criteria weights must total 100% (currently: ${total}%)`);
//       }
//       return true;
//     } catch (error) {
//       if (error.errorFields) {
//         message.error(`Please fix: ${error.errorFields[0].errors[0]}`);
//       } else {
//         message.error(error.message);
//       }
//       return false;
//     }
//   };

//   const handleSubmitSourcing = async () => {
//     try {
//       const isValid = await validateSourcingForm();
//       if (!isValid) return;
//       setSupplierSelectionVisible(true);
//     } catch (error) {
//       console.error('Error opening supplier selection:', error);
//       message.error(error.message || 'Failed to open supplier selection');
//     }
//   };

//   const columns = [
//     {
//       title: 'Requisition Details',
//       key: 'details',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Text strong>{record.title}</Text>
//           <Space size="small">
//             <Tag color="blue">{record.id}</Tag>
//             <Tag color="green">{record.category}</Tag>
//           </Space>
//         </Space>
//       ),
//       width: 200
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Text>{record.requester}</Text>
//           <Text type="secondary" style={{ fontSize: '12px' }}>{record.department}</Text>
//         </Space>
//       ),
//       width: 150
//     },
//     {
//       title: 'Budget',
//       key: 'budget',
//       render: (_, record) => (
//         <Text strong style={{ color: '#1890ff' }}>
//           XAF {record.budget?.toLocaleString()}
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Items',
//       dataIndex: 'items',
//       key: 'items',
//       render: (items) => (
//         <Badge count={Array.isArray(items) ? items.length : 0} showZero>
//           <FileTextOutlined />
//         </Badge>
//       ),
//       align: 'center',
//       width: 80
//     },
//     {
//       title: 'Expected Delivery',
//       key: 'delivery',
//       render: (_, record) => {
//         const deliveryDate = record.expectedDeliveryDate;
//         if (!deliveryDate) return 'Not specified';
//         const isOverdue = moment(deliveryDate).isBefore(moment());
//         return (
//           <Space direction="vertical" size="small">
//             <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
//               {moment(deliveryDate).format('MMM DD, YYYY')}
//             </Text>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               {moment(deliveryDate).fromNow()}
//             </Text>
//             {isOverdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
//           </Space>
//         );
//       },
//       width: 130
//     },
//     {
//       title: 'Urgency',
//       dataIndex: 'urgency',
//       key: 'urgency',
//       render: (urgency) => getUrgencyTag(urgency),
//       width: 100
//     },
//     {
//       title: 'Sourcing Status',
//       dataIndex: 'sourcingStatus',
//       key: 'sourcingStatus',
//       render: (status) => getStatusTag(status),
//       width: 150
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           <Tooltip title="View Details">
//             <Button
//               type="link"
//               size="small"
//               icon={<EyeOutlined />}
//               onClick={() => handleViewDetails(record)}
//             />
//           </Tooltip>
//           {record.sourcingStatus === 'pending_sourcing' && (
//             <Tooltip title="Start Sourcing">
//               <Button
//                 type="primary"
//                 size="small"
//                 icon={<SendOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Source
//               </Button>
//             </Tooltip>
//           )}
//           {record.sourcingStatus === 'in_progress' && (
//             <Tooltip title="Manage Sourcing">
//               <Button
//                 type="default"
//                 size="small"
//                 icon={<SettingOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Manage
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 120,
//       fixed: 'right'
//     }
//   ];

//   const renderSupplierCard = (supplier) => (
//     <Card
//       key={supplier.id}
//       size="small"
//       style={{ marginBottom: '12px' }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Space direction="vertical" style={{ width: '100%' }}>
//         <Space>
//           <Checkbox
//             checked={selectedSuppliers.includes(supplier.id)}
//             onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
//             style={{ marginRight: '12px' }}
//           />
//           <Space direction="vertical" size="small">
//             <Text strong>{supplier.name}</Text>
//             <Space size="small">
//               <Rate disabled defaultValue={supplier.rating || 0} size="small" />
//               <Text type="secondary" style={{ fontSize: '12px' }}>{supplier.rating}/5.0</Text>
//             </Space>
//           </Space>
//         </Space>
//         <Row gutter={[8, 8]}>
//           <Col span={12}>
//             <Text type="secondary" style={{ fontSize: '12px' }}>Contact:</Text>
//             <div>
//               <MailOutlined style={{ marginRight: '4px' }} />
//               <Text style={{ fontSize: '11px' }}>{supplier.email}</Text>
//             </div>
//             <div>
//               <PhoneOutlined style={{ marginRight: '4px' }} />
//               <Text style={{ fontSize: '11px' }}>{supplier.phone}</Text>
//             </div>
//           </Col>
//           <Col span={12}>
//             <Text type="secondary" style={{ fontSize: '12px' }}>Performance:</Text>
//             <div><Tag color="green" size="small">{supplier.reliability}</Tag></div>
//             <div><Tag color="blue" size="small">{supplier.priceCompetitiveness}</Tag></div>
//           </Col>
//         </Row>
//         <div>
//           <Text type="secondary" style={{ fontSize: '12px' }}>Specializations:</Text>
//           <div style={{ marginTop: '4px' }}>
//             {supplier.specialization?.slice(0, 3).map(spec => (
//               <Tag key={spec} size="small" color="processing">{spec}</Tag>
//             ))}
//             {supplier.specialization?.length > 3 && (
//               <Tag size="small">+{supplier.specialization.length - 3}</Tag>
//             )}
//           </div>
//         </div>
//       </Space>
//     </Card>
//   );

//   const sourcingSteps = [
//     { title: 'Supplier Selection',  description: 'Choose suppliers to invite for quotation' },
//     { title: 'Sourcing Criteria',   description: 'Set evaluation criteria and requirements' },
//     { title: 'Review & Submit',     description: 'Review details and send to suppliers' }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Header */}
//       <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
//         <Col>
//           <Title level={2}>
//             <ShoppingCartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//             Purchase Requisition Management
//           </Title>
//         </Col>
//         <Col>
//           <Space>
//             <Button icon={<ExportOutlined />}>Export Report</Button>
//             <Button icon={<FilterOutlined />}>Filters</Button>
//           </Space>
//         </Col>
//       </Row>

//       {/* Statistics — always computed from allRequisitions, not current tab */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Pending Sourcing"
//               value={statsLoading ? '-' : stats.pending}
//               prefix={<ClockCircleOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="In Progress"
//               value={statsLoading ? '-' : stats.inProgress}
//               prefix={<SendOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Quotes Received"
//               value={statsLoading ? '-' : stats.quoted}
//               prefix={<MailOutlined />}
//               valueStyle={{ color: '#722ed1' }}
//             />
//           </Card>
//         </Col>
//         <Col span={6}>
//           <Card>
//             <Statistic
//               title="Completed"
//               value={statsLoading ? '-' : stats.completed}
//               prefix={<CheckCircleOutlined />}
//               valueStyle={{ color: '#52c41a' }}
//             />
//           </Card>
//         </Col>
//       </Row>

//       {/* Alert for pending actions */}
//       {stats.pending > 0 && (
//         <Alert
//           message={`You have ${stats.pending} requisition(s) pending sourcing`}
//           description="These requisitions are ready for supplier selection and RFQ creation."
//           type="warning"
//           showIcon
//           action={
//             <Button size="small" type="primary" onClick={() => setActiveTab('pending')}>
//               View Pending
//             </Button>
//           }
//           style={{ marginBottom: '24px' }}
//         />
//       )}

//       {/* Tabs */}
//       <Tabs
//         activeKey={activeTab}
//         onChange={setActiveTab}
//         items={[
//           {
//             key: 'pending',
//             label: (
//               <Badge count={stats.pending} offset={[10, 0]}>
//                 Pending Sourcing ({stats.pending})
//               </Badge>
//             )
//           },
//           {
//             key: 'in_progress',
//             label: (
//               <Badge count={stats.inProgress} offset={[10, 0]}>
//                 In Progress ({stats.inProgress})
//               </Badge>
//             )
//           },
//           { key: 'quoted',    label: `Quotes Received (${stats.quoted})` },
//           { key: 'completed', label: `Completed (${stats.completed})` },
//           { key: 'justified', label: `Justified Purchases (${stats.justified})` },
//           {
//             key: 'all',
//             label: `All Requisitions (${allRequisitions.length})`
//           }
//         ]}
//       />

//       {/* Requisitions Table */}
//       <Card>
//         <Table
//           columns={columns}
//           dataSource={getFilteredRequisitions()}
//           loading={loading}
//           rowKey="id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) =>
//               `${range[0]}-${range[1]} of ${total} requisitions`
//           }}
//           scroll={{ x: 'max-content' }}
//         />
//       </Card>

//       {/* Enhanced Supplier Selection Modal */}
//       <EnhancedSupplierSelection
//         visible={supplierSelectionVisible}
//         onCancel={() => setSupplierSelectionVisible(false)}
//         onConfirm={handleSupplierSelectionConfirm}
//         loading={loading}
//         category={selectedRequisition?.category}
//       />

//       {/* Requisition Details Drawer */}
//       <Drawer
//         title={<Title level={4}>Requisition Details</Title>}
//         placement="right"
//         width={800}
//         open={detailDrawerVisible}
//         onClose={() => {
//           setDetailDrawerVisible(false);
//           setSelectedRequisition(null);
//         }}
//       >
//         {selectedRequisition && (
//           <Space direction="vertical" size="large" style={{ width: '100%' }}>
//             {/* Requisition Header */}
//             <Card size="small">
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text type="secondary">Requisition ID:</Text>
//                   <div><Text strong>{selectedRequisition.id}</Text></div>
//                   <Text type="secondary">Title:</Text>
//                   <div><Text strong>{selectedRequisition.title}</Text></div>
//                   <Text type="secondary">Requester:</Text>
//                   <div>
//                     <UserOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.requester}
//                   </div>
//                   <Text type="secondary">Department:</Text>
//                   <div><Text>{selectedRequisition.department}</Text></div>
//                   <Text type="secondary">Request Date:</Text>
//                   <div>
//                     <CalendarOutlined style={{ marginRight: 8 }} />
//                     {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
//                   </div>
//                 </Col>
//                 <Col span={12}>
//                   <Text type="secondary">Expected Delivery:</Text>
//                   <div>
//                     <TruckOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.expectedDeliveryDate
//                       ? moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY')
//                       : 'Not specified'}
//                   </div>
//                   <Text type="secondary">Budget:</Text>
//                   <div>
//                     <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
//                     <Text strong style={{ color: '#1890ff' }}>
//                       XAF {selectedRequisition.budget?.toLocaleString() || 'Not specified'}
//                     </Text>
//                   </div>
//                   <Text type="secondary">Urgency:</Text>
//                   <div>{getUrgencyTag(selectedRequisition.urgency)}</div>
//                   <Text type="secondary">Category:</Text>
//                   <div><Tag color="blue">{selectedRequisition.category}</Tag></div>
//                   <Text type="secondary">Sourcing Status:</Text>
//                   <div>{getStatusTag(selectedRequisition.sourcingStatus)}</div>
//                   <Text type="secondary">Delivery Location:</Text>
//                   <div>
//                     <GlobalOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.deliveryLocation || 'Not specified'}
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Items List */}
//             <Card size="small" title="Items Requested">
//               <Table
//                 columns={[
//                   { title: 'Description',   dataIndex: 'description',   key: 'description' },
//                   { title: 'Quantity',      dataIndex: 'quantity',       key: 'quantity',      width: 80 },
//                   { title: 'Unit',          dataIndex: 'unit',           key: 'unit',          width: 80 },
//                   { title: 'Specifications',dataIndex: 'specifications', key: 'specifications' }
//                 ]}
//                 dataSource={selectedRequisition.items || []}
//                 pagination={false}
//                 size="small"
//                 rowKey={(record, index) => index}
//               />
//             </Card>

//             {/* Purchase Justification */}
//             <Card size="small" title="📝 Purchase Justification">
//               <Alert
//                 message="Complete purchase justification"
//                 description="Use the justification form to provide the full breakdown and receipts."
//                 type="info"
//                 style={{ marginBottom: '16px' }}
//                 showIcon
//               />
//               <Button
//                 type="primary"
//                 icon={<FileTextOutlined />}
//                 onClick={() =>
//                   navigate(
//                     `/buyer/requisitions/${selectedRequisition?.id || selectedRequisition?._id}/justify`
//                   )
//                 }
//               >
//                 Open Justification Form
//               </Button>
//             </Card>

//             {/* Notes */}
//             {selectedRequisition.notes && (
//               <Card size="small" title="Notes">
//                 <Paragraph>{selectedRequisition.notes}</Paragraph>
//               </Card>
//             )}

//             {/* Sourcing History */}
//             {selectedRequisition.sourcingDetails && (
//               <Card size="small" title="Sourcing Timeline">
//                 <Timeline size="small">
//                   <Timeline.Item color="blue">
//                     <Text strong>Assignment to Buyer</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                   <Timeline.Item color="green">
//                     <Text strong>Sourcing Initiated</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
//                       </Text>
//                     </div>
//                     <div>
//                       <Text type="secondary">
//                         Sent to {selectedRequisition.sourcingDetails.selectedSuppliers?.length || 0} supplier(s)
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                   <Timeline.Item color="orange">
//                     <Text strong>Expected Quote Response</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                 </Timeline>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <Card size="small">
//               <Space>
//                 {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
//                   <Button
//                     type="primary"
//                     icon={<SendOutlined />}
//                     onClick={() => {
//                       setDetailDrawerVisible(false);
//                       handleStartSourcing(selectedRequisition);
//                     }}
//                   >
//                     Start Sourcing Process
//                   </Button>
//                 )}
//                 {selectedRequisition.sourcingStatus === 'in_progress' && (
//                   <Button
//                     type="default"
//                     icon={<SettingOutlined />}
//                     onClick={() => {
//                       setDetailDrawerVisible(false);
//                       handleStartSourcing(selectedRequisition);
//                     }}
//                   >
//                     Manage Sourcing
//                   </Button>
//                 )}
//                 <Button icon={<CopyOutlined />}>Copy Requisition ID</Button>
//                 <Button icon={<DownloadOutlined />}>Download PDF</Button>
//               </Space>
//             </Card>
//           </Space>
//         )}
//       </Drawer>

//       {/* Sourcing Management Drawer */}
//       <Drawer
//         title={
//           <Title level={4}>
//             Sourcing Management - {selectedRequisition?.title}
//           </Title>
//         }
//         placement="right"
//         width={1000}
//         open={sourcingDrawerVisible}
//         onClose={() => {
//           setSourcingDrawerVisible(false);
//           setSelectedRequisition(null);
//           setCurrentStep(0);
//         }}
//         footer={
//           <Row justify="space-between">
//             <Col>
//               <Button onClick={() => setSourcingDrawerVisible(false)}>Cancel</Button>
//               {currentStep > 0 && (
//                 <Button onClick={() => setCurrentStep(currentStep - 1)}>Previous</Button>
//               )}
//             </Col>
//             <Col>
//               <Space>
//                 <Text type="secondary">
//                   Step {currentStep + 1} of {sourcingSteps.length}
//                 </Text>
//                 {currentStep < sourcingSteps.length - 1 ? (
//                   <Button
//                     type="primary"
//                     onClick={() => setCurrentStep(currentStep + 1)}
//                     disabled={currentStep === 0 && selectedSuppliers.length === 0}
//                   >
//                     Next
//                   </Button>
//                 ) : (
//                   <Button
//                     type="primary"
//                     icon={<SendOutlined />}
//                     loading={loading}
//                     onClick={handleSubmitSourcing}
//                   >
//                     Select Suppliers
//                   </Button>
//                 )}
//               </Space>
//             </Col>
//           </Row>
//         }
//       >
//         {selectedRequisition && (
//           <Space direction="vertical" size="large" style={{ width: '100%' }}>
//             <Steps current={currentStep}>
//               {sourcingSteps.map((step, index) => (
//                 <Step key={index} title={step.title} description={step.description} />
//               ))}
//             </Steps>

//             {currentStep === 0 && (
//               <Alert
//                 message="Ready for Supplier Selection"
//                 description="Click 'Select Suppliers' to choose registered suppliers and add external supplier emails for this RFQ."
//                 type="info"
//                 showIcon
//               />
//             )}

//             {currentStep === 1 && (
//               <Card title="Sourcing Criteria" bordered={false}>
//                 <Form form={sourcingForm} layout="vertical" onFinish={handleSubmitSourcing}>
//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="expectedDeliveryDate"
//                         label="Expected Delivery Date"
//                         rules={[{ required: true, message: 'Expected delivery date is required' }]}
//                       >
//                         <DatePicker
//                           style={{ width: '100%' }}
//                           disabledDate={current => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="quotationDeadline"
//                         label="Quotation Deadline"
//                         rules={[{ required: true, message: 'Quotation deadline is required' }]}
//                       >
//                         <DatePicker
//                           style={{ width: '100%' }}
//                           disabledDate={current => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="paymentTerms"
//                         label="Payment Terms"
//                         rules={[{ required: true, message: 'Payment terms are required' }]}
//                       >
//                         <Select>
//                           <Option value="15 days">15 days</Option>
//                           <Option value="30 days">30 days</Option>
//                           <Option value="45 days">45 days</Option>
//                           <Option value="60 days">60 days</Option>
//                           <Option value="Cash on delivery">Cash on delivery</Option>
//                           <Option value="Advance payment">Advance payment</Option>
//                         </Select>
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item name="deliveryLocation" label="Delivery Location">
//                         <Input placeholder="Delivery address" />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Divider>Evaluation Criteria</Divider>

//                   <Row gutter={[16, 16]}>
//                     <Col span={8}>
//                       <Form.Item name={['evaluationCriteria', 'quality']} label="Quality Weight (%)">
//                         <InputNumber
//                           min={0} max={100} style={{ width: '100%' }}
//                           formatter={v => `${v}%`}
//                           parser={v => v.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item name={['evaluationCriteria', 'cost']} label="Cost Weight (%)">
//                         <InputNumber
//                           min={0} max={100} style={{ width: '100%' }}
//                           formatter={v => `${v}%`}
//                           parser={v => v.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item name={['evaluationCriteria', 'delivery']} label="Delivery Weight (%)">
//                         <InputNumber
//                           min={0} max={100} style={{ width: '100%' }}
//                           formatter={v => `${v}%`}
//                           parser={v => v.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Form.Item name="specialRequirements" label="Special Requirements (Optional)">
//                     <TextArea
//                       rows={3}
//                       placeholder="Any special requirements or conditions for this procurement..."
//                     />
//                   </Form.Item>
//                 </Form>
//               </Card>
//             )}
//           </Space>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerRequisitionPortal;











// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   InputNumber,
//   Tabs,
//   Badge,
//   Drawer,
//   message,
//   Alert,
//   Divider,
//   Tooltip,
//   Steps,
//   Checkbox,
//   Rate,
//   Timeline,
//   Avatar,
//   List,
//   Upload,
//   Spin
// } from 'antd';
// import {
//   ShoppingCartOutlined,
//   EyeOutlined,
//   SendOutlined,
//   UserOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   FileTextOutlined,
//   StarOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   MailOutlined,
//   SettingOutlined,
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   TeamOutlined,
//   TruckOutlined,
//   BankOutlined,
//   BarChartOutlined,
//   FilterOutlined,
//   ExportOutlined,
//   PhoneOutlined,
//   GlobalOutlined,
//   SafetyCertificateOutlined,
//   TagOutlined,
//   CopyOutlined,
//   UploadOutlined,
//   DownloadOutlined,
//   ExclamationCircleOutlined,
//   SolutionOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
// import EnhancedSupplierSelection from '../../components/EnhancedSupplierSelection';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// const BuyerRequisitionPortal = () => {
//   const navigate = useNavigate();
//   const [requisitions, setRequisitions] = useState([]);
//   const [selectedRequisition, setSelectedRequisition] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [sourcingDrawerVisible, setSourcingDrawerVisible] = useState(false);
//   const [supplierSelectionVisible, setSupplierSelectionVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedSuppliers, setSelectedSuppliers] = useState([]);
//   const [sourcingForm] = Form.useForm();
//   const [activeTab, setActiveTab] = useState('pending');
//   const [currentStep, setCurrentStep] = useState(0);

//   // Load requisitions on component mount
//   useEffect(() => {
//     loadRequisitions();
//   }, [activeTab]);

//   const loadRequisitions = async () => {
//     try {
//       setLoading(true);
      
//       // Map activeTab to API filter
//       const statusFilter = {
//         'pending': { sourcingStatus: 'pending_sourcing' },
//         'in_progress': { sourcingStatus: 'in_progress' },
//         'quoted': { sourcingStatus: 'quotes_received' },
//         'completed': { sourcingStatus: 'completed' },
//         'justified': { justified: true },
//         'all': {}
//       };

//       const filters = statusFilter[activeTab] || {};
//       console.log('Loading requisitions with filters:', filters);
      
//       const response = await buyerRequisitionAPI.getAssignedRequisitions(filters);
      
//       if (response.success) {
//         setRequisitions(response.data || []);
//         console.log('Loaded requisitions:', response.data?.length || 0);
//       } else {
//         message.error(response.message || 'Failed to load requisitions');
//       }
//     } catch (error) {
//       console.error('Error loading requisitions:', error);
//       message.error(error.message || 'Error loading requisitions. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadSuppliers = async (category) => {
//     if (!category) {
//       message.warning('No category specified for supplier search');
//       return;
//     }

//     try {
//       setLoading(true);
//       console.log('Loading suppliers for category:', category);
      
//       const response = await buyerRequisitionAPI.getSuppliersByCategory(category);
      
//       if (response.success) {
//         setSuppliers(response.data || []);
//         console.log('Loaded suppliers:', response.data?.length || 0);
//       } else {
//         message.error(response.message || 'Failed to load suppliers');
//         setSuppliers([]);
//       }
//     } catch (error) {
//       console.error('Error loading suppliers:', error);
//       message.error(error.message || 'Error loading suppliers. Please try again.');
//       setSuppliers([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter requisitions by status
//   const getFilteredRequisitions = () => {
//     return requisitions; // Already filtered by API call
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_sourcing': { color: 'orange', text: 'Pending Sourcing' },
//       'in_progress': { color: 'blue', text: 'Sourcing in Progress' },
//       'quotes_received': { color: 'purple', text: 'Quotes Received' },
//       'completed': { color: 'green', text: 'Completed' },
//       'justified': { color: 'gold', text: 'Justified' }
//     };
//     const statusInfo = statusMap[status] || { color: 'default', text: status };
//     return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
//   };

//   const getUrgencyTag = (urgency) => {
//     const urgencyMap = {
//       'Low': 'green',
//       'Medium': 'orange',
//       'High': 'red',
//       'Urgent': 'volcano'
//     };
//     return <Tag color={urgencyMap[urgency]}>{urgency}</Tag>;
//   };

//   const handleViewDetails = async (requisition) => {
//     try {
//       setLoading(true);
//       console.log('Loading details for requisition:', requisition.id);
      
//       const response = await buyerRequisitionAPI.getRequisitionDetails(requisition.id);
      
//       if (response.success) {
//         setSelectedRequisition(response.data);
//         setDetailDrawerVisible(true);
//       } else {
//         message.error(response.message || 'Failed to load requisition details');
//       }
//     } catch (error) {
//       console.error('Error loading requisition details:', error);
//       message.error(error.message || 'Error loading requisition details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleStartSourcing = async (requisition) => {
//     try {
//       console.log('Starting sourcing for requisition:', requisition);
      
//       setSelectedRequisition(requisition);
      
//       // Load suppliers for this category
//       await loadSuppliers(requisition.category);
      
//       setSelectedSuppliers([]);
//       sourcingForm.resetFields();
      
//       // Set default form values
//       sourcingForm.setFieldsValue({
//         expectedDeliveryDate: requisition.expectedDeliveryDate ? moment(requisition.expectedDeliveryDate) : moment().add(14, 'days'),
//         quotationDeadline: moment().add(5, 'days'),
//         paymentTerms: '30 days',
//         deliveryLocation: requisition.deliveryLocation || '',
//         evaluationCriteria: {
//           quality: 40,
//           cost: 35,
//           delivery: 25
//         }
//       });
      
//       setCurrentStep(0);
//       setSourcingDrawerVisible(true);
//     } catch (error) {
//       console.error('Error starting sourcing:', error);
//       message.error('Failed to initialize sourcing process');
//     }
//   };

//   const handleSupplierSelection = (supplierId, checked) => {
//     console.log('Supplier selection changed:', { supplierId, checked });
    
//     if (checked) {
//       setSelectedSuppliers(prev => [...prev, supplierId]);
//     } else {
//       setSelectedSuppliers(prev => prev.filter(id => id !== supplierId));
//     }
//   };

//   // Enhanced supplier selection handler
//   const handleSupplierSelectionConfirm = async (supplierData) => {
//     try {
//       console.log('Supplier selection confirmed:', supplierData);
      
//       // Validate form data first
//       const isValid = await validateSourcingForm();
//       if (!isValid) return;

//       setLoading(true);

//       // Get form values
//       const formValues = sourcingForm.getFieldsValue(true);
//       console.log('Form values:', formValues);

//       // Prepare RFQ data with both registered and external suppliers
//       const rfqData = {
//         selectedSuppliers: supplierData.selectedSuppliers || [],
//         externalSupplierEmails: supplierData.externalSupplierEmails || [],
//         expectedDeliveryDate: formValues.expectedDeliveryDate ? formValues.expectedDeliveryDate.toISOString() : null,
//         quotationDeadline: formValues.quotationDeadline ? formValues.quotationDeadline.toISOString() : null,
//         paymentTerms: formValues.paymentTerms || '30 days',
//         deliveryLocation: formValues.deliveryLocation || selectedRequisition.deliveryLocation,
//         specialRequirements: formValues.specialRequirements || '',
//         evaluationCriteria: formValues.evaluationCriteria || { quality: 40, cost: 35, delivery: 25 }
//       };

//       console.log('Prepared enhanced RFQ data:', rfqData);

//       // Validate RFQ data using API utility
//       const validation = buyerRequisitionAPI.validateRFQData(rfqData);
      
//       if (!validation.isValid) {
//         validation.errors.forEach(error => message.error(error));
//         setLoading(false);
//         return;
//       }

//       // Show warnings if any
//       validation.warnings.forEach(warning => message.warning(warning));

//       // Show confirmation with supplier breakdown
//       const totalSuppliers = validation.totalSuppliers + validation.totalExternalSuppliers;
      
//       Modal.confirm({
//         title: 'Confirm RFQ Submission',
//         content: (
//           <div>
//             <p>You are about to send an RFQ to the following suppliers:</p>
//             <ul>
//               <li><strong>Registered Suppliers:</strong> {validation.totalSuppliers}</li>
//               <li><strong>External Suppliers:</strong> {validation.totalExternalSuppliers}</li>
//               <li><strong>Total:</strong> {totalSuppliers} supplier(s)</li>
//             </ul>
//             <p>Quote deadline: {formValues.quotationDeadline?.format('MMM DD, YYYY')}</p>
//             <p>Expected delivery: {formValues.expectedDeliveryDate?.format('MMM DD, YYYY')}</p>
//             {validation.hasExternalSuppliers && (
//               <Alert 
//                 message="External suppliers will receive invitation links via email to submit quotes without registering." 
//                 type="info" 
//                 showIcon 
//                 style={{ marginTop: '12px' }}
//               />
//             )}
//           </div>
//         ),
//         onOk: async () => {
//           try {
//             // Submit RFQ to API
//             console.log('Sending RFQ for requisition:', selectedRequisition.id);
//             const response = await buyerRequisitionAPI.createAndSendRFQ(selectedRequisition.id, rfqData);

//             console.log('RFQ response:', response);

//             if (response.success) {
//               const { registeredSuppliersInvited = 0, externalSuppliersInvited = 0, totalSuppliersInvited } = response.data;
              
//               message.success(
//                 `RFQ sent successfully! ${totalSuppliersInvited} supplier(s) invited ` +
//                 `(${registeredSuppliersInvited} registered, ${externalSuppliersInvited} external)`
//               );
              
//               // Close drawers and reset state
//               setSupplierSelectionVisible(false);
//               setSourcingDrawerVisible(false);
//               setCurrentStep(0);
//               setSelectedSuppliers([]);
//               setSelectedRequisition(null);
              
//               // Reload requisitions to show updated status
//               await loadRequisitions();
//             } else {
//               message.error(response.message || 'Failed to submit RFQ');
//             }
//           } catch (error) {
//             console.error('RFQ submission error:', error);
//             message.error(error.message || 'Failed to submit RFQ');
//           } finally {
//             setLoading(false);
//           }
//         },
//         onCancel: () => {
//           setLoading(false);
//         }
//       });

//     } catch (error) {
//       console.error('Error in supplier selection:', error);
//       message.error(error.message || 'Failed to process supplier selection');
//       setLoading(false);
//     }
//   };

//   const validateSourcingForm = async () => {
//     try {
//       // Validate form fields
//       await sourcingForm.validateFields();
      
//       // Get form values for additional validation
//       const expectedDeliveryDate = sourcingForm.getFieldValue('expectedDeliveryDate');
//       const quotationDeadline = sourcingForm.getFieldValue('quotationDeadline');

//       // Validate dates are present
//       if (!expectedDeliveryDate) {
//         throw new Error('Expected delivery date is required');
//       }

//       if (!quotationDeadline) {
//         throw new Error('Quotation deadline is required');
//       }

//       // Validate date logic
//       if (quotationDeadline.isAfter(expectedDeliveryDate)) {
//         throw new Error('Quotation deadline must be before expected delivery date');
//       }

//       // Validate evaluation criteria weights
//       const criteria = sourcingForm.getFieldValue('evaluationCriteria');
//       if (criteria) {
//         const quality = criteria.quality || 0;
//         const cost = criteria.cost || 0;
//         const delivery = criteria.delivery || 0;
//         const totalWeight = quality + cost + delivery;
        
//         if (totalWeight !== 100) {
//           throw new Error(`Evaluation criteria weights must total 100% (currently: ${totalWeight}%)`);
//         }
//       }

//       return true;
//     } catch (error) {
//       if (error.errorFields) {
//         // Form validation errors from Ant Design
//         const firstError = error.errorFields[0];
//         message.error(`Please fix: ${firstError.errors[0]}`);
//       } else {
//         // Custom validation errors
//         message.error(error.message);
//       }
//       return false;
//     }
//   };

//   const handleSubmitSourcing = async () => {
//     try {
//       console.log('Opening supplier selection modal...');
      
//       // Validate form first
//       const isValid = await validateSourcingForm();
//       if (!isValid) return;

//       // Open supplier selection modal
//       setSupplierSelectionVisible(true);
      
//     } catch (error) {
//       console.error('Error opening supplier selection:', error);
//       message.error(error.message || 'Failed to open supplier selection');
//     }
//   };

//   const columns = [
//     {
//       title: 'Requisition Details',
//       key: 'details',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Text strong>{record.title}</Text>
//           <Space size="small">
//             <Tag color="blue">{record.id}</Tag>
//             <Tag color="green">{record.category}</Tag>
//           </Space>
//         </Space>
//       ),
//       width: 200
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       render: (_, record) => (
//         <Space direction="vertical" size="small">
//           <Text>{record.requester}</Text>
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.department}
//           </Text>
//         </Space>
//       ),
//       width: 150
//     },
//     {
//       title: 'Budget',
//       key: 'budget',
//       render: (_, record) => (
//         <Text strong style={{ color: '#1890ff' }}>
//           XAF {record.budget?.toLocaleString()}
//         </Text>
//       ),
//       width: 120
//     },
//     {
//       title: 'Items',
//       dataIndex: 'items',
//       key: 'items',
//       render: (items) => (
//         <Badge count={Array.isArray(items) ? items.length : 0} showZero>
//           <FileTextOutlined />
//         </Badge>
//       ),
//       align: 'center',
//       width: 80
//     },
//     {
//       title: 'Expected Delivery',
//       key: 'delivery',
//       render: (_, record) => {
//         const deliveryDate = record.expectedDeliveryDate;
//         if (!deliveryDate) return 'Not specified';
        
//         const isOverdue = moment(deliveryDate).isBefore(moment());
//         return (
//           <Space direction="vertical" size="small">
//             <Text style={{ color: isOverdue ? '#ff4d4f' : 'inherit' }}>
//               {moment(deliveryDate).format('MMM DD, YYYY')}
//             </Text>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               {moment(deliveryDate).fromNow()}
//             </Text>
//             {isOverdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
//           </Space>
//         );
//       },
//       width: 130
//     },
//     {
//       title: 'Urgency',
//       dataIndex: 'urgency',
//       key: 'urgency',
//       render: (urgency) => getUrgencyTag(urgency),
//       width: 100
//     },
//     {
//       title: 'Sourcing Status',
//       dataIndex: 'sourcingStatus',
//       key: 'sourcingStatus',
//       render: (status) => getStatusTag(status),
//       width: 150
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space>
//           <Tooltip title="View Details">
//             <Button
//               type="link"
//               size="small"
//               icon={<EyeOutlined />}
//               onClick={() => handleViewDetails(record)}
//             />
//           </Tooltip>
//           {record.sourcingStatus === 'pending_sourcing' && (
//             <Tooltip title="Start Sourcing">
//               <Button
//                 type="primary"
//                 size="small"
//                 icon={<SendOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Source
//               </Button>
//             </Tooltip>
//           )}
//           {record.sourcingStatus === 'in_progress' && (
//             <Tooltip title="Manage Sourcing">
//               <Button
//                 type="default"
//                 size="small"
//                 icon={<SettingOutlined />}
//                 onClick={() => handleStartSourcing(record)}
//               >
//                 Manage
//               </Button>
//             </Tooltip>
//           )}
//         </Space>
//       ),
//       width: 120,
//       fixed: 'right'
//     }
//   ];

//   const stats = {
//     pending: requisitions.filter(req => req.sourcingStatus === 'pending_sourcing').length,
//     inProgress: requisitions.filter(req => req.sourcingStatus === 'in_progress').length,
//     quoted: requisitions.filter(req => req.sourcingStatus === 'quotes_received').length,
//     completed: requisitions.filter(req => req.sourcingStatus === 'completed').length,
//     justified: requisitions.filter(req => req.sourcingStatus === 'justified').length
//   };

//   const renderSupplierCard = (supplier) => (
//     <Card 
//       key={supplier.id}
//       size="small"
//       style={{ marginBottom: '12px' }}
//       bodyStyle={{ padding: '12px' }}
//     >
//       <Space direction="vertical" style={{ width: '100%' }}>
//         <Space>
//           <Checkbox
//             checked={selectedSuppliers.includes(supplier.id)}
//             onChange={(e) => handleSupplierSelection(supplier.id, e.target.checked)}
//             style={{ marginRight: '12px' }}
//           />
//           <Space direction="vertical" size="small">
//             <Text strong>{supplier.name}</Text>
//             <Space size="small">
//               <Rate disabled defaultValue={supplier.rating || 0} size="small" />
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 {supplier.rating}/5.0
//               </Text>
//             </Space>
//           </Space>
//         </Space>
        
//         <Row gutter={[8, 8]}>
//           <Col span={12}>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               Contact:
//             </Text>
//             <div>
//               <MailOutlined style={{ marginRight: '4px' }} />
//               <Text style={{ fontSize: '11px' }}>{supplier.email}</Text>
//             </div>
//             <div>
//               <PhoneOutlined style={{ marginRight: '4px' }} />
//               <Text style={{ fontSize: '11px' }}>{supplier.phone}</Text>
//             </div>
//           </Col>
//           <Col span={12}>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               Performance:
//             </Text>
//             <div>
//               <Tag color="green" size="small">{supplier.reliability}</Tag>
//             </div>
//             <div>
//               <Tag color="blue" size="small">{supplier.priceCompetitiveness}</Tag>
//             </div>
//           </Col>
//         </Row>
        
//         <div>
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             Specializations:
//           </Text>
//           <div style={{ marginTop: '4px' }}>
//             {supplier.specialization?.slice(0, 3).map(spec => (
//               <Tag key={spec} size="small" color="processing">{spec}</Tag>
//             ))}
//             {supplier.specialization?.length > 3 && (
//               <Tag size="small">+{supplier.specialization.length - 3}</Tag>
//             )}
//           </div>
//         </div>
//       </Space>
//     </Card>
//   );

//   const sourcingSteps = [
//     {
//       title: 'Supplier Selection',
//       description: 'Choose suppliers to invite for quotation'
//     },
//     {
//       title: 'Sourcing Criteria',
//       description: 'Set evaluation criteria and requirements'
//     },
//     {
//       title: 'Review & Submit',
//       description: 'Review details and send to suppliers'
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Header */}
//       <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
//         <Col>
//           <Title level={2}>
//             <ShoppingCartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//             Purchase Requisition Management
//           </Title>
//         </Col>
//         <Col>
//           <Space>
//             <Button icon={<ExportOutlined />}>
//               Export Report
//             </Button>
//             <Button icon={<FilterOutlined />}>
//               Filters
//             </Button>
//           </Space>
//         </Col>
//       </Row>

//       {/* Statistics */}
//       <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//         <Col span={6}>
//           <Statistic
//             title="Pending Sourcing"
//             value={stats.pending}
//             prefix={<ClockCircleOutlined />}
//             valueStyle={{ color: '#faad14' }}
//           />
//         </Col>
//         <Col span={6}>
//           <Statistic
//             title="In Progress"
//             value={stats.inProgress}
//             prefix={<SendOutlined />}
//             valueStyle={{ color: '#1890ff' }}
//           />
//         </Col>
//         <Col span={6}>
//           <Statistic
//             title="Quotes Received"
//             value={stats.quoted}
//             prefix={<MailOutlined />}
//             valueStyle={{ color: '#722ed1' }}
//           />
//         </Col>
//         <Col span={6}>
//           <Statistic
//             title="Completed"
//             value={stats.completed}
//             prefix={<CheckCircleOutlined />}
//             valueStyle={{ color: '#52c41a' }}
//           />
//         </Col>
//       </Row>

//       {/* Alert for pending actions */}
//       {stats.pending > 0 && (
//         <Alert
//           message={`You have ${stats.pending} requisition(s) pending sourcing`}
//           description="These requisitions are ready for supplier selection and RFQ creation."
//           type="warning"
//           showIcon
//           action={
//             <Button
//               size="small"
//               type="primary"
//               onClick={() => setActiveTab('pending')}
//             >
//               View Pending
//             </Button>
//           }
//           style={{ marginBottom: '24px' }}
//         />
//       )}

//       {/* Tabs */}
//       <Tabs 
//         activeKey={activeTab}
//         onChange={setActiveTab}
//         items={[
//           {
//             key: 'pending',
//             label: (
//               <Badge count={stats.pending} offset={[10, 0]}>
//                 Pending Sourcing ({stats.pending})
//               </Badge>
//             )
//           },
//           {
//             key: 'in_progress',
//             label: (
//               <Badge count={stats.inProgress} offset={[10, 0]}>
//                 In Progress ({stats.inProgress})
//               </Badge>
//             )
//           },
//           {
//             key: 'quoted',
//             label: `Quotes Received (${stats.quoted})`
//           },
//           {
//             key: 'completed',
//             label: `Completed (${stats.completed})`
//           },
//           {
//             key: 'justified',
//             label: `Justified Purchases (${stats.justified})`
//           },
//           {
//             key: 'all',
//             label: 'All Requisitions'
//           }
//         ]}
//       />

//       {/* Requisitions Table */}
//       <Card>
//         <Table
//           columns={columns}
//           dataSource={getFilteredRequisitions()}
//           loading={loading}
//           rowKey="id"
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => 
//               `${range[0]}-${range[1]} of ${total} requisitions`
//           }}
//           scroll={{ x: 'max-content' }}
//         />
//       </Card>

//       {/* Enhanced Supplier Selection Modal */}
//       <EnhancedSupplierSelection
//         visible={supplierSelectionVisible}
//         onCancel={() => setSupplierSelectionVisible(false)}
//         onConfirm={handleSupplierSelectionConfirm}
//         loading={loading}
//         category={selectedRequisition?.category}
//       />

//       {/* Requisition Details Drawer */}
//       <Drawer
//         title={
//           <Title level={4}>
//             Requisition Details
//           </Title>
//         }
//         placement="right"
//         width={800}
//         open={detailDrawerVisible}
//         onClose={() => {
//           setDetailDrawerVisible(false);
//           setSelectedRequisition(null);
//         }}
//       >
//         {selectedRequisition && (
//           <Space direction="vertical" size="large" style={{ width: '100%' }}>
//             {/* Requisition Header */}
//             <Card size="small">
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Text type="secondary">Requisition ID:</Text>
//                   <div><Text strong>{selectedRequisition.id}</Text></div>
//                   <Text type="secondary">Title:</Text>
//                   <div><Text strong>{selectedRequisition.title}</Text></div>
//                   <Text type="secondary">Requester:</Text>
//                   <div>
//                     <UserOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.requester}
//                   </div>
//                   <Text type="secondary">Department:</Text>
//                   <div><Text>{selectedRequisition.department}</Text></div>
//                   <Text type="secondary">Request Date:</Text>
//                   <div>
//                     <CalendarOutlined style={{ marginRight: 8 }} />
//                     {moment(selectedRequisition.requestDate).format('MMM DD, YYYY')}
//                   </div>
//                 </Col>
//                 <Col span={12}>
//                   <Text type="secondary">Expected Delivery:</Text>
//                   <div>
//                     <TruckOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.expectedDeliveryDate ? 
//                       moment(selectedRequisition.expectedDeliveryDate).format('MMM DD, YYYY') : 
//                       'Not specified'
//                     }
//                   </div>
//                   <Text type="secondary">Budget:</Text>
//                   <div>
//                     <DollarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
//                     <Text strong style={{ color: '#1890ff' }}>
//                       XAF {selectedRequisition.budget?.toLocaleString() || 'Not specified'}
//                     </Text>
//                   </div>
//                   <Text type="secondary">Urgency:</Text>
//                   <div>
//                     {getUrgencyTag(selectedRequisition.urgency)}
//                   </div>
//                   <Text type="secondary">Category:</Text>
//                   <div><Tag color="blue">{selectedRequisition.category}</Tag></div>
//                   <Text type="secondary">Sourcing Status:</Text>
//                   <div>
//                     {getStatusTag(selectedRequisition.sourcingStatus)}
//                   </div>
//                   <Text type="secondary">Delivery Location:</Text>
//                   <div>
//                     <GlobalOutlined style={{ marginRight: 8 }} />
//                     {selectedRequisition.deliveryLocation || 'Not specified'}
//                   </div>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Items List */}
//             <Card size="small" title="Items Requested">
//               <Table
//                 columns={[
//                   { title: 'Description', dataIndex: 'description', key: 'description' },
//                   { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80 },
//                   { title: 'Unit', dataIndex: 'unit', key: 'unit', width: 80 },
//                   { title: 'Specifications', dataIndex: 'specifications', key: 'specifications' }
//                 ]}
//                 dataSource={selectedRequisition.items || []}
//                 pagination={false}
//                 size="small"
//                 rowKey={(record, index) => index}
//               />
//             </Card>

//             {/* ✅ Purchase Justification (Buyer only) */}
//             <Card size="small" title="📝 Purchase Justification">
//               <Alert
//                 message="Complete purchase justification"
//                 description="Use the justification form to provide the full breakdown and receipts."
//                 type="info"
//                 style={{ marginBottom: '16px' }}
//                 showIcon
//               />
//               <Button
//                 type="primary"
//                 icon={<FileTextOutlined />}
//                 onClick={() =>
//                   navigate(`/buyer/requisitions/${selectedRequisition?.id || selectedRequisition?._id}/justify`)
//                 }
//               >
//                 Open Justification Form
//               </Button>
//             </Card>

//             {/* Notes */}
//             {selectedRequisition.notes && (
//               <Card size="small" title="Notes">
//                 <Paragraph>{selectedRequisition.notes}</Paragraph>
//               </Card>
//             )}

//             {/* Sourcing History */}
//             {selectedRequisition.sourcingDetails && (
//               <Card size="small" title="Sourcing Timeline">
//                 <Timeline size="small">
//                   <Timeline.Item color="blue">
//                     <Text strong>Assignment to Buyer</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.assignmentDate).format('MMM DD, YYYY HH:mm')}
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                   <Timeline.Item color="green">
//                     <Text strong>Sourcing Initiated</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.sourcingDetails.submissionDate).format('MMM DD, YYYY HH:mm')}
//                       </Text>
//                     </div>
//                     <div>
//                       <Text type="secondary">
//                         Sent to {selectedRequisition.sourcingDetails.selectedSuppliers?.length || 0} supplier(s)
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                   <Timeline.Item color="orange">
//                     <Text strong>Expected Quote Response</Text>
//                     <div>
//                       <Text type="secondary">
//                         {moment(selectedRequisition.sourcingDetails.expectedQuoteResponse).format('MMM DD, YYYY')}
//                       </Text>
//                     </div>
//                   </Timeline.Item>
//                 </Timeline>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <Card size="small">
//               <Space>
//                 {selectedRequisition.sourcingStatus === 'pending_sourcing' && (
//                   <Button
//                     type="primary"
//                     icon={<SendOutlined />}
//                     onClick={() => {
//                       setDetailDrawerVisible(false);
//                       handleStartSourcing(selectedRequisition);
//                     }}
//                   >
//                     Start Sourcing Process
//                   </Button>
//                 )}
//                 {selectedRequisition.sourcingStatus === 'in_progress' && (
//                   <Button
//                     type="default"
//                     icon={<SettingOutlined />}
//                     onClick={() => {
//                       setDetailDrawerVisible(false);
//                       handleStartSourcing(selectedRequisition);
//                     }}
//                   >
//                     Manage Sourcing
//                   </Button>
//                 )}
//                 <Button icon={<CopyOutlined />}>
//                   Copy Requisition ID
//                 </Button>
//                 <Button icon={<DownloadOutlined />}>
//                   Download PDF
//                 </Button>
//               </Space>
//             </Card>
//           </Space>
//         )}
//       </Drawer>

//       {/* Sourcing Management Drawer */}
//       <Drawer
//         title={
//           <Title level={4}>
//             Sourcing Management - {selectedRequisition?.title}
//           </Title>
//         }
//         placement="right"
//         width={1000}
//         open={sourcingDrawerVisible}
//         onClose={() => {
//           setSourcingDrawerVisible(false);
//           setSelectedRequisition(null);
//           setCurrentStep(0);
//         }}
//         footer={
//           <Row justify="space-between">
//             <Col>
//               <Button onClick={() => setSourcingDrawerVisible(false)}>
//                 Cancel
//               </Button>
//               {currentStep > 0 && (
//                 <Button onClick={() => setCurrentStep(currentStep - 1)}>
//                   Previous
//                 </Button>
//               )}
//             </Col>
//             <Col>
//               <Space>
//                 <Text type="secondary">
//                   Step {currentStep + 1} of {sourcingSteps.length}
//                 </Text>
//                 {currentStep < sourcingSteps.length - 1 ? (
//                   <Button 
//                     type="primary" 
//                     onClick={() => setCurrentStep(currentStep + 1)}
//                     disabled={currentStep === 0 && selectedSuppliers.length === 0}
//                   >
//                     Next
//                   </Button>
//                 ) : (
//                   <Button
//                     type="primary"
//                     icon={<SendOutlined />}
//                     loading={loading}
//                     onClick={handleSubmitSourcing}
//                   >
//                     Select Suppliers
//                   </Button>
//                 )}
//               </Space>
//             </Col>
//           </Row>
//         }
//       >
//         {selectedRequisition && (
//           <Space direction="vertical" size="large" style={{ width: '100%' }}>
//             {/* Progress Steps */}
//             <Steps current={currentStep}>
//               {sourcingSteps.map((step, index) => (
//                 <Step key={index} title={step.title} description={step.description} />
//               ))}
//             </Steps>

//             {/* Step Content */}
//             {currentStep === 0 && (
//               <Alert
//                 message="Ready for Supplier Selection"
//                 description="Click 'Select Suppliers' to choose registered suppliers and add external supplier emails for this RFQ."
//                 type="info"
//                 showIcon
//               />
//             )}

//             {currentStep === 1 && (
//               <Card title="Sourcing Criteria" bordered={false}>
//                 <Form
//                   form={sourcingForm}
//                   layout="vertical"
//                   onFinish={handleSubmitSourcing}
//                 >
//                   <Row gutter={[16, 16]}>
//                     <Col span={12}>
//                       <Form.Item
//                         name="expectedDeliveryDate"
//                         label="Expected Delivery Date"
//                         rules={[{ required: true, message: 'Expected delivery date is required' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={current => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="quotationDeadline"
//                         label="Quotation Deadline"
//                         rules={[{ required: true, message: 'Quotation deadline is required' }]}
//                       >
//                         <DatePicker 
//                           style={{ width: '100%' }}
//                           disabledDate={current => current && current < moment().add(1, 'day')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="paymentTerms"
//                         label="Payment Terms"
//                         rules={[{ required: true, message: 'Payment terms are required' }]}
//                       >
//                         <Select>
//                           <Option value="15 days">15 days</Option>
//                           <Option value="30 days">30 days</Option>
//                           <Option value="45 days">45 days</Option>
//                           <Option value="60 days">60 days</Option>
//                           <Option value="Cash on delivery">Cash on delivery</Option>
//                           <Option value="Advance payment">Advance payment</Option>
//                         </Select>
//                       </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                       <Form.Item
//                         name="deliveryLocation"
//                         label="Delivery Location"
//                       >
//                         <Input placeholder="Delivery address" />
//                       </Form.Item>
//                     </Col>
//                   </Row>
                  
//                   <Divider>Evaluation Criteria</Divider>
                  
//                   <Row gutter={[16, 16]}>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'quality']}
//                         label="Quality Weight (%)"
//                       >
//                         <InputNumber 
//                           min={0}
//                           max={100}
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'cost']}
//                         label="Cost Weight (%)"
//                       >
//                         <InputNumber 
//                           min={0}
//                           max={100}
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                     <Col span={8}>
//                       <Form.Item
//                         name={['evaluationCriteria', 'delivery']}
//                         label="Delivery Weight (%)"
//                       >
//                         <InputNumber 
//                           min={0}
//                           max={100}
//                           style={{ width: '100%' }}
//                           formatter={value => `${value}%`}
//                           parser={value => value.replace('%', '')}
//                         />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Form.Item
//                     name="specialRequirements"
//                     label="Special Requirements (Optional)"
//                   >
//                     <TextArea 
//                       rows={3}
//                       placeholder="Any special requirements or conditions for this procurement..."
//                     />
//                   </Form.Item>
//                 </Form>
//               </Card>
//             )}
//           </Space>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerRequisitionPortal;




