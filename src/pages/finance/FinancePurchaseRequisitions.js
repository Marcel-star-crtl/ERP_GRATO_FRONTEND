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
    Drawer,
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
    SettingOutlined,
    DollarOutlined,
    CalendarOutlined,
    ExportOutlined,
    ContactsOutlined,
    BarChartOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
import { projectAPI } from '../../services/projectAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

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
    const [selectedRequisition, setSelectedRequisition] = useState(null);
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
    const [editingBudgetCode, setEditingBudgetCode] = useState(null);

    useEffect(() => {
        fetchRequisitions();
        fetchStats();
        fetchBudgetCodes();
        fetchProjects();
    }, []);

    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            
            // Since there's no specific finance endpoint, use the dashboard stats endpoint
            // which contains the requisitions data
            const response = await purchaseRequisitionAPI.getDashboardStats();
            
            console.log('API Response:', response); // Debug log

            if (response.success && response.data && response.data.recent) {
                // The requisitions are in response.data.recent based on your API structure
                setRequisitions(response.data.recent);
                console.log('Set requisitions:', response.data.recent); // Debug log
                console.log('Total requisitions found:', response.data.recent.length);
            } else {
                console.warn('No recent data found in response:', response);
                message.error('No requisitions found');
                setRequisitions([]); // Set empty array to prevent undefined errors
            }
        } catch (error) {
            console.error('Error fetching finance requisitions:', error);
            message.error('Failed to fetch requisitions');
            setRequisitions([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await purchaseRequisitionAPI.getDashboardStats();
            if (response.success && response.data) {
                // Calculate finance-specific stats from the fetched data
                const financeStats = {
                    pending: response.data.summary?.pending || 0,
                    verified: response.data.summary?.approved || 0,
                    rejected: response.data.summary?.rejected || 0,
                    total: response.data.summary?.total || 0,
                    totalBudgetAllocated: response.data.finance?.totalBudgetAllocated || 0,
                    budgetUtilization: response.data.finance?.budgetUtilization || 0
                };
                setStats(financeStats);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchBudgetCodes = async () => {
        try {
            const response = await purchaseRequisitionAPI.getBudgetCodes();
            if (response.success) {
                setBudgetCodes(response.data);
            }
        } catch (error) {
            console.error('Error fetching budget codes:', error);
            // Set default budget codes if API fails
            setBudgetCodes([
                { code: 'DEPT-IT-2024', name: 'IT Department 2024', budget: 5000000, used: 1200000, active: true },
                { code: 'PROJ-OFFICE-2024', name: 'Office Supplies 2024', budget: 2000000, used: 450000, active: true },
                { code: 'EQUIP-2024', name: 'Equipment Purchase 2024', budget: 10000000, used: 3500000, active: true }
            ]);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await projectAPI.getActiveProjects();
            if (response.success) {
                setProjects(response.data);
                console.log(`Loaded ${response.data.length} active projects for budget code management`);
            } else {
                console.error('Failed to fetch projects:', response.message);
                setProjects([]);
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
            console.log('Fetching active users for budget owner selection...');
            
            const response = await fetch('http://localhost:5001/api/auth/active-users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data) {
                    setBudgetOwners(result.data);
                    console.log(`Loaded ${result.data.length} active users for budget owner selection`);
                } else {
                    console.log('No active users found for budget owner selection');
                    setBudgetOwners([]);
                }
            } else {
                console.error('Failed to fetch budget owners:', response.status);
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

            const response = await purchaseRequisitionAPI.processFinanceVerification(
                selectedRequisition._id,
                verificationData
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
            message.error(error.response?.data?.message || 'Failed to process verification');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBudgetCode = async (values) => {
        try {
            setLoading(true);
            console.log('Creating budget code with values:', values);
            
            const response = await purchaseRequisitionAPI.createBudgetCode(values);
            console.log('Budget code creation response:', response);
            
            if (response.success) {
                message.success('Budget code created successfully');
                setBudgetCodeModalVisible(false);
                budgetCodeForm.resetFields();
                fetchBudgetCodes();
            } else {
                console.error('Budget code creation failed:', response.message);
                message.error(response.message || 'Failed to create budget code');
            }
        } catch (error) {
            console.error('Budget code creation error:', error);
            message.error(error.message || 'Failed to create budget code');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudgetCode = async (values) => {
        try {
            setLoading(true);
            const response = await purchaseRequisitionAPI.updateBudgetCode(editingBudgetCode.code, values);
            
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
        
        // Fetch projects when opening the modal if not already loaded
        if (projects.length === 0) {
            fetchProjects();
        }
        
        // Fetch budget owners when opening the modal if not already loaded
        if (budgetOwners.length === 0) {
            fetchBudgetOwners();
        }
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

    const getBudgetCodeStatus = (budgetCode) => {
        const utilizationRate = (budgetCode.used / budgetCode.budget) * 100;
        if (utilizationRate >= 90) return { color: 'red', text: 'Critical' };
        if (utilizationRate >= 75) return { color: 'orange', text: 'High' };
        if (utilizationRate >= 50) return { color: 'blue', text: 'Moderate' };
        return { color: 'green', text: 'Low' };
    };

    const getFilteredRequisitions = () => {
        console.log('Filtering requisitions - Active tab:', activeTab);
        console.log('Total requisitions:', requisitions.length);
        console.log('Sample requisition status:', requisitions[0]?.status);
        console.log('Sample financeVerification:', requisitions[0]?.financeVerification);
        
        if (!Array.isArray(requisitions) || requisitions.length === 0) {
            console.log('No requisitions to filter');
            return [];
        }
        
        let filtered = [];
        
        switch (activeTab) {
            case 'pending':
                
                filtered = requisitions.filter(r => {
                    const needsFinanceVerification = 
                        r.status === 'pending_finance_verification' ||
                        (r.financeVerification?.decision === 'pending') ||
                        (r.approvalChain && 
                         r.approvalChain.some(step => 
                             step.status === 'approved' && 
                             step.approver.role.includes('Head')
                         ) &&
                         r.status !== 'pending_supply_chain_review' &&
                         r.status !== 'in_procurement' &&
                         r.status !== 'approved' &&
                         r.status !== 'rejected'
                        );
                    
                    return needsFinanceVerification;
                });
                break;
                
            case 'approved':
                filtered = requisitions.filter(r => 
                    r.status === 'pending_supply_chain_review' || 
                    r.status === 'approved' || 
                    r.status === 'in_procurement' ||
                    r.status === 'completed' ||
                    r.status === 'delivered' ||
                    r.status === 'procurement_complete' ||
                    (r.financeVerification && r.financeVerification.decision === 'approved')
                );
                break;
                
            case 'rejected':
                filtered = requisitions.filter(r => 
                    r.status === 'rejected' ||
                    r.status === 'supply_chain_rejected' ||
                    (r.financeVerification && r.financeVerification.decision === 'rejected') ||
                    (r.approvalChain && 
                     r.approvalChain.some(step => step.status === 'rejected'))
                );
                break;
                
            case 'all':
            default:
                filtered = requisitions;
                break;
        }
        
        console.log(`Filtered ${filtered.length} requisitions for tab: ${activeTab}`);
        console.log('Filtered requisitions:', filtered.map(r => ({ id: r._id, status: r.status, title: r.title })));
        return filtered;
    };

    const columns = [
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
            dataIndex: 'active',
            key: 'status',
            render: (active) => (
                <Tag color={active ? 'green' : 'red'}>
                    {active ? 'Active' : 'Inactive'}
                </Tag>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => openBudgetCodeModal(record)}
                    >
                        Edit
                    </Button>
                </Space>
            )
        }
    ];

    // Add debug info component
    const DebugInfo = () => {
        if (process.env.NODE_ENV === 'production') return null;
        
        return (
            <Card size="small" style={{ margin: '16px 0', backgroundColor: '#f6f8fa' }}>
                <Text type="secondary">
                    Debug: Total requisitions: {requisitions.length}, 
                    Active tab: {activeTab}, 
                    Filtered: {getFilteredRequisitions().length}
                </Text>
            </Card>
        );
    };

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

                    <DebugInfo />

                    <Tabs size="small" style={{ marginBottom: '16px' }} activeKey={activeTab} onChange={setActiveTab}>
                        <TabPane 
                            tab={
                                <Badge count={requisitions.filter(r => 
                                    r.status === 'pending_finance_verification' || 
                                    (r.financeVerification && r.financeVerification.decision === 'pending')
                                ).length} size="small">
                                    <span>Pending Verification</span>
                                </Badge>
                            } 
                            key="pending"
                        >
                            <Table
                                columns={columns}
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
                                locale={{ 
                                    emptyText: loading ? <Spin /> : 'No requisitions found for finance verification'
                                }}
                            />
                        </TabPane>
                        <TabPane 
                            tab={
                                <Badge count={requisitions.filter(r => 
                                    r.status === 'pending_supply_chain_review' || 
                                    r.status === 'approved' || 
                                    r.status === 'in_procurement' ||
                                    r.status === 'completed' ||
                                    (r.financeVerification && r.financeVerification.decision === 'approved')
                                ).length} size="small">
                                    <span>Approved</span>
                                </Badge>
                            } 
                            key="approved"
                        >
                            <Table
                                columns={columns}
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
                                locale={{ 
                                    emptyText: loading ? <Spin /> : 'No approved requisitions found'
                                }}
                            />
                        </TabPane>
                        <TabPane 
                            tab="Rejected" 
                            key="rejected"
                        >
                            <Table
                                columns={columns}
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
                                locale={{ 
                                    emptyText: loading ? <Spin /> : 'No rejected requisitions found'
                                }}
                            />
                        </TabPane>
                        <TabPane 
                            tab={
                                <Badge count={requisitions.length} size="small">
                                    <span>All</span>
                                </Badge>
                            } 
                            key="all"
                        >
                            <Table
                                columns={columns}
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
                                locale={{ 
                                    emptyText: loading ? <Spin /> : 'No requisitions found'
                                }}
                            />
                        </TabPane>
                    </Tabs>
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
                        rowKey="code"
                        pagination={{
                            showSizeChanger: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
                        }}
                    />
                </Card>
            )}

            {/* Modals remain the same... */}
            {/* Enhanced Budget Verification Modal */}
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
                                            {budgetCodes.filter(code => code.active).map(code => {
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

                            <Form.Item
                                name="requiresAdditionalApproval"
                                label="Additional Approvals Required"
                                help="Check if this requisition requires additional executive approval"
                            >
                                <Switch />
                            </Form.Item>

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

            {/* Budget Code Management Modal */}
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
                                help="Select existing department or active project for budget allocation"
                            >
                                <Select 
                                    placeholder="Select department or project"
                                    showSearch
                                    loading={loadingProjects}
                                    filterOption={(input, option) => {
                                        const label = option.children;
                                        if (typeof label === 'string') {
                                            return label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                                        }
                                        return false;
                                    }}
                                >
                                    <Select.OptGroup label="Departments">
                                        <Option value="IT">IT Department</Option>
                                        <Option value="Finance">Finance Department</Option>
                                        <Option value="HR">HR Department</Option>
                                        <Option value="Operations">Operations</Option>
                                        <Option value="Marketing">Marketing</Option>
                                        <Option value="Supply Chain">Supply Chain</Option>
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
                                    <Option value="departmental">Departmental Budget</Option>
                                    <Option value="project">Project Budget</Option>
                                    <Option value="capital">Capital Expenditure</Option>
                                    <Option value="operational">Operational Expense</Option>
                                    <Option value="emergency">Emergency Fund</Option>
                                    <Option value="maintenance">Maintenance & Repairs</Option>
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
                                            (user.email || '').toLowerCase().includes(input.toLowerCase()) ||
                                            (user.role || '').toLowerCase().includes(input.toLowerCase()) ||
                                            (user.department || '').toLowerCase().includes(input.toLowerCase())
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

            {/* Details Modal */}
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
                            <Descriptions.Item label="Budget Holder">
                                {selectedRequisition.budgetHolder}
                            </Descriptions.Item>
                            <Descriptions.Item label="Delivery Location">
                                {selectedRequisition.deliveryLocation}
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
                                    },
                                    {
                                        title: 'Project',
                                        dataIndex: 'projectName',
                                        key: 'project',
                                        width: 150,
                                        render: (project) => project || 'N/A'
                                    }
                                ]}
                            />
                        </Card>

                        <Row gutter={16} style={{ marginBottom: '20px' }}>
                            <Col span={12}>
                                <Card size="small" title="Purchase Justification">
                                    <Text>{selectedRequisition.justificationOfPurchase}</Text>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card size="small" title="Preferred Supplier Justification">
                                    <Text>{selectedRequisition.justificationOfPreferredSupplier || 'Not specified'}</Text>
                                </Card>
                            </Col>
                        </Row>

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

