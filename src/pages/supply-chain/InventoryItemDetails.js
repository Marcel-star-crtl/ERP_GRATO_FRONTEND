import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Button,
  Space,
  Spin,
  Alert,
  message,
  List,
  Timeline,
  Progress,
  Row,
  Col,
  Statistic,
  Table,
  Tabs
} from 'antd';
import { 
  ArrowLeftOutlined,
  InboxOutlined,
  ShoppingOutlined,
  HistoryOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  BarChartOutlined,
  FileTextOutlined,
  DownloadOutlined,
  PrinterOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const InventoryItemDetails = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stockMovement, setStockMovement] = useState([]);

  useEffect(() => {
    fetchItemDetails();
    fetchTransactionHistory();
    fetchStockMovement();
  }, [itemId]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching item details for ID:', itemId);
      
      if (!itemId) {
        throw new Error('No item ID provided');
      }

      const response = await api.get(`/api/inventory/items/${itemId}`);
      
      console.log('Item details response:', response.data);
      
      if (response.data.success) {
        const itemData = response.data.data;
        console.log('Setting item data:', itemData);
        setItem(itemData);
      } else {
        throw new Error(response.data.message || 'Failed to fetch item details');
      }
    } catch (error) {
      console.error('Error fetching item:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load item details';
      setError(errorMessage);
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionHistory = async () => {
    try {
      const response = await api.get(`/api/inventory/items/${itemId}/transactions`, {
        params: {
          limit: 20,
          sortBy: 'date',
          sortOrder: 'desc'
        }
      });
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStockMovement = async () => {
    try {
      const response = await api.get(`/api/inventory/items/${itemId}/stock-movement`, {
        params: {
          period: '30days'
        }
      });
      
      if (response.data.success) {
        setStockMovement(response.data.data.movements || []);
      }
    } catch (error) {
      console.error('Error fetching stock movement:', error);
    }
  };

  const getStockStatus = (stockQty, reorderPoint, minStock) => {
    if (stockQty === 0) {
      return { text: 'Out of Stock', color: 'red', icon: <WarningOutlined /> };
    } else if (stockQty <= minStock) {
      return { text: 'Critical', color: 'red', icon: <WarningOutlined /> };
    } else if (stockQty <= reorderPoint) {
      return { text: 'Low Stock', color: 'orange', icon: <WarningOutlined /> };
    } else {
      return { text: 'In Stock', color: 'green', icon: <CheckCircleOutlined /> };
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'inbound':
      case 'purchase':
        return <InboxOutlined style={{ color: '#52c41a' }} />;
      case 'outbound':
      case 'issue':
        return <ShoppingOutlined style={{ color: '#1890ff' }} />;
      case 'adjustment':
        return <HistoryOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileTextOutlined />;
    }
  };

  const handleRecordInbound = () => {
    navigate(`/supply-chain/inventory/inbound?itemId=${itemId}`);
  };

  const handleRecordOutbound = () => {
    navigate(`/supply-chain/inventory/outbound?itemId=${itemId}`);
  };

  const handleGoBack = () => {
    navigate('/supply-chain/inventory');
  };

  const handleRefresh = () => {
    fetchItemDetails();
    fetchTransactionHistory();
    fetchStockMovement();
    message.success('Data refreshed');
  };

  const transactionColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Type',
      dataIndex: 'transactionType',
      key: 'transactionType',
      width: 120,
      render: (type) => (
        <Tag color={type === 'inbound' ? 'green' : type === 'outbound' ? 'blue' : 'orange'}>
          {type?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right',
      render: (qty, record) => (
        <Text style={{ 
          color: record.transactionType === 'inbound' ? '#52c41a' : '#1890ff',
          fontWeight: 'bold'
        }}>
          {record.transactionType === 'inbound' ? '+' : '-'}{qty}
        </Text>
      )
    },
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 150
    },
    {
      title: 'Project',
      dataIndex: 'project',
      key: 'project',
      width: 150,
      render: (project) => project?.name || '-'
    },
    {
      title: 'User',
      dataIndex: 'performedBy',
      key: 'performedBy',
      width: 150,
      render: (user) => user?.name || '-'
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes) => notes || '-'
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading item details...</div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Error Loading Item"
          description={error || "The item you are trying to access does not exist or you don't have permission to view it."}
          type="error"
          showIcon
          action={
            <Button onClick={handleGoBack}>
              Back to Inventory
            </Button>
          }
        />
      </div>
    );
  }

  const stockStatus = getStockStatus(item.stockQuantity, item.reorderPoint, item.minimumStock);
  const stockHealth = item.stockQuantity > item.reorderPoint ? 100 : 
                     (item.stockQuantity / item.reorderPoint) * 100;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ margin: 0 }}>
            Inventory Item Details
          </Title>
          <Space>
            <Text type="secondary" strong>
              {item.code}
            </Text>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
            >
              Refresh
            </Button>
            <Button 
              icon={<PrinterOutlined />}
              onClick={() => window.print()}
            >
              Print
            </Button>
            <Button 
              icon={<DownloadOutlined />}
              onClick={() => message.info('Export functionality coming soon')}
            >
              Export
            </Button>
          </Space>
        </div>

        {/* Stock Status Alert */}
        {(item.stockQuantity === 0 || item.stockQuantity <= item.reorderPoint) && (
          <Alert
            message={item.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}
            description={
              item.stockQuantity === 0 
                ? 'This item is currently out of stock. Please record an inbound transaction to replenish inventory.'
                : `Current stock (${item.stockQuantity}) is below the reorder point (${item.reorderPoint}). Consider placing an order.`
            }
            type={item.stockQuantity === 0 ? 'error' : 'warning'}
            showIcon
            icon={<WarningOutlined />}
            style={{ marginBottom: '24px' }}
            action={
              <Button 
                type="primary" 
                size="small"
                onClick={handleRecordInbound}
              >
                Record Inbound
              </Button>
            }
          />
        )}

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Current Stock"
                value={item.stockQuantity}
                valueStyle={{ 
                  color: stockStatus.color === 'green' ? '#52c41a' : 
                         stockStatus.color === 'orange' ? '#faad14' : '#f5222d'
                }}
                prefix={stockStatus.icon}
                suffix={item.unitOfMeasure}
              />
              <Progress 
                percent={Math.round(stockHealth)} 
                status={stockHealth < 50 ? 'exception' : stockHealth < 75 ? 'normal' : 'success'}
                showInfo={false}
                style={{ marginTop: '8px' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Stock Value"
                value={item.stockValue || (item.stockQuantity * (item.averageCost || item.standardPrice || 0))}
                precision={0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<DollarOutlined />}
                suffix="XAF"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Reorder Point"
                value={item.reorderPoint}
                suffix={item.unitOfMeasure}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Average Cost"
                value={item.averageCost || item.standardPrice || 0}
                precision={0}
                suffix="XAF"
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Item Details */}
        <Descriptions bordered column={2} size="middle">
          <Descriptions.Item label="Item Code" span={1}>
            <Text code copyable strong>{item.code}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Status" span={1}>
            <Tag color={stockStatus.color} icon={stockStatus.icon}>
              {stockStatus.text}
            </Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Description" span={2}>
            <Paragraph style={{ marginBottom: 0 }}>
              {item.description || 'N/A'}
            </Paragraph>
          </Descriptions.Item>
          
          <Descriptions.Item label="Category">
            <Tag color="blue">{item.category || 'N/A'}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item label="Subcategory">
            {item.subcategory || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Unit of Measure">
            <Text strong>{item.unitOfMeasure || 'N/A'}</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Location">
            {item.location || 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Current Stock">
            <Text strong style={{ fontSize: '16px', color: stockStatus.color === 'green' ? '#52c41a' : '#f5222d' }}>
              {item.stockQuantity} {item.unitOfMeasure}
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Minimum Stock">
            {item.minimumStock} {item.unitOfMeasure}
          </Descriptions.Item>
          
          <Descriptions.Item label="Reorder Point">
            {item.reorderPoint} {item.unitOfMeasure}
          </Descriptions.Item>
          
          <Descriptions.Item label="Maximum Stock">
            {item.maximumStock || 'Not Set'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Standard Price">
            <Text strong>{(item.standardPrice || 0).toLocaleString()} XAF</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Average Cost">
            <Text strong>{(item.averageCost || 0).toLocaleString()} XAF</Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Stock Value">
            <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
              {(item.stockValue || 0).toLocaleString()} XAF
            </Text>
          </Descriptions.Item>
          
          <Descriptions.Item label="Primary Supplier">
            {item.supplier || 'Not Set'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Lead Time">
            {item.leadTime ? `${item.leadTime} days` : 'Not Set'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Last Ordered">
            {item.lastOrderDate ? moment(item.lastOrderDate).format('DD/MM/YYYY') : 'Never'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Last Received">
            {item.lastReceivedDate ? moment(item.lastReceivedDate).format('DD/MM/YYYY') : 'Never'}
          </Descriptions.Item>
          
          {item.barcode && (
            <Descriptions.Item label="Barcode" span={2}>
              <Text code>{item.barcode}</Text>
            </Descriptions.Item>
          )}
          
          {item.notes && (
            <Descriptions.Item label="Notes" span={2}>
              <Paragraph style={{ marginBottom: 0 }}>
                {item.notes}
              </Paragraph>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item label="Created Date">
            {item.createdAt ? moment(item.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
          </Descriptions.Item>
          
          <Descriptions.Item label="Last Updated">
            {item.updatedAt ? moment(item.updatedAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Tabs Section */}
        <Tabs defaultActiveKey="transactions">
          <TabPane tab="Transaction History" key="transactions">
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showTotal: (total) => `Total ${total} transactions`
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>

          <TabPane tab="Stock Movement" key="movement">
            <Timeline mode="left">
              {stockMovement.map((movement, index) => (
                <Timeline.Item 
                  key={index}
                  dot={getTransactionIcon(movement.type)}
                  color={movement.type === 'inbound' ? 'green' : 'blue'}
                >
                  <div>
                    <Text strong>
                      {moment(movement.date).format('DD/MM/YYYY HH:mm')}
                    </Text>
                    <br />
                    <Text>
                      {movement.type === 'inbound' ? '+' : '-'}{movement.quantity} {item.unitOfMeasure}
                    </Text>
                    <br />
                    <Text type="secondary">
                      {movement.reference} - {movement.notes}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      By: {movement.user?.name || 'System'}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>

          <TabPane tab="Analytics" key="analytics">
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Alert
                  message="Analytics Dashboard"
                  description="Stock movement analytics, consumption patterns, and forecasting will be displayed here."
                  type="info"
                  showIcon
                  icon={<BarChartOutlined />}
                />
              </Col>
            </Row>
          </TabPane>
        </Tabs>

        <Divider />

        {/* Action Buttons */}
        <Space size="middle">
          <Button 
            type="default" 
            icon={<ArrowLeftOutlined />} 
            onClick={handleGoBack}
          >
            Back to Inventory
          </Button>
          
          <Button 
            type="primary" 
            icon={<InboxOutlined />}
            onClick={handleRecordInbound}
            size="large"
          >
            Record Inbound
          </Button>
          
          <Button 
            icon={<ShoppingOutlined />}
            onClick={handleRecordOutbound}
            disabled={item.stockQuantity === 0}
            size="large"
          >
            Record Outbound
          </Button>
          
          <Button 
            icon={<HistoryOutlined />}
            onClick={() => navigate(`/supply-chain/inventory/items/${itemId}/audit`)}
          >
            View Audit Trail
          </Button>
        </Space>
      </Card>
    </div>
  );
};

export default InventoryItemDetails;