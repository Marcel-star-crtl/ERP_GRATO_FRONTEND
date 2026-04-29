import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Alert, Button, Card, Col, Drawer, Form, Input, InputNumber,
  message, Modal, Popconfirm, Row, Select, Space, Table, Tabs,
  Tag, Typography, Statistic, Divider
} from 'antd';
import {
  AuditOutlined, BankOutlined, CheckCircleOutlined, CheckOutlined,
  CloseOutlined, DatabaseOutlined, DollarOutlined, DownloadOutlined,
  ExclamationCircleOutlined, PlusOutlined, ReloadOutlined,
  RetweetOutlined, SettingOutlined, UploadOutlined, WarningOutlined
} from '@ant-design/icons';
import { accountingAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt  = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (v) => v ? new Date(v).toLocaleDateString() : '-';

const now          = new Date();
const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
const today        = now.toISOString().slice(0, 10);

const defaultJournalLines = JSON.stringify(
  [{ account: '', description: 'Debit line', debit: 0, credit: 0 },
   { account: '', description: 'Credit line', debit: 0, credit: 0 }], null, 2
);
const defaultRuleLines = JSON.stringify(
  [{ side: 'debit', accountCode: '1000', amountSource: 'gross', description: 'Main debit' },
   { side: 'credit', accountCode: '4000', amountSource: 'gross', description: 'Main credit' }], null, 2
);
const monthOptions = [
  {label:'Jan',value:1},{label:'Feb',value:2},{label:'Mar',value:3},{label:'Apr',value:4},
  {label:'May',value:5},{label:'Jun',value:6},{label:'Jul',value:7},{label:'Aug',value:8},
  {label:'Sep',value:9},{label:'Oct',value:10},{label:'Nov',value:11},{label:'Dec',value:12}
];

// ── aged table columns (shared for AR and AP) ─────────────────────────────────
const agedCols = (nameKey, nameLabel) => [
  { title: nameLabel, dataIndex: nameKey, key: nameKey },
  { title: 'Current',  dataIndex: 'current', key: 'current', width: 120, render: fmt },
  { title: '1–30 d',   dataIndex: 'days30',  key: 'days30',  width: 110, render: fmt },
  { title: '31–60 d',  dataIndex: 'days60',  key: 'days60',  width: 110, render: fmt },
  { title: '61–90 d',  dataIndex: 'days90',  key: 'days90',  width: 110, render: fmt },
  { title: '90+ d',    dataIndex: 'over90',  key: 'over90',  width: 110,
    render: v => <Text type={v > 0 ? 'danger' : undefined}>{fmt(v)}</Text> },
  { title: 'Total',    dataIndex: 'total',   key: 'total',   width: 130,
    render: v => <Text strong>{fmt(v)}</Text> }
];

// ─────────────────────────────────────────────────────────────────────────────
const FinanceAccountingCenter = () => {

  // ── core state ──────────────────────────────────────────────────────────────
  const [loading,        setLoading]        = useState(false);
  const [accounts,       setAccounts]       = useState([]);
  const [rules,          setRules]          = useState([]);
  const [periods,        setPeriods]        = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [trialBalance,   setTrialBalance]   = useState({ lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });

  // ── reports state ────────────────────────────────────────────────────────────
  const [kpis,           setKpis]           = useState(null);
  const [plData,         setPlData]         = useState(null);
  const [bsData,         setBsData]         = useState(null);
  const [cfData,         setCfData]         = useState(null);
  const [vatData,        setVatData]        = useState(null);
  const [agedAR,         setAgedAR]         = useState(null);
  const [agedAP,         setAgedAP]         = useState(null);
  const [reportsLoading, setReportsLoading] = useState(false);

  // ── payments state ───────────────────────────────────────────────────────────
  const [payments,         setPayments]         = useState([]);
  const [paymentsTotal,    setPaymentsTotal]     = useState(0);
  const [paymentsLoading,  setPaymentsLoading]   = useState(false);
  const [paymentModalOpen, setPaymentModalOpen]  = useState(false);

  // ── reconciliation state ─────────────────────────────────────────────────────
  const [bankTxs,         setBankTxs]         = useState([]);
  const [recoSummary,     setRecoSummary]     = useState(null);
  const [recoLoading,     setRecoLoading]     = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedBankTx,  setSelectedBankTx]  = useState(null);
  const [recoEntryId,     setRecoEntryId]     = useState('');

  // ── audit log state ──────────────────────────────────────────────────────────
  const [auditLogs,       setAuditLogs]       = useState([]);
  const [auditLoading,    setAuditLoading]    = useState(false);

  // ── maker-checker state ──────────────────────────────────────────────────────
  const [selectedEntry,   setSelectedEntry]   = useState(null);
  const [reverseModalOpen,setReverseModalOpen]= useState(false);

  // ── ledger drawer ────────────────────────────────────────────────────────────
  const [ledgerData,    setLedgerData]    = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerOpen,    setLedgerOpen]    = useState(false);

  // ── modals ───────────────────────────────────────────────────────────────────
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [ruleModalOpen,    setRuleModalOpen]    = useState(false);

  // ── date range state ─────────────────────────────────────────────────────────
  const [plDateRange,  setPlDateRange]  = useState({ startDate: firstOfMonth, endDate: today });
  const [cfDateRange,  setCfDateRange]  = useState({ startDate: firstOfMonth, endDate: today });
  const [vatDateRange, setVatDateRange] = useState({ startDate: firstOfMonth, endDate: today });
  const [bsAsOfDate,   setBsAsOfDate]   = useState(today);
  const [agedAsOfDate, setAgedAsOfDate] = useState(today);

  // ── forms ────────────────────────────────────────────────────────────────────
  const [accountForm] = Form.useForm();
  const [journalForm] = Form.useForm();
  const [ruleForm]    = Form.useForm();
  const [reverseForm] = Form.useForm();
  const [paymentForm] = Form.useForm();
  const [importForm]  = Form.useForm();

  // ── computed ─────────────────────────────────────────────────────────────────
  const totals = useMemo(() => ({
    accounts:    accounts.length,
    rules:       rules.length,
    openPeriods: periods.filter(p => p.status === 'open').length,
    journals:    journalEntries.length
  }), [accounts, rules, periods, journalEntries]);

  // ─────────────────────────────────────────────────────────────────────────────
  // DATA LOADING
  // ─────────────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [acRes, ruRes, peRes, jeRes, tbRes, kpiRes] = await Promise.all([
        accountingAPI.getAccounts(),
        accountingAPI.getRules(),
        accountingAPI.getPeriods(),
        accountingAPI.getJournalEntries({ page: 1, limit: 50 }),
        accountingAPI.getTrialBalance(),
        accountingAPI.getDashboardKPIs()
      ]);
      setAccounts(acRes.data || []);
      setRules(ruRes.data || []);
      setPeriods(peRes.data || []);
      setJournalEntries(jeRes.data || []);
      setTrialBalance(tbRes.data || { lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });
      setKpis(kpiRes.data || null);
    } catch (err) {
      message.error(err.response?.data?.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPayments = useCallback(async (params = {}) => {
    try {
      setPaymentsLoading(true);
      const res = await accountingAPI.getPayments(params);
      setPayments(res.payments || []);
      setPaymentsTotal(res.total || 0);
    } catch (err) {
      message.error('Failed to load payments');
    } finally {
      setPaymentsLoading(false);
    }
  }, []);

  const loadBankTxs = useCallback(async (params = {}) => {
    try {
      setRecoLoading(true);
      const [txRes, sumRes] = await Promise.all([
        accountingAPI.getBankTransactions({ accountCode: '1010', ...params }),
        accountingAPI.getReconciliationSummary({ accountCode: '1010' })
      ]);
      setBankTxs(txRes.transactions || []);
      setRecoSummary(sumRes.data || null);
    } catch (err) {
      message.error('Failed to load bank data');
    } finally {
      setRecoLoading(false);
    }
  }, []);

  const loadAuditLog = useCallback(async () => {
    try {
      setAuditLoading(true);
      const res = await accountingAPI.getAuditLog({ limit: 100 });
      setAuditLogs(res.logs || []);
    } catch (err) {
      message.error('Failed to load audit log');
    } finally {
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ─────────────────────────────────────────────────────────────────────────────
  // REPORT GENERATORS
  // ─────────────────────────────────────────────────────────────────────────────

  const loadPL = async () => {
    try { setReportsLoading(true); const r = await accountingAPI.getProfitAndLoss(plDateRange); setPlData(r.data); }
    catch { message.error('Failed to load P&L'); } finally { setReportsLoading(false); }
  };
  const loadBS = async () => {
    try { setReportsLoading(true); const r = await accountingAPI.getBalanceSheet({ asOfDate: bsAsOfDate }); setBsData(r.data); }
    catch { message.error('Failed to load balance sheet'); } finally { setReportsLoading(false); }
  };
  const loadCF = async () => {
    try { setReportsLoading(true); const r = await accountingAPI.getCashFlowStatement(cfDateRange); setCfData(r.data); }
    catch { message.error('Failed to load cash flow'); } finally { setReportsLoading(false); }
  };
  const loadVAT = async () => {
    try { setReportsLoading(true); const r = await accountingAPI.getVATReturn(vatDateRange); setVatData(r.data); }
    catch { message.error('Failed to load VAT return'); } finally { setReportsLoading(false); }
  };
  const loadAged = async () => {
    try {
      setReportsLoading(true);
      const [ar, ap] = await Promise.all([
        accountingAPI.getAgedReceivables({ asOfDate: agedAsOfDate }),
        accountingAPI.getAgedPayables({ asOfDate: agedAsOfDate })
      ]);
      setAgedAR(ar.data); setAgedAP(ap.data);
    } catch { message.error('Failed to load aged report'); } finally { setReportsLoading(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ─────────────────────────────────────────────────────────────────────────────

  const handleBootstrap = async () => {
    try {
      setLoading(true);
      await Promise.all([accountingAPI.bootstrapDefaultChart(), accountingAPI.bootstrapDefaultRules()]);
      message.success('Defaults bootstrapped');
      await loadData();
    } catch (err) { message.error('Bootstrap failed'); setLoading(false); }
  };

  const handleCreateAccount = async (values) => {
    try { await accountingAPI.createAccount(values); message.success('Account created');
      setAccountModalOpen(false); accountForm.resetFields(); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCreateJournal = async (values) => {
    try {
      const lines = JSON.parse(values.linesJson);
      await accountingAPI.createJournalEntry({ date: values.date, description: values.description, lines });
      message.success('Journal draft created — submit for review to post');
      setJournalModalOpen(false); journalForm.resetFields(); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleCreateRule = async (values) => {
    try {
      const lines = JSON.parse(values.linesJson);
      await accountingAPI.createRule({ ...values, lines });
      message.success('Rule created'); setRuleModalOpen(false); ruleForm.resetFields(); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleToggleRule = async (rule) => {
    try { await accountingAPI.updateRule(rule._id, { ...rule, isActive: !rule.isActive });
      message.success(`Rule ${!rule.isActive ? 'enabled' : 'disabled'}`); await loadData();
    } catch (err) { message.error('Failed to update rule'); }
  };

  const handlePeriodStatus = async (values, status) => {
    try {
      status === 'open' ? await accountingAPI.openPeriod(values) : await accountingAPI.closePeriod(values);
      message.success(`Period ${status}ed`); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleSubmitJournal = async (entryId) => {
    try { await accountingAPI.submitJournalForReview(entryId); message.success('Submitted for review'); await loadData(); }
    catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleApproveJournal = async (entryId) => {
    try { await accountingAPI.approveJournal(entryId); message.success('Approved and posted'); await loadData(); }
    catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleRejectJournal = async (entryId, reason) => {
    try { await accountingAPI.rejectJournal(entryId, reason); message.success('Returned to draft'); await loadData(); }
    catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReverseEntry = async (values) => {
    try {
      if (!selectedEntry?._id) return;
      await accountingAPI.reverseJournalEntry(selectedEntry._id, values);
      message.success('Reversal posted'); setReverseModalOpen(false); reverseForm.resetFields(); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleViewLedger = async (accountId) => {
    try { setLedgerLoading(true); const r = await accountingAPI.getGeneralLedger(accountId);
      setLedgerData(r.data); setLedgerOpen(true);
    } catch (err) { message.error('Failed to load ledger'); } finally { setLedgerLoading(false); }
  };

  const handleCreatePayment = async (values) => {
    try {
      const payment = await accountingAPI.createPayment({ ...values, recordedBy: undefined });
      if (values.autoPost) {
        if (values.type === 'receipt') await accountingAPI.postPaymentReceipt(payment.data._id);
        else await accountingAPI.postSupplierPayment(payment.data._id);
        message.success('Payment recorded and posted to ledger');
      } else {
        message.success('Payment recorded');
      }
      setPaymentModalOpen(false); paymentForm.resetFields(); await loadPayments(); await loadData();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  const handleImportBankCSV = async (values) => {
    try {
      let rows;
      try { rows = JSON.parse(values.csvJson); } catch { throw new Error('Invalid JSON'); }
      const res = await accountingAPI.importBankTransactions({ rows, accountCode: values.accountCode || '1010' });
      message.success(`${res.imported} transactions imported`);
      setImportModalOpen(false); importForm.resetFields(); await loadBankTxs();
    } catch (err) { message.error(err.response?.data?.message || err.message || 'Import failed'); }
  };

  const handleReconcile = async () => {
    if (!selectedBankTx || !recoEntryId) { message.warning('Select a bank transaction and enter a journal entry ID'); return; }
    try {
      await accountingAPI.reconcileTransaction({ bankTxId: selectedBankTx._id, journalEntryId: recoEntryId });
      message.success('Reconciled'); setSelectedBankTx(null); setRecoEntryId(''); await loadBankTxs();
    } catch (err) { message.error(err.response?.data?.message || 'Failed'); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TABLE COLUMN DEFINITIONS
  // ─────────────────────────────────────────────────────────────────────────────

  const accountColumns = [
    { title: 'Code',    dataIndex: 'code',   key: 'code',   width: 100 },
    { title: 'Name',    dataIndex: 'name',   key: 'name' },
    { title: 'Type',    dataIndex: 'type',   key: 'type',   width: 120, render: v => <Tag>{v}</Tag> },
    { title: 'Normal',  dataIndex: 'normalBalance', key: 'nb', width: 100 },
    { title: 'Status',  dataIndex: 'isActive', key: 'ia',   width: 100,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Active' : 'Inactive'}</Tag> },
    { title: '', key: 'action', width: 90,
      render: (_, r) => <Button size="small" onClick={() => handleViewLedger(r._id)}>Ledger</Button> }
  ];

  const journalStatusColor = { draft: 'default', pending_approval: 'orange', posted: 'green', void: 'red' };
  const journalColumns = [
    { title: 'Entry #',  dataIndex: 'entryNumber', key: 'en',  width: 150 },
    { title: 'Date',     dataIndex: 'date',        key: 'dt',  width: 110, render: fmtDate },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Source',   dataIndex: 'sourceType',  key: 'st',  width: 160, render: v => <Tag>{v}</Tag> },
    { title: 'Status',   dataIndex: 'status',      key: 'sts', width: 140,
      render: v => <Tag color={journalStatusColor[v] || 'default'}>{v}</Tag> },
    { title: 'Debit',    dataIndex: 'totalDebit',  key: 'dr',  width: 120, render: fmt },
    { title: 'Credit',   dataIndex: 'totalCredit', key: 'cr',  width: 120, render: fmt },
    { title: '',         key: 'actions',           width: 180,
      render: (_, r) => (
        <Space size={4}>
          {r.status === 'draft' && (
            <Popconfirm title="Submit for review?" onConfirm={() => handleSubmitJournal(r._id)}>
              <Button size="small" type="link">Submit</Button>
            </Popconfirm>
          )}
          {r.status === 'pending_approval' && (
            <>
              <Popconfirm title="Approve and post?" onConfirm={() => handleApproveJournal(r._id)}>
                <Button size="small" type="link" style={{ color: 'green' }}>Approve</Button>
              </Popconfirm>
              <Popconfirm title="Reject?" onConfirm={() => handleRejectJournal(r._id, 'Rejected by reviewer')}>
                <Button size="small" type="link" danger>Reject</Button>
              </Popconfirm>
            </>
          )}
          {r.status === 'posted' && !r.isReversal && (
            <Button size="small" icon={<RetweetOutlined />} onClick={() => {
              setSelectedEntry(r);
              reverseForm.setFieldsValue({ reversalDate: today, reason: `Reverse ${r.entryNumber}` });
              setReverseModalOpen(true);
            }}>Reverse</Button>
          )}
        </Space>
      )
    }
  ];

  const ruleColumns = [
    { title: 'Name',     dataIndex: 'name',         key: 'nm' },
    { title: 'Document', dataIndex: 'documentType', key: 'dt',  width: 160 },
    { title: 'Priority', dataIndex: 'priority',     key: 'pr',  width: 90  },
    { title: 'Status',   dataIndex: 'isActive',     key: 'ia',  width: 90,
      render: v => <Tag color={v ? 'green' : 'red'}>{v ? 'Active' : 'Off'}</Tag> },
    { title: '', key: 'action', width: 100,
      render: (_, r) => <Button size="small" onClick={() => handleToggleRule(r)}>{r.isActive ? 'Disable' : 'Enable'}</Button> }
  ];

  const periodColumns = [
    { title: 'Year',   dataIndex: 'year',    key: 'yr', width: 90 },
    { title: 'Month',  dataIndex: 'month',   key: 'mo', width: 90 },
    { title: 'Status', dataIndex: 'status',  key: 'st', width: 110,
      render: v => <Tag color={v === 'open' ? 'green' : 'orange'}>{v.toUpperCase()}</Tag> },
    { title: 'Closed', dataIndex: 'closedAt', key: 'ca', render: fmtDate, width: 140 },
    { title: 'Notes',  dataIndex: 'notes',   key: 'nt', render: v => v || '-' }
  ];

  const trialColumns = [
    { title: 'Code',    dataIndex: 'code',          key: 'code',  width: 100 },
    { title: 'Account', dataIndex: 'name',          key: 'name' },
    { title: 'Type',    dataIndex: 'type',          key: 'type',  width: 110 },
    { title: 'Debit',   dataIndex: 'debitBalance',  key: 'db',    width: 140, render: fmt },
    { title: 'Credit',  dataIndex: 'creditBalance', key: 'cb',    width: 140, render: fmt }
  ];

  const paymentColumns = [
    { title: 'Number',  dataIndex: 'paymentNumber', key: 'pn',   width: 160 },
    { title: 'Date',    dataIndex: 'paymentDate',   key: 'pd',   width: 110, render: fmtDate },
    { title: 'Type',    dataIndex: 'type',          key: 'ty',   width: 100,
      render: v => <Tag color={v === 'receipt' ? 'green' : 'orange'}>{v}</Tag> },
    { title: 'Method',  dataIndex: 'paymentMethod', key: 'pm',   width: 130 },
    { title: 'Amount',  dataIndex: 'amount',        key: 'am',   width: 130, render: fmt },
    { title: 'Ref',     dataIndex: 'reference',     key: 'rf',   render: v => v || '-' },
    { title: 'Posted',  key: 'posted', width: 90,
      render: (_, r) => <Tag color={r.accountingAudit?.isPosted ? 'green' : 'default'}>
        {r.accountingAudit?.isPosted ? 'Yes' : 'No'}
      </Tag> }
  ];

  const bankTxColumns = [
    { title: 'Date',    dataIndex: 'date',        key: 'dt',  width: 110, render: fmtDate },
    { title: 'Description', dataIndex: 'description', key: 'desc' },
    { title: 'Amount',  dataIndex: 'amount',      key: 'am',  width: 120, render: fmt },
    { title: 'Type',    dataIndex: 'type',        key: 'ty',  width: 90,
      render: v => <Tag color={v === 'credit' ? 'green' : 'red'}>{v}</Tag> },
    { title: 'Reconciled', dataIndex: 'isReconciled', key: 'rc', width: 110,
      render: v => <Tag color={v ? 'green' : 'default'}>{v ? 'Yes' : 'No'}</Tag> },
    { title: '', key: 'action', width: 80,
      render: (_, r) => !r.isReconciled && (
        <Button size="small" onClick={() => setSelectedBankTx(r)}>Match</Button>
      )}
  ];

  const auditColumns = [
    { title: 'Time',   dataIndex: 'createdAt', key: 'ts', width: 150,
      render: v => v ? new Date(v).toLocaleString() : '-' },
    { title: 'Action', dataIndex: 'action',    key: 'ac', width: 220,
      render: v => <Tag>{v}</Tag> },
    { title: 'Entity', dataIndex: 'entityType', key: 'et', width: 130 },
    { title: 'By',     dataIndex: 'performedBy', key: 'pb',
      render: v => v?.fullName || v?.email || '-' },
    { title: 'Detail', dataIndex: 'description', key: 'ds' }
  ];

  const ledgerColumns = [
    { title: 'Date',     dataIndex: 'date',           key: 'dt', width: 110, render: fmtDate },
    { title: 'Entry #',  dataIndex: 'entryNumber',    key: 'en', width: 140 },
    { title: 'Description', dataIndex: 'description', key: 'ds' },
    { title: 'Debit',    dataIndex: 'debit',          key: 'dr', width: 110, render: fmt },
    { title: 'Credit',   dataIndex: 'credit',         key: 'cr', width: 110, render: fmt },
    { title: 'Balance',  dataIndex: 'runningBalance', key: 'rb', width: 120, render: fmt }
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // DATE RANGE PICKER COMPONENT
  // ─────────────────────────────────────────────────────────────────────────────
  const DateRangePicker = ({ value, onChange, label = 'Period' }) => (
    <Space>
      <Text type="secondary">{label}:</Text>
      <Input type="date" value={value.startDate}
        onChange={e => onChange({ ...value, startDate: e.target.value })} style={{ width: 150 }} />
      <Text type="secondary">to</Text>
      <Input type="date" value={value.endDate}
        onChange={e => onChange({ ...value, endDate: e.target.value })} style={{ width: 150 }} />
    </Space>
  );

  const ExportButton = ({ endpoint, params, label }) => (
    <Button size="small" icon={<DownloadOutlined />}
      onClick={() => accountingAPI.exportCSV(endpoint, params)}>{label}</Button>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: 24 }}>

      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Finance Accounting Center</Title>
          <Text type="secondary">Full double-entry ledger · Payments · Reconciliation · Reports</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh</Button>
            <Button icon={<DatabaseOutlined />} onClick={handleBootstrap} loading={loading}>Bootstrap</Button>
          </Space>
        </Col>
      </Row>

      {/* KPI Cards */}
      {kpis && (
        <Row gutter={12} style={{ marginBottom: 16 }}>
          {[
            { title: 'Cash Balance',     value: kpis.cashBalance,       prefix: '$', color: kpis.cashBalance > 0 ? '#3f8600' : '#cf1322' },
            { title: 'Receivables',      value: kpis.totalReceivables,  prefix: '$', color: '#096dd9' },
            { title: 'Payables',         value: kpis.totalPayables,     prefix: '$', color: '#d46b08' },
            { title: 'Revenue (month)',  value: kpis.revenueThisMonth,  prefix: '$', color: '#3f8600' },
            { title: 'Expenses (month)', value: kpis.expensesThisMonth, prefix: '$', color: '#cf1322' },
            { title: 'Overdue Invoices', value: kpis.overdueInvoices,   suffix: ' inv', color: kpis.overdueInvoices > 0 ? '#cf1322' : '#3f8600' },
            { title: 'Pending Journals', value: kpis.pendingJournals,   suffix: ' entries', color: kpis.pendingJournals > 0 ? '#d46b08' : '#3f8600' },
            { title: `Net ${kpis.isProfit ? 'Profit' : 'Loss'}`, value: Math.abs(kpis.netProfitThisMonth), prefix: '$', color: kpis.isProfit ? '#3f8600' : '#cf1322' }
          ].map(k => (
            <Col key={k.title} xs={12} sm={6} md={3}>
              <Card size="small" bodyStyle={{ padding: '10px 12px' }}>
                <Statistic title={<span style={{ fontSize: 11 }}>{k.title}</span>}
                  value={k.value} prefix={k.prefix} suffix={k.suffix}
                  precision={k.prefix ? 2 : 0}
                  valueStyle={{ fontSize: 14, color: k.color }} />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {!trialBalance?.isBalanced && (
        <Alert type="warning" showIcon style={{ marginBottom: 16 }}
          message="Trial balance is not balanced — check for unposted or orphaned entries" />
      )}

      {/* Main Tabs */}
      <Tabs items={[

        // ── ACCOUNTS ──────────────────────────────────────────────────────────
        {
          key: 'accounts', label: 'Chart of Accounts',
          children: (
            <Card title="Chart of Accounts"
              extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAccountModalOpen(true)}>New Account</Button>}>
              <Table loading={loading} columns={accountColumns} dataSource={accounts} rowKey="_id" pagination={{ pageSize: 12 }} />
            </Card>
          )
        },

        // ── JOURNALS ──────────────────────────────────────────────────────────
        {
          key: 'journals', label: 'Journal Entries',
          children: (
            <Card title="Journal Entries"
              extra={
                <Space>
                  <ExportButton endpoint="journal-entries.csv" params={{ startDate: firstOfMonth, endDate: today }} label="Export CSV" />
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setJournalModalOpen(true)}>New Draft</Button>
                </Space>
              }>
              <Table loading={loading} columns={journalColumns} dataSource={journalEntries} rowKey="_id"
                expandable={{
                  expandedRowRender: r => (
                    <Table size="small" pagination={false}
                      rowKey={(_, i) => i}
                      dataSource={r.lines || []}
                      columns={[
                        { title: 'Account', key: 'acc', render: (_, l) => `${l.account?.code || ''} ${l.account?.name || ''}` },
                        { title: 'Description', dataIndex: 'description', key: 'ds' },
                        { title: 'Debit',  dataIndex: 'debit',  key: 'dr', width: 120, render: fmt },
                        { title: 'Credit', dataIndex: 'credit', key: 'cr', width: 120, render: fmt }
                      ]} />
                  )
                }}
                pagination={{ pageSize: 12 }} />
            </Card>
          )
        },

        // ── PAYMENTS ──────────────────────────────────────────────────────────
        {
          key: 'payments', label: 'Payments',
          children: (
            <Card title="Payments — Receipts & Disbursements"
              extra={
                <Space>
                  <Button onClick={() => loadPayments()}>Load</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setPaymentModalOpen(true)}>Record Payment</Button>
                </Space>
              }>
              <Table loading={paymentsLoading} columns={paymentColumns} dataSource={payments}
                rowKey="_id" pagination={{ pageSize: 12 }}
                locale={{ emptyText: 'Click "Load" to fetch payments' }} />
            </Card>
          )
        },

        // ── RULES ─────────────────────────────────────────────────────────────
        {
          key: 'rules', label: 'Posting Rules',
          children: (
            <Card title="Rule Engine"
              extra={<Button type="primary" icon={<SettingOutlined />} onClick={() => setRuleModalOpen(true)}>New Rule</Button>}>
              <Table loading={loading} columns={ruleColumns} dataSource={rules} rowKey="_id"
                expandable={{ expandedRowRender: r => <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(r.lines, null, 2)}</pre> }}
                pagination={{ pageSize: 12 }} />
            </Card>
          )
        },

        // ── PERIODS ───────────────────────────────────────────────────────────
        {
          key: 'periods', label: 'Periods',
          children: (
            <Row gutter={16}>
              <Col span={9}>
                <Card title="Open / Close Period">
                  <Form layout="vertical"
                    onFinish={(v) => handlePeriodStatus(v, v.targetStatus)}
                    initialValues={{ year: now.getFullYear(), month: now.getMonth() + 1, targetStatus: 'close' }}>
                    <Form.Item name="year"         label="Year"   rules={[{ required: true }]}><InputNumber min={2000} max={3000} style={{ width: '100%' }} /></Form.Item>
                    <Form.Item name="month"        label="Month"  rules={[{ required: true }]}><Select options={monthOptions} /></Form.Item>
                    <Form.Item name="notes"        label="Notes"><Input /></Form.Item>
                    <Form.Item name="targetStatus" label="Action" rules={[{ required: true }]}>
                      <Select options={[{ label: 'Close', value: 'close' }, { label: 'Open', value: 'open' }]} />
                    </Form.Item>
                    <Button htmlType="submit" type="primary" block>Apply</Button>
                  </Form>
                </Card>
              </Col>
              <Col span={15}>
                <Card title="Period History">
                  <Table loading={loading} columns={periodColumns} dataSource={periods}
                    rowKey={r => `${r.year}-${r.month}`} pagination={{ pageSize: 8 }} />
                </Card>
              </Col>
            </Row>
          )
        },

        // ── TRIAL BALANCE ─────────────────────────────────────────────────────
        {
          key: 'trial-balance', label: 'Trial Balance',
          children: (
            <Card title="Trial Balance"
              extra={<ExportButton endpoint="trial-balance.csv" params={{}} label="Export CSV" />}>
              <Table loading={loading} columns={trialColumns} dataSource={trialBalance.lines}
                rowKey="accountId" pagination={{ pageSize: 14 }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}><Text strong>Totals</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={3}><Text strong>{fmt(trialBalance.totals?.debit)}</Text></Table.Summary.Cell>
                      <Table.Summary.Cell index={4}><Text strong>{fmt(trialBalance.totals?.credit)}</Text></Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )} />
              <Tag icon={<CheckCircleOutlined />} color={trialBalance.isBalanced ? 'green' : 'red'} style={{ marginTop: 10 }}>
                {trialBalance.isBalanced ? 'Balanced' : 'Not Balanced'}
              </Tag>
            </Card>
          )
        },

        // ── P&L ───────────────────────────────────────────────────────────────
        {
          key: 'pl', label: 'P&L',
          children: (
            <Card title="Profit & Loss Statement"
              extra={plData && <ExportButton endpoint="profit-and-loss.csv" params={plDateRange} label="Export" />}>
              <Space style={{ marginBottom: 16 }} wrap>
                <DateRangePicker value={plDateRange} onChange={setPlDateRange} />
                <Button type="primary" onClick={loadPL} loading={reportsLoading}>Generate</Button>
              </Space>
              {plData && <>
                <Title level={5} style={{ color: '#389e0d' }}>Revenue</Title>
                <Table size="small" dataSource={plData.revenueLines} rowKey="accountId" pagination={false}
                  columns={[{ title: 'Code', dataIndex: 'code', width: 90 }, { title: 'Account', dataIndex: 'name' }, { title: 'Amount', dataIndex: 'balance', width: 150, render: fmt }]} />
                <div style={{ textAlign: 'right', padding: '8px 4px', borderTop: '1px solid #f0f0f0', marginBottom: 16 }}>
                  <Text strong>Total Revenue: {fmt(plData.totalRevenue)}</Text>
                </div>
                <Title level={5} style={{ color: '#cf1322' }}>Expenses</Title>
                <Table size="small" dataSource={plData.expenseLines} rowKey="accountId" pagination={false}
                  columns={[{ title: 'Code', dataIndex: 'code', width: 90 }, { title: 'Account', dataIndex: 'name' }, { title: 'Amount', dataIndex: 'balance', width: 150, render: v => fmt(Math.abs(v)) }]} />
                <div style={{ textAlign: 'right', padding: '8px 4px', borderTop: '1px solid #f0f0f0', marginBottom: 16 }}>
                  <Text strong>Total Expenses: {fmt(plData.totalExpenses)}</Text>
                </div>
                <div style={{ textAlign: 'right', padding: '12px 16px', background: plData.isProfit ? '#f6ffed' : '#fff1f0', borderRadius: 6 }}>
                  <Text strong style={{ fontSize: 16, color: plData.isProfit ? '#389e0d' : '#cf1322' }}>
                    {plData.isProfit ? 'Net Profit' : 'Net Loss'}: {fmt(Math.abs(plData.netProfit))}
                  </Text>
                </div>
              </>}
            </Card>
          )
        },

        // ── BALANCE SHEET ─────────────────────────────────────────────────────
        {
          key: 'bs', label: 'Balance Sheet',
          children: (
            <Card title="Balance Sheet"
              extra={bsData && <ExportButton endpoint="balance-sheet.csv" params={{ asOfDate: bsAsOfDate }} label="Export" />}>
              <Space style={{ marginBottom: 16 }}>
                <Text type="secondary">As of:</Text>
                <Input type="date" value={bsAsOfDate} onChange={e => setBsAsOfDate(e.target.value)} style={{ width: 160 }} />
                <Button type="primary" onClick={loadBS} loading={reportsLoading}>Generate</Button>
              </Space>
              {bsData && (
                <Row gutter={24}>
                  <Col span={12}>
                    <Title level={5}>Assets</Title>
                    <Table size="small" dataSource={bsData.assetLines} rowKey="accountId" pagination={false}
                      columns={[{ title: 'Code', dataIndex: 'code', width: 80 }, { title: 'Account', dataIndex: 'name' }, { title: 'Balance', dataIndex: 'balance', width: 120, render: fmt }]} />
                    <div style={{ textAlign: 'right', padding: '8px 4px', borderTop: '1px solid #f0f0f0' }}>
                      <Text strong>Total Assets: {fmt(bsData.totalAssets)}</Text>
                    </div>
                  </Col>
                  <Col span={12}>
                    <Title level={5}>Liabilities</Title>
                    <Table size="small" dataSource={bsData.liabilityLines} rowKey="accountId" pagination={false}
                      columns={[{ title: 'Code', dataIndex: 'code', width: 80 }, { title: 'Account', dataIndex: 'name' }, { title: 'Balance', dataIndex: 'balance', width: 120, render: fmt }]} />
                    <div style={{ textAlign: 'right', padding: '8px 4px', borderTop: '1px solid #f0f0f0', marginBottom: 12 }}>
                      <Text strong>Total Liabilities: {fmt(bsData.totalLiabilities)}</Text>
                    </div>
                    <Title level={5}>Equity</Title>
                    <Table size="small" dataSource={bsData.equityLines} rowKey="accountId" pagination={false}
                      columns={[{ title: 'Code', dataIndex: 'code', width: 80 }, { title: 'Account', dataIndex: 'name' }, { title: 'Balance', dataIndex: 'balance', width: 120, render: fmt }]} />
                    <div style={{ textAlign: 'right', padding: '8px 4px', borderTop: '1px solid #f0f0f0', marginTop: 4 }}>
                      <Text strong>Total Equity: {fmt(bsData.totalEquity)}</Text>
                    </div>
                    <div style={{ marginTop: 10, padding: '10px 14px', background: bsData.isBalanced ? '#f6ffed' : '#fff1f0', borderRadius: 6 }}>
                      <Text strong>Liab + Equity: {fmt(bsData.totalLiabEquity)} </Text>
                      <Tag color={bsData.isBalanced ? 'green' : 'red'}>{bsData.isBalanced ? 'Balanced' : 'Off'}</Tag>
                    </div>
                  </Col>
                </Row>
              )}
            </Card>
          )
        },

        // ── CASH FLOW ─────────────────────────────────────────────────────────
        {
          key: 'cf', label: 'Cash Flow',
          children: (
            <Card title="Cash Flow Statement">
              <Space style={{ marginBottom: 16 }} wrap>
                <DateRangePicker value={cfDateRange} onChange={setCfDateRange} />
                <Button type="primary" onClick={loadCF} loading={reportsLoading}>Generate</Button>
              </Space>
              {cfData && (
                <>
                  {[
                    { title: 'Operating Activities', items: [
                        { label: 'Net profit / (loss)', value: cfData.operating.netProfit },
                        { label: 'Change in receivables', value: cfData.operating.arChange },
                        { label: 'Change in payables', value: cfData.operating.apChange },
                        { label: 'Change in accruals', value: cfData.operating.accruedChange }
                      ], total: cfData.operating.total },
                    { title: 'Investing Activities', items: [
                        { label: 'Fixed asset movement', value: cfData.investing.fixedAssetChange }
                      ], total: cfData.investing.total },
                    { title: 'Financing Activities', items: [
                        { label: 'Equity movement', value: cfData.financing.equityChange }
                      ], total: cfData.financing.total }
                  ].map(section => (
                    <div key={section.title} style={{ marginBottom: 16 }}>
                      <Title level={5}>{section.title}</Title>
                      {section.items.map(item => (
                        <Row key={item.label} justify="space-between" style={{ padding: '4px 8px' }}>
                          <Col><Text type="secondary">{item.label}</Text></Col>
                          <Col><Text style={{ color: item.value >= 0 ? '#389e0d' : '#cf1322' }}>{fmt(item.value)}</Text></Col>
                        </Row>
                      ))}
                      <Row justify="space-between" style={{ padding: '6px 8px', borderTop: '1px solid #f0f0f0' }}>
                        <Col><Text strong>Net {section.title.split(' ')[0]}</Text></Col>
                        <Col><Text strong style={{ color: section.total >= 0 ? '#389e0d' : '#cf1322' }}>{fmt(section.total)}</Text></Col>
                      </Row>
                    </div>
                  ))}
                  <Divider />
                  <Row justify="space-between" style={{ padding: '6px 8px' }}>
                    <Col><Text>Opening cash balance</Text></Col>
                    <Col><Text>{fmt(cfData.openingCash)}</Text></Col>
                  </Row>
                  <Row justify="space-between" style={{ padding: '6px 8px' }}>
                    <Col><Text>Net change in cash</Text></Col>
                    <Col><Text style={{ color: cfData.netCashChange >= 0 ? '#389e0d' : '#cf1322' }}>{fmt(cfData.netCashChange)}</Text></Col>
                  </Row>
                  <Row justify="space-between" style={{ padding: '10px 8px', background: '#fafafa', borderRadius: 6 }}>
                    <Col><Text strong>Closing cash balance</Text></Col>
                    <Col><Text strong style={{ fontSize: 16, color: cfData.closingCash >= 0 ? '#389e0d' : '#cf1322' }}>{fmt(cfData.closingCash)}</Text></Col>
                  </Row>
                </>
              )}
            </Card>
          )
        },

        // ── VAT RETURN ────────────────────────────────────────────────────────
        {
          key: 'vat', label: 'VAT Return',
          children: (
            <Card title="VAT Return Summary">
              <Space style={{ marginBottom: 16 }} wrap>
                <DateRangePicker value={vatDateRange} onChange={setVatDateRange} />
                <Button type="primary" onClick={loadVAT} loading={reportsLoading}>Generate</Button>
              </Space>
              {vatData && (
                <>
                  <Row gutter={16} style={{ marginBottom: 20 }}>
                    <Col span={8}><Card size="small"><Statistic title="Output VAT (collected)" value={vatData.outputVAT} precision={2} valueStyle={{ color: '#cf1322' }} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title="Input VAT (paid to suppliers)" value={vatData.inputVAT} precision={2} valueStyle={{ color: '#389e0d' }} /></Card></Col>
                    <Col span={8}><Card size="small"><Statistic title={vatData.isRefund ? 'VAT Refund Due' : 'Net VAT Due'} value={Math.abs(vatData.netVATDue)} precision={2} valueStyle={{ color: vatData.isRefund ? '#389e0d' : '#d46b08' }} /></Card></Col>
                  </Row>
                  <Title level={5}>Output VAT transactions</Title>
                  <Table size="small" dataSource={vatData.outputLines} rowKey={(_, i) => `out-${i}`} pagination={{ pageSize: 8 }}
                    columns={[{ title: 'Date', dataIndex: 'date', width: 110, render: fmtDate }, { title: 'Entry', dataIndex: 'entryNumber', width: 150 }, { title: 'Description', dataIndex: 'description' }, { title: 'VAT', dataIndex: 'amount', width: 120, render: fmt }]} />
                  <Title level={5} style={{ marginTop: 16 }}>Input VAT transactions</Title>
                  <Table size="small" dataSource={vatData.inputLines} rowKey={(_, i) => `in-${i}`} pagination={{ pageSize: 8 }}
                    columns={[{ title: 'Date', dataIndex: 'date', width: 110, render: fmtDate }, { title: 'Entry', dataIndex: 'entryNumber', width: 150 }, { title: 'Description', dataIndex: 'description' }, { title: 'VAT', dataIndex: 'amount', width: 120, render: fmt }]} />
                </>
              )}
            </Card>
          )
        },

        // ── AGED AR / AP ──────────────────────────────────────────────────────
        {
          key: 'aged', label: 'Aged AR/AP',
          children: (
            <Card title="Aged Receivables & Payables">
              <Space style={{ marginBottom: 16 }}>
                <Text type="secondary">As of:</Text>
                <Input type="date" value={agedAsOfDate} onChange={e => setAgedAsOfDate(e.target.value)} style={{ width: 160 }} />
                <Button type="primary" onClick={loadAged} loading={reportsLoading}>Generate</Button>
              </Space>
              {agedAR && (
                <>
                  <Title level={5} style={{ color: '#096dd9' }}>Accounts Receivable</Title>
                  <Table size="small" dataSource={agedAR.rows} rowKey="customerId" pagination={{ pageSize: 8 }}
                    columns={agedCols('customerName', 'Customer')}
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                        {['current','days30','days60','days90','over90','total'].map((k, i) => (
                          <Table.Summary.Cell key={k} index={i + 1}><Text strong>{fmt(agedAR.grandTotal[k])}</Text></Table.Summary.Cell>
                        ))}
                      </Table.Summary.Row>
                    )} />
                </>
              )}
              {agedAP && (
                <>
                  <Title level={5} style={{ color: '#d46b08', marginTop: 20 }}>Accounts Payable</Title>
                  <Table size="small" dataSource={agedAP.rows} rowKey="supplierId" pagination={{ pageSize: 8 }}
                    columns={agedCols('supplierName', 'Supplier')}
                    summary={() => (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}><Text strong>Total</Text></Table.Summary.Cell>
                        {['current','days30','days60','days90','over90','total'].map((k, i) => (
                          <Table.Summary.Cell key={k} index={i + 1}><Text strong>{fmt(agedAP.grandTotal[k])}</Text></Table.Summary.Cell>
                        ))}
                      </Table.Summary.Row>
                    )} />
                </>
              )}
            </Card>
          )
        },

        // ── BANK RECONCILIATION ───────────────────────────────────────────────
        {
          key: 'recon', label: 'Reconciliation',
          children: (
            <Row gutter={16}>
              <Col span={16}>
                <Card title="Bank Transactions"
                  extra={
                    <Space>
                      <Button onClick={() => loadBankTxs()}>Load</Button>
                      <Button icon={<UploadOutlined />} onClick={() => setImportModalOpen(true)}>Import CSV</Button>
                    </Space>
                  }>
                  {recoSummary && (
                    <Alert style={{ marginBottom: 12 }}
                      type={recoSummary.difference === 0 ? 'success' : 'warning'}
                      message={`Ledger: ${fmt(recoSummary.ledgerBalance)} · Bank: ${fmt(recoSummary.bankBalance)} · Difference: ${fmt(recoSummary.difference)} · Unreconciled: ${recoSummary.unreconciledBankCount}`} />
                  )}
                  <Table loading={recoLoading} columns={bankTxColumns} dataSource={bankTxs}
                    rowKey="_id" pagination={{ pageSize: 12 }}
                    locale={{ emptyText: 'Click "Load" to fetch transactions' }}
                    rowClassName={r => r._id === selectedBankTx?._id ? 'ant-table-row-selected' : ''} />
                </Card>
              </Col>
              <Col span={8}>
                <Card title="Match Transaction">
                  {selectedBankTx ? (
                    <>
                      <div style={{ marginBottom: 12, padding: 10, background: '#f6ffed', borderRadius: 6 }}>
                        <Text strong>{fmtDate(selectedBankTx.date)}</Text><br />
                        <Text>{selectedBankTx.description}</Text><br />
                        <Text type="secondary">{selectedBankTx.type.toUpperCase()} {fmt(selectedBankTx.amount)}</Text>
                      </div>
                      <Form.Item label="Journal Entry ID">
                        <Input value={recoEntryId} onChange={e => setRecoEntryId(e.target.value)} placeholder="ObjectId of journal entry" />
                      </Form.Item>
                      <Space>
                        <Button type="primary" icon={<CheckOutlined />} onClick={handleReconcile}>Reconcile</Button>
                        <Button onClick={() => setSelectedBankTx(null)}>Cancel</Button>
                      </Space>
                    </>
                  ) : (
                    <Text type="secondary">Select a bank transaction from the table to match it to a journal entry.</Text>
                  )}
                </Card>
              </Col>
            </Row>
          )
        },

        // ── AUDIT LOG ─────────────────────────────────────────────────────────
        {
          key: 'audit', label: 'Audit Log',
          children: (
            <Card title="Audit Log"
              extra={<Button onClick={loadAuditLog} loading={auditLoading} icon={<ReloadOutlined />}>Load</Button>}>
              <Table loading={auditLoading} columns={auditColumns} dataSource={auditLogs}
                rowKey="_id" pagination={{ pageSize: 14 }}
                locale={{ emptyText: 'Click "Load" to fetch audit log' }} />
            </Card>
          )
        }

      ]} />

      {/* ── MODALS ─────────────────────────────────────────────────────────── */}

      {/* New Account */}
      <Modal open={accountModalOpen} title="Create Account" onCancel={() => setAccountModalOpen(false)} footer={null}>
        <Form form={accountForm} layout="vertical" onFinish={handleCreateAccount}>
          <Form.Item name="code"          label="Code"           rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name"          label="Name"           rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type"          label="Type"           rules={[{ required: true }]}>
            <Select options={['asset','liability','equity','revenue','expense'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="normalBalance" label="Normal Balance" rules={[{ required: true }]}>
            <Select options={[{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }]} />
          </Form.Item>
          <Form.Item name="description"  label="Description"><TextArea rows={2} /></Form.Item>
          <Button type="primary" htmlType="submit" block>Create</Button>
        </Form>
      </Modal>

      {/* New Journal Draft */}
      <Modal open={journalModalOpen} title="New Journal Draft" onCancel={() => setJournalModalOpen(false)} footer={null}>
        <Form form={journalForm} layout="vertical" onFinish={handleCreateJournal}
          initialValues={{ date: today, linesJson: defaultJournalLines }}>
          <Form.Item name="date"        label="Date"        rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="linesJson"   label="Lines JSON"  rules={[{ required: true }, {
            validator: (_, v) => { try { const p = JSON.parse(v); if (Array.isArray(p) && p.length >= 2) return Promise.resolve(); } catch {} return Promise.reject('Valid JSON, min 2 lines'); }
          }]}><TextArea rows={10} /></Form.Item>
          <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>Manual journals start as draft and require a reviewer to approve before posting.</Text>
          <Button type="primary" htmlType="submit" block>Save Draft</Button>
        </Form>
      </Modal>

      {/* New Rule */}
      <Modal open={ruleModalOpen} title="Create Posting Rule" onCancel={() => setRuleModalOpen(false)} footer={null}>
        <Form form={ruleForm} layout="vertical" onFinish={handleCreateRule}
          initialValues={{ documentType: 'customer_invoice', priority: 100, isActive: true, linesJson: defaultRuleLines }}>
          <Form.Item name="name"         label="Name"          rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
            <Select options={['cash_request','supplier_invoice','customer_invoice','salary_payment','payment_receipt','supplier_payment'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="sourceType"   label="Source Type"><Input placeholder="Optional" /></Form.Item>
          <Form.Item name="priority"     label="Priority"      rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="isActive"     label="Active"        rules={[{ required: true }]}>
            <Select options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} />
          </Form.Item>
          <Form.Item name="linesJson"    label="Rule Lines JSON" rules={[{ required: true }]}><TextArea rows={8} /></Form.Item>
          <Button type="primary" htmlType="submit" block>Create Rule</Button>
        </Form>
      </Modal>

      {/* Reverse Journal */}
      <Modal open={reverseModalOpen} title={`Reverse ${selectedEntry?.entryNumber || ''}`}
        onCancel={() => setReverseModalOpen(false)} footer={null}>
        <Form form={reverseForm} layout="vertical" onFinish={handleReverseEntry}>
          <Form.Item name="reversalDate" label="Reversal Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="reason"       label="Reason"        rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
          <Popconfirm title="Post reversal entry?" onConfirm={() => reverseForm.submit()}>
            <Button type="primary" danger block icon={<RetweetOutlined />}>Post Reversal</Button>
          </Popconfirm>
        </Form>
      </Modal>

      {/* Record Payment */}
      <Modal open={paymentModalOpen} title="Record Payment" onCancel={() => setPaymentModalOpen(false)} footer={null}>
        <Form form={paymentForm} layout="vertical" onFinish={handleCreatePayment}
          initialValues={{ paymentDate: today, bankAccount: '1010', autoPost: true }}>
          <Form.Item name="type"          label="Type"           rules={[{ required: true }]}>
            <Select options={[{ value: 'receipt', label: 'Receipt (customer pays us)' }, { value: 'disbursement', label: 'Disbursement (we pay supplier)' }]} />
          </Form.Item>
          <Form.Item name="amount"        label="Amount"         rules={[{ required: true }]}><InputNumber min={0.01} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="paymentDate"   label="Payment Date"   rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="paymentMethod" label="Method"         rules={[{ required: true }]}>
            <Select options={['bank_transfer','cash','cheque','mobile_money'].map(v => ({ value: v, label: v }))} />
          </Form.Item>
          <Form.Item name="bankAccount"   label="Bank Account">
            <Select options={[{ value: '1010', label: '1010 Bank Account' }, { value: '1000', label: '1000 Cash on Hand' }]} />
          </Form.Item>
          <Form.Item name="invoiceId"     label="Invoice ID (optional)"><Input placeholder="ObjectId" /></Form.Item>
          <Form.Item name="supplierInvoiceId" label="Supplier Invoice ID (optional)"><Input placeholder="ObjectId" /></Form.Item>
          <Form.Item name="reference"     label="Reference / Cheque No"><Input /></Form.Item>
          <Form.Item name="notes"         label="Notes"><TextArea rows={2} /></Form.Item>
          <Form.Item name="autoPost"      label="Post to ledger immediately?">
            <Select options={[{ value: true, label: 'Yes — post now' }, { value: false, label: 'No — record only' }]} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Record Payment</Button>
        </Form>
      </Modal>

      {/* Import Bank Transactions */}
      <Modal open={importModalOpen} title="Import Bank Transactions" onCancel={() => setImportModalOpen(false)} footer={null}>
        <Form form={importForm} layout="vertical" onFinish={handleImportBankCSV}
          initialValues={{ accountCode: '1010' }}>
          <Form.Item name="accountCode" label="Bank Account">
            <Select options={[{ value: '1010', label: '1010 Bank Account' }, { value: '1000', label: '1000 Cash on Hand' }]} />
          </Form.Item>
          <Form.Item name="csvJson" label='Transactions JSON array' rules={[{ required: true }]}
            help='Format: [{"date":"2026-02-01","description":"Payment","amount":50000,"reference":"REF001"}, ...]'>
            <TextArea rows={10} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Import</Button>
        </Form>
      </Modal>

      {/* General Ledger Drawer */}
      <Drawer title={ledgerData ? `${ledgerData.account?.code} — ${ledgerData.account?.name}` : 'Ledger'}
        open={ledgerOpen} onClose={() => setLedgerOpen(false)} width={900}>
        {ledgerLoading ? <Text>Loading…</Text> : (
          <>
            <Space style={{ marginBottom: 12 }}>
              <Tag>Opening: {fmt(ledgerData?.openingBalance)}</Tag>
              <Tag color="blue">Closing: {fmt(ledgerData?.closingBalance)}</Tag>
            </Space>
            <Table columns={ledgerColumns} dataSource={ledgerData?.transactions || []}
              rowKey={(_, i) => i} pagination={{ pageSize: 15 }} scroll={{ x: 860 }} />
          </>
        )}
      </Drawer>

    </div>
  );
};

export default FinanceAccountingCenter;









// import React, { useEffect, useMemo, useState } from 'react';
// import {
//   Alert,
//   Button,
//   Card,
//   Col,
//   Drawer,
//   Form,
//   Input,
//   InputNumber,
//   message,
//   Modal,
//   Popconfirm,
//   Row,
//   Select,
//   Space,
//   Table,
//   Tabs,
//   Tag,
//   Typography
// } from 'antd';
// import {
//   CheckCircleOutlined,
//   DatabaseOutlined,
//   PlusOutlined,
//   ReloadOutlined,
//   RetweetOutlined,
//   SettingOutlined
// } from '@ant-design/icons';
// import { accountingAPI } from '../../services/api';

// const { Title, Text } = Typography;
// const { TextArea } = Input;

// const defaultJournalLines = JSON.stringify(
//   [
//     { account: '', description: 'Debit line', debit: 0, credit: 0 },
//     { account: '', description: 'Credit line', debit: 0, credit: 0 }
//   ],
//   null,
//   2
// );

// const defaultRuleLines = JSON.stringify(
//   [
//     { side: 'debit', accountCode: '1000', amountSource: 'gross', description: 'Main debit' },
//     { side: 'credit', accountCode: '4000', amountSource: 'gross', description: 'Main credit' }
//   ],
//   null,
//   2
// );

// const FinanceAccountingCenter = () => {
//   const [loading, setLoading] = useState(false);
//   const [accounts, setAccounts] = useState([]);
//   const [rules, setRules] = useState([]);
//   const [periods, setPeriods] = useState([]);
//   const [journalEntries, setJournalEntries] = useState([]);
//   const [trialBalance, setTrialBalance] = useState({ lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });
//   const [ledgerData, setLedgerData] = useState(null);
//   const [ledgerLoading, setLedgerLoading] = useState(false);
//   const [ledgerOpen, setLedgerOpen] = useState(false);

//   const [accountModalOpen, setAccountModalOpen] = useState(false);
//   const [journalModalOpen, setJournalModalOpen] = useState(false);
//   const [ruleModalOpen, setRuleModalOpen] = useState(false);
//   const [reverseModalOpen, setReverseModalOpen] = useState(false);
//   const [selectedEntry, setSelectedEntry] = useState(null);

//   const [accountForm] = Form.useForm();
//   const [journalForm] = Form.useForm();
//   const [ruleForm] = Form.useForm();
//   const [reverseForm] = Form.useForm();

//   const now = new Date();
//   const currentYear = now.getFullYear();
//   const currentMonth = now.getMonth() + 1;
//   const firstOfMonth = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
//   const today = now.toISOString().slice(0, 10);
 
//   const [plDateRange, setPlDateRange] = useState({ startDate: firstOfMonth, endDate: today });
//   const [bsAsOfDate, setBsAsOfDate] = useState(today);
  
//   const [plData, setPlData] = useState(null);
//   const [bsData, setBsData] = useState(null);
//   const [reportsLoading, setReportsLoading] = useState(false);

//   const monthOptions = [
//     { label: 'Jan', value: 1 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: 3 },
//     { label: 'Apr', value: 4 }, { label: 'May', value: 5 }, { label: 'Jun', value: 6 },
//     { label: 'Jul', value: 7 }, { label: 'Aug', value: 8 }, { label: 'Sep', value: 9 },
//     { label: 'Oct', value: 10 }, { label: 'Nov', value: 11 }, { label: 'Dec', value: 12 }
//   ];

//   const totals = useMemo(() => ({
//     accounts: accounts.length,
//     rules: rules.length,
//     openPeriods: periods.filter((period) => period.status === 'open').length,
//     journals: journalEntries.length
//   }), [accounts, rules, periods, journalEntries]);

//   const loadData = async () => {
//     try {
//       setLoading(true);
//       const [accountsRes, rulesRes, periodsRes, journalsRes, trialRes] = await Promise.all([
//         accountingAPI.getAccounts(),
//         accountingAPI.getRules(),
//         accountingAPI.getPeriods(),
//         accountingAPI.getJournalEntries({ page: 1, limit: 50 }),
//         accountingAPI.getTrialBalance()
//       ]);

//       setAccounts(accountsRes.data || []);
//       setRules(rulesRes.data || []);
//       setPeriods(periodsRes.data || []);
//       setJournalEntries(journalsRes.data || []);
//       setTrialBalance(trialRes.data || { lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to load accounting data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadData();
//   }, []);

//   const handleBootstrap = async () => {
//     try {
//       setLoading(true);
//       await Promise.all([
//         accountingAPI.bootstrapDefaultChart(),
//         accountingAPI.bootstrapDefaultRules()
//       ]);
//       message.success('Default chart and rules bootstrapped');
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Bootstrap failed');
//       setLoading(false);
//     }
//   };

//   const handleCreateAccount = async (values) => {
//     try {
//       await accountingAPI.createAccount(values);
//       message.success('Account created');
//       setAccountModalOpen(false);
//       accountForm.resetFields();
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to create account');
//     }
//   };

//   const handleCreateJournal = async (values) => {
//     try {
//       const parsedLines = JSON.parse(values.linesJson);
//       await accountingAPI.createJournalEntry({
//         date: values.date,
//         description: values.description,
//         lines: parsedLines
//       });
//       message.success('Journal entry posted');
//       setJournalModalOpen(false);
//       journalForm.resetFields();
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to create journal entry');
//     }
//   };

//   const handleCreateRule = async (values) => {
//     try {
//       const parsedLines = JSON.parse(values.linesJson);
//       await accountingAPI.createRule({
//         name: values.name,
//         documentType: values.documentType,
//         sourceType: values.sourceType || '',
//         description: values.description || '',
//         priority: values.priority,
//         isActive: values.isActive,
//         lines: parsedLines
//       });
//       message.success('Accounting rule created');
//       setRuleModalOpen(false);
//       ruleForm.resetFields();
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to create accounting rule');
//     }
//   };

//   const handleToggleRule = async (rule) => {
//     try {
//       await accountingAPI.updateRule(rule._id, {
//         ...rule,
//         isActive: !rule.isActive
//       });
//       message.success(`Rule ${!rule.isActive ? 'enabled' : 'disabled'}`);
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to update rule');
//     }
//   };

//   const handlePeriodStatus = async (values, status) => {
//     try {
//       if (status === 'open') {
//         await accountingAPI.openPeriod(values);
//       } else {
//         await accountingAPI.closePeriod(values);
//       }
//       message.success(`Period ${status}ed successfully`);
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || `Failed to ${status} period`);
//     }
//   };

//   const openReverseModal = (entry) => {
//     setSelectedEntry(entry);
//     reverseForm.setFieldsValue({
//       reversalDate: new Date().toISOString().slice(0, 10),
//       reason: `Reverse ${entry.entryNumber}`
//     });
//     setReverseModalOpen(true);
//   };

//   const handleReverseEntry = async (values) => {
//     try {
//       if (!selectedEntry?._id) return;
//       await accountingAPI.reverseJournalEntry(selectedEntry._id, values);
//       message.success('Reversal posted successfully');
//       setReverseModalOpen(false);
//       setSelectedEntry(null);
//       reverseForm.resetFields();
//       await loadData();
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to reverse journal entry');
//     }
//   };

//   const handleViewLedger = async (accountId) => {
//     try {
//       setLedgerLoading(true);
//       const response = await accountingAPI.getGeneralLedger(accountId);
//       setLedgerData(response.data || null);
//       setLedgerOpen(true);
//     } catch (error) {
//       message.error(error.response?.data?.message || 'Failed to load general ledger');
//     } finally {
//       setLedgerLoading(false);
//     }
//   };

//   const loadFinancialReports = async () => {
//     try {
//       setReportsLoading(true);
//       const [plRes, bsRes] = await Promise.all([
//         accountingAPI.getProfitAndLoss(plDateRange),
//         accountingAPI.getBalanceSheet({ asOfDate: bsAsOfDate })
//       ]);
//       setPlData(plRes.data || null);
//       setBsData(bsRes.data || null);
//     } catch (error) {
//       message.error('Failed to load financial reports');
//     } finally {
//       setReportsLoading(false);
//     }
//   };

//   const accountColumns = [
//     { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
//     { title: 'Name', dataIndex: 'name', key: 'name' },
//     { title: 'Type', dataIndex: 'type', key: 'type', render: (value) => <Tag>{value}</Tag>, width: 120 },
//     { title: 'Normal', dataIndex: 'normalBalance', key: 'normalBalance', width: 120 },
//     {
//       title: 'Status',
//       dataIndex: 'isActive',
//       key: 'isActive',
//       render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
//       width: 120
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       render: (_, record) => (
//         <Button size="small" onClick={() => handleViewLedger(record._id)}>
//           Ledger
//         </Button>
//       ),
//       width: 100
//     }
//   ];

//   const journalColumns = [
//     { title: 'Entry #', dataIndex: 'entryNumber', key: 'entryNumber', width: 120 },
//     { title: 'Date', dataIndex: 'date', key: 'date', render: (value) => new Date(value).toLocaleDateString(), width: 120 },
//     { title: 'Description', dataIndex: 'description', key: 'description' },
//     { title: 'Source', dataIndex: 'sourceType', key: 'sourceType', render: (value) => <Tag>{value}</Tag>, width: 170 },
//     { title: 'Debit', dataIndex: 'totalDebit', key: 'totalDebit', width: 130, render: (value) => Number(value || 0).toFixed(2) },
//     { title: 'Credit', dataIndex: 'totalCredit', key: 'totalCredit', width: 130, render: (value) => Number(value || 0).toFixed(2) },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 120,
//       render: (_, record) => (
//         <Button
//           size="small"
//           icon={<RetweetOutlined />}
//           disabled={record.isReversal}
//           onClick={() => openReverseModal(record)}
//         >
//           Reverse
//         </Button>
//       )
//     }
//   ];

//   const ruleColumns = [
//     { title: 'Name', dataIndex: 'name', key: 'name' },
//     { title: 'Document', dataIndex: 'documentType', key: 'documentType', width: 150 },
//     { title: 'Source', dataIndex: 'sourceType', key: 'sourceType', width: 170, render: (value) => value || '-' },
//     { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100 },
//     {
//       title: 'Status',
//       dataIndex: 'isActive',
//       key: 'isActive',
//       width: 100,
//       render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 110,
//       render: (_, record) => (
//         <Button size="small" onClick={() => handleToggleRule(record)}>
//           {record.isActive ? 'Disable' : 'Enable'}
//         </Button>
//       )
//     }
//   ];

//   const periodColumns = [
//     { title: 'Year', dataIndex: 'year', key: 'year', width: 100 },
//     { title: 'Month', dataIndex: 'month', key: 'month', width: 100 },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 120,
//       render: (status) => <Tag color={status === 'open' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
//     },
//     { title: 'Closed At', dataIndex: 'closedAt', key: 'closedAt', render: (value) => value ? new Date(value).toLocaleString() : '-', width: 190 },
//     { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (value) => value || '-' }
//   ];

//   const trialColumns = [
//     { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
//     { title: 'Account', dataIndex: 'name', key: 'name' },
//     { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
//     { title: 'Debit Balance', dataIndex: 'debitBalance', key: 'debitBalance', width: 160, render: (value) => Number(value || 0).toFixed(2) },
//     { title: 'Credit Balance', dataIndex: 'creditBalance', key: 'creditBalance', width: 160, render: (value) => Number(value || 0).toFixed(2) }
//   ];

//   const ledgerColumns = [
//     { title: 'Date', dataIndex: 'date', key: 'date', render: (value) => new Date(value).toLocaleDateString(), width: 120 },
//     { title: 'Entry #', dataIndex: 'entryNumber', key: 'entryNumber', width: 120 },
//     { title: 'Description', dataIndex: 'description', key: 'description' },
//     { title: 'Debit', dataIndex: 'debit', key: 'debit', width: 110, render: (value) => Number(value || 0).toFixed(2) },
//     { title: 'Credit', dataIndex: 'credit', key: 'credit', width: 110, render: (value) => Number(value || 0).toFixed(2) },
//     { title: 'Running', dataIndex: 'runningBalance', key: 'runningBalance', width: 120, render: (value) => Number(value || 0).toFixed(2) }
//   ];

//   return (
//     <div style={{ padding: 24 }}>
//       <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
//         <Col>
//           <Title level={3} style={{ margin: 0 }}>Finance Accounting Center</Title>
//           <Text type="secondary">General ledger operations, posting rules, periods, and controls</Text>
//         </Col>
//         <Col>
//           <Space>
//             <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh</Button>
//             <Button icon={<DatabaseOutlined />} onClick={handleBootstrap} loading={loading}>Bootstrap Defaults</Button>
//           </Space>
//         </Col>
//       </Row>

//       <Row gutter={12} style={{ marginBottom: 16 }}>
//         <Col span={6}><Card size="small" title="Accounts"><Text strong>{totals.accounts}</Text></Card></Col>
//         <Col span={6}><Card size="small" title="Rules"><Text strong>{totals.rules}</Text></Card></Col>
//         <Col span={6}><Card size="small" title="Open Periods"><Text strong>{totals.openPeriods}</Text></Card></Col>
//         <Col span={6}><Card size="small" title="Recent Journals"><Text strong>{totals.journals}</Text></Card></Col>
//       </Row>

//       {!trialBalance?.isBalanced && (
//         <Alert
//           type="warning"
//           showIcon
//           style={{ marginBottom: 16 }}
//           message="Trial balance is currently not balanced"
//         />
//       )}

//       <Tabs
//         items={[
//           {
//             key: 'accounts',
//             label: 'Chart of Accounts',
//             children: (
//               <Card
//                 title="Chart of Accounts"
//                 extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAccountModalOpen(true)}>New Account</Button>}
//               >
//                 <Table
//                   loading={loading}
//                   columns={accountColumns}
//                   dataSource={accounts}
//                   rowKey="_id"
//                   pagination={{ pageSize: 10 }}
//                 />
//               </Card>
//             )
//           },
//           {
//             key: 'journals',
//             label: 'Journal Entries',
//             children: (
//               <Card
//                 title="Journal Entries"
//                 extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setJournalModalOpen(true)}>Manual Journal</Button>}
//               >
//                 <Table
//                   loading={loading}
//                   columns={journalColumns}
//                   dataSource={journalEntries}
//                   rowKey="_id"
//                   expandable={{
//                     expandedRowRender: (record) => (
//                       <Table
//                         size="small"
//                         columns={[
//                           { title: 'Account', dataIndex: ['account', 'code'], key: 'code', render: (_, line) => `${line.account?.code || ''} - ${line.account?.name || ''}` },
//                           { title: 'Description', dataIndex: 'description', key: 'description' },
//                           { title: 'Debit', dataIndex: 'debit', key: 'debit', render: (value) => Number(value || 0).toFixed(2), width: 120 },
//                           { title: 'Credit', dataIndex: 'credit', key: 'credit', render: (value) => Number(value || 0).toFixed(2), width: 120 }
//                         ]}
//                         dataSource={record.lines || []}
//                         pagination={false}
//                         rowKey={(_, idx) => `${record._id}-line-${idx}`}
//                       />
//                     )
//                   }}
//                   pagination={{ pageSize: 10 }}
//                 />
//               </Card>
//             )
//           },
//           {
//             key: 'rules',
//             label: 'Posting Rules',
//             children: (
//               <Card
//                 title="Rule Engine"
//                 extra={<Button type="primary" icon={<SettingOutlined />} onClick={() => setRuleModalOpen(true)}>New Rule</Button>}
//               >
//                 <Table
//                   loading={loading}
//                   columns={ruleColumns}
//                   dataSource={rules}
//                   rowKey="_id"
//                   expandable={{
//                     expandedRowRender: (record) => (
//                       <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(record.lines || [], null, 2)}</pre>
//                     )
//                   }}
//                   pagination={{ pageSize: 10 }}
//                 />
//               </Card>
//             )
//           },
//           {
//             key: 'periods',
//             label: 'Accounting Periods',
//             children: (
//               <Row gutter={16}>
//                 <Col span={10}>
//                   <Card title="Open / Close Period">
//                     <Form
//                       layout="vertical"
//                       onFinish={(values) => handlePeriodStatus(values, values.targetStatus)}
//                       initialValues={{
//                         year: new Date().getFullYear(),
//                         month: new Date().getMonth() + 1,
//                         targetStatus: 'close'
//                       }}
//                     >
//                       <Form.Item name="year" label="Year" rules={[{ required: true }]}>
//                         <InputNumber min={2000} max={3000} style={{ width: '100%' }} />
//                       </Form.Item>
//                       <Form.Item name="month" label="Month" rules={[{ required: true }]}>
//                         <Select options={monthOptions} />
//                       </Form.Item>
//                       <Form.Item name="notes" label="Notes">
//                         <Input placeholder="Optional period note" />
//                       </Form.Item>
//                       <Form.Item name="targetStatus" label="Action" rules={[{ required: true }]}>
//                         <Select options={[{ label: 'Close period', value: 'close' }, { label: 'Open period', value: 'open' }]} />
//                       </Form.Item>
//                       <Button htmlType="submit" type="primary">Apply Status</Button>
//                     </Form>
//                   </Card>
//                 </Col>
//                 <Col span={14}>
//                   <Card title="Period History">
//                     <Table
//                       loading={loading}
//                       columns={periodColumns}
//                       dataSource={periods}
//                       rowKey={(record) => `${record.year}-${record.month}`}
//                       pagination={{ pageSize: 8 }}
//                     />
//                   </Card>
//                 </Col>
//               </Row>
//             )
//           },
//           {
//             key: 'trial-balance',
//             label: 'Trial Balance',
//             children: (
//               <Card title="Trial Balance">
//                 <Table
//                   loading={loading}
//                   columns={trialColumns}
//                   dataSource={trialBalance.lines || []}
//                   rowKey="accountId"
//                   pagination={{ pageSize: 12 }}
//                   summary={() => (
//                     <Table.Summary fixed>
//                       <Table.Summary.Row>
//                         <Table.Summary.Cell index={0} colSpan={3}><Text strong>Totals</Text></Table.Summary.Cell>
//                         <Table.Summary.Cell index={3}><Text strong>{Number(trialBalance?.totals?.debit || 0).toFixed(2)}</Text></Table.Summary.Cell>
//                         <Table.Summary.Cell index={4}><Text strong>{Number(trialBalance?.totals?.credit || 0).toFixed(2)}</Text></Table.Summary.Cell>
//                       </Table.Summary.Row>
//                     </Table.Summary>
//                   )}
//                 />
//                 <div style={{ marginTop: 12 }}>
//                   <Tag icon={<CheckCircleOutlined />} color={trialBalance?.isBalanced ? 'green' : 'red'}>
//                     {trialBalance?.isBalanced ? 'Balanced' : 'Not Balanced'}
//                   </Tag>
//                 </div>
//               </Card>
//             )
//           },
//           {
//             key: 'pl',
//             label: 'Profit & Loss',
//             children: (
//               <Card title="Profit & Loss Statement">
//                 <Space style={{ marginBottom: 16 }}>
//                   <Input
//                     type="date"
//                     value={plDateRange.startDate}
//                     onChange={(e) => setPlDateRange((prev) => ({ ...prev, startDate: e.target.value }))}
//                     style={{ width: 160 }}
//                   />
//                   <Text type="secondary">to</Text>
//                   <Input
//                     type="date"
//                     value={plDateRange.endDate}
//                     onChange={(e) => setPlDateRange((prev) => ({ ...prev, endDate: e.target.value }))}
//                     style={{ width: 160 }}
//                   />
//                   <Button type="primary" onClick={loadFinancialReports} loading={reportsLoading}>
//                     Generate
//                   </Button>
//                 </Space>
 
//                 {plData && (
//                   <>
//                     <Title level={5} style={{ color: '#389e0d' }}>Revenue</Title>
//                     <Table
//                       size="small"
//                       dataSource={plData.revenueLines || []}
//                       rowKey="accountId"
//                       pagination={false}
//                       columns={[
//                         { title: 'Code', dataIndex: 'code', width: 100 },
//                         { title: 'Account', dataIndex: 'name' },
//                         { title: 'Amount', dataIndex: 'balance', width: 160, render: (v) => Number(v || 0).toFixed(2) }
//                       ]}
//                     />
//                     <div style={{ textAlign: 'right', padding: '8px 0', borderTop: '1px solid #f0f0f0', marginBottom: 16 }}>
//                       <Text strong>Total Revenue: {Number(plData.totalRevenue || 0).toFixed(2)}</Text>
//                     </div>
 
//                     <Title level={5} style={{ color: '#cf1322' }}>Expenses</Title>
//                     <Table
//                       size="small"
//                       dataSource={plData.expenseLines || []}
//                       rowKey="accountId"
//                       pagination={false}
//                       columns={[
//                         { title: 'Code', dataIndex: 'code', width: 100 },
//                         { title: 'Account', dataIndex: 'name' },
//                         { title: 'Amount', dataIndex: 'balance', width: 160, render: (v) => Number(Math.abs(v || 0)).toFixed(2) }
//                       ]}
//                     />
//                     <div style={{ textAlign: 'right', padding: '8px 0', borderTop: '1px solid #f0f0f0', marginBottom: 16 }}>
//                       <Text strong>Total Expenses: {Number(plData.totalExpenses || 0).toFixed(2)}</Text>
//                     </div>
 
//                     <div style={{ textAlign: 'right', padding: '12px 16px', background: plData.isProfit ? '#f6ffed' : '#fff1f0', borderRadius: 6 }}>
//                       <Text strong style={{ fontSize: 16, color: plData.isProfit ? '#389e0d' : '#cf1322' }}>
//                         {plData.isProfit ? 'Net Profit' : 'Net Loss'}: {Number(Math.abs(plData.netProfit || 0)).toFixed(2)}
//                       </Text>
//                     </div>
//                   </>
//                 )}
//               </Card>
//             )
//           },
//           {
//             key: 'bs',
//             label: 'Balance Sheet',
//             children: (
//               <Card title="Balance Sheet">
//                 <Space style={{ marginBottom: 16 }}>
//                   <Text>As of:</Text>
//                   <Input
//                     type="date"
//                     value={bsAsOfDate}
//                     onChange={(e) => setBsAsOfDate(e.target.value)}
//                     style={{ width: 160 }}
//                   />
//                   <Button type="primary" onClick={loadFinancialReports} loading={reportsLoading}>
//                     Generate
//                   </Button>
//                 </Space>
 
//                 {bsData && (
//                   <Row gutter={24}>
//                     <Col span={12}>
//                       <Title level={5}>Assets</Title>
//                       <Table
//                         size="small"
//                         dataSource={bsData.assetLines || []}
//                         rowKey="accountId"
//                         pagination={false}
//                         columns={[
//                           { title: 'Code', dataIndex: 'code', width: 80 },
//                           { title: 'Account', dataIndex: 'name' },
//                           { title: 'Balance', dataIndex: 'balance', width: 130, render: (v) => Number(v || 0).toFixed(2) }
//                         ]}
//                       />
//                       <div style={{ textAlign: 'right', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
//                         <Text strong>Total Assets: {Number(bsData.totalAssets || 0).toFixed(2)}</Text>
//                       </div>
//                     </Col>
 
//                     <Col span={12}>
//                       <Title level={5}>Liabilities</Title>
//                       <Table
//                         size="small"
//                         dataSource={bsData.liabilityLines || []}
//                         rowKey="accountId"
//                         pagination={false}
//                         columns={[
//                           { title: 'Code', dataIndex: 'code', width: 80 },
//                           { title: 'Account', dataIndex: 'name' },
//                           { title: 'Balance', dataIndex: 'balance', width: 130, render: (v) => Number(v || 0).toFixed(2) }
//                         ]}
//                       />
//                       <div style={{ textAlign: 'right', padding: '8px 0', borderTop: '1px solid #f0f0f0', marginBottom: 16 }}>
//                         <Text strong>Total Liabilities: {Number(bsData.totalLiabilities || 0).toFixed(2)}</Text>
//                       </div>
 
//                       <Title level={5}>Equity</Title>
//                       <Table
//                         size="small"
//                         dataSource={bsData.equityLines || []}
//                         rowKey="accountId"
//                         pagination={false}
//                         columns={[
//                           { title: 'Code', dataIndex: 'code', width: 80 },
//                           { title: 'Account', dataIndex: 'name' },
//                           { title: 'Balance', dataIndex: 'balance', width: 130, render: (v) => Number(v || 0).toFixed(2) }
//                         ]}
//                       />
//                       <div style={{ textAlign: 'right', padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
//                         <Text strong>Total Equity: {Number(bsData.totalEquity || 0).toFixed(2)}</Text>
//                       </div>
 
//                       <div style={{ marginTop: 12, padding: '12px 16px', background: bsData.isBalanced ? '#f6ffed' : '#fff1f0', borderRadius: 6 }}>
//                         <Text strong>Total Liab + Equity: {Number(bsData.totalLiabEquity || 0).toFixed(2)}</Text>
//                         <Tag color={bsData.isBalanced ? 'green' : 'red'} style={{ marginLeft: 8 }}>
//                           {bsData.isBalanced ? 'Balanced' : 'Not Balanced'}
//                         </Tag>
//                       </div>
//                     </Col>
//                   </Row>
//                 )}
//               </Card>
//             )
//           }
//         ]}
//       />

//       <Modal
//         open={accountModalOpen}
//         title="Create Account"
//         onCancel={() => setAccountModalOpen(false)}
//         footer={null}
//       >
//         <Form form={accountForm} layout="vertical" onFinish={handleCreateAccount}>
//           <Form.Item name="code" label="Account Code" rules={[{ required: true }]}><Input /></Form.Item>
//           <Form.Item name="name" label="Account Name" rules={[{ required: true }]}><Input /></Form.Item>
//           <Form.Item name="type" label="Type" rules={[{ required: true }]}>
//             <Select options={[
//               { value: 'asset', label: 'Asset' },
//               { value: 'liability', label: 'Liability' },
//               { value: 'equity', label: 'Equity' },
//               { value: 'revenue', label: 'Revenue' },
//               { value: 'expense', label: 'Expense' }
//             ]} />
//           </Form.Item>
//           <Form.Item name="normalBalance" label="Normal Balance" rules={[{ required: true }]}>
//             <Select options={[{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }]} />
//           </Form.Item>
//           <Form.Item name="description" label="Description"><TextArea rows={3} /></Form.Item>
//           <Button type="primary" htmlType="submit" block>Create Account</Button>
//         </Form>
//       </Modal>

//       <Modal
//         open={journalModalOpen}
//         title="Post Manual Journal"
//         onCancel={() => setJournalModalOpen(false)}
//         footer={null}
//       >
//         <Form
//           form={journalForm}
//           layout="vertical"
//           onFinish={handleCreateJournal}
//           initialValues={{ date: new Date().toISOString().slice(0, 10), linesJson: defaultJournalLines }}
//         >
//           <Form.Item name="date" label="Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
//           <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input /></Form.Item>
//           <Form.Item
//             name="linesJson"
//             label="Lines JSON"
//             rules={[
//               { required: true },
//               {
//                 validator: (_, value) => {
//                   try {
//                     const parsed = JSON.parse(value || '[]');
//                     if (!Array.isArray(parsed) || parsed.length < 2) throw new Error();
//                     return Promise.resolve();
//                   } catch (error) {
//                     return Promise.reject(new Error('Enter valid JSON with at least 2 lines'));
//                   }
//                 }
//               }
//             ]}
//           >
//             <TextArea rows={10} />
//           </Form.Item>
//           <div style={{ marginBottom: 12 }}>
//             <Text type="secondary">Use account IDs from Chart of Accounts for each line's account field.</Text>
//           </div>
//           <Button type="primary" htmlType="submit" block>Post Journal</Button>
//         </Form>
//       </Modal>

//       <Modal
//         open={ruleModalOpen}
//         title="Create Accounting Rule"
//         onCancel={() => setRuleModalOpen(false)}
//         footer={null}
//       >
//         <Form
//           form={ruleForm}
//           layout="vertical"
//           onFinish={handleCreateRule}
//           initialValues={{
//             documentType: 'customer_invoice',
//             priority: 100,
//             isActive: true,
//             linesJson: defaultRuleLines
//           }}
//         >
//           <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}><Input /></Form.Item>
//           <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
//             <Select options={[
//               { value: 'cash_request', label: 'cash_request' },
//               { value: 'supplier_invoice', label: 'supplier_invoice' },
//               { value: 'customer_invoice', label: 'customer_invoice' },
//               { value: 'salary_payment', label: 'salary_payment' }
//             ]} />
//           </Form.Item>
//           <Form.Item name="sourceType" label="Source Type"><Input placeholder="Optional exact source type" /></Form.Item>
//           <Form.Item name="description" label="Description"><Input /></Form.Item>
//           <Form.Item name="priority" label="Priority" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
//           <Form.Item name="isActive" label="Active" rules={[{ required: true }]}>
//             <Select options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} />
//           </Form.Item>
//           <Form.Item
//             name="linesJson"
//             label="Rule Lines JSON"
//             rules={[
//               { required: true },
//               {
//                 validator: (_, value) => {
//                   try {
//                     const parsed = JSON.parse(value || '[]');
//                     if (!Array.isArray(parsed) || parsed.length < 2) throw new Error();
//                     return Promise.resolve();
//                   } catch (error) {
//                     return Promise.reject(new Error('Enter valid JSON for rule lines'));
//                   }
//                 }
//               }
//             ]}
//           >
//             <TextArea rows={10} />
//           </Form.Item>
//           <Button type="primary" htmlType="submit" block>Create Rule</Button>
//         </Form>
//       </Modal>

//       <Modal
//         open={reverseModalOpen}
//         title={`Reverse Journal ${selectedEntry?.entryNumber || ''}`}
//         onCancel={() => setReverseModalOpen(false)}
//         footer={null}
//       >
//         <Form form={reverseForm} layout="vertical" onFinish={handleReverseEntry}>
//           <Form.Item name="reversalDate" label="Reversal Date" rules={[{ required: true }]}>
//             <Input type="date" />
//           </Form.Item>
//           <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
//             <TextArea rows={4} />
//           </Form.Item>
//           <Popconfirm
//             title="Post reversal"
//             description="This will create a new opposite entry."
//             onConfirm={() => reverseForm.submit()}
//           >
//             <Button type="primary" danger block icon={<RetweetOutlined />}>Post Reversal</Button>
//           </Popconfirm>
//         </Form>
//       </Modal>

//       <Drawer
//         title={ledgerData ? `${ledgerData.account?.code} - ${ledgerData.account?.name}` : 'General Ledger'}
//         open={ledgerOpen}
//         onClose={() => setLedgerOpen(false)}
//         width={860}
//       >
//         {ledgerLoading ? (
//           <Text>Loading ledger...</Text>
//         ) : (
//           <>
//             <Space style={{ marginBottom: 12 }}>
//               <Tag>Opening: {Number(ledgerData?.openingBalance || 0).toFixed(2)}</Tag>
//               <Tag color="blue">Closing: {Number(ledgerData?.closingBalance || 0).toFixed(2)}</Tag>
//             </Space>
//             <Table
//               columns={ledgerColumns}
//               dataSource={ledgerData?.transactions || []}
//               rowKey={(_, idx) => `ledger-${idx}`}
//               pagination={{ pageSize: 12 }}
//               scroll={{ x: 900 }}
//             />
//           </>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default FinanceAccountingCenter;
