import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  message,
  Spin,
  Row,
  Col,
  Statistic,
  DatePicker
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DollarOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { salaryPaymentAPI } from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SalaryPaymentList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [filters, setFilters] = useState({});

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsResponse, statsResponse] = await Promise.all([
        salaryPaymentAPI.getAll(filters),
        salaryPaymentAPI.getDashboardStats()
      ]);

      if (paymentsResponse.success) {
        setSalaryPayments(paymentsResponse.data);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load salary payments');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Payment Period',
      dataIndex: 'paymentPeriod',
      key: 'paymentPeriod',
      render: (period) => (
        <Space>
          <CalendarOutlined />
          <Text strong>
            {moment().month(period.month - 1).format('MMMM')} {period.year}
          </Text>
        </Space>
      )
    },
    {
      title: 'Departments',
      dataIndex: 'departmentPayments',
      key: 'departments',
      render: (payments) => (
        <Space wrap>
          {payments.slice(0, 3).map((p, idx) => (
            <Tag key={idx} color="blue">{p.department}</Tag>
          ))}
          {payments.length > 3 && (
            <Tag>+{payments.length - 3} more</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          XAF {amount.toLocaleString()}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Submitted By',
      dataIndex: 'submittedBy',
      key: 'submittedBy',
      render: (user) => user?.fullName || user?.email
    },
    {
      title: 'Processed Date',
      dataIndex: 'processedAt',
      key: 'processedAt',
      render: (date) => moment(date).format('MMM DD, YYYY HH:mm'),
      sorter: (a, b) => moment(a.processedAt).unix() - moment(b.processedAt).unix()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color="green">
          {status.toUpperCase()}
        </Tag>
      )
    },
    // {
    //   title: 'Actions',
    //   key: 'actions',
    //   render: (_, record) => (
    //     <Button
    //       type="link"
    //       icon={<EyeOutlined />}
    //       onClick={() => navigate(`/finance/salary-payments/${record._id}`)}
    //     >
    //       View
    //     </Button>
    //   )
    // }
    {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
            <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/finance/salary-payments/${record._id}`)} 
            >
            View
            </Button>
        )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Current Month"
              value={stats.currentMonth || 0}
              prefix="XAF"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Year to Date"
              value={stats.yearToDate || 0}
              prefix="XAF"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Processed"
              value={salaryPayments.length}
              suffix="payments"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={<Title level={4}>Salary Payment History</Title>}
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/finance/salary-payments/new')}
          >
            New Payment
          </Button>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={salaryPayments}
            columns={columns}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} payments`
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default SalaryPaymentList;