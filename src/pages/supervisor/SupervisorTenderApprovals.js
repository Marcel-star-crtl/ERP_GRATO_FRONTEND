// SupervisorTenderApprovals.jsx
// Mirrors SupervisorPOApprovals.jsx but for the 5-level Tender approval chain:
//   L1 Requester → L2 Dept Head → L3 Supply Chain → L4 Finance → L5 Head of Business

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Card, Table, Button, Modal, Form, Input, Typography, Tag, Space,
  Tabs, Alert, Descriptions, Timeline, message, Radio, Row, Col,
  Statistic, Spin, notification, List, Avatar, Steps, Divider
} from 'antd';
import {
  FileTextOutlined, CheckCircleOutlined, CloseCircleOutlined,
  ClockCircleOutlined, AuditOutlined, DownloadOutlined, EyeOutlined,
  HistoryOutlined, ReloadOutlined, FileDoneOutlined, PrinterOutlined,
  TrophyOutlined, TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';
import tenderAPI, { generateTenderHTML } from '../../services/tenderAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const LEVEL_LABELS = {
  1: 'Requester Acknowledgment',
  2: 'Department Head Approval',
  3: 'Supply Chain Review',
  4: 'Finance Verification',
  5: 'Head of Business Final Approval'
};

const LEVEL_COLORS = {
  1: '#722ed1',
  2: '#1890ff',
  3: '#13c2c2',
  4: '#fa8c16',
  5: '#52c41a'
};

const STATUS_MAP = {
  draft:            { color: 'default', text: 'Draft' },
  pending_approval: { color: 'orange',  text: 'Pending Approval' },
  approved:         { color: 'green',   text: 'Approved' },
  rejected:         { color: 'red',     text: 'Rejected' },
  awarded:          { color: 'gold',    text: 'Awarded' }
};

