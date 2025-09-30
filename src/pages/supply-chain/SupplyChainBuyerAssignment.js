import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Typography,
  Tag,
  Space,
  Input,
  Select,
  Descriptions,
  Alert,
  Spin,
  message,
  Badge,
  Row,
  Col,
  Statistic,
  Divider,
  Tooltip,
  Avatar
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  EyeOutlined,
  SendOutlined,
  TagOutlined,
  TruckOutlined,
  BankOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const SupplyChainBuyerAssignment = () => {
  const [requisitions, setRequisitions] = useState([]);
  const [availableBuyers, setAvailableBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [assignmentModalVisible, setAssignmentModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [stats, setStats] = useState({ pending: 0, assigned: 0, approved: 0, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    fetchRequisitions();
    fetchAvailableBuyers();
    fetchStats();
  }, []);

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequisitionAPI.getSupplyChainRequisitions();
      
      if (response.success) {
        // Filter for requisitions that need buyer assignment or are pending head approval
        const filteredRequisitions = response.data.filter(req => 
          req.status === 'pending_supply_chain_review' || 
          req.status === 'pending_buyer_assignment' ||
          req.status === 'pending_head_approval'
        );
        setRequisitions(filteredRequisitions);
      } else {
        message.error(response.message || 'Failed to fetch requisitions');
      }
    } catch (error) {
      console.error('Error fetching supply chain requisitions:', error);
      message.error(error.response?.data?.message || 'Failed to fetch requisitions');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBuyers = async () => {
    try {
      const response = await purchaseRequisitionAPI.getAvailableBuyers();
      
      if (response.success) {
        setAvailableBuyers(response.data);
      } else {
        message.error('Failed to fetch available buyers');
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      message.error('Failed to fetch available buyers');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await purchaseRequisitionAPI.getDashboardStats();
      if (response.success) {
        const scStats = {
          pending: response.data.summary?.pending || 0,
          assigned: response.data.summary?.approved || 0,
          approved: response.data.summary?.approved || 0,
          total: response.data.summary?.total || 0
        };
        setStats(scStats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleBuyerAssignment = async (values) => {
    if (!selectedRequisition) return;

    try {
      setLoading(true);
      
      const assignmentData = {
        sourcingType: values.sourcingType,
        assignedBuyer: values.assignedBuyer,
        comments: values.comments
      };

      const response = await purchaseRequisitionAPI.assignBuyer(
        selectedRequisition._id,
        assignmentData
      );

      if (response.success) {
        message.success('Buyer assigned successfully');
        setAssignmentModalVisible(false);
        setSelectedRequisition(null);
        form.resetFields();
        fetchRequisitions();
        fetchStats();
      } else {
        throw new Error(response.message);
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to assign buyer');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (requisition) => {
    setSelectedRequisition(requisition);
    setDetailsModalVisible(true);
  };

  const handleStartAssignment = (requisition) => {
    setSelectedRequisition(requisition);
    
    // Pre-select suitable buyer based on item category and budget
    const suitableBuyer = getSuitableBuyer(requisition);
    
    form.setFieldsValue({
      sourcingType: 'direct_purchase',
      assignedBuyer: suitableBuyer?._id,
      comments: ''
    });
    setAssignmentModalVisible(true);
  };

  const getSuitableBuyer = (requisition) => {
    const estimatedValue = requisition.financeVerification?.assignedBudget || requisition.budgetXAF || 0;
    
    return availableBuyers.find(buyer => {
      // Check if buyer can handle the order value
      if (estimatedValue > (buyer.buyerDetails?.maxOrderValue || 1000000)) return false;
      
      // Check specialization match
      const specializations = buyer.buyerDetails?.specializations || [];
      if (specializations.includes('All')) return true;
      
      const itemCategory = requisition.itemCategory?.replace(' ', '_');
      return specializations.includes(itemCategory) || specializations.includes('General');
    });
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supply_chain_review': { color: 'blue', text: 'SC Review', icon: <ClockCircleOutlined /> },
      'pending_buyer_assignment': { color: 'orange', text: 'Assign Buyer', icon: <UserOutlined /> },
      'pending_head_approval': { color: 'purple', text: 'Head Approval', icon: <CheckCircleOutlined /> },
      'approved': { color: 'green', text: 'Approved', icon: <CheckCircleOutlined /> }
    };

    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: 'Requisition Details',
      key: 'requisition',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            REQ-{record._id.slice(-6).toUpperCase()}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.itemCategory}</Tag>
        </div>
      ),
      width: 200
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
      title: 'Current Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 130
    },
    {
      title: 'Assigned Buyer',
      key: 'buyer',
      render: (_, record) => {
        if (record.supplyChainReview?.assignedBuyer) {
          return (
            <div>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text style={{ marginLeft: 8 }}>
                {record.supplyChainReview.assignedBuyer.fullName || 'Assigned'}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                {record.supplyChainReview.sourcingType?.replace('_', ' ').toUpperCase()}
              </Text>
            </div>
          );
        }
        return <Text type="secondary">Not assigned</Text>;
      },
      width: 150
    },
    {
      title: 'Priority',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => {
        const urgencyColors = {
          'Low': 'green',
          'Medium': 'orange', 
          'High': 'red'
        };
        return <Tag color={urgencyColors[urgency] || 'default'}>{urgency}</Tag>;
      },
      width: 80
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
          
          {record.status === 'pending_supply_chain_review' && (
            <Tooltip title="Assign Buyer">
              <Button 
                size="small" 
                type="primary"
                icon={<UserOutlined />}
                onClick={() => handleStartAssignment(record)}
              >
                Assign
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 100,
      fixed: 'right'
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Supply Chain - Buyer Assignment & Sourcing
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchRequisitions();
                fetchAvailableBuyers();
                fetchStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {/* Statistics Overview */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Pending Assignment"
                value={requisitions.filter(r => r.status === 'pending_supply_chain_review').length}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Assigned to Buyers"
                value={requisitions.filter(r => r.status === 'pending_head_approval').length}
                valueStyle={{ color: '#faad14' }}
                prefix={<UserOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Available Buyers"
                value={availableBuyers.length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<TeamOutlined />}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Fully Approved"
                value={requisitions.filter(r => r.status === 'approved').length}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Col>
          </Row>
        </Card>

        <Alert
          message="Buyer Assignment Process"
          description="Review budget-approved requisitions, select appropriate sourcing type, and assign to available buyers based on their specializations and workload."
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Available Buyers Summary */}
        <Card size="small" title="Available Buyers Overview" style={{ marginBottom: '16px' }}>
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
        </Card>

        <Table
          columns={columns}
          dataSource={requisitions}
          loading={loading}
          rowKey="_id"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
          }}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Buyer Assignment Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            Assign Buyer & Sourcing Type - {selectedRequisition?.title}
          </Space>
        }
        open={assignmentModalVisible}
        onCancel={() => {
          setAssignmentModalVisible(false);
          setSelectedRequisition(null);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Summary */}
            <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Employee">
                  <Text strong>{selectedRequisition.employee?.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="green">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Assigned Budget">
                  <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                    XAF {(selectedRequisition.financeVerification?.assignedBudget || selectedRequisition.budgetXAF)?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Code">
                  <Tag color="gold">
                    <TagOutlined /> {selectedRequisition.financeVerification?.budgetCode || 'N/A'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Buyer Assignment Form */}
            <Form
              form={form}
              layout="vertical"
              onFinish={handleBuyerAssignment}
            >
              <Form.Item
                name="sourcingType"
                label="Sourcing Type"
                rules={[{ required: true, message: 'Please select sourcing type' }]}
              >
                <Select placeholder="Select sourcing method">
                  <Option value="direct_purchase">
                    <div>
                      <Text strong>Direct Purchase</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Buy directly from known supplier
                      </Text>
                    </div>
                  </Option>
                  <Option value="quotation_required">
                    <div>
                      <Text strong>Quotation Required</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Get quotes from multiple suppliers
                      </Text>
                    </div>
                  </Option>
                  <Option value="tender_process">
                    <div>
                      <Text strong>Tender Process</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Formal tender for high-value items
                      </Text>
                    </div>
                  </Option>
                  <Option value="framework_agreement">
                    <div>
                      <Text strong>Framework Agreement</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Use existing framework contract
                      </Text>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="assignedBuyer"
                label="Assign to Buyer"
                rules={[{ required: true, message: 'Please select a buyer' }]}
              >
                <Select 
                  placeholder="Select buyer"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.props.children[1].props.children[0].props.children
                      .toLowerCase()
                      .indexOf(input.toLowerCase()) >= 0
                  }
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
                            </div>
                          </Space>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>

              <Form.Item
                name="comments"
                label="Assignment Comments"
                help="Add any special instructions or notes for the buyer"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter any special instructions, delivery requirements, or procurement notes..."
                  showCount
                  maxLength={300}
                />
              </Form.Item>

              <Alert
                message="Assignment Impact"
                description="Once assigned, the buyer will be notified and the requisition will move to Head of Supply Chain for final approval before procurement begins."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />

              <Form.Item>
                <Space>
                  <Button onClick={() => {
                    setAssignmentModalVisible(false);
                    setSelectedRequisition(null);
                    form.resetFields();
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    type="primary" 
                    htmlType="submit"
                    loading={loading}
                    icon={<SendOutlined />}
                  >
                    Assign Buyer
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>

      {/* Details Modal */}
      <Modal
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedRequisition(null);
        }}
        footer={null}
        width={900}
      >
        {selectedRequisition && (
          <div>
            <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
              <Descriptions.Item label="Requisition ID" span={2}>
                <Text code copyable>REQ-{selectedRequisition._id.slice(-6).toUpperCase()}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Title" span={2}>
                <Text strong>{selectedRequisition.title}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Employee">
                {selectedRequisition.employee?.fullName}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="green">{selectedRequisition.itemCategory}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
                  {selectedRequisition.urgency}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Original Budget">
                XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Budget">
                <Text strong style={{ color: '#1890ff' }}>
                  XAF {selectedRequisition.financeVerification?.assignedBudget?.toLocaleString() || 'TBD'}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Budget Code" span={2}>
                <Tag color="gold">
                  <TagOutlined /> {selectedRequisition.financeVerification?.budgetCode || 'Not assigned'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={2}>
                {getStatusTag(selectedRequisition.status)}
              </Descriptions.Item>
            </Descriptions>

            {/* Finance Verification Details */}
            {selectedRequisition.financeVerification && (
              <Card size="small" title="Finance Verification" style={{ marginBottom: '20px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Budget Available">
                    <Tag color={selectedRequisition.financeVerification.budgetAvailable ? 'green' : 'red'}>
                      {selectedRequisition.financeVerification.budgetAvailable ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Verification Date">
                    {selectedRequisition.financeVerification.verificationDate ? 
                      new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') : 
                      'Pending'
                    }
                  </Descriptions.Item>
                  {selectedRequisition.financeVerification.comments && (
                    <Descriptions.Item label="Finance Comments" span={2}>
                      <Text italic>{selectedRequisition.financeVerification.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Buyer Assignment Details */}
            {selectedRequisition.supplyChainReview?.assignedBuyer && (
              <Card size="small" title="Buyer Assignment" style={{ marginBottom: '20px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Assigned Buyer">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong>{selectedRequisition.supplyChainReview.assignedBuyer.fullName}</Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Sourcing Type">
                    <Tag color="purple">
                      {selectedRequisition.supplyChainReview.sourcingType?.replace('_', ' ').toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignment Date">
                    {selectedRequisition.supplyChainReview.buyerAssignmentDate ? 
                      new Date(selectedRequisition.supplyChainReview.buyerAssignmentDate).toLocaleDateString('en-GB') : 
                      'N/A'
                    }
                  </Descriptions.Item>
                  {selectedRequisition.supplyChainReview.comments && (
                    <Descriptions.Item label="Assignment Notes" span={2}>
                      <Text italic>{selectedRequisition.supplyChainReview.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Items Details */}
            <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
              <Table
                dataSource={selectedRequisition.items}
                pagination={false}
                size="small"
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
                    width: 100
                  },
                  {
                    title: 'Unit',
                    dataIndex: 'measuringUnit',
                    key: 'unit',
                    width: 100
                  },
                  {
                    title: 'Project',
                    dataIndex: 'projectName',
                    key: 'project',
                    width: 150,
                    render: (project) => project || 'N/A'
                  }
                ]}
              />
            </Card>

            {/* Justification */}
            <Card size="small" title="Purchase Justification">
              <Text>{selectedRequisition.justificationOfPurchase}</Text>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplyChainBuyerAssignment;