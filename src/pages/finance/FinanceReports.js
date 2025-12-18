import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Button,
  Select,
  DatePicker,
  Space,
  Statistic,
  Table,
  Tag,
  Spin,
  message,
  Divider,
  Empty
} from 'antd';
import {
  BarChartOutlined,
  PieChartOutlined,
  LineChartOutlined,
  DownloadOutlined,
  FilterOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { Pie, Column, Line } from '@ant-design/plots';
import moment from 'moment';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import cashRequestAPI from '../../services/cashRequestAPI';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const FinanceReports = () => {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [filters, setFilters] = useState({
    dateRange: 'last30',
    startDate: moment().subtract(30, 'days').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    requestTypes: 'all',
    departments: 'all',
    status: 'approved_all',
    requestMode: 'all'
  });
  const [customDateRange, setCustomDateRange] = useState(null);

  const requestTypes = [
    'travel',
    'office-supplies',
    'client-entertainment',
    'emergency',
    'project-materials',
    'training',
    'accommodation',
    'perdiem',
    'bills',
    'staff-transportation',
    'staff-entertainment',
    'toll-gates',
    'office-items',
    'other'
  ];

  const dateRangePresets = [
    { label: 'Last 7 Days', value: 'last7' },
    { label: 'Last 30 Days', value: 'last30' },
    { label: 'Current Month', value: 'currentMonth' },
    { label: 'Current Quarter', value: 'currentQuarter' },
    { label: 'Custom Range', value: 'custom' }
  ];

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDateRangeChange = (value) => {
    let startDate, endDate;

    switch (value) {
      case 'last7':
        startDate = moment().subtract(7, 'days');
        endDate = moment();
        break;
      case 'last30':
        startDate = moment().subtract(30, 'days');
        endDate = moment();
        break;
      case 'currentMonth':
        startDate = moment().startOf('month');
        endDate = moment().endOf('month');
        break;
      case 'currentQuarter':
        startDate = moment().startOf('quarter');
        endDate = moment().endOf('quarter');
        break;
      case 'custom':
        return; // Custom handled separately
      default:
        startDate = moment().subtract(30, 'days');
        endDate = moment();
    }

    setFilters({
      ...filters,
      dateRange: value,
      startDate: startDate.format('YYYY-MM-DD'),
      endDate: endDate.format('YYYY-MM-DD')
    });
  };

  const handleCustomDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setCustomDateRange(dates);
      setFilters({
        ...filters,
        dateRange: 'custom',
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD')
      });
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      console.log('Fetching report data with filters:', filters);

      const response = await cashRequestAPI.get('/cash-requests/reports/analytics', {
        params: filters
      });

      if (response.data.success) {
        setReportData(response.data.data);
        message.success('Report generated successfully');
      } else {
        throw new Error('Failed to generate report');
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      message.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData?.detailedRecords) {
      message.warning('No data to export');
      return;
    }

    try {
      // Prepare data for export
      const exportData = reportData.detailedRecords.map(record => ({
        'Request ID': `REQ-${record._id.toString().slice(-6).toUpperCase()}`,
        'Employee': record.employee?.fullName || 'N/A',
        'Department': record.employee?.department || 'N/A',
        'Request Type': record.requestType?.replace(/-/g, ' ').toUpperCase() || 'N/A',
        'Request Mode': record.requestMode === 'reimbursement' ? 'Reimbursement' : 'Advance',
        'Amount Requested': record.amountRequested || 0,
        'Amount Approved': record.amountApproved || 0,
        'Status': record.status?.replace(/_/g, ' ').toUpperCase() || 'N/A',
        'Created Date': moment(record.createdAt).format('YYYY-MM-DD'),
        'Project': record.projectId?.name || 'N/A',
        'Budget Code': record.budgetAllocation?.budgetCode || 'N/A',
        'Purpose': record.purpose || 'N/A'
      }));

      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Summary sheet
      const summaryData = [
        ['Finance Report Summary'],
        ['Generated Date:', moment().format('YYYY-MM-DD HH:mm')],
        ['Period:', `${filters.startDate} to ${filters.endDate}`],
        [''],
        ['Statistics'],
        ['Total Requests:', reportData.statistics.totalRequests],
        ['Total Amount:', reportData.statistics.totalAmount],
        ['Approved:', reportData.statistics.approved],
        ['Rejected:', reportData.statistics.rejected],
        ['Pending:', reportData.statistics.pending],
        [''],
        ['By Request Type']
      ];

      reportData.byRequestType.forEach(type => {
        summaryData.push([
          type._id.replace(/-/g, ' ').toUpperCase(),
          type.totalAmount,
          type.count
        ]);
      });

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Detailed records sheet
      const wsDetails = XLSX.utils.json_to_sheet(exportData);
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Detailed Records');

      // Save file
      const fileName = `Finance_Report_${moment().format('YYYY-MM-DD_HHmm')}.xlsx`;
      XLSX.writeFile(wb, fileName);

      message.success('Report exported to Excel successfully');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export report to Excel');
    }
  };

  const exportToPDF = () => {
    if (!reportData) {
      message.warning('No data to export');
      return;
    }

    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Finance Report', 14, 20);
      
      // Report info
      doc.setFontSize(10);
      doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm')}`, 14, 30);
      doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 36);
      
      // Statistics
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, 46);
      
      doc.setFontSize(10);
      const stats = [
        ['Total Requests', reportData.statistics.totalRequests.toString()],
        ['Total Amount', `XAF ${reportData.statistics.totalAmount.toLocaleString()}`],
        ['Approved', reportData.statistics.approved.toString()],
        ['Rejected', reportData.statistics.rejected.toString()],
        ['Pending', reportData.statistics.pending.toString()]
      ];
      
      doc.autoTable({
        startY: 50,
        head: [['Metric', 'Value']],
        body: stats,
        theme: 'grid'
      });
      
      // By Request Type
      doc.setFontSize(14);
      doc.text('Breakdown by Request Type', 14, doc.lastAutoTable.finalY + 10);
      
      const typeData = reportData.byRequestType.map(type => [
        type._id.replace(/-/g, ' ').toUpperCase(),
        type.count.toString(),
        `XAF ${type.totalAmount.toLocaleString()}`,
        `XAF ${Math.round(type.avgAmount).toLocaleString()}`
      ]);
      
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 14,
        head: [['Request Type', 'Count', 'Total Amount', 'Avg Amount']],
        body: typeData,
        theme: 'striped'
      });
      
      // By Department (if space allows)
      if (reportData.byDepartment.length > 0 && doc.lastAutoTable.finalY < 250) {
        doc.setFontSize(14);
        doc.text('Breakdown by Department', 14, doc.lastAutoTable.finalY + 10);
        
        const deptData = reportData.byDepartment.slice(0, 10).map(dept => [
          dept._id || 'N/A',
          dept.count.toString(),
          `XAF ${dept.totalAmount.toLocaleString()}`
        ]);
        
        doc.autoTable({
          startY: doc.lastAutoTable.finalY + 14,
          head: [['Department', 'Count', 'Total Amount']],
          body: deptData,
          theme: 'grid'
        });
      }
      
      // Save
      const fileName = `Finance_Report_${moment().format('YYYY-MM-DD_HHmm')}.pdf`;
      doc.save(fileName);
      
      message.success('Report exported to PDF successfully');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      message.error('Failed to export report to PDF');
    }
  };

  const formatCurrency = (amount) => {
    return `XAF ${(amount || 0).toLocaleString()}`;
  };

  const detailedColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => (
        <Text code>REQ-{id.toString().slice(-6).toUpperCase()}</Text>
      ),
      width: 120
    },
    {
      title: 'Employee',
      key: 'employee',
      render: (_, record) => (
        <div>
          <Text strong>{record.employee?.fullName || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.employee?.department || 'N/A'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'requestType',
      render: (type) => (
        <Tag color="blue">
          {type?.replace(/-/g, ' ').toUpperCase() || 'N/A'}
        </Tag>
      ),
      width: 130
    },
    {
      title: 'Mode',
      dataIndex: 'requestMode',
      key: 'requestMode',
      render: (mode) => (
        <Tag color={mode === 'reimbursement' ? 'purple' : 'cyan'}>
          {mode === 'reimbursement' ? 'Reimbursement' : 'Advance'}
        </Tag>
      ),
      width: 120
    },
    {
      title: 'Requested',
      dataIndex: 'amountRequested',
      key: 'amountRequested',
      render: (amount) => formatCurrency(amount),
      sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0),
      width: 120
    },
    {
      title: 'Approved',
      dataIndex: 'amountApproved',
      key: 'amountApproved',
      render: (amount) => amount ? formatCurrency(amount) : '-',
      sorter: (a, b) => (a.amountApproved || 0) - (b.amountApproved || 0),
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColors = {
          'approved': 'green',
          'disbursed': 'cyan',
          'completed': 'purple',
          'denied': 'red'
        };
        return (
          <Tag color={statusColors[status] || 'orange'}>
            {status?.replace(/_/g, ' ').toUpperCase() || 'N/A'}
          </Tag>
        );
      },
      width: 120
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('YYYY-MM-DD'),
      sorter: (a, b) => moment(a.createdAt).unix() - moment(b.createdAt).unix(),
      width: 100
    }
  ];

  // Prepare chart data
  const prepareTypeChartData = () => {
    if (!reportData?.byRequestType) return [];
    
    return reportData.byRequestType.map(type => ({
      type: type._id.replace(/-/g, ' ').toUpperCase(),
      value: type.totalAmount,
      count: type.count
    }));
  };

  const prepareMonthlyTrendData = () => {
    if (!reportData?.byMonth) return [];
    
    return reportData.byMonth.map(month => ({
      month: `${month._id.year}-${String(month._id.month).padStart(2, '0')}`,
      amount: month.totalAmount,
      count: month.count,
      approved: month.approved,
      rejected: month.rejected
    }));
  };

  const prepareDepartmentData = () => {
    if (!reportData?.byDepartment) return [];
    
    return reportData.byDepartment.slice(0, 10).map(dept => ({
      department: dept._id || 'Unknown',
      amount: dept.totalAmount,
      count: dept.count
    }));
  };

  if (loading && !reportData) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Generating report...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BarChartOutlined /> Finance Reports & Analytics
      </Title>

      {/* Filters Card */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Text strong>Date Range</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.dateRange}
              onChange={handleDateRangeChange}
            >
              {dateRangePresets.map(preset => (
                <Option key={preset.value} value={preset.value}>
                  {preset.label}
                </Option>
              ))}
            </Select>
          </Col>

          {filters.dateRange === 'custom' && (
            <Col xs={24} sm={12} md={8}>
              <Text strong>Select Custom Range</Text>
              <RangePicker
                style={{ width: '100%', marginTop: '8px' }}
                value={customDateRange}
                onChange={handleCustomDateRangeChange}
                format="YYYY-MM-DD"
              />
            </Col>
          )}

          <Col xs={24} sm={12} md={6}>
            <Text strong>Request Type</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: '8px' }}
              placeholder="All Types"
              value={filters.requestTypes === 'all' ? [] : filters.requestTypes.split(',')}
              onChange={(values) => setFilters({
                ...filters,
                requestTypes: values.length === 0 ? 'all' : values.join(',')
              })}
              maxTagCount="responsive"
            >
              {requestTypes.map(type => (
                <Option key={type} value={type}>
                  {type.replace(/-/g, ' ').toUpperCase()}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Text strong>Request Mode</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.requestMode}
              onChange={(value) => setFilters({ ...filters, requestMode: value })}
            >
              <Option value="all">All Modes</Option>
              <Option value="advance">Advance Requests</Option>
              <Option value="reimbursement">Reimbursements</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={5}>
            <Text strong>Status</Text>
            <Select
              style={{ width: '100%', marginTop: '8px' }}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
            >
              <Option value="all">All Statuses</Option>
              <Option value="approved_all">All Approved</Option>
              <Option value="approved">Approved</Option>
              <Option value="disbursed">Disbursed</Option>
              <Option value="completed">Completed</Option>
              <Option value="denied">Rejected</Option>
            </Select>
          </Col>

          <Col xs={24}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }} wrap>
              <Button
                type="primary"
                icon={<FilterOutlined />}
                onClick={fetchReportData}
                loading={loading}
              >
                Generate Report
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchReportData}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
                disabled={!reportData}
              >
                Export Excel
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={exportToPDF}
                disabled={!reportData}
              >
                Export PDF
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {reportData ? (
        <>
          {/* Statistics Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Requests"
                  value={reportData.statistics.totalRequests}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Amount"
                  value={reportData.statistics.totalAmount}
                  precision={0}
                  prefix={<DollarOutlined />}
                  suffix="XAF"
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Approved"
                  value={reportData.statistics.approved}
                  prefix={<FileTextOutlined />}
                  valueStyle={{ color: '#52c41a' }}
                  suffix={`/ ${reportData.statistics.totalRequests}`}
                />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {reportData.statistics.totalRequests > 0
                    ? `${Math.round((reportData.statistics.approved / reportData.statistics.totalRequests) * 100)}% approval rate`
                    : '0% approval rate'}
                </Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Average Amount"
                  value={reportData.statistics.avgAmount}
                  precision={0}
                  prefix={<DollarOutlined />}
                  suffix="XAF"
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Request Mode Breakdown */}
          {reportData.byRequestMode && reportData.byRequestMode.length > 0 && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24} sm={12}>
                <Card title="Breakdown by Request Mode">
                  <Row gutter={[16, 16]}>
                    {reportData.byRequestMode.map((mode) => (
                      <Col xs={24} key={mode._id}>
                        <Card size="small" style={{ backgroundColor: mode._id === 'reimbursement' ? '#f9f0ff' : '#e6f7ff' }}>
                          <Statistic
                            title={mode._id === 'reimbursement' ? 'Reimbursements' : 'Advance Requests'}
                            value={mode.totalAmount}
                            precision={0}
                            prefix={<DollarOutlined />}
                            suffix="XAF"
                            valueStyle={{ color: mode._id === 'reimbursement' ? '#722ed1' : '#1890ff' }}
                          />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {mode.count} requests • Avg: {formatCurrency(mode.avgAmount)}
                          </Text>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>
              </Col>
              <Col xs={24} sm={12}>
                <Card title="Period Information">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text type="secondary">Report Period</Text>
                      <br />
                      <Text strong>
                        <CalendarOutlined /> {moment(filters.startDate).format('MMM DD, YYYY')} - {moment(filters.endDate).format('MMM DD, YYYY')}
                      </Text>
                    </div>
                    <Divider style={{ margin: '12px 0' }} />
                    <div>
                      <Text type="secondary">Status Breakdown</Text>
                      <br />
                      <Space wrap>
                        <Tag color="green">Approved: {reportData.statistics.approved}</Tag>
                        <Tag color="red">Rejected: {reportData.statistics.rejected}</Tag>
                        <Tag color="orange">Pending: {reportData.statistics.pending}</Tag>
                      </Space>
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          )}

          {/* Charts */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {/* Pie Chart - By Request Type */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <PieChartOutlined />
                    <Text>Spending by Request Type</Text>
                  </Space>
                }
              >
                {prepareTypeChartData().length > 0 ? (
                  <Pie
                    data={prepareTypeChartData()}
                    angleField="value"
                    colorField="type"
                    radius={0.8}
                    label={{
                      type: 'outer',
                      content: '{name} {percentage}',
                      style: {
                        fontSize: 12
                      }
                    }}
                    interactions={[
                      { type: 'element-active' }
                    ]}
                    legend={{
                      position: 'bottom',
                      itemName: {
                        style: {
                          fontSize: 12
                        }
                      }
                    }}
                    height={300}
                    tooltip={{
                      formatter: (datum) => {
                        return {
                          name: datum.type,
                          value: `${formatCurrency(datum.value)} (${datum.count} requests)`
                        };
                      }
                    }}
                  />
                ) : (
                  <Empty description="No data available for this period" />
                )}
              </Card>
            </Col>

            {/* Column Chart - By Department */}
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    <Text>Top 10 Departments by Spending</Text>
                  </Space>
                }
              >
                {prepareDepartmentData().length > 0 ? (
                  <Column
                    data={prepareDepartmentData()}
                    xField="department"
                    yField="amount"
                    height={300}
                    label={{
                      position: 'top',
                      style: {
                        fill: '#000',
                        opacity: 0.6,
                        fontSize: 10
                      },
                      formatter: (datum) => {
                        return `${(datum.amount / 1000000).toFixed(1)}M`;
                      }
                    }}
                    xAxis={{
                      label: {
                        autoRotate: true,
                        autoHide: true,
                        style: {
                          fontSize: 10
                        }
                      }
                    }}
                    yAxis={{
                      label: {
                        formatter: (value) => `${(value / 1000000).toFixed(1)}M`
                      }
                    }}
                    tooltip={{
                      formatter: (datum) => {
                        return {
                          name: 'Amount',
                          value: `${formatCurrency(datum.amount)} (${datum.count} requests)`
                        };
                      }
                    }}
                  />
                ) : (
                  <Empty description="No data available for this period" />
                )}
              </Card>
            </Col>
          </Row>

          {/* Line Chart - Monthly Trends */}
          {prepareMonthlyTrendData().length > 0 && (
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={24}>
                <Card 
                  title={
                    <Space>
                      <LineChartOutlined />
                      <Text>Monthly Spending Trends</Text>
                    </Space>
                  }
                >
                  <Line
                    data={prepareMonthlyTrendData()}
                    xField="month"
                    yField="amount"
                    height={300}
                    point={{
                      size: 5,
                      shape: 'diamond'
                    }}
                    label={{
                      style: {
                        fill: '#000',
                        opacity: 0.6,
                        fontSize: 10
                      },
                      formatter: (datum) => {
                        return `${(datum.amount / 1000000).toFixed(1)}M`;
                      }
                    }}
                    yAxis={{
                      label: {
                        formatter: (value) => `${(value / 1000000).toFixed(1)}M`
                      }
                    }}
                    tooltip={{
                      formatter: (datum) => {
                        return {
                          name: 'Total Amount',
                          value: `${formatCurrency(datum.amount)} (${datum.count} requests)`
                        };
                      }
                    }}
                    smooth={true}
                  />
                </Card>
              </Col>
            </Row>
          )}

          {/* Detailed Records Table */}
          <Card 
            title={
              <Space>
                <FileTextOutlined />
                <Text>Detailed Records ({reportData.detailedRecords?.length || 0})</Text>
              </Space>
            }
          >
            <Table
              columns={detailedColumns}
              dataSource={reportData.detailedRecords}
              rowKey="_id"
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requests`,
                pageSizeOptions: ['10', '20', '50', '100']
              }}
              scroll={{ x: 1200 }}
              size="small"
            />
          </Card>
        </>
      ) : (
        <Card>
          <Empty
            description="No report generated yet. Please select filters and click 'Generate Report'"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default FinanceReports;





