// BuyerTenderManagement.jsx  — complete drop-in replacement
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
  Modal, Form, Input, Select, DatePicker, Divider, Alert, message,
  Tooltip, Descriptions, Drawer, Spin, InputNumber, Popconfirm,
  notification, Badge, Tabs, Empty, Steps
} from 'antd';
import {
  FileTextOutlined, PlusOutlined, EditOutlined, EyeOutlined,
  DeleteOutlined, PrinterOutlined, CheckCircleOutlined,
  ReloadOutlined, SendOutlined, FileDoneOutlined, DollarOutlined,
  TeamOutlined, MinusCircleOutlined, SearchOutlined, TrophyOutlined,
  WarningOutlined, DownloadOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import tenderAPI, { generateTenderHTML } from '../../services/tenderAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// ─────────────────────────────────────────────
// Status config
// ─────────────────────────────────────────────
const STATUS_CFG = {
  draft:            { color: 'default', text: 'Draft',            icon: <EditOutlined /> },
  pending_approval: { color: 'orange',  text: 'Pending Approval', icon: <SendOutlined /> },
  approved:         { color: 'green',   text: 'Approved',         icon: <CheckCircleOutlined /> },
  rejected:         { color: 'red',     text: 'Rejected',         icon: <WarningOutlined /> },
  awarded:          { color: 'gold',    text: 'Awarded',          icon: <TrophyOutlined /> }
};

const StatusTag = ({ status }) => {
  const c = STATUS_CFG[status] || { color: 'default', text: status };
  return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
};

const EMPTY_ITEM = () => ({ description:'', quantity:1, unitPrice:0, totalAmount:0, negotiatedTotal:0 });
const EMPTY_SQ   = () => ({
  supplierName:'', supplierEmail:'',
  items:[EMPTY_ITEM()],
  grandTotal:0, negotiatedGrandTotal:0,
  deliveryTerms:'', paymentTerms:'', warranty:'', notes:''
});

const recalc = (sq) => {
  const g = (sq.items||[]).reduce((s,i) => s+(Number(i.totalAmount)||0), 0);
  const n = (sq.items||[]).reduce((s,i) => s+(Number(i.negotiatedTotal)||0), 0);
  return { ...sq, grandTotal:g, negotiatedGrandTotal:n };
};

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
const BuyerTenderManagement = () => {
  const [tenders,        setTenders]        = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [pdfLoading,     setPdfLoading]     = useState(false);
  const [activeTab,      setActiveTab]      = useState('all');

  const [detailOpen,     setDetailOpen]     = useState(false);
  const [manualOpen,     setManualOpen]     = useState(false);
  const [rfqOpen,        setRfqOpen]        = useState(false);
  const [approveOpen,    setApproveOpen]    = useState(false);

  const [selectedTender, setSelectedTender] = useState(null);
  const [availableRFQs,  setAvailableRFQs]  = useState([]);
  const [selectedRFQ,    setSelectedRFQ]    = useState(null);
  const [rfqLoading,     setRfqLoading]     = useState(false);
  const [approveTarget,  setApproveTarget]  = useState(null);

  const [supplierQuotes, setSupplierQuotes] = useState([EMPTY_SQ()]);
  const [manualForm]  = Form.useForm();
  const [rfqForm]     = Form.useForm();
  const [approveForm] = Form.useForm();

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadTenders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tenderAPI.getTenders();
      if (res.success) setTenders(res.data || []);
      else message.error(res.message || 'Failed to load tenders');
    } catch { message.error('Error loading tenders'); }
    finally { setLoading(false); }
  }, []);

  const loadRFQs = useCallback(async () => {
    setRfqLoading(true);
    try {
      const res = await tenderAPI.getAvailableRFQsForTender();
      if (res.success) setAvailableRFQs(res.data || []);
    } catch { message.warning('Could not load RFQs'); }
    finally { setRfqLoading(false); }
  }, []);

  useEffect(() => { loadTenders(); }, [loadTenders]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const filtered = activeTab === 'all' ? tenders : tenders.filter(t => t.status === activeTab);
  const stats    = {
    total:    tenders.length,
    draft:    tenders.filter(t => t.status === 'draft').length,
    pending:  tenders.filter(t => t.status === 'pending_approval').length,
    approved: tenders.filter(t => t.status === 'approved').length,
    awarded:  tenders.filter(t => t.status === 'awarded').length
  };

  // ── View ──────────────────────────────────────────────────────────────────
  const handleView = async (tender) => {
    setLoading(true);
    try {
      const res = await tenderAPI.getTenderById(tender._id);
      if (res.success) { setSelectedTender(res.data); setDetailOpen(true); }
      else message.error('Failed to load tender details');
    } catch { message.error('Error loading tender'); }
    finally { setLoading(false); }
  };

  // ── Print (client-side HTML) ──────────────────────────────────────────────
  const handlePrint = (tender) => {
    const html = generateTenderHTML(tender);
    const win  = window.open('', '_blank');
    if (!win) { message.error('Popup blocked — allow popups and retry'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
  };

  // ── Download PDF (server-side — includes real signatures) ─────────────────
  const handleDownloadPDF = async (tender) => {
    setPdfLoading(true);
    try {
      await tenderAPI.downloadPDF(tender);
      message.success(`PDF downloaded for ${tender.tenderNumber}`);
    } catch (e) {
      message.error(e.message || 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  // ── Status change ─────────────────────────────────────────────────────────
  const handleStatusChange = async (id, status, num, dept) => {
    try {
      const res = await tenderAPI.updateStatus(id, status, dept);
      if (res.success) {
        message.success(`Tender ${num} → ${STATUS_CFG[status]?.text || status}`);
        if (status === 'pending_approval') {
          notification.info({
            message: 'Approval Chain Created',
            description: 'Approval notifications have been sent to the Level 1 approver.',
            duration: 5
          });
        }
        loadTenders();
        if (selectedTender?._id === id) setSelectedTender(prev => ({ ...prev, status }));
      } else {
        message.error(res.message || 'Failed to update status');
      }
    } catch { message.error('Error updating status'); }
  };

  // ── Individual approval ───────────────────────────────────────────────────
  const openApproveModal = (tender) => {
    setApproveTarget(tender);
    approveForm.resetFields();
    setApproveOpen(true);
  };

  const handleProcessApproval = async () => {
    try {
      const values = await approveForm.validateFields();
      setLoading(true);
      const res = await tenderAPI.processApproval(approveTarget._id, values.decision, values.comments || '');
      if (res.success) {
        message.success(res.message || `Tender ${values.decision}`);
        setApproveOpen(false);
        approveForm.resetFields();
        setApproveTarget(null);
        loadTenders();
      } else {
        message.error(res.message || 'Failed to process approval');
      }
    } catch (e) {
      if (e?.errorFields) message.error('Please fill all required fields');
      else message.error('Error processing approval');
    } finally {
      setLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id, num) => {
    try {
      const res = await tenderAPI.deleteTender(id);
      if (res.success) { message.success(`Tender ${num} deleted`); loadTenders(); }
      else message.error(res.message || 'Failed to delete');
    } catch { message.error('Error deleting tender'); }
  };

  // ── Supplier quote helpers ─────────────────────────────────────────────────
  const addSupplier    = () => setSupplierQuotes(p => [...p, EMPTY_SQ()]);
  const removeSupplier = (i) => {
    if (supplierQuotes.length <= 1) { message.warning('At least one supplier required'); return; }
    setSupplierQuotes(p => p.filter((_, idx) => idx !== i));
  };

  const setSQField = (sqI, f, v) =>
    setSupplierQuotes(p => { const n=[...p]; n[sqI]=recalc({...n[sqI],[f]:v}); return n; });

  const setItemField = (sqI, itI, f, v) =>
    setSupplierQuotes(p => {
      const n = [...p];
      const items = [...(n[sqI].items||[])];
      items[itI] = { ...items[itI], [f]:v };
      if (f==='quantity'||f==='unitPrice') {
        items[itI].totalAmount = (Number(items[itI].quantity)||0)*(Number(items[itI].unitPrice)||0);
        if (!items[itI]._negTouched) items[itI].negotiatedTotal = items[itI].totalAmount;
      }
      if (f==='negotiatedTotal') items[itI]._negTouched = true;
      n[sqI] = recalc({ ...n[sqI], items });
      return n;
    });

  const addItem    = (i) =>
    setSupplierQuotes(p => { const n=[...p]; n[i]={...n[i],items:[...(n[i].items||[]),EMPTY_ITEM()]}; return n; });
  const removeItem = (sqI, itI) =>
    setSupplierQuotes(p => {
      const n=[...p];
      const items=(n[sqI].items||[]).filter((_,i)=>i!==itI);
      n[sqI]=recalc({...n[sqI],items:items.length?items:[EMPTY_ITEM()]});
      return n;
    });

  // ── Submit manual ──────────────────────────────────────────────────────────
  const handleCreateManual = async () => {
    try {
      const values  = await manualForm.validateFields();
      const validSQ = supplierQuotes.filter(sq => sq.supplierName?.trim());
      if (!validSQ.length) { message.error('Enter at least one supplier name'); return; }
      setLoading(true);
      const res = await tenderAPI.createManually({
        ...values,
        requiredDate:   values.requiredDate?.toISOString(),
        supplierQuotes: validSQ.map(sq => ({
          supplierName:         sq.supplierName,
          supplierEmail:        sq.supplierEmail||'',
          items:                sq.items.map(({_negTouched,...i})=>i),
          grandTotal:           sq.grandTotal,
          negotiatedGrandTotal: sq.negotiatedGrandTotal,
          deliveryTerms: sq.deliveryTerms||'',
          paymentTerms:  sq.paymentTerms||'',
          warranty:      sq.warranty||'',
          notes:         sq.notes||''
        }))
      });
      if (res.success) {
        message.success('Tender saved as draft');
        notification.success({ message:'Tender Created', description:`${res.data.tenderNumber} — submit for approval when ready.`, duration:5 });
        setManualOpen(false);
        manualForm.resetFields();
        setSupplierQuotes([EMPTY_SQ()]);
        loadTenders();
      } else { message.error(res.message || 'Failed to create tender'); }
    } catch (e) {
      if (e?.errorFields) message.error('Please fill all required fields');
      else { console.error(e); message.error('Error creating tender'); }
    } finally { setLoading(false); }
  };

  // ── Submit from RFQ ────────────────────────────────────────────────────────
  const handleCreateFromRFQ = async () => {
    if (!selectedRFQ) { message.error('Please select an RFQ'); return; }
    try {
      const values = await rfqForm.validateFields();
      setLoading(true);
      const res = await tenderAPI.createFromRFQ(selectedRFQ.id, values);
      if (res.success) {
        message.success('Tender created from RFQ');
        notification.success({ message:'Tender Created from RFQ', description:`${res.data.tenderNumber} — quotes auto-populated.`, duration:6 });
        setRfqOpen(false);
        rfqForm.resetFields();
        setSelectedRFQ(null);
        loadTenders();
      } else { message.error(res.message || 'Failed'); }
    } catch (e) {
      if (e?.errorFields) message.error('Please fill all required fields');
      else message.error('Error creating tender');
    } finally { setLoading(false); }
  };

  // ── Item columns for the manual supplier table ─────────────────────────────
  const itemCols = (sqI) => [
    { title:'Description', key:'d', render:(_,r,iI)=>(
        <Input size="small" placeholder="Item description" value={r.description}
          onChange={e=>setItemField(sqI,iI,'description',e.target.value)} /> ) },
    { title:'Qty', key:'q', width:70, render:(_,r,iI)=>(
        <InputNumber size="small" min={0} style={{width:'100%'}} value={r.quantity}
          onChange={v=>setItemField(sqI,iI,'quantity',v||0)} /> ) },
    { title:'Unit Price', key:'u', width:115, render:(_,r,iI)=>(
        <InputNumber size="small" min={0} style={{width:'100%'}} value={r.unitPrice}
          formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}
          onChange={v=>setItemField(sqI,iI,'unitPrice',v||0)} /> ) },
    { title:'Total Amount', key:'t', width:115, render:(_,r,iI)=>(
        <InputNumber size="small" min={0} style={{width:'100%'}} value={r.totalAmount}
          formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}
          onChange={v=>setItemField(sqI,iI,'totalAmount',v||0)} /> ) },
    { title:'Negotiated', key:'n', width:115, render:(_,r,iI)=>(
        <InputNumber size="small" min={0} style={{width:'100%'}} value={r.negotiatedTotal}
          formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}
          onChange={v=>setItemField(sqI,iI,'negotiatedTotal',v||0)} /> ) },
    { title:'', key:'x', width:36, render:(_,__,iI)=>(
        <Button size="small" type="text" danger icon={<DeleteOutlined/>}
          onClick={()=>removeItem(sqI,iI)} /> ) }
  ];

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    { title:'Tender No.', dataIndex:'tenderNumber', key:'n', width:110,
      render:num=><Text code strong style={{fontSize:12}}>{num}</Text> },
    { title:'Title / Category', key:'t',
      render:(_,r)=>(
        <div>
          <Text strong>{r.title}</Text><br/>
          <Text type="secondary" style={{fontSize:11}}>
            {r.source==='rfq'?'📋 From RFQ':'✍️ Manual'}
            {r.itemCategory?` · ${r.itemCategory}`:''}
          </Text>
        </div>
      )},
    { title:'Suppliers', key:'s', width:210,
      render:(_,r)=>(
        <div>
          {(r.supplierQuotes||[]).map((sq,i)=>(
            <Tag key={i} color={r.awardedSupplierName===sq.supplierName?'gold':'default'} style={{marginBottom:3}}>
              {r.awardedSupplierName===sq.supplierName&&'🏆 '}{sq.supplierName}
            </Tag>
          ))}
        </div>
      )},
    { title:'Budget', dataIndex:'budget', key:'b', width:130,
      render:b=><Text strong style={{color:'#1890ff'}}>XAF {(b||0).toLocaleString()}</Text>,
      sorter:(a,b)=>(a.budget||0)-(b.budget||0) },
    { title:'Date', dataIndex:'date', key:'d', width:85, render:d=>moment(d).format('DD/MM/YY') },
    { title:'Status', dataIndex:'status', key:'st', width:145,
      render:s=><StatusTag status={s}/>,
      filters:Object.entries(STATUS_CFG).map(([v,{text}])=>({text,value:v})),
      onFilter:(v,r)=>r.status===v },
    { title:'Actions', key:'a', width:230,
      render:(_,r)=>(
        <Space size={4} wrap>
          <Tooltip title="View"><Button size="small" icon={<EyeOutlined/>} onClick={()=>handleView(r)}/></Tooltip>
          <Tooltip title="Print (quick preview)"><Button size="small" icon={<PrinterOutlined/>} onClick={()=>handlePrint(r)}/></Tooltip>
          <Tooltip title="Download PDF (with signatures)">
            <Button size="small" icon={<DownloadOutlined/>} loading={pdfLoading} onClick={()=>handleDownloadPDF(r)}/>
          </Tooltip>
          {r.status==='draft'&&(
            <Tooltip title="Submit for Approval">
              <Button size="small" type="primary" icon={<SendOutlined/>}
                onClick={()=>handleStatusChange(r._id,'pending_approval',r.tenderNumber,r.requesterDepartment)}/>
            </Tooltip>
          )}
          {r.status==='pending_approval'&&(
            <Tooltip title="Process Approval (if you are an approver)">
              <Button size="small" style={{background:'#52c41a',borderColor:'#52c41a',color:'#fff'}}
                icon={<CheckCircleOutlined/>} onClick={()=>openApproveModal(r)}/>
            </Tooltip>
          )}
          {r.status==='approved'&&(
            <Tooltip title="Mark as Awarded">
              <Button size="small" style={{background:'#d4a017',borderColor:'#d4a017',color:'#fff'}}
                icon={<TrophyOutlined/>}
                onClick={()=>handleStatusChange(r._id,'awarded',r.tenderNumber)}/>
            </Tooltip>
          )}
          {r.status==='draft'&&(
            <Popconfirm title="Delete this draft?" onConfirm={()=>handleDelete(r._id,r.tenderNumber)}
              okText="Delete" okType="danger" cancelText="Cancel">
              <Tooltip title="Delete"><Button size="small" danger icon={<DeleteOutlined/>}/></Tooltip>
            </Popconfirm>
          )}
        </Space>
      )}
  ];

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{padding:24}}>
      {/* Header */}
      <Card style={{marginBottom:16}}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{margin:0}}><FileDoneOutlined style={{marginRight:8}}/>Tender Management</Title>
            <Text type="secondary">Create, approve and download Tender Approval Forms</Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined/>} onClick={loadTenders} loading={loading}>Refresh</Button>
              <Button icon={<SearchOutlined/>} onClick={()=>{loadRFQs();setRfqOpen(true);}}>Create from RFQ</Button>
              <Button type="primary" icon={<PlusOutlined/>}
                onClick={()=>{setSupplierQuotes([EMPTY_SQ()]);manualForm.resetFields();setManualOpen(true);}}>
                Create Manually
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stats */}
      <Row gutter={16} style={{marginBottom:16}}>
        {[
          {label:'Total',    v:stats.total,    c:'#1890ff'},
          {label:'Draft',    v:stats.draft,    c:'#faad14'},
          {label:'Pending',  v:stats.pending,  c:'#fa8c16'},
          {label:'Approved', v:stats.approved, c:'#52c41a'},
          {label:'Awarded',  v:stats.awarded,  c:'#d4a017'}
        ].map(s=>(
          <Col key={s.label} xs={24} sm={12} md={4}>
            <Card size="small"><Statistic title={s.label} value={s.v} valueStyle={{color:s.c,fontSize:22}}/></Card>
          </Col>
        ))}
        <Col xs={24} sm={24} md={4}>
          <Card size="small" style={{background:'#fffbe6',border:'1px solid #ffe58f'}}>
            <Text style={{fontSize:11}}>
              <DownloadOutlined style={{color:'#d4a017',marginRight:5}}/>
              Download PDF saves the form with live approval signatures auto-filled
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}
          items={[
            {key:'all',             label:`All (${stats.total})`},
            {key:'draft',           label:<Badge count={stats.draft}   size="small"><span style={{paddingRight:stats.draft>0?16:0}}>Draft</span></Badge>},
            {key:'pending_approval',label:<Badge count={stats.pending} size="small" style={{background:'#fa8c16'}}><span style={{paddingRight:stats.pending>0?16:0}}>Pending</span></Badge>},
            {key:'approved',        label:<Badge count={stats.approved} size="small" style={{background:'#52c41a'}}><span style={{paddingRight:stats.approved>0?16:0}}>Approved</span></Badge>},
            {key:'awarded',         label:`Awarded (${stats.awarded})`}
          ]}
        />
        <Table columns={columns} dataSource={filtered} rowKey="_id" loading={loading}
          pagination={{pageSize:15, showTotal:(t,r)=>`${r[0]}-${r[1]} of ${t} tenders`}}
          scroll={{x:'max-content'}}
          locale={{emptyText:<Empty description="No tenders yet — create one to get started."/>}}
        />
      </Card>

      {/* ══ DETAIL DRAWER ══ */}
      <Drawer
        title={<Space><FileDoneOutlined/><Text strong>{selectedTender?.tenderNumber}</Text>— {selectedTender?.title}<StatusTag status={selectedTender?.status}/></Space>}
        open={detailOpen} onClose={()=>setDetailOpen(false)} width={960}
        extra={
          <Space>
            <Button icon={<PrinterOutlined/>} onClick={()=>handlePrint(selectedTender)}>Print Preview</Button>
            <Button type="primary" icon={<DownloadOutlined/>} loading={pdfLoading}
              onClick={()=>handleDownloadPDF(selectedTender)}>
              Download PDF
            </Button>
          </Space>
        }
      >
        {selectedTender&&(
          <div>
            {/* Basic info */}
            <Card size="small" title="Tender Details" style={{marginBottom:12}}>
              <Descriptions column={3} size="small">
                <Descriptions.Item label="Number"><Text code strong>{selectedTender.tenderNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Date">{moment(selectedTender.date).format('DD MMM YYYY')}</Descriptions.Item>
                <Descriptions.Item label="Source">{selectedTender.source==='rfq'?'📋 From RFQ':'✍️ Manual'}</Descriptions.Item>
                <Descriptions.Item label="Title" span={2}><Text strong>{selectedTender.title}</Text></Descriptions.Item>
                <Descriptions.Item label="Category">{selectedTender.itemCategory||'—'}</Descriptions.Item>
                <Descriptions.Item label="Requester">{selectedTender.requesterName}</Descriptions.Item>
                <Descriptions.Item label="Department">{selectedTender.requesterDepartment||'—'}</Descriptions.Item>
                <Descriptions.Item label="Required Date">{selectedTender.requiredDate?moment(selectedTender.requiredDate).format('DD MMM YYYY'):'—'}</Descriptions.Item>
                <Descriptions.Item label="Commercial Terms" span={3}><Text italic>{selectedTender.commercialTerms||'—'}</Text></Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Supplier comparison */}
            <Divider orientation="left"><TeamOutlined/> Supplier Quotes</Divider>
            <Row gutter={12}>
              {(selectedTender.supplierQuotes||[]).map((sq,i)=>(
                <Col key={i} xs={24} md={Math.max(8,Math.floor(24/Math.min((selectedTender.supplierQuotes||[]).length,3)))}>
                  <Card size="small" style={{marginBottom:12, border:selectedTender.awardedSupplierName===sq.supplierName?'2px solid #d4a017':'1px solid #f0f0f0'}}
                    title={<Space><TeamOutlined/><Text strong>{sq.supplierName}</Text>{selectedTender.awardedSupplierName===sq.supplierName&&<Tag color="gold" icon={<TrophyOutlined/>}>AWARDED</Tag>}</Space>}
                  >
                    <Table size="small" pagination={false} dataSource={sq.items||[]} rowKey={(_,i)=>i}
                      columns={[
                        {title:'Item',  dataIndex:'description',key:'d',ellipsis:true},
                        {title:'Qty',   dataIndex:'quantity',   key:'q',width:45,align:'center'},
                        {title:'Unit',  dataIndex:'unitPrice',  key:'u',width:85,align:'right', render:v=>(v||0).toLocaleString()},
                        {title:'Total', dataIndex:'totalAmount',key:'t',width:85,align:'right', render:v=>(v||0).toLocaleString()},
                        {title:'Neg.',  dataIndex:'negotiatedTotal',key:'n',width:85,align:'right',
                          render:v=><Text strong style={{color:'#cc0000'}}>{(v||0).toLocaleString()}</Text>}
                      ]}
                      summary={()=>(
                        <Table.Summary.Row style={{background:'#fffce0'}}>
                          <Table.Summary.Cell index={0} colSpan={3}><Text strong>TOTAL</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={3} align="right"><Text strong>{(sq.grandTotal||0).toLocaleString()}</Text></Table.Summary.Cell>
                          <Table.Summary.Cell index={4} align="right"><Text strong style={{color:'#cc0000'}}>{(sq.negotiatedGrandTotal||0).toLocaleString()}</Text></Table.Summary.Cell>
                        </Table.Summary.Row>
                      )}
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Award */}
            <Card size="small" title={<Space><DollarOutlined/>Award &amp; Financials</Space>} style={{marginBottom:12}}>
              <Descriptions column={3} size="small">
                <Descriptions.Item label="Awarded"><Text strong style={{color:'#d4a017'}}>{selectedTender.awardedSupplierName||'—'}</Text></Descriptions.Item>
                <Descriptions.Item label="Budget"><Text strong style={{color:'#1890ff'}}>XAF {(selectedTender.budget||0).toLocaleString()}</Text></Descriptions.Item>
                <Descriptions.Item label="Cost Savings">XAF {(selectedTender.costSavings||0).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="Delivery Terms">{selectedTender.deliveryTerms||'—'}</Descriptions.Item>
                <Descriptions.Item label="Payment Terms"> {selectedTender.paymentTerms ||'—'}</Descriptions.Item>
                <Descriptions.Item label="Warranty">     {selectedTender.warranty      ||'—'}</Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Approval chain — live status */}
            {(selectedTender.approvalChain||[]).length>0&&(
              <Card size="small" title="Approval Chain" style={{marginBottom:12}}>
                <Steps size="small" current={(selectedTender.approvalChain||[]).findIndex(s=>s.status==='pending')}>
                  {(selectedTender.approvalChain||[]).map((step,i)=>(
                    <Steps.Step key={i}
                      title={step.approver?.name||step.approver?.role}
                      description={
                        <div>
                          <Tag color={step.status==='approved'?'green':step.status==='rejected'?'red':'orange'}>
                            {step.status}
                          </Tag>
                          {step.actionDate&&<div style={{fontSize:10,color:'#888'}}>{moment(step.actionDate).format('DD MMM YYYY HH:mm')}</div>}
                          {step.comments&&<div style={{fontSize:10,color:'#555',fontStyle:'italic'}}>"{step.comments}"</div>}
                        </div>
                      }
                      status={step.status==='approved'?'finish':step.status==='rejected'?'error':step.status==='pending'?'process':'wait'}
                    />
                  ))}
                </Steps>
              </Card>
            )}

            {/* Recommendations */}
            {(selectedTender.technicalRecommendation||selectedTender.procurementRecommendation)&&(
              <Card size="small" title="Recommendations" style={{marginBottom:12}}>
                {selectedTender.technicalRecommendation&&(
                  <div style={{marginBottom:8}}>
                    <Text strong>Technical</Text>
                    <div style={{background:'#f5f5f5',borderRadius:4,padding:'6px 10px',marginTop:4}}>{selectedTender.technicalRecommendation}</div>
                  </div>
                )}
                {selectedTender.procurementRecommendation&&(
                  <div>
                    <Text strong>Procurement</Text>
                    <div style={{background:'#f5f5f5',borderRadius:4,padding:'6px 10px',marginTop:4}}>{selectedTender.procurementRecommendation}</div>
                  </div>
                )}
              </Card>
            )}

            {/* Actions */}
            <Space wrap>
              {selectedTender.status==='draft'&&(
                <Button type="primary" icon={<SendOutlined/>}
                  onClick={()=>handleStatusChange(selectedTender._id,'pending_approval',selectedTender.tenderNumber,selectedTender.requesterDepartment)}>
                  Submit for Approval
                </Button>
              )}
              {selectedTender.status==='pending_approval'&&(
                <Button style={{background:'#52c41a',borderColor:'#52c41a',color:'#fff'}} icon={<CheckCircleOutlined/>}
                  onClick={()=>openApproveModal(selectedTender)}>
                  Process Approval
                </Button>
              )}
              {selectedTender.status==='approved'&&(
                <Button style={{background:'#d4a017',borderColor:'#d4a017',color:'#fff'}} icon={<TrophyOutlined/>}
                  onClick={()=>handleStatusChange(selectedTender._id,'awarded',selectedTender.tenderNumber)}>
                  Mark as Awarded
                </Button>
              )}
            </Space>
          </div>
        )}
      </Drawer>

      {/* ══ PROCESS APPROVAL MODAL ══ */}
      <Modal
        title={<Space><CheckCircleOutlined/>Process Approval — {approveTarget?.tenderNumber}</Space>}
        open={approveOpen}
        onOk={handleProcessApproval}
        onCancel={()=>{setApproveOpen(false);approveForm.resetFields();setApproveTarget(null);}}
        confirmLoading={loading}
        width={500}
        okText="Submit Decision"
      >
        <Alert
          message="Your signature will be captured from your user profile and embedded in the PDF when you approve."
          type="info" showIcon style={{marginBottom:16}}
        />
        <Form form={approveForm} layout="vertical">
          <Form.Item name="decision" label="Decision" rules={[{required:true,message:'Select a decision'}]}>
            <Select placeholder="Select your decision">
              <Option value="approved"><CheckCircleOutlined style={{color:'#52c41a'}}/> Approve</Option>
              <Option value="rejected"><CloseCircleOutlined style={{color:'#ff4d4f'}}/> Reject</Option>
            </Select>
          </Form.Item>
          <Form.Item name="comments" label="Comments (Optional)">
            <TextArea rows={3} placeholder="Add any remarks or conditions…" maxLength={500} showCount/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ CREATE FROM RFQ MODAL ══ */}
      <Modal
        title={<Space><SearchOutlined/>Create Tender from RFQ</Space>}
        open={rfqOpen}
        onOk={handleCreateFromRFQ}
        onCancel={()=>{setRfqOpen(false);setSelectedRFQ(null);rfqForm.resetFields();}}
        confirmLoading={loading} width={720} okText="Create Tender" destroyOnClose
      >
        <Alert message="Supplier quotes from the selected RFQ are auto-imported into the tender." type="info" showIcon style={{marginBottom:16}}/>
        <div style={{marginBottom:16}}>
          <Text strong>Select RFQ <span style={{color:'#ff4d4f'}}>*</span></Text>
          <div style={{marginTop:6}}>
            {rfqLoading?<Spin size="small" tip="Loading RFQs…"/>:availableRFQs.length===0?(
              <Alert message="No RFQs with quotes available" description="Create a tender manually instead." type="warning" showIcon/>
            ):(
              <Select style={{width:'100%'}} placeholder="Select an RFQ" showSearch
                onChange={val=>setSelectedRFQ(availableRFQs.find(r=>r.id===val))} optionLabelProp="label">
                {availableRFQs.map(r=>(
                  <Option key={r.id} value={r.id} label={`${r.rfqNumber} — ${r.title}`}>
                    <div><Text strong>{r.rfqNumber}</Text> — {r.title}<Tag color="blue" style={{marginLeft:8}}>{r.quoteCount} quote{r.quoteCount!==1?'s':''}</Tag>
                    {r.requisitionTitle&&<><br/><Text type="secondary" style={{fontSize:11}}>Req: {r.requisitionTitle}</Text></>}</div>
                  </Option>
                ))}
              </Select>
            )}
          </div>
          {selectedRFQ&&<Alert style={{marginTop:8}} message={`✅ ${selectedRFQ.quoteCount} quote(s) will be loaded from ${selectedRFQ.rfqNumber}`} type="success" showIcon/>}
        </div>
        <Form form={rfqForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="awardedSupplierName" label="Awarded Supplier (Optional)"><Input placeholder="Name of selected supplier"/></Form.Item></Col>
            <Col span={12}><Form.Item name="budget" label="Budget (XAF)"><InputNumber style={{width:'100%'}} min={0} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="costSavings" label="Cost Savings"><InputNumber style={{width:'100%'}} min={0} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
            <Col span={8}><Form.Item name="deliveryTerms" label="Delivery Terms"><Input placeholder="e.g. 23rd March 2026"/></Form.Item></Col>
            <Col span={8}><Form.Item name="paymentTerms" label="Payment Terms"><Input placeholder="e.g. 100% 30 days"/></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="warranty" label="Warranty"><Input placeholder="e.g. 6 Months for Laptops"/></Form.Item></Col>
            <Col span={12}><Form.Item name="commercialTerms" label="Commercial Terms"><Input placeholder="Delivery and payment conditions"/></Form.Item></Col>
          </Row>
          <Form.Item name="technicalRecommendation" label="Technical Recommendation"><TextArea rows={3}/></Form.Item>
          <Form.Item name="procurementRecommendation" label="Procurement Recommendation"><TextArea rows={3} placeholder="The selected supplier meets the required specifications…"/></Form.Item>
        </Form>
      </Modal>

      {/* ══ CREATE MANUALLY MODAL ══ */}
      <Modal
        title={<Space><PlusOutlined/>Create Tender Manually</Space>}
        open={manualOpen}
        onOk={handleCreateManual}
        onCancel={()=>{setManualOpen(false);manualForm.resetFields();setSupplierQuotes([EMPTY_SQ()]);}}
        confirmLoading={loading} width={1140} okText="Save as Draft"
        style={{top:16}} styles={{body:{maxHeight:'82vh',overflowY:'auto',padding:'16px 24px'}}} destroyOnClose
      >
        <Form form={manualForm} layout="vertical">
          <Divider orientation="left" style={{marginTop:0}}>Tender Information</Divider>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="title" label="Title" rules={[{required:true}]}><Input placeholder="e.g. IT ACCESSORIES"/></Form.Item></Col>
            <Col span={6}> <Form.Item name="itemCategory" label="Item Category"><Input placeholder="e.g. IT Accessories"/></Form.Item></Col>
            <Col span={6}> <Form.Item name="requiredDate" label="Required Date"><DatePicker style={{width:'100%'}}/></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="requesterName" label="Requester Name" rules={[{required:true}]}><Input/></Form.Item></Col>
            <Col span={8}><Form.Item name="requesterDepartment" label="Department"><Input placeholder="e.g. IT"/></Form.Item></Col>
            <Col span={8}><Form.Item name="commercialTerms" label="Commercial Terms"><Input/></Form.Item></Col>
          </Row>

          <Divider orientation="left">
            <Space><TeamOutlined/>Supplier Quotes<Button size="small" icon={<PlusOutlined/>} onClick={addSupplier}>Add Supplier</Button></Space>
          </Divider>

          {supplierQuotes.map((sq,sqI)=>(
            <Card key={sqI} size="small" style={{marginBottom:16,borderLeft:'4px solid #1890ff'}}
              title={
                <Row justify="space-between" align="middle">
                  <Col><Space><Text strong>Supplier {sqI+1}</Text>{sq.supplierName&&<Text type="secondary">— {sq.supplierName}</Text>}
                    {sq.negotiatedGrandTotal>0&&<Tag color="blue">Negotiated: XAF {sq.negotiatedGrandTotal.toLocaleString()}</Tag>}
                  </Space></Col>
                  <Col>{supplierQuotes.length>1&&<Button size="small" danger icon={<MinusCircleOutlined/>} onClick={()=>removeSupplier(sqI)}>Remove</Button>}</Col>
                </Row>
              }
            >
              <Row gutter={16} style={{marginBottom:8}}>
                <Col span={6}><Input size="small" placeholder="Supplier company name *" value={sq.supplierName} onChange={e=>setSQField(sqI,'supplierName',e.target.value)}/></Col>
                <Col span={6}><Input size="small" placeholder="supplier@email.com" value={sq.supplierEmail} onChange={e=>setSQField(sqI,'supplierEmail',e.target.value)}/></Col>
                <Col span={4}><Input size="small" placeholder="Delivery terms" value={sq.deliveryTerms} onChange={e=>setSQField(sqI,'deliveryTerms',e.target.value)}/></Col>
                <Col span={4}><Input size="small" placeholder="Payment terms" value={sq.paymentTerms}  onChange={e=>setSQField(sqI,'paymentTerms',e.target.value)}/></Col>
                <Col span={4}><Input size="small" placeholder="Warranty" value={sq.warranty} onChange={e=>setSQField(sqI,'warranty',e.target.value)}/></Col>
              </Row>
              <Table size="small" pagination={false} dataSource={sq.items||[]} rowKey={(_,i)=>i} columns={itemCols(sqI)}
                footer={()=>(
                  <Row justify="space-between" align="middle">
                    <Col><Button size="small" type="dashed" icon={<PlusOutlined/>} onClick={()=>addItem(sqI)}>Add Item</Button></Col>
                    <Col><Space>
                      <Text type="secondary" style={{fontSize:11}}>Grand Total:</Text><Text strong>{sq.grandTotal.toLocaleString()}</Text>
                      <Text type="secondary" style={{fontSize:11,marginLeft:8}}>Negotiated:</Text><Text strong style={{color:'#cc0000'}}>{sq.negotiatedGrandTotal.toLocaleString()}</Text>
                    </Space></Col>
                  </Row>
                )}
              />
            </Card>
          ))}

          <Divider orientation="left"><DollarOutlined/> Award &amp; Financials</Divider>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="awardedSupplierName" label="Awarded Supplier">
                <Select placeholder="Select" allowClear options={supplierQuotes.filter(sq=>sq.supplierName?.trim()).map(sq=>({label:sq.supplierName,value:sq.supplierName}))}/>
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item name="budget" label="Budget (XAF)"><InputNumber style={{width:'100%'}} min={0} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
            <Col span={4}><Form.Item name="costSavings" label="Cost Savings"><InputNumber style={{width:'100%'}} min={0} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
            <Col span={4}><Form.Item name="costAvoidance" label="Cost Avoidance"><InputNumber style={{width:'100%'}} min={0} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
            <Col span={4}><Form.Item name="warranty" label="Warranty"><Input/></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="deliveryTerms" label="Delivery Terms"><Input/></Form.Item></Col>
            <Col span={8}><Form.Item name="paymentTerms" label="Payment Terms"><Input/></Form.Item></Col>
          </Row>
          <Divider orientation="left">Recommendations</Divider>
          <Form.Item name="technicalRecommendation" label="Technical Recommendation"><TextArea rows={3}/></Form.Item>
          <Form.Item name="procurementRecommendation" label="Procurement Recommendation"><TextArea rows={3} placeholder="The selected supplier meets the required specifications…"/></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BuyerTenderManagement;








// // BuyerTenderManagement.jsx  — complete drop-in component
// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
//   Modal, Form, Input, Select, DatePicker, Divider, Alert, message,
//   Tooltip, Descriptions, Drawer, Spin, InputNumber, Popconfirm,
//   notification, Badge, Tabs, Empty, Steps
// } from 'antd';
// import {
//   FileTextOutlined, PlusOutlined, EditOutlined, EyeOutlined,
//   DeleteOutlined, PrinterOutlined, CheckCircleOutlined,
//   ReloadOutlined, SendOutlined, FileDoneOutlined, DollarOutlined,
//   TeamOutlined, MinusCircleOutlined, SearchOutlined, InfoCircleOutlined,
//   TrophyOutlined, WarningOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import tenderAPI, { generateTenderHTML } from '../../services/tenderAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// // ─────────────────────────────────────────────
// // Constants
// // ─────────────────────────────────────────────
// const STATUS_CONFIG = {
//   draft:            { color: 'default', text: 'Draft',            icon: <EditOutlined /> },
//   pending_approval: { color: 'orange',  text: 'Pending Approval', icon: <SendOutlined /> },
//   approved:         { color: 'green',   text: 'Approved',         icon: <CheckCircleOutlined /> },
//   rejected:         { color: 'red',     text: 'Rejected',         icon: <WarningOutlined /> },
//   awarded:          { color: 'gold',    text: 'Awarded',          icon: <TrophyOutlined /> }
// };

// const StatusTag = ({ status }) => {
//   const cfg = STATUS_CONFIG[status] || { color: 'default', text: status };
//   return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
// };

// const EMPTY_ITEM = () => ({ description: '', quantity: 1, unitPrice: 0, totalAmount: 0, negotiatedTotal: 0 });
// const EMPTY_SQ   = () => ({
//   supplierName: '', supplierEmail: '',
//   items: [EMPTY_ITEM()],
//   grandTotal: 0, negotiatedGrandTotal: 0,
//   deliveryTerms: '', paymentTerms: '', warranty: '', notes: ''
// });

// const recalcTotals = (sq) => {
//   const grand = (sq.items || []).reduce((s, i) => s + (Number(i.totalAmount) || 0), 0);
//   const neg   = (sq.items || []).reduce((s, i) => s + (Number(i.negotiatedTotal) || 0), 0);
//   return { ...sq, grandTotal: grand, negotiatedGrandTotal: neg };
// };

// // ─────────────────────────────────────────────
// // Main component
// // ─────────────────────────────────────────────
// const BuyerTenderManagement = () => {
//   // ── State ──────────────────────────────────────────────────────────────────
//   const [tenders,       setTenders]       = useState([]);
//   const [loading,       setLoading]       = useState(false);
//   const [activeTab,     setActiveTab]     = useState('all');

//   // Drawers / modals visibility
//   const [detailOpen,    setDetailOpen]    = useState(false);
//   const [manualOpen,    setManualOpen]    = useState(false);
//   const [rfqOpen,       setRfqOpen]       = useState(false);

//   const [selectedTender, setSelectedTender] = useState(null);
//   const [availableRFQs,  setAvailableRFQs]  = useState([]);
//   const [selectedRFQ,    setSelectedRFQ]    = useState(null);
//   const [rfqLoading,     setRfqLoading]     = useState(false);

//   // Manual form: supplier quotes managed outside Antd Form to allow dynamic tables
//   const [supplierQuotes, setSupplierQuotes] = useState([EMPTY_SQ()]);

//   const [manualForm] = Form.useForm();
//   const [rfqForm]    = Form.useForm();

//   // ── Data loading ───────────────────────────────────────────────────────────
//   const loadTenders = useCallback(async () => {
//     setLoading(true);
//     try {
//       const res = await tenderAPI.getTenders();
//       if (res.success) setTenders(res.data || []);
//       else message.error(res.message || 'Failed to load tenders');
//     } catch {
//       message.error('Error loading tenders');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   const loadRFQs = useCallback(async () => {
//     setRfqLoading(true);
//     try {
//       const res = await tenderAPI.getAvailableRFQsForTender();
//       if (res.success) setAvailableRFQs(res.data || []);
//       else message.warning(res.message || 'Could not load RFQs');
//     } catch {
//       message.warning('Could not load available RFQs');
//     } finally {
//       setRfqLoading(false);
//     }
//   }, []);

//   useEffect(() => { loadTenders(); }, [loadTenders]);

//   // ── Filtered data ──────────────────────────────────────────────────────────
//   const filtered = activeTab === 'all'
//     ? tenders
//     : tenders.filter(t => t.status === activeTab);

//   const stats = {
//     total:    tenders.length,
//     draft:    tenders.filter(t => t.status === 'draft').length,
//     pending:  tenders.filter(t => t.status === 'pending_approval').length,
//     approved: tenders.filter(t => t.status === 'approved').length,
//     awarded:  tenders.filter(t => t.status === 'awarded').length
//   };

//   // ── View detail ────────────────────────────────────────────────────────────
//   const handleView = async (tender) => {
//     setLoading(true);
//     try {
//       const res = await tenderAPI.getTenderById(tender._id);
//       if (res.success) { setSelectedTender(res.data); setDetailOpen(true); }
//       else message.error('Failed to load tender details');
//     } catch { message.error('Error loading tender'); }
//     finally { setLoading(false); }
//   };

//   // ── Print tender ───────────────────────────────────────────────────────────
//   const handlePrint = useCallback((tender) => {
//     const html = generateTenderHTML(tender);
//     const win  = window.open('', '_blank');
//     if (!win) { message.error('Popup blocked — please allow popups and try again'); return; }
//     win.document.write(html);
//     win.document.close();
//     win.focus();
//     setTimeout(() => win.print(), 700);
//   }, []);

//   // ── Status change ──────────────────────────────────────────────────────────
//   const handleStatusChange = async (id, status, tenderNum) => {
//     try {
//       const res = await tenderAPI.updateStatus(id, status);
//       if (res.success) {
//         message.success(`Tender ${tenderNum} status → ${STATUS_CONFIG[status]?.text || status}`);
//         loadTenders();
//         if (selectedTender?._id === id) setSelectedTender(prev => ({ ...prev, status }));
//       } else {
//         message.error(res.message || 'Failed to update status');
//       }
//     } catch { message.error('Error updating status'); }
//   };

//   // ── Delete ─────────────────────────────────────────────────────────────────
//   const handleDelete = async (id, tenderNum) => {
//     try {
//       const res = await tenderAPI.deleteTender(id);
//       if (res.success) { message.success(`Tender ${tenderNum} deleted`); loadTenders(); }
//       else message.error(res.message || 'Failed to delete tender');
//     } catch { message.error('Error deleting tender'); }
//   };

//   // ─────────────────────────────────────────────
//   // Supplier quote helpers (manual form)
//   // ─────────────────────────────────────────────
//   const addSupplier    = () => setSupplierQuotes(p => [...p, EMPTY_SQ()]);
//   const removeSupplier = (i) => {
//     if (supplierQuotes.length <= 1) { message.warning('At least one supplier required'); return; }
//     setSupplierQuotes(p => p.filter((_, idx) => idx !== i));
//   };

//   const setSQField = (sqIdx, field, value) =>
//     setSupplierQuotes(p => {
//       const next = [...p];
//       next[sqIdx] = recalcTotals({ ...next[sqIdx], [field]: value });
//       return next;
//     });

//   const setItemField = (sqIdx, itemIdx, field, value) =>
//     setSupplierQuotes(p => {
//       const next  = [...p];
//       const items = [...(next[sqIdx].items || [])];
//       items[itemIdx] = { ...items[itemIdx], [field]: value };
//       // Auto-calculate totalAmount when qty or unitPrice changes
//       if (field === 'quantity' || field === 'unitPrice') {
//         items[itemIdx].totalAmount = (Number(items[itemIdx].quantity) || 0) * (Number(items[itemIdx].unitPrice) || 0);
//         if (!items[itemIdx]._negTouched) {
//           items[itemIdx].negotiatedTotal = items[itemIdx].totalAmount;
//         }
//       }
//       if (field === 'negotiatedTotal') items[itemIdx]._negTouched = true;
//       next[sqIdx] = recalcTotals({ ...next[sqIdx], items });
//       return next;
//     });

//   const addItem    = (sqIdx) =>
//     setSupplierQuotes(p => {
//       const next = [...p];
//       next[sqIdx] = { ...next[sqIdx], items: [...(next[sqIdx].items || []), EMPTY_ITEM()] };
//       return next;
//     });

//   const removeItem = (sqIdx, itemIdx) =>
//     setSupplierQuotes(p => {
//       const next  = [...p];
//       const items = (next[sqIdx].items || []).filter((_, i) => i !== itemIdx);
//       next[sqIdx] = recalcTotals({ ...next[sqIdx], items: items.length ? items : [EMPTY_ITEM()] });
//       return next;
//     });

//   // ─────────────────────────────────────────────
//   // Submit manual tender
//   // ─────────────────────────────────────────────
//   const handleCreateManual = async () => {
//     try {
//       const values = await manualForm.validateFields();
//       const validSQs = supplierQuotes.filter(sq => sq.supplierName?.trim());
//       if (!validSQs.length) { message.error('Enter at least one supplier name'); return; }

//       setLoading(true);
//       const payload = {
//         ...values,
//         requiredDate:   values.requiredDate   ? values.requiredDate.toISOString()   : undefined,
//         supplierQuotes: validSQs.map(sq => ({
//           supplierName:         sq.supplierName,
//           supplierEmail:        sq.supplierEmail || '',
//           items:                sq.items.map(({ _negTouched, ...item }) => item),
//           grandTotal:           sq.grandTotal,
//           negotiatedGrandTotal: sq.negotiatedGrandTotal,
//           deliveryTerms:        sq.deliveryTerms || '',
//           paymentTerms:         sq.paymentTerms  || '',
//           warranty:             sq.warranty      || '',
//           notes:                sq.notes         || ''
//         }))
//       };

//       const res = await tenderAPI.createManually(payload);
//       if (res.success) {
//         message.success('Tender created successfully');
//         notification.success({
//           message:     'Tender Saved as Draft',
//           description: `${res.data.tenderNumber} — submit it for approval when ready.`,
//           duration:    5
//         });
//         setManualOpen(false);
//         manualForm.resetFields();
//         setSupplierQuotes([EMPTY_SQ()]);
//         loadTenders();
//       } else {
//         message.error(res.message || 'Failed to create tender');
//       }
//     } catch (e) {
//       if (e?.errorFields) message.error('Please fill all required fields');
//       else { console.error(e); message.error('Error creating tender'); }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─────────────────────────────────────────────
//   // Submit tender from RFQ
//   // ─────────────────────────────────────────────
//   const handleCreateFromRFQ = async () => {
//     if (!selectedRFQ) { message.error('Please select an RFQ'); return; }
//     try {
//       const values = await rfqForm.validateFields();
//       setLoading(true);
//       const res = await tenderAPI.createFromRFQ(selectedRFQ.id, values);
//       if (res.success) {
//         message.success('Tender created from RFQ');
//         notification.success({
//           message:     'Tender Created from RFQ',
//           description: `${res.data.tenderNumber} — supplier quotes auto-populated from ${selectedRFQ.quoteCount} submitted quote(s).`,
//           duration:    6
//         });
//         setRfqOpen(false);
//         rfqForm.resetFields();
//         setSelectedRFQ(null);
//         loadTenders();
//       } else {
//         message.error(res.message || 'Failed to create tender');
//       }
//     } catch (e) {
//       if (e?.errorFields) message.error('Please fill all required fields');
//       else { console.error(e); message.error('Error creating tender'); }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─────────────────────────────────────────────
//   // Table columns
//   // ─────────────────────────────────────────────
//   const columns = [
//     {
//       title: 'Tender No.',
//       dataIndex: 'tenderNumber',
//       key: 'tenderNumber',
//       width: 110,
//       render: (num) => <Text code strong style={{ fontSize: 12 }}>{num}</Text>
//     },
//     {
//       title: 'Title / Category',
//       key: 'title',
//       render: (_, r) => (
//         <div>
//           <Text strong>{r.title}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: 11 }}>
//             {r.source === 'rfq' ? '📋 From RFQ' : '✍️ Manual'}
//             {r.itemCategory ? ` · ${r.itemCategory}` : ''}
//           </Text>
//         </div>
//       )
//     },
//     {
//       title: 'Requester',
//       key: 'requester',
//       width: 150,
//       render: (_, r) => (
//         <div>
//           <Text>{r.requesterName}</Text>
//           {r.requesterDepartment && <><br /><Text type="secondary" style={{ fontSize: 11 }}>{r.requesterDepartment}</Text></>}
//         </div>
//       )
//     },
//     {
//       title: 'Suppliers',
//       key: 'suppliers',
//       width: 200,
//       render: (_, r) => (
//         <div>
//           {(r.supplierQuotes || []).map((sq, i) => (
//             <Tag
//               key={i}
//               color={r.awardedSupplierName === sq.supplierName ? 'gold' : 'default'}
//               style={{ marginBottom: 3, display: 'inline-block' }}
//             >
//               {r.awardedSupplierName === sq.supplierName && '🏆 '}
//               {sq.supplierName}
//             </Tag>
//           ))}
//         </div>
//       )
//     },
//     {
//       title: 'Budget',
//       dataIndex: 'budget',
//       key: 'budget',
//       width: 130,
//       render: (b) => <Text strong style={{ color: '#1890ff' }}>XAF {(b || 0).toLocaleString()}</Text>,
//       sorter: (a, b) => (a.budget || 0) - (b.budget || 0)
//     },
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       width: 90,
//       render: (d) => moment(d).format('DD/MM/YY')
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       width: 140,
//       render: (s) => <StatusTag status={s} />,
//       filters: Object.entries(STATUS_CONFIG).map(([v, { text }]) => ({ text, value: v })),
//       onFilter: (v, r) => r.status === v
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: 200,
//       render: (_, r) => (
//         <Space size={4} wrap>
//           <Tooltip title="View Details">
//             <Button size="small" icon={<EyeOutlined />} onClick={() => handleView(r)} />
//           </Tooltip>
//           <Tooltip title="Print / Download PDF">
//             <Button size="small" icon={<PrinterOutlined />} onClick={() => handlePrint(r)} />
//           </Tooltip>
//           {r.status === 'draft' && (
//             <Tooltip title="Submit for Approval">
//               <Button
//                 size="small"
//                 type="primary"
//                 icon={<SendOutlined />}
//                 onClick={() => handleStatusChange(r._id, 'pending_approval', r.tenderNumber)}
//               />
//             </Tooltip>
//           )}
//           {r.status === 'pending_approval' && (
//             <Tooltip title="Approve">
//               <Button
//                 size="small"
//                 style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
//                 icon={<CheckCircleOutlined />}
//                 onClick={() => handleStatusChange(r._id, 'approved', r.tenderNumber)}
//               />
//             </Tooltip>
//           )}
//           {r.status === 'approved' && (
//             <Tooltip title="Mark as Awarded">
//               <Button
//                 size="small"
//                 style={{ background: '#d4a017', borderColor: '#d4a017', color: '#fff' }}
//                 icon={<TrophyOutlined />}
//                 onClick={() => handleStatusChange(r._id, 'awarded', r.tenderNumber)}
//               />
//             </Tooltip>
//           )}
//           {r.status === 'draft' && (
//             <Popconfirm
//               title="Delete this draft tender?"
//               onConfirm={() => handleDelete(r._id, r.tenderNumber)}
//               okText="Delete" okType="danger" cancelText="Cancel"
//             >
//               <Tooltip title="Delete Draft">
//                 <Button size="small" danger icon={<DeleteOutlined />} />
//               </Tooltip>
//             </Popconfirm>
//           )}
//         </Space>
//       )
//     }
//   ];

//   // ─────────────────────────────────────────────
//   // Supplier quote item sub-table used in the manual form
//   // ─────────────────────────────────────────────
//   const itemColumns = (sqIdx) => [
//     {
//       title: 'Description',
//       key: 'desc',
//       render: (_, row, itemIdx) => (
//         <Input
//           size="small"
//           placeholder="Item description"
//           value={row.description}
//           onChange={e => setItemField(sqIdx, itemIdx, 'description', e.target.value)}
//         />
//       )
//     },
//     {
//       title: 'Qty',
//       key: 'qty',
//       width: 70,
//       render: (_, row, itemIdx) => (
//         <InputNumber
//           size="small"
//           min={0}
//           style={{ width: '100%' }}
//           value={row.quantity}
//           onChange={v => setItemField(sqIdx, itemIdx, 'quantity', v || 0)}
//         />
//       )
//     },
//     {
//       title: 'Unit Price',
//       key: 'up',
//       width: 115,
//       render: (_, row, itemIdx) => (
//         <InputNumber
//           size="small"
//           min={0}
//           style={{ width: '100%' }}
//           value={row.unitPrice}
//           formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={v => v.replace(/,/g, '')}
//           onChange={v => setItemField(sqIdx, itemIdx, 'unitPrice', v || 0)}
//         />
//       )
//     },
//     {
//       title: 'Total Amount',
//       key: 'ta',
//       width: 115,
//       render: (_, row, itemIdx) => (
//         <InputNumber
//           size="small"
//           min={0}
//           style={{ width: '100%' }}
//           value={row.totalAmount}
//           formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={v => v.replace(/,/g, '')}
//           onChange={v => setItemField(sqIdx, itemIdx, 'totalAmount', v || 0)}
//         />
//       )
//     },
//     {
//       title: 'Negotiated Total',
//       key: 'nt',
//       width: 125,
//       render: (_, row, itemIdx) => (
//         <InputNumber
//           size="small"
//           min={0}
//           style={{ width: '100%' }}
//           value={row.negotiatedTotal}
//           formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//           parser={v => v.replace(/,/g, '')}
//           onChange={v => setItemField(sqIdx, itemIdx, 'negotiatedTotal', v || 0)}
//         />
//       )
//     },
//     {
//       title: '',
//       key: 'del',
//       width: 36,
//       render: (_, __, itemIdx) => (
//         <Button
//           size="small"
//           type="text"
//           danger
//           icon={<DeleteOutlined />}
//           onClick={() => removeItem(sqIdx, itemIdx)}
//         />
//       )
//     }
//   ];

//   // ─────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────
//   return (
//     <div style={{ padding: 24 }}>

//       {/* ══════════ HEADER ══════════ */}
//       <Card style={{ marginBottom: 16 }}>
//         <Row justify="space-between" align="middle">
//           <Col>
//             <Title level={3} style={{ margin: 0 }}>
//               <FileDoneOutlined style={{ marginRight: 8 }} />
//               Tender Management
//             </Title>
//             <Text type="secondary">
//               Create, manage, and approve tender forms before raising Purchase Orders
//             </Text>
//           </Col>
//           <Col>
//             <Space>
//               <Button icon={<ReloadOutlined />} onClick={loadTenders} loading={loading}>
//                 Refresh
//               </Button>
//               <Button
//                 icon={<SearchOutlined />}
//                 onClick={() => { loadRFQs(); setRfqOpen(true); }}
//               >
//                 Create from RFQ
//               </Button>
//               <Button
//                 type="primary"
//                 icon={<PlusOutlined />}
//                 onClick={() => { setSupplierQuotes([EMPTY_SQ()]); manualForm.resetFields(); setManualOpen(true); }}
//               >
//                 Create Manually
//               </Button>
//             </Space>
//           </Col>
//         </Row>
//       </Card>

//       {/* ══════════ STATS ══════════ */}
//       <Row gutter={16} style={{ marginBottom: 16 }}>
//         {[
//           { label: 'Total',    value: stats.total,    color: '#1890ff' },
//           { label: 'Draft',    value: stats.draft,    color: '#faad14' },
//           { label: 'Pending',  value: stats.pending,  color: '#fa8c16' },
//           { label: 'Approved', value: stats.approved, color: '#52c41a' },
//           { label: 'Awarded',  value: stats.awarded,  color: '#d4a017' }
//         ].map(s => (
//           <Col key={s.label} xs={24} sm={12} md={4}>
//             <Card size="small">
//               <Statistic title={s.label} value={s.value} valueStyle={{ color: s.color, fontSize: 22 }} />
//             </Card>
//           </Col>
//         ))}
//         <Col xs={24} sm={12} md={4}>
//           <Card size="small" style={{ background: '#fffbe6', border: '1px solid #ffe58f' }}>
//             <Text strong style={{ fontSize: 12 }}>
//               <InfoCircleOutlined style={{ color: '#faad14', marginRight: 6 }} />
//               PO requires an approved or awarded tender
//             </Text>
//           </Card>
//         </Col>
//       </Row>

//       {/* ══════════ TABLE ══════════ */}
//       <Card>
//         <Tabs
//           activeKey={activeTab}
//           onChange={setActiveTab}
//           items={[
//             { key: 'all',             label: `All (${stats.total})` },
//             { key: 'draft',           label: <Badge count={stats.draft}    size="small"><span style={{ paddingRight: stats.draft > 0 ? 16 : 0 }}>Draft</span></Badge> },
//             { key: 'pending_approval',label: <Badge count={stats.pending}  size="small" style={{ background: '#fa8c16' }}><span style={{ paddingRight: stats.pending > 0 ? 16 : 0 }}>Pending</span></Badge> },
//             { key: 'approved',        label: <Badge count={stats.approved} size="small" style={{ background: '#52c41a' }}><span style={{ paddingRight: stats.approved > 0 ? 16 : 0 }}>Approved</span></Badge> },
//             { key: 'awarded',         label: `Awarded (${stats.awarded})` }
//           ]}
//         />
//         <Table
//           columns={columns}
//           dataSource={filtered}
//           rowKey="_id"
//           loading={loading}
//           pagination={{ pageSize: 15, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t} tenders` }}
//           scroll={{ x: 'max-content' }}
//           locale={{ emptyText: <Empty description="No tenders yet. Create one to get started." /> }}
//         />
//       </Card>

//       {/* ══════════════════════════════════════════
//           DETAIL DRAWER
//       ══════════════════════════════════════════ */}
//       <Drawer
//         title={
//           <Space>
//             <FileDoneOutlined />
//             <Text strong>{selectedTender?.tenderNumber}</Text>
//             —
//             <Text>{selectedTender?.title}</Text>
//             <StatusTag status={selectedTender?.status} />
//           </Space>
//         }
//         open={detailOpen}
//         onClose={() => setDetailOpen(false)}
//         width={960}
//         extra={
//           <Button type="primary" icon={<PrinterOutlined />} onClick={() => handlePrint(selectedTender)}>
//             Print / Download PDF
//           </Button>
//         }
//       >
//         {selectedTender && (
//           <div>
//             {/* Header info */}
//             <Card size="small" title="Tender Details" style={{ marginBottom: 12 }}>
//               <Descriptions column={3} size="small">
//                 <Descriptions.Item label="Number">
//                   <Text code strong>{selectedTender.tenderNumber}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Date">
//                   {moment(selectedTender.date).format('DD MMM YYYY')}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Source">
//                   {selectedTender.source === 'rfq' ? '📋 From RFQ' : '✍️ Manual'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Title" span={2}>
//                   <Text strong>{selectedTender.title}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Category">
//                   {selectedTender.itemCategory || '—'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Requester">
//                   {selectedTender.requesterName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Department">
//                   {selectedTender.requesterDepartment || '—'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Required Date">
//                   {selectedTender.requiredDate ? moment(selectedTender.requiredDate).format('DD MMM YYYY') : '—'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Commercial Terms" span={3}>
//                   <Text italic>{selectedTender.commercialTerms || '—'}</Text>
//                 </Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {/* Supplier comparison */}
//             <Divider orientation="left">
//               <TeamOutlined /> Supplier Quotes Comparison
//             </Divider>
//             <Row gutter={12}>
//               {(selectedTender.supplierQuotes || []).map((sq, i) => (
//                 <Col key={i} xs={24} md={Math.max(8, Math.floor(24 / Math.min(selectedTender.supplierQuotes.length, 3)))}>
//                   <Card
//                     size="small"
//                     style={{
//                       marginBottom: 12,
//                       border: selectedTender.awardedSupplierName === sq.supplierName
//                         ? '2px solid #d4a017' : '1px solid #f0f0f0'
//                     }}
//                     title={
//                       <Space>
//                         <TeamOutlined />
//                         <Text strong>{sq.supplierName}</Text>
//                         {selectedTender.awardedSupplierName === sq.supplierName && (
//                           <Tag color="gold" icon={<TrophyOutlined />}>AWARDED</Tag>
//                         )}
//                       </Space>
//                     }
//                   >
//                     <Table
//                       size="small"
//                       pagination={false}
//                       dataSource={sq.items || []}
//                       rowKey={(r, idx) => idx}
//                       columns={[
//                         { title: 'Item', dataIndex: 'description', key: 'd', ellipsis: true },
//                         { title: 'Qty',  dataIndex: 'quantity', key: 'q', width: 45, align: 'center' },
//                         { title: 'Unit',  dataIndex: 'unitPrice', key: 'u', width: 90, align: 'right',
//                           render: v => (v||0).toLocaleString() },
//                         { title: 'Total', dataIndex: 'totalAmount', key: 't', width: 90, align: 'right',
//                           render: v => (v||0).toLocaleString() },
//                         { title: 'Neg.', dataIndex: 'negotiatedTotal', key: 'n', width: 90, align: 'right',
//                           render: v => <Text strong style={{ color: '#cc0000' }}>{(v||0).toLocaleString()}</Text> }
//                       ]}
//                       summary={() => (
//                         <Table.Summary.Row style={{ background: '#fffce0' }}>
//                           <Table.Summary.Cell index={0} colSpan={3}>
//                             <Text strong>TOTAL</Text>
//                           </Table.Summary.Cell>
//                           <Table.Summary.Cell index={3} align="right">
//                             <Text strong>{(sq.grandTotal||0).toLocaleString()}</Text>
//                           </Table.Summary.Cell>
//                           <Table.Summary.Cell index={4} align="right">
//                             <Text strong style={{ color: '#cc0000' }}>
//                               {(sq.negotiatedGrandTotal||0).toLocaleString()}
//                             </Text>
//                           </Table.Summary.Cell>
//                         </Table.Summary.Row>
//                       )}
//                     />
//                     <div style={{ marginTop: 8, fontSize: 11, color: '#888' }}>
//                       {sq.deliveryTerms && <div>Delivery: {sq.deliveryTerms}</div>}
//                       {sq.paymentTerms  && <div>Payment: {sq.paymentTerms}</div>}
//                       {sq.warranty      && <div>Warranty: {sq.warranty}</div>}
//                     </div>
//                   </Card>
//                 </Col>
//               ))}
//             </Row>

//             {/* Award + financials */}
//             <Card size="small" title={<Space><DollarOutlined />Award &amp; Financials</Space>} style={{ marginBottom: 12 }}>
//               <Descriptions column={3} size="small">
//                 <Descriptions.Item label="Awarded To">
//                   <Text strong style={{ color: '#d4a017' }}>{selectedTender.awardedSupplierName || '—'}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Budget">
//                   <Text strong style={{ color: '#1890ff' }}>XAF {(selectedTender.budget||0).toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Cost Savings">
//                   XAF {(selectedTender.costSavings||0).toLocaleString()}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Delivery Terms">{selectedTender.deliveryTerms || '—'}</Descriptions.Item>
//                 <Descriptions.Item label="Payment Terms">{selectedTender.paymentTerms  || '—'}</Descriptions.Item>
//                 <Descriptions.Item label="Warranty">     {selectedTender.warranty       || '—'}</Descriptions.Item>
//               </Descriptions>
//             </Card>

//             {/* Recommendations */}
//             {(selectedTender.technicalRecommendation || selectedTender.procurementRecommendation) && (
//               <Card size="small" title="Recommendations" style={{ marginBottom: 12 }}>
//                 {selectedTender.technicalRecommendation && (
//                   <div style={{ marginBottom: 8 }}>
//                     <Text strong>Technical Recommendation</Text>
//                     <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '6px 10px', marginTop: 4 }}>
//                       {selectedTender.technicalRecommendation}
//                     </div>
//                   </div>
//                 )}
//                 {selectedTender.procurementRecommendation && (
//                   <div>
//                     <Text strong>Procurement Recommendation</Text>
//                     <div style={{ background: '#f5f5f5', borderRadius: 4, padding: '6px 10px', marginTop: 4 }}>
//                       {selectedTender.procurementRecommendation}
//                     </div>
//                   </div>
//                 )}
//               </Card>
//             )}

//             {/* Workflow actions */}
//             <Space wrap>
//               {selectedTender.status === 'draft' && (
//                 <Button type="primary" icon={<SendOutlined />}
//                   onClick={() => handleStatusChange(selectedTender._id, 'pending_approval', selectedTender.tenderNumber)}>
//                   Submit for Approval
//                 </Button>
//               )}
//               {selectedTender.status === 'pending_approval' && (
//                 <Button style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
//                   icon={<CheckCircleOutlined />}
//                   onClick={() => handleStatusChange(selectedTender._id, 'approved', selectedTender.tenderNumber)}>
//                   Mark as Approved
//                 </Button>
//               )}
//               {selectedTender.status === 'approved' && (
//                 <Button style={{ background: '#d4a017', borderColor: '#d4a017', color: '#fff' }}
//                   icon={<TrophyOutlined />}
//                   onClick={() => handleStatusChange(selectedTender._id, 'awarded', selectedTender.tenderNumber)}>
//                   Mark as Awarded
//                 </Button>
//               )}
//             </Space>
//           </div>
//         )}
//       </Drawer>

//       {/* ══════════════════════════════════════════
//           CREATE FROM RFQ MODAL
//       ══════════════════════════════════════════ */}
//       <Modal
//         title={<Space><SearchOutlined />Create Tender from RFQ</Space>}
//         open={rfqOpen}
//         onOk={handleCreateFromRFQ}
//         onCancel={() => { setRfqOpen(false); setSelectedRFQ(null); rfqForm.resetFields(); }}
//         confirmLoading={loading}
//         width={720}
//         okText="Create Tender"
//         destroyOnClose
//       >
//         <Alert
//           message="Supplier quotes submitted against the selected RFQ will be automatically pulled into the tender form."
//           type="info"
//           showIcon
//           style={{ marginBottom: 16 }}
//         />

//         {/* RFQ selector */}
//         <div style={{ marginBottom: 16 }}>
//           <Text strong>Select RFQ <span style={{ color: '#ff4d4f' }}>*</span></Text>
//           <div style={{ marginTop: 6 }}>
//             {rfqLoading ? (
//               <Spin size="small" tip="Loading RFQs…" />
//             ) : availableRFQs.length === 0 ? (
//               <Alert
//                 message="No RFQs with quotes available"
//                 description="There are no RFQs with submitted supplier quotes that haven't already been tendered. Create a tender manually instead."
//                 type="warning"
//                 showIcon
//               />
//             ) : (
//               <Select
//                 style={{ width: '100%' }}
//                 placeholder="Select an RFQ to create a tender from"
//                 onChange={(val) => setSelectedRFQ(availableRFQs.find(r => r.id === val))}
//                 optionLabelProp="label"
//                 showSearch
//                 filterOption={(input, opt) => (opt.label || '').toLowerCase().includes(input.toLowerCase())}
//               >
//                 {availableRFQs.map(rfq => (
//                   <Option key={rfq.id} value={rfq.id} label={`${rfq.rfqNumber} — ${rfq.title}`}>
//                     <div>
//                       <Text strong>{rfq.rfqNumber}</Text> — {rfq.title}
//                       <Tag color="blue" style={{ marginLeft: 8 }}>{rfq.quoteCount} quote{rfq.quoteCount !== 1 ? 's' : ''}</Tag>
//                       {rfq.requisitionTitle && (
//                         <><br /><Text type="secondary" style={{ fontSize: 11 }}>Req: {rfq.requisitionTitle}</Text></>
//                       )}
//                     </div>
//                   </Option>
//                 ))}
//               </Select>
//             )}
//           </div>
//           {selectedRFQ && (
//             <Alert
//               style={{ marginTop: 8 }}
//               message={`✅ ${selectedRFQ.quoteCount} supplier quote(s) will be loaded from ${selectedRFQ.rfqNumber}`}
//               type="success"
//               showIcon
//             />
//           )}
//         </div>

//         <Form form={rfqForm} layout="vertical">
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="awardedSupplierName" label="Awarded Supplier (Optional)">
//                 <Input placeholder="Name of selected supplier" />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item name="budget" label="Budget (XAF)">
//                 <InputNumber style={{ width: '100%' }} min={0}
//                   formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={v => v.replace(/,/g, '')} />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="costSavings" label="Cost Savings">
//                 <InputNumber style={{ width: '100%' }} min={0}
//                   formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={v => v.replace(/,/g, '')} />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="deliveryTerms" label="Delivery Terms">
//                 <Input placeholder="e.g. 23rd and 24th March 2026" />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="paymentTerms" label="Payment Terms">
//                 <Input placeholder="e.g. 100% 30 days after delivery" />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="warranty" label="Warranty">
//                 <Input placeholder="e.g. 6 Months for Laptops" />
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item name="commercialTerms" label="Commercial Terms">
//                 <Input placeholder="Delivery and payment conditions summary" />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Form.Item name="technicalRecommendation" label="Technical Recommendation">
//             <TextArea rows={3} placeholder="Technical notes…" />
//           </Form.Item>
//           <Form.Item name="procurementRecommendation" label="Procurement Recommendation">
//             <TextArea rows={3} placeholder="The selected supplier meets the required specifications, offers good quality at the most competitive price, and meets delivery terms…" />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══════════════════════════════════════════
//           CREATE MANUALLY MODAL
//       ══════════════════════════════════════════ */}
//       <Modal
//         title={<Space><PlusOutlined />Create Tender Manually</Space>}
//         open={manualOpen}
//         onOk={handleCreateManual}
//         onCancel={() => { setManualOpen(false); manualForm.resetFields(); setSupplierQuotes([EMPTY_SQ()]); }}
//         confirmLoading={loading}
//         width={1140}
//         okText="Save as Draft"
//         style={{ top: 16 }}
//         styles={{ body: { maxHeight: '82vh', overflowY: 'auto', padding: '16px 24px' } }}
//         destroyOnClose
//       >
//         <Form form={manualForm} layout="vertical">

//           {/* ─── Tender header ─── */}
//           <Divider orientation="left" style={{ marginTop: 0 }}>Tender Information</Divider>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
//                 <Input placeholder="e.g. IT ACCESSORIES" />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item name="itemCategory" label="Item Category">
//                 <Input placeholder="e.g. IT Accessories" />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item name="requiredDate" label="Required Date">
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="requesterName" label="Requester Name" rules={[{ required: true, message: 'Requester name is required' }]}>
//                 <Input placeholder="Full name of requester" />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="requesterDepartment" label="Department">
//                 <Input placeholder="e.g. IT" />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="commercialTerms" label="Commercial Terms">
//                 <Input placeholder="e.g. Delivery on 23rd March, payment 30 days after delivery" />
//               </Form.Item>
//             </Col>
//           </Row>

//           {/* ─── Supplier quotes ─── */}
//           <Divider orientation="left">
//             <Space>
//               <TeamOutlined />
//               Supplier Quotes
//               <Button size="small" icon={<PlusOutlined />} onClick={addSupplier}>
//                 Add Supplier
//               </Button>
//             </Space>
//           </Divider>

//           {supplierQuotes.map((sq, sqIdx) => (
//             <Card
//               key={sqIdx}
//               size="small"
//               style={{
//                 marginBottom: 16,
//                 border: '1px solid #e0e0e0',
//                 borderLeft: '4px solid #1890ff'
//               }}
//               title={
//                 <Row justify="space-between" align="middle">
//                   <Col>
//                     <Space>
//                       <Text strong>Supplier {sqIdx + 1}</Text>
//                       {sq.supplierName && <Text type="secondary">— {sq.supplierName}</Text>}
//                       {sq.negotiatedGrandTotal > 0 && (
//                         <Tag color="blue">Negotiated: XAF {sq.negotiatedGrandTotal.toLocaleString()}</Tag>
//                       )}
//                     </Space>
//                   </Col>
//                   <Col>
//                     {supplierQuotes.length > 1 && (
//                       <Button size="small" danger icon={<MinusCircleOutlined />} onClick={() => removeSupplier(sqIdx)}>
//                         Remove Supplier
//                       </Button>
//                     )}
//                   </Col>
//                 </Row>
//               }
//             >
//               {/* Supplier header fields */}
//               <Row gutter={16} style={{ marginBottom: 8 }}>
//                 <Col span={6}>
//                   <Input
//                     size="small"
//                     placeholder="Supplier company name *"
//                     value={sq.supplierName}
//                     onChange={e => setSQField(sqIdx, 'supplierName', e.target.value)}
//                   />
//                 </Col>
//                 <Col span={6}>
//                   <Input
//                     size="small"
//                     placeholder="supplier@email.com"
//                     value={sq.supplierEmail}
//                     onChange={e => setSQField(sqIdx, 'supplierEmail', e.target.value)}
//                   />
//                 </Col>
//                 <Col span={4}>
//                   <Input
//                     size="small"
//                     placeholder="Delivery terms"
//                     value={sq.deliveryTerms}
//                     onChange={e => setSQField(sqIdx, 'deliveryTerms', e.target.value)}
//                   />
//                 </Col>
//                 <Col span={4}>
//                   <Input
//                     size="small"
//                     placeholder="Payment terms"
//                     value={sq.paymentTerms}
//                     onChange={e => setSQField(sqIdx, 'paymentTerms', e.target.value)}
//                   />
//                 </Col>
//                 <Col span={4}>
//                   <Input
//                     size="small"
//                     placeholder="Warranty"
//                     value={sq.warranty}
//                     onChange={e => setSQField(sqIdx, 'warranty', e.target.value)}
//                   />
//                 </Col>
//               </Row>

//               {/* Items table */}
//               <Table
//                 size="small"
//                 pagination={false}
//                 dataSource={sq.items || []}
//                 rowKey={(_, i) => i}
//                 columns={itemColumns(sqIdx)}
//                 footer={() => (
//                   <Row justify="space-between" align="middle">
//                     <Col>
//                       <Button size="small" type="dashed" icon={<PlusOutlined />} onClick={() => addItem(sqIdx)}>
//                         Add Item
//                       </Button>
//                     </Col>
//                     <Col>
//                       <Space>
//                         <Text type="secondary" style={{ fontSize: 11 }}>Grand Total:</Text>
//                         <Text strong>{sq.grandTotal.toLocaleString()}</Text>
//                         <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>Negotiated:</Text>
//                         <Text strong style={{ color: '#cc0000' }}>{sq.negotiatedGrandTotal.toLocaleString()}</Text>
//                       </Space>
//                     </Col>
//                   </Row>
//                 )}
//               />
//             </Card>
//           ))}

//           {/* ─── Award & Financials ─── */}
//           <Divider orientation="left">
//             <DollarOutlined /> Award &amp; Financials
//           </Divider>
//           <Row gutter={16}>
//             <Col span={6}>
//               <Form.Item name="awardedSupplierName" label="Awarded Supplier">
//                 <Select placeholder="Select awarded supplier" allowClear
//                   options={supplierQuotes
//                     .filter(sq => sq.supplierName?.trim())
//                     .map(sq => ({ label: sq.supplierName, value: sq.supplierName }))
//                   }
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={6}>
//               <Form.Item name="budget" label="Budget (XAF)">
//                 <InputNumber style={{ width: '100%' }} min={0}
//                   formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={v => v.replace(/,/g, '')} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item name="costSavings" label="Cost Savings">
//                 <InputNumber style={{ width: '100%' }} min={0}
//                   formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={v => v.replace(/,/g, '')} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item name="costAvoidance" label="Cost Avoidance">
//                 <InputNumber style={{ width: '100%' }} min={0}
//                   formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={v => v.replace(/,/g, '')} />
//               </Form.Item>
//             </Col>
//             <Col span={4}>
//               <Form.Item name="warranty" label="Warranty">
//                 <Input placeholder="e.g. 6 Months for Laptops" />
//               </Form.Item>
//             </Col>
//           </Row>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="deliveryTerms" label="Delivery Terms">
//                 <Input placeholder="e.g. 23rd and 24th March 2026" />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="paymentTerms" label="Payment Terms">
//                 <Input placeholder="e.g. 100% 30 days after delivery" />
//               </Form.Item>
//             </Col>
//           </Row>

//           {/* ─── Recommendations ─── */}
//           <Divider orientation="left">Recommendations</Divider>
//           <Form.Item name="technicalRecommendation" label="Technical Recommendation">
//             <TextArea rows={3} placeholder="Technical recommendation notes…" />
//           </Form.Item>
//           <Form.Item name="procurementRecommendation" label="Procurement Recommendation">
//             <TextArea
//               rows={3}
//               placeholder="The selected supplier meets the required specifications, offers good quality at the most competitive price, and meets delivery terms with a cost saving of XAF …"
//             />
//           </Form.Item>

//         </Form>
//       </Modal>

//     </div>
//   );
// };

// export default BuyerTenderManagement;