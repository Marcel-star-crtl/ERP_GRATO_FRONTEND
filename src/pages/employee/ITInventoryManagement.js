import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Card,
  Modal,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Input,
  Form,
  message,
  Tabs,
  Progress,
  Tooltip,
  InputNumber,
  Upload,
  Divider,
  Badge
} from 'antd';
import { 
  InboxOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  DesktopOutlined,
  LaptopOutlined,
  PrinterOutlined,
  PhoneOutlined,
  WifiOutlined,
  ToolOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const ITInventoryManagement = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view'
  const [form] = Form.useForm();
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    location: 'all',
    dateRange: null,
    searchText: '',
    lowStock: false
  });
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchInventory();
  }, [filters, activeTab]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Mock data for demonstration - replace with actual API call
      const mockInventory = [
        {
          _id: '1',
          itemCode: 'IT-HW-001',
          itemName: 'Dell Latitude 5520 Laptop',
          category: 'hardware',
          subcategory: 'laptop',
          brand: 'Dell',
          model: 'Latitude 5520',
          serialNumber: 'DLL5520-001',
          specifications: {
            processor: 'Intel i5-11th Gen',
            memory: '16GB DDR4',
            storage: '512GB SSD',
            display: '15.6" FHD',
            os: 'Windows 11 Pro'
          },
          status: 'assigned',
          condition: 'good',
          location: 'Accounting Department',
          assignedTo: {
            _id: 'emp1',
            fullName: 'John Doe',
            department: 'Accounting',
            employeeId: 'EMP-001'
          },
          purchaseInfo: {
            purchaseDate: '2023-05-15',
            purchasePrice: 650000,
            supplier: 'Dell Cameroon',
            warrantyExpiry: '2026-05-15',
            invoiceNumber: 'DELL-INV-2023-001'
          },
          stockInfo: {
            quantity: 1,
            minStockLevel: 2,
            maxStockLevel: 10,
            reorderPoint: 3
          },
          maintenanceHistory: [
            {
              date: '2024-03-15',
              type: 'Preventive',
              description: 'System cleanup and software updates',
              technician: 'IT Support'
            }
          ],
          notes: 'Assigned to accounting manager. Good working condition.',
          createdAt: '2023-05-15T10:00:00Z',
          updatedAt: '2024-08-15T14:30:00Z'
        },
        {
          _id: '2',
          itemCode: 'IT-HW-002',
          itemName: 'HP LaserJet Pro 400',
          category: 'hardware',
          subcategory: 'printer',
          brand: 'HP',
          model: 'LaserJet Pro 400',
          serialNumber: 'HP-LJ-400-001',
          specifications: {
            type: 'Laser Printer',
            printSpeed: '35 ppm',
            connectivity: 'Network, USB',
            paperSize: 'A4, Letter'
          },
          status: 'available',
          condition: 'excellent',
          location: 'IT Storage Room A',
          assignedTo: null,
          purchaseInfo: {
            purchaseDate: '2024-01-10',
            purchasePrice: 320000,
            supplier: 'HP Partner',
            warrantyExpiry: '2027-01-10',
            invoiceNumber: 'HP-INV-2024-001'
          },
          stockInfo: {
            quantity: 3,
            minStockLevel: 1,
            maxStockLevel: 5,
            reorderPoint: 2
          },
          maintenanceHistory: [],
          notes: 'New stock. Ready for deployment.',
          createdAt: '2024-01-10T09:00:00Z',
          updatedAt: '2024-08-10T11:20:00Z'
        },
        {
          _id: '3',
          itemCode: 'IT-SW-001',
          itemName: 'Microsoft Office 365 License',
          category: 'software',
          subcategory: 'productivity',
          brand: 'Microsoft',
          model: 'Office 365 Business Premium',
          serialNumber: null,
          specifications: {
            type: 'Annual License',
            users: '1 User',
            applications: 'Word, Excel, PowerPoint, Outlook, Teams',
            storage: '1TB OneDrive'
          },
          status: 'assigned',
          condition: 'active',
          location: 'Cloud License',
          assignedTo: {
            _id: 'emp2',
            fullName: 'Jane Smith',
            department: 'Sales',
            employeeId: 'EMP-002'
          },
          purchaseInfo: {
            purchaseDate: '2024-01-01',
            purchasePrice: 85000,
            supplier: 'Microsoft Cameroon',
            warrantyExpiry: '2024-12-31',
            invoiceNumber: 'MS-SUB-2024-001'
          },
          stockInfo: {
            quantity: 15,
            minStockLevel: 5,
            maxStockLevel: 50,
            reorderPoint: 10
          },
          maintenanceHistory: [],
          notes: 'Annual subscription. Expires end of 2024.',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-08-01T09:00:00Z'
        },
        {
          _id: '4',
          itemCode: 'IT-HW-003',
          itemName: 'Cisco WiFi Access Point',
          category: 'hardware',
          subcategory: 'network',
          brand: 'Cisco',
          model: 'WAP321',
          serialNumber: 'CISCO-WAP-001',
          specifications: {
            standard: '802.11n',
            frequency: '2.4/5 GHz',
            speed: '300 Mbps',
            coverage: '5000 sq ft',
            poe: 'PoE Powered'
          },
          status: 'installed',
          condition: 'good',
          location: 'Main Office - Conference Room',
          assignedTo: null,
          purchaseInfo: {
            purchaseDate: '2023-09-20',
            purchasePrice: 180000,
            supplier: 'Cisco Partner',
            warrantyExpiry: '2026-09-20',
            invoiceNumber: 'CISCO-INV-2023-001'
          },
          stockInfo: {
            quantity: 1,
            minStockLevel: 1,
            maxStockLevel: 3,
            reorderPoint: 1
          },
          maintenanceHistory: [
            {
              date: '2024-06-15',
              type: 'Firmware Update',
              description: 'Updated to latest firmware version',
              technician: 'Network Admin'
            }
          ],
          notes: 'Installed in main conference room. Good signal coverage.',
          createdAt: '2023-09-20T14:00:00Z',
          updatedAt: '2024-06-15T16:30:00Z'
        },
        {
          _id: '5',
          itemCode: 'IT-HW-004',
          itemName: 'Logitech Wireless Mouse',
          category: 'hardware',
          subcategory: 'accessories',
          brand: 'Logitech',
          model: 'M220',
          serialNumber: null,
          specifications: {
            type: 'Wireless Optical',
            connectivity: '2.4GHz USB Receiver',
            battery: '18-month battery life',
            compatibility: 'Windows, Mac, Linux'
          },
          status: 'available',
          condition: 'new',
          location: 'IT Storage Room A',
          assignedTo: null,
          purchaseInfo: {
            purchaseDate: '2024-08-01',
            purchasePrice: 15000,
            supplier: 'Local IT Supplier',
            warrantyExpiry: '2025-08-01',
            invoiceNumber: 'LOG-INV-2024-001'
          },
          stockInfo: {
            quantity: 2,
            minStockLevel: 5,
            maxStockLevel: 20,
            reorderPoint: 8
          },
          maintenanceHistory: [],
          notes: 'Low stock - need to reorder soon.',
          createdAt: '2024-08-01T10:00:00Z',
          updatedAt: '2024-08-01T10:00:00Z'
        },
        {
          _id: '6',
          itemCode: 'IT-HW-005',
          itemName: 'External Hard Drive 2TB',
          category: 'hardware',
          subcategory: 'storage',
          brand: 'Seagate',
          model: 'Backup Plus Slim',
          serialNumber: 'SEA-2TB-001',
          specifications: {
            capacity: '2TB',
            interface: 'USB 3.0',
            speed: '5400 RPM',
            compatibility: 'Windows, Mac'
          },
          status: 'maintenance',
          condition: 'needs_repair',
          location: 'IT Repair Center',
          assignedTo: null,
          purchaseInfo: {
            purchaseDate: '2023-03-10',
            purchasePrice: 95000,
            supplier: 'Seagate Distributor',
            warrantyExpiry: '2026-03-10',
            invoiceNumber: 'SEA-INV-2023-001'
          },
          stockInfo: {
            quantity: 1,
            minStockLevel: 2,
            maxStockLevel: 10,
            reorderPoint: 3
          },
          maintenanceHistory: [
            {
              date: '2024-08-18',
              type: 'Repair',
              description: 'Drive not recognized. Under diagnosis.',
              technician: 'Hardware Specialist'
            }
          ],
          notes: 'Under repair - drive recognition issues.',
          createdAt: '2023-03-10T11:00:00Z',
          updatedAt: '2024-08-18T15:45:00Z'
        }
      ];

      setInventory(mockInventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError(error.response?.data?.message || 'Failed to fetch inventory data');
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await fetchInventory();
  };

  const handleAddItem = () => {
    setModalType('add');
    setSelectedItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditItem = (item) => {
    setModalType('edit');
    setSelectedItem(item);
    form.setFieldsValue({
      itemName: item.itemName,
      category: item.category,
      subcategory: item.subcategory,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      status: item.status,
      condition: item.condition,
      location: item.location,
      assignedTo: item.assignedTo?._id,
      purchaseDate: item.purchaseInfo?.purchaseDate ? dayjs(item.purchaseInfo.purchaseDate) : null,
      purchasePrice: item.purchaseInfo?.purchasePrice,
      supplier: item.purchaseInfo?.supplier,
      warrantyExpiry: item.purchaseInfo?.warrantyExpiry ? dayjs(item.purchaseInfo.warrantyExpiry) : null,
      quantity: item.stockInfo?.quantity,
      minStockLevel: item.stockInfo?.minStockLevel,
      maxStockLevel: item.stockInfo?.maxStockLevel,
      notes: item.notes
    });
    setModalVisible(true);
  };

  const handleViewItem = (item) => {
    setModalType('view');
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      const itemData = {
        ...values,
        purchaseDate: values.purchaseDate?.toISOString(),
        warrantyExpiry: values.warrantyExpiry?.toISOString(),
        itemCode: modalType === 'add' ? generateItemCode(values.category) : selectedItem?.itemCode
      };

      console.log(`${modalType === 'add' ? 'Adding' : 'Updating'} inventory item:`, itemData);
      
      // Mock API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success(`Inventory item ${modalType === 'add' ? 'added' : 'updated'} successfully`);
      setModalVisible(false);
      setSelectedItem(null);
      form.resetFields();
      await fetchInventory();
    } catch (error) {
      console.error('Error saving inventory item:', error);
      message.error('Failed to save inventory item');
    } finally {
      setLoading(false);
    }
  };

  const generateItemCode = (category) => {
    const prefix = {
      'hardware': 'IT-HW',
      'software': 'IT-SW',
      'network': 'IT-NW',
      'mobile': 'IT-MB',
      'accessories': 'IT-AC'
    };
    const categoryPrefix = prefix[category] || 'IT-GN';
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${categoryPrefix}-${randomNum}`;
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'available': { color: 'green', icon: <CheckCircleOutlined />, text: 'Available' },
      'assigned': { color: 'blue', icon: <InfoCircleOutlined />, text: 'Assigned' },
      'installed': { color: 'cyan', icon: <ToolOutlined />, text: 'Installed' },
      'maintenance': { color: 'orange', icon: <WarningOutlined />, text: 'Maintenance' },
      'retired': { color: 'gray', icon: <CloseCircleOutlined />, text: 'Retired' },
      'lost': { color: 'red', icon: <CloseCircleOutlined />, text: 'Lost/Stolen' }
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getConditionTag = (condition) => {
    const conditionMap = {
      'excellent': { color: 'green', text: 'Excellent' },
      'good': { color: 'blue', text: 'Good' },
      'fair': { color: 'orange', text: 'Fair' },
      'poor': { color: 'red', text: 'Poor' },
      'new': { color: 'cyan', text: 'New' },
      'active': { color: 'green', text: 'Active' },
      'needs_repair': { color: 'red', text: 'Needs Repair' }
    };

    const conditionInfo = conditionMap[condition] || { color: 'default', text: condition };
    return <Tag color={conditionInfo.color}>{conditionInfo.text}</Tag>;
  };

  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'hardware': <DesktopOutlined style={{ color: '#1890ff' }} />,
      'software': <ToolOutlined style={{ color: '#722ed1' }} />,
      'network': <WifiOutlined style={{ color: '#13c2c2' }} />,
      'mobile': <PhoneOutlined style={{ color: '#eb2f96' }} />,
      'accessories': <InboxOutlined style={{ color: '#52c41a' }} />
    };

    return categoryIcons[category] || <InboxOutlined style={{ color: '#666' }} />;
  };

  const isLowStock = (item) => {
    return item.stockInfo && item.stockInfo.quantity <= item.stockInfo.minStockLevel;
  };

  const inventoryColumns = [
    {
      title: 'Item Code',
      dataIndex: 'itemCode',
      key: 'itemCode',
      render: (code, record) => (
        <div>
          <Text code style={{ fontSize: '12px' }}>{code}</Text>
          {isLowStock(record) && (
            <div>
              <Badge status="warning" text="Low Stock" />
            </div>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Item Details',
      key: 'itemDetails',
      render: (_, record) => (
        <div>
          <Space style={{ marginBottom: '4px' }}>
            {getCategoryIcon(record.category)}
            <Text strong style={{ fontSize: '13px' }}>{record.itemName}</Text>
          </Space>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.brand} {record.model}
          </Text>
          {record.serialNumber && (
            <>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                S/N: {record.serialNumber}
              </Text>
            </>
          )}
        </div>
      ),
      width: 280
    },
    {
      title: 'Category',
      key: 'category',
      render: (_, record) => (
        <div>
          <Tag color="blue" style={{ fontSize: '11px' }}>
            {record.category?.toUpperCase()}
          </Tag>
          <br />
          <Text type="secondary" style={{ fontSize: '10px' }}>
            {record.subcategory}
          </Text>
        </div>
      ),
      filters: [
        { text: 'Hardware', value: 'hardware' },
        { text: 'Software', value: 'software' },
        { text: 'Network', value: 'network' },
        { text: 'Mobile', value: 'mobile' },
        { text: 'Accessories', value: 'accessories' }
      ],
      onFilter: (value, record) => record.category === value,
      width: 110
    },
    {
      title: 'Status & Condition',
      key: 'statusCondition',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          {getStatusTag(record.status)}
          {getConditionTag(record.condition)}
        </Space>
      ),
      width: 130
    },
    {
      title: 'Location & Assignment',
      key: 'locationAssignment',
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: '12px' }}>
            📍 {record.location}
          </Text>
          {record.assignedTo && (
            <>
              <br />
              <Text style={{ fontSize: '11px', color: '#1890ff' }}>
                👤 {record.assignedTo.fullName}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {record.assignedTo.department}
              </Text>
            </>
          )}
        </div>
      ),
      width: 160
    },
    {
      title: 'Stock Info',
      key: 'stockInfo',
      render: (_, record) => (
        <div>
          {record.stockInfo && (
            <>
              <Text style={{ fontSize: '12px' }}>
                Qty: {record.stockInfo.quantity}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Min: {record.stockInfo.minStockLevel}
              </Text>
              <br />
              {isLowStock(record) && (
                <Tag color="red" size="small">Low Stock</Tag>
              )}
            </>
          )}
        </div>
      ),
      width: 100
    },
    {
      title: 'Purchase Info',
      key: 'purchaseInfo',
      render: (_, record) => (
        <div>
          {record.purchaseInfo && (
            <>
              <Text style={{ fontSize: '12px' }}>
                XAF {record.purchaseInfo.purchasePrice?.toLocaleString()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                {new Date(record.purchaseInfo.purchaseDate).toLocaleDateString()}
              </Text>
              <br />
              <Text type="secondary" style={{ fontSize: '10px' }}>
                Warranty: {new Date(record.purchaseInfo.warrantyExpiry).toLocaleDateString()}
              </Text>
            </>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button 
              type="link" 
              icon={<InfoCircleOutlined />}
              onClick={() => handleViewItem(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edit Item">
            <Button 
              type="link" 
              icon={<EditOutlined />}
              onClick={() => handleEditItem(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Delete Item">
            <Button 
              type="link" 
              icon={<DeleteOutlined />}
              onClick={() => {
                Modal.confirm({
                  title: 'Delete Inventory Item',
                  content: `Are you sure you want to delete ${record.itemName}?`,
                  onOk: () => {
                    message.success('Item deleted successfully');
                    fetchInventory();
                  }
                });
              }}
              size="small"
              danger
            />
          </Tooltip>
        </Space>
      ),
      width: 120
    }
  ];

  const filteredInventory = inventory.filter(item => {
    if (activeTab !== 'all') {
      if (activeTab === 'hardware' && item.category !== 'hardware') return false;
      if (activeTab === 'software' && item.category !== 'software') return false;
      if (activeTab === 'low_stock' && !isLowStock(item)) return false;
      if (activeTab === 'assigned' && item.status !== 'assigned') return false;
    }
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.location !== 'all' && item.location !== filters.location) return false;
    if (filters.lowStock && !isLowStock(item)) return false;
    if (filters.dateRange) {
      const purchaseDate = dayjs(item.purchaseInfo?.purchaseDate);
      if (purchaseDate.isBefore(filters.dateRange[0]) || purchaseDate.isAfter(filters.dateRange[1])) {
        return false;
      }
    }
    if (filters.searchText) {
      const searchText = filters.searchText.toLowerCase();
      const matchesCode = item.itemCode.toLowerCase().includes(searchText);
      const matchesName = item.itemName.toLowerCase().includes(searchText);
      const matchesBrand = item.brand?.toLowerCase().includes(searchText);
      const matchesModel = item.model?.toLowerCase().includes(searchText);
      const matchesSerial = item.serialNumber?.toLowerCase().includes(searchText);
      if (!matchesCode && !matchesName && !matchesBrand && !matchesModel && !matchesSerial) return false;
    }
    return true;
  });

  const getStatsCards = () => {
    const totalItems = inventory.length;
    const availableItems = inventory.filter(i => i.status === 'available').length;
    const assignedItems = inventory.filter(i => i.status === 'assigned').length;
    const maintenanceItems = inventory.filter(i => i.status === 'maintenance').length;
    const lowStockItems = inventory.filter(i => isLowStock(i)).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.purchaseInfo?.purchasePrice || 0), 0);

    return (
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Items"
              value={totalItems}
              valueStyle={{ color: '#1890ff' }}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Available"
              value={availableItems}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Assigned"
              value={assignedItems}
              valueStyle={{ color: '#1890ff' }}
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Maintenance"
              value={maintenanceItems}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Low Stock"
              value={lowStockItems}
              valueStyle={{ color: lowStockItems > 0 ? '#ff4d4f' : '#52c41a' }}
              prefix={<WarningOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8} md={4}>
          <Card size="small">
            <Statistic
              title="Total Value"
              value={`${(totalValue / 1000000).toFixed(1)}M`}
              valueStyle={{ color: '#722ed1' }}
              prefix={<BarChartOutlined />}
              suffix="XAF"
            />
          </Card>
        </Col>
      </Row>
    );
  };

  if (loading && inventory.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading inventory data...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <InboxOutlined /> IT Inventory Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              icon={<ExportOutlined />}
              onClick={() => message.info('Export functionality to be implemented')}
            >
              Export
            </Button>
            <Button 
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Add Item
            </Button>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {/* Stats Cards */}
        {getStatsCards()}

        {/* Tabs for different views */}
        <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
          <TabPane 
            tab={
              <span>
                <InboxOutlined />
                All Items ({inventory.length})
              </span>
            } 
            key="all"
          />
          <TabPane 
            tab={
              <span>
                <DesktopOutlined />
                Hardware ({inventory.filter(i => i.category === 'hardware').length})
              </span>
            } 
            key="hardware"
          />
          <TabPane 
            tab={
              <span>
                <ToolOutlined />
                Software ({inventory.filter(i => i.category === 'software').length})
              </span>
            } 
            key="software"
          />
          <TabPane 
            tab={
              <span>
                <InfoCircleOutlined />
                Assigned ({inventory.filter(i => i.status === 'assigned').length})
              </span>
            } 
            key="assigned"
          />
          <TabPane 
            tab={
              <span>
                <WarningOutlined />
                Low Stock ({inventory.filter(i => isLowStock(i)).length})
              </span>
            } 
            key="low_stock"
          />
        </Tabs>

        {/* Filters */}
        <Card size="small" style={{ marginBottom: '16px' }}>
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Input
                placeholder="Search by item code, name, brand, model, or serial number..."
                prefix={<SearchOutlined />}
                value={filters.searchText}
                onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                allowClear
              />
            </Col>
            <Col>
              <Select
                style={{ width: 120 }}
                value={filters.category}
                onChange={(value) => setFilters({...filters, category: value})}
                placeholder="Category"
              >
                <Select.Option value="all">All Categories</Select.Option>
                <Select.Option value="hardware">Hardware</Select.Option>
                <Select.Option value="software">Software</Select.Option>
                <Select.Option value="network">Network</Select.Option>
                <Select.Option value="mobile">Mobile</Select.Option>
                <Select.Option value="accessories">Accessories</Select.Option>
              </Select>
            </Col>
            <Col>
              <Select
                style={{ width: 110 }}
                value={filters.status}
                onChange={(value) => setFilters({...filters, status: value})}
                placeholder="Status"
              >
                <Select.Option value="all">All Status</Select.Option>
                <Select.Option value="available">Available</Select.Option>
                <Select.Option value="assigned">Assigned</Select.Option>
                <Select.Option value="installed">Installed</Select.Option>
                <Select.Option value="maintenance">Maintenance</Select.Option>
                <Select.Option value="retired">Retired</Select.Option>
              </Select>
            </Col>
            <Col>
              <RangePicker
                style={{ width: 240 }}
                value={filters.dateRange}
                onChange={(dates) => setFilters({...filters, dateRange: dates})}
                placeholder={['Purchase Start', 'Purchase End']}
              />
            </Col>
            <Col>
              <Button 
                icon={<FilterOutlined />}
                onClick={() => setFilters({
                  category: 'all',
                  status: 'all',
                  location: 'all',
                  dateRange: null,
                  searchText: '',
                  lowStock: false
                })}
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card>

        {/* Low Stock Alert */}
        {inventory.filter(i => isLowStock(i)).length > 0 && (
          <Alert
            message="Low Stock Alert"
            description={`${inventory.filter(i => isLowStock(i)).length} items are running low on stock. Consider reordering soon.`}
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
            action={
              <Button
                size="small"
                type="primary"
                onClick={() => setActiveTab('low_stock')}
              >
                View Low Stock Items
              </Button>
            }
          />
        )}

        {filteredInventory.length === 0 ? (
          <Alert
            message="No Inventory Items Found"
            description={
              inventory.length === 0 
                ? "No inventory items have been added yet. Click 'Add Item' to get started."
                : "No items match your current filter criteria. Try adjusting the filters above."
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <>
            <Text type="secondary" style={{ marginBottom: '8px', display: 'block' }}>
              Showing {filteredInventory.length} of {inventory.length} items
            </Text>
            
            <Table 
              columns={inventoryColumns} 
              dataSource={filteredInventory} 
              loading={loading}
              rowKey="_id"
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => 
                  `${range[0]}-${range[1]} of ${total} items`
              }}
              scroll={{ x: 'max-content' }}
              rowClassName={(record) => {
                if (isLowStock(record)) {
                  return 'low-stock-row';
                }
                if (record.status === 'maintenance') {
                  return 'maintenance-row';
                }
                return '';
              }}
            />
          </>
        )}
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        title={`${modalType === 'add' ? 'Add New' : modalType === 'edit' ? 'Edit' : 'View'} Inventory Item`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setSelectedItem(null);
          form.resetFields();
        }}
        onOk={modalType !== 'view' ? () => form.submit() : undefined}
        width={800}
        confirmLoading={loading}
        footer={modalType === 'view' ? [
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>
        ] : undefined}
      >
        {modalType === 'view' && selectedItem ? (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Basic Information" size="small">
                  <p><strong>Item Code:</strong> {selectedItem.itemCode}</p>
                  <p><strong>Item Name:</strong> {selectedItem.itemName}</p>
                  <p><strong>Category:</strong> {selectedItem.category}</p>
                  <p><strong>Brand:</strong> {selectedItem.brand}</p>
                  <p><strong>Model:</strong> {selectedItem.model}</p>
                  <p><strong>Serial Number:</strong> {selectedItem.serialNumber || 'N/A'}</p>
                  <p><strong>Status:</strong> {getStatusTag(selectedItem.status)}</p>
                  <p><strong>Condition:</strong> {getConditionTag(selectedItem.condition)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Location & Assignment" size="small">
                  <p><strong>Location:</strong> {selectedItem.location}</p>
                  {selectedItem.assignedTo && (
                    <>
                      <p><strong>Assigned To:</strong> {selectedItem.assignedTo.fullName}</p>
                      <p><strong>Department:</strong> {selectedItem.assignedTo.department}</p>
                      <p><strong>Employee ID:</strong> {selectedItem.assignedTo.employeeId}</p>
                    </>
                  )}
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Card title="Purchase Information" size="small">
                  <p><strong>Purchase Date:</strong> {new Date(selectedItem.purchaseInfo?.purchaseDate).toLocaleDateString()}</p>
                  <p><strong>Purchase Price:</strong> XAF {selectedItem.purchaseInfo?.purchasePrice?.toLocaleString()}</p>
                  <p><strong>Supplier:</strong> {selectedItem.purchaseInfo?.supplier}</p>
                  <p><strong>Warranty Expiry:</strong> {new Date(selectedItem.purchaseInfo?.warrantyExpiry).toLocaleDateString()}</p>
                  <p><strong>Invoice Number:</strong> {selectedItem.purchaseInfo?.invoiceNumber}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Stock Information" size="small">
                  <p><strong>Current Quantity:</strong> {selectedItem.stockInfo?.quantity}</p>
                  <p><strong>Minimum Level:</strong> {selectedItem.stockInfo?.minStockLevel}</p>
                  <p><strong>Maximum Level:</strong> {selectedItem.stockInfo?.maxStockLevel}</p>
                  <p><strong>Reorder Point:</strong> {selectedItem.stockInfo?.reorderPoint}</p>
                  {isLowStock(selectedItem) && (
                    <Alert message="Low Stock Alert" type="warning" size="small" />
                  )}
                </Card>
              </Col>
            </Row>

            {selectedItem.specifications && (
              <Card title="Specifications" size="small" style={{ marginTop: '16px' }}>
                {Object.entries(selectedItem.specifications).map(([key, value]) => (
                  <p key={key}><strong>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</strong> {value}</p>
                ))}
              </Card>
            )}

            {selectedItem.maintenanceHistory && selectedItem.maintenanceHistory.length > 0 && (
              <Card title="Maintenance History" size="small" style={{ marginTop: '16px' }}>
                {selectedItem.maintenanceHistory.map((maintenance, index) => (
                  <div key={index} style={{ marginBottom: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                    <p style={{ margin: 0 }}><strong>Date:</strong> {new Date(maintenance.date).toLocaleDateString()}</p>
                    <p style={{ margin: 0 }}><strong>Type:</strong> {maintenance.type}</p>
                    <p style={{ margin: 0 }}><strong>Description:</strong> {maintenance.description}</p>
                    <p style={{ margin: 0 }}><strong>Technician:</strong> {maintenance.technician}</p>
                  </div>
                ))}
              </Card>
            )}

            {selectedItem.notes && (
              <Card title="Notes" size="small" style={{ marginTop: '16px' }}>
                <p>{selectedItem.notes}</p>
              </Card>
            )}
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="itemName"
                  label="Item Name"
                  rules={[{ required: true, message: 'Please enter item name' }]}
                >
                  <Input placeholder="Enter item name" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select placeholder="Select category">
                    <Select.Option value="hardware">Hardware</Select.Option>
                    <Select.Option value="software">Software</Select.Option>
                    <Select.Option value="network">Network</Select.Option>
                    <Select.Option value="mobile">Mobile</Select.Option>
                    <Select.Option value="accessories">Accessories</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="brand" label="Brand">
                  <Input placeholder="Enter brand" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="model" label="Model">
                  <Input placeholder="Enter model" />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="serialNumber" label="Serial Number">
                  <Input placeholder="Enter serial number" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    <Select.Option value="available">Available</Select.Option>
                    <Select.Option value="assigned">Assigned</Select.Option>
                    <Select.Option value="installed">Installed</Select.Option>
                    <Select.Option value="maintenance">Maintenance</Select.Option>
                    <Select.Option value="retired">Retired</Select.Option>
                    <Select.Option value="lost">Lost/Stolen</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="condition"
                  label="Condition"
                  rules={[{ required: true, message: 'Please select condition' }]}
                >
                  <Select placeholder="Select condition">
                    <Select.Option value="new">New</Select.Option>
                    <Select.Option value="excellent">Excellent</Select.Option>
                    <Select.Option value="good">Good</Select.Option>
                    <Select.Option value="fair">Fair</Select.Option>
                    <Select.Option value="poor">Poor</Select.Option>
                    <Select.Option value="needs_repair">Needs Repair</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="location"
                  label="Location"
                  rules={[{ required: true, message: 'Please enter location' }]}
                >
                  <Input placeholder="Enter location" />
                </Form.Item>
              </Col>
            </Row>

            <Divider>Purchase Information</Divider>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="purchaseDate" label="Purchase Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="purchasePrice" label="Purchase Price (XAF)">
                  <InputNumber
                    style={{ width: '100%' }}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                    placeholder="Enter purchase price"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="warrantyExpiry" label="Warranty Expiry">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="supplier" label="Supplier">
              <Input placeholder="Enter supplier name" />
            </Form.Item>

            <Divider>Stock Information</Divider>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="quantity"
                  label="Current Quantity"
                  rules={[{ required: true, message: 'Please enter quantity' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Enter quantity"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="minStockLevel" label="Minimum Stock Level">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Enter minimum level"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="maxStockLevel" label="Maximum Stock Level">
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Enter maximum level"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="notes" label="Notes">
              <TextArea
                rows={3}
                placeholder="Enter any additional notes..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <style jsx>{`
        .low-stock-row {
          background-color: #fff2e8 !important;
          border-left: 3px solid #fa8c16 !important;
        }
        .low-stock-row:hover {
          background-color: #ffe7d6 !important;
        }
        .maintenance-row {
          background-color: #fff1f0 !important;
          border-left: 3px solid #ff7a45 !important;
        }
        .maintenance-row:hover {
          background-color: #ffe7e6 !important;
        }
      `}</style>
    </div>
  );
};

export default ITInventoryManagement;