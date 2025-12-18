import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Descriptions,
  Table,
  Button,
  Space,
  message,
  Modal,
  Form,
  Input,
  Tag,
  Alert,
  Progress,
  Divider,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { kpiAPI } from '../../services/kpiAPI';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Title, Text } = Typography;

const SupervisorKPIApproval = () => {
  const { kpiId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [kpiData, setKpiData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);

  useEffect(() => {
    fetchKPI();
  }, [kpiId]);

  const fetchKPI = async () => {
    try {
      setLoading(true);
      const result = await kpiAPI.getKPI(kpiId);
      
      if (result.success) {
        setKpiData(result.data);
        
        if (result.data.approvalStatus !== 'pending') {
          message.warning('This KPI is not pending approval');
          navigate('/supervisor/kpis');
        }
      } else {
        message.error(result.message || 'Failed to load KPI');
        navigate('/supervisor/kpis');
      }
    } catch (error) {
      console.error('Error fetching KPI:', error);
      message.error('Failed to load KPI');
      navigate('/supervisor/kpis');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await kpiAPI.processApproval(
        kpiId,
        values.decision,
        values.comments || ''
      );
      
      if (result.success) {
        message.success(`KPIs ${values.decision}d successfully`);
        navigate('/supervisor/kpis');
      } else {
        message.error(result.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error('Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'reject'} these KPIs?`,
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel'
    });
  };

  if (!kpiData) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  const kpiColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'KPI Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (weight) => <Tag color="blue">{weight}%</Tag>
    },
    {
      title: 'Target Value',
      dataIndex: 'targetValue',
      key: 'targetValue',
      width: 120
    },
    {
      title: 'Measurable Outcome',
      dataIndex: 'measurableOutcome',
      key: 'measurableOutcome',
      width: 200
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <CheckCircleOutlined /> KPI Approval Review
        </Title>

        <Alert
          message="Review Required"
          description="Please review the employee's KPIs carefully. Once approved, the employee can start linking tasks to these KPIs throughout the quarter."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Employee Information */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Descriptions column={2}>
            <Descriptions.Item label={<><UserOutlined /> Employee</>}>
              <Text strong>{kpiData.employee.fullName}</Text>
              <br />
              <Text type="secondary">{kpiData.employee.department}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={<><CalendarOutlined /> Quarter</>}>
              <Tag color="blue">{kpiData.quarter}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total KPIs">
              {kpiData.kpis.length}
            </Descriptions.Item>
            <Descriptions.Item label="Total Weight">
              <Tag color={kpiData.totalWeight === 100 ? 'success' : 'error'}>
                {kpiData.totalWeight}%
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {dayjs(kpiData.submittedAt).format('MMMM DD, YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Weight Distribution */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Weight Distribution:</strong>
          </div>
          <Progress
            percent={kpiData.totalWeight}
            status={kpiData.totalWeight === 100 ? 'success' : 'exception'}
            strokeColor={kpiData.totalWeight === 100 ? '#52c41a' : '#f5222d'}
          />
        </Card>

        {/* KPIs Table */}
        <Card title="KPI Details" style={{ marginBottom: '24px' }}>
          <Table
            columns={kpiColumns}
            dataSource={kpiData.kpis}
            pagination={false}
            rowKey={(_, index) => index}
            scroll={{ x: 1000 }}
            size="small"
            bordered
          />
        </Card>

        <Divider />

        {/* Approval Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="decision"
            label="Your Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                type={decision === 'approve' ? 'primary' : 'default'}
                icon={<CheckCircleOutlined />}
                onClick={() => setDecision('approve')}
                block
                style={{
                  height: '50px',
                  backgroundColor: decision === 'approve' ? '#52c41a' : undefined,
                  borderColor: decision === 'approve' ? '#52c41a' : undefined
                }}
              >
                Approve KPIs (Employee can proceed with linking tasks)
              </Button>
              <Button
                type={decision === 'reject' ? 'primary' : 'default'}
                danger={decision === 'reject'}
                icon={<CloseCircleOutlined />}
                onClick={() => setDecision('reject')}
                block
                style={{ height: '50px' }}
              >
                Reject KPIs (Send back for revision)
              </Button>
            </Space>
          </Form.Item>

          {decision === 'approve' && (
            <Alert
              message="Approval Effect"
              description="Once approved, the employee can start linking tasks to these KPIs. The KPIs cannot be modified for this quarter."
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
          )}

          {decision === 'reject' && (
            <>
              <Alert
                message="Rejection Effect"
                description="The KPIs will be sent back to the employee for revision. Please provide clear feedback on what needs to be improved."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Form.Item
                name="comments"
                label="Reason for Rejection"
                rules={[
                  { required: true, message: 'Please provide a reason for rejection' },
                  { min: 20, message: 'Please provide detailed feedback (at least 20 characters)' }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder="Explain what needs to be revised or improved..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </>
          )}

          {decision === 'approve' && (
            <Form.Item
              name="comments"
              label="Comments (Optional)"
            >
              <TextArea
                rows={3}
                placeholder="Any feedback or comments for the employee..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          )}

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/supervisor/kpis')}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={showConfirmModal}
                disabled={!decision}
                loading={loading}
                icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {decision === 'approve' ? 'Approve KPIs' : 'Reject KPIs'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SupervisorKPIApproval;