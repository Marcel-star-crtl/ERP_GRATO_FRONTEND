import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Form,
  Select,
  Rate,
  Input,
  Button,
  Space,
  message,
  Alert,
  Table,
  Divider,
  Statistic,
  Row,
  Col,
  Modal,
  Tag
} from 'antd';
import {
  SaveOutlined,
  SendOutlined,
  UserOutlined,
  StarOutlined
} from '@ant-design/icons';
import { behavioralEvaluationAPI } from '../../services/behavioralEvaluationAPI';
import { useSelector } from 'react-redux';

const { Option } = Select;
const { TextArea } = Input;

const BehavioralEvaluationForm = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [defaultCriteria, setDefaultCriteria] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [criteriaScores, setCriteriaScores] = useState({});
  const [existingEvaluation, setExistingEvaluation] = useState(null);

  useEffect(() => {
    loadDefaultCriteria();
    loadEmployees();
    
    // Set current quarter
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const quarter = Math.ceil(month / 3);
    setSelectedQuarter(`Q${quarter}-${year}`);
  }, []);

  const loadDefaultCriteria = async () => {
    try {
      const result = await behavioralEvaluationAPI.getDefaultCriteria();
      if (result.success) {
        setDefaultCriteria(result.data);
        
        // Initialize scores
        const initialScores = {};
        result.data.forEach(criterion => {
          initialScores[criterion.name] = { score: null, comments: '' };
        });
        setCriteriaScores(initialScores);
      }
    } catch (error) {
      console.error('Error loading criteria:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      // Fetch users in supervisor's department
      const response = await fetch('http://localhost:5001/api/auth/active-users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const filtered = result.data.filter(u => 
            u.department === user.department && 
            u.role !== 'supervisor' &&
            u._id !== user._id
          );
          setEmployees(filtered);
        }
      }
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCriterionChange = (criterionName, field, value) => {
    setCriteriaScores(prev => ({
      ...prev,
      [criterionName]: {
        ...prev[criterionName],
        [field]: value
      }
    }));
  };

  const calculateAverageScore = () => {
    const scores = Object.values(criteriaScores)
      .map(c => c.score)
      .filter(s => s !== null && s !== undefined);
    
    if (scores.length === 0) return 0;
    
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return ((sum / (scores.length * 5)) * 100).toFixed(1);
  };

  const validateForm = () => {
    if (!selectedEmployee) {
      message.error('Please select an employee');
      return false;
    }

    const filledCriteria = Object.values(criteriaScores).filter(c => c.score !== null);
    if (filledCriteria.length < 5) {
      message.error('Please evaluate at least 5 criteria');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const criteria = Object.entries(criteriaScores)
        .filter(([_, data]) => data.score !== null)
        .map(([name, data]) => ({
          name,
          score: data.score,
          comments: data.comments || ''
        }));

      const overallComments = form.getFieldValue('overallComments') || '';

      const result = await behavioralEvaluationAPI.createOrUpdateEvaluation(
        selectedEmployee,
        selectedQuarter,
        criteria,
        overallComments
      );

      if (result.success) {
        message.success('Evaluation saved successfully');
        setExistingEvaluation(result.data);
      } else {
        message.error(result.message || 'Failed to save evaluation');
      }
    } catch (error) {
      console.error('Error saving evaluation:', error);
      message.error('Failed to save evaluation');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!existingEvaluation) {
      message.error('Please save the evaluation first');
      return;
    }

    Modal.confirm({
      title: 'Submit Evaluation',
      content: 'Once submitted, this evaluation cannot be modified. The employee will be notified. Continue?',
      okText: 'Yes, Submit',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          const result = await behavioralEvaluationAPI.submitEvaluation(existingEvaluation._id);
          
          if (result.success) {
            message.success('Evaluation submitted successfully');
            navigate('/supervisor/evaluations');
          } else {
            message.error(result.message || 'Failed to submit evaluation');
          }
        } catch (error) {
          console.error('Error submitting evaluation:', error);
          message.error('Failed to submit evaluation');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const criteriaColumns = [
    {
      title: 'Criterion',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (name) => <strong>{name}</strong>
    },
    {
      title: 'Rating (1-5)',
      key: 'score',
      width: 200,
      render: (_, record) => (
        <Rate
          value={criteriaScores[record.name]?.score}
          onChange={(value) => handleCriterionChange(record.name, 'score', value)}
        />
      )
    },
    {
      title: 'Comments',
      key: 'comments',
      render: (_, record) => (
        <Input
          placeholder="Optional comments"
          value={criteriaScores[record.name]?.comments}
          onChange={(e) => handleCriterionChange(record.name, 'comments', e.target.value)}
          maxLength={500}
        />
      )
    }
  ];

  const averageScore = calculateAverageScore();

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ margin: 0 }}>
            <StarOutlined /> Behavioral Evaluation
          </h2>
          <p style={{ color: '#666', marginTop: '8px' }}>
            Evaluate employee behavior and soft skills
          </p>
        </div>

        <Alert
          message="Evaluation Guidelines"
          description={
            <ul style={{ marginBottom: 0, paddingLeft: '20px' }}>
              <li>Rate each criterion on a scale of 1-5 (1 = Needs Improvement, 5 = Outstanding)</li>
              <li>Evaluate at least 5 criteria for a complete assessment</li>
              <li>Provide specific comments to help the employee understand their performance</li>
              <li>This evaluation contributes 30% to the employee's quarterly performance score</li>
            </ul>
          }
          type="info"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                label="Select Employee"
                required
              >
                <Select
                  placeholder="Choose employee to evaluate"
                  showSearch
                  value={selectedEmployee}
                  onChange={setSelectedEmployee}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {employees.map(emp => (
                    <Option key={emp._id} value={emp._id}>
                      {emp.fullName} - {emp.position}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Quarter">
                <Select value={selectedQuarter} onChange={setSelectedQuarter}>
                  <Option value={`Q1-${new Date().getFullYear()}`}>Q1-{new Date().getFullYear()}</Option>
                  <Option value={`Q2-${new Date().getFullYear()}`}>Q2-{new Date().getFullYear()}</Option>
                  <Option value={`Q3-${new Date().getFullYear()}`}>Q3-{new Date().getFullYear()}</Option>
                  <Option value={`Q4-${new Date().getFullYear()}`}>Q4-{new Date().getFullYear()}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedEmployee && (
            <>
              <Divider />

              {/* Score Preview */}
              <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                <Row gutter={16}>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Criteria Evaluated"
                      value={Object.values(criteriaScores).filter(c => c.score !== null).length}
                      suffix={`/ ${defaultCriteria.length}`}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Average Score"
                      value={averageScore}
                      suffix="%"
                      valueStyle={{ 
                        color: averageScore >= 80 ? '#52c41a' : averageScore >= 60 ? '#faad14' : '#f5222d' 
                      }}
                    />
                  </Col>
                  <Col xs={24} sm={8}>
                    <Statistic
                      title="Contribution to Final"
                      value="30%"
                      prefix={<Tag color="blue">Behavioral</Tag>}
                    />
                  </Col>
                </Row>
              </Card>

              {/* Criteria Table */}
              <Card title="Evaluation Criteria" style={{ marginBottom: '24px' }}>
                <Table
                  columns={criteriaColumns}
                  dataSource={defaultCriteria}
                  pagination={false}
                  rowKey="name"
                  size="small"
                  bordered
                  rowClassName={(record) => 
                    criteriaScores[record.name]?.score ? 'evaluated-row' : ''
                  }
                />
              </Card>

              {/* Overall Comments */}
              <Form.Item
                name="overallComments"
                label="Overall Comments"
              >
                <TextArea
                  rows={4}
                  placeholder="Provide overall feedback on the employee's behavior and performance..."
                  showCount
                  maxLength={1000}
                />
              </Form.Item>

              {/* Action Buttons */}
              <Space>
                <Button onClick={() => navigate('/supervisor/evaluations')}>
                  Cancel
                </Button>
                <Button
                  type="default"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={loading}
                >
                  Save Draft
                </Button>
                {existingEvaluation && (
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={handleSubmit}
                    loading={loading}
                    style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Submit Evaluation
                  </Button>
                )}
              </Space>
            </>
          )}
        </Form>
      </Card>

      <style jsx>{`
        .evaluated-row {
          background-color: #f6ffed;
        }
      `}</style>
    </div>
  );
};

export default BehavioralEvaluationForm;