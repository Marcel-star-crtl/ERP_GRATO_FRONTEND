import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Button,
  Space,
  Select,
  DatePicker,
  Typography,
  message,
  Statistic,
  Tag,
  Divider,
  Progress
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  BarChartOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  exportUtilizationReportToExcel,
  exportUtilizationReportToPDF
} from '../../services/exportService';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const BudgetReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    fiscalYear: new Date().getFullYear(),
    department: null,
    budgetType: null
  });

  useEffect(() => {
    fetchReport();
  }, [filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.fiscalYear) params.append('fiscalYear', filters.fiscalYear);
      if (filters.department) params.append('department', filters.department);
      if (filters.budgetType) params.append('budgetType', filters.budgetType);

      const response = await api.get(`/budget-codes/reports/utilization?${params}`);
      if (response.data.success) {
        setReportData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
      message.error('Failed to load budget report');
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    const result = exportUtilizationReportToExcel(reportData, 'budget_utilization_report');
    if (result.success) {
        message.success(result.message);
    } else {
        message.error(result.message);
    }
    };

  const handleExportPDF = () => {
    const result = exportUtilizationReportToPDF(reportData, 'budget_utilization_report');
    if (result.success) {
        message.success(result.message);
    } else {
        message.error(result.message);
    }
  };

  const departmentColumns = [
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Total Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `XAF ${budget.toLocaleString()}`,
      sorter: (a, b) => a.budget - b.budget
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      render: (used) => `XAF ${used.toLocaleString()}`,
      sorter: (a, b) => a.used - b.used
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (remaining) => (
        <Text style={{ color: '#52c41a' }}>
          XAF {remaining.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.remaining - b.remaining
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization) => (
        <Progress
          percent={utilization}
          size="small"
          status={utilization >= 90 ? 'exception' : utilization >= 75 ? 'active' : 'success'}
        />
      ),
      sorter: (a, b) => a.utilization - b.utilization
    },
    {
      title: 'Codes',
      dataIndex: 'count',
      key: 'count',
      align: 'center'
    }
  ];

  const budgetTypeColumns = [
    {
      title: 'Budget Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => <Tag color="purple">{type}</Tag>
    },
    {
      title: 'Total Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `XAF ${budget.toLocaleString()}`,
      sorter: (a, b) => a.budget - b.budget
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      render: (used) => `XAF ${used.toLocaleString()}`,
      sorter: (a, b) => a.used - b.used
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (remaining) => (
        <Text style={{ color: '#52c41a' }}>
          XAF {remaining.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.remaining - b.remaining
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization) => (
        <Progress
          percent={utilization}
          size="small"
          status={utilization >= 90 ? 'exception' : utilization >= 75 ? 'active' : 'success'}
        />
      ),
      sorter: (a, b) => a.utilization - b.utilization
    },
    {
      title: 'Codes',
      dataIndex: 'count',
      key: 'count',
      align: 'center'
    }
  ];

  const topUtilizersColumns = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Text code strong>{code}</Text>
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (dept) => <Tag color="blue">{dept}</Tag>
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      render: (budget) => `XAF ${budget.toLocaleString()}`
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
      render: (used) => `XAF ${used.toLocaleString()}`
    },
    {
      title: 'Remaining',
      dataIndex: 'remaining',
      key: 'remaining',
      render: (remaining) => (
        <Text style={{ color: remaining < 1000000 ? '#f5222d' : '#52c41a' }}>
          XAF {remaining.toLocaleString()}
        </Text>
      )
    },
    {
      title: 'Utilization',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (utilization) => (
        <Tag color={utilization >= 90 ? 'red' : 'orange'}>
          {utilization}%
        </Tag>
      ),
      sorter: (a, b) => b.utilization - a.utilization
    }
  ];

  if (!reportData) {
    return (
      <div style={{ padding: '24px' }}>
        <Card loading={loading}>
          <Text>Loading report...</Text>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2} style={{ margin: 0 }}>
          <BarChartOutlined /> Budget Utilization Report
        </Title>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchReport}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16}>
          <Col span={8}>
            <Text strong>Fiscal Year:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.fiscalYear}
              onChange={(value) => setFilters({ ...filters, fiscalYear: value })}
            >
              <Option value={2024}>2024</Option>
              <Option value={2025}>2025</Option>
              <Option value={2026}>2026</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Department:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.department}
              onChange={(value) => setFilters({ ...filters, department: value })}
              allowClear
              placeholder="All Departments"
            >
              <Option value="IT">IT</Option>
              <Option value="Finance">Finance</Option>
              <Option value="HR">HR</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Sales">Sales</Option>
              <Option value="Engineering">Engineering</Option>
              <Option value="Business Development & Supply Chain">Supply Chain</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Text strong>Budget Type:</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.budgetType}
              onChange={(value) => setFilters({ ...filters, budgetType: value })}
              allowClear
              placeholder="All Types"
            >
              <Option value="OPEX">OPEX</Option>
              <Option value="CAPEX">CAPEX</Option>
              <Option value="PROJECT">PROJECT</Option>
              <Option value="OPERATIONAL">OPERATIONAL</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Budget"
              value={reportData.summary.totalBudget}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Used"
              value={reportData.summary.totalUsed}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Remaining"
              value={reportData.summary.totalRemaining}
              prefix="XAF"
              formatter={value => value.toLocaleString()}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Utilization"
              value={reportData.summary.averageUtilization}
              suffix="%"
              valueStyle={{
                color: reportData.summary.averageUtilization >= 90 ? '#f5222d' :
                       reportData.summary.averageUtilization >= 75 ? '#faad14' : '#52c41a'
              }}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {reportData.summary.codesCount} budget codes
            </Text>
          </Card>
        </Col>
      </Row>

      {/* By Department */}
      <Card title="Budget Utilization by Department" style={{ marginBottom: '24px' }}>
        <Table
          columns={departmentColumns}
          dataSource={Object.keys(reportData.byDepartment).map(dept => ({
            department: dept,
            ...reportData.byDepartment[dept]
          }))}
          loading={loading}
          rowKey="department"
          pagination={false}
        />
      </Card>

      {/* By Budget Type */}
      <Card title="Budget Utilization by Type" style={{ marginBottom: '24px' }}>
        <Table
          columns={budgetTypeColumns}
          dataSource={Object.keys(reportData.byBudgetType).map(type => ({
            type: type,
            ...reportData.byBudgetType[type]
          }))}
          loading={loading}
          rowKey="type"
          pagination={false}
        />
      </Card>

      {/* Top Utilizers */}
      {reportData.topUtilizers && reportData.topUtilizers.length > 0 && (
        <Card title="Top Utilizers (≥80%)" style={{ marginBottom: '24px' }}>
          <Table
            columns={topUtilizersColumns}
            dataSource={reportData.topUtilizers}
            loading={loading}
            rowKey="code"
            pagination={false}
          />
        </Card>
      )}

      {/* Underutilized */}
      {reportData.underutilized && reportData.underutilized.length > 0 && (
        <Card title="Underutilized Budget Codes (<40%)">
          <Table
            columns={topUtilizersColumns}
            dataSource={reportData.underutilized}
            loading={loading}
            rowKey="code"
            pagination={false}
          />
        </Card>
      )}
    </div>
  );
};

export default BudgetReports;