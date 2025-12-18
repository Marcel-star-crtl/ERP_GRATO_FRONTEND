import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Typography,
  Descriptions,
  Tag,
  Button,
  Space,
  Divider,
  Timeline,
  Table,
  Image,
  Tabs,
  Statistic,
  Progress,
  Alert,
  message,
  Modal
} from 'antd';
import {
  EditOutlined,
  BarcodeOutlined,
  PrinterOutlined,
  SwapOutlined,
  ToolOutlined,
  DeleteOutlined,
  DownloadOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AssetDetailsView = () => {
  const { assetTag } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [asset, setAsset] = useState(null);

  useEffect(() => {
    fetchAssetDetails();
  }, [assetTag]);

  const fetchAssetDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/fixed-assets/${assetTag}`);
      setAsset(response.data.data);
    } catch (error) {
      console.error('Error fetching asset details:', error);
      message.error('Failed to load asset details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBarcode = async () => {
    try {
      const response = await axios.get(`/api/fixed-assets/${assetTag}/barcode`);
      const barcodeData = response.data.data.barcode;
      
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
              <p>${asset.assetName}</p>
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

  const handleDispose = () => {
    Modal.confirm({
      title: 'Dispose Asset',
      content: 'Are you sure you want to dispose this asset? This action cannot be undone.',
      okText: 'Yes, Dispose',
      okType: 'danger',
      onOk: () => {
        navigate(`/supply-chain/fixed-assets/${assetTag}/dispose`);
      }
    });
  };

  if (loading || !asset) {
    return <Card loading={loading} />;
  }

  const statusColors = {
    active: 'green',
    'in-use': 'blue',
    'in-maintenance': 'orange',
    'in-storage': 'cyan',
    retired: 'default',
    disposed: 'red'
  };

  const conditionColors = {
    excellent: 'green',
    good: 'blue',
    fair: 'orange',
    poor: 'red',
    damaged: 'red'
  };

  const depreciationPercentage = asset.acquisitionCost > 0
    ? ((asset.accumulatedDepreciation / asset.acquisitionCost) * 100).toFixed(2)
    : 0;

  const maintenanceColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Type',
      dataIndex: 'maintenanceType',
      key: 'maintenanceType',
      render: (type) => {
        const colors = {
          routine: 'blue',
          repair: 'orange',
          inspection: 'green',
          upgrade: 'purple',
          calibration: 'cyan'
        };
        return <Tag color={colors[type]}>{type.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      render: (cost) => `${cost.toLocaleString()} XAF`
    },
    {
      title: 'Performed By',
      dataIndex: 'performedBy',
      key: 'performedBy'
    }
  ];

  const assignmentColumns = [
    {
      title: 'User',
      dataIndex: 'assignedToName',
      key: 'assignedToName'
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department'
    },
    {
      title: 'Assignment Date',
      dataIndex: 'assignmentDate',
      key: 'assignmentDate',
      render: (date) => moment(date).format('DD/MM/YYYY')
    },
    {
      title: 'Return Date',
      dataIndex: 'returnDate',
      key: 'returnDate',
      render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'Current'
    },
    {
      title: 'Duration',
      key: 'duration',
      render: (_, record) => {
        const start = moment(record.assignmentDate);
        const end = record.returnDate ? moment(record.returnDate) : moment();
        return `${end.diff(start, 'days')} days`;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space direction="vertical" size="small">
              <Title level={2} style={{ margin: 0 }}>
                <BarcodeOutlined /> Asset: {asset.assetTag}
              </Title>
              <Text type="secondary" style={{ fontSize: '16px' }}>
                {asset.assetName}
              </Text>
              <Space>
                <Tag color={statusColors[asset.status]}>
                  {asset.status?.toUpperCase().replace('-', ' ')}
                </Tag>
                <Tag color={conditionColors[asset.condition]}>
                  {asset.condition?.toUpperCase()}
                </Tag>
                {asset.isOverdue && (
                  <Tag color="red" icon={<WarningOutlined />}>
                    INSPECTION OVERDUE
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<PrinterOutlined />}
                onClick={handlePrintBarcode}
              >
                Print Barcode
              </Button>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/edit`)}
              >
                Edit
              </Button>
              {asset.status !== 'disposed' && (
                <>
                  <Button
                    icon={<SwapOutlined />}
                    onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/assign`)}
                  >
                    Assign
                  </Button>
                  <Button
                    icon={<ToolOutlined />}
                    onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/maintenance`)}
                  >
                    Maintenance
                  </Button>
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleDispose}
                  >
                    Dispose
                  </Button>
                </>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Warning Alerts */}
      {asset.isOverdue && (
        <Alert
          message="Inspection Overdue"
          description={`This asset's inspection was due on ${moment(asset.nextInspectionDue).format('DD/MM/YYYY')}. Please schedule an inspection immediately.`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: '24px' }}
        />
      )}

      {asset.nextInspectionDue && moment(asset.nextInspectionDue).diff(moment(), 'days') <= 30 && !asset.isOverdue && (
        <Alert
          message="Inspection Due Soon"
          description={`This asset's next inspection is due on ${moment(asset.nextInspectionDue).format('DD/MM/YYYY')} (${moment(asset.nextInspectionDue).diff(moment(), 'days')} days).`}
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Key Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Acquisition Cost"
              value={asset.acquisitionCost}
              suffix="XAF"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Current Book Value"
              value={asset.currentBookValue}
              suffix="XAF"
              precision={0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Depreciation"
              value={asset.accumulatedDepreciation}
              suffix="XAF"
              precision={0}
              valueStyle={{ color: '#f5222d' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Maintenance Cost"
              value={asset.totalMaintenanceCost || 0}
              suffix="XAF"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Depreciation Progress */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4}>Depreciation Status</Title>
        <Progress
          percent={parseFloat(depreciationPercentage)}
          status={depreciationPercentage > 80 ? 'exception' : 'active'}
          format={percent => `${percent}% Depreciated`}
        />
        <Row gutter={16} style={{ marginTop: '16px' }}>
          <Col span={8}>
            <Text type="secondary">Remaining Life:</Text>
            <br />
            <Text strong>{asset.remainingLife?.toFixed(2) || 0} years</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Annual Depreciation:</Text>
            <br />
            <Text strong>{asset.annualDepreciation?.toLocaleString() || 0} XAF</Text>
          </Col>
          <Col span={8}>
            <Text type="secondary">Salvage Value:</Text>
            <br />
            <Text strong>{asset.salvageValue?.toLocaleString() || 0} XAF</Text>
          </Col>
        </Row>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs defaultActiveKey="details">
          <TabPane tab="Asset Details" key="details">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Asset Tag" span={2}>
                <Space>
                  <Text strong style={{ fontSize: '16px' }}>{asset.assetTag}</Text>
                  {asset.barcode && (
                    <Image
                      src={asset.barcode}
                      width={150}
                      height={50}
                      alt="Barcode"
                      preview={false}
                    />
                  )}
                </Space>
              </Descriptions.Item>

              <Descriptions.Item label="Asset Name" span={2}>
                {asset.assetName}
              </Descriptions.Item>

              <Descriptions.Item label="Description" span={2}>
                {asset.assetDescription}
              </Descriptions.Item>

              <Descriptions.Item label="Item Code">
                {asset.item?.code}
              </Descriptions.Item>

              <Descriptions.Item label="Category">
                {asset.item?.category}
              </Descriptions.Item>

              <Descriptions.Item label="Serial Number">
                {asset.serialNumber || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Model Number">
                {asset.modelNumber || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Manufacturer">
                {asset.manufacturer || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Status">
                <Tag color={statusColors[asset.status]}>
                  {asset.status?.toUpperCase().replace('-', ' ')}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Condition">
                <Tag color={conditionColors[asset.condition]}>
                  {asset.condition?.toUpperCase()}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Acquisition Date">
                {moment(asset.acquisitionDate).format('DD/MM/YYYY')}
              </Descriptions.Item>

              <Descriptions.Item label="Supplier">
                {asset.supplier?.name || asset.supplierName || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="PO Number">
                {asset.poNumber || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Invoice Number">
                {asset.invoiceNumber || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Warranty Expiry">
                {asset.warrantyExpiry 
                  ? moment(asset.warrantyExpiry).format('DD/MM/YYYY')
                  : 'N/A'
                }
              </Descriptions.Item>
            </Descriptions>

            {asset.notes && (
              <>
                <Divider orientation="left">Notes</Divider>
                <Text>{asset.notes}</Text>
              </>
            )}
          </TabPane>

          <TabPane tab="Current Assignment" key="assignment">
            {asset.currentAssignment?.assignedTo ? (
              <Card>
                <Descriptions bordered>
                  <Descriptions.Item label="Assigned To" span={3}>
                    {asset.currentAssignment.assignedToName}
                  </Descriptions.Item>

                  <Descriptions.Item label="Email">
                    {asset.currentAssignment.assignedTo?.email || 'N/A'}
                  </Descriptions.Item>

                  <Descriptions.Item label="Department">
                    {asset.currentAssignment.assignedDepartment}
                  </Descriptions.Item>

                  <Descriptions.Item label="Phone">
                    {asset.currentAssignment.assignedTo?.phone || 'N/A'}
                  </Descriptions.Item>

                  <Descriptions.Item label="Location" span={3}>
                    {asset.currentAssignment.assignedLocation}
                  </Descriptions.Item>

                  <Descriptions.Item label="Assignment Date" span={3}>
                    {moment(asset.currentAssignment.assignmentDate).format('DD/MM/YYYY')}
                  </Descriptions.Item>

                  <Descriptions.Item label="Duration" span={3}>
                    {moment().diff(moment(asset.currentAssignment.assignmentDate), 'days')} days
                  </Descriptions.Item>
                </Descriptions>

                <Space style={{ marginTop: '16px' }}>
                  <Button
                    type="primary"
                    onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/return`)}
                  >
                    Return Asset
                  </Button>
                  <Button
                    onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/reassign`)}
                  >
                    Reassign
                  </Button>
                </Space>
              </Card>
            ) : (
              <Alert
                message="Not Currently Assigned"
                description="This asset is not currently assigned to any user."
                type="info"
                showIcon
                action={
                  <Button
                    type="primary"
                    onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/assign`)}
                  >
                    Assign Now
                  </Button>
                }
              />
            )}

            <Divider orientation="left">Assignment History</Divider>

            {asset.assignmentHistory?.length > 0 ? (
              <Table
                columns={assignmentColumns}
                dataSource={asset.assignmentHistory}
                rowKey={(record, index) => index}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Text type="secondary">No assignment history</Text>
            )}
          </TabPane>

          <TabPane tab="Depreciation" key="depreciation">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Method">
                {asset.depreciationMethod?.replace('-', ' ').toUpperCase()}
              </Descriptions.Item>

              <Descriptions.Item label="Useful Life">
                {asset.usefulLifeYears} years
              </Descriptions.Item>

              <Descriptions.Item label="Start Date">
                {moment(asset.depreciationStartDate || asset.acquisitionDate).format('DD/MM/YYYY')}
              </Descriptions.Item>

              <Descriptions.Item label="Remaining Life">
                {asset.remainingLife?.toFixed(2) || 0} years
              </Descriptions.Item>

              <Descriptions.Item label="Acquisition Cost">
                {asset.acquisitionCost.toLocaleString()} XAF
              </Descriptions.Item>

              <Descriptions.Item label="Salvage Value">
                {asset.salvageValue?.toLocaleString() || 0} XAF
              </Descriptions.Item>

              <Descriptions.Item label="Annual Depreciation">
                {asset.annualDepreciation?.toLocaleString() || 0} XAF
              </Descriptions.Item>

              <Descriptions.Item label="Accumulated Depreciation">
                <Text type="danger" strong>
                  {asset.accumulatedDepreciation?.toLocaleString() || 0} XAF
                </Text>
              </Descriptions.Item>

              <Descriptions.Item label="Current Book Value" span={2}>
                <Text type="success" strong style={{ fontSize: '18px' }}>
                  {asset.currentBookValue?.toLocaleString() || 0} XAF
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/depreciation-schedule`)}
            >
              View Full Depreciation Schedule
            </Button>
          </TabPane>

          <TabPane tab="Maintenance History" key="maintenance">
            {asset.maintenanceHistory?.length > 0 ? (
              <>
                <Table
                  columns={maintenanceColumns}
                  dataSource={asset.maintenanceHistory}
                  rowKey={(record, index) => index}
                  pagination={{ pageSize: 10 }}
                  summary={(pageData) => {
                    const totalCost = pageData.reduce((sum, record) => sum + (record.cost || 0), 0);
                    return (
                      <Table.Summary fixed>
                        <Table.Summary.Row>
                          <Table.Summary.Cell index={0} colSpan={3}>
                            <Text strong>Total Maintenance Cost</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={3}>
                            <Text strong>{totalCost.toLocaleString()} XAF</Text>
                          </Table.Summary.Cell>
                          <Table.Summary.Cell index={4} />
                        </Table.Summary.Row>
                      </Table.Summary>
                    );
                  }}
                />

                <Divider />

                <Descriptions bordered>
                  <Descriptions.Item label="Last Maintenance">
                    {asset.lastInspectionDate 
                      ? moment(asset.lastInspectionDate).format('DD/MM/YYYY')
                      : 'Never'
                    }
                  </Descriptions.Item>

                  <Descriptions.Item label="Next Due">
                    {asset.nextInspectionDue 
                      ? moment(asset.nextInspectionDue).format('DD/MM/YYYY')
                      : 'Not scheduled'
                    }
                  </Descriptions.Item>

                  <Descriptions.Item label="Total Maintenance Cost">
                    {asset.totalMaintenanceCost?.toLocaleString() || 0} XAF
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Alert
                message="No Maintenance History"
                description="No maintenance records have been logged for this asset."
                type="info"
                showIcon
              />
            )}

            <Button
              type="primary"
              icon={<ToolOutlined />}
              onClick={() => navigate(`/supply-chain/fixed-assets/${assetTag}/maintenance`)}
              style={{ marginTop: '16px' }}
            >
              Log Maintenance
            </Button>
          </TabPane>

          <TabPane tab="Location" key="location">
            <Descriptions bordered>
              <Descriptions.Item label="Building" span={3}>
                {asset.physicalLocation?.building || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Floor">
                {asset.physicalLocation?.floor || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Room" span={2}>
                {asset.physicalLocation?.room || 'N/A'}
              </Descriptions.Item>

              <Descriptions.Item label="Additional Notes" span={3}>
                {asset.physicalLocation?.notes || 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab="Images & Documents" key="files">
            {asset.images?.length > 0 && (
              <>
                <Title level={5}>Images</Title>
                <Image.PreviewGroup>
                  <Row gutter={[16, 16]}>
                    {asset.images.map((image, index) => (
                      <Col key={index} xs={24} sm={12} md={8} lg={6}>
                        <Image
                          src={image.url}
                          alt={image.caption || `Asset image ${index + 1}`}
                          style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                        />
                        {image.caption && (
                          <Text type="secondary" style={{ display: 'block', marginTop: '4px' }}>
                            {image.caption}
                          </Text>
                        )}
                      </Col>
                    ))}
                  </Row>
                </Image.PreviewGroup>
                <Divider />
              </>
            )}

            {asset.documents?.length > 0 && (
              <>
                <Title level={5}>Documents</Title>
                <Space direction="vertical" style={{ width: '100%' }}>
                  {asset.documents.map((doc, index) => (
                    <Card key={index} size="small">
                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space>
                            <Tag color="blue">
                              {doc.documentType?.toUpperCase() || 'DOCUMENT'}
                            </Tag>
                            <Text>{doc.filename}</Text>
                          </Space>
                        </Col>
                        <Col>
                          <Button
                            type="link"
                            icon={<DownloadOutlined />}
                            href={doc.url}
                            target="_blank"
                          >
                            Download
                          </Button>
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </Space>
              </>
            )}

            {(!asset.images || asset.images.length === 0) && 
             (!asset.documents || asset.documents.length === 0) && (
              <Alert
                message="No Files"
                description="No images or documents have been uploaded for this asset."
                type="info"
                showIcon
              />
            )}
          </TabPane>

          <TabPane tab="Audit Trail" key="audit">
            <Timeline>
              <Timeline.Item color="green">
                <Text strong>Asset Created</Text>
                <br />
                <Text type="secondary">
                  {moment(asset.createdAt).format('DD/MM/YYYY HH:mm')} by {asset.createdBy?.fullName}
                </Text>
              </Timeline.Item>

              {asset.assignmentHistory?.map((assignment, index) => (
                <Timeline.Item key={index} color="blue">
                  <Text strong>
                    {assignment.returnDate ? 'Returned from' : 'Assigned to'} {assignment.assignedToName}
                  </Text>
                  <br />
                  <Text type="secondary">
                    {moment(assignment.assignmentDate).format('DD/MM/YYYY')}
                    {assignment.returnDate && ` - ${moment(assignment.returnDate).format('DD/MM/YYYY')}`}
                  </Text>
                </Timeline.Item>
              ))}

              {asset.maintenanceHistory?.map((maintenance, index) => (
                <Timeline.Item key={index} color="orange">
                  <Text strong>{maintenance.maintenanceType} Maintenance</Text>
                  <br />
                  <Text type="secondary">
                    {moment(maintenance.date).format('DD/MM/YYYY')} - {maintenance.description}
                  </Text>
                </Timeline.Item>
              ))}

              {asset.lastUpdatedBy && (
                <Timeline.Item>
                  <Text strong>Last Updated</Text>
                  <br />
                  <Text type="secondary">
                    {moment(asset.updatedAt).format('DD/MM/YYYY HH:mm')} by {asset.lastUpdatedBy?.fullName}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default AssetDetailsView;