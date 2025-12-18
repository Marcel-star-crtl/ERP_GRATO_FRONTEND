import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Select,
  Input,
  Space,
  Typography,
  Tag,
  Alert,
  Tabs,
  DatePicker,
  message
} from 'antd';
import {
  DashboardOutlined,
  InboxOutlined,
  ShoppingOutlined,
  WarningOutlined,
  DollarOutlined,
  SearchOutlined,
  PlusOutlined,
  FileExcelOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [availableStock, setAvailableStock] = useState([]);
  const [reorderAlerts, setReorderAlerts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // Filters
  const [category, setCategory] = useState('all');
  const [location, setLocation] = useState('all');
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchAvailableStock();
    fetchReorderAlerts();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/inventory/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
    }
  };

  const fetchAvailableStock = async () => {
    try {
      setLoading(true);
      const response = await api.get('/inventory/available-stock', {
        params: {
          category,
          location: location !== 'all' ? location : undefined,
          search: searchText || undefined,
          limit: 50
        }
      });
      setAvailableStock(response.data.data.items || []);
    } catch (error) {
      console.error('Error fetching available stock:', error);
      message.error('Failed to load available stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchReorderAlerts = async () => {
    try {
      const response = await api.get('/inventory/reorder-alerts');
      setReorderAlerts(response.data.data.alerts || []);
    } catch (error) {
      console.error('Error fetching reorder alerts:', error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
    fetchAvailableStock();
    fetchReorderAlerts();
  };

  const stockColumns = [
    {
      title: 'Item Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      fixed: 'left',
      render: (code) => <Text strong>{code}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description, record) => (
        <div>
          <Text>{description}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category} {record.subcategory && `- ${record.subcategory}`}
          </Text>
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120
    },
    {
      title: 'Unit',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
      width: 80,
      align: 'center'
    },
    {
      title: 'Stock Qty',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      width: 100,
      align: 'right',
      render: (qty, record) => (
        <Text style={{
          color: qty === 0 ? '#f5222d' :
                 qty <= record.reorderPoint ? '#faad14' :
                 '#52c41a',
          fontWeight: 'bold'
        }}>
          {qty.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Min Stock',
      dataIndex: 'minimumStock',
      key: 'minimumStock',
      width: 100,
      align: 'right'
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorderPoint',
      width: 110,
      align: 'right'
    },
    {
      title: 'Unit Price',
      dataIndex: 'averageCost',
      key: 'averageCost',
      width: 120,
      align: 'right',
      render: (cost, record) => {
        const price = cost || record.standardPrice || 0;
        return `${price.toLocaleString()} XAF`;
      }
    },
    {
      title: 'Stock Value',
      dataIndex: 'stockValue',
      key: 'stockValue',
      width: 130,
      align: 'right',
      render: (value) => (
        <Text strong>{value?.toLocaleString() || 0} XAF</Text>
      )
    },
    {
      title: 'Status',
      key: 'stockStatus',
      width: 100,
      align: 'center',
      render: (_, record) => {
        const status = record.stockQuantity === 0 ? 'Out of Stock' :
                      record.stockQuantity <= record.reorderPoint ? 'Low Stock' :
                      'In Stock';
        const color = status === 'Out of Stock' ? 'red' :
                     status === 'Low Stock' ? 'orange' : 'green';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            onClick={() => navigate(`/supply-chain/inventory/item/${record._id}`)}
          >
            Details
          </Button>
          <Button
            size="small"
            type="primary"
            onClick={() => navigate(`/supply-chain/inventory/inbound?itemId=${record._id}`)}
          >
            Inbound
          </Button>
          <Button
            size="small"
            onClick={() => navigate(`/supply-chain/inventory/outbound?itemId=${record._id}`)}
          >
            Outbound
          </Button>
        </Space>
      )
    }
  ];

  const alertColumns = [
    {
      title: 'Item Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Text strong>{code}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (description, record) => (
        <div>
          <Text>{description}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category}
          </Text>
        </div>
      )
    },
    {
      title: 'Current Stock',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      align: 'right',
      render: (qty) => (
        <Text style={{ color: qty === 0 ? '#f5222d' : '#faad14', fontWeight: 'bold' }}>
          {qty}
        </Text>
      )
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorderPoint',
      align: 'right'
    },
    {
      title: 'Deficit',
      dataIndex: 'deficit',
      key: 'deficit',
      align: 'right',
      render: (deficit) => <Text type="danger">{deficit}</Text>
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = priority === 'critical' ? 'red' :
                     priority === 'high' ? 'orange' : 'gold';
        return <Tag color={color}>{priority.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          type="primary"
          onClick={() => navigate(`/supply-chain/inventory/inbound?itemId=${record._id}`)}
        >
          Order Now
        </Button>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <DashboardOutlined /> Inventory Management
            </Title>
            <Text type="secondary">
              Real-time inventory tracking and stock management
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/supply-chain/inventory/inbound')}
              >
                Record Inbound
              </Button>
              <Button
                icon={<ShoppingOutlined />}
                onClick={() => navigate('/supply-chain/inventory/outbound')}
              >
                Record Outbound
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      {dashboardData && (
        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Items"
                value={dashboardData.summary.totalItems}
                prefix={<DashboardOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Stock Value"
                value={dashboardData.summary.totalStockValue}
                prefix={<DollarOutlined />}
                suffix="XAF"
                valueStyle={{ color: '#52c41a' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Low Stock Items"
                value={dashboardData.summary.lowStockItems}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Out of Stock"
                value={dashboardData.summary.outOfStockItems}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Reorder Alerts */}
      {reorderAlerts.length > 0 && (
        <Alert
          message={`${reorderAlerts.length} Items Need Reordering`}
          description={
            <div>
              <Text>
                {reorderAlerts.filter(a => a.priority === 'critical').length} critical alerts,
                {' '}{reorderAlerts.filter(a => a.priority === 'high').length} high priority
              </Text>
              <Button
                type="link"
                onClick={() => setActiveTab('alerts')}
                style={{ padding: 0, marginLeft: '8px' }}
              >
                View All Alerts
              </Button>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Main Content Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Available Stock" key="overview">
            {/* Filters */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col xs={24} md={8}>
                <Input
                  placeholder="Search items..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={fetchAvailableStock}
                  allowClear
                />
              </Col>
              <Col xs={24} md={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Category"
                  value={category}
                  onChange={setCategory}
                >
                  <Option value="all">All Categories</Option>
                  <Option value="IT Accessories">IT Accessories</Option>
                  <Option value="Office Supplies">Office Supplies</Option>
                  <Option value="Equipment">Equipment</Option>
                  <Option value="Consumables">Consumables</Option>
                  <Option value="Hardware">Hardware</Option>
                  <Option value="Software">Software</Option>
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Location"
                  value={location}
                  onChange={setLocation}
                >
                  <Option value="all">All Locations</Option>
                  <Option value="Main Warehouse">Main Warehouse</Option>
                  <Option value="Office Storage">Office Storage</Option>
                  <Option value="Site Storage">Site Storage</Option>
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <Button
                  type="primary"
                  onClick={fetchAvailableStock}
                  block
                >
                  Apply Filters
                </Button>
              </Col>
              <Col xs={24} md={4}>
                <Button
                  onClick={() => {
                    setCategory('all');
                    setLocation('all');
                    setSearchText('');
                    fetchAvailableStock();
                  }}
                  block
                >
                  Clear Filters
                </Button>
              </Col>
            </Row>

            {/* Stock Table */}
            <Table
              columns={stockColumns}
              dataSource={availableStock}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1800 }}
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} items`
              }}
            />
          </TabPane>

          <TabPane
            tab={
              <span>
                Reorder Alerts
                {reorderAlerts.length > 0 && (
                  <Tag color="red" style={{ marginLeft: '8px' }}>
                    {reorderAlerts.length}
                  </Tag>
                )}
              </span>
            }
            key="alerts"
          >
            <Table
              columns={alertColumns}
              dataSource={reorderAlerts}
              rowKey="_id"
              pagination={{
                pageSize: 20,
                showTotal: (total) => `Total ${total} alerts`
              }}
            />
          </TabPane>

          <TabPane tab="Recent Transactions" key="transactions">
            <Button
              type="link"
              onClick={() => navigate('/supply-chain/inventory/transactions')}
            >
              View All Transactions →
            </Button>
          </TabPane>

          <TabPane tab="Reports" key="reports">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card>
                <Title level={4}>Stock Movement Report</Title>
                <Space>
                  <RangePicker />
                  <Button
                    type="primary"
                    onClick={() => navigate('/supply-chain/inventory/reports/movement')}
                  >
                    Generate Report
                  </Button>
                </Space>
              </Card>

              <Card>
                <Title level={4}>Inventory Valuation</Title>
                <Button
                  type="primary"
                  onClick={() => navigate('/supply-chain/inventory/reports/valuation')}
                >
                  View Valuation Report
                </Button>
              </Card>

              <Card>
                <Title level={4}>Stock Audit Trail</Title>
                <Button
                  type="primary"
                  onClick={() => navigate('/supply-chain/inventory/reports/audit')}
                >
                  View Audit Trail
                </Button>
              </Card>
            </Space>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default InventoryDashboard;








// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   Card,
//   Row,
//   Col,
//   Statistic,
//   Table,
//   Button,
//   Select,
//   Input,
//   Space,
//   Typography,
//   Tag,
//   Alert,
//   Tabs,
//   DatePicker,
//   message
// } from 'antd';
// import {
//   DashboardOutlined,
//   InboxOutlined,
//   ShoppingOutlined,
//   WarningOutlined,
//   DollarOutlined,
//   SearchOutlined,
//   PlusOutlined,
//   FileExcelOutlined,
//   ReloadOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;
// const { RangePicker } = DatePicker;
// const { Option } = Select;
// const { TabPane } = Tabs;

// const InventoryDashboard = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [dashboardData, setDashboardData] = useState(null);
//   const [availableStock, setAvailableStock] = useState([]);
//   const [reorderAlerts, setReorderAlerts] = useState([]);
//   const [activeTab, setActiveTab] = useState('overview');
  
//   // Filters
//   const [category, setCategory] = useState('all');
//   const [location, setLocation] = useState('all');
//   const [searchText, setSearchText] = useState('');

//   useEffect(() => {
//     fetchDashboardData();
//     fetchAvailableStock();
//     fetchReorderAlerts();
//   }, []);

//   const fetchDashboardData = async () => {
//     try {
//       const response = await api.get('/api/inventory/dashboard');
//       setDashboardData(response.data.data);
//     } catch (error) {
//       console.error('Error fetching dashboard data:', error);
//       message.error('Failed to load dashboard data');
//     }
//   };

//   const fetchAvailableStock = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/api/inventory/available-stock', {
//         params: {
//           category,
//           location: location !== 'all' ? location : undefined,
//           search: searchText || undefined,
//           limit: 50
//         }
//       });
//       setAvailableStock(response.data.data.items || []);
//     } catch (error) {
//       console.error('Error fetching available stock:', error);
//       message.error('Failed to load available stock');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const fetchReorderAlerts = async () => {
//     try {
//       const response = await api.get('/api/inventory/reorder-alerts');
//       setReorderAlerts(response.data.data.alerts || []);
//     } catch (error) {
//       console.error('Error fetching reorder alerts:', error);
//     }
//   };

//   const handleRefresh = () => {
//     fetchDashboardData();
//     fetchAvailableStock();
//     fetchReorderAlerts();
//   };

//   const stockColumns = [
//     {
//       title: 'Item Code',
//       dataIndex: 'code',
//       key: 'code',
//       width: 120,
//       fixed: 'left',
//       render: (code) => <Text strong>{code}</Text>
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       width: 250,
//       render: (description, record) => (
//         <div>
//           <Text>{description}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.category} {record.subcategory && `- ${record.subcategory}`}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Location',
//       dataIndex: 'location',
//       key: 'location',
//       width: 120
//     },
//     {
//       title: 'Unit',
//       dataIndex: 'unitOfMeasure',
//       key: 'unitOfMeasure',
//       width: 80,
//       align: 'center'
//     },
//     {
//       title: 'Stock Qty',
//       dataIndex: 'stockQuantity',
//       key: 'stockQuantity',
//       width: 100,
//       align: 'right',
//       render: (qty, record) => (
//         <Text style={{ 
//           color: qty === 0 ? '#f5222d' : 
//                  qty <= record.reorderPoint ? '#faad14' : 
//                  '#52c41a',
//           fontWeight: 'bold'
//         }}>
//           {qty.toLocaleString()}
//         </Text>
//       )
//     },
//     {
//       title: 'Min Stock',
//       dataIndex: 'minimumStock',
//       key: 'minimumStock',
//       width: 100,
//       align: 'right'
//     },
//     {
//       title: 'Reorder Point',
//       dataIndex: 'reorderPoint',
//       key: 'reorderPoint',
//       width: 110,
//       align: 'right'
//     },
//     {
//       title: 'Unit Price',
//       dataIndex: 'averageCost',
//       key: 'averageCost',
//       width: 120,
//       align: 'right',
//       render: (cost, record) => {
//         const price = cost || record.standardPrice || 0;
//         return `${price.toLocaleString()} XAF`;
//       }
//     },
//     {
//       title: 'Stock Value',
//       dataIndex: 'stockValue',
//       key: 'stockValue',
//       width: 130,
//       align: 'right',
//       render: (value) => (
//         <Text strong>{value?.toLocaleString() || 0} XAF</Text>
//       )
//     },
//     {
//       title: 'Status',
//       key: 'stockStatus',
//       width: 100,
//       align: 'center',
//       render: (_, record) => {
//         const status = record.stockQuantity === 0 ? 'Out of Stock' :
//                       record.stockQuantity <= record.reorderPoint ? 'Low Stock' :
//                       'In Stock';
//         const color = status === 'Out of Stock' ? 'red' :
//                      status === 'Low Stock' ? 'orange' : 'green';
//         return <Tag color={color}>{status}</Tag>;
//       }
//     },
//     {
//       title: 'Supplier',
//       dataIndex: 'supplier',
//       key: 'supplier',
//       width: 150
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: 150,
//       fixed: 'right',
//       render: (_, record) => (
//         <Space size="small">
//           <Button
//             size="small"
//             onClick={() => navigate(`/supply-chain/inventory/item/${record._id}`)}
//           >
//             Details
//           </Button>
//           <Button
//             size="small"
//             type="primary"
//             onClick={() => navigate(`/supply-chain/inventory/inbound?itemId=${record._id}`)}
//           >
//             Inbound
//           </Button>
//           <Button
//             size="small"
//             onClick={() => navigate(`/supply-chain/inventory/outbound?itemId=${record._id}`)}
//           >
//             Outbound
//           </Button>
//         </Space>
//       )
//     }
//   ];

//   const alertColumns = [
//     {
//       title: 'Item Code',
//       dataIndex: 'code',
//       key: 'code',
//       render: (code) => <Text strong>{code}</Text>
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       render: (description, record) => (
//         <div>
//           <Text>{description}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             {record.category}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Current Stock',
//       dataIndex: 'stockQuantity',
//       key: 'stockQuantity',
//       align: 'right',
//       render: (qty) => (
//         <Text style={{ color: qty === 0 ? '#f5222d' : '#faad14', fontWeight: 'bold' }}>
//           {qty}
//         </Text>
//       )
//     },
//     {
//       title: 'Reorder Point',
//       dataIndex: 'reorderPoint',
//       key: 'reorderPoint',
//       align: 'right'
//     },
//     {
//       title: 'Deficit',
//       dataIndex: 'deficit',
//       key: 'deficit',
//       align: 'right',
//       render: (deficit) => <Text type="danger">{deficit}</Text>
//     },
//     {
//       title: 'Priority',
//       dataIndex: 'priority',
//       key: 'priority',
//       render: (priority) => {
//         const color = priority === 'critical' ? 'red' :
//                      priority === 'high' ? 'orange' : 'gold';
//         return <Tag color={color}>{priority.toUpperCase()}</Tag>;
//       }
//     },
//     {
//       title: 'Supplier',
//       dataIndex: 'supplier',
//       key: 'supplier'
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (_, record) => (
//         <Button
//           size="small"
//           type="primary"
//           onClick={() => navigate(`/supply-chain/inventory/inbound?itemId=${record._id}`)}
//         >
//           Order Now
//         </Button>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       {/* Header */}
//       <Card style={{ marginBottom: '24px' }}>
//         <Row justify="space-between" align="middle">
//           <Col>
//             <Title level={2} style={{ margin: 0 }}>
//               <DashboardOutlined /> Inventory Management
//             </Title>
//             <Text type="secondary">
//               Real-time inventory tracking and stock management
//             </Text>
//           </Col>
//           <Col>
//             <Space>
//               <Button
//                 icon={<ReloadOutlined />}
//                 onClick={handleRefresh}
//               >
//                 Refresh
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => navigate('/supply-chain/inventory/inbound')}
//               >
//                 Record Inbound
//               </Button>
//               <Button
//                 icon={<ShoppingOutlined />}
//                 onClick={() => navigate('/supply-chain/inventory/outbound')}
//               >
//                 Record Outbound
//               </Button>
//               <Button
//                 icon={<FileExcelOutlined />}
//                 onClick={() => message.info('Export functionality coming soon')}
//               >
//                 Export
//               </Button>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* Statistics */}
//       {dashboardData && (
//         <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
//           <Col xs={24} sm={12} md={6}>
//             <Card>
//               <Statistic
//                 title="Total Items"
//                 value={dashboardData.summary.totalItems}
//                 prefix={<DashboardOutlined />}
//                 valueStyle={{ color: '#1890ff' }}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} md={6}>
//             <Card>
//               <Statistic
//                 title="Total Stock Value"
//                 value={dashboardData.summary.totalStockValue}
//                 prefix={<DollarOutlined />}
//                 suffix="XAF"
//                 valueStyle={{ color: '#52c41a' }}
//                 precision={0}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} md={6}>
//             <Card>
//               <Statistic
//                 title="Low Stock Items"
//                 value={dashboardData.summary.lowStockItems}
//                 prefix={<WarningOutlined />}
//                 valueStyle={{ color: '#faad14' }}
//               />
//             </Card>
//           </Col>
//           <Col xs={24} sm={12} md={6}>
//             <Card>
//               <Statistic
//                 title="Out of Stock"
//                 value={dashboardData.summary.outOfStockItems}
//                 prefix={<WarningOutlined />}
//                 valueStyle={{ color: '#f5222d' }}
//               />
//             </Card>
//           </Col>
//         </Row>
//       )}

//       {/* Reorder Alerts */}
//       {reorderAlerts.length > 0 && (
//         <Alert
//           message={`${reorderAlerts.length} Items Need Reordering`}
//           description={
//             <div>
//               <Text>
//                 {reorderAlerts.filter(a => a.priority === 'critical').length} critical alerts, 
//                 {' '}{reorderAlerts.filter(a => a.priority === 'high').length} high priority
//               </Text>
//               <Button
//                 type="link"
//                 onClick={() => setActiveTab('alerts')}
//                 style={{ padding: 0, marginLeft: '8px' }}
//               >
//                 View All Alerts
//               </Button>
//             </div>
//           }
//           type="warning"
//           showIcon
//           icon={<WarningOutlined />}
//           style={{ marginBottom: '24px' }}
//         />
//       )}

//       {/* Main Content Tabs */}
//       <Card>
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <TabPane tab="Available Stock" key="overview">
//             {/* Filters */}
//             <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
//               <Col xs={24} md={8}>
//                 <Input
//                   placeholder="Search items..."
//                   prefix={<SearchOutlined />}
//                   value={searchText}
//                   onChange={(e) => setSearchText(e.target.value)}
//                   onPressEnter={fetchAvailableStock}
//                   allowClear
//                 />
//               </Col>
//               <Col xs={24} md={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   placeholder="Category"
//                   value={category}
//                   onChange={setCategory}
//                 >
//                   <Option value="all">All Categories</Option>
//                   <Option value="IT Accessories">IT Accessories</Option>
//                   <Option value="Office Supplies">Office Supplies</Option>
//                   <Option value="Equipment">Equipment</Option>
//                   <Option value="Consumables">Consumables</Option>
//                   <Option value="Hardware">Hardware</Option>
//                   <Option value="Software">Software</Option>
//                 </Select>
//               </Col>
//               <Col xs={24} md={4}>
//                 <Select
//                   style={{ width: '100%' }}
//                   placeholder="Location"
//                   value={location}
//                   onChange={setLocation}
//                 >
//                   <Option value="all">All Locations</Option>
//                   <Option value="Main Warehouse">Main Warehouse</Option>
//                   <Option value="Office Storage">Office Storage</Option>
//                   <Option value="Site Storage">Site Storage</Option>
//                 </Select>
//               </Col>
//               <Col xs={24} md={4}>
//                 <Button
//                   type="primary"
//                   onClick={fetchAvailableStock}
//                   block
//                 >
//                   Apply Filters
//                 </Button>
//               </Col>
//               <Col xs={24} md={4}>
//                 <Button
//                   onClick={() => {
//                     setCategory('all');
//                     setLocation('all');
//                     setSearchText('');
//                     fetchAvailableStock();
//                   }}
//                   block
//                 >
//                   Clear Filters
//                 </Button>
//               </Col>
//             </Row>

//             {/* Stock Table */}
//             <Table
//               columns={stockColumns}
//               dataSource={availableStock}
//               rowKey="_id"
//               loading={loading}
//               scroll={{ x: 1800 }}
//               pagination={{
//                 pageSize: 50,
//                 showSizeChanger: true,
//                 showTotal: (total) => `Total ${total} items`
//               }}
//             />
//           </TabPane>

//           <TabPane 
//             tab={
//               <span>
//                 Reorder Alerts
//                 {reorderAlerts.length > 0 && (
//                   <Tag color="red" style={{ marginLeft: '8px' }}>
//                     {reorderAlerts.length}
//                   </Tag>
//                 )}
//               </span>
//             } 
//             key="alerts"
//           >
//             <Table
//               columns={alertColumns}
//               dataSource={reorderAlerts}
//               rowKey="_id"
//               pagination={{
//                 pageSize: 20,
//                 showTotal: (total) => `Total ${total} alerts`
//               }}
//             />
//           </TabPane>

//           <TabPane tab="Recent Transactions" key="transactions">
//             <Button
//               type="link"
//               onClick={() => navigate('/supply-chain/inventory/transactions')}
//             >
//               View All Transactions →
//             </Button>
//           </TabPane>

//           <TabPane tab="Reports" key="reports">
//             <Space direction="vertical" size="large" style={{ width: '100%' }}>
//               <Card>
//                 <Title level={4}>Stock Movement Report</Title>
//                 <Space>
//                   <RangePicker />
//                   <Button
//                     type="primary"
//                     onClick={() => navigate('/supply-chain/inventory/reports/movement')}
//                   >
//                     Generate Report
//                   </Button>
//                 </Space>
//               </Card>

//               <Card>
//                 <Title level={4}>Inventory Valuation</Title>
//                 <Button
//                   type="primary"
//                   onClick={() => navigate('/supply-chain/inventory/reports/valuation')}
//                 >
//                   View Valuation Report
//                 </Button>
//               </Card>

//               <Card>
//                 <Title level={4}>Stock Audit Trail</Title>
//                 <Button
//                   type="primary"
//                   onClick={() => navigate('/supply-chain/inventory/reports/audit')}
//                 >
//                   View Audit Trail
//                 </Button>
//               </Card>
//             </Space>
//           </TabPane>
//         </Tabs>
//       </Card>
//     </div>
//   );
// };

// export default InventoryDashboard;