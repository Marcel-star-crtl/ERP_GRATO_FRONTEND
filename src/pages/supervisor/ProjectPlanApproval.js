import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Input,
  Space,
  Typography,
  Tag,
  message,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
  Steps,
  Timeline,
  Badge,
  Tooltip
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  ProjectOutlined,
  DollarOutlined,
  CalendarOutlined,
  UserOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { projectPlanAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const ProjectPlanApprovalPortal = () => {
  const [projectPlans, setProjectPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [comments, setComments] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0
  });

  // Get user info
  const userInfo = JSON.parse(localStorage.getItem('user') || '{}');
  const userEmail = userInfo.email || '';
  const userName = userInfo.fullName || userInfo.name || 'User';

  // Determine user role in approval chain
  const isProjectCoordinator = userEmail === 'christabel@gratoengineering.com';
  const isSupplyChainCoordinator = userEmail === 'lukong.lambert@gratoglobal.com';
  const isHeadOfBusiness = userEmail === 'kelvin.eyong@gratoglobal.com';

  useEffect(() => {
    loadProjectPlans();
    loadStats();
  }, [activeTab]);

  const loadProjectPlans = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'pending') {
        const result = await projectPlanAPI.getPendingApprovals();
        setProjectPlans(result.data || []);
      } else {
        const result = await projectPlanAPI.getAllPlans();
        setProjectPlans(result.data || []);
      }
    } catch (error) {
      message.error('Failed to load project plans');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Mock stats - replace with actual API call
      setStats({
        pending: 5,
        approved: 12,
        rejected: 2
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const openViewModal = (plan) => {
    setSelectedPlan(plan);
    setViewModalVisible(true);
  };

  const openActionModal = (plan, type) => {
    setSelectedPlan(plan);
    setActionType(type);
    setComments('');
    setActionModalVisible(true);
  };

  const handleAction = async () => {
    if (actionType === 'reject' && !comments) {
      message.error('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      
      let result;
      if (actionType === 'approve') {
        result = await projectPlanAPI.approvePlan(selectedPlan._id, comments);
      } else {
        result = await projectPlanAPI.rejectPlan(selectedPlan._id, comments);
      }

      if (result.success) {
        message.success(result.message);
        setActionModalVisible(false);
        setComments('');
        setSelectedPlan(null);
        await loadProjectPlans();
        await loadStats();
      } else {
        message.error(result.message || `Failed to ${actionType} project plan`);
      }
    } catch (error) {
      message.error(`Failed to ${actionType} project plan`);
    } finally {
      setLoading(false);
    }
  };

  const handleCompletionToggle = async (planId, itemId, isCompleted) => {
    try {
      setLoading(true);
      
      let result;
      if (isCompleted) {
        result = await projectPlanAPI.markItemComplete(planId, itemId);
      } else {
        result = await projectPlanAPI.unmarkItemComplete(planId, itemId);
      }

      if (result.success) {
        message.success(isCompleted ? 'Item marked as complete' : 'Item unmarked');
        
        // Update selectedPlan with new data
        setSelectedPlan(result.data);
        
        // Refresh the list
        await loadProjectPlans();
      } else {
        message.error(result.message || 'Failed to update item');
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      message.error('Failed to update completion status');
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'green',
      'MEDIUM': 'blue',
      'HIGH': 'orange',
      'CRITICAL': 'red'
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Pending Project Coordinator Approval': 'processing',
      'Pending Supply Chain Coordinator Approval': 'warning',
      'Pending Head of Business Approval': 'warning',
      'Approved': 'success',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const getApprovalLevel = (plan) => {
    if (!plan.approvalChain || plan.approvalChain.length === 0) return null;
    
    const currentApprover = plan.approvalChain.find(item => item.status === 'pending');
    return currentApprover ? currentApprover.level : null;
  };

  const canApprove = (plan) => {
    const currentLevel = getApprovalLevel(plan);
    
    if (currentLevel === 1 && isProjectCoordinator) return true;
    if (currentLevel === 2 && isSupplyChainCoordinator) return true;
    if (currentLevel === 3 && isHeadOfBusiness) return true;
    
    return false;
  };

  const columns = [
    {
      title: 'Project Name',
      dataIndex: 'projectName',
      key: 'projectName',
      width: 200,
      fixed: 'left',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Week: {record.week}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            By: {record.createdBy?.fullName}
          </Text>
        </div>
      )
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (text) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Priority',
      dataIndex: 'priorityLevel',
      key: 'priorityLevel',
      width: 100,
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      )
    },
    {
      title: 'Budget',
      dataIndex: 'amountNeeded',
      key: 'amountNeeded',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${amount?.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Timeline',
      key: 'timeline',
      width: 180,
      render: (_, record) => (
        <div>
          <Space size="small">
            <CalendarOutlined />
            <Text style={{ fontSize: '12px' }}>
              {dayjs(record.startDate).format('MMM DD')} - {dayjs(record.deadline).format('MMM DD')}
            </Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.estimatedDuration}
          </Text>
        </div>
      )
    },
    {
      title: 'Approval Status',
      key: 'approvalStatus',
      width: 200,
      render: (_, record) => {
        const currentLevel = getApprovalLevel(record);
        const approvedCount = record.approvalChain?.filter(a => a.status === 'approved').length || 0;
        const totalLevels = record.approvalChain?.length || 2;
        
        return (
          <div>
            <Tag color={getStatusColor(record.status)}>
              {record.status}
            </Tag>
            <br />
            <Text style={{ fontSize: '11px' }}>
              Level {currentLevel || approvedCount + 1} of {totalLevels}
            </Text>
          </div>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record)}
            />
          </Tooltip>
          {canApprove(record) && (
            <>
              <Tooltip title="Approve">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => openActionModal(record, 'approve')}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Approve
                </Button>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => openActionModal(record, 'reject')}
                >
                  Reject
                </Button>
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <Title level={2} style={{ margin: 0 }}>
            <ProjectOutlined /> Project Plan Approvals
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              loadProjectPlans();
              loadStats();
            }}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        <Alert
          message={`You are logged in as: ${userName}`}
          description={
            <div>
              <Text>Your approval role: </Text>
              <Text strong>
                {isProjectCoordinator && 'Project Coordinator (Level 1)'}
                {isSupplyChainCoordinator && 'Supply Chain Coordinator (Level 2)'}
                {isHeadOfBusiness && 'Head of Business (Level 3 - Final Approver)'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Approval Chain: Project Coordinator → Supply Chain Coordinator → Head of Business
              </Text>
            </div>
          }
          type="info"
          showIcon
          icon={<UserOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Statistic
                title="Pending Approvals"
                value={stats.pending}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Approved"
                value={stats.approved}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col xs={24} sm={8}>
              <Statistic
                title="Rejected"
                value={stats.rejected}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Col>
          </Row>
        </Card>

        <Space style={{ marginBottom: '16px' }}>
          <Button
            type={activeTab === 'pending' ? 'primary' : 'default'}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approvals
            {stats.pending > 0 && (
              <Badge count={stats.pending} style={{ marginLeft: '8px' }} />
            )}
          </Button>
          <Button
            type={activeTab === 'all' ? 'primary' : 'default'}
            onClick={() => setActiveTab('all')}
          >
            All Plans
          </Button>
        </Space>

        <Table
          columns={columns}
          dataSource={projectPlans}
          loading={loading}
          rowKey="_id"
          pagination={{
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} project plans`
          }}
          scroll={{ x: 1400 }}
          size="small"
        />
      </Card>

      {/* View Details Modal */}
      <Modal
        title={<Space><EyeOutlined />Project Plan Details</Space>}
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedPlan(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            Close
          </Button>,
          selectedPlan && canApprove(selectedPlan) && (
            <Button
              key="approve"
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={() => {
                setViewModalVisible(false);
                openActionModal(selectedPlan, 'approve');
              }}
              style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
            >
              Approve
            </Button>
          )
        ]}
        width={900}
      >
        {selectedPlan && (
          <div>
            <Card size="small" style={{ marginBottom: '16px' }}>
              <Title level={4}>{selectedPlan.projectName}</Title>
              <Space size="small" wrap style={{ marginBottom: '12px' }}>
                <Tag color="blue">{selectedPlan.week}</Tag>
                <Tag color={getPriorityColor(selectedPlan.priorityLevel)}>
                  {selectedPlan.priorityLevel}
                </Tag>
                <Tag color={getStatusColor(selectedPlan.status)}>
                  {selectedPlan.status}
                </Tag>
              </Space>

              <Divider style={{ margin: '12px 0' }} />

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text type="secondary">Department:</Text>
                  <br />
                  <Text strong>{selectedPlan.department}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Responsible:</Text>
                  <br />
                  <Text strong>{selectedPlan.responsible}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Start Date:</Text>
                  <br />
                  <Text strong>{dayjs(selectedPlan.startDate).format('MMMM DD, YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Deadline:</Text>
                  <br />
                  <Text strong>{dayjs(selectedPlan.deadline).format('MMMM DD, YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Duration:</Text>
                  <br />
                  <Text strong>{selectedPlan.estimatedDuration}</Text>
                </Col>
                <Col span={12}>
                  <Text type="secondary">Budget:</Text>
                  <br />
                  <Text strong style={{ color: '#52c41a', fontSize: '16px' }}>
                    ${selectedPlan.amountNeeded?.toLocaleString()}
                  </Text>
                </Col>
              </Row>
            </Card>

            <Card size="small" title="Description" style={{ marginBottom: '16px' }}>
              <Text>{selectedPlan.description}</Text>
            </Card>

            <Card size="small" title="Objectives" style={{ marginBottom: '16px' }}>
              <Text>{selectedPlan.objectives}</Text>
            </Card>

            {/* Completion Items Tracking - Only for Christabel (Project Coordinator) */}
            {isProjectCoordinator && selectedPlan.completionItems && selectedPlan.completionItems.length > 0 && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    Completion Items Tracking
                  </Space>
                }
                style={{ marginBottom: '16px', backgroundColor: '#f6ffed', borderColor: '#52c41a' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedPlan.completionItems.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: item.isCompleted ? '#f6ffed' : '#fafafa',
                        border: '1px solid ' + (item.isCompleted ? '#b7eb8f' : '#d9d9d9'),
                        borderRadius: '4px',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={item.isCompleted}
                            onChange={() => handleCompletionToggle(selectedPlan._id, item._id, !item.isCompleted)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                          />
                          <Text
                            style={{
                              textDecoration: item.isCompleted ? 'line-through' : 'none',
                              color: item.isCompleted ? '#999' : 'inherit'
                            }}
                          >
                            {item.description}
                          </Text>
                        </div>
                        {item.isCompleted && (
                          <div style={{ marginTop: '8px', paddingLeft: '26px', fontSize: '12px' }}>
                            <Text type="success">
                              ✓ Completed on {dayjs(item.completedDate).format('MMM DD, YYYY HH:mm')}
                            </Text>
                            {item.notes && (
                              <div style={{ marginTop: '4px', fontStyle: 'italic', color: '#666' }}>
                                Notes: {item.notes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {selectedPlan.issuesAndConcerns && (
              <Card 
                size="small" 
                title={
                  <Space>
                    <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                    Issues and Concerns
                  </Space>
                }
                style={{ marginBottom: '16px' }}
              >
                <Text>{selectedPlan.issuesAndConcerns}</Text>
              </Card>
            )}

            {selectedPlan.approvalChain && selectedPlan.approvalChain.length > 0 && (
              <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
                <Steps
                  current={selectedPlan.currentApprovalLevel - 1}
                  size="small"
                  items={selectedPlan.approvalChain.map((item, idx) => ({
                    title: item.role,
                    description: (
                      <div>
                        <Text style={{ fontSize: '11px' }}>{item.approver}</Text>
                        <br />
                        {item.status === 'approved' && (
                          <Text type="success" style={{ fontSize: '11px' }}>
                            ✓ Approved {dayjs(item.approvalDate).format('MMM DD')}
                          </Text>
                        )}
                        {item.status === 'pending' && (
                          <Text type="warning" style={{ fontSize: '11px' }}>
                            ⏳ Pending
                          </Text>
                        )}
                      </div>
                    ),
                    status: item.status === 'approved' ? 'finish' : item.status === 'pending' ? 'process' : 'wait'
                  }))}
                />
              </Card>
            )}

            <Card size="small" style={{ backgroundColor: '#f5f5f5' }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Submitted by: {selectedPlan.createdBy?.fullName} on {dayjs(selectedPlan.submittedDate).format('MMMM DD, YYYY HH:mm')}
              </Text>
            </Card>
          </div>
        )}
      </Modal>

      {/* Action Modal (Approve/Reject) */}
      <Modal
        title={
          <Space>
            {actionType === 'approve' ? (
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
            ) : (
              <CloseCircleOutlined style={{ color: '#f5222d' }} />
            )}
            {actionType === 'approve' ? 'Approve Project Plan' : 'Reject Project Plan'}
          </Space>
        }
        open={actionModalVisible}
        onCancel={() => {
          setActionModalVisible(false);
          setComments('');
          setSelectedPlan(null);
        }}
        onOk={handleAction}
        confirmLoading={loading}
        okText={actionType === 'approve' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: actionType === 'reject',
          style: actionType === 'approve' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}
        }}
      >
        {selectedPlan && (
          <div>
            <Alert
              message={`You are about to ${actionType} this project plan`}
              description={
                <div>
                  <Text strong>{selectedPlan.projectName}</Text>
                  <br />
                  <Text type="secondary">
                    Budget: ${selectedPlan.amountNeeded?.toLocaleString()} | 
                    Timeline: {selectedPlan.estimatedDuration}
                  </Text>
                </div>
              }
              type={actionType === 'approve' ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <div style={{ marginBottom: '16px' }}>
              <Text strong>
                Comments {actionType === 'reject' && <Text type="danger">*</Text>}
              </Text>
              <TextArea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={4}
                placeholder={
                  actionType === 'approve'
                    ? 'Add approval comments (optional)...'
                    : 'Please provide reason for rejection...'
                }
              />
              {actionType === 'reject' && !comments && (
                <Text type="danger" style={{ fontSize: '12px' }}>
                  Rejection reason is required
                </Text>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProjectPlanApprovalPortal;