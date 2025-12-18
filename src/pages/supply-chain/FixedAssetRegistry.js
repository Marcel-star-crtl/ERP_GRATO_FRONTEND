import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  message,
  Tooltip,
  Badge
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  BarcodeOutlined,
  EditOutlined,
  EyeOutlined,
  ToolOutlined,
  SwapOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;

const FixedAssetRegistry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50 });

  useEffect(() => {
    fetchDashboardData();
    fetchAssets();
  }, [statusFilter, conditionFilter, pagination.current]);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/fixed-assets/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/fixed-assets', {
        params: {
          status: statusFilter !== 'all' ? statusFilter : undefined,
          condition: conditionFilter !== 'all' ? conditionFilter : undefined,
          search: searchText || undefined,
          page: pagination.current,
          limit: pagination.pageSize
        }
      });
      
      setAssets(response.data.data.assets || []);
      setPagination({
        ...pagination,
        total: response.data.data.pagination.totalRecords
      });
    } catch (error) {
      console.error('Error fetching assets:', error);
      message.error('Failed to load fixed assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, current: 1 });
    fetchAssets();
  };

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const printBarcode = async (assetTag) => {
    try {
      const response = await api.get(`/fixed-assets/${assetTag}/barcode`);
      const barcodeData = response.data.data.barcode;
      
      // Open print window with barcode
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Asset Tag - ${assetTag}</title>
            <style>
              body { 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                height: 100vh; 
                margin: 0;
                font-family: Arial, sans-serif;
              }
              .barcode-container {
                text-align: center;
                padding: 20px;
                border: 2px solid #000;
              }
              img { max-width: 300px; }
              h2 { margin: 10px 0; }
            </style>
          </head>
          <body>
            <div class="barcode-container">
              <h2>Asset Tag: ${assetTag}</h2>
              <img src="${barcodeData}" alt="Barcode" />
              <p>${response.data.data.assetName}</p>
            </div>
            <script>
              window.onload = () => {
                window.print();
                window.onafterprint = () => window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing barcode:', error);
      message.error('Failed to print barcode');
    }
  };

  const columns = [
    {
      title: 'Asset Tag',
      dataIndex: 'assetTag',
      key: 'assetTag',
      width: 120,
      fixed: 'left',
      render: (tag, record) => (
        <Space direction="vertical" size="small">
          <Text strong style={{ fontSize: '14px' }}>{tag}</Text>
          <Button
            type="link"
            size="small"
            icon={<BarcodeOutlined />}
            onClick={() => printBarcode(tag)}
            style={{ padding: 0 }}
          >
            Print
          </Button>
        </Space>
      )
    },
    {
      title: 'Asset Name',
      dataIndex: 'assetName',
      key: 'assetName',
      width: 250,
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.item?.code} - {record.item?.category}
          </Text>
        </div>
      )
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 150
    },
    {
      title: 'Acquisition Date',
      dataIndex: 'acquisitionDate',
      key: 'acquisitionDate',
      width: 120,
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Acquisition Cost',
      dataIndex: 'acquisitionCost',
      key: 'acquisitionCost',
      width: 130,
      align: 'right',
      render: (cost) => `${cost.toLocaleString()} XAF`
    },
    {
      title: 'Current Value',
      dataIndex: 'currentBookValue',
      key: 'currentBookValue',
      width: 130,
      align: 'right',
      render: (value) => (
        <Text strong style={{ color: '#52c41a' }}>
          {value.toLocaleString()} XAF
        </Text>
      )
    },
    {
      title: 'Assigned To',
      key: 'assignment',
      width: 180,
      render: (_, record) => {
        if (record.currentAssignment?.assignedTo) {
          return (
            <div>
              <Text>{record.currentAssignment.assignedToName}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {record.currentAssignment.assignedDepartment}
              </Text>
            </div>
          );
        }
        return <Text type="secondary">Unassigned</Text>;
      }
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      width: 100,
      align: 'center',
      render: (condition) => {
        const colors = {
          excellent: 'green',
          good: 'blue',
          fair: 'orange',
          poor: 'red',
          damaged: 'red'
        };
        return (
          <Tag color={colors[condition] || 'default'}>
            {condition?.toUpperCase()}
          </Tag>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      align: 'center',
      render: (status, record) => {
        const colors = {
          active: 'green',
          'in-use': 'blue',
          'in-maintenance': 'orange',
          'in-storage': 'cyan',
          retired: 'default',
          disposed: 'red'
        };
        
        return (
          <Space direction="vertical" size="small">
            <Tag color={colors[status] || 'default'}>
              {status?.toUpperCase().replace('-', ' ')}
            </Tag>
            {record.isOverdue && (
              <Tooltip title="Inspection overdue">
                <Badge status="error" text="Overdue" />
              </Tooltip>
            )}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/supply-chain/fixed-assets/${record.assetTag}`)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/supply-chain/fixed-assets/${record.assetTag}/edit`)}
            />
          </Tooltip>
          {record.status !== 'disposed' && (
            <>
              <Tooltip title="Assign">
                <Button
                  size="small"
                  icon={<SwapOutlined />}
                  onClick={() => navigate(`/supply-chain/fixed-assets/${record.assetTag}/assign`)}
                />
              </Tooltip>
              <Tooltip title="Maintenance">
                <Button
                  size="small"
                  icon={<ToolOutlined />}
                  onClick={() => navigate(`/supply-chain/fixed-assets/${record.assetTag}/maintenance`)}
                />
              </Tooltip>
            </>
          )}
        </Space>
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
              <BarcodeOutlined /> Fixed Asset Registry
            </Title>
            <Text type="secondary">
              Asset tracking system with tags 0001-3000
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/supply-chain/fixed-assets/register')}
              >
                Register New Asset
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export
              </Button>
              <Button
                icon={<PrinterOutlined />}
                onClick={() => message.info('Bulk print functionality coming soon')}
              >
                Print Tags
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
                title="Total Assets"
                value={dashboardData.summary.totalAssets}
                prefix={<BarcodeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="In Use"
                value={dashboardData.summary.inUseAssets}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Value"
                value={dashboardData.valuation.totalCurrentValue}
                prefix="XAF"
                valueStyle={{ color: '#722ed1' }}
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Overdue Inspections"
                value={dashboardData.summary.overdueInspections}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Input
              placeholder="Search by asset tag, name, or serial number..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="in-use">In Use</Option>
              <Option value="in-maintenance">In Maintenance</Option>
              <Option value="in-storage">In Storage</Option>
              <Option value="retired">Retired</Option>
              <Option value="disposed">Disposed</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Condition"
              value={conditionFilter}
              onChange={setConditionFilter}
            >
              <Option value="all">All Conditions</Option>
              <Option value="excellent">Excellent</Option>
              <Option value="good">Good</Option>
              <Option value="fair">Fair</Option>
              <Option value="poor">Poor</Option>
              <Option value="damaged">Damaged</Option>
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <Button
              type="primary"
              onClick={handleSearch}
              block
            >
              Apply Filters
            </Button>
          </Col>
          <Col xs={24} md={4}>
            <Button
              onClick={() => {
                setSearchText('');
                setStatusFilter('all');
                setConditionFilter('all');
                fetchAssets();
              }}
              block
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Assets Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={assets}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} assets`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1800 }}
        />
      </Card>
    </div>
  );
};

export default FixedAssetRegistry;