import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Descriptions, 
  Typography, 
  Tag, 
  Divider, 
  Form, 
  Input, 
  Radio, 
  Button, 
  message,
  Modal,
  Space,
  Alert,
  Spin,
  Table,
  Row,
  Col,
  Statistic,
  Timeline,
  Empty,
  Tooltip,
  Rate
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  FlagOutlined,
  CalendarOutlined,
  UserOutlined,
  ProjectOutlined,
  FileOutlined,
  DownloadOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import { actionItemAPI } from '../../services/actionItemAPI';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const SupervisorActionItemCompletionApproval = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const result = await actionItemAPI.getActionItem(taskId);
        
        if (!result.success) {
          throw new Error(result.message || 'Task not found');
        }

        if (result.data.status !== 'Pending Completion Approval') {
          message.warning('This task is not pending completion approval');
          navigate('/supervisor/action-items');
          return;
        }

        setTask(result.data);
      } catch (error) {
        console.error('Error fetching task:', error);
        message.error(error.message || 'Failed to load task details');
        navigate('/supervisor/action-items');
      } finally {
        setLoading(false);
      }
    };
  
    fetchTask();
  }, [taskId, navigate]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await actionItemAPI.processCompletionApproval(
        taskId,
        values.decision,
        values.comments || ''
      );
      
      if (result.success) {
        message.success(`Task completion ${values.decision === 'approve' ? 'approved' : 'rejected'} successfully`);
        navigate('/supervisor/action-items');
      } else {
        throw new Error(result.message || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      message.error(error.message || 'Failed to process approval');
    } finally {
      setLoading(false);
    }
  };

  const showConfirmModal = () => {
    Modal.confirm({
      title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
      icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
      content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'reject'} the completion of this task?`,
      onOk: () => form.submit(),
      okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Reject'}`,
      cancelText: 'Cancel'
    });
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'green',
      'MEDIUM': 'blue',
      'HIGH': 'orange',
      'CRITICAL': 'red'
    };
    return colors[priority] || 'default';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Not Started': 'default',
      'In Progress': 'processing',
      'Pending Approval': 'warning',
      'Pending Completion Approval': 'cyan',
      'Completed': 'success',
      'On Hold': 'warning',
      'Rejected': 'error'
    };
    return colors[status] || 'default';
  };

  const documentsColumns = [
    {
      title: 'Document Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => (
        <Space>
          <FileOutlined />
          <Text>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size) => {
        const sizeInKB = (size / 1024).toFixed(2);
        return `${sizeInKB} KB`;
      }
    },
    {
      title: 'Uploaded',
      dataIndex: 'uploadedAt',
      key: 'uploadedAt',
      width: 150,
      render: (date) => dayjs(date).format('MMM DD, YYYY HH:mm')
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Tooltip title="Download document">
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            href={record.url}
            download
          >
            Download
          </Button>
        </Tooltip>
      )
    }
  ];

  if (loading && !task) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <Alert
        message="Task Not Found"
        description="The task you are trying to access does not exist or you don't have permission to view it."
        type="error"
        showIcon
      />
    );
  }

  const isOverdue = dayjs(task.dueDate).isBefore(dayjs(), 'day');
  const completionNotes = task.completionApproval?.notes || '';
  const documents = task.completionDocuments || [];

  return (
    <div style={{ padding: '24px' }}>
      <Card loading={loading}>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <CheckCircleOutlined /> Task Completion Approval
        </Title>

        <Alert
          message="Review Completion"
          description="The employee has submitted this task for completion. Review the submitted documents and notes, then approve or reject the completion."
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {/* Task Summary Section */}
        <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>Task Summary</Title>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Priority"
                value={<Tag color={getPriorityColor(task.priority)} icon={<FlagOutlined />}>{task.priority}</Tag>}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Progress"
                value={`${task.progress || 0}%`}
                suffix="complete"
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Current Status"
                value={<Tag color={getStatusColor(task.status)}>{task.status}</Tag>}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Statistic
                title="Due Date"
                value={dayjs(task.dueDate).format('MMM DD')}
                valueStyle={isOverdue ? { color: '#f5222d' } : {}}
                suffix={isOverdue ? ' (Overdue)' : ''}
              />
            </Col>
          </Row>
        </Card>

        {/* Task Details */}
        <Descriptions bordered column={1} style={{ marginBottom: '24px' }}>
          <Descriptions.Item label="Task ID">
            <Tag color="blue">TASK-{task._id.slice(-6).toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            <Space>
              <UserOutlined />
              <Text strong>{task.assignedTo?.fullName}</Text>
              <Text type="secondary">({task.assignedTo?.department})</Text>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Task Title">
            <Text strong>{task.title}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Description">
            <Paragraph>{task.description}</Paragraph>
          </Descriptions.Item>
          {task.projectId && (
            <Descriptions.Item label="Project">
              <Space>
                <ProjectOutlined />
                <Text>{task.projectId.name}</Text>
              </Space>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="Created">
            {dayjs(task.createdAt).format('MMMM DD, YYYY HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="Due Date">
            <Space>
              <CalendarOutlined />
              <Text type={isOverdue ? 'danger' : 'secondary'}>
                {dayjs(task.dueDate).format('MMMM DD, YYYY')}
                {isOverdue && <Tag color="red" style={{ marginLeft: '8px' }}>Overdue</Tag>}
              </Text>
            </Space>
          </Descriptions.Item>
        </Descriptions>

        <Divider />

        {/* Completion Submission Details */}
        <Card size="small" style={{ marginBottom: '24px' }}>
          <Title level={4} style={{ marginBottom: '16px' }}>
            <CheckOutlined /> Completion Submission
          </Title>

          {completionNotes && (
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Employee's Notes:</Text>
              <Paragraph style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                {completionNotes}
              </Paragraph>
            </div>
          )}

          {documents.length > 0 ? (
            <div style={{ marginBottom: '16px' }}>
              <Text strong style={{ marginBottom: '12px', display: 'block' }}>
                Submitted Documents ({documents.length}):
              </Text>
              <Table
                columns={documentsColumns}
                dataSource={documents}
                rowKey="publicId"
                pagination={false}
                size="small"
              />
            </div>
          ) : (
            <Empty description="No documents submitted" />
          )}
        </Card>

        <Divider />

        {/* Activity Log */}
        {task.activityLog && task.activityLog.length > 0 && (
          <Card size="small" style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Activity Timeline</Title>
            <Timeline>
              {task.activityLog.slice().reverse().map((entry, index) => (
                <Timeline.Item key={index}>
                  <p>
                    <Text strong>{entry.action}</Text>
                    <br />
                    <Text type="secondary">{entry.description}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {dayjs(entry.timestamp).format('MMMM DD, YYYY HH:mm')}
                    </Text>
                  </p>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        )}

        <Divider />

        {/* Approval Form */}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="decision"
            label="Your Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Radio.Group onChange={(e) => setDecision(e.target.value)}>
              <Space direction="vertical">
                <Radio.Button value="approve" style={{ color: '#52c41a', width: '100%' }}>
                  <CheckCircleOutlined /> Approve Completion (Task is complete and acceptable)
                </Radio.Button>
                <Radio.Button value="reject" style={{ color: '#ff4d4f', width: '100%' }}>
                  <CloseCircleOutlined /> Reject Completion (Send back for revision)
                </Radio.Button>
              </Space>
            </Radio.Group>
          </Form.Item>

          {decision === 'approve' && (
            <>
              <Alert
                message="Grade Required"
                description="Please assign a performance grade for this completed task (1-5 scale). This grade will contribute to the employee's quarterly evaluation."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Form.Item
                name="grade"
                label="Task Completion Grade"
                rules={[
                  { required: true, message: 'Please assign a grade' },
                  { type: 'number', min: 1, max: 5, message: 'Grade must be between 1 and 5' }
                ]}
              >
                <Rate 
                  count={5} 
                  style={{ fontSize: '32px' }}
                  tooltips={['Poor', 'Below Average', 'Average', 'Good', 'Excellent']}
                />
              </Form.Item>

              <Form.Item
                name="qualityNotes"
                label="Quality Assessment Notes (Optional)"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Provide feedback on the quality of work, what was done well, areas for improvement..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>

              <Form.Item
                name="comments"
                label="Additional Comments (Optional)"
              >
                <TextArea 
                  rows={2} 
                  placeholder="Any additional feedback..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </>
          )}

          {decision === 'reject' && (
            <>
              <Alert
                message="Rejection Effect"
                description="The task will be sent back to the employee for revision. The employee will need to resubmit with improvements or corrections."
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              <Form.Item
                name="comments"
                label="Reason for Rejection"
                rules={[
                  { required: true, message: 'Please provide a reason for rejection' },
                  { min: 10, message: 'Please provide detailed feedback (at least 10 characters)' }
                ]}
              >
                <TextArea 
                  rows={4} 
                  placeholder="Explain what needs to be revised or improved..."
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </>
          )}

          <Form.Item>
            <Space>
              <Button onClick={() => navigate('/supervisor/action-items')}>
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={showConfirmModal}
                disabled={!decision}
                loading={loading}
                icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
              >
                {decision === 'approve' ? 'Approve with Grade' : 'Reject Completion'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default SupervisorActionItemCompletionApproval;










// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { 
//   Card, 
//   Descriptions, 
//   Typography, 
//   Tag, 
//   Divider, 
//   Form, 
//   Input, 
//   Radio, 
//   Button, 
//   message,
//   Modal,
//   Space,
//   Alert,
//   Spin,
//   Progress
// } from 'antd';
// import { 
//   CheckCircleOutlined, 
//   CloseCircleOutlined,
//   ExclamationCircleOutlined,
//   FlagOutlined,
//   CalendarOutlined,
//   UserOutlined,
//   ProjectOutlined
// } from '@ant-design/icons';
// import { actionItemAPI } from '../../services/actionItemAPI';
// import { useSelector } from 'react-redux';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;

// const SupervisorActionItemCreationApproval = () => {
//   const { taskId } = useParams();
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [task, setTask] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [decision, setDecision] = useState(null);
//   const { user } = useSelector((state) => state.auth);

//   useEffect(() => {
//     const fetchTask = async () => {
//       try {
//         setLoading(true);
//         const result = await actionItemAPI.getActionItem(taskId);
        
//         if (!result.success) {
//           throw new Error(result.message || 'Task not found');
//         }

//         if (result.data.status !== 'Pending Approval') {
//           message.warning('This task is not pending approval');
//           navigate('/supervisor/action-items');
//           return;
//         }

//         setTask(result.data);
//       } catch (error) {
//         console.error('Error fetching task:', error);
//         message.error(error.message || 'Failed to load task details');
//         navigate('/supervisor/action-items');
//       } finally {
//         setLoading(false);
//       }
//     };
  
//     fetchTask();
//   }, [taskId, navigate]);

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);
//       const result = await actionItemAPI.processCreationApproval(
//         taskId,
//         values.decision,
//         values.comments || ''
//       );
      
//       if (result.success) {
//         message.success(`Task ${values.decision === 'approve' ? 'approved' : 'rejected'} successfully`);
//         navigate('/supervisor/action-items');
//       } else {
//         throw new Error(result.message || 'Failed to process approval');
//       }
//     } catch (error) {
//       console.error('Error processing approval:', error);
//       message.error(error.message || 'Failed to process approval');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const showConfirmModal = () => {
//     Modal.confirm({
//       title: `Confirm ${decision === 'approve' ? 'Approval' : 'Rejection'}`,
//       icon: decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
//       content: `Are you sure you want to ${decision === 'approve' ? 'approve' : 'reject'} this task creation?`,
//       onOk: () => form.submit(),
//       okText: `Yes, ${decision === 'approve' ? 'Approve' : 'Reject'}`,
//       cancelText: 'Cancel'
//     });
//   };

//   const getPriorityColor = (priority) => {
//     const colors = {
//       'LOW': 'green',
//       'MEDIUM': 'blue',
//       'HIGH': 'orange',
//       'CRITICAL': 'red'
//     };
//     return colors[priority] || 'default';
//   };

//   if (loading && !task) {
//     return (
//       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
//         <Spin size="large" />
//       </div>
//     );
//   }

//   if (!task) {
//     return (
//       <Alert
//         message="Task Not Found"
//         description="The task you are trying to access does not exist or you don't have permission to view it."
//         type="error"
//         showIcon
//       />
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card loading={loading}>
//         <Title level={3} style={{ marginBottom: '24px' }}>
//           <ExclamationCircleOutlined /> Task Creation Approval
//         </Title>

//         <Alert
//           message="Approval Required"
//           description="The employee needs your approval before they can start working on this task."
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         <Descriptions bordered column={1}>
//           <Descriptions.Item label="Task ID">
//             <Tag color="blue">TASK-{task._id.slice(-6).toUpperCase()}</Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Employee">
//             <Space>
//               <UserOutlined />
//               <Text strong>{task.assignedTo?.fullName}</Text>
//               <Text type="secondary">({task.assignedTo?.department})</Text>
//             </Space>
//           </Descriptions.Item>
//           <Descriptions.Item label="Task Title">
//             <Text strong>{task.title}</Text>
//           </Descriptions.Item>
//           <Descriptions.Item label="Description">
//             <Paragraph>{task.description}</Paragraph>
//           </Descriptions.Item>
//           <Descriptions.Item label="Priority">
//             <Tag color={getPriorityColor(task.priority)} icon={<FlagOutlined />}>
//               {task.priority}
//             </Tag>
//           </Descriptions.Item>
//           <Descriptions.Item label="Due Date">
//             <Space>
//               <CalendarOutlined />
//               <Text>{new Date(task.dueDate).toLocaleDateString('en-US', { 
//                 weekday: 'long', 
//                 year: 'numeric', 
//                 month: 'long', 
//                 day: 'numeric' 
//               })}</Text>
//             </Space>
//           </Descriptions.Item>
//           {task.projectId && (
//             <Descriptions.Item label="Project">
//               <Space>
//                 <ProjectOutlined />
//                 <Text>{task.projectId.name}</Text>
//               </Space>
//             </Descriptions.Item>
//           )}
//           {task.notes && (
//             <Descriptions.Item label="Additional Notes">
//               <Paragraph>{task.notes}</Paragraph>
//             </Descriptions.Item>
//           )}
//           <Descriptions.Item label="Created">
//             {new Date(task.createdAt).toLocaleString('en-GB')}
//           </Descriptions.Item>
//         </Descriptions>

//         <Divider />

//         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//           <Form.Item
//             name="decision"
//             label="Your Decision"
//             rules={[{ required: true, message: 'Please make a decision' }]}
//           >
//             <Radio.Group onChange={(e) => setDecision(e.target.value)}>
//               <Space direction="vertical">
//                 <Radio.Button value="approve" style={{ color: '#52c41a', width: '100%' }}>
//                   <CheckCircleOutlined /> Approve Task Creation (Employee can start working)
//                 </Radio.Button>
//                 <Radio.Button value="reject" style={{ color: '#ff4d4f', width: '100%' }}>
//                   <CloseCircleOutlined /> Reject Task Creation (Not appropriate/feasible)
//                 </Radio.Button>
//               </Space>
//             </Radio.Group>
//           </Form.Item>

//           {decision === 'approve' && (
//             <Alert
//               message="Approval Effect"
//               description="Once approved, the employee will be able to start working on this task immediately."
//               type="success"
//               showIcon
//               style={{ marginBottom: '16px' }}
//             />
//           )}

//           {decision === 'reject' && (
//             <>
//               <Alert
//                 message="Rejection Effect"
//                 description="The task will be rejected and the employee will be notified. They may create a new task if needed."
//                 type="warning"
//                 showIcon
//                 style={{ marginBottom: '16px' }}
//               />
//               <Form.Item
//                 name="comments"
//                 label="Reason for Rejection"
//                 rules={[
//                   { required: true, message: 'Please provide a reason for rejection' },
//                   { min: 10, message: 'Please provide a detailed reason (at least 10 characters)' }
//                 ]}
//               >
//                 <TextArea 
//                   rows={4} 
//                   placeholder="Explain why this task is not appropriate or feasible at this time..."
//                   showCount
//                   maxLength={500}
//                 />
//               </Form.Item>
//             </>
//           )}

//           {decision === 'approve' && (
//             <Form.Item
//               name="comments"
//               label="Comments (Optional)"
//             >
//               <TextArea 
//                 rows={3} 
//                 placeholder="Any additional guidance or comments for the employee..."
//                 showCount
//                 maxLength={500}
//               />
//             </Form.Item>
//           )}

//           <Form.Item>
//             <Space>
//               <Button onClick={() => navigate('/supervisor/action-items')}>
//                 Cancel
//               </Button>
//               <Button
//                 type="primary"
//                 onClick={showConfirmModal}
//                 disabled={!decision}
//                 loading={loading}
//                 icon={decision === 'approve' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
//               >
//                 {decision === 'approve' ? 'Approve Task' : 'Reject Task'}
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default SupervisorActionItemCreationApproval;