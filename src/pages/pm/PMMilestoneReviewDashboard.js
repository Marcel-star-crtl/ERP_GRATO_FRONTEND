import React, { useState, useEffect } from 'react';
import {
    Card,
    Table,
    Button,
    Modal,
    Form,
    Typography,
    Tag,
    Space,
    Alert,
    message,
    Progress,
    Row,
    Col,
    Statistic,
    Divider,
    Checkbox,
    InputNumber,
    Spin
} from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    ReloadOutlined,
    TrophyOutlined,
    FlagOutlined,
    ProjectOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import { kpiAPI } from '../../services/kpiAPI';

const { Title, Text } = Typography;
const { TextArea } = Form.Item;

const PMMilestoneReviewDashboard = () => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedMilestone, setSelectedMilestone] = useState(null);
    const [approvalModalVisible, setApprovalModalVisible] = useState(false);
    const [rejectionModalVisible, setRejectionModalVisible] = useState(false);
    
    const [pmKPIs, setPmKPIs] = useState(null);
    const [loadingKPIs, setLoadingKPIs] = useState(false);
    const [selectedKPIs, setSelectedKPIs] = useState([]);
    const [contributionTotal, setContributionTotal] = useState(0);
    
    const [form] = Form.useForm();
    const [rejectForm] = Form.useForm();

    useEffect(() => {
        fetchPendingProjects();
    }, []);

    const fetchPendingProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects/pm/pending-review');

            if (response.data.success) {
                setProjects(response.data.data);
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('Failed to fetch projects');
        } finally {
            setLoading(false);
        }
    };

    const openApprovalModal = async (project, milestone) => {
        setSelectedProject(project);
        setSelectedMilestone(milestone);
        form.resetFields();
        setSelectedKPIs([]);
        setContributionTotal(0);
        
        // Fetch PM's KPIs
        try {
            setLoadingKPIs(true);
            const userId = localStorage.getItem('userId');
            const result = await kpiAPI.getApprovedKPIsForLinking(userId);
            
            if (result.success && result.data && result.data.kpis.length > 0) {
                setPmKPIs(result.data);
            } else {
                setPmKPIs(null);
                message.warning('You have no approved KPIs for current quarter');
            }
        } catch (error) {
            console.error('Error:', error);
            setPmKPIs(null);
        } finally {
            setLoadingKPIs(false);
        }
        
        setApprovalModalVisible(true);
    };

    const handleKPISelection = (kpiIndex, checked) => {
        let newSelected = [...selectedKPIs];
        
        if (checked) {
            newSelected.push(kpiIndex);
        } else {
            newSelected = newSelected.filter(idx => idx !== kpiIndex);
            form.setFieldValue(`contribution_${kpiIndex}`, undefined);
        }
        
        setSelectedKPIs(newSelected);
        recalculateTotal(newSelected);
    };

    const recalculateTotal = (kpiIndices) => {
        let total = 0;
        kpiIndices.forEach(idx => {
            const value = form.getFieldValue(`contribution_${idx}`) || 0;
            total += value;
        });
        setContributionTotal(total);
    };

    const handleApproveMilestone = async (values) => {
        if (selectedKPIs.length === 0) {
            message.error('Please select at least one KPI');
            return;
        }

        if (contributionTotal !== 100) {
            message.error(`Total contribution must equal 100%. Current: ${contributionTotal}%`);
            return;
        }

        try {
            setLoading(true);

            const linkedKPIs = selectedKPIs.map(kpiIndex => ({
                kpiDocId: pmKPIs._id,
                kpiIndex,
                contributionWeight: values[`contribution_${kpiIndex}`]
            }));

            const response = await api.post(
                `/projects/${selectedProject._id}/milestones/${selectedMilestone._id}/pm-approve`,
                { linkedKPIs }
            );

            if (response.data.success) {
                message.success('Milestone approved and assigned to supervisor!');
                setApprovalModalVisible(false);
                setSelectedProject(null);
                setSelectedMilestone(null);
                setPmKPIs(null);
                fetchPendingProjects();
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            message.error(error.response?.data?.message || 'Failed to approve milestone');
        } finally {
            setLoading(false);
        }
    };

    const openRejectionModal = (project, milestone) => {
        setSelectedProject(project);
        setSelectedMilestone(milestone);
        rejectForm.resetFields();
        setRejectionModalVisible(true);
    };

    const handleRejectMilestone = async (values) => {
        try {
            setLoading(true);

            const response = await api.post(
                `/projects/${selectedProject._id}/milestones/${selectedMilestone._id}/pm-reject`,
                { reason: values.reason }
            );

            if (response.data.success) {
                message.success('Milestone rejected');
                setRejectionModalVisible(false);
                setSelectedProject(null);
                setSelectedMilestone(null);
                fetchPendingProjects();
            } else {
                message.error(response.data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            message.error('Failed to reject milestone');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Project',
            key: 'project',
            render: (_, record) => (
                <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Tag color="blue">{record.code}</Tag>
                </div>
            )
        },
        {
            title: 'Pending Milestones',
            dataIndex: 'pendingCount',
            key: 'pendingCount',
            render: (count) => <Tag color="orange">{count} pending</Tag>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Button type="primary" onClick={() => expandProject(record)}>
                    Review Milestones
                </Button>
            )
        }
    ];

    const expandProject = (project) => {
        // Show milestones in expandable section
    };

    return (
        <div style={{ padding: '24px' }}>
            <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                    <Title level={2} style={{ margin: 0 }}>
                        <ProjectOutlined /> Milestone Review (Project Manager)
                    </Title>
                    <Button icon={<ReloadOutlined />} onClick={fetchPendingProjects} loading={loading}>
                        Refresh
                    </Button>
                </div>

                <Alert
                    message="Your Action Required"
                    description="Review and link your KPIs to project milestones before they are assigned to supervisors."
                    type="info"
                    showIcon
                    style={{ marginBottom: 24 }}
                />

                {loading && projects.length === 0 ? (
                    <Spin />
                ) : projects.length === 0 ? (
                    <Alert message="No milestones pending review" type="success" showIcon />
                ) : (
                    projects.map(project => (
                        <Card key={project._id} style={{ marginBottom: 16 }}>
                            <Row justify="space-between">
                                <Col>
                                    <Title level={4}>{project.name}</Title>
                                    <Tag color="blue">{project.code}</Tag>
                                </Col>
                                <Col>
                                    <Statistic
                                        title="Pending Milestones"
                                        value={project.pendingCount}
                                        prefix={<FlagOutlined />}
                                    />
                                </Col>
                            </Row>
                            <Divider />
                            {project.milestones.map(milestone => (
                                <Card key={milestone._id} size="small" style={{ marginBottom: 12 }}>
                                    <Row justify="space-between" align="middle">
                                        <Col span={12}>
                                            <Text strong>{milestone.title}</Text>
                                            <br />
                                            <Text type="secondary">{milestone.description}</Text>
                                        </Col>
                                        <Col span={4}>
                                            <Tag color="blue">Weight: {milestone.weight}%</Tag>
                                        </Col>
                                        <Col span={8} style={{ textAlign: 'right' }}>
                                            <Space>
                                                <Button
                                                    type="primary"
                                                    icon={<CheckCircleOutlined />}
                                                    onClick={() => openApprovalModal(project, milestone)}
                                                >
                                                    Approve & Link KPIs
                                                </Button>
                                                <Button
                                                    danger
                                                    icon={<CloseCircleOutlined />}
                                                    onClick={() => openRejectionModal(project, milestone)}
                                                >
                                                    Reject
                                                </Button>
                                            </Space>
                                        </Col>
                                    </Row>
                                </Card>
                            ))}
                        </Card>
                    ))
                )}
            </Card>

            {/* Approval Modal with KPI Linking */}
            <Modal
                title="Approve Milestone & Link Your KPIs"
                open={approvalModalVisible}
                onCancel={() => setApprovalModalVisible(false)}
                footer={null}
                width={800}
            >
                {selectedMilestone && (
                    <>
                        <Alert
                            message="Link Milestone to Your KPIs"
                            description="Select which of your KPIs this milestone contributes to. Total must equal 100%."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        <Card size="small" style={{ marginBottom: 16 }}>
                            <Text strong>Milestone: </Text>
                            <Text>{selectedMilestone.title}</Text>
                            <br />
                            <Text strong>Weight: </Text>
                            <Tag color="blue">{selectedMilestone.weight}%</Tag>
                        </Card>

                        {loadingKPIs ? (
                            <Spin />
                        ) : !pmKPIs ? (
                            <Alert message="No approved KPIs" type="warning" />
                        ) : (
                            <Form form={form} onFinish={handleApproveMilestone} layout="vertical">
                                {pmKPIs.kpis.map((kpi, index) => (
                                    <Card key={index} size="small" style={{ marginBottom: 12 }}>
                                        <Row gutter={16}>
                                            <Col span={14}>
                                                <Checkbox
                                                    checked={selectedKPIs.includes(index)}
                                                    onChange={(e) => handleKPISelection(index, e.target.checked)}
                                                >
                                                    <Space direction="vertical" size={0}>
                                                        <Text strong>{kpi.title}</Text>
                                                        <Text type="secondary" style={{ fontSize: '12px' }}>
                                                            {kpi.description.substring(0, 80)}...
                                                        </Text>
                                                        <Tag color="blue">Weight: {kpi.weight}%</Tag>
                                                    </Space>
                                                </Checkbox>
                                            </Col>
                                            <Col span={10}>
                                                {selectedKPIs.includes(index) && (
                                                    <Form.Item
                                                        name={`contribution_${index}`}
                                                        label="Contribution %"
                                                        rules={[{ required: true }]}
                                                        style={{ marginBottom: 0 }}
                                                    >
                                                        <InputNumber
                                                            min={1}
                                                            max={100}
                                                            style={{ width: '100%' }}
                                                            onChange={() => recalculateTotal(selectedKPIs)}
                                                        />
                                                    </Form.Item>
                                                )}
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}

                                {selectedKPIs.length > 0 && (
                                    <Card size="small" style={{ 
                                        backgroundColor: contributionTotal === 100 ? '#f6ffed' : '#fff2e8',
                                        marginBottom: 16
                                    }}>
                                        <Row justify="space-between">
                                            <Text strong>Total Contribution:</Text>
                                            <Tag color={contributionTotal === 100 ? 'success' : 'warning'}>
                                                {contributionTotal}%
                                            </Tag>
                                        </Row>
                                    </Card>
                                )}

                                <Form.Item>
                                    <Space>
                                        <Button onClick={() => setApprovalModalVisible(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="primary" htmlType="submit" loading={loading}>
                                            Approve Milestone
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        )}
                    </>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal
                title="Reject Milestone"
                open={rejectionModalVisible}
                onCancel={() => setRejectionModalVisible(false)}
                footer={null}
            >
                <Form form={rejectForm} onFinish={handleRejectMilestone} layout="vertical">
                    <Form.Item
                        name="reason"
                        label="Rejection Reason"
                        rules={[{ required: true, message: 'Please provide a reason' }]}
                    >
                        <TextArea rows={4} placeholder="Explain why this milestone is being rejected..." />
                    </Form.Item>
                    <Form.Item>
                        <Space>
                            <Button onClick={() => setRejectionModalVisible(false)}>
                                Cancel
                            </Button>
                            <Button type="primary" danger htmlType="submit" loading={loading}>
                                Reject Milestone
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PMMilestoneReviewDashboard;