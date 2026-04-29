// BuyerPurchaseOrders.jsx — complete drop-in replacement
// Supports:
//   Path A — Create PO with an approved/awarded tender (existing flow)
//   Path B — Create PO without tender via signed-document justification
// NEW: Tax configuration + Budget Code fields added to both Create and Edit modals
import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
  Modal, Form, Input, Select, DatePicker, Progress, Tabs, Alert,
  Divider, Badge, message, Tooltip, Descriptions, Drawer, List,
  Avatar, Steps, notification, Spin, InputNumber, Popconfirm,
  Upload, Checkbox
} from 'antd';
import {
  FileTextOutlined, ShoppingCartOutlined, TruckOutlined, DollarOutlined,
  CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
  ExclamationCircleOutlined, UserOutlined, EditOutlined, EyeOutlined,
  DownloadOutlined, PrinterOutlined, MailOutlined, WarningOutlined,
  SyncOutlined, StopOutlined, ReloadOutlined, SendOutlined, PlusOutlined,
  DeleteOutlined, FileDoneOutlined, TrophyOutlined, FileZipOutlined,
  ShareAltOutlined, TeamOutlined, UploadOutlined, InfoCircleOutlined,
  ExceptionOutlined, TagOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';
import tenderAPI from '../../services/tenderAPI';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// ─────────────────────────────────────────────
// Status display helpers
// ─────────────────────────────────────────────
const PO_STATUS_MAP = {
  draft:                            { color:'default',  text:'Draft',            icon:<EditOutlined/> },
  pending_supply_chain_assignment:  { color:'orange',   text:'Pending SC',       icon:<ClockCircleOutlined/> },
  pending_department_approval:      { color:'orange',   text:'Dept Approval',    icon:<ClockCircleOutlined/> },
  pending_head_of_business_approval:{ color:'gold',     text:'Head Approval',    icon:<ClockCircleOutlined/> },
  pending_finance_approval:         { color:'blue',     text:'Finance Approval', icon:<ClockCircleOutlined/> },
  approved:                         { color:'blue',     text:'Approved',         icon:<CheckCircleOutlined/> },
  sent_to_supplier:                 { color:'purple',   text:'Sent to Supplier', icon:<MailOutlined/> },
  acknowledged:                     { color:'cyan',     text:'Acknowledged',     icon:<CheckCircleOutlined/> },
  in_production:                    { color:'geekblue', text:'In Production',    icon:<SyncOutlined/> },
  delivered:                        { color:'green',    text:'Delivered',        icon:<CheckCircleOutlined/> },
  completed:                        { color:'success',  text:'Completed',        icon:<CheckCircleOutlined/> },
  cancelled:                        { color:'red',      text:'Cancelled',        icon:<StopOutlined/> },
  on_hold:                          { color:'magenta',  text:'On Hold',          icon:<ExclamationCircleOutlined/> }
};

const getStatusTag = (status) => {
  const c = PO_STATUS_MAP[status] || { color:'default', text:status, icon:<FileTextOutlined/> };
  return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
};

const STAGE_LABELS = ['PO Created','Supplier Acknowledgment','Production/Preparation','Shipment','Delivery & Completion'];
const STAGE_IDX    = { created:0, supplier_acknowledgment:1, in_production:2, in_transit:3, completed:4 };

// ─────────────────────────────────────────────
// TenderSelectionBlock — used in Path A
// ─────────────────────────────────────────────
const TenderSelectionBlock = ({ tenders, loading, selectedId, onSelect, error }) => {
  const selected = tenders.find(t => t._id === selectedId);
  return (
    <div style={{ marginBottom:20 }}>
      <Alert
        message="An approved tender is linked to this PO"
        description="Select the tender that authorises this purchase."
        type="info" showIcon style={{ marginBottom:12 }}
      />
      <Text strong>Select Tender <span style={{ color:'#ff4d4f' }}>*</span></Text>
      <div style={{ marginTop:6 }}>
        {loading ? <Spin size="small" /> : tenders.length === 0 ? (
          <Alert message="No approved tenders available" type="warning" showIcon/>
        ) : (
          <Select style={{ width:'100%' }} placeholder="Select an approved / awarded tender"
            value={selectedId||undefined} status={error?'error':''} onChange={onSelect}
            showSearch optionLabelProp="label"
            filterOption={(input,opt)=>(opt.label||'').toLowerCase().includes(input.toLowerCase())}
          >
            {tenders.map(t=>(
              <Option key={t._id} value={t._id} label={`${t.tenderNumber} — ${t.title}`}>
                <div>
                  <Text strong>{t.tenderNumber}</Text> — {t.title}
                  {t.awardedSupplierName&&<Tag color="gold" icon={<TrophyOutlined/>} style={{ marginLeft:8 }}>{t.awardedSupplierName}</Tag>}
                  <Tag color={t.status==='awarded'?'gold':'green'} style={{ marginLeft:4 }}>{t.status}</Tag>
                  <br/>
                  <Text type="secondary" style={{ fontSize:11 }}>
                    Budget: XAF {(t.budget||0).toLocaleString()}
                    {t.itemCategory?` · ${t.itemCategory}`:''}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        )}
      </div>
      {error && <div style={{ color:'#ff4d4f', fontSize:12, marginTop:4 }}>Please select a tender</div>}
      {selected && (
        <Alert style={{ marginTop:10 }} type="success" showIcon
          message={<Space><Text strong>{selected.tenderNumber}</Text><Text>—</Text><Text>{selected.title}</Text>
            {selected.awardedSupplierName&&<Tag color="gold" icon={<TrophyOutlined/>}>{selected.awardedSupplierName}</Tag>}
          </Space>}
          description={`Budget: XAF ${(selected.budget||0).toLocaleString()}${selected.paymentTerms?` · ${selected.paymentTerms}`:''}`}
        />
      )}
      <Divider style={{ margin:'14px 0 4px' }}/>
    </div>
  );
};

// ─────────────────────────────────────────────
// JustificationBlock — used in Path B
// ─────────────────────────────────────────────
const JustificationBlock = ({ form, fileList, onFileChange }) => (
  <div style={{ marginBottom:20 }}>
    <Alert
      message="Special Case — No Tender"
      description="You are creating this PO without a tender. A manually-signed justification document is required. Upload the signed document and provide a reason below."
      type="warning" showIcon style={{ marginBottom:16 }}
      icon={<ExceptionOutlined/>}
    />

    <Form.Item
      name="documentName"
      label={<Space><FileTextOutlined/><span>Signed Document Name <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
      rules={[{ required:true, message:'Document name is required' }]}
      extra="Enter the name / reference of the manually-signed authorisation document"
    >
      <Input placeholder="e.g. Emergency Procurement Authorisation — April 2026" size="large"/>
    </Form.Item>

    <Form.Item
      name="justificationNote"
      label={<Space><ExclamationCircleOutlined/><span>Justification Note <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
      rules={[
        { required:true, message:'Justification note is required' },
        { min:20, message:'Please provide a detailed justification (minimum 20 characters)' }
      ]}
      extra="Explain clearly why this purchase is being made without a tender"
    >
      <TextArea
        rows={4}
        placeholder="Explain why no tender was raised for this purchase. Include urgency, supplier constraints, or management directive as applicable…"
        maxLength={1000}
        showCount
      />
    </Form.Item>

    <Form.Item
      name="justificationDocument"
      label={<Space><UploadOutlined/><span>Upload Signed Document <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
      rules={[{ required:true, message:'Please upload the signed justification document' }]}
      extra="Accepted: PDF, JPEG, PNG — max 10 MB"
    >
      <Dragger
        name="justificationDocument"
        fileList={fileList}
        beforeUpload={() => false}
        onChange={onFileChange}
        maxCount={1}
        accept=".pdf,.jpg,.jpeg,.png"
        style={{ padding:'10px 0' }}
      >
        <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize:32, color:'#fa8c16' }}/></p>
        <p className="ant-upload-text" style={{ fontSize:13 }}>
          Click or drag your signed document here
        </p>
        <p className="ant-upload-hint" style={{ fontSize:11 }}>
          PDF, JPEG or PNG · max 10 MB · 1 file only
        </p>
      </Dragger>
    </Form.Item>

    <Divider style={{ margin:'4px 0 14px' }}/>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
const BuyerPurchaseOrders = () => {
  // ── Data state ────────────────────────────────────────────────────────────
  const [purchaseOrders,  setPurchaseOrders]  = useState([]);
  const [tenders,         setTenders]         = useState([]);
  const [suppliers,       setSuppliers]       = useState([]);
  const [itemCategories,  setItemCategories]  = useState([]);
  // ─── NEW: budget codes state ───────────────────────────────────────────────
  const [budgetCodes,     setBudgetCodes]     = useState([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading,         setLoading]         = useState(false);
  const [tendersLoading,  setTendersLoading]  = useState(false);
  const [initialLoading,  setInitialLoading]  = useState(true);
  const [pdfLoading,      setPdfLoading]      = useState(false);
  const [activeTab,       setActiveTab]       = useState('all');

  // ── Modal flags ───────────────────────────────────────────────────────────
  const [createModalVisible,  setCreateModalVisible]  = useState(false);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editModalVisible,    setEditModalVisible]    = useState(false);
  const [sendModalVisible,    setSendModalVisible]    = useState(false);
  const [emailPDFModalVisible,setEmailPDFModalVisible]= useState(false);
  const [pathChoiceVisible,   setPathChoiceVisible]   = useState(false);

  // ── Selected / form state ─────────────────────────────────────────────────
  const [selectedPO,          setSelectedPO]          = useState(null);
  const [poCreationPath,      setPoCreationPath]       = useState('withTender');
  const [selectedTenderId,    setSelectedTenderId]     = useState(null);
  const [tenderError,         setTenderError]          = useState(false);
  const [isExternalSupplier,  setIsExternalSupplier]  = useState(false);
  const [justificationFile,   setJustificationFile]   = useState([]);

  const [createForm]    = Form.useForm();
  const [editForm]      = Form.useForm();
  const [sendForm]      = Form.useForm();
  const [emailPDFForm]  = Form.useForm();

  // ── Data loading ───────────────────────────────────────────────────────────
  const loadPurchaseOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await buyerRequisitionAPI.getPurchaseOrders();
      if (res.success && res.data) setPurchaseOrders(res.data);
    } catch { message.error('Error loading purchase orders'); }
    finally { setLoading(false); setInitialLoading(false); }
  }, []);

  const loadApprovedTenders = useCallback(async () => {
    setTendersLoading(true);
    try {
      const [ra, rw] = await Promise.all([
        tenderAPI.getTenders({ status:'approved' }),
        tenderAPI.getTenders({ status:'awarded'  })
      ]);
      const all = [
        ...(ra.success ? ra.data : []),
        ...(rw.success ? rw.data : [])
      ];
      setTenders(all.filter(t => !t.purchaseOrderId));
    } catch { message.warning('Could not load tenders'); }
    finally { setTendersLoading(false); }
  }, []);

  const loadSuppliers = useCallback(async () => {
    try {
      const res = await UnifiedSupplierAPI.getAllSuppliers({ status:'approved' });
      if (res.success && res.data) setSuppliers(res.data);
    } catch {}
  }, []);

  const loadItemCategories = useCallback(async () => {
    try {
      const res = await buyerRequisitionAPI.getItemCategories();
      if (res.success && res.data) setItemCategories(res.data);
    } catch {}
  }, []);

  // ─── NEW: load budget codes ────────────────────────────────────────────────
  const loadBudgetCodes = useCallback(async () => {
    try {
      const res = await buyerRequisitionAPI.getBudgetCodes();
      if (res.success && res.data) setBudgetCodes(res.data);
    } catch { message.warning('Could not load budget codes'); }
  }, []);

  useEffect(() => {
    Promise.all([
      loadPurchaseOrders(),
      loadApprovedTenders(),
      loadSuppliers(),
      loadItemCategories(),
      loadBudgetCodes(), // NEW
    ]);
  }, []);

  // ── Derived / filtered ─────────────────────────────────────────────────────
  const getFilteredPOs = () => {
    switch (activeTab) {
      case 'active':    return purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status));
      case 'overdue':   return purchaseOrders.filter(po =>
        moment(po.expectedDeliveryDate).isBefore(moment()) &&
        !['delivered','completed','cancelled'].includes(po.status));
      case 'delivered': return purchaseOrders.filter(po => ['delivered','completed'].includes(po.status));
      default:          return purchaseOrders;
    }
  };

  const stats = {
    total:      purchaseOrders.length,
    active:     purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status)).length,
    overdue:    purchaseOrders.filter(po =>
      moment(po.expectedDeliveryDate).isBefore(moment()) &&
      !['delivered','completed','cancelled'].includes(po.status)).length,
    totalValue: purchaseOrders.reduce((s, po) => s + (po.totalAmount||0), 0)
  };

  // ── Path selection ─────────────────────────────────────────────────────────
  const handleCreateNewPO = () => {
    setPathChoiceVisible(true);
  };

  const openCreateModal = (path) => {
    setPoCreationPath(path);
    setPathChoiceVisible(false);
    setSelectedTenderId(null);
    setTenderError(false);
    setIsExternalSupplier(false);
    setJustificationFile([]);
    createForm.resetFields();
    setCreateModalVisible(true);
  };

  // ── Helpers: build FormData for both paths ─────────────────────────────────
  const buildFormData = (values, extraFields = {}) => {
    const fd = new FormData();

    fd.append('supplierDetails', JSON.stringify(extraFields.supplierDetails || {}));
    fd.append('items',           JSON.stringify(values.items || []));
    fd.append('totalAmount',     String((values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s, 0)));
    fd.append('currency',        values.currency || 'XAF');

    // ─── NEW: tax fields ──────────────────────────────────────────────────────
    fd.append('taxApplicable',   String(values.taxApplicable || false));
    fd.append('taxRate',         String(values.taxRate       || 19.25));

    // ─── NEW: budget code ─────────────────────────────────────────────────────
    if (values.budgetCodeId) {
      fd.append('budgetCodeId', values.budgetCodeId);
    }

    fd.append('deliveryAddress',     values.deliveryAddress     || '');
    if (values.expectedDeliveryDate)
      fd.append('expectedDeliveryDate', values.expectedDeliveryDate.endOf('day').toISOString());
    fd.append('paymentTerms',        values.paymentTerms        || '');
    fd.append('specialInstructions', values.specialInstructions || '');
    fd.append('notes',               values.notes               || '');

    if (poCreationPath === 'withTender') {
      fd.append('tenderId',     extraFields.tenderId     || '');
      fd.append('tenderNumber', extraFields.tenderNumber || '');
    } else {
      fd.append('documentName',      values.documentName      || '');
      fd.append('justificationNote', values.justificationNote || '');
      if (justificationFile.length > 0 && justificationFile[0].originFileObj) {
        fd.append('justificationDocument', justificationFile[0].originFileObj);
      }
    }

    return fd;
  };

  // ── Resolve supplier details ───────────────────────────────────────────────
  const resolveSupplierDetails = (values) => {
    if (isExternalSupplier) {
      return {
        name:       values.externalSupplierName  || '',
        email:      values.externalSupplierEmail || '',
        phone:      values.externalSupplierPhone || '',
        address:    values.externalSupplierAddress || '',
        isExternal: true
      };
    }
    const sup = suppliers.find(s => s._id === values.supplierId);
    if (!sup) return null;
    const addr = sup.supplierDetails?.address;
    return {
      id:         sup._id,
      name:       sup.supplierDetails?.companyName || sup.fullName || '',
      email:      sup.email || '',
      phone:      sup.phoneNumber || sup.supplierDetails?.phoneNumber || '',
      address:    typeof addr === 'object'
        ? `${addr.street||''}, ${addr.city||''}, ${addr.state||''}`.replace(/^,|,$/g,'').trim()
        : addr || '',
      isExternal: false
    };
  };

  // ── Create PO ──────────────────────────────────────────────────────────────
  const handleCreatePO = async () => {
    try {
      const values = await createForm.validateFields();

      if (poCreationPath === 'withTender' && !selectedTenderId) {
        setTenderError(true);
        message.error('Please select a tender');
        return;
      }

      if (poCreationPath === 'withoutTender' && justificationFile.length === 0) {
        message.error('Please upload the signed justification document');
        return;
      }

      const supplierDetails = resolveSupplierDetails(values);
      if (!supplierDetails) { message.error('Please select a supplier'); return; }

      // ─── NEW: budget code validation ───────────────────────────────────────
      if (values.budgetCodeId) {
        const selectedBudgetCode = budgetCodes.find(bc => bc._id === values.budgetCodeId);
        if (selectedBudgetCode) {
          const itemsTotal = (values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s, 0);
          const availableBalance = selectedBudgetCode.remaining || (selectedBudgetCode.budget - selectedBudgetCode.used);
          if (itemsTotal > availableBalance) {
            message.error(
              `Insufficient budget. Available: ${buyerRequisitionAPI.formatCurrency
                ? buyerRequisitionAPI.formatCurrency(availableBalance)
                : availableBalance.toLocaleString()
              }, Required: ${itemsTotal.toLocaleString()}`
            );
            return;
          }
        }
      }

      setLoading(true);

      let extraFields = { supplierDetails };
      if (poCreationPath === 'withTender') {
        const t = tenders.find(t => t._id === selectedTenderId);
        extraFields.tenderId     = selectedTenderId;
        extraFields.tenderNumber = t?.tenderNumber;
      }

      const fd = buildFormData(values, extraFields);

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiUrl}/buyer/purchase-orders`, {
        method:  'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body:    fd
      });
      const data = await res.json();

      if (data.success) {
        message.success('Purchase order created successfully');

        // ─── NEW: refresh budget codes after creation ──────────────────────────
        if (values.budgetCodeId) {
          try {
            await buyerRequisitionAPI.updateBudgetCodeBalance?.(values.budgetCodeId, 
              (values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s,0)
            );
          } catch { /* non-fatal */ }
          await loadBudgetCodes();
        }

        notification.success({
          message:     'Purchase Order Created',
          description: poCreationPath === 'withoutTender'
            ? `${data.data.poNumber} created with justification — sent to Supply Chain.`
            : `${data.data.poNumber} linked to tender ${extraFields.tenderNumber}.`,
          duration: 6
        });
        setCreateModalVisible(false);
        createForm.resetFields();
        setSelectedTenderId(null);
        setJustificationFile([]);
        setIsExternalSupplier(false);
        await Promise.all([loadPurchaseOrders(), loadApprovedTenders()]);
      } else {
        message.error(data.message || 'Failed to create purchase order');
      }
    } catch (e) {
      if (e?.errorFields) message.error('Please fill all required fields');
      else { console.error(e); message.error('Error creating purchase order'); }
    } finally {
      setLoading(false);
    }
  };

  // ── Other PO actions ──────────────────────────────────────────────────────
  const handleViewDetails = async (po) => {
    setLoading(true);
    try {
      const res = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
      if (res.success && res.data) { setSelectedPO(res.data.purchaseOrder); setDetailDrawerVisible(true); }
      else message.error('Failed to load PO details');
    } catch { message.error('Error loading PO details'); }
    finally { setLoading(false); }
  };

  const handleEditPO = (po) => {
    setSelectedPO(po);
    editForm.setFieldsValue({
      expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
      deliveryAddress:      po.deliveryAddress,
      paymentTerms:         po.paymentTerms,
      specialInstructions:  po.specialInstructions || '',
      notes:                po.notes              || '',
      currency:             po.currency           || 'XAF',
      // ─── NEW: pre-fill tax fields ────────────────────────────────────────────
      taxApplicable:        po.taxApplicable       || false,
      taxRate:              po.taxRate             || 19.25,
      items: (po.items||[]).map(item => ({
        description:   item.description,
        quantity:      item.quantity,
        unitPrice:     item.unitPrice,
        unitOfMeasure: item.unitOfMeasure || 'Units',
        category:      item.category     || '',
        specifications:item.specifications|| '',
        ...(item.itemId ? { itemId:item.itemId } : {})
      }))
    });
    setEditModalVisible(true);
  };

  const handleUpdatePO = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      const total = (values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s,0);
      const res = await buyerRequisitionAPI.updatePurchaseOrder(selectedPO.id, {
        ...values,
        totalAmount:         total,
        expectedDeliveryDate:values.expectedDeliveryDate?.endOf('day').toISOString(),
        // ─── NEW: include tax in update payload ────────────────────────────────
        taxApplicable:       values.taxApplicable || false,
        taxRate:             values.taxRate        || 19.25,
        items: (values.items||[]).map(item => ({
          ...item, totalPrice:(Number(item.quantity)||0)*(Number(item.unitPrice)||0)
        }))
      });
      if (res.success) {
        message.success('PO updated');
        notification.success({
          message: 'Purchase Order Updated',
          description: `PO ${selectedPO.poNumber} updated. New total: ${values.currency} ${total.toLocaleString()}`,
          duration: 5
        });
        setEditModalVisible(false);
        editForm.resetFields();
        loadPurchaseOrders();
      } else message.error(res.message || 'Failed to update');
    } catch { message.error('Error updating PO'); }
    finally { setLoading(false); }
  };

  const handleSendToSupplyChain = async (po) => {
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body:   JSON.stringify({ status:'pending_supply_chain_assignment' })
      });
      const data = await res.json();
      if (data.success) { message.success('PO sent to Supply Chain'); loadPurchaseOrders(); }
      else throw new Error(data.message);
    } catch (e) { message.error(e.message || 'Failed to send to Supply Chain'); }
    finally { setLoading(false); }
  };

  const handleSendPO = (po) => {
    setSelectedPO(po);
    sendForm.resetFields();
    setSendModalVisible(true);
  };

  const handleSendPOToSupplier = async () => {
    try {
      const values = await sendForm.validateFields();
      setLoading(true);
      const res = await buyerRequisitionAPI.sendPurchaseOrderToSupplier(selectedPO.id, { message:values.message });
      if (res.success) {
        message.success('PO sent to supplier');
        setSendModalVisible(false);
        sendForm.resetFields();
        loadPurchaseOrders();
      } else message.error(res.message || 'Failed to send');
    } catch { message.error('Error sending PO'); }
    finally { setLoading(false); }
  };

  const handleCancelPO = (po) => {
    let reason = '';
    Modal.confirm({
      title:    `Cancel PO ${po.poNumber}?`,
      okText:   'Cancel PO', okType:'danger',
      content: (
        <div>
          <p>This cannot be undone.</p>
          <TextArea placeholder="Reason for cancellation…" rows={3} style={{ marginTop:12 }}
            onChange={e=>{ reason = e.target.value; }}/>
        </div>
      ),
      onOk: async () => {
        if (!reason.trim()) { message.error('Please provide a reason'); return; }
        setLoading(true);
        try {
          const res = await buyerRequisitionAPI.cancelPurchaseOrder(po.id, { cancellationReason:reason.trim() });
          if (res.success) { message.success(`PO ${po.poNumber} cancelled`); loadPurchaseOrders(); }
          else message.error(res.message || 'Failed to cancel');
        } catch { message.error('Error cancelling PO'); }
        finally { setLoading(false); }
      }
    });
  };

  const handleDownloadPDF = async (po) => {
    setPdfLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res  = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/download-pdf`, {
        headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) throw new Error((await res.json()).message || 'Failed');
      const blob = await res.blob();
      const a    = document.createElement('a');
      a.href     = window.URL.createObjectURL(blob);
      a.download = `PO_${po.poNumber}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      message.success('PDF downloaded');
    } catch (e) { message.error(e.message || 'Failed to download PDF'); }
    finally { setPdfLoading(false); }
  };

  const handleEmailPDF = (po) => {
    setSelectedPO(po);
    emailPDFForm.resetFields();
    emailPDFForm.setFieldsValue({ emailTo:po.supplierEmail });
    setEmailPDFModalVisible(true);
  };

  const handleSendEmailPDF = async () => {
    try {
      const values = await emailPDFForm.validateFields();
      setPdfLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const res  = await fetch(`${apiUrl}/buyer/purchase-orders/${selectedPO.id}/email-pdf`, {
        method: 'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
        body:   JSON.stringify(values)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
      message.success(`PDF emailed to ${values.emailTo}`);
      setEmailPDFModalVisible(false);
    } catch (e) { message.error(e.message || 'Failed to send PDF email'); }
    finally { setPdfLoading(false); }
  };

  // ── Table columns ──────────────────────────────────────────────────────────
  const columns = [
    {
      title:'PO Details', key:'details',
      render:(_,r)=>(
        <div>
          <Text strong>{r.poNumber||r.id}</Text><br/>
          <Text type="secondary" style={{ fontSize:11 }}>{moment(r.creationDate).format('MMM DD, HH:mm')}</Text>
          {r.tenderNumber&&(
            <><br/><Tag color="purple" style={{ fontSize:10 }} icon={<FileDoneOutlined/>}>{r.tenderNumber}</Tag></>
          )}
          {r.createdWithoutTender&&(
            <><br/><Tag color="orange" icon={<ExceptionOutlined/>} style={{ fontSize:10 }}>No Tender — Justified</Tag></>
          )}
        </div>
      ), width:160
    },
    {
      title:'Supplier', key:'supplier',
      render:(_,r)=>(
        <div>
          <Text strong>{r.supplierName}</Text><br/>
          <Text type="secondary" style={{ fontSize:11 }}>{r.supplierEmail}</Text>
        </div>
      ), width:180
    },
    {
      title:'Amount', key:'amount',
      render:(_,r)=><Text strong style={{ color:'#1890ff', fontSize:15 }}>{r.currency} {r.totalAmount?.toLocaleString()}</Text>,
      width:130, sorter:(a,b)=>(a.totalAmount||0)-(b.totalAmount||0)
    },
    {
      title:'Progress', key:'progress',
      render:(_,r)=>(
        <div>
          <Progress percent={r.progress||0} size="small" status={r.status==='cancelled'?'exception':'active'}/>
          <Text type="secondary" style={{ fontSize:11 }}>{STAGE_LABELS[STAGE_IDX[r.currentStage]]||'Created'}</Text>
        </div>
      ), width:150
    },
    {
      title:'Delivery', key:'delivery',
      render:(_,r)=>{
        if (!r.expectedDeliveryDate) return <Text type="secondary">—</Text>;
        const overdue = moment(r.expectedDeliveryDate).isBefore(moment()) && !['delivered','completed','cancelled'].includes(r.status);
        const days    = moment(r.expectedDeliveryDate).diff(moment(),'days');
        return (
          <div>
            <Text type={overdue?'danger':'default'}>{moment(r.expectedDeliveryDate).format('MMM DD')}</Text><br/>
            <Text type="secondary" style={{ fontSize:11 }}>
              {overdue ? `${Math.abs(days)}d overdue` : days===0?'Today':days>0?`${days}d left`:'Delivered'}
            </Text>
            {overdue&&<ExclamationCircleOutlined style={{ color:'#ff4d4f', marginLeft:4 }}/>}
          </div>
        );
      }, width:110
    },
    {
      title:'Status', dataIndex:'status', key:'status',
      render:s=>getStatusTag(s), width:155
    },
    {
      title:'Actions', key:'actions', width:200, fixed:'right',
      render:(_,r)=>(
        <Space size={4} direction="vertical">
          <Space size={4}>
            <Tooltip title="View"><Button size="small" icon={<EyeOutlined/>} onClick={()=>handleViewDetails(r)}/></Tooltip>
            {r.status==='draft'&&<Tooltip title="Send to Supply Chain"><Button size="small" type="primary" icon={<SendOutlined/>} onClick={()=>handleSendToSupplyChain(r)}/></Tooltip>}
            {r.status==='approved'&&<Tooltip title="Send to Supplier"><Button size="small" type="primary" icon={<SendOutlined/>} onClick={()=>handleSendPO(r)}/></Tooltip>}
            {!['delivered','completed','cancelled','pending_supply_chain_assignment'].includes(r.status)&&(
              <Tooltip title="Edit"><Button size="small" icon={<EditOutlined/>} onClick={()=>handleEditPO(r)}/></Tooltip>
            )}
          </Space>
          <Space size={4}>
            <Tooltip title="Download PDF"><Button size="small" icon={<DownloadOutlined/>} loading={pdfLoading} onClick={()=>handleDownloadPDF(r)}/></Tooltip>
            <Tooltip title="Email PDF"><Button size="small" icon={<ShareAltOutlined/>} onClick={()=>handleEmailPDF(r)}/></Tooltip>
            {!['delivered','completed','cancelled'].includes(r.status)&&(
              <Tooltip title="Cancel"><Button size="small" danger icon={<StopOutlined/>} onClick={()=>handleCancelPO(r)}/></Tooltip>
            )}
          </Space>
        </Space>
      )
    }
  ];

  if (initialLoading) return (
    <div style={{ padding:24, textAlign:'center' }}><Spin size="large"/></div>
  );

  // ─────────────────────────────────────────────
  // Items form fields (shared by both paths)
  // ─────────────────────────────────────────────
  const ItemsFormList = ({ formInstance }) => (
    <Form.List name="items" rules={[{ validator:async(_,v)=>{ if(!v||v.length<1) return Promise.reject('At least one item required'); } }]}>
      {(fields,{add,remove},{errors})=>(
        <>
          {fields.map(({key,name,...rest})=>(
            <Card key={key} size="small" style={{ marginBottom:10, borderLeft:'3px solid #1890ff' }}
              title={`Item ${name+1}`}
              extra={fields.length>1?<Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>remove(name)}>Remove</Button>:null}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item {...rest} name={[name,'description']} label="Description" rules={[{required:true}]}>
                    <Input placeholder="Item description"/>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...rest} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}>
                    <InputNumber min={1} style={{ width:'100%' }}/>
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item {...rest} name={[name,'unitPrice']} label="Unit Price" rules={[{required:true}]}>
                    <InputNumber min={0} style={{ width:'100%' }}
                      formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item {...rest} name={[name,'unitOfMeasure']} label="Unit of Measure">
                    <Select placeholder="Unit" allowClear>
                      {['Pieces','Sets','Boxes','Packs','Units','Each','Kg','Litres','Meters'].map(u=><Option key={u} value={u}>{u}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...rest} name={[name,'category']} label="Category">
                    <Select placeholder="Category" allowClear>
                      {itemCategories.map(c=><Option key={c} value={c}>{c}</Option>)}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item {...rest} name={[name,'specifications']} label="Specifications">
                    <Input placeholder="Optional"/>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          ))}
          <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Add Item</Button>
          <Form.ErrorList errors={errors}/>
        </>
      )}
    </Form.List>
  );

  // ─────────────────────────────────────────────
  // Reusable Tax Configuration block
  // ─────────────────────────────────────────────
  const TaxConfigBlock = () => (
    <>
      <Divider orientation="left">Tax Configuration</Divider>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="taxApplicable"
            label=" "
            valuePropName="checked"
            initialValue={false}
          >
            <Checkbox>Apply tax to this purchase order</Checkbox>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="taxRate"
            label="Tax Rate (%)"
            initialValue={19.25}
            dependencies={['taxApplicable']}
          >
            <InputNumber
              min={0} max={100} precision={2}
              style={{ width:'100%' }}
              addonAfter="%"
              placeholder="19.25"
            />
          </Form.Item>
        </Col>
      </Row>
    </>
  );

  // ─────────────────────────────────────────────
  // Reusable Budget Code select block
  // ─────────────────────────────────────────────
  const BudgetCodeSelect = () => (
    <Form.Item
      name="budgetCodeId"
      label={
        <Space>
          Budget Code (Optional)
          {budgetCodes.length > 0 && (
            <Tag color="blue" icon={<TagOutlined/>} style={{ fontSize:11 }}>
              {budgetCodes.length} available
            </Tag>
          )}
        </Space>
      }
    >
      <Select
        placeholder="Select budget code"
        allowClear
        showSearch
        notFoundContent={budgetCodes.length === 0 ? <Spin size="small" /> : 'No budget codes found'}
        optionFilterProp="children"
      >
        {budgetCodes.map(bc => {
          const available = bc.remaining ?? (bc.budget - bc.used);
          const utilPct   = bc.budget > 0 ? (bc.used / bc.budget) * 100 : 0;
          return (
            <Option key={bc._id} value={bc._id}>
              <div>
                <div style={{ fontWeight:'bold' }}>{bc.code} — {bc.name}</div>
                <div style={{ fontSize:12, color:'#666' }}>
                  Available: {available?.toLocaleString()} / {bc.budget?.toLocaleString()}
                </div>
                <div style={{ fontSize:11, color: utilPct > 80 ? '#ff4d4f' : '#52c41a' }}>
                  Utilisation: {utilPct.toFixed(1)}%
                </div>
              </div>
            </Option>
          );
        })}
      </Select>
    </Form.Item>
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div style={{ padding:24 }}>
      <Card>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <Title level={3} style={{ margin:0 }}><FileTextOutlined style={{ marginRight:8 }}/>Purchase Order Management</Title>
            <Text type="secondary">POs require an approved tender — or a signed justification for special cases</Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined/>} onClick={loadPurchaseOrders} loading={loading}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined/>} onClick={handleCreateNewPO}>Create New PO</Button>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={16} style={{ marginBottom:24 }}>
          <Col span={5}><Statistic title="Total POs"   value={stats.total}   valueStyle={{ color:'#1890ff' }}/></Col>
          <Col span={5}><Statistic title="Active"      value={stats.active}  valueStyle={{ color:'#faad14' }}/></Col>
          <Col span={5}><Statistic title="Overdue"     value={stats.overdue} valueStyle={{ color:'#ff4d4f' }}/></Col>
          <Col span={5}><Statistic title="Total Value" value={`${(stats.totalValue/1000000).toFixed(1)}M`} suffix="XAF" valueStyle={{ color:'#13c2c2' }}/></Col>
          <Col span={4}>
            <Card size="small" style={{ background:tenders.length>0?'#f6ffed':'#fff1f0', border:`1px solid ${tenders.length>0?'#b7eb8f':'#ffa39e'}` }}>
              <div style={{ fontSize:12 }}>
                <FileDoneOutlined style={{ marginRight:6, color:tenders.length>0?'#52c41a':'#ff4d4f' }}/>
                <Text strong style={{ color:tenders.length>0?'#52c41a':'#ff4d4f' }}>
                  {tenders.length} tender{tenders.length!==1?'s':''} available
                </Text>
              </div>
            </Card>
          </Col>
        </Row>

        {stats.overdue>0&&(
          <Alert message={`${stats.overdue} Purchase Order${stats.overdue!==1?'s':''} Overdue`}
            type="error" showIcon style={{ marginBottom:16 }}
            action={<Button size="small" danger onClick={()=>setActiveTab('overdue')}>View Overdue</Button>}
          />
        )}

        <Tabs activeKey={activeTab} onChange={setActiveTab}
          items={[
            { key:'all',       label:`All (${stats.total})` },
            { key:'active',    label:`Active (${stats.active})` },
            { key:'overdue',   label:<Badge count={stats.overdue} size="small"><span style={{ paddingRight:stats.overdue>0?16:0 }}>Overdue</span></Badge> },
            { key:'delivered', label:'Delivered' }
          ]}
        />
        <Table columns={columns} dataSource={getFilteredPOs()} rowKey="id"
          loading={loading} pagination={{ pageSize:10 }} scroll={{ x:'max-content' }}
        />
      </Card>

      {/* ══════════════════════════════════════════
          PATH CHOICE MODAL
      ══════════════════════════════════════════ */}
      <Modal
        title={<Space><PlusOutlined/>Create New Purchase Order</Space>}
        open={pathChoiceVisible}
        onCancel={()=>setPathChoiceVisible(false)}
        footer={null}
        width={600}
      >
        <Paragraph style={{ color:'#666', marginBottom:24 }}>
          How would you like to proceed?
        </Paragraph>
        <Row gutter={16}>
          <Col span={12}>
            <Card
              hoverable
              style={{ textAlign:'center', border:'2px solid #91caff', cursor:'pointer' }}
              onClick={()=>openCreateModal('withTender')}
            >
              <FileDoneOutlined style={{ fontSize:36, color:'#1890ff', marginBottom:12 }}/>
              <div><Text strong style={{ fontSize:15 }}>Create with Tender</Text></div>
              <div style={{ marginTop:8 }}>
                <Text type="secondary" style={{ fontSize:12 }}>
                  Standard path — links this PO to an approved or awarded tender.
                </Text>
              </div>
              {tenders.length > 0
                ? <Tag color="green" style={{ marginTop:12 }}>{tenders.length} tender{tenders.length!==1?'s':''} available</Tag>
                : <Tag color="orange" style={{ marginTop:12 }}>No approved tenders yet</Tag>
              }
            </Card>
          </Col>
          <Col span={12}>
            <Card
              hoverable
              style={{ textAlign:'center', border:'2px solid #ffd591', cursor:'pointer' }}
              onClick={()=>openCreateModal('withoutTender')}
            >
              <ExceptionOutlined style={{ fontSize:36, color:'#fa8c16', marginBottom:12 }}/>
              <div><Text strong style={{ fontSize:15 }}>Create without Tender</Text></div>
              <div style={{ marginTop:8 }}>
                <Text type="secondary" style={{ fontSize:12 }}>
                  Special case — requires a manually-signed justification document and a reason.
                </Text>
              </div>
              <Tag color="orange" style={{ marginTop:12 }}>Justification required</Tag>
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* ══════════════════════════════════════════
          CREATE PO MODAL
      ══════════════════════════════════════════ */}
      <Modal
        title={
          <Space>
            <PlusOutlined/>
            {poCreationPath==='withTender' ? (
              <><span>Create PO</span><Tag color="blue" icon={<FileDoneOutlined/>}>With Tender</Tag></>
            ) : (
              <><span>Create PO</span><Tag color="orange" icon={<ExceptionOutlined/>}>Special Case — Justification Required</Tag></>
            )}
          </Space>
        }
        open={createModalVisible}
        onOk={handleCreatePO}
        onCancel={()=>{
          setCreateModalVisible(false);
          setSelectedTenderId(null);
          setTenderError(false);
          setIsExternalSupplier(false);
          setJustificationFile([]);
          createForm.resetFields();
        }}
        confirmLoading={loading}
        width={1100}
        maskClosable={false}
        style={{ top:20 }}
        styles={{ body:{ maxHeight:'82vh', overflowY:'auto' } }}
        destroyOnClose
      >
        <Form form={createForm} layout="vertical" initialValues={{ currency:'XAF', taxApplicable:false, taxRate:19.25, items:[{}] }}>

          {/* ── Path A: Tender selection ── */}
          {poCreationPath === 'withTender' && (
            <TenderSelectionBlock
              tenders={tenders}
              loading={tendersLoading}
              selectedId={selectedTenderId}
              onSelect={(v)=>{ setSelectedTenderId(v); setTenderError(false); }}
              error={tenderError}
            />
          )}

          {/* ── Path B: Justification ── */}
          {poCreationPath === 'withoutTender' && (
            <JustificationBlock
              form={createForm}
              fileList={justificationFile}
              onFileChange={({ fileList }) => setJustificationFile(fileList.slice(-1))}
            />
          )}

          {/* ── Supplier ── */}
          <Divider orientation="left">Supplier</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="supplierType" label="Supplier Type" initialValue="registered" rules={[{required:true}]}>
                <Select onChange={v=>{ setIsExternalSupplier(v==='external'); createForm.setFieldsValue({ supplierId:undefined }); }}>
                  <Option value="registered">Registered Supplier</Option>
                  <Option value="external">External / New Supplier</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="currency" label="Currency" initialValue="XAF" rules={[{required:true}]}>
                <Select>
                  <Option value="XAF">XAF (Central African Franc)</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!isExternalSupplier ? (
            <Form.Item name="supplierId" label="Select Registered Supplier" rules={[{required:!isExternalSupplier,message:'Please select a supplier'}]}>
              <Select placeholder="Search supplier" showSearch optionLabelProp="label"
                filterOption={(input,opt)=>{
                  const s=suppliers.find(s=>s._id===opt.value);
                  if(!s)return false;
                  return `${s.supplierDetails?.companyName||''} ${s.email||''}`.toLowerCase().includes(input.toLowerCase());
                }}>
                {suppliers.map(s=>(
                  <Option key={s._id} value={s._id} label={s.supplierDetails?.companyName||s.email}>
                    <div><Text strong>{s.supplierDetails?.companyName||'Unnamed'}</Text><br/>
                      <Text type="secondary" style={{ fontSize:11 }}>{s.email}</Text></div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <Row gutter={16}>
              <Col span={12}><Form.Item name="externalSupplierName"    label="Supplier Name"  rules={[{required:true}]}><Input/></Form.Item></Col>
              <Col span={12}><Form.Item name="externalSupplierEmail"   label="Email"          rules={[{required:true},{type:'email'}]}><Input/></Form.Item></Col>
              <Col span={12}><Form.Item name="externalSupplierPhone"   label="Phone"><Input/></Form.Item></Col>
              <Col span={12}><Form.Item name="externalSupplierAddress" label="Address"><Input/></Form.Item></Col>
            </Row>
          )}

          {/* ── Items ── */}
          <Divider orientation="left">Items</Divider>
          <ItemsFormList formInstance={createForm}/>

          {/* ── Delivery & Payment ── */}
          <Divider orientation="left">Delivery &amp; Payment</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date"
                initialValue={moment().add(14,'days')} rules={[{required:true}]}>
                <DatePicker style={{ width:'100%' }} disabledDate={c=>c&&c<moment().startOf('day')}/>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentTerms" label="Payment Terms" rules={[{required:true}]}>
                <Select placeholder="Select payment terms">
                  {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t=><Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            {/* ─── NEW: Budget Code in the 3rd column ─────────────────────────── */}
            <Col span={8}>
              <BudgetCodeSelect/>
            </Col>
          </Row>

          <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{required:true}]}>
            <TextArea rows={2} placeholder="Full delivery address…"/>
          </Form.Item>
          <Form.Item name="specialInstructions" label="Special Instructions">
            <TextArea rows={2} placeholder="Special instructions for the supplier…"/>
          </Form.Item>

          {/* ─── NEW: Tax Configuration ──────────────────────────────────────── */}
          <TaxConfigBlock/>

          <Form.Item name="notes" label="Internal Notes">
            <TextArea rows={2} placeholder="Internal notes (not sent to supplier)…"/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ EDIT PO MODAL ══ */}
      <Modal
        title={`Edit PO — ${selectedPO?.poNumber}`}
        open={editModalVisible}
        onOk={handleUpdatePO}
        onCancel={()=>{ setEditModalVisible(false); editForm.resetFields(); }}
        confirmLoading={loading} width={1000} destroyOnClose
      >
        <Form form={editForm} layout="vertical">
          <Alert
            message="Edit Purchase Order"
            description={`Status: ${selectedPO?.status}. You can edit all order details except supplier information.`}
            type="info" showIcon style={{ marginBottom:24 }}
          />

          <Divider orientation="left">Order Details</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date" rules={[{required:true}]}>
                <DatePicker style={{ width:'100%' }} disabledDate={c=>c&&c<moment().startOf('day')}/>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="paymentTerms" label="Payment Terms" rules={[{required:true}]}>
                <Select>
                  {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t=><Option key={t} value={t}>{t}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="currency" label="Currency" rules={[{required:true}]}>
                <Select>
                  <Option value="XAF">XAF (Central African Franc)</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{required:true}]}>
            <TextArea rows={2}/>
          </Form.Item>

          <Divider orientation="left">Items</Divider>
          <Form.List name="items">
            {(fields,{add,remove})=>(
              <>
                {fields.map(({key,name,...rest})=>(
                  <Card key={key} size="small" style={{ marginBottom:10 }} title={`Item ${name+1}`}
                    extra={fields.length>1?<Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>remove(name)}>Remove</Button>:null}>
                    <Row gutter={16}>
                      <Col span={12}><Form.Item {...rest} name={[name,'description']} label="Description" rules={[{required:true}]}><Input/></Form.Item></Col>
                      <Col span={6}><Form.Item {...rest} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}><InputNumber min={1} style={{ width:'100%' }}/></Form.Item></Col>
                      <Col span={6}><Form.Item {...rest} name={[name,'unitPrice']} label="Unit Price" rules={[{required:true}]}><InputNumber min={0} style={{ width:'100%' }} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item {...rest} name={[name,'unitOfMeasure']} label="Unit of Measure">
                          <Select placeholder="Select unit" allowClear>
                            {['Pieces','Sets','Boxes','Packs','Units','Each','Kg','Litres','Meters'].map(u=><Option key={u} value={u}>{u}</Option>)}
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item {...rest} name={[name,'specifications']} label="Specifications">
                          <Input placeholder="Optional"/>
                        </Form.Item>
                      </Col>
                    </Row>
                    <Form.Item {...rest} name={[name,'itemId']} hidden><Input/></Form.Item>
                  </Card>
                ))}
                <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Add Item</Button>
              </>
            )}
          </Form.List>

          {/* ─── NEW: Tax Configuration in Edit modal ──────────────────────── */}
          <TaxConfigBlock/>

          <Divider orientation="left">Additional Information</Divider>
          <Form.Item name="specialInstructions" label="Special Instructions"><TextArea rows={2}/></Form.Item>
          <Form.Item name="notes" label="Internal Notes"><TextArea rows={2}/></Form.Item>

          <Alert
            message="Important Note"
            description="Changes to items will recalculate the total amount. Tax is applied on top of the subtotal when enabled."
            type="warning" showIcon style={{ marginTop:16 }}
          />
        </Form>
      </Modal>

      {/* ══ SEND TO SUPPLIER MODAL ══ */}
      <Modal
        title={`Send PO to Supplier — ${selectedPO?.poNumber}`}
        open={sendModalVisible}
        onOk={handleSendPOToSupplier}
        onCancel={()=>setSendModalVisible(false)}
        confirmLoading={loading} width={560}
      >
        <Alert message={`Will be emailed to ${selectedPO?.supplierName} at ${selectedPO?.supplierEmail}`} type="info" showIcon style={{ marginBottom:16 }}/>
        <Form form={sendForm} layout="vertical">
          <Form.Item name="message" label="Additional Message (Optional)">
            <TextArea rows={4} maxLength={1000} showCount/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ EMAIL PDF MODAL ══ */}
      <Modal
        title={<Space><ShareAltOutlined/>Email PDF — {selectedPO?.poNumber}</Space>}
        open={emailPDFModalVisible}
        onOk={handleSendEmailPDF}
        onCancel={()=>setEmailPDFModalVisible(false)}
        confirmLoading={pdfLoading} width={560}
      >
        <Form form={emailPDFForm} layout="vertical">
          <Form.Item name="emailTo" label="Recipient Email" rules={[{required:true},{type:'email'}]}>
            <Input prefix={<MailOutlined/>} placeholder="recipient@email.com"/>
          </Form.Item>
          <Form.Item name="message" label="Message (Optional)">
            <TextArea rows={3} maxLength={1000} showCount/>
          </Form.Item>
        </Form>
      </Modal>

      {/* ══ DETAIL DRAWER ══ */}
      <Drawer
        title={<Space><FileTextOutlined/>PO Details — {selectedPO?.poNumber}</Space>}
        placement="right" width={860}
        open={detailDrawerVisible}
        onClose={()=>setDetailDrawerVisible(false)}
      >
        {selectedPO && (
          <div>
            {selectedPO.createdWithoutTender && selectedPO.tenderJustification && (
              <Alert
                style={{ marginBottom:12 }}
                type="warning"
                showIcon
                icon={<ExceptionOutlined/>}
                message="Created Without Tender — Justification on File"
                description={
                  <div>
                    <div><Text strong>Document: </Text>{selectedPO.tenderJustification.documentName}</div>
                    <div style={{ marginTop:4 }}><Text strong>Reason: </Text>{selectedPO.tenderJustification.justificationNote}</div>
                    {selectedPO.tenderJustification.signedDocument?.url && (
                      <div style={{ marginTop:6 }}>
                        <Button size="small" icon={<DownloadOutlined/>} type="link"
                          onClick={()=>window.open(selectedPO.tenderJustification.signedDocument.url,'_blank')}>
                          View Signed Document
                        </Button>
                      </div>
                    )}
                  </div>
                }
              />
            )}

            <Card size="small" style={{ marginBottom:12 }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="PO Number"><Text code strong>{selectedPO.poNumber}</Text></Descriptions.Item>
                <Descriptions.Item label="Status">{getStatusTag(selectedPO.status)}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
                <Descriptions.Item label="Email">{selectedPO.supplierEmail}</Descriptions.Item>
                <Descriptions.Item label="Amount">
                  <Text strong style={{ color:'#1890ff', fontSize:16 }}>
                    {selectedPO.currency} {selectedPO.totalAmount?.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Terms">{selectedPO.paymentTerms}</Descriptions.Item>
                <Descriptions.Item label="Delivery">{selectedPO.deliveryAddress}</Descriptions.Item>
                <Descriptions.Item label="Expected">{selectedPO.expectedDeliveryDate?moment(selectedPO.expectedDeliveryDate).format('DD MMM YYYY'):'—'}</Descriptions.Item>
                {/* ─── NEW: tax info in drawer ──────────────────────────────── */}
                {selectedPO.taxApplicable && (
                  <>
                    <Descriptions.Item label="Tax Rate">{selectedPO.taxRate}%</Descriptions.Item>
                    <Descriptions.Item label="Tax Amount">
                      {selectedPO.currency} {selectedPO.taxAmount?.toLocaleString() || '—'}
                    </Descriptions.Item>
                  </>
                )}
                {selectedPO.tenderNumber&&(
                  <Descriptions.Item label="Linked Tender" span={2}>
                    <Tag color="purple" icon={<FileDoneOutlined/>}>{selectedPO.tenderNumber}</Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            <Card size="small" title="Order Progress" style={{ marginBottom:12 }}>
              <Steps current={STAGE_IDX[selectedPO.currentStage]||0} size="small">
                {STAGE_LABELS.map((s,i)=><Steps.Step key={i} title={s}/>)}
              </Steps>
              <Progress percent={selectedPO.progress||0} status={selectedPO.status==='cancelled'?'exception':'active'} style={{ marginTop:12 }}/>
            </Card>

            <Card size="small" title="Items" style={{ marginBottom:12 }}>
              <Table size="small" pagination={false} dataSource={selectedPO.items||[]} rowKey="description"
                columns={[
                  { title:'Description', dataIndex:'description', key:'d' },
                  { title:'Qty',  dataIndex:'quantity',   key:'q', width:60, align:'center' },
                  { title:'Unit', dataIndex:'unitPrice',  key:'u', width:110, align:'right', render:v=>(v||0).toLocaleString() },
                  { title:'Total',dataIndex:'totalPrice', key:'t', width:120, align:'right', render:v=><Text strong>{(v||0).toLocaleString()}</Text> }
                ]}
                summary={data=>{
                  const subtotal = data.reduce((s,i)=>s+(i.totalPrice||0),0);
                  const taxAmt   = selectedPO.taxApplicable && selectedPO.taxRate
                    ? subtotal * (selectedPO.taxRate/100) : 0;
                  const total    = subtotal + taxAmt;
                  return (
                    <>
                      {selectedPO.taxApplicable && (
                        <>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}><Text>Subtotal</Text></Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right"><Text>{subtotal.toLocaleString()}</Text></Table.Summary.Cell>
                          </Table.Summary.Row>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}><Text>Tax ({selectedPO.taxRate}%)</Text></Table.Summary.Cell>
                            <Table.Summary.Cell index={3} align="right"><Text>{taxAmt.toLocaleString()}</Text></Table.Summary.Cell>
                          </Table.Summary.Row>
                        </>
                      )}
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={3}><Text strong>Total</Text></Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <Text strong style={{ color:'#1890ff', fontSize:14 }}>{total.toLocaleString()}</Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    </>
                  );
                }}
              />
            </Card>

            <Space wrap>
              {selectedPO.status==='draft'&&<Button type="primary" icon={<SendOutlined/>} onClick={()=>{ setDetailDrawerVisible(false); handleSendToSupplyChain(selectedPO); }}>Send to Supply Chain</Button>}
              {selectedPO.status==='approved'&&<Button type="primary" icon={<SendOutlined/>} onClick={()=>{ setDetailDrawerVisible(false); handleSendPO(selectedPO); }}>Send to Supplier</Button>}
              {!['delivered','completed','cancelled','pending_supply_chain_assignment'].includes(selectedPO.status)&&(
                <Button icon={<EditOutlined/>} onClick={()=>{ setDetailDrawerVisible(false); handleEditPO(selectedPO); }}>Edit PO</Button>
              )}
              <Button icon={<DownloadOutlined/>} loading={pdfLoading} onClick={()=>handleDownloadPDF(selectedPO)}>Download PDF</Button>
              <Button icon={<ShareAltOutlined/>} onClick={()=>handleEmailPDF(selectedPO)}>Email PDF</Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BuyerPurchaseOrders;









// // BuyerPurchaseOrders.jsx — complete drop-in replacement
// // Supports:
// //   Path A — Create PO with an approved/awarded tender (existing flow)
// //   Path B — Create PO without tender via signed-document justification
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
//   Modal, Form, Input, Select, DatePicker, Progress, Tabs, Alert,
//   Divider, Badge, message, Tooltip, Descriptions, Drawer, List,
//   Avatar, Steps, notification, Spin, InputNumber, Popconfirm,
//   Upload
// } from 'antd';
// import {
//   FileTextOutlined, ShoppingCartOutlined, TruckOutlined, DollarOutlined,
//   CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
//   ExclamationCircleOutlined, UserOutlined, EditOutlined, EyeOutlined,
//   DownloadOutlined, PrinterOutlined, MailOutlined, WarningOutlined,
//   SyncOutlined, StopOutlined, ReloadOutlined, SendOutlined, PlusOutlined,
//   DeleteOutlined, FileDoneOutlined, TrophyOutlined, FileZipOutlined,
//   ShareAltOutlined, TeamOutlined, UploadOutlined, InfoCircleOutlined,
//   ExceptionOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
// import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';
// import tenderAPI from '../../services/tenderAPI';

// const { Title, Text, Paragraph } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Dragger } = Upload;

// // ─────────────────────────────────────────────
// // Status display helpers
// // ─────────────────────────────────────────────
// const PO_STATUS_MAP = {
//   draft:                            { color:'default',  text:'Draft',            icon:<EditOutlined/> },
//   pending_supply_chain_assignment:  { color:'orange',   text:'Pending SC',       icon:<ClockCircleOutlined/> },
//   pending_department_approval:      { color:'orange',   text:'Dept Approval',    icon:<ClockCircleOutlined/> },
//   pending_head_of_business_approval:{ color:'gold',     text:'Head Approval',    icon:<ClockCircleOutlined/> },
//   pending_finance_approval:         { color:'blue',     text:'Finance Approval', icon:<ClockCircleOutlined/> },
//   approved:                         { color:'blue',     text:'Approved',         icon:<CheckCircleOutlined/> },
//   sent_to_supplier:                 { color:'purple',   text:'Sent to Supplier', icon:<MailOutlined/> },
//   acknowledged:                     { color:'cyan',     text:'Acknowledged',     icon:<CheckCircleOutlined/> },
//   in_production:                    { color:'geekblue', text:'In Production',    icon:<SyncOutlined/> },
//   delivered:                        { color:'green',    text:'Delivered',        icon:<CheckCircleOutlined/> },
//   completed:                        { color:'success',  text:'Completed',        icon:<CheckCircleOutlined/> },
//   cancelled:                        { color:'red',      text:'Cancelled',        icon:<StopOutlined/> },
//   on_hold:                          { color:'magenta',  text:'On Hold',          icon:<ExclamationCircleOutlined/> }
// };

// const getStatusTag = (status) => {
//   const c = PO_STATUS_MAP[status] || { color:'default', text:status, icon:<FileTextOutlined/> };
//   return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
// };

// const STAGE_LABELS = ['PO Created','Supplier Acknowledgment','Production/Preparation','Shipment','Delivery & Completion'];
// const STAGE_IDX    = { created:0, supplier_acknowledgment:1, in_production:2, in_transit:3, completed:4 };

// // ─────────────────────────────────────────────
// // TenderSelectionBlock — used in Path A
// // ─────────────────────────────────────────────
// const TenderSelectionBlock = ({ tenders, loading, selectedId, onSelect, error }) => {
//   const selected = tenders.find(t => t._id === selectedId);
//   return (
//     <div style={{ marginBottom:20 }}>
//       <Alert
//         message="An approved tender is linked to this PO"
//         description="Select the tender that authorises this purchase."
//         type="info" showIcon style={{ marginBottom:12 }}
//       />
//       <Text strong>Select Tender <span style={{ color:'#ff4d4f' }}>*</span></Text>
//       <div style={{ marginTop:6 }}>
//         {loading ? <Spin size="small" /> : tenders.length === 0 ? (
//           <Alert message="No approved tenders available" type="warning" showIcon/>
//         ) : (
//           <Select style={{ width:'100%' }} placeholder="Select an approved / awarded tender"
//             value={selectedId||undefined} status={error?'error':''} onChange={onSelect}
//             showSearch optionLabelProp="label"
//             filterOption={(input,opt)=>(opt.label||'').toLowerCase().includes(input.toLowerCase())}
//           >
//             {tenders.map(t=>(
//               <Option key={t._id} value={t._id} label={`${t.tenderNumber} — ${t.title}`}>
//                 <div>
//                   <Text strong>{t.tenderNumber}</Text> — {t.title}
//                   {t.awardedSupplierName&&<Tag color="gold" icon={<TrophyOutlined/>} style={{ marginLeft:8 }}>{t.awardedSupplierName}</Tag>}
//                   <Tag color={t.status==='awarded'?'gold':'green'} style={{ marginLeft:4 }}>{t.status}</Tag>
//                   <br/>
//                   <Text type="secondary" style={{ fontSize:11 }}>
//                     Budget: XAF {(t.budget||0).toLocaleString()}
//                     {t.itemCategory?` · ${t.itemCategory}`:''}
//                   </Text>
//                 </div>
//               </Option>
//             ))}
//           </Select>
//         )}
//       </div>
//       {error && <div style={{ color:'#ff4d4f', fontSize:12, marginTop:4 }}>Please select a tender</div>}
//       {selected && (
//         <Alert style={{ marginTop:10 }} type="success" showIcon
//           message={<Space><Text strong>{selected.tenderNumber}</Text><Text>—</Text><Text>{selected.title}</Text>
//             {selected.awardedSupplierName&&<Tag color="gold" icon={<TrophyOutlined/>}>{selected.awardedSupplierName}</Tag>}
//           </Space>}
//           description={`Budget: XAF ${(selected.budget||0).toLocaleString()}${selected.paymentTerms?` · ${selected.paymentTerms}`:''}`}
//         />
//       )}
//       <Divider style={{ margin:'14px 0 4px' }}/>
//     </div>
//   );
// };

// // ─────────────────────────────────────────────
// // JustificationBlock — used in Path B
// // ─────────────────────────────────────────────
// const JustificationBlock = ({ form, fileList, onFileChange }) => (
//   <div style={{ marginBottom:20 }}>
//     <Alert
//       message="Special Case — No Tender"
//       description="You are creating this PO without a tender. A manually-signed justification document is required. Upload the signed document and provide a reason below."
//       type="warning" showIcon style={{ marginBottom:16 }}
//       icon={<ExceptionOutlined/>}
//     />

//     <Form.Item
//       name="documentName"
//       label={<Space><FileTextOutlined/><span>Signed Document Name <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
//       rules={[{ required:true, message:'Document name is required' }]}
//       extra="Enter the name / reference of the manually-signed authorisation document"
//     >
//       <Input placeholder="e.g. Emergency Procurement Authorisation — April 2026" size="large"/>
//     </Form.Item>

//     <Form.Item
//       name="justificationNote"
//       label={<Space><ExclamationCircleOutlined/><span>Justification Note <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
//       rules={[
//         { required:true, message:'Justification note is required' },
//         { min:20, message:'Please provide a detailed justification (minimum 20 characters)' }
//       ]}
//       extra="Explain clearly why this purchase is being made without a tender"
//     >
//       <TextArea
//         rows={4}
//         placeholder="Explain why no tender was raised for this purchase. Include urgency, supplier constraints, or management directive as applicable…"
//         maxLength={1000}
//         showCount
//       />
//     </Form.Item>

//     <Form.Item
//       name="justificationDocument"
//       label={<Space><UploadOutlined/><span>Upload Signed Document <span style={{ color:'#ff4d4f' }}>*</span></span></Space>}
//       rules={[{ required:true, message:'Please upload the signed justification document' }]}
//       extra="Accepted: PDF, JPEG, PNG — max 10 MB"
//     >
//       <Dragger
//         name="justificationDocument"
//         fileList={fileList}
//         beforeUpload={() => false}          // prevent auto-upload; we'll send with FormData
//         onChange={onFileChange}
//         maxCount={1}
//         accept=".pdf,.jpg,.jpeg,.png"
//         style={{ padding:'10px 0' }}
//       >
//         <p className="ant-upload-drag-icon"><UploadOutlined style={{ fontSize:32, color:'#fa8c16' }}/></p>
//         <p className="ant-upload-text" style={{ fontSize:13 }}>
//           Click or drag your signed document here
//         </p>
//         <p className="ant-upload-hint" style={{ fontSize:11 }}>
//           PDF, JPEG or PNG · max 10 MB · 1 file only
//         </p>
//       </Dragger>
//     </Form.Item>

//     <Divider style={{ margin:'4px 0 14px' }}/>
//   </div>
// );

// // ═══════════════════════════════════════════════════════════════════════════
// // MAIN COMPONENT
// // ═══════════════════════════════════════════════════════════════════════════
// const BuyerPurchaseOrders = () => {
//   // ── Data state ────────────────────────────────────────────────────────────
//   const [purchaseOrders,  setPurchaseOrders]  = useState([]);
//   const [tenders,         setTenders]         = useState([]);
//   const [suppliers,       setSuppliers]       = useState([]);
//   const [itemCategories,  setItemCategories]  = useState([]);

//   // ── UI state ──────────────────────────────────────────────────────────────
//   const [loading,         setLoading]         = useState(false);
//   const [tendersLoading,  setTendersLoading]  = useState(false);
//   const [initialLoading,  setInitialLoading]  = useState(true);
//   const [pdfLoading,      setPdfLoading]      = useState(false);
//   const [activeTab,       setActiveTab]       = useState('all');

//   // ── Modal flags ───────────────────────────────────────────────────────────
//   const [createModalVisible,  setCreateModalVisible]  = useState(false);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [editModalVisible,    setEditModalVisible]    = useState(false);
//   const [sendModalVisible,    setSendModalVisible]    = useState(false);
//   const [emailPDFModalVisible,setEmailPDFModalVisible]= useState(false);
//   const [pathChoiceVisible,   setPathChoiceVisible]   = useState(false); // Path A vs B chooser

//   // ── Selected / form state ─────────────────────────────────────────────────
//   const [selectedPO,          setSelectedPO]          = useState(null);
//   const [poCreationPath,      setPoCreationPath]       = useState('withTender'); // 'withTender' | 'withoutTender'
//   const [selectedTenderId,    setSelectedTenderId]     = useState(null);
//   const [tenderError,         setTenderError]          = useState(false);
//   const [isExternalSupplier,  setIsExternalSupplier]  = useState(false);
//   const [justificationFile,   setJustificationFile]   = useState([]);

//   const [createForm]    = Form.useForm();
//   const [editForm]      = Form.useForm();
//   const [sendForm]      = Form.useForm();
//   const [emailPDFForm]  = Form.useForm();

//   // ── Data loading ───────────────────────────────────────────────────────────
//   const loadPurchaseOrders = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await buyerRequisitionAPI.getPurchaseOrders();
//       if (res.success && res.data) setPurchaseOrders(res.data);
//     } catch { message.error('Error loading purchase orders'); }
//     finally { setLoading(false); setInitialLoading(false); }
//   }, []);

//   const loadApprovedTenders = useCallback(async () => {
//     setTendersLoading(true);
//     try {
//       const [ra, rw] = await Promise.all([
//         tenderAPI.getTenders({ status:'approved' }),
//         tenderAPI.getTenders({ status:'awarded'  })
//       ]);
//       const all = [
//         ...(ra.success ? ra.data : []),
//         ...(rw.success ? rw.data : [])
//       ];
//       setTenders(all.filter(t => !t.purchaseOrderId));
//     } catch { message.warning('Could not load tenders'); }
//     finally { setTendersLoading(false); }
//   }, []);

//   const loadSuppliers = useCallback(async () => {
//     try {
//       const res = await UnifiedSupplierAPI.getAllSuppliers({ status:'approved' });
//       if (res.success && res.data) setSuppliers(res.data);
//     } catch {}
//   }, []);

//   const loadItemCategories = useCallback(async () => {
//     try {
//       const res = await buyerRequisitionAPI.getItemCategories();
//       if (res.success && res.data) setItemCategories(res.data);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     Promise.all([loadPurchaseOrders(), loadApprovedTenders(), loadSuppliers(), loadItemCategories()]);
//   }, []);

//   // ── Derived / filtered ─────────────────────────────────────────────────────
//   const getFilteredPOs = () => {
//     switch (activeTab) {
//       case 'active':  return purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status));
//       case 'overdue': return purchaseOrders.filter(po =>
//         moment(po.expectedDeliveryDate).isBefore(moment()) &&
//         !['delivered','completed','cancelled'].includes(po.status));
//       case 'delivered': return purchaseOrders.filter(po => ['delivered','completed'].includes(po.status));
//       default: return purchaseOrders;
//     }
//   };

//   const stats = {
//     total:    purchaseOrders.length,
//     active:   purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status)).length,
//     overdue:  purchaseOrders.filter(po =>
//       moment(po.expectedDeliveryDate).isBefore(moment()) &&
//       !['delivered','completed','cancelled'].includes(po.status)).length,
//     totalValue: purchaseOrders.reduce((s, po) => s + (po.totalAmount||0), 0)
//   };

//   // ── Path selection ─────────────────────────────────────────────────────────
//   const handleCreateNewPO = () => {
//     setPathChoiceVisible(true);
//   };

//   const openCreateModal = (path) => {
//     setPoCreationPath(path);
//     setPathChoiceVisible(false);
//     setSelectedTenderId(null);
//     setTenderError(false);
//     setIsExternalSupplier(false);
//     setJustificationFile([]);
//     createForm.resetFields();
//     setCreateModalVisible(true);
//   };

//   // ── Helpers: build FormData for both paths ─────────────────────────────────
//   const buildFormData = (values, extraFields = {}) => {
//     const fd = new FormData();

//     // Core PO fields
//     fd.append('supplierDetails', JSON.stringify(extraFields.supplierDetails || {}));
//     fd.append('items',           JSON.stringify(values.items || []));
//     fd.append('totalAmount',     String((values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s, 0)));
//     fd.append('currency',        values.currency || 'XAF');
//     fd.append('taxApplicable',   String(values.taxApplicable || false));
//     fd.append('taxRate',         String(values.taxRate       || 19.25));
//     fd.append('deliveryAddress', values.deliveryAddress || '');
//     if (values.expectedDeliveryDate)
//       fd.append('expectedDeliveryDate', values.expectedDeliveryDate.endOf('day').toISOString());
//     fd.append('paymentTerms',        values.paymentTerms        || '');
//     fd.append('specialInstructions', values.specialInstructions || '');
//     fd.append('notes',               values.notes               || '');

//     // Path-specific fields
//     if (poCreationPath === 'withTender') {
//       fd.append('tenderId',     extraFields.tenderId     || '');
//       fd.append('tenderNumber', extraFields.tenderNumber || '');
//     } else {
//       fd.append('documentName',      values.documentName      || '');
//       fd.append('justificationNote', values.justificationNote || '');
//       if (justificationFile.length > 0 && justificationFile[0].originFileObj) {
//         fd.append('justificationDocument', justificationFile[0].originFileObj);
//       }
//     }

//     return fd;
//   };

//   // ── Resolve supplier details ───────────────────────────────────────────────
//   const resolveSupplierDetails = (values) => {
//     if (isExternalSupplier) {
//       return {
//         name:       values.externalSupplierName  || '',
//         email:      values.externalSupplierEmail || '',
//         phone:      values.externalSupplierPhone || '',
//         address:    values.externalSupplierAddress || '',
//         isExternal: true
//       };
//     }
//     const sup = suppliers.find(s => s._id === values.supplierId);
//     if (!sup) return null;
//     const addr = sup.supplierDetails?.address;
//     return {
//       id:         sup._id,
//       name:       sup.supplierDetails?.companyName || sup.fullName || '',
//       email:      sup.email || '',
//       phone:      sup.phoneNumber || sup.supplierDetails?.phoneNumber || '',
//       address:    typeof addr === 'object'
//         ? `${addr.street||''}, ${addr.city||''}, ${addr.state||''}`.replace(/^,|,$/g,'').trim()
//         : addr || '',
//       isExternal: false
//     };
//   };

//   // ── Create PO ──────────────────────────────────────────────────────────────
//   const handleCreatePO = async () => {
//     try {
//       const values = await createForm.validateFields();

//       // Path A: tender required
//       if (poCreationPath === 'withTender' && !selectedTenderId) {
//         setTenderError(true);
//         message.error('Please select a tender');
//         return;
//       }

//       // Path B: file required
//       if (poCreationPath === 'withoutTender' && justificationFile.length === 0) {
//         message.error('Please upload the signed justification document');
//         return;
//       }

//       const supplierDetails = resolveSupplierDetails(values);
//       if (!supplierDetails) { message.error('Please select a supplier'); return; }

//       setLoading(true);

//       let extraFields = { supplierDetails };
//       if (poCreationPath === 'withTender') {
//         const t = tenders.find(t => t._id === selectedTenderId);
//         extraFields.tenderId     = selectedTenderId;
//         extraFields.tenderNumber = t?.tenderNumber;
//       }

//       const fd = buildFormData(values, extraFields);

//       // Use fetch directly — axios/buyerRequisitionAPI may not handle FormData
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders`, {
//         method:  'POST',
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//         body:    fd
//       });
//       const data = await res.json();

//       if (data.success) {
//         message.success('Purchase order created successfully');
//         notification.success({
//           message:     'Purchase Order Created',
//           description: poCreationPath === 'withoutTender'
//             ? `${data.data.poNumber} created with justification — sent to Supply Chain.`
//             : `${data.data.poNumber} linked to tender ${extraFields.tenderNumber}.`,
//           duration: 6
//         });
//         setCreateModalVisible(false);
//         createForm.resetFields();
//         setSelectedTenderId(null);
//         setJustificationFile([]);
//         setIsExternalSupplier(false);
//         await Promise.all([loadPurchaseOrders(), loadApprovedTenders()]);
//       } else {
//         message.error(data.message || 'Failed to create purchase order');
//       }
//     } catch (e) {
//       if (e?.errorFields) message.error('Please fill all required fields');
//       else { console.error(e); message.error('Error creating purchase order'); }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ── Other PO actions (view, edit, send, download) ──────────────────────────
//   const handleViewDetails = async (po) => {
//     setLoading(true);
//     try {
//       const res = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
//       if (res.success && res.data) { setSelectedPO(res.data.purchaseOrder); setDetailDrawerVisible(true); }
//       else message.error('Failed to load PO details');
//     } catch { message.error('Error loading PO details'); }
//     finally { setLoading(false); }
//   };

//   const handleEditPO = (po) => {
//     setSelectedPO(po);
//     editForm.setFieldsValue({
//       expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
//       deliveryAddress:      po.deliveryAddress,
//       paymentTerms:         po.paymentTerms,
//       specialInstructions:  po.specialInstructions || '',
//       notes:                po.notes              || '',
//       currency:             po.currency           || 'XAF',
//       taxApplicable:        po.taxApplicable       || false,
//       taxRate:              po.taxRate             || 19.25,
//       items: (po.items||[]).map(item => ({
//         description:   item.description,
//         quantity:      item.quantity,
//         unitPrice:     item.unitPrice,
//         unitOfMeasure: item.unitOfMeasure || 'Units',
//         category:      item.category     || '',
//         specifications:item.specifications|| '',
//         ...(item.itemId ? { itemId:item.itemId } : {})
//       }))
//     });
//     setEditModalVisible(true);
//   };

//   const handleUpdatePO = async () => {
//     try {
//       const values = await editForm.validateFields();
//       setLoading(true);
//       const total = (values.items||[]).reduce((s,i)=>(Number(i.quantity)||0)*(Number(i.unitPrice)||0)+s,0);
//       const res = await buyerRequisitionAPI.updatePurchaseOrder(selectedPO.id, {
//         ...values,
//         totalAmount:         total,
//         expectedDeliveryDate:values.expectedDeliveryDate?.endOf('day').toISOString(),
//         items: (values.items||[]).map(item => ({
//           ...item, totalPrice:(Number(item.quantity)||0)*(Number(item.unitPrice)||0)
//         }))
//       });
//       if (res.success) { message.success('PO updated'); setEditModalVisible(false); loadPurchaseOrders(); }
//       else message.error(res.message || 'Failed to update');
//     } catch { message.error('Error updating PO'); }
//     finally { setLoading(false); }
//   };

//   const handleSendToSupplyChain = async (po) => {
//     try {
//       setLoading(true);
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
//         body:   JSON.stringify({ status:'pending_supply_chain_assignment' })
//       });
//       const data = await res.json();
//       if (data.success) { message.success('PO sent to Supply Chain'); loadPurchaseOrders(); }
//       else throw new Error(data.message);
//     } catch (e) { message.error(e.message || 'Failed to send to Supply Chain'); }
//     finally { setLoading(false); }
//   };

//   const handleSendPO = (po) => {
//     setSelectedPO(po);
//     sendForm.resetFields();
//     setSendModalVisible(true);
//   };

//   const handleSendPOToSupplier = async () => {
//     try {
//       const values = await sendForm.validateFields();
//       setLoading(true);
//       const res = await buyerRequisitionAPI.sendPurchaseOrderToSupplier(selectedPO.id, { message:values.message });
//       if (res.success) {
//         message.success('PO sent to supplier');
//         setSendModalVisible(false);
//         sendForm.resetFields();
//         loadPurchaseOrders();
//       } else message.error(res.message || 'Failed to send');
//     } catch { message.error('Error sending PO'); }
//     finally { setLoading(false); }
//   };

//   const handleCancelPO = (po) => {
//     let reason = '';
//     Modal.confirm({
//       title:    `Cancel PO ${po.poNumber}?`,
//       okText:   'Cancel PO', okType:'danger',
//       content: (
//         <div>
//           <p>This cannot be undone.</p>
//           <TextArea placeholder="Reason for cancellation…" rows={3} style={{ marginTop:12 }}
//             onChange={e=>{ reason = e.target.value; }}/>
//         </div>
//       ),
//       onOk: async () => {
//         if (!reason.trim()) { message.error('Please provide a reason'); return; }
//         setLoading(true);
//         try {
//           const res = await buyerRequisitionAPI.cancelPurchaseOrder(po.id, { cancellationReason:reason.trim() });
//           if (res.success) { message.success(`PO ${po.poNumber} cancelled`); loadPurchaseOrders(); }
//           else message.error(res.message || 'Failed to cancel');
//         } catch { message.error('Error cancelling PO'); }
//         finally { setLoading(false); }
//       }
//     });
//   };

//   const handleDownloadPDF = async (po) => {
//     setPdfLoading(true);
//     try {
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res  = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/download-pdf`, {
//         headers:{ Authorization:`Bearer ${localStorage.getItem('token')}` }
//       });
//       if (!res.ok) throw new Error((await res.json()).message || 'Failed');
//       const blob = await res.blob();
//       const a    = document.createElement('a');
//       a.href     = window.URL.createObjectURL(blob);
//       a.download = `PO_${po.poNumber}.pdf`;
//       document.body.appendChild(a); a.click(); document.body.removeChild(a);
//       message.success(`PDF downloaded`);
//     } catch (e) { message.error(e.message || 'Failed to download PDF'); }
//     finally { setPdfLoading(false); }
//   };

//   const handleEmailPDF = (po) => {
//     setSelectedPO(po);
//     emailPDFForm.resetFields();
//     emailPDFForm.setFieldsValue({ emailTo:po.supplierEmail });
//     setEmailPDFModalVisible(true);
//   };

//   const handleSendEmailPDF = async () => {
//     try {
//       const values = await emailPDFForm.validateFields();
//       setPdfLoading(true);
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res  = await fetch(`${apiUrl}/buyer/purchase-orders/${selectedPO.id}/email-pdf`, {
//         method: 'POST',
//         headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${localStorage.getItem('token')}` },
//         body:   JSON.stringify(values)
//       });
//       const data = await res.json();
//       if (!res.ok || !data.success) throw new Error(data.message || 'Failed');
//       message.success(`PDF emailed to ${values.emailTo}`);
//       setEmailPDFModalVisible(false);
//     } catch (e) { message.error(e.message || 'Failed to send PDF email'); }
//     finally { setPdfLoading(false); }
//   };

//   // ── Table columns ──────────────────────────────────────────────────────────
//   const columns = [
//     {
//       title:'PO Details', key:'details',
//       render:(_,r)=>(
//         <div>
//           <Text strong>{r.poNumber||r.id}</Text><br/>
//           <Text type="secondary" style={{ fontSize:11 }}>{moment(r.creationDate).format('MMM DD, HH:mm')}</Text>
//           {r.tenderNumber&&(
//             <><br/><Tag color="purple" style={{ fontSize:10 }} icon={<FileDoneOutlined/>}>{r.tenderNumber}</Tag></>
//           )}
//           {r.createdWithoutTender&&(
//             <><br/><Tag color="orange" icon={<ExceptionOutlined/>} style={{ fontSize:10 }}>No Tender — Justified</Tag></>
//           )}
//         </div>
//       ), width:160
//     },
//     {
//       title:'Supplier', key:'supplier',
//       render:(_,r)=>(
//         <div>
//           <Text strong>{r.supplierName}</Text><br/>
//           <Text type="secondary" style={{ fontSize:11 }}>{r.supplierEmail}</Text>
//         </div>
//       ), width:180
//     },
//     {
//       title:'Amount', key:'amount',
//       render:(_,r)=><Text strong style={{ color:'#1890ff', fontSize:15 }}>{r.currency} {r.totalAmount?.toLocaleString()}</Text>,
//       width:130, sorter:(a,b)=>(a.totalAmount||0)-(b.totalAmount||0)
//     },
//     {
//       title:'Progress', key:'progress',
//       render:(_,r)=>(
//         <div>
//           <Progress percent={r.progress||0} size="small" status={r.status==='cancelled'?'exception':'active'}/>
//           <Text type="secondary" style={{ fontSize:11 }}>{STAGE_LABELS[STAGE_IDX[r.currentStage]]||'Created'}</Text>
//         </div>
//       ), width:150
//     },
//     {
//       title:'Delivery', key:'delivery',
//       render:(_,r)=>{
//         if (!r.expectedDeliveryDate) return <Text type="secondary">—</Text>;
//         const overdue = moment(r.expectedDeliveryDate).isBefore(moment()) && !['delivered','completed','cancelled'].includes(r.status);
//         const days    = moment(r.expectedDeliveryDate).diff(moment(),'days');
//         return (
//           <div>
//             <Text type={overdue?'danger':'default'}>{moment(r.expectedDeliveryDate).format('MMM DD')}</Text><br/>
//             <Text type="secondary" style={{ fontSize:11 }}>
//               {overdue ? `${Math.abs(days)}d overdue` : days===0?'Today':days>0?`${days}d left`:'Delivered'}
//             </Text>
//             {overdue&&<ExclamationCircleOutlined style={{ color:'#ff4d4f', marginLeft:4 }}/>}
//           </div>
//         );
//       }, width:110
//     },
//     {
//       title:'Status', dataIndex:'status', key:'status',
//       render:s=>getStatusTag(s), width:155
//     },
//     {
//       title:'Actions', key:'actions', width:200, fixed:'right',
//       render:(_,r)=>(
//         <Space size={4} direction="vertical">
//           <Space size={4}>
//             <Tooltip title="View"><Button size="small" icon={<EyeOutlined/>} onClick={()=>handleViewDetails(r)}/></Tooltip>
//             {r.status==='draft'&&<Tooltip title="Send to Supply Chain"><Button size="small" type="primary" icon={<SendOutlined/>} onClick={()=>handleSendToSupplyChain(r)}/></Tooltip>}
//             {r.status==='approved'&&<Tooltip title="Send to Supplier"><Button size="small" type="primary" icon={<SendOutlined/>} onClick={()=>handleSendPO(r)}/></Tooltip>}
//             {!['delivered','completed','cancelled','pending_supply_chain_assignment'].includes(r.status)&&(
//               <Tooltip title="Edit"><Button size="small" icon={<EditOutlined/>} onClick={()=>handleEditPO(r)}/></Tooltip>
//             )}
//           </Space>
//           <Space size={4}>
//             <Tooltip title="Download PDF"><Button size="small" icon={<DownloadOutlined/>} loading={pdfLoading} onClick={()=>handleDownloadPDF(r)}/></Tooltip>
//             <Tooltip title="Email PDF"><Button size="small" icon={<ShareAltOutlined/>} onClick={()=>handleEmailPDF(r)}/></Tooltip>
//             {!['delivered','completed','cancelled'].includes(r.status)&&(
//               <Tooltip title="Cancel"><Button size="small" danger icon={<StopOutlined/>} onClick={()=>handleCancelPO(r)}/></Tooltip>
//             )}
//           </Space>
//         </Space>
//       )
//     }
//   ];

//   if (initialLoading) return (
//     <div style={{ padding:24, textAlign:'center' }}><Spin size="large"/></div>
//   );

//   // ─────────────────────────────────────────────
//   // Items form fields (shared by both paths)
//   // ─────────────────────────────────────────────
//   const ItemsFormList = ({ formInstance }) => (
//     <Form.List name="items" rules={[{ validator:async(_,v)=>{ if(!v||v.length<1) return Promise.reject('At least one item required'); } }]}>
//       {(fields,{add,remove},{errors})=>(
//         <>
//           {fields.map(({key,name,...rest})=>(
//             <Card key={key} size="small" style={{ marginBottom:10, borderLeft:'3px solid #1890ff' }}
//               title={`Item ${name+1}`}
//               extra={fields.length>1?<Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>remove(name)}>Remove</Button>:null}
//             >
//               <Row gutter={16}>
//                 <Col span={12}>
//                   <Form.Item {...rest} name={[name,'description']} label="Description" rules={[{required:true}]}>
//                     <Input placeholder="Item description"/>
//                   </Form.Item>
//                 </Col>
//                 <Col span={6}>
//                   <Form.Item {...rest} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}>
//                     <InputNumber min={1} style={{ width:'100%' }}/>
//                   </Form.Item>
//                 </Col>
//                 <Col span={6}>
//                   <Form.Item {...rest} name={[name,'unitPrice']} label="Unit Price" rules={[{required:true}]}>
//                     <InputNumber min={0} style={{ width:'100%' }}
//                       formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/>
//                   </Form.Item>
//                 </Col>
//               </Row>
//               <Row gutter={16}>
//                 <Col span={8}>
//                   <Form.Item {...rest} name={[name,'unitOfMeasure']} label="Unit of Measure">
//                     <Select placeholder="Unit" allowClear>
//                       {['Pieces','Sets','Boxes','Packs','Units','Each','Kg','Litres','Meters'].map(u=><Option key={u} value={u}>{u}</Option>)}
//                     </Select>
//                   </Form.Item>
//                 </Col>
//                 <Col span={8}>
//                   <Form.Item {...rest} name={[name,'category']} label="Category">
//                     <Select placeholder="Category" allowClear>
//                       {itemCategories.map(c=><Option key={c} value={c}>{c}</Option>)}
//                     </Select>
//                   </Form.Item>
//                 </Col>
//                 <Col span={8}>
//                   <Form.Item {...rest} name={[name,'specifications']} label="Specifications">
//                     <Input placeholder="Optional"/>
//                   </Form.Item>
//                 </Col>
//               </Row>
//             </Card>
//           ))}
//           <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Add Item</Button>
//           <Form.ErrorList errors={errors}/>
//         </>
//       )}
//     </Form.List>
//   );

//   // ─────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────
//   return (
//     <div style={{ padding:24 }}>
//       <Card>
//         {/* Header */}
//         <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
//           <div>
//             <Title level={3} style={{ margin:0 }}><FileTextOutlined style={{ marginRight:8 }}/>Purchase Order Management</Title>
//             <Text type="secondary">POs require an approved tender — or a signed justification for special cases</Text>
//           </div>
//           <Space>
//             <Button icon={<ReloadOutlined/>} onClick={loadPurchaseOrders} loading={loading}>Refresh</Button>
//             <Button type="primary" icon={<PlusOutlined/>} onClick={handleCreateNewPO}>Create New PO</Button>
//           </Space>
//         </div>

//         {/* Stats */}
//         <Row gutter={16} style={{ marginBottom:24 }}>
//           <Col span={5}><Statistic title="Total POs"   value={stats.total}   valueStyle={{ color:'#1890ff' }}/></Col>
//           <Col span={5}><Statistic title="Active"      value={stats.active}  valueStyle={{ color:'#faad14' }}/></Col>
//           <Col span={5}><Statistic title="Overdue"     value={stats.overdue} valueStyle={{ color:'#ff4d4f' }}/></Col>
//           <Col span={5}><Statistic title="Total Value" value={`${(stats.totalValue/1000000).toFixed(1)}M`} suffix="XAF" valueStyle={{ color:'#13c2c2' }}/></Col>
//           <Col span={4}>
//             <Card size="small" style={{ background:tenders.length>0?'#f6ffed':'#fff1f0', border:`1px solid ${tenders.length>0?'#b7eb8f':'#ffa39e'}` }}>
//               <div style={{ fontSize:12 }}>
//                 <FileDoneOutlined style={{ marginRight:6, color:tenders.length>0?'#52c41a':'#ff4d4f' }}/>
//                 <Text strong style={{ color:tenders.length>0?'#52c41a':'#ff4d4f' }}>
//                   {tenders.length} tender{tenders.length!==1?'s':''} available
//                 </Text>
//               </div>
//             </Card>
//           </Col>
//         </Row>

//         {stats.overdue>0&&(
//           <Alert message={`${stats.overdue} Purchase Order${stats.overdue!==1?'s':''} Overdue`}
//             type="error" showIcon style={{ marginBottom:16 }}
//             action={<Button size="small" danger onClick={()=>setActiveTab('overdue')}>View Overdue</Button>}
//           />
//         )}

//         <Tabs activeKey={activeTab} onChange={setActiveTab}
//           items={[
//             { key:'all',       label:`All (${stats.total})` },
//             { key:'active',    label:`Active (${stats.active})` },
//             { key:'overdue',   label:<Badge count={stats.overdue} size="small"><span style={{ paddingRight:stats.overdue>0?16:0 }}>Overdue</span></Badge> },
//             { key:'delivered', label:'Delivered' }
//           ]}
//         />
//         <Table columns={columns} dataSource={getFilteredPOs()} rowKey="id"
//           loading={loading} pagination={{ pageSize:10 }} scroll={{ x:'max-content' }}
//         />
//       </Card>

//       {/* ══════════════════════════════════════════
//           PATH CHOICE MODAL
//       ══════════════════════════════════════════ */}
//       <Modal
//         title={<Space><PlusOutlined/>Create New Purchase Order</Space>}
//         open={pathChoiceVisible}
//         onCancel={()=>setPathChoiceVisible(false)}
//         footer={null}
//         width={600}
//       >
//         <Paragraph style={{ color:'#666', marginBottom:24 }}>
//           How would you like to proceed?
//         </Paragraph>
//         <Row gutter={16}>
//           {/* Path A */}
//           <Col span={12}>
//             <Card
//               hoverable
//               style={{ textAlign:'center', border:'2px solid #91caff', cursor:'pointer' }}
//               onClick={()=>openCreateModal('withTender')}
//             >
//               <FileDoneOutlined style={{ fontSize:36, color:'#1890ff', marginBottom:12 }}/>
//               <div><Text strong style={{ fontSize:15 }}>Create with Tender</Text></div>
//               <div style={{ marginTop:8 }}>
//                 <Text type="secondary" style={{ fontSize:12 }}>
//                   Standard path — links this PO to an approved or awarded tender.
//                 </Text>
//               </div>
//               {tenders.length > 0
//                 ? <Tag color="green" style={{ marginTop:12 }}>{tenders.length} tender{tenders.length!==1?'s':''} available</Tag>
//                 : <Tag color="orange" style={{ marginTop:12 }}>No approved tenders yet</Tag>
//               }
//             </Card>
//           </Col>
//           {/* Path B */}
//           <Col span={12}>
//             <Card
//               hoverable
//               style={{ textAlign:'center', border:'2px solid #ffd591', cursor:'pointer' }}
//               onClick={()=>openCreateModal('withoutTender')}
//             >
//               <ExceptionOutlined style={{ fontSize:36, color:'#fa8c16', marginBottom:12 }}/>
//               <div><Text strong style={{ fontSize:15 }}>Create without Tender</Text></div>
//               <div style={{ marginTop:8 }}>
//                 <Text type="secondary" style={{ fontSize:12 }}>
//                   Special case — requires a manually-signed justification document and a reason.
//                 </Text>
//               </div>
//               <Tag color="orange" style={{ marginTop:12 }}>Justification required</Tag>
//             </Card>
//           </Col>
//         </Row>
//       </Modal>

//       {/* ══════════════════════════════════════════
//           CREATE PO MODAL (both paths share this)
//       ══════════════════════════════════════════ */}
//       <Modal
//         title={
//           <Space>
//             <PlusOutlined/>
//             {poCreationPath==='withTender' ? (
//               <><span>Create PO</span><Tag color="blue" icon={<FileDoneOutlined/>}>With Tender</Tag></>
//             ) : (
//               <><span>Create PO</span><Tag color="orange" icon={<ExceptionOutlined/>}>Special Case — Justification Required</Tag></>
//             )}
//           </Space>
//         }
//         open={createModalVisible}
//         onOk={handleCreatePO}
//         onCancel={()=>{
//           setCreateModalVisible(false);
//           setSelectedTenderId(null);
//           setTenderError(false);
//           setIsExternalSupplier(false);
//           setJustificationFile([]);
//           createForm.resetFields();
//         }}
//         confirmLoading={loading}
//         width={1100}
//         maskClosable={false}
//         style={{ top:20 }}
//         styles={{ body:{ maxHeight:'82vh', overflowY:'auto' } }}
//         destroyOnClose
//       >
//         <Form form={createForm} layout="vertical" initialValues={{ currency:'XAF', items:[{}] }}>

//           {/* ── Path A: Tender selection ── */}
//           {poCreationPath === 'withTender' && (
//             <TenderSelectionBlock
//               tenders={tenders}
//               loading={tendersLoading}
//               selectedId={selectedTenderId}
//               onSelect={(v)=>{ setSelectedTenderId(v); setTenderError(false); }}
//               error={tenderError}
//             />
//           )}

//           {/* ── Path B: Justification ── */}
//           {poCreationPath === 'withoutTender' && (
//             <JustificationBlock
//               form={createForm}
//               fileList={justificationFile}
//               onFileChange={({ fileList }) => setJustificationFile(fileList.slice(-1))}
//             />
//           )}

//           {/* ── Supplier ── */}
//           <Divider orientation="left">Supplier</Divider>
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="supplierType" label="Supplier Type" initialValue="registered" rules={[{required:true}]}>
//                 <Select onChange={v=>{ setIsExternalSupplier(v==='external'); createForm.setFieldsValue({ supplierId:undefined }); }}>
//                   <Option value="registered">Registered Supplier</Option>
//                   <Option value="external">External / New Supplier</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item name="currency" label="Currency" initialValue="XAF" rules={[{required:true}]}>
//                 <Select>
//                   <Option value="XAF">XAF (Central African Franc)</Option>
//                   <Option value="USD">USD</Option>
//                   <Option value="EUR">EUR</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           {!isExternalSupplier ? (
//             <Form.Item name="supplierId" label="Select Registered Supplier" rules={[{required:!isExternalSupplier,message:'Please select a supplier'}]}>
//               <Select placeholder="Search supplier" showSearch optionLabelProp="label"
//                 filterOption={(input,opt)=>{
//                   const s=suppliers.find(s=>s._id===opt.value);
//                   if(!s)return false;
//                   return `${s.supplierDetails?.companyName||''} ${s.email||''}`.toLowerCase().includes(input.toLowerCase());
//                 }}>
//                 {suppliers.map(s=>(
//                   <Option key={s._id} value={s._id} label={s.supplierDetails?.companyName||s.email}>
//                     <div><Text strong>{s.supplierDetails?.companyName||'Unnamed'}</Text><br/>
//                       <Text type="secondary" style={{ fontSize:11 }}>{s.email}</Text></div>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           ) : (
//             <Row gutter={16}>
//               <Col span={12}><Form.Item name="externalSupplierName"    label="Supplier Name"  rules={[{required:true}]}><Input/></Form.Item></Col>
//               <Col span={12}><Form.Item name="externalSupplierEmail"   label="Email"          rules={[{required:true},{type:'email'}]}><Input/></Form.Item></Col>
//               <Col span={12}><Form.Item name="externalSupplierPhone"   label="Phone"><Input/></Form.Item></Col>
//               <Col span={12}><Form.Item name="externalSupplierAddress" label="Address"><Input/></Form.Item></Col>
//             </Row>
//           )}

//           {/* ── Items ── */}
//           <Divider orientation="left">Items</Divider>
//           <ItemsFormList formInstance={createForm}/>

//           {/* ── Delivery & Payment ── */}
//           <Divider orientation="left">Delivery &amp; Payment</Divider>
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date"
//                 initialValue={moment().add(14,'days')} rules={[{required:true}]}>
//                 <DatePicker style={{ width:'100%' }} disabledDate={c=>c&&c<moment().startOf('day')}/>
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="paymentTerms" label="Payment Terms" rules={[{required:true}]}>
//                 <Select placeholder="Select payment terms">
//                   {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t=><Option key={t} value={t}>{t}</Option>)}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>
//           <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{required:true}]}>
//             <TextArea rows={2} placeholder="Full delivery address…"/>
//           </Form.Item>
//           <Form.Item name="specialInstructions" label="Special Instructions">
//             <TextArea rows={2} placeholder="Special instructions for the supplier…"/>
//           </Form.Item>
//           <Form.Item name="notes" label="Internal Notes">
//             <TextArea rows={2} placeholder="Internal notes (not sent to supplier)…"/>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ EDIT PO MODAL ══ */}
//       <Modal
//         title={`Edit PO — ${selectedPO?.poNumber}`}
//         open={editModalVisible}
//         onOk={handleUpdatePO}
//         onCancel={()=>{ setEditModalVisible(false); editForm.resetFields(); }}
//         confirmLoading={loading} width={900} destroyOnClose
//       >
//         <Form form={editForm} layout="vertical">
//           <Row gutter={16}>
//             <Col span={8}><Form.Item name="expectedDeliveryDate" label="Expected Delivery Date" rules={[{required:true}]}><DatePicker style={{ width:'100%' }}/></Form.Item></Col>
//             <Col span={8}><Form.Item name="paymentTerms" label="Payment Terms" rules={[{required:true}]}><Select>{['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t=><Option key={t} value={t}>{t}</Option>)}</Select></Form.Item></Col>
//             <Col span={8}><Form.Item name="currency" label="Currency" rules={[{required:true}]}><Select><Option value="XAF">XAF</Option><Option value="USD">USD</Option></Select></Form.Item></Col>
//           </Row>
//           <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{required:true}]}><TextArea rows={2}/></Form.Item>
//           <Divider>Items</Divider>
//           <Form.List name="items">
//             {(fields,{add,remove})=>(
//               <>
//                 {fields.map(({key,name,...rest})=>(
//                   <Card key={key} size="small" style={{ marginBottom:10 }} title={`Item ${name+1}`}
//                     extra={fields.length>1?<Button size="small" danger icon={<DeleteOutlined/>} onClick={()=>remove(name)}>Remove</Button>:null}>
//                     <Row gutter={16}>
//                       <Col span={12}><Form.Item {...rest} name={[name,'description']} label="Description" rules={[{required:true}]}><Input/></Form.Item></Col>
//                       <Col span={6}><Form.Item {...rest} name={[name,'quantity']} label="Quantity" rules={[{required:true}]}><InputNumber min={1} style={{ width:'100%' }}/></Form.Item></Col>
//                       <Col span={6}><Form.Item {...rest} name={[name,'unitPrice']} label="Unit Price" rules={[{required:true}]}><InputNumber min={0} style={{ width:'100%' }} formatter={v=>`${v}`.replace(/\B(?=(\d{3})+(?!\d))/g,',')} parser={v=>v.replace(/,/g,'')}/></Form.Item></Col>
//                     </Row>
//                   </Card>
//                 ))}
//                 <Button type="dashed" onClick={()=>add()} block icon={<PlusOutlined/>}>Add Item</Button>
//               </>
//             )}
//           </Form.List>
//           <Divider/>
//           <Form.Item name="specialInstructions" label="Special Instructions"><TextArea rows={2}/></Form.Item>
//           <Form.Item name="notes" label="Internal Notes"><TextArea rows={2}/></Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ SEND TO SUPPLIER MODAL ══ */}
//       <Modal
//         title={`Send PO to Supplier — ${selectedPO?.poNumber}`}
//         open={sendModalVisible}
//         onOk={handleSendPOToSupplier}
//         onCancel={()=>setSendModalVisible(false)}
//         confirmLoading={loading} width={560}
//       >
//         <Alert message={`Will be emailed to ${selectedPO?.supplierName} at ${selectedPO?.supplierEmail}`} type="info" showIcon style={{ marginBottom:16 }}/>
//         <Form form={sendForm} layout="vertical">
//           <Form.Item name="message" label="Additional Message (Optional)">
//             <TextArea rows={4} maxLength={1000} showCount/>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ EMAIL PDF MODAL ══ */}
//       <Modal
//         title={<Space><ShareAltOutlined/>Email PDF — {selectedPO?.poNumber}</Space>}
//         open={emailPDFModalVisible}
//         onOk={handleSendEmailPDF}
//         onCancel={()=>setEmailPDFModalVisible(false)}
//         confirmLoading={pdfLoading} width={560}
//       >
//         <Form form={emailPDFForm} layout="vertical">
//           <Form.Item name="emailTo" label="Recipient Email" rules={[{required:true},{type:'email'}]}>
//             <Input prefix={<MailOutlined/>} placeholder="recipient@email.com"/>
//           </Form.Item>
//           <Form.Item name="message" label="Message (Optional)">
//             <TextArea rows={3} maxLength={1000} showCount/>
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ DETAIL DRAWER ══ */}
//       <Drawer
//         title={<Space><FileTextOutlined/>PO Details — {selectedPO?.poNumber}</Space>}
//         placement="right" width={860}
//         open={detailDrawerVisible}
//         onClose={()=>setDetailDrawerVisible(false)}
//       >
//         {selectedPO && (
//           <div>
//             {/* Justification badge if created without tender */}
//             {selectedPO.createdWithoutTender && selectedPO.tenderJustification && (
//               <Alert
//                 style={{ marginBottom:12 }}
//                 type="warning"
//                 showIcon
//                 icon={<ExceptionOutlined/>}
//                 message="Created Without Tender — Justification on File"
//                 description={
//                   <div>
//                     <div><Text strong>Document: </Text>{selectedPO.tenderJustification.documentName}</div>
//                     <div style={{ marginTop:4 }}><Text strong>Reason: </Text>{selectedPO.tenderJustification.justificationNote}</div>
//                     {selectedPO.tenderJustification.signedDocument?.url && (
//                       <div style={{ marginTop:6 }}>
//                         <Button size="small" icon={<DownloadOutlined/>} type="link"
//                           onClick={()=>window.open(selectedPO.tenderJustification.signedDocument.url,'_blank')}>
//                           View Signed Document
//                         </Button>
//                       </div>
//                     )}
//                   </div>
//                 }
//               />
//             )}

