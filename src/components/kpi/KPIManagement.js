import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Table,
  Space,
  message,
  Modal,
  Tag,
  Alert,
  Progress,
  Divider,
  Tooltip,
  Row,
  Col,
  Statistic,
  Empty
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { kpiAPI } from '../../services/kpiAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { TextArea } = Input;

const KPIManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState([]);
  const [currentKPI, setCurrentKPI] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [kpiFormData, setKpiFormData] = useState([
    { title: '', description: '', weight: 0, targetValue: '', measurableOutcome: '' }
  ]);

  useEffect(() => {
    // Get current quarter
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    const currentQuarter = `Q${quarter}-${year}`;
    setSelectedQuarter(currentQuarter);
    
    fetchKPIs(currentQuarter);
  }, []);

  const fetchKPIs = async (quarter = null) => {
    try {
      setLoading(true);
      const result = await kpiAPI.getMyKPIs(quarter);
      
      if (result.success && result.data && result.data.length > 0) {
        setKpis(result.data);
        
        // Load most recent KPI data
        const latestKPI = result.data[0];
        setCurrentKPI(latestKPI);
        
        if (latestKPI.approvalStatus === 'draft' || latestKPI.approvalStatus === 'rejected') {
          setKpiFormData(latestKPI.kpis.map(kpi => ({
            title: kpi.title,
            description: kpi.description,
            weight: kpi.weight,
            targetValue: kpi.targetValue,
            measurableOutcome: kpi.measurableOutcome
          })));
        }
      } else {
        setCurrentKPI(null);
        setKpiFormData([
          { title: '', description: '', weight: 0, targetValue: '', measurableOutcome: '' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching KPIs:', error);
      message.error('Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  const addKPIRow = () => {
    if (kpiFormData.length >= 10) {
      message.warning('Maximum 10 KPIs allowed');
      return;
    }
    setKpiFormData([
      ...kpiFormData,
      { title: '', description: '', weight: 0, targetValue: '', measurableOutcome: '' }
    ]);
  };

  const removeKPIRow = (index) => {
    if (kpiFormData.length <= 1) {
      message.warning('At least 1 KPI is required');
      return;
    }
    const newData = kpiFormData.filter((_, i) => i !== index);
    setKpiFormData(newData);
  };

  const updateKPIRow = (index, field, value) => {
    const newData = [...kpiFormData];
    newData[index][field] = value;
    setKpiFormData(newData);
  };

  const calculateTotalWeight = () => {
    return kpiFormData.reduce((sum, kpi) => sum + (parseFloat(kpi.weight) || 0), 0);
  };

  const validateKPIs = () => {
    if (kpiFormData.length < 3) {
      message.error('At least 3 KPIs are required');
      return false;
    }

    for (let i = 0; i < kpiFormData.length; i++) {
      const kpi = kpiFormData[i];
      if (!kpi.title || !kpi.description || !kpi.targetValue || !kpi.measurableOutcome) {
        message.error(`KPI ${i + 1}: All fields are required`);
        return false;
      }
      if (!kpi.weight || kpi.weight <= 0) {
        message.error(`KPI ${i + 1}: Weight must be greater than 0`);
        return false;
      }
    }

    const totalWeight = calculateTotalWeight();
    if (totalWeight !== 100) {
      message.error(`Total weight must equal 100%. Current total: ${totalWeight}%`);
      return false;
    }

    return true;
  };

  const handleSaveKPIs = async () => {
    if (!validateKPIs()) return;

    try {
      setLoading(true);
      const result = await kpiAPI.createOrUpdateKPIs(selectedQuarter, kpiFormData);
      
      if (result.success) {
        message.success('KPIs saved successfully');
        await fetchKPIs(selectedQuarter);
      } else {
        message.error(result.message || 'Failed to save KPIs');
      }
    } catch (error) {
      console.error('Error saving KPIs:', error);
      message.error('Failed to save KPIs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!currentKPI) {
      message.error('Please save your KPIs first');
      return;
    }

    Modal.confirm({
      title: 'Submit KPIs for Approval',
      content: 'Once submitted, you cannot modify your KPIs until your supervisor reviews them. Continue?',
      okText: 'Yes, Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await kpiAPI.submitForApproval(currentKPI._id);
          
          if (result.success) {
            message.success('KPIs submitted for supervisor approval');
            await fetchKPIs(selectedQuarter);
          } else {
            message.error(result.message || 'Failed to submit KPIs');
          }
        } catch (error) {
          console.error('Error submitting KPIs:', error);
          message.error('Failed to submit KPIs');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getStatusTag = (status) => {
    const statusConfig = {
      'draft': { color: 'default', icon: <EditOutlined />, text: 'Draft' },
      'pending': { color: 'warning', icon: <ClockCircleOutlined />, text: 'Pending Approval' },
      'approved': { color: 'success', icon: <CheckCircleOutlined />, text: 'Approved' },
      'rejected': { color: 'error', icon: <CloseCircleOutlined />, text: 'Rejected' }
    };

    const config = statusConfig[status] || statusConfig['draft'];
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const totalWeight = calculateTotalWeight();
  const canEdit = !currentKPI || currentKPI.approvalStatus === 'draft' || currentKPI.approvalStatus === 'rejected';
  const canSubmit = currentKPI && (currentKPI.approvalStatus === 'draft' || currentKPI.approvalStatus === 'rejected') && totalWeight === 100;

  const kpiColumns = [
    {
      title: '#',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'KPI Title',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      render: (_, record, index) => (
        canEdit ? (
          <Input
            placeholder="e.g., Project Delivery Excellence"
            value={record.title}
            onChange={(e) => updateKPIRow(index, 'title', e.target.value)}
            maxLength={200}
          />
        ) : (
          <strong>{record.title}</strong>
        )
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (_, record, index) => (
        canEdit ? (
          <TextArea
            placeholder="Detailed description of this KPI"
            value={record.description}
            onChange={(e) => updateKPIRow(index, 'description', e.target.value)}
            rows={2}
            maxLength={500}
          />
        ) : (
          <span>{record.description}</span>
        )
      )
    },
    {
      title: 'Weight (%)',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (_, record, index) => (
        canEdit ? (
          <InputNumber
            min={1}
            max={100}
            value={record.weight}
            onChange={(value) => updateKPIRow(index, 'weight', value)}
            style={{ width: '100%' }}
            suffix="%"
          />
        ) : (
          <Tag color="blue">{record.weight}%</Tag>
        )
      )
    },
    {
      title: 'Target Value',
      dataIndex: 'targetValue',
      key: 'targetValue',
      width: 150,
      render: (_, record, index) => (
        canEdit ? (
          <Input
            placeholder="e.g., 5 projects"
            value={record.targetValue}
            onChange={(e) => updateKPIRow(index, 'targetValue', e.target.value)}
            maxLength={100}
          />
        ) : (
          <span>{record.targetValue}</span>
        )
      )
    },
    {
      title: 'Measurable Outcome',
      dataIndex: 'measurableOutcome',
      key: 'measurableOutcome',
      width: 200,
      render: (_, record, index) => (
        canEdit ? (
          <TextArea
            placeholder="How will this be measured?"
            value={record.measurableOutcome}
            onChange={(e) => updateKPIRow(index, 'measurableOutcome', e.target.value)}
            rows={2}
            maxLength={300}
          />
        ) : (
          <span>{record.measurableOutcome}</span>
        )
      )
    }
  ];

  if (canEdit) {
    kpiColumns.push({
      title: 'Action',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record, index) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeKPIRow(index)}
          disabled={kpiFormData.length <= 1}
        />
      )
    });
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>
            <CheckCircleOutlined /> Quarterly KPI Management
          </h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Define your Key Performance Indicators for {selectedQuarter}
          </p>
        </div>

        {/* Status Overview */}
        {currentKPI && (
          <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Status"
                  value={getStatusTag(currentKPI.approvalStatus)}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Quarter"
                  value={currentKPI.quarter}
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total KPIs"
                  value={currentKPI.kpis.length}
                />
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Statistic
                  title="Total Weight"
                  value={currentKPI.totalWeight}
                  suffix="%"
                  valueStyle={{ color: currentKPI.totalWeight === 100 ? '#52c41a' : '#f5222d' }}
                />
              </Col>
            </Row>
            
            {currentKPI.approvalStatus === 'rejected' && currentKPI.rejectionReason && (
              <Alert
                message="KPIs Rejected"
                description={currentKPI.rejectionReason}
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
            
            {currentKPI.approvalStatus === 'pending' && (
              <Alert
                message="Pending Supervisor Approval"
                description="Your KPIs are under review by your supervisor. You will be notified once they are approved or if revisions are needed."
                type="info"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
            
            {currentKPI.approvalStatus === 'approved' && (
              <Alert
                message="KPIs Approved"
                description="Your KPIs have been approved. You can now start linking tasks to these KPIs."
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        )}

        {/* Instructions */}
        <Alert
          message="KPI Guidelines"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Define 3-10 KPIs that align with your role and responsibilities</li>
              <li>Total weight of all KPIs must equal 100%</li>
              <li>Each KPI should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)</li>
              <li>Once approved, you can link tasks to these KPIs throughout the quarter</li>
            </ul>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />

        {/* KPI Form Table */}
        <Card
          title={
            <Space>
              <span>Define Your KPIs - {selectedQuarter}</span>
              <Tag color={totalWeight === 100 ? 'success' : totalWeight > 100 ? 'error' : 'warning'}>
                Total Weight: {totalWeight}%
              </Tag>
            </Space>
          }
          extra={
            canEdit && (
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addKPIRow}
                disabled={kpiFormData.length >= 10}
              >
                Add KPI
              </Button>
            )
          }
          style={{ marginBottom: '24px' }}
        >
          <Table
            columns={kpiColumns}
            dataSource={kpiFormData}
            pagination={false}
            rowKey={(_, index) => index}
            scroll={{ x: 1200 }}
            size="small"
            bordered
          />

          <Divider />

          {/* Weight Progress */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span><strong>Total Weight Distribution:</strong></span>
              <span style={{ 
                color: totalWeight === 100 ? '#52c41a' : totalWeight > 100 ? '#f5222d' : '#faad14',
                fontWeight: 'bold'
              }}>
                {totalWeight}% / 100%
              </span>
            </div>
            <Progress
              percent={totalWeight}
              status={totalWeight === 100 ? 'success' : totalWeight > 100 ? 'exception' : 'active'}
              strokeColor={totalWeight === 100 ? '#52c41a' : totalWeight > 100 ? '#f5222d' : '#faad14'}
            />
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <Space style={{ marginTop: '16px' }}>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveKPIs}
                loading={loading}
                disabled={totalWeight !== 100}
              >
                Save KPIs
              </Button>
              {canSubmit && (
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={handleSubmitForApproval}
                  loading={loading}
                  style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                >
                  Submit for Approval
                </Button>
              )}
            </Space>
          )}
        </Card>

        {/* Historical KPIs */}
        {kpis.length > 1 && (
          <Card title="Previous Quarters" size="small">
            <Table
              dataSource={kpis.slice(1)}
              rowKey="_id"
              pagination={false}
              columns={[
                {
                  title: 'Quarter',
                  dataIndex: 'quarter',
                  key: 'quarter',
                  width: 100
                },
                {
                  title: 'Status',
                  dataIndex: 'approvalStatus',
                  key: 'status',
                  width: 150,
                  render: (status) => getStatusTag(status)
                },
                {
                  title: 'KPIs',
                  dataIndex: 'kpis',
                  key: 'kpiCount',
                  width: 80,
                  render: (kpis) => kpis.length
                },
                {
                  title: 'Total Weight',
                  dataIndex: 'totalWeight',
                  key: 'totalWeight',
                  width: 100,
                  render: (weight) => `${weight}%`
                },
                {
                  title: 'Submitted',
                  dataIndex: 'submittedAt',
                  key: 'submittedAt',
                  width: 150,
                  render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
                }
              ]}
              size="small"
            />
          </Card>
        )}
      </Card>
    </div>
  );
};

export default KPIManagement;