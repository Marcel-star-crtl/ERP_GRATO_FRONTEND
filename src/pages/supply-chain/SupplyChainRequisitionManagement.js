import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Statistic,
  Modal,
  Descriptions,
  Timeline,
  Input,
  Select,
  Tabs,
  Badge,
  Drawer,
  message,
  Form,
  Avatar,
  Tooltip,
  Divider,
  Spin,
  Empty
} from 'antd';
import {
  ShoppingCartOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  FileTextOutlined,
  SendOutlined,
  UserOutlined,
  TeamOutlined,
  DollarOutlined,
  CalendarOutlined,
  ExportOutlined,
  TagOutlined,
  TruckOutlined,
  BankOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  LoadingOutlined,
  QuestionCircleOutlined,
  MessageOutlined,
  StopOutlined
} from '@ant-design/icons';
import AttachmentDisplay from '../../components/AttachmentDisplay';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// ✅ UPDATED: Enhanced API Service with new approval flow endpoints
const apiService = {
  // Get supply chain requisitions
  getSupplyChainRequisitions: async () => {
    try {
      console.log('Fetching supply chain requisitions...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/supply-chain`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Supply chain requisitions response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getSupplyChainRequisitions:', error);
      throw error;
    }
  },

  // Reject requisition
  rejectSupplyChainRequisition: async (requisitionId, data) => {
    try {
      console.log('Rejecting requisition:', requisitionId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/${requisitionId}/supply-chain-reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Reject response:', responseData);
      return responseData;
    } catch (error) {
      console.error('API Error - rejectSupplyChainRequisition:', error);
      throw error;
    }
  },

  // Get available buyers
  getAvailableBuyers: async () => {
    try {
      console.log('Fetching available buyers...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/buyers/available`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Available buyers response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getAvailableBuyers:', error);
      throw error;
    }
  },

  // ✅ NEW: Supply Chain Business Decisions (replaces assignBuyer)
  makeBusinessDecisions: async (requisitionId, decisionsData) => {
    try {
      console.log('Making business decisions:', { requisitionId, decisionsData });
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/${requisitionId}/supply-chain-decisions`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(decisionsData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Business decisions response:', data);
      return data;
    } catch (error) {
      console.error('API Error - makeBusinessDecisions:', error);
      throw error;
    }
  },

  // Request clarification from previous approver
  requestClarification: async (requisitionId, data) => {
    try {
      console.log('Requesting clarification:', requisitionId);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/${requisitionId}/request-clarification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error - requestClarification:', error);
      throw error;
    }
  },

  // Get clarification history
  getClarificationHistory: async (requisitionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/${requisitionId}/clarification-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API Error - getClarificationHistory:', error);
      throw error;
    }
  },

  // Get buyer requisitions
  getBuyerRequisitions: async () => {
    try {
      console.log('Fetching buyer requisitions...');
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/purchase-requisitions/buyer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Buyer requisitions response:', data);
      return data;
    } catch (error) {
      console.error('API Error - getBuyerRequisitions:', error);
      throw error;
    }
  }
};

const EnhancedSupplyChainRequisitionManagement = () => {
  // State Management
  const [requisitions, setRequisitions] = useState([]);
  const [availableBuyers, setAvailableBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [buyersLoading, setBuyersLoading] = useState(false);
  const [selectedRequisition, setSelectedRequisition] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [assignmentLoading, setAssignmentLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [assignmentForm] = Form.useForm();
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [clarificationModalVisible, setClarificationModalVisible] = useState(false);
  const [clarificationMessage, setClarificationMessage] = useState('');
  const [selectedApprover, setSelectedApprover] = useState(null);
  const [requestingClarification, setRequestingClarification] = useState(false);
  const [clarificationHistory, setClarificationHistory] = useState([]);
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState(null);

  // ✅ UPDATED: Assignment form fields with payment method
  const [assignedBuyer, setAssignedBuyer] = useState('');
  const [purchaseType, setPurchaseType] = useState('');
  const [sourcingType, setSourcingType] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank'); // ✅ NEW
  const [estimatedCost, setEstimatedCost] = useState('');
  const [comments, setComments] = useState('');

  const [cancellationRequests, setCancellationRequests] = useState([]);
  const [cancellationLoading, setCancellationLoading] = useState(false);
  const [cancellationComments, setCancellationComments] = useState('');
  const [cancellationActionLoading, setCancellationActionLoading] = useState(false);


  // Initial data loading
  useEffect(() => {
    fetchRequisitions();
    fetchAvailableBuyers();
    fetchCancellationRequests();
  }, []);

  // API Functions
  const fetchRequisitions = async () => {
    setLoading(true);
    try {
      const response = await apiService.getSupplyChainRequisitions();
      if (response.success) {
        setRequisitions(response.data || []);
        console.log('Loaded requisitions:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to fetch requisitions');
        setRequisitions([]);
      }
    } catch (error) {
      console.error('Error fetching requisitions:', error);
      message.error('Failed to fetch requisitions. Please check your connection and try again.');
      setRequisitions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableBuyers = async () => {
    setBuyersLoading(true);
    try {
      const response = await apiService.getAvailableBuyers();
      if (response.success) {
        setAvailableBuyers(response.data || []);
        console.log('Loaded buyers:', response.data?.length || 0);
      } else {
        message.error(response.message || 'Failed to fetch available buyers');
        setAvailableBuyers([]);
      }
    } catch (error) {
      console.error('Error fetching buyers:', error);
      message.warning('Failed to fetch available buyers. Assignment functionality may be limited.');
      setAvailableBuyers([]);
    } finally {
      setBuyersLoading(false);
    }
  };

  const fetchCancellationRequests = async () => {
  setCancellationLoading(true);
  try {
    const response = await apiService.getCancellationRequests();
    if (response.success) {
      setCancellationRequests(response.data || []);
    }
  } catch (error) {
    console.error('Error fetching cancellation requests:', error);
  } finally {
    setCancellationLoading(false);
  }
};

  // Status and Tag Functions
  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supply_chain_review': { color: 'orange', text: 'Pending Business Decisions', icon: <ClockCircleOutlined /> },
      'pending_head_approval': { color: 'purple', text: 'Pending Head Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'green', text: 'Fully Approved', icon: <CheckCircleOutlined /> },
      'supply_chain_rejected': { color: 'red', text: 'Rejected', icon: <CloseCircleOutlined /> },
      'in_procurement': { color: 'purple', text: 'In Procurement', icon: <ShoppingCartOutlined /> },
      'procurement_complete': { color: 'green', text: 'Procurement Complete', icon: <CheckCircleOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <TruckOutlined /> },
      'pending_cancellation': { color: 'volcano', text: 'Cancellation Pending', icon: <StopOutlined /> },
      'cancelled': { color: 'error', text: 'Cancelled', icon: <CloseCircleOutlined /> },
    };

    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: null };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getUrgencyTag = (urgency) => {
    const urgencyMap = {
      'Low': 'green',
      'Medium': 'orange',
      'High': 'red'
    };
    return <Tag color={urgencyMap[urgency] || 'default'}>{urgency}</Tag>;
  };

  const getPurchaseTypeTag = (type) => {
    const typeMap = {
      'opex': { color: 'blue', text: 'OPEX' },
      'capex': { color: 'gold', text: 'CAPEX' },
      'standard': { color: 'blue', text: 'Standard' },
      'emergency': { color: 'red', text: 'Emergency' }
    };

    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const getSourcingTypeTag = (type) => {
    const typeMap = {
      'direct_purchase': { color: 'green', text: 'Direct Purchase' },
      'quotation_required': { color: 'blue', text: 'Quotation Required' },
      'tender_process': { color: 'purple', text: 'Tender Process' },
      'framework_agreement': { color: 'gold', text: 'Framework Agreement' }
    };

    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  // ✅ NEW: Payment Method Tag
  const getPaymentMethodTag = (method) => {
    if (method === 'cash') {
      return (
        <Tag color="gold" icon={<DollarOutlined />}>
          Project Cash
        </Tag>
      );
    }
    return (
      <Tag color="blue" icon={<BankOutlined />}>
        Bank Transfer
      </Tag>
    );
  };

  // ✅ UPDATED: Reset form with payment method
  const resetAssignmentForm = () => {
    setAssignedBuyer('');
    setPurchaseType('');
    setSourcingType('');
    setPaymentMethod('bank');
    setEstimatedCost('');
    setComments('');
    assignmentForm.resetFields();
  };

  // ✅ UPDATED: Auto-populate suggestions with payment method
  const populateSuggestions = (requisition) => {
    if (!requisition) return;

    const budget = requisition.financeVerification?.assignedBudget || requisition.budgetXAF || 0;
    const urgency = requisition.urgency;

    // Suggest purchase type
    let suggestedPurchaseType = 'standard';
    if (urgency === 'High') {
      suggestedPurchaseType = 'emergency';
    } else if (budget > 3000000) {
      suggestedPurchaseType = 'capex';
    } else {
      suggestedPurchaseType = 'opex';
    }

    // Suggest sourcing type
    let suggestedSourcingType = 'direct_purchase';
    if (budget > 5000000) {
      suggestedSourcingType = 'tender_process';
    } else if (budget > 1000000) {
      suggestedSourcingType = 'quotation_required';
    }

    // ✅ NEW: Suggest payment method
    let suggestedPaymentMethod = 'bank';
    if (budget <= 1000000 && urgency === 'High') {
      suggestedPaymentMethod = 'cash';
    }

    // Suggest buyer
    const suitableBuyer = getSuitableBuyer(requisition);

    // Update form
    setPurchaseType(suggestedPurchaseType);
    setSourcingType(suggestedSourcingType);
    setPaymentMethod(suggestedPaymentMethod);
    if (suitableBuyer) {
      setAssignedBuyer(suitableBuyer._id);
    }

    assignmentForm.setFieldsValue({
      purchaseType: suggestedPurchaseType,
      sourcingType: suggestedSourcingType,
      paymentMethod: suggestedPaymentMethod,
      assignedBuyer: suitableBuyer?._id,
      estimatedCost: budget || undefined
    });
  };

  // Helper Functions
  const getSuitableBuyer = (requisition) => {
    const estimatedValue = requisition.financeVerification?.assignedBudget || requisition.budgetXAF || 0;

    return availableBuyers.find(buyer => {
      if (estimatedValue > (buyer.buyerDetails?.maxOrderValue || 1000000)) return false;

      const specializations = buyer.buyerDetails?.specializations || [];
      if (specializations.includes('All')) return true;

      const itemCategory = requisition.itemCategory?.replace(' ', '_');
      return specializations.includes(itemCategory) || specializations.includes('General');
    });
  };

  // ✅ UPDATED: Business Decisions Handler (replaces buyer assignment)
  const handleBusinessDecisions = async () => {
    try {
      const values = await assignmentForm.validateFields();
      
      if (!assignedBuyer) {
        message.error('Please select a buyer');
        return;
      }
      if (!purchaseType) {
        message.error('Please select purchase type');
        return;
      }
      if (!sourcingType) {
        message.error('Please select sourcing type');
        return;
      }
      if (!paymentMethod) {
        message.error('Please select payment method');
        return;
      }
      if (!comments) {
        message.error('Please provide decision comments');
        return;
      }

      setAssignmentLoading(true);

      const decisionsData = {
        sourcingType,
        purchaseType,
        paymentMethod,
        assignedBuyer,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        comments
      };

      console.log('Submitting business decisions:', decisionsData);

      const response = await apiService.makeBusinessDecisions(
        selectedRequisition._id, 
        decisionsData
      );

      if (response.success) {
        message.success('Business decisions recorded successfully! Moving to head approval.');
        setDetailDrawerVisible(false);
        resetAssignmentForm();
        await fetchRequisitions();
      } else {
        message.error(response.message || 'Failed to record business decisions');
      }
    } catch (error) {
      if (error.errorFields) {
        message.error('Please fill in all required fields');
      } else {
        console.error('Business decisions error:', error);
        message.error('Failed to record business decisions. Please try again.');
      }
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Handle Rejection
  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      message.error('Please provide a detailed rejection reason (minimum 10 characters)');
      return;
    }

    try {
      setRejecting(true);

      const response = await apiService.rejectSupplyChainRequisition(
        selectedRequisition._id,
        { rejectionReason: rejectionReason.trim() }
      );

      if (response.success) {
        message.success('Requisition rejected successfully');
        setRejectModalVisible(false);
        setRejectionReason('');
        setDetailDrawerVisible(false);
        setSelectedRequisition(null);
        await fetchRequisitions();
      } else {
        message.error(response.message || 'Failed to reject requisition');
      }
    } catch (error) {
      console.error('Reject error:', error);
      message.error(error.message || 'Failed to reject requisition');
    } finally {
      setRejecting(false);
    }
  };

  // Handle Request Clarification
  const handleRequestClarification = async () => {
    if (!selectedApprover) {
      message.error('Please select an approver to request clarification from');
      return;
    }

    if (!clarificationMessage || clarificationMessage.trim().length < 20) {
      message.error('Please provide a detailed question (minimum 20 characters)');
      return;
    }

    try {
      setRequestingClarification(true);

      const response = await apiService.requestClarification(
        selectedRequisition._id,
        {
          targetApproverEmail: selectedApprover,
          message: clarificationMessage.trim()
        }
      );

      if (response.success) {
        message.success('Clarification request sent successfully');
        setClarificationModalVisible(false);
        setClarificationMessage('');
        setSelectedApprover(null);
        setDetailDrawerVisible(false);
        await fetchRequisitions();
      } else {
        message.error(response.message || 'Failed to request clarification');
      }
    } catch (error) {
      console.error('Request clarification error:', error);
      message.error(error.message || 'Failed to request clarification');
    } finally {
      setRequestingClarification(false);
    }
  };

//   processCancellationApproval: async (requisitionId, data) => {
//   try {
//     const token = localStorage.getItem('token');
//     const response = await fetch(
//       `${API_BASE_URL}/purchase-requisitions/${requisitionId}/process-cancellation`,
//       {
//         method: 'POST',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         },
//         body: JSON.stringify(data)
//       }
//     );
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error('API Error - processCancellationApproval:', error);
//     throw error;
//   }
// };

// getCancellationRequests: async () => {
//   try {
//     const token = localStorage.getItem('token');
//     const response = await fetch(`${API_BASE_URL}/purchase-requisitions/cancellation-requests`, {
//       headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
//     });
//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
//     }
//     return await response.json();
//   } catch (error) {
//     console.error('API Error - getCancellationRequests:', error);
//     throw error;
//   }
// };

  // Load clarification history when viewing requisition
  const loadClarificationHistory = async (requisitionId) => {
    try {
      const response = await apiService.getClarificationHistory(requisitionId);
      if (response.success) {
        setClarificationHistory(response.data?.clarificationRequests || []);
      }
    } catch (error) {
      console.error('Error loading clarification history:', error);
    }
  };

  const handleCancellationDecision = async (decision) => {
  if (!cancellationComments || cancellationComments.trim().length < 5) {
    message.error('Please provide a comment (minimum 5 characters)');
    return;
  }

  Modal.confirm({
    title: `Confirm Cancellation ${decision === 'approved' ? 'Approval' : 'Rejection'}`,
    content: decision === 'approved'
      ? 'Approving will forward the cancellation to the next level in the chain.'
      : 'Rejecting will restore the PR to its previous active status immediately.',
    onOk: async () => {
      setCancellationActionLoading(true);
      try {
        const response = await apiService.processCancellationApproval(
          selectedRequisition._id,
          { decision, comments: cancellationComments.trim() }
        );
        if (response.success) {
          message.success(response.message);
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
          setCancellationComments('');
          await fetchRequisitions();
          await fetchCancellationRequests();
        } else {
          message.error(response.message || 'Failed to process cancellation');
        }
      } catch (error) {
        message.error(error.message || 'Failed to process cancellation');
      } finally {
        setCancellationActionLoading(false);
      }
    }
  });
};


  // View Details Handler
  const handleViewDetails = (requisition) => {
    console.log('Viewing requisition:', requisition);
    setSelectedRequisition(requisition);
    setDetailDrawerVisible(true);
    resetAssignmentForm();
    loadClarificationHistory(requisition._id);
    
    if (requisition.status === 'pending_supply_chain_review') {
      setTimeout(() => populateSuggestions(requisition), 100);
    }
  };

  // Download Attachment Handler
  const handleDownloadAttachment = async (attachment) => {
    if (!selectedRequisition?._id || !attachment._id) {
      message.error('Invalid attachment information');
      return;
    }

    setDownloadingAttachmentId(attachment._id);

    try {
      const token = localStorage.getItem('token');

      console.log('📥 Downloading attachment:', {
        requisitionId: selectedRequisition._id,
        attachmentId: attachment._id,
        name: attachment.name
      });

      const response = await fetch(
        `${API_BASE_URL}/purchase-requisitions/${selectedRequisition._id}/attachments/${attachment._id}/download`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to download file');
      }

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = attachment.name || 'attachment';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`Downloaded: ${filename}`);
    } catch (error) {
      console.error('Download error:', error);
      message.error(error.message || 'Failed to download attachment');
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  // ✅ UPDATED: Filter requisitions by tab
  const getFilteredRequisitions = () => {
    if (activeTab === 'pending') {
      return requisitions.filter(r => r.status === 'pending_supply_chain_review');
    }
    if (activeTab === 'assigned') {
      return requisitions.filter(r => r.status === 'pending_head_approval');
    }
    if (activeTab === 'approved') {
      // Show both 'approved' and 'in_procurement' statuses
      return requisitions.filter(r => ['approved', 'in_procurement'].includes(r.status));
    }
    if (activeTab === 'completed') {
      return requisitions.filter(r => ['procurement_complete', 'delivered'].includes(r.status));
    }
    if (activeTab === 'rejected') {
      return requisitions.filter(r => r.status === 'supply_chain_rejected');
    }
    return requisitions;
  };

  // Table columns
  const columns = [
    {
      title: 'Requisition Details',
      key: 'requisition',
      render: (_, record) => (
        <div>
          <Text strong>{record.title}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            REQ-{record._id?.slice(-6).toUpperCase() || 'N/A'}
          </Text>
          <br />
          <Tag size="small" color="blue">{record.itemCategory}</Tag>
          {record.purchaseType && getPurchaseTypeTag(record.purchaseType)}
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
            {record.employee?.department || record.department}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Budget Info',
      key: 'budget',
      render: (_, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>
            XAF {(record.financeVerification?.assignedBudget || record.budgetXAF)?.toLocaleString() || 'TBD'}
          </Text>
          <br />
          {record.financeVerification?.budgetCode && (
            <Tag size="small" color="gold">
              <TagOutlined /> {record.financeVerification.budgetCode}
            </Tag>
          )}
        </div>
      ),
      width: 120
    },
    {
      title: 'Items',
      key: 'itemCount',
      render: (_, record) => record.items?.length || 0,
      align: 'center',
      width: 70
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 180
    },
    {
      title: 'Urgency',
      dataIndex: 'urgency',
      key: 'urgency',
      render: (urgency) => getUrgencyTag(urgency),
      width: 100
    },
    {
      title: 'Assignment',
      key: 'assignment',
      render: (_, record) => {
        const buyer = record.assignedBuyer || (record.supplyChainReview?.assignedBuyer ? availableBuyers.find(b => b._id === record.supplyChainReview.assignedBuyer) : null);
        return (
          <div>
            {buyer ? (
              <>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text style={{ marginLeft: 8 }}>{buyer.fullName || buyer.name}</Text>
                <br />
                {buyer.email && <Text type="secondary" style={{ fontSize: '12px' }}>{buyer.email}</Text>}
              </>
            ) : <Text type="secondary">Not assigned</Text>}
            {record.paymentMethod && (
              <div style={{ marginTop: '4px' }}>{getPaymentMethodTag(record.paymentMethod)}</div>
            )}
            {record.financeVerification?.budgetCode && (
              <div style={{ marginTop: '4px' }}><Tag color="purple">{record.financeVerification.budgetCode}</Tag></div>
            )}
          </div>
        );
      },
      width: 180
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

          {record.status === 'pending_supply_chain_review' && (
            <Tooltip title="Make Business Decisions">
              <Button 
                size="small" 
                type="primary"
                onClick={() => handleViewDetails(record)}
              >
                Process
              </Button>
            </Tooltip>
          )}
        </Space>
      ),
      width: 120,
      fixed: 'right'
    }
  ];

  // Statistics
  const filteredData = getFilteredRequisitions();
  const stats = {
    pending: requisitions.filter(r => r.status === 'pending_supply_chain_review').length,
    assigned: requisitions.filter(r => r.status === 'pending_head_approval').length,
    approved: requisitions.filter(r => ['approved', 'in_procurement'].includes(r.status)).length,
    completed: requisitions.filter(r => ['procurement_complete', 'delivered'].includes(r.status)).length,
    rejected: requisitions.filter(r => r.status === 'supply_chain_rejected').length,
    cancellations: cancellationRequests.length,
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <ShoppingCartOutlined /> Supply Chain - Purchase Requisitions
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={() => {
                fetchRequisitions();
                fetchAvailableBuyers();
              }}
              loading={loading || buyersLoading}
            >
              Refresh
            </Button>
            <Button icon={<ExportOutlined />}>
              Export
            </Button>
          </Space>
        </div>

        {/* Statistics */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={5}>
            <Statistic
              title="Pending Business Decisions"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Awaiting Head Approval"
              value={stats.assigned}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Approved/In Progress"
              value={stats.approved}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Completed"
              value={stats.completed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={5}>
            <Statistic
              title="Available Buyers"
              value={availableBuyers.length}
              prefix={buyersLoading ? <LoadingOutlined /> : <TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>

        {/* Available Buyers Summary */}
        <Card size="small" title="Available Buyers Overview" style={{ marginBottom: '16px' }}>
          {buyersLoading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin size="small" />
              <Text style={{ marginLeft: '8px' }}>Loading buyers...</Text>
            </div>
          ) : availableBuyers.length === 0 ? (
            <Alert 
              message="No Buyers Available" 
              description="No buyers are currently available for assignment."
              type="warning" 
              showIcon
            />
          ) : (
            <Row gutter={16}>
              {availableBuyers.map((buyer, index) => (
                <Col key={buyer._id || index} span={8} style={{ marginBottom: '8px' }}>
                  <div style={{ padding: '12px', border: '1px solid #d9d9d9', borderRadius: '6px' }}>
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <div>
                        <Text strong>{buyer.fullName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          Max: XAF {(buyer.buyerDetails?.maxOrderValue || 1000000).toLocaleString()}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          Workload: {buyer.buyerDetails?.workload?.currentAssignments || 0}/{buyer.buyerDetails?.workload?.monthlyTarget || 20}
                        </Text>
                      </div>
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          )}
        </Card>

        {/* Tabs */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.pending} size="small">
                <span><ClockCircleOutlined /> Pending Decisions ({stats.pending})</span>
              </Badge>
            } 
            key="pending"
          >
            {filteredData.length === 0 && !loading ? (
              <Empty
                description="No requisitions pending business decisions"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ) : (
              <Table
                columns={columns}
                dataSource={filteredData}
                rowKey="_id"
                loading={loading}
                pagination={{
                  pageSize: 10,
                  showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
                }}
                scroll={{ x: 'max-content' }}
              />
            )}
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <Badge count={stats.assigned} size="small">
                <span><UserOutlined /> Awaiting Head Approval ({stats.assigned})</span>
              </Badge>
            } 
            key="assigned"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><ShoppingCartOutlined /> Approved/In Progress ({stats.approved})</span>
            } 
            key="approved"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><CheckCircleOutlined /> Completed ({stats.completed})</span>
            } 
            key="completed"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>

          <Tabs.TabPane 
            tab={
              <span><CloseCircleOutlined /> Rejected ({stats.rejected})</span>
            } 
            key="rejected"
          >
            <Table
              columns={columns}
              dataSource={filteredData}
              rowKey="_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} requisitions`
              }}
              scroll={{ x: 'max-content' }}
            />
          </Tabs.TabPane>
          <Tabs.TabPane
  tab={
    <Badge count={stats.cancellations} size="small">
      <span><StopOutlined /> Cancellation Requests ({stats.cancellations})</span>
    </Badge>
  }
  key="cancellations"
>
  {cancellationLoading ? (
    <div style={{ textAlign: 'center', padding: '40px' }}><Spin /></div>
  ) : cancellationRequests.length === 0 ? (
    <Empty
      description="No cancellation requests awaiting your decision"
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    />
  ) : (
    <Table
      columns={columns}
      dataSource={cancellationRequests}
      rowKey="_id"
      loading={cancellationLoading}
      pagination={{ pageSize: 10 }}
      scroll={{ x: 'max-content' }}
    />
  )}
</Tabs.TabPane>
        </Tabs>
      </Card>

      {/* Enhanced Detail Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Purchase Requisition Details & Business Decisions
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => {
          setDetailDrawerVisible(false);
          setSelectedRequisition(null);
          resetAssignmentForm();
        }}
      >
        {selectedRequisition && (
          <div>
            {/* Requisition Information */}
            <Card size="small" title="Requisition Information" style={{ marginBottom: '16px' }}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Requisition ID">
                  <Text code>{selectedRequisition._id?.slice(-8).toUpperCase() || 'N/A'}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusTag(selectedRequisition.status)}
                </Descriptions.Item>
                <Descriptions.Item label="Title">
                  {selectedRequisition.title}
                </Descriptions.Item>
                <Descriptions.Item label="Urgency">
                  {getUrgencyTag(selectedRequisition.urgency)}
                </Descriptions.Item>
                <Descriptions.Item label="Requester">
                  <div>
                    <UserOutlined /> {selectedRequisition.employee?.fullName}
                    <br />
                    <Text type="secondary">{selectedRequisition.employee?.department || selectedRequisition.department}</Text>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="Category">
                  <Tag color="blue">{selectedRequisition.itemCategory}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Budget (XAF)">
                  <DollarOutlined /> {selectedRequisition.budgetXAF ? selectedRequisition.budgetXAF.toLocaleString() : 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Expected Date">
                  <CalendarOutlined /> {new Date(selectedRequisition.expectedDate).toLocaleDateString('en-GB')}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Finance Verification Details */}
            {selectedRequisition.financeVerification && (
              <Card size="small" title="Finance Verification" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Budget Available">
                    <Tag color={selectedRequisition.financeVerification.budgetAvailable ? 'green' : 'red'}>
                      {selectedRequisition.financeVerification.budgetAvailable ? 'Yes' : 'No'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assigned Budget">
                    <Text strong style={{ color: '#1890ff' }}>
                      XAF {selectedRequisition.financeVerification.assignedBudget?.toLocaleString() || 'N/A'}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Budget Code">
                    <Tag color="gold">
                      <TagOutlined /> {selectedRequisition.financeVerification.budgetCode || 'N/A'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Verification Date">
                    {selectedRequisition.financeVerification.verificationDate ? 
                      new Date(selectedRequisition.financeVerification.verificationDate).toLocaleDateString('en-GB') : 
                      'Pending'
                    }
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Items List */}
            <Card size="small" title={`Items to Procure (${selectedRequisition.items?.length || 0})`} style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  { title: 'Description', dataIndex: 'description', key: 'description' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 80, align: 'center' },
                  { title: 'Unit', dataIndex: 'measuringUnit', key: 'unit', width: 80, align: 'center' }
                ]}
                dataSource={selectedRequisition.items}
                pagination={false}
                size="small"
                rowKey={(record, index) => index}
              />
            </Card>

            {/* Attachments */}
            {selectedRequisition.attachments && selectedRequisition.attachments.length > 0 && (
              <AttachmentDisplay
                attachments={selectedRequisition.attachments}
                requisitionId={selectedRequisition._id}
                onDownload={handleDownloadAttachment}
                loading={downloadingAttachmentId !== null}
                title="📎 Submitted Attachments"
              />
            )}

            {selectedRequisition.status === 'pending_cancellation' && selectedRequisition.cancellationRequest && (
              <Card
                size="small"
                title={
                  <Space>
                    <StopOutlined style={{ color: '#ff4d4f' }} />
                    <Text strong style={{ color: '#ff4d4f' }}>Cancellation Request</Text>
                  </Space>
                }
                style={{ marginBottom: '16px', borderColor: '#ff4d4f' }}
                headStyle={{ backgroundColor: '#fff2f0' }}
              >
                <Descriptions column={2} size="small" style={{ marginBottom: '12px' }}>
                  <Descriptions.Item label="Requested On">
                    {new Date(selectedRequisition.cancellationRequest.requestedAt).toLocaleString('en-GB')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Status When Requested">
                    <Tag>{selectedRequisition.cancellationRequest.previousStatus?.replace(/_/g, ' ')}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Reason" span={2}>
                    <Text italic>"{selectedRequisition.cancellationRequest.reason}"</Text>
                  </Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: '8px 0' }} />
                <Text strong style={{ fontSize: '12px', color: '#666' }}>Approval Chain Progress</Text>
                <Timeline style={{ marginTop: '12px', marginBottom: 0 }}>
                  {selectedRequisition.cancellationRequest.approvalChain?.map((step, i) => (
                    <Timeline.Item
                      key={i}
                      color={step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'gray'}
                      dot={
                        step.status === 'approved' ? <CheckCircleOutlined /> :
                        step.status === 'rejected' ? <CloseCircleOutlined /> :
                        <ClockCircleOutlined />
                      }
                    >
                      <Text strong>Level {step.level}: {step.approver.name}</Text>
                      &nbsp;
                      <Text type="secondary" style={{ fontSize: '12px' }}>({step.approver.role})</Text>
                      <br />
                      <Tag
                        color={step.status === 'approved' ? 'green' : step.status === 'rejected' ? 'red' : 'default'}
                      >
                        {step.status.toUpperCase()}
                      </Tag>
                      {step.comments && (
                        <Text type="secondary" italic style={{ marginLeft: 8 }}>
                          "{step.comments}"
                        </Text>
                      )}
                      {step.actionDate && (
                        <Text type="secondary" style={{ fontSize: '11px', display: 'block' }}>
                          {new Date(step.actionDate).toLocaleDateString('en-GB')}
                        </Text>
                      )}
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}


            {/* Business Justification */}
            <Card size="small" title="Business Justification" style={{ marginBottom: '16px' }}>
              <Text>{selectedRequisition.justificationOfPurchase}</Text>
            </Card>

            {/* Clarification History */}
            {clarificationHistory.length > 0 && (
              <Card size="small" title="📝 Clarification History" style={{ marginBottom: '16px' }}>
                <Timeline>
                  {clarificationHistory.map((clarification, index) => (
                    <Timeline.Item
                      key={index}
                      color={clarification.status === 'responded' ? 'green' : 'orange'}
                      dot={clarification.status === 'responded' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      <div>
                        <Text strong>{clarification.requesterName}</Text>
                        <Text type="secondary"> asked </Text>
                        <Text strong>{clarification.recipientName}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(clarification.requestedAt).toLocaleString('en-GB')}
                        </Text>
                        <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                          <Text strong>Question: </Text>
                          <Text>{clarification.message}</Text>
                        </div>
                        {clarification.response && (
                          <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f6ffed', borderRadius: '4px' }}>
                            <Text strong>Response: </Text>
                            <Text>{clarification.response}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              Responded: {new Date(clarification.respondedAt).toLocaleString('en-GB')}
                            </Text>
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </Card>
            )}

            {/* ✅ UPDATED: Business Decisions Form */}
            {selectedRequisition.status === 'pending_supply_chain_review' && (
              <Card size="small" title="🎯 Business Decisions & Buyer Assignment" style={{ marginBottom: '16px' }}>
                <Alert
                  message="Supply Chain Coordinator Business Decisions"
                  description="Complete all business decisions: purchase type, sourcing method, payment method, and buyer assignment. These decisions will be sent to the Head of Business for final approval."
                  type="info"
                  showIcon
                  style={{ marginBottom: '16px' }}
                />

                <Form
                  form={assignmentForm}
                  layout="vertical"
                  onFinish={handleBusinessDecisions}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="purchaseType"
                        label="Purchase Type"
                        rules={[{ required: true, message: 'Please select purchase type' }]}
                      >
                        <Select 
                          placeholder="Select purchase type"
                          value={purchaseType}
                          onChange={setPurchaseType}
                        >
                          <Option value="opex">OPEX - Operational Expenditure</Option>
                          <Option value="capex">CAPEX - Capital Expenditure</Option>
                          <Option value="standard">Standard Purchase</Option>
                          <Option value="emergency">Emergency Purchase</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="sourcingType"
                        label="Sourcing Method"
                        rules={[{ required: true, message: 'Please select sourcing method' }]}
                      >
                        <Select 
                          placeholder="Select sourcing method"
                          value={sourcingType}
                          onChange={setSourcingType}
                        >
                          <Option value="direct_purchase">Direct Purchase</Option>
                          <Option value="quotation_required">Quotation Required</Option>
                          <Option value="tender_process">Tender Process</Option>
                          <Option value="framework_agreement">Framework Agreement</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ✅ NEW: Payment Method Selection */}
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        name="paymentMethod"
                        label="Payment Method"
                        rules={[{ required: true, message: 'Please select payment method' }]}
                      >
                        <Select 
                          placeholder="Select payment method"
                          value={paymentMethod}
                          onChange={setPaymentMethod}
                        >
                          <Option value="bank">
                            <Space>
                              <BankOutlined />
                              Bank Transfer (Standard)
                            </Space>
                          </Option>
                          <Option value="cash">
                            <Space>
                              <DollarOutlined />
                              Project Cash (Small Purchases)
                            </Space>
                          </Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        name="estimatedCost"
                        label="Estimated Cost (XAF)"
                      >
                        <Input 
                          type="number" 
                          placeholder="Enter estimated cost"
                          prefix={<DollarOutlined />}
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>

                  {/* ✅ NEW: Payment Method Info Alert */}
                  {paymentMethod && (
                    <Alert
                      message={paymentMethod === 'cash' ? '💵 Project Cash Payment' : '🏦 Bank Transfer Payment'}
                      description={
                        paymentMethod === 'cash' 
                          ? 'A petty cash form will be auto-generated after Head of Business approval. Suitable for urgent purchases under XAF 1,000,000.'
                          : 'Standard bank transfer payment. Suitable for larger purchases and vendor payments. Standard procurement process will apply.'
                      }
                      type={paymentMethod === 'cash' ? 'warning' : 'info'}
                      showIcon
                      style={{ marginBottom: '16px' }}
                    />
                  )}

                  <Form.Item
                    name="assignedBuyer"
                    label="Assign Buyer"
                    rules={[{ required: true, message: 'Please assign a buyer' }]}
                  >
                    <Select 
                      placeholder="Select buyer"
                      value={assignedBuyer}
                      onChange={setAssignedBuyer}
                      showSearch
                      filterOption={(input, option) =>
                        option.children.props.children[1].props.children[0].props.children
                          .toLowerCase()
                          .indexOf(input.toLowerCase()) >= 0
                      }
                      loading={buyersLoading}
                      notFoundContent={buyersLoading ? <Spin size="small" /> : 'No buyers available'}
                    >
                      {availableBuyers.map(buyer => {
                        const estimatedValue = selectedRequisition.financeVerification?.assignedBudget || selectedRequisition.budgetXAF || 0;
                        const canHandle = estimatedValue <= (buyer.buyerDetails?.maxOrderValue || 1000000);
                        const specializations = buyer.buyerDetails?.specializations || [];
                        const hasSpecialization = specializations.includes('All') || 
                                                specializations.includes(selectedRequisition.itemCategory?.replace(' ', '_')) ||
                                                specializations.includes('General');

                        return (
                          <Option 
                            key={buyer._id} 
                            value={buyer._id}
                            disabled={!canHandle}
                          >
                            <div>
                              <Space>
                                <Avatar size="small" icon={<UserOutlined />} />
                                <div>
                                  <Text strong style={{ color: canHandle ? '#000' : '#999' }}>
                                    {buyer.fullName}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '11px' }}>
                                    Max: XAF {(buyer.buyerDetails?.maxOrderValue || 1000000).toLocaleString()}
                                    {hasSpecialization && ' | Specialized'}
                                  </Text>
                                  <br />
                                  <Text type="secondary" style={{ fontSize: '10px' }}>
                                    Workload: {buyer.buyerDetails?.workload?.currentAssignments || 0}/{buyer.buyerDetails?.workload?.monthlyTarget || 20}
                                  </Text>
                                </div>
                              </Space>
                            </div>
                          </Option>
                        );
                      })}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="comments"
                    label="Business Decision Comments"
                    rules={[{ required: true, message: 'Please provide decision comments' }]}
                  >
                    <TextArea 
                      rows={3} 
                      placeholder="Enter business decision rationale, special instructions, or delivery requirements..."
                      showCount
                      maxLength={500}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                    />
                  </Form.Item>

                  <Space style={{ marginTop: '16px' }}>
                    <Button 
                      type="primary" 
                      loading={assignmentLoading}
                      icon={<SendOutlined />}
                      onClick={handleBusinessDecisions}
                    >
                      Submit Business Decisions
                    </Button>
                    <Button 
                      icon={<QuestionCircleOutlined />}
                      onClick={() => setClarificationModalVisible(true)}
                    >
                      Request Clarification
                    </Button>
                    <Button 
                      danger
                      icon={<CloseCircleOutlined />}
                      onClick={() => setRejectModalVisible(true)}
                    >
                      Reject Requisition
                    </Button>
                    <Button onClick={resetAssignmentForm}>
                      Clear Form
                    </Button>
                  </Space>
                </Form>
              </Card>
            )}

            {selectedRequisition.status === 'pending_cancellation' && (() => {
  const chain = selectedRequisition.cancellationRequest?.approvalChain || [];
  // Find supply chain coordinator's step — match by email not available here,
  // so we rely on the GET /cancellation-requests endpoint having already
  // filtered to only actionable PRs. Just check if ANY step is pending at
  // a level that matches supply chain (we confirm the user can act via
  // the server-side check on submit).
  const hasPendingStep = chain.some(s => s.status === 'pending');
  if (!hasPendingStep) return null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <StopOutlined style={{ color: '#ff4d4f' }} />
          <Text strong>Cancellation Decision — Your Action Required</Text>
        </Space>
      }
      style={{ marginBottom: '16px', borderColor: '#ff4d4f' }}
      headStyle={{ backgroundColor: '#fff2f0' }}
    >
      <Alert
        message="This employee has requested to cancel their purchase requisition"
        description={
          <span>
            <strong>Reason:</strong> "{selectedRequisition.cancellationRequest?.reason}"
          </span>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>Your Comments *</Text>
          <TextArea
            rows={3}
            placeholder="Provide your reason for approving or rejecting the cancellation..."
            value={cancellationComments}
            onChange={e => setCancellationComments(e.target.value)}
            showCount
            maxLength={300}
          />
        </div>
        <Space>
          <Button
            type="primary"
            danger
            icon={<CheckCircleOutlined />}
            loading={cancellationActionLoading}
            onClick={() => handleCancellationDecision('approved')}
          >
            Approve Cancellation
          </Button>
          <Button
            icon={<CloseCircleOutlined />}
            loading={cancellationActionLoading}
            onClick={() => handleCancellationDecision('rejected')}
          >
            Reject — Keep PR Active
          </Button>
        </Space>
      </div>
    </Card>
  );
})()}

            {/* ✅ UPDATED: Assignment Details (for completed assignments) */}
            {selectedRequisition.supplyChainReview?.assignedBuyer && (
              <Card size="small" title="Business Decisions Summary" style={{ marginBottom: '16px' }}>
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="Assigned Buyer">
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      <Text strong>
                        {availableBuyers.find(b => b._id === selectedRequisition.supplyChainReview.assignedBuyer)?.fullName || 'Assigned Buyer'}
                      </Text>
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Assignment Date">
                    {selectedRequisition.supplyChainReview.buyerAssignmentDate ? 
                      new Date(selectedRequisition.supplyChainReview.buyerAssignmentDate).toLocaleDateString('en-GB') : 
                      'N/A'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Sourcing Type">
                    {selectedRequisition.supplyChainReview.sourcingType && 
                      getSourcingTypeTag(selectedRequisition.supplyChainReview.sourcingType)
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Purchase Type">
                    {selectedRequisition.purchaseType && getPurchaseTypeTag(selectedRequisition.purchaseType)}
                  </Descriptions.Item>
                  {/* ✅ NEW: Display Payment Method */}
                  <Descriptions.Item label="Payment Method">
                    {selectedRequisition.paymentMethod && getPaymentMethodTag(selectedRequisition.paymentMethod)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Estimated Cost">
                    {selectedRequisition.supplyChainReview.estimatedCost ? 
                      `XAF ${selectedRequisition.supplyChainReview.estimatedCost.toLocaleString()}` : 
                      'N/A'
                    }
                  </Descriptions.Item>
                  {selectedRequisition.supplyChainReview.comments && (
                    <Descriptions.Item label="Decision Notes" span={2}>
                      <Text italic>{selectedRequisition.supplyChainReview.comments}</Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            )}

            {/* Approval Chain Progress */}
            <Card size="small" title="Approval Progress" style={{ marginBottom: '16px' }}>
              {selectedRequisition.approvalChain && selectedRequisition.approvalChain.length > 0 ? (
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
                    } else if (step.status === 'pending') {
                      color = 'blue';
                      icon = <ClockCircleOutlined />;
                    }

                    return (
                      <Timeline.Item key={index} color={color} dot={icon}>
                        <div>
                          <Text strong>Level {step.level}: {step.approver?.name || 'Unknown'}</Text>
                          <br />
                          <Text type="secondary">{step.approver?.role || 'N/A'}</Text>
                          <br />
                          <Tag color={color} style={{ marginTop: '4px' }}>
                            {step.status.toUpperCase()}
                          </Tag>
                          {step.actionDate && (
                            <>
                              <br />
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                {new Date(step.actionDate).toLocaleDateString('en-GB')} at {step.actionTime || 'N/A'}
                              </Text>
                            </>
                          )}
                          {step.comments && (
                            <>
                              <br />
                              <Text italic style={{ fontSize: '12px', color: '#666' }}>
                                "{step.comments}"
                              </Text>
                            </>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              ) : (
                <Text type="secondary">No approval chain available</Text>
              )}
            </Card>
          </div>
        )}
      </Drawer>

      {/* Rejection Modal */}
      <Modal
        title={
          <Space>
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
            Reject Requisition
          </Space>
        }
        open={rejectModalVisible}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectionReason('');
        }}
        footer={[
          <Button 
            key="cancel" 
            onClick={() => {
              setRejectModalVisible(false);
              setRejectionReason('');
            }}
          >
            Cancel
          </Button>,
          <Button
            key="reject"
            type="primary"
            danger
            loading={rejecting}
            icon={<CloseCircleOutlined />}
            onClick={handleReject}
          >
            Confirm Rejection
          </Button>
        ]}
        width={600}
      >
        {selectedRequisition && (
          <div>
            <Alert
              message="Warning: This action cannot be undone"
              description="Rejecting this requisition will notify the employee and stop the approval process. Please provide a clear reason for rejection."
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Card size="small" title="Requisition Details" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Title">
                  <Text strong>{selectedRequisition.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Employee">
                  {selectedRequisition.employee?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  {selectedRequisition.employee?.department || selectedRequisition.department}
                </Descriptions.Item>
                <Descriptions.Item label="Budget">
                  XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form.Item 
              label="Rejection Reason" 
              required
              help="Please provide a detailed reason (minimum 10 characters)"
            >
              <TextArea
                rows={4}
                placeholder="Explain why this requisition is being rejected. Be specific to help the employee understand and potentially resubmit correctly..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                showCount
                maxLength={500}
              />
            </Form.Item>
          </div>
        )}
      </Modal>

      {/* Clarification Request Modal */}
      <Modal
        title={
          <Space>
            <QuestionCircleOutlined style={{ color: '#1890ff' }} />
            <span>Request Clarification</span>
          </Space>
        }
        open={clarificationModalVisible}
        onCancel={() => {
          setClarificationModalVisible(false);
          setClarificationMessage('');
          setSelectedApprover(null);
        }}
        footer={[
          <Button 
            key="cancel"
            onClick={() => {
              setClarificationModalVisible(false);
              setClarificationMessage('');
              setSelectedApprover(null);
            }}
          >
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            icon={<MessageOutlined />}
            loading={requestingClarification}
            onClick={handleRequestClarification}
            disabled={!selectedApprover || !clarificationMessage || clarificationMessage.trim().length < 20}
          >
            Send Request
          </Button>
        ]}
        width={600}
      >
        {selectedRequisition && (
          <div>
            <Alert
              message="Request clarification from a previous approver"
              description="Ask specific questions to help make informed business decisions. The requisition will be temporarily paused until you receive a response."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            <Card size="small" title="Requisition Details" style={{ marginBottom: '16px' }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="Title">
                  <Text strong>{selectedRequisition.title}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Employee">
                  {selectedRequisition.employee?.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Budget">
                  XAF {selectedRequisition.budgetXAF?.toLocaleString() || 'N/A'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Form.Item 
              label="Select Approver to Ask" 
              required
              help="Choose which previous approver can best answer your question"
            >
              <Select
                placeholder="Select an approver who has already approved"
                value={selectedApprover}
                onChange={setSelectedApprover}
                style={{ width: '100%' }}
              >
                {selectedRequisition.approvalChain
                  ?.filter(step => step.status === 'approved')
                  .map((step, index) => (
                    <Select.Option key={index} value={step.approver.email}>
                      {step.approver.name} ({step.approver.role})
                    </Select.Option>
                  ))}
              </Select>
            </Form.Item>

            <Form.Item 
              label="Your Question" 
              required
              help="Please be specific (minimum 20 characters)"
            >
              <TextArea
                rows={4}
                placeholder="What specific information or clarification do you need? Be clear and detailed..."
                value={clarificationMessage}
                onChange={(e) => setClarificationMessage(e.target.value)}
                showCount
                maxLength={500}
                minLength={20}
              />
            </Form.Item>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EnhancedSupplyChainRequisitionManagement;

