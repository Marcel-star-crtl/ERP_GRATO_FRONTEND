import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Timeline,
  Input,
  Select,
  Tabs,
  Badge,
  Drawer,
  message,
  Form,
  Avatar,
  Tooltip,
  Divider,
  Spin,
  Empty
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  ExportOutlined,
  TagOutlined,
  TruckOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LoadingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_UR || 'http://localhost:5001/api';

// Enhanced API Service Functions with better error handling
const apiService = {
  // Get supply chain requisitions with debug logging
  getSupplyChainRequisitions: async () => {
    try {
      console.log('Fetching supply chain requisitions...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/supply-chain`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Supply chain requisitions response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getSupplyChainRequisitions:', error);
      throw error;
    }
  },

  // Get available buyers with enhanced logging
  getAvailableBuyers: async () => {
    try {
      console.log('Fetching available buyers...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/buyers/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Available buyers response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getAvailableBuyers:', error);
      throw error;
    }
  },

  // Assign buyer to requisition
  assignBuyer: async (requisitionId, assignmentData) => {
    try {
      console.log('Assigning buyer:', { requisitionId, assignmentData });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/${requisitionId}/assign-buyer`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(assignmentData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Buyer assignment response:', data);
      return data;
    } catch (error) {
      console.error('API Error - assignBuyer:', error);
      throw error;
    }
  },

  // Get buyer requisitions
  getBuyerRequisitions: async () => {
    try {
      console.log('Fetching buyer requisitions...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/buyer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Buyer requisitions response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getBuyerRequisitions:', error);
      throw error;
    }
  }
};

const EnhancedSupplyChainRequisitionManagement = () => {
  // State Management
  const [requisitions, setRequisitions] = useState([]);
  const [availableBuyers, setAvailableBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [assignmentForm] = Form.useForm();

  // Assignment form fields
  const [assignedBuyer, setAssignedBuyer] = useState('');
  const [purchaseType, setPurchaseType] = useState('');
  const [sourcingType, setSourcingType] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [comments, setComments] = useState('');

  // Initial data loading
  useEffect(() => {
    fetchRequisitions();
    fetchAvailableBuyers();
  }, []);

  // API Functions with enhanced error handling
  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSupplyChainRequisitions();
      if (response.success) {
        setRequisitions(response.data || []);
        console.log('Loaded requisitions:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to fetch requisitions');
        setRequisitions([]);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      message.error('Failed to fetch requisitions. Please check your connection and try again.');
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBuyers = async () => {
    setBuyersLoading(true);
    try {
      const response = await apiService.getAvailableBuyers();
      if (response.success) {
        setAvailableBuyers(response.data || []);
        console.log('Loaded buyers:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to fetch available buyers');
        setAvailableBuyers([]);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      message.warning('Failed to fetch available buyers. Assignment functionality may be limited.');
      setAvailableBuyers([]);
    } finally {
      setBuyersLoading(false);
    }
  };

  // Status and Urgency Tag Functions
  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supply_chain_review': { color: 'orange', text: 'Pending Review', icon: <ClockCircleOutlined /> },
      'pending_buyer_assignment': { color: 'blue', text: 'Ready for Assignment', icon: <UserOutlined /> },
      'pending_head_approval': { color: 'purple', text: 'Pending Head Approval', icon: <ClockCircleOutlined /> },
      'supply_chain_approved': { color: 'green', text: 'Approved & Assigned', icon: <CheckCircleOutlined /> },
      'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
      'supply_chain_rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
      'procurement_complete': { color: 'green', text: 'Procurement Complete', icon: <CheckCircleOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <TruckOutlined /> }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
  };

  const getPurchaseTypeTag = (type) => {
    const typeMap = {
      'standard': { color: 'blue', text: 'Standard Purchase' },
      'non_standard': { color: 'orange', text: 'Non-Standard Purchase' },
      'emergency': { color: 'red', text: 'Emergency Purchase' },
      'framework': { color: 'purple', text: 'Framework Agreement' },
      'capital': { color: 'gold', text: 'Capital Equipment' }
    };

    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getSourcingTypeTag = (type) => {
    const typeMap = {
      'direct_purchase': { color: 'green', text: 'Direct Purchase' },
      'quotation_required': { color: 'blue', text: 'Quotation Required' },
      'tender_process': { color: 'purple', text: 'Tender Process' },
      'framework_agreement': { color: 'gold', text: 'Framework Agreement' }
    };

    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  // Form Reset Function
  const resetAssignmentForm = () => {
    setAssignedBuyer('');
    setPurchaseType('');
    setSourcingType('');
    setEstimatedCost('');
    setComments('');
    assignmentForm.resetFields();
  };

  // Auto-populate suggestions based on requisition
  const populateSuggestions = (requisition) => {
    if (!requisition) return;

    const budget = requisition.financeVerification?.assignedBudget || requisition.budgetXAF || 0;
    const urgency = requisition.urgency;

    // Suggest purchase type
    let suggestedPurchaseType = 'standard';
    if (urgency === 'High') {
      suggestedPurchaseType = 'emergency';
    } else if (budget > 3000000) {
      suggestedPurchaseType = 'capital';
    } else if (['Equipment', 'Software', 'Hardware'].includes(requisition.itemCategory)) {
      suggestedPurchaseType = 'non_standard';
    }

    // Suggest sourcing type
    let suggestedSourcingType = 'direct_purchase';
    if (budget > 5000000) {
      suggestedSourcingType = 'tender_process';
    } else if (budget > 1000000) {
      suggestedSourcingType = 'quotation_required';
    }

    // Suggest buyer
    const suitableBuyer = getSuitableBuyer(requisition);

    // Update form
    setPurchaseType(suggestedPurchaseType);
    setSourcingType(suggestedSourcingType);
    if (suitableBuyer) {
      setAssignedBuyer(suitableBuyer._id);
    }

    // Update Ant Design form
    assignmentForm.setFieldsValue({
      purchaseType: suggestedPurchaseType,
      sourcingType: suggestedSourcingType,
      assignedBuyer: suitableBuyer?._id,
      estimatedCost: budget || undefined
    });
  };

  // Helper Functions
  const getSuitableBuyer = (requisition) => {
    const estimatedValue = requisition.financeVerification?.assignedBudget || requisition.budgetXAF || 0;

    return availableBuyers.find(buyer => {
      // Check max order value
      if (estimatedValue > (buyer.buyerDetails?.maxOrderValue || 1000000)) return false;

      // Check specializations
      const specializations = buyer.buyerDetails?.specializations || [];
      if (specializations.includes('All')) return true;

      const itemCategory = requisition.itemCategory?.replace(' ', '_');
      return specializations.includes(itemCategory) || specializations.includes('General');
    });
  };

  // Assignment Handler
  const handleBuyerAssignment = async () => {
    try {
      // Validate form
      const values = await assignmentForm.validateFields();
      
      if (!assignedBuyer) {
        message.error('Please select a buyer');
        return;
      }
      if (!purchaseType) {
        message.error('Please select purchase type');
        return;
      }
      if (!sourcingType) {
        message.error('Please select sourcing type');
        return;
      }
      if (!comments) {
        message.error('Please provide comments');
        return;
      }

      setAssignmentLoading(true);

      const assignmentData = {
        sourcingType,
        assignedBuyer,
        comments,
        purchaseType,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined
      };

      console.log('Submitting assignment:', assignmentData);

      const response = await apiService.assignBuyer(selectedRequisition._id, assignmentData);

      if (response.success) {
        message.success('Buyer assigned successfully!');
        setDetailDrawerVisible(false);
        resetAssignmentForm();
        await fetchRequisitions(); // Refresh data
      } else {
        message.error(response.message || 'Failed to assign buyer');
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Assignment error:', error);
        message.error('Failed to assign buyer. Please try again.');
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  // View Details Handler
  const handleViewDetails = (requisition) => {
    console.log('Viewing requisition:', requisition);
    setSelectedRequisition(requisition);
    setDetailDrawerVisible(true);
    resetAssignmentForm();
    
    // Auto-populate suggestions for pending requisitions
    if (['pending_supply_chain_review', 'pending_buyer_assignment'].includes(requisition.status)) {
      setTimeout(() => populateSuggestions(requisition), 100);
    }
  };

  // Filter requisitions by tab
  const getFilteredRequisitions = () => {
    switch (activeTab) {
      case 'pending':
        return requisitions.filter(r => 
          ['pending_supply_chain_review', 'pending_buyer_assignment'].includes(r.status)
        );
      case 'assigned':
        return requisitions.filter(r => 
          ['pending_head_approval', 'supply_chain_approved'].includes(r.status)
        );
      case 'approved':
        return requisitions.filter(r => 
          ['approved', 'in_procurement'].includes(r.status)
        );
      case 'completed':
        return requisitions.filter(r => 
          ['procurement_complete', 'delivered'].includes(r.status)
        );
      case 'rejected':
        return requisitions.filter(r => r.status === 'supply_chain_rejected');
      default:
        return requisitions;
    }
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Requisition Details',
      key: 'requisition',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            REQ-{record._id?.slice(-6).toUpperCase() || 'N/A'}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.itemCategory}</Tag>
          {record.purchaseType && getPurchaseTypeTag(record.purchaseType)}
        </div>
      ),
      width: 220
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.department || record.department}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Budget Info',
      key: 'budget',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            XAF {(record.financeVerification?.assignedBudget || record.budgetXAF)?.toLocaleString() || 'TBD'}
          </Text>
          <br />
          {record.financeVerification?.budgetCode && (
            <Tag size="small" color="gold">
              <TagOutlined /> {record.financeVerification.budgetCode}
            </Tag>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Items',
      key: 'itemCount',
      render: (_, record) => record.items?.length || 0,
      align: 'center',
      width: 70
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 160
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Assignment',
      key: 'assignment',
      render: (_, record) => {
        if (record.supplyChainReview?.assignedBuyer) {
          const buyer = availableBuyers.find(b => b._id === record.supplyChainReview.assignedBuyer) ||
                       { fullName: 'Assigned Buyer' };
          return (
            <div>
              <div>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text style={{ marginLeft: 8 }}>
                  {buyer.fullName}
                </Text>
              </div>
              {record.supplyChainReview.sourcingType && (
                <div style={{ marginTop: '4px' }}>
                  {getSourcingTypeTag(record.supplyChainReview.sourcingType)}
                </div>
              )}
            </div>
          );
        }
        return <Text type="secondary">Not assigned</Text>;
      },
      width: 180
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>

          {['pending_supply_chain_review', 'pending_buyer_assignment'].includes(record.status) && (
            <Tooltip title="Assign Buyer">
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleViewDetails(record)}
              >
                Assign
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  // Statistics calculation
  const filteredData = getFilteredRequisitions();
  const stats = {
    pending: requisitions.filter(r => 
      ['pending_supply_chain_review', 'pending_buyer_assignment'].includes(r.status)
    ).length,
    assigned: requisitions.filter(r => 
      ['pending_head_approval', 'supply_chain_approved'].includes(r.status)
    ).length,
    approved: requisitions.filter(r => 
      ['approved', 'in_procurement'].includes(r.status)
    ).length,
    completed: requisitions.filter(r => 
      ['procurement_complete', 'delivered'].includes(r.status)
    ).length,
    rejected: requisitions.filter(r => r.status === 'supply_chain_rejected').length
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> Supply Chain - Purchase Requisitions
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchRequisitions();
                fetchAvailableBuyers();
              }}
              loading={loading || buyersLoading}
            >
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={5}>
            <Statistic
              title="Pending Review/Assignment"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Assigned/Awaiting Approval"
              value={stats.assigned}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Approved/In Progress"
              value={stats.approved}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Available Buyers"
              value={availableBuyers.length}
              prefix={buyersLoading ? <LoadingOutlined /> : <TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {/* Available Buyers Summary */}
        <Card size="small" title="Available Buyers Overview" style={{ marginBottom: '16px' }}>
          {buyersLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="small" />
              <Text style={{ marginLeft: '8px' }}>Loading buyers...</Text>
            </div>
          ) : availableBuyers.length === 0 ? (
            <Alert 
              message="No Buyers Available" 
              description="No buyers are currently available for assignment. Please check system configuration."
              type="warning" 
              showIcon
            />
          ) : (
            <Row gutter={16}>
              {availableBuyers.map((buyer, index) => (
                <Col key={buyer._id || index} span={8} style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <Text strong>{buyer.fullName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Max: XAF {(buyer.buyerDetails?.maxOrderValue || 1000000).toLocaleString()}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          Workload: {buyer.buyerDetails?.workload?.currentAssignments || 0}/{buyer.buyerDetails?.workload?.monthlyTarget || 20}
                        </Text>
                        <br />
                        {buyer.buyerDetails?.specializations?.slice(0, 2).map(spec => (
                          <Tag key={spec} size="small" color="blue">
                            {spec.replace('_', ' ')}
                          </Tag>
                        ))}
                      </div>
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        {/* Tabs for different statuses */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending Review/Assignment ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          >
            {filteredData.length === 0 && !loading ? (
              <Empty
                description="No requisitions pending review or assignment"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <Badge count={stats.assigned} size="small">
                <span><UserOutlined /> Assigned/Awaiting Approval ({stats.assigned})</span>
              </Badge>
            } 
            key="assigned"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><ShoppingCartOutlined /> Approved/In Progress ({stats.approved})</span>
            } 
            key="approved"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><CheckCircleOutlined /> Completed ({stats.completed})</span>
            } 
            key="completed"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><CloseCircleOutlined /> Rejected ({stats.rejected})</span>
            } 
            key="rejected"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Enhanced Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details & Assignment
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
          resetAssignmentForm();
        }}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Information */}
            <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requisition ID">
                  <Text code>{selectedRequisition._id?.slice(-8).toUpperCase() || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRequisition.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  {selectedRequisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Requester">
                  <div>
                    <UserOutlined /> {selectedRequisition.employee?.fullName}
                    <br />
                    <Text type="secondary">{selectedRequisition.employee?.department || selectedRequisition.department}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget (XAF)">
                  <DollarOutlined /> {selectedRequisition.budgetXAF ? selectedRequisition.budgetXAF.toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  <CalendarOutlined /> {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Finance Verification Details */}
            {selectedRequisition.financeVerification && (
              <Card size="small" title="Finance Verification" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Budget Available">
                    <Tag color={selectedRequisition.financeVerification.budgetAvailable ? 'green' : 'red'}>
                      {selectedRequisition.financeVerification.budgetAvailable ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assigned Budget">
                    <Text strong style={{ color: '#1890ff' }}>
                      XAF {selectedRequisition.financeVerification.assignedBudget?.toLocaleString() || 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Budget Code">
                    <Tag color="gold">
                      <TagOutlined /> {selectedRequisition.financeVerification.budgetCode || 'N/A'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Verification Date">
                    {selectedRequisition.financeVerification.verificationDate ? 
                      new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') : 
                      'Pending'
                    }
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Items List */}
            <Card size="small" title={`Items to Procure (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
                  { title: 'Unit', dataIndex: 'measuringUnit', key: 'unit', width: 80, align: 'center' }
                ]}
                dataSource={selectedRequisition.items}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
              />
            </Card>

            {/* Business Justification */}
            <Card size="small" title="Business Justification" style={{ marginBottom: '16px' }}>
              <Text>{selectedRequisition.justificationOfPurchase}</Text>
            </Card>

            {/* Assignment Form */}
            {['pending_supply_chain_review', 'pending_buyer_assignment'].includes(selectedRequisition.status) && (
              <Card size="small" title="Buyer Assignment" style={{ marginBottom: '16px' }}>
                <Alert
                  message="Assign Buyer for Procurement"
                  description="Complete the buyer assignment by selecting purchase type, sourcing method, and assigning a qualified buyer."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Form
                  form={assignmentForm}
                  layout="vertical"
                  onFinish={handleBuyerAssignment}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="purchaseType"
                        label="Purchase Type"
                        rules={[{ required: true, message: 'Please select purchase type' }]}
                      >
                        <Select 
                          placeholder="Select purchase type"
                          value={purchaseType}
                          onChange={setPurchaseType}
                        >
                          <Option value="standard">Standard Purchase</Option>
                          <Option value="non_standard">Non-Standard Purchase</Option>
                          <Option value="emergency">Emergency Purchase</Option>
                          <Option value="framework">Framework Agreement</Option>
                          <Option value="capital">Capital Equipment</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="sourcingType"
                        label="Sourcing Method"
                        rules={[{ required: true, message: 'Please select sourcing method' }]}
                      >
                        <Select 
                          placeholder="Select sourcing method"
                          value={sourcingType}
                          onChange={setSourcingType}
                        >
                          <Option value="direct_purchase">Direct Purchase</Option>
                          <Option value="quotation_required">Quotation Required</Option>
                          <Option value="tender_process">Tender Process</Option>
                          <Option value="framework_agreement">Framework Agreement</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="assignedBuyer"
                        label="Assign Buyer"
                        rules={[{ required: true, message: 'Please assign a buyer' }]}
                      >
                        <Select 
                          placeholder="Select buyer"
                          value={assignedBuyer}
                          onChange={setAssignedBuyer}
                          showSearch
                          filterOption={(input, option) =>
                            option.children.props.children[1].props.children[0].props.children
                              .toLowerCase()
                              .indexOf(input.toLowerCase()) >= 0
                          }
                          loading={buyersLoading}
                          notFoundContent={buyersLoading ? <Spin size="small" /> : 'No buyers available'}
                        >
                          {availableBuyers.map(buyer => {
                            const estimatedValue = selectedRequisition.financeVerification?.assignedBudget || selectedRequisition.budgetXAF || 0;
                            const canHandle = estimatedValue <= (buyer.buyerDetails?.maxOrderValue || 1000000);
                            const specializations = buyer.buyerDetails?.specializations || [];
                            const hasSpecialization = specializations.includes('All') || 
                                                    specializations.includes(selectedRequisition.itemCategory?.replace(' ', '_')) ||
                                                    specializations.includes('General');

                            return (
                              <Option 
                                key={buyer._id} 
                                value={buyer._id}
                                disabled={!canHandle}
                              >
                                <div>
                                  <Space>
                                    <Avatar size="small" icon={<UserOutlined />} />
                                    <div>
                                      <Text strong style={{ color: canHandle ? '#000' : '#999' }}>
                                        {buyer.fullName}
                                      </Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: '11px' }}>
                                        Max: XAF {(buyer.buyerDetails?.maxOrderValue || 1000000).toLocaleString()}
                                        {hasSpecialization && ' | Specialized'}
                                      </Text>
                                      <br />
                                      <Text type="secondary" style={{ fontSize: '10px' }}>
                                        Workload: {buyer.buyerDetails?.workload?.currentAssignments || 0}/{buyer.buyerDetails?.workload?.monthlyTarget || 20}
                                      </Text>
                                    </div>
                                  </Space>
                                </div>
                              </Option>
                            );
                          })}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="estimatedCost"
                        label="Estimated Cost (XAF)"
                      >
                        <Input 
                          type="number" 
                          placeholder="Enter estimated cost"
                          prefix={<DollarOutlined />}
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="comments"
                    label="Assignment Comments"
                    rules={[{ required: true, message: 'Please provide assignment comments' }]}
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="Enter assignment instructions, special requirements, or delivery notes..."
                      showCount
                      maxLength={500}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </Form.Item>

                  <Space style={{ marginTop: '16px' }}>
                    <Button 
                      type="primary" 
                      loading={assignmentLoading}
                      icon={<SendOutlined />}
                      onClick={handleBuyerAssignment}
                    >
                      Assign Buyer
                    </Button>
                    <Button 
                      onClick={() => populateSuggestions(selectedRequisition)}
                      icon={<ReloadOutlined />}
                    >
                      Auto-Suggest
                    </Button>
                    <Button onClick={resetAssignmentForm}>
                      Clear Form
                    </Button>
                  </Space>
                </Form>
              </Card>
            )}

            {/* Assignment Details (for completed assignments) */}
            {selectedRequisition.supplyChainReview?.assignedBuyer && (
              <Card size="small" title="Assignment Details" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Assigned Buyer">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong>
                        {availableBuyers.find(b => b._id === selectedRequisition.supplyChainReview.assignedBuyer)?.fullName || 'Assigned Buyer'}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignment Date">
                    {selectedRequisition.supplyChainReview.buyerAssignmentDate ? 
                      new Date(selectedRequisition.supplyChainReview.buyerAssignmentDate).toLocaleDateString('en-GB') : 
                      'N/A'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Sourcing Type">
                    {selectedRequisition.supplyChainReview.sourcingType && 
                      getSourcingTypeTag(selectedRequisition.supplyChainReview.sourcingType)
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Purchase Type">
                    {selectedRequisition.purchaseType && getPurchaseTypeTag(selectedRequisition.purchaseType)}
                  </Descriptions.Item>
                  {selectedRequisition.supplyChainReview.comments && (
                    <Descriptions.Item label="Assignment Notes" span={2}>
                      <Text italic>{selectedRequisition.supplyChainReview.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Status Timeline */}
            <Card size="small" title="Process Timeline" style={{ marginBottom: '16px' }}>
              <Timeline>
                <Timeline.Item 
                  color="blue" 
                  dot={<ClockCircleOutlined />}
                >
                  <Text strong>Requisition Submitted</Text>
                  <br />
                  <Text type="secondary">
                    {new Date(selectedRequisition.createdAt || Date.now()).toLocaleDateString('en-GB')}
                  </Text>
                </Timeline.Item>
                
                {selectedRequisition.financeVerification && (
                  <Timeline.Item 
                    color="gold" 
                    dot={<BankOutlined />}
                  >
                    <Text strong>Finance Verification Complete</Text>
                    <br />
                    <Text type="secondary">
                      Budget: XAF {selectedRequisition.financeVerification.assignedBudget?.toLocaleString()}
                    </Text>
                  </Timeline.Item>
                )}
                
                {selectedRequisition.supplyChainReview?.assignedBuyer && (
                  <Timeline.Item 
                    color="green" 
                    dot={<UserOutlined />}
                  >
                    <Text strong>Buyer Assigned</Text>
                    <br />
                    <Text type="secondary">
                      Buyer: {availableBuyers.find(b => b._id === selectedRequisition.supplyChainReview.assignedBuyer)?.fullName || 'Assigned'}
                    </Text>
                  </Timeline.Item>
                )}
                
                {selectedRequisition.status === 'pending_head_approval' && (
                  <Timeline.Item 
                    color="orange" 
                    dot={<ClockCircleOutlined />}
                  >
                    <Text strong>Awaiting Head Approval</Text>
                    <br />
                    <Text type="secondary">Pending final approval from Head of Supply Chain</Text>
                  </Timeline.Item>
                )}
                
                {['approved', 'in_procurement', 'procurement_complete', 'delivered'].includes(selectedRequisition.status) && (
                  <Timeline.Item 
                    color="green" 
                    dot={<CheckCircleOutlined />}
                  >
                    <Text strong>
                      {selectedRequisition.status === 'approved' ? 'Fully Approved' :
                       selectedRequisition.status === 'in_procurement' ? 'In Procurement' :
                       selectedRequisition.status === 'procurement_complete' ? 'Procurement Complete' : 'Delivered'}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {selectedRequisition.status === 'approved' ? 'Ready for procurement' :
                       selectedRequisition.status === 'in_procurement' ? 'Buyer is procuring items' :
                       selectedRequisition.status === 'procurement_complete' ? 'Items ready for delivery' : 
                       'Items delivered to requester'}
                    </Text>
                  </Timeline.Item>
                )}
              </Timeline>
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default EnhancedSupplyChainRequisitionManagement;