const getStatusTag = (status) => {
  const cfg = STATUS_MAP[status] || { color: 'default', text: status };
  return (
    <Tag color={cfg.color} icon={
      status === 'approved' ? <CheckCircleOutlined /> :
      status === 'rejected' ? <CloseCircleOutlined /> :
      status === 'pending_approval' ? <ClockCircleOutlined /> :
      status === 'awarded' ? <TrophyOutlined /> : undefined
    }>
      {cfg.text}
    </Tag>
  );
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const SupervisorTenderApprovals = () => {
  const [searchParams]  = useSearchParams();
  const { user }        = useSelector((state) => state.auth);

  // Auto-action from email deep links: /tender-approvals/:id?approve=1 or ?reject=1
  const autoApproveId   = searchParams.get('approve');
  const autoRejectId    = searchParams.get('reject');
  const autoTenderId    = autoApproveId || autoRejectId || null;

  const [tenders,               setTenders]               = useState([]);
  const [loading,               setLoading]               = useState(false);
  const [pdfLoading,            setPdfLoading]            = useState(false);
  const [detailsModalVisible,   setDetailsModalVisible]   = useState(false);
  const [approvalModalVisible,  setApprovalModalVisible]  = useState(false);
  const [selectedTender,        setSelectedTender]        = useState(null);
  const [activeTab,             setActiveTab]             = useState('pending');
  const [stats,                 setStats]                 = useState({ pending:0, approved:0, rejected:0, total:0 });
  const [form]                  = Form.useForm();

  // ── Helpers ────────────────────────────────────────────────────────────────
  /**
   * Returns true if the logged-in user is the active approver on this tender.
   */
  const canUserApproveTender = useCallback((tender) => {
    if (!tender.approvalChain || !user?.email) return false;
    return tender.approvalChain.some(
      step =>
        step.level === tender.currentApprovalLevel &&
        step.status === 'pending' &&
        step.approver?.email?.toLowerCase() === user.email.toLowerCase()
    );
  }, [user?.email]);

  /**
   * Returns the step this user needs to action (or null).
   */
  const getUserActiveStep = useCallback((tender) => {
    if (!tender.approvalChain || !user?.email) return null;
    return tender.approvalChain.find(
      step =>
        step.level === tender.currentApprovalLevel &&
        step.status === 'pending' &&
        step.approver?.email?.toLowerCase() === user.email.toLowerCase()
    ) || null;
  }, [user?.email]);

  // ── Data loading ───────────────────────────────────────────────────────────
  const fetchTenders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tenderAPI.getTendersPendingMyApproval();
      if (res.success) {
        const data = res.data || [];
        setTenders(data);
        setStats({
          pending:  data.filter(t => canUserApproveTender(t)).length,
          approved: data.filter(t => t.status === 'approved' || t.status === 'awarded').length,
          rejected: data.filter(t => t.status === 'rejected').length,
          total:    data.length
        });
      } else {
        message.error(res.message || 'Failed to fetch tender approvals');
      }
    } catch (err) {
      console.error('fetchTenders error:', err);
      message.error('Failed to fetch tender approvals');
    } finally {
      setLoading(false);
    }
  }, [canUserApproveTender]);

  useEffect(() => {
    if (user?.email) fetchTenders();
  }, [fetchTenders, user?.email]);

  // ── Auto-action from email deep-link ───────────────────────────────────────
  useEffect(() => {
    const handleAutoAction = async () => {
      if (!autoTenderId) return;
      try {
        const res = await tenderAPI.getTenderById(autoTenderId);
        if (res.success) {
          setSelectedTender(res.data);
          setApprovalModalVisible(true);
          form.setFieldsValue({ decision: autoApproveId ? 'approved' : 'rejected' });
        }
      } catch {
        message.error('Failed to load tender for approval');
      }
    };
    if (autoTenderId) handleAutoAction();
  }, [autoTenderId, autoApproveId, form]);

  // ── View details ───────────────────────────────────────────────────────────
  const handleViewDetails = async (tender) => {
    try {
      setLoading(true);
      const res = await tenderAPI.getTenderById(tender._id || tender.id);
      if (res.success) {
        setSelectedTender(res.data);
        setDetailsModalVisible(true);
      } else {
        message.error('Failed to load tender details');
      }
    } catch {
      message.error('Error loading tender details');
    } finally {
      setLoading(false);
    }
  };

  // ── Download PDF ───────────────────────────────────────────────────────────
  const handleDownloadPDF = async (tender) => {
    setPdfLoading(true);
    try {
      await tenderAPI.downloadPDF(tender);
      message.success(`PDF downloaded — ${tender.tenderNumber}`);
    } catch (e) {
      message.error(e.message || 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Quick print (client-side HTML) ────────────────────────────────────────
  const handlePrint = (tender) => {
    const win = window.open('', '_blank');
    if (!win) { message.error('Popup blocked — please allow popups'); return; }
    win.document.write(generateTenderHTML(tender));
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  // ── Process approval ───────────────────────────────────────────────────────
  const handleApprovalDecision = async (values) => {
    if (!selectedTender) return;
    try {
      setLoading(true);
      const res = await tenderAPI.processApproval(
        selectedTender._id || selectedTender.id,
        values.decision,
        values.comments || ''
      );

      if (res.success) {
        const word = values.decision === 'approved' ? 'approved' : 'rejected';
        message.success(`Tender ${word} successfully`);

        setApprovalModalVisible(false);
        form.resetFields();

        const tNum = selectedTender.tenderNumber;
        setSelectedTender(null);

        await fetchTenders();

        notification.success({
          message: 'Decision Recorded',
          description: `Tender ${tNum} has been ${word}.`,
          duration: 5
        });
      } else {
        message.error(res.message || 'Failed to process approval decision');
      }
    } catch (err) {
      console.error('Approval decision error:', err);
      message.error('Failed to process approval decision');
    } finally {
      setLoading(false);
    }
  };

  // ── Filtered lists ─────────────────────────────────────────────────────────
  const getFilteredTenders = (tab) => {
    switch (tab) {
      case 'pending':  return tenders.filter(t => canUserApproveTender(t));
      case 'approved': return tenders.filter(t => ['approved','awarded'].includes(t.status));
      case 'rejected': return tenders.filter(t => t.status === 'rejected');
      default:         return tenders;
    }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      title: 'Tender No.',
      dataIndex: 'tenderNumber',
      key: 'tenderNumber',
      width: 120,
      render: (text) => <Text code>{text}</Text>
    },
    {
      title: 'Title / Category',
      key: 'title',
      width: 200,
      render: (_, r) => (
        <div>
          <Text strong>{r.title}</Text>
          {r.itemCategory && (
            <><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.itemCategory}</Text></>
          )}
        </div>
      )
    },
    {
      title: 'Requester',
      key: 'requester',
      width: 160,
      render: (_, r) => (
        <div>
          <Text>{r.requesterName}</Text>
          {r.requesterDepartment && (
            <><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.requesterDepartment}</Text></>
          )}
        </div>
      )
    },
    {
      title: 'Awarded Supplier',
      key: 'supplier',
      width: 160,
      render: (_, r) => (
        r.awardedSupplierName
          ? <Space><TrophyOutlined style={{ color: '#d4a017' }} /><Text>{r.awardedSupplierName}</Text></Space>
          : <Text type="secondary">—</Text>
      )
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 130,
      render: (b) => <Text strong>XAF {(b || 0).toLocaleString()}</Text>,
      sorter: (a, b) => (a.budget || 0) - (b.budget || 0)
    },
    {
      title: 'Your Stage',
      key: 'stage',
      width: 170,
      render: (_, r) => {
        const step = getUserActiveStep(r);
        if (!step) return <Text type="secondary">—</Text>;
        const label = LEVEL_LABELS[step.level] || `Level ${step.level}`;
        const color = LEVEL_COLORS[step.level] || '#1890ff';
        return (
          <div>
            <Tag style={{ background: color, borderColor: color, color: '#fff' }}>
              L{step.level}: {label}
            </Tag>
            {step.level === 1 && (
              <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                Confirm & acknowledge
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 140,
      render: (_, r) => (
        <div>
          {getStatusTag(r.status)}
          {canUserApproveTender(r) && (
            <div style={{ marginTop: 4 }}>
              <Tag color="gold" style={{ fontSize: 10 }}>Your Turn</Tag>
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Date',
      key: 'date',
      width: 110,
      render: (_, r) => moment(r.date || r.createdAt).format('DD MMM YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, r) => (
        <Space size="small" wrap>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(r)}
          >
            View
          </Button>
          {canUserApproveTender(r) && (
            <Button
              size="small"
              type="primary"
              icon={<AuditOutlined />}
              onClick={() => {
                setSelectedTender(r);
                approveForm: form.resetFields();
                setApprovalModalVisible(true);
              }}
            >
              {getUserActiveStep(r)?.level === 1 ? 'Acknowledge' : 'Review'}
            </Button>
          )}
        </Space>
      )
    }
  ];

  // ─────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────
  if (loading && !tenders.length) {
    return (
      <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:400 }}>
        <Spin size="large" />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ padding: 24 }}>
      <Card>
        {/* ── Header ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <Title level={2} style={{ margin:0 }}>
              <FileDoneOutlined /> Tender Approvals Dashboard
            </Title>
            <Text type="secondary">
              5-level chain: Requester → Dept Head → Supply Chain → Finance → Head of Business
            </Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchTenders} loading={loading}>
            Refresh
          </Button>
        </div>

        {/* ── Chain explanation banner ── */}
        <Card
          size="small"
          style={{ background:'#f0f5ff', border:'1px solid #adc6ff', marginBottom:20 }}
        >
          <Row gutter={0} align="middle">
            {[
              { l:1, label:'Requester',       sub:'Acknowledge' },
              { l:2, label:'Dept Head',        sub:'Approve' },
              { l:3, label:'Supply Chain',     sub:'Review' },
              { l:4, label:'Finance',          sub:'Verify' },
              { l:5, label:'Head of Business', sub:'Final Approval' }
            ].map((s, i) => (
              <React.Fragment key={i}>
                <Col style={{ display:'flex', alignItems:'center', padding:'4px 0' }}>
                  <div style={{
                    background: LEVEL_COLORS[s.l], color:'#fff',
                    borderRadius:'50%', width:26, height:26,
                    display:'inline-flex', alignItems:'center', justifyContent:'center',
                    fontSize:12, fontWeight:'bold', marginRight:6, flexShrink:0
                  }}>
                    {s.l}
                  </div>
                  <div>
                    <Text strong style={{ fontSize:12 }}>{s.label}</Text>
                    <br />
                    <Text style={{ fontSize:10, color:'#666' }}>{s.sub}</Text>
                  </div>
                </Col>
                {i < 4 && (
                  <Col style={{ padding:'0 10px', color:'#adb5bd', fontSize:18 }}>→</Col>
                )}
              </React.Fragment>
            ))}
          </Row>
        </Card>

        {/* ── Stats ── */}
        <Row gutter={16} style={{ marginBottom:24 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Awaiting My Action" value={stats.pending}
                prefix={<ClockCircleOutlined />} valueStyle={{ color:'#faad14' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Approved / Awarded" value={stats.approved}
                prefix={<CheckCircleOutlined />} valueStyle={{ color:'#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Rejected" value={stats.rejected}
                prefix={<CloseCircleOutlined />} valueStyle={{ color:'#f5222d' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Total Assigned" value={stats.total}
                prefix={<FileDoneOutlined />} valueStyle={{ color:'#1890ff' }} />
            </Card>
          </Col>
        </Row>

        {/* ── Pending alert ── */}
        {stats.pending > 0 && (
          <Alert
            message={`${stats.pending} tender${stats.pending > 1 ? 's' : ''} require${stats.pending === 1 ? 's' : ''} your action`}
            description="Your signature will be captured from your profile and embedded in the PDF when you approve."
            type="warning"
            showIcon
            style={{ marginBottom:16 }}
          />
        )}

        {/* ── Tabs + Table ── */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Pending (${stats.pending})`} key="pending">
            <Table
              columns={columns}
              dataSource={getFilteredTenders('pending')}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize:10, showTotal:(t,r)=>`${r[0]}-${r[1]} of ${t}` }}
              scroll={{ x:1300 }}
              size="small"
            />
          </TabPane>
          <TabPane tab={`Approved (${stats.approved})`} key="approved">
            <Table
              columns={columns}
              dataSource={getFilteredTenders('approved')}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize:10 }}
              scroll={{ x:1300 }}
              size="small"
            />
          </TabPane>
          <TabPane tab={`Rejected (${stats.rejected})`} key="rejected">
            <Table
              columns={columns}
              dataSource={getFilteredTenders('rejected')}
              loading={loading}
              rowKey="_id"
              pagination={{ pageSize:10 }}
              scroll={{ x:1300 }}
              size="small"
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* ════════════════════════════════════════════
          APPROVAL MODAL
      ════════════════════════════════════════════ */}
      <Modal
        title={
          <Space>
            <AuditOutlined />
            {(() => {
              const step = selectedTender ? getUserActiveStep(selectedTender) : null;
              const level = step?.level;
              if (level === 1) return 'Acknowledge Tender Details';
              return `Tender Approval — ${LEVEL_LABELS[level] || 'Review'}`;
            })()}
            {selectedTender && (() => {
              const step = getUserActiveStep(selectedTender);
              if (!step) return null;
              return (
                <Tag style={{ background:LEVEL_COLORS[step.level], borderColor:LEVEL_COLORS[step.level], color:'#fff' }}>
                  Level {step.level} of 5
                </Tag>
              );
            })()}
          </Space>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          setSelectedTender(null);
          form.resetFields();
        }}
        footer={null}
        width={820}
        maskClosable={false}
        destroyOnClose
      >
        {selectedTender && (() => {
          const step = getUserActiveStep(selectedTender);
          const isRequester = step?.level === 1;

          return (
            <div>
              {/* Level-specific instruction */}
              {isRequester ? (
                <Alert
                  message="Requester Acknowledgment"
                  description="You are confirming that the tender details below are correct and authorising it to proceed to the Department Head for approval."
                  type="info"
                  showIcon
                  style={{ marginBottom:16 }}
                />
              ) : (
                <Alert
                  message={`${LEVEL_LABELS[step?.level] || 'Approval'} Required`}
                  description="Your signature will be automatically captured from your profile and embedded into the Tender Approval Form PDF when you approve."
                  type="warning"
                  showIcon
                  style={{ marginBottom:16 }}
                />
              )}

              {/* Tender summary */}
              <Card
                size="small"
                style={{ marginBottom:16, background:'#f0f8ff', border:'1px solid #91caff' }}
              >
                <Descriptions size="small" column={2}>
                  <Descriptions.Item label="Tender Number">
                    <Text code strong>{selectedTender.tenderNumber}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Title">
                    <Text strong>{selectedTender.title}</Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Requested By">
                    {selectedTender.requesterName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Department">
                    {selectedTender.requesterDepartment || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Awarded Supplier">
                    <Text strong style={{ color:'#d4a017' }}>
                      {selectedTender.awardedSupplierName || '—'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Budget">
                    <Text strong style={{ color:'#1890ff' }}>
                      XAF {(selectedTender.budget || 0).toLocaleString()}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Payment Terms">
                    {selectedTender.paymentTerms || '—'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Delivery Terms">
                    {selectedTender.deliveryTerms || '—'}
                  </Descriptions.Item>
                  {selectedTender.procurementRecommendation && (
                    <Descriptions.Item label="Procurement Recommendation" span={2}>
                      <Text italic style={{ fontSize:11 }}>{selectedTender.procurementRecommendation}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Supplier summary table */}
              {(selectedTender.supplierQuotes || []).length > 0 && (
                <Card size="small" title={<Space><TeamOutlined/>Supplier Quotes</Space>} style={{ marginBottom:16 }}>
                  {(selectedTender.supplierQuotes || []).map((sq, i) => (
                    <div key={i} style={{
                      padding:'6px 10px',
                      background: sq.supplierName === selectedTender.awardedSupplierName ? '#fffbe6' : '#fafafa',
                      border: sq.supplierName === selectedTender.awardedSupplierName ? '1px solid #ffe58f' : '1px solid #f0f0f0',
                      borderRadius:4,
                      marginBottom:6,
                      display:'flex',
                      justifyContent:'space-between',
                      alignItems:'center'
                    }}>
                      <div>
                        {sq.supplierName === selectedTender.awardedSupplierName && (
                          <Tag color="gold" icon={<TrophyOutlined/>} style={{ marginRight:6 }}>AWARDED</Tag>
                        )}
                        <Text strong>{sq.supplierName}</Text>
                      </div>
                      <Text style={{ color:'#cc0000', fontWeight:'bold' }}>
                        XAF {(sq.negotiatedGrandTotal || 0).toLocaleString()}
                      </Text>
                    </div>
                  ))}
                </Card>
              )}

              {/* PDF actions */}
              <Space style={{ marginBottom:16 }}>
                <Button icon={<PrinterOutlined />} onClick={() => handlePrint(selectedTender)}>
                  Quick Print
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={pdfLoading}
                  onClick={() => handleDownloadPDF(selectedTender)}
                >
                  Download PDF
                </Button>
              </Space>

              {/* Approval chain progress */}
              {(selectedTender.approvalChain || []).length > 0 && (
                <Card size="small" title="Chain Progress" style={{ marginBottom:16 }}>
                  <Steps size="small"
                    current={(selectedTender.approvalChain || []).findIndex(s => s.status === 'pending')}
                    status={(selectedTender.approvalChain || []).some(s=>s.status==='rejected') ? 'error' : 'process'}
                  >
                    {(selectedTender.approvalChain || []).map((s, i) => (
                      <Steps.Step key={i}
                        title={<span style={{ fontSize:10 }}>{LEVEL_LABELS[s.level]||`L${s.level}`}</span>}
                        description={
                          <div style={{ fontSize:10 }}>
                            <div style={{ color:'#555' }}>{s.approver?.name}</div>
                            {s.status==='approved'&&s.actionDate&&(
                              <div style={{ color:'#52c41a' }}>✓ {moment(s.actionDate).format('DD MMM')}</div>
                            )}
                            {s.status==='pending'&&s.level===selectedTender.currentApprovalLevel&&(
                              <div style={{ color:LEVEL_COLORS[s.level], fontWeight:'bold' }}>⏳ You</div>
                            )}
                          </div>
                        }
                        status={
                          s.status==='approved' ? 'finish' :
                          s.status==='rejected' ? 'error'  :
                          s.level===selectedTender.currentApprovalLevel ? 'process' : 'wait'
                        }
                      />
                    ))}
                  </Steps>
                </Card>
              )}

              {/* Decision form */}
              <Form form={form} layout="vertical" onFinish={handleApprovalDecision}>
                <Form.Item
                  name="decision"
                  label={isRequester ? 'Your Action' : 'Your Decision'}
                  rules={[{ required:true, message:'Please select a decision' }]}
                >
                  <Radio.Group size="large">
                    <Radio.Button value="approved" style={{ color:'#52c41a' }}>
                      <CheckCircleOutlined />
                      {' '}{isRequester ? 'Acknowledge & Proceed' : 'Approve'}
                    </Radio.Button>
                    <Radio.Button value="rejected" style={{ color:'#f5222d' }}>
                      <CloseCircleOutlined /> Reject
                    </Radio.Button>
                  </Radio.Group>
                </Form.Item>

                <Form.Item
                  name="comments"
                  label="Comments / Remarks"
                  rules={[{ required: true, message:'Comments are required' }]}
                >
                  <TextArea
                    rows={4}
                    placeholder={
                      isRequester
                        ? 'Confirm the tender details are correct and authorise it to proceed…'
                        : 'Explain your decision, any conditions or notes…'
                    }
                    maxLength={500}
                    showCount
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom:0 }}>
                  <Space>
                    <Button onClick={() => {
                      setApprovalModalVisible(false);
                      setSelectedTender(null);
                      form.resetFields();
                    }}>
                      Cancel
                    </Button>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      Submit Decision
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </div>
          );
        })()}
      </Modal>

      {/* ════════════════════════════════════════════
          DETAILS MODAL
      ════════════════════════════════════════════ */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Tender Details &amp; Approval History — {selectedTender?.tenderNumber}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedTender(null);
        }}
        footer={
          <Space>
            <Button icon={<PrinterOutlined />} onClick={() => handlePrint(selectedTender)}>
              Quick Print
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={pdfLoading}
              onClick={() => handleDownloadPDF(selectedTender)}
            >
              Download PDF (with Signatures)
            </Button>
          </Space>
        }
        width={960}
        destroyOnClose
      >
        {selectedTender && (
          <div>
            {/* Header info */}
            <Descriptions bordered column={2} size="small" style={{ marginBottom:20 }}>
              <Descriptions.Item label="Tender Number" span={2}>
                <Text code copyable>{selectedTender.tenderNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                <Text strong>{selectedTender.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedTender.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Requester">
                {selectedTender.requesterName}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedTender.requesterDepartment || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {selectedTender.itemCategory || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {selectedTender.requiredDate
                  ? moment(selectedTender.requiredDate).format('DD MMM YYYY')
                  : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Awarded Supplier">
                <Text strong style={{ color:'#d4a017' }}>
                  {selectedTender.awardedSupplierName || '—'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget">
                <Text strong style={{ color:'#1890ff' }}>
                  XAF {(selectedTender.budget || 0).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Cost Savings">
                XAF {(selectedTender.costSavings || 0).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Payment Terms">
                {selectedTender.paymentTerms || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Delivery Terms">
                {selectedTender.deliveryTerms || '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Warranty">
                {selectedTender.warranty || '—'}
              </Descriptions.Item>
              {selectedTender.commercialTerms && (
                <Descriptions.Item label="Commercial Terms" span={2}>
                  <Text italic>{selectedTender.commercialTerms}</Text>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Supplier quotes */}
            {(selectedTender.supplierQuotes || []).length > 0 && (
              <Card size="small" title={<Space><TeamOutlined/>Supplier Quotes Comparison</Space>} style={{ marginBottom:20 }}>
                <List
                  dataSource={selectedTender.supplierQuotes}
                  renderItem={(sq, idx) => (
                    <List.Item
                      style={{
                        background: sq.supplierName === selectedTender.awardedSupplierName ? '#fffbe6' : undefined,
                        borderRadius:4, padding:'8px 12px', marginBottom:4
                      }}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar style={{
                            background: sq.supplierName === selectedTender.awardedSupplierName ? '#d4a017' : '#1890ff'
                          }}>
                            {sq.supplierName === selectedTender.awardedSupplierName ? '🏆' : idx + 1}
                          </Avatar>
                        }
                        title={
                          <Space>
                            <Text strong>{sq.supplierName}</Text>
                            {sq.supplierName === selectedTender.awardedSupplierName && (
                              <Tag color="gold" icon={<TrophyOutlined />}>AWARDED</Tag>
                            )}
                          </Space>
                        }
                        description={`${(sq.items || []).length} item(s) · Payment: ${sq.paymentTerms || '—'} · Delivery: ${sq.deliveryTerms || '—'}`}
                      />
                      <div style={{ textAlign:'right' }}>
                        <div><Text type="secondary" style={{ fontSize:11 }}>Grand Total</Text></div>
                        <div><Text strong>{(sq.grandTotal || 0).toLocaleString()}</Text></div>
                        <div><Text type="secondary" style={{ fontSize:11 }}>Negotiated</Text></div>
                        <div><Text strong style={{ color:'#cc0000', fontSize:14 }}>{(sq.negotiatedGrandTotal || 0).toLocaleString()}</Text></div>
                      </div>
                    </List.Item>
                  )}
                />
              </Card>
            )}

            {/* Recommendations */}
            {(selectedTender.technicalRecommendation || selectedTender.procurementRecommendation) && (
              <Card size="small" title="Recommendations" style={{ marginBottom:20 }}>
                {selectedTender.technicalRecommendation && (
                  <div style={{ marginBottom:10 }}>
                    <Text strong>Technical Recommendation</Text>
                    <div style={{ background:'#f5f5f5', borderRadius:4, padding:'8px 12px', marginTop:4, fontSize:12 }}>
                      {selectedTender.technicalRecommendation}
                    </div>
                  </div>
                )}
                {selectedTender.procurementRecommendation && (
                  <div>
                    <Text strong>Procurement Recommendation</Text>
                    <div style={{ background:'#f5f5f5', borderRadius:4, padding:'8px 12px', marginTop:4, fontSize:12 }}>
                      {selectedTender.procurementRecommendation}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* 5-level approval chain timeline */}
            {(selectedTender.approvalChain || []).length > 0 && (
              <>
                <Title level={4} style={{ marginBottom:16 }}>
                  <HistoryOutlined /> 5-Level Approval Chain
                </Title>

                {/* Progress steps */}
                <Steps
                  size="small"
                  current={(selectedTender.approvalChain || []).findIndex(s => s.status === 'pending')}
                  status={(selectedTender.approvalChain || []).some(s=>s.status==='rejected') ? 'error' : 'process'}
                  style={{ marginBottom:20 }}
                >
                  {(selectedTender.approvalChain || []).map((s, i) => (
                    <Steps.Step key={i}
                      title={<span style={{ fontSize:11 }}>{LEVEL_LABELS[s.level]||`L${s.level}`}</span>}
                      status={
                        s.status==='approved' ? 'finish' :
                        s.status==='rejected' ? 'error'  :
                        s.level===selectedTender.currentApprovalLevel ? 'process' : 'wait'
                      }
                    />
                  ))}
                </Steps>

                {/* Detailed timeline */}
                <Timeline>
                  {(selectedTender.approvalChain || []).map((step, index) => {
                    const isCurrentStep = step.level === selectedTender.currentApprovalLevel && step.status === 'pending';
                    const levelColor    = LEVEL_COLORS[step.level] || '#1890ff';
                    const timelineColor =
                      step.status === 'approved' ? 'green' :
                      step.status === 'rejected' ? 'red'   :
                      isCurrentStep ? levelColor : 'gray';

                    return (
                      <Timeline.Item
                        key={index}
                        color={timelineColor}
                        dot={
                          step.status === 'approved' ? <CheckCircleOutlined style={{ color:'#52c41a' }} /> :
                          step.status === 'rejected' ? <CloseCircleOutlined style={{ color:'#ff4d4f' }} /> :
                          isCurrentStep ? <ClockCircleOutlined style={{ color:levelColor }} /> : undefined
                        }
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                          <div>
                            <Space>
                              <Text strong style={{ fontSize:13 }}>
                                Level {step.level}: {LEVEL_LABELS[step.level] || `Level ${step.level}`}
                              </Text>
                              {isCurrentStep && (
                                <Tag color="gold" style={{ fontSize:10 }}>Current</Tag>
                              )}
                            </Space>
                            <br />
                            <Text type="secondary" style={{ fontSize:11 }}>
                              {step.approver?.name || '—'} · {step.approver?.role || ''}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize:10, color:'#888' }}>
                              {step.approver?.email || ''}
                              {step.approver?.department ? ` · ${step.approver.department}` : ''}
                            </Text>

                            {/* Status tags */}
                            <div style={{ marginTop:4 }}>
                              {step.status === 'pending' && (
                                <Tag color={isCurrentStep ? 'gold' : 'default'}>
                                  {isCurrentStep ? '⏳ Awaiting Action' : 'Queued'}
                                </Tag>
                              )}
                              {step.status === 'approved' && (
                                <Tag color="green"><CheckCircleOutlined /> Approved &amp; Signed</Tag>
                              )}
                              {step.status === 'rejected' && (
                                <Tag color="red"><CloseCircleOutlined /> Rejected</Tag>
                              )}
                            </div>

                            {/* Comments */}
                            {step.comments && (
                              <div style={{ marginTop:4 }}>
                                <Text
                                  italic
                                  style={{ fontSize:11, color: step.status==='rejected' ? '#ff4d4f' : '#555' }}
                                >
                                  "{step.comments}"
                                </Text>
                              </div>
                            )}
                          </div>

                          {/* Date */}
                          <div style={{ textAlign:'right', fontSize:11, minWidth:100 }}>
                            {step.actionDate && (
                              <Text type="secondary">
                                {moment(step.actionDate).format('DD MMM YYYY')}<br />
                                {moment(step.actionDate).format('HH:mm')}
                              </Text>
                            )}
                          </div>
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </>
            )}

            {/* Action button if this user still needs to approve */}
            {canUserApproveTender(selectedTender) && (
              <div style={{ marginTop:16, textAlign:'center' }}>
                <Button
                  type="primary"
                  size="large"
                  icon={<AuditOutlined />}
                  onClick={() => {
                    setDetailsModalVisible(false);
                    setApprovalModalVisible(true);
                    form.resetFields();
                  }}
                >
                  {getUserActiveStep(selectedTender)?.level === 1
                    ? 'Acknowledge This Tender'
                    : 'Process My Approval Step'}
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupervisorTenderApprovals;