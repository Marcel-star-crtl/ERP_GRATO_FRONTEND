import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Divider, Button, Space, Spin, Alert, List, Image } from 'antd';
import { ArrowLeftOutlined, FileImageOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { incidentReportsAPI } from '../../services/incidentReportAPI';

const { Title, Text } = Typography;

const EmployeeIncidentReportDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await incidentReportsAPI.getReportById(id);
        if (response.success) {
          setReport(response.data);
        } else {
          throw new Error(response.message || 'Failed to fetch report');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  if (loading) return <Spin tip="Loading incident report..." />;
  if (error) return <Alert type="error" message={error} />;
  if (!report) return <Alert type="warning" message="Incident report not found." />;

  return (
    <Card bordered style={{ maxWidth: 800, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
        Back
      </Button>
      <Title level={3}>Incident Report #{report.reportNumber}</Title>
      <Divider />
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <Text strong>Title:</Text> <Text>{report.title}</Text>
        <Text strong>Type:</Text> <Tag>{report.incidentType}</Tag>
        <Text strong>Severity:</Text> <Tag>{report.severity}</Tag>
        <Text strong>Status:</Text> <Tag>{report.status}</Tag>
        <Text strong>Location:</Text> <Text>{report.location}</Text>
        <Text strong>Date:</Text> <Text>{new Date(report.incidentDate).toLocaleString()}</Text>
        <Text strong>Description:</Text> <Text>{report.description}</Text>
        <Divider />
        <Text strong>Attachments:</Text>
        {report.attachments && report.attachments.length > 0 ? (
          <List
            dataSource={report.attachments}
            renderItem={file => (
              <List.Item>
                {file.mimetype && file.mimetype.startsWith('image') ? (
                  <Image width={120} src={file.url} alt={file.name} style={{ marginRight: 8 }} />
                ) : (
                  <FileTextOutlined style={{ fontSize: 20, marginRight: 8 }} />
                )}
                <a href={file.url} target="_blank" rel="noopener noreferrer">
                  {file.name}
                </a>
                <Button
                  icon={<DownloadOutlined />}
                  size="small"
                  style={{ marginLeft: 8 }}
                  href={file.url}
                  target="_blank"
                  download={file.name}
                >
                  Download
                </Button>
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No attachments</Text>
        )}
      </Space>
      <Divider />
      <Button type="primary" onClick={() => navigate(`/employee/incident-reports/${id}/edit`)}>
        Edit Report
      </Button>
    </Card>
  );
};

export default EmployeeIncidentReportDetails;