//             <Card size="small" style={{ marginBottom:12 }}>
//               <Descriptions column={2} size="small">
//                 <Descriptions.Item label="PO Number"><Text code strong>{selectedPO.poNumber}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Status">{getStatusTag(selectedPO.status)}</Descriptions.Item>
//                 <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
//                 <Descriptions.Item label="Email">{selectedPO.supplierEmail}</Descriptions.Item>
//                 <Descriptions.Item label="Amount"><Text strong style={{ color:'#1890ff', fontSize:16 }}>{selectedPO.currency} {selectedPO.totalAmount?.toLocaleString()}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Payment Terms">{selectedPO.paymentTerms}</Descriptions.Item>
//                 <Descriptions.Item label="Delivery">{selectedPO.deliveryAddress}</Descriptions.Item>
//                 <Descriptions.Item label="Expected">{selectedPO.expectedDeliveryDate?moment(selectedPO.expectedDeliveryDate).format('DD MMM YYYY'):'—'}</Descriptions.Item>
//                 {selectedPO.tenderNumber&&(
//                   <Descriptions.Item label="Linked Tender" span={2}>
//                     <Tag color="purple" icon={<FileDoneOutlined/>}>{selectedPO.tenderNumber}</Tag>
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//             </Card>

//             <Card size="small" title="Order Progress" style={{ marginBottom:12 }}>
//               <Steps current={STAGE_IDX[selectedPO.currentStage]||0} size="small">
//                 {STAGE_LABELS.map((s,i)=><Steps.Step key={i} title={s}/>)}
//               </Steps>
//               <Progress percent={selectedPO.progress||0} status={selectedPO.status==='cancelled'?'exception':'active'} style={{ marginTop:12 }}/>
//             </Card>

