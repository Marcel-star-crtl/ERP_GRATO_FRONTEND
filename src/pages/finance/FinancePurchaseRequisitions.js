import React, { useState, useEffect, useMemo } from 'react';
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
    Progress,
    List,
    Drawer,
    Slider
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
    TeamOutlined,
    WarningOutlined,
    InfoCircleOutlined,
    PaperClipOutlined,
    DownloadOutlined,
    FilePdfOutlined,
    FileImageOutlined,
    FileWordOutlined,
    FileExcelOutlined,
    FileUnknownOutlined,
    SearchOutlined,
    FilterOutlined,
    SortAscendingOutlined,
    SortDescendingOutlined,
    ClearOutlined,
    FilterFilled
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
import AttachmentDisplay from '../../components/AttachmentDisplay';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
  const config = { ...options, headers: { ...defaultHeaders, ...options.headers } };
  const response = await fetch(url, config);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

// ─── Search & Filter Bar Component ───────────────────────────────────────────
const SearchFilterBar = ({ filters, onFiltersChange, onClear, totalCount, filteredCount }) => {
    const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
    const hasActiveFilters = filters.search || filters.department || filters.urgency ||
        filters.category || filters.dateRange || filters.budgetMin || filters.budgetMax;

    return (
        <div style={{ marginBottom: '16px' }}>
            <Row gutter={[12, 12]} align="middle">
                {/* Search */}
                <Col flex="1" style={{ minWidth: 220 }}>
                    <Input
                        allowClear
                        prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                        placeholder="Search by title, employee, requisition #..."
                        value={filters.search}
                        onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
                        style={{ borderRadius: 8 }}
                    />
                </Col>

                {/* Quick Filters */}
                <Col>
                    <Select
                        allowClear
                        placeholder="Department"
                        value={filters.department || undefined}
                        onChange={val => onFiltersChange({ ...filters, department: val })}
                        style={{ width: 170 }}
                    >
                        {['Technical Operations','Technical Roll Out','Technical QHSE','IT','Finance','HR','Marketing','Supply Chain','Business','Facilities'].map(d => (
                            <Option key={d} value={d}>{d}</Option>
                        ))}
                    </Select>
                </Col>
                <Col>
                    <Select
                        allowClear
                        placeholder="Priority"
                        value={filters.urgency || undefined}
                        onChange={val => onFiltersChange({ ...filters, urgency: val })}
                        style={{ width: 120 }}
                    >
                        <Option value="High"><Tag color="red">High</Tag></Option>
                        <Option value="Medium"><Tag color="orange">Medium</Tag></Option>
                        <Option value="Low"><Tag color="green">Low</Tag></Option>
                    </Select>
                </Col>
                <Col>
                    <Select
                        allowClear
                        placeholder="Category"
                        value={filters.category || undefined}
                        onChange={val => onFiltersChange({ ...filters, category: val })}
                        style={{ width: 160 }}
                    >
                        {['IT Equipment','Office Supplies','Maintenance','Services','Travel','Training','Other'].map(c => (
                            <Option key={c} value={c}>{c}</Option>
                        ))}
                    </Select>
                </Col>

                {/* Advanced Filter Toggle */}
                <Col>
                    <Tooltip title="Advanced Filters">
                        <Button
                            icon={hasActiveFilters ? <FilterFilled style={{ color: '#1890ff' }} /> : <FilterOutlined />}
                            onClick={() => setFilterDrawerOpen(true)}
                            style={{
                                borderColor: hasActiveFilters ? '#1890ff' : undefined,
                                color: hasActiveFilters ? '#1890ff' : undefined
                            }}
                        >
                            Filters {hasActiveFilters && <Badge dot style={{ marginLeft: 4 }} />}
                        </Button>
                    </Tooltip>
                </Col>

                {/* Clear All */}
                {hasActiveFilters && (
                    <Col>
                        <Button icon={<ClearOutlined />} onClick={onClear} type="link" danger>
                            Clear All
                        </Button>
                    </Col>
                )}

                {/* Result count */}
                <Col>
                    <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                        {filteredCount !== totalCount
                            ? <><Text strong style={{ color: '#1890ff' }}>{filteredCount}</Text> of {totalCount}</>
                            : <>{totalCount}</>
                        } results
                    </Text>
                </Col>
            </Row>

            {/* Advanced Filter Drawer */}
            <Drawer
                title={
                    <Space>
                        <FilterOutlined />
                        <Text strong>Advanced Filters</Text>
                    </Space>
                }
                placement="right"
                width={360}
                open={filterDrawerOpen}
                onClose={() => setFilterDrawerOpen(false)}
                extra={
                    <Button size="small" onClick={onClear} icon={<ClearOutlined />}>
                        Reset All
                    </Button>
                }
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            <CalendarOutlined /> Expected Date Range
                        </Text>
                        <RangePicker
                            style={{ width: '100%' }}
                            value={filters.dateRange}
                            onChange={val => onFiltersChange({ ...filters, dateRange: val })}
                            format="DD/MM/YYYY"
                        />
                    </div>

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            <DollarOutlined /> Budget Range (XAF)
                        </Text>
                        <Row gutter={8}>
                            <Col span={12}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Min"
                                    min={0}
                                    value={filters.budgetMin}
                                    formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                    parser={v => v.replace(/,/g, '')}
                                    onChange={val => onFiltersChange({ ...filters, budgetMin: val })}
                                />
                            </Col>
                            <Col span={12}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Max"
                                    min={0}
                                    value={filters.budgetMax}
                                    formatter={v => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
                                    parser={v => v.replace(/,/g, '')}
                                    onChange={val => onFiltersChange({ ...filters, budgetMax: val })}
                                />
                            </Col>
                        </Row>
                    </div>

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Sort By
                        </Text>
                        <Select
                            style={{ width: '100%' }}
                            value={filters.sortBy}
                            onChange={val => onFiltersChange({ ...filters, sortBy: val })}
                        >
                            <Option value="createdAt_desc">Newest First</Option>
                            <Option value="createdAt_asc">Oldest First</Option>
                            <Option value="budgetXAF_desc">Budget: High → Low</Option>
                            <Option value="budgetXAF_asc">Budget: Low → High</Option>
                            <Option value="expectedDate_asc">Expected Date: Soonest</Option>
                            <Option value="expectedDate_desc">Expected Date: Latest</Option>
                            <Option value="urgency_desc">Priority: High → Low</Option>
                            <Option value="title_asc">Title: A → Z</Option>
                        </Select>
                    </div>

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Disbursement Status
                        </Text>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Any disbursement status"
                            value={filters.disbursementStatus || undefined}
                            onChange={val => onFiltersChange({ ...filters, disbursementStatus: val })}
                        >
                            <Option value="not_started">Not Started</Option>
                            <Option value="partial">Partially Disbursed</Option>
                            <Option value="full">Fully Disbursed</Option>
                        </Select>
                    </div>

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>
                            Items Count
                        </Text>
                        <Row gutter={8}>
                            <Col span={12}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Min items"
                                    min={0}
                                    value={filters.itemsMin}
                                    onChange={val => onFiltersChange({ ...filters, itemsMin: val })}
                                />
                            </Col>
                            <Col span={12}>
                                <InputNumber
                                    style={{ width: '100%' }}
                                    placeholder="Max items"
                                    min={0}
                                    value={filters.itemsMax}
                                    onChange={val => onFiltersChange({ ...filters, itemsMax: val })}
                                />
                            </Col>
                        </Row>
                    </div>

                    <Button
                        type="primary"
                        block
                        onClick={() => setFilterDrawerOpen(false)}
                    >
                        Apply Filters
                    </Button>
                </Space>
            </Drawer>
        </div>
    );
};

// ─── Active Filter Tags ───────────────────────────────────────────────────────
const ActiveFilterTags = ({ filters, onFiltersChange }) => {
    const tags = [];
    if (filters.search) tags.push({ key: 'search', label: `Search: "${filters.search}"`, clear: () => onFiltersChange({ ...filters, search: '' }) });
    if (filters.department) tags.push({ key: 'dept', label: `Dept: ${filters.department}`, clear: () => onFiltersChange({ ...filters, department: null }) });
    if (filters.urgency) tags.push({ key: 'urgency', label: `Priority: ${filters.urgency}`, clear: () => onFiltersChange({ ...filters, urgency: null }) });
    if (filters.category) tags.push({ key: 'cat', label: `Category: ${filters.category}`, clear: () => onFiltersChange({ ...filters, category: null }) });
    if (filters.dateRange) tags.push({ key: 'date', label: `Date: ${filters.dateRange[0]?.format('DD/MM/YY')} – ${filters.dateRange[1]?.format('DD/MM/YY')}`, clear: () => onFiltersChange({ ...filters, dateRange: null }) });
    if (filters.budgetMin || filters.budgetMax) tags.push({ key: 'budget', label: `Budget: ${filters.budgetMin ? 'XAF ' + filters.budgetMin.toLocaleString() : '0'} – ${filters.budgetMax ? 'XAF ' + filters.budgetMax.toLocaleString() : '∞'}`, clear: () => onFiltersChange({ ...filters, budgetMin: null, budgetMax: null }) });
    if (filters.disbursementStatus) tags.push({ key: 'disb', label: `Disbursement: ${filters.disbursementStatus}`, clear: () => onFiltersChange({ ...filters, disbursementStatus: null }) });

    if (tags.length === 0) return null;

    return (
        <div style={{ marginBottom: 12 }}>
            <Space wrap>
                <Text type="secondary" style={{ fontSize: 12 }}>Active filters:</Text>
                {tags.map(t => (
                    <Tag
                        key={t.key}
                        closable
                        onClose={t.clear}
                        color="blue"
                        style={{ borderRadius: 12 }}
                    >
                        {t.label}
                    </Tag>
                ))}
            </Space>
        </div>
    );
};

// ─── Default filters ──────────────────────────────────────────────────────────
const DEFAULT_FILTERS = {
    search: '',
    department: null,
    urgency: null,
    category: null,
    dateRange: null,
    budgetMin: null,
    budgetMax: null,
    disbursementStatus: null,
    itemsMin: null,
    itemsMax: null,
    sortBy: 'createdAt_desc',
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
    const [disbursementModalVisible, setDisbursementModalVisible] = useState(false);
    const [budgetCodeModalVisible, setBudgetCodeModalVisible] = useState(false);
    const [budgetCodeApprovalModalVisible, setBudgetCodeApprovalModalVisible] = useState(false);
    const [budgetCodeDetailsModalVisible, setBudgetCodeDetailsModalVisible] = useState(false);
    const [selectedRequisition, setSelectedRequisition] = useState(null);
    const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
    const [selectedBudgetCodeForApproval, setSelectedBudgetCodeForApproval] = useState(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [mainSection, setMainSection] = useState('requisitions');
    const [disbursementAmount, setDisbursementAmount] = useState(0);
    const [downloadingAttachment, setDownloadingAttachment] = useState(null);
    const [acknowledgmentModalVisible, setAcknowledgmentModalVisible] = useState(false);
    const [selectedDisbursement, setSelectedDisbursement] = useState(null);
    const [acknowledgmentForm] = Form.useForm();

    // ── NEW: Search & Filter state ──────────────────────────────────────────
    const [filters, setFilters] = useState(DEFAULT_FILTERS);

    const [stats, setStats] = useState({
        pending: 0,
        verified: 0,
        rejected: 0,
        total: 0,
        totalBudgetAllocated: 0,
        budgetUtilization: 0,
        pendingDisbursement: 0,
        partiallyDisbursed: 0
    });
    const [form] = Form.useForm();
    const [disbursementForm] = Form.useForm();
    const [budgetCodeForm] = Form.useForm();
    const [budgetCodeApprovalForm] = Form.useForm();
    const [editingBudgetCode, setEditingBudgetCode] = useState(null);

    useEffect(() => {
        fetchRequisitions();
        fetchStats();
        fetchBudgetCodes();
        fetchProjects();
    }, []);

    useEffect(() => {
        if (activeTab === 'disbursement' || activeTab === 'fully_disbursed') {
            fetchRequisitions();
        }
    }, [activeTab]);

    // ── Reset filters when switching tabs ──────────────────────────────────
    const handleTabChange = (key) => {
        setActiveTab(key);
        setFilters(DEFAULT_FILTERS);
    };

    const fetchRequisitions = async () => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance`);
            if (response.success && response.data) {
                setRequisitions(response.data);
            } else {
                setRequisitions([]);
            }
        } catch (error) {
            message.error('Failed to fetch requisitions');
            setRequisitions([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance/dashboard-data`);
            if (response.success && response.data) {
                const financeData = response.data;
                setStats({
                    pending: financeData.statistics?.pendingVerification || 0,
                    verified: financeData.statistics?.approvedThisMonth || 0,
                    rejected: financeData.statistics?.rejectedThisMonth || 0,
                    total: financeData.totalRequisitions || 0,
                    totalBudgetAllocated: financeData.statistics?.totalValue || 0,
                    budgetUtilization: response.data.finance?.overallUtilization || 0,
                    pendingDisbursement: financeData.statistics?.pendingDisbursement || 0,
                    partiallyDisbursed: financeData.statistics?.partiallyDisbursed || 0
                });
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchBudgetCodes = async () => {
        try {
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`);
            if (response.success) setBudgetCodes(response.data);
        } catch (error) {
            console.error('Error fetching budget codes:', error);
        }
    };

    const fetchProjects = async () => {
        try {
            setLoadingProjects(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/projects/active`);
            if (response.success) setProjects(response.data);
        } catch (error) {
            setProjects([]);
        } finally {
            setLoadingProjects(false);
        }
    };

    // ── Tab counts ──────────────────────────────────────────────────────────
    const pendingCount = requisitions.filter(r => r.isAwaitingFinance || r.status === 'pending_finance_verification').length;
    const approvedCount = requisitions.filter(r => r.financeVerification?.decision === 'approved' || r.financeHasActed === true).length;
    const disbursementCount = requisitions.filter(r => r.status === 'approved' || r.status === 'partially_disbursed').length;
    const rejectedCount = requisitions.filter(r => r.financeVerification?.decision === 'rejected' || r.financeApprovalStep?.status === 'rejected').length;
    const fullyDisbursedCount = requisitions.filter(r => r.status === 'fully_disbursed').length;

    // ── Get tab-filtered requisitions ───────────────────────────────────────
    const getTabFilteredRequisitions = () => {
        if (!Array.isArray(requisitions) || requisitions.length === 0) return [];
        switch (activeTab) {
            case 'pending':
                return requisitions.filter(r => r.isAwaitingFinance || r.status === 'pending_finance_verification');
            case 'approved':
                return requisitions.filter(r =>
                    r.financeVerification?.decision === 'approved' || r.financeHasActed === true ||
                    ['pending_supply_chain_review','pending_head_approval','approved','in_procurement',
                     'completed','delivered','procurement_complete','partially_disbursed','fully_disbursed'].includes(r.status)
                );
            case 'disbursement':
                return requisitions.filter(r => r.status === 'approved' || r.status === 'partially_disbursed');
            case 'fully_disbursed':
                return requisitions.filter(r => r.status === 'fully_disbursed');
            case 'rejected':
                return requisitions.filter(r =>
                    r.financeVerification?.decision === 'rejected' || r.financeApprovalStep?.status === 'rejected'
                );
            default:
                return requisitions;
        }
    };

    // ── Apply search + filter + sort on top of tab filter ──────────────────
    const getFilteredRequisitions = useMemo(() => {
        let data = getTabFilteredRequisitions();

        // Text search
        if (filters.search) {
            const q = filters.search.toLowerCase();
            data = data.filter(r =>
                (r.title || '').toLowerCase().includes(q) ||
                (r.requisitionNumber || '').toLowerCase().includes(q) ||
                (r.employee?.fullName || '').toLowerCase().includes(q) ||
                (r.employee?.department || r.department || '').toLowerCase().includes(q) ||
                (r.itemCategory || '').toLowerCase().includes(q) ||
                (r.budgetCodeInfo?.code || '').toLowerCase().includes(q)
            );
        }

        // Department filter
        if (filters.department) {
            data = data.filter(r =>
                (r.employee?.department || r.department || '') === filters.department
            );
        }

        // Urgency filter
        if (filters.urgency) {
            data = data.filter(r => r.urgency === filters.urgency);
        }

        // Category filter
        if (filters.category) {
            data = data.filter(r => r.itemCategory === filters.category);
        }

        // Date range filter
        if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
            const start = filters.dateRange[0].startOf('day').toDate();
            const end = filters.dateRange[1].endOf('day').toDate();
            data = data.filter(r => {
                if (!r.expectedDate) return false;
                const d = new Date(r.expectedDate);
                return d >= start && d <= end;
            });
        }

        // Budget range
        if (filters.budgetMin != null) {
            data = data.filter(r => (r.budgetXAF || 0) >= filters.budgetMin);
        }
        if (filters.budgetMax != null) {
            data = data.filter(r => (r.budgetXAF || 0) <= filters.budgetMax);
        }

        // Disbursement status
        if (filters.disbursementStatus) {
            data = data.filter(r => {
                const total = r.budgetXAF || 0;
                const disbursed = r.totalDisbursed || 0;
                if (filters.disbursementStatus === 'not_started') return disbursed === 0;
                if (filters.disbursementStatus === 'partial') return disbursed > 0 && disbursed < total;
                if (filters.disbursementStatus === 'full') return disbursed >= total && total > 0;
                return true;
            });
        }

        // Items count range
        if (filters.itemsMin != null) {
            data = data.filter(r => (r.items?.length || 0) >= filters.itemsMin);
        }
        if (filters.itemsMax != null) {
            data = data.filter(r => (r.items?.length || 0) <= filters.itemsMax);
        }

        // Sorting
        const urgencyOrder = { High: 3, Medium: 2, Low: 1 };
        const [sortField, sortDir] = (filters.sortBy || 'createdAt_desc').split('_');
        const dir = sortDir === 'asc' ? 1 : -1;

        data = [...data].sort((a, b) => {
            switch (sortField) {
                case 'createdAt': return dir * (new Date(a.createdAt) - new Date(b.createdAt));
                case 'budgetXAF': return dir * ((a.budgetXAF || 0) - (b.budgetXAF || 0));
                case 'expectedDate': return dir * (new Date(a.expectedDate || 0) - new Date(b.expectedDate || 0));
                case 'urgency': return dir * ((urgencyOrder[a.urgency] || 0) - (urgencyOrder[b.urgency] || 0));
                case 'title': return dir * (a.title || '').localeCompare(b.title || '');
                default: return 0;
            }
        });

        return data;
    }, [requisitions, activeTab, filters]);

    const fetchBudgetOwners = async () => {
        try {
            setLoadingBudgetOwners(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/active-users`);
            if (response.success && response.data) setBudgetOwners(response.data);
            else setBudgetOwners([]);
        } catch (error) {
            setBudgetOwners([]);
        } finally {
            setLoadingBudgetOwners(false);
        }
    };

    const handleVerification = async (values) => {
        if (!selectedRequisition) return;
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/finance-verification`,
                { method: 'POST', body: JSON.stringify({ decision: values.decision, comments: values.comments }) }
            );
            if (response.success) {
                message.success(`Budget verification ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`);
                setVerificationModalVisible(false);
                setSelectedRequisition(null);
                form.resetFields();
                fetchRequisitions();
                fetchStats();
            } else throw new Error(response.message);
        } catch (error) {
            message.error(error.message || 'Failed to process verification');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBudgetCode = async (values) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`, { method: 'POST', body: JSON.stringify(values) });
            if (response.success) {
                message.success('Budget code created successfully and sent for approval');
                setBudgetCodeModalVisible(false);
                budgetCodeForm.resetFields();
                fetchBudgetCodes();
            } else message.error(response.message || 'Failed to create budget code');
        } catch (error) {
            message.error(error.message || 'Failed to create budget code');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateBudgetCode = async (values) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes/${editingBudgetCode._id}`, { method: 'PUT', body: JSON.stringify(values) });
            if (response.success) {
                message.success('Budget code updated successfully');
                setBudgetCodeModalVisible(false);
                budgetCodeForm.resetFields();
                setEditingBudgetCode(null);
                fetchBudgetCodes();
            } else throw new Error(response.message);
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
                { method: 'POST', body: JSON.stringify({ decision: values.decision, comments: values.comments }) }
            );
            if (response.success) {
                message.success(`Budget code ${values.decision} successfully`);
                setBudgetCodeApprovalModalVisible(false);
                setSelectedBudgetCodeForApproval(null);
                budgetCodeApprovalForm.resetFields();
                fetchBudgetCodes();
            } else throw new Error(response.message);
        } catch (error) {
            message.error(error.message || 'Failed to process approval');
        } finally {
            setLoading(false);
        }
    };

    const handleDisbursement = async (values) => {
        if (!selectedRequisition) return;
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/disburse`,
                { method: 'POST', body: JSON.stringify({ amount: values.amount, notes: values.notes }) }
            );
            if (response.success) {
                const isFullyDisbursed = response.disbursement.isFullyDisbursed;
                message.success({
                    content: isFullyDisbursed ? 'Requisition fully disbursed!' : `Partial disbursement #${response.disbursement.number} processed successfully`,
                    duration: 5
                });
                setDisbursementModalVisible(false);
                setSelectedRequisition(null);
                disbursementForm.resetFields();
                setDisbursementAmount(0);
                fetchRequisitions();
                fetchStats();
            } else throw new Error(response.message);
        } catch (error) {
            message.error(error.message || 'Failed to process disbursement');
        } finally {
            setLoading(false);
        }
    };

    const handleStartDisbursement = (requisition) => {
        setSelectedRequisition(requisition);
        const remainingBalance = requisition.remainingBalance || (requisition.budgetXAF - (requisition.totalDisbursed || 0));
        setDisbursementAmount(remainingBalance);
        disbursementForm.setFieldsValue({ amount: remainingBalance, notes: '' });
        setDisbursementModalVisible(true);
    };

    const handleViewDetails = async (requisition) => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/${requisition._id}`);
            if (response.success) {
                setSelectedRequisition(response.data);
                setDetailsModalVisible(true);
            } else message.error('Failed to fetch requisition details');
        } catch (error) {
            message.error('Failed to load requisition details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartVerification = (requisition) => {
        setSelectedRequisition(requisition);
        form.setFieldsValue({ decision: 'approved', comments: '' });
        setVerificationModalVisible(true);
    };

    const openBudgetCodeModal = (budgetCode = null) => {
        setEditingBudgetCode(budgetCode);
        if (budgetCode) budgetCodeForm.setFieldsValue(budgetCode);
        else budgetCodeForm.resetFields();
        setBudgetCodeModalVisible(true);
        if (projects.length === 0) fetchProjects();
        if (budgetOwners.length === 0) fetchBudgetOwners();
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
            'approved': { color: 'green', text: 'Ready for Disbursement', icon: <DollarOutlined /> },
            'partially_disbursed': { color: 'cyan', text: 'Partially Disbursed', icon: <SendOutlined /> },
            'fully_disbursed': { color: 'green', text: 'Fully Disbursed', icon: <CheckCircleOutlined /> },
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

    const getFileIcon = (mimetype) => {
        if (!mimetype) return <FileUnknownOutlined />;
        if (mimetype.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
        if (mimetype.includes('image')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
        if (mimetype.includes('word') || mimetype.includes('document')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
        if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
        return <FileUnknownOutlined />;
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const canPreviewFile = (mimetype) => {
        if (!mimetype) return false;
        return mimetype.includes('pdf') || mimetype.includes('image');
    };

    const handleDownloadAttachment = async (attachment) => {
        if (!selectedRequisition?._id || !attachment._id) { message.error('Invalid attachment information'); return; }
        setDownloadingAttachment(attachment._id);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(
                `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/download`,
                { method: 'GET', headers: { 'Authorization': `Bearer ${token}` } }
            );
            if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to download file'); }
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = attachment.name || 'attachment';
            if (contentDisposition) { const m = contentDisposition.match(/filename="?(.+)"?/i); if (m) filename = m[1]; }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url; link.download = filename;
            document.body.appendChild(link); link.click(); document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            message.success(`Downloaded: ${filename}`);
        } catch (error) {
            message.error(error.message || 'Failed to download attachment');
        } finally {
            setDownloadingAttachment(null);
        }
    };

    const handlePreviewAttachment = async (attachment) => {
        if (!selectedRequisition?._id || !attachment._id) { message.error('Invalid attachment information'); return; }
        if (!canPreviewFile(attachment.mimetype)) { message.info('This file type cannot be previewed. Downloading instead...'); handleDownloadAttachment(attachment); return; }
        const token = localStorage.getItem('token');
        window.open(`${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/preview?token=${token}`, '_blank');
    };

    const renderAttachments = () => {
        if (!selectedRequisition?.attachments || selectedRequisition.attachments.length === 0) return null;
        return (
            <Card size="small" title={<Space><PaperClipOutlined />Attachments ({selectedRequisition.attachments.length})</Space>} style={{ marginBottom: '16px' }}>
                <List
                    dataSource={selectedRequisition.attachments}
                    renderItem={(attachment) => (
                        <List.Item key={attachment._id} actions={[
                            canPreviewFile(attachment.mimetype) && (
                                <Tooltip title="Preview"><Button size="small" type="link" icon={<EyeOutlined />} onClick={() => handlePreviewAttachment(attachment)}>Preview</Button></Tooltip>
                            ),
                            <Tooltip title="Download"><Button size="small" type="link" icon={<DownloadOutlined />} loading={downloadingAttachment === attachment._id} onClick={() => handleDownloadAttachment(attachment)}>Download</Button></Tooltip>
                        ].filter(Boolean)}>
                            <List.Item.Meta
                                avatar={getFileIcon(attachment.mimetype)}
                                title={<Space><Text strong>{attachment.name}</Text>{canPreviewFile(attachment.mimetype) && <Tag color="blue" size="small">Can Preview</Tag>}</Space>}
                                description={<Space split="|"><Text type="secondary">{formatFileSize(attachment.size)}</Text><Text type="secondary">{new Date(attachment.uploadedAt).toLocaleDateString('en-GB')}</Text></Space>}
                            />
                        </List.Item>
                    )}
                />
            </Card>
        );
    };

    const getBudgetVerificationStatus = (requisition) => {
        if (!requisition?.budgetCode || !requisition?.budgetCodeInfo) return null;
        const budgetCode = budgetCodes.find(bc => bc._id === requisition.budgetCode);
        if (!budgetCode) return null;
        const currentAvailable = budgetCode.budget - budgetCode.used;
        const requiredAmount = requisition.budgetXAF || 0;
        const isSufficient = currentAvailable >= requiredAmount;
        return {
            code: budgetCode.code, name: budgetCode.name, department: budgetCode.department,
            totalBudget: budgetCode.budget, used: budgetCode.used, currentAvailable,
            requiredAmount, isSufficient,
            submissionAvailable: requisition.budgetCodeInfo.availableAtSubmission,
            remainingAfter: currentAvailable - requiredAmount,
            utilizationRate: Math.round((budgetCode.used / budgetCode.budget) * 100)
        };
    };

    // ── Table columns ────────────────────────────────────────────────────────
    const requisitionColumns = [
        {
            title: 'Requisition Details',
            key: 'requisition',
            render: (_, record) => (
                <div>
                    <Text strong>{record.title || 'No Title'}</Text><br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.requisitionNumber || `REQ-${record._id?.slice(-6)?.toUpperCase()}`}
                    </Text><br />
                    <Tag size="small" color="blue">{record.itemCategory || 'N/A'}</Tag>
                    {record.budgetCodeInfo?.code && (
                        <Tag size="small" color="gold"><TagOutlined /> {record.budgetCodeInfo.code}</Tag>
                    )}
                </div>
            ),
            width: 220,
            sorter: (a, b) => (a.title || '').localeCompare(b.title || ''),
        },
        {
            title: 'Employee',
            key: 'employee',
            render: (_, record) => (
                <div>
                    <Text strong>{record.employee?.fullName || 'N/A'}</Text><br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.employee?.department || record.department || 'N/A'}</Text>
                </div>
            ),
            width: 150,
            sorter: (a, b) => (a.employee?.fullName || '').localeCompare(b.employee?.fullName || ''),
            filters: [...new Set(requisitions.map(r => r.employee?.department || r.department).filter(Boolean))].map(d => ({ text: d, value: d })),
            onFilter: (value, record) => (record.employee?.department || record.department) === value,
        },
        {
            title: 'Budget & Disbursement',
            key: 'budget',
            render: (_, record) => {
                const totalBudget = record.budgetXAF || 0;
                const disbursed = record.totalDisbursed || 0;
                const remaining = record.remainingBalance || (totalBudget - disbursed);
                const progress = totalBudget > 0 ? Math.round((disbursed / totalBudget) * 100) : 0;
                return (
                    <div>
                        <Text strong style={{ color: '#1890ff' }}>XAF {totalBudget.toLocaleString()}</Text><br />
                        {(record.status === 'approved' || record.status === 'partially_disbursed' || record.status === 'fully_disbursed') && (
                            <>
                                <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} strokeColor={progress === 100 ? '#52c41a' : '#1890ff'} />
                                <Text type="secondary" style={{ fontSize: '11px' }}>Disbursed: XAF {disbursed.toLocaleString()}</Text>
                                {remaining > 0 && <><br /><Text type="danger" style={{ fontSize: '11px' }}>Remaining: XAF {remaining.toLocaleString()}</Text></>}
                            </>
                        )}
                    </div>
                );
            },
            width: 180,
            sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0),
        },
        {
            title: 'Items',
            dataIndex: 'items',
            key: 'items',
            render: (items) => (
                <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
                    <ShoppingCartOutlined style={{ fontSize: '18px' }} />
                </Badge>
            ),
            width: 70,
            align: 'center',
            sorter: (a, b) => (a.items?.length || 0) - (b.items?.length || 0),
        },
        {
            title: 'Priority',
            dataIndex: 'urgency',
            key: 'urgency',
            render: (urgency) => {
                const urgencyColors = { 'Low': 'green', 'Medium': 'orange', 'High': 'red' };
                return <Tag color={urgencyColors[urgency] || 'default'}>{urgency || 'N/A'}</Tag>;
            },
            width: 90,
            sorter: (a, b) => {
                const order = { High: 3, Medium: 2, Low: 1 };
                return (order[a.urgency] || 0) - (order[b.urgency] || 0);
            },
            filters: [
                { text: <Tag color="red">High</Tag>, value: 'High' },
                { text: <Tag color="orange">Medium</Tag>, value: 'Medium' },
                { text: <Tag color="green">Low</Tag>, value: 'Low' },
            ],
            onFilter: (value, record) => record.urgency === value,
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
                        <Text>{expectedDate.toLocaleDateString('en-GB')}</Text><br />
                        <Text type={daysRemaining < 0 ? 'danger' : 'secondary'} style={{ fontSize: '11px' }}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                        </Text>
                    </div>
                );
            },
            width: 110,
            sorter: (a, b) => new Date(a.expectedDate || 0) - new Date(b.expectedDate || 0),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getStatusTag(status),
            width: 160,
            filters: [
                { text: 'Pending Verification', value: 'pending_finance_verification' },
                { text: 'Finance Approved', value: 'pending_supply_chain_review' },
                { text: 'Ready for Disbursement', value: 'approved' },
                { text: 'Partially Disbursed', value: 'partially_disbursed' },
                { text: 'Fully Disbursed', value: 'fully_disbursed' },
                { text: 'Rejected', value: 'rejected' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => {
                const totalBudget = record.budgetXAF || 0;
                const disbursed = record.totalDisbursed || 0;
                const remainingBalance = record.remainingBalance ?? (totalBudget - disbursed);
                return (
                    <Space size="small">
                        <Tooltip title="View Details">
                            <Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
                        </Tooltip>
                        {(record.isAwaitingFinance || record.status === 'pending_finance_verification' || record.financeVerification?.decision === 'pending') && (
                            <Tooltip title="Verify Budget">
                                <Button size="small" type="primary" icon={<AuditOutlined />} onClick={() => handleStartVerification(record)}>Verify</Button>
                            </Tooltip>
                        )}
                        {((record.status === 'approved' || record.status === 'partially_disbursed') && remainingBalance > 0) && (
                            <Tooltip title="Process Disbursement">
                                <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleStartDisbursement(record)} style={{ backgroundColor: '#52c41a' }}>Disburse</Button>
                            </Tooltip>
                        )}
                    </Space>
                );
            },
            width: 160,
            fixed: 'right'
        }
    ];

    const budgetCodeColumns = [
        {
            title: 'Budget Code',
            dataIndex: 'code',
            key: 'code',
            render: (code, record) => (
                <div><Text strong code>{code}</Text><br /><Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text></div>
            ),
            sorter: (a, b) => a.code.localeCompare(b.code),
        },
        {
            title: 'Budget Allocation',
            key: 'budget',
            render: (_, record) => (
                <div><Text strong>XAF {record.budget.toLocaleString()}</Text><br /><Text type="secondary" style={{ fontSize: '11px' }}>Used: XAF {record.used.toLocaleString()}</Text></div>
            ),
            sorter: (a, b) => a.budget - b.budget,
        },
        {
            title: 'Utilization',
            key: 'utilization',
            render: (_, record) => {
                const percentage = Math.round((record.used / record.budget) * 100);
                const status = getBudgetCodeStatus(record);
                return (
                    <div>
                        <Progress percent={percentage} size="small" status={status.color === 'red' ? 'exception' : status.color === 'orange' ? 'active' : 'success'} />
                        <Text type="secondary" style={{ fontSize: '11px' }}>{percentage}% utilized</Text>
                    </div>
                );
            },
            sorter: (a, b) => (a.used / a.budget) - (b.used / b.budget),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status) => getBudgetCodeStatusTag(status),
            filters: [
                { text: 'Active', value: 'active' },
                { text: 'Pending', value: 'pending' },
                { text: 'Rejected', value: 'rejected' },
            ],
            onFilter: (value, record) => record.status === value,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="small">
                    <Button size="small" icon={<EyeOutlined />} onClick={() => viewBudgetCodeDetails(record)}>View</Button>
                    {record.status !== 'active' && record.status !== 'rejected' && (
                        <Button size="small" type="primary" onClick={() => openBudgetCodeApprovalModal(record)}>Review</Button>
                    )}
                    {(record.status === 'active' || record.status === 'rejected') && (
                        <Button size="small" icon={<EditOutlined />} onClick={() => openBudgetCodeModal(record)}>Edit</Button>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            {/* Main Navigation */}
            <div style={{ marginBottom: '24px' }}>
                <Space size="large">
                    <Button type={mainSection === 'requisitions' ? 'primary' : 'default'} size="large" icon={<BankOutlined />} onClick={() => setMainSection('requisitions')}>
                        Requisition Management
                    </Button>
                    <Button type={mainSection === 'budgetCodes' ? 'primary' : 'default'} size="large" icon={<TagOutlined />} onClick={() => setMainSection('budgetCodes')}>
                        Budget Code Management
                    </Button>
                </Space>
            </div>

            {/* Requisition Management Section */}
            {mainSection === 'requisitions' && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={2} style={{ margin: 0 }}>
                            <BankOutlined /> Finance - Purchase Requisition Management
                        </Title>
                        <Button icon={<ReloadOutlined />} onClick={() => { fetchRequisitions(); fetchStats(); }} loading={loading}>Refresh</Button>
                    </div>

                    {/* Stats */}
                    <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
                        <Row gutter={16}>
                            <Col span={4}><Statistic title="Pending Verification" value={stats.pending} valueStyle={{ color: '#faad14' }} prefix={<ClockCircleOutlined />} /></Col>
                            <Col span={4}><Statistic title="Budget Approved" value={stats.verified} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Col>
                            <Col span={4}><Statistic title="Pending Disbursement" value={stats.pendingDisbursement} valueStyle={{ color: '#1890ff' }} prefix={<DollarOutlined />} /></Col>
                            <Col span={4}><Statistic title="Partially Disbursed" value={stats.partiallyDisbursed} valueStyle={{ color: '#13c2c2' }} prefix={<SendOutlined />} /></Col>
                            <Col span={4}><Statistic title="Fully Disbursed" value={fullyDisbursedCount} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} /></Col>
                            <Col span={4}><Statistic title="Total Allocated" value={`XAF ${stats.totalBudgetAllocated.toLocaleString()}`} valueStyle={{ color: '#722ed1' }} prefix={<BarChartOutlined />} /></Col>
                        </Row>
                    </Card>

                    {/* Tabs */}
                    <Tabs activeKey={activeTab} onChange={handleTabChange} style={{ marginBottom: '16px' }}>
                        <TabPane tab={<Badge count={pendingCount} size="small"><span>Pending Verification</span></Badge>} key="pending" />
                        <TabPane tab={<Badge count={disbursementCount} size="small"><span><SendOutlined /> Disbursement</span></Badge>} key="disbursement" />
                        <TabPane tab={<Badge count={approvedCount} size="small"><span>Approved</span></Badge>} key="approved" />
                        <TabPane tab={<Badge count={fullyDisbursedCount} size="small"><span><CheckCircleOutlined /> Fully Disbursed</span></Badge>} key="fully_disbursed" />
                        <TabPane tab={<span>Rejected ({rejectedCount})</span>} key="rejected" />
                        <TabPane tab={<Badge count={requisitions.length} size="small"><span>All</span></Badge>} key="all" />
                    </Tabs>

                    {/* ── Search & Filter Bar ─────────────────────────────────────── */}
                    <SearchFilterBar
                        filters={filters}
                        onFiltersChange={setFilters}
                        onClear={() => setFilters(DEFAULT_FILTERS)}
                        totalCount={getTabFilteredRequisitions().length}
                        filteredCount={getFilteredRequisitions.length}
                    />

                    {/* ── Active Filter Tags ──────────────────────────────────────── */}
                    <ActiveFilterTags filters={filters} onFiltersChange={setFilters} />

                    <Table
                        columns={requisitionColumns}
                        dataSource={getFilteredRequisitions}
                        loading={loading}
                        rowKey="_id"
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            defaultPageSize: 10,
                            pageSizeOptions: ['10', '20', '50'],
                            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
                        }}
                        scroll={{ x: 1300 }}
                        size="small"
                        onChange={(pagination, tableFilters, sorter) => {
                            // Native Ant table sort also works alongside our custom sort
                            if (sorter?.field && sorter?.order) {
                                const fieldMap = {
                                    budget: 'budgetXAF',
                                    expectedDate: 'expectedDate',
                                    requisition: 'title',
                                    employee: 'title',
                                    items: 'title',
                                    urgency: 'urgency',
                                };
                                const mapped = fieldMap[sorter.field] || sorter.field;
                                const dir = sorter.order === 'ascend' ? 'asc' : 'desc';
                                setFilters(prev => ({ ...prev, sortBy: `${mapped}_${dir}` }));
                            }
                        }}
                    />
                </Card>
            )}

            {/* Budget Code Management Section */}
            {mainSection === 'budgetCodes' && (
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={2} style={{ margin: 0 }}><TagOutlined /> Budget Code Management</Title>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => openBudgetCodeModal()}>Create Budget Code</Button>
                    </div>
                    <Alert message="Budget Code Management" description="Create and manage budget codes for purchase requisitions. Track budget allocation and utilization across different departments and projects." type="info" showIcon style={{ marginBottom: '16px' }} />
                    <Table columns={budgetCodeColumns} dataSource={budgetCodes} loading={loading} rowKey="_id" pagination={{ showSizeChanger: true, showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes` }} />
                </Card>
            )}

            {/* ── All existing modals below unchanged ────────────────────────── */}

            {/* Budget Verification Modal */}
            <Modal
                title={<Space><AuditOutlined />Budget Verification - {selectedRequisition?.title}</Space>}
                open={verificationModalVisible}
                onCancel={() => { setVerificationModalVisible(false); setSelectedRequisition(null); form.resetFields(); }}
                footer={null}
                width={900}
            >
                {selectedRequisition && (
                    <div>
                        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Employee"><Text strong>{selectedRequisition.employee?.fullName}</Text></Descriptions.Item>
                                <Descriptions.Item label="Department"><Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Category"><Tag color="green">{selectedRequisition.itemCategory}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Priority"><Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>{selectedRequisition.urgency}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Requested Budget"><Text strong style={{ color: '#1890ff', fontSize: '16px' }}>XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}</Text></Descriptions.Item>
                                <Descriptions.Item label="Expected Date"><Text>{new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}</Text></Descriptions.Item>
                            </Descriptions>
                        </Card>
                        {selectedRequisition.justificationOfPurchase && (
                            <Card size="small" title="Business Justification" style={{ marginBottom: '20px' }}>
                                <div style={{ marginBottom: '12px' }}><Text strong>Purchase Justification:</Text><br /><Text>{selectedRequisition.justificationOfPurchase}</Text></div>
                                {selectedRequisition.justificationOfPreferredSupplier && <div><Text strong>Preferred Supplier Justification:</Text><br /><Text>{selectedRequisition.justificationOfPreferredSupplier}</Text></div>}
                            </Card>
                        )}
                        {renderAttachments()}
                        <Card size="small" title={`Items Requested (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '20px' }}>
                            <Table columns={[{ title: 'Description', dataIndex: 'description', key: 'description' }, { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' }, { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 80, align: 'center' }]} dataSource={selectedRequisition.items || []} pagination={false} size="small" rowKey={(_, i) => i} />
                        </Card>
                        {(() => {
                            const budgetStatus = getBudgetVerificationStatus(selectedRequisition);
                            if (!budgetStatus) return <Alert message="No Budget Code Selected" description="This requisition does not have a budget code assigned." type="error" showIcon style={{ marginBottom: '20px' }} />;
                            return (
                                <Card size="small" title={<Space><TagOutlined />Pre-Selected Budget Code (Read-Only)</Space>} style={{ marginBottom: '20px' }}>
                                    <Descriptions column={2} size="small" bordered>
                                        <Descriptions.Item label="Budget Code" span={2}><Text code strong>{budgetStatus.code}</Text> - {budgetStatus.name}</Descriptions.Item>
                                        <Descriptions.Item label="Department"><Tag color="blue">{budgetStatus.department}</Tag></Descriptions.Item>
                                        <Descriptions.Item label="Total Budget"><Text strong>XAF {budgetStatus.totalBudget.toLocaleString()}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Used"><Text>XAF {budgetStatus.used.toLocaleString()}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Current Available"><Text strong style={{ color: budgetStatus.isSufficient ? '#52c41a' : '#ff4d4f' }}>XAF {budgetStatus.currentAvailable.toLocaleString()}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Required Amount"><Text strong style={{ color: '#1890ff' }}>XAF {budgetStatus.requiredAmount.toLocaleString()}</Text></Descriptions.Item>
                                        <Descriptions.Item label="Utilization Rate"><Progress percent={budgetStatus.utilizationRate} size="small" status={budgetStatus.utilizationRate >= 90 ? 'exception' : budgetStatus.utilizationRate >= 75 ? 'active' : 'success'} /></Descriptions.Item>
                                    </Descriptions>
                                    <div style={{ marginTop: '16px' }}>
                                        {budgetStatus.isSufficient ? (
                                            <Alert message={<Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><Text strong style={{ color: '#52c41a' }}>Sufficient Budget Available</Text></Space>} description={<div><Text>The budget code has sufficient funds.</Text><Divider style={{ margin: '8px 0' }} /><Row gutter={16}><Col span={12}><Text type="secondary">Available at Submission:</Text><br /><Text strong>XAF {budgetStatus.submissionAvailable?.toLocaleString()}</Text></Col><Col span={12}><Text type="secondary">Remaining After Approval:</Text><br /><Text strong style={{ color: '#52c41a' }}>XAF {budgetStatus.remainingAfter.toLocaleString()}</Text></Col></Row></div>} type="success" showIcon />
                                        ) : (
                                            <Alert message={<Space><WarningOutlined style={{ color: '#ff4d4f' }} /><Text strong style={{ color: '#ff4d4f' }}>Insufficient Budget</Text></Space>} description={<div><Text>The budget code does not have sufficient funds.</Text><Divider style={{ margin: '8px 0' }} /><Row gutter={16}><Col span={12}><Text type="secondary">Current Available:</Text><br /><Text strong>XAF {budgetStatus.currentAvailable.toLocaleString()}</Text></Col><Col span={12}><Text type="secondary">Shortfall:</Text><br /><Text strong style={{ color: '#ff4d4f' }}>XAF {(budgetStatus.requiredAmount - budgetStatus.currentAvailable).toLocaleString()}</Text></Col></Row></div>} type="error" showIcon />
                                        )}
                                    </div>
                                </Card>
                            );
                        })()}
                        <Form form={form} layout="vertical" onFinish={handleVerification}>
                            <Alert message="Finance Verification" description="Review the budget code information above and decide whether to approve or reject." type="info" showIcon style={{ marginBottom: '16px' }} />
                            <Form.Item name="decision" label="Verification Decision" rules={[{ required: true, message: 'Please select your decision' }]}>
                                <Select placeholder="Select your decision" size="large">
                                    <Option value="approved"><Space><CheckCircleOutlined style={{ color: '#52c41a' }} /><Text strong>✅ Approve - Budget Available</Text></Space></Option>
                                    <Option value="rejected"><Space><CloseCircleOutlined style={{ color: '#ff4d4f' }} /><Text strong>❌ Reject - Insufficient Budget / Other Reason</Text></Space></Option>
                                </Select>
                            </Form.Item>
                            <Form.Item name="comments" label="Verification Comments" rules={[{ required: true, message: 'Please provide verification comments' }]} help="Explain your decision.">
                                <TextArea rows={4} placeholder="Enter your comments about budget verification..." showCount maxLength={500} />
                            </Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button onClick={() => { setVerificationModalVisible(false); setSelectedRequisition(null); form.resetFields(); }}>Cancel</Button>
                                    <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} size="large">Submit Verification</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Budget Code Create/Edit Modal */}
            <Modal title={<Space><TagOutlined />{editingBudgetCode ? 'Edit Budget Code' : 'Create New Budget Code'}</Space>} open={budgetCodeModalVisible} onCancel={() => { setBudgetCodeModalVisible(false); budgetCodeForm.resetFields(); setEditingBudgetCode(null); }} footer={null} width={600}>
                <Form form={budgetCodeForm} layout="vertical" onFinish={editingBudgetCode ? handleUpdateBudgetCode : handleCreateBudgetCode}>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="code" label="Budget Code" rules={[{ required: true }, { pattern: /^[A-Z0-9\-_]+$/, message: 'Only uppercase letters, numbers, hyphens and underscores' }]} help="Use format like DEPT-IT-2024"><Input placeholder="e.g., DEPT-IT-2024" disabled={!!editingBudgetCode} style={{ textTransform: 'uppercase' }} /></Form.Item></Col>
                        <Col span={12}><Form.Item name="name" label="Budget Name" rules={[{ required: true }]}><Input placeholder="e.g., IT Department 2024 Budget" /></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="budget" label="Total Budget Allocation (XAF)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/\$\s?|(,*)/g, '')} min={0} placeholder="Enter total budget" /></Form.Item></Col>
                        <Col span={12}><Form.Item name="department" label="Department/Project" rules={[{ required: true }]}><Select placeholder="Select department or project" showSearch loading={loadingProjects}><Select.OptGroup label="Departments">{['Technical Operations','Technical Roll Out','Technical QHSE','IT','Finance','HR','Marketing','Supply Chain','Business','Facilities'].map(d => <Option key={d} value={d}>{d}</Option>)}</Select.OptGroup><Select.OptGroup label="Active Projects">{projects.map(p => <Option key={`project-${p._id}`} value={`PROJECT-${p._id}`}>{p.name} ({p.department})</Option>)}</Select.OptGroup></Select></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="budgetType" label="Budget Type" rules={[{ required: true }]}><Select placeholder="Select budget type"><Option value="OPEX">OPEX - Operating Expenses</Option><Option value="CAPEX">CAPEX - Capital Expenditure</Option><Option value="PROJECT">PROJECT - Project Budget</Option><Option value="OPERATIONAL">OPERATIONAL - Operational</Option></Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="budgetPeriod" label="Budget Period" rules={[{ required: true }]}><Select placeholder="Select budget period"><Option value="monthly">Monthly</Option><Option value="quarterly">Quarterly</Option><Option value="yearly">Yearly</Option><Option value="project">Project Duration</Option></Select></Form.Item></Col>
                    </Row>
                    <Form.Item name="description" label="Budget Description"><TextArea rows={3} placeholder="Describe the purpose and scope..." showCount maxLength={300} /></Form.Item>
                    <Row gutter={16}>
                        <Col span={12}><Form.Item name="budgetOwner" label="Budget Owner" rules={[{ required: true }]}><Select placeholder="Select budget owner" showSearch loading={loadingBudgetOwners} filterOption={(input, option) => { const user = budgetOwners.find(u => u._id === option.value); if (!user) return false; return (user.fullName || '').toLowerCase().includes(input.toLowerCase()) || (user.email || '').toLowerCase().includes(input.toLowerCase()); }} notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : 'No users found'}>{budgetOwners.map(u => <Option key={u._id} value={u._id}><div><Text strong>{u.fullName}</Text><br /><Text type="secondary" style={{ fontSize: '12px' }}>{u.role} | {u.department}</Text></div></Option>)}</Select></Form.Item></Col>
                        <Col span={12}><Form.Item name="active" label="Status" valuePropName="checked" initialValue={true}><Switch checkedChildren="Active" unCheckedChildren="Inactive" /></Form.Item></Col>
                    </Row>
                    <Form.Item><Space><Button onClick={() => { setBudgetCodeModalVisible(false); budgetCodeForm.resetFields(); setEditingBudgetCode(null); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={loading} icon={editingBudgetCode ? <EditOutlined /> : <PlusOutlined />}>{editingBudgetCode ? 'Update Budget Code' : 'Create Budget Code'}</Button></Space></Form.Item>
                </Form>
            </Modal>

            {/* Budget Code Approval Modal */}
            <Modal title={<Space><AuditOutlined />Budget Code Approval - {selectedBudgetCodeForApproval?.code}</Space>} open={budgetCodeApprovalModalVisible} onCancel={() => { setBudgetCodeApprovalModalVisible(false); setSelectedBudgetCodeForApproval(null); budgetCodeApprovalForm.resetFields(); }} footer={null} width={700}>
                {selectedBudgetCodeForApproval && (
                    <div>
                        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Budget Code"><Text strong code>{selectedBudgetCodeForApproval.code}</Text></Descriptions.Item>
                                <Descriptions.Item label="Name">{selectedBudgetCodeForApproval.name}</Descriptions.Item>
                                <Descriptions.Item label="Budget Amount"><Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCodeForApproval.budget?.toLocaleString()}</Text></Descriptions.Item>
                                <Descriptions.Item label="Department"><Tag color="blue">{selectedBudgetCodeForApproval.department}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Budget Type">{selectedBudgetCodeForApproval.budgetType}</Descriptions.Item>
                                <Descriptions.Item label="Current Status">{getBudgetCodeStatusTag(selectedBudgetCodeForApproval.status)}</Descriptions.Item>
                            </Descriptions>
                        </Card>
                        <Form form={budgetCodeApprovalForm} layout="vertical" onFinish={handleBudgetCodeApproval}>
                            <Form.Item name="decision" label="Approval Decision" rules={[{ required: true }]}><Select placeholder="Select decision"><Option value="approved">✅ Approve Budget Code</Option><Option value="rejected">❌ Reject Budget Code</Option></Select></Form.Item>
                            <Form.Item name="comments" label="Comments" rules={[{ required: true }]}><TextArea rows={4} placeholder="Enter your comments..." showCount maxLength={500} /></Form.Item>
                            <Form.Item><Space><Button onClick={() => { setBudgetCodeApprovalModalVisible(false); setSelectedBudgetCodeForApproval(null); budgetCodeApprovalForm.resetFields(); }}>Cancel</Button><Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />}>Submit Decision</Button></Space></Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Budget Code Details Modal */}
            <Modal title={<Space><TagOutlined />Budget Code Details</Space>} open={budgetCodeDetailsModalVisible} onCancel={() => { setBudgetCodeDetailsModalVisible(false); setSelectedBudgetCode(null); }} footer={null} width={800}>
                {selectedBudgetCode && (
                    <div>
                        <Descriptions bordered column={2} size="small">
                            <Descriptions.Item label="Budget Code" span={2}><Text code strong>{selectedBudgetCode.code}</Text></Descriptions.Item>
                            <Descriptions.Item label="Name" span={2}>{selectedBudgetCode.name}</Descriptions.Item>
                            <Descriptions.Item label="Budget Amount"><Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCode.budget?.toLocaleString()}</Text></Descriptions.Item>
                            <Descriptions.Item label="Used Amount"><Text strong style={{ color: '#fa8c16' }}>XAF {selectedBudgetCode.used?.toLocaleString()}</Text></Descriptions.Item>
                            <Descriptions.Item label="Remaining"><Text strong style={{ color: '#52c41a' }}>XAF {(selectedBudgetCode.budget - selectedBudgetCode.used).toLocaleString()}</Text></Descriptions.Item>
                            <Descriptions.Item label="Utilization"><Progress percent={Math.round((selectedBudgetCode.used / selectedBudgetCode.budget) * 100)} size="small" /></Descriptions.Item>
                            <Descriptions.Item label="Department">{selectedBudgetCode.department}</Descriptions.Item>
                            <Descriptions.Item label="Budget Type">{selectedBudgetCode.budgetType}</Descriptions.Item>
                            <Descriptions.Item label="Budget Period">{selectedBudgetCode.budgetPeriod}</Descriptions.Item>
                            <Descriptions.Item label="Status">{getBudgetCodeStatusTag(selectedBudgetCode.status)}</Descriptions.Item>
                        </Descriptions>
                        {selectedBudgetCode.description && <Card size="small" title="Description" style={{ marginTop: '20px' }}><Text>{selectedBudgetCode.description}</Text></Card>}
                    </div>
                )}
            </Modal>

            {/* Disbursement Modal */}
            <Modal title={<Space><SendOutlined />Process Disbursement - {selectedRequisition?.title}</Space>} open={disbursementModalVisible} onCancel={() => { setDisbursementModalVisible(false); setSelectedRequisition(null); disbursementForm.resetFields(); setDisbursementAmount(0); }} footer={null} width={800}>
                {selectedRequisition && (
                    <div>
                        <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
                            <Descriptions column={2} size="small">
                                <Descriptions.Item label="Employee"><Text strong>{selectedRequisition.employee?.fullName}</Text></Descriptions.Item>
                                <Descriptions.Item label="Department"><Tag color="blue">{selectedRequisition.employee?.department}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Total Budget"><Text strong style={{ color: '#1890ff', fontSize: '16px' }}>XAF {(selectedRequisition.budgetXAF || 0).toLocaleString()}</Text></Descriptions.Item>
                                <Descriptions.Item label="Already Disbursed"><Text strong style={{ color: '#52c41a' }}>XAF {(selectedRequisition.totalDisbursed || 0).toLocaleString()}</Text></Descriptions.Item>
                                <Descriptions.Item label="Remaining Balance" span={2}><Text strong style={{ color: '#ff4d4f', fontSize: '18px' }}>XAF {(selectedRequisition.remainingBalance || 0).toLocaleString()}</Text></Descriptions.Item>
                            </Descriptions>
                        </Card>
                        {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
                            <Card size="small" title="Disbursement History" style={{ marginBottom: '20px' }}>
                                <Timeline mode="left">
                                    {selectedRequisition.disbursements.map((d, i) => (
                                        <Timeline.Item key={i} color={i === selectedRequisition.disbursements.length - 1 ? 'green' : 'blue'} dot={<DollarOutlined />}>
                                            <div><Text strong>Payment #{d.disbursementNumber}</Text><br /><Text type="secondary">{new Date(d.date).toLocaleString('en-GB')}</Text><br /><Text strong style={{ color: '#1890ff' }}>XAF {d.amount?.toLocaleString()}</Text>{d.notes && <><br /><Text italic style={{ fontSize: '11px' }}>"{d.notes}"</Text></>}</div>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </Card>
                        )}
                        <Form form={disbursementForm} layout="vertical" onFinish={handleDisbursement}>
                            <Alert message={selectedRequisition.disbursements?.length > 0 ? 'Additional Disbursement' : 'First Disbursement'} description={selectedRequisition.disbursements?.length > 0 ? 'You can disburse the remaining amount or make another partial payment.' : 'You can disburse the full amount or make a partial payment.'} type="info" showIcon style={{ marginBottom: '16px' }} />
                            <Form.Item name="amount" label="Disbursement Amount (XAF)" rules={[{ required: true }, { validator: (_, value) => { if (value > selectedRequisition.remainingBalance) return Promise.reject(`Amount cannot exceed remaining balance of XAF ${selectedRequisition.remainingBalance.toLocaleString()}`); if (value <= 0) return Promise.reject('Amount must be greater than 0'); return Promise.resolve(); } }]}>
                                <InputNumber style={{ width: '100%' }} min={0} max={selectedRequisition.remainingBalance} step={1000} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={v => v.replace(/,/g, '')} onChange={v => setDisbursementAmount(v || 0)} />
                            </Form.Item>
                            {disbursementAmount > 0 && (
                                <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
                                    <Row gutter={16}>
                                        <Col span={8}><Statistic title="Disbursing Now" value={disbursementAmount} precision={0} valueStyle={{ color: '#1890ff' }} prefix="XAF" /></Col>
                                        <Col span={8}><Statistic title="Remaining After" value={selectedRequisition.remainingBalance - disbursementAmount} precision={0} valueStyle={{ color: selectedRequisition.remainingBalance - disbursementAmount > 0 ? '#cf1322' : '#3f8600' }} prefix="XAF" /></Col>
                                        <Col span={8}><Statistic title="Progress" value={Math.round(((selectedRequisition.totalDisbursed + disbursementAmount) / selectedRequisition.budgetXAF) * 100)} precision={0} valueStyle={{ color: '#722ed1' }} suffix="%" /></Col>
                                    </Row>
                                    <Divider style={{ margin: '12px 0' }} />
                                    <Progress percent={Math.round(((selectedRequisition.totalDisbursed + disbursementAmount) / selectedRequisition.budgetXAF) * 100)} status={selectedRequisition.remainingBalance - disbursementAmount === 0 ? 'success' : 'active'} />
                                    {selectedRequisition.remainingBalance - disbursementAmount === 0 && <Alert message="Full Disbursement" description="This payment will complete the full disbursement." type="success" showIcon style={{ marginTop: '12px' }} />}
                                </Card>
                            )}
                            <Form.Item name="notes" label="Disbursement Notes" help="Optional notes about this disbursement"><TextArea rows={3} placeholder="Enter notes..." showCount maxLength={300} /></Form.Item>
                            <Form.Item>
                                <Space>
                                    <Button onClick={() => { setDisbursementModalVisible(false); setSelectedRequisition(null); disbursementForm.resetFields(); setDisbursementAmount(0); }}>Cancel</Button>
                                    <Button type="primary" htmlType="submit" loading={loading} icon={<SendOutlined />} size="large" disabled={!disbursementAmount || disbursementAmount <= 0}>{loading ? 'Processing...' : `Disburse XAF ${disbursementAmount.toLocaleString()}`}</Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                )}
            </Modal>

            {/* Requisition Details Modal */}
            <Modal
                title={<Space><FileTextOutlined />Purchase Requisition Details<Tooltip title="Refresh Data"><Button size="small" icon={<ReloadOutlined />} onClick={async () => { try { setLoading(true); await fetchRequisitions(); message.success('Data refreshed'); } finally { setLoading(false); } }} /></Tooltip></Space>}
                open={detailsModalVisible}
                onCancel={() => { setDetailsModalVisible(false); setSelectedRequisition(null); }}
                footer={null}
                width={900}
            >
                {selectedRequisition && (
                    <div>
                        <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
                            <Descriptions.Item label="Requisition ID" span={2}><Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text></Descriptions.Item>
                            <Descriptions.Item label="Title" span={2}><Text strong>{selectedRequisition.title}</Text></Descriptions.Item>
                            <Descriptions.Item label="Employee"><Text>{selectedRequisition.employee?.fullName}</Text></Descriptions.Item>
                            <Descriptions.Item label="Department"><Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Category"><Tag color="green">{selectedRequisition.itemCategory}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Priority"><Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>{selectedRequisition.urgency}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Total Budget"><Text strong style={{ color: '#1890ff' }}>XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}</Text></Descriptions.Item>
                            <Descriptions.Item label="Expected Date">{selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}</Descriptions.Item>
                            <Descriptions.Item label="Status" span={2}>{getStatusTag(selectedRequisition.status)}</Descriptions.Item>
                        </Descriptions>

                        {(selectedRequisition.status === 'approved' || selectedRequisition.status === 'partially_disbursed' || selectedRequisition.status === 'fully_disbursed') && (
                            <Card size="small" title={<Space><SendOutlined /><Text strong>Disbursement Status</Text>{selectedRequisition.remainingBalance > 0 ? <Tag color="orange">Partial Payment</Tag> : <Tag color="success">Fully Paid</Tag>}</Space>} style={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}>
                                <Row gutter={16} style={{ marginBottom: '16px' }}>
                                    <Col span={6}><Statistic title="Total Budget" value={selectedRequisition.budgetXAF || 0} prefix="XAF" /></Col>
                                    <Col span={6}><Statistic title="Already Disbursed" value={selectedRequisition.totalDisbursed || 0} valueStyle={{ color: '#1890ff' }} prefix="XAF" /></Col>
                                    <Col span={6}><Statistic title="Remaining Balance" value={selectedRequisition.remainingBalance || 0} valueStyle={{ color: selectedRequisition.remainingBalance > 0 ? '#cf1322' : '#52c41a' }} prefix="XAF" /></Col>
                                    <Col span={6}><Statistic title="Progress" value={selectedRequisition.disbursementProgress || 0} suffix="%" /></Col>
                                </Row>
                                <Progress percent={selectedRequisition.disbursementProgress || 0} status={selectedRequisition.disbursementProgress === 100 ? 'success' : 'active'} />
                                {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
                                    <>
                                        <Divider style={{ margin: '16px 0' }} />
                                        <Text strong>Payment History ({selectedRequisition.disbursements.length})</Text>
                                        <Timeline mode="left" style={{ marginTop: '12px' }}>
                                            {selectedRequisition.disbursements.map((d, i) => (
                                                <Timeline.Item key={i} color={d.acknowledged ? 'green' : i === selectedRequisition.disbursements.length - 1 ? 'blue' : 'gray'} dot={d.acknowledged ? <CheckCircleOutlined /> : <DollarOutlined />}>
                                                    <div style={{ fontSize: '12px' }}>
                                                        <Space><Text strong>Payment #{d.disbursementNumber}</Text>{d.acknowledged ? <Tag color="success" size="small"><CheckCircleOutlined /> Acknowledged</Tag> : <Tag color="warning" size="small"><ClockCircleOutlined /> Awaiting Acknowledgment</Tag>}</Space><br />
                                                        <Text type="secondary"><ClockCircleOutlined /> {new Date(d.date).toLocaleString('en-GB')}</Text><br />
                                                        <Text strong style={{ color: '#1890ff' }}>XAF {d.amount?.toLocaleString()}</Text>
                                                        {d.acknowledged && <><br /><Text type="success" style={{ fontSize: '11px' }}>✅ Acknowledged: {new Date(d.acknowledgmentDate).toLocaleString('en-GB')}</Text></>}
                                                        {d.notes && <><br /><Text italic style={{ fontSize: '11px' }}>"{d.notes}"</Text></>}
                                                    </div>
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    </>
                                )}
                                {selectedRequisition.remainingBalance > 0 && (selectedRequisition.status === 'approved' || selectedRequisition.status === 'partially_disbursed') && (
                                    <Alert message="Action Required" description={`This requisition still has XAF ${selectedRequisition.remainingBalance.toLocaleString()} remaining.`} type="warning" showIcon style={{ marginTop: '12px' }} action={<Button size="small" type="primary" onClick={() => { setDetailsModalVisible(false); handleStartDisbursement(selectedRequisition); }}>Disburse Now</Button>} />
                                )}
                            </Card>
                        )}

                        {selectedRequisition.budgetCodeInfo && (
                            <Card size="small" title="Budget Code Information" style={{ marginBottom: '20px' }}>
                                <Descriptions column={2} size="small">
                                    <Descriptions.Item label="Budget Code"><Tag color="gold"><TagOutlined /> {selectedRequisition.budgetCodeInfo.code}</Tag></Descriptions.Item>
                                    <Descriptions.Item label="Budget Name"><Text>{selectedRequisition.budgetCodeInfo.name}</Text></Descriptions.Item>
                                    <Descriptions.Item label="Department"><Tag color="blue">{selectedRequisition.budgetCodeInfo.department}</Tag></Descriptions.Item>
                                    <Descriptions.Item label="Budget Type"><Text>{selectedRequisition.budgetCodeInfo.budgetType || 'N/A'}</Text></Descriptions.Item>
                                    <Descriptions.Item label="Available at Submission"><Text strong>XAF {selectedRequisition.budgetCodeInfo.availableAtSubmission?.toLocaleString()}</Text></Descriptions.Item>
                                    <Descriptions.Item label="Submitted Amount"><Text strong style={{ color: '#1890ff' }}>XAF {selectedRequisition.budgetCodeInfo.submittedAmount?.toLocaleString()}</Text></Descriptions.Item>
                                </Descriptions>
                            </Card>
                        )}

                        <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
                            <Table dataSource={selectedRequisition.items || []} pagination={false} size="small" columns={[{ title: 'Description', dataIndex: 'description', key: 'description' }, { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 }, { title: 'Unit', dataIndex: 'measuringUnit', key: 'unit', width: 100 }]} />
                        </Card>

                        {selectedRequisition.attachments && selectedRequisition.attachments.length > 0 && (
                            <AttachmentDisplay attachments={selectedRequisition.attachments} requisitionId={selectedRequisition._id} onDownload={handleDownloadAttachment} loading={downloadingAttachment !== null} title="📎 Attachments" />
                        )}

                        {selectedRequisition.financeVerification && (
                            <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
                                <Descriptions column={2} size="small">
                                    <Descriptions.Item label="Decision"><Tag color={selectedRequisition.financeVerification.decision === 'approved' ? 'green' : 'red'}>{selectedRequisition.financeVerification.decision === 'approved' ? '✅ Approved' : '❌ Rejected'}</Tag></Descriptions.Item>
                                    <Descriptions.Item label="Verification Date">{selectedRequisition.financeVerification.verificationDate ? new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') : 'Pending'}</Descriptions.Item>
                                    {selectedRequisition.financeVerification.comments && <Descriptions.Item label="Comments" span={2}><Text italic>{selectedRequisition.financeVerification.comments}</Text></Descriptions.Item>}
                                </Descriptions>
                            </Card>
                        )}

                        {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
                            <Card size="small" title="Approval Progress">
                                <Timeline>
                                    {selectedRequisition.approvalChain.map((step, index) => {
                                        const color = step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'gray';
                                        const icon = step.status === 'approved' ? <CheckCircleOutlined /> : step.status === 'rejected' ? <CloseCircleOutlined /> : <ClockCircleOutlined />;
                                        return (
                                            <Timeline.Item key={index} color={color} dot={icon}>
                                                <div>
                                                    <Text strong>Level {step.level}: {step.approver.name}</Text><br />
                                                    <Text type="secondary">{step.approver.role} - {step.approver.email}</Text><br />
                                                    {step.status === 'pending' && <Tag color="orange">Pending Action</Tag>}
                                                    {step.status === 'approved' && <><Tag color="green">Approved</Tag><Text type="secondary"> {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}</Text>{step.comments && <div style={{ marginTop: 4 }}><Text italic>"{step.comments}"</Text></div>}</>}
                                                    {step.status === 'rejected' && <><Tag color="red">Rejected</Tag><Text type="secondary"> {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}</Text>{step.comments && <div style={{ marginTop: 4, color: '#ff4d4f' }}><Text>Reason: "{step.comments}"</Text></div>}</>}
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









// import React, { useState, useEffect } from 'react';
// import {
//     Card,
//     Table,
//     Button,
//     Modal,
//     Form,
//     Typography,
//     Tag,
//     Space,
//     Input,
//     Select,
//     InputNumber,
//     Descriptions,
//     Alert,
//     Spin,
//     message,
//     Badge,
//     Timeline,
//     Row,
//     Col,
//     Statistic,
//     Divider,
//     Tooltip,
//     Switch,
//     Tabs,
//     DatePicker,
//     Progress,
//     List
// } from 'antd';
// import {
//     ClockCircleOutlined,
//     FileTextOutlined,
//     BankOutlined,
//     TagOutlined,
//     ShoppingCartOutlined,
//     ReloadOutlined,
//     EyeOutlined,
//     AuditOutlined,
//     CheckCircleOutlined,
//     CloseCircleOutlined,
//     SendOutlined,
//     PlusOutlined,
//     EditOutlined,
//     DeleteOutlined,
//     DollarOutlined,
//     CalendarOutlined,
//     ContactsOutlined,
//     BarChartOutlined,
//     TeamOutlined,
//     WarningOutlined,
//     InfoCircleOutlined,
//     PaperClipOutlined,
//     DownloadOutlined,
//     FilePdfOutlined,
//     FileImageOutlined,
//     FileWordOutlined,
//     FileExcelOutlined,
//     FileUnknownOutlined
// } from '@ant-design/icons';
// import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
// import AttachmentDisplay from '../../components/AttachmentDisplay';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { TabPane } = Tabs;


// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// const makeAuthenticatedRequest = async (url, options = {}) => {
//   const token = localStorage.getItem('token');
  
//   const defaultHeaders = {
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${token}`,
//   };

//   const config = {
//     ...options,
//     headers: {
//       ...defaultHeaders,
//       ...options.headers,
//     },
//   };

//   const response = await fetch(url, config);
  
//   if (!response.ok) {
//     const errorData = await response.json().catch(() => ({}));
//     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//   }

//   return await response.json();
// };

// const FinancePurchaseRequisitions = () => {
//     const [requisitions, setRequisitions] = useState([]);
//     const [budgetCodes, setBudgetCodes] = useState([]);
//     const [projects, setProjects] = useState([]);
//     const [budgetOwners, setBudgetOwners] = useState([]);
//     const [loadingProjects, setLoadingProjects] = useState(false);
//     const [loadingBudgetOwners, setLoadingBudgetOwners] = useState(false);
//     const [loading, setLoading] = useState(false);
//     const [verificationModalVisible, setVerificationModalVisible] = useState(false);
//     const [detailsModalVisible, setDetailsModalVisible] = useState(false);
//     const [disbursementModalVisible, setDisbursementModalVisible] = useState(false); // ✅ NEW
//     const [budgetCodeModalVisible, setBudgetCodeModalVisible] = useState(false);
//     const [budgetCodeApprovalModalVisible, setBudgetCodeApprovalModalVisible] = useState(false);
//     const [budgetCodeDetailsModalVisible, setBudgetCodeDetailsModalVisible] = useState(false);
//     const [selectedRequisition, setSelectedRequisition] = useState(null);
//     const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
//     const [selectedBudgetCodeForApproval, setSelectedBudgetCodeForApproval] = useState(null);
//     const [activeTab, setActiveTab] = useState('pending');
//     const [mainSection, setMainSection] = useState('requisitions');
//     const [disbursementAmount, setDisbursementAmount] = useState(0); // ✅ NEW
//     const [downloadingAttachment, setDownloadingAttachment] = useState(null);
//     const [acknowledgmentModalVisible, setAcknowledgmentModalVisible] = useState(false); // ✅ ADD THIS
//     const [selectedDisbursement, setSelectedDisbursement] = useState(null); // ✅ ADD THIS
//     const [acknowledgmentForm] = Form.useForm();
//     const [stats, setStats] = useState({ 
//         pending: 0, 
//         verified: 0, 
//         rejected: 0, 
//         total: 0,
//         totalBudgetAllocated: 0,
//         budgetUtilization: 0,
//         pendingDisbursement: 0, 
//         partiallyDisbursed: 0    
//     });
//     const [form] = Form.useForm();
//     const [disbursementForm] = Form.useForm(); 
//     const [budgetCodeForm] = Form.useForm();
//     const [budgetCodeApprovalForm] = Form.useForm();
//     const [editingBudgetCode, setEditingBudgetCode] = useState(null);

//     useEffect(() => {
//         fetchRequisitions();
//         fetchStats();
//         fetchBudgetCodes();
//         fetchProjects();
//     }, []);

//     useEffect(() => {
//         if (activeTab === 'disbursement' || activeTab === 'fully_disbursed') {
//             fetchRequisitions(); 
//         }
//     }, [activeTab]);

//     const fetchRequisitions = async () => {
//         try {
//             setLoading(true);
//             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance`);
            
//             if (response.success && response.data) {
//                 console.log('✅ Finance requisitions:', {
//                     total: response.data.length,
//                     pending: response.data.filter(r => r.isAwaitingFinance).length,
//                     approved: response.data.filter(r => r.financeHasActed).length,
//                     statuses: response.data.map(r => ({
//                         id: r.requisitionNumber,
//                         status: r.status,
//                         awaitingFinance: r.isAwaitingFinance
//                     }))
//                 });
//                 setRequisitions(response.data);
//             } else {
//                 setRequisitions([]);
//             }
//         } catch (error) {
//             console.error('Error fetching finance requisitions:', error);
//             message.error('Failed to fetch requisitions');
//             setRequisitions([]);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const fetchStats = async () => {
//         try {
//             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance/dashboard-data`);
            
//             if (response.success && response.data) {
//                 const financeData = response.data;
                
//                 // ✅ UPDATED: Include disbursement stats
//                 setStats({
//                     pending: financeData.statistics?.pendingVerification || 0,
//                     verified: financeData.statistics?.approvedThisMonth || 0,
//                     rejected: financeData.statistics?.rejectedThisMonth || 0,
//                     total: financeData.totalRequisitions || 0,
//                     totalBudgetAllocated: financeData.statistics?.totalValue || 0,
//                     budgetUtilization: response.data.finance?.overallUtilization || 0,
//                     pendingDisbursement: financeData.statistics?.pendingDisbursement || 0,
//                     partiallyDisbursed: financeData.statistics?.partiallyDisbursed || 0
//                 });
//             }
//         } catch (error) {
//             console.error('Error fetching stats:', error);
//         }
//     };

//     const fetchBudgetCodes = async () => {
//         try {
//             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`);
//             if (response.success) {
//                 setBudgetCodes(response.data);
//             }
//         } catch (error) {
//             console.error('Error fetching budget codes:', error);
//         }
//     };

//     const fetchProjects = async () => {
//         try {
//             setLoadingProjects(true);
//             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/projects/active`);
//             if (response.success) {
//                 setProjects(response.data);
//             }
//         } catch (error) {
//             console.error('Error fetching projects:', error);
//             setProjects([]);
//         } finally {
//             setLoadingProjects(false);
//         }
//     };

//     // Calculate tab-specific counts
//     const pendingCount = requisitions.filter(r => 
//         r.isAwaitingFinance || r.status === 'pending_finance_verification'
//     ).length;

//     const approvedCount = requisitions.filter(r => 
//         r.financeVerification?.decision === 'approved' ||
//         r.financeHasActed === true
//     ).length;

//     const disbursementCount = requisitions.filter(r => 
//         r.status === 'approved' || r.status === 'partially_disbursed'
//     ).length;

//     const rejectedCount = requisitions.filter(r => 
//         r.financeVerification?.decision === 'rejected' ||
//         r.financeApprovalStep?.status === 'rejected'
//     ).length;

//     const fullyDisbursedCount = requisitions.filter(r => 
//         r.status === 'fully_disbursed'
//     ).length;

//     const fetchBudgetOwners = async () => {
//         try {
//             setLoadingBudgetOwners(true);
//             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/active-users`);
            
//             if (response.success && response.data) {
//                 setBudgetOwners(response.data);
//             } else {
//                 setBudgetOwners([]);
//             }
//         } catch (error) {
//             console.error('Error fetching budget owners:', error);
//             setBudgetOwners([]);
//         } finally {
//             setLoadingBudgetOwners(false);
//         }
//     };

//     // ✅ NEW: Simplified verification - only approve/reject based on budget availability
//     const handleVerification = async (values) => {
//         if (!selectedRequisition) return;

//         try {
//             setLoading(true);
            
//             // Simple verification data - only decision and comments
//             const verificationData = {
//                 decision: values.decision,
//                 comments: values.comments
//             };

//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/finance-verification`,
//                 {
//                     method: 'POST',
//                     body: JSON.stringify(verificationData)
//                 }
//             );

//             if (response.success) {
//                 message.success(`Budget verification ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`);
//                 setVerificationModalVisible(false);
//                 setSelectedRequisition(null);
//                 form.resetFields();
//                 fetchRequisitions();
//                 fetchStats();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (error) {
//             message.error(error.message || 'Failed to process verification');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleCreateBudgetCode = async (values) => {
//         try {
//             setLoading(true);
//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/budget-codes`,
//                 {
//                     method: 'POST',
//                     body: JSON.stringify(values)
//                 }
//             );
            
//             if (response.success) {
//                 message.success('Budget code created successfully and sent for approval');
//                 setBudgetCodeModalVisible(false);
//                 budgetCodeForm.resetFields();
//                 fetchBudgetCodes();
//             } else {
//                 message.error(response.message || 'Failed to create budget code');
//             }
//         } catch (error) {
//             message.error(error.message || 'Failed to create budget code');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleUpdateBudgetCode = async (values) => {
//         try {
//             setLoading(true);
//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/budget-codes/${editingBudgetCode._id}`,
//                 {
//                     method: 'PUT',
//                     body: JSON.stringify(values)
//                 }
//             );
            
//             if (response.success) {
//                 message.success('Budget code updated successfully');
//                 setBudgetCodeModalVisible(false);
//                 budgetCodeForm.resetFields();
//                 setEditingBudgetCode(null);
//                 fetchBudgetCodes();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (error) {
//             message.error('Failed to update budget code');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleBudgetCodeApproval = async (values) => {
//         if (!selectedBudgetCodeForApproval) return;

//         try {
//             setLoading(true);
//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/budget-codes/${selectedBudgetCodeForApproval._id}/approve`,
//                 {
//                     method: 'POST',
//                     body: JSON.stringify({
//                         decision: values.decision,
//                         comments: values.comments
//                     })
//                 }
//             );

//             if (response.success) {
//                 message.success(`Budget code ${values.decision} successfully`);
//                 setBudgetCodeApprovalModalVisible(false);
//                 setSelectedBudgetCodeForApproval(null);
//                 budgetCodeApprovalForm.resetFields();
//                 fetchBudgetCodes();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (error) {
//             message.error(error.message || 'Failed to process approval');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ NEW: Handle Disbursement
//     const handleDisbursement = async (values) => {
//         if (!selectedRequisition) return;

//         try {
//             setLoading(true);
            
//             const disbursementData = {
//                 amount: values.amount,
//                 notes: values.notes
//             };

//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/disburse`,
//                 {
//                     method: 'POST',
//                     body: JSON.stringify(disbursementData)
//                 }
//             );

//             if (response.success) {
//                 const isFullyDisbursed = response.disbursement.isFullyDisbursed;
//                 message.success({
//                     content: isFullyDisbursed ? 
//                         'Requisition fully disbursed!' : 
//                         `Partial disbursement #${response.disbursement.number} processed successfully`,
//                     duration: 5
//                 });
                
//                 setDisbursementModalVisible(false);
//                 setSelectedRequisition(null);
//                 disbursementForm.resetFields();
//                 setDisbursementAmount(0);
//                 fetchRequisitions();
//                 fetchStats();
//             } else {
//                 throw new Error(response.message);
//             }
//         } catch (error) {
//             message.error(error.message || 'Failed to process disbursement');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // ✅ NEW: Open Disbursement Modal
//     const handleStartDisbursement = (requisition) => {
//         setSelectedRequisition(requisition);
//         const remainingBalance = requisition.remainingBalance || 
//                                (requisition.budgetXAF - (requisition.totalDisbursed || 0));
//         setDisbursementAmount(remainingBalance);
//         disbursementForm.setFieldsValue({
//             amount: remainingBalance,
//             notes: ''
//         });
//         setDisbursementModalVisible(true);
//     };

//     const handleViewDetails = async (requisition) => {
//         try {
//             setLoading(true);
            
//             // ✅ Always fetch fresh data when opening details
//             const response = await makeAuthenticatedRequest(
//                 `${API_BASE_URL}/purchase-requisitions/${requisition._id}`
//             );
            
//             if (response.success) {
//                 console.log('📋 Fresh requisition data:', response.data);
//                 setSelectedRequisition(response.data);
//                 setDetailsModalVisible(true);
//             } else {
//                 message.error('Failed to fetch requisition details');
//             }
//         } catch (error) {
//             console.error('Error fetching details:', error);
//             message.error('Failed to load requisition details');
//         } finally {
//             setLoading(false);
//         }
//     };

//     // const handleViewDetails = (requisition) => {
//     //     setSelectedRequisition(requisition);
//     //     setDetailsModalVisible(true);
//     // };

//     // ✅ NEW: Initialize form with pre-selected budget code (read-only)
//     const handleStartVerification = (requisition) => {
//         setSelectedRequisition(requisition);
        
//         // Set form with pre-selected budget code and current availability
//         form.setFieldsValue({
//             decision: 'approved',
//             comments: ''
//         });
        
//         setVerificationModalVisible(true);
//     };

//     const openBudgetCodeModal = (budgetCode = null) => {
//         setEditingBudgetCode(budgetCode);
//         if (budgetCode) {
//             budgetCodeForm.setFieldsValue(budgetCode);
//         } else {
//             budgetCodeForm.resetFields();
//         }
//         setBudgetCodeModalVisible(true);
        
//         if (projects.length === 0) {
//             fetchProjects();
//         }
        
//         if (budgetOwners.length === 0) {
//             fetchBudgetOwners();
//         }
//     };

//     const openBudgetCodeApprovalModal = (budgetCode) => {
//         setSelectedBudgetCodeForApproval(budgetCode);
//         budgetCodeApprovalForm.resetFields();
//         setBudgetCodeApprovalModalVisible(true);
//     };

//     const viewBudgetCodeDetails = (budgetCode) => {
//         setSelectedBudgetCode(budgetCode);
//         setBudgetCodeDetailsModalVisible(true);
//     };

//     // const getStatusTag = (status) => {
//     //     const statusMap = {
//     //         'pending_finance_verification': { color: 'orange', text: 'Pending Verification', icon: <ClockCircleOutlined /> },
//     //         'pending_supply_chain_review': { color: 'blue', text: 'Finance Approved', icon: <CheckCircleOutlined /> },
//     //         'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
//     //         'rejected': { color: 'red', text: 'Budget Rejected', icon: <CloseCircleOutlined /> },
//     //         'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
//     //         'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
//     //     };

//     //     const config = statusMap[status] || { color: 'default', text: status, icon: null };
//     //     return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//     // };

//     const getStatusTag = (status) => {
//         const statusMap = {
//             'pending_finance_verification': { color: 'orange', text: 'Pending Verification', icon: <ClockCircleOutlined /> },
//             'pending_supply_chain_review': { color: 'blue', text: 'Finance Approved', icon: <CheckCircleOutlined /> },
//             'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
//             'rejected': { color: 'red', text: 'Budget Rejected', icon: <CloseCircleOutlined /> },
//             'approved': { color: 'green', text: 'Ready for Disbursement', icon: <DollarOutlined /> }, // ✅ UPDATED
//             'partially_disbursed': { color: 'cyan', text: 'Partially Disbursed', icon: <SendOutlined /> }, // ✅ NEW
//             'fully_disbursed': { color: 'green', text: 'Fully Disbursed', icon: <CheckCircleOutlined /> }, // ✅ NEW
//             'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
//         };

//         const config = statusMap[status] || { color: 'default', text: status, icon: null };
//         return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
//     };

//     const getBudgetCodeStatusTag = (status) => {
//         const statusMap = {
//             'pending': { color: 'default', text: 'Pending' },
//             'pending_departmental_head': { color: 'orange', text: 'Pending Dept Head' },
//             'pending_head_of_business': { color: 'gold', text: 'Pending HOB' },
//             'pending_finance': { color: 'blue', text: 'Pending Finance' },
//             'active': { color: 'green', text: 'Active' },
//             'rejected': { color: 'red', text: 'Rejected' },
//             'suspended': { color: 'red', text: 'Suspended' },
//             'expired': { color: 'default', text: 'Expired' }
//         };

//         const config = statusMap[status] || { color: 'default', text: status };
//         return <Tag color={config.color}>{config.text}</Tag>;
//     };

//     const getBudgetCodeStatus = (budgetCode) => {
//         const utilizationRate = (budgetCode.used / budgetCode.budget) * 100;
//         if (utilizationRate >= 90) return { color: 'red', text: 'Critical' };
//         if (utilizationRate >= 75) return { color: 'orange', text: 'High' };
//         if (utilizationRate >= 50) return { color: 'blue', text: 'Moderate' };
//         return { color: 'green', text: 'Low' };
//     };

//     // Add these helper functions before the return statement
//     const getFileIcon = (mimetype) => {
//         if (!mimetype) return <FileUnknownOutlined />;
        
//         if (mimetype.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
//         if (mimetype.includes('image')) return <FileImageOutlined style={{ color: '#52c41a' }} />;
//         if (mimetype.includes('word') || mimetype.includes('document')) return <FileWordOutlined style={{ color: '#1890ff' }} />;
//         if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return <FileExcelOutlined style={{ color: '#52c41a' }} />;
        
//         return <FileUnknownOutlined />;
//     };

//     const formatFileSize = (bytes) => {
//     if (!bytes) return 'Unknown size';
//     if (bytes < 1024) return bytes + ' B';
//     if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
//     return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
// };

// const canPreviewFile = (mimetype) => {
//     if (!mimetype) return false;
//     return mimetype.includes('pdf') || mimetype.includes('image');
// };

// const handleDownloadAttachment = async (attachment) => {
//     if (!selectedRequisition?._id || !attachment._id) {
//         message.error('Invalid attachment information');
//         return;
//     }

//     setDownloadingAttachment(attachment._id);

//     try {
//         const token = localStorage.getItem('token');

//         console.log('📥 Downloading attachment:', {
//             requisitionId: selectedRequisition._id,
//             attachmentId: attachment._id,
//             name: attachment.name
//         });

//         const response = await fetch(
//             `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/download`,
//             {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             }
//         );

//         if (!response.ok) {
//             const error = await response.json();
//             throw new Error(error.message || 'Failed to download file');
//         }

//         const contentDisposition = response.headers.get('Content-Disposition');
//         let filename = attachment.name || 'attachment';
        
//         if (contentDisposition) {
//             const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
//             if (filenameMatch) {
//                 filename = filenameMatch[1];
//             }
//         }

//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const link = document.createElement('a');
//         link.href = url;
//         link.download = filename;
//         document.body.appendChild(link);
//         link.click();
//         document.body.removeChild(link);
//         window.URL.revokeObjectURL(url);

//         message.success(`Downloaded: ${filename}`);
//     } catch (error) {
//         console.error('❌ Download error:', error);
//         message.error(error.message || 'Failed to download attachment');
//     } finally {
//         setDownloadingAttachment(null);
//     }
// };

// const handlePreviewAttachment = async (attachment) => {
//     if (!selectedRequisition?._id || !attachment._id) {
//         message.error('Invalid attachment information');
//         return;
//     }

//     if (!canPreviewFile(attachment.mimetype)) {
//         message.info('This file type cannot be previewed. Downloading instead...');
//         handleDownloadAttachment(attachment);
//         return;
//     }

//     try {
//         const token = localStorage.getItem('token');

//         window.open(
//             `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/preview?token=${token}`,
//             '_blank'
//         );
//     } catch (error) {
//         console.error('❌ Preview error:', error);
//         message.error('Failed to preview attachment');
//     }
// };

// //     const getFilteredRequisitions = () => {
// //     if (!Array.isArray(requisitions) || requisitions.length === 0) {
// //         return [];
// //     }
    
// //     let filtered = [];
    
// //     switch (activeTab) {
// //         case 'pending':
// //             // ✅ FIXED: Show requisitions awaiting finance action
// //             filtered = requisitions.filter(r => {
// //                 // Check if finance step is pending
// //                 if (r.isAwaitingFinance) {
// //                     return true;
// //                 }
                
// //                 // Also check status
// //                 if (r.status === 'pending_finance_verification') {
// //                     return true;
// //                 }
                
// //                 return false;
// //             });
// //             break;
            
// //         case 'approved':
// //             // ✅ FIXED: Show requisitions finance has approved
// //             filtered = requisitions.filter(r => 
// //                 r.financeVerification?.decision === 'approved' ||
// //                 r.financeHasActed === true ||
// //                 ['pending_supply_chain_review', 'pending_head_approval', 'approved', 
// //                  'in_procurement', 'completed', 'delivered', 'procurement_complete',
// //                  'partially_disbursed', 'fully_disbursed'].includes(r.status)
// //             );
// //             break;
            
// //         case 'disbursement':
// //             // ✅ Show requisitions ready for disbursement
// //             filtered = requisitions.filter(r => 
// //                 r.status === 'approved' || 
// //                 r.status === 'partially_disbursed'
// //             );
// //             break;
            
// //         case 'rejected':
// //             // ✅ FIXED: Show requisitions finance has rejected
// //             filtered = requisitions.filter(r => 
// //                 r.financeVerification?.decision === 'rejected' ||
// //                 (r.financeApprovalStep?.status === 'rejected')
// //             );
// //             break;
            
// //         case 'all':
// //         default:
// //             // ✅ Show all requisitions finance has access to
// //             filtered = requisitions;
// //             break;
// //     }
    
// //     console.log(`Tab: ${activeTab}, Filtered: ${filtered.length} requisitions`);
// //     return filtered;
// // };


// const getFilteredRequisitions = () => {
//     if (!Array.isArray(requisitions) || requisitions.length === 0) {
//         return [];
//     }
    
//     let filtered = [];
    
//     switch (activeTab) {
//         case 'pending':
//             // Show requisitions awaiting finance action
//             filtered = requisitions.filter(r => {
//                 if (r.isAwaitingFinance) {
//                     return true;
//                 }
//                 if (r.status === 'pending_finance_verification') {
//                     return true;
//                 }
//                 return false;
//             });
//             break;
            
//         case 'approved':
//             // Show requisitions finance has approved
//             filtered = requisitions.filter(r => 
//                 r.financeVerification?.decision === 'approved' ||
//                 r.financeHasActed === true ||
//                 ['pending_supply_chain_review', 'pending_head_approval', 'approved', 
//                  'in_procurement', 'completed', 'delivered', 'procurement_complete',
//                  'partially_disbursed', 'fully_disbursed'].includes(r.status)
//             );
//             break;
            
//         case 'disbursement':
//             // Show requisitions ready for disbursement
//             filtered = requisitions.filter(r => 
//                 r.status === 'approved' || 
//                 r.status === 'partially_disbursed'
//             );
//             break;
        
//         // ✅ NEW: Fully Disbursed Tab
//         case 'fully_disbursed':
//             filtered = requisitions.filter(r => 
//                 r.status === 'fully_disbursed'
//             );
//             break;
            
//         case 'rejected':
//             // Show requisitions finance has rejected
//             filtered = requisitions.filter(r => 
//                 r.financeVerification?.decision === 'rejected' ||
//                 (r.financeApprovalStep?.status === 'rejected')
//             );
//             break;
            
//         case 'all':
//         default:
//             // Show all requisitions finance has access to
//             filtered = requisitions;
//             break;
//     }
    
//     console.log(`Tab: ${activeTab}, Filtered: ${filtered.length} requisitions`);
//     return filtered;
// };


//     const requisitionColumns = [
//         {
//             title: 'Requisition Details',
//             key: 'requisition',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.title || 'No Title'}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.requisitionNumber || `REQ-${record._id?.slice(-6)?.toUpperCase()}`}
//                     </Text>
//                     <br />
//                     <Tag size="small" color="blue">{record.itemCategory || 'N/A'}</Tag>
//                     {record.budgetCodeInfo?.code && (
//                         <Tag size="small" color="gold">
//                             <TagOutlined /> {record.budgetCodeInfo.code}
//                         </Tag>
//                     )}
//                 </div>
//             ),
//             width: 220
//         },
//         {
//             title: 'Employee',
//             key: 'employee',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>{record.employee?.fullName || 'N/A'}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                         {record.employee?.department || record.department || 'N/A'}
//                     </Text>
//                 </div>
//             ),
//             width: 150
//         },
//         {
//             title: 'Budget & Disbursement', // ✅ UPDATED
//             key: 'budget',
//             render: (_, record) => {
//                 const totalBudget = record.budgetXAF || 0;
//                 const disbursed = record.totalDisbursed || 0;
//                 const remaining = record.remainingBalance || (totalBudget - disbursed);
//                 const progress = totalBudget > 0 ? Math.round((disbursed / totalBudget) * 100) : 0;

//                 return (
//                     <div>
//                         <Text strong style={{ color: '#1890ff' }}>
//                             XAF {totalBudget.toLocaleString()}
//                         </Text>
//                         <br />
//                         {/* ✅ NEW: Show disbursement progress */}
//                         {(record.status === 'approved' || record.status === 'partially_disbursed' || record.status === 'fully_disbursed') && (
//                             <>
//                                 <Progress 
//                                     percent={progress} 
//                                     size="small"
//                                     status={progress === 100 ? 'success' : 'active'}
//                                     strokeColor={progress === 100 ? '#52c41a' : '#1890ff'}
//                                 />
//                                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                                     Disbursed: XAF {disbursed.toLocaleString()}
//                                 </Text>
//                                 {remaining > 0 && (
//                                     <>
//                                         <br />
//                                         <Text type="danger" style={{ fontSize: '11px' }}>
//                                             Remaining: XAF {remaining.toLocaleString()}
//                                         </Text>
//                                     </>
//                                 )}
//                             </>
//                         )}
//                     </div>
//                 );
//             },
//             width: 180,
//             sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0)
//         },
//         {
//             title: 'Items Count',
//             dataIndex: 'items',
//             key: 'items',
//             render: (items) => (
//                 <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
//                     <ShoppingCartOutlined style={{ fontSize: '18px' }} />
//                 </Badge>
//             ),
//             width: 80,
//             align: 'center'
//         },
//         {
//             title: 'Priority',
//             dataIndex: 'urgency',
//             key: 'urgency',
//             render: (urgency) => {
//                 const urgencyColors = {
//                     'Low': 'green',
//                     'Medium': 'orange',
//                     'High': 'red'
//                 };
//                 return <Tag color={urgencyColors[urgency] || 'default'}>{urgency || 'N/A'}</Tag>;
//             },
//             width: 80
//         },
//         {
//             title: 'Expected Date',
//             dataIndex: 'expectedDate',
//             key: 'expectedDate',
//             render: (date) => {
//                 if (!date) return 'N/A';
//                 const expectedDate = new Date(date);
//                 const today = new Date();
//                 const daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
                
//                 return (
//                     <div>
//                         <Text>{expectedDate.toLocaleDateString('en-GB')}</Text>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '11px' }}>
//                             {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
//                         </Text>
//                     </div>
//                 );
//             },
//             width: 100,
//             sorter: (a, b) => new Date(a.expectedDate) - new Date(b.expectedDate)
//         },
//         {
//             title: 'Status',
//             dataIndex: 'status',
//             key: 'status',
//             render: (status) => getStatusTag(status),
//             width: 150
//         },

//         // {
//         //     title: 'Actions',
//         //     key: 'actions',
//         //     render: (_, record) => (
//         //         <Space size="small">
//         //             <Tooltip title="View Details">
//         //                 <Button
//         //                     size="small"
//         //                     icon={<EyeOutlined />}
//         //                     onClick={() => handleViewDetails(record)}
//         //                 />
//         //             </Tooltip>
//         //             {/* ✅ FIXED: Show verify button based on isAwaitingFinance flag */}
//         //             {(record.isAwaitingFinance || 
//         //             record.status === 'pending_finance_verification' ||
//         //             record.financeVerification?.decision === 'pending') && (
//         //                 <Tooltip title="Verify Budget">
//         //                     <Button
//         //                         size="small"
//         //                         type="primary"
//         //                         icon={<AuditOutlined />}
//         //                         onClick={() => handleStartVerification(record)}
//         //                     >
//         //                         Verify
//         //                     </Button>
//         //                 </Tooltip>
//         //             )}
//         //         </Space>
//         //     ),
//         //     width: 100,
//         //     fixed: 'right'
//         // }

//         {
//     title: 'Actions',
//     key: 'actions',
//     render: (_, record) => {
//         // ✅ Calculate remaining balance on frontend if not provided
//         const totalBudget = record.budgetXAF || 0;
//         const disbursed = record.totalDisbursed || 0;
//         const remainingBalance = record.remainingBalance ?? (totalBudget - disbursed);

//         // ✅ DEBUG: Log to see what's happening
//         console.log('🔍 Actions render:', {
//             id: record.requisitionNumber,
//             status: record.status,
//             remainingBalance,
//             totalBudget,
//             disbursed,
//             shouldShowDisburse: (record.status === 'approved' || record.status === 'partially_disbursed') && remainingBalance > 0
//         });

//         return (
//             <Space size="small">
//                 <Tooltip title="View Details">
//                     <Button
//                         size="small"
//                         icon={<EyeOutlined />}
//                         onClick={() => handleViewDetails(record)}
//                     />
//                 </Tooltip>
//                 {/* ✅ Show verify button based on isAwaitingFinance flag */}
//                 {(record.isAwaitingFinance || 
//                   record.status === 'pending_finance_verification' ||
//                   record.financeVerification?.decision === 'pending') && (
//                     <Tooltip title="Verify Budget">
//                         <Button
//                             size="small"
//                             type="primary"
//                             icon={<AuditOutlined />}
//                             onClick={() => handleStartVerification(record)}
//                         >
//                             Verify
//                         </Button>
//                     </Tooltip>
//                 )}
//                 {/* ✅ Show disburse button - SIMPLIFIED condition */}
//                 {((record.status === 'approved' || record.status === 'partially_disbursed') && 
//                   remainingBalance > 0) && (
//                     <Tooltip title="Process Disbursement">
//                         <Button
//                             size="small"
//                             type="primary"
//                             icon={<SendOutlined />}
//                             onClick={() => handleStartDisbursement(record)}
//                             style={{ backgroundColor: '#52c41a' }}
//                         >
//                             Disburse
//                         </Button>
//                     </Tooltip>
//                 )}
//             </Space>
//         );
//     },
//     width: 150,
//     fixed: 'right'
// }
//     ];

//     const budgetCodeColumns = [
//         {
//             title: 'Budget Code',
//             dataIndex: 'code',
//             key: 'code',
//             render: (code, record) => (
//                 <div>
//                     <Text strong code>{code}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
//                 </div>
//             )
//         },
//         {
//             title: 'Budget Allocation',
//             key: 'budget',
//             render: (_, record) => (
//                 <div>
//                     <Text strong>XAF {record.budget.toLocaleString()}</Text>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '11px' }}>
//                         Used: XAF {record.used.toLocaleString()}
//                     </Text>
//                 </div>
//             )
//         },
//         {
//             title: 'Utilization',
//             key: 'utilization',
//             render: (_, record) => {
//                 const percentage = Math.round((record.used / record.budget) * 100);
//                 const status = getBudgetCodeStatus(record);
//                 return (
//                     <div>
//                         <Progress 
//                             percent={percentage} 
//                             size="small" 
//                             status={status.color === 'red' ? 'exception' : status.color === 'orange' ? 'active' : 'success'}
//                         />
//                         <Text type="secondary" style={{ fontSize: '11px' }}>
//                             {percentage}% utilized
//                         </Text>
//                     </div>
//                 );
//             }
//         },
//         {
//             title: 'Status',
//             dataIndex: 'status',
//             key: 'status',
//             render: (status) => getBudgetCodeStatusTag(status)
//         },
//         {
//             title: 'Actions',
//             key: 'actions',
//             render: (_, record) => (
//                 <Space size="small">
//                     <Button
//                         size="small"
//                         icon={<EyeOutlined />}
//                         onClick={() => viewBudgetCodeDetails(record)}
//                     >
//                         View
//                     </Button>
//                     {record.status !== 'active' && record.status !== 'rejected' && (
//                         <Button 
//                             size="small" 
//                             type="primary"
//                             onClick={() => openBudgetCodeApprovalModal(record)}
//                         >
//                             Review
//                         </Button>
//                     )}
//                     {(record.status === 'active' || record.status === 'rejected') && (
//                         <Button
//                             size="small"
//                             icon={<EditOutlined />}
//                             onClick={() => openBudgetCodeModal(record)}
//                         >
//                             Edit
//                         </Button>
//                     )}
//                 </Space>
//             )
//         }
//     ];

//     // ✅ NEW: Calculate budget status for verification modal
//     const getBudgetVerificationStatus = (requisition) => {
//         if (!requisition?.budgetCode || !requisition?.budgetCodeInfo) {
//             return null;
//         }

//         const budgetCode = budgetCodes.find(bc => bc._id === requisition.budgetCode);
//         if (!budgetCode) return null;

//         const currentAvailable = budgetCode.budget - budgetCode.used;
//         const requiredAmount = requisition.budgetXAF || 0;
//         const isSufficient = currentAvailable >= requiredAmount;

//         return {
//             code: budgetCode.code,
//             name: budgetCode.name,
//             department: budgetCode.department,
//             totalBudget: budgetCode.budget,
//             used: budgetCode.used,
//             currentAvailable: currentAvailable,
//             requiredAmount: requiredAmount,
//             isSufficient: isSufficient,
//             submissionAvailable: requisition.budgetCodeInfo.availableAtSubmission,
//             remainingAfter: currentAvailable - requiredAmount,
//             utilizationRate: Math.round((budgetCode.used / budgetCode.budget) * 100)
//         };
//     };

//     const renderAttachments = () => {
//     if (!selectedRequisition?.attachments || selectedRequisition.attachments.length === 0) {
//         return null;
//     }

//     return (
//         <Card 
//             size="small" 
//             title={
//                 <Space>
//                     <PaperClipOutlined />
//                     Attachments ({selectedRequisition.attachments.length})
//                 </Space>
//             } 
//             style={{ marginBottom: '16px' }}
//         >
//             <List
//                 dataSource={selectedRequisition.attachments}
//                 renderItem={(attachment) => (
//                     <List.Item
//                         key={attachment._id}
//                         actions={[
//                             canPreviewFile(attachment.mimetype) && (
//                                 <Tooltip title="Preview">
//                                     <Button
//                                         size="small"
//                                         type="link"
//                                         icon={<EyeOutlined />}
//                                         onClick={() => handlePreviewAttachment(attachment)}
//                                     >
//                                         Preview
//                                     </Button>
//                                 </Tooltip>
//                             ),
//                             <Tooltip title="Download">
//                                 <Button
//                                     size="small"
//                                     type="link"
//                                     icon={<DownloadOutlined />}
//                                     loading={downloadingAttachment === attachment._id}
//                                     onClick={() => handleDownloadAttachment(attachment)}
//                                 >
//                                     Download
//                                 </Button>
//                             </Tooltip>
//                         ].filter(Boolean)}
//                     >
//                         <List.Item.Meta
//                             avatar={getFileIcon(attachment.mimetype)}
//                             title={
//                                 <Space>
//                                     <Text strong>{attachment.name}</Text>
//                                     {canPreviewFile(attachment.mimetype) && (
//                                         <Tag color="blue" size="small">Can Preview</Tag>
//                                     )}
//                                 </Space>
//                             }
//                             description={
//                                 <Space split="|">
//                                     <Text type="secondary">{formatFileSize(attachment.size)}</Text>
//                                     <Text type="secondary">
//                                         {new Date(attachment.uploadedAt).toLocaleDateString('en-GB')}
//                                     </Text>
//                                 </Space>
//                             }
//                         />
//                     </List.Item>
//                 )}
//             />
//         </Card>
//     );
// };

//     return (
//         <div style={{ padding: '24px' }}>
//              {/* Main Navigation Buttons */}
//             <div style={{ marginBottom: '24px' }}>
//                 <Space size="large">
//                     <Button
//                         type={mainSection === 'requisitions' ? 'primary' : 'default'}
//                         size="large"
//                         icon={<BankOutlined />}
//                         onClick={() => setMainSection('requisitions')}
//                     >
//                         Requisition Management
//                     </Button>
//                     <Button
//                         type={mainSection === 'budgetCodes' ? 'primary' : 'default'}
//                         size="large"
//                         icon={<TagOutlined />}
//                         onClick={() => setMainSection('budgetCodes')}
//                     >
//                         Budget Code Management
//                     </Button>
//                 </Space>
//             </div>

//             {/* Requisition Management Section */}
//             {mainSection === 'requisitions' && (
//                 <Card>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//                         <Title level={2} style={{ margin: 0 }}>
//                             <BankOutlined /> Finance - Purchase Requisition Management
//                         </Title>
//                         <Space>
//                             <Button
//                                 icon={<ReloadOutlined />}
//                                 onClick={() => {
//                                     fetchRequisitions();
//                                     fetchStats();
//                                 }}
//                                 loading={loading}
//                             >
//                                 Refresh
//                             </Button>
//                         </Space>
//                     </div>

//                     {/* ✅ UPDATED: Stats with disbursement info */}
//                     <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
//                         <Row gutter={16}>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Pending Verification"
//                                     value={stats.pending}
//                                     valueStyle={{ color: '#faad14' }}
//                                     prefix={<ClockCircleOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Budget Approved"
//                                     value={stats.verified}
//                                     valueStyle={{ color: '#52c41a' }}
//                                     prefix={<CheckCircleOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Pending Disbursement"
//                                     value={stats.pendingDisbursement}
//                                     valueStyle={{ color: '#1890ff' }}
//                                     prefix={<DollarOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Partially Disbursed"
//                                     value={stats.partiallyDisbursed}
//                                     valueStyle={{ color: '#13c2c2' }}
//                                     prefix={<SendOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Fully Disbursed"
//                                     value={fullyDisbursedCount}
//                                     valueStyle={{ color: '#52c41a' }}
//                                     prefix={<CheckCircleOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Total Allocated"
//                                     value={`XAF ${stats.totalBudgetAllocated.toLocaleString()}`}
//                                     valueStyle={{ color: '#722ed1' }}
//                                     prefix={<BarChartOutlined />}
//                                 />
//                             </Col>
//                             <Col span={4}>
//                                 <Statistic
//                                     title="Utilization"
//                                     value={stats.budgetUtilization}
//                                     suffix="%"
//                                     valueStyle={{ color: '#eb2f96' }}
//                                 />
//                             </Col>
//                         </Row>
//                     </Card>

                   
//                     <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
//                         <TabPane 
//                             tab={
//                                 <Badge count={pendingCount} size="small">
//                                     <span>Pending Verification</span>
//                                 </Badge>
//                             } 
//                             key="pending"
//                         />
//                         <TabPane 
//                             tab={
//                                 <Badge count={disbursementCount} size="small">
//                                     <span><SendOutlined /> Disbursement</span>
//                                 </Badge>
//                             } 
//                             key="disbursement"
//                         />
//                         <TabPane 
//                             tab={
//                                 <Badge count={approvedCount} size="small">
//                                     <span>Approved</span>
//                                 </Badge>
//                             } 
//                             key="approved"
//                         />
//                         <TabPane 
//                             tab={
//                                 <Badge count={fullyDisbursedCount} size="small">
//                                     <span><CheckCircleOutlined /> Fully Disbursed</span>
//                                 </Badge>
//                             } 
//                             key="fully_disbursed"
//                         />
//                         <TabPane 
//                             tab={<span>Rejected ({rejectedCount})</span>}
//                             key="rejected" 
//                         />
//                         <TabPane 
//                             tab={
//                                 <Badge count={requisitions.length} size="small">
//                                     <span>All</span>
//                                 </Badge>
//                             } 
//                             key="all"
//                         />
//                     </Tabs>

//                     <Table
//                         columns={requisitionColumns}
//                         dataSource={getFilteredRequisitions()}
//                         loading={loading}
//                         rowKey="_id"
//                         pagination={{
//                             showSizeChanger: true,
//                             showQuickJumper: true,
//                             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
//                         }}
//                         scroll={{ x: 1300 }}
//                         size="small"
//                     />
//                 </Card>
//             )}

//             {/* Budget Code Management Section */}
//             {mainSection === 'budgetCodes' && (
//                 <Card>
//                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//                     <Title level={2} style={{ margin: 0 }}>
//                         <TagOutlined /> Budget Code Management
//                     </Title>
//                     <Button
//                         type="primary"
//                         icon={<PlusOutlined />}
//                         onClick={() => openBudgetCodeModal()}
//                     >
//                         Create Budget Code
//                     </Button>
//                 </div>

//                 <Alert
//                     message="Budget Code Management"
//                     description="Create and manage budget codes for purchase requisitions. Track budget allocation and utilization across different departments and projects."
//                     type="info"
//                     showIcon
//                     style={{ marginBottom: '16px' }}
//                 />

//                 <Table
//                     columns={budgetCodeColumns}
//                     dataSource={budgetCodes}
//                     loading={loading}
//                     rowKey="_id"
//                     pagination={{
//                         showSizeChanger: true,
//                         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
//                     }}
//                 />
//             </Card>
//         )}

//         {/* ✅ NEW: Simplified Budget Verification Modal */}
//         <Modal
//             title={
//                 <Space>
//                     <AuditOutlined />
//                     Budget Verification - {selectedRequisition?.title}
//                 </Space>
//             }
//             open={verificationModalVisible}
//             onCancel={() => {
//                 setVerificationModalVisible(false);
//                 setSelectedRequisition(null);
//                 form.resetFields();
//             }}
//             footer={null}
//             width={900}
//         >
//             {selectedRequisition && (
//                 <div>
//                     {/* Requisition Summary */}
//                     <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
//                         <Descriptions column={2} size="small">
//                             <Descriptions.Item label="Employee">
//                                 <Text strong>{selectedRequisition.employee?.fullName}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Department">
//                                 <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Category">
//                                 <Tag color="green">{selectedRequisition.itemCategory}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Priority">
//                                 <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
//                                     {selectedRequisition.urgency}
//                                 </Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Requested Budget">
//                                 <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                                     XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
//                                 </Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Expected Date">
//                                 <Text>{new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}</Text>
//                             </Descriptions.Item>
//                         </Descriptions>
//                     </Card>

//                     {/* Business Justification */}
//                     {selectedRequisition.justificationOfPurchase && (
//                         <Card size="small" title="Business Justification" style={{ marginBottom: '20px' }}>
//                             <div style={{ marginBottom: '12px' }}>
//                                 <Text strong>Purchase Justification:</Text>
//                                 <br />
//                                 <Text>{selectedRequisition.justificationOfPurchase}</Text>
//                             </div>
//                             {selectedRequisition.justificationOfPreferredSupplier && (
//                                 <div>
//                                     <Text strong>Preferred Supplier Justification:</Text>
//                                     <br />
//                                     <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
//                                 </div>
//                             )}
//                         </Card>
//                     )}

//                     {/* Attachments Section */}
//                     {renderAttachments()}

//                     {/* Items List */}
//                     <Card size="small" title={`Items Requested (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '20px' }}>
//                         <Table
//                             columns={[
//                                 { title: 'Description', dataIndex: 'description', key: 'description' },
//                                 { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
//                                 { title: 'Unit', dataIndex: 'measuringUnit', key: 'measuringUnit', width: 80, align: 'center' }
//                             ]}
//                             dataSource={selectedRequisition.items || []}
//                             pagination={false}
//                             size="small"
//                             rowKey={(record, index) => index}
//                         />
//                     </Card>

//                     {/* ✅ NEW: Budget Code Information (Read-Only) */}
//                     {(() => {
//                         const budgetStatus = getBudgetVerificationStatus(selectedRequisition);
//                         if (!budgetStatus) {
//                             return (
//                                 <Alert
//                                     message="No Budget Code Selected"
//                                     description="This requisition does not have a budget code assigned. Please ask the employee to resubmit with a budget code."
//                                     type="error"
//                                     showIcon
//                                     style={{ marginBottom: '20px' }}
//                                 />
//                             );
//                         }

//                         return (
//                             <Card 
//                                 size="small" 
//                                 title={
//                                     <Space>
//                                         <TagOutlined />
//                                         Pre-Selected Budget Code (Read-Only)
//                                     </Space>
//                                 }
//                                 style={{ marginBottom: '20px' }}
//                             >
//                                 <Descriptions column={2} size="small" bordered>
//                                     <Descriptions.Item label="Budget Code" span={2}>
//                                         <Text code strong>{budgetStatus.code}</Text> - {budgetStatus.name}
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Department">
//                                         <Tag color="blue">{budgetStatus.department}</Tag>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Total Budget">
//                                         <Text strong>XAF {budgetStatus.totalBudget.toLocaleString()}</Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Used">
//                                         <Text>XAF {budgetStatus.used.toLocaleString()}</Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Current Available">
//                                         <Text strong style={{ color: budgetStatus.isSufficient ? '#52c41a' : '#ff4d4f' }}>
//                                             XAF {budgetStatus.currentAvailable.toLocaleString()}
//                                         </Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Required Amount">
//                                         <Text strong style={{ color: '#1890ff' }}>
//                                             XAF {budgetStatus.requiredAmount.toLocaleString()}
//                                         </Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Utilization Rate">
//                                         <Progress 
//                                             percent={budgetStatus.utilizationRate} 
//                                             size="small"
//                                             status={budgetStatus.utilizationRate >= 90 ? 'exception' : budgetStatus.utilizationRate >= 75 ? 'active' : 'success'}
//                                         />
//                                     </Descriptions.Item>
//                                 </Descriptions>

//                                 {/* Budget Availability Status */}
//                                 <div style={{ marginTop: '16px' }}>
//                                     {budgetStatus.isSufficient ? (
//                                         <Alert
//                                             message={
//                                                 <Space>
//                                                     <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                                                     <Text strong style={{ color: '#52c41a' }}>
//                                                         Sufficient Budget Available
//                                                     </Text>
//                                                 </Space>
//                                             }
//                                             description={
//                                                 <div>
//                                                     <Text>
//                                                         The budget code has sufficient funds to cover this requisition.
//                                                     </Text>
//                                                     <Divider style={{ margin: '8px 0' }} />
//                                                     <Row gutter={16}>
//                                                         <Col span={12}>
//                                                             <Text type="secondary">Available at Submission:</Text>
//                                                             <br />
//                                                             <Text strong>XAF {budgetStatus.submissionAvailable?.toLocaleString()}</Text>
//                                                         </Col>
//                                                         <Col span={12}>
//                                                             <Text type="secondary">Remaining After Approval:</Text>
//                                                             <br />
//                                                             <Text strong style={{ color: '#52c41a' }}>
//                                                                 XAF {budgetStatus.remainingAfter.toLocaleString()}
//                                                             </Text>
//                                                         </Col>
//                                                     </Row>
//                                                 </div>
//                                             }
//                                             type="success"
//                                             showIcon
//                                         />
//                                     ) : (
//                                         <Alert
//                                             message={
//                                                 <Space>
//                                                     <WarningOutlined style={{ color: '#ff4d4f' }} />
//                                                     <Text strong style={{ color: '#ff4d4f' }}>
//                                                         Insufficient Budget
//                                                     </Text>
//                                                 </Space>
//                                             }
//                                             description={
//                                                 <div>
//                                                     <Text>
//                                                         The budget code does not have sufficient funds to cover this requisition.
//                                                     </Text>
//                                                     <Divider style={{ margin: '8px 0' }} />
//                                                     <Row gutter={16}>
//                                                         <Col span={12}>
//                                                             <Text type="secondary">Current Available:</Text>
//                                                             <br />
//                                                             <Text strong>XAF {budgetStatus.currentAvailable.toLocaleString()}</Text>
//                                                         </Col>
//                                                         <Col span={12}>
//                                                             <Text type="secondary">Shortfall:</Text>
//                                                             <br />
//                                                             <Text strong style={{ color: '#ff4d4f' }}>
//                                                                 XAF {(budgetStatus.requiredAmount - budgetStatus.currentAvailable).toLocaleString()}
//                                                             </Text>
//                                                         </Col>
//                                                     </Row>
//                                                     <Divider style={{ margin: '8px 0' }} />
//                                                     <Text type="danger">
//                                                         <InfoCircleOutlined /> You should reject this requisition or request the employee to select a different budget code.
//                                                     </Text>
//                                                 </div>
//                                             }
//                                             type="error"
//                                             showIcon
//                                         />
//                                     )}
//                                 </div>
//                             </Card>
//                         );
//                     })()}

//                     {/* ✅ NEW: Simplified Verification Form */}
//                     <Form
//                         form={form}
//                         layout="vertical"
//                         onFinish={handleVerification}
//                     >
//                         <Alert
//                             message="Finance Verification"
//                             description="Review the budget code information above and decide whether to approve or reject this requisition based on budget availability."
//                             type="info"
//                             showIcon
//                             style={{ marginBottom: '16px' }}
//                         />

//                         <Form.Item
//                             name="decision"
//                             label="Verification Decision"
//                             rules={[{ required: true, message: 'Please select your decision' }]}
//                         >
//                             <Select 
//                                 placeholder="Select your decision"
//                                 size="large"
//                             >
//                                 <Option value="approved">
//                                     <Space>
//                                         <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                                         <Text strong>✅ Approve - Budget Available</Text>
//                                     </Space>
//                                 </Option>
//                                 <Option value="rejected">
//                                     <Space>
//                                         <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
//                                         <Text strong>❌ Reject - Insufficient Budget / Other Reason</Text>
//                                     </Space>
//                                 </Option>
//                             </Select>
//                         </Form.Item>

//                         <Form.Item
//                             name="comments"
//                             label="Verification Comments"
//                             rules={[{ required: true, message: 'Please provide verification comments' }]}
//                             help="Explain your decision. If rejecting, specify the reason."
//                         >
//                             <TextArea
//                                 rows={4}
//                                 placeholder="Enter your comments about budget verification..."
//                                 showCount
//                                 maxLength={500}
//                             />
//                         </Form.Item>

//                         <Form.Item>
//                             <Space>
//                                 <Button onClick={() => {
//                                     setVerificationModalVisible(false);
//                                     setSelectedRequisition(null);
//                                     form.resetFields();
//                                 }}>
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     type="primary"
//                                     htmlType="submit"
//                                     loading={loading}
//                                     icon={<SendOutlined />}
//                                     size="large"
//                                 >
//                                     Submit Verification
//                                 </Button>
//                             </Space>
//                         </Form.Item>
//                     </Form>
//                 </div>
//             )}
//         </Modal>

//         {/* Budget Code Create/Edit Modal - UNCHANGED */}
//         <Modal
//             title={
//                 <Space>
//                     <TagOutlined />
//                     {editingBudgetCode ? 'Edit Budget Code' : 'Create New Budget Code'}
//                 </Space>
//             }
//             open={budgetCodeModalVisible}
//             onCancel={() => {
//                 setBudgetCodeModalVisible(false);
//                 budgetCodeForm.resetFields();
//                 setEditingBudgetCode(null);
//             }}
//             footer={null}
//             width={600}
//         >
//             <Form
//                 form={budgetCodeForm}
//                 layout="vertical"
//                 onFinish={editingBudgetCode ? handleUpdateBudgetCode : handleCreateBudgetCode}
//             >
//                 <Row gutter={16}>
//                     <Col span={12}>
//                         <Form.Item
//                             name="code"
//                             label="Budget Code"
//                             rules={[
//                                 { required: true, message: 'Please enter budget code' },
//                                 { pattern: /^[A-Z0-9\-_]+$/, message: 'Only uppercase letters, numbers, hyphens and underscores allowed' }
//                             ]}
//                             help="Use format like DEPT-IT-2024 or PROJ-ALPHA-2024"
//                         >
//                             <Input
//                                 placeholder="e.g., DEPT-IT-2024"
//                                 disabled={!!editingBudgetCode}
//                                 style={{ textTransform: 'uppercase' }}
//                             />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="name"
//                             label="Budget Name"
//                             rules={[{ required: true, message: 'Please enter budget name' }]}
//                         >
//                             <Input placeholder="e.g., IT Department 2024 Budget" />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Row gutter={16}>
//                     <Col span={12}>
//                         <Form.Item
//                             name="budget"
//                             label="Total Budget Allocation (XAF)"
//                             rules={[{ required: true, message: 'Please enter budget amount' }]}
//                         >
//                             <InputNumber
//                                 style={{ width: '100%' }}
//                                 formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                 parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                                 min={0}
//                                 placeholder="Enter total budget"
//                             />
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="department"
//                             label="Department/Project"
//                             rules={[{ required: true, message: 'Please select department or project' }]}
//                             help="Select existing department or active project"
//                         >
//                             <Select 
//                                 placeholder="Select department or project"
//                                 showSearch
//                                 loading={loadingProjects}
//                             >
//                                 <Select.OptGroup label="Departments">
//                                     <Option value="Technical Operations">Technical Operations</Option>
//                                     <Option value="Technical Roll Out">Technical Roll Out</Option>
//                                     <Option value="Technical QHSE">Technical QHSE</Option>
//                                     <Option value="IT">IT Department</Option>
//                                     <Option value="Finance">Finance</Option>
//                                     <Option value="HR">Human Resources</Option>
//                                     <Option value="Marketing">Marketing</Option>
//                                     <Option value="Supply Chain">Supply Chain</Option>
//                                     <Option value="Business">Business</Option>
//                                     <Option value="Facilities">Facilities</Option>
//                                 </Select.OptGroup>
//                                 <Select.OptGroup label="Active Projects">
//                                     {projects.map(project => (
//                                         <Option key={`project-${project._id}`} value={`PROJECT-${project._id}`}>
//                                             {project.name} ({project.department})
//                                         </Option>
//                                     ))}
//                                 </Select.OptGroup>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Row gutter={16}>
//                     <Col span={12}>
//                         <Form.Item
//                             name="budgetType"
//                             label="Budget Type"
//                             rules={[{ required: true, message: 'Please select budget type' }]}
//                         >
//                             <Select placeholder="Select budget type">
//                                 <Option value="OPEX">OPEX - Operating Expenses</Option>
//                                 <Option value="CAPEX">CAPEX - Capital Expenditure</Option>
//                                 <Option value="PROJECT">PROJECT - Project Budget</Option>
//                                 <Option value="OPERATIONAL">OPERATIONAL - Operational</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="budgetPeriod"
//                             label="Budget Period"
//                             rules={[{ required: true, message: 'Please select budget period' }]}
//                         >
//                             <Select placeholder="Select budget period">
//                                 <Option value="monthly">Monthly</Option>
//                                 <Option value="quarterly">Quarterly</Option>
//                                 <Option value="yearly">Yearly</Option>
//                                 <Option value="project">Project Duration</Option>
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Form.Item
//                     name="description"
//                     label="Budget Description"
//                     help="Provide details about what this budget covers"
//                 >
//                     <TextArea
//                         rows={3}
//                         placeholder="Describe the purpose and scope of this budget allocation..."
//                         showCount
//                         maxLength={300}
//                     />
//                 </Form.Item>

//                 <Row gutter={16}>
//                     <Col span={12}>
//                         <Form.Item
//                             name="budgetOwner"
//                             label="Budget Owner"
//                             rules={[{ required: true, message: 'Please select budget owner' }]}
//                             help="Person responsible for this budget"
//                         >
//                             <Select
//                                 placeholder="Select budget owner"
//                                 showSearch
//                                 loading={loadingBudgetOwners}
//                                 filterOption={(input, option) => {
//                                     const user = budgetOwners.find(u => u._id === option.value);
//                                     if (!user) return false;
//                                     return (
//                                         (user.fullName || '').toLowerCase().includes(input.toLowerCase()) ||
//                                         (user.email || '').toLowerCase().includes(input.toLowerCase())
//                                     );
//                                 }}
//                                 notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : "No users found"}
//                             >
//                                 {budgetOwners.map(user => (
//                                     <Option key={user._id} value={user._id}>
//                                         <div>
//                                             <Text strong>{user.fullName}</Text>
//                                             <br />
//                                             <Text type="secondary" style={{ fontSize: '12px' }}>
//                                                 {user.role} | {user.department}
//                                             </Text>
//                                         </div>
//                                     </Option>
//                                 ))}
//                             </Select>
//                         </Form.Item>
//                     </Col>
//                     <Col span={12}>
//                         <Form.Item
//                             name="active"
//                             label="Status"
//                             valuePropName="checked"
//                             initialValue={true}
//                         >
//                             <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
//                         </Form.Item>
//                     </Col>
//                 </Row>

//                 <Form.Item>
//                     <Space>
//                         <Button onClick={() => {
//                             setBudgetCodeModalVisible(false);
//                             budgetCodeForm.resetFields();
//                             setEditingBudgetCode(null);
//                         }}>
//                             Cancel
//                         </Button>
//                         <Button
//                             type="primary"
//                             htmlType="submit"
//                             loading={loading}
//                             icon={editingBudgetCode ? <EditOutlined /> : <PlusOutlined />}
//                         >
//                             {editingBudgetCode ? 'Update Budget Code' : 'Create Budget Code'}
//                         </Button>
//                     </Space>
//                 </Form.Item>
//             </Form>
//         </Modal>

//         {/* Budget Code Approval Modal - UNCHANGED */}
//         <Modal
//             title={
//                 <Space>
//                     <AuditOutlined />
//                     Budget Code Approval - {selectedBudgetCodeForApproval?.code}
//                 </Space>
//             }
//             open={budgetCodeApprovalModalVisible}
//             onCancel={() => {
//                 setBudgetCodeApprovalModalVisible(false);
//                 setSelectedBudgetCodeForApproval(null);
//                 budgetCodeApprovalForm.resetFields();
//             }}
//             footer={null}
//             width={700}
//         >
//             {selectedBudgetCodeForApproval && (
//                 <div>
//                     <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
//                         <Descriptions column={2} size="small">
//                             <Descriptions.Item label="Budget Code">
//                                 <Text strong code>{selectedBudgetCodeForApproval.code}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Name">
//                                 {selectedBudgetCodeForApproval.name}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Budget Amount">
//                                 <Text strong style={{ color: '#1890ff' }}>
//                                     XAF {selectedBudgetCodeForApproval.budget?.toLocaleString()}
//                                 </Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Department">
//                                 <Tag color="blue">{selectedBudgetCodeForApproval.department}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Budget Type">
//                                 {selectedBudgetCodeForApproval.budgetType}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Current Status">
//                                 {getBudgetCodeStatusTag(selectedBudgetCodeForApproval.status)}
//                             </Descriptions.Item>
//                         </Descriptions>
//                     </Card>

//                     {selectedBudgetCodeForApproval.approvalChain && (
//                         <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
//                             <Timeline>
//                                 {selectedBudgetCodeForApproval.approvalChain.map((step, index) => {
//                                     const color = step.status === 'approved' ? 'green' : 
//                                                  step.status === 'rejected' ? 'red' : 'gray';
//                                     const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
//                                                 step.status === 'rejected' ? <CloseCircleOutlined /> :
//                                                 <ClockCircleOutlined />;
                                    
//                                     return (
//                                         <Timeline.Item key={index} color={color} dot={icon}>
//                                             <Text strong>Level {step.level}: {step.approver.name}</Text>
//                                             <br />
//                                             <Text type="secondary">{step.approver.role}</Text>
//                                             <br />
//                                             <Tag color={color}>{step.status.toUpperCase()}</Tag>
//                                             {step.actionDate && (
//                                                 <>
//                                                     <br />
//                                                     <Text type="secondary">
//                                                         {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
//                                                     </Text>
//                                                 </>
//                                             )}
//                                             {step.comments && (
//                                                 <div style={{ marginTop: 4 }}>
//                                                     <Text italic>"{step.comments}"</Text>
//                                                 </div>
//                                             )}
//                                         </Timeline.Item>
//                                     );
//                                 })}
//                             </Timeline>
//                         </Card>
//                     )}

//                     <Form
//                         form={budgetCodeApprovalForm}
//                         layout="vertical"
//                         onFinish={handleBudgetCodeApproval}
//                     >
//                         <Form.Item
//                             name="decision"
//                             label="Approval Decision"
//                             rules={[{ required: true, message: 'Please select your decision' }]}
//                         >
//                             <Select placeholder="Select decision">
//                                 <Option value="approved">✅ Approve Budget Code</Option>
//                                 <Option value="rejected">❌ Reject Budget Code</Option>
//                             </Select>
//                         </Form.Item>

//                         <Form.Item
//                             name="comments"
//                             label="Comments"
//                             rules={[{ required: true, message: 'Please provide comments for your decision' }]}
//                         >
//                             <TextArea
//                                 rows={4}
//                                 placeholder="Enter your comments, reasons, or recommendations..."
//                                 showCount
//                                 maxLength={500}
//                             />
//                         </Form.Item>

//                         <Form.Item>
//                             <Space>
//                                 <Button onClick={() => {
//                                     setBudgetCodeApprovalModalVisible(false);
//                                     setSelectedBudgetCodeForApproval(null);
//                                     budgetCodeApprovalForm.resetFields();
//                                 }}>
//                                     Cancel
//                                 </Button>
//                                 <Button
//                                     type="primary"
//                                     htmlType="submit"
//                                     loading={loading}
//                                     icon={<SendOutlined />}
//                                 >
//                                     Submit Decision
//                                 </Button>
//                             </Space>
//                         </Form.Item>
//                     </Form>
//                 </div>
//             )}
//         </Modal>

//         {/* Budget Code Details Modal - UNCHANGED */}
//         <Modal
//             title={
//                 <Space>
//                     <TagOutlined />
//                     Budget Code Details
//                 </Space>
//             }
//             open={budgetCodeDetailsModalVisible}
//             onCancel={() => {
//                 setBudgetCodeDetailsModalVisible(false);
//                 setSelectedBudgetCode(null);
//             }}
//             footer={null}
//             width={800}
//         >
//             {selectedBudgetCode && (
//                 <div>
//                     <Descriptions bordered column={2} size="small">
//                         <Descriptions.Item label="Budget Code" span={2}>
//                             <Text code strong>{selectedBudgetCode.code}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Name" span={2}>
//                             {selectedBudgetCode.name}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Budget Amount">
//                             <Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCode.budget?.toLocaleString()}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Used Amount">
//                             <Text strong style={{ color: '#fa8c16' }}>XAF {selectedBudgetCode.used?.toLocaleString()}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Remaining">
//                             <Text strong style={{ color: '#52c41a' }}>XAF {(selectedBudgetCode.budget - selectedBudgetCode.used).toLocaleString()}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Utilization">
//                             <Progress 
//                                 percent={Math.round((selectedBudgetCode.used / selectedBudgetCode.budget) * 100)} 
//                                 size="small"
//                             />
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Department">
//                             {selectedBudgetCode.department}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Budget Type">
//                             {selectedBudgetCode.budgetType}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Budget Period">
//                             {selectedBudgetCode.budgetPeriod}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Status">
//                             {getBudgetCodeStatusTag(selectedBudgetCode.status)}
//                         </Descriptions.Item>
//                     </Descriptions>

//                     {selectedBudgetCode.description && (
//                         <Card size="small" title="Description" style={{ marginTop: '20px' }}>
//                             <Text>{selectedBudgetCode.description}</Text>
//                         </Card>
//                     )}

//                     {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
//                         <Card size="small" title="Approval Progress" style={{ marginTop: '20px' }}>
//                             <Timeline>
//                                 {selectedBudgetCode.approvalChain.map((step, index) => {
//                                     const color = step.status === 'approved' ? 'green' : 
//                                                  step.status === 'rejected' ? 'red' : 'gray';
//                                     const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
//                                                 step.status === 'rejected' ? <CloseCircleOutlined /> :
//                                                 <ClockCircleOutlined />;
                                    
//                                     return (
//                                         <Timeline.Item key={index} color={color} dot={icon}>
//                                             <Text strong>Level {step.level}: {step.approver.name}</Text>
//                                             <br />
//                                             <Text type="secondary">{step.approver.role}</Text>
//                                             <br />
//                                             <Tag color={color}>{step.status.toUpperCase()}</Tag>
//                                             {step.actionDate && (
//                                                 <>
//                                                     <br />
//                                                     <Text type="secondary">
//                                                         {new Date(step.actionDate).toLocaleDateString()}
//                                                     </Text>
//                                                 </>
//                                             )}
//                                         </Timeline.Item>
//                                     );
//                                 })}
//                             </Timeline>
//                         </Card>
//                     )}
//                 </div>
//             )}
//         </Modal>

//         {/* ✅ NEW: Disbursement Modal */}
//             <Modal
//                 title={
//                     <Space>
//                         <SendOutlined />
//                         Process Disbursement - {selectedRequisition?.title}
//                     </Space>
//                 }
//                 open={disbursementModalVisible}
//                 onCancel={() => {
//                     setDisbursementModalVisible(false);
//                     setSelectedRequisition(null);
//                     disbursementForm.resetFields();
//                     setDisbursementAmount(0);
//                 }}
//                 footer={null}
//                 width={800}
//             >
//                 {selectedRequisition && (
//                     <div>
//                         {/* Requisition Summary */}
//                         <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
//                             <Descriptions column={2} size="small">
//                                 <Descriptions.Item label="Employee">
//                                     <Text strong>{selectedRequisition.employee?.fullName}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Department">
//                                     <Tag color="blue">{selectedRequisition.employee?.department}</Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Total Budget">
//                                     <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                                         XAF {(selectedRequisition.budgetXAF || 0).toLocaleString()}
//                                     </Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Already Disbursed">
//                                     <Text strong style={{ color: '#52c41a' }}>
//                                         XAF {(selectedRequisition.totalDisbursed || 0).toLocaleString()}
//                                     </Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Remaining Balance" span={2}>
//                                     <Text strong style={{ color: '#ff4d4f', fontSize: '18px' }}>
//                                         XAF {(selectedRequisition.remainingBalance || 0).toLocaleString()}
//                                     </Text>
//                                 </Descriptions.Item>
//                             </Descriptions>
//                         </Card>

//                         {/* Disbursement Progress */}
//                         {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
//                             <Card 
//                                 size="small" 
//                                 title="Disbursement History" 
//                                 style={{ marginBottom: '20px' }}
//                             >
//                                 <Timeline mode="left">
//                                     {selectedRequisition.disbursements.map((disbursement, index) => (
//                                         <Timeline.Item
//                                             key={index}
//                                             color={index === selectedRequisition.disbursements.length - 1 ? 'green' : 'blue'}
//                                             dot={<DollarOutlined />}
//                                         >
//                                             <div>
//                                                 <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                                                 <br />
//                                                 <Text type="secondary">
//                                                     {new Date(disbursement.date).toLocaleString('en-GB')}
//                                                 </Text>
//                                                 <br />
//                                                 <Text strong style={{ color: '#1890ff' }}>
//                                                     XAF {disbursement.amount?.toLocaleString()}
//                                                 </Text>
//                                                 {disbursement.notes && (
//                                                     <>
//                                                         <br />
//                                                         <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
//                                                     </>
//                                                 )}
//                                             </div>
//                                         </Timeline.Item>
//                                     ))}
//                                 </Timeline>
//                             </Card>
//                         )}

//                         {/* Disbursement Form */}
//                         <Form
//                             form={disbursementForm}
//                             layout="vertical"
//                             onFinish={handleDisbursement}
//                         >
//                             <Alert
//                                 message={selectedRequisition.disbursements?.length > 0 ? 
//                                     "Additional Disbursement" : 
//                                     "First Disbursement"
//                                 }
//                                 description={selectedRequisition.disbursements?.length > 0 ?
//                                     "This requisition has already received partial payment. You can disburse the remaining amount or make another partial payment." :
//                                     "This is the first disbursement for this requisition. You can disburse the full amount or make a partial payment."
//                                 }
//                                 type="info"
//                                 showIcon
//                                 style={{ marginBottom: '16px' }}
//                             />

//                             <Form.Item
//                                 name="amount"
//                                 label="Disbursement Amount (XAF)"
//                                 rules={[
//                                     { required: true, message: 'Please enter disbursement amount' },
//                                     { 
//                                         validator: (_, value) => {
//                                             if (value > selectedRequisition.remainingBalance) {
//                                                 return Promise.reject(`Amount cannot exceed remaining balance of XAF ${selectedRequisition.remainingBalance.toLocaleString()}`);
//                                             }
//                                             if (value <= 0) {
//                                                 return Promise.reject('Amount must be greater than 0');
//                                             }
//                                             return Promise.resolve();
//                                         }
//                                     }
//                                 ]}
//                             >
//                                 <InputNumber
//                                     style={{ width: '100%' }}
//                                     min={0}
//                                     max={selectedRequisition.remainingBalance}
//                                     step={1000}
//                                     formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                                     parser={(value) => value.replace(/,/g, '')}
//                                     onChange={(value) => setDisbursementAmount(value || 0)}
//                                 />
//                             </Form.Item>

//                             {/* Disbursement Preview */}
//                             {disbursementAmount > 0 && (
//                                 <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f8ff' }}>
//                                     <Row gutter={16}>
//                                         <Col span={8}>
//                                             <Statistic
//                                                 title="Disbursing Now"
//                                                 value={disbursementAmount}
//                                                 precision={0}
//                                                 valueStyle={{ color: '#1890ff' }}
//                                                 prefix="XAF"
//                                             />
//                                         </Col>
//                                         <Col span={8}>
//                                             <Statistic
//                                                 title="Remaining After"
//                                                 value={selectedRequisition.remainingBalance - disbursementAmount}
//                                                 precision={0}
//                                                 valueStyle={{color: selectedRequisition.remainingBalance - disbursementAmount > 0 ? '#cf1322' : '#3f8600'
//                                                 }}
//                                                 prefix="XAF"
//                                             />
//                                         </Col>
//                                         <Col span={8}>
//                                             <Statistic
//                                                 title="Progress"
//                                                 value={Math.round(((selectedRequisition.totalDisbursed + disbursementAmount) / selectedRequisition.budgetXAF) * 100)}
//                                                 precision={0}
//                                                 valueStyle={{ color: '#722ed1' }}
//                                                 suffix="%"
//                                             />
//                                         </Col>
//                                     </Row>
//                                     <Divider style={{ margin: '12px 0' }} />
//                                     <Progress 
//                                         percent={Math.round(((selectedRequisition.totalDisbursed + disbursementAmount) / selectedRequisition.budgetXAF) * 100)} 
//                                         status={selectedRequisition.remainingBalance - disbursementAmount === 0 ? 'success' : 'active'}
//                                         strokeColor={selectedRequisition.remainingBalance - disbursementAmount === 0 ? '#52c41a' : '#1890ff'}
//                                     />
//                                     {selectedRequisition.remainingBalance - disbursementAmount === 0 && (
//                                         <Alert
//                                             message="Full Disbursement"
//                                             description="This payment will complete the full disbursement. The requisition status will be updated to 'Fully Disbursed'."
//                                             type="success"
//                                             showIcon
//                                             icon={<CheckCircleOutlined />}
//                                             style={{ marginTop: '12px' }}
//                                         />
//                                     )}
//                                     {selectedRequisition.remainingBalance - disbursementAmount > 0 && (
//                                         <Alert
//                                             message="Partial Disbursement"
//                                             description={`After this payment, XAF ${(selectedRequisition.remainingBalance - disbursementAmount).toLocaleString()} will remain to be disbursed.`}
//                                             type="warning"
//                                             showIcon
//                                             icon={<WarningOutlined />}
//                                             style={{ marginTop: '12px' }}
//                                         />
//                                     )}
//                                 </Card>
//                             )}

//                             <Form.Item
//                                 name="notes"
//                                 label="Disbursement Notes"
//                                 help="Optional notes about this disbursement (e.g., payment method, reference number)"
//                             >
//                                 <TextArea
//                                     rows={3}
//                                     placeholder="Enter notes about this disbursement..."
//                                     showCount
//                                     maxLength={300}
//                                 />
//                             </Form.Item>

//                             <Form.Item>
//                                 <Space>
//                                     <Button onClick={() => {
//                                         setDisbursementModalVisible(false);
//                                         setSelectedRequisition(null);
//                                         disbursementForm.resetFields();
//                                         setDisbursementAmount(0);
//                                     }}>
//                                         Cancel
//                                     </Button>
//                                     <Button
//                                         type="primary"
//                                         htmlType="submit"
//                                         loading={loading}
//                                         icon={<SendOutlined />}
//                                         size="large"
//                                         disabled={!disbursementAmount || disbursementAmount <= 0}
//                                     >
//                                         {loading ? 'Processing...' : `Disburse XAF ${disbursementAmount.toLocaleString()}`}
//                                     </Button>
//                                 </Space>
//                             </Form.Item>
//                         </Form>
//                     </div>
//                 )}
//             </Modal>

//         {/* Requisition Details Modal - UPDATED to show budget code info */}
//         <Modal
//             title={
//                 <Space>
//                     <FileTextOutlined />
//                     Purchase Requisition Details
//                 </Space>
//             }
//             open={detailsModalVisible}
//             onCancel={() => {
//                 setDetailsModalVisible(false);
//                 setSelectedRequisition(null);
//             }}
//             footer={null}
//             width={900}
//         >
//             {selectedRequisition && (
//                 <div>
//                     <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//                         <Descriptions.Item label="Requisition ID" span={2}>
//                             <Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text>
//                         </Descriptions.Item>
//                          <Descriptions.Item label="Title" span={2}>
//                             <Text strong>{selectedRequisition.title}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Employee">
//                             <Text>{selectedRequisition.employee?.fullName}</Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Department">
//                             <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Category">
//                             <Tag color="green">{selectedRequisition.itemCategory}</Tag>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Priority">
//                             <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
//                                 {selectedRequisition.urgency}
//                             </Tag>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Requested Budget">
//                             <Text strong style={{ color: '#1890ff' }}>
//                                 XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
//                             </Text>
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Expected Date">
//                             {selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
//                         </Descriptions.Item>
//                         <Descriptions.Item label="Status" span={2}>
//                             {getStatusTag(selectedRequisition.status)}
//                         </Descriptions.Item>
//                     </Descriptions>

//                     {/* ✅ ADD: Business Justification */}
//                     {selectedRequisition.justificationOfPurchase && (
//                         <Card size="small" title="Business Justification" style={{ marginBottom: '20px' }}>
//                             <div style={{ marginBottom: '12px' }}>
//                                 <Text strong>Purchase Justification:</Text>
//                                 <br />
//                                 <Text>{selectedRequisition.justificationOfPurchase}</Text>
//                             </div>
//                             {selectedRequisition.justificationOfPreferredSupplier && (
//                                 <div>
//                                     <Text strong>Preferred Supplier Justification:</Text>
//                                     <br />
//                                     <Text>{selectedRequisition.justificationOfPreferredSupplier}</Text>
//                                 </div>
//                             )}
//                         </Card>
//                     )}

//                     {/* ✅ ADD: Attachments */}
//                     {renderAttachments()}


//                     {/* ✅ NEW: Budget Code Information */}
//                     {selectedRequisition.budgetCodeInfo && (
//                         <Card size="small" title="Budget Code Information" style={{ marginBottom: '20px' }}>
//                             <Descriptions column={2} size="small">
//                                 <Descriptions.Item label="Budget Code">
//                                     <Tag color="gold">
//                                         <TagOutlined /> {selectedRequisition.budgetCodeInfo.code}
//                                     </Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Budget Name">
//                                     <Text>{selectedRequisition.budgetCodeInfo.name}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Department">
//                                     <Tag color="blue">{selectedRequisition.budgetCodeInfo.department}</Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Budget Type">
//                                     <Text>{selectedRequisition.budgetCodeInfo.budgetType || 'N/A'}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Available at Submission">
//                                     <Text strong>XAF {selectedRequisition.budgetCodeInfo.availableAtSubmission?.toLocaleString()}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Submitted Amount">
//                                     <Text strong style={{ color: '#1890ff' }}>
//                                         XAF {selectedRequisition.budgetCodeInfo.submittedAmount?.toLocaleString()}
//                                     </Text>
//                                 </Descriptions.Item>
//                             </Descriptions>
//                         </Card>
//                     )}

//                     <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
//                         <Table
//                             dataSource={selectedRequisition.items || []}
//                             pagination={false}
//                             size="small"
//                             columns={[
//                                 {
//                                     title: 'Description',
//                                     dataIndex: 'description',
//                                     key: 'description'
//                                 },
//                                 {
//                                     title: 'Quantity',
//                                     dataIndex: 'quantity',
//                                     key: 'quantity',
//                                     width: 100
//                                 },
//                                 {
//                                     title: 'Unit',
//                                     dataIndex: 'measuringUnit',
//                                     key: 'unit',
//                                     width: 100
//                                 }
//                             ]}
//                         />
//                     </Card>

//                     {/* ✅ UPDATED: Finance Verification Details */}
//                     {selectedRequisition.financeVerification && (
//                         <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
//                             <Descriptions column={2} size="small">
//                                 <Descriptions.Item label="Decision">
//                                     <Tag color={selectedRequisition.financeVerification.decision === 'approved' ? 'green' : 'red'}>
//                                         {selectedRequisition.financeVerification.decision === 'approved' ? '✅ Approved' : '❌ Rejected'}
//                                     </Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Verification Date">
//                                     {selectedRequisition.financeVerification.verificationDate ?
//                                         new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') :
//                                         'Pending'
//                                     }
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Verified Budget">
//                                     <Text strong>XAF {selectedRequisition.financeVerification.verifiedBudget?.toLocaleString()}</Text>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Budget Code Verified">
//                                     <Tag color="gold">
//                                         <TagOutlined /> {selectedRequisition.financeVerification.budgetCodeVerified || 'N/A'}
//                                     </Tag>
//                                 </Descriptions.Item>
//                                 <Descriptions.Item label="Available at Verification">
//                                     <Text>XAF {selectedRequisition.financeVerification.availableBudgetAtVerification?.toLocaleString() || 'N/A'}</Text>
//                                 </Descriptions.Item>
//                                 {selectedRequisition.financeVerification.comments && (
//                                     <Descriptions.Item label="Comments" span={2}>
//                                         <Text italic>{selectedRequisition.financeVerification.comments}</Text>
//                                     </Descriptions.Item>
//                                 )}
//                             </Descriptions>
//                         </Card>
//                     )}

//                     {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
//                         <Card size="small" title="Approval Progress">
//                             <Timeline>
//                                 {selectedRequisition.approvalChain.map((step, index) => {
//                                     let color = 'gray';
//                                     let icon = <ClockCircleOutlined />;
                                    
//                                     if (step.status === 'approved') {
//                                         color = 'green';
//                                         icon = <CheckCircleOutlined />;
//                                     } else if (step.status === 'rejected') {
//                                         color = 'red';
//                                         icon = <CloseCircleOutlined />;
//                                     }

//                                     return (
//                                         <Timeline.Item key={index} color={color} dot={icon}>
//                                             <div>
//                                                 <Text strong>Level {step.level}: {step.approver.name}</Text>
//                                                 <br />
//                                                 <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
//                                                 <br />
//                                                 {step.status === 'pending' && (
//                                                     <Tag color="orange">Pending Action</Tag>
//                                                 )}
//                                                 {step.status === 'approved' && (
//                                                     <>
//                                                         <Tag color="green">Approved</Tag>
//                                                         <Text type="secondary">
//                                                             {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                                                         </Text>
//                                                         {step.comments && (
//                                                             <div style={{ marginTop: 4 }}>
//                                                                 <Text italic>"{step.comments}"</Text>
//                                                             </div>
//                                                         )}
//                                                     </>
//                                                 )}
//                                                 {step.status === 'rejected' && (
//                                                     <>
//                                                         <Tag color="red">Rejected</Tag>
//                                                         <Text type="secondary">
//                                                             {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                                                         </Text>
//                                                         {step.comments && (
//                                                             <div style={{ marginTop: 4, color: '#ff4d4f' }}>
//                                                                 <Text>Reason: "{step.comments}"</Text>
//                                                             </div>
//                                                         )}
//                                                     </>
//                                                 )}
//                                             </div>
//                                         </Timeline.Item>
//                                     );
//                                 })}
//                             </Timeline>
//                         </Card>
//                     )}
//                 </div>
//             )}
//         </Modal>

//         {/* ✅ UPDATED: Details Modal with disbursement history */}
//             <Modal
//                 title={
//                     <Space>
//                         <FileTextOutlined />
//                         Purchase Requisition Details
//                         <Tooltip title="Refresh Data">
//                             <Button 
//                                 size="small" 
//                                 icon={<ReloadOutlined />} 
//                                 onClick={async () => {
//                                     try {
//                                         setLoading(true);
//                                         await fetchRequisitions(); // Refresh list
//                                         message.success('Data refreshed');
//                                     } finally {
//                                         setLoading(false);
//                                     }
//                                 }}
//                             />
//                         </Tooltip>
//                     </Space>
//                 }
//                 open={detailsModalVisible}
//                 onCancel={() => {
//                     setDetailsModalVisible(false);
//                     setSelectedRequisition(null);
//                 }}
//                 footer={null}
//                 width={900}
//             >
//                 {selectedRequisition && (
//                     <div>
//                         <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
//                             <Descriptions.Item label="Requisition ID" span={2}>
//                                 <Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Title" span={2}>
//                                 <Text strong>{selectedRequisition.title}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Employee">
//                                 <Text>{selectedRequisition.employee?.fullName}</Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Department">
//                                 <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Category">
//                                 <Tag color="green">{selectedRequisition.itemCategory}</Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Priority">
//                                 <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
//                                     {selectedRequisition.urgency}
//                                 </Tag>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Total Budget">
//                                 <Text strong style={{ color: '#1890ff' }}>
//                                     XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
//                                 </Text>
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Expected Date">
//                                 {selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
//                             </Descriptions.Item>
//                             <Descriptions.Item label="Status" span={2}>
//                                 {getStatusTag(selectedRequisition.status)}
//                             </Descriptions.Item>
//                         </Descriptions>

//                         {/* ✅ NEW: Disbursement Status Card */}
//                         {(selectedRequisition.status === 'approved' || 
//                           selectedRequisition.status === 'partially_disbursed' || 
//                           selectedRequisition.status === 'fully_disbursed') && (
//                             <Card 
//                                 size="small" 
//                                 title={
//                                     <Space>
//                                         <SendOutlined />
//                                         <Text strong>Disbursement Status</Text>
//                                         {selectedRequisition.remainingBalance > 0 && (
//                                             <Tag color="orange">Partial Payment</Tag>
//                                         )}
//                                         {selectedRequisition.remainingBalance === 0 && (
//                                             <Tag color="success">Fully Paid</Tag>
//                                         )}
//                                     </Space>
//                                 }
//                                 style={{ marginBottom: '20px', backgroundColor: '#f9f9f9' }}
//                             >
//                                 <Row gutter={16} style={{ marginBottom: '16px' }}>
//                                     <Col span={6}>
//                                         <Statistic
//                                             title="Total Budget"
//                                             value={selectedRequisition.budgetXAF || 0}
//                                             precision={0}
//                                             valueStyle={{ fontSize: '16px' }}
//                                             prefix="XAF"
//                                         />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic
//                                             title="Already Disbursed"
//                                             value={selectedRequisition.totalDisbursed || 0}
//                                             precision={0}
//                                             valueStyle={{ color: '#1890ff', fontSize: '16px' }}
//                                             prefix="XAF"
//                                         />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic
//                                             title="Remaining Balance"
//                                             value={selectedRequisition.remainingBalance || 0}
//                                             precision={0}
//                                             valueStyle={{ 
//                                                 color: selectedRequisition.remainingBalance > 0 ? '#cf1322' : '#52c41a', 
//                                                 fontSize: '16px' 
//                                             }}
//                                             prefix="XAF"
//                                         />
//                                     </Col>
//                                     <Col span={6}>
//                                         <Statistic
//                                             title="Progress"
//                                             value={selectedRequisition.disbursementProgress || 0}
//                                             precision={0}
//                                             valueStyle={{ fontSize: '16px' }}
//                                             suffix="%"
//                                         />
//                                     </Col>
//                                 </Row>

//                                 <Progress 
//                                     percent={selectedRequisition.disbursementProgress || 0} 
//                                     status={selectedRequisition.disbursementProgress === 100 ? 'success' : 'active'}
//                                     strokeColor={selectedRequisition.disbursementProgress === 100 ? '#52c41a' : '#1890ff'}
//                                 />

//                                 {/* Disbursement History */}
//                                 {/* {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
//                                     <>
//                                         <Divider style={{ margin: '16px 0' }} />
//                                         <Text strong style={{ display: 'block', marginBottom: '12px' }}>
//                                             Payment History ({selectedRequisition.disbursements.length})
//                                         </Text>
//                                         <Timeline mode="left" style={{ marginTop: '12px' }}>
//                                             {selectedRequisition.disbursements.map((disbursement, index) => (
//                                                 <Timeline.Item
//                                                     key={index}
//                                                     color={index === selectedRequisition.disbursements.length - 1 ? 'green' : 'blue'}
//                                                     dot={<DollarOutlined />}
//                                                 >
//                                                     <div style={{ fontSize: '12px' }}>
//                                                         <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                                                         <br />
//                                                         <Text type="secondary">
//                                                             <ClockCircleOutlined /> {new Date(disbursement.date).toLocaleString('en-GB')}
//                                                         </Text>
//                                                         <br />
//                                                         <Text strong style={{ color: '#1890ff' }}>
//                                                             XAF {disbursement.amount?.toLocaleString()}
//                                                         </Text>
//                                                         {disbursement.notes && (
//                                                             <>
//                                                                 <br />
//                                                                 <Text italic style={{ fontSize: '11px' }}>"{disbursement.notes}"</Text>
//                                                             </>
//                                                         )}
//                                                     </div>
//                                                 </Timeline.Item>
//                                             ))}
//                                         </Timeline>
//                                     </>
//                                 )} */}

//                                 {selectedRequisition.disbursements && selectedRequisition.disbursements.length > 0 && (
//                                     <>
//                                         <Divider style={{ margin: '16px 0' }} />
//                                         <Text strong style={{ display: 'block', marginBottom: '12px' }}>
//                                             Payment History ({selectedRequisition.disbursements.length})
//                                         </Text>
//                                         <Timeline mode="left" style={{ marginTop: '12px' }}>
//                                             {selectedRequisition.disbursements.map((disbursement, index) => (
//                                                 <Timeline.Item
//                                                     key={index}
//                                                     // ✅ Change color based on acknowledgment
//                                                     color={disbursement.acknowledged ? 'green' : 
//                                                         index === selectedRequisition.disbursements.length - 1 ? 'blue' : 'gray'}
//                                                     dot={disbursement.acknowledged ? 
//                                                         <CheckCircleOutlined /> : 
//                                                         <DollarOutlined />
//                                                     }
//                                                 >
//                                                     <div style={{ fontSize: '12px' }}>
//                                                         <Space>
//                                                             <Text strong>Payment #{disbursement.disbursementNumber}</Text>
//                                                             {/* ✅ Add acknowledgment badge */}
//                                                             {disbursement.acknowledged ? (
//                                                                 <Tag color="success" size="small">
//                                                                     <CheckCircleOutlined /> Acknowledged
//                                                                 </Tag>
//                                                             ) : (
//                                                                 <Tag color="warning" size="small">
//                                                                     <ClockCircleOutlined /> Awaiting Acknowledgment
//                                                                 </Tag>
//                                                             )}
//                                                         </Space>
//                                                         <br />
//                                                         <Text type="secondary">
//                                                             <ClockCircleOutlined /> Disbursed: {new Date(disbursement.date).toLocaleString('en-GB')}
//                                                         </Text>
//                                                         <br />
//                                                         <Text strong style={{ color: '#1890ff' }}>
//                                                             XAF {disbursement.amount?.toLocaleString()}
//                                                         </Text>
                                                        
//                                                         {/* ✅ Show acknowledgment details */}
//                                                         {disbursement.acknowledged && (
//                                                             <>
//                                                                 <br />
//                                                                 <Text type="success" style={{ fontSize: '11px' }}>
//                                                                     ✅ Acknowledged: {new Date(disbursement.acknowledgmentDate).toLocaleString('en-GB')}
//                                                                 </Text>
//                                                                 {disbursement.acknowledgmentMethod && (
//                                                                     <>
//                                                                         <br />
//                                                                         <Text style={{ fontSize: '11px' }}>
//                                                                             Method: {disbursement.acknowledgmentMethod.replace('_', ' ').toUpperCase()}
//                                                                         </Text>
//                                                                     </>
//                                                                 )}
//                                                                 {disbursement.acknowledgmentNotes && (
//                                                                     <>
//                                                                         <br />
//                                                                         <Text italic style={{ fontSize: '11px', color: '#52c41a' }}>
//                                                                             "{disbursement.acknowledgmentNotes}"
//                                                                         </Text>
//                                                                     </>
//                                                                 )}
//                                                             </>
//                                                         )}
                                                        
//                                                         {disbursement.notes && (
//                                                             <>
//                                                                 <br />
//                                                                 <Text italic style={{ fontSize: '11px' }}>
//                                                                     Disbursement Note: "{disbursement.notes}"
//                                                                 </Text>
//                                                             </>
//                                                         )}
//                                                     </div>
//                                                 </Timeline.Item>
//                                             ))}
//                                         </Timeline>
//                                     </>
//                                 )}

//                                 {selectedRequisition.remainingBalance > 0 && 
//                                  (selectedRequisition.status === 'approved' || selectedRequisition.status === 'partially_disbursed') && (
//                                     <Alert
//                                         message="Action Required"
//                                         description={`This requisition still has XAF ${selectedRequisition.remainingBalance.toLocaleString()} remaining to be disbursed.`}
//                                         type="warning"
//                                         showIcon
//                                         icon={<WarningOutlined />}
//                                         style={{ marginTop: '12px' }}
//                                         action={
//                                             <Button 
//                                                 size="small" 
//                                                 type="primary"
//                                                 onClick={() => {
//                                                     setDetailsModalVisible(false);
//                                                     handleStartDisbursement(selectedRequisition);
//                                                 }}
//                                             >
//                                                 Disburse Now
//                                             </Button>
//                                         }
//                                     />
//                                 )}
//                             </Card>
//                         )}

//                         {/* Budget Code Information */}
//                         {selectedRequisition.budgetCodeInfo && (
//                             <Card size="small" title="Budget Code Information" style={{ marginBottom: '20px' }}>
//                                 <Descriptions column={2} size="small">
//                                     <Descriptions.Item label="Budget Code">
//                                         <Tag color="gold">
//                                             <TagOutlined /> {selectedRequisition.budgetCodeInfo.code}
//                                         </Tag>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Budget Name">
//                                         <Text>{selectedRequisition.budgetCodeInfo.name}</Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Department">
//                                         <Tag color="blue">{selectedRequisition.budgetCodeInfo.department}</Tag>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Budget Type">
//                                         <Text>{selectedRequisition.budgetCodeInfo.budgetType || 'N/A'}</Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Available at Submission">
//                                         <Text strong>XAF {selectedRequisition.budgetCodeInfo.availableAtSubmission?.toLocaleString()}</Text>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Submitted Amount">
//                                         <Text strong style={{ color: '#1890ff' }}>
//                                             XAF {selectedRequisition.budgetCodeInfo.submittedAmount?.toLocaleString()}
//                                         </Text>
//                                     </Descriptions.Item>
//                                 </Descriptions>
//                             </Card>
//                         )}

//                         {/* Items to Purchase */}
//                         <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
//                             <Table
//                                 dataSource={selectedRequisition.items || []}
//                                 pagination={false}
//                                 size="small"
//                                 columns={[
//                                     {
//                                         title: 'Description',
//                                         dataIndex: 'description',
//                                         key: 'description'
//                                     },
//                                     {
//                                         title: 'Quantity',
//                                         dataIndex: 'quantity',
//                                         key: 'quantity',
//                                         width: 100
//                                     },
//                                     {
//                                         title: 'Unit',
//                                         dataIndex: 'measuringUnit',
//                                         key: 'unit',
//                                         width: 100
//                                     }
//                                 ]}
//                             />
//                         </Card>

//                         {/* Attachments */}
//                         {selectedRequisition.attachments && selectedRequisition.attachments.length > 0 && (
//                             <AttachmentDisplay
//                                 attachments={selectedRequisition.attachments}
//                                 requisitionId={selectedRequisition._id}
//                                 onDownload={handleDownloadAttachment}
//                                 loading={downloadingAttachment !== null}
//                                 title="📎 Attachments"
//                             />
//                         )}

//                         {/* Finance Verification Details */}
//                         {selectedRequisition.financeVerification && (
//                             <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
//                                 <Descriptions column={2} size="small">
//                                     <Descriptions.Item label="Decision">
//                                         <Tag color={selectedRequisition.financeVerification.decision === 'approved' ? 'green' : 'red'}>
//                                             {selectedRequisition.financeVerification.decision === 'approved' ? '✅ Approved' : '❌ Rejected'}
//                                         </Tag>
//                                     </Descriptions.Item>
//                                     <Descriptions.Item label="Verification Date">
//                                         {selectedRequisition.financeVerification.verificationDate ?
//                                             new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') :
//                                             'Pending'
//                                         }
//                                     </Descriptions.Item>
//                                     {selectedRequisition.financeVerification.comments && (
//                                         <Descriptions.Item label="Comments" span={2}>
//                                             <Text italic>{selectedRequisition.financeVerification.comments}</Text>
//                                         </Descriptions.Item>
//                                     )}
//                                 </Descriptions>
//                             </Card>
//                         )}

//                         {/* Approval Chain */}
//                         {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
//                             <Card size="small" title="Approval Progress">
//                                 <Timeline>
//                                     {selectedRequisition.approvalChain.map((step, index) => {
//                                         let color = 'gray';
//                                         let icon = <ClockCircleOutlined />;
                                        
//                                         if (step.status === 'approved') {
//                                             color = 'green';
//                                             icon = <CheckCircleOutlined />;
//                                         } else if (step.status === 'rejected') {
//                                             color = 'red';
//                                             icon = <CloseCircleOutlined />;
//                                         }

//                                         return (
//                                             <Timeline.Item key={index} color={color} dot={icon}>
//                                                 <div>
//                                                     <Text strong>Level {step.level}: {step.approver.name}</Text>
//                                                     <br />
//                                                     <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
//                                                     <br />
//                                                     {step.status === 'pending' && (
//                                                         <Tag color="orange">Pending Action</Tag>
//                                                     )}
//                                                     {step.status === 'approved' && (
//                                                         <>
//                                                             <Tag color="green">Approved</Tag>
//                                                             <Text type="secondary">
//                                                                 {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                                                             </Text>
//                                                             {step.comments && (
//                                                                 <div style={{ marginTop: 4 }}>
//                                                                     <Text italic>"{step.comments}"</Text>
//                                                                 </div>
//                                                             )}
//                                                         </>
//                                                     )}
//                                                     {step.status === 'rejected' && (
//                                                         <>
//                                                             <Tag color="red">Rejected</Tag>
//                                                             <Text type="secondary">
//                                                                 {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
//                                                             </Text>
//                                                             {step.comments && (
//                                                                 <div style={{ marginTop: 4, color: '#ff4d4f' }}>
//                                                                     <Text>Reason: "{step.comments}"</Text>
//                                                                 </div>
//                                                             )}
//                                                         </>
//                                                     )}
//                                                 </div>
//                                             </Timeline.Item>
//                                         );
//                                     })}
//                                 </Timeline>
//                             </Card>
//                         )}
//                     </div>
//                 )}
//             </Modal>
//     </div>
// );
// };
// export default FinancePurchaseRequisitions;















// // import React, { useState, useEffect } from 'react';
// // import {
// //     Card,
// //     Table,
// //     Button,
// //     Modal,
// //     Form,
// //     Typography,
// //     Tag,
// //     Space,
// //     Input,
// //     Select,
// //     InputNumber,
// //     Descriptions,
// //     Alert,
// //     Spin,
// //     message,
// //     Badge,
// //     Timeline,
// //     Row,
// //     Col,
// //     Statistic,
// //     Divider,
// //     Tooltip,
// //     Switch,
// //     Tabs,
// //     DatePicker,
// //     Progress
// // } from 'antd';
// // import {
// //     ClockCircleOutlined,
// //     FileTextOutlined,
// //     BankOutlined,
// //     TagOutlined,
// //     ShoppingCartOutlined,
// //     ReloadOutlined,
// //     EyeOutlined,
// //     AuditOutlined,
// //     CheckCircleOutlined,
// //     CloseCircleOutlined,
// //     SendOutlined,
// //     PlusOutlined,
// //     EditOutlined,
// //     DeleteOutlined,
// //     DollarOutlined,
// //     CalendarOutlined,
// //     ContactsOutlined,
// //     BarChartOutlined,
// //     TeamOutlined,
// //     WarningOutlined,
// //     InfoCircleOutlined
// // } from '@ant-design/icons';

// // const { Title, Text } = Typography;
// // const { TextArea } = Input;
// // const { Option } = Select;
// // const { TabPane } = Tabs;

// // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// // const makeAuthenticatedRequest = async (url, options = {}) => {
// //   const token = localStorage.getItem('token');
  
// //   const defaultHeaders = {
// //     'Content-Type': 'application/json',
// //     'Authorization': `Bearer ${token}`,
// //   };

// //   const config = {
// //     ...options,
// //     headers: {
// //       ...defaultHeaders,
// //       ...options.headers,
// //     },
// //   };

// //   const response = await fetch(url, config);
  
// //   if (!response.ok) {
// //     const errorData = await response.json().catch(() => ({}));
// //     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
// //   }

// //   return await response.json();
// // };

// // const FinancePurchaseRequisitions = () => {
// //     const [requisitions, setRequisitions] = useState([]);
// //     const [budgetCodes, setBudgetCodes] = useState([]);
// //     const [projects, setProjects] = useState([]);
// //     const [budgetOwners, setBudgetOwners] = useState([]);
// //     const [loadingProjects, setLoadingProjects] = useState(false);
// //     const [loadingBudgetOwners, setLoadingBudgetOwners] = useState(false);
// //     const [loading, setLoading] = useState(false);
// //     const [verificationModalVisible, setVerificationModalVisible] = useState(false);
// //     const [detailsModalVisible, setDetailsModalVisible] = useState(false);
// //     const [budgetCodeModalVisible, setBudgetCodeModalVisible] = useState(false);
// //     const [budgetCodeApprovalModalVisible, setBudgetCodeApprovalModalVisible] = useState(false);
// //     const [budgetCodeDetailsModalVisible, setBudgetCodeDetailsModalVisible] = useState(false);
// //     const [selectedRequisition, setSelectedRequisition] = useState(null);
// //     const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
// //     const [selectedBudgetCodeForApproval, setSelectedBudgetCodeForApproval] = useState(null);
// //     const [activeTab, setActiveTab] = useState('pending');
// //     const [mainSection, setMainSection] = useState('requisitions');
// //     const [stats, setStats] = useState({ 
// //         pending: 0, 
// //         verified: 0, 
// //         rejected: 0, 
// //         total: 0,
// //         totalBudgetAllocated: 0,
// //         budgetUtilization: 0
// //     });
// //     const [form] = Form.useForm();
// //     const [budgetCodeForm] = Form.useForm();
// //     const [budgetCodeApprovalForm] = Form.useForm();
// //     const [editingBudgetCode, setEditingBudgetCode] = useState(null);

// //     useEffect(() => {
// //         fetchRequisitions();
// //         fetchStats();
// //         fetchBudgetCodes();
// //         fetchProjects();
// //     }, []);

// //     const fetchRequisitions = async () => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance`);
            
// //             if (response.success && response.data) {
// //                 console.log('Finance requisitions fetched:', response.data);
// //                 setRequisitions(response.data);
// //             } else {
// //                 setRequisitions([]);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching finance requisitions:', error);
// //             message.error('Failed to fetch requisitions');
// //             setRequisitions([]);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const fetchStats = async () => {
// //         try {
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance/dashboard-data`);
            
// //             if (response.success && response.data) {
// //                 const financeData = response.data;
                
// //                 setStats({
// //                     pending: financeData.statistics?.pendingVerification || 0,
// //                     verified: financeData.statistics?.approvedThisMonth || 0,
// //                     rejected: financeData.statistics?.rejectedThisMonth || 0,
// //                     total: financeData.totalRequisitions || 0,
// //                     totalBudgetAllocated: financeData.statistics?.totalValue || 0,
// //                     budgetUtilization: response.data.finance?.overallUtilization || 0
// //                 });
// //             }
// //         } catch (error) {
// //             console.error('Error fetching stats:', error);
// //         }
// //     };

// //     const fetchBudgetCodes = async () => {
// //         try {
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`);
// //             if (response.success) {
// //                 setBudgetCodes(response.data);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching budget codes:', error);
// //         }
// //     };

// //     const fetchProjects = async () => {
// //         try {
// //             setLoadingProjects(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/projects/active`);
// //             if (response.success) {
// //                 setProjects(response.data);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching projects:', error);
// //             setProjects([]);
// //         } finally {
// //             setLoadingProjects(false);
// //         }
// //     };

// //     const fetchBudgetOwners = async () => {
// //         try {
// //             setLoadingBudgetOwners(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/active-users`);
            
// //             if (response.success && response.data) {
// //                 setBudgetOwners(response.data);
// //             } else {
// //                 setBudgetOwners([]);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching budget owners:', error);
// //             setBudgetOwners([]);
// //         } finally {
// //             setLoadingBudgetOwners(false);
// //         }
// //     };

// //     // ✅ NEW: Simplified verification - only approve/reject based on budget availability
// //     const handleVerification = async (values) => {
// //         if (!selectedRequisition) return;

// //         try {
// //             setLoading(true);
            
// //             // Simple verification data - only decision and comments
// //             const verificationData = {
// //                 decision: values.decision,
// //                 comments: values.comments
// //             };

// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/finance-verification`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify(verificationData)
// //                 }
// //             );

// //             if (response.success) {
// //                 message.success(`Budget verification ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`);
// //                 setVerificationModalVisible(false);
// //                 setSelectedRequisition(null);
// //                 form.resetFields();
// //                 fetchRequisitions();
// //                 fetchStats();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to process verification');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleCreateBudgetCode = async (values) => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify(values)
// //                 }
// //             );
            
// //             if (response.success) {
// //                 message.success('Budget code created successfully and sent for approval');
// //                 setBudgetCodeModalVisible(false);
// //                 budgetCodeForm.resetFields();
// //                 fetchBudgetCodes();
// //             } else {
// //                 message.error(response.message || 'Failed to create budget code');
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to create budget code');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleUpdateBudgetCode = async (values) => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes/${editingBudgetCode._id}`,
// //                 {
// //                     method: 'PUT',
// //                     body: JSON.stringify(values)
// //                 }
// //             );
            
// //             if (response.success) {
// //                 message.success('Budget code updated successfully');
// //                 setBudgetCodeModalVisible(false);
// //                 budgetCodeForm.resetFields();
// //                 setEditingBudgetCode(null);
// //                 fetchBudgetCodes();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error('Failed to update budget code');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleBudgetCodeApproval = async (values) => {
// //         if (!selectedBudgetCodeForApproval) return;

// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes/${selectedBudgetCodeForApproval._id}/approve`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify({
// //                         decision: values.decision,
// //                         comments: values.comments
// //                     })
// //                 }
// //             );

// //             if (response.success) {
// //                 message.success(`Budget code ${values.decision} successfully`);
// //                 setBudgetCodeApprovalModalVisible(false);
// //                 setSelectedBudgetCodeForApproval(null);
// //                 budgetCodeApprovalForm.resetFields();
// //                 fetchBudgetCodes();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to process approval');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleViewDetails = (requisition) => {
// //         setSelectedRequisition(requisition);
// //         setDetailsModalVisible(true);
// //     };

// //     // ✅ NEW: Initialize form with pre-selected budget code (read-only)
// //     const handleStartVerification = (requisition) => {
// //         setSelectedRequisition(requisition);
        
// //         // Set form with pre-selected budget code and current availability
// //         form.setFieldsValue({
// //             decision: 'approved',
// //             comments: ''
// //         });
        
// //         setVerificationModalVisible(true);
// //     };

// //     const openBudgetCodeModal = (budgetCode = null) => {
// //         setEditingBudgetCode(budgetCode);
// //         if (budgetCode) {
// //             budgetCodeForm.setFieldsValue(budgetCode);
// //         } else {
// //             budgetCodeForm.resetFields();
// //         }
// //         setBudgetCodeModalVisible(true);
        
// //         if (projects.length === 0) {
// //             fetchProjects();
// //         }
        
// //         if (budgetOwners.length === 0) {
// //             fetchBudgetOwners();
// //         }
// //     };

// //     const openBudgetCodeApprovalModal = (budgetCode) => {
// //         setSelectedBudgetCodeForApproval(budgetCode);
// //         budgetCodeApprovalForm.resetFields();
// //         setBudgetCodeApprovalModalVisible(true);
// //     };

// //     const viewBudgetCodeDetails = (budgetCode) => {
// //         setSelectedBudgetCode(budgetCode);
// //         setBudgetCodeDetailsModalVisible(true);
// //     };

// //     const getStatusTag = (status) => {
// //         const statusMap = {
// //             'pending_finance_verification': { color: 'orange', text: 'Pending Verification', icon: <ClockCircleOutlined /> },
// //             'pending_supply_chain_review': { color: 'blue', text: 'Finance Approved', icon: <CheckCircleOutlined /> },
// //             'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
// //             'rejected': { color: 'red', text: 'Budget Rejected', icon: <CloseCircleOutlined /> },
// //             'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
// //             'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
// //         };

// //         const config = statusMap[status] || { color: 'default', text: status, icon: null };
// //         return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
// //     };

// //     const getBudgetCodeStatusTag = (status) => {
// //         const statusMap = {
// //             'pending': { color: 'default', text: 'Pending' },
// //             'pending_departmental_head': { color: 'orange', text: 'Pending Dept Head' },
// //             'pending_head_of_business': { color: 'gold', text: 'Pending HOB' },
// //             'pending_finance': { color: 'blue', text: 'Pending Finance' },
// //             'active': { color: 'green', text: 'Active' },
// //             'rejected': { color: 'red', text: 'Rejected' },
// //             'suspended': { color: 'red', text: 'Suspended' },
// //             'expired': { color: 'default', text: 'Expired' }
// //         };

// //         const config = statusMap[status] || { color: 'default', text: status };
// //         return <Tag color={config.color}>{config.text}</Tag>;
// //     };

// //     const getBudgetCodeStatus = (budgetCode) => {
// //         const utilizationRate = (budgetCode.used / budgetCode.budget) * 100;
// //         if (utilizationRate >= 90) return { color: 'red', text: 'Critical' };
// //         if (utilizationRate >= 75) return { color: 'orange', text: 'High' };
// //         if (utilizationRate >= 50) return { color: 'blue', text: 'Moderate' };
// //         return { color: 'green', text: 'Low' };
// //     };

// //     const getFilteredRequisitions = () => {
// //         if (!Array.isArray(requisitions) || requisitions.length === 0) {
// //             return [];
// //         }
        
// //         let filtered = [];
        
// //         switch (activeTab) {
// //             case 'pending':
// //                 filtered = requisitions.filter(r => {
// //                     if (r.status === 'pending_finance_verification') {
// //                         return true;
// //                     }
                    
// //                     if (r.approvalChain && r.approvalChain.length > 0) {
// //                         const financeStep = r.approvalChain.find(step => 
// //                             step.approver.role.includes('Finance') && 
// //                             step.status === 'pending'
// //                         );
// //                         return financeStep !== undefined;
// //                     }
                    
// //                     return false;
// //                 });
// //                 break;
                
// //             case 'approved':
// //                 filtered = requisitions.filter(r => 
// //                     r.financeVerification?.decision === 'approved' ||
// //                     r.status === 'pending_head_approval' ||
// //                     r.status === 'approved' || 
// //                     r.status === 'in_procurement' ||
// //                     r.status === 'completed' ||
// //                     r.status === 'delivered' ||
// //                     r.status === 'procurement_complete'
// //                 );
// //                 break;
                
// //             case 'rejected':
// //                 filtered = requisitions.filter(r => 
// //                     r.financeVerification?.decision === 'rejected' ||
// //                     r.status === 'rejected'
// //                 );
// //                 break;
                
// //             case 'all':
// //             default:
// //                 filtered = requisitions;
// //                 break;
// //         }
        
// //         return filtered;
// //     };

// //     const requisitionColumns = [
// //         {
// //             title: 'Requisition Details',
// //             key: 'requisition',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>{record.title || 'No Title'}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '12px' }}>
// //                         {record.requisitionNumber || `REQ-${record._id?.slice(-6)?.toUpperCase()}`}
// //                     </Text>
// //                     <br />
// //                     <Tag size="small" color="blue">{record.itemCategory || 'N/A'}</Tag>
// //                     {/* ✅ NEW: Show pre-selected budget code */}
// //                     {record.budgetCodeInfo?.code && (
// //                         <Tag size="small" color="gold">
// //                             <TagOutlined /> {record.budgetCodeInfo.code}
// //                         </Tag>
// //                     )}
// //                 </div>
// //             ),
// //             width: 220
// //         },
// //         {
// //             title: 'Employee',
// //             key: 'employee',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>{record.employee?.fullName || 'N/A'}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '12px' }}>
// //                         {record.employee?.department || record.department || 'N/A'}
// //                     </Text>
// //                 </div>
// //             ),
// //             width: 150
// //         },
// //         {
// //             title: 'Budget Information',
// //             key: 'budget',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong style={{ color: '#1890ff' }}>
// //                         XAF {record.budgetXAF ? record.budgetXAF.toLocaleString() : 'Not specified'}
// //                     </Text>
// //                     <br />
// //                     {/* ✅ NEW: Show budget code details */}
// //                     {record.budgetCodeInfo && (
// //                         <>
// //                             <Text type="secondary" style={{ fontSize: '11px' }}>
// //                                 Code: {record.budgetCodeInfo.code}
// //                             </Text>
// //                             <br />
// //                             <Text type="secondary" style={{ fontSize: '11px' }}>
// //                                 Available: XAF {record.budgetCodeInfo.availableAtSubmission?.toLocaleString()}
// //                             </Text>
// //                         </>
// //                     )}
// //                 </div>
// //             ),
// //             width: 150,
// //             sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0)
// //         },
// //         {
// //             title: 'Items Count',
// //             dataIndex: 'items',
// //             key: 'items',
// //             render: (items) => (
// //                 <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
// //                     <ShoppingCartOutlined style={{ fontSize: '18px' }} />
// //                 </Badge>
// //             ),
// //             width: 80,
// //             align: 'center'
// //         },
// //         {
// //             title: 'Priority',
// //             dataIndex: 'urgency',
// //             key: 'urgency',
// //             render: (urgency) => {
// //                 const urgencyColors = {
// //                     'Low': 'green',
// //                     'Medium': 'orange',
// //                     'High': 'red'
// //                 };
// //                 return <Tag color={urgencyColors[urgency] || 'default'}>{urgency || 'N/A'}</Tag>;
// //             },
// //             width: 80
// //         },
// //         {
// //             title: 'Expected Date',
// //             dataIndex: 'expectedDate',
// //             key: 'expectedDate',
// //             render: (date) => {
// //                 if (!date) return 'N/A';
// //                 const expectedDate = new Date(date);
// //                 const today = new Date();
// //                 const daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
                
// //                 return (
// //                     <div>
// //                         <Text>{expectedDate.toLocaleDateString('en-GB')}</Text>
// //                         <br />
// //                         <Text type="secondary" style={{ fontSize: '11px' }}>
// //                             {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
// //                         </Text>
// //                     </div>
// //                 );
// //             },
// //             width: 100,
// //             sorter: (a, b) => new Date(a.expectedDate) - new Date(b.expectedDate)
// //         },
// //         {
// //             title: 'Status',
// //             dataIndex: 'status',
// //             key: 'status',
// //             render: (status) => getStatusTag(status),
// //             width: 130
// //         },
// //         {
// //             title: 'Actions',
// //             key: 'actions',
// //             render: (_, record) => (
// //                 <Space size="small">
// //                     <Tooltip title="View Details">
// //                         <Button
// //                             size="small"
// //                             icon={<EyeOutlined />}
// //                             onClick={() => handleViewDetails(record)}
// //                         />
// //                     </Tooltip>
// //                     {(record.status === 'pending_finance_verification' || 
// //                       record.financeVerification?.decision === 'pending') && (
// //                         <Tooltip title="Verify Budget">
// //                             <Button
// //                                 size="small"
// //                                 type="primary"
// //                                 icon={<AuditOutlined />}
// //                                 onClick={() => handleStartVerification(record)}
// //                             >
// //                                 Verify
// //                             </Button>
// //                         </Tooltip>
// //                     )}
// //                 </Space>
// //             ),
// //             width: 100,
// //             fixed: 'right'
// //         }
// //     ];

// //     const budgetCodeColumns = [
// //         {
// //             title: 'Budget Code',
// //             dataIndex: 'code',
// //             key: 'code',
// //             render: (code, record) => (
// //                 <div>
// //                     <Text strong code>{code}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
// //                 </div>
// //             )
// //         },
// //         {
// //             title: 'Budget Allocation',
// //             key: 'budget',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>XAF {record.budget.toLocaleString()}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '11px' }}>
// //                         Used: XAF {record.used.toLocaleString()}
// //                     </Text>
// //                 </div>
// //             )
// //         },
// //         {
// //             title: 'Utilization',
// //             key: 'utilization',
// //             render: (_, record) => {
// //                 const percentage = Math.round((record.used / record.budget) * 100);
// //                 const status = getBudgetCodeStatus(record);
// //                 return (
// //                     <div>
// //                         <Progress 
// //                             percent={percentage} 
// //                             size="small" 
// //                             status={status.color === 'red' ? 'exception' : status.color === 'orange' ? 'active' : 'success'}
// //                         />
// //                         <Text type="secondary" style={{ fontSize: '11px' }}>
// //                             {percentage}% utilized
// //                         </Text>
// //                     </div>
// //                 );
// //             }
// //         },
// //         {
// //             title: 'Status',
// //             dataIndex: 'status',
// //             key: 'status',
// //             render: (status) => getBudgetCodeStatusTag(status)
// //         },
// //         {
// //             title: 'Actions',
// //             key: 'actions',
// //             render: (_, record) => (
// //                 <Space size="small">
// //                     <Button
// //                         size="small"
// //                         icon={<EyeOutlined />}
// //                         onClick={() => viewBudgetCodeDetails(record)}
// //                     >
// //                         View
// //                     </Button>
// //                     {record.status !== 'active' && record.status !== 'rejected' && (
// //                         <Button 
// //                             size="small" 
// //                             type="primary"
// //                             onClick={() => openBudgetCodeApprovalModal(record)}
// //                         >
// //                             Review
// //                         </Button>
// //                     )}
// //                     {(record.status === 'active' || record.status === 'rejected') && (
// //                         <Button
// //                             size="small"
// //                             icon={<EditOutlined />}
// //                             onClick={() => openBudgetCodeModal(record)}
// //                         >
// //                             Edit
// //                         </Button>
// //                     )}
// //                 </Space>
// //             )
// //         }
// //     ];

// //     // ✅ NEW: Calculate budget status for verification modal
// //     const getBudgetVerificationStatus = (requisition) => {
// //         if (!requisition?.budgetCode || !requisition?.budgetCodeInfo) {
// //             return null;
// //         }

// //         const budgetCode = budgetCodes.find(bc => bc._id === requisition.budgetCode);
// //         if (!budgetCode) return null;

// //         const currentAvailable = budgetCode.budget - budgetCode.used;
// //         const requiredAmount = requisition.budgetXAF || 0;
// //         const isSufficient = currentAvailable >= requiredAmount;

// //         return {
// //             code: budgetCode.code,
// //             name: budgetCode.name,
// //             department: budgetCode.department,
// //             totalBudget: budgetCode.budget,
// //             used: budgetCode.used,
// //             currentAvailable: currentAvailable,
// //             requiredAmount: requiredAmount,
// //             isSufficient: isSufficient,
// //             submissionAvailable: requisition.budgetCodeInfo.availableAtSubmission,
// //             remainingAfter: currentAvailable - requiredAmount,
// //             utilizationRate: Math.round((budgetCode.used / budgetCode.budget) * 100)
// //         };
// //     };

// //     return (
// //         <div style={{ padding: '24px' }}>
// //             {/* Main Navigation Buttons */}
// //             <div style={{ marginBottom: '24px' }}>
// //                 <Space size="large">
// //                     <Button
// //                         type={mainSection === 'requisitions' ? 'primary' : 'default'}
// //                         size="large"
// //                         icon={<BankOutlined />}
// //                         onClick={() => setMainSection('requisitions')}
// //                     >
// //                         Requisition Management
// //                     </Button>
// //                     <Button
// //                         type={mainSection === 'budgetCodes' ? 'primary' : 'default'}
// //                         size="large"
// //                         icon={<TagOutlined />}
// //                         onClick={() => setMainSection('budgetCodes')}
// //                     >
// //                         Budget Code Management
// //                     </Button>
// //                 </Space>
// //             </div>

// //             {/* Requisition Management Section */}
// //             {mainSection === 'requisitions' && (
// //                 <Card>
// //                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
// //                         <Title level={2} style={{ margin: 0 }}>
// //                             <BankOutlined /> Finance - Purchase Requisition Budget Verification
// //                         </Title>
// //                         <Space>
// //                             <Button
// //                                 icon={<ReloadOutlined />}
// //                                 onClick={() => {
// //                                     fetchRequisitions();
// //                                     fetchStats();
// //                                 }}
// //                                 loading={loading}
// //                             >
// //                                 Refresh
// //                             </Button>
// //                             <Button
// //                                 icon={<ContactsOutlined />}
// //                                 onClick={() => window.open('/finance/suppliers', '_blank')}
// //                             >
// //                                 Vendor Portal
// //                             </Button>
// //                         </Space>
// //                     </div>

// //                     <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
// //                         <Row gutter={16}>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Pending Verification"
// //                                     value={stats.pending}
// //                                     valueStyle={{ color: '#faad14' }}
// //                                     prefix={<ClockCircleOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Budget Approved"
// //                                     value={stats.verified}
// //                                     valueStyle={{ color: '#52c41a' }}
// //                                     prefix={<CheckCircleOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Total Budget Allocated"
// //                                     value={`XAF ${stats.totalBudgetAllocated.toLocaleString()}`}
// //                                     valueStyle={{ color: '#1890ff' }}
// //                                     prefix={<DollarOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Budget Utilization"
// //                                     value={stats.budgetUtilization}
// //                                     suffix="%"
// //                                     valueStyle={{ color: '#722ed1' }}
// //                                     prefix={<BarChartOutlined />}
// //                                 />
// //                             </Col>
// //                         </Row>
// //                     </Card>

// //                     <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={getFilteredRequisitions().length} size="small">
// //                                     <span>Pending Verification</span>
// //                                 </Badge>
// //                             } 
// //                             key="pending"
// //                         />
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={requisitions.filter(r => 
// //                                     r.status === 'pending_supply_chain_review' || 
// //                                     r.status === 'approved' || 
// //                                     r.status === 'in_procurement' ||
// //                                     r.status === 'completed'
// //                                 ).length} size="small">
// //                                     <span>Approved</span>
// //                                 </Badge>
// //                             } 
// //                             key="approved"
// //                         />
// //                         <TabPane tab="Rejected" key="rejected" />
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={requisitions.length} size="small">
// //                                     <span>All</span>
// //                                 </Badge>
// //                             } 
// //                             key="all"
// //                         />
// //                     </Tabs>

// //                     <Table
// //                         columns={requisitionColumns}
// //                         dataSource={getFilteredRequisitions()}
// //                         loading={loading}
// //                         rowKey="_id"
// //                         pagination={{
// //                             showSizeChanger: true,
// //                             showQuickJumper: true,
// //                             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
// //                         }}
// //                         scroll={{ x: 1200 }}
// //                         size="small"
// //                     />
// //                 </Card>
// //             )}

// //             {/* Budget Code Management Section */}
// //             {mainSection === 'budgetCodes' && (
// //                 <Card>
// //                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
// //                     <Title level={2} style={{ margin: 0 }}>
// //                         <TagOutlined /> Budget Code Management
// //                     </Title>
// //                     <Button
// //                         type="primary"
// //                         icon={<PlusOutlined />}
// //                         onClick={() => openBudgetCodeModal()}
// //                     >
// //                         Create Budget Code
// //                     </Button>
// //                 </div>

// //                 <Alert
// //                     message="Budget Code Management"
// //                     description="Create and manage budget codes for purchase requisitions. Track budget allocation and utilization across different departments and projects."
// //                     type="info"
// //                     showIcon
// //                     style={{ marginBottom: '16px' }}
// //                 />

// //                 <Table
// //                     columns={budgetCodeColumns}
// //                     dataSource={budgetCodes}
// //                     loading={loading}
// //                     rowKey="_id"
// //                     pagination={{
// //                         showSizeChanger: true,
// //                         showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
// //                     }}
// //                 />
// //             </Card>
// //         )}

// //         {/* ✅ NEW: Simplified Budget Verification Modal */}
// //         <Modal
// //             title={
// //                 <Space>
// //                     <AuditOutlined />
// //                     Budget Verification - {selectedRequisition?.title}
// //                 </Space>
// //             }
// //             open={verificationModalVisible}
// //             onCancel={() => {
// //                 setVerificationModalVisible(false);
// //                 setSelectedRequisition(null);
// //                 form.resetFields();
// //             }}
// //             footer={null}
// //             width={900}
// //         >
// //             {selectedRequisition && (
// //                 <div>
// //                     {/* Requisition Summary */}
// //                     <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
// //                         <Descriptions column={2} size="small">
// //                             <Descriptions.Item label="Employee">
// //                                 <Text strong>{selectedRequisition.employee?.fullName}</Text>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Department">
// //                                 <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Category">
// //                                 <Tag color="green">{selectedRequisition.itemCategory}</Tag>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Priority">
// //                                 <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
// //                                     {selectedRequisition.urgency}
// //                                 </Tag>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Requested Budget">
// //                                 <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
// //                                     XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
// //                                 </Text>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Expected Date">
// //                                 <Text>{new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}</Text>
// //                             </Descriptions.Item>
// //                         </Descriptions>
// //                     </Card>

// //                     {/* ✅ NEW: Budget Code Information (Read-Only) */}
// //                     {(() => {
// //                         const budgetStatus = getBudgetVerificationStatus(selectedRequisition);
// //                         if (!budgetStatus) {
// //                             return (
// //                                 <Alert
// //                                     message="No Budget Code Selected"
// //                                     description="This requisition does not have a budget code assigned. Please ask the employee to resubmit with a budget code."
// //                                     type="error"
// //                                     showIcon
// //                                     style={{ marginBottom: '20px' }}
// //                                 />
// //                             );
// //                         }

// //                         return (
// //                             <Card 
// //                                 size="small" 
// //                                 title={
// //                                     <Space>
// //                                         <TagOutlined />
// //                                         Pre-Selected Budget Code (Read-Only)
// //                                     </Space>
// //                                 }
// //                                 style={{ marginBottom: '20px' }}
// //                             >
// //                                 <Descriptions column={2} size="small" bordered>
// //                                     <Descriptions.Item label="Budget Code" span={2}>
// //                                         <Text code strong>{budgetStatus.code}</Text> - {budgetStatus.name}
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Department">
// //                                         <Tag color="blue">{budgetStatus.department}</Tag>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Total Budget">
// //                                         <Text strong>XAF {budgetStatus.totalBudget.toLocaleString()}</Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Used">
// //                                         <Text>XAF {budgetStatus.used.toLocaleString()}</Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Current Available">
// //                                         <Text strong style={{ color: budgetStatus.isSufficient ? '#52c41a' : '#ff4d4f' }}>
// //                                             XAF {budgetStatus.currentAvailable.toLocaleString()}
// //                                         </Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Required Amount">
// //                                         <Text strong style={{ color: '#1890ff' }}>
// //                                             XAF {budgetStatus.requiredAmount.toLocaleString()}
// //                                         </Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Utilization Rate">
// //                                         <Progress 
// //                                             percent={budgetStatus.utilizationRate} 
// //                                             size="small"
// //                                             status={budgetStatus.utilizationRate >= 90 ? 'exception' : budgetStatus.utilizationRate >= 75 ? 'active' : 'success'}
// //                                         />
// //                                     </Descriptions.Item>
// //                                 </Descriptions>

// //                                 {/* Budget Availability Status */}
// //                                 <div style={{ marginTop: '16px' }}>
// //                                     {budgetStatus.isSufficient ? (
// //                                         <Alert
// //                                             message={
// //                                                 <Space>
// //                                                     <CheckCircleOutlined style={{ color: '#52c41a' }} />
// //                                                     <Text strong style={{ color: '#52c41a' }}>
// //                                                         Sufficient Budget Available
// //                                                     </Text>
// //                                                 </Space>
// //                                             }
// //                                             description={
// //                                                 <div>
// //                                                     <Text>
// //                                                         The budget code has sufficient funds to cover this requisition.
// //                                                     </Text>
// //                                                     <Divider style={{ margin: '8px 0' }} />
// //                                                     <Row gutter={16}>
// //                                                         <Col span={12}>
// //                                                             <Text type="secondary">Available at Submission:</Text>
// //                                                             <br />
// //                                                             <Text strong>XAF {budgetStatus.submissionAvailable?.toLocaleString()}</Text>
// //                                                         </Col>
// //                                                         <Col span={12}>
// //                                                             <Text type="secondary">Remaining After Approval:</Text>
// //                                                             <br />
// //                                                             <Text strong style={{ color: '#52c41a' }}>
// //                                                                 XAF {budgetStatus.remainingAfter.toLocaleString()}
// //                                                             </Text>
// //                                                         </Col>
// //                                                     </Row>
// //                                                 </div>
// //                                             }
// //                                             type="success"
// //                                             showIcon
// //                                         />
// //                                     ) : (
// //                                         <Alert
// //                                             message={
// //                                                 <Space>
// //                                                     <WarningOutlined style={{ color: '#ff4d4f' }} />
// //                                                     <Text strong style={{ color: '#ff4d4f' }}>
// //                                                         Insufficient Budget
// //                                                     </Text>
// //                                                 </Space>
// //                                             }
// //                                             description={
// //                                                 <div>
// //                                                     <Text>
// //                                                         The budget code does not have sufficient funds to cover this requisition.
// //                                                     </Text>
// //                                                     <Divider style={{ margin: '8px 0' }} />
// //                                                     <Row gutter={16}>
// //                                                         <Col span={12}>
// //                                                             <Text type="secondary">Current Available:</Text>
// //                                                             <br />
// //                                                             <Text strong>XAF {budgetStatus.currentAvailable.toLocaleString()}</Text>
// //                                                         </Col>
// //                                                         <Col span={12}>
// //                                                             <Text type="secondary">Shortfall:</Text>
// //                                                             <br />
// //                                                             <Text strong style={{ color: '#ff4d4f' }}>
// //                                                                 XAF {(budgetStatus.requiredAmount - budgetStatus.currentAvailable).toLocaleString()}
// //                                                             </Text>
// //                                                         </Col>
// //                                                     </Row>
// //                                                     <Divider style={{ margin: '8px 0' }} />
// //                                                     <Text type="danger">
// //                                                         <InfoCircleOutlined /> You should reject this requisition or request the employee to select a different budget code.
// //                                                     </Text>
// //                                                 </div>
// //                                             }
// //                                             type="error"
// //                                             showIcon
// //                                         />
// //                                     )}
// //                                 </div>
// //                             </Card>
// //                         );
// //                     })()}

// //                     {/* ✅ NEW: Simplified Verification Form */}
// //                     <Form
// //                         form={form}
// //                         layout="vertical"
// //                         onFinish={handleVerification}
// //                     >
// //                         <Alert
// //                             message="Finance Verification"
// //                             description="Review the budget code information above and decide whether to approve or reject this requisition based on budget availability."
// //                             type="info"
// //                             showIcon
// //                             style={{ marginBottom: '16px' }}
// //                         />

// //                         <Form.Item
// //                             name="decision"
// //                             label="Verification Decision"
// //                             rules={[{ required: true, message: 'Please select your decision' }]}
// //                         >
// //                             <Select 
// //                                 placeholder="Select your decision"
// //                                 size="large"
// //                             >
// //                                 <Option value="approved">
// //                                     <Space>
// //                                         <CheckCircleOutlined style={{ color: '#52c41a' }} />
// //                                         <Text strong>✅ Approve - Budget Available</Text>
// //                                     </Space>
// //                                 </Option>
// //                                 <Option value="rejected">
// //                                     <Space>
// //                                         <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
// //                                         <Text strong>❌ Reject - Insufficient Budget / Other Reason</Text>
// //                                     </Space>
// //                                 </Option>
// //                             </Select>
// //                         </Form.Item>

// //                         <Form.Item
// //                             name="comments"
// //                             label="Verification Comments"
// //                             rules={[{ required: true, message: 'Please provide verification comments' }]}
// //                             help="Explain your decision. If rejecting, specify the reason."
// //                         >
// //                             <TextArea
// //                                 rows={4}
// //                                 placeholder="Enter your comments about budget verification..."
// //                                 showCount
// //                                 maxLength={500}
// //                             />
// //                         </Form.Item>

// //                         <Form.Item>
// //                             <Space>
// //                                 <Button onClick={() => {
// //                                     setVerificationModalVisible(false);
// //                                     setSelectedRequisition(null);
// //                                     form.resetFields();
// //                                 }}>
// //                                     Cancel
// //                                 </Button>
// //                                 <Button
// //                                     type="primary"
// //                                     htmlType="submit"
// //                                     loading={loading}
// //                                     icon={<SendOutlined />}
// //                                     size="large"
// //                                 >
// //                                     Submit Verification
// //                                 </Button>
// //                             </Space>
// //                         </Form.Item>
// //                     </Form>
// //                 </div>
// //             )}
// //         </Modal>

// //         {/* Budget Code Create/Edit Modal - UNCHANGED */}
// //         <Modal
// //             title={
// //                 <Space>
// //                     <TagOutlined />
// //                     {editingBudgetCode ? 'Edit Budget Code' : 'Create New Budget Code'}
// //                 </Space>
// //             }
// //             open={budgetCodeModalVisible}
// //             onCancel={() => {
// //                 setBudgetCodeModalVisible(false);
// //                 budgetCodeForm.resetFields();
// //                 setEditingBudgetCode(null);
// //             }}
// //             footer={null}
// //             width={600}
// //         >
// //             <Form
// //                 form={budgetCodeForm}
// //                 layout="vertical"
// //                 onFinish={editingBudgetCode ? handleUpdateBudgetCode : handleCreateBudgetCode}
// //             >
// //                 <Row gutter={16}>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="code"
// //                             label="Budget Code"
// //                             rules={[
// //                                 { required: true, message: 'Please enter budget code' },
// //                                 { pattern: /^[A-Z0-9\-_]+$/, message: 'Only uppercase letters, numbers, hyphens and underscores allowed' }
// //                             ]}
// //                             help="Use format like DEPT-IT-2024 or PROJ-ALPHA-2024"
// //                         >
// //                             <Input
// //                                 placeholder="e.g., DEPT-IT-2024"
// //                                 disabled={!!editingBudgetCode}
// //                                 style={{ textTransform: 'uppercase' }}
// //                             />
// //                         </Form.Item>
// //                     </Col>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="name"
// //                             label="Budget Name"
// //                             rules={[{ required: true, message: 'Please enter budget name' }]}
// //                         >
// //                             <Input placeholder="e.g., IT Department 2024 Budget" />
// //                         </Form.Item>
// //                     </Col>
// //                 </Row>

// //                 <Row gutter={16}>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="budget"
// //                             label="Total Budget Allocation (XAF)"
// //                             rules={[{ required: true, message: 'Please enter budget amount' }]}
// //                         >
// //                             <InputNumber
// //                                 style={{ width: '100%' }}
// //                                 formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
// //                                 parser={value => value.replace(/\$\s?|(,*)/g, '')}
// //                                 min={0}
// //                                 placeholder="Enter total budget"
// //                             />
// //                         </Form.Item>
// //                     </Col>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="department"
// //                             label="Department/Project"
// //                             rules={[{ required: true, message: 'Please select department or project' }]}
// //                             help="Select existing department or active project"
// //                         >
// //                             <Select 
// //                                 placeholder="Select department or project"
// //                                 showSearch
// //                                 loading={loadingProjects}
// //                             >
// //                                 <Select.OptGroup label="Departments">
// //                                     <Option value="Technical Operations">Technical Operations</Option>
// //                                     <Option value="Technical Roll Out">Technical Roll Out</Option>
// //                                     <Option value="Technical QHSE">Technical QHSE</Option>
// //                                     <Option value="IT">IT Department</Option>
// //                                     <Option value="Finance">Finance</Option>
// //                                     <Option value="HR">Human Resources</Option>
// //                                     <Option value="Marketing">Marketing</Option>
// //                                     <Option value="Supply Chain">Supply Chain</Option>
// //                                     <Option value="Business">Business</Option>
// //                                     <Option value="Facilities">Facilities</Option>
// //                                 </Select.OptGroup>
// //                                 <Select.OptGroup label="Active Projects">
// //                                     {projects.map(project => (
// //                                         <Option key={`project-${project._id}`} value={`PROJECT-${project._id}`}>
// //                                             {project.name} ({project.department})
// //                                         </Option>
// //                                     ))}
// //                                 </Select.OptGroup>
// //                             </Select>
// //                         </Form.Item>
// //                     </Col>
// //                 </Row>

// //                 <Row gutter={16}>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="budgetType"
// //                             label="Budget Type"
// //                             rules={[{ required: true, message: 'Please select budget type' }]}
// //                         >
// //                             <Select placeholder="Select budget type">
// //                                 <Option value="OPEX">OPEX - Operating Expenses</Option>
// //                                 <Option value="CAPEX">CAPEX - Capital Expenditure</Option>
// //                                 <Option value="PROJECT">PROJECT - Project Budget</Option>
// //                                 <Option value="OPERATIONAL">OPERATIONAL - Operational</Option>
// //                             </Select>
// //                         </Form.Item>
// //                     </Col>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="budgetPeriod"
// //                             label="Budget Period"
// //                             rules={[{ required: true, message: 'Please select budget period' }]}
// //                         >
// //                             <Select placeholder="Select budget period">
// //                                 <Option value="monthly">Monthly</Option>
// //                                 <Option value="quarterly">Quarterly</Option>
// //                                 <Option value="yearly">Yearly</Option>
// //                                 <Option value="project">Project Duration</Option>
// //                             </Select>
// //                         </Form.Item>
// //                     </Col>
// //                 </Row>

// //                 <Form.Item
// //                     name="description"
// //                     label="Budget Description"
// //                     help="Provide details about what this budget covers"
// //                 >
// //                     <TextArea
// //                         rows={3}
// //                         placeholder="Describe the purpose and scope of this budget allocation..."
// //                         showCount
// //                         maxLength={300}
// //                     />
// //                 </Form.Item>

// //                 <Row gutter={16}>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="budgetOwner"
// //                             label="Budget Owner"
// //                             rules={[{ required: true, message: 'Please select budget owner' }]}
// //                             help="Person responsible for this budget"
// //                         >
// //                             <Select
// //                                 placeholder="Select budget owner"
// //                                 showSearch
// //                                 loading={loadingBudgetOwners}
// //                                 filterOption={(input, option) => {
// //                                     const user = budgetOwners.find(u => u._id === option.value);
// //                                     if (!user) return false;
// //                                     return (
// //                                         (user.fullName || '').toLowerCase().includes(input.toLowerCase()) ||
// //                                         (user.email || '').toLowerCase().includes(input.toLowerCase())
// //                                     );
// //                                 }}
// //                                 notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : "No users found"}
// //                             >
// //                                 {budgetOwners.map(user => (
// //                                     <Option key={user._id} value={user._id}>
// //                                         <div>
// //                                             <Text strong>{user.fullName}</Text>
// //                                             <br />
// //                                             <Text type="secondary" style={{ fontSize: '12px' }}>
// //                                                 {user.role} | {user.department}
// //                                             </Text>
// //                                         </div>
// //                                     </Option>
// //                                 ))}
// //                             </Select>
// //                         </Form.Item>
// //                     </Col>
// //                     <Col span={12}>
// //                         <Form.Item
// //                             name="active"
// //                             label="Status"
// //                             valuePropName="checked"
// //                             initialValue={true}
// //                         >
// //                             <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
// //                         </Form.Item>
// //                     </Col>
// //                 </Row>

// //                 <Form.Item>
// //                     <Space>
// //                         <Button onClick={() => {
// //                             setBudgetCodeModalVisible(false);
// //                             budgetCodeForm.resetFields();
// //                             setEditingBudgetCode(null);
// //                         }}>
// //                             Cancel
// //                         </Button>
// //                         <Button
// //                             type="primary"
// //                             htmlType="submit"
// //                             loading={loading}
// //                             icon={editingBudgetCode ? <EditOutlined /> : <PlusOutlined />}
// //                         >
// //                             {editingBudgetCode ? 'Update Budget Code' : 'Create Budget Code'}
// //                         </Button>
// //                     </Space>
// //                 </Form.Item>
// //             </Form>
// //         </Modal>

// //         {/* Budget Code Approval Modal - UNCHANGED */}
// //         <Modal
// //             title={
// //                 <Space>
// //                     <AuditOutlined />
// //                     Budget Code Approval - {selectedBudgetCodeForApproval?.code}
// //                 </Space>
// //             }
// //             open={budgetCodeApprovalModalVisible}
// //             onCancel={() => {
// //                 setBudgetCodeApprovalModalVisible(false);
// //                 setSelectedBudgetCodeForApproval(null);
// //                 budgetCodeApprovalForm.resetFields();
// //             }}
// //             footer={null}
// //             width={700}
// //         >
// //             {selectedBudgetCodeForApproval && (
// //                 <div>
// //                     <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
// //                         <Descriptions column={2} size="small">
// //                             <Descriptions.Item label="Budget Code">
// //                                 <Text strong code>{selectedBudgetCodeForApproval.code}</Text>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Name">
// //                                 {selectedBudgetCodeForApproval.name}
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Budget Amount">
// //                                 <Text strong style={{ color: '#1890ff' }}>
// //                                     XAF {selectedBudgetCodeForApproval.budget?.toLocaleString()}
// //                                 </Text>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Department">
// //                                 <Tag color="blue">{selectedBudgetCodeForApproval.department}</Tag>
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Budget Type">
// //                                 {selectedBudgetCodeForApproval.budgetType}
// //                             </Descriptions.Item>
// //                             <Descriptions.Item label="Current Status">
// //                                 {getBudgetCodeStatusTag(selectedBudgetCodeForApproval.status)}
// //                             </Descriptions.Item>
// //                         </Descriptions>
// //                     </Card>

// //                     {selectedBudgetCodeForApproval.approvalChain && (
// //                         <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
// //                             <Timeline>
// //                                 {selectedBudgetCodeForApproval.approvalChain.map((step, index) => {
// //                                     const color = step.status === 'approved' ? 'green' : 
// //                                                  step.status === 'rejected' ? 'red' : 'gray';
// //                                     const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
// //                                                 step.status === 'rejected' ? <CloseCircleOutlined /> :
// //                                                 <ClockCircleOutlined />;
                                    
// //                                     return (
// //                                         <Timeline.Item key={index} color={color} dot={icon}>
// //                                             <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                             <br />
// //                                             <Text type="secondary">{step.approver.role}</Text>
// //                                             <br />
// //                                             <Tag color={color}>{step.status.toUpperCase()}</Tag>
// //                                             {step.actionDate && (
// //                                                 <>
// //                                                     <br />
// //                                                     <Text type="secondary">
// //                                                         {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
// //                                                     </Text>
// //                                                 </>
// //                                             )}
// //                                             {step.comments && (
// //                                                 <div style={{ marginTop: 4 }}>
// //                                                     <Text italic>"{step.comments}"</Text>
// //                                                 </div>
// //                                             )}
// //                                         </Timeline.Item>
// //                                     );
// //                                 })}
// //                             </Timeline>
// //                         </Card>
// //                     )}

// //                     <Form
// //                         form={budgetCodeApprovalForm}
// //                         layout="vertical"
// //                         onFinish={handleBudgetCodeApproval}
// //                     >
// //                         <Form.Item
// //                             name="decision"
// //                             label="Approval Decision"
// //                             rules={[{ required: true, message: 'Please select your decision' }]}
// //                         >
// //                             <Select placeholder="Select decision">
// //                                 <Option value="approved">✅ Approve Budget Code</Option>
// //                                 <Option value="rejected">❌ Reject Budget Code</Option>
// //                             </Select>
// //                         </Form.Item>

// //                         <Form.Item
// //                             name="comments"
// //                             label="Comments"
// //                             rules={[{ required: true, message: 'Please provide comments for your decision' }]}
// //                         >
// //                             <TextArea
// //                                 rows={4}
// //                                 placeholder="Enter your comments, reasons, or recommendations..."
// //                                 showCount
// //                                 maxLength={500}
// //                             />
// //                         </Form.Item>

// //                         <Form.Item>
// //                             <Space>
// //                                 <Button onClick={() => {
// //                                     setBudgetCodeApprovalModalVisible(false);
// //                                     setSelectedBudgetCodeForApproval(null);
// //                                     budgetCodeApprovalForm.resetFields();
// //                                 }}>
// //                                     Cancel
// //                                 </Button>
// //                                 <Button
// //                                     type="primary"
// //                                     htmlType="submit"
// //                                     loading={loading}
// //                                     icon={<SendOutlined />}
// //                                 >
// //                                     Submit Decision
// //                                 </Button>
// //                             </Space>
// //                         </Form.Item>
// //                     </Form>
// //                 </div>
// //             )}
// //         </Modal>

// //         {/* Budget Code Details Modal - UNCHANGED */}
// //         <Modal
// //             title={
// //                 <Space>
// //                     <TagOutlined />
// //                     Budget Code Details
// //                 </Space>
// //             }
// //             open={budgetCodeDetailsModalVisible}
// //             onCancel={() => {
// //                 setBudgetCodeDetailsModalVisible(false);
// //                 setSelectedBudgetCode(null);
// //             }}
// //             footer={null}
// //             width={800}
// //         >
// //             {selectedBudgetCode && (
// //                 <div>
// //                     <Descriptions bordered column={2} size="small">
// //                         <Descriptions.Item label="Budget Code" span={2}>
// //                             <Text code strong>{selectedBudgetCode.code}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Name" span={2}>
// //                             {selectedBudgetCode.name}
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Budget Amount">
// //                             <Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCode.budget?.toLocaleString()}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Used Amount">
// //                             <Text strong style={{ color: '#fa8c16' }}>XAF {selectedBudgetCode.used?.toLocaleString()}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Remaining">
// //                             <Text strong style={{ color: '#52c41a' }}>XAF {(selectedBudgetCode.budget - selectedBudgetCode.used).toLocaleString()}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Utilization">
// //                             <Progress 
// //                                 percent={Math.round((selectedBudgetCode.used / selectedBudgetCode.budget) * 100)} 
// //                                 size="small"
// //                             />
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Department">
// //                             {selectedBudgetCode.department}
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Budget Type">
// //                             {selectedBudgetCode.budgetType}
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Budget Period">
// //                             {selectedBudgetCode.budgetPeriod}
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Status">
// //                             {getBudgetCodeStatusTag(selectedBudgetCode.status)}
// //                         </Descriptions.Item>
// //                     </Descriptions>

// //                     {selectedBudgetCode.description && (
// //                         <Card size="small" title="Description" style={{ marginTop: '20px' }}>
// //                             <Text>{selectedBudgetCode.description}</Text>
// //                         </Card>
// //                     )}

// //                     {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
// //                         <Card size="small" title="Approval Progress" style={{ marginTop: '20px' }}>
// //                             <Timeline>
// //                                 {selectedBudgetCode.approvalChain.map((step, index) => {
// //                                     const color = step.status === 'approved' ? 'green' : 
// //                                                  step.status === 'rejected' ? 'red' : 'gray';
// //                                     const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
// //                                                 step.status === 'rejected' ? <CloseCircleOutlined /> :
// //                                                 <ClockCircleOutlined />;
                                    
// //                                     return (
// //                                         <Timeline.Item key={index} color={color} dot={icon}>
// //                                             <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                             <br />
// //                                             <Text type="secondary">{step.approver.role}</Text>
// //                                             <br />
// //                                             <Tag color={color}>{step.status.toUpperCase()}</Tag>
// //                                             {step.actionDate && (
// //                                                 <>
// //                                                     <br />
// //                                                     <Text type="secondary">
// //                                                         {new Date(step.actionDate).toLocaleDateString()}
// //                                                     </Text>
// //                                                 </>
// //                                             )}
// //                                         </Timeline.Item>
// //                                     );
// //                                 })}
// //                             </Timeline>
// //                         </Card>
// //                     )}
// //                 </div>
// //             )}
// //         </Modal>

// //         {/* Requisition Details Modal - UPDATED to show budget code info */}
// //         <Modal
// //             title={
// //                 <Space>
// //                     <FileTextOutlined />
// //                     Purchase Requisition Details
// //                 </Space>
// //             }
// //             open={detailsModalVisible}
// //             onCancel={() => {
// //                 setDetailsModalVisible(false);
// //                 setSelectedRequisition(null);
// //             }}
// //             footer={null}
// //             width={900}
// //         >
// //             {selectedRequisition && (
// //                 <div>
// //                     <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
// //                         <Descriptions.Item label="Requisition ID" span={2}>
// //                             <Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text>
// //                         </Descriptions.Item>
// //                          <Descriptions.Item label="Title" span={2}>
// //                             <Text strong>{selectedRequisition.title}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Employee">
// //                             <Text>{selectedRequisition.employee?.fullName}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Department">
// //                             <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Category">
// //                             <Tag color="green">{selectedRequisition.itemCategory}</Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Priority">
// //                             <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
// //                                 {selectedRequisition.urgency}
// //                             </Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Requested Budget">
// //                             <Text strong style={{ color: '#1890ff' }}>
// //                                 XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
// //                             </Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Expected Date">
// //                             {selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Status" span={2}>
// //                             {getStatusTag(selectedRequisition.status)}
// //                         </Descriptions.Item>
// //                     </Descriptions>

// //                     {/* ✅ NEW: Budget Code Information */}
// //                     {selectedRequisition.budgetCodeInfo && (
// //                         <Card size="small" title="Budget Code Information" style={{ marginBottom: '20px' }}>
// //                             <Descriptions column={2} size="small">
// //                                 <Descriptions.Item label="Budget Code">
// //                                     <Tag color="gold">
// //                                         <TagOutlined /> {selectedRequisition.budgetCodeInfo.code}
// //                                     </Tag>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Budget Name">
// //                                     <Text>{selectedRequisition.budgetCodeInfo.name}</Text>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Department">
// //                                     <Tag color="blue">{selectedRequisition.budgetCodeInfo.department}</Tag>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Budget Type">
// //                                     <Text>{selectedRequisition.budgetCodeInfo.budgetType || 'N/A'}</Text>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Available at Submission">
// //                                     <Text strong>XAF {selectedRequisition.budgetCodeInfo.availableAtSubmission?.toLocaleString()}</Text>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Submitted Amount">
// //                                     <Text strong style={{ color: '#1890ff' }}>
// //                                         XAF {selectedRequisition.budgetCodeInfo.submittedAmount?.toLocaleString()}
// //                                     </Text>
// //                                 </Descriptions.Item>
// //                             </Descriptions>
// //                         </Card>
// //                     )}

// //                     <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
// //                         <Table
// //                             dataSource={selectedRequisition.items || []}
// //                             pagination={false}
// //                             size="small"
// //                             columns={[
// //                                 {
// //                                     title: 'Description',
// //                                     dataIndex: 'description',
// //                                     key: 'description'
// //                                 },
// //                                 {
// //                                     title: 'Quantity',
// //                                     dataIndex: 'quantity',
// //                                     key: 'quantity',
// //                                     width: 100
// //                                 },
// //                                 {
// //                                     title: 'Unit',
// //                                     dataIndex: 'measuringUnit',
// //                                     key: 'unit',
// //                                     width: 100
// //                                 }
// //                             ]}
// //                         />
// //                     </Card>

// //                     {/* ✅ UPDATED: Finance Verification Details */}
// //                     {selectedRequisition.financeVerification && (
// //                         <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
// //                             <Descriptions column={2} size="small">
// //                                 <Descriptions.Item label="Decision">
// //                                     <Tag color={selectedRequisition.financeVerification.decision === 'approved' ? 'green' : 'red'}>
// //                                         {selectedRequisition.financeVerification.decision === 'approved' ? '✅ Approved' : '❌ Rejected'}
// //                                     </Tag>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Verification Date">
// //                                     {selectedRequisition.financeVerification.verificationDate ?
// //                                         new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') :
// //                                         'Pending'
// //                                     }
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Verified Budget">
// //                                     <Text strong>XAF {selectedRequisition.financeVerification.verifiedBudget?.toLocaleString()}</Text>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Budget Code Verified">
// //                                     <Tag color="gold">
// //                                         <TagOutlined /> {selectedRequisition.financeVerification.budgetCodeVerified || 'N/A'}
// //                                     </Tag>
// //                                 </Descriptions.Item>
// //                                 <Descriptions.Item label="Available at Verification">
// //                                     <Text>XAF {selectedRequisition.financeVerification.availableBudgetAtVerification?.toLocaleString() || 'N/A'}</Text>
// //                                 </Descriptions.Item>
// //                                 {selectedRequisition.financeVerification.comments && (
// //                                     <Descriptions.Item label="Comments" span={2}>
// //                                         <Text italic>{selectedRequisition.financeVerification.comments}</Text>
// //                                     </Descriptions.Item>
// //                                 )}
// //                             </Descriptions>
// //                         </Card>
// //                     )}

// //                     {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
// //                         <Card size="small" title="Approval Progress">
// //                             <Timeline>
// //                                 {selectedRequisition.approvalChain.map((step, index) => {
// //                                     let color = 'gray';
// //                                     let icon = <ClockCircleOutlined />;
                                    
// //                                     if (step.status === 'approved') {
// //                                         color = 'green';
// //                                         icon = <CheckCircleOutlined />;
// //                                     } else if (step.status === 'rejected') {
// //                                         color = 'red';
// //                                         icon = <CloseCircleOutlined />;
// //                                     }

// //                                     return (
// //                                         <Timeline.Item key={index} color={color} dot={icon}>
// //                                             <div>
// //                                                 <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                                 <br />
// //                                                 <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
// //                                                 <br />
// //                                                 {step.status === 'pending' && (
// //                                                     <Tag color="orange">Pending Action</Tag>
// //                                                 )}
// //                                                 {step.status === 'approved' && (
// //                                                     <>
// //                                                         <Tag color="green">Approved</Tag>
// //                                                         <Text type="secondary">
// //                                                             {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
// //                                                         </Text>
// //                                                         {step.comments && (
// //                                                             <div style={{ marginTop: 4 }}>
// //                                                                 <Text italic>"{step.comments}"</Text>
// //                                                             </div>
// //                                                         )}
// //                                                     </>
// //                                                 )}
// //                                                 {step.status === 'rejected' && (
// //                                                     <>
// //                                                         <Tag color="red">Rejected</Tag>
// //                                                         <Text type="secondary">
// //                                                             {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
// //                                                         </Text>
// //                                                         {step.comments && (
// //                                                             <div style={{ marginTop: 4, color: '#ff4d4f' }}>
// //                                                                 <Text>Reason: "{step.comments}"</Text>
// //                                                             </div>
// //                                                         )}
// //                                                     </>
// //                                                 )}
// //                                             </div>
// //                                         </Timeline.Item>
// //                                     );
// //                                 })}
// //                             </Timeline>
// //                         </Card>
// //                     )}
// //                 </div>
// //             )}
// //         </Modal>
// //     </div>
// // );
// // };
// // export default FinancePurchaseRequisitions;











// // import React, { useState, useEffect } from 'react';
// // import {
// //     Card,
// //     Table,
// //     Button,
// //     Modal,
// //     Form,
// //     Typography,
// //     Tag,
// //     Space,
// //     Input,
// //     Select,
// //     InputNumber,
// //     Descriptions,
// //     Alert,
// //     Spin,
// //     message,
// //     Badge,
// //     Timeline,
// //     Row,
// //     Col,
// //     Statistic,
// //     Divider,
// //     Tooltip,
// //     Switch,
// //     Tabs,
// //     DatePicker,
// //     Progress
// // } from 'antd';
// // import {
// //     ClockCircleOutlined,
// //     FileTextOutlined,
// //     BankOutlined,
// //     TagOutlined,
// //     ShoppingCartOutlined,
// //     ReloadOutlined,
// //     EyeOutlined,
// //     AuditOutlined,
// //     CheckCircleOutlined,
// //     CloseCircleOutlined,
// //     SendOutlined,
// //     PlusOutlined,
// //     EditOutlined,
// //     DeleteOutlined,
// //     DollarOutlined,
// //     CalendarOutlined,
// //     ContactsOutlined,
// //     BarChartOutlined,
// //     TeamOutlined,
// //     WarningOutlined,
// //     InfoCircleOutlined
// // } from '@ant-design/icons';

// // const { Title, Text } = Typography;
// // const { TextArea } = Input;
// // const { Option } = Select;
// // const { TabPane } = Tabs;

// // const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// // const makeAuthenticatedRequest = async (url, options = {}) => {
// //   const token = localStorage.getItem('token');
  
// //   const defaultHeaders = {
// //     'Content-Type': 'application/json',
// //     'Authorization': `Bearer ${token}`,
// //   };

// //   const config = {
// //     ...options,
// //     headers: {
// //       ...defaultHeaders,
// //       ...options.headers,
// //     },
// //   };

// //   const response = await fetch(url, config);
  
// //   if (!response.ok) {
// //     const errorData = await response.json().catch(() => ({}));
// //     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
// //   }

// //   return await response.json();
// // };

// // const FinancePurchaseRequisitions = () => {
// //     const [requisitions, setRequisitions] = useState([]);
// //     const [budgetCodes, setBudgetCodes] = useState([]);
// //     const [projects, setProjects] = useState([]);
// //     const [budgetOwners, setBudgetOwners] = useState([]);
// //     const [loadingProjects, setLoadingProjects] = useState(false);
// //     const [loadingBudgetOwners, setLoadingBudgetOwners] = useState(false);
// //     const [loading, setLoading] = useState(false);
// //     const [verificationModalVisible, setVerificationModalVisible] = useState(false);
// //     const [detailsModalVisible, setDetailsModalVisible] = useState(false);
// //     const [budgetCodeModalVisible, setBudgetCodeModalVisible] = useState(false);
// //     const [budgetCodeApprovalModalVisible, setBudgetCodeApprovalModalVisible] = useState(false);
// //     const [budgetCodeDetailsModalVisible, setBudgetCodeDetailsModalVisible] = useState(false);
// //     const [selectedRequisition, setSelectedRequisition] = useState(null);
// //     const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
// //     const [selectedBudgetCodeForApproval, setSelectedBudgetCodeForApproval] = useState(null);
// //     const [activeTab, setActiveTab] = useState('pending');
// //     const [mainSection, setMainSection] = useState('requisitions');
// //     const [stats, setStats] = useState({ 
// //         pending: 0, 
// //         verified: 0, 
// //         rejected: 0, 
// //         total: 0,
// //         totalBudgetAllocated: 0,
// //         budgetUtilization: 0
// //     });
// //     const [form] = Form.useForm();
// //     const [budgetCodeForm] = Form.useForm();
// //     const [budgetCodeApprovalForm] = Form.useForm();
// //     const [editingBudgetCode, setEditingBudgetCode] = useState(null);

// //     useEffect(() => {
// //         fetchRequisitions();
// //         fetchStats();
// //         fetchBudgetCodes();
// //         fetchProjects();
// //     }, []);

// //     const fetchRequisitions = async () => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance`);
            
// //             if (response.success && response.data) {
// //                 console.log('Finance requisitions fetched:', response.data);
// //                 setRequisitions(response.data);
// //             } else {
// //                 setRequisitions([]);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching finance requisitions:', error);
// //             message.error('Failed to fetch requisitions');
// //             setRequisitions([]);
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const fetchStats = async () => {
// //         try {
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/purchase-requisitions/finance/dashboard-data`);
            
// //             if (response.success && response.data) {
// //                 const financeData = response.data;
                
// //                 setStats({
// //                     pending: financeData.statistics?.pendingVerification || 0,
// //                     verified: financeData.statistics?.approvedThisMonth || 0,
// //                     rejected: financeData.statistics?.rejectedThisMonth || 0,
// //                     total: financeData.totalRequisitions || 0,
// //                     totalBudgetAllocated: financeData.statistics?.totalValue || 0,
// //                     budgetUtilization: response.data.finance?.overallUtilization || 0
// //                 });
// //             }
// //         } catch (error) {
// //             console.error('Error fetching stats:', error);
// //         }
// //     };

// //     const fetchBudgetCodes = async () => {
// //         try {
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/budget-codes`);
// //             if (response.success) {
// //                 setBudgetCodes(response.data);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching budget codes:', error);
// //         }
// //     };

// //     const fetchProjects = async () => {
// //         try {
// //             setLoadingProjects(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/projects/active`);
// //             if (response.success) {
// //                 setProjects(response.data);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching projects:', error);
// //             setProjects([]);
// //         } finally {
// //             setLoadingProjects(false);
// //         }
// //     };

// //     const fetchBudgetOwners = async () => {
// //         try {
// //             setLoadingBudgetOwners(true);
// //             const response = await makeAuthenticatedRequest(`${API_BASE_URL}/auth/active-users`);
            
// //             if (response.success && response.data) {
// //                 setBudgetOwners(response.data);
// //             } else {
// //                 setBudgetOwners([]);
// //             }
// //         } catch (error) {
// //             console.error('Error fetching budget owners:', error);
// //             setBudgetOwners([]);
// //         } finally {
// //             setLoadingBudgetOwners(false);
// //         }
// //     };

// //     // ✅ NEW: Simplified verification - only approve/reject based on budget availability
// //     const handleVerification = async (values) => {
// //         if (!selectedRequisition) return;

// //         try {
// //             setLoading(true);
            
// //             // Simple verification data - only decision and comments
// //             const verificationData = {
// //                 decision: values.decision,
// //                 comments: values.comments
// //             };

// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/finance-verification`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify(verificationData)
// //                 }
// //             );

// //             if (response.success) {
// //                 message.success(`Budget verification ${values.decision === 'approved' ? 'approved' : 'rejected'} successfully`);
// //                 setVerificationModalVisible(false);
// //                 setSelectedRequisition(null);
// //                 form.resetFields();
// //                 fetchRequisitions();
// //                 fetchStats();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to process verification');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleCreateBudgetCode = async (values) => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify(values)
// //                 }
// //             );
            
// //             if (response.success) {
// //                 message.success('Budget code created successfully and sent for approval');
// //                 setBudgetCodeModalVisible(false);
// //                 budgetCodeForm.resetFields();
// //                 fetchBudgetCodes();
// //             } else {
// //                 message.error(response.message || 'Failed to create budget code');
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to create budget code');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleUpdateBudgetCode = async (values) => {
// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes/${editingBudgetCode._id}`,
// //                 {
// //                     method: 'PUT',
// //                     body: JSON.stringify(values)
// //                 }
// //             );
            
// //             if (response.success) {
// //                 message.success('Budget code updated successfully');
// //                 setBudgetCodeModalVisible(false);
// //                 budgetCodeForm.resetFields();
// //                 setEditingBudgetCode(null);
// //                 fetchBudgetCodes();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error('Failed to update budget code');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleBudgetCodeApproval = async (values) => {
// //         if (!selectedBudgetCodeForApproval) return;

// //         try {
// //             setLoading(true);
// //             const response = await makeAuthenticatedRequest(
// //                 `${API_BASE_URL}/budget-codes/${selectedBudgetCodeForApproval._id}/approve`,
// //                 {
// //                     method: 'POST',
// //                     body: JSON.stringify({
// //                         decision: values.decision,
// //                         comments: values.comments
// //                     })
// //                 }
// //             );

// //             if (response.success) {
// //                 message.success(`Budget code ${values.decision} successfully`);
// //                 setBudgetCodeApprovalModalVisible(false);
// //                 setSelectedBudgetCodeForApproval(null);
// //                 budgetCodeApprovalForm.resetFields();
// //                 fetchBudgetCodes();
// //             } else {
// //                 throw new Error(response.message);
// //             }
// //         } catch (error) {
// //             message.error(error.message || 'Failed to process approval');
// //         } finally {
// //             setLoading(false);
// //         }
// //     };

// //     const handleViewDetails = (requisition) => {
// //         setSelectedRequisition(requisition);
// //         setDetailsModalVisible(true);
// //     };

// //     // ✅ NEW: Initialize form with pre-selected budget code (read-only)
// //     const handleStartVerification = (requisition) => {
// //         setSelectedRequisition(requisition);
        
// //         // Set form with pre-selected budget code and current availability
// //         form.setFieldsValue({
// //             decision: 'approved',
// //             comments: ''
// //         });
        
// //         setVerificationModalVisible(true);
// //     };

// //     const openBudgetCodeModal = (budgetCode = null) => {
// //         setEditingBudgetCode(budgetCode);
// //         if (budgetCode) {
// //             budgetCodeForm.setFieldsValue(budgetCode);
// //         } else {
// //             budgetCodeForm.resetFields();
// //         }
// //         setBudgetCodeModalVisible(true);
        
// //         if (projects.length === 0) {
// //             fetchProjects();
// //         }
        
// //         if (budgetOwners.length === 0) {
// //             fetchBudgetOwners();
// //         }
// //     };

// //     const openBudgetCodeApprovalModal = (budgetCode) => {
// //         setSelectedBudgetCodeForApproval(budgetCode);
// //         budgetCodeApprovalForm.resetFields();
// //         setBudgetCodeApprovalModalVisible(true);
// //     };

// //     const viewBudgetCodeDetails = (budgetCode) => {
// //         setSelectedBudgetCode(budgetCode);
// //         setBudgetCodeDetailsModalVisible(true);
// //     };

// //     const getStatusTag = (status) => {
// //         const statusMap = {
// //             'pending_finance_verification': { color: 'orange', text: 'Pending Verification', icon: <ClockCircleOutlined /> },
// //             'pending_supply_chain_review': { color: 'blue', text: 'Finance Approved', icon: <CheckCircleOutlined /> },
// //             'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
// //             'rejected': { color: 'red', text: 'Budget Rejected', icon: <CloseCircleOutlined /> },
// //             'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
// //             'completed': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> }
// //         };

// //         const config = statusMap[status] || { color: 'default', text: status, icon: null };
// //         return <Tag color={config.color} icon={config.icon}>{config.text}</Tag>;
// //     };

// //     const getBudgetCodeStatusTag = (status) => {
// //         const statusMap = {
// //             'pending': { color: 'default', text: 'Pending' },
// //             'pending_departmental_head': { color: 'orange', text: 'Pending Dept Head' },
// //             'pending_head_of_business': { color: 'gold', text: 'Pending HOB' },
// //             'pending_finance': { color: 'blue', text: 'Pending Finance' },
// //             'active': { color: 'green', text: 'Active' },
// //             'rejected': { color: 'red', text: 'Rejected' },
// //             'suspended': { color: 'red', text: 'Suspended' },
// //             'expired': { color: 'default', text: 'Expired' }
// //         };

// //         const config = statusMap[status] || { color: 'default', text: status };
// //         return <Tag color={config.color}>{config.text}</Tag>;
// //     };

// //     const getBudgetCodeStatus = (budgetCode) => {
// //         const utilizationRate = (budgetCode.used / budgetCode.budget) * 100;
// //         if (utilizationRate >= 90) return { color: 'red', text: 'Critical' };
// //         if (utilizationRate >= 75) return { color: 'orange', text: 'High' };
// //         if (utilizationRate >= 50) return { color: 'blue', text: 'Moderate' };
// //         return { color: 'green', text: 'Low' };
// //     };

// //     const getFilteredRequisitions = () => {
// //         if (!Array.isArray(requisitions) || requisitions.length === 0) {
// //             return [];
// //         }
        
// //         let filtered = [];
        
// //         switch (activeTab) {
// //             case 'pending':
// //                 filtered = requisitions.filter(r => {
// //                     if (r.status === 'pending_finance_verification') {
// //                         return true;
// //                     }
                    
// //                     if (r.approvalChain && r.approvalChain.length > 0) {
// //                         const financeStep = r.approvalChain.find(step => 
// //                             step.approver.role.includes('Finance') && 
// //                             step.status === 'pending'
// //                         );
// //                         return financeStep !== undefined;
// //                     }
                    
// //                     return false;
// //                 });
// //                 break;
                
// //             case 'approved':
// //                 filtered = requisitions.filter(r => 
// //                     r.financeVerification?.decision === 'approved' ||
// //                     r.status === 'pending_head_approval' ||
// //                     r.status === 'approved' || 
// //                     r.status === 'in_procurement' ||
// //                     r.status === 'completed' ||
// //                     r.status === 'delivered' ||
// //                     r.status === 'procurement_complete'
// //                 );
// //                 break;
                
// //             case 'rejected':
// //                 filtered = requisitions.filter(r => 
// //                     r.financeVerification?.decision === 'rejected' ||
// //                     r.status === 'rejected'
// //                 );
// //                 break;
                
// //             case 'all':
// //             default:
// //                 filtered = requisitions;
// //                 break;
// //         }
        
// //         return filtered;
// //     };

// //     const requisitionColumns = [
// //         {
// //             title: 'Requisition Details',
// //             key: 'requisition',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>{record.title || 'No Title'}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '12px' }}>
// //                         {record.requisitionNumber || `REQ-${record._id?.slice(-6)?.toUpperCase()}`}
// //                     </Text>
// //                     <br />
// //                     <Tag size="small" color="blue">{record.itemCategory || 'N/A'}</Tag>
// //                     {/* ✅ NEW: Show pre-selected budget code */}
// //                     {record.budgetCodeInfo?.code && (
// //                         <Tag size="small" color="gold">
// //                             <TagOutlined /> {record.budgetCodeInfo.code}
// //                         </Tag>
// //                     )}
// //                 </div>
// //             ),
// //             width: 220
// //         },
// //         {
// //             title: 'Employee',
// //             key: 'employee',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>{record.employee?.fullName || 'N/A'}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '12px' }}>
// //                         {record.employee?.department || record.department || 'N/A'}
// //                     </Text>
// //                 </div>
// //             ),
// //             width: 150
// //         },
// //         {
// //             title: 'Budget Information',
// //             key: 'budget',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong style={{ color: '#1890ff' }}>
// //                         XAF {record.budgetXAF ? record.budgetXAF.toLocaleString() : 'Not specified'}
// //                     </Text>
// //                     <br />
// //                     {/* ✅ NEW: Show budget code details */}
// //                     {record.budgetCodeInfo && (
// //                         <>
// //                             <Text type="secondary" style={{ fontSize: '11px' }}>
// //                                 Code: {record.budgetCodeInfo.code}
// //                             </Text>
// //                             <br />
// //                             <Text type="secondary" style={{ fontSize: '11px' }}>
// //                                 Available: XAF {record.budgetCodeInfo.availableAtSubmission?.toLocaleString()}
// //                             </Text>
// //                         </>
// //                     )}
// //                 </div>
// //             ),
// //             width: 150,
// //             sorter: (a, b) => (a.budgetXAF || 0) - (b.budgetXAF || 0)
// //         },
// //         {
// //             title: 'Items Count',
// //             dataIndex: 'items',
// //             key: 'items',
// //             render: (items) => (
// //                 <Badge count={items?.length || 0} style={{ backgroundColor: '#52c41a' }}>
// //                     <ShoppingCartOutlined style={{ fontSize: '18px' }} />
// //                 </Badge>
// //             ),
// //             width: 80,
// //             align: 'center'
// //         },
// //         {
// //             title: 'Priority',
// //             dataIndex: 'urgency',
// //             key: 'urgency',
// //             render: (urgency) => {
// //                 const urgencyColors = {
// //                     'Low': 'green',
// //                     'Medium': 'orange',
// //                     'High': 'red'
// //                 };
// //                 return <Tag color={urgencyColors[urgency] || 'default'}>{urgency || 'N/A'}</Tag>;
// //             },
// //             width: 80
// //         },
// //         {
// //             title: 'Expected Date',
// //             dataIndex: 'expectedDate',
// //             key: 'expectedDate',
// //             render: (date) => {
// //                 if (!date) return 'N/A';
// //                 const expectedDate = new Date(date);
// //                 const today = new Date();
// //                 const daysRemaining = Math.ceil((expectedDate - today) / (1000 * 60 * 60 * 24));
                
// //                 return (
// //                     <div>
// //                         <Text>{expectedDate.toLocaleDateString('en-GB')}</Text>
// //                         <br />
// //                         <Text type="secondary" style={{ fontSize: '11px' }}>
// //                             {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
// //                         </Text>
// //                     </div>
// //                 );
// //             },
// //             width: 100,
// //             sorter: (a, b) => new Date(a.expectedDate) - new Date(b.expectedDate)
// //         },
// //         {
// //             title: 'Status',
// //             dataIndex: 'status',
// //             key: 'status',
// //             render: (status) => getStatusTag(status),
// //             width: 130
// //         },
// //         {
// //             title: 'Actions',
// //             key: 'actions',
// //             render: (_, record) => (
// //                 <Space size="small">
// //                     <Tooltip title="View Details">
// //                         <Button
// //                             size="small"
// //                             icon={<EyeOutlined />}
// //                             onClick={() => handleViewDetails(record)}
// //                         />
// //                     </Tooltip>
// //                     {(record.status === 'pending_finance_verification' || 
// //                       record.financeVerification?.decision === 'pending') && (
// //                         <Tooltip title="Verify Budget">
// //                             <Button
// //                                 size="small"
// //                                 type="primary"
// //                                 icon={<AuditOutlined />}
// //                                 onClick={() => handleStartVerification(record)}
// //                             >
// //                                 Verify
// //                             </Button>
// //                         </Tooltip>
// //                     )}
// //                 </Space>
// //             ),
// //             width: 100,
// //             fixed: 'right'
// //         }
// //     ];

// //     const budgetCodeColumns = [
// //         {
// //             title: 'Budget Code',
// //             dataIndex: 'code',
// //             key: 'code',
// //             render: (code, record) => (
// //                 <div>
// //                     <Text strong code>{code}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '11px' }}>{record.name}</Text>
// //                 </div>
// //             )
// //         },
// //         {
// //             title: 'Budget Allocation',
// //             key: 'budget',
// //             render: (_, record) => (
// //                 <div>
// //                     <Text strong>XAF {record.budget.toLocaleString()}</Text>
// //                     <br />
// //                     <Text type="secondary" style={{ fontSize: '11px' }}>
// //                         Used: XAF {record.used.toLocaleString()}
// //                     </Text>
// //                 </div>
// //             )
// //         },
// //         {
// //             title: 'Utilization',
// //             key: 'utilization',
// //             render: (_, record) => {
// //                 const percentage = Math.round((record.used / record.budget) * 100);
// //                 const status = getBudgetCodeStatus(record);
// //                 return (
// //                     <div>
// //                         <Progress 
// //                             percent={percentage} 
// //                             size="small" 
// //                             status={status.color === 'red' ? 'exception' : status.color === 'orange' ? 'active' : 'success'}
// //                         />
// //                         <Text type="secondary" style={{ fontSize: '11px' }}>
// //                             {percentage}% utilized
// //                         </Text>
// //                     </div>
// //                 );
// //             }
// //         },
// //         {
// //             title: 'Status',
// //             dataIndex: 'status',
// //             key: 'status',
// //             render: (status) => getBudgetCodeStatusTag(status)
// //         },
// //         {
// //             title: 'Actions',
// //             key: 'actions',
// //             render: (_, record) => (
// //                 <Space size="small">
// //                     <Button
// //                         size="small"
// //                         icon={<EyeOutlined />}
// //                         onClick={() => viewBudgetCodeDetails(record)}
// //                     >
// //                         View
// //                     </Button>
// //                     {record.status !== 'active' && record.status !== 'rejected' && (
// //                         <Button 
// //                             size="small" 
// //                             type="primary"
// //                             onClick={() => openBudgetCodeApprovalModal(record)}
// //                         >
// //                             Review
// //                         </Button>
// //                     )}
// //                     {(record.status === 'active' || record.status === 'rejected') && (
// //                         <Button
// //                             size="small"
// //                             icon={<EditOutlined />}
// //                             onClick={() => openBudgetCodeModal(record)}
// //                         >
// //                             Edit
// //                         </Button>
// //                     )}
// //                 </Space>
// //             )
// //         }
// //     ];

// //     // ✅ NEW: Calculate budget status for verification modal
// //     const getBudgetVerificationStatus = (requisition) => {
// //         if (!requisition?.budgetCode || !requisition?.budgetCodeInfo) {
// //             return null;
// //         }

// //         const budgetCode = budgetCodes.find(bc => bc._id === requisition.budgetCode);
// //         if (!budgetCode) return null;

// //         const currentAvailable = budgetCode.budget - budgetCode.used;
// //         const requiredAmount = requisition.budgetXAF || 0;
// //         const isSufficient = currentAvailable >= requiredAmount;

// //         return {
// //             code: budgetCode.code,
// //             name: budgetCode.name,
// //             department: budgetCode.department,
// //             totalBudget: budgetCode.budget,
// //             used: budgetCode.used,
// //             currentAvailable: currentAvailable,
// //             requiredAmount: requiredAmount,
// //             isSufficient: isSufficient,
// //             submissionAvailable: requisition.budgetCodeInfo.availableAtSubmission,
// //             remainingAfter: currentAvailable - requiredAmount,
// //             utilizationRate: Math.round((budgetCode.used / budgetCode.budget) * 100)
// //         };
// //     };

// //     return (
// //         <div style={{ padding: '24px' }}>
// //             {/* Main Navigation Buttons */}
// //             <div style={{ marginBottom: '24px' }}>
// //                 <Space size="large">
// //                     <Button
// //                         type={mainSection === 'requisitions' ? 'primary' : 'default'}
// //                         size="large"
// //                         icon={<BankOutlined />}
// //                         onClick={() => setMainSection('requisitions')}
// //                     >
// //                         Requisition Management
// //                     </Button>
// //                     <Button
// //                         type={mainSection === 'budgetCodes' ? 'primary' : 'default'}
// //                         size="large"
// //                         icon={<TagOutlined />}
// //                         onClick={() => setMainSection('budgetCodes')}
// //                     >
// //                         Budget Code Management
// //                     </Button>
// //                 </Space>
// //             </div>

// //             {/* Requisition Management Section */}
// //             {mainSection === 'requisitions' && (
// //                 <Card>
// //                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
// //                         <Title level={2} style={{ margin: 0 }}>
// //                             <BankOutlined /> Finance - Purchase Requisition Budget Verification
// //                         </Title>
// //                         <Space>
// //                             <Button
// //                                 icon={<ReloadOutlined />}
// //                                 onClick={() => {
// //                                     fetchRequisitions();
// //                                     fetchStats();
// //                                 }}
// //                                 loading={loading}
// //                             >
// //                                 Refresh
// //                             </Button>
// //                             <Button
// //                                 icon={<ContactsOutlined />}
// //                                 onClick={() => window.open('/finance/suppliers', '_blank')}
// //                             >
// //                                 Vendor Portal
// //                             </Button>
// //                         </Space>
// //                     </div>

// //                     <Card size="small" style={{ marginBottom: '24px', backgroundColor: '#f0f8ff' }}>
// //                         <Row gutter={16}>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Pending Verification"
// //                                     value={stats.pending}
// //                                     valueStyle={{ color: '#faad14' }}
// //                                     prefix={<ClockCircleOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Budget Approved"
// //                                     value={stats.verified}
// //                                     valueStyle={{ color: '#52c41a' }}
// //                                     prefix={<CheckCircleOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Total Budget Allocated"
// //                                     value={`XAF ${stats.totalBudgetAllocated.toLocaleString()}`}
// //                                     valueStyle={{ color: '#1890ff' }}
// //                                     prefix={<DollarOutlined />}
// //                                 />
// //                             </Col>
// //                             <Col span={6}>
// //                                 <Statistic
// //                                     title="Budget Utilization"
// //                                     value={stats.budgetUtilization}
// //                                     suffix="%"
// //                                     valueStyle={{ color: '#722ed1' }}
// //                                     prefix={<BarChartOutlined />}
// //                                 />
// //                             </Col>
// //                         </Row>
// //                     </Card>

// //                     <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '16px' }}>
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={getFilteredRequisitions().length} size="small">
// //                                     <span>Pending Verification</span>
// //                                 </Badge>
// //                             } 
// //                             key="pending"
// //                         />
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={requisitions.filter(r => 
// //                                     r.status === 'pending_supply_chain_review' || 
// //                                     r.status === 'approved' || 
// //                                     r.status === 'in_procurement' ||
// //                                     r.status === 'completed'
// //                                 ).length} size="small">
// //                                     <span>Approved</span>
// //                                 </Badge>
// //                             } 
// //                             key="approved"
// //                         />
// //                         <TabPane tab="Rejected" key="rejected" />
// //                         <TabPane 
// //                             tab={
// //                                 <Badge count={requisitions.length} size="small">
// //                                     <span>All</span>
// //                                 </Badge>
// //                             } 
// //                             key="all"
// //                         />
// //                     </Tabs>

// //                     <Table
// //                         columns={requisitionColumns}
// //                         dataSource={getFilteredRequisitions()}
// //                         loading={loading}
// //                         rowKey="_id"
// //                         pagination={{
// //                             showSizeChanger: true,
// //                             showQuickJumper: true,
// //                             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`,
// //                         }}
// //                         scroll={{ x: 1200 }}
// //                         size="small"
// //                     />
// //                 </Card>
// //             )}

// //             {/* Budget Code Management Section */}
// //             {mainSection === 'budgetCodes' && (
// //                 <Card>

// //             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
// //                         <Title level={2} style={{ margin: 0 }}>
// //                             <TagOutlined /> Budget Code Management
// //                         </Title>
// //                         <Button
// //                             type="primary"
// //                             icon={<PlusOutlined />}
// //                             onClick={() => openBudgetCodeModal()}
// //                         >
// //                             Create Budget Code
// //                         </Button>
// //                     </div>

// //                     <Alert
// //                         message="Budget Code Management"
// //                         description="Create and manage budget codes for purchase requisitions. Track budget allocation and utilization across different departments and projects."
// //                         type="info"
// //                         showIcon
// //                         style={{ marginBottom: '16px' }}
// //                     />

// //                     <Table
// //                         columns={budgetCodeColumns}
// //                         dataSource={budgetCodes}
// //                         loading={loading}
// //                         rowKey="_id"
// //                         pagination={{
// //                             showSizeChanger: true,
// //                             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} budget codes`,
// //                         }}
// //                     />
// //                 </Card>
// //             )}

// //             {/* ✅ NEW: Simplified Budget Verification Modal */}
// //             <Modal
// //                 title={
// //                     <Space>
// //                         <AuditOutlined />
// //                         Budget Verification - {selectedRequisition?.title}
// //                     </Space>
// //                 }
// //                 open={verificationModalVisible}
// //                 onCancel={() => {
// //                     setVerificationModalVisible(false);
// //                     setSelectedRequisition(null);
// //                     form.resetFields();
// //                 }}
// //                 footer={null}
// //                 width={900}
// //             >
// //                 {selectedRequisition && (() => {
// //                     const budgetStatus = getBudgetVerificationStatus(selectedRequisition);
                    
// //                     return (
// //                         <div>
// //                             {/* Requisition Summary */}
// //                             <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
// //                                 <Descriptions column={2} size="small">
// //                                     <Descriptions.Item label="Employee">
// //                                         <Text strong>{selectedRequisition.employee?.fullName}</Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Department">
// //                                         <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Category">
// //                                         <Tag color="green">{selectedRequisition.itemCategory}</Tag>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Priority">
// //                                         <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
// //                                             {selectedRequisition.urgency}
// //                                         </Tag>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Requested Budget">
// //                                         <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
// //                                             XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
// //                                         </Text>
// //                                     </Descriptions.Item>
// //                                     <Descriptions.Item label="Expected Date">
// //                                         <Text>{new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}</Text>
// //                                     </Descriptions.Item>
// //                                 </Descriptions>
// //                             </Card>

// //                             {/* ✅ NEW: Pre-selected Budget Code Information (Read-Only) */}
// //                             {budgetStatus ? (
// //                                 <Alert
// //                                     message={
// //                                         <Space>
// //                                             <TagOutlined />
// //                                             <Text strong>Pre-Selected Budget Code: {budgetStatus.code}</Text>
// //                                         </Space>
// //                                     }
// //                                     description={
// //                                         <div>
// //                                             <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
// //                                                 <Descriptions.Item label="Code">
// //                                                     <Text code strong>{budgetStatus.code}</Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Name">
// //                                                     {budgetStatus.name}
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Department">
// //                                                     <Tag color="blue">{budgetStatus.department}</Tag>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Total Budget">
// //                                                     <Text strong>XAF {budgetStatus.totalBudget.toLocaleString()}</Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Used">
// //                                                     <Text>XAF {budgetStatus.used.toLocaleString()}</Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Current Available">
// //                                                     <Text strong style={{ color: budgetStatus.isSufficient ? '#52c41a' : '#ff4d4f' }}>
// //                                                         XAF {budgetStatus.currentAvailable.toLocaleString()}
// //                                                     </Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Required Amount">
// //                                                     <Text strong>XAF {budgetStatus.requiredAmount.toLocaleString()}</Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Remaining After">
// //                                                     <Text strong style={{ color: budgetStatus.isSufficient ? '#52c41a' : '#ff4d4f' }}>
// //                                                         XAF {budgetStatus.remainingAfter.toLocaleString()}
// //                                                     </Text>
// //                                                 </Descriptions.Item>
// //                                                 <Descriptions.Item label="Utilization" span={2}>
// //                                                     <Progress 
// //                                                         percent={budgetStatus.utilizationRate} 
// //                                                         size="small"
// //                                                         status={
// //                                                             budgetStatus.utilizationRate >= 90 ? 'exception' :
// //                                                             budgetStatus.utilizationRate >= 75 ? 'active' : 'success'
// //                                                         }
// //                                                     />
// //                                                 </Descriptions.Item>
// //                                             </Descriptions>

// //                                             {/* ✅ Budget Status Warning */}
// //                                             {!budgetStatus.isSufficient ? (
// //                                                 <div style={{ 
// //                                                     marginTop: '12px', 
// //                                                     padding: '12px', 
// //                                                     backgroundColor: '#fff2e8', 
// //                                                     borderRadius: '4px',
// //                                                     border: '1px solid #ffbb96'
// //                                                 }}>
// //                                                     <Space>
// //                                                         <WarningOutlined style={{ color: '#ff4d4f' }} />
// //                                                         <Text type="danger" strong>
// //                                                             Insufficient Budget! Available: XAF {budgetStatus.currentAvailable.toLocaleString()}, 
// //                                                             Required: XAF {budgetStatus.requiredAmount.toLocaleString()}
// //                                                         </Text>
// //                                                     </Space>
// //                                                     <div style={{ marginTop: '8px' }}>
// //                                                         <Text type="danger">
// //                                                             You must reject this requisition or request the employee to select a different budget code.
// //                                                         </Text>
// //                                                     </div>
// //                                                 </div>
// //                                             ) : (
// //                                                 <div style={{ 
// //                                                     marginTop: '12px', 
// //                                                     padding: '12px', 
// //                                                     backgroundColor: '#f6ffed', 
// //                                                     borderRadius: '4px',
// //                                                     border: '1px solid #b7eb8f'
// //                                                 }}>
// //                                                     <Space>
// //                                                         <CheckCircleOutlined style={{ color: '#52c41a' }} />
// //                                                         <Text style={{ color: '#52c41a' }} strong>
// //                                                             Sufficient Budget Available
// //                                                         </Text>
// //                                                     </Space>
// //                                                 </div>
// //                                             )}
// //                                         </div>
// //                                     }
// //                                     type={budgetStatus.isSufficient ? "success" : "error"}
// //                                     showIcon
// //                                     style={{ marginBottom: '20px' }}
// //                                 />
// //                             ) : (
// //                                 <Alert
// //                                     message="Budget Code Not Found"
// //                                     description="The selected budget code is no longer available. Please reject this requisition and request a resubmission."
// //                                     type="error"
// //                                     showIcon
// //                                     style={{ marginBottom: '20px' }}
// //                                 />
// //                             )}

// //                             {/* ✅ NEW: Simplified Verification Form */}
// //                             <Form
// //                                 form={form}
// //                                 layout="vertical"
// //                                 onFinish={handleVerification}
// //                             >
// //                                 <Form.Item
// //                                     name="decision"
// //                                     label="Verification Decision"
// //                                     rules={[{ required: true, message: 'Please select your decision' }]}
// //                                     help={budgetStatus && !budgetStatus.isSufficient ? 
// //                                         "Budget is insufficient - you should reject this requisition" : 
// //                                         "Verify that the budget code has sufficient funds for this purchase"
// //                                     }
// //                                 >
// //                                     <Select 
// //                                         placeholder="Select verification decision"
// //                                         disabled={!budgetStatus}
// //                                     >
// //                                         <Option value="approved" disabled={budgetStatus && !budgetStatus.isSufficient}>
// //                                             <Space>
// //                                                 <CheckCircleOutlined style={{ color: '#52c41a' }} />
// //                                                 <span>✅ Approve - Budget Available</span>
// //                                             </Space>
// //                                         </Option>
// //                                         <Option value="rejected">
// //                                             <Space>
// //                                                 <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
// //                                                 <span>❌ Reject - Insufficient Budget</span>
// //                                             </Space>
// //                                         </Option>
// //                                     </Select>
// //                                 </Form.Item>

// //                                 <Form.Item
// //                                     name="comments"
// //                                     label="Verification Comments"
// //                                     rules={[{ required: true, message: 'Please provide verification comments' }]}
// //                                     help="Add any relevant comments about the budget verification"
// //                                 >
// //                                     <TextArea
// //                                         rows={3}
// //                                         placeholder={
// //                                             budgetStatus && !budgetStatus.isSufficient
// //                                                 ? "Explain why the budget is insufficient and recommend next steps..."
// //                                                 : "Confirm budget availability and any conditions or notes..."
// //                                         }
// //                                         showCount
// //                                         maxLength={500}
// //                                     />
// //                                 </Form.Item>

// //                                 <Alert
// //                                     message="Verification Instructions"
// //                                     description={
// //                                         <div>
// //                                             <Text strong>Your Role:</Text>
// //                                             <ul style={{ marginTop: '8px', marginBottom: 0 }}>
// //                                                 <li>Verify that the pre-selected budget code has sufficient funds</li>
// //                                                 <li>Approve if budget is available, reject if insufficient</li>
// //                                                 <li>You cannot change the budget code - only verify availability</li>
// //                                                 <li>If rejected, employee must resubmit with a different budget code</li>
// //                                             </ul>
// //                                         </div>
// //                                     }
// //                                     type="info"
// //                                     showIcon
// //                                     icon={<InfoCircleOutlined />}
// //                                     style={{ marginBottom: '16px' }}
// //                                 />

// //                                 <Form.Item>
// //                                     <Space>
// //                                         <Button onClick={() => {
// //                                             setVerificationModalVisible(false);
// //                                             setSelectedRequisition(null);
// //                                             form.resetFields();
// //                                         }}>
// //                                             Cancel
// //                                         </Button>
// //                                         <Button
// //                                             type="primary"
// //                                             htmlType="submit"
// //                                             loading={loading}
// //                                             icon={<SendOutlined />}
// //                                             disabled={!budgetStatus}
// //                                         >
// //                                             Submit Verification
// //                                         </Button>
// //                                     </Space>
// //                                 </Form.Item>
// //                             </Form>
// //                         </div>
// //                     );
// //                 })()}
// //             </Modal>

// //             {/* Budget Code Create/Edit Modal - Same as before */}
// //             <Modal
// //                 title={
// //                     <Space>
// //                         <TagOutlined />
// //                         {editingBudgetCode ? 'Edit Budget Code' : 'Create New Budget Code'}
// //                     </Space>
// //                 }
// //                 open={budgetCodeModalVisible}
// //                 onCancel={() => {
// //                     setBudgetCodeModalVisible(false);
// //                     budgetCodeForm.resetFields();
// //                     setEditingBudgetCode(null);
// //                 }}
// //                 footer={null}
// //                 width={600}
// //             >
// //                 <Form
// //                     form={budgetCodeForm}
// //                     layout="vertical"
// //                     onFinish={editingBudgetCode ? handleUpdateBudgetCode : handleCreateBudgetCode}
// //                 >
// //                     <Row gutter={16}>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="code"
// //                                 label="Budget Code"
// //                                 rules={[
// //                                     { required: true, message: 'Please enter budget code' },
// //                                     { pattern: /^[A-Z0-9\-_]+$/, message: 'Only uppercase letters, numbers, hyphens and underscores allowed' }
// //                                 ]}
// //                                 help="Use format like DEPT-IT-2024 or PROJ-ALPHA-2024"
// //                             >
// //                                 <Input
// //                                     placeholder="e.g., DEPT-IT-2024"
// //                                     disabled={!!editingBudgetCode}
// //                                     style={{ textTransform: 'uppercase' }}
// //                                 />
// //                             </Form.Item>
// //                         </Col>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="name"
// //                                 label="Budget Name"
// //                                 rules={[{ required: true, message: 'Please enter budget name' }]}
// //                             >
// //                                 <Input placeholder="e.g., IT Department 2024 Budget" />
// //                             </Form.Item>
// //                         </Col>
// //                     </Row>

// //                     <Row gutter={16}>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="budget"
// //                                 label="Total Budget Allocation (XAF)"
// //                                 rules={[{ required: true, message: 'Please enter budget amount' }]}
// //                             >
// //                                 <InputNumber
// //                                     style={{ width: '100%' }}
// //                                     formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
// //                                     parser={value => value.replace(/\$\s?|(,*)/g, '')}
// //                                     min={0}
// //                                     placeholder="Enter total budget"
// //                                 />
// //                             </Form.Item>
// //                         </Col>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="department"
// //                                 label="Department/Project"
// //                                 rules={[{ required: true, message: 'Please select department or project' }]}
// //                                 help="Select existing department or active project"
// //                             >
// //                                 <Select 
// //                                     placeholder="Select department or project"
// //                                     showSearch
// //                                     loading={loadingProjects}
// //                                 >
// //                                     <Select.OptGroup label="Departments">
// //                                         <Option value="Technical Operations">Technical Operations</Option>
// //                                         <Option value="Technical Roll Out">Technical Roll Out</Option>
// //                                         <Option value="Technical QHSE">Technical QHSE</Option>
// //                                         <Option value="IT">IT Department</Option>
// //                                         <Option value="Finance">Finance</Option>
// //                                         <Option value="HR">Human Resources</Option>
// //                                         <Option value="Marketing">Marketing</Option>
// //                                         <Option value="Supply Chain">Supply Chain</Option>
// //                                         <Option value="Business">Business</Option>
// //                                         <Option value="Facilities">Facilities</Option>
// //                                     </Select.OptGroup>
// //                                     <Select.OptGroup label="Active Projects">
// //                                         {projects.map(project => (
// //                                             <Option key={`project-${project._id}`} value={`PROJECT-${project._id}`}>
// //                                                 {project.name} ({project.department})
// //                                             </Option>
// //                                         ))}
// //                                     </Select.OptGroup>
// //                                 </Select>
// //                             </Form.Item>
// //                         </Col>
// //                     </Row>

// //                     <Row gutter={16}>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="budgetType"
// //                                 label="Budget Type"
// //                                 rules={[{ required: true, message: 'Please select budget type' }]}
// //                             >
// //                                 <Select placeholder="Select budget type">
// //                                     <Option value="OPEX">OPEX - Operating Expenses</Option>
// //                                     <Option value="CAPEX">CAPEX - Capital Expenditure</Option>
// //                                     <Option value="PROJECT">PROJECT - Project Budget</Option>
// //                                     <Option value="OPERATIONAL">OPERATIONAL - Operational</Option>
// //                                 </Select>
// //                             </Form.Item>
// //                         </Col>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="budgetPeriod"
// //                                 label="Budget Period"
// //                                 rules={[{ required: true, message: 'Please select budget period' }]}
// //                             >
// //                                 <Select placeholder="Select budget period">
// //                                     <Option value="monthly">Monthly</Option>
// //                                     <Option value="quarterly">Quarterly</Option>
// //                                     <Option value="yearly">Yearly</Option>
// //                                     <Option value="project">Project Duration</Option>
// //                                 </Select>
// //                             </Form.Item>
// //                         </Col>
// //                     </Row>

// //                     <Form.Item
// //                         name="description"
// //                         label="Budget Description"
// //                         help="Provide details about what this budget covers"
// //                     >
// //                         <TextArea
// //                             rows={3}
// //                             placeholder="Describe the purpose and scope of this budget allocation..."
// //                             showCount
// //                             maxLength={300}
// //                         />
// //                     </Form.Item>

// //                     <Row gutter={16}>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="budgetOwner"
// //                                 label="Budget Owner"
// //                                 rules={[{ required: true, message: 'Please select budget owner' }]}
// //                                 help="Person responsible for this budget"
// //                             >
// //                                 <Select
// //                                     placeholder="Select budget owner"
// //                                     showSearch
// //                                     loading={loadingBudgetOwners}
// //                                     filterOption={(input, option) => {
// //                                         const user = budgetOwners.find(u => u._id === option.value);
// //                                         if (!user) return false;
// //                                         return (
// //                                             (user.fullName || '').toLowerCase().includes(input.toLowerCase()) ||
// //                                             (user.email || '').toLowerCase().includes(input.toLowerCase())
// //                                         );
// //                                     }}
// //                                     notFoundContent={loadingBudgetOwners ? <Spin size="small" /> : "No users found"}
// //                                 >
// //                                     {budgetOwners.map(user => (
// //                                         <Option key={user._id} value={user._id}>
// //                                             <div>
// //                                                 <Text strong>{user.fullName}</Text>
// //                                                 <br />
// //                                                 <Text type="secondary" style={{ fontSize: '12px' }}>
// //                                                     {user.role} | {user.department}
// //                                                 </Text>
// //                                             </div>
// //                                         </Option>
// //                                     ))}
// //                                 </Select>
// //                             </Form.Item>
// //                         </Col>
// //                         <Col span={12}>
// //                             <Form.Item
// //                                 name="active"
// //                                 label="Status"
// //                                 valuePropName="checked"
// //                                 initialValue={true}
// //                             >
// //                                 <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
// //                             </Form.Item>
// //                         </Col>
// //                     </Row>

// //                     <Form.Item>
// //                         <Space>
// //                             <Button onClick={() => {
// //                                 setBudgetCodeModalVisible(false);
// //                                 budgetCodeForm.resetFields();
// //                                 setEditingBudgetCode(null);
// //                             }}>
// //                                 Cancel
// //                             </Button>
// //                             <Button
// //                                 type="primary"
// //                                 htmlType="submit"
// //                                 loading={loading}
// //                                 icon={editingBudgetCode ? <EditOutlined /> : <PlusOutlined />}
// //                             >
// //                                 {editingBudgetCode ? 'Update Budget Code' : 'Create Budget Code'}
// //                             </Button>
// //                         </Space>
// //                     </Form.Item>
// //                 </Form>
// //             </Modal>

// //             {/* Requisition Details Modal and other modals remain unchanged... */}
// //             {/* Copy the remaining modals from your original code */}
// //             {/* Requisition Details Modal and other modals remain unchanged... */}
// // {/* Copy the remaining modals from your original code */}

// // {/* Budget Code Approval Modal */}
// // <Modal
// //     title={
// //         <Space>
// //             <AuditOutlined />
// //             Budget Code Approval - {selectedBudgetCodeForApproval?.code}
// //         </Space>
// //     }
// //     open={budgetCodeApprovalModalVisible}
// //     onCancel={() => {
// //         setBudgetCodeApprovalModalVisible(false);
// //         setSelectedBudgetCodeForApproval(null);
// //         budgetCodeApprovalForm.resetFields();
// //     }}
// //     footer={null}
// //     width={700}
// // >
// //     {selectedBudgetCodeForApproval && (
// //         <div>
// //             <Card size="small" style={{ marginBottom: '20px', backgroundColor: '#fafafa' }}>
// //                 <Descriptions column={2} size="small">
// //                     <Descriptions.Item label="Budget Code">
// //                         <Text strong code>{selectedBudgetCodeForApproval.code}</Text>
// //                     </Descriptions.Item>
// //                     <Descriptions.Item label="Name">
// //                         {selectedBudgetCodeForApproval.name}
// //                     </Descriptions.Item>
// //                     <Descriptions.Item label="Budget Amount">
// //                         <Text strong style={{ color: '#1890ff' }}>
// //                             XAF {selectedBudgetCodeForApproval.budget?.toLocaleString()}
// //                         </Text>
// //                     </Descriptions.Item>
// //                     <Descriptions.Item label="Department">
// //                         <Tag color="blue">{selectedBudgetCodeForApproval.department}</Tag>
// //                     </Descriptions.Item>
// //                     <Descriptions.Item label="Budget Type">
// //                         {selectedBudgetCodeForApproval.budgetType}
// //                     </Descriptions.Item>
// //                     <Descriptions.Item label="Current Status">
// //                         {getBudgetCodeStatusTag(selectedBudgetCodeForApproval.status)}
// //                     </Descriptions.Item>
// //                 </Descriptions>
// //             </Card>

// //             {selectedBudgetCodeForApproval.approvalChain && (
// //                 <Card size="small" title="Approval Progress" style={{ marginBottom: '20px' }}>
// //                     <Timeline>
// //                         {selectedBudgetCodeForApproval.approvalChain.map((step, index) => {
// //                             const color = step.status === 'approved' ? 'green' : 
// //                                          step.status === 'rejected' ? 'red' : 'gray';
// //                             const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
// //                                         step.status === 'rejected' ? <CloseCircleOutlined /> :
// //                                         <ClockCircleOutlined />;
                            
// //                             return (
// //                                 <Timeline.Item key={index} color={color} dot={icon}>
// //                                     <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                     <br />
// //                                     <Text type="secondary">{step.approver.role}</Text>
// //                                     <br />
// //                                     <Tag color={color}>{step.status.toUpperCase()}</Tag>
// //                                     {step.actionDate && (
// //                                         <>
// //                                             <br />
// //                                             <Text type="secondary">
// //                                                 {new Date(step.actionDate).toLocaleDateString()} at {step.actionTime}
// //                                             </Text>
// //                                         </>
// //                                     )}
// //                                     {step.comments && (
// //                                         <div style={{ marginTop: 4 }}>
// //                                             <Text italic>"{step.comments}"</Text>
// //                                         </div>
// //                                     )}
// //                                 </Timeline.Item>
// //                             );
// //                         })}
// //                     </Timeline>
// //                 </Card>
// //             )}

// //             <Form
// //                 form={budgetCodeApprovalForm}
// //                 layout="vertical"
// //                 onFinish={handleBudgetCodeApproval}
// //             >
// //                 <Form.Item
// //                     name="decision"
// //                     label="Approval Decision"
// //                     rules={[{ required: true, message: 'Please select your decision' }]}
// //                 >
// //                     <Select placeholder="Select decision">
// //                         <Option value="approved">✅ Approve Budget Code</Option>
// //                         <Option value="rejected">❌ Reject Budget Code</Option>
// //                     </Select>
// //                 </Form.Item>

// //                 <Form.Item
// //                     name="comments"
// //                     label="Comments"
// //                     rules={[{ required: true, message: 'Please provide comments for your decision' }]}
// //                 >
// //                     <TextArea
// //                         rows={4}
// //                         placeholder="Enter your comments, reasons, or recommendations..."
// //                         showCount
// //                         maxLength={500}
// //                     />
// //                 </Form.Item>

// //                 <Form.Item>
// //                     <Space>
// //                         <Button onClick={() => {
// //                             setBudgetCodeApprovalModalVisible(false);
// //                             setSelectedBudgetCodeForApproval(null);
// //                             budgetCodeApprovalForm.resetFields();
// //                         }}>
// //                             Cancel
// //                         </Button>
// //                         <Button
// //                             type="primary"
// //                             htmlType="submit"
// //                             loading={loading}
// //                             icon={<SendOutlined />}
// //                         >
// //                             Submit Decision
// //                         </Button>
// //                     </Space>
// //                 </Form.Item>
// //             </Form>
// //         </div>
// //     )}
// // </Modal>

// // {/* Budget Code Details Modal */}
// // <Modal
// //     title={
// //         <Space>
// //             <TagOutlined />
// //             Budget Code Details
// //         </Space>
// //     }
// //     open={budgetCodeDetailsModalVisible}
// //     onCancel={() => {
// //         setBudgetCodeDetailsModalVisible(false);
// //         setSelectedBudgetCode(null);
// //     }}
// //     footer={null}
// //     width={800}
// // >
// //     {selectedBudgetCode && (
// //         <div>
// //             <Descriptions bordered column={2} size="small">
// //                 <Descriptions.Item label="Budget Code" span={2}>
// //                     <Text code strong>{selectedBudgetCode.code}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Name" span={2}>
// //                     {selectedBudgetCode.name}
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Budget Amount">
// //                     <Text strong style={{ color: '#1890ff' }}>XAF {selectedBudgetCode.budget?.toLocaleString()}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Used Amount">
// //                     <Text strong style={{ color: '#fa8c16' }}>XAF {selectedBudgetCode.used?.toLocaleString()}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Remaining">
// //                     <Text strong style={{ color: '#52c41a' }}>XAF {(selectedBudgetCode.budget - selectedBudgetCode.used).toLocaleString()}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Utilization">
// //                     <Progress 
// //                         percent={Math.round((selectedBudgetCode.used / selectedBudgetCode.budget) * 100)} 
// //                         size="small"
// //                     />
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Department">
// //                     {selectedBudgetCode.department}
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Budget Type">
// //                     {selectedBudgetCode.budgetType}
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Budget Period">
// //                     {selectedBudgetCode.budgetPeriod}
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Status">
// //                     {getBudgetCodeStatusTag(selectedBudgetCode.status)}
// //                 </Descriptions.Item>
// //             </Descriptions>

// //             {selectedBudgetCode.description && (
// //                 <Card size="small" title="Description" style={{ marginTop: '20px' }}>
// //                     <Text>{selectedBudgetCode.description}</Text>
// //                 </Card>
// //             )}

// //             {selectedBudgetCode.approvalChain && selectedBudgetCode.approvalChain.length > 0 && (
// //                 <Card size="small" title="Approval Progress" style={{ marginTop: '20px' }}>
// //                     <Timeline>
// //                         {selectedBudgetCode.approvalChain.map((step, index) => {
// //                             const color = step.status === 'approved' ? 'green' : 
// //                                          step.status === 'rejected' ? 'red' : 'gray';
// //                             const icon = step.status === 'approved' ? <CheckCircleOutlined /> :
// //                                         step.status === 'rejected' ? <CloseCircleOutlined /> :
// //                                         <ClockCircleOutlined />;
                            
// //                             return (
// //                                 <Timeline.Item key={index} color={color} dot={icon}>
// //                                     <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                     <br />
// //                                     <Text type="secondary">{step.approver.role}</Text>
// //                                     <br />
// //                                     <Tag color={color}>{step.status.toUpperCase()}</Tag>
// //                                     {step.actionDate && (
// //                                         <>
// //                                             <br />
// //                                             <Text type="secondary">
// //                                                 {new Date(step.actionDate).toLocaleDateString()}
// //                                             </Text>
// //                                         </>
// //                                     )}
// //                                 </Timeline.Item>
// //                             );
// //                         })}
// //                     </Timeline>
// //                 </Card>
// //             )}
// //         </div>
// //     )}
// // </Modal>

// // {/* Requisition Details Modal */}
// // <Modal
// //     title={
// //         <Space>
// //             <FileTextOutlined />
// //             Purchase Requisition Details
// //         </Space>
// //     }
// //     open={detailsModalVisible}
// //     onCancel={() => {
// //         setDetailsModalVisible(false);
// //         setSelectedRequisition(null);
// //     }}
// //     footer={null}
// //     width={900}
// // >
// //     {selectedRequisition && (
// //         <div>
// //             <Descriptions bordered column={2} size="small" style={{ marginBottom: '20px' }}>
// //                 <Descriptions.Item label="Requisition ID" span={2}>
// //                     <Text code copyable>{selectedRequisition.requisitionNumber || `REQ-${selectedRequisition._id?.slice(-6)?.toUpperCase()}`}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Title" span={2}>
// //                     <Text strong>{selectedRequisition.title}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Employee">
// //                     <Text>{selectedRequisition.employee?.fullName}</Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Department">
// //                     <Tag color="blue">{selectedRequisition.employee?.department || selectedRequisition.department}</Tag>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Category">
// //                     <Tag color="green">{selectedRequisition.itemCategory}</Tag>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Priority">
// //                     <Tag color={selectedRequisition.urgency === 'High' ? 'red' : selectedRequisition.urgency === 'Medium' ? 'orange' : 'green'}>
// //                         {selectedRequisition.urgency}
// //                     </Tag>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Requested Budget">
// //                     <Text strong style={{ color: '#1890ff' }}>
// //                         XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'Not specified'}
// //                     </Text>
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Expected Date">
// //                     {selectedRequisition.expectedDate ? new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB') : 'N/A'}
// //                 </Descriptions.Item>
// //                 <Descriptions.Item label="Status" span={2}>
// //                     {getStatusTag(selectedRequisition.status)}
// //                 </Descriptions.Item>
// //             </Descriptions>

// //             <Card size="small" title="Items to Purchase" style={{ marginBottom: '20px' }}>
// //                 <Table
// //                     dataSource={selectedRequisition.items || []}
// //                     pagination={false}
// //                     size="small"
// //                     columns={[
// //                         {
// //                             title: 'Description',
// //                             dataIndex: 'description',
// //                             key: 'description'
// //                         },
// //                         {
// //                             title: 'Quantity',
// //                             dataIndex: 'quantity',
// //                             key: 'quantity',
// //                             width: 100
// //                         },
// //                         {
// //                             title: 'Unit',
// //                             dataIndex: 'measuringUnit',
// //                             key: 'unit',
// //                             width: 100
// //                         }
// //                     ]}
// //                 />
// //             </Card>

// //             {selectedRequisition.financeVerification && (
// //                 <Card size="small" title="Finance Verification Details" style={{ marginBottom: '20px' }}>
// //                     <Descriptions column={2} size="small">
// //                         <Descriptions.Item label="Budget Available">
// //                             <Tag color={selectedRequisition.financeVerification.budgetAvailable ? 'green' : 'red'}>
// //                                 {selectedRequisition.financeVerification.budgetAvailable ? 'Yes' : 'No'}
// //                             </Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Assigned Budget">
// //                             <Text strong>XAF {selectedRequisition.financeVerification.assignedBudget?.toLocaleString()}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Budget Code">
// //                             <Tag color="gold">
// //                                 <TagOutlined /> {selectedRequisition.financeVerification.budgetCode || 'Not assigned'}
// //                             </Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Cost Center">
// //                             <Text>{selectedRequisition.financeVerification.costCenter || 'Not specified'}</Text>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Budget Allocation">
// //                             <Tag color="blue">{selectedRequisition.financeVerification.budgetAllocation || 'Standard'}</Tag>
// //                         </Descriptions.Item>
// //                         <Descriptions.Item label="Verification Date">
// //                             {selectedRequisition.financeVerification.verificationDate ?
// //                                 new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') :
// //                                 'Pending'
// //                             }
// //                         </Descriptions.Item>
// //                         {selectedRequisition.financeVerification.expectedCompletionDate && (
// //                             <Descriptions.Item label="Expected Completion">
// //                                 <CalendarOutlined /> {new Date(selectedRequisition.financeVerification.expectedCompletionDate).toLocaleDateString('en-GB')}
// //                             </Descriptions.Item>
// //                         )}
// //                         {selectedRequisition.financeVerification.requiresAdditionalApproval && (
// //                             <Descriptions.Item label="Additional Approval">
// //                                 <Tag color="orange">Required</Tag>
// //                             </Descriptions.Item>
// //                         )}
// //                         {selectedRequisition.financeVerification.comments && (
// //                             <Descriptions.Item label="Comments" span={2}>
// //                                 <Text italic>{selectedRequisition.financeVerification.comments}</Text>
// //                             </Descriptions.Item>
// //                         )}
// //                     </Descriptions>
// //                 </Card>
// //             )}

// //             {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 && (
// //                 <Card size="small" title="Approval Progress">
// //                     <Timeline>
// //                         {selectedRequisition.approvalChain.map((step, index) => {
// //                             let color = 'gray';
// //                             let icon = <ClockCircleOutlined />;
                            
// //                             if (step.status === 'approved') {
// //                                 color = 'green';
// //                                 icon = <CheckCircleOutlined />;
// //                             } else if (step.status === 'rejected') {
// //                                 color = 'red';
// //                                 icon = <CloseCircleOutlined />;
// //                             }

// //                             return (
// //                                 <Timeline.Item key={index} color={color} dot={icon}>
// //                                     <div>
// //                                         <Text strong>Level {step.level}: {step.approver.name}</Text>
// //                                         <br />
// //                                         <Text type="secondary">{step.approver.role} - {step.approver.email}</Text>
// //                                         <br />
// //                                         {step.status === 'pending' && (
// //                                             <Tag color="orange">Pending Action</Tag>
// //                                         )}
// //                                         {step.status === 'approved' && (
// //                                             <>
// //                                                 <Tag color="green">Approved</Tag>
// //                                                 <Text type="secondary">
// //                                                     {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
// //                                                 </Text>
// //                                                 {step.comments && (
// //                                                     <div style={{ marginTop: 4 }}>
// //                                                         <Text italic>"{step.comments}"</Text>
// //                                                     </div>
// //                                                 )}
// //                                             </>
// //                                         )}
// //                                         {step.status === 'rejected' && (
// //                                             <>
// //                                                 <Tag color="red">Rejected</Tag>
// //                                                 <Text type="secondary">
// //                                                     {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime}
// //                                                 </Text>
// //                                                 {step.comments && (
// //                                                     <div style={{ marginTop: 4, color: '#ff4d4f' }}>
// //                                                         <Text>Reason: "{step.comments}"</Text>
// //                                                     </div>
// //                                                 )}
// //                                             </>
// //                                         )}
// //                                     </div>
// //                                 </Timeline.Item>
// //                             );
// //                         })}
// //                     </Timeline>
// //                 </Card>
// //             )}
// //         </div>
// //     )}
// // </Modal>
// //         </div>
// //     );
// // };

// // export default FinancePurchaseRequisitions;



