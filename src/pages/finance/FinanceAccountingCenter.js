import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import {
  CheckCircleOutlined,
  DatabaseOutlined,
  PlusOutlined,
  ReloadOutlined,
  RetweetOutlined,
  SettingOutlined
} from '@ant-design/icons';
import { accountingAPI } from '../../services/api';

const { Title, Text } = Typography;
const { TextArea } = Input;

const defaultJournalLines = JSON.stringify(
  [
    { account: '', description: 'Debit line', debit: 0, credit: 0 },
    { account: '', description: 'Credit line', debit: 0, credit: 0 }
  ],
  null,
  2
);

const defaultRuleLines = JSON.stringify(
  [
    { side: 'debit', accountCode: '1000', amountSource: 'gross', description: 'Main debit' },
    { side: 'credit', accountCode: '4000', amountSource: 'gross', description: 'Main credit' }
  ],
  null,
  2
);

const FinanceAccountingCenter = () => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [rules, setRules] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [trialBalance, setTrialBalance] = useState({ lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });
  const [ledgerData, setLedgerData] = useState(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerOpen, setLedgerOpen] = useState(false);

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [journalModalOpen, setJournalModalOpen] = useState(false);
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [reverseModalOpen, setReverseModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const [accountForm] = Form.useForm();
  const [journalForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [reverseForm] = Form.useForm();

  const monthOptions = [
    { label: 'Jan', value: 1 }, { label: 'Feb', value: 2 }, { label: 'Mar', value: 3 },
    { label: 'Apr', value: 4 }, { label: 'May', value: 5 }, { label: 'Jun', value: 6 },
    { label: 'Jul', value: 7 }, { label: 'Aug', value: 8 }, { label: 'Sep', value: 9 },
    { label: 'Oct', value: 10 }, { label: 'Nov', value: 11 }, { label: 'Dec', value: 12 }
  ];

  const totals = useMemo(() => ({
    accounts: accounts.length,
    rules: rules.length,
    openPeriods: periods.filter((period) => period.status === 'open').length,
    journals: journalEntries.length
  }), [accounts, rules, periods, journalEntries]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, rulesRes, periodsRes, journalsRes, trialRes] = await Promise.all([
        accountingAPI.getAccounts(),
        accountingAPI.getRules(),
        accountingAPI.getPeriods(),
        accountingAPI.getJournalEntries({ page: 1, limit: 50 }),
        accountingAPI.getTrialBalance()
      ]);

      setAccounts(accountsRes.data || []);
      setRules(rulesRes.data || []);
      setPeriods(periodsRes.data || []);
      setJournalEntries(journalsRes.data || []);
      setTrialBalance(trialRes.data || { lines: [], totals: { debit: 0, credit: 0 }, isBalanced: true });
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load accounting data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBootstrap = async () => {
    try {
      setLoading(true);
      await Promise.all([
        accountingAPI.bootstrapDefaultChart(),
        accountingAPI.bootstrapDefaultRules()
      ]);
      message.success('Default chart and rules bootstrapped');
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Bootstrap failed');
      setLoading(false);
    }
  };

  const handleCreateAccount = async (values) => {
    try {
      await accountingAPI.createAccount(values);
      message.success('Account created');
      setAccountModalOpen(false);
      accountForm.resetFields();
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create account');
    }
  };

  const handleCreateJournal = async (values) => {
    try {
      const parsedLines = JSON.parse(values.linesJson);
      await accountingAPI.createJournalEntry({
        date: values.date,
        description: values.description,
        lines: parsedLines
      });
      message.success('Journal entry posted');
      setJournalModalOpen(false);
      journalForm.resetFields();
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create journal entry');
    }
  };

  const handleCreateRule = async (values) => {
    try {
      const parsedLines = JSON.parse(values.linesJson);
      await accountingAPI.createRule({
        name: values.name,
        documentType: values.documentType,
        sourceType: values.sourceType || '',
        description: values.description || '',
        priority: values.priority,
        isActive: values.isActive,
        lines: parsedLines
      });
      message.success('Accounting rule created');
      setRuleModalOpen(false);
      ruleForm.resetFields();
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to create accounting rule');
    }
  };

  const handleToggleRule = async (rule) => {
    try {
      await accountingAPI.updateRule(rule._id, {
        ...rule,
        isActive: !rule.isActive
      });
      message.success(`Rule ${!rule.isActive ? 'enabled' : 'disabled'}`);
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to update rule');
    }
  };

  const handlePeriodStatus = async (values, status) => {
    try {
      if (status === 'open') {
        await accountingAPI.openPeriod(values);
      } else {
        await accountingAPI.closePeriod(values);
      }
      message.success(`Period ${status}ed successfully`);
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || `Failed to ${status} period`);
    }
  };

  const openReverseModal = (entry) => {
    setSelectedEntry(entry);
    reverseForm.setFieldsValue({
      reversalDate: new Date().toISOString().slice(0, 10),
      reason: `Reverse ${entry.entryNumber}`
    });
    setReverseModalOpen(true);
  };

  const handleReverseEntry = async (values) => {
    try {
      if (!selectedEntry?._id) return;
      await accountingAPI.reverseJournalEntry(selectedEntry._id, values);
      message.success('Reversal posted successfully');
      setReverseModalOpen(false);
      setSelectedEntry(null);
      reverseForm.resetFields();
      await loadData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to reverse journal entry');
    }
  };

  const handleViewLedger = async (accountId) => {
    try {
      setLedgerLoading(true);
      const response = await accountingAPI.getGeneralLedger(accountId);
      setLedgerData(response.data || null);
      setLedgerOpen(true);
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to load general ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const accountColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 100 },
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (value) => <Tag>{value}</Tag>, width: 120 },
    { title: 'Normal', dataIndex: 'normalBalance', key: 'normalBalance', width: 120 },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive) => <Tag color={isActive ? 'green' : 'default'}>{isActive ? 'Active' : 'Inactive'}</Tag>,
      width: 120
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button size="small" onClick={() => handleViewLedger(record._id)}>
          Ledger
        </Button>
      ),
      width: 100
    }
  ];

  const journalColumns = [
    { title: 'Entry #', dataIndex: 'entryNumber', key: 'entryNumber', width: 120 },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (value) => new Date(value).toLocaleDateString(), width: 120 },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Source', dataIndex: 'sourceType', key: 'sourceType', render: (value) => <Tag>{value}</Tag>, width: 170 },
    { title: 'Debit', dataIndex: 'totalDebit', key: 'totalDebit', width: 130, render: (value) => Number(value || 0).toFixed(2) },
    { title: 'Credit', dataIndex: 'totalCredit', key: 'totalCredit', width: 130, render: (value) => Number(value || 0).toFixed(2) },
    {
      title: 'Action',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<RetweetOutlined />}
          disabled={record.isReversal}
          onClick={() => openReverseModal(record)}
        >
          Reverse
        </Button>
      )
    }
  ];

  const ruleColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Document', dataIndex: 'documentType', key: 'documentType', width: 150 },
    { title: 'Source', dataIndex: 'sourceType', key: 'sourceType', width: 170, render: (value) => value || '-' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100 },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive) => <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
    },
    {
      title: 'Action',
      key: 'action',
      width: 110,
      render: (_, record) => (
        <Button size="small" onClick={() => handleToggleRule(record)}>
          {record.isActive ? 'Disable' : 'Enable'}
        </Button>
      )
    }
  ];

  const periodColumns = [
    { title: 'Year', dataIndex: 'year', key: 'year', width: 100 },
    { title: 'Month', dataIndex: 'month', key: 'month', width: 100 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => <Tag color={status === 'open' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>
    },
    { title: 'Closed At', dataIndex: 'closedAt', key: 'closedAt', render: (value) => value ? new Date(value).toLocaleString() : '-', width: 190 },
    { title: 'Notes', dataIndex: 'notes', key: 'notes', render: (value) => value || '-' }
  ];

  const trialColumns = [
    { title: 'Code', dataIndex: 'code', key: 'code', width: 110 },
    { title: 'Account', dataIndex: 'name', key: 'name' },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'Debit Balance', dataIndex: 'debitBalance', key: 'debitBalance', width: 160, render: (value) => Number(value || 0).toFixed(2) },
    { title: 'Credit Balance', dataIndex: 'creditBalance', key: 'creditBalance', width: 160, render: (value) => Number(value || 0).toFixed(2) }
  ];

  const ledgerColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', render: (value) => new Date(value).toLocaleDateString(), width: 120 },
    { title: 'Entry #', dataIndex: 'entryNumber', key: 'entryNumber', width: 120 },
    { title: 'Description', dataIndex: 'description', key: 'description' },
    { title: 'Debit', dataIndex: 'debit', key: 'debit', width: 110, render: (value) => Number(value || 0).toFixed(2) },
    { title: 'Credit', dataIndex: 'credit', key: 'credit', width: 110, render: (value) => Number(value || 0).toFixed(2) },
    { title: 'Running', dataIndex: 'runningBalance', key: 'runningBalance', width: 120, render: (value) => Number(value || 0).toFixed(2) }
  ];

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3} style={{ margin: 0 }}>Finance Accounting Center</Title>
          <Text type="secondary">General ledger operations, posting rules, periods, and controls</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>Refresh</Button>
            <Button icon={<DatabaseOutlined />} onClick={handleBootstrap} loading={loading}>Bootstrap Defaults</Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small" title="Accounts"><Text strong>{totals.accounts}</Text></Card></Col>
        <Col span={6}><Card size="small" title="Rules"><Text strong>{totals.rules}</Text></Card></Col>
        <Col span={6}><Card size="small" title="Open Periods"><Text strong>{totals.openPeriods}</Text></Card></Col>
        <Col span={6}><Card size="small" title="Recent Journals"><Text strong>{totals.journals}</Text></Card></Col>
      </Row>

      {!trialBalance?.isBalanced && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message="Trial balance is currently not balanced"
        />
      )}

      <Tabs
        items={[
          {
            key: 'accounts',
            label: 'Chart of Accounts',
            children: (
              <Card
                title="Chart of Accounts"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAccountModalOpen(true)}>New Account</Button>}
              >
                <Table
                  loading={loading}
                  columns={accountColumns}
                  dataSource={accounts}
                  rowKey="_id"
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'journals',
            label: 'Journal Entries',
            children: (
              <Card
                title="Journal Entries"
                extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setJournalModalOpen(true)}>Manual Journal</Button>}
              >
                <Table
                  loading={loading}
                  columns={journalColumns}
                  dataSource={journalEntries}
                  rowKey="_id"
                  expandable={{
                    expandedRowRender: (record) => (
                      <Table
                        size="small"
                        columns={[
                          { title: 'Account', dataIndex: ['account', 'code'], key: 'code', render: (_, line) => `${line.account?.code || ''} - ${line.account?.name || ''}` },
                          { title: 'Description', dataIndex: 'description', key: 'description' },
                          { title: 'Debit', dataIndex: 'debit', key: 'debit', render: (value) => Number(value || 0).toFixed(2), width: 120 },
                          { title: 'Credit', dataIndex: 'credit', key: 'credit', render: (value) => Number(value || 0).toFixed(2), width: 120 }
                        ]}
                        dataSource={record.lines || []}
                        pagination={false}
                        rowKey={(_, idx) => `${record._id}-line-${idx}`}
                      />
                    )
                  }}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'rules',
            label: 'Posting Rules',
            children: (
              <Card
                title="Rule Engine"
                extra={<Button type="primary" icon={<SettingOutlined />} onClick={() => setRuleModalOpen(true)}>New Rule</Button>}
              >
                <Table
                  loading={loading}
                  columns={ruleColumns}
                  dataSource={rules}
                  rowKey="_id"
                  expandable={{
                    expandedRowRender: (record) => (
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(record.lines || [], null, 2)}</pre>
                    )
                  }}
                  pagination={{ pageSize: 10 }}
                />
              </Card>
            )
          },
          {
            key: 'periods',
            label: 'Accounting Periods',
            children: (
              <Row gutter={16}>
                <Col span={10}>
                  <Card title="Open / Close Period">
                    <Form
                      layout="vertical"
                      onFinish={(values) => handlePeriodStatus(values, values.targetStatus)}
                      initialValues={{
                        year: new Date().getFullYear(),
                        month: new Date().getMonth() + 1,
                        targetStatus: 'close'
                      }}
                    >
                      <Form.Item name="year" label="Year" rules={[{ required: true }]}>
                        <InputNumber min={2000} max={3000} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item name="month" label="Month" rules={[{ required: true }]}>
                        <Select options={monthOptions} />
                      </Form.Item>
                      <Form.Item name="notes" label="Notes">
                        <Input placeholder="Optional period note" />
                      </Form.Item>
                      <Form.Item name="targetStatus" label="Action" rules={[{ required: true }]}>
                        <Select options={[{ label: 'Close period', value: 'close' }, { label: 'Open period', value: 'open' }]} />
                      </Form.Item>
                      <Button htmlType="submit" type="primary">Apply Status</Button>
                    </Form>
                  </Card>
                </Col>
                <Col span={14}>
                  <Card title="Period History">
                    <Table
                      loading={loading}
                      columns={periodColumns}
                      dataSource={periods}
                      rowKey={(record) => `${record.year}-${record.month}`}
                      pagination={{ pageSize: 8 }}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'trial-balance',
            label: 'Trial Balance',
            children: (
              <Card title="Trial Balance">
                <Table
                  loading={loading}
                  columns={trialColumns}
                  dataSource={trialBalance.lines || []}
                  rowKey="accountId"
                  pagination={{ pageSize: 12 }}
                  summary={() => (
                    <Table.Summary fixed>
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>Totals</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3}><Text strong>{Number(trialBalance?.totals?.debit || 0).toFixed(2)}</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={4}><Text strong>{Number(trialBalance?.totals?.credit || 0).toFixed(2)}</Text></Table.Summary.Cell>
                      </Table.Summary.Row>
                    </Table.Summary>
                  )}
                />
                <div style={{ marginTop: 12 }}>
                  <Tag icon={<CheckCircleOutlined />} color={trialBalance?.isBalanced ? 'green' : 'red'}>
                    {trialBalance?.isBalanced ? 'Balanced' : 'Not Balanced'}
                  </Tag>
                </div>
              </Card>
            )
          }
        ]}
      />

      <Modal
        open={accountModalOpen}
        title="Create Account"
        onCancel={() => setAccountModalOpen(false)}
        footer={null}
      >
        <Form form={accountForm} layout="vertical" onFinish={handleCreateAccount}>
          <Form.Item name="code" label="Account Code" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label="Account Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'asset', label: 'Asset' },
              { value: 'liability', label: 'Liability' },
              { value: 'equity', label: 'Equity' },
              { value: 'revenue', label: 'Revenue' },
              { value: 'expense', label: 'Expense' }
            ]} />
          </Form.Item>
          <Form.Item name="normalBalance" label="Normal Balance" rules={[{ required: true }]}>
            <Select options={[{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }]} />
          </Form.Item>
          <Form.Item name="description" label="Description"><TextArea rows={3} /></Form.Item>
          <Button type="primary" htmlType="submit" block>Create Account</Button>
        </Form>
      </Modal>

      <Modal
        open={journalModalOpen}
        title="Post Manual Journal"
        onCancel={() => setJournalModalOpen(false)}
        footer={null}
      >
        <Form
          form={journalForm}
          layout="vertical"
          onFinish={handleCreateJournal}
          initialValues={{ date: new Date().toISOString().slice(0, 10), linesJson: defaultJournalLines }}
        >
          <Form.Item name="date" label="Date" rules={[{ required: true }]}><Input type="date" /></Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item
            name="linesJson"
            label="Lines JSON"
            rules={[
              { required: true },
              {
                validator: (_, value) => {
                  try {
                    const parsed = JSON.parse(value || '[]');
                    if (!Array.isArray(parsed) || parsed.length < 2) throw new Error();
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(new Error('Enter valid JSON with at least 2 lines'));
                  }
                }
              }
            ]}
          >
            <TextArea rows={10} />
          </Form.Item>
          <div style={{ marginBottom: 12 }}>
            <Text type="secondary">Use account IDs from Chart of Accounts for each line's account field.</Text>
          </div>
          <Button type="primary" htmlType="submit" block>Post Journal</Button>
        </Form>
      </Modal>

      <Modal
        open={ruleModalOpen}
        title="Create Accounting Rule"
        onCancel={() => setRuleModalOpen(false)}
        footer={null}
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={handleCreateRule}
          initialValues={{
            documentType: 'customer_invoice',
            priority: 100,
            isActive: true,
            linesJson: defaultRuleLines
          }}
        >
          <Form.Item name="name" label="Rule Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
            <Select options={[
              { value: 'cash_request', label: 'cash_request' },
              { value: 'supplier_invoice', label: 'supplier_invoice' },
              { value: 'customer_invoice', label: 'customer_invoice' },
              { value: 'salary_payment', label: 'salary_payment' }
            ]} />
          </Form.Item>
          <Form.Item name="sourceType" label="Source Type"><Input placeholder="Optional exact source type" /></Form.Item>
          <Form.Item name="description" label="Description"><Input /></Form.Item>
          <Form.Item name="priority" label="Priority" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="isActive" label="Active" rules={[{ required: true }]}>
            <Select options={[{ value: true, label: 'Yes' }, { value: false, label: 'No' }]} />
          </Form.Item>
          <Form.Item
            name="linesJson"
            label="Rule Lines JSON"
            rules={[
              { required: true },
              {
                validator: (_, value) => {
                  try {
                    const parsed = JSON.parse(value || '[]');
                    if (!Array.isArray(parsed) || parsed.length < 2) throw new Error();
                    return Promise.resolve();
                  } catch (error) {
                    return Promise.reject(new Error('Enter valid JSON for rule lines'));
                  }
                }
              }
            ]}
          >
            <TextArea rows={10} />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>Create Rule</Button>
        </Form>
      </Modal>

      <Modal
        open={reverseModalOpen}
        title={`Reverse Journal ${selectedEntry?.entryNumber || ''}`}
        onCancel={() => setReverseModalOpen(false)}
        footer={null}
      >
        <Form form={reverseForm} layout="vertical" onFinish={handleReverseEntry}>
          <Form.Item name="reversalDate" label="Reversal Date" rules={[{ required: true }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
            <TextArea rows={4} />
          </Form.Item>
          <Popconfirm
            title="Post reversal"
            description="This will create a new opposite entry."
            onConfirm={() => reverseForm.submit()}
          >
            <Button type="primary" danger block icon={<RetweetOutlined />}>Post Reversal</Button>
          </Popconfirm>
        </Form>
      </Modal>

      <Drawer
        title={ledgerData ? `${ledgerData.account?.code} - ${ledgerData.account?.name}` : 'General Ledger'}
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        width={860}
      >
        {ledgerLoading ? (
          <Text>Loading ledger...</Text>
        ) : (
          <>
            <Space style={{ marginBottom: 12 }}>
              <Tag>Opening: {Number(ledgerData?.openingBalance || 0).toFixed(2)}</Tag>
              <Tag color="blue">Closing: {Number(ledgerData?.closingBalance || 0).toFixed(2)}</Tag>
            </Space>
            <Table
              columns={ledgerColumns}
              dataSource={ledgerData?.transactions || []}
              rowKey={(_, idx) => `ledger-${idx}`}
              pagination={{ pageSize: 12 }}
              scroll={{ x: 900 }}
            />
          </>
        )}
      </Drawer>
    </div>
  );
};

export default FinanceAccountingCenter;
