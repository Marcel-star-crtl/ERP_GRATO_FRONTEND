import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Select,
  Typography,
  Tag,
  Space,
  Input,
  Descriptions,
  Alert,
  message,
  Tooltip,
  Statistic,
  Row,
  Col,
  notification,
  Divider,
  Spin
} from 'antd';
import {
  FileTextOutlined,
  SendOutlined,
  CloseCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  ShopOutlined,
  TeamOutlined,
  // TeamOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const SupplyChainPOManagement = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    pendingAssignment: 0,
    assignedToday: 0,
    rejectedToday: 0,
    inApprovalChain: 0
  });

  // Assignment workflow states
  const [assignDepartment, setAssignDepartment] = useState('');
  const [assignComments, setAssignComments] = useState('');
  
  // Rejection states
  const [rejectReason, setRejectReason] = useState('');

  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await UnifiedSupplierAPI.getAllSuppliers({
        status: 'approved'
      });
      
      if (response.success) {
        console.log('Fetched suppliers:', response.data);
        setSuppliers(response.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to fetch suppliers');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch pending POs
  const fetchPendingPOs = useCallback(async () => {
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.getSupplyChainPendingPOs();
      
      if (response.success) {
        setPurchaseOrders(response.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending POs:', error);
      message.error('Failed to fetch pending purchase orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await buyerRequisitionAPI.getSupplyChainPOStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchPendingPOs();
    fetchStats();
    fetchSuppliers();
  }, [fetchPendingPOs, fetchStats, fetchSuppliers]);

  const handlePreviewPO = async () => {
    if (!selectedPO) {
      message.error('No purchase order selected');
      return;
    }

    try {
      const response = await buyerRequisitionAPI.previewPurchaseOrderPDF(selectedPO.id);
      if (response.success) {
        const url = URL.createObjectURL(response.data);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      console.error('Error previewing PO:', error);
      message.error(error.message || 'Failed to preview purchase order');
    }
  };

  const handleDownloadPO = async () => {
    if (!selectedPO) {
      message.error('No purchase order selected');
      return;
    }

    try {
      const response = await buyerRequisitionAPI.downloadPurchaseOrderPDF(selectedPO.id);
      if (response.success) {
        const url = URL.createObjectURL(response.data);
        const link = document.createElement('a');
        link.href = url;
        link.download = response.filename || `PO_${selectedPO.poNumber}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (error) {
      console.error('Error downloading PO:', error);
      message.error(error.message || 'Failed to download purchase order');
    }
  };


  // Handle assignment (auto-signing)
  const handleAssign = async () => {
    if (!assignDepartment) {
      message.error('Please select a department');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.assignPOToDepartment(selectedPO.id, {
        department: assignDepartment,
        comments: assignComments
      });
      
      if (response.success) {
        notification.success({
          message: 'Purchase Order Assigned Successfully',
          description: `PO ${selectedPO.poNumber} has been assigned to ${assignDepartment}. The Department Head will be notified and signatures will be applied automatically.`,
          duration: 5
        });
        
        setAssignModalVisible(false);
        resetAssignmentForm();
        fetchPendingPOs();
        fetchStats();
      }
      
    } catch (error) {
      console.error('Assignment error:', error);
      message.error(error.response?.data?.message || 'Failed to assign purchase order');
    } finally {
      setLoading(false);
    }
  };

  // Reset assignment form
  const resetAssignmentForm = () => {
    setSelectedPO(null);
    setAssignDepartment('');
    setAssignComments('');
  };

  // Handle rejection
  const handleReject = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      message.error('Rejection reason must be at least 10 characters');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.rejectPO(selectedPO.id, {
        rejectionReason: rejectReason
      });
      
      if (response.success) {
        message.success('Purchase order rejected successfully');
        setRejectModalVisible(false);
        setSelectedPO(null);
        setRejectReason('');
        fetchPendingPOs();
        fetchStats();
      }
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reject purchase order');
    } finally {
      setLoading(false);
    }
  };

  // View PO details
  const handleViewDetails = async (po) => {
    setSelectedPO(po);
    setDetailsModalVisible(true);
  };

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text) => <Text code>{text}</Text>,
      width: 150
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.supplierEmail}
          </Text>
        </div>
      ),
      width: 200
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      render: (amount, record) => (
        <Text strong>{record.currency || 'XAF'} {amount.toLocaleString()}</Text>
      ),
      width: 120
    },
    {
      title: 'Items',
      key: 'items',
      render: (_, record) => (
        <div>
          <Text>{record.items?.length || 0} items</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.items?.[0]?.description}
            {record.items?.length > 1 && ` +${record.items.length - 1} more`}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Created',
      key: 'created',
      render: (_, record) => (
        <div>
          <div>{moment(record.creationDate).format('MMM DD, YYYY')}</div>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {moment(record.creationDate).format('HH:mm')}
          </Text>
        </div>
      ),
      width: 120
    },
    {
      title: 'Expected Delivery',
      key: 'delivery',
      render: (_, record) => (
        record.expectedDeliveryDate ? (
          <Text>{moment(record.expectedDeliveryDate).format('MMM DD, YYYY')}</Text>
        ) : (
          <Text type="secondary">Not set</Text>
        )
      ),
      width: 130
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <Tag color={record.status === 'draft' ? 'default' : 'orange'}>
          {record.status === 'draft' ? 'Draft' : 'Pending Assignment'}
        </Tag>
      ),
      width: 130
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              size="small" 
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          
          <Tooltip title="Assign to Department">
            <Button 
              size="small" 
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setAssignModalVisible(true);
              }}
            >
              Assign
            </Button>
          </Tooltip>
          
          <Tooltip title="Reject PO">
            <Button 
              size="small" 
              danger
              icon={<CloseCircleOutlined />}
              onClick={() => {
                setSelectedPO(record);
                setRejectModalVisible(true);
              }}
            >
              Reject
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <TeamOutlined /> Supply Chain - Purchase Order Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => {
                fetchPendingPOs();
                fetchStats();
              }}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        <Alert
          message="Automatic Signature Workflow"
          description="Supply Chain signatures are applied automatically when you assign a purchase order to a department."
          type="info"
          showIcon
          icon={<FileTextOutlined />}
          style={{ marginBottom: '24px' }}
          closable
        />

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Assignment"
                value={stats.pendingAssignment}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Assigned Today"
                value={stats.assignedToday}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Rejected Today"
                value={stats.rejectedToday}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Approval Chain"
                value={stats.inApprovalChain}
                prefix={<ShopOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* <Table
          columns={columns}
          dataSource={purchaseOrders}
          loading={loading}
          rowKey="id"
          scroll={{ x: 1300 }}
          size="small"
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} purchase orders`
          }}
        /> */}

        {purchaseOrders.length === 0 && !loading ? (
          <Alert
            message="No Purchase Orders Pending Assignment"
            description={
              <div>
                <p>There are currently no purchase orders waiting for Supply Chain assignment.</p>
                <p>Purchase orders will appear here when buyers send them for department assignment.</p>
              </div>
            }
            type="info"
            showIcon
            icon={<FileTextOutlined />}
            style={{ marginTop: '24px' }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={purchaseOrders}
            loading={loading}
            rowKey="id"
            scroll={{ x: 1300 }}
            size="small"
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `Total ${total} purchase orders`
            }}
            locale={{
              emptyText: loading ? <Spin /> : 'No purchase orders pending assignment'
            }}
          />
        )}
      </Card>

      {/* Assignment Modal */}
      <Modal
        title={
          <Space>
            <SendOutlined />
            Assign Purchase Order to Department
          </Space>
        }
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          resetAssignmentForm();
        }}
        footer={null}
        width={700}
        maskClosable={false}
      >
        {selectedPO && (
          <div>
            {/* PO Info */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="PO Number">{selectedPO.poNumber}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  {selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Items">{selectedPO.items?.length || 0}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Space style={{ marginBottom: 16 }}>
              <Button icon={<EyeOutlined />} onClick={handlePreviewPO}>
                Preview PO
              </Button>
              <Button icon={<FileTextOutlined />} onClick={handleDownloadPO}>
                Download PO
              </Button>
            </Space>

            <Divider />

            {/* Select Department */}
            <Card 
              size="small" 
              style={{ 
                marginBottom: 16,
                backgroundColor: '#f5f5f5'
              }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Select Department {!assignDepartment && <Text type="danger">*</Text>}</Text>
                <Select 
                  placeholder="Choose department for assignment" 
                  size="large"
                  style={{ width: '100%' }}
                  value={assignDepartment}
                  onChange={(value) => setAssignDepartment(value)}
                >
                  <Option value="Technical">
                    <div>
                      <Text strong>Technical</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. Didier Oyong</Text>
                    </div>
                  </Option>
                  <Option value="Business Development & Supply Chain">
                    <div>
                      <Text strong>Business Development & Supply Chain</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mr. E.T Kelvin</Text>
                    </div>
                  </Option>
                  <Option value="HR & Admin">
                    <div>
                      <Text strong>HR & Admin</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: 11 }}>Head: Mrs. Bruiline Tsitoh</Text>
                    </div>
                  </Option>
                </Select>
              </Space>
            </Card>

            {/* Step 4: Comments (Optional) */}
            <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f5f5f5' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text strong>Assignment Comments (Optional)</Text>
                <TextArea 
                  rows={3} 
                  placeholder="Add any comments about this assignment..."
                  maxLength={300}
                  showCount
                  value={assignComments}
                  onChange={(e) => setAssignComments(e.target.value)}
                  disabled={!assignDepartment}
                />
              </Space>
            </Card>

            {/* Action Buttons */}
            <Space style={{ marginTop: 16, width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setAssignModalVisible(false);
                resetAssignmentForm();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                onClick={handleAssign}
                loading={loading}
                icon={<SendOutlined />}
                disabled={!assignDepartment}
                size="large"
              >
                Assign PO
              </Button>
            </Space>

            {/* Help Alert */}
            <Alert
              message="Assignment will auto-approve at Supply Chain level"
              description="Once assigned, the PO will move to the Department Head for their review and signature."
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          </div>
        )}
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            Reject Purchase Order
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setSelectedPO(null);
          setRejectReason('');
        }}
        footer={null}
        width={500}
      >
        <Alert
          message="Rejection Notice"
          description="The buyer will be notified and can revise the purchase order."
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <div>
          <div style={{ marginBottom: 16 }}>
            <Text strong>Rejection Reason:</Text>
            <TextArea 
              rows={4} 
              placeholder="Explain why this purchase order is being rejected..."
              maxLength={500}
              showCount
              style={{ marginTop: 8 }}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>

          <Space style={{ marginTop: 16 }}>
            <Button onClick={() => {
              setRejectModalVisible(false);
              setSelectedPO(null);
              setRejectReason('');
            }}>
              Cancel
            </Button>
            <Button 
              danger
              type="primary" 
              onClick={handleReject}
              loading={loading}
              icon={<CloseCircleOutlined />}
            >
              Reject Purchase Order
            </Button>
          </Space>
        </div>
      </Modal>

      {/* Details Modal */}
      <Modal
        title={<Space><FileTextOutlined /> Purchase Order Details</Space>}
        open={detailsModalVisible}
        onCancel={() => {
          setDetailsModalVisible(false);
          setSelectedPO(null);
        }}
        footer={null}
        width={700}
      >
        {selectedPO && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="PO Number" span={2}>
              <Text code copyable>{selectedPO.poNumber}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier">
              {selectedPO.supplierName}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              <Text strong>{selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Items" span={2}>
              {selectedPO.items?.map((item, index) => (
                <div key={index} style={{ marginBottom: 4 }}>
                  {item.quantity}x {item.description}
                </div>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="Expected Delivery" span={2}>
              {selectedPO.expectedDeliveryDate ? 
                moment(selectedPO.expectedDeliveryDate).format('MMM DD, YYYY') : 
                'Not set'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Payment Terms">
              {selectedPO.paymentTerms}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {moment(selectedPO.creationDate).format('MMM DD, YYYY HH:mm')}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default SupplyChainPOManagement;