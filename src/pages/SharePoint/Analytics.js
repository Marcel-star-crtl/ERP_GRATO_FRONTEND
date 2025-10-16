import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col, Typography, Table, DatePicker } from 'antd';
import { ArrowLeftOutlined, BarChartOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const Analytics = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState([dayjs().subtract(30, 'days'), dayjs()]);

  const topUploaders = [
    { key: '1', name: 'John Doe', files: 45, size: '234 MB' },
    { key: '2', name: 'Jane Smith', files: 38, size: '189 MB' },
    { key: '3', name: 'Mike Johnson', files: 32, size: '156 MB' }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sharepoint/portal')} 
        style={{ marginBottom: '16px' }}>
        Back to Portal
      </Button>

      <Card style={{ marginBottom: '24px' }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Title level={3} style={{ margin: 0 }}>
              <BarChartOutlined /> Analytics & Reports
            </Title>
          </Col>
          <Col>
            <RangePicker value={dateRange} onChange={setDateRange} format="MMM DD, YYYY" />
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Top Uploaders" style={{ marginBottom: '24px' }}>
            <Table
              columns={[
                { title: 'User', dataIndex: 'name', key: 'name' },
                { title: 'Files', dataIndex: 'files', key: 'files' },
                { title: 'Total Size', dataIndex: 'size', key: 'size' }
              ]}
              dataSource={topUploaders}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Analytics;