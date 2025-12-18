import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Form,
  Select,
  InputNumber,
  Input,
  message,
  Alert,
  Descriptions,
  Row,
  Col,
  Empty,
  Spin,
  Tooltip
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  SendOutlined,
  UserOutlined,
  StarOutlined,
  TeamOutlined,
  EyeOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const EnhancedBehavioralEvaluation = () => {
  const { user } = useSelector((state) => state.auth);
  const [evaluations, setEvaluations] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [defaultCriteria, setDefaultCriteria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadDirectReports();
    loadEvaluations();
    loadDefaultCriteria();
  }, []);

  const loadDirectReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enhanced-users/users/direct-reports');
      if (response.data.success) {
        setDirectReports(response.data.data);
        console.log('✅ Direct reports loaded:', response.data.data.length);
      }
    } catch (error) {
      console.error('Error loading direct reports:', error);
      message.error(error.response?.data?.message || 'Failed to load your direct reports');
    } finally {
      setLoading(false);
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/behavioral-evaluations');
      if (response.data.success) {
        setEvaluations(response.data.data);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      message.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultCriteria = async () => {
    try {
      const response = await api.get('/behavioral-evaluations/default-criteria');
      if (response.data.success) {
        setDefaultCriteria(response.data.data);
      }
    } catch (error) {
      console.error('Error loading criteria:', error);
    }
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter}-${year}`;
  };

  const openModal = (evaluation = null) => {
    setEditingEvaluation(evaluation);
    if (evaluation) {
      form.setFieldsValue({
        employeeId: evaluation.employee._id,
        quarter: evaluation.quarter,
        criteria: evaluation.criteria,
        overallComments: evaluation.overallComments
      });
    } else {
      form.setFieldsValue({
        quarter: getCurrentQuarter(),
        criteria: defaultCriteria
      });
    }
    setModalVisible(true);
  };

  const handleSaveEvaluation = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/behavioral-evaluations', values);

      if (response.data.success) {
        message.success('Evaluation saved successfully');
        setModalVisible(false);
        form.resetFields();
        setEditingEvaluation(null);
        loadEvaluations();
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      message.error(error.response?.data?.message || 'Failed to save evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (evaluationId) => {
    Modal.confirm({
      title: 'Submit Behavioral Evaluation?',
      content: 'Once submitted, the employee will be notified and can view their evaluation. You cannot modify it after submission.',
      okText: 'Yes, Submit',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const response = await api.post(`/behavioral-evaluations/${evaluationId}/submit`);
          if (response.data.success) {
            message.success('Evaluation submitted successfully');
            loadEvaluations();
          }
        } catch (error) {
          console.error('Error submitting evaluation:', error);
          message.error(error.response?.data?.message || 'Failed to submit evaluation');
        }
      }
    });
  };

  // Helper function to render stars based on decimal score
  const renderStars = (score) => {
    const fullStars = Math.floor(score);
    const decimal = score - fullStars;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarOutlined key={`full-${i}`} style={{ color: '#fadb14', fontSize: '18px' }} />);
    }

    if (decimal > 0) {
      stars.push(
        <span key="partial" style={{ position: 'relative', display: 'inline-block' }}>
          <StarOutlined style={{ color: '#d9d9d9', fontSize: '18px' }} />
          <span style={{ 
            position: 'absolute', 
            left: 0, 
            top: 0, 
            overflow: 'hidden', 
            width: `${decimal * 100}%` 
          }}>
            <StarOutlined style={{ color: '#fadb14', fontSize: '18px' }} />
          </span>
        </span>
      );
    }

    const emptyStars = 5 - Math.ceil(score);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarOutlined key={`empty-${i}`} style={{ color: '#d9d9d9', fontSize: '18px' }} />);
    }

    return stars;
  };

  const getScoreColor = (score) => {
    const percentage = (score / 5) * 100;
    if (percentage >= 80) return '#52c41a';
    if (percentage >= 60) return '#1890ff';
    if (percentage >= 40) return '#faad14';
    return '#ff4d4f';
  };

  // Filter employees who haven't been evaluated this quarter
  const getEvaluatableEmployees = () => {
    const currentQuarter = getCurrentQuarter();
    const evaluatedIds = evaluations
      .filter(e => e.quarter === currentQuarter)
      .map(e => e.employee._id);
    
    return directReports.filter(emp => !evaluatedIds.includes(emp._id));
  };

  const showEvaluationDetails = (record) => {
    Modal.info({
      title: 'Evaluation Details',
      width: 800,
      icon: <StarOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Employee" span={2}>
              <strong>{record.employee.fullName}</strong> - {record.employee.position}
            </Descriptions.Item>
            <Descriptions.Item label="Quarter">
              {record.quarter}
            </Descriptions.Item>
            <Descriptions.Item label="Overall Score">
              <div>
                <strong style={{ 
                  fontSize: '20px',
                  color: record.overallBehavioralScore >= 80 ? '#52c41a' : 
                         record.overallBehavioralScore >= 60 ? '#1890ff' : '#faad14'
                }}>
                  {record.overallBehavioralScore.toFixed(1)}%
                </strong>
                <div style={{ marginTop: '8px' }}>
                  {renderStars(record.overallBehavioralScore / 20)}
                </div>
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Status" span={2}>
              <Tag color={record.status === 'submitted' ? 'success' : 'processing'}>
                {record.status === 'submitted' ? 'Submitted' : 'Acknowledged'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted Date" span={2}>
              {record.submittedAt ? dayjs(record.submittedAt).format('MMM DD, YYYY HH:mm') : 'N/A'}
            </Descriptions.Item>
          </Descriptions>

          <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Criteria Scores:</h4>
          {record.criteria.map((criterion, index) => (
            <Card key={index} size="small" style={{ marginBottom: '8px' }}>
              <Row align="middle">
                <Col span={12}>
                  <strong>{criterion.name}</strong>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>
                    {renderStars(criterion.score)}
                    <span style={{ marginLeft: '12px', fontSize: '16px', fontWeight: 'bold', color: getScoreColor(criterion.score) }}>
                      {criterion.score.toFixed(1)}/5.0
                    </span>
                  </div>
                </Col>
              </Row>
              {criterion.comments && (
                <p style={{ margin: '8px 0 0 0', color: '#666', fontStyle: 'italic' }}>
                  {criterion.comments}
                </p>
              )}
            </Card>
          ))}

          {record.overallComments && (
            <>
              <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Overall Comments:</h4>
              <Alert 
                message={record.overallComments} 
                type="info" 
                style={{ whiteSpace: 'pre-wrap' }}
              />
            </>
          )}
        </div>
      ),
      okText: 'Close'
    });
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 220,
      render: (name, record) => (
        <Space direction="vertical" size={0}>
          <strong>{name}</strong>
          <small style={{ color: '#666' }}>{record.employee.position || 'N/A'}</small>
        </Space>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100
    },
    {
      title: 'Overall Score',
      dataIndex: 'overallBehavioralScore',
      key: 'score',
      width: 180,
      render: (score) => (
        <div>
          <strong style={{ 
            color: score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#faad14',
            fontSize: '16px'
          }}>
            {score.toFixed(1)}%
          </strong>
          <div style={{ marginTop: '4px' }}>
            {renderStars(score / 20)}
          </div>
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => {
        const colors = {
          draft: 'default',
          submitted: 'success',
          acknowledged: 'processing'
        };
        const labels = {
          draft: 'Draft',
          submitted: 'Submitted',
          acknowledged: 'Acknowledged'
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 130,
      render: (date) => dayjs(date).format('MMM DD, YYYY')
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => openModal(record)}
              >
                Edit
              </Button>
              <Button
                type="primary"
                size="small"
                icon={<SendOutlined />}
                onClick={() => handleSubmitEvaluation(record._id)}
              >
                Submit
              </Button>
            </>
          )}
          {record.status !== 'draft' && (
            <Button 
              type="link" 
              icon={<EyeOutlined />}
              onClick={() => showEvaluationDetails(record)}
            >
              View Details
            </Button>
          )}
        </Space>
      )
    }
  ];

  const evaluatableEmployees = getEvaluatableEmployees();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px' 
        }}>
          <div>
            <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <StarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Behavioral Evaluations
            </h2>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Evaluate your direct reports' behavioral performance
              {directReports.length > 0 && (
                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                  {' '}({directReports.length} direct report{directReports.length !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openModal()}
            disabled={evaluatableEmployees.length === 0 || loading}
          >
            New Evaluation
          </Button>
        </div>

        <Alert
          message="Decimal Rating System"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>You can rate employees using <strong>decimal values</strong> (e.g., 3.5, 4.2, 4.8)</li>
              <li>Ratings range from <strong>1.0 to 5.0</strong> with increments of 0.1</li>
              <li>Rate each criterion on this scale for more precise evaluations</li>
              <li>Behavioral evaluations contribute 30% to quarterly performance scores</li>
              <li>Once submitted, evaluations cannot be modified</li>
            </ul>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        {loading && !modalVisible ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading..." />
          </div>
        ) : directReports.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span>
                You don't have any direct reports assigned to you.
                <br />
                <small style={{ color: '#999' }}>
                  Contact your administrator if this seems incorrect.
                </small>
              </span>
            }
          />
        ) : (
          <Table
            columns={columns}
            dataSource={evaluations}
            rowKey="_id"
            loading={loading && modalVisible}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      {/* Evaluation Form Modal */}
      <Modal
        title={
          <span>
            <StarOutlined style={{ marginRight: '8px' }} />
            {editingEvaluation ? 'Edit Behavioral Evaluation' : 'New Behavioral Evaluation'}
          </span>
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingEvaluation(null);
        }}
        footer={null}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEvaluation}
        >
          <Form.Item
            name="employeeId"
            label="Employee to Evaluate"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              placeholder="Select your direct report"
              showSearch
              optionFilterProp="children"
              disabled={!!editingEvaluation}
              filterOption={(input, option) =>
                option.children.props.children[1].props.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {evaluatableEmployees.map(emp => (
                <Option key={emp._id} value={emp._id}>
                  <Space>
                    <UserOutlined />
                    <span>
                      {emp.fullName} - {emp.position || 'Staff'}
                    </span>
                  </Space>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quarter"
            label="Quarter"
            rules={[{ required: true }]}
          >
            <Select disabled={!!editingEvaluation}>
              <Option value={getCurrentQuarter()}>{getCurrentQuarter()}</Option>
            </Select>
          </Form.Item>

          <Alert
            message="Rate each criterion from 1.0 to 5.0 (decimal values allowed)"
            description={
              <div>
                <strong>Rating Scale:</strong>
                <br />
                1.0-1.9 = Poor | 2.0-2.9 = Below Average | 3.0-3.9 = Average | 4.0-4.9 = Good | 5.0 = Excellent
                <br />
                <em>Example: You can use 3.5 for "above average" or 4.7 for "very good"</em>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.List name="criteria">
            {(fields) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    size="small" 
                    style={{ marginBottom: '12px', backgroundColor: '#fafafa' }}
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      hidden
                    >
                      <Input />
                    </Form.Item>

                    <Form.Item 
                      label={
                        <strong style={{ fontSize: '14px' }}>
                          {form.getFieldValue(['criteria', name, 'name'])}
                        </strong>
                      } 
                      style={{ marginBottom: '12px' }}
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'score']}
                        rules={[
                          { required: true, message: 'Please provide a rating' },
                          { 
                            type: 'number', 
                            min: 1, 
                            max: 5, 
                            message: 'Score must be between 1.0 and 5.0' 
                          }
                        ]}
                        style={{ marginBottom: '8px' }}
                      >
                        <InputNumber
                          min={1}
                          max={5}
                          step={0.1}
                          precision={1}
                          style={{ width: '200px' }}
                          placeholder="Enter score (1.0 - 5.0)"
                          addonAfter="/ 5.0"
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'comments']}
                        style={{ marginBottom: 0 }}
                      >
                        <TextArea
                          rows={2}
                          placeholder="Add specific examples or feedback (optional but recommended)..."
                        />
                      </Form.Item>
                    </Form.Item>
                  </Card>
                ))}
              </>
            )}
          </Form.List>

          <Form.Item
            name="overallComments"
            label="Overall Comments"
          >
            <TextArea
              rows={4}
              placeholder="Provide overall feedback about the employee's behavioral performance..."
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Space>
              <Button 
                onClick={() => {
                  setModalVisible(false);
                  form.resetFields();
                  setEditingEvaluation(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<StarOutlined />}
              >
                Save Evaluation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EnhancedBehavioralEvaluation;














// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Button,
//   Table,
//   Tag,
//   Space,
//   Modal,
//   Form,
//   Select,
//   Rate,
//   Input,
//   message,
//   Alert,
//   Descriptions,
//   Row,
//   Col,
//   Empty,
//   Spin
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   SendOutlined,
//   UserOutlined,
//   StarOutlined,
//   TeamOutlined,
//   EyeOutlined
// } from '@ant-design/icons';
// import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';
// import api from '../../services/api';

// const { TextArea } = Input;
// const { Option } = Select;

// const EnhancedBehavioralEvaluation = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [evaluations, setEvaluations] = useState([]);
//   const [directReports, setDirectReports] = useState([]);
//   const [defaultCriteria, setDefaultCriteria] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editingEvaluation, setEditingEvaluation] = useState(null);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     loadDirectReports();
//     loadEvaluations();
//     loadDefaultCriteria();
//   }, []);

//   const loadDirectReports = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/enhanced-users/users/direct-reports');
//       if (response.data.success) {
//         setDirectReports(response.data.data);
//         console.log('✅ Direct reports loaded:', response.data.data.length);
//       }
//     } catch (error) {
//       console.error('Error loading direct reports:', error);
//       message.error(error.response?.data?.message || 'Failed to load your direct reports');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadEvaluations = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get('/behavioral-evaluations');
//       if (response.data.success) {
//         setEvaluations(response.data.data);
//       }
//     } catch (error) {
//       console.error('Error loading evaluations:', error);
//       message.error('Failed to load evaluations');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDefaultCriteria = async () => {
//     try {
//       const response = await api.get('/behavioral-evaluations/default-criteria');
//       if (response.data.success) {
//         setDefaultCriteria(response.data.data);
//       }
//     } catch (error) {
//       console.error('Error loading criteria:', error);
//     }
//   };

//   const getCurrentQuarter = () => {
//     const now = new Date();
//     const month = now.getMonth() + 1;
//     const year = now.getFullYear();
//     const quarter = Math.ceil(month / 3);
//     return `Q${quarter}-${year}`;
//   };

//   const openModal = (evaluation = null) => {
//     setEditingEvaluation(evaluation);
//     if (evaluation) {
//       form.setFieldsValue({
//         employeeId: evaluation.employee._id,
//         quarter: evaluation.quarter,
//         criteria: evaluation.criteria,
//         overallComments: evaluation.overallComments
//       });
//     } else {
//       form.setFieldsValue({
//         quarter: getCurrentQuarter(),
//         criteria: defaultCriteria
//       });
//     }
//     setModalVisible(true);
//   };

//   const handleSaveEvaluation = async (values) => {
//     try {
//       setLoading(true);
//       const response = await api.post('/behavioral-evaluations', values);

//       if (response.data.success) {
//         message.success('Evaluation saved successfully');
//         setModalVisible(false);
//         form.resetFields();
//         setEditingEvaluation(null);
//         loadEvaluations();
//       }
//     } catch (error) {
//       console.error('Error saving evaluation:', error);
//       message.error(error.response?.data?.message || 'Failed to save evaluation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitEvaluation = async (evaluationId) => {
//     Modal.confirm({
//       title: 'Submit Behavioral Evaluation?',
//       content: 'Once submitted, the employee will be notified and can view their evaluation. You cannot modify it after submission.',
//       okText: 'Yes, Submit',
//       okType: 'primary',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           const response = await api.post(`/behavioral-evaluations/${evaluationId}/submit`);
//           if (response.data.success) {
//             message.success('Evaluation submitted successfully');
//             loadEvaluations();
//           }
//         } catch (error) {
//           console.error('Error submitting evaluation:', error);
//           message.error(error.response?.data?.message || 'Failed to submit evaluation');
//         }
//       }
//     });
//   };

//   // Filter employees who haven't been evaluated this quarter
//   const getEvaluatableEmployees = () => {
//     const currentQuarter = getCurrentQuarter();
//     const evaluatedIds = evaluations
//       .filter(e => e.quarter === currentQuarter)
//       .map(e => e.employee._id);
    
//     return directReports.filter(emp => !evaluatedIds.includes(emp._id));
//   };

//   const showEvaluationDetails = (record) => {
//     Modal.info({
//       title: 'Evaluation Details',
//       width: 800,
//       icon: <StarOutlined style={{ color: '#1890ff' }} />,
//       content: (
//         <div style={{ marginTop: '16px' }}>
//           <Descriptions bordered column={2} size="small">
//             <Descriptions.Item label="Employee" span={2}>
//               <strong>{record.employee.fullName}</strong> - {record.employee.position}
//             </Descriptions.Item>
//             <Descriptions.Item label="Quarter">
//               {record.quarter}
//             </Descriptions.Item>
//             <Descriptions.Item label="Overall Score">
//               <div>
//                 <strong style={{ 
//                   fontSize: '18px',
//                   color: record.overallBehavioralScore >= 80 ? '#52c41a' : 
//                          record.overallBehavioralScore >= 60 ? '#1890ff' : '#faad14'
//                 }}>
//                   {record.overallBehavioralScore.toFixed(1)}%
//                 </strong>
//                 <br />
//                 <Rate disabled value={record.overallBehavioralScore / 20} style={{ fontSize: '14px' }} />
//               </div>
//             </Descriptions.Item>
//             <Descriptions.Item label="Status" span={2}>
//               <Tag color={record.status === 'submitted' ? 'success' : 'processing'}>
//                 {record.status === 'submitted' ? 'Submitted' : 'Acknowledged'}
//               </Tag>
//             </Descriptions.Item>
//             <Descriptions.Item label="Submitted Date" span={2}>
//               {record.submittedAt ? dayjs(record.submittedAt).format('MMM DD, YYYY HH:mm') : 'N/A'}
//             </Descriptions.Item>
//           </Descriptions>

//           <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Criteria Scores:</h4>
//           {record.criteria.map((criterion, index) => (
//             <Card key={index} size="small" style={{ marginBottom: '8px' }}>
//               <Row align="middle">
//                 <Col span={12}>
//                   <strong>{criterion.name}</strong>
//                 </Col>
//                 <Col span={12} style={{ textAlign: 'right' }}>
//                   <Rate disabled value={criterion.score} style={{ fontSize: '18px' }} />
//                   <span style={{ marginLeft: '8px', color: '#666' }}>
//                     ({criterion.score}/5)
//                   </span>
//                 </Col>
//               </Row>
//               {criterion.comments && (
//                 <p style={{ margin: '8px 0 0 0', color: '#666', fontStyle: 'italic' }}>
//                   {criterion.comments}
//                 </p>
//               )}
//             </Card>
//           ))}

//           {record.overallComments && (
//             <>
//               <h4 style={{ marginTop: '20px', marginBottom: '12px' }}>Overall Comments:</h4>
//               <Alert 
//                 message={record.overallComments} 
//                 type="info" 
//                 style={{ whiteSpace: 'pre-wrap' }}
//               />
//             </>
//           )}
//         </div>
//       ),
//       okText: 'Close'
//     });
//   };

//   const columns = [
//     {
//       title: 'Employee',
//       dataIndex: ['employee', 'fullName'],
//       key: 'employee',
//       width: 220,
//       render: (name, record) => (
//         <Space direction="vertical" size={0}>
//           <strong>{name}</strong>
//           <small style={{ color: '#666' }}>{record.employee.position || 'N/A'}</small>
//         </Space>
//       )
//     },
//     {
//       title: 'Quarter',
//       dataIndex: 'quarter',
//       key: 'quarter',
//       width: 100
//     },
//     {
//       title: 'Overall Score',
//       dataIndex: 'overallBehavioralScore',
//       key: 'score',
//       width: 160,
//       render: (score) => (
//         <div>
//           <strong style={{ 
//             color: score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#faad14',
//             fontSize: '16px'
//           }}>
//             {score.toFixed(1)}%
//           </strong>
//           <br />
//           <Rate disabled value={score / 20} style={{ fontSize: '14px' }} />
//         </div>
//       )
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 120,
//       render: (status) => {
//         const colors = {
//           draft: 'default',
//           submitted: 'success',
//           acknowledged: 'processing'
//         };
//         const labels = {
//           draft: 'Draft',
//           submitted: 'Submitted',
//           acknowledged: 'Acknowledged'
//         };
//         return <Tag color={colors[status]}>{labels[status]}</Tag>;
//       }
//     },
//     {
//       title: 'Created',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       width: 130,
//       render: (date) => dayjs(date).format('MMM DD, YYYY')
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 200,
//       fixed: 'right',
//       render: (_, record) => (
//         <Space>
//           {record.status === 'draft' && (
//             <>
//               <Button
//                 type="link"
//                 icon={<EditOutlined />}
//                 onClick={() => openModal(record)}
//               >
//                 Edit
//               </Button>
//               <Button
//                 type="primary"
//                 size="small"
//                 icon={<SendOutlined />}
//                 onClick={() => handleSubmitEvaluation(record._id)}
//               >
//                 Submit
//               </Button>
//             </>
//           )}
//           {record.status !== 'draft' && (
//             <Button 
//               type="link" 
//               icon={<EyeOutlined />}
//               onClick={() => showEvaluationDetails(record)}
//             >
//               View Details
//             </Button>
//           )}
//         </Space>
//       )
//     }
//   ];

//   const evaluatableEmployees = getEvaluatableEmployees();

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ 
//           display: 'flex', 
//           justifyContent: 'space-between', 
//           alignItems: 'center', 
//           marginBottom: '24px' 
//         }}>
//           <div>
//             <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
//               <StarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//               Behavioral Evaluations
//             </h2>
//             <p style={{ color: '#666', margin: '8px 0 0 0' }}>
//               Evaluate your direct reports' behavioral performance
//               {directReports.length > 0 && (
//                 <span style={{ color: '#1890ff', fontWeight: 500 }}>
//                   {' '}({directReports.length} direct report{directReports.length !== 1 ? 's' : ''})
//                 </span>
//               )}
//             </p>
//           </div>
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={() => openModal()}
//             disabled={evaluatableEmployees.length === 0 || loading}
//           >
//             New Evaluation
//           </Button>
//         </div>

//         <Alert
//           message="Direct Reports Only"
//           description={
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li>You can only evaluate employees who report <strong>directly</strong> to you</li>
//               <li>Rate each criterion on a scale of 1-5 stars</li>
//               <li>Provide specific examples and constructive feedback in comments</li>
//               <li>Behavioral evaluations contribute 30% to quarterly performance scores</li>
//               <li>Once submitted, evaluations cannot be modified</li>
//             </ul>
//           }
//           type="info"
//           showIcon
//           icon={<TeamOutlined />}
//           style={{ marginBottom: '24px' }}
//         />

//         {loading && !modalVisible ? (
//           <div style={{ textAlign: 'center', padding: '50px' }}>
//             <Spin size="large" tip="Loading..." />
//           </div>
//         ) : directReports.length === 0 ? (
//           <Empty
//             image={Empty.PRESENTED_IMAGE_SIMPLE}
//             description={
//               <span>
//                 You don't have any direct reports assigned to you.
//                 <br />
//                 <small style={{ color: '#999' }}>
//                   Contact your administrator if this seems incorrect.
//                 </small>
//               </span>
//             }
//           />
//         ) : (
//           <Table
//             columns={columns}
//             dataSource={evaluations}
//             rowKey="_id"
//             loading={loading && modalVisible}
//             pagination={{ pageSize: 10, showSizeChanger: true }}
//             scroll={{ x: 1000 }}
//           />
//         )}
//       </Card>

//       {/* Evaluation Form Modal */}
//       <Modal
//         title={
//           <span>
//             <StarOutlined style={{ marginRight: '8px' }} />
//             {editingEvaluation ? 'Edit Behavioral Evaluation' : 'New Behavioral Evaluation'}
//           </span>
//         }
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//           setEditingEvaluation(null);
//         }}
//         footer={null}
//         width={800}
//         destroyOnClose
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSaveEvaluation}
//         >
//           <Form.Item
//             name="employeeId"
//             label="Employee to Evaluate"
//             rules={[{ required: true, message: 'Please select an employee' }]}
//           >
//             <Select
//               placeholder="Select your direct report"
//               showSearch
//               optionFilterProp="children"
//               disabled={!!editingEvaluation}
//               filterOption={(input, option) =>
//                 option.children.toLowerCase().includes(input.toLowerCase())
//               }
//             >
//               {evaluatableEmployees.map(emp => (
//                 <Option key={emp._id} value={emp._id}>
//                   <Space>
//                     <UserOutlined />
//                     <span>
//                       {emp.fullName} - {emp.position || 'Staff'}
//                     </span>
//                   </Space>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="quarter"
//             label="Quarter"
//             rules={[{ required: true }]}
//           >
//             <Select disabled={!!editingEvaluation}>
//               <Option value={getCurrentQuarter()}>{getCurrentQuarter()}</Option>
//             </Select>
//           </Form.Item>

//           <Alert
//             message="Rate each criterion from 1 to 5 stars"
//             description="1 = Poor | 2 = Below Average | 3 = Average | 4 = Good | 5 = Excellent"
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />

//           <Form.List name="criteria">
//             {(fields) => (
//               <>
//                 {fields.map(({ key, name, ...restField }) => (
//                   <Card 
//                     key={key} 
//                     size="small" 
//                     style={{ marginBottom: '12px', backgroundColor: '#fafafa' }}
//                   >
//                     <Form.Item
//                       {...restField}
//                       name={[name, 'name']}
//                       hidden
//                     >
//                       <Input />
//                     </Form.Item>

//                     <Form.Item 
//                       label={
//                         <strong style={{ fontSize: '14px' }}>
//                           {form.getFieldValue(['criteria', name, 'name'])}
//                         </strong>
//                       } 
//                       style={{ marginBottom: '12px' }}
//                     >
//                       <Form.Item
//                         {...restField}
//                         name={[name, 'score']}
//                         rules={[{ required: true, message: 'Please provide a rating' }]}
//                         style={{ marginBottom: '8px' }}
//                       >
//                         <Rate style={{ fontSize: '26px' }} />
//                       </Form.Item>

//                       <Form.Item
//                         {...restField}
//                         name={[name, 'comments']}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <TextArea
//                           rows={2}
//                           placeholder="Add specific examples or feedback (optional but recommended)..."
//                         />
//                       </Form.Item>
//                     </Form.Item>
//                   </Card>
//                 ))}
//               </>
//             )}
//           </Form.List>

//           <Form.Item
//             name="overallComments"
//             label="Overall Comments"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Provide overall feedback about the employee's behavioral performance..."
//             />
//           </Form.Item>

//           <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
//             <Space>
//               <Button 
//                 onClick={() => {
//                   setModalVisible(false);
//                   form.resetFields();
//                   setEditingEvaluation(null);
//                 }}
//               >
//                 Cancel
//               </Button>
//               <Button 
//                 type="primary" 
//                 htmlType="submit" 
//                 loading={loading}
//                 icon={<StarOutlined />}
//               >
//                 Save Evaluation
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default EnhancedBehavioralEvaluation;









// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Button,
//   Table,
//   Tag,
//   Space,
//   Modal,
//   Form,
//   Select,
//   Rate,
//   Input,
//   message,
//   Alert,
//   Descriptions,
//   Row,
//   Col
// } from 'antd';
// import {
//   PlusOutlined,
//   EditOutlined,
//   SendOutlined,
//   UserOutlined,
//   StarOutlined
// } from '@ant-design/icons';
// import { behavioralEvaluationAPI } from '../../services/behavioralEvaluationAPI';
// import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';

// const { TextArea } = Input;
// const { Option } = Select;

// const SupervisorBehavioralEvaluation = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [evaluations, setEvaluations] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [defaultCriteria, setDefaultCriteria] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [editingEvaluation, setEditingEvaluation] = useState(null);
//   const [form] = Form.useForm();

//   useEffect(() => {
//     loadEvaluations();
//     loadDefaultCriteria();
//     loadEmployees();
//   }, []);

//   const loadEvaluations = async () => {
//     try {
//       setLoading(true);
//       const result = await behavioralEvaluationAPI.getEvaluations();
//       if (result.success) {
//         setEvaluations(result.data);
//       }
//     } catch (error) {
//       console.error('Error loading evaluations:', error);
//       message.error('Failed to load evaluations');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const loadDefaultCriteria = async () => {
//     try {
//       const result = await behavioralEvaluationAPI.getDefaultCriteria();
//       if (result.success) {
//         setDefaultCriteria(result.data);
//       }
//     } catch (error) {
//       console.error('Error loading criteria:', error);
//     }
//   };

//   const loadEmployees = async () => {
//     try {
//       // Load employees from your department
//       const response = await fetch('http://localhost:5001/api/auth/users', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       if (data.success) {
//         // Filter employees in your department (excluding supervisors)
//         const departmentEmployees = data.data.filter(
//           emp => emp.department === user.department && emp.role === 'employee'
//         );
//         setEmployees(departmentEmployees);
//       }
//     } catch (error) {
//       console.error('Error loading employees:', error);
//     }
//   };

//   const getCurrentQuarter = () => {
//     const now = new Date();
//     const month = now.getMonth() + 1;
//     const year = now.getFullYear();
//     const quarter = Math.ceil(month / 3);
//     return `Q${quarter}-${year}`;
//   };

//   const openModal = (evaluation = null) => {
//     setEditingEvaluation(evaluation);
//     if (evaluation) {
//       form.setFieldsValue({
//         employeeId: evaluation.employee._id,
//         quarter: evaluation.quarter,
//         criteria: evaluation.criteria,
//         overallComments: evaluation.overallComments
//       });
//     } else {
//       form.setFieldsValue({
//         quarter: getCurrentQuarter(),
//         criteria: defaultCriteria
//       });
//     }
//     setModalVisible(true);
//   };

//   const handleSaveEvaluation = async (values) => {
//     try {
//       setLoading(true);
//       const result = await behavioralEvaluationAPI.createOrUpdateEvaluation(
//         values.employeeId,
//         values.quarter,
//         values.criteria,
//         values.overallComments || ''
//       );

//       if (result.success) {
//         message.success('Evaluation saved successfully');
//         setModalVisible(false);
//         form.resetFields();
//         setEditingEvaluation(null);
//         loadEvaluations();
//       } else {
//         message.error(result.message);
//       }
//     } catch (error) {
//       console.error('Error saving evaluation:', error);
//       message.error('Failed to save evaluation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitEvaluation = async (evaluationId) => {
//     Modal.confirm({
//       title: 'Submit Behavioral Evaluation?',
//       content: 'Once submitted, the employee will be notified and can view their evaluation. Are you sure?',
//       okText: 'Yes, Submit',
//       cancelText: 'Cancel',
//       onOk: async () => {
//         try {
//           const result = await behavioralEvaluationAPI.submitEvaluation(evaluationId);
//           if (result.success) {
//             message.success('Evaluation submitted successfully');
//             loadEvaluations();
//           } else {
//             message.error(result.message);
//           }
//         } catch (error) {
//           console.error('Error submitting evaluation:', error);
//           message.error('Failed to submit evaluation');
//         }
//       }
//     });
//   };

//   const columns = [
//     {
//       title: 'Employee',
//       dataIndex: ['employee', 'fullName'],
//       key: 'employee',
//       width: 200
//     },
//     {
//       title: 'Quarter',
//       dataIndex: 'quarter',
//       key: 'quarter',
//       width: 100
//     },
//     {
//       title: 'Overall Score',
//       dataIndex: 'overallBehavioralScore',
//       key: 'score',
//       width: 150,
//       render: (score) => (
//         <div>
//           <strong style={{ color: score >= 80 ? '#52c41a' : score >= 60 ? '#1890ff' : '#faad14' }}>
//             {score.toFixed(1)}%
//           </strong>
//           <br />
//           <Rate disabled value={score / 20} style={{ fontSize: '14px' }} />
//         </div>
//       )
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 120,
//       render: (status) => {
//         const colors = {
//           draft: 'default',
//           submitted: 'success',
//           acknowledged: 'processing'
//         };
//         return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
//       }
//     },
//     {
//       title: 'Created',
//       dataIndex: 'createdAt',
//       key: 'createdAt',
//       width: 150,
//       render: (date) => dayjs(date).format('MMM DD, YYYY')
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 200,
//       render: (_, record) => (
//         <Space>
//           {record.status === 'draft' && (
//             <>
//               <Button
//                 type="link"
//                 icon={<EditOutlined />}
//                 onClick={() => openModal(record)}
//               >
//                 Edit
//               </Button>
//               <Button
//                 type="primary"
//                 size="small"
//                 icon={<SendOutlined />}
//                 onClick={() => handleSubmitEvaluation(record._id)}
//               >
//                 Submit
//               </Button>
//             </>
//           )}
//           {record.status !== 'draft' && (
//             <Button type="link" onClick={() => {
//               Modal.info({
//                 title: 'Evaluation Details',
//                 width: 800,
//                 content: (
//                   <div style={{ marginTop: '16px' }}>
//                     <Descriptions bordered column={2} size="small">
//                       <Descriptions.Item label="Employee" span={2}>
//                         {record.employee.fullName}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Quarter">
//                         {record.quarter}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Overall Score">
//                         {record.overallBehavioralScore.toFixed(1)}%
//                       </Descriptions.Item>
//                     </Descriptions>

//                     <h4 style={{ marginTop: '16px' }}>Criteria Scores:</h4>
//                     {record.criteria.map((criterion, index) => (
//                       <Card key={index} size="small" style={{ marginBottom: '8px' }}>
//                         <Row>
//                           <Col span={12}>
//                             <strong>{criterion.name}</strong>
//                           </Col>
//                           <Col span={12} style={{ textAlign: 'right' }}>
//                             <Rate disabled value={criterion.score} style={{ fontSize: '16px' }} />
//                           </Col>
//                         </Row>
//                         {criterion.comments && (
//                           <p style={{ margin: '8px 0 0 0', color: '#666' }}>{criterion.comments}</p>
//                         )}
//                       </Card>
//                     ))}

//                     {record.overallComments && (
//                       <>
//                         <h4 style={{ marginTop: '16px' }}>Overall Comments:</h4>
//                         <Alert message={record.overallComments} type="info" />
//                       </>
//                     )}
//                   </div>
//                 )
//               });
//             }}>
//               View Details
//             </Button>
//           )}
//         </Space>
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <div>
//             <h2 style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
//               <StarOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//               Behavioral Evaluations
//             </h2>
//             <p style={{ color: '#666', margin: '8px 0 0 0' }}>
//               Evaluate your team members' behavioral performance
//             </p>
//           </div>
//           <Button
//             type="primary"
//             icon={<PlusOutlined />}
//             onClick={() => openModal()}
//           >
//             New Evaluation
//           </Button>
//         </div>

//         <Alert
//           message="Behavioral Evaluation Guidelines"
//           description={
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li>Rate each criterion on a scale of 1-5 stars</li>
//               <li>Provide specific examples and constructive feedback in comments</li>
//               <li>Be fair, objective, and consistent across all team members</li>
//               <li>This evaluation contributes 30% to the employee's quarterly performance score</li>
//             </ul>
//           }
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         <Table
//           columns={columns}
//           dataSource={evaluations}
//           rowKey="_id"
//           loading={loading}
//           pagination={{ pageSize: 10 }}
//         />
//       </Card>

//       {/* Evaluation Form Modal */}
//       <Modal
//         title={
//           <span>
//             <StarOutlined style={{ marginRight: '8px' }} />
//             {editingEvaluation ? 'Edit Behavioral Evaluation' : 'New Behavioral Evaluation'}
//           </span>
//         }
//         open={modalVisible}
//         onCancel={() => {
//           setModalVisible(false);
//           form.resetFields();
//           setEditingEvaluation(null);
//         }}
//         footer={null}
//         width={800}
//       >
//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSaveEvaluation}
//         >
//           <Form.Item
//             name="employeeId"
//             label="Employee"
//             rules={[{ required: true, message: 'Please select an employee' }]}
//           >
//             <Select
//               placeholder="Select employee to evaluate"
//               showSearch
//               optionFilterProp="children"
//               disabled={!!editingEvaluation}
//             >
//               {employees.map(emp => (
//                 <Option key={emp._id} value={emp._id}>
//                   <Space>
//                     <UserOutlined />
//                     {emp.fullName} - {emp.position}
//                   </Space>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="quarter"
//             label="Quarter"
//             rules={[{ required: true, message: 'Please select quarter' }]}
//           >
//             <Select disabled={!!editingEvaluation}>
//               <Option value={getCurrentQuarter()}>{getCurrentQuarter()}</Option>
//             </Select>
//           </Form.Item>

//           <Alert
//             message="Rate each criterion from 1 to 5 stars"
//             description="1 star = Poor, 2 stars = Below Average, 3 stars = Average, 4 stars = Good, 5 stars = Excellent"
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />

//           <Form.List name="criteria">
//             {(fields) => (
//               <>
//                 {fields.map(({ key, name, ...restField }) => (
//                   <Card key={key} size="small" style={{ marginBottom: '12px' }}>
//                     <Form.Item
//                       {...restField}
//                       name={[name, 'name']}
//                       label="Criterion"
//                       hidden
//                     >
//                       <Input />
//                     </Form.Item>

//                     <Form.Item label={
//                       <strong style={{ fontSize: '14px' }}>
//                         {form.getFieldValue(['criteria', name, 'name'])}
//                       </strong>
//                     } style={{ marginBottom: '12px' }}>
//                       <Form.Item
//                         {...restField}
//                         name={[name, 'score']}
//                         rules={[{ required: true, message: 'Please provide a rating' }]}
//                         style={{ marginBottom: '8px' }}
//                       >
//                         <Rate style={{ fontSize: '24px' }} />
//                       </Form.Item>

//                       <Form.Item
//                         {...restField}
//                         name={[name, 'comments']}
//                         style={{ marginBottom: 0 }}
//                       >
//                         <TextArea
//                           rows={2}
//                           placeholder="Add specific examples or feedback..."
//                         />
//                       </Form.Item>
//                     </Form.Item>
//                   </Card>
//                 ))}
//               </>
//             )}
//           </Form.List>

//           <Form.Item
//             name="overallComments"
//             label="Overall Comments"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Provide overall feedback about the employee's behavioral performance..."
//             />
//           </Form.Item>

//           <Form.Item style={{ marginBottom: 0 }}>
//             <Space>
//               <Button onClick={() => {
//                 setModalVisible(false);
//                 form.resetFields();
//                 setEditingEvaluation(null);
//               }}>
//                 Cancel
//               </Button>
//               <Button type="primary" htmlType="submit" loading={loading}>
//                 Save Evaluation
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>
//     </div>
//   );
// };

// export default SupervisorBehavioralEvaluation;