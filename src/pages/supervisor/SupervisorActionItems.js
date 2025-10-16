import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Tabs,
  Empty,
  Spin,
  message,
  Badge,
  Tooltip,
  Row,
  Col,
  Progress
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  FlagOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';

const SupervisorActionItems = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('creation-approvals');
  const [creationApprovals, setCreationApprovals] = useState([]);
  const [completionApprovals, setCompletionApprovals] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'creation-approvals') {
      fetchCreationApprovals();
    } else if (activeTab === 'completion-approvals') {
      fetchCompletionApprovals();
    } else if (activeTab === 'team-tasks') {
      fetchTeamTasks();
    }
  }, [activeTab]);

  const fetchCreationApprovals = async () => {
    try {
      setLoading(true);
      const result = await actionItemAPI.getActionItems({ view: 'my-approvals' });
      
      if (result.success) {
        const pending = result.data.filter(item => item.status === 'Pending Approval');
        setCreationApprovals(pending);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching creation approvals:', error);
      message.error('Failed to load tasks pending approval');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompletionApprovals = async () => {
    try {
      setLoading(true);
      const result = await actionItemAPI.getActionItems({ view: 'my-approvals' });
      
      if (result.success) {
        const pending = result.data.filter(item => item.status === 'Pending Completion Approval');
        setCompletionApprovals(pending);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching completion approvals:', error);
      message.error('Failed to load completion approvals');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamTasks = async () => {
    try {
      setLoading(true);
      const result = await actionItemAPI.getActionItems({ view: 'team-tasks' });
      
      if (result.success) {
        setTeamTasks(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error fetching team tasks:', error);
      message.error('Failed to load team tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = (taskId, type) => {
    if (type === 'creation') {
      navigate(`/supervisor/action-items/approve-creation/${taskId}`);
    } else if (type === 'completion') {
      navigate(`/supervisor/action-items/approve-completion/${taskId}`);
    } else {
      navigate(`/supervisor/action-items/${taskId}`);
    }
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'Pending Approval': { color: 'warning', icon: <ClockCircleOutlined /> },
      'Not Started': { color: 'default', icon: <ClockCircleOutlined /> },
      'In Progress': { color: 'processing', icon: <PlayCircleOutlined /> },
      'Pending Completion Approval': { color: 'cyan', icon: <FileTextOutlined /> },
      'Completed': { color: 'success', icon: <CheckCircleOutlined /> },
      'Rejected': { color: 'error', icon: <CloseCircleOutlined /> },
      'On Hold': { color: 'warning', icon: <ClockCircleOutlined /> }
    };

    const config = statusConfig[status] || { color: 'default', icon: null };
    return <Tag color={config.color} icon={config.icon}>{status}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityConfig = {
      'LOW': { color: 'green', label: '🟢 Low' },
      'MEDIUM': { color: 'blue', label: '🟡 Medium' },
      'HIGH': { color: 'orange', label: '🟠 High' },
      'CRITICAL': { color: 'red', label: '🔴 Critical' }
    };

    const config = priorityConfig[priority] || { color: 'default', label: priority };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const creationApprovalsColumns = [
    {
      title: 'Task ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => <Tag color="blue">TASK-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      dataIndex: ['assignedTo', 'fullName'],
      key: 'employee',
      width: 180
    },
    {
      title: 'Task Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<CheckCircleOutlined />}
          onClick={() => handleViewTask(record._id, 'creation')}
        >
          Review
        </Button>
      )
    }
  ];

  const completionApprovalsColumns = [
    {
      title: 'Task ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => <Tag color="blue">TASK-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      dataIndex: ['assignedTo', 'fullName'],
      key: 'employee',
      width: 180
    },
    {
      title: 'Task Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: {
        showTitle: false,
      },
      render: (text) => (
        <Tooltip title={text}>
          {text}
        </Tooltip>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 120,
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress) => (
        <Progress percent={progress} size="small" status="success" />
      )
    },
    {
      title: 'Documents',
      dataIndex: 'completionDocuments',
      key: 'documents',
      width: 100,
      render: (documents) => (
        <Badge 
          count={documents?.length || 0} 
          showZero 
          style={{ backgroundColor: '#1890ff' }}
        />
      )
    },
    {
      title: 'Submitted',
      dataIndex: 'updatedAt',
      key: 'submittedDate',
      width: 120,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          type="primary"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => handleViewTask(record._id, 'completion')}
        >
          Review
        </Button>
      )
    }
  ];

  const teamTasksColumns = [
    {
      title: 'Task ID',
      dataIndex: '_id',
      key: '_id',
      width: 120,
      render: (id) => <Tag color="blue">TASK-{id.toString().slice(-6).toUpperCase()}</Tag>
    },
    {
      title: 'Employee',
      dataIndex: ['assignedTo', 'fullName'],
      key: 'employee',
      width: 150
    },
    {
      title: 'Task Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority) => getPriorityTag(priority)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 180,
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Progress',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (progress) => (
        <Progress percent={progress} size="small" />
      )
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date) => new Date(date).toLocaleDateString('en-GB')
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => handleViewTask(record._id, 'view')}
        >
          View
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: '24px', color: '#faad14', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Creation Approvals</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {creationApprovals.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <FileTextOutlined style={{ fontSize: '24px', color: '#1890ff', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Completion Approvals</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {completionApprovals.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <PlayCircleOutlined style={{ fontSize: '24px', color: '#52c41a', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Team Tasks</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {teamTasks.length}
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '24px', color: '#722ed1', marginBottom: '8px' }} />
              <div style={{ fontSize: '12px', color: '#666' }}>Completed</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold' }}>
                {teamTasks.filter(t => t.status === 'Completed').length}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'creation-approvals',
            label: (
              <span>
                <ClockCircleOutlined />
                Task Creation Approvals
                {creationApprovals.length > 0 && (
                  <Badge 
                    count={creationApprovals.length} 
                    style={{ marginLeft: '8px', backgroundColor: '#ff4d4f' }}
                  />
                )}
              </span>
            ),
            children: (
              <Card>
                <Spin spinning={loading}>
                  {creationApprovals.length === 0 ? (
                    <Empty description="No tasks pending creation approval" />
                  ) : (
                    <Table
                      columns={creationApprovalsColumns}
                      dataSource={creationApprovals}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1200 }}
                    />
                  )}
                </Spin>
              </Card>
            )
          },
          {
            key: 'completion-approvals',
            label: (
              <span>
                <FileTextOutlined />
                Completion Approvals
                {completionApprovals.length > 0 && (
                  <Badge 
                    count={completionApprovals.length} 
                    style={{ marginLeft: '8px', backgroundColor: '#1890ff' }}
                  />
                )}
              </span>
            ),
            children: (
              <Card>
                <Spin spinning={loading}>
                  {completionApprovals.length === 0 ? (
                    <Empty description="No tasks pending completion approval" />
                  ) : (
                    <Table
                      columns={completionApprovalsColumns}
                      dataSource={completionApprovals}
                      rowKey="_id"
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1400 }}
                    />
                  )}
                </Spin>
              </Card>
            )
          },
          {
            key: 'team-tasks',
            label: (
              <span>
                <PlayCircleOutlined />
                Team Tasks Overview
              </span>
            ),
            children: (
              <Card>
                <Spin spinning={loading}>
                  {teamTasks.length === 0 ? (
                    <Empty description="No team tasks found" />
                  ) : (
                    <Table
                      columns={teamTasksColumns}
                      dataSource={teamTasks}
                      rowKey="_id"
                      pagination={{ pageSize: 15 }}
                      scroll={{ x: 1300 }}
                    />
                  )}
                </Spin>
              </Card>
            )
          }
        ]}
      />
    </div>
  );
};

export default SupervisorActionItems;