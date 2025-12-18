import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Alert,
  Tabs,
  Empty,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SendOutlined,
  InfoCircleOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { kpiAPI } from '../../services/kpiAPI';
import { useSelector } from 'react-redux';

const { TextArea } = Input;

const EmployeeKPIManagement = () => {
  const { user } = useSelector((state) => state.auth);
  const [kpis, setKpis] = useState([]);
  const [currentQuarter, setCurrentQuarter] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKPI, setEditingKPI] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadKPIs();
  }, []);

  const loadKPIs = async () => {
    try {
      setLoading(true);
      const result = await kpiAPI.getMyKPIs();
      if (result.success) {
        setKpis(result.data);
        setCurrentQuarter(result.currentQuarter);
      }
    } catch (error) {
      console.error('Error loading KPIs:', error);
      message.error('Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuarterKPI = () => {
    return kpis.find(k => k.quarter === currentQuarter);
  };

  const openModal = (kpi = null) => {
    setEditingKPI(kpi);
    if (kpi) {
      // ✅ Map backend fields (target, measurement) to frontend fields (targetValue, measurableOutcome)
      const mappedKpis = kpi.kpis.map(item => ({
        title: item.title,
        description: item.description,
        weight: item.weight,
        targetValue: item.target,  // Map target -> targetValue
        measurableOutcome: item.measurement  // Map measurement -> measurableOutcome
      }));
      
      form.setFieldsValue({
        quarter: kpi.quarter,
        kpis: mappedKpis
      });
    } else {
      form.setFieldsValue({
        quarter: currentQuarter,
        kpis: [
          { title: '', description: '', weight: 0, targetValue: '', measurableOutcome: '' }
        ]
      });
    }
    setModalVisible(true);
  };

  const handleSaveKPIs = async (values) => {
    try {
      setLoading(true);

      // Validate total weight
      const totalWeight = values.kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
      if (totalWeight !== 100) {
        message.error(`Total weight must equal 100%. Current total: ${totalWeight}%`);
        return;
      }

      const result = await kpiAPI.createOrUpdateKPIs(values.quarter, values.kpis);

      if (result.success) {
        message.success('KPIs saved successfully');
        setModalVisible(false);
        form.resetFields();
        loadKPIs();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error saving KPIs:', error);
      message.error('Failed to save KPIs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForApproval = async (kpiId) => {
    Modal.confirm({
      title: 'Submit KPIs for Approval?',
      content: 'Once submitted, you cannot modify your KPIs until your supervisor reviews them. Are you sure?',
      okText: 'Yes, Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const result = await kpiAPI.submitForApproval(kpiId);
          if (result.success) {
            message.success('KPIs submitted for supervisor approval');
            loadKPIs();
          } else {
            message.error(result.message);
          }
        } catch (error) {
          console.error('Error submitting KPIs:', error);
          message.error('Failed to submit KPIs');
        }
      }
    });
  };

  const handleDeleteKPI = async (kpiId) => {
    Modal.confirm({
      title: 'Delete KPIs?',
      content: 'Are you sure you want to delete these KPIs?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          const result = await kpiAPI.deleteKPIs(kpiId);
          if (result.success) {
            message.success('KPIs deleted successfully');
            loadKPIs();
          } else {
            message.error(result.message);
          }
        } catch (error) {
          console.error('Error deleting KPIs:', error);
          message.error('Failed to delete KPIs');
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      pending: 'processing',
      approved: 'success',
      rejected: 'error'
    };
    return colors[status] || 'default';
  };

  // ✅ FIXED: Changed dataIndex from 'targetValue' to 'target' and 'measurableOutcome' to 'measurement'
  const kpiColumns = [
    {
      title: 'KPI Title',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      width: 100,
      render: (weight) => (
        <Tag color="blue" style={{ fontWeight: 'bold' }}>
          {weight}%
        </Tag>
      )
    },
    {
      title: 'Target',
      dataIndex: 'target',  // ✅ Changed from 'targetValue'
      key: 'target',
      width: 150
    },
    {
      title: 'Measurable Outcome',
      dataIndex: 'measurement',  // ✅ Changed from 'measurableOutcome'
      key: 'measurement',
      width: 200,
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      )
    }
  ];

  const currentKPI = getCurrentQuarterKPI();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <TrophyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              My Quarterly KPIs
            </h2>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Define and track your Key Performance Indicators for the quarter
            </p>
          </div>
          {!currentKPI || ['draft', 'rejected'].includes(currentKPI.approvalStatus) ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => openModal(currentKPI)}
            >
              {currentKPI ? 'Edit KPIs' : 'Define KPIs'}
            </Button>
          ) : null}
        </div>

        <Alert
          message="Important: KPI Guidelines"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Define at least 3 KPIs that align with your role and quarterly objectives</li>
              <li>Total weight of all KPIs must equal 100%</li>
              <li>Make your KPIs SMART: Specific, Measurable, Achievable, Relevant, Time-bound</li>
              <li>Once approved, link your tasks to these KPIs for performance tracking</li>
            </ul>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {currentKPI && (
          <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
            <Row gutter={16}>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Current Quarter"
                  value={currentKPI.quarter}
                  prefix={<InfoCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Total KPIs"
                  value={currentKPI.kpis.length}
                  prefix={<TrophyOutlined />}
                />
              </Col>
              <Col xs={24} sm={8}>
                <Statistic
                  title="Status"
                  value={currentKPI.approvalStatus.toUpperCase()}
                  valueStyle={{
                    color:
                      currentKPI.approvalStatus === 'approved' ? '#52c41a' :
                      currentKPI.approvalStatus === 'pending' ? '#1890ff' :
                      currentKPI.approvalStatus === 'rejected' ? '#f5222d' :
                      '#8c8c8c'
                  }}
                />
              </Col>
            </Row>

            {currentKPI.approvalStatus === 'draft' && (
              <div style={{ marginTop: '16px' }}>
                <Button
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSubmitForApproval(currentKPI._id)}
                  style={{ marginRight: '8px' }}
                >
                  Submit for Approval
                </Button>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => openModal(currentKPI)}
                  style={{ marginRight: '8px' }}
                >
                  Edit KPIs
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteKPI(currentKPI._id)}
                >
                  Delete
                </Button>
              </div>
            )}

            {currentKPI.approvalStatus === 'pending' && (
              <Alert
                message="Pending Supervisor Approval"
                description="Your KPIs are currently under review by your supervisor. You will be notified once they are approved or if changes are needed."
                type="warning"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}

            {currentKPI.approvalStatus === 'rejected' && (
              <Alert
                message="KPIs Require Revision"
                description={
                  <div>
                    <p><strong>Supervisor Feedback:</strong></p>
                    <p>{currentKPI.rejectionReason || 'Please revise your KPIs and resubmit.'}</p>
                  </div>
                }
                type="error"
                showIcon
                style={{ marginTop: '16px' }}
                action={
                  <Button
                    type="primary"
                    size="small"
                    onClick={() => openModal(currentKPI)}
                  >
                    Revise KPIs
                  </Button>
                }
              />
            )}

            {currentKPI.approvalStatus === 'approved' && (
              <Alert
                message="KPIs Approved!"
                description="Your KPIs have been approved by your supervisor. You can now start linking tasks to these KPIs."
                type="success"
                showIcon
                style={{ marginTop: '16px' }}
              />
            )}
          </Card>
        )}

        <Tabs defaultActiveKey="current">
          <Tabs.TabPane tab="Current Quarter" key="current">
            {currentKPI ? (
              <Table
                columns={kpiColumns}
                dataSource={currentKPI.kpis}
                rowKey={(record, index) => index}
                pagination={false}
                loading={loading}
              />
            ) : (
              <Empty
                description="No KPIs defined for current quarter"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
                  Define KPIs Now
                </Button>
              </Empty>
            )}
          </Tabs.TabPane>

          <Tabs.TabPane tab="History" key="history">
            {kpis.filter(k => k.quarter !== currentQuarter).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {kpis.filter(k => k.quarter !== currentQuarter).map(kpi => (
                  <Card
                    key={kpi._id}
                    size="small"
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{kpi.quarter}</span>
                        <Tag color={getStatusColor(kpi.approvalStatus)}>
                          {kpi.approvalStatus.toUpperCase()}
                        </Tag>
                      </div>
                    }
                  >
                    <Table
                      columns={kpiColumns}
                      dataSource={kpi.kpis}
                      rowKey={(record, index) => index}
                      pagination={false}
                      size="small"
                    />
                  </Card>
                ))}
              </Space>
            ) : (
              <Empty description="No historical KPIs" />
            )}
          </Tabs.TabPane>
        </Tabs>
      </Card>

      {/* KPI Form Modal */}
      <Modal
        title={
          <span>
            <TrophyOutlined style={{ marginRight: '8px' }} />
            {editingKPI ? 'Edit KPIs' : 'Define Quarterly KPIs'}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingKPI(null);
        }}
        footer={null}
        width={900}
      >
        <Alert
          message="Total weight must equal 100%"
          type="info"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveKPIs}
        >
          <Form.Item name="quarter" label="Quarter" hidden>
            <Input />
          </Form.Item>

          <Form.List name="kpis">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <Card
                    key={key}
                    size="small"
                    title={`KPI #${index + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      ) : null
                    }
                    style={{ marginBottom: '16px' }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'title']}
                      label="KPI Title"
                      rules={[{ required: true, message: 'KPI title is required' }]}
                    >
                      <Input placeholder="e.g., Complete Project Deliverables" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label="Description"
                      rules={[{ required: true, message: 'Description is required' }]}
                    >
                      <TextArea
                        rows={2}
                        placeholder="Describe what this KPI measures and why it's important"
                      />
                    </Form.Item>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'weight']}
                          label="Weight (%)"
                          rules={[
                            { required: true, message: 'Weight is required' },
                            { type: 'number', min: 1, max: 100, message: 'Weight must be 1-100' }
                          ]}
                        >
                          <InputNumber
                            style={{ width: '100%' }}
                            placeholder="e.g., 30"
                            min={1}
                            max={100}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={16}>
                        <Form.Item
                          {...restField}
                          name={[name, 'targetValue']}
                          label="Target Value"
                          rules={[{ required: true, message: 'Target value is required' }]}
                        >
                          <Input placeholder="e.g., 5 projects completed" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Form.Item
                      {...restField}
                      name={[name, 'measurableOutcome']}
                      label="Measurable Outcome"
                      rules={[{ required: true, message: 'Measurable outcome is required' }]}
                    >
                      <TextArea
                        rows={2}
                        placeholder="How will success be measured? e.g., All projects delivered on time with quality approval"
                      />
                    </Form.Item>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: '16px' }}
                >
                  Add KPI
                </Button>
              </>
            )}
          </Form.List>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
                setEditingKPI(null);
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Save KPIs
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeKPIManagement;







// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Button,
//   Table,
//   Tag,
//   Space,
//   Modal,
//   Form,
//   Input,
//   InputNumber,
//   message,
//   Alert,
//   Tabs,
//   Progress,
//   Tooltip,
//   Empty,
//   Statistic,
//   Row,
//   Col,
//   Descriptions
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   DeleteOutlined,
//   SendOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   InfoCircleOutlined,
//   TrophyOutlined
// } from '@ant-design/icons';
// import { kpiAPI } from '../../services/kpiAPI';
// import { useSelector } from 'react-redux';

// const { TextArea } = Input;

// const EmployeeKPIManagement = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [kpis, setKpis] = useState([]);
//   const [currentQuarter, setCurrentQuarter] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editingKPI, setEditingKPI] = useState(null);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     loadKPIs();
//   }, []);

//   const loadKPIs = async () => {
//     try {
//       setLoading(true);
//       const result = await kpiAPI.getMyKPIs();
//       if (result.success) {
//         setKpis(result.data);
//         setCurrentQuarter(result.currentQuarter);
//       }
//     } catch (error) {
//       console.error('Error loading KPIs:', error);
//       message.error('Failed to load KPIs');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getCurrentQuarterKPI = () => {
//     return kpis.find(k => k.quarter === currentQuarter);
//   };

//   const openModal = (kpi = null) => {
//     setEditingKPI(kpi);
//     if (kpi) {
//       form.setFieldsValue({
//         quarter: kpi.quarter,
//         kpis: kpi.kpis
//       });
//     } else {
//       form.setFieldsValue({
//         quarter: currentQuarter,
//         kpis: [
//           { title: '', description: '', weight: 0, targetValue: '', measurableOutcome: '' }
//         ]
//       });
//     }
//     setModalVisible(true);
//   };

//   const handleSaveKPIs = async (values) => {
//     try {
//       setLoading(true);

//       // Validate total weight
//       const totalWeight = values.kpis.reduce((sum, kpi) => sum + (kpi.weight || 0), 0);
//       if (totalWeight !== 100) {
//         message.error(`Total weight must equal 100%. Current total: ${totalWeight}%`);
//         return;
//       }

//       const result = await kpiAPI.createOrUpdateKPIs(values.quarter, values.kpis);

//       if (result.success) {
//         message.success('KPIs saved successfully');
//         setModalVisible(false);
//         form.resetFields();
//         loadKPIs();
//       } else {
//         message.error(result.message);
//       }
//     } catch (error) {
//       console.error('Error saving KPIs:', error);
//       message.error('Failed to save KPIs');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitForApproval = async (kpiId) => {
//     Modal.confirm({
//       title: 'Submit KPIs for Approval?',
//       content: 'Once submitted, you cannot modify your KPIs until your supervisor reviews them. Are you sure?',
//       okText: 'Yes, Submit',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           const result = await kpiAPI.submitForApproval(kpiId);
//           if (result.success) {
//             message.success('KPIs submitted for supervisor approval');
//             loadKPIs();
//           } else {
//             message.error(result.message);
//           }
//         } catch (error) {
//           console.error('Error submitting KPIs:', error);
//           message.error('Failed to submit KPIs');
//         }
//       }
//     });
//   };

//   const handleDeleteKPI = async (kpiId) => {
//     Modal.confirm({
//       title: 'Delete KPIs?',
//       content: 'Are you sure you want to delete these KPIs?',
//       okText: 'Delete',
//       okType: 'danger',
//       onOk: async () => {
//         try {
//           const result = await kpiAPI.deleteKPIs(kpiId);
//           if (result.success) {
//             message.success('KPIs deleted successfully');
//             loadKPIs();
//           } else {
//             message.error(result.message);
//           }
//         } catch (error) {
//           console.error('Error deleting KPIs:', error);
//           message.error('Failed to delete KPIs');
//         }
//       }
//     });
//   };

//   const getStatusColor = (status) => {
//     const colors = {
//       draft: 'default',
//       pending: 'processing',
//       approved: 'success',
//       rejected: 'error'
//     };
//     return colors[status] || 'default';
//   };

//   const kpiColumns = [
//     {
//       title: 'KPI Title',
//       dataIndex: 'title',
//       key: 'title',
//       width: 250,
//       render: (text) => <strong>{text}</strong>
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       ellipsis: true
//     },
//     {
//       title: 'Weight',
//       dataIndex: 'weight',
//       key: 'weight',
//       width: 100,
//       render: (weight) => (
//         <Tag color="blue" style={{ fontWeight: 'bold' }}>
//           {weight}%
//         </Tag>
//       )
//     },
//     {
//       title: 'Target',
//       dataIndex: 'targetValue',
//       key: 'targetValue',
//       width: 150
//     },
//     {
//       title: 'Measurable Outcome',
//       dataIndex: 'measurableOutcome',
//       key: 'measurableOutcome',
//       width: 200,
//       ellipsis: true
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 100,
//       render: (status) => (
//         <Tag color={getStatusColor(status)}>
//           {status.toUpperCase()}
//         </Tag>
//       )
//     }
//   ];

//   const currentKPI = getCurrentQuarterKPI();

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <div>
//             <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
//               <TrophyOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//               My Quarterly KPIs
//             </h2>
//             <p style={{ color: '#666', margin: '8px 0 0 0' }}>
//               Define and track your Key Performance Indicators for the quarter
//             </p>
//           </div>
//           {!currentKPI || ['draft', 'rejected'].includes(currentKPI.approvalStatus) ? (
//             <Button
//               type="primary"
//               icon={<PlusOutlined />}
//               onClick={() => openModal(currentKPI)}
//             >
//               {currentKPI ? 'Edit KPIs' : 'Define KPIs'}
//             </Button>
//           ) : null}
//         </div>

//         <Alert
//           message="Important: KPI Guidelines"
//           description={
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li>Define 3-10 KPIs that align with your role and quarterly objectives</li>
//               <li>Total weight of all KPIs must equal 100%</li>
//               <li>Make your KPIs SMART: Specific, Measurable, Achievable, Relevant, Time-bound</li>
//               <li>Once approved, link your tasks to these KPIs for performance tracking</li>
//             </ul>
//           }
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         {currentKPI && (
//           <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//             <Row gutter={16}>
//               <Col xs={24} sm={8}>
//                 <Statistic
//                   title="Current Quarter"
//                   value={currentKPI.quarter}
//                   prefix={<InfoCircleOutlined />}
//                 />
//               </Col>
//               <Col xs={24} sm={8}>
//                 <Statistic
//                   title="Total KPIs"
//                   value={currentKPI.kpis.length}
//                   prefix={<TrophyOutlined />}
//                 />
//               </Col>
//               <Col xs={24} sm={8}>
//                 <Statistic
//                   title="Status"
//                   value={currentKPI.approvalStatus.toUpperCase()}
//                   valueStyle={{
//                     color:
//                       currentKPI.approvalStatus === 'approved' ? '#52c41a' :
//                       currentKPI.approvalStatus === 'pending' ? '#1890ff' :
//                       currentKPI.approvalStatus === 'rejected' ? '#f5222d' :
//                       '#8c8c8c'
//                   }}
//                 />
//               </Col>
//             </Row>

//             {currentKPI.approvalStatus === 'draft' && (
//               <div style={{ marginTop: '16px' }}>
//                 <Button
//                   type="primary"
//                   icon={<SendOutlined />}
//                   onClick={() => handleSubmitForApproval(currentKPI._id)}
//                   style={{ marginRight: '8px' }}
//                 >
//                   Submit for Approval
//                 </Button>
//                 <Button
//                   icon={<EditOutlined />}
//                   onClick={() => openModal(currentKPI)}
//                   style={{ marginRight: '8px' }}
//                 >
//                   Edit KPIs
//                 </Button>
//                 <Button
//                   danger
//                   icon={<DeleteOutlined />}
//                   onClick={() => handleDeleteKPI(currentKPI._id)}
//                 >
//                   Delete
//                 </Button>
//               </div>
//             )}

//             {currentKPI.approvalStatus === 'pending' && (
//               <Alert
//                 message="Pending Supervisor Approval"
//                 description="Your KPIs are currently under review by your supervisor. You will be notified once they are approved or if changes are needed."
//                 type="warning"
//                 showIcon
//                 style={{ marginTop: '16px' }}
//               />
//             )}

//             {currentKPI.approvalStatus === 'rejected' && (
//               <Alert
//                 message="KPIs Require Revision"
//                 description={
//                   <div>
//                     <p><strong>Supervisor Feedback:</strong></p>
//                     <p>{currentKPI.rejectionReason || 'Please revise your KPIs and resubmit.'}</p>
//                   </div>
//                 }
//                 type="error"
//                 showIcon
//                 style={{ marginTop: '16px' }}
//                 action={
//                   <Button
//                     type="primary"
//                     size="small"
//                     onClick={() => openModal(currentKPI)}
//                   >
//                     Revise KPIs
//                   </Button>
//                 }
//               />
//             )}

//             {currentKPI.approvalStatus === 'approved' && (
//               <Alert
//                 message="KPIs Approved!"
//                 description="Your KPIs have been approved by your supervisor. You can now start linking tasks to these KPIs."
//                 type="success"
//                 showIcon
//                 style={{ marginTop: '16px' }}
//               />
//             )}
//           </Card>
//         )}

//         <Tabs defaultActiveKey="current">
//           <Tabs.TabPane tab="Current Quarter" key="current">
//             {currentKPI ? (
//               <Table
//                 columns={kpiColumns}
//                 dataSource={currentKPI.kpis}
//                 rowKey={(record, index) => index}
//                 pagination={false}
//                 loading={loading}
//               />
//             ) : (
//               <Empty
//                 description="No KPIs defined for current quarter"
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//               >
//                 <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
//                   Define KPIs Now
//                 </Button>
//               </Empty>
//             )}
//           </Tabs.TabPane>

//           <Tabs.TabPane tab="History" key="history">
//             {kpis.filter(k => k.quarter !== currentQuarter).length > 0 ? (
//               <Space direction="vertical" style={{ width: '100%' }} size="large">
//                 {kpis.filter(k => k.quarter !== currentQuarter).map(kpi => (
//                   <Card
//                     key={kpi._id}
//                     size="small"
//                     title={
//                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                         <span>{kpi.quarter}</span>
//                         <Tag color={getStatusColor(kpi.approvalStatus)}>
//                           {kpi.approvalStatus.toUpperCase()}
//                         </Tag>
//                       </div>
//                     }
//                   >
//                     <Table
//                       columns={kpiColumns}
//                       dataSource={kpi.kpis}
//                       rowKey={(record, index) => index}
//                       pagination={false}
//                       size="small"
//                     />
//                   </Card>
//                 ))}
//               </Space>
//             ) : (
//               <Empty description="No historical KPIs" />
//             )}
//           </Tabs.TabPane>
//         </Tabs>
//       </Card>

//       {/* KPI Form Modal */}
//       <Modal
//         title={
//           <span>
//             <TrophyOutlined style={{ marginRight: '8px' }} />
//             {editingKPI ? 'Edit KPIs' : 'Define Quarterly KPIs'}
//           </span>
//         }
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//           setEditingKPI(null);
//         }}
//         footer={null}
//         width={900}
//       >
//         <Alert
//           message="Total weight must equal 100%"
//           type="info"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSaveKPIs}
//         >
//           <Form.Item name="quarter" label="Quarter" hidden>
//             <Input />
//           </Form.Item>

//           <Form.List name="kpis">
//             {(fields, { add, remove }) => (
//               <>
//                 {fields.map(({ key, name, ...restField }, index) => (
//                   <Card
//                     key={key}
//                     size="small"
//                     title={`KPI #${index + 1}`}
//                     extra={
//                       fields.length > 1 ? (
//                         <Button
//                           type="text"
//                           danger
//                           icon={<DeleteOutlined />}
//                           onClick={() => remove(name)}
//                         >
//                           Remove
//                         </Button>
//                       ) : null
//                     }
//                     style={{ marginBottom: '16px' }}
//                   >
//                     <Form.Item
//                       {...restField}
//                       name={[name, 'title']}
//                       label="KPI Title"
//                       rules={[{ required: true, message: 'KPI title is required' }]}
//                     >
//                       <Input placeholder="e.g., Complete Project Deliverables" />
//                     </Form.Item>

//                     <Form.Item
//                       {...restField}
//                       name={[name, 'description']}
//                       label="Description"
//                       rules={[{ required: true, message: 'Description is required' }]}
//                     >
//                       <TextArea
//                         rows={2}
//                         placeholder="Describe what this KPI measures and why it's important"
//                       />
//                     </Form.Item>

//                     <Row gutter={16}>
//                       <Col span={8}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'weight']}
//                           label="Weight (%)"
//                           rules={[
//                             { required: true, message: 'Weight is required' },
//                             { type: 'number', min: 1, max: 100, message: 'Weight must be 1-100' }
//                           ]}
//                         >
//                           <InputNumber
//                             style={{ width: '100%' }}
//                             placeholder="e.g., 30"
//                             min={1}
//                             max={100}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={16}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'targetValue']}
//                           label="Target Value"
//                           rules={[{ required: true, message: 'Target value is required' }]}
//                         >
//                           <Input placeholder="e.g., 5 projects completed" />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     <Form.Item
//                       {...restField}
//                       name={[name, 'measurableOutcome']}
//                       label="Measurable Outcome"
//                       rules={[{ required: true, message: 'Measurable outcome is required' }]}
//                     >
//                       <TextArea
//                         rows={2}
//                         placeholder="How will success be measured? e.g., All projects delivered on time with quality approval"
//                       />
//                     </Form.Item>
//                   </Card>
//                 ))}

//                 {fields.length < 10 && (
//                   <Button
//                     type="dashed"
//                     onClick={() => add()}
//                     block
//                     icon={<PlusOutlined />}
//                     style={{ marginBottom: '16px' }}
//                   >
//                     Add KPI
//                   </Button>
//                 )}
//               </>
//             )}
//           </Form.List>

//           <Form.Item style={{ marginBottom: 0 }}>
//             <Space>
//               <Button onClick={() => {
//                 setModalVisible(false);
//                 form.resetFields();
//                 setEditingKPI(null);
//               }}>
//                 Cancel
//               </Button>
//               <Button type="primary" htmlType="submit" loading={loading}>
//                 Save KPIs
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default EmployeeKPIManagement;