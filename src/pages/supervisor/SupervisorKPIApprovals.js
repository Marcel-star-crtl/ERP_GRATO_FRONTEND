import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Alert,
  Descriptions,
  Badge,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  TrophyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { kpiAPI } from '../../services/kpiAPI';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { TextArea } = Input;

const SupervisorKPIApprovals = () => {
  const navigate = useNavigate();
  const [pendingKPIs, setPendingKPIs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [decision, setDecision] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadPendingKPIs();
  }, []);

  const loadPendingKPIs = async () => {
    try {
      setLoading(true);
      const result = await kpiAPI.getPendingApprovals();
      if (result.success) {
        setPendingKPIs(result.data);
      }
    } catch (error) {
      console.error('Error loading pending KPIs:', error);
      message.error('Failed to load pending KPI approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprovalDecision = async (values) => {
    try {
      setLoading(true);
      const result = await kpiAPI.processApproval(
        selectedKPI._id,
        decision,
        values.comments || ''
      );

      if (result.success) {
        message.success(`KPIs ${decision}d successfully`);
        setApprovalModalVisible(false);
        form.resetFields();
        setSelectedKPI(null);
        setDecision(null);
        loadPendingKPIs();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error('Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const openApprovalModal = (kpi, approvalDecision) => {
    setSelectedKPI(kpi);
    setDecision(approvalDecision);
    setApprovalModalVisible(true);
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.employee.department}
          </span>
        </div>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100
    },
    {
      title: 'KPIs Count',
      dataIndex: 'kpis',
      key: 'kpisCount',
      width: 100,
      render: (kpis) => (
        <Tag color="blue">{kpis.length} KPIs</Tag>
      )
    },
    {
      title: 'Total Weight',
      dataIndex: 'totalWeight',
      key: 'totalWeight',
      width: 120,
      render: (weight) => (
        <Tag color={weight === 100 ? 'success' : 'error'}>
          {weight}%
        </Tag>
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              onClick={() => {
                Modal.info({
                  title: `${record.employee.fullName}'s KPIs - ${record.quarter}`,
                  width: 800,
                  content: (
                    <div style={{ marginTop: '16px' }}>
                      <Table
                        columns={[
                          {
                            title: 'KPI Title',
                            dataIndex: 'title',
                            key: 'title',
                            render: (text) => <strong>{text}</strong>
                          },
                          {
                            title: 'Weight',
                            dataIndex: 'weight',
                            key: 'weight',
                            width: 80,
                            render: (weight) => <Tag color="blue">{weight}%</Tag>
                          },
                          {
                            title: 'Description',
                            dataIndex: 'description',
                            key: 'description'
                          },
                          {
                            title: 'Target',
                            dataIndex: 'targetValue',
                            key: 'target'
                          },
                          {
                            title: 'Measurable Outcome',
                            dataIndex: 'measurableOutcome',
                            key: 'outcome'
                          }
                        ]}
                        dataSource={record.kpis}
                        rowKey={(r, index) => index}
                        pagination={false}
                        size="small"
                      />
                    </div>
                  )
                });
              }}
            >
              View
            </Button>
          </Tooltip>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={() => openApprovalModal(record, 'approve')}
          >
            Approve
          </Button>
          <Button
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => openApprovalModal(record, 'reject')}
          >
            Reject
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <TrophyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              KPI Approvals
            </h2>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Review and approve quarterly KPIs submitted by your team
            </p>
          </div>
          <Badge count={pendingKPIs.length} showZero>
            <Button type="primary" onClick={loadPendingKPIs} loading={loading}>
              Refresh
            </Button>
          </Badge>
        </div>

        <Alert
          message="KPI Approval Guidelines"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Ensure KPIs are SMART (Specific, Measurable, Achievable, Relevant, Time-bound)</li>
              <li>Verify total weight equals 100%</li>
              <li>Check that targets are realistic yet challenging</li>
              <li>Confirm KPIs align with organizational goals and employee role</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Table
          columns={columns}
          dataSource={pendingKPIs}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Approval Modal */}
      <Modal
        title={
          <span>
            {decision === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#f5222d', marginRight: '8px' }} />
            )}
            {decision === 'approve' ? 'Approve KPIs' : 'Reject KPIs'}
          </span>
        }
        open={approvalModalVisible}
        onCancel={() => {
          setApprovalModalVisible(false);
          form.resetFields();
          setSelectedKPI(null);
          setDecision(null);
        }}
        footer={null}
        width={700}
      >
        {selectedKPI && (
          <>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Employee" span={2}>
                {selectedKPI.employee.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Quarter">
                {selectedKPI.quarter}
              </Descriptions.Item>
              <Descriptions.Item label="KPIs Count">
                {selectedKPI.kpis.length}
              </Descriptions.Item>
              <Descriptions.Item label="Total Weight" span={2}>
                <Tag color={selectedKPI.totalWeight === 100 ? 'success' : 'error'}>
                  {selectedKPI.totalWeight}%
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            {decision === 'approve' ? (
              <Alert
                message="Approval Confirmation"
                description="Once approved, the employee can start linking tasks to these KPIs. The KPIs cannot be modified after approval."
                type="success"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            ) : (
              <Alert
                message="Rejection Reason Required"
                description="Please provide clear feedback on what needs to be improved in the KPIs."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleApprovalDecision}>
              <Form.Item
                name="comments"
                label={decision === 'approve' ? 'Comments (Optional)' : 'Rejection Reason'}
                rules={decision === 'reject' ? [
                  { required: true, message: 'Please provide rejection reason' },
                  { min: 10, message: 'Please provide detailed feedback (at least 10 characters)' }
                ] : []}
              >
                <TextArea
                  rows={4}
                  placeholder={
                    decision === 'approve'
                      ? 'Add any additional comments or feedback...'
                      : 'Explain what needs to be improved in the KPIs...'
                  }
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button
                    onClick={() => {
                      setApprovalModalVisible(false);
                      form.resetFields();
                      setSelectedKPI(null);
                      setDecision(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type={decision === 'approve' ? 'primary' : 'danger'}
                    htmlType="submit"
                    loading={loading}
                  >
                    {decision === 'approve' ? 'Approve KPIs' : 'Reject KPIs'}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default SupervisorKPIApprovals;