//             <Card size="small" title="Items" style={{ marginBottom:12 }}>
//               <Table size="small" pagination={false} dataSource={selectedPO.items||[]} rowKey="description"
//                 columns={[
//                   { title:'Description', dataIndex:'description', key:'d' },
//                   { title:'Qty',  dataIndex:'quantity',   key:'q', width:60, align:'center' },
//                   { title:'Unit', dataIndex:'unitPrice',  key:'u', width:110, align:'right', render:v=>(v||0).toLocaleString() },
//                   { title:'Total',dataIndex:'totalPrice', key:'t', width:120, align:'right', render:v=><Text strong>{(v||0).toLocaleString()}</Text> }
//                 ]}
//                 summary={data=>{
//                   const t=data.reduce((s,i)=>s+(i.totalPrice||0),0);
//                   return <Table.Summary.Row>
//                     <Table.Summary.Cell index={0} colSpan={3}><Text strong>Total</Text></Table.Summary.Cell>
//                     <Table.Summary.Cell index={3} align="right"><Text strong style={{ color:'#1890ff', fontSize:14 }}>{t.toLocaleString()}</Text></Table.Summary.Cell>
//                   </Table.Summary.Row>;
//                 }}
//               />
//             </Card>

//             <Space wrap>
//               {selectedPO.status==='draft'&&<Button type="primary" icon={<SendOutlined/>} onClick={()=>{ setDetailDrawerVisible(false); handleSendToSupplyChain(selectedPO); }}>Send to Supply Chain</Button>}
//               {selectedPO.status==='approved'&&<Button type="primary" icon={<SendOutlined/>} onClick={()=>{ setDetailDrawerVisible(false); handleSendPO(selectedPO); }}>Send to Supplier</Button>}
//               <Button icon={<DownloadOutlined/>} loading={pdfLoading} onClick={()=>handleDownloadPDF(selectedPO)}>Download PDF</Button>
//               <Button icon={<ShareAltOutlined/>} onClick={()=>handleEmailPDF(selectedPO)}>Email PDF</Button>
//             </Space>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerPurchaseOrders;









// // BuyerPurchaseOrders.jsx  — full file with tender requirement enforced
// import React, { useState, useEffect, useCallback } from 'react';
// import {
//   Card, Table, Button, Space, Typography, Tag, Row, Col, Statistic,
//   Modal, Form, Input, Select, DatePicker, Progress, Tabs, Alert,
//   Divider, Badge, message, Tooltip, Descriptions, Drawer, List,
//   Avatar, Steps, notification, Spin, InputNumber, Popconfirm,
//   AutoComplete, Checkbox
// } from 'antd';
// import {
//   FileTextOutlined, ShoppingCartOutlined, TruckOutlined, DollarOutlined,
//   CalendarOutlined, CheckCircleOutlined, ClockCircleOutlined,
//   ExclamationCircleOutlined, UserOutlined, EditOutlined, EyeOutlined,
//   DownloadOutlined, PrinterOutlined, MailOutlined, PhoneOutlined,
//   WarningOutlined, SyncOutlined, StopOutlined, ReloadOutlined,
//   SendOutlined, PlusOutlined, DeleteOutlined, MinusCircleOutlined,
//   SearchOutlined, TagOutlined, FilePdfOutlined, FileZipOutlined,
//   ShareAltOutlined, TeamOutlined, FileDoneOutlined, TrophyOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
// import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';
// import tenderAPI from '../../services/tenderAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;

// // ─────────────────────────────────────────────
// // Status display helpers
// // ─────────────────────────────────────────────
// const PO_STATUS_MAP = {
//   draft:                          { color: 'default', text: 'Draft',            icon: <EditOutlined /> },
//   pending_supply_chain_assignment:{ color: 'orange',  text: 'Pending SC',       icon: <ClockCircleOutlined /> },
//   pending_department_approval:    { color: 'orange',  text: 'Dept Approval',    icon: <ClockCircleOutlined /> },
//   pending_head_of_business_approval:{ color: 'gold',  text: 'Head Approval',    icon: <ClockCircleOutlined /> },
//   pending_finance_approval:       { color: 'blue',    text: 'Finance Approval', icon: <ClockCircleOutlined /> },
//   approved:                       { color: 'blue',    text: 'Approved',         icon: <CheckCircleOutlined /> },
//   sent_to_supplier:               { color: 'purple',  text: 'Sent to Supplier', icon: <MailOutlined /> },
//   acknowledged:                   { color: 'cyan',    text: 'Acknowledged',     icon: <CheckCircleOutlined /> },
//   in_production:                  { color: 'geekblue',text: 'In Production',    icon: <SyncOutlined /> },
//   delivered:                      { color: 'green',   text: 'Delivered',        icon: <CheckCircleOutlined /> },
//   completed:                      { color: 'success', text: 'Completed',        icon: <CheckCircleOutlined /> },
//   cancelled:                      { color: 'red',     text: 'Cancelled',        icon: <StopOutlined /> },
//   on_hold:                        { color: 'magenta', text: 'On Hold',          icon: <ExclamationCircleOutlined /> }
// };

// const getStatusTag = (status) => {
//   const cfg = PO_STATUS_MAP[status] || { color: 'default', text: status, icon: <FileTextOutlined /> };
//   return <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag>;
// };

// const STAGE_LABELS = ['PO Created', 'Supplier Acknowledgment', 'Production/Preparation', 'Shipment', 'Delivery & Completion'];
// const STAGE_IDX = { created: 0, supplier_acknowledgment: 1, in_production: 2, in_transit: 3, completed: 4 };

// // ─────────────────────────────────────────────
// // Tender selection block (rendered inside Create PO Modal)
// // ─────────────────────────────────────────────
// const TenderSelectionBlock = ({ tenders, loading, selectedId, onSelect, error }) => {
//   const selected = tenders.find(t => t._id === selectedId);
//   return (
//     <div style={{ marginBottom: 20 }}>
//       <Alert
//         message="A Tender is required before creating a Purchase Order"
//         description="Every PO must reference an approved or awarded tender. Select one below — it determines the awarded supplier and budget."
//         type="warning"
//         showIcon
//         style={{ marginBottom: 12 }}
//       />
//       <div>
//         <Text strong>
//           Select Tender <span style={{ color: '#ff4d4f' }}>*</span>
//         </Text>
//         <div style={{ marginTop: 6 }}>
//           {loading ? (
//             <Spin size="small" tip="Loading tenders…" />
//           ) : tenders.length === 0 ? (
//             <Alert
//               message="No approved or awarded tenders available"
//               description={
//                 <span>
//                   Please go to <strong>Tender Management</strong> to create and approve a tender before raising a PO.
//                 </span>
//               }
//               type="error"
//               showIcon
//             />
//           ) : (
//             <Select
//               style={{ width: '100%' }}
//               placeholder="Select an approved / awarded tender"
//               value={selectedId || undefined}
//               status={error ? 'error' : ''}
//               onChange={onSelect}
//               optionLabelProp="label"
//               showSearch
//               filterOption={(input, opt) => (opt.label || '').toLowerCase().includes(input.toLowerCase())}
//             >
//               {tenders.map(t => (
//                 <Option key={t._id} value={t._id} label={`${t.tenderNumber} — ${t.title}`}>
//                   <div>
//                     <Text strong>{t.tenderNumber}</Text> — {t.title}
//                     {t.awardedSupplierName && (
//                       <Tag color="gold" icon={<TrophyOutlined />} style={{ marginLeft: 8 }}>
//                         {t.awardedSupplierName}
//                       </Tag>
//                     )}
//                     <Tag color={t.status === 'awarded' ? 'gold' : 'green'} style={{ marginLeft: 4 }}>
//                       {t.status}
//                     </Tag>
//                     <br />
//                     <Text type="secondary" style={{ fontSize: 11 }}>
//                       Budget: XAF {(t.budget || 0).toLocaleString()}
//                       {t.itemCategory ? ` · ${t.itemCategory}` : ''}
//                       {t.paymentTerms ? ` · ${t.paymentTerms}` : ''}
//                     </Text>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           )}
//         </div>
//         {error && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>Please select a tender to proceed</div>}
//       </div>

//       {selected && (
//         <Alert
//           style={{ marginTop: 10 }}
//           message={
//             <Space>
//               <Text strong>{selected.tenderNumber}</Text>
//               <Text>—</Text>
//               <Text>{selected.title}</Text>
//               {selected.awardedSupplierName && (
//                 <Tag color="gold" icon={<TrophyOutlined />}>Awarded: {selected.awardedSupplierName}</Tag>
//               )}
//             </Space>
//           }
//           description={
//             <span>
//               Budget: <Text strong>XAF {(selected.budget || 0).toLocaleString()}</Text>
//               {selected.costSavings > 0 && ` · Cost Savings: XAF ${selected.costSavings.toLocaleString()}`}
//               {selected.deliveryTerms ? ` · Delivery: ${selected.deliveryTerms}` : ''}
//               {selected.paymentTerms  ? ` · Payment: ${selected.paymentTerms}` : ''}
//             </span>
//           }
//           type="success"
//           showIcon
//         />
//       )}

//       <Divider style={{ margin: '14px 0 4px' }} />
//     </div>
//   );
// };

// // ═══════════════════════════════════════════════════════════════
// // MAIN COMPONENT
// // ═══════════════════════════════════════════════════════════════
// const BuyerPurchaseOrders = () => {
//   // ── Data state ────────────────────────────────────────────────────────────
//   const [purchaseOrders, setPurchaseOrders]     = useState([]);
//   const [tenders,        setTenders]             = useState([]);
//   const [suppliers,      setSuppliers]           = useState([]);
//   const [items,          setItems]               = useState([]);
//   const [itemCategories, setItemCategories]      = useState([]);
//   const [budgetCodes,    setBudgetCodes]          = useState([]);

//   // ── UI state ──────────────────────────────────────────────────────────────
//   const [loading,             setLoading]             = useState(false);
//   const [tendersLoading,      setTendersLoading]      = useState(false);
//   const [initialLoading,      setInitialLoading]      = useState(true);
//   const [activeTab,           setActiveTab]           = useState('all');
//   const [selectedRowKeys,     setSelectedRowKeys]     = useState([]);
//   const [pdfLoading,          setPdfLoading]          = useState(false);

//   // ── Modal / drawer flags ──────────────────────────────────────────────────
//   const [detailDrawerVisible,    setDetailDrawerVisible]    = useState(false);
//   const [editModalVisible,       setEditModalVisible]       = useState(false);
//   const [sendModalVisible,       setSendModalVisible]       = useState(false);
//   const [createPOModalVisible,   setCreatePOModalVisible]   = useState(false);
//   const [emailPDFModalVisible,   setEmailPDFModalVisible]   = useState(false);
//   const [bulkDownloadModalVisible,setBulkDownloadModalVisible]=useState(false);

//   // ── Selected records ──────────────────────────────────────────────────────
//   const [selectedPO,         setSelectedPO]         = useState(null);

//   // ── Tender enforcement ────────────────────────────────────────────────────
//   const [selectedTenderId,   setSelectedTenderId]   = useState(null);
//   const [tenderError,        setTenderError]        = useState(false);

//   // ── Supplier selection ────────────────────────────────────────────────────
//   const [isExternalSupplier,       setIsExternalSupplier]       = useState(false);
//   const [itemSearchOptions,        setItemSearchOptions]        = useState([]);

//   // ── Forms ─────────────────────────────────────────────────────────────────
//   const [form]         = Form.useForm();
//   const [sendForm]     = Form.useForm();
//   const [createPOForm] = Form.useForm();
//   const [emailPDFForm] = Form.useForm();

//   // ─────────────────────────────────────────────
//   // Data loading
//   // ─────────────────────────────────────────────
//   const loadPurchaseOrders = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await buyerRequisitionAPI.getPurchaseOrders();
//       if (res.success && res.data) setPurchaseOrders(res.data);
//       else message.error('Failed to load purchase orders');
//     } catch { message.error('Error loading purchase orders'); }
//     finally { setLoading(false); setInitialLoading(false); }
//   }, []);

//   const loadApprovedTenders = useCallback(async () => {
//     setTendersLoading(true);
//     try {
//       // Only approved + awarded tenders are valid for PO creation
//       const [resApproved, resAwarded] = await Promise.all([
//         tenderAPI.getTenders({ status: 'approved' }),
//         tenderAPI.getTenders({ status: 'awarded'  })
//       ]);
//       const all = [
//         ...(resApproved.success ? resApproved.data : []),
//         ...(resAwarded.success  ? resAwarded.data  : [])
//       ];
//       // Exclude tenders that already have a PO
//       setTenders(all.filter(t => !t.purchaseOrderId));
//     } catch { message.warning('Could not load tenders'); }
//     finally { setTendersLoading(false); }
//   }, []);

//   const loadSuppliers = useCallback(async () => {
//     try {
//       const res = await UnifiedSupplierAPI.getAllSuppliers({ status: 'approved' });
//       if (res.success && res.data) setSuppliers(res.data);
//     } catch { message.warning('Could not load suppliers'); }
//   }, []);

//   const loadItems = useCallback(async () => {
//     try {
//       const res = await buyerRequisitionAPI.getItems({ limit: 200 });
//       if (res.success && res.data) setItems(res.data);
//     } catch { message.warning('Could not load items'); }
//   }, []);

//   const loadItemCategories = useCallback(async () => {
//     try {
//       const res = await buyerRequisitionAPI.getItemCategories();
//       if (res.success && res.data) setItemCategories(res.data);
//     } catch {}
//   }, []);

//   const loadBudgetCodes = useCallback(async () => {
//     try {
//       const res = await buyerRequisitionAPI.getBudgetCodes();
//       if (res.success && res.data) setBudgetCodes(res.data);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     Promise.all([
//       loadPurchaseOrders(),
//       loadApprovedTenders(),
//       loadSuppliers(),
//       loadItems(),
//       loadItemCategories(),
//       loadBudgetCodes()
//     ]);
//   }, []);

//   // ─────────────────────────────────────────────
//   // Filtered POs by tab
//   // ─────────────────────────────────────────────
//   const getFilteredPOs = () => {
//     switch (activeTab) {
//       case 'active':  return purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status));
//       case 'overdue': return purchaseOrders.filter(po =>
//         moment(po.expectedDeliveryDate).isBefore(moment()) &&
//         !['delivered','completed','cancelled'].includes(po.status)
//       );
//       case 'delivered': return purchaseOrders.filter(po => ['delivered','completed'].includes(po.status));
//       default: return purchaseOrders;
//     }
//   };

//   const stats = {
//     total:    purchaseOrders.length,
//     active:   purchaseOrders.filter(po => !['delivered','completed','cancelled'].includes(po.status)).length,
//     overdue:  purchaseOrders.filter(po =>
//       moment(po.expectedDeliveryDate).isBefore(moment()) &&
//       !['delivered','completed','cancelled'].includes(po.status)).length,
//     totalValue: purchaseOrders.reduce((s, po) => s + (po.totalAmount || 0), 0)
//   };

//   // ─────────────────────────────────────────────
//   // Item search (autocomplete)
//   // ─────────────────────────────────────────────
//   const searchItems = async (text) => {
//     if (!text || text.length < 2) { setItemSearchOptions([]); return; }
//     try {
//       const res = await buyerRequisitionAPI.searchItems(text, 10);
//       if (res.success && res.data) {
//         setItemSearchOptions(res.data.map(item => ({
//           value: item._id,
//           label: `${item.code} - ${item.description}`,
//           item
//         })));
//       }
//     } catch {}
//   };

//   const handleItemSelect = (value, option, formIndex) => {
//     const itm = option.item;
//     const current = createPOForm.getFieldValue('items') || [];
//     current[formIndex] = {
//       ...current[formIndex],
//       itemId: itm._id,
//       description: itm.description,
//       unitPrice: itm.standardPrice || current[formIndex]?.unitPrice || 0,
//       unitOfMeasure: itm.unitOfMeasure,
//       category: itm.category
//     };
//     createPOForm.setFieldsValue({ items: current });
//   };

//   // ─────────────────────────────────────────────
//   // Create PO — with tender gate
//   // ─────────────────────────────────────────────
//   const handleCreateNewPO = () => {
//     if (tenders.length === 0 && !tendersLoading) {
//       // Hard block: no approved tenders exist
//       Modal.error({
//         title: 'Tender Required to Create a Purchase Order',
//         width: 520,
//         content: (
//           <div>
//             <p>You cannot create a Purchase Order without first having an <strong>approved</strong> or <strong>awarded</strong> tender.</p>
//             <br />
//             <p><strong>Steps to proceed:</strong></p>
//             <ol style={{ paddingLeft: 20, lineHeight: 2 }}>
//               <li>Go to <strong>Tender Management</strong></li>
//               <li>Create a tender — either from an existing RFQ (recommended) or manually</li>
//               <li>Submit it for approval and get it approved / awarded</li>
//               <li>Come back here to create your PO</li>
//             </ol>
//           </div>
//         ),
//         okText: 'Got it'
//       });
//       return;
//     }

//     // Open the create modal
//     setSelectedTenderId(null);
//     setTenderError(false);
//     setIsExternalSupplier(false);
//     createPOForm.resetFields();
//     setItemSearchOptions([]);
//     setCreatePOModalVisible(true);
//   };

//   const handleCreatePO = async () => {
//     // Gate: tender must be selected
//     if (!selectedTenderId) {
//       setTenderError(true);
//       message.error('Please select a tender before creating a Purchase Order');
//       return;
//     }

//     try {
//       const values = await createPOForm.validateFields();
//       setLoading(true);

//       const selectedTender = tenders.find(t => t._id === selectedTenderId);

//       let supplierDetails;
//       if (isExternalSupplier) {
//         if (!values.externalSupplierName || !values.externalSupplierEmail) {
//           message.error('Please provide external supplier name and email');
//           setLoading(false);
//           return;
//         }
//         supplierDetails = {
//           id: null,
//           name: values.externalSupplierName,
//           email: values.externalSupplierEmail,
//           phone: values.externalSupplierPhone || '',
//           address: values.externalSupplierAddress || '',
//           isExternal: true
//         };
//       } else {
//         if (!values.supplierId) {
//           message.error('Please select a supplier');
//           setLoading(false);
//           return;
//         }
//         const sup = suppliers.find(s => s._id === values.supplierId);
//         if (!sup) { message.error('Selected supplier not found'); setLoading(false); return; }
//         const addr = sup.supplierDetails?.address;
//         supplierDetails = {
//           id: sup._id,
//           name: sup.supplierDetails?.companyName || sup.fullName || sup.name || '',
//           email: sup.email || '',
//           phone: sup.phoneNumber || sup.supplierDetails?.phoneNumber || '',
//           address: typeof addr === 'object'
//             ? `${addr.street || ''}, ${addr.city || ''}, ${addr.state || ''}`.trim().replace(/^,|,$/g, '')
//             : addr || '',
//           isExternal: false
//         };
//       }

//       const totalAmount = (values.items || []).reduce((s, item) => s + ((item.quantity || 0) * (item.unitPrice || 0)), 0);

//       const poData = {
//         supplierDetails,
//         items: (values.items || []).map(item => ({
//           ...item,
//           totalPrice: (item.quantity || 0) * (item.unitPrice || 0),
//           ...(item.itemId ? { itemId: item.itemId } : {})
//         })),
//         totalAmount,
//         tenderId: selectedTenderId,          // ← link to tender
//         tenderNumber: selectedTender?.tenderNumber,
//         currency: values.currency || 'XAF',
//         taxApplicable: values.taxApplicable || false,
//         taxRate: values.taxRate || 19.25,
//         deliveryAddress: values.deliveryAddress,
//         expectedDeliveryDate: values.expectedDeliveryDate?.endOf('day').toISOString(),
//         paymentTerms: values.paymentTerms,
//         specialInstructions: values.specialInstructions,
//         notes: values.notes
//       };

//       const res = await buyerRequisitionAPI.createPurchaseOrder(poData);
//       if (res.success) {
//         message.success('Purchase order created successfully!');
//         notification.success({
//           message: 'Purchase Order Created',
//           description: `PO linked to tender ${selectedTender?.tenderNumber}. Sending to Supply Chain for assignment.`,
//           duration: 6
//         });
//         setCreatePOModalVisible(false);
//         createPOForm.resetFields();
//         setSelectedTenderId(null);
//         setTenderError(false);
//         setIsExternalSupplier(false);
//         await loadPurchaseOrders();
//         await loadApprovedTenders(); // refresh — this tender may now be used
//       } else {
//         message.error(res.message || 'Failed to create purchase order');
//       }
//     } catch (e) {
//       if (e?.errorFields) message.error('Please fill all required fields');
//       else { console.error(e); message.error('Failed to create purchase order'); }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // ─────────────────────────────────────────────
//   // Other PO actions (unchanged from original)
//   // ─────────────────────────────────────────────
//   const handleViewDetails = async (po) => {
//     setLoading(true);
//     try {
//       const res = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
//       if (res.success && res.data) { setSelectedPO(res.data.purchaseOrder); setDetailDrawerVisible(true); }
//       else message.error('Failed to load PO details');
//     } catch { message.error('Error loading PO details'); }
//     finally { setLoading(false); }
//   };

//   const handleEditPO = (po) => {
//     setSelectedPO(po);
//     const cleanedItems = (po.items || []).map(item => ({
//       description: item.description,
//       quantity: item.quantity,
//       unitPrice: item.unitPrice,
//       unitOfMeasure: item.unitOfMeasure || 'Units',
//       category: item.category || '',
//       specifications: item.specifications || '',
//       ...(item.itemId ? { itemId: item.itemId } : {})
//     }));
//     form.setFieldsValue({
//       expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
//       deliveryAddress: po.deliveryAddress,
//       paymentTerms: po.paymentTerms,
//       specialInstructions: po.specialInstructions || '',
//       notes: po.notes || '',
//       currency: po.currency || 'XAF',
//       taxApplicable: po.taxApplicable || false,
//       taxRate: po.taxRate || 19.25,
//       items: cleanedItems
//     });
//     setEditModalVisible(true);
//   };

//   const handleUpdatePO = async () => {
//     try {
//       const values = await form.validateFields();
//       setLoading(true);
//       const calculatedTotal = (values.items || []).reduce((s, i) => s + ((i.quantity || 0) * (i.unitPrice || 0)), 0);
//       const updateData = {
//         expectedDeliveryDate: values.expectedDeliveryDate?.endOf('day').toISOString(),
//         deliveryAddress: values.deliveryAddress,
//         paymentTerms: values.paymentTerms,
//         specialInstructions: values.specialInstructions || '',
//         notes: values.notes || '',
//         currency: values.currency,
//         taxApplicable: values.taxApplicable || false,
//         taxRate: values.taxRate || 19.25,
//         totalAmount: calculatedTotal,
//         items: (values.items || []).map(item => ({
//           description: item.description,
//           quantity: item.quantity,
//           unitPrice: item.unitPrice,
//           totalPrice: (item.quantity || 0) * (item.unitPrice || 0),
//           specifications: item.specifications || '',
//           unitOfMeasure: item.unitOfMeasure || 'Units',
//           category: item.category || '',
//           ...(item.itemId ? { itemId: item.itemId } : {})
//         }))
//       };
//       const res = await buyerRequisitionAPI.updatePurchaseOrder(selectedPO.id, updateData);
//       if (res.success) {
//         message.success('Purchase order updated successfully!');
//         setEditModalVisible(false);
//         form.resetFields();
//         await loadPurchaseOrders();
//       } else message.error(res.message || 'Failed to update PO');
//     } catch (e) {
//       if (e?.errorFields) message.error('Please fill all required fields');
//       else message.error('Error updating PO');
//     } finally { setLoading(false); }
//   };

//   const handleSendPO = (po) => { setSelectedPO(po); sendForm.resetFields(); setSendModalVisible(true); };

//   const handleSendPOToSupplier = async () => {
//     try {
//       const values = await sendForm.validateFields();
//       setLoading(true);
//       const res = await buyerRequisitionAPI.sendPurchaseOrderToSupplier(selectedPO.id, { message: values.message });
//       if (res.success) {
//         message.success('Purchase order sent to supplier!');
//         setSendModalVisible(false);
//         sendForm.resetFields();
//         notification.success({
//           message: 'PO Sent',
//           description: `${selectedPO.poNumber} sent to ${selectedPO.supplierName} via email.`,
//           duration: 5
//         });
//         await loadPurchaseOrders();
//       } else message.error(res.message || 'Failed to send PO');
//     } catch { message.error('Failed to send PO'); }
//     finally { setLoading(false); }
//   };

//   const handleSendToSupplyChain = async (po) => {
//     try {
//       setLoading(true);
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}`, {
//         method: 'PUT',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//         body: JSON.stringify({ status: 'pending_supply_chain_assignment' })
//       });
//       const data = await res.json();
//       if (data.success) {
//         message.success('PO sent to Supply Chain');
//         notification.success({ message: 'PO Sent to Supply Chain', description: `${po.poNumber} is now pending department assignment.`, duration: 5 });
//         await loadPurchaseOrders();
//       } else throw new Error(data.message);
//     } catch (e) { message.error(e.message || 'Failed to send to Supply Chain'); }
//     finally { setLoading(false); }
//   };

//   const handleCancelPO = (po) => {
//     let reason = '';
//     Modal.confirm({
//       title: `Cancel PO ${po.poNumber}?`,
//       content: (
//         <div>
//           <p>This action cannot be undone.</p>
//           <TextArea
//             placeholder="Reason for cancellation (required)…"
//             rows={3}
//             style={{ marginTop: 12 }}
//             onChange={e => { reason = e.target.value; }}
//           />
//         </div>
//       ),
//       okText: 'Cancel PO', okType: 'danger',
//       onOk: async () => {
//         if (!reason.trim()) { message.error('Please provide a cancellation reason'); return; }
//         setLoading(true);
//         try {
//           const res = await buyerRequisitionAPI.cancelPurchaseOrder(po.id, { cancellationReason: reason.trim() });
//           if (res.success) { message.success(`PO ${po.poNumber} cancelled`); await loadPurchaseOrders(); }
//           else message.error(res.message || 'Failed to cancel PO');
//         } catch { message.error('Error cancelling PO'); }
//         finally { setLoading(false); }
//       }
//     });
//   };

//   const handleDownloadPDF = async (po) => {
//     setPdfLoading(true);
//     try {
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/download-pdf`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       if (!res.ok) throw new Error((await res.json()).message || 'Failed to download PDF');
//       const blob = await res.blob();
//       const url  = window.URL.createObjectURL(blob);
//       const a    = document.createElement('a');
//       a.href = url; a.download = `PO_${po.poNumber}_${moment().format('YYYY-MM-DD')}.pdf`;
//       document.body.appendChild(a); a.click(); document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//       message.success(`PDF downloaded for ${po.poNumber}`);
//     } catch (e) { message.error(e.message || 'Failed to download PDF'); }
//     finally { setPdfLoading(false); }
//   };

//   const handlePreviewPDF = async (po) => {
//     setPdfLoading(true);
//     try {
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res  = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/preview-pdf`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//       });
//       if (!res.ok) throw new Error('Failed to load preview');
//       const blob = await res.blob();
//       const win  = window.open('');
//       win.location.href = window.URL.createObjectURL(blob);
//     } catch (e) { message.error(e.message || 'Failed to open PDF preview'); }
//     finally { setPdfLoading(false); }
//   };

//   const handleEmailPDF = (po) => {
//     setSelectedPO(po);
//     emailPDFForm.resetFields();
//     emailPDFForm.setFieldsValue({ emailTo: po.supplierEmail, emailType: 'supplier' });
//     setEmailPDFModalVisible(true);
//   };

//   const handleSendEmailPDF = async () => {
//     try {
//       const values = await emailPDFForm.validateFields();
//       setPdfLoading(true);
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders/${selectedPO.id}/email-pdf`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//         body: JSON.stringify(values)
//       });
//       const data = await res.json();
//       if (!res.ok || !data.success) throw new Error(data.message || 'Failed to send PDF email');
//       message.success(`PDF emailed to ${values.emailTo}`);
//       setEmailPDFModalVisible(false);
//     } catch (e) { message.error(e.message || 'Failed to send PDF email'); }
//     finally { setPdfLoading(false); }
//   };

//   const handleBulkDownload = async () => {
//     if (!selectedRowKeys.length) { message.warning('Select POs first'); return; }
//     setPdfLoading(true);
//     try {
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const res = await fetch(`${apiUrl}/buyer/purchase-orders/bulk-download`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
//         body: JSON.stringify({ poIds: selectedRowKeys })
//       });
//       if (!res.ok) throw new Error((await res.json()).message || 'Bulk download failed');
//       const blob = await res.blob();
//       const a = document.createElement('a');
//       a.href = window.URL.createObjectURL(blob);
//       a.download = `Purchase_Orders_${moment().format('YYYY-MM-DD')}.zip`;
//       document.body.appendChild(a); a.click(); document.body.removeChild(a);
//       message.success(`${selectedRowKeys.length} POs downloaded`);
//       setBulkDownloadModalVisible(false);
//       setSelectedRowKeys([]);
//     } catch (e) { message.error(e.message || 'Bulk download failed'); }
//     finally { setPdfLoading(false); }
//   };

//   // ─────────────────────────────────────────────
//   // Table columns
//   // ─────────────────────────────────────────────
//   const columns = [
//     {
//       title: 'PO Details', key: 'details',
//       render: (_, r) => (
//         <div>
//           <Text strong>{r.poNumber || r.id}</Text><br />
//           {r.requisitionId && <><Text type="secondary" style={{ fontSize: 11 }}>Req: {r.requisitionId}</Text><br /></>}
//           <Text type="secondary" style={{ fontSize: 11 }}>{moment(r.creationDate).format('MMM DD, HH:mm')}</Text>
//           {r.tenderNumber && (
//             <><br /><Tag color="purple" style={{ fontSize: 10 }} icon={<FileDoneOutlined />}>{r.tenderNumber}</Tag></>
//           )}
//         </div>
//       ), width: 150
//     },
//     {
//       title: 'Supplier', key: 'supplier',
//       render: (_, r) => (
//         <div>
//           <Text strong>{r.supplierName}</Text><br />
//           <Text type="secondary" style={{ fontSize: 12 }}><MailOutlined /> {r.supplierEmail}</Text>
//         </div>
//       ), width: 180
//     },
//     {
//       title: 'Amount', key: 'amount',
//       render: (_, r) => <Text strong style={{ color: '#1890ff', fontSize: 15 }}>{r.currency} {r.totalAmount?.toLocaleString()}</Text>,
//       width: 130,
//       sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0)
//     },
//     {
//       title: 'Progress', key: 'progress',
//       render: (_, r) => (
//         <div>
//           <Progress percent={r.progress || 0} size="small" status={r.status === 'cancelled' ? 'exception' : 'active'} />
//           <Text type="secondary" style={{ fontSize: 11 }}>
//             {STAGE_LABELS[STAGE_IDX[r.currentStage]] || 'Created'}
//           </Text>
//         </div>
//       ), width: 150
//     },
//     {
//       title: 'Delivery', key: 'delivery',
//       render: (_, r) => {
//         if (!r.expectedDeliveryDate) return <Text type="secondary">—</Text>;
//         const overdue = moment(r.expectedDeliveryDate).isBefore(moment()) && !['delivered','completed','cancelled'].includes(r.status);
//         const days    = moment(r.expectedDeliveryDate).diff(moment(), 'days');
//         return (
//           <div>
//             <Text type={overdue ? 'danger' : 'default'}>{moment(r.expectedDeliveryDate).format('MMM DD')}</Text><br />
//             <Text type="secondary" style={{ fontSize: 11 }}>
//               {overdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today' : days > 0 ? `${days}d left` : 'Delivered'}
//             </Text>
//             {overdue && <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 4 }} />}
//           </div>
//         );
//       }, width: 110
//     },
//     {
//       title: 'Status', dataIndex: 'status', key: 'status',
//       render: (s) => getStatusTag(s), width: 150
//     },
//     {
//       title: 'Actions', key: 'actions', width: 200, fixed: 'right',
//       render: (_, r) => (
//         <Space size={4} direction="vertical">
//           <Space size={4}>
//             <Tooltip title="View"><Button size="small" icon={<EyeOutlined />} onClick={() => handleViewDetails(r)} /></Tooltip>
//             {r.status === 'draft' && (
//               <Tooltip title="Send to Supply Chain">
//                 <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSendToSupplyChain(r)}>SC</Button>
//               </Tooltip>
//             )}
//             {r.status === 'approved' && (
//               <Tooltip title="Send to Supplier">
//                 <Button size="small" type="primary" icon={<SendOutlined />} onClick={() => handleSendPO(r)} />
//               </Tooltip>
//             )}
//             {!['delivered','completed','cancelled','pending_supply_chain_assignment'].includes(r.status) && (
//               <Tooltip title="Edit"><Button size="small" icon={<EditOutlined />} onClick={() => handleEditPO(r)} /></Tooltip>
//             )}
//           </Space>
//           <Space size={4}>
//             <Tooltip title="Download PDF"><Button size="small" icon={<DownloadOutlined />} loading={pdfLoading} onClick={() => handleDownloadPDF(r)} /></Tooltip>
//             <Tooltip title="Preview PDF"><Button size="small" icon={<FilePdfOutlined />} loading={pdfLoading} onClick={() => handlePreviewPDF(r)} /></Tooltip>
//             <Tooltip title="Email PDF"><Button size="small" icon={<ShareAltOutlined />} onClick={() => handleEmailPDF(r)} /></Tooltip>
//             {!['delivered','completed','cancelled'].includes(r.status) && (
//               <Tooltip title="Cancel"><Button size="small" danger icon={<StopOutlined />} onClick={() => handleCancelPO(r)} /></Tooltip>
//             )}
//           </Space>
//         </Space>
//       )
//     }
//   ];

//   // ─────────────────────────────────────────────
//   // Loading screen
//   // ─────────────────────────────────────────────
//   if (initialLoading) {
//     return (
//       <div style={{ padding: 24, textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: 16 }}><Text>Loading purchase orders…</Text></div>
//       </div>
//     );
//   }

//   // ─────────────────────────────────────────────
//   // Render
//   // ─────────────────────────────────────────────
//   return (
//     <div style={{ padding: 24 }}>
//       <Card>
//         {/* ── Header ── */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
//           <div>
//             <Title level={3} style={{ margin: 0 }}>
//               <FileTextOutlined style={{ marginRight: 8 }} />
//               Purchase Order Management
//             </Title>
//             <Text type="secondary">All POs must be linked to an approved tender</Text>
//           </div>
//           <Space>
//             <Button icon={<ReloadOutlined />} onClick={loadPurchaseOrders} loading={loading}>Refresh</Button>
//             {selectedRowKeys.length > 0 && (
//               <Button icon={<FileZipOutlined />} onClick={() => setBulkDownloadModalVisible(true)} loading={pdfLoading}>
//                 Bulk Download ({selectedRowKeys.length})
//               </Button>
//             )}
//             <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateNewPO}>
//               Create New PO
//             </Button>
//           </Space>
//         </div>

//         {/* ── Stats ── */}
//         <Row gutter={16} style={{ marginBottom: 24 }}>
//           <Col span={5}><Statistic title="Total POs"   value={stats.total}              valueStyle={{ color: '#1890ff' }} /></Col>
//           <Col span={5}><Statistic title="Active"      value={stats.active}             valueStyle={{ color: '#faad14' }} /></Col>
//           <Col span={5}><Statistic title="Overdue"     value={stats.overdue}            valueStyle={{ color: '#ff4d4f' }} /></Col>
//           <Col span={5}><Statistic title="Total Value" value={`${(stats.totalValue/1000000).toFixed(1)}M`} suffix="XAF" valueStyle={{ color: '#13c2c2' }} /></Col>
//           <Col span={4}>
//             <Card size="small" style={{ background: tenders.length > 0 ? '#f6ffed' : '#fff1f0', border: `1px solid ${tenders.length > 0 ? '#b7eb8f' : '#ffa39e'}` }}>
//               <div style={{ fontSize: 12 }}>
//                 <FileDoneOutlined style={{ marginRight: 6, color: tenders.length > 0 ? '#52c41a' : '#ff4d4f' }} />
//                 <Text strong style={{ color: tenders.length > 0 ? '#52c41a' : '#ff4d4f' }}>
//                   {tenders.length} tender{tenders.length !== 1 ? 's' : ''} available
//                 </Text>
//               </div>
//             </Card>
//           </Col>
//         </Row>

//         {/* Overdue alert */}
//         {stats.overdue > 0 && (
//           <Alert
//             message={`${stats.overdue} Purchase Order${stats.overdue !== 1 ? 's' : ''} Overdue`}
//             type="error" showIcon style={{ marginBottom: 16 }}
//             action={<Button size="small" danger onClick={() => setActiveTab('overdue')}>View Overdue</Button>}
//           />
//         )}

//         {/* Tender warning */}
//         {tenders.length === 0 && !tendersLoading && (
//           <Alert
//             message="No Approved Tenders — PO Creation is Blocked"
//             description="You need at least one approved or awarded tender before you can create a Purchase Order. Go to Tender Management to create one."
//             type="warning"
//             showIcon
//             style={{ marginBottom: 16 }}
//           />
//         )}

//         {/* ── Tabs + Table ── */}
//         <Tabs
//           activeKey={activeTab}
//           onChange={setActiveTab}
//           items={[
//             { key: 'all',       label: `All (${stats.total})` },
//             { key: 'active',    label: `Active (${stats.active})` },
//             { key: 'overdue',   label: <Badge count={stats.overdue} size="small"><span style={{ paddingRight: stats.overdue > 0 ? 16 : 0 }}>Overdue</span></Badge> },
//             { key: 'delivered', label: 'Delivered' }
//           ]}
//         />
//         <Table
//           columns={columns}
//           dataSource={getFilteredPOs()}
//           rowKey="id"
//           rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys, getCheckboxProps: r => ({ disabled: r.status === 'cancelled' }) }}
//           loading={loading}
//           pagination={{ pageSize: 10, showTotal: (t, r) => `${r[0]}-${r[1]} of ${t} purchase orders` }}
//           scroll={{ x: 'max-content' }}
//         />
//       </Card>

//       {/* ══════════════════════════════════════════
//           CREATE PO MODAL  — tender required
//       ══════════════════════════════════════════ */}
//       <Modal
//         title={
//           <Space>
//             <PlusOutlined />
//             Create New Purchase Order
//             <Tag color="purple" icon={<FileDoneOutlined />}>Tender Required</Tag>
//           </Space>
//         }
//         open={createPOModalVisible}
//         onOk={handleCreatePO}
//         onCancel={() => { setCreatePOModalVisible(false); setSelectedTenderId(null); setTenderError(false); setIsExternalSupplier(false); }}
//         confirmLoading={loading}
//         width={1100}
//         maskClosable={false}
//         style={{ top: 20 }}
//         styles={{ body: { maxHeight: '82vh', overflowY: 'auto' } }}
//         destroyOnClose
//       >
//         {/* ── TENDER SELECTION (mandatory gate) ── */}
//         <TenderSelectionBlock
//           tenders={tenders}
//           loading={tendersLoading}
//           selectedId={selectedTenderId}
//           onSelect={(val) => { setSelectedTenderId(val); setTenderError(false); }}
//           error={tenderError}
//         />

//         <Form form={createPOForm} layout="vertical">
//           {/* ── Supplier type ── */}
//           <Row gutter={16}>
//             <Col span={12}>
//               <Form.Item name="supplierType" label="Supplier Type" initialValue="registered" rules={[{ required: true }]}>
//                 <Select onChange={(v) => { setIsExternalSupplier(v === 'external'); if (v !== 'external') createPOForm.setFieldsValue({ supplierId: undefined }); }}>
//                   <Option value="registered">Registered Supplier</Option>
//                   <Option value="external">External / New Supplier</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item name="currency" label="Currency" initialValue="XAF" rules={[{ required: true }]}>
//                 <Select>
//                   <Option value="XAF">XAF (Central African Franc)</Option>
//                   <Option value="USD">USD</Option>
//                   <Option value="EUR">EUR</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           {!isExternalSupplier ? (
//             <Form.Item name="supplierId" label="Select Registered Supplier" rules={[{ required: !isExternalSupplier, message: 'Please select a supplier' }]}>
//               <Select placeholder="Search supplier" showSearch optionLabelProp="label"
//                 filterOption={(input, opt) => {
//                   const s = suppliers.find(s => s._id === opt.value);
//                   if (!s) return false;
//                   return `${s.supplierDetails?.companyName || ''} ${s.email || ''} ${s.supplierDetails?.supplierType || ''}`.toLowerCase().includes(input.toLowerCase());
//                 }}
//               >
//                 {suppliers.map(s => (
//                   <Option key={s._id} value={s._id} label={s.supplierDetails?.companyName || s.email}>
//                     <div>
//                       <Text strong>{s.supplierDetails?.companyName || 'Unnamed'}</Text>
//                       <br />
//                       <Text type="secondary" style={{ fontSize: 11 }}>{s.email} · {s.supplierDetails?.supplierType || ''}</Text>
//                     </div>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           ) : (
//             <Alert message="External Supplier Details" type="info" showIcon style={{ marginBottom: 12 }} />
//           )}

//           {isExternalSupplier && (
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Form.Item name="externalSupplierName" label="Supplier Name" rules={[{ required: true }]}>
//                   <Input placeholder="Company name" />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item name="externalSupplierEmail" label="Email" rules={[{ required: true }, { type: 'email' }]}>
//                   <Input placeholder="supplier@email.com" />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item name="externalSupplierPhone" label="Phone">
//                   <Input placeholder="+237 …" />
//                 </Form.Item>
//               </Col>
//               <Col span={12}>
//                 <Form.Item name="externalSupplierAddress" label="Address">
//                   <Input placeholder="Address" />
//                 </Form.Item>
//               </Col>
//             </Row>
//           )}

//           <Divider>Items</Divider>

//           <Form.List name="items" rules={[{ validator: async (_, v) => { if (!v || v.length < 1) return Promise.reject('At least one item is required'); } }]}>
//             {(fields, { add, remove }, { errors }) => (
//               <>
//                 {fields.map(({ key, name, ...rest }) => (
//                   <Card key={key} size="small" style={{ marginBottom: 12, borderLeft: '3px solid #1890ff' }}
//                     title={`Item ${name + 1}`}
//                     extra={fields.length > 1 ? <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Remove</Button> : null}
//                   >
//                     <Row gutter={16}>
//                       <Col span={12}>
//                         <Form.Item {...rest} name={[name, 'description']} label="Description" rules={[{ required: true }]}>
//                           <Input placeholder="Item description" />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item {...rest} name={[name, 'quantity']} label="Quantity" rules={[{ required: true }]}>
//                           <InputNumber min={1} style={{ width: '100%' }} />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item {...rest} name={[name, 'unitPrice']} label="Unit Price" rules={[{ required: true }]}>
//                           <InputNumber min={0} style={{ width: '100%' }}
//                             formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={v => v.replace(/,/g, '')} />
//                         </Form.Item>
//                       </Col>
//                     </Row>
//                     <Row gutter={16}>
//                       <Col span={8}>
//                         <Form.Item {...rest} name={[name, 'unitOfMeasure']} label="Unit of Measure">
//                           <Select placeholder="Unit" allowClear>
//                             {['Pieces','Sets','Boxes','Packs','Units','Each','Kg','Litres','Meters'].map(u => <Option key={u} value={u}>{u}</Option>)}
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                       <Col span={8}>
//                         <Form.Item {...rest} name={[name, 'category']} label="Category">
//                           <Select placeholder="Category" allowClear>
//                             {itemCategories.map(c => <Option key={c} value={c}>{c}</Option>)}
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                       <Col span={8}>
//                         <Form.Item {...rest} name={[name, 'specifications']} label="Specifications">
//                           <Input placeholder="Optional specifications" />
//                         </Form.Item>
//                       </Col>
//                     </Row>
//                     <Form.Item {...rest} name={[name, 'itemId']} hidden><Input /></Form.Item>
//                   </Card>
//                 ))}
//                 <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
//                 <Form.ErrorList errors={errors} />
//               </>
//             )}
//           </Form.List>

//           <Divider>Delivery &amp; Payment</Divider>

//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date" initialValue={moment().add(14, 'days')} rules={[{ required: true }]}>
//                 <DatePicker style={{ width: '100%' }} disabledDate={c => c && c < moment().startOf('day')} />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="paymentTerms" label="Payment Terms" rules={[{ required: true }]}>
//                 <Select placeholder="Select payment terms">
//                   {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t => <Option key={t} value={t}>{t}</Option>)}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="taxApplicable" valuePropName="checked" label=" ">
//                 <Checkbox>Apply Tax</Checkbox>
//               </Form.Item>
//             </Col>
//           </Row>
//           <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{ required: true }]}>
//             <TextArea rows={2} placeholder="Full delivery address…" />
//           </Form.Item>
//           <Form.Item name="specialInstructions" label="Special Instructions">
//             <TextArea rows={2} placeholder="Special instructions for the supplier…" />
//           </Form.Item>
//           <Form.Item name="notes" label="Internal Notes">
//             <TextArea rows={2} placeholder="Internal notes (not sent to supplier)…" />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ EDIT PO MODAL ══ */}
//       <Modal
//         title={`Edit PO — ${selectedPO?.poNumber}`}
//         open={editModalVisible}
//         onOk={handleUpdatePO}
//         onCancel={() => { setEditModalVisible(false); form.resetFields(); }}
//         confirmLoading={loading}
//         width={900}
//         destroyOnClose
//       >
//         <Form form={form} layout="vertical">
//           <Row gutter={16}>
//             <Col span={8}>
//               <Form.Item name="expectedDeliveryDate" label="Expected Delivery Date" rules={[{ required: true }]}>
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="paymentTerms" label="Payment Terms" rules={[{ required: true }]}>
//                 <Select>
//                   {['15 days','30 days','45 days','60 days','Cash on delivery','Advance payment'].map(t => <Option key={t} value={t}>{t}</Option>)}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item name="currency" label="Currency" rules={[{ required: true }]}>
//                 <Select><Option value="XAF">XAF</Option><Option value="USD">USD</Option><Option value="EUR">EUR</Option></Select>
//               </Form.Item>
//             </Col>
//           </Row>
//           <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{ required: true }]}>
//             <TextArea rows={2} />
//           </Form.Item>

//           <Divider>Items</Divider>

//           <Form.List name="items">
//             {(fields, { add, remove }) => (
//               <>
//                 {fields.map(({ key, name, ...rest }) => (
//                   <Card key={key} size="small" style={{ marginBottom: 10 }} title={`Item ${name + 1}`}
//                     extra={fields.length > 1 ? <Button size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)}>Remove</Button> : null}
//                   >
//                     <Row gutter={16}>
//                       <Col span={12}>
//                         <Form.Item {...rest} name={[name, 'description']} label="Description" rules={[{ required: true }]}>
//                           <Input />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item {...rest} name={[name, 'quantity']} label="Quantity" rules={[{ required: true }]}>
//                           <InputNumber min={1} style={{ width: '100%' }} />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item {...rest} name={[name, 'unitPrice']} label="Unit Price" rules={[{ required: true }]}>
//                           <InputNumber min={0} style={{ width: '100%' }}
//                             formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={v => v.replace(/,/g, '')} />
//                         </Form.Item>
//                       </Col>
//                     </Row>
//                     <Form.Item {...rest} name={[name, 'itemId']} hidden><Input /></Form.Item>
//                   </Card>
//                 ))}
//                 <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Add Item</Button>
//               </>
//             )}
//           </Form.List>

//           <Divider />
//           <Form.Item name="specialInstructions" label="Special Instructions"><TextArea rows={2} /></Form.Item>
//           <Form.Item name="notes" label="Internal Notes"><TextArea rows={2} /></Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ SEND TO SUPPLIER MODAL ══ */}
//       <Modal
//         title={`Send PO to Supplier — ${selectedPO?.poNumber}`}
//         open={sendModalVisible}
//         onOk={handleSendPOToSupplier}
//         onCancel={() => setSendModalVisible(false)}
//         confirmLoading={loading}
//         width={560}
//       >
//         <Alert message={`PO will be emailed to ${selectedPO?.supplierName} at ${selectedPO?.supplierEmail}`} type="info" showIcon style={{ marginBottom: 16 }} />
//         <Form form={sendForm} layout="vertical">
//           <Form.Item name="message" label="Additional Message (Optional)">
//             <TextArea rows={4} placeholder="Add any message for the supplier…" maxLength={1000} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ EMAIL PDF MODAL ══ */}
//       <Modal
//         title={<Space><ShareAltOutlined />Email PDF — {selectedPO?.poNumber}</Space>}
//         open={emailPDFModalVisible}
//         onOk={handleSendEmailPDF}
//         onCancel={() => setEmailPDFModalVisible(false)}
//         confirmLoading={pdfLoading}
//         width={560}
//       >
//         <Form form={emailPDFForm} layout="vertical">
//           <Form.Item name="emailTo" label="Recipient Email" rules={[{ required: true }, { type: 'email' }]}>
//             <Input prefix={<MailOutlined />} placeholder="recipient@email.com" />
//           </Form.Item>
//           <Form.Item name="message" label="Message (Optional)">
//             <TextArea rows={3} placeholder="Message to include with the PDF…" maxLength={1000} showCount />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ══ BULK DOWNLOAD MODAL ══ */}
//       <Modal
//         title={<Space><FileZipOutlined />Bulk Download ({selectedRowKeys.length} POs)</Space>}
//         open={bulkDownloadModalVisible}
//         onOk={handleBulkDownload}
//         onCancel={() => setBulkDownloadModalVisible(false)}
//         confirmLoading={pdfLoading}
//         okText="Download ZIP"
//         width={480}
//       >
//         <p>Download {selectedRowKeys.length} selected purchase orders as PDF files in a ZIP archive.</p>
//       </Modal>

//       {/* ══ DETAIL DRAWER ══ */}
//       <Drawer
//         title={<Space><FileTextOutlined />PO Details — {selectedPO?.poNumber}</Space>}
//         placement="right"
//         width={860}
//         open={detailDrawerVisible}
//         onClose={() => setDetailDrawerVisible(false)}
//       >
//         {selectedPO && (
//           <div>
//             <Card size="small" style={{ marginBottom: 12 }}>
//               <Descriptions column={2} size="small">
//                 <Descriptions.Item label="PO Number"><Text code strong>{selectedPO.poNumber}</Text></Descriptions.Item>
//                 <Descriptions.Item label="Status">{getStatusTag(selectedPO.status)}</Descriptions.Item>
//                 <Descriptions.Item label="Supplier">{selectedPO.supplierName}</Descriptions.Item>
//                 <Descriptions.Item label="Email">{selectedPO.supplierEmail}</Descriptions.Item>
//                 <Descriptions.Item label="Amount">
//                   <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
//                     {selectedPO.currency} {selectedPO.totalAmount?.toLocaleString()}
//                   </Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Payment Terms">{selectedPO.paymentTerms}</Descriptions.Item>
//                 <Descriptions.Item label="Delivery">{selectedPO.deliveryAddress}</Descriptions.Item>
//                 <Descriptions.Item label="Expected">
//                   {selectedPO.expectedDeliveryDate ? moment(selectedPO.expectedDeliveryDate).format('DD MMM YYYY') : '—'}
//                 </Descriptions.Item>
//                 {selectedPO.tenderNumber && (
//                   <Descriptions.Item label="Linked Tender" span={2}>
//                     <Tag color="purple" icon={<FileDoneOutlined />}>{selectedPO.tenderNumber}</Tag>
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//             </Card>

//             <Card size="small" title="Order Progress" style={{ marginBottom: 12 }}>
//               <Steps current={STAGE_IDX[selectedPO.currentStage] || 0} size="small">
//                 {STAGE_LABELS.map((s, i) => <Steps.Step key={i} title={s} />)}
//               </Steps>
//               <Progress percent={selectedPO.progress || 0} status={selectedPO.status === 'cancelled' ? 'exception' : 'active'} style={{ marginTop: 12 }} />
//             </Card>

//             <Card size="small" title="Items" style={{ marginBottom: 12 }}>
//               <Table
//                 size="small" pagination={false}
//                 dataSource={selectedPO.items || []}
//                 rowKey="description"
//                 columns={[
//                   { title: 'Description', dataIndex: 'description', key: 'd' },
//                   { title: 'Qty', dataIndex: 'quantity', key: 'q', width: 60, align: 'center' },
//                   { title: 'Unit Price', dataIndex: 'unitPrice', key: 'u', width: 110, align: 'right', render: v => (v||0).toLocaleString() },
//                   { title: 'Total', dataIndex: 'totalPrice', key: 't', width: 120, align: 'right',
//                     render: v => <Text strong>{(v||0).toLocaleString()}</Text> }
//                 ]}
//                 summary={(data) => {
//                   const t = data.reduce((s, i) => s + (i.totalPrice || 0), 0);
//                   return (
//                     <Table.Summary.Row>
//                       <Table.Summary.Cell index={0} colSpan={3}><Text strong>Total</Text></Table.Summary.Cell>
//                       <Table.Summary.Cell index={3} align="right">
//                         <Text strong style={{ color: '#1890ff', fontSize: 14 }}>{t.toLocaleString()}</Text>
//                       </Table.Summary.Cell>
//                     </Table.Summary.Row>
//                   );
//                 }}
//               />
//             </Card>

//             <Space wrap>
//               {selectedPO.status === 'draft' && (
//                 <Button type="primary" icon={<SendOutlined />} onClick={() => { setDetailDrawerVisible(false); handleSendToSupplyChain(selectedPO); }}>Send to Supply Chain</Button>
//               )}
//               {selectedPO.status === 'approved' && (
//                 <Button type="primary" icon={<SendOutlined />} onClick={() => { setDetailDrawerVisible(false); handleSendPO(selectedPO); }}>Send to Supplier</Button>
//               )}
//               <Button icon={<DownloadOutlined />} loading={pdfLoading} onClick={() => handleDownloadPDF(selectedPO)}>Download PDF</Button>
//               <Button icon={<FilePdfOutlined />} loading={pdfLoading} onClick={() => handlePreviewPDF(selectedPO)}>Preview PDF</Button>
//               <Button icon={<ShareAltOutlined />} onClick={() => handleEmailPDF(selectedPO)}>Email PDF</Button>
//             </Space>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerPurchaseOrders;










// import React, { useState, useEffect } from 'react';
// import {
//   Card,
//   Table,
//   Button,
//   Space,
//   Typography,
//   Tag,
//   Row,
//   Col,
//   Statistic,
//   Modal,
//   Form,
//   Input,
//   Select,
//   DatePicker,
//   Progress,
//   Tabs,
//   Alert,
//   Divider,
//   Badge,
//   message,
//   Tooltip,
//   Descriptions,
//   Drawer,
//   List,
//   Avatar,
//   Steps,
//   Timeline,
//   notification,
//   Spin,
//   InputNumber,
//   Popconfirm,
//   AutoComplete,
//   Checkbox
// } from 'antd';
// import {
//   FileTextOutlined,
//   ShoppingCartOutlined,
//   TruckOutlined,
//   DollarOutlined,
//   CalendarOutlined,
//   CheckCircleOutlined,
//   ClockCircleOutlined,
//   ExclamationCircleOutlined,
//   UserOutlined,
//   EditOutlined,
//   EyeOutlined,
//   DownloadOutlined,
//   UploadOutlined,
//   PrinterOutlined,
//   MailOutlined,
//   PhoneOutlined,
//   WarningOutlined,
//   SyncOutlined,
//   StopOutlined,
//   ReloadOutlined,
//   SendOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   MinusCircleOutlined,
//   SearchOutlined,
//   TagOutlined,
//   FilePdfOutlined,
//   FileZipOutlined,
//   ShareAltOutlined,
//   TeamOutlined
// } from '@ant-design/icons';
// import moment from 'moment';
// import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
// import UnifiedSupplierAPI from '../../services/unifiedSupplierAPI';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Step } = Steps;

// const BuyerPurchaseOrders = () => {
//   // ==================== STATE MANAGEMENT ====================
//   const [purchaseOrders, setPurchaseOrders] = useState([]);
//   const [selectedPO, setSelectedPO] = useState(null);
//   const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
//   const [editModalVisible, setEditModalVisible] = useState(false);
//   const [sendModalVisible, setSendModalVisible] = useState(false);
//   const [createPOModalVisible, setCreatePOModalVisible] = useState(false);
//   const [emailPDFModalVisible, setEmailPDFModalVisible] = useState(false);
//   const [bulkDownloadModalVisible, setBulkDownloadModalVisible] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('all');
//   const [selectedRowKeys, setSelectedRowKeys] = useState([]);
//   const [pdfLoading, setPdfLoading] = useState(false);
  
//   // Database state
//   const [suppliers, setSuppliers] = useState([]);
//   const [items, setItems] = useState([]);
//   const [itemCategories, setItemCategories] = useState([]);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
//   const [isExternalSupplier, setIsExternalSupplier] = useState(false);
//   const [externalSupplierDetails, setExternalSupplierDetails] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     address: ''
//   });
//   const [itemSearchOptions, setItemSearchOptions] = useState([]);
//   const [selectedItems, setSelectedItems] = useState([]);
  
//   // Form instances
//   const [form] = Form.useForm();
//   const [sendForm] = Form.useForm();
//   const [createPOForm] = Form.useForm();
//   const [emailPDFForm] = Form.useForm();

//   // ==================== EFFECTS ====================
//   useEffect(() => {
//     loadPurchaseOrders();
//     loadSuppliers();
//     loadItems();
//     loadItemCategories();
//     loadBudgetCodes();
//   }, []);

//   // ==================== DATA LOADING FUNCTIONS ====================
//   const loadPurchaseOrders = async () => {
//     try {
//       setLoading(true);
//       console.log('=== LOADING PURCHASE ORDERS ===');
      
//       const response = await buyerRequisitionAPI.getPurchaseOrders();
      
//       if (response.success && response.data) {
//         console.log(`Loaded ${response.data.length} purchase orders`);
//         setPurchaseOrders(response.data);
//       } else {
//         console.error('Failed to load purchase orders:', response);
//         message.error('Failed to load purchase orders');
//       }
//     } catch (error) {
//       console.error('Error loading purchase orders:', error);
//       message.error('Error loading purchase orders. Please try again.');
//     } finally {
//       setLoading(false);
//       setInitialLoading(false);
//     }
//   };

//   const loadSuppliers = async () => {
//     try {
//       setLoading(true); // Set loading before fetch
//       console.log('=== LOADING SUPPLIERS FROM DATABASE ===');
      
//       const response = await UnifiedSupplierAPI.getAllSuppliers({
//         status: 'approved'
//       });
      
//       if (response.success && response.data) {
//         console.log(`Loaded ${response.data.length} suppliers from database`);
//         setSuppliers(response.data);
//       } else {
//         console.error('Failed to load suppliers:', response);
//         message.error('Failed to load suppliers from database');
//       }
//     } catch (error) {
//       console.error('Error loading suppliers:', error);
//       message.warning('Could not load suppliers from database');
//     } finally {
//       setLoading(false); // Always clear loading
//     }
//   };

//   const loadItems = async () => {
//     try {
//       console.log('=== LOADING ITEMS FROM DATABASE ===');
//       const response = await buyerRequisitionAPI.getItems({
//         limit: 200
//       });
      
//       if (response.success && response.data) {
//         console.log(`Loaded ${response.data.length} items from database`);
//         setItems(response.data);
//       } else {
//         console.error('Failed to load items:', response);
//         message.error('Failed to load items from database');
//       }
//     } catch (error) {
//       console.error('Error loading items:', error);
//       message.warning('Could not load items from database');
//     }
//   };

//   const loadItemCategories = async () => {
//     try {
//       const response = await buyerRequisitionAPI.getItemCategories();
      
//       if (response.success && response.data) {
//         console.log('Loaded item categories:', response.data);
//         setItemCategories(response.data);
//       }
//     } catch (error) {
//       console.error('Error loading item categories:', error);
//     }
//   };

//   const loadBudgetCodes = async () => {
//     try {
//       console.log('=== LOADING BUDGET CODES ===');
//       const response = await buyerRequisitionAPI.getBudgetCodes();
      
//       if (response.success && response.data) {
//         console.log(`Loaded ${response.data.length} budget codes`);
//         setBudgetCodes(response.data);
//       } else {
//         console.error('Failed to load budget codes:', response);
//         message.warning('Failed to load budget codes');
//       }
//     } catch (error) {
//       console.error('Error loading budget codes:', error);
//       message.warning('Could not load budget codes');
//     }
//   };

//   // ==================== SEARCH FUNCTIONS ====================
//   const searchItems = async (searchText) => {
//     if (!searchText || searchText.length < 2) {
//       setItemSearchOptions([]);
//       return;
//     }

//     try {
//       const response = await buyerRequisitionAPI.searchItems(searchText, 10);
      
//       if (response.success && response.data) {
//         const options = response.data.map(item => ({
//           value: item._id,
//           label: `${item.code} - ${item.description}`,
//           item: item
//         }));
//         setItemSearchOptions(options);
//       }
//     } catch (error) {
//       console.error('Error searching items:', error);
//     }
//   };

//   const handleItemSelect = (value, option, index) => {
//     const selectedItem = option.item;
//     const formItems = createPOForm.getFieldValue('items') || [];
    
//     formItems[index] = {
//       ...formItems[index],
//       itemId: selectedItem._id,
//       description: selectedItem.description,
//       unitPrice: selectedItem.standardPrice || formItems[index]?.unitPrice || 0,
//       unitOfMeasure: selectedItem.unitOfMeasure,
//       category: selectedItem.category
//     };
    
//     createPOForm.setFieldsValue({ items: formItems });
//     message.success(`Selected item: ${selectedItem.description}`);
//   };

//   // ==================== EXTERNAL SUPPLIER FUNCTIONS ====================
//   const handleSupplierTypeChange = (value) => {
//     setIsExternalSupplier(value === 'external');
//     if (value === 'external') {
//       // Clear the registered supplier selection
//       createPOForm.setFieldsValue({ supplierId: undefined });
//     } else {
//       // Clear external supplier details
//       setExternalSupplierDetails({
//         name: '',
//         email: '',
//         phone: '',
//         address: ''
//       });
//       createPOForm.setFieldsValue({ 
//         externalSupplierName: undefined,
//         externalSupplierEmail: undefined,
//         externalSupplierPhone: undefined,
//         externalSupplierAddress: undefined
//       });
//     }
//   };

//   const handleExternalSupplierChange = (field, value) => {
//     setExternalSupplierDetails(prev => ({
//       ...prev,
//       [field]: value
//     }));
//   };


//   const handleDownloadPDF = async (po) => {
//     try {
//       setPdfLoading(true);
//       console.log('Downloading PDF for PO:', po.poNumber);

//       // FIXED: Corrected the typo from REACT_APP_API_UR to REACT_APP_API_URL
//       const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
//       const response = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/download-pdf`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to download PDF');
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `PO_${po.poNumber}_${moment().format('YYYY-MM-DD')}.pdf`;
      
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       message.success(`PDF downloaded successfully for PO ${po.poNumber}`);
//     } catch (error) {
//       console.error('Error downloading PDF:', error);
//       message.error(error.message || 'Failed to download PDF');
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handlePreviewPDF = async (po) => {
//     try {
//       setPdfLoading(true);
//       console.log('Opening PDF preview for PO:', po.poNumber);

//       const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/${po.id}/preview-pdf`;
      
//       const token = localStorage.getItem('token');
//       const newWindow = window.open();
      
//       const response = await fetch(url, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//         },
//       });

//       if (!response.ok) {
//         throw new Error('Failed to load PDF preview');
//       }

//       const blob = await response.blob();
//       const pdfUrl = window.URL.createObjectURL(blob);
      
//       newWindow.location.href = pdfUrl;
      
//       message.success(`PDF preview opened for PO ${po.poNumber}`);
//     } catch (error) {
//       console.error('Error opening PDF preview:', error);
//       message.error('Failed to open PDF preview');
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handleEmailPDF = (po) => {
//     setSelectedPO(po);
//     emailPDFForm.resetFields();
//     emailPDFForm.setFieldsValue({
//       emailTo: po.supplierEmail,
//       emailType: 'supplier'
//     });
//     setEmailPDFModalVisible(true);
//   };

//   const handleSendEmailPDF = async () => {
//     try {
//       const values = await emailPDFForm.validateFields();
//       setPdfLoading(true);

//       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/${selectedPO.id}/email-pdf`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//         body: JSON.stringify(values),
//       });

//       const data = await response.json();

//       if (!response.ok || !data.success) {
//         throw new Error(data.message || 'Failed to send PDF email');
//       }

//       message.success(`PDF emailed successfully to ${values.emailTo}`);
//       setEmailPDFModalVisible(false);
      
//       notification.success({
//         message: 'Email Sent Successfully',
//         description: `Purchase order PDF sent to ${values.emailTo}`,
//         duration: 5
//       });

//     } catch (error) {
//       console.error('Error sending PDF email:', error);
//       message.error(error.message || 'Failed to send PDF email');
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   const handleBulkDownload = () => {
//     if (selectedRowKeys.length === 0) {
//       message.warning('Please select purchase orders to download');
//       return;
//     }
//     setBulkDownloadModalVisible(true);
//   };

//   const handleBulkDownloadConfirm = async () => {
//     try {
//       setPdfLoading(true);

//       const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/bulk-download`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Authorization': `Bearer ${localStorage.getItem('token')}`,
//         },
//         body: JSON.stringify({ poIds: selectedRowKeys }),
//       });

//       if (!response.ok) {
//         const errorData = await response.json();
//         throw new Error(errorData.message || 'Failed to create bulk download');
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = `Purchase_Orders_${moment().format('YYYY-MM-DD')}.zip`;
      
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//       window.URL.revokeObjectURL(url);

//       message.success(`${selectedRowKeys.length} purchase orders downloaded successfully`);
//       setBulkDownloadModalVisible(false);
//       setSelectedRowKeys([]);

//     } catch (error) {
//       console.error('Error in bulk download:', error);
//       message.error(error.message || 'Failed to download purchase orders');
//     } finally {
//       setPdfLoading(false);
//     }
//   };

//   // ==================== UTILITY FUNCTIONS ====================
//   const getStatusTag = (status) => {
//     const statusMap = {
//       'draft': { color: 'default', text: 'Draft', icon: <EditOutlined /> },
//       'pending_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
//       'approved': { color: 'blue', text: 'Approved', icon: <CheckCircleOutlined /> },
//       'sent_to_supplier': { color: 'purple', text: 'Sent to Supplier', icon: <MailOutlined /> },
//       'acknowledged': { color: 'cyan', text: 'Acknowledged', icon: <CheckCircleOutlined /> },
//       'in_production': { color: 'geekblue', text: 'In Production', icon: <SyncOutlined /> },
//       'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> },
//       'completed': { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
//       'cancelled': { color: 'red', text: 'Cancelled', icon: <StopOutlined /> },
//       'on_hold': { color: 'magenta', text: 'On Hold', icon: <ExclamationCircleOutlined /> }
//     };
//     const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <FileTextOutlined /> };
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getStageSteps = () => [
//     'PO Created',
//     'Supplier Acknowledgment',
//     'Production/Preparation',
//     'Shipment',
//     'Delivery & Completion'
//   ];

//   const getStageIndex = (stage) => {
//     const stageMap = {
//       'created': 0,
//       'supplier_acknowledgment': 1,
//       'in_production': 2,
//       'in_transit': 3,
//       'completed': 4
//     };
//     return stageMap[stage] || 0;
//   };

//   const getFilteredPOs = () => {
//     switch (activeTab) {
//       case 'active':
//         return purchaseOrders.filter(po => !['delivered', 'completed', 'cancelled'].includes(po.status));
//       case 'in_transit':
//         return purchaseOrders.filter(po => po.status === 'in_transit');
//       case 'delivered':
//         return purchaseOrders.filter(po => ['delivered', 'completed'].includes(po.status));
//       case 'overdue':
//         return purchaseOrders.filter(po => 
//           moment(po.expectedDeliveryDate).isBefore(moment()) && 
//           !['delivered', 'completed', 'cancelled'].includes(po.status)
//         );
//       default:
//         return purchaseOrders;
//     }
//   };

//   // ==================== CRUD OPERATIONS ====================
//   const handleViewDetails = async (po) => {
//     try {
//       setLoading(true);
      
//       const response = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
      
//       if (response.success && response.data) {
//         setSelectedPO(response.data.purchaseOrder);
//         setDetailDrawerVisible(true);
//       } else {
//         message.error('Failed to load purchase order details');
//       }
//     } catch (error) {
//       console.error('Error loading PO details:', error);
//       message.error('Error loading purchase order details');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCreateNewPO = () => {
//     createPOForm.resetFields();
//     setItemSearchOptions([]);
//     setCreatePOModalVisible(true);
//   };

//   const handleCreatePO = async () => {
//     try {
//       const values = await createPOForm.validateFields();
//       setLoading(true);

//       let supplierDetails;

//       if (isExternalSupplier) {
//         // Validate external supplier details
//         if (!values.externalSupplierName || !values.externalSupplierEmail) {
//           message.error('Please provide external supplier name and email');
//           setLoading(false);
//           return;
//         }

//         // Basic email validation
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         if (!emailRegex.test(values.externalSupplierEmail)) {
//           message.error('Please enter a valid email address');
//           setLoading(false);
//           return;
//         }

//         supplierDetails = {
//           id: null, // External supplier has no database ID
//           name: values.externalSupplierName,
//           email: values.externalSupplierEmail,
//           phone: values.externalSupplierPhone || '',
//           address: values.externalSupplierAddress || '',
//           businessType: 'External Supplier',
//           isExternal: true
//         };
//       } else {
//         // Handle registered supplier
//         if (!values.supplierId) {
//           message.error('Please select a supplier');
//           setLoading(false);
//           return;
//         }

//         const selectedSupplier = suppliers.find(s => s._id === values.supplierId);
//         if (!selectedSupplier) {
//           message.error('Selected supplier not found');
//           setLoading(false);
//           return;
//         }

//         const resolvedName =
//           selectedSupplier.supplierDetails?.companyName ||
//           selectedSupplier.companyName ||
//           selectedSupplier.name ||
//           selectedSupplier.fullName ||
//           selectedSupplier.displayName ||
//           '';

//         const resolvedEmail =
//           selectedSupplier.email ||
//           selectedSupplier.supplierDetails?.email ||
//           selectedSupplier.supplierDetails?.contactEmail ||
//           '';

//         const resolvedPhone =
//           selectedSupplier.phoneNumber ||
//           selectedSupplier.phone ||
//           selectedSupplier.supplierDetails?.phoneNumber ||
//           selectedSupplier.supplierDetails?.alternatePhone ||
//           '';

//         const supplierAddress = selectedSupplier.supplierDetails?.address || selectedSupplier.address;
//         const resolvedAddress = typeof supplierAddress === 'object' ?
//           `${supplierAddress.street || ''}, ${supplierAddress.city || ''}, ${supplierAddress.state || ''}`.trim() :
//           supplierAddress || '';

//         supplierDetails = {
//           id: selectedSupplier._id,
//           name: resolvedName,
//           email: resolvedEmail,
//           phone: resolvedPhone,
//           address: resolvedAddress,
//           businessType: selectedSupplier.businessType || selectedSupplier.supplierDetails?.businessType,
//           isExternal: false
//         };
//       }

//       const totalAmount = values.items.reduce((sum, item) => 
//         sum + (item.quantity * item.unitPrice), 0
//       );

//       const poData = {
//         supplierDetails: supplierDetails,
//         items: values.items.map(item => ({
//           ...item,
//           totalPrice: item.quantity * item.unitPrice,
//           ...(item.itemId && { itemId: item.itemId })
//         })),
//         totalAmount,
//         budgetCodeId: values.budgetCodeId, // Add budget code
//         currency: values.currency || 'XAF',
//         taxApplicable: values.taxApplicable || false,
//         taxRate: values.taxRate || 19.2,
//         deliveryAddress: values.deliveryAddress,
//         expectedDeliveryDate: values.expectedDeliveryDate.endOf('day').toISOString(),
//         paymentTerms: values.paymentTerms,
//         specialInstructions: values.specialInstructions,
//         notes: values.notes
//       };

//       // Validate budget code if selected
//       if (values.budgetCodeId) {
//         const selectedBudgetCode = budgetCodes.find(bc => bc._id === values.budgetCodeId);
//         if (selectedBudgetCode) {
//           const availableBalance = selectedBudgetCode.amount - selectedBudgetCode.usedAmount;
//           if (totalAmount > availableBalance) {
//             message.error(`Insufficient budget. Available: ${buyerRequisitionAPI.formatCurrency(availableBalance)}, Required: ${buyerRequisitionAPI.formatCurrency(totalAmount)}`);
//             setLoading(false);
//             return;
//           }
//         }
//       }

//       console.log('Creating PO with enhanced data:', poData);

//       const response = await buyerRequisitionAPI.createPurchaseOrder(poData);
      
//       if (response.success) {
//         // Update budget code balance if budget code was selected
//         if (values.budgetCodeId) {
//           try {
//             await buyerRequisitionAPI.updateBudgetCodeBalance(values.budgetCodeId, totalAmount);
//             message.success('Purchase order created and budget updated successfully!');
//           } catch (budgetError) {
//             console.warn('PO created but budget update failed:', budgetError);
//             message.warning('Purchase order created successfully, but budget update failed. Please check with finance.');
//           }
//         } else {
//           message.success('Purchase order created successfully!');
//         }

//         setCreatePOModalVisible(false);
//         createPOForm.resetFields();
//         setIsExternalSupplier(false);
//         setExternalSupplierDetails({
//           name: '',
//           email: '',
//           phone: '',
//           address: ''
//         });
        
//         // Enhanced notification with email status
//         const supplierType = supplierDetails.isExternal ? 'external supplier' : 'supplier';
//         let notificationDescription = `PO ${response.data.purchaseOrder.poNumber} has been created with ${supplierType} ${supplierDetails.name}.`;
        
//         if (supplierDetails.isExternal && response.data.emailSent) {
//           notificationDescription += ` Email notification sent to ${supplierDetails.email}.`;
//         } else if (supplierDetails.isExternal && !response.data.emailSent) {
//           notificationDescription += ` Note: Email notification could not be sent.`;
//         }
        
//         notification.success({
//           message: 'Purchase Order Created',
//           description: notificationDescription,
//           duration: supplierDetails.isExternal ? 8 : 5, // Longer duration for external supplier notifications
//           style: supplierDetails.isExternal ? { 
//             backgroundColor: '#f6ffed', 
//             border: '1px solid #b7eb8f' 
//           } : undefined
//         });
        
//         // Additional notification for external supplier email
//         if (supplierDetails.isExternal && response.data.emailSent) {
//           setTimeout(() => {
//             notification.info({
//               message: 'Email Sent to External Supplier',
//               description: `The purchase order details have been automatically emailed to ${supplierDetails.name} (${supplierDetails.email}). They will receive all order details, delivery information, and payment terms.`,
//               duration: 10,
//               placement: 'bottomRight',
//               icon: <MailOutlined style={{ color: '#1890ff' }} />
//             });
//           }, 1500);
//         }
        
//         // Reload data
//         await loadPurchaseOrders();
//         await loadBudgetCodes(); // Refresh budget codes to show updated balances
//       } else {
//         message.error(response.message || 'Failed to create purchase order');
//       }
//     } catch (error) {
//       console.error('Error creating PO:', error);
//       message.error('Failed to create purchase order');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // const handleEditPO = (po) => {
//   //   setSelectedPO(po);
//   //   form.setFieldsValue({
//   //     expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
//   //     deliveryAddress: po.deliveryAddress,
//   //     paymentTerms: po.paymentTerms,
//   //     specialInstructions: po.specialInstructions || '',
//   //     notes: po.notes || ''
//   //   });
//   //   setEditModalVisible(true);
//   // };

//   // Add this enhanced edit modal to replace the existing basic edit modal in BuyerPurchaseOrders.jsx

//   const handleEditPO = (po) => {
//     setSelectedPO(po);
    
//     console.log('=== EDITING PURCHASE ORDER ===');
//     console.log('PO:', po.poNumber);
//     console.log('Current items:', po.items);
    
//     // Clean items by removing MongoDB-specific _id and id fields
//     const cleanedItems = po.items.map(item => {
//       const cleanItem = {
//         description: item.description,
//         quantity: item.quantity,
//         unitPrice: item.unitPrice,
//         unitOfMeasure: item.unitOfMeasure || 'Units',
//         category: item.category || '',
//         specifications: item.specifications || ''
//       };
      
//       // Only include itemId if it exists (for database-linked items)
//       if (item.itemId) {
//         cleanItem.itemId = item.itemId;
//       }
      
//       return cleanItem;
//     });
    
//     console.log('Cleaned items for form:', cleanedItems);
    
//     // Populate all fields including items
//     form.setFieldsValue({
//       expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
//       deliveryAddress: po.deliveryAddress,
//       paymentTerms: po.paymentTerms,
//       specialInstructions: po.specialInstructions || '',
//       notes: po.notes || '',
//       currency: po.currency || 'XAF',
//       taxApplicable: po.taxApplicable || false,
//       taxRate: po.taxRate || 19.25,
//       items: cleanedItems
//     });
    
//     setEditModalVisible(true);
//   };

//   const handleUpdatePO = async () => {
//     try {
//       const values = await form.validateFields();
//       setLoading(true);
      
//       console.log('=== UPDATING PURCHASE ORDER ===');
//       console.log('Form values:', values);
      
//       // Calculate new total from items
//       const calculatedTotal = values.items.reduce((sum, item) => 
//         sum + (item.quantity * item.unitPrice), 0
//       );
      
//       console.log('Calculated total:', calculatedTotal);
      
//       // Clean items: remove MongoDB _id and id fields, keep only itemId
//       const cleanedItems = values.items.map(item => {
//         const cleanItem = {
//           description: item.description,
//           quantity: item.quantity,
//           unitPrice: item.unitPrice,
//           totalPrice: item.quantity * item.unitPrice,
//           specifications: item.specifications || '',
//           unitOfMeasure: item.unitOfMeasure || 'Units',
//           category: item.category || ''
//         };
        
//         // Only include itemId if it exists (for database-linked items)
//         if (item.itemId) {
//           cleanItem.itemId = item.itemId;
//         }
        
//         return cleanItem;
//       });
      
//       console.log('Cleaned items:', cleanedItems);
      
//       const updateData = {
//         expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.endOf('day').toISOString() : null,
//         deliveryAddress: values.deliveryAddress,
//         paymentTerms: values.paymentTerms,
//         specialInstructions: values.specialInstructions || '',
//         notes: values.notes || '',
//         currency: values.currency,
//         taxApplicable: values.taxApplicable || false,
//         taxRate: values.taxRate || 19.25,
//         items: cleanedItems,
//         totalAmount: calculatedTotal
//       };
      
//       console.log('Update data being sent:', updateData);
      
//       const response = await buyerRequisitionAPI.updatePurchaseOrder(selectedPO.id, updateData);
      
//       console.log('Update response:', response);
      
//       if (response.success) {
//         message.success('Purchase order updated successfully!');
        
//         // Show detailed notification
//         notification.success({
//           message: 'Purchase Order Updated',
//           description: `PO ${selectedPO.poNumber} has been updated. New total: ${updateData.currency} ${calculatedTotal.toLocaleString()}`,
//           duration: 5
//         });
        
//         setEditModalVisible(false);
//         form.resetFields();
        
//         // Reload purchase orders to show updated data
//         await loadPurchaseOrders();
//       } else {
//         console.error('Update failed:', response);
//         message.error(response.message || 'Failed to update purchase order');
//       }
//     } catch (error) {
//       console.error('Error updating PO:', error);
//       message.error(error.message || 'Failed to update purchase order');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendPO = (po) => {
//     setSelectedPO(po);
//     sendForm.resetFields();
//     setSendModalVisible(true);
//   };

//   const handleSendPOToSupplier = async () => {
//     try {
//       const values = await sendForm.validateFields();
//       setLoading(true);
      
//       const response = await buyerRequisitionAPI.sendPurchaseOrderToSupplier(selectedPO.id, {
//         message: values.message
//       });
      
//       if (response.success) {
//         message.success('Purchase order sent to supplier successfully!');
//         setSendModalVisible(false);
//         sendForm.resetFields();
        
//         notification.success({
//           message: 'PO Sent Successfully',
//           description: `Purchase order ${selectedPO.poNumber} has been sent to ${selectedPO.supplierName} via email.`,
//           duration: 5
//         });
        
//         await loadPurchaseOrders();
//       } else {
//         message.error(response.message || 'Failed to send purchase order');
//       }
//     } catch (error) {
//       console.error('Error sending PO:', error);
//       message.error('Failed to send purchase order');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSendToSupplyChain = async (po) => {
//     try {
//       setLoading(true);
      
//       // Update PO status to pending_supply_chain_assignment
//       const response = await fetch(
//         `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/${po.id}`,
//         {
//           method: 'PUT',
//           headers: {
//             'Content-Type': 'application/json',
//             'Authorization': `Bearer ${localStorage.getItem('token')}`,
//           },
//           body: JSON.stringify({
//             status: 'pending_supply_chain_assignment',
//             sentDate: new Date().toISOString(),
//           }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok && data.success) {
//         message.success('Purchase order sent to Supply Chain for assignment');
        
//         notification.success({
//           message: 'PO Sent to Supply Chain',
//           description: `Purchase order ${po.poNumber} has been sent to Supply Chain for department assignment.`,
//           duration: 5
//         });
        
//         // Reload purchase orders
//         await loadPurchaseOrders();
//       } else {
//         throw new Error(data.message || 'Failed to send PO to Supply Chain');
//       }
//     } catch (error) {
//       console.error('Error sending PO to Supply Chain:', error);
//       message.error(error.message || 'Failed to send PO to Supply Chain');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelPO = (po) => {
//     let cancellationReason = '';
    
//     Modal.confirm({
//       title: 'Cancel Purchase Order',
//       content: (
//         <div>
//           <p>Are you sure you want to cancel PO {po.poNumber || po.id}? This action cannot be undone.</p>
//           <TextArea 
//             placeholder="Please provide a reason for cancellation..."
//             onChange={(e) => cancellationReason = e.target.value}
//             rows={3}
//             style={{ marginTop: '16px' }}
//           />
//         </div>
//       ),
//       danger: true,
//       onOk: async () => {
//         if (!cancellationReason.trim()) {
//           message.error('Please provide a reason for cancellation');
//           return;
//         }

//         try {
//           setLoading(true);
          
//           const response = await buyerRequisitionAPI.cancelPurchaseOrder(po.id, {
//             cancellationReason: cancellationReason.trim()
//           });
          
//           if (response.success) {
//             message.success(`Purchase order ${po.poNumber || po.id} has been cancelled`);
            
//             notification.info({
//               message: 'Purchase Order Cancelled',
//               description: `PO ${po.poNumber || po.id} has been cancelled and supplier has been notified.`,
//               duration: 5
//             });
            
//             await loadPurchaseOrders();
//           } else {
//             message.error(response.message || 'Failed to cancel purchase order');
//           }
//         } catch (error) {
//           console.error('Error cancelling PO:', error);
//           message.error('Failed to cancel purchase order');
//         } finally {
//           setLoading(false);
//         }
//       }
//     });
//   };

//   // ==================== TABLE CONFIGURATION ====================
//   const rowSelection = {
//     selectedRowKeys,
//     onChange: (newSelectedRowKeys) => {
//       setSelectedRowKeys(newSelectedRowKeys);
//     },
//     getCheckboxProps: (record) => ({
//       disabled: record.status === 'cancelled',
//       name: record.poNumber,
//     }),
//   };

//   const columns = [
//     {
//       title: 'PO Details',
//       key: 'details',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.poNumber || record.id}</Text>
//           <br />
//           {record.requisitionId && (
//             <>
//               <Text type="secondary" style={{ fontSize: '12px' }}>
//                 Req: {record.requisitionId}
//               </Text>
//               <br />
//             </>
//           )}
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             Created: {moment(record.creationDate).format('MMM DD, HH:mm')}
//           </Text>
//         </div>
//       ),
//       width: 140
//     },
//     {
//       title: 'Supplier',
//       key: 'supplier',
//       render: (_, record) => (
//         <div>
//           <Text strong>{record.supplierName}</Text>
//           <br />
//           <Text type="secondary" style={{ fontSize: '12px' }}>
//             <MailOutlined /> {record.supplierEmail}
//           </Text>
//         </div>
//       ),
//       width: 180
//     },
//     {
//       title: 'Total Amount',
//       key: 'amount',
//       render: (_, record) => (
//         <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//           {record.currency} {record.totalAmount.toLocaleString()}
//         </Text>
//       ),
//       width: 120,
//       sorter: (a, b) => a.totalAmount - b.totalAmount
//     },
//     {
//       title: 'Progress',
//       key: 'progress',
//       render: (_, record) => (
//         <div>
//           <Progress 
//             percent={record.progress || 0} 
//             size="small" 
//             status={record.status === 'cancelled' ? 'exception' : 'active'}
//           />
//           <Text type="secondary" style={{ fontSize: '11px' }}>
//             {getStageSteps()[getStageIndex(record.currentStage)] || 'Created'}
//           </Text>
//         </div>
//       ),
//       width: 150
//     },
//     {
//       title: 'Expected Delivery',
//       key: 'delivery',
//       render: (_, record) => {
//         if (!record.expectedDeliveryDate) return <Text type="secondary">Not set</Text>;
        
//         const isOverdue = moment(record.expectedDeliveryDate).isBefore(moment()) && 
//                           !['delivered', 'completed', 'cancelled'].includes(record.status);
//         const daysUntil = moment(record.expectedDeliveryDate).diff(moment(), 'days');
        
//         return (
//           <div>
//             <Text type={isOverdue ? 'danger' : 'default'}>
//               {moment(record.expectedDeliveryDate).format('MMM DD')}
//             </Text>
//             <br />
//             <Text type="secondary" style={{ fontSize: '11px' }}>
//               {isOverdue ? `${Math.abs(daysUntil)} days overdue` : 
//                daysUntil === 0 ? 'Due today' : 
//                daysUntil > 0 ? `${daysUntil} days left` : 'Delivered'}
//             </Text>
//             {isOverdue && (
//               <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: '4px' }} />
//             )}
//           </div>
//         );
//       },
//       width: 120
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       width: 140
//     },

//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small" direction="vertical">
//           <Space size="small">
//             <Tooltip title="View Details">
//               <Button 
//                 size="small" 
//                 icon={<EyeOutlined />}
//                 onClick={() => handleViewDetails(record)}
//               />
//             </Tooltip>
            
//             {/* Show "Send to Supply Chain" for draft POs */}
//             {record.status === 'draft' && (
//               <Tooltip title="Send to Supply Chain">
//                 <Button 
//                   size="small" 
//                   type="primary"
//                   icon={<SendOutlined />}
//                   onClick={() => handleSendToSupplyChain(record)}
//                 >
//                   To Supply Chain
//                 </Button>
//               </Tooltip>
//             )}
            
//             {/* Show "Send to Supplier" for approved POs */}
//             {record.status === 'approved' && (
//               <Tooltip title="Send to Supplier">
//                 <Button 
//                   size="small" 
//                   type="primary"
//                   icon={<SendOutlined />}
//                   onClick={() => handleSendPO(record)}
//                 >
//                   To Supplier
//                 </Button>
//               </Tooltip>
//             )}
            
//             {!['delivered', 'completed', 'cancelled', 'pending_supply_chain_assignment'].includes(record.status) && (
//               <Tooltip title="Edit PO">
//                 <Button 
//                   size="small" 
//                   icon={<EditOutlined />}
//                   onClick={() => handleEditPO(record)}
//                 />
//               </Tooltip>
//             )}
//           </Space>
          
//           <Space size="small">
//             <Tooltip title="Download PDF">
//               <Button 
//                 size="small" 
//                 icon={<DownloadOutlined />}
//                 loading={pdfLoading}
//                 onClick={() => handleDownloadPDF(record)}
//               />
//             </Tooltip>
//             <Tooltip title="Preview PDF">
//               <Button 
//                 size="small" 
//                 icon={<FilePdfOutlined />}
//                 loading={pdfLoading}
//                 onClick={() => handlePreviewPDF(record)}
//               />
//             </Tooltip>
//             <Tooltip title="Email PDF">
//               <Button 
//                 size="small" 
//                 icon={<ShareAltOutlined />}
//                 onClick={() => handleEmailPDF(record)}
//               />
//             </Tooltip>
            
//             {!['delivered', 'completed', 'cancelled', 'pending_supply_chain_assignment'].includes(record.status) && (
//               <Tooltip title="Cancel PO">
//                 <Button 
//                   size="small" 
//                   danger
//                   icon={<StopOutlined />}
//                   onClick={() => handleCancelPO(record)}
//                 />
//               </Tooltip>
//             )}
//           </Space>
//         </Space>
//       ),
//       width: 180,
//       fixed: 'right'
//     }
//   ];

//   // ==================== STATISTICS ====================
//   const stats = {
//     total: purchaseOrders.length,
//     active: purchaseOrders.filter(po => !['delivered', 'completed', 'cancelled'].includes(po.status)).length,
//     inTransit: purchaseOrders.filter(po => po.status === 'in_transit').length,
//     delivered: purchaseOrders.filter(po => ['delivered', 'completed'].includes(po.status)).length,
//     overdue: purchaseOrders.filter(po => 
//       moment(po.expectedDeliveryDate).isBefore(moment()) && 
//       !['delivered', 'completed', 'cancelled'].includes(po.status)
//     ).length,
//     totalValue: purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
//   };

//   // ==================== LOADING STATE ====================
//   if (initialLoading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>
//           <Text>Loading purchase orders...</Text>
//         </div>
//       </div>
//     );
//   }

//   // ==================== MAIN RENDER ====================
//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         {/* ========== HEADER ========== */}
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <FileTextOutlined /> Purchase Order Management
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={loadPurchaseOrders}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             {selectedRowKeys.length > 0 && (
//               <Button 
//                 icon={<FileZipOutlined />}
//                 onClick={handleBulkDownload}
//                 loading={pdfLoading}
//               >
//                 Bulk Download ({selectedRowKeys.length})
//               </Button>
//             )}
//             <Button icon={<PrinterOutlined />}>
//               Bulk Print
//             </Button>
//             <Button icon={<DownloadOutlined />}>
//               Export Report
//             </Button>
//             <Button 
//               type="primary" 
//               icon={<PlusOutlined />}
//               onClick={handleCreateNewPO}
//             >
//               Create New PO
//             </Button>
//           </Space>
//         </div>

//         {/* ========== STATISTICS ========== */}
//         <Row gutter={16} style={{ marginBottom: '24px' }}>
//           <Col span={4}>
//             <Statistic
//               title="Total POs"
//               value={stats.total}
//               prefix={<FileTextOutlined />}
//               valueStyle={{ color: '#1890ff' }}
//             />
//           </Col>
//           <Col span={4}>
//             <Statistic
//               title="Active"
//               value={stats.active}
//               prefix={<SyncOutlined />}
//               valueStyle={{ color: '#faad14' }}
//             />
//           </Col>
//           <Col span={4}>
//             <Statistic
//               title="Overdue"
//               value={stats.overdue}
//               prefix={<ExclamationCircleOutlined />}
//               valueStyle={{ color: '#ff4d4f' }}
//             />
//           </Col>
//           <Col span={4}>
//             <Statistic
//               title="Total Value"
//               value={stats.totalValue > 0 ? `${(stats.totalValue / 1000000).toFixed(1)}M` : '0'}
//               prefix={<DollarOutlined />}
//               suffix="XAF"
//               valueStyle={{ color: '#13c2c2' }}
//             />
//           </Col>
//         </Row>

//         {/* ========== ALERTS ========== */}
//         {stats.overdue > 0 && (
//           <Alert
//             message={`${stats.overdue} Purchase Order${stats.overdue !== 1 ? 's' : ''} Overdue`}
//             description="Some purchase orders have passed their expected delivery dates. Follow up with suppliers for updates."
//             type="error"
//             showIcon
//             action={
//               <Button 
//                 size="small" 
//                 danger 
//                 onClick={() => setActiveTab('overdue')}
//               >
//                 View Overdue
//               </Button>
//             }
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Database Integration Status */}
//         {suppliers.length === 0 && (
//           <Alert
//             message="Supplier Database Not Available"
//             description="Could not load suppliers from database. You can still create POs with manual supplier entry."
//             type="warning"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {items.length === 0 && (
//           <Alert
//             message="Items Database Not Available"
//             description="Could not load items from database. You can still create POs with manual item entry."
//             type="warning"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Success indicators */}
//         {suppliers.length > 0 && items.length > 0 && (
//           <Alert
//             message="Database Integration Active"
//             description={`Connected to supplier database (${suppliers.length} suppliers) and items database (${items.length} items).`}
//             type="success"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* Empty State */}
//         {purchaseOrders.length === 0 && !loading && (
//           <Alert
//             message="No Purchase Orders Found"
//             description={
//               <div>
//                 <p>You haven't created any purchase orders yet.</p>
//                 <Button 
//                   type="primary" 
//                   icon={<PlusOutlined />}
//                   onClick={handleCreateNewPO}
//                   style={{ marginTop: '8px' }}
//                 >
//                   Create Your First PO
//                 </Button>
//               </div>
//             }
//             type="info"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />
//         )}

//         {/* ========== TABS ========== */}
//         <Tabs activeKey={activeTab} onChange={setActiveTab}>
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.total} size="small">
//                 <span>All POs ({stats.total})</span>
//               </Badge>
//             } 
//             key="all"
//           />
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.active} size="small">
//                 <span><SyncOutlined /> Active ({stats.active})</span>
//               </Badge>
//             } 
//             key="active"
//           />
//           <Tabs.TabPane 
//             tab={
//               <Badge count={stats.overdue} size="small">
//                 <span><ExclamationCircleOutlined /> Overdue ({stats.overdue})</span>
//               </Badge>
//             } 
//             key="overdue"
//           />
//         </Tabs>

//         {/* ========== TABLE ========== */}
//         <Table
//           columns={columns}
//           dataSource={getFilteredPOs()}
//           rowKey="id"
//           rowSelection={rowSelection}
//           loading={loading}
//           pagination={{
//             pageSize: 10,
//             showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} purchase orders`
//           }}
//           scroll={{ x: 'max-content' }}
//         />
//       </Card>

//       {/* ==================== MODALS ==================== */}

//       {/* ========== CREATE NEW PO MODAL ========== */}
//       <Modal
//         title={
//           <Space>
//             <PlusOutlined />
//             Create New Purchase Order
//             {suppliers.length > 0 && (
//               <Tag color="green" icon={<TagOutlined />}>
//                 {suppliers.length} Suppliers Available
//               </Tag>
//             )}
//             {items.length > 0 && (
//               <Tag color="blue" icon={<TagOutlined />}>
//                 {items.length} Items Available
//               </Tag>
//             )}
//           </Space>
//         }
//         open={createPOModalVisible}
//         onOk={handleCreatePO}
//         onCancel={() => setCreatePOModalVisible(false)}
//         confirmLoading={loading}
//         width={1200}
//         maskClosable={false}
//       >
//         <Form form={createPOForm} layout="vertical">
//           <Row gutter={[16, 16]}>
//             <Col span={12}>
//               <Form.Item
//                 name="supplierType"
//                 label="Supplier Type"
//                 initialValue="registered"
//                 rules={[{ required: true, message: 'Please select supplier type' }]}
//               >
//                 <Select onChange={handleSupplierTypeChange}>
//                   <Option value="registered">Registered Supplier</Option>
//                   <Option value="external">External Supplier</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="currency"
//                 label="Currency"
//                 initialValue="XAF"
//                 rules={[{ required: true, message: 'Please select currency' }]}
//               >
//                 <Select>
//                   <Option value="XAF">XAF (Central African Franc)</Option>
//                   <Option value="USD">USD (US Dollar)</Option>
//                   <Option value="EUR">EUR (Euro)</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           {!isExternalSupplier ? (

//             <Form.Item
//               name="supplierId"
//               label={
//                 <Space>
//                   Select Registered Supplier
//                   {suppliers.length > 0 && (
//                     <Tag color="green" size="small">
//                       {suppliers.length} in database
//                     </Tag>
//                   )}
//                 </Space>
//               }
//               rules={[{ required: !isExternalSupplier, message: 'Please select a supplier' }]}
//             >
//               <Select
//                 placeholder="Search and select supplier from database"
//                 showSearch
//                 loading={loading && suppliers.length === 0}
//                 notFoundContent={
//                   loading ? (
//                     <div style={{ textAlign: 'center', padding: '20px' }}>
//                       <Spin size="small" />
//                       <div style={{ marginTop: '8px' }}>
//                         <Text type="secondary">Loading suppliers...</Text>
//                       </div>
//                     </div>
//                   ) : suppliers.length === 0 ? (
//                     <div style={{ textAlign: 'center', padding: '20px' }}>
//                       <Text type="secondary">No approved suppliers found</Text>
//                     </div>
//                   ) : (
//                     'No matching suppliers'
//                   )
//                 }
//                 filterOption={(input, option) => {
//                   const supplier = suppliers.find(s => s._id === option.value);
//                   if (!supplier) return false;
                  
//                   const searchFields = [
//                     supplier.supplierDetails?.companyName || '',
//                     supplier.email || '',
//                     supplier.supplierDetails?.supplierType || ''
//                   ].join(' ').toLowerCase();
                  
//                   return searchFields.includes(input.toLowerCase());
//                 }}
//                 optionLabelProp="label"
//               >
//                 {suppliers.map(supplier => (
//                   <Option 
//                     key={supplier._id} 
//                     value={supplier._id}
//                     label={supplier.supplierDetails?.companyName || supplier.email}
//                   >
//                     <div>
//                       <div style={{ fontWeight: 'bold' }}>
//                         {supplier.supplierDetails?.companyName || 'Unnamed Supplier'}
//                       </div>
//                       <div style={{ fontSize: '12px', color: '#666' }}>
//                         {supplier.email} • {supplier.supplierDetails?.supplierType || 'N/A'}
//                       </div>
//                       <div style={{ fontSize: '11px', color: '#999' }}>
//                         Status: {supplier.status} • 
//                         Rating: {supplier.performance?.overallRating || 'N/A'}
//                       </div>
//                     </div>
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           ) : (
//             <div>
//               <Alert
//                 message="External Supplier Details"
//                 description="Enter the details of the external supplier who is not registered in our system."
//                 type="info"
//                 showIcon
//                 style={{ marginBottom: '16px' }}
//               />
              
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="externalSupplierName"
//                     label="Supplier Name"
//                     rules={[{ required: isExternalSupplier, message: 'Please enter supplier name' }]}
//                   >
//                     <Input 
//                       placeholder="Enter supplier company name"
//                       onChange={(e) => handleExternalSupplierChange('name', e.target.value)}
//                     />
//                   </Form.Item>
//                 </Col>
//                 <Col span={12}>
//                   <Form.Item
//                     name="externalSupplierEmail"
//                     label="Email Address"
//                     rules={[
//                       { required: isExternalSupplier, message: 'Please enter email address' },
//                       { type: 'email', message: 'Please enter a valid email address' }
//                     ]}
//                   >
//                     <Input 
//                       placeholder="supplier@company.com"
//                       onChange={(e) => handleExternalSupplierChange('email', e.target.value)}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
              
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Form.Item
//                     name="externalSupplierPhone"
//                     label="Phone Number"
//                   >
//                     <Input 
//                       placeholder="Enter phone number"
//                       onChange={(e) => handleExternalSupplierChange('phone', e.target.value)}
//                     />
//                   </Form.Item>
//                 </Col>
//                 <Col span={12}>
//                   <Form.Item
//                     name="externalSupplierAddress"
//                     label="Address"
//                   >
//                     <Input 
//                       placeholder="Enter supplier address"
//                       onChange={(e) => handleExternalSupplierChange('address', e.target.value)}
//                     />
//                   </Form.Item>
//                 </Col>
//               </Row>
//             </div>
//           )}

//           <Divider>
//             <Space>
//               Items
//               {items.length > 0 && (
//                 <Tag color="blue" size="small">
//                   {items.length} items in database
//                 </Tag>
//               )}
//             </Space>
//           </Divider>

//           <Form.List
//             name="items"
//             rules={[
//               {
//                 validator: async (_, items) => {
//                   if (!items || items.length < 1) {
//                     return Promise.reject(new Error('At least one item is required'));
//                   }
//                 }
//               }
//             ]}
//           >
//             {(fields, { add, remove }, { errors }) => (
//               <>
//                 {fields.map(({ key, name, ...restField }) => (
//                   <Card 
//                     key={key} 
//                     size="small" 
//                     style={{ marginBottom: '16px' }}
//                     title={
//                       <Space>
//                         {`Item ${name + 1}`}
//                         {items.length > 0 && (
//                           <Tag color="blue" size="small">
//                             Database lookup available
//                           </Tag>
//                         )}
//                       </Space>
//                     }
//                     extra={
//                       fields.length > 1 ? (
//                         <Button
//                           type="link"
//                           danger
//                           icon={<DeleteOutlined />}
//                           onClick={() => remove(name)}
//                         >
//                           Remove
//                         </Button>
//                       ) : null
//                     }
//                   >
//                     {/* Item Database Lookup */}
//                     {items.length > 0 && (
//                       <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
//                         <Col span={24}>
//                           <Form.Item
//                             label={
//                               <Space>
//                                 <SearchOutlined />
//                                 Search Items Database
//                                 <Text type="secondary">(Optional - or enter manually below)</Text>
//                               </Space>
//                             }
//                           >
//                             <AutoComplete
//                               options={itemSearchOptions}
//                               onSearch={searchItems}
//                               onSelect={(value, option) => handleItemSelect(value, option, name)}
//                               placeholder="Type to search for items in database..."
//                               style={{ width: '100%' }}
//                             />
//                           </Form.Item>
//                         </Col>
//                       </Row>
//                     )}

//                     <Row gutter={[16, 16]}>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'description']}
//                           label="Item Description"
//                           rules={[{ required: true, message: 'Item description is required' }]}
//                         >
//                           <Input placeholder="Enter item description" />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'quantity']}
//                           label="Quantity"
//                           rules={[{ required: true, message: 'Quantity is required' }]}
//                         >
//                           <InputNumber
//                             min={1}
//                             placeholder="Qty"
//                             style={{ width: '100%' }}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'unitPrice']}
//                           label="Unit Price"
//                           rules={[{ required: true, message: 'Unit price is required' }]}
//                         >
//                           <InputNumber
//                             min={0}
//                             placeholder="Price per unit"
//                             style={{ width: '100%' }}
//                             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>
                    
//                     <Row gutter={[16, 16]}>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'unitOfMeasure']}
//                           label="Unit of Measure"
//                         >
//                           <Select placeholder="Select unit">
//                             <Option value="Pieces">Pieces</Option>
//                             <Option value="Sets">Sets</Option>
//                             <Option value="Boxes">Boxes</Option>
//                             <Option value="Packs">Packs</Option>
//                             <Option value="Units">Units</Option>
//                             <Option value="Each">Each</Option>
//                             <Option value="Kg">Kg</Option>
//                             <Option value="Litres">Litres</Option>
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'category']}
//                           label="Category (Optional)"
//                         >
//                           <Select placeholder="Select category" allowClear>
//                             {itemCategories.map(category => (
//                               <Option key={category} value={category}>
//                                 {category}
//                               </Option>
//                             ))}
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                     </Row>
                    
//                     <Row gutter={[16, 16]}>
//                       <Col span={24}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'specifications']}
//                           label="Specifications (Optional)"
//                         >
//                           <TextArea
//                             rows={2}
//                             placeholder="Enter item specifications or additional details..."
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Hidden field to store itemId if selected from database */}
//                     <Form.Item
//                       {...restField}
//                       name={[name, 'itemId']}
//                       hidden
//                     >
//                       <Input />
//                     </Form.Item>
//                   </Card>
//                 ))}
//                 <Form.Item>
//                   <Button
//                     type="dashed"
//                     onClick={() => add()}
//                     block
//                     icon={<PlusOutlined />}
//                   >
//                     Add Item
//                   </Button>
//                   <Form.ErrorList errors={errors} />
//                 </Form.Item>
//               </>
//             )}
//           </Form.List>

//           <Divider>Delivery & Payment Terms</Divider>

//           <Row gutter={[16, 16]}>
//             <Col span={8}>
//               <Form.Item
//                 name="expectedDeliveryDate"
//                 label="Expected Delivery Date"
//                 initialValue={moment()}
//                 rules={[{ required: true, message: 'Please select expected delivery date' }]}
//               >
//                 <DatePicker 
//                   style={{ width: '100%' }}
//                   disabledDate={(current) => current && current < moment().startOf('day')}
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="paymentTerms"
//                 label="Payment Terms"
//                 rules={[{ required: true, message: 'Please select payment terms' }]}
//               >
//                 <Select placeholder="Select payment terms">
//                   <Option value="15 days">15 days</Option>
//                   <Option value="30 days">30 days</Option>
//                   <Option value="45 days">45 days</Option>
//                   <Option value="60 days">60 days</Option>
//                   <Option value="Cash on delivery">Cash on delivery</Option>
//                   <Option value="Advance payment">Advance payment</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               {/* <Form.Item
//                 name="budgetCodeId"
//                 label={
//                   <Space>
//                     Budget Code (Optional)
//                     {budgetCodes.length > 0 && (
//                       <Tag color="blue" size="small">
//                         {budgetCodes.length} available
//                       </Tag>
//                     )}
//                   </Space>
//                 }
//               >
//                 <Select
//                   placeholder="Select budget code"
//                   allowClear
//                   showSearch
//                   loading={budgetCodes.length === 0}
//                   notFoundContent={budgetCodes.length === 0 ? <Spin size="small" /> : 'No budget codes found'}
//                   optionFilterProp="children"
//                 >
//                   {budgetCodes.map(budgetCode => {
//                     const availableBalance = budgetCode.amount - budgetCode.usedAmount;
//                     const utilizationPercent = (budgetCode.usedAmount / budgetCode.amount) * 100;
                    
//                     return (
//                       <Option key={budgetCode._id} value={budgetCode._id}>
//                         <div>
//                           <div style={{ fontWeight: 'bold' }}>
//                             {budgetCode.code} - {budgetCode.name}
//                           </div>
//                           <div style={{ fontSize: '12px', color: '#666' }}>
//                             Available: {buyerRequisitionAPI.formatCurrency(availableBalance)} / {buyerRequisitionAPI.formatCurrency(budgetCode.amount)}
//                           </div>
//                           <div style={{ fontSize: '11px', color: utilizationPercent > 80 ? '#ff4d4f' : '#52c41a' }}>
//                             Utilization: {utilizationPercent.toFixed(1)}%
//                           </div>
//                         </div>
//                       </Option>
//                     );
//                   })}
//                 </Select>
//               </Form.Item> */}
//               <Form.Item
//                 name="budgetCodeId"
//                 label={
//                   <Space>
//                     Budget Code (Optional)
//                     {budgetCodes.length > 0 && (
//                       <Tag color="blue" size="small">
//                         {budgetCodes.length} available
//                       </Tag>
//                     )}
//                   </Space>
//                 }
//               >
//                 <Select
//                   placeholder="Select budget code"
//                   allowClear
//                   showSearch
//                   loading={budgetCodes.length === 0}
//                   notFoundContent={budgetCodes.length === 0 ? <Spin size="small" /> : 'No budget codes found'}
//                   optionFilterProp="children"
//                 >
//                   {budgetCodes.map(budgetCode => {
//                     // Use correct field names from schema: budget, used, remaining
//                     const availableBalance = budgetCode.remaining || (budgetCode.budget - budgetCode.used);
//                     const utilizationPercent = budgetCode.budget > 0 ? (budgetCode.used / budgetCode.budget) * 100 : 0;
                    
//                     return (
//                       <Option key={budgetCode._id} value={budgetCode._id}>
//                         <div>
//                           <div style={{ fontWeight: 'bold' }}>
//                             {budgetCode.code} - {budgetCode.name}
//                           </div>
//                           <div style={{ fontSize: '12px', color: '#666' }}>
//                             Available: {buyerRequisitionAPI.formatCurrency(availableBalance)} / {buyerRequisitionAPI.formatCurrency(budgetCode.budget)}
//                           </div>
//                           <div style={{ fontSize: '11px', color: utilizationPercent > 80 ? '#ff4d4f' : '#52c41a' }}>
//                             Utilization: {utilizationPercent.toFixed(1)}%
//                           </div>
//                         </div>
//                       </Option>
//                     );
//                   })}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="deliveryAddress"
//             label="Delivery Address"
//             rules={[{ required: true, message: 'Please enter delivery address' }]}
//           >
//             <TextArea rows={3} placeholder="Enter complete delivery address..." />
//           </Form.Item>

//           <Form.Item
//             name="specialInstructions"
//             label="Special Instructions"
//           >
//             <TextArea
//               rows={3}
//               placeholder="Add any special instructions for the supplier..."
//             />
//           </Form.Item>

//           <Divider>Tax Configuration</Divider>

//           <Row gutter={[16, 16]}>
//             <Col span={12}>
//               <Form.Item
//                 name="taxApplicable"
//                 label=""
//                 valuePropName="checked"
//                 initialValue={false}
//               >
//                 <Checkbox>
//                   Apply tax to this purchase order
//                 </Checkbox>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="taxRate"
//                 label="Tax Rate (%)"
//                 initialValue={19.25}
//                 dependencies={['taxApplicable']}
//               >
//                 {({ getFieldValue }) => (
//                   <InputNumber
//                     min={0}
//                     max={100}
//                     precision={2}
//                     style={{ width: '100%' }}
//                     disabled={!getFieldValue('taxApplicable')}
//                     addonAfter="%"
//                     placeholder="19.25"
//                   />
//                 )}
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="notes"
//             label="Internal Notes"
//           >
//             <TextArea
//               rows={2}
//               placeholder="Add any internal notes (not visible to supplier)..."
//             />
//           </Form.Item>
//         </Form>
//       </Modal>

//       {/* ========== SEND PO TO SUPPLIER MODAL ========== */}
//       <Modal
//         title={`Send Purchase Order - ${selectedPO?.poNumber || selectedPO?.id}`}
//         open={sendModalVisible}
//         onOk={handleSendPOToSupplier}
//         onCancel={() => setSendModalVisible(false)}
//         confirmLoading={loading}
//         width={600}
//       >
//         <Alert
//           message="Send Purchase Order to Supplier"
//           description={`The purchase order will be sent to ${selectedPO?.supplierName} at ${selectedPO?.supplierEmail}`}
//           type="info"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         <Form form={sendForm} layout="vertical">
//           <Form.Item
//             name="message"
//             label="Additional Message (Optional)"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Add any additional message to include with the purchase order..."
//               showCount
//               maxLength={1000}
//             />
//           </Form.Item>
//         </Form>

//         <Alert
//           message="What happens next?"
//           description="The supplier will receive the purchase order via email with all item details, delivery instructions, and payment terms. They can then acknowledge the order and provide delivery updates."
//           type="info"
//           style={{ marginTop: '16px' }}
//         />
//       </Modal>

//       {/* ========== EMAIL PDF MODAL ========== */}
//       <Modal
//         title={
//           <Space>
//             <ShareAltOutlined />
//             Email PDF - {selectedPO?.poNumber || selectedPO?.id}
//           </Space>
//         }
//         open={emailPDFModalVisible}
//         onOk={handleSendEmailPDF}
//         onCancel={() => setEmailPDFModalVisible(false)}
//         confirmLoading={pdfLoading}
//         width={600}
//       >
//         <Form form={emailPDFForm} layout="vertical">
//           <Form.Item
//             name="emailType"
//             label="Email Type"
//             initialValue="supplier"
//             rules={[{ required: true, message: 'Please select email type' }]}
//           >
//             <Select>
//               <Option value="supplier">Send to Supplier</Option>
//               <Option value="internal">Send to Internal Team</Option>
//               <Option value="custom">Send to Custom Email</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item
//             name="emailTo"
//             label="Email Address"
//             rules={[
//               { required: true, message: 'Please enter email address' },
//               { type: 'email', message: 'Please enter a valid email address' }
//             ]}
//           >
//             <Input 
//               placeholder="Enter recipient email address"
//               prefix={<MailOutlined />}
//             />
//           </Form.Item>

//           <Form.Item
//             name="subject"
//             label="Email Subject (Optional)"
//             initialValue={`Purchase Order ${selectedPO?.poNumber || selectedPO?.id}`}
//           >
//             <Input placeholder="Email subject line" />
//           </Form.Item>

//           <Form.Item
//             name="message"
//             label="Message (Optional)"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Add a message to include with the PDF attachment..."
//               showCount
//               maxLength={1000}
//             />
//           </Form.Item>

//           <Form.Item name="includeAttachments" valuePropName="checked">
//             <Checkbox>Include supporting documents (if any)</Checkbox>
//           </Form.Item>
//         </Form>

//         <Alert
//           message="PDF Email Details"
//           description="The purchase order will be generated as a PDF and sent as an email attachment along with your message."
//           type="info"
//           showIcon
//         />
//       </Modal>

//       {/* ========== BULK DOWNLOAD MODAL ========== */}
//       <Modal
//         title={
//           <Space>
//             <FileZipOutlined />
//             Bulk Download Purchase Orders
//           </Space>
//         }
//         open={bulkDownloadModalVisible}
//         onOk={handleBulkDownloadConfirm}
//         onCancel={() => setBulkDownloadModalVisible(false)}
//         confirmLoading={pdfLoading}
//         width={500}
//       >
//         <div style={{ marginBottom: '16px' }}>
//           <Text strong>Selected Purchase Orders: {selectedRowKeys.length}</Text>
//         </div>
        
//         <List
//           size="small"
//           dataSource={purchaseOrders.filter(po => selectedRowKeys.includes(po.id))}
//           renderItem={(po) => (
//             <List.Item>
//               <List.Item.Meta
//                 avatar={<Avatar icon={<FileTextOutlined />} />}
//                 title={po.poNumber || po.id}
//                 description={`${po.supplierName} - ${po.currency} ${po.totalAmount.toLocaleString()}`}
//               />
//               {getStatusTag(po.status)}
//             </List.Item>
//           )}
//           style={{ maxHeight: '300px', overflowY: 'auto' }}
//         />

//         <Divider />

//         <Form layout="vertical">
//           <Form.Item label="Download Format">
//             <Select defaultValue="pdf" disabled>
//               <Option value="pdf">PDF Files in ZIP Archive</Option>
//             </Select>
//           </Form.Item>

//           <Form.Item label="File Naming">
//             <Select defaultValue="po_number">
//               <Option value="po_number">PO Number</Option>
//               <Option value="supplier_po">Supplier - PO Number</Option>
//               <Option value="date_po">Date - PO Number</Option>
//             </Select>
//           </Form.Item>
//         </Form>

//         <Alert
//           message="Bulk Download"
//           description={`${selectedRowKeys.length} purchase orders will be generated as PDFs and packaged into a ZIP file for download.`}
//           type="info"
//           showIcon
//         />
//       </Modal>

//       {/* // Enhanced Edit Modal JSX (replace existing edit modal) */}
//       <Modal
//         title={`Edit Purchase Order - ${selectedPO?.poNumber || selectedPO?.id}`}
//         open={editModalVisible}
//         onOk={handleUpdatePO}
//         onCancel={() => setEditModalVisible(false)}
//         confirmLoading={loading}
//         width={1200}
//         maskClosable={false}
//       >
//         <Form form={form} layout="vertical">
//           <Alert
//             message="Edit Purchase Order"
//             description={`Status: ${selectedPO?.status}. You can edit all order details except supplier information.`}
//             type="info"
//             showIcon
//             style={{ marginBottom: '24px' }}
//           />

//           <Divider>Order Details</Divider>

//           <Row gutter={[16, 16]}>
//             <Col span={8}>
//               <Form.Item
//                 name="expectedDeliveryDate"
//                 label="Expected Delivery Date"
//                 initialValue={moment()}
//                 rules={[{ required: true, message: 'Please select expected delivery date' }]}
//               >
//                 <DatePicker 
//                   style={{ width: '100%' }}
//                   disabledDate={(current) => current && current < moment().startOf('day')}
//                 />
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="paymentTerms"
//                 label="Payment Terms"
//                 rules={[{ required: true, message: 'Please select payment terms' }]}
//               >
//                 <Select placeholder="Select payment terms">
//                   <Option value="15 days">15 days</Option>
//                   <Option value="30 days">30 days</Option>
//                   <Option value="45 days">45 days</Option>
//                   <Option value="60 days">60 days</Option>
//                   <Option value="Cash on delivery">Cash on delivery</Option>
//                   <Option value="Advance payment">Advance payment</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col span={8}>
//               <Form.Item
//                 name="currency"
//                 label="Currency"
//                 rules={[{ required: true, message: 'Please select currency' }]}
//               >
//                 <Select>
//                   <Option value="XAF">XAF (Central African Franc)</Option>
//                   <Option value="USD">USD (US Dollar)</Option>
//                   <Option value="EUR">EUR (Euro)</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="deliveryAddress"
//             label="Delivery Address"
//             rules={[{ required: true, message: 'Please enter delivery address' }]}
//           >
//             <TextArea rows={3} placeholder="Enter complete delivery address..." />
//           </Form.Item>

//           <Divider>Items</Divider>

//           <Form.List
//             name="items"
//             rules={[
//               {
//                 validator: async (_, items) => {
//                   if (!items || items.length < 1) {
//                     return Promise.reject(new Error('At least one item is required'));
//                   }
//                 }
//               }
//             ]}
//           >
//             {(fields, { add, remove }, { errors }) => (
//               <>
//                 {fields.map(({ key, name, ...restField }) => (
//                   <Card 
//                     key={key} 
//                     size="small" 
//                     style={{ marginBottom: '16px' }}
//                     title={`Item ${name + 1}`}
//                     extra={
//                       fields.length > 1 ? (
//                         <Button
//                           type="link"
//                           danger
//                           icon={<DeleteOutlined />}
//                           onClick={() => remove(name)}
//                         >
//                           Remove
//                         </Button>
//                       ) : null
//                     }
//                   >
//                     <Row gutter={[16, 16]}>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'description']}
//                           label="Item Description"
//                           rules={[{ required: true, message: 'Item description is required' }]}
//                         >
//                           <Input placeholder="Enter item description" />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'quantity']}
//                           label="Quantity"
//                           rules={[{ required: true, message: 'Quantity is required' }]}
//                         >
//                           <InputNumber
//                             min={1}
//                             placeholder="Qty"
//                             style={{ width: '100%' }}
//                           />
//                         </Form.Item>
//                       </Col>
//                       <Col span={6}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'unitPrice']}
//                           label="Unit Price"
//                           rules={[{ required: true, message: 'Unit price is required' }]}
//                         >
//                           <InputNumber
//                             min={0}
//                             placeholder="Price per unit"
//                             style={{ width: '100%' }}
//                             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                             parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>
                    
//                     <Row gutter={[16, 16]}>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'unitOfMeasure']}
//                           label="Unit of Measure"
//                         >
//                           <Select placeholder="Select unit">
//                             <Option value="Pieces">Pieces</Option>
//                             <Option value="Sets">Sets</Option>
//                             <Option value="Boxes">Boxes</Option>
//                             <Option value="Packs">Packs</Option>
//                             <Option value="Units">Units</Option>
//                             <Option value="Each">Each</Option>
//                             <Option value="Kg">Kg</Option>
//                             <Option value="Litres">Litres</Option>
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                       <Col span={12}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'category']}
//                           label="Category (Optional)"
//                         >
//                           <Select placeholder="Select category" allowClear>
//                             {itemCategories.map(category => (
//                               <Option key={category} value={category}>
//                                 {category}
//                               </Option>
//                             ))}
//                           </Select>
//                         </Form.Item>
//                       </Col>
//                     </Row>
                    
//                     <Row gutter={[16, 16]}>
//                       <Col span={24}>
//                         <Form.Item
//                           {...restField}
//                           name={[name, 'specifications']}
//                           label="Specifications (Optional)"
//                         >
//                           <TextArea
//                             rows={2}
//                             placeholder="Enter item specifications or additional details..."
//                           />
//                         </Form.Item>
//                       </Col>
//                     </Row>

//                     {/* Hidden field for itemId */}
//                     <Form.Item
//                       {...restField}
//                       name={[name, 'itemId']}
//                       hidden
//                     >
//                       <Input />
//                     </Form.Item>
//                   </Card>
//                 ))}
//                 <Form.Item>
//                   <Button
//                     type="dashed"
//                     onClick={() => add()}
//                     block
//                     icon={<PlusOutlined />}
//                   >
//                     Add Item
//                   </Button>
//                   <Form.ErrorList errors={errors} />
//                 </Form.Item>
//               </>
//             )}
//           </Form.List>

//           <Divider>Tax Configuration</Divider>

//           <Row gutter={[16, 16]}>
//             <Col span={12}>
//               <Form.Item
//                 name="taxApplicable"
//                 label=""
//                 valuePropName="checked"
//               >
//                 <Checkbox>
//                   Apply tax to this purchase order
//                 </Checkbox>
//               </Form.Item>
//             </Col>
//             <Col span={12}>
//               <Form.Item
//                 name="taxRate"
//                 label="Tax Rate (%)"
//                 dependencies={['taxApplicable']}
//               >
//                 {({ getFieldValue }) => (
//                   <InputNumber
//                     min={0}
//                     max={100}
//                     precision={2}
//                     style={{ width: '100%' }}
//                     disabled={!getFieldValue('taxApplicable')}
//                     addonAfter="%"
//                     placeholder="19.25"
//                   />
//                 )}
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider>Additional Information</Divider>

