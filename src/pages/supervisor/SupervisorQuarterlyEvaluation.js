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
  Input,
  message,
  Alert,
  Descriptions,
  Progress,
  Row,
  Col,
  Statistic,
  Empty,
  Spin
} from 'antd';
import {
  TrophyOutlined,
  BarChartOutlined,
  SendOutlined,
  FileTextOutlined,
  UserOutlined,
  CalculatorOutlined
} from '@ant-design/icons';
import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import api from '../../services/api';

const { TextArea } = Input;
const { Option } = Select;

const EnhancedQuarterlyEvaluation = () => {
  const { user } = useSelector((state) => state.auth);
  const [evaluations, setEvaluations] = useState([]);
  const [directReports, setDirectReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [form] = Form.useForm();
  const [submitForm] = Form.useForm();

  useEffect(() => {
    loadDirectReports();
    loadEvaluations();
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
      const result = await quarterlyEvaluationAPI.getEvaluations();
      if (result.success) {
        setEvaluations(result.data);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      message.error('Failed to load evaluations');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentQuarter = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    return `Q${quarter}-${year}`;
  };

  const handleGenerateEvaluation = async (values) => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.generateEvaluation(
        values.employeeId,
        values.quarter
      );

      if (result.success) {
        message.success('Quarterly evaluation generated successfully');
        setGenerateModalVisible(false);
        form.resetFields();
        loadEvaluations();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error generating evaluation:', error);
      message.error('Failed to generate evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitEvaluation = async (values) => {
    try {
      setLoading(true);
      const result = await quarterlyEvaluationAPI.submitEvaluation(
        selectedEvaluation._id,
        values.supervisorComments || ''
      );

      if (result.success) {
        message.success('Evaluation submitted to employee');
        setSubmitModalVisible(false);
        submitForm.resetFields();
        setSelectedEvaluation(null);
        loadEvaluations();
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      message.error('Failed to submit evaluation');
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#52c41a';
    if (grade.startsWith('B')) return '#1890ff';
    if (grade.startsWith('C')) return '#faad14';
    if (grade === 'D') return '#fa8c16';
    return '#f5222d';
  };

  const columns = [
    {
      title: 'Employee',
      dataIndex: ['employee', 'fullName'],
      key: 'employee',
      width: 200,
      render: (text, record) => (
        <div>
          <strong>{text}</strong>
          <br />
          <span style={{ fontSize: '12px', color: '#666' }}>
            {record.employee.position || record.employee.department}
          </span>
        </div>
      )
    },
    {
      title: 'Quarter',
      dataIndex: 'quarter',
      key: 'quarter',
      width: 100
    },
    {
      title: 'Final Score',
      dataIndex: 'finalScore',
      key: 'finalScore',
      width: 150,
      render: (score, record) => (
        <div>
          <Progress
            percent={score}
            size="small"
            strokeColor={getGradeColor(record.grade)}
          />
          <Tag
            color={getGradeColor(record.grade)}
            style={{ marginTop: '4px', fontWeight: 'bold' }}
          >
            {record.grade}
          </Tag>
        </div>
      )
    },
    {
      title: 'Performance',
      key: 'performance',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontSize: '12px', marginBottom: '4px' }}>
            <span style={{ color: '#1890ff' }}>Task: </span>
            <strong>{record.taskMetrics.taskPerformanceScore.toFixed(1)}%</strong>
          </div>
          <div style={{ fontSize: '12px' }}>
            <span style={{ color: '#52c41a' }}>Behavioral: </span>
            <strong>{record.behavioralScore.toFixed(1)}%</strong>
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
          calculated: 'processing',
          submitted: 'success',
          approved: 'cyan',
          acknowledged: 'success'
        };
        return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Generated',
      dataIndex: 'calculatedAt',
      key: 'calculatedAt',
      width: 150,
      render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => showEvaluationDetails(record)}
          >
            View Details
          </Button>
          {(record.status === 'calculated' || record.status === 'draft') && (
            <Button
              type="primary"
              size="small"
              icon={<SendOutlined />}
              onClick={() => {
                setSelectedEvaluation(record);
                setSubmitModalVisible(true);
              }}
            >
              Submit
            </Button>
          )}
        </Space>
      )
    }
  ];

  const showEvaluationDetails = (record) => {
    Modal.info({
      title: `Quarterly Evaluation - ${record.employee.fullName}`,
      width: 900,
      icon: <TrophyOutlined style={{ color: '#1890ff' }} />,
      content: (
        <div style={{ marginTop: '16px' }}>
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Statistic
                  title="Final Score"
                  value={record.finalScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: getGradeColor(record.grade) }}
                />
                <Tag
                  color={getGradeColor(record.grade)}
                  style={{ marginTop: '8px', fontSize: '16px', padding: '4px 12px' }}
                >
                  Grade: {record.grade}
                </Tag>
              </Col>
              <Col span={8}>
                <Statistic
                  title="Task Performance (70%)"
                  value={record.taskMetrics.taskPerformanceScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Behavioral (30%)"
                  value={record.behavioralScore.toFixed(1)}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>

          <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
            <Descriptions.Item label="Performance Level" span={2}>
              <Tag color={getGradeColor(record.grade)}>
                {record.performanceLevel}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Total Tasks">
              {record.taskMetrics.totalTasks}
            </Descriptions.Item>
            <Descriptions.Item label="Completed Tasks">
              {record.taskMetrics.completedTasks}
            </Descriptions.Item>
            <Descriptions.Item label="Average Task Grade" span={2}>
              {record.taskMetrics.averageCompletionGrade.toFixed(2)}/5
            </Descriptions.Item>
          </Descriptions>

          <h4>KPI Achievement Breakdown:</h4>
          {record.taskMetrics.kpiAchievement.map((kpi, index) => (
            <Card key={index} size="small" style={{ marginBottom: '8px' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <strong>{kpi.kpiTitle}</strong>
                  <br />
                  <Tag color="blue">Weight: {kpi.kpiWeight}%</Tag>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <div>Tasks: {kpi.tasksCompleted}</div>
                  <div>Avg Grade: {kpi.averageGrade.toFixed(2)}/5</div>
                  <div>Achievement: {kpi.achievedScore.toFixed(1)}%</div>
                  <strong style={{ color: '#52c41a' }}>
                    Weighted: {kpi.weightedScore.toFixed(2)}
                  </strong>
                </Col>
              </Row>
            </Card>
          ))}

          {record.supervisorComments && (
            <>
              <h4 style={{ marginTop: '16px' }}>Your Comments:</h4>
              <Alert message={record.supervisorComments} type="info" />
            </>
          )}
        </div>
      ),
      okText: 'Close'
    });
  };

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
              <BarChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              Quarterly Performance Evaluations
            </h2>
            <p style={{ color: '#666', margin: '8px 0 0 0' }}>
              Generate and manage quarterly performance evaluations for your direct reports
              {directReports.length > 0 && (
                <span style={{ color: '#1890ff', fontWeight: 500 }}>
                  {' '}({directReports.length} direct report{directReports.length !== 1 ? 's' : ''})
                </span>
              )}
            </p>
          </div>
          <Button
            type="primary"
            icon={<CalculatorOutlined />}
            onClick={() => setGenerateModalVisible(true)}
            disabled={directReports.length === 0}
          >
            Generate Evaluation
          </Button>
        </div>

        <Alert
          message="Evaluation Process"
          description={
            <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Ensure employee has approved KPIs and completed behavioral evaluation</li>
              <li>System calculates: 70% task performance (from task grades) + 30% behavioral score</li>
              <li>Review the generated evaluation and add your comments</li>
              <li>Submit evaluation to employee for acknowledgment</li>
              <li><strong>Note:</strong> You can only generate evaluations for your direct reports</li>
            </ol>
          }
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {loading && !generateModalVisible && !submitModalVisible ? (
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
            loading={loading}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            scroll={{ x: 1200 }}
          />
        )}
      </Card>

      {/* Generate Evaluation Modal */}
      <Modal
        title={
          <span>
            <CalculatorOutlined style={{ marginRight: '8px' }} />
            Generate Quarterly Evaluation
          </span>
        }
        open={generateModalVisible}
        onCancel={() => {
          setGenerateModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Alert
          message="Prerequisites"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Employee must have approved KPIs for the quarter</li>
              <li>Behavioral evaluation must be completed and submitted</li>
              <li>System will analyze all completed tasks linked to KPIs</li>
              <li>You can only evaluate your <strong>direct reports</strong></li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '16px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleGenerateEvaluation}
        >
          <Form.Item
            name="employeeId"
            label="Select Direct Report"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select
              placeholder="Select your direct report"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {directReports.map(emp => (
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
            rules={[{ required: true, message: 'Please select quarter' }]}
          >
            <Select placeholder="Select quarter">
              <Option value={getCurrentQuarter()}>{getCurrentQuarter()}</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button onClick={() => {
                setGenerateModalVisible(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Evaluation
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Submit Evaluation Modal */}
      <Modal
        title={
          <span>
            <SendOutlined style={{ marginRight: '8px' }} />
            Submit Evaluation to Employee
          </span>
        }
        open={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          submitForm.resetFields();
          setSelectedEvaluation(null);
        }}
        footer={null}
        width={700}
        destroyOnClose
      >
        {selectedEvaluation && (
          <>
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Final Score"
                    value={selectedEvaluation.finalScore.toFixed(1)}
                    suffix="%"
                  />
                  <Tag color={getGradeColor(selectedEvaluation.grade)} style={{ marginTop: '8px' }}>
                    Grade: {selectedEvaluation.grade}
                  </Tag>
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Performance Level"
                    value={selectedEvaluation.performanceLevel}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Tasks Completed"
                    value={`${selectedEvaluation.taskMetrics.completedTasks}/${selectedEvaluation.taskMetrics.totalTasks}`}
                  />
                </Col>
              </Row>
            </Card>

            <Alert
              message="Submission Notice"
              description="Once submitted, the employee will be notified and can view their evaluation. They will need to acknowledge it after review."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Form
              form={submitForm}
              layout="vertical"
              onFinish={handleSubmitEvaluation}
            >
              <Form.Item
                name="supervisorComments"
                label="Your Comments (Optional)"
              >
                <TextArea
                  rows={4}
                  placeholder="Add any final comments, feedback, or recommendations for the employee..."
                />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Space>
                  <Button onClick={() => {
                    setSubmitModalVisible(false);
                    submitForm.resetFields();
                    setSelectedEvaluation(null);
                  }}>
                    Cancel
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Submit to Employee
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedQuarterlyEvaluation;









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
//   Input,
//   message,
//   Alert,
//   Descriptions,
//   Progress,
//   Row,
//   Col,
//   Statistic,
//   Empty
// } from 'antd';
// import {
//   TrophyOutlined,
//   BarChartOutlined,
//   SendOutlined,
//   FileTextOutlined,
//   UserOutlined,
//   CalculatorOutlined
// } from '@ant-design/icons';
// import { quarterlyEvaluationAPI } from '../../services/quarterlyEvaluationAPI';
// import { useSelector } from 'react-redux';
// import dayjs from 'dayjs';

// const { TextArea } = Input;
// const { Option } = Select;

// const SupervisorQuarterlyEvaluation = () => {
//   const { user } = useSelector((state) => state.auth);
//   const [evaluations, setEvaluations] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [generateModalVisible, setGenerateModalVisible] = useState(false);
//   const [submitModalVisible, setSubmitModalVisible] = useState(false);
//   const [selectedEvaluation, setSelectedEvaluation] = useState(null);
//   const [form] = Form.useForm();
//   const [submitForm] = Form.useForm();

//   useEffect(() => {
//     loadEvaluations();
//     loadEmployees();
//   }, []);

//   const loadEvaluations = async () => {
//     try {
//       setLoading(true);
//       const result = await quarterlyEvaluationAPI.getEvaluations();
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

//   const loadEmployees = async () => {
//     try {
//       const response = await fetch('http://localhost:5001/api/auth/users', {
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`
//         }
//       });
//       const data = await response.json();
//       if (data.success) {
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

//   const handleGenerateEvaluation = async (values) => {
//     try {
//       setLoading(true);
//       const result = await quarterlyEvaluationAPI.generateEvaluation(
//         values.employeeId,
//         values.quarter
//       );

//       if (result.success) {
//         message.success('Quarterly evaluation generated successfully');
//         setGenerateModalVisible(false);
//         form.resetFields();
//         loadEvaluations();
//       } else {
//         message.error(result.message);
//       }
//     } catch (error) {
//       console.error('Error generating evaluation:', error);
//       message.error('Failed to generate evaluation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSubmitEvaluation = async (values) => {
//     try {
//       setLoading(true);
//       const result = await quarterlyEvaluationAPI.submitEvaluation(
//         selectedEvaluation._id,
//         values.supervisorComments || ''
//       );

//       if (result.success) {
//         message.success('Evaluation submitted to employee');
//         setSubmitModalVisible(false);
//         submitForm.resetFields();
//         setSelectedEvaluation(null);
//         loadEvaluations();
//       } else {
//         message.error(result.message);
//       }
//     } catch (error) {
//       console.error('Error submitting evaluation:', error);
//       message.error('Failed to submit evaluation');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getGradeColor = (grade) => {
//     if (grade.startsWith('A')) return '#52c41a';
//     if (grade.startsWith('B')) return '#1890ff';
//     if (grade.startsWith('C')) return '#faad14';
//     if (grade === 'D') return '#fa8c16';
//     return '#f5222d';
//   };

//   const columns = [
//     {
//       title: 'Employee',
//       dataIndex: ['employee', 'fullName'],
//       key: 'employee',
//       width: 200,
//       render: (text, record) => (
//         <div>
//           <strong>{text}</strong>
//           <br />
//           <span style={{ fontSize: '12px', color: '#666' }}>
//             {record.employee.department}
//           </span>
//         </div>
//       )
//     },
//     {
//       title: 'Quarter',
//       dataIndex: 'quarter',
//       key: 'quarter',
//       width: 100
//     },
//     {
//       title: 'Final Score',
//       dataIndex: 'finalScore',
//       key: 'finalScore',
//       width: 150,
//       render: (score, record) => (
//         <div>
//           <Progress
//             percent={score}
//             size="small"
//             strokeColor={getGradeColor(record.grade)}
//           />
//           <Tag
//             color={getGradeColor(record.grade)}
//             style={{ marginTop: '4px', fontWeight: 'bold' }}
//           >
//             {record.grade}
//           </Tag>
//         </div>
//       )
//     },
//     {
//       title: 'Performance',
//       key: 'performance',
//       width: 200,
//       render: (_, record) => (
//         <div>
//           <div style={{ fontSize: '12px', marginBottom: '4px' }}>
//             <span style={{ color: '#1890ff' }}>Task: </span>
//             <strong>{record.taskMetrics.taskPerformanceScore.toFixed(1)}%</strong>
//           </div>
//           <div style={{ fontSize: '12px' }}>
//             <span style={{ color: '#52c41a' }}>Behavioral: </span>
//             <strong>{record.behavioralScore.toFixed(1)}%</strong>
//           </div>
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
//           calculated: 'processing',
//           submitted: 'success',
//           approved: 'cyan',
//           acknowledged: 'success'
//         };
//         return <Tag color={colors[status] || 'default'}>{status.toUpperCase()}</Tag>;
//       }
//     },
//     {
//       title: 'Generated',
//       dataIndex: 'calculatedAt',
//       key: 'calculatedAt',
//       width: 150,
//       render: (date) => date ? dayjs(date).format('MMM DD, YYYY') : '-'
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 200,
//       render: (_, record) => (
//         <Space>
//           <Button
//             type="link"
//             icon={<FileTextOutlined />}
//             onClick={() => {
//               Modal.info({
//                 title: `Quarterly Evaluation - ${record.employee.fullName}`,
//                 width: 900,
//                 content: (
//                   <div style={{ marginTop: '16px' }}>
//                     <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
//                       <Row gutter={16}>
//                         <Col span={8}>
//                           <Statistic
//                             title="Final Score"
//                             value={record.finalScore.toFixed(1)}
//                             suffix="%"
//                             valueStyle={{ color: getGradeColor(record.grade) }}
//                           />
//                           <Tag
//                             color={getGradeColor(record.grade)}
//                             style={{ marginTop: '8px', fontSize: '16px', padding: '4px 12px' }}
//                           >
//                             Grade: {record.grade}
//                           </Tag>
//                         </Col>
//                         <Col span={8}>
//                           <Statistic
//                             title="Task Performance (70%)"
//                             value={record.taskMetrics.taskPerformanceScore.toFixed(1)}
//                             suffix="%"
//                             valueStyle={{ color: '#1890ff' }}
//                           />
//                         </Col>
//                         <Col span={8}>
//                           <Statistic
//                             title="Behavioral (30%)"
//                             value={record.behavioralScore.toFixed(1)}
//                             suffix="%"
//                             valueStyle={{ color: '#52c41a' }}
//                           />
//                         </Col>
//                       </Row>
//                     </Card>

//                     <Descriptions bordered column={2} size="small" style={{ marginBottom: '16px' }}>
//                       <Descriptions.Item label="Performance Level" span={2}>
//                         <Tag color={getGradeColor(record.grade)}>
//                           {record.performanceLevel}
//                         </Tag>
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Total Tasks">
//                         {record.taskMetrics.totalTasks}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Completed Tasks">
//                         {record.taskMetrics.completedTasks}
//                       </Descriptions.Item>
//                       <Descriptions.Item label="Average Task Grade" span={2}>
//                         {record.taskMetrics.averageCompletionGrade.toFixed(2)}/5
//                       </Descriptions.Item>
//                     </Descriptions>

//                     <h4>KPI Achievement Breakdown:</h4>
//                     {record.taskMetrics.kpiAchievement.map((kpi, index) => (
//                       <Card key={index} size="small" style={{ marginBottom: '8px' }}>
//                         <Row gutter={16}>
//                           <Col span={12}>
//                             <strong>{kpi.kpiTitle}</strong>
//                             <br />
//                             <Tag color="blue">Weight: {kpi.kpiWeight}%</Tag>
//                           </Col>
//                           <Col span={12} style={{ textAlign: 'right' }}>
//                             <div>Tasks: {kpi.tasksCompleted}</div>
//                             <div>Avg Grade: {kpi.averageGrade.toFixed(2)}/5</div>
//                             <div>Achievement: {kpi.achievedScore.toFixed(1)}%</div>
//                             <strong style={{ color: '#52c41a' }}>
//                               Weighted: {kpi.weightedScore.toFixed(2)}
//                             </strong>
//                           </Col>
//                         </Row>
//                       </Card>
//                     ))}

//                     {record.supervisorComments && (
//                       <>
//                         <h4 style={{ marginTop: '16px' }}>Your Comments:</h4>
//                         <Alert message={record.supervisorComments} type="info" />
//                       </>
//                     )}
//                   </div>
//                 )
//               });
//             }}
//           >
//             View Details
//           </Button>
//           {(record.status === 'calculated' || record.status === 'draft') && (
//             <Button
//               type="primary"
//               size="small"
//               icon={<SendOutlined />}
//               onClick={() => {
//                 setSelectedEvaluation(record);
//                 setSubmitModalVisible(true);
//               }}
//             >
//               Submit
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
//               <BarChartOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//               Quarterly Performance Evaluations
//             </h2>
//             <p style={{ color: '#666', margin: '8px 0 0 0' }}>
//               Generate and manage quarterly performance evaluations for your team
//             </p>
//           </div>
//           <Button
//             type="primary"
//             icon={<CalculatorOutlined />}
//             onClick={() => setGenerateModalVisible(true)}
//           >
//             Generate Evaluation
//           </Button>
//         </div>

//         <Alert
//           message="Evaluation Process"
//           description={
//             <ol style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li>Ensure employee has approved KPIs and completed behavioral evaluation</li>
//               <li>System calculates: 70% task performance (from task grades) + 30% behavioral score</li>
//               <li>Review the generated evaluation and add your comments</li>
//               <li>Submit evaluation to employee for acknowledgment</li>
//             </ol>
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

//       {/* Generate Evaluation Modal */}
//       <Modal
//         title={
//           <span>
//             <CalculatorOutlined style={{ marginRight: '8px' }} />
//             Generate Quarterly Evaluation
//           </span>
//         }
//         open={generateModalVisible}
//         onCancel={() => {
//           setGenerateModalVisible(false);
//           form.resetFields();
//         }}
//         footer={null}
//         width={600}
//       >
//         <Alert
//           message="Prerequisites"
//           description={
//             <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
//               <li>Employee must have approved KPIs for the quarter</li>
//               <li>Behavioral evaluation must be completed and submitted</li>
//               <li>System will analyze all completed tasks linked to KPIs</li>
//             </ul>
//           }
//           type="warning"
//           showIcon
//           style={{ marginBottom: '16px' }}
//         />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleGenerateEvaluation}
//         >
//           <Form.Item
//             name="employeeId"
//             label="Employee"
//             rules={[{ required: true, message: 'Please select an employee' }]}
//           >
//             <Select
//               placeholder="Select employee"
//               showSearch
//               optionFilterProp="children"
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
//             <Select placeholder="Select quarter">
//               <Option value={getCurrentQuarter()}>{getCurrentQuarter()}</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item style={{ marginBottom: 0 }}>
//             <Space>
//               <Button onClick={() => {
//                 setGenerateModalVisible(false);
//                 form.resetFields();
//               }}>
//                 Cancel
//               </Button>
//               <Button type="primary" htmlType="submit" loading={loading}>
//                 Generate Evaluation
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* Submit Evaluation Modal */}
//       <Modal
//         title={
//           <span>
//             <SendOutlined style={{ marginRight: '8px' }} />
//             Submit Evaluation to Employee
//           </span>
//         }
//         open={submitModalVisible}
//         onCancel={() => {
//           setSubmitModalVisible(false);
//           submitForm.resetFields();
//           setSelectedEvaluation(null);
//         }}
//         footer={null}
//         width={700}
//       >
//         {selectedEvaluation && (
//           <>
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
//               <Row gutter={16}>
//                 <Col span={8}>
//                   <Statistic
//                     title="Final Score"
//                     value={selectedEvaluation.finalScore.toFixed(1)}
//                     suffix="%"
//                   />
//                   <Tag color={getGradeColor(selectedEvaluation.grade)} style={{ marginTop: '8px' }}>
//                     Grade: {selectedEvaluation.grade}
//                   </Tag>
//                 </Col>
//                 <Col span={8}>
//                   <Statistic
//                     title="Performance Level"
//                     value={selectedEvaluation.performanceLevel}
//                   />
//                 </Col>
//                 <Col span={8}>
//                   <Statistic
//                     title="Tasks Completed"
//                     value={`${selectedEvaluation.taskMetrics.completedTasks}/${selectedEvaluation.taskMetrics.totalTasks}`}
//                   />
//                 </Col>
//               </Row>
//             </Card>

//             <Alert
//               message="Submission Notice"
//               description="Once submitted, the employee will be notified and can view their evaluation. They will need to acknowledge it after review."
//               type="info"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />

//             <Form
//               form={submitForm}
//               layout="vertical"
//               onFinish={handleSubmitEvaluation}
//             >
//               <Form.Item
//                 name="supervisorComments"
//                 label="Your Comments (Optional)"
//               >
//                 <TextArea
//                   rows={4}
//                   placeholder="Add any final comments, feedback, or recommendations for the employee..."
//                 />
//               </Form.Item>

//               <Form.Item style={{ marginBottom: 0 }}>
//                 <Space>
//                   <Button onClick={() => {
//                     setSubmitModalVisible(false);
//                     submitForm.resetFields();
//                     setSelectedEvaluation(null);
//                   }}>
//                     Cancel
//                   </Button>
//                   <Button type="primary" htmlType="submit" loading={loading}>
//                     Submit to Employee
//                   </Button>
//                 </Space>
//               </Form.Item>
//             </Form>
//           </>
//         )}
//       </Modal>
//     </div>
//   );
// };

// export default SupervisorQuarterlyEvaluation;