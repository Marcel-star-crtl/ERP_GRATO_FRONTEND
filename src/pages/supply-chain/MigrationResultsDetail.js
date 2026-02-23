import React from 'react';
import {
  Card,
  Alert,
  Table,
  Collapse,
  Tag,
  Row,
  Col,
  Statistic,
  Typography,
  Empty,
  Space
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const MigrationResultsDetail = ({ results, migrationTypes }) => {
  if (!results) return null;

  const renderResultsForType = (key, result) => {
    if (result.success === 0 && result.failed === 0) return null;

    const typeConfig = migrationTypes.find(t => t.key === key);
    if (!typeConfig) return null;

    return (
      <Card 
        key={key}
        size="small" 
        title={<Title level={5}>{typeConfig.title}</Title>}
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Created"
              value={result.imported || 0}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Updated"
              value={result.updated || 0}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Failed"
              value={result.failed || 0}
              valueStyle={{ color: '#f5222d' }}
              prefix={<CloseCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Warnings"
              value={result.warnings?.length || 0}
              valueStyle={{ color: '#faad14' }}
              prefix={<WarningOutlined />}
            />
          </Col>
        </Row>

        {/* Warnings Section */}
        {result.warnings && result.warnings.length > 0 && (
          <Alert
            message={`${result.warnings.length} Warning(s) Detected`}
            description={
              <div>
                <p>Your data contains duplicate material codes in the same upload. These were merged during migration:</p>
                <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {result.warnings.slice(0, 10).map((warning, idx) => (
                    <li key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                      {warning}
                    </li>
                  ))}
                  {result.warnings.length > 10 && (
                    <li style={{ fontSize: '12px', color: '#999' }}>
                      ... and {result.warnings.length - 10} more warnings
                    </li>
                  )}
                </ul>
              </div>
            }
            type="warning"
            showIcon
            icon={<WarningOutlined />}
            style={{ marginTop: '16px' }}
          />
        )}

        {/* Errors Section */}
        {result.errors && result.errors.length > 0 && (
          <Alert
            message={`${result.errors.length} Error(s) Occurred`}
            description={
              <div>
                <ul style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {result.errors.slice(0, 10).map((error, idx) => (
                    <li key={idx} style={{ fontSize: '12px', marginBottom: '4px', color: '#f5222d' }}>
                      {error}
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li style={{ fontSize: '12px', color: '#999' }}>
                      ... and {result.errors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </div>
            }
            type="error"
            showIcon
            icon={<CloseCircleOutlined />}
            style={{ marginTop: '16px' }}
          />
        )}

        {/* Duplicate Codes Detected */}
        {result.duplicateCodesInUpload && result.duplicateCodesInUpload.length > 0 && (
          <Collapse style={{ marginTop: '16px' }}>
            <Collapse.Panel
              header={
                <Space>
                  <InfoOutlined style={{ color: '#faad14' }} />
                  <Text strong>Duplicate Codes Found in Upload</Text>
                  <Tag color="orange">{result.duplicateCodesInUpload.length}</Tag>
                </Space>
              }
              key="duplicates"
            >
              <Table
                dataSource={result.duplicateCodesInUpload}
                columns={[
                  {
                    title: 'Material Code',
                    dataIndex: 'code',
                    key: 'code'
                  },
                  {
                    title: 'Rows in Upload',
                    dataIndex: 'rows',
                    key: 'rows',
                    render: (rows) => (
                      <Space wrap>
                        {rows.map(r => (
                          <Tag key={r} color="orange">{r}</Tag>
                        ))}
                      </Space>
                    )
                  }
                ]}
                pagination={false}
                size="small"
              />
              <Alert
                message="Note"
                description="When duplicate codes exist in your upload, the last occurrence overwrites previous ones. Consider cleaning your source data before next migration."
                type="info"
                showIcon
                style={{ marginTop: '12px' }}
              />
            </Collapse.Panel>
          </Collapse>
        )}
      </Card>
    );
  };

  return (
    <div>
      <Alert
        message="Migration Completed"
        description="Review the details below to understand what was imported, updated, and any issues encountered."
        type="success"
        showIcon
        icon={<CheckCircleOutlined />}
        style={{ marginBottom: '24px' }}
      />
      
      {Object.entries(results).map(([key, result]) =>
        renderResultsForType(key, result)
      )}
    </div>
  );
};

export default MigrationResultsDetail;