//           <Form.Item
//             name="specialInstructions"
//             label="Special Instructions"
//           >
//             <TextArea
//               rows={3}
//               placeholder="Add any special instructions for the supplier..."
//             />
//           </Form.Item>

//           <Form.Item
//             name="notes"
//             label="Internal Notes"
//           >
//             <TextArea
//               rows={2}
//               placeholder="Add any internal notes (not visible to supplier)..."
//             />
//           </Form.Item>
//         </Form>

//         <Alert
//           message="Important Note"
//           description="Changes to items will recalculate the total amount. Make sure all quantities and prices are correct before saving."
//           type="warning"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       </Modal>

//       {/* ==================== DRAWERS ==================== */}

//       {/* ========== PURCHASE ORDER DETAILS DRAWER ========== */}
//       <Drawer
//         title={
//           <Space>
//             <FileTextOutlined />
//             Purchase Order Details - {selectedPO?.poNumber || selectedPO?.id}
//           </Space>
//         }
//         placement="right"
//         width={900}
//         open={detailDrawerVisible}
//         onClose={() => setDetailDrawerVisible(false)}
//       >
//         {selectedPO && (
//           <div>
//             {/* PO Header */}
//             <Card size="small" title="Purchase Order Information" style={{ marginBottom: '16px' }}>
//               <Row gutter={[16, 16]}>
//                 <Col span={12}>
//                   <Descriptions column={1} size="small">
//                     <Descriptions.Item label="PO Number">
//                       <Text code strong>{selectedPO.poNumber || selectedPO.id}</Text>
//                     </Descriptions.Item>
//                     {selectedPO.requisitionId && (
//                       <Descriptions.Item label="Requisition">
//                         {selectedPO.requisitionId}
//                       </Descriptions.Item>
//                     )}
//                     <Descriptions.Item label="Creation Date">
//                       {moment(selectedPO.creationDate).format('MMM DD, YYYY HH:mm')}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Expected Delivery">
//                       {selectedPO.expectedDeliveryDate ? (
//                         <Text type={moment(selectedPO.expectedDeliveryDate).isBefore(moment()) && 
//                                     !['delivered', 'completed'].includes(selectedPO.status) ? 'danger' : 'default'}>
//                           {moment(selectedPO.expectedDeliveryDate).format('MMM DD, YYYY')}
//                         </Text>
//                       ) : (
//                         <Text type="secondary">Not set</Text>
//                       )}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Payment Terms">
//                       {selectedPO.paymentTerms}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Status">
//                       {getStatusTag(selectedPO.status)}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//                 <Col span={12}>
//                   <Descriptions column={1} size="small">
//                     <Descriptions.Item label="Supplier">
//                       {selectedPO.supplierName}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Email">
//                       <MailOutlined /> {selectedPO.supplierEmail}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Phone">
//                       <PhoneOutlined /> {selectedPO.supplierPhone}
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Total Amount">
//                       <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
//                         {selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}
//                       </Text>
//                     </Descriptions.Item>
//                     <Descriptions.Item label="Delivery Address">
//                       <TruckOutlined /> {selectedPO.deliveryAddress}
//                     </Descriptions.Item>
//                   </Descriptions>
//                 </Col>
//               </Row>
//             </Card>

//             {/* Progress Tracking */}
//             <Card size="small" title="Order Progress" style={{ marginBottom: '16px' }}>
//               <Steps current={getStageIndex(selectedPO.currentStage)}>
//                 {getStageSteps().map((step, index) => (
//                   <Step key={index} title={step} />
//                 ))}
//               </Steps>
//               <div style={{ marginTop: '16px' }}>
//                 <Progress 
//                   percent={selectedPO.progress || 0} 
//                   status={selectedPO.status === 'cancelled' ? 'exception' : 'active'}
//                 />
//               </div>
//             </Card>

//             {/* Items Table */}
//             <Card size="small" title="Ordered Items" style={{ marginBottom: '16px' }}>
//               <Table
//                 columns={[
//                   {
//                     title: 'Description',
//                     dataIndex: 'description',
//                     key: 'description',
//                     render: (text, record) => (
//                       <div>
//                         <Text strong>{text}</Text>
//                         {record.itemCode && (
//                           <>
//                             <br />
//                             <Tag size="small" color="blue">
//                               {record.itemCode}
//                             </Tag>
//                           </>
//                         )}
//                         {record.category && (
//                           <Tag size="small" color="green">
//                             {record.category}
//                           </Tag>
//                         )}
//                       </div>
//                     )
//                   },
//                   {
//                     title: 'Qty',
//                     dataIndex: 'quantity',
//                     key: 'quantity',
//                     width: 60,
//                     align: 'center',
//                     render: (qty, record) => (
//                       <div>
//                         {qty}
//                         {record.unitOfMeasure && (
//                           <>
//                             <br />
//                             <Text type="secondary" style={{ fontSize: '11px' }}>
//                               {record.unitOfMeasure}
//                             </Text>
//                           </>
//                         )}
//                       </div>
//                     )
//                   },
//                   {
//                     title: 'Unit Price',
//                     dataIndex: 'unitPrice',
//                     key: 'unitPrice',
//                     render: (price) => `${selectedPO.currency} ${price.toLocaleString()}`,
//                     width: 120
//                   },
//                   {
//                     title: 'Total',
//                     dataIndex: 'totalPrice',
//                     key: 'totalPrice',
//                     render: (price) => (
//                       <Text strong>{selectedPO.currency} {price.toLocaleString()}</Text>
//                     ),
//                     width: 120
//                   }
//                 ]}
//                 dataSource={selectedPO.items || []}
//                 pagination={false}
//                 size="small"
//                 rowKey="description"
//                 summary={(pageData) => {
//                   const total = pageData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
//                   return (
//                     <Table.Summary.Row>
//                       <Table.Summary.Cell index={0} colSpan={3}>
//                         <Text strong>Total Amount:</Text>
//                       </Table.Summary.Cell>
//                       <Table.Summary.Cell index={3}>
//                         <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
//                           {selectedPO.currency} {total.toLocaleString()}
//                         </Text>
//                       </Table.Summary.Cell>
//                     </Table.Summary.Row>
//                   );
//                 }}
//               />
//             </Card>

//             {/* Special Instructions */}
//             {selectedPO.specialInstructions && (
//               <Card size="small" title="Special Instructions" style={{ marginBottom: '16px' }}>
//                 <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
//                   <Text>{selectedPO.specialInstructions}</Text>
//                 </div>
//               </Card>
//             )}

//             {/* Notes */}
//             {selectedPO.notes && (
//               <Card size="small" title="Internal Notes" style={{ marginBottom: '16px' }}>
//                 <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
//                   <Text>{selectedPO.notes}</Text>
//                 </div>
//               </Card>
//             )}

//             {/* Action Buttons */}
//             <Space style={{ marginTop: '16px' }}>
//               {selectedPO.status === 'draft' && (
//                 <Button 
//                   type="primary" 
//                   icon={<SendOutlined />}
//                   onClick={() => {
//                     setDetailDrawerVisible(false);
//                     handleSendPO(selectedPO);
//                   }}
//                 >
//                   Send to Supplier
//                 </Button>
//               )}
//               {!['delivered', 'completed', 'cancelled'].includes(selectedPO.status) && (
//                 <>
//                   <Button 
//                     type="default" 
//                     icon={<EditOutlined />}
//                     onClick={() => {
//                       setDetailDrawerVisible(false);
//                       handleEditPO(selectedPO);
//                     }}
//                   >
//                     Edit PO
//                   </Button>
//                   <Button 
//                     danger
//                     icon={<StopOutlined />}
//                     onClick={() => handleCancelPO(selectedPO)}
//                   >
//                     Cancel PO
//                   </Button>
//                 </>
//               )}
//               <Button 
//                 icon={<DownloadOutlined />}
//                 loading={pdfLoading}
//                 onClick={() => handleDownloadPDF(selectedPO)}
//               >
//                 Download PDF
//               </Button>
//               <Button 
//                 icon={<FilePdfOutlined />}
//                 loading={pdfLoading}
//                 onClick={() => handlePreviewPDF(selectedPO)}
//               >
//                 Preview PDF
//               </Button>
//               <Button 
//                 icon={<ShareAltOutlined />}
//                 onClick={() => handleEmailPDF(selectedPO)}
//               >
//                 Email PDF
//               </Button>
//               <Button icon={<PrinterOutlined />}>
//                 Print
//               </Button>
//             </Space>
//           </div>
//         )}
//       </Drawer>
//     </div>
//   );
// };

// export default BuyerPurchaseOrders;






