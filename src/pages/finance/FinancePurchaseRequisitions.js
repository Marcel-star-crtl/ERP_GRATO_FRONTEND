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
    Input,
    Select,
    InputNumber,
    Descriptions,
    Alert,
    Spin,
    message,
    Badge,
    Timeline,
    Row,
    Col,
    Statistic,
    Divider,
    Tooltip,
    Switch,
    Tabs,
    DatePicker,
    Progress
} from 'antd';
import {
    ClockCircleOutlined,
    FileTextOutlined,
    BankOutlined,
    TagOutlined,
    ShoppingCartOutlined,
    ReloadOutlined,
    EyeOutlined,
    AuditOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SendOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    DollarOutlined,
    CalendarOutlined,
    ContactsOutlined,
    BarChartOutlined,
    TeamOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

const FinancePurchaseRequisitions = () => {
    const [requisitions, setRequisitions] = useState([]);
    const [budgetCodes, setBudgetCodes] = useState([]);
    const [projects, setProjects] = useState([]);
    const [budgetOwners, setBudgetOwners] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [loadingBudgetOwners, setLoadingBudgetOwners] = useState(false);
    const [loading, setLoading] = useState(false);
    const [verificationModalVisible, setVerificationModalVisible] = useState(false);
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [budgetCodeModalVisible, setBudgetCodeModalVisible] = useState(false);
    const [budgetCodeApprovalModalVisible, setBudgetCodeApprovalModalVisible] = useState(false);
    const [budgetCodeDetailsModalVisible, setBudgetCodeDetailsModalVisible] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
    const [selectedBudgetCodeForApproval, setSelectedBudgetCodeForApproval] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [mainSection, setMainSection] = useState('requisitions');
    const [stats, setStats] = useState({ 
        pending: 0, 
        verified: 0, 
        rejected: 0, 
        total: 0,
        totalBudgetAllocated: 0,
        budgetUtilization: 0
    });
    const [form] = Form.useForm();
    const [budgetCodeForm] = Form.useForm();
    const [budgetCodeApprovalForm] = Form.useForm();
    const [editingBudgetCode, setEditingBudgetCode] = useState(null);

    useEffect(() => {
        fetchRequisitions();
        fetchStats();
        fetchBudgetCodes();
        fetchProjects();
    }, []);

    // const fetchRequisitions = async () => {
    //     try {
    //         setLoading(true);
    //         const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/dashboard-stats`);
            
    //         if (response.success && response.data && response.data.recent) {
    //             setRequisitions(response.data.recent);
    //         } else {
    //             setRequisitions([]);
    //         }
    //     } catch (error) {
    //         console.error('Error fetching finance requisitions:', error);
    //         message.error('Failed to fetch requisitions');
    //         setRequisitions([]);
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            // ✅ FIXED: Use the finance-specific endpoint
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance`);
            
            if (response.success && response.data) {
                console.log('Finance requisitions fetched:', response.data);
                setRequisitions(response.data);
            } else {
                setRequisitions([]);
            }
        } catch (error) {
            console.error('Error fetching finance requisitions:', error);
            message.error('Failed to fetch requisitions');
            setRequisitions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
    try {
        // ✅ FIXED: Use finance dashboard endpoint for accurate stats
        const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance/dashboard-data`);
        
        if (response.success && response.data) {
            const financeData = response.data;
            
            setStats({
                pending: financeData.statistics?.pendingVerification || 0,
                verified: financeData.statistics?.approvedThisMonth || 0,
                rejected: financeData.statistics?.rejectedThisMonth || 0,
                total: financeData.totalRequisitions || 0,
                totalBudgetAllocated: financeData.statistics?.totalValue || 0,
                budgetUtilization: response.data.finance?.overallUtilization || 0
            });
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
};

    const fetchBudgetCodes = async () => {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`);
            if (response.success) {
                setBudgetCodes(response.data);
            }
        } catch (error) {
            console.error('Error fetching budget codes:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/projects/active`);
            if (response.success) {
                setProjects(response.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    const fetchBudgetOwners = async () => {
        try {
            setLoadingBudgetOwners(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/active-users`);
            
            if (response.success && response.data) {
                setBudgetOwners(response.data);
            } else {
                setBudgetOwners([]);
            }
        } catch (error) {
            console.error('Error fetching budget owners:', error);
            setBudgetOwners([]);
        } finally {
            setLoadingBudgetOwners(false);
        }
    };

    const handleVerification = async (values) => {
        if (!selectedRequisition) return;

        try {
            setLoading(true);
            const verificationData = {
                budgetAvailable: values.budgetAvailable,
                assignedBudget: values.assignedBudget,
                budgetCode: values.budgetCode,
                budgetAllocation: values.budgetAllocation,
                costCenter: values.costCenter,
                comments: values.comments,
                decision: values.budgetAvailable ? 'approved' : 'rejected',
                expectedCompletionDate: values.expectedCompletionDate?.format('YYYY-MM-DD'),
                requiresAdditionalApproval: values.requiresAdditionalApproval
            };

            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/finance-verification`,
                {
                    method: 'POST',
                    body: JSON.stringify(verificationData)
                }
            );

            if (response.success) {
                message.success(`Budget verification ${values.budgetAvailable ? 'approved' : 'rejected'} successfully`);
                setVerificationModalVisible(false);
                setSelectedRequisition(null);
                form.resetFields();
                fetchRequisitions();
                fetchStats();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            message.error(error.message || 'Failed to process verification');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBudgetCode = async (values) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/budget-codes`,
                {
                    method: 'POST',
                    body: JSON.stringify(values)
                }
            );
            
            if (response.success) {
                message.success('Budget code created successfully and sent for approval');
                setBudgetCodeModalVisible(false);
                budgetCodeForm.resetFields();
                fetchBudgetCodes();
            } else {
                message.error(response.message || 'Failed to create budget code');
            }
        } catch (error) {
            message.error(error.message || 'Failed to create budget code');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudgetCode = async (values) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/budget-codes/${editingBudgetCode._id}`,
                {
                    method: 'PUT',
                    body: JSON.stringify(values)
                }
            );
            
            if (response.success) {
                message.success('Budget code updated successfully');
                setBudgetCodeModalVisible(false);
                budgetCodeForm.resetFields();
                setEditingBudgetCode(null);
                fetchBudgetCodes();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            message.error('Failed to update budget code');
        } finally {
            setLoading(false);
        }
    };

    const handleBudgetCodeApproval = async (values) => {
        if (!selectedBudgetCodeForApproval) return;

        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/budget-codes/${selectedBudgetCodeForApproval._id}/approve`,
                {
                    method: 'POST',
                    body: JSON.stringify({
                        decision: values.decision,
                        comments: values.comments
                    })
                }
            );

            if (response.success) {
                message.success(`Budget code ${values.decision} successfully`);
                setBudgetCodeApprovalModalVisible(false);
                setSelectedBudgetCodeForApproval(null);
                budgetCodeApprovalForm.resetFields();
                fetchBudgetCodes();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            message.error(error.message || 'Failed to process approval');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (requisition) => {
        setSelectedRequisition(requisition);
        setDetailsModalVisible(true);
    };

    const handleStartVerification = (requisition) => {
        setSelectedRequisition(requisition);
        form.setFieldsValue({
            budgetAvailable: true,
            assignedBudget: requisition.budgetXAF,
            budgetCode: '',
            costCenter: requisition.employee?.department || requisition.department,
            requiresAdditionalApproval: requisition.budgetXAF > 5000000,
            comments: ''
        });
        setVerificationModalVisible(true);
    };

    const openBudgetCodeModal = (budgetCode = null) => {
        setEditingBudgetCode(budgetCode);
        if (budgetCode) {
            budgetCodeForm.setFieldsValue(budgetCode);
        } else {
            budgetCodeForm.resetFields();
        }
        setBudgetCodeModalVisible(true);
        
        if (projects.length === 0) {
            fetchProjects();
        }
        
        if (budgetOwners.length === 0) {
            fetchBudgetOwners();
        }
    };

    const openBudgetCodeApprovalModal = (budgetCode) => {
        setSelectedBudgetCodeForApproval(budgetCode);
        budgetCodeApprovalForm.resetFields();
        setBudgetCodeApprovalModalVisible(true);
    };

    const viewBudgetCodeDetails = (budgetCode) => {
        setSelectedBudgetCode(budgetCode);
        setBudgetCodeDetailsModalVisible(true);
    };

    const getStatusTag = (status) => {
        const statusMap = {
            'pending_finance_verification': { color: 'orange', text: 'Pending Verification', icon: <ClockCircleOutlined /> },
            'pending_supply_chain_review': { color: 'blue', text: 'Finance Approved', icon: <CheckCircleOutlined /> },
            'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
            'rejected': { color: 'red', text: 'Budget Rejected', icon: <CloseCircleOutlined /> },
            'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
            'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
        };

        const config = statusMap[status] || { color: 'default', text: status, icon: null };
        return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
    };

    const getBudgetCodeStatusTag = (status) => {
        const statusMap = {
            'pending': { color: 'default', text: 'Pending' },
            'pending_departmental_head': { color: 'orange', text: 'Pending Dept Head' },
            'pending_head_of_business': { color: 'gold', text: 'Pending HOB' },
            'pending_finance': { color: 'blue', text: 'Pending Finance' },
            'active': { color: 'green', text: 'Active' },
            'rejected': { color: 'red', text: 'Rejected' },
            'suspended': { color: 'red', text: 'Suspended' },
            'expired': { color: 'default', text: 'Expired' }
        };

        const config = statusMap[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
    };

    const getBudgetCodeStatus = (budgetCode) => {
        const utilizationRate = (budgetCode.used / budgetCode.budget) * 100;
        if (utilizationRate >= 90) return { color: 'red', text: 'Critical' };
        if (utilizationRate >= 75) return { color: 'orange', text: 'High' };
        if (utilizationRate >= 50) return { color: 'blue', text: 'Moderate' };
        return { color: 'green', text: 'Low' };
    };

    const getFilteredRequisitions = () => {
    if (!Array.isArray(requisitions) || requisitions.length === 0) {
        return [];
    }
    
    let filtered = [];
    
    switch (activeTab) {
        case 'pending':
            // ✅ FIXED: Show requisitions that need finance verification
            filtered = requisitions.filter(r => {
                // Check if it's pending finance verification
                if (r.status === 'pending_finance_verification') {
                    return true;
                }
                
                // Check if finance officer is the current pending approver
                if (r.approvalChain && r.approvalChain.length > 0) {
                    const financeStep = r.approvalChain.find(step => 
                        step.approver.role.includes('Finance') && 
                        step.status === 'pending'
                    );
                    return financeStep !== undefined;
                }
                
                return false;
            });
            break;
            
        case 'approved':
            // Show requisitions where finance has approved
            filtered = requisitions.filter(r => 
                r.financeVerification?.decision === 'approved' ||
                r.status === 'pending_head_approval' ||
                r.status === 'approved' || 
                r.status === 'in_procurement' ||
                r.status === 'completed' ||
                r.status === 'delivered' ||
                r.status === 'procurement_complete'
            );
            break;
            
        case 'rejected':
            // Show requisitions rejected by finance
            filtered = requisitions.filter(r => 
                r.financeVerification?.decision === 'rejected' ||
                r.status === 'rejected'
            );
            break;
            
        case 'all':
        default:
            filtered = requisitions;
            break;
    }
    
    return filtered;
};

    const requisitionColumns = [
        {
            title: 'Requisition Details',
            key: 'requisition',
            render: (_, record) => (
                <div>
                    <Text strong>{record.title || 'No Title'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.requisitionNumber || `REQ-${record._id?.slice(-6)?.toUpperCase()}`}
                    </Text>
                    <br />
                    <Tag size="small" color="blue">{record.itemCategory || 'N/A'}</Tag>
                    {record.financeVerification?.budgetCode && (
                        <Tag size="small" color="gold">
                            <TagOutlined /> {record.financeVerification.budgetCode}
                        </Tag>
                    )}
                </div>
            ),
            width: 220
        },
        {
            title: 'Employee',
            key: 'employee',
            render: (_, record) => (
                <div>
                    <Text strong>{record.employee?.fullName || 'N/A'}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.employee?.department || record.department || 'N/A'}
                    </Text>
                </div>
            ),
            width: 150
        },
        {
            title: 'Requested Budget',
            dataIndex: 'budgetXAF',
            key: 'budget',
            render: (budget, record) => (
                <div>
                    <Text strong style={{ color: '#1890ff' }}>
                        XAF {budget ? budget.toLocaleString() : 'Not specified'}
                    </Text>
                    {record.financeVerification?.assignedBudget && (
                        <>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                                Assigned: XAF {record.financeVerification.assignedBudget.toLocaleString()}
                            </Text>
                        </>
                    )}
                </div>
            ),
            width: 120,
            sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0)
        },
        {
            title: 'Items Count',
            dataIndex: 'items',
            key: 'items',
            render: (items) => (
                <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
                    <ShoppingCartOutlined style={{ fontSize: '18px' }} />
                </Badge>
            ),
            width: 80,
            align: 'center'
        },
        {
            title: 'Priority',
            dataIndex: 'urgency',
            key: 'urgency',
            render: (urgency) => {
                const urgencyColors = {
                    'Low': 'green',
                    'Medium': 'orange',
                    'High': 'red'
                };
                return <Tag color={urgencyColors[urgency] || 'default'}>{urgency || 'N/A'}</Tag>;
            },
            width: 80
        },
        {
            title: 'Expected Date',
            dataIndex: 'expectedDate',
            key: 'expectedDate',
            render: (date) => {
                if (!date) return 'N/A';
                const expectedDate = new Date(date);
                const today = new Date();
                const daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
                
                return (
                    <div>
                        <Text>{expectedDate.toLocaleDateString('en-GB')}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                        </Text>
                    </div>
                );
            },
            width: 100,
            sorter: (a, b) => new Date(a.expectedDate) - new Date(b.expectedDate)
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
            width: 130
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="View Details">
                        <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    {(record.status === 'pending_finance_verification' || 
                      record.financeVerification?.decision === 'pending') && (
                        <Tooltip title="Verify Budget">
                            <Button
                                size="small"
                                type="primary"
                                icon={<AuditOutlined />}
                                onClick={() => handleStartVerification(record)}
                            >
                                Verify
                            </Button>
                        </Tooltip>
                    )}
                </Space>
            ),
            width: 100,
            fixed: 'right'
        }
    ];

    const budgetCodeColumns = [
        {
            title: 'Budget Code',
            dataIndex: 'code',
            key: 'code',
            render: (code, record) => (
                <div>
                    <Text strong code>{code}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
                </div>
            )
        },
        {
            title: 'Budget Allocation',
            key: 'budget',
            render: (_, record) => (
                <div>
                    <Text strong>XAF {record.budget.toLocaleString()}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                        Used: XAF {record.used.toLocaleString()}
                    </Text>
                </div>
            )
        },
        {
            title: 'Utilization',
            key: 'utilization',
            render: (_, record) => {
                const percentage = Math.round((record.used / record.budget) * 100);
                const status = getBudgetCodeStatus(record);
                return (
                    <div>
                        <Progress 
                            percent={percentage} 
                            size="small" 
                            status={status.color === 'red' ? 'exception' : status.color === 'orange' ? 'active' : 'success'}
                        />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                            {percentage}% utilized
                        </Text>
                    </div>
                );
            }
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getBudgetCodeStatusTag(status)
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => viewBudgetCodeDetails(record)}
                    >
                        View
                    </Button>
                    {record.status !== 'active' && record.status !== 'rejected' && (
                        <Button 
                            size="small" 
                            type="primary"
                            onClick={() => openBudgetCodeApprovalModal(record)}
                        >
                            Review
                        </Button>
                    )}
                    {(record.status === 'active' || record.status === 'rejected') && (
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => openBudgetCodeModal(record)}
                        >
                            Edit
                        </Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Main Navigation Buttons */}
            <div style={{ marginBottom: '24px' }}>
                <Space size="large">
                    <Button
                        type={mainSection === 'requisitions' ? 'primary' : 'default'}
                        size="large"
                        icon={<BankOutlined />}
                        onClick={() => setMainSection('requisitions')}
                    >
                        Requisition Management
                    </Button>
                    <Button
                        type={mainSection === 'budgetCodes' ? 'primary' : 'default'}
                        size="large"
                        icon={<TagOutlined />}
                        onClick={() => setMainSection('budgetCodes')}
                    >
                        Budget Code Management
                    </Button>
                </Space>
            </div>

            {/* Requisition Management Section */}
            {mainSection === 'requisitions' && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={2} style={{ margin: 0 }}>
                            <BankOutlined /> Finance - Purchase Requisition Budget Verification
                        </Title>
                        <Space>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    fetchRequisitions();
                                    fetchStats();
                                }}
                                loading={loading}
                            >
                                Refresh
                            </Button>
                            <Button
                                icon={<ContactsOutlined />}
                                onClick={() => window.open('/finance/suppliers', '_blank')}
                            >
                                Vendor Portal
                            </Button>
                        </Space>
                    </div>

                    <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Pending Verification"
                                    value={stats.pending}
                                    valueStyle={{ color: '#faad14' }}
                                    prefix={<ClockCircleOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Budget Approved"
                                    value={stats.verified}
                                    valueStyle={{ color: '#52c41a' }}
                                    prefix={<CheckCircleOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Total Budget Allocated"
                                    value={`XAF ${stats.totalBudgetAllocated.toLocaleString()}`}
                                    valueStyle={{ color: '#1890ff' }}
                                    prefix={<DollarOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Budget Utilization"
                                    value={stats.budgetUtilization}
                                    suffix="%"
                                    valueStyle={{ color: '#722ed1' }}
                                    prefix={<BarChartOutlined />}
                                />
                            </Col>
                        </Row>
                    </Card>

                    <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
                        <TabPane 
                            tab={
                                <Badge count={getFilteredRequisitions().length} size="small">
                                    <span>Pending Verification</span>
                                </Badge>
                            } 
                            key="pending"
                        />
                        <TabPane 
                            tab={
                                <Badge count={requisitions.filter(r => 
                                    r.status === 'pending_supply_chain_review' || 
                                    r.status === 'approved' || 
                                    r.status === 'in_procurement' ||
                                    r.status === 'completed'
                                ).length} size="small">
                                    <span>Approved</span>
                                </Badge>
                            } 
                            key="approved"
                        />
                        <TabPane tab="Rejected" key="rejected" />
                        <TabPane 
                            tab={
                                <Badge count={requisitions.length} size="small">
                                    <span>All</span>
                                </Badge>
                            } 
                            key="all"
                        />
                    </Tabs>

                    <Table
                        columns={requisitionColumns}
                        dataSource={getFilteredRequisitions()}
                        loading={loading}
                        rowKey="_id"
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
                        }}
                        scroll={{ x: 1200 }}
                        size="small"
                    />
                </Card>
            )}

            {/* Budget Code Management Section */}
            {mainSection === 'budgetCodes' && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={2} style={{ margin: 0 }}>
                            <TagOutlined /> Budget Code Management
                        </Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openBudgetCodeModal()}
                        >
                            Create Budget Code
                        </Button>
                    </div>

                    <Alert
                        message="Budget Code Management"
                        description="Create and manage budget codes for purchase requisitions. Track budget allocation and utilization across different departments and projects."
                        type="info"
                        showIcon
                        style={{ marginBottom: '16px' }}
                    />

                    <Table
                        columns={budgetCodeColumns}
                        dataSource={budgetCodes}
                        loading={loading}
                        rowKey="_id"
                        pagination={{
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
                        }}
                    />
                </Card>
            )}

            {/* Budget Verification Modal */}
            <Modal
                title={
                    <Space>
                        <AuditOutlined />
                        Enhanced Budget Verification - {selectedRequisition?.title}
                    </Space>
                }
                open={verificationModalVisible}
                onCancel={() => {
                    setVerificationModalVisible(false);
                    setSelectedRequisition(null);
                    form.resetFields();
                }}
                footer={null}
                width={900}
            >
                {selectedRequisition && (
                    <div>
                        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Employee">
                                    <Text strong>{selectedRequisition.employee?.fullName}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Department">
                                    <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Category">
                                    <Tag color="green">{selectedRequisition.itemCategory}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Priority">
                                    <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
                                        {selectedRequisition.urgency}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Requested Budget">
                                    <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                                        XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Expected Date">
                                    <Text>{new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}</Text>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleVerification}
                        >
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="budgetAvailable"
                                        label="Budget Available?"
                                        rules={[{ required: true, message: 'Please specify if budget is available' }]}
                                    >
                                        <Select placeholder="Select budget availability">
                                            <Option value={true}>✅ Yes - Budget Available</Option>
                                            <Option value={false}>❌ No - Budget Not Available</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="assignedBudget"
                                        label="Assigned Budget (XAF)"
                                        rules={[{ required: true, message: 'Please enter assigned budget amount' }]}
                                    >
                                        <InputNumber
                                            style={{ width: '100%' }}
                                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                            min={0}
                                            placeholder="Enter budget amount"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="budgetCode"
                                        label="Budget Code"
                                        rules={[{ required: true, message: 'Please select or create a budget code' }]}
                                    >
                                        <Select
                                            placeholder="Select budget code"
                                            dropdownRender={menu => (
                                                <div>
                                                    {menu}
                                                    <Divider style={{ margin: '4px 0' }} />
                                                    <div style={{ padding: '4px 8px', cursor: 'pointer' }} onClick={() => openBudgetCodeModal()}>
                                                        <PlusOutlined /> Create new budget code
                                                    </div>
                                                </div>
                                            )}
                                        >
                                            {budgetCodes.filter(code => code.active && code.status === 'active').map(code => {
                                                const available = code.budget - code.used;
                                                const status = getBudgetCodeStatus(code);
                                                return (
                                                    <Option key={code.code} value={code.code}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>{code.code} - {code.name}</span>
                                                            <Tag size="small" color={status.color}>
                                                                XAF {available.toLocaleString()} available
                                                            </Tag>
                                                        </div>
                                                    </Option>
                                                );
                                            })}
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="costCenter"
                                        label="Cost Center"
                                        help="Department or project this expense will be charged to"
                                    >
                                        <Input
                                            placeholder="e.g., IT Department, Project Alpha"
                                            prefix={<TeamOutlined />}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="budgetAllocation"
                                        label="Budget Allocation Type"
                                    >
                                        <Select placeholder="Select allocation type">
                                            <Option value="departmental">Departmental Budget</Option>
                                            <Option value="project">Project Budget</Option>
                                            <Option value="capital">Capital Expenditure</Option>
                                            <Option value="operational">Operational Expense</Option>
                                            <Option value="emergency">Emergency Fund</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="expectedCompletionDate"
                                        label="Expected Completion Date"
                                        help="When do you expect this purchase to be completed?"
                                    >
                                        <DatePicker
                                            style={{ width: '100%' }}
                                            placeholder="Select completion date"
                                            disabledDate={(current) => current && current < new Date()}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            {/* <Form.Item
                                name="requiresAdditionalApproval"
                                label="Additional Approvals Required"
                                valuePropName="checked"
                                help="Check if this requisition requires additional executive approval"
                            >
                                <Switch />
                            </Form.Item> */}

                            <Form.Item
                                name="comments"
                                label="Verification Comments"
                                rules={[{ required: true, message: 'Please provide verification comments' }]}
                                help="Add any relevant comments about the budget verification"
                            >
                                <TextArea
                                    rows={3}
                                    placeholder="Enter comments about budget availability, conditions, or special instructions..."
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button onClick={() => {
                                        setVerificationModalVisible(false);
                                        setSelectedRequisition(null);
                                        form.resetFields();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<SendOutlined />}
                                    >
                                        Submit Verification
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Budget Code Create/Edit Modal */}
            <Modal
                title={
                    <Space>
                        <TagOutlined />
                        {editingBudgetCode ? 'Edit Budget Code' : 'Create New Budget Code'}
                    </Space>
                }
                open={budgetCodeModalVisible}
                onCancel={() => {
                    setBudgetCodeModalVisible(false);
                    budgetCodeForm.resetFields();
                    setEditingBudgetCode(null);
                }}
                footer={null}
                width={600}
            >
                <Form
                    form={budgetCodeForm}
                    layout="vertical"
                    onFinish={editingBudgetCode ? handleUpdateBudgetCode : handleCreateBudgetCode}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="code"
                                label="Budget Code"
                                rules={[
                                    { required: true, message: 'Please enter budget code' },
                                    { pattern: /^[A-Z0-9\-_]+$/, message: 'Only uppercase letters, numbers, hyphens and underscores allowed' }
                                ]}
                                help="Use format like DEPT-IT-2024 or PROJ-ALPHA-2024"
                            >
                                <Input
                                    placeholder="e.g., DEPT-IT-2024"
                                    disabled={!!editingBudgetCode}
                                    style={{ textTransform: 'uppercase' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Budget Name"
                                rules={[{ required: true, message: 'Please enter budget name' }]}
                            >
                                <Input placeholder="e.g., IT Department 2024 Budget" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="budget"
                                label="Total Budget Allocation (XAF)"
                                rules={[{ required: true, message: 'Please enter budget amount' }]}
                            >
                                <InputNumber
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    min={0}
                                    placeholder="Enter total budget"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="department"
                                label="Department/Project"
                                rules={[{ required: true, message: 'Please select department or project' }]}
                                help="Select existing department or active project"
                            >
                                <Select 
                                    placeholder="Select department or project"
                                    showSearch
                                    loading={loadingProjects}
                                >
                                    <Select.OptGroup label="Departments">
                                        {/* <Option value="IT">IT Department</Option>
                                        <Option value="Finance">Finance Department</Option>
                                        <Option value="HR">HR Department</Option>
                                        <Option value="Operations">Operations</Option>
                                        <Option value="Marketing">Marketing</Option>
                                        <Option value="Supply Chain">Supply Chain</Option>
                                        <Option value="Facilities">Facilities</Option> */}
                                        <Option value="Technical Operations">Technical Operations</Option>
                                        <Option value="Technical Roll Out">Technical Roll Out</Option>
                                        <Option value="Technical QHSE">Technical QHSE</Option>
                                        <Option value="IT">IT Department</Option>
                                        <Option value="Finance">Finance</Option>
                                        <Option value="HR">Human Resources</Option>
                                        <Option value="Marketing">Marketing</Option>
                                        <Option value="Supply Chain">Supply Chain</Option>
                                        <Option value="Business">Business</Option>
                                        <Option value="Facilities">Facilities</Option>
                                    </Select.OptGroup>
                                    <Select.OptGroup label="Active Projects">
                                        {projects.map(project => (
                                            <Option key={`project-${project._id}`} value={`PROJECT-${project._id}`}>
                                                {project.name} ({project.department})
                                            </Option>
                                        ))}
                                    </Select.OptGroup>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="budgetType"
                                label="Budget Type"
                                rules={[{ required: true, message: 'Please select budget type' }]}
                            >
                                <Select placeholder="Select budget type">
                                    <Option value="OPEX">OPEX - Operating Expenses</Option>
                                    <Option value="CAPEX">CAPEX - Capital Expenditure</Option>
                                    <Option value="PROJECT">PROJECT - Project Budget</Option>
                                    <Option value="OPERATIONAL">OPERATIONAL - Operational</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="budgetPeriod"
                                label="Budget Period"
                                rules={[{ required: true, message: 'Please select budget period' }]}
                            >
                                <Select placeholder="Select budget period">
                                    <Option value="monthly">Monthly</Option>
                                    <Option value="quarterly">Quarterly</Option>
                                    <Option value="yearly">Yearly</Option>
                                    <Option value="project">Project Duration</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="description"
                        label="Budget Description"
                        help="Provide details about what this budget covers"
                    >
                        <TextArea
                            rows={3}
                            placeholder="Describe the purpose and scope of this budget allocation..."
                            showCount
                            maxLength={300}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="budgetOwner"
                                label="Budget Owner"
                                rules={[{ required: true, message: 'Please select budget owner' }]}
                                help="Person responsible for this budget"
                            >
                                <Select
                                    placeholder="Select budget owner"
                                    showSearch
                                    loading={loadingBudgetOwners}
                                    filterOption={(input, option) => {
                                        const user = budgetOwners.find(u => u._id === option.value);
                                        if (!user) return false;
                                        return (
                                            (user.fullName || '').toLowerCase().includes(input.toLowerCase()) ||
                                            (user.email || '').toLowerCase().includes(input.toLowerCase())
                                        );
                                    }}
                                    notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : "No users found"}
                                >
                                    {budgetOwners.map(user => (
                                        <Option key={user._id} value={user._id}>
                                            <div>
                                                <Text strong>{user.fullName}</Text>
                                                <br />
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {user.role} | {user.department}
                                                </Text>
                                            </div>
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="active"
                                label="Status"
                                valuePropName="checked"
                                initialValue={true}
                            >
                                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Space>
                            <Button onClick={() => {
                                setBudgetCodeModalVisible(false);
                                budgetCodeForm.resetFields();
                                setEditingBudgetCode(null);
                            }}>
                                Cancel
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={editingBudgetCode ? <EditOutlined /> : <PlusOutlined />}
                            >
                                {editingBudgetCode ? 'Update Budget Code' : 'Create Budget Code'}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            </Modal>

            {/* Budget Code Approval Modal */}
            <Modal
                title={
                    <Space>
                        <AuditOutlined />
                        Budget Code Approval - {selectedBudgetCodeForApproval?.code}
                    </Space>
                }
                open={budgetCodeApprovalModalVisible}
                onCancel={() => {
                    setBudgetCodeApprovalModalVisible(false);
                    setSelectedBudgetCodeForApproval(null);
                    budgetCodeApprovalForm.resetFields();
                }}
                footer={null}
                width={700}
            >
                {selectedBudgetCodeForApproval && (
                    <div>
                        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Budget Code">
                                    <Text strong code>{selectedBudgetCodeForApproval.code}</Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Name">
                                    {selectedBudgetCodeForApproval.name}
                                </Descriptions.Item>
                                <Descriptions.Item label="Budget Amount">
                                    <Text strong style={{ color: '#1890ff' }}>
                                        XAF {selectedBudgetCodeForApproval.budget?.toLocaleString()}
                                    </Text>
                                </Descriptions.Item>
                                <Descriptions.Item label="Department">
                                    <Tag color="blue">{selectedBudgetCodeForApproval.department}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Budget Type">
                                    {selectedBudgetCodeForApproval.budgetType}
                                </Descriptions.Item>
                                <Descriptions.Item label="Current Status">
                                    {getBudgetCodeStatusTag(selectedBudgetCodeForApproval.status)}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {selectedBudgetCodeForApproval.approvalChain && (
                            <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
                                <Timeline>
                                    {selectedBudgetCodeForApproval.approvalChain.map((step, index) => {
                                        const color = step.status === 'approved' ? 'green' : 
                                                     step.status === 'rejected' ? 'red' : 'gray';
                                        const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
                                                    step.status === 'rejected' ? <CloseCircleOutlined /> :
                                                    <ClockCircleOutlined />;
                                        
                                        return (
                                            <Timeline.Item key={index} color={color} dot={icon}>
                                                <Text strong>Level {step.level}: {step.approver.name}</Text>
                                                <br />
                                                <Text type="secondary">{step.approver.role}</Text>
                                                <br />
                                                <Tag color={color}>{step.status.toUpperCase()}</Tag>
                                                {step.actionDate && (
                                                    <>
                                                        <br />
                                                        <Text type="secondary">
                                                            {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
                                                        </Text>
                                                    </>
                                                )}
                                                {step.comments && (
                                                    <div style={{ marginTop: 4 }}>
                                                        <Text italic>"{step.comments}"</Text>
                                                    </div>
                                                )}
                                            </Timeline.Item>
                                        );
                                    })}
                                </Timeline>
                            </Card>
                        )}

                        <Form
                            form={budgetCodeApprovalForm}
                            layout="vertical"
                            onFinish={handleBudgetCodeApproval}
                        >
                            <Form.Item
                                name="decision"
                                label="Approval Decision"
                                rules={[{ required: true, message: 'Please select your decision' }]}
                            >
                                <Select placeholder="Select decision">
                                    <Option value="approved">✅ Approve Budget Code</Option>
                                    <Option value="rejected">❌ Reject Budget Code</Option>
                                </Select>
                            </Form.Item>

                            <Form.Item
                                name="comments"
                                label="Comments"
                                rules={[{ required: true, message: 'Please provide comments for your decision' }]}
                            >
                                <TextArea
                                    rows={4}
                                    placeholder="Enter your comments, reasons, or recommendations..."
                                    showCount
                                    maxLength={500}
                                />
                            </Form.Item>

                            <Form.Item>
                                <Space>
                                    <Button onClick={() => {
                                        setBudgetCodeApprovalModalVisible(false);
                                        setSelectedBudgetCodeForApproval(null);
                                        budgetCodeApprovalForm.resetFields();
                                    }}>
                                        Cancel
                                    </Button>
                                    <Button
                                        type="primary"
                                        htmlType="submit"
                                        loading={loading}
                                        icon={<SendOutlined />}
                                    >
                                        Submit Decision
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Budget Code Details Modal */}
            <Modal
                title={
                    <Space>
                        <TagOutlined />
                        Budget Code Details
                    </Space>
                }
                open={budgetCodeDetailsModalVisible}
                onCancel={() => {
                    setBudgetCodeDetailsModalVisible(false);
                    setSelectedBudgetCode(null);
                }}
                footer={null}
                width={800}
            >
                {selectedBudgetCode && (
                    <div>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Budget Code" span={2}>
                                <Text code strong>{selectedBudgetCode.code}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Name" span={2}>
                                {selectedBudgetCode.name}
                            </Descriptions.Item>
                            <Descriptions.Item label="Budget Amount">
                                <Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCode.budget?.toLocaleString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Used Amount">
                                <Text strong style={{ color: '#fa8c16' }}>XAF {selectedBudgetCode.used?.toLocaleString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Remaining">
                                <Text strong style={{ color: '#52c41a' }}>XAF {(selectedBudgetCode.budget - selectedBudgetCode.used).toLocaleString()}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Utilization">
                                <Progress 
                                    percent={Math.round((selectedBudgetCode.used / selectedBudgetCode.budget) * 100)} 
                                    size="small"
                                />
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                {selectedBudgetCode.department}
                            </Descriptions.Item>
                            <Descriptions.Item label="Budget Type">
                                {selectedBudgetCode.budgetType}
                            </Descriptions.Item>
                            <Descriptions.Item label="Budget Period">
                                {selectedBudgetCode.budgetPeriod}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                {getBudgetCodeStatusTag(selectedBudgetCode.status)}
                            </Descriptions.Item>
                        </Descriptions>

                        {selectedBudgetCode.description && (
                            <Card size="small" title="Description" style={{ marginTop: '20px' }}>
                                <Text>{selectedBudgetCode.description}</Text>
                            </Card>
                        )}

                        {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
                            <Card size="small" title="Approval Progress" style={{ marginTop: '20px' }}>
                                <Timeline>
                                    {selectedBudgetCode.approvalChain.map((step, index) => {
                                        const color = step.status === 'approved' ? 'green' : 
                                                     step.status === 'rejected' ? 'red' : 'gray';
                                        const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
                                                    step.status === 'rejected' ? <CloseCircleOutlined /> :
                                                    <ClockCircleOutlined />;
                                        
                                        return (
                                            <Timeline.Item key={index} color={color} dot={icon}>
                                                <Text strong>Level {step.level}: {step.approver.name}</Text>
                                                <br />
                                                <Text type="secondary">{step.approver.role}</Text>
                                                <br />
                                                <Tag color={color}>{step.status.toUpperCase()}</Tag>
                                                {step.actionDate && (
                                                    <>
                                                        <br />
                                                        <Text type="secondary">
                                                            {new Date(step.actionDate).toLocaleDateString()}
                                                        </Text>
                                                    </>
                                                )}
                                            </Timeline.Item>
                                        );
                                    })}
                                </Timeline>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>

            {/* Requisition Details Modal */}
            <Modal
                title={
                    <Space>
                        <FileTextOutlined />
                        Purchase Requisition Details
                    </Space>
                }
                open={detailsModalVisible}
                onCancel={() => {
                    setDetailsModalVisible(false);
                    setSelectedRequisition(null);
                }}
                footer={null}
                width={900}
            >
                {selectedRequisition && (
                    <div>
                        <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
                            <Descriptions.Item label="Requisition ID" span={2}>
                                <Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Title" span={2}>
                                <Text strong>{selectedRequisition.title}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Employee">
                                <Text>{selectedRequisition.employee?.fullName}</Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Department">
                                <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Category">
                                <Tag color="green">{selectedRequisition.itemCategory}</Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Priority">
                                <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
                                    {selectedRequisition.urgency}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Requested Budget">
                                <Text strong style={{ color: '#1890ff' }}>
                                    XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Expected Date">
                                {selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Status" span={2}>
                                {getStatusTag(selectedRequisition.status)}
                            </Descriptions.Item>
                        </Descriptions>

                        <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
                            <Table
                                dataSource={selectedRequisition.items || []}
                                pagination={false}
                                size="small"
                                columns={[
                                    {
                                        title: 'Description',
                                        dataIndex: 'description',
                                        key: 'description'
                                    },
                                    {
                                        title: 'Quantity',
                                        dataIndex: 'quantity',
                                        key: 'quantity',
                                        width: 100
                                    },
                                    {
                                        title: 'Unit',
                                        dataIndex: 'measuringUnit',
                                        key: 'unit',
                                        width: 100
                                    }
                                ]}
                            />
                        </Card>

                        {selectedRequisition.financeVerification && (
                            <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
                                <Descriptions column={2} size="small">
                                    <Descriptions.Item label="Budget Available">
                                        <Tag color={selectedRequisition.financeVerification.budgetAvailable ? 'green' : 'red'}>
                                            {selectedRequisition.financeVerification.budgetAvailable ? 'Yes' : 'No'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Assigned Budget">
                                        <Text strong>XAF {selectedRequisition.financeVerification.assignedBudget?.toLocaleString()}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Budget Code">
                                        <Tag color="gold">
                                            <TagOutlined /> {selectedRequisition.financeVerification.budgetCode || 'Not assigned'}
                                        </Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Cost Center">
                                        <Text>{selectedRequisition.financeVerification.costCenter || 'Not specified'}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Budget Allocation">
                                        <Tag color="blue">{selectedRequisition.financeVerification.budgetAllocation || 'Standard'}</Tag>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="Verification Date">
                                        {selectedRequisition.financeVerification.verificationDate ?
                                            new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') :
                                            'Pending'
                                        }
                                    </Descriptions.Item>
                                    {selectedRequisition.financeVerification.expectedCompletionDate && (
                                        <Descriptions.Item label="Expected Completion">
                                            <CalendarOutlined /> {new Date(selectedRequisition.financeVerification.expectedCompletionDate).toLocaleDateString('en-GB')}
                                        </Descriptions.Item>
                                    )}
                                    {selectedRequisition.financeVerification.requiresAdditionalApproval && (
                                        <Descriptions.Item label="Additional Approval">
                                            <Tag color="orange">Required</Tag>
                                        </Descriptions.Item>
                                    )}
                                    {selectedRequisition.financeVerification.comments && (
                                        <Descriptions.Item label="Comments" span={2}>
                                            <Text italic>{selectedRequisition.financeVerification.comments}</Text>
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </Card>
                        )}

                        {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
                            <Card size="small" title="Approval Progress">
                                <Timeline>
                                    {selectedRequisition.approvalChain.map((step, index) => {
                                        let color = 'gray';
                                        let icon = <ClockCircleOutlined />;
                                        
                                        if (step.status === 'approved') {
                                            color = 'green';
                                            icon = <CheckCircleOutlined />;
                                        } else if (step.status === 'rejected') {
                                            color = 'red';
                                            icon = <CloseCircleOutlined />;
                                        }

                                        return (
                                            <Timeline.Item key={index} color={color} dot={icon}>
                                                <div>
                                                    <Text strong>Level {step.level}: {step.approver.name}</Text>
                                                    <br />
                                                    <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
                                                    <br />
                                                    {step.status === 'pending' && (
                                                        <Tag color="orange">Pending Action</Tag>
                                                    )}
                                                    {step.status === 'approved' && (
                                                        <>
                                                            <Tag color="green">Approved</Tag>
                                                            <Text type="secondary">
                                                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                                                            </Text>
                                                            {step.comments && (
                                                                <div style={{ marginTop: 4 }}>
                                                                    <Text italic>"{step.comments}"</Text>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                    {step.status === 'rejected' && (
                                                        <>
                                                            <Tag color="red">Rejected</Tag>
                                                            <Text type="secondary">
                                                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
                                                            </Text>
                                                            {step.comments && (
                                                                <div style={{ marginTop: 4, color: '#ff4d4f' }}>
                                                                    <Text>Reason: "{step.comments}"</Text>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </Timeline.Item>
                                        );
                                    })}
                                </Timeline>
                            </Card>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default FinancePurchaseRequisitions;





