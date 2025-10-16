import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Modal, Tag, Space, Typography, 
  Descriptions, Timeline, message, Row, Col, Statistic, 
  Tabs, Select, Input, DatePicker
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, 
  ClockCircleOutlined, EyeOutlined, ReloadOutlined,
  DollarOutlined, BarChartOutlined, TagOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { budgetCodeAPI } from '../../services/budgetCodeAPI';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const AdminBudgetCodeApprovals = () => {
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    rejected: 0,
    totalBudget: 0,
    totalUsed: 0,
    utilization: 0
  });

  useEffect(() => {
    fetchBudgetCodes();
  }, []);

  const fetchBudgetCodes = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await budgetCodeAPI.getBudgetCodes(filters);
      
      if (response.success) {
        setBudgetCodes(response.data);
        calculateStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching budget codes:', error);
      message.error('Failed to fetch budget codes');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (codes) => {
    const activeCodes = codes.filter(bc => bc.active);
    const pendingCodes = codes.filter(bc => 
      bc.status.includes('pending') && !bc.active
    );
    const rejectedCodes = codes.filter(bc => bc.status === 'rejected');
    
    const totalBudget = activeCodes.reduce((sum, bc) => sum + bc.budget, 0);
    const totalUsed = activeCodes.reduce((sum, bc) => sum + (bc.used || 0), 0);
    const utilization = totalBudget > 0 ? Math.round((totalUsed / totalBudget) * 100) : 0;
    
    setStats({
      total: codes.length,
      active: activeCodes.length,
      pending: pendingCodes.length,
      rejected: rejectedCodes.length,
      totalBudget,
      totalUsed,
      utilization
    });
  };

  const handleViewDetails = (budgetCode) => {
    setSelectedBudgetCode(budgetCode);
    setDetailsModalVisible(true);
  };

  const handleViewHistory = async (budgetCode) => {
    try {
      setLoading(true);
      const response = await budgetCodeAPI.getApprovalHistory(budgetCode._id);
      
      if (response.success) {
        setSelectedBudgetCode(response.data);
        setHistoryModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching approval history:', error);
      message.error('Failed to fetch approval history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_departmental_approval': { color: 'orange', text: 'Pending Department' },
      'pending_head_of_business': { color: 'blue', text: 'Pending Executive' },
      'pending_finance_activation': { color: 'purple', text: 'Pending Finance' },
      'active': { color: 'green', text: 'Active' },
      'inactive': { color: 'default', text: 'Inactive' },
      'rejected': { color: 'red', text: 'Rejected' },
      'suspended': { color: 'volcano', text: 'Suspended' }
    };
    
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getFilteredBudgetCodes = () => {
    let filtered = budgetCodes;
    
    // Filter by tab
    switch (activeTab) {
      case 'active':
        filtered = filtered.filter(bc => bc.active);
        break;
      case 'pending':
        filtered = filtered.filter(bc => bc.status.includes('pending') && !bc.active);
        break;
      case 'rejected':
        filtered = filtered.filter(bc => bc.status === 'rejected');
        break;
      case 'all':
      default:
        break;
    }
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(bc =>
        bc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bc.department.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const columns = [
    {
      title: 'Budget Code',
      dataIndex: 'code',
      key: 'code',
      render: (code, record) => (
        <div>
          <Text strong code>{code}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'budgetType',
      key: 'budgetType',
      render: (type) => (
        <Tag color="blue">{type.replace('_', ' ').toUpperCase()}</Tag>
      ),
      width: 120
    },
    {
      title: 'Budget / Used',
      key: 'budget',
      render: (_, record) => (
        <div>
          <Text strong>XAF {record.budget.toLocaleString()}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Used: XAF {(record.used || 0).toLocaleString()}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Utilization',
      key: 'utilization',
      render: (_, record) => {
        const percent = record.budget > 0 
          ? Math.round(((record.used || 0) / record.budget) * 100) 
          : 0;
        
        let color = '#52c41a';
        if (percent >= 90) color = '#ff4d4f';
        else if (percent >= 75) color = '#fa8c16';
        
        return (
          <Text style={{ color }}>{percent}%</Text>
        );
      },
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 130
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      width: 100
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
            icon={<FileSearchOutlined />}
            onClick={() => handleViewHistory(record)}
          >
            History
          </Button>
        </Space>
      ),
      width: 150,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TagOutlined /> Budget Code Management
          </Title>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => fetchBudgetCodes()}
            loading={loading}
          >
            Refresh
          </Button>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Budget Codes"
                value={stats.total}
                prefix={<TagOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Active Codes"
                value={stats.active}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Budget"
                value={`XAF ${stats.totalBudget.toLocaleString()}`}
                valueStyle={{ color: '#1890ff' }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Utilization"
                value={stats.utilization}
                suffix="%"
                valueStyle={{ color: stats.utilization >= 75 ? '#fa8c16' : '#52c41a' }}
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Search */}
        <Search
          placeholder="Search by code, name, or department"
          allowClear
          enterButton
          style={{ marginBottom: '16px', maxWidth: '400px' }}
          onSearch={setSearchTerm}
          onChange={(e) => !e.target.value && setSearchTerm('')}
        />

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane 
            tab={<span>All <Tag>{stats.total}</Tag></span>}
            key="all"
          >
            <Table
              columns={columns}
              dataSource={getFilteredBudgetCodes()}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `${total} budget codes`
              }}
            />
          </TabPane>
          <TabPane 
            tab={<span>Active <Tag color="green">{stats.active}</Tag></span>}
            key="active"
          >
            <Table
              columns={columns}
              dataSource={getFilteredBudgetCodes()}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `${total} active budget codes`
              }}
            />
          </TabPane>
          <TabPane 
            tab={<span>Pending <Tag color="orange">{stats.pending}</Tag></span>}
            key="pending"
          >
            <Table
              columns={columns}
              dataSource={getFilteredBudgetCodes()}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `${total} pending approvals`
              }}
            />
          </TabPane>
          <TabPane 
            tab={<span>Rejected <Tag color="red">{stats.rejected}</Tag></span>}
            key="rejected"
          >
            <Table
              columns={columns}
              dataSource={getFilteredBudgetCodes()}
              loading={loading}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                showSizeChanger: true,
                showTotal: (total) => `${total} rejected`
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Details Modal */}
      <Modal
        title="Budget Code Details"
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedBudgetCode(null);
        }}
        footer={null}
        width={900}
      >
        {selectedBudgetCode && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Budget Code" span={2}>
                <Text code strong style={{ fontSize: '16px' }}>{selectedBudgetCode.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Name" span={2}>
                {selectedBudgetCode.name}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {selectedBudgetCode.department}
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                {selectedBudgetCode.budgetType?.replace('_', ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Total Budget">
                <Text strong style={{ color: '#52c41a' }}>
                  XAF {selectedBudgetCode.budget?.toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Used">
                <Text>XAF {(selectedBudgetCode.used || 0).toLocaleString()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remaining">
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {((selectedBudgetCode.budget || 0) - (selectedBudgetCode.used || 0)).toLocaleString()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Period">
                {selectedBudgetCode.budgetPeriod?.toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {getStatusTag(selectedBudgetCode.status)}
              </Descriptions.Item>
              {selectedBudgetCode.startDate && (
                <Descriptions.Item label="Start Date">
                  {new Date(selectedBudgetCode.startDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              {selectedBudgetCode.endDate && (
                <Descriptions.Item label="End Date">
                  {new Date(selectedBudgetCode.endDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created By" span={2}>
                {selectedBudgetCode.createdBy?.fullName || 'N/A'}
              </Descriptions.Item>
              {selectedBudgetCode.description && (
                <Descriptions.Item label="Description" span={2}>
                  {selectedBudgetCode.description}
                </Descriptions.Item>
              )}
            </Descriptions>

            {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
              <Card size="small" title="Approval Status" style={{ marginTop: '20px' }}>
                <Timeline>
                  {selectedBudgetCode.approvalChain.map((step, index) => {
                    let color = 'gray';
                    let icon = <ClockCircleOutlined />;
                    
                    if (step.status === 'approved') {
                      color = 'green';
                      icon = <CheckCircleOutlined />;
                    } else if (step.status === 'rejected') {
                      color = 'red';
                      icon = <CloseCircleOutlined />;
                    } else if (step.status === 'pending') {
                      color = 'blue';
                    }

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <Text strong>{step.approver.name}</Text>
                        <br />
                        <Text type="secondary">{step.approver.role}</Text>
                        <br />
                        <Tag color={color} style={{ marginTop: '4px' }}>
                          {step.status.toUpperCase()}
                        </Tag>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </Card>
            )}
          </div>
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        title="Budget Code Approval History"
        open={historyModalVisible}
        onCancel={() => {
          setHistoryModalVisible(false);
          setSelectedBudgetCode(null);
        }}
        footer={null}
        width={900}
      >
        {selectedBudgetCode && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Budget Code">
                <Text code strong>{selectedBudgetCode.budgetCode?.code}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedBudgetCode.budgetCode?.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(selectedBudgetCode.createdAt).toLocaleDateString()}
              </Descriptions.Item>
              {selectedBudgetCode.activationDate && (
                <Descriptions.Item label="Activated">
                  {new Date(selectedBudgetCode.activationDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card size="small" title="Complete Approval Timeline" style={{ marginTop: '20px' }}>
              <Timeline>
                {selectedBudgetCode.approvalChain?.map((step, index) => {
                  let color = 'gray';
                  let icon = <ClockCircleOutlined />;
                  
                  if (step.status === 'approved') {
                    color = 'green';
                    icon = <CheckCircleOutlined />;
                  } else if (step.status === 'rejected') {
                    color = 'red';
                    icon = <CloseCircleOutlined />;
                  } else if (step.status === 'pending') {
                    color = 'blue';
                  }

                  return (
                    <Timeline.Item key={index} color={color} dot={icon}>
                      <div>
                        <Text strong>Level {step.level}: {step.approver.name}</Text>
                        <br />
                        <Text type="secondary">{step.approver.role}</Text>
                        <br />
                        <Tag color={color} style={{ marginTop: '4px' }}>
                          {step.status.toUpperCase()}
                        </Tag>
                        {step.status === 'approved' && step.actionDate && (
                          <div style={{ marginTop: '8px' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Approved on {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                            </Text>
                          </div>
                        )}
                        {step.status === 'rejected' && step.actionDate && (
                          <div style={{ marginTop: '8px' }}>
                            <Text type="danger" style={{ fontSize: '12px' }}>
                              Rejected on {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                            </Text>
                          </div>
                        )}
                        {step.comments && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                            <Text style={{ fontSize: '12px', fontStyle: 'italic' }}>
                              "{step.comments}"
                            </Text>
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  );
                })}
              </Timeline>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminBudgetCodeApprovals;