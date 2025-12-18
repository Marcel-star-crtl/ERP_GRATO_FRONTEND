import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Typography,
  Tag,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Progress,
  Tabs,
  Alert,
  Divider,
  Badge,
  message,
  Tooltip,
  Descriptions,
  Drawer,
  List,
  Avatar,
  Steps,
  Timeline,
  notification,
  Spin,
  InputNumber,
  Popconfirm,
  AutoComplete,
  Checkbox
} from 'antd';
import {
  FileTextOutlined,
  ShoppingCartOutlined,
  TruckOutlined,
  DollarOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  DownloadOutlined,
  UploadOutlined,
  PrinterOutlined,
  MailOutlined,
  PhoneOutlined,
  WarningOutlined,
  SyncOutlined,
  StopOutlined,
  ReloadOutlined,
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  SearchOutlined,
  TagOutlined,
  FilePdfOutlined,
  FileZipOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Step } = Steps;

const BuyerPurchaseOrders = () => {
  // ==================== STATE MANAGEMENT ====================
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [createPOModalVisible, setCreatePOModalVisible] = useState(false);
  const [emailPDFModalVisible, setEmailPDFModalVisible] = useState(false);
  const [bulkDownloadModalVisible, setBulkDownloadModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  // Database state
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [itemCategories, setItemCategories] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [supplierSearchTerm, setSupplierSearchTerm] = useState('');
  const [isExternalSupplier, setIsExternalSupplier] = useState(false);
  const [externalSupplierDetails, setExternalSupplierDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const [itemSearchOptions, setItemSearchOptions] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  
  // Form instances
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();
  const [createPOForm] = Form.useForm();
  const [emailPDFForm] = Form.useForm();

  // ==================== EFFECTS ====================
  useEffect(() => {
    loadPurchaseOrders();
    loadSuppliers();
    loadItems();
    loadItemCategories();
    loadBudgetCodes();
  }, []);

  // ==================== DATA LOADING FUNCTIONS ====================
  const loadPurchaseOrders = async () => {
    try {
      setLoading(true);
      console.log('=== LOADING PURCHASE ORDERS ===');
      
      const response = await buyerRequisitionAPI.getPurchaseOrders();
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} purchase orders`);
        setPurchaseOrders(response.data);
      } else {
        console.error('Failed to load purchase orders:', response);
        message.error('Failed to load purchase orders');
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error);
      message.error('Error loading purchase orders. Please try again.');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      console.log('=== LOADING SUPPLIERS FROM DATABASE ===');
      const response = await buyerRequisitionAPI.getSuppliers({
        page: 1,
        limit: 100
      });
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} suppliers from database`);
        setSuppliers(response.data);
      } else {
        console.error('Failed to load suppliers:', response);
        message.error('Failed to load suppliers from database');
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
      message.warning('Could not load suppliers from database');
    }
  };

  const loadItems = async () => {
    try {
      console.log('=== LOADING ITEMS FROM DATABASE ===');
      const response = await buyerRequisitionAPI.getItems({
        limit: 200
      });
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} items from database`);
        setItems(response.data);
      } else {
        console.error('Failed to load items:', response);
        message.error('Failed to load items from database');
      }
    } catch (error) {
      console.error('Error loading items:', error);
      message.warning('Could not load items from database');
    }
  };

  const loadItemCategories = async () => {
    try {
      const response = await buyerRequisitionAPI.getItemCategories();
      
      if (response.success && response.data) {
        console.log('Loaded item categories:', response.data);
        setItemCategories(response.data);
      }
    } catch (error) {
      console.error('Error loading item categories:', error);
    }
  };

  const loadBudgetCodes = async () => {
    try {
      console.log('=== LOADING BUDGET CODES ===');
      const response = await buyerRequisitionAPI.getBudgetCodes();
      
      if (response.success && response.data) {
        console.log(`Loaded ${response.data.length} budget codes`);
        setBudgetCodes(response.data);
      } else {
        console.error('Failed to load budget codes:', response);
        message.warning('Failed to load budget codes');
      }
    } catch (error) {
      console.error('Error loading budget codes:', error);
      message.warning('Could not load budget codes');
    }
  };

  // ==================== SEARCH FUNCTIONS ====================
  const searchItems = async (searchText) => {
    if (!searchText || searchText.length < 2) {
      setItemSearchOptions([]);
      return;
    }

    try {
      const response = await buyerRequisitionAPI.searchItems(searchText, 10);
      
      if (response.success && response.data) {
        const options = response.data.map(item => ({
          value: item._id,
          label: `${item.code} - ${item.description}`,
          item: item
        }));
        setItemSearchOptions(options);
      }
    } catch (error) {
      console.error('Error searching items:', error);
    }
  };

  const handleItemSelect = (value, option, index) => {
    const selectedItem = option.item;
    const formItems = createPOForm.getFieldValue('items') || [];
    
    formItems[index] = {
      ...formItems[index],
      itemId: selectedItem._id,
      description: selectedItem.description,
      unitPrice: selectedItem.standardPrice || formItems[index]?.unitPrice || 0,
      unitOfMeasure: selectedItem.unitOfMeasure,
      category: selectedItem.category
    };
    
    createPOForm.setFieldsValue({ items: formItems });
    message.success(`Selected item: ${selectedItem.description}`);
  };

  // ==================== EXTERNAL SUPPLIER FUNCTIONS ====================
  const handleSupplierTypeChange = (value) => {
    setIsExternalSupplier(value === 'external');
    if (value === 'external') {
      // Clear the registered supplier selection
      createPOForm.setFieldsValue({ supplierId: undefined });
    } else {
      // Clear external supplier details
      setExternalSupplierDetails({
        name: '',
        email: '',
        phone: '',
        address: ''
      });
      createPOForm.setFieldsValue({ 
        externalSupplierName: undefined,
        externalSupplierEmail: undefined,
        externalSupplierPhone: undefined,
        externalSupplierAddress: undefined
      });
    }
  };

  const handleExternalSupplierChange = (field, value) => {
    setExternalSupplierDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const handleDownloadPDF = async (po) => {
    try {
      setPdfLoading(true);
      console.log('Downloading PDF for PO:', po.poNumber);

      // FIXED: Corrected the typo from REACT_APP_API_UR to REACT_APP_API_URL
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
      const response = await fetch(`${apiUrl}/buyer/purchase-orders/${po.id}/download-pdf`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to download PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PO_${po.poNumber}_${moment().format('YYYY-MM-DD')}.pdf`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`PDF downloaded successfully for PO ${po.poNumber}`);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      message.error(error.message || 'Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePreviewPDF = async (po) => {
    try {
      setPdfLoading(true);
      console.log('Opening PDF preview for PO:', po.poNumber);

      const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/${po.id}/preview-pdf`;
      
      const token = localStorage.getItem('token');
      const newWindow = window.open();
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load PDF preview');
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);
      
      newWindow.location.href = pdfUrl;
      
      message.success(`PDF preview opened for PO ${po.poNumber}`);
    } catch (error) {
      console.error('Error opening PDF preview:', error);
      message.error('Failed to open PDF preview');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleEmailPDF = (po) => {
    setSelectedPO(po);
    emailPDFForm.resetFields();
    emailPDFForm.setFieldsValue({
      emailTo: po.supplierEmail,
      emailType: 'supplier'
    });
    setEmailPDFModalVisible(true);
  };

  const handleSendEmailPDF = async () => {
    try {
      const values = await emailPDFForm.validateFields();
      setPdfLoading(true);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/${selectedPO.id}/email-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send PDF email');
      }

      message.success(`PDF emailed successfully to ${values.emailTo}`);
      setEmailPDFModalVisible(false);
      
      notification.success({
        message: 'Email Sent Successfully',
        description: `Purchase order PDF sent to ${values.emailTo}`,
        duration: 5
      });

    } catch (error) {
      console.error('Error sending PDF email:', error);
      message.error(error.message || 'Failed to send PDF email');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleBulkDownload = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select purchase orders to download');
      return;
    }
    setBulkDownloadModalVisible(true);
  };

  const handleBulkDownloadConfirm = async () => {
    try {
      setPdfLoading(true);

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/buyer/purchase-orders/bulk-download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ poIds: selectedRowKeys }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create bulk download');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Purchase_Orders_${moment().format('YYYY-MM-DD')}.zip`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(`${selectedRowKeys.length} purchase orders downloaded successfully`);
      setBulkDownloadModalVisible(false);
      setSelectedRowKeys([]);

    } catch (error) {
      console.error('Error in bulk download:', error);
      message.error(error.message || 'Failed to download purchase orders');
    } finally {
      setPdfLoading(false);
    }
  };

  // ==================== UTILITY FUNCTIONS ====================
  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft', icon: <EditOutlined /> },
      'pending_approval': { color: 'orange', text: 'Pending Approval', icon: <ClockCircleOutlined /> },
      'approved': { color: 'blue', text: 'Approved', icon: <CheckCircleOutlined /> },
      'sent_to_supplier': { color: 'purple', text: 'Sent to Supplier', icon: <MailOutlined /> },
      'acknowledged': { color: 'cyan', text: 'Acknowledged', icon: <CheckCircleOutlined /> },
      'in_production': { color: 'geekblue', text: 'In Production', icon: <SyncOutlined /> },
      'delivered': { color: 'green', text: 'Delivered', icon: <CheckCircleOutlined /> },
      'completed': { color: 'success', text: 'Completed', icon: <CheckCircleOutlined /> },
      'cancelled': { color: 'red', text: 'Cancelled', icon: <StopOutlined /> },
      'on_hold': { color: 'magenta', text: 'On Hold', icon: <ExclamationCircleOutlined /> }
    };
    const statusInfo = statusMap[status] || { color: 'default', text: status, icon: <FileTextOutlined /> };
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getStageSteps = () => [
    'PO Created',
    'Supplier Acknowledgment',
    'Production/Preparation',
    'Shipment',
    'Delivery & Completion'
  ];

  const getStageIndex = (stage) => {
    const stageMap = {
      'created': 0,
      'supplier_acknowledgment': 1,
      'in_production': 2,
      'in_transit': 3,
      'completed': 4
    };
    return stageMap[stage] || 0;
  };

  const getFilteredPOs = () => {
    switch (activeTab) {
      case 'active':
        return purchaseOrders.filter(po => !['delivered', 'completed', 'cancelled'].includes(po.status));
      case 'in_transit':
        return purchaseOrders.filter(po => po.status === 'in_transit');
      case 'delivered':
        return purchaseOrders.filter(po => ['delivered', 'completed'].includes(po.status));
      case 'overdue':
        return purchaseOrders.filter(po => 
          moment(po.expectedDeliveryDate).isBefore(moment()) && 
          !['delivered', 'completed', 'cancelled'].includes(po.status)
        );
      default:
        return purchaseOrders;
    }
  };

  // ==================== CRUD OPERATIONS ====================
  const handleViewDetails = async (po) => {
    try {
      setLoading(true);
      
      const response = await buyerRequisitionAPI.getPurchaseOrderDetails(po.id);
      
      if (response.success && response.data) {
        setSelectedPO(response.data.purchaseOrder);
        setDetailDrawerVisible(true);
      } else {
        message.error('Failed to load purchase order details');
      }
    } catch (error) {
      console.error('Error loading PO details:', error);
      message.error('Error loading purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNewPO = () => {
    createPOForm.resetFields();
    setItemSearchOptions([]);
    setCreatePOModalVisible(true);
  };

  const handleCreatePO = async () => {
    try {
      const values = await createPOForm.validateFields();
      setLoading(true);

      let supplierDetails;

      if (isExternalSupplier) {
        // Validate external supplier details
        if (!values.externalSupplierName || !values.externalSupplierEmail) {
          message.error('Please provide external supplier name and email');
          setLoading(false);
          return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(values.externalSupplierEmail)) {
          message.error('Please enter a valid email address');
          setLoading(false);
          return;
        }

        supplierDetails = {
          id: null, // External supplier has no database ID
          name: values.externalSupplierName,
          email: values.externalSupplierEmail,
          phone: values.externalSupplierPhone || '',
          address: values.externalSupplierAddress || '',
          businessType: 'External Supplier',
          isExternal: true
        };
      } else {
        // Handle registered supplier
        if (!values.supplierId) {
          message.error('Please select a supplier');
          setLoading(false);
          return;
        }

        const selectedSupplier = suppliers.find(s => s._id === values.supplierId);
        if (!selectedSupplier) {
          message.error('Selected supplier not found');
          setLoading(false);
          return;
        }

        supplierDetails = {
          id: selectedSupplier._id,
          name: selectedSupplier.name,
          email: selectedSupplier.email,
          phone: selectedSupplier.phone,
          address: typeof selectedSupplier.address === 'object' ? 
            `${selectedSupplier.address.street || ''}, ${selectedSupplier.address.city || ''}, ${selectedSupplier.address.state || ''}`.trim() :
            selectedSupplier.address || '',
          businessType: selectedSupplier.businessType,
          isExternal: false
        };
      }

      const totalAmount = values.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );

      const poData = {
        supplierDetails: supplierDetails,
        items: values.items.map(item => ({
          ...item,
          totalPrice: item.quantity * item.unitPrice,
          ...(item.itemId && { itemId: item.itemId })
        })),
        totalAmount,
        budgetCodeId: values.budgetCodeId, // Add budget code
        currency: values.currency || 'XAF',
        taxApplicable: values.taxApplicable || false,
        taxRate: values.taxRate || 19.2,
        deliveryAddress: values.deliveryAddress,
        expectedDeliveryDate: values.expectedDeliveryDate.toISOString(),
        paymentTerms: values.paymentTerms,
        specialInstructions: values.specialInstructions,
        notes: values.notes
      };

      // Validate budget code if selected
      if (values.budgetCodeId) {
        const selectedBudgetCode = budgetCodes.find(bc => bc._id === values.budgetCodeId);
        if (selectedBudgetCode) {
          const availableBalance = selectedBudgetCode.amount - selectedBudgetCode.usedAmount;
          if (totalAmount > availableBalance) {
            message.error(`Insufficient budget. Available: ${buyerRequisitionAPI.formatCurrency(availableBalance)}, Required: ${buyerRequisitionAPI.formatCurrency(totalAmount)}`);
            setLoading(false);
            return;
          }
        }
      }

      console.log('Creating PO with enhanced data:', poData);

      const response = await buyerRequisitionAPI.createPurchaseOrder(poData);
      
      if (response.success) {
        // Update budget code balance if budget code was selected
        if (values.budgetCodeId) {
          try {
            await buyerRequisitionAPI.updateBudgetCodeBalance(values.budgetCodeId, totalAmount);
            message.success('Purchase order created and budget updated successfully!');
          } catch (budgetError) {
            console.warn('PO created but budget update failed:', budgetError);
            message.warning('Purchase order created successfully, but budget update failed. Please check with finance.');
          }
        } else {
          message.success('Purchase order created successfully!');
        }

        setCreatePOModalVisible(false);
        createPOForm.resetFields();
        setIsExternalSupplier(false);
        setExternalSupplierDetails({
          name: '',
          email: '',
          phone: '',
          address: ''
        });
        
        // Enhanced notification with email status
        const supplierType = supplierDetails.isExternal ? 'external supplier' : 'supplier';
        let notificationDescription = `PO ${response.data.purchaseOrder.poNumber} has been created with ${supplierType} ${supplierDetails.name}.`;
        
        if (supplierDetails.isExternal && response.data.emailSent) {
          notificationDescription += ` Email notification sent to ${supplierDetails.email}.`;
        } else if (supplierDetails.isExternal && !response.data.emailSent) {
          notificationDescription += ` Note: Email notification could not be sent.`;
        }
        
        notification.success({
          message: 'Purchase Order Created',
          description: notificationDescription,
          duration: supplierDetails.isExternal ? 8 : 5, // Longer duration for external supplier notifications
          style: supplierDetails.isExternal ? { 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f' 
          } : undefined
        });
        
        // Additional notification for external supplier email
        if (supplierDetails.isExternal && response.data.emailSent) {
          setTimeout(() => {
            notification.info({
              message: 'Email Sent to External Supplier',
              description: `The purchase order details have been automatically emailed to ${supplierDetails.name} (${supplierDetails.email}). They will receive all order details, delivery information, and payment terms.`,
              duration: 10,
              placement: 'bottomRight',
              icon: <MailOutlined style={{ color: '#1890ff' }} />
            });
          }, 1500);
        }
        
        // Reload data
        await loadPurchaseOrders();
        await loadBudgetCodes(); // Refresh budget codes to show updated balances
      } else {
        message.error(response.message || 'Failed to create purchase order');
      }
    } catch (error) {
      console.error('Error creating PO:', error);
      message.error('Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  // const handleEditPO = (po) => {
  //   setSelectedPO(po);
  //   form.setFieldsValue({
  //     expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
  //     deliveryAddress: po.deliveryAddress,
  //     paymentTerms: po.paymentTerms,
  //     specialInstructions: po.specialInstructions || '',
  //     notes: po.notes || ''
  //   });
  //   setEditModalVisible(true);
  // };

  // Add this enhanced edit modal to replace the existing basic edit modal in BuyerPurchaseOrders.jsx

  const handleEditPO = (po) => {
    setSelectedPO(po);
    
    console.log('=== EDITING PURCHASE ORDER ===');
    console.log('PO:', po.poNumber);
    console.log('Current items:', po.items);
    
    // Clean items by removing MongoDB-specific _id and id fields
    const cleanedItems = po.items.map(item => {
      const cleanItem = {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        unitOfMeasure: item.unitOfMeasure || 'Units',
        category: item.category || '',
        specifications: item.specifications || ''
      };
      
      // Only include itemId if it exists (for database-linked items)
      if (item.itemId) {
        cleanItem.itemId = item.itemId;
      }
      
      return cleanItem;
    });
    
    console.log('Cleaned items for form:', cleanedItems);
    
    // Populate all fields including items
    form.setFieldsValue({
      expectedDeliveryDate: po.expectedDeliveryDate ? moment(po.expectedDeliveryDate) : null,
      deliveryAddress: po.deliveryAddress,
      paymentTerms: po.paymentTerms,
      specialInstructions: po.specialInstructions || '',
      notes: po.notes || '',
      currency: po.currency || 'XAF',
      taxApplicable: po.taxApplicable || false,
      taxRate: po.taxRate || 19.25,
      items: cleanedItems
    });
    
    setEditModalVisible(true);
  };

  const handleUpdatePO = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      console.log('=== UPDATING PURCHASE ORDER ===');
      console.log('Form values:', values);
      
      // Calculate new total from items
      const calculatedTotal = values.items.reduce((sum, item) => 
        sum + (item.quantity * item.unitPrice), 0
      );
      
      console.log('Calculated total:', calculatedTotal);
      
      // Clean items: remove MongoDB _id and id fields, keep only itemId
      const cleanedItems = values.items.map(item => {
        const cleanItem = {
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
          specifications: item.specifications || '',
          unitOfMeasure: item.unitOfMeasure || 'Units',
          category: item.category || ''
        };
        
        // Only include itemId if it exists (for database-linked items)
        if (item.itemId) {
          cleanItem.itemId = item.itemId;
        }
        
        return cleanItem;
      });
      
      console.log('Cleaned items:', cleanedItems);
      
      const updateData = {
        expectedDeliveryDate: values.expectedDeliveryDate ? values.expectedDeliveryDate.toISOString() : null,
        deliveryAddress: values.deliveryAddress,
        paymentTerms: values.paymentTerms,
        specialInstructions: values.specialInstructions || '',
        notes: values.notes || '',
        currency: values.currency,
        taxApplicable: values.taxApplicable || false,
        taxRate: values.taxRate || 19.25,
        items: cleanedItems,
        totalAmount: calculatedTotal
      };
      
      console.log('Update data being sent:', updateData);
      
      const response = await buyerRequisitionAPI.updatePurchaseOrder(selectedPO.id, updateData);
      
      console.log('Update response:', response);
      
      if (response.success) {
        message.success('Purchase order updated successfully!');
        
        // Show detailed notification
        notification.success({
          message: 'Purchase Order Updated',
          description: `PO ${selectedPO.poNumber} has been updated. New total: ${updateData.currency} ${calculatedTotal.toLocaleString()}`,
          duration: 5
        });
        
        setEditModalVisible(false);
        form.resetFields();
        
        // Reload purchase orders to show updated data
        await loadPurchaseOrders();
      } else {
        console.error('Update failed:', response);
        message.error(response.message || 'Failed to update purchase order');
      }
    } catch (error) {
      console.error('Error updating PO:', error);
      message.error(error.message || 'Failed to update purchase order');
    } finally {
      setLoading(false);
    }
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
      
      const response = await buyerRequisitionAPI.sendPurchaseOrderToSupplier(selectedPO.id, {
        message: values.message
      });
      
      if (response.success) {
        message.success('Purchase order sent to supplier successfully!');
        setSendModalVisible(false);
        sendForm.resetFields();
        
        notification.success({
          message: 'PO Sent Successfully',
          description: `Purchase order ${selectedPO.poNumber} has been sent to ${selectedPO.supplierName} via email.`,
          duration: 5
        });
        
        await loadPurchaseOrders();
      } else {
        message.error(response.message || 'Failed to send purchase order');
      }
    } catch (error) {
      console.error('Error sending PO:', error);
      message.error('Failed to send purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPO = (po) => {
    let cancellationReason = '';
    
    Modal.confirm({
      title: 'Cancel Purchase Order',
      content: (
        <div>
          <p>Are you sure you want to cancel PO {po.poNumber || po.id}? This action cannot be undone.</p>
          <TextArea 
            placeholder="Please provide a reason for cancellation..."
            onChange={(e) => cancellationReason = e.target.value}
            rows={3}
            style={{ marginTop: '16px' }}
          />
        </div>
      ),
      danger: true,
      onOk: async () => {
        if (!cancellationReason.trim()) {
          message.error('Please provide a reason for cancellation');
          return;
        }

        try {
          setLoading(true);
          
          const response = await buyerRequisitionAPI.cancelPurchaseOrder(po.id, {
            cancellationReason: cancellationReason.trim()
          });
          
          if (response.success) {
            message.success(`Purchase order ${po.poNumber || po.id} has been cancelled`);
            
            notification.info({
              message: 'Purchase Order Cancelled',
              description: `PO ${po.poNumber || po.id} has been cancelled and supplier has been notified.`,
              duration: 5
            });
            
            await loadPurchaseOrders();
          } else {
            message.error(response.message || 'Failed to cancel purchase order');
          }
        } catch (error) {
          console.error('Error cancelling PO:', error);
          message.error('Failed to cancel purchase order');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  // ==================== TABLE CONFIGURATION ====================
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
    getCheckboxProps: (record) => ({
      disabled: record.status === 'cancelled',
      name: record.poNumber,
    }),
  };

  const columns = [
    {
      title: 'PO Details',
      key: 'details',
      render: (_, record) => (
        <div>
          <Text strong>{record.poNumber || record.id}</Text>
          <br />
          {record.requisitionId && (
            <>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Req: {record.requisitionId}
              </Text>
              <br />
            </>
          )}
          <Text type="secondary" style={{ fontSize: '11px' }}>
            Created: {moment(record.creationDate).format('MMM DD, HH:mm')}
          </Text>
        </div>
      ),
      width: 140
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => (
        <div>
          <Text strong>{record.supplierName}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            <MailOutlined /> {record.supplierEmail}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Total Amount',
      key: 'amount',
      render: (_, record) => (
        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
          {record.currency} {record.totalAmount.toLocaleString()}
        </Text>
      ),
      width: 120,
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => (
        <div>
          <Progress 
            percent={record.progress || 0} 
            size="small" 
            status={record.status === 'cancelled' ? 'exception' : 'active'}
          />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {getStageSteps()[getStageIndex(record.currentStage)] || 'Created'}
          </Text>
        </div>
      ),
      width: 150
    },
    {
      title: 'Expected Delivery',
      key: 'delivery',
      render: (_, record) => {
        if (!record.expectedDeliveryDate) return <Text type="secondary">Not set</Text>;
        
        const isOverdue = moment(record.expectedDeliveryDate).isBefore(moment()) && 
                          !['delivered', 'completed', 'cancelled'].includes(record.status);
        const daysUntil = moment(record.expectedDeliveryDate).diff(moment(), 'days');
        
        return (
          <div>
            <Text type={isOverdue ? 'danger' : 'default'}>
              {moment(record.expectedDeliveryDate).format('MMM DD')}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: '11px' }}>
              {isOverdue ? `${Math.abs(daysUntil)} days overdue` : 
               daysUntil === 0 ? 'Due today' : 
               daysUntil > 0 ? `${daysUntil} days left` : 'Delivered'}
            </Text>
            {isOverdue && (
              <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: '4px' }} />
            )}
          </div>
        );
      },
      width: 120
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
      width: 140
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Tooltip title="View Details">
              <Button 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => handleViewDetails(record)}
              />
            </Tooltip>
            {record.status === 'draft' && (
              <Tooltip title="Send to Supplier">
                <Button 
                  size="small" 
                  type="primary"
                  icon={<SendOutlined />}
                  onClick={() => handleSendPO(record)}
                />
              </Tooltip>
            )}
            {!['delivered', 'completed', 'cancelled'].includes(record.status) && (
              <Tooltip title="Edit PO">
                <Button 
                  size="small" 
                  icon={<EditOutlined />}
                  onClick={() => handleEditPO(record)}
                />
              </Tooltip>
            )}
          </Space>
          
          <Space size="small">
            <Tooltip title="Download PDF">
              <Button 
                size="small" 
                icon={<DownloadOutlined />}
                loading={pdfLoading}
                onClick={() => handleDownloadPDF(record)}
              />
            </Tooltip>
            <Tooltip title="Preview PDF">
              <Button 
                size="small" 
                icon={<FilePdfOutlined />}
                loading={pdfLoading}
                onClick={() => handlePreviewPDF(record)}
              />
            </Tooltip>
            <Tooltip title="Email PDF">
              <Button 
                size="small" 
                icon={<ShareAltOutlined />}
                onClick={() => handleEmailPDF(record)}
              />
            </Tooltip>
            
            {!['delivered', 'completed', 'cancelled'].includes(record.status) && (
              <Tooltip title="Cancel PO">
                <Button 
                  size="small" 
                  danger
                  icon={<StopOutlined />}
                  onClick={() => handleCancelPO(record)}
                />
              </Tooltip>
            )}
          </Space>
        </Space>
      ),
      width: 180,
      fixed: 'right'
    }
  ];

  // ==================== STATISTICS ====================
  const stats = {
    total: purchaseOrders.length,
    active: purchaseOrders.filter(po => !['delivered', 'completed', 'cancelled'].includes(po.status)).length,
    inTransit: purchaseOrders.filter(po => po.status === 'in_transit').length,
    delivered: purchaseOrders.filter(po => ['delivered', 'completed'].includes(po.status)).length,
    overdue: purchaseOrders.filter(po => 
      moment(po.expectedDeliveryDate).isBefore(moment()) && 
      !['delivered', 'completed', 'cancelled'].includes(po.status)
    ).length,
    totalValue: purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0)
  };

  // ==================== LOADING STATE ====================
  if (initialLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text>Loading purchase orders...</Text>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <div style={{ padding: '24px' }}>
      <Card>
        {/* ========== HEADER ========== */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <FileTextOutlined /> Purchase Order Management
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={loadPurchaseOrders}
              loading={loading}
            >
              Refresh
            </Button>
            {selectedRowKeys.length > 0 && (
              <Button 
                icon={<FileZipOutlined />}
                onClick={handleBulkDownload}
                loading={pdfLoading}
              >
                Bulk Download ({selectedRowKeys.length})
              </Button>
            )}
            <Button icon={<PrinterOutlined />}>
              Bulk Print
            </Button>
            <Button icon={<DownloadOutlined />}>
              Export Report
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleCreateNewPO}
            >
              Create New PO
            </Button>
          </Space>
        </div>

        {/* ========== STATISTICS ========== */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={4}>
            <Statistic
              title="Total POs"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Active"
              value={stats.active}
              prefix={<SyncOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Overdue"
              value={stats.overdue}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
          <Col span={4}>
            <Statistic
              title="Total Value"
              value={stats.totalValue > 0 ? `${(stats.totalValue / 1000000).toFixed(1)}M` : '0'}
              prefix={<DollarOutlined />}
              suffix="XAF"
              valueStyle={{ color: '#13c2c2' }}
            />
          </Col>
        </Row>

        {/* ========== ALERTS ========== */}
        {stats.overdue > 0 && (
          <Alert
            message={`${stats.overdue} Purchase Order${stats.overdue !== 1 ? 's' : ''} Overdue`}
            description="Some purchase orders have passed their expected delivery dates. Follow up with suppliers for updates."
            type="error"
            showIcon
            action={
              <Button 
                size="small" 
                danger 
                onClick={() => setActiveTab('overdue')}
              >
                View Overdue
              </Button>
            }
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Database Integration Status */}
        {suppliers.length === 0 && (
          <Alert
            message="Supplier Database Not Available"
            description="Could not load suppliers from database. You can still create POs with manual supplier entry."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {items.length === 0 && (
          <Alert
            message="Items Database Not Available"
            description="Could not load items from database. You can still create POs with manual item entry."
            type="warning"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Success indicators */}
        {suppliers.length > 0 && items.length > 0 && (
          <Alert
            message="Database Integration Active"
            description={`Connected to supplier database (${suppliers.length} suppliers) and items database (${items.length} items).`}
            type="success"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* Empty State */}
        {purchaseOrders.length === 0 && !loading && (
          <Alert
            message="No Purchase Orders Found"
            description={
              <div>
                <p>You haven't created any purchase orders yet.</p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={handleCreateNewPO}
                  style={{ marginTop: '8px' }}
                >
                  Create Your First PO
                </Button>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        {/* ========== TABS ========== */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <Tabs.TabPane 
            tab={
              <Badge count={stats.total} size="small">
                <span>All POs ({stats.total})</span>
              </Badge>
            } 
            key="all"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.active} size="small">
                <span><SyncOutlined /> Active ({stats.active})</span>
              </Badge>
            } 
            key="active"
          />
          <Tabs.TabPane 
            tab={
              <Badge count={stats.overdue} size="small">
                <span><ExclamationCircleOutlined /> Overdue ({stats.overdue})</span>
              </Badge>
            } 
            key="overdue"
          />
        </Tabs>

        {/* ========== TABLE ========== */}
        <Table
          columns={columns}
          dataSource={getFilteredPOs()}
          rowKey="id"
          rowSelection={rowSelection}
          loading={loading}
          pagination={{
            pageSize: 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} purchase orders`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* ==================== MODALS ==================== */}

      {/* ========== CREATE NEW PO MODAL ========== */}
      <Modal
        title={
          <Space>
            <PlusOutlined />
            Create New Purchase Order
            {suppliers.length > 0 && (
              <Tag color="green" icon={<TagOutlined />}>
                {suppliers.length} Suppliers Available
              </Tag>
            )}
            {items.length > 0 && (
              <Tag color="blue" icon={<TagOutlined />}>
                {items.length} Items Available
              </Tag>
            )}
          </Space>
        }
        open={createPOModalVisible}
        onOk={handleCreatePO}
        onCancel={() => setCreatePOModalVisible(false)}
        confirmLoading={loading}
        width={1200}
        maskClosable={false}
      >
        <Form form={createPOForm} layout="vertical">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="supplierType"
                label="Supplier Type"
                initialValue="registered"
                rules={[{ required: true, message: 'Please select supplier type' }]}
              >
                <Select onChange={handleSupplierTypeChange}>
                  <Option value="registered">Registered Supplier</Option>
                  <Option value="external">External Supplier</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currency"
                label="Currency"
                initialValue="XAF"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select>
                  <Option value="XAF">XAF (Central African Franc)</Option>
                  <Option value="USD">USD (US Dollar)</Option>
                  <Option value="EUR">EUR (Euro)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {!isExternalSupplier ? (
            <Form.Item
              name="supplierId"
              label={
                <Space>
                  Select Registered Supplier
                  {suppliers.length > 0 && (
                    <Tag color="green" size="small">
                      {suppliers.length} in database
                    </Tag>
                  )}
                </Space>
              }
              rules={[{ required: !isExternalSupplier, message: 'Please select a supplier' }]}
            >
              <Select
                placeholder="Search and select supplier from database"
                showSearch
                loading={suppliers.length === 0}
                notFoundContent={suppliers.length === 0 ? <Spin size="small" /> : 'No suppliers found'}
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
                optionLabelProp="label"
              >
                {suppliers.map(supplier => (
                  <Option 
                    key={supplier._id} 
                    value={supplier._id}
                    label={supplier.name}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>
                        {supplier.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {supplier.email} • {supplier.businessType}
                      </div>
                      <div style={{ fontSize: '11px', color: '#999' }}>
                        Rating: {supplier.performance?.overallRating || 'N/A'} • 
                        Orders: {supplier.performance?.totalOrders || 0}
                      </div>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          ) : (
            <div>
              <Alert
                message="External Supplier Details"
                description="Enter the details of the external supplier who is not registered in our system."
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="externalSupplierName"
                    label="Supplier Name"
                    rules={[{ required: isExternalSupplier, message: 'Please enter supplier name' }]}
                  >
                    <Input 
                      placeholder="Enter supplier company name"
                      onChange={(e) => handleExternalSupplierChange('name', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="externalSupplierEmail"
                    label="Email Address"
                    rules={[
                      { required: isExternalSupplier, message: 'Please enter email address' },
                      { type: 'email', message: 'Please enter a valid email address' }
                    ]}
                  >
                    <Input 
                      placeholder="supplier@company.com"
                      onChange={(e) => handleExternalSupplierChange('email', e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
              
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    name="externalSupplierPhone"
                    label="Phone Number"
                  >
                    <Input 
                      placeholder="Enter phone number"
                      onChange={(e) => handleExternalSupplierChange('phone', e.target.value)}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="externalSupplierAddress"
                    label="Address"
                  >
                    <Input 
                      placeholder="Enter supplier address"
                      onChange={(e) => handleExternalSupplierChange('address', e.target.value)}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>
          )}

          <Divider>
            <Space>
              Items
              {items.length > 0 && (
                <Tag color="blue" size="small">
                  {items.length} items in database
                </Tag>
              )}
            </Space>
          </Divider>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('At least one item is required'));
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    size="small" 
                    style={{ marginBottom: '16px' }}
                    title={
                      <Space>
                        {`Item ${name + 1}`}
                        {items.length > 0 && (
                          <Tag color="blue" size="small">
                            Database lookup available
                          </Tag>
                        )}
                      </Space>
                    }
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      ) : null
                    }
                  >
                    {/* Item Database Lookup */}
                    {items.length > 0 && (
                      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                        <Col span={24}>
                          <Form.Item
                            label={
                              <Space>
                                <SearchOutlined />
                                Search Items Database
                                <Text type="secondary">(Optional - or enter manually below)</Text>
                              </Space>
                            }
                          >
                            <AutoComplete
                              options={itemSearchOptions}
                              onSearch={searchItems}
                              onSelect={(value, option) => handleItemSelect(value, option, name)}
                              placeholder="Type to search for items in database..."
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    )}

                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Item Description"
                          rules={[{ required: true, message: 'Item description is required' }]}
                        >
                          <Input placeholder="Enter item description" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Quantity is required' }]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Qty"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          label="Unit Price"
                          rules={[{ required: true, message: 'Unit price is required' }]}
                        >
                          <InputNumber
                            min={0}
                            placeholder="Price per unit"
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitOfMeasure']}
                          label="Unit of Measure"
                        >
                          <Select placeholder="Select unit">
                            <Option value="Pieces">Pieces</Option>
                            <Option value="Sets">Sets</Option>
                            <Option value="Boxes">Boxes</Option>
                            <Option value="Packs">Packs</Option>
                            <Option value="Units">Units</Option>
                            <Option value="Each">Each</Option>
                            <Option value="Kg">Kg</Option>
                            <Option value="Litres">Litres</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          label="Category (Optional)"
                        >
                          <Select placeholder="Select category" allowClear>
                            {itemCategories.map(category => (
                              <Option key={category} value={category}>
                                {category}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'specifications']}
                          label="Specifications (Optional)"
                        >
                          <TextArea
                            rows={2}
                            placeholder="Enter item specifications or additional details..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hidden field to store itemId if selected from database */}
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Item
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>Delivery & Payment Terms</Divider>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item
                name="expectedDeliveryDate"
                label="Expected Delivery Date"
                rules={[{ required: true, message: 'Please select expected delivery date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < moment().add(1, 'day')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentTerms"
                label="Payment Terms"
                rules={[{ required: true, message: 'Please select payment terms' }]}
              >
                <Select placeholder="Select payment terms">
                  <Option value="15 days">15 days</Option>
                  <Option value="30 days">30 days</Option>
                  <Option value="45 days">45 days</Option>
                  <Option value="60 days">60 days</Option>
                  <Option value="Cash on delivery">Cash on delivery</Option>
                  <Option value="Advance payment">Advance payment</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              {/* <Form.Item
                name="budgetCodeId"
                label={
                  <Space>
                    Budget Code (Optional)
                    {budgetCodes.length > 0 && (
                      <Tag color="blue" size="small">
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
                  loading={budgetCodes.length === 0}
                  notFoundContent={budgetCodes.length === 0 ? <Spin size="small" /> : 'No budget codes found'}
                  optionFilterProp="children"
                >
                  {budgetCodes.map(budgetCode => {
                    const availableBalance = budgetCode.amount - budgetCode.usedAmount;
                    const utilizationPercent = (budgetCode.usedAmount / budgetCode.amount) * 100;
                    
                    return (
                      <Option key={budgetCode._id} value={budgetCode._id}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {budgetCode.code} - {budgetCode.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Available: {buyerRequisitionAPI.formatCurrency(availableBalance)} / {buyerRequisitionAPI.formatCurrency(budgetCode.amount)}
                          </div>
                          <div style={{ fontSize: '11px', color: utilizationPercent > 80 ? '#ff4d4f' : '#52c41a' }}>
                            Utilization: {utilizationPercent.toFixed(1)}%
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item> */}
              <Form.Item
                name="budgetCodeId"
                label={
                  <Space>
                    Budget Code (Optional)
                    {budgetCodes.length > 0 && (
                      <Tag color="blue" size="small">
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
                  loading={budgetCodes.length === 0}
                  notFoundContent={budgetCodes.length === 0 ? <Spin size="small" /> : 'No budget codes found'}
                  optionFilterProp="children"
                >
                  {budgetCodes.map(budgetCode => {
                    // Use correct field names from schema: budget, used, remaining
                    const availableBalance = budgetCode.remaining || (budgetCode.budget - budgetCode.used);
                    const utilizationPercent = budgetCode.budget > 0 ? (budgetCode.used / budgetCode.budget) * 100 : 0;
                    
                    return (
                      <Option key={budgetCode._id} value={budgetCode._id}>
                        <div>
                          <div style={{ fontWeight: 'bold' }}>
                            {budgetCode.code} - {budgetCode.name}
                          </div>
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Available: {buyerRequisitionAPI.formatCurrency(availableBalance)} / {buyerRequisitionAPI.formatCurrency(budgetCode.budget)}
                          </div>
                          <div style={{ fontSize: '11px', color: utilizationPercent > 80 ? '#ff4d4f' : '#52c41a' }}>
                            Utilization: {utilizationPercent.toFixed(1)}%
                          </div>
                        </div>
                      </Option>
                    );
                  })}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="deliveryAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please enter delivery address' }]}
          >
            <TextArea rows={3} placeholder="Enter complete delivery address..." />
          </Form.Item>

          <Form.Item
            name="specialInstructions"
            label="Special Instructions"
          >
            <TextArea
              rows={3}
              placeholder="Add any special instructions for the supplier..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Divider>Tax Configuration</Divider>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="taxApplicable"
                label=""
                valuePropName="checked"
                initialValue={false}
              >
                <Checkbox>
                  Apply tax to this purchase order
                </Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taxRate"
                label="Tax Rate (%)"
                initialValue={19.25}
                dependencies={['taxApplicable']}
              >
                {({ getFieldValue }) => (
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    style={{ width: '100%' }}
                    disabled={!getFieldValue('taxApplicable')}
                    addonAfter="%"
                    placeholder="19.25"
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Internal Notes"
          >
            <TextArea
              rows={2}
              placeholder="Add any internal notes (not visible to supplier)..."
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* ========== SEND PO TO SUPPLIER MODAL ========== */}
      <Modal
        title={`Send Purchase Order - ${selectedPO?.poNumber || selectedPO?.id}`}
        open={sendModalVisible}
        onOk={handleSendPOToSupplier}
        onCancel={() => setSendModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Alert
          message="Send Purchase Order to Supplier"
          description={`The purchase order will be sent to ${selectedPO?.supplierName} at ${selectedPO?.supplierEmail}`}
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Form form={sendForm} layout="vertical">
          <Form.Item
            name="message"
            label="Additional Message (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Add any additional message to include with the purchase order..."
              showCount
              maxLength={1000}
            />
          </Form.Item>
        </Form>

        <Alert
          message="What happens next?"
          description="The supplier will receive the purchase order via email with all item details, delivery instructions, and payment terms. They can then acknowledge the order and provide delivery updates."
          type="info"
          style={{ marginTop: '16px' }}
        />
      </Modal>

      {/* ========== EMAIL PDF MODAL ========== */}
      <Modal
        title={
          <Space>
            <ShareAltOutlined />
            Email PDF - {selectedPO?.poNumber || selectedPO?.id}
          </Space>
        }
        open={emailPDFModalVisible}
        onOk={handleSendEmailPDF}
        onCancel={() => setEmailPDFModalVisible(false)}
        confirmLoading={pdfLoading}
        width={600}
      >
        <Form form={emailPDFForm} layout="vertical">
          <Form.Item
            name="emailType"
            label="Email Type"
            initialValue="supplier"
            rules={[{ required: true, message: 'Please select email type' }]}
          >
            <Select>
              <Option value="supplier">Send to Supplier</Option>
              <Option value="internal">Send to Internal Team</Option>
              <Option value="custom">Send to Custom Email</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="emailTo"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter email address' },
              { type: 'email', message: 'Please enter a valid email address' }
            ]}
          >
            <Input 
              placeholder="Enter recipient email address"
              prefix={<MailOutlined />}
            />
          </Form.Item>

          <Form.Item
            name="subject"
            label="Email Subject (Optional)"
            initialValue={`Purchase Order ${selectedPO?.poNumber || selectedPO?.id}`}
          >
            <Input placeholder="Email subject line" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Add a message to include with the PDF attachment..."
              showCount
              maxLength={1000}
            />
          </Form.Item>

          <Form.Item name="includeAttachments" valuePropName="checked">
            <Checkbox>Include supporting documents (if any)</Checkbox>
          </Form.Item>
        </Form>

        <Alert
          message="PDF Email Details"
          description="The purchase order will be generated as a PDF and sent as an email attachment along with your message."
          type="info"
          showIcon
        />
      </Modal>

      {/* ========== BULK DOWNLOAD MODAL ========== */}
      <Modal
        title={
          <Space>
            <FileZipOutlined />
            Bulk Download Purchase Orders
          </Space>
        }
        open={bulkDownloadModalVisible}
        onOk={handleBulkDownloadConfirm}
        onCancel={() => setBulkDownloadModalVisible(false)}
        confirmLoading={pdfLoading}
        width={500}
      >
        <div style={{ marginBottom: '16px' }}>
          <Text strong>Selected Purchase Orders: {selectedRowKeys.length}</Text>
        </div>
        
        <List
          size="small"
          dataSource={purchaseOrders.filter(po => selectedRowKeys.includes(po.id))}
          renderItem={(po) => (
            <List.Item>
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={po.poNumber || po.id}
                description={`${po.supplierName} - ${po.currency} ${po.totalAmount.toLocaleString()}`}
              />
              {getStatusTag(po.status)}
            </List.Item>
          )}
          style={{ maxHeight: '300px', overflowY: 'auto' }}
        />

        <Divider />

        <Form layout="vertical">
          <Form.Item label="Download Format">
            <Select defaultValue="pdf" disabled>
              <Option value="pdf">PDF Files in ZIP Archive</Option>
            </Select>
          </Form.Item>

          <Form.Item label="File Naming">
            <Select defaultValue="po_number">
              <Option value="po_number">PO Number</Option>
              <Option value="supplier_po">Supplier - PO Number</Option>
              <Option value="date_po">Date - PO Number</Option>
            </Select>
          </Form.Item>
        </Form>

        <Alert
          message="Bulk Download"
          description={`${selectedRowKeys.length} purchase orders will be generated as PDFs and packaged into a ZIP file for download.`}
          type="info"
          showIcon
        />
      </Modal>

      {/* ========== EDIT PO MODAL ========== */}
      {/* <Modal
        title={`Edit Purchase Order - ${selectedPO?.poNumber || selectedPO?.id}`}
        open={editModalVisible}
        onOk={handleUpdatePO}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="expectedDeliveryDate"
            label="Expected Delivery Date"
            rules={[{ required: true, message: 'Please select expected delivery date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < moment().add(1, 'day')}
            />
          </Form.Item>
          
          <Form.Item
            name="paymentTerms"
            label="Payment Terms"
            rules={[{ required: true, message: 'Please select payment terms' }]}
          >
            <Select placeholder="Select payment terms">
              <Option value="15 days">15 days</Option>
              <Option value="30 days">30 days</Option>
              <Option value="45 days">45 days</Option>
              <Option value="60 days">60 days</Option>
              <Option value="Cash on delivery">Cash on delivery</Option>
              <Option value="Advance payment">Advance payment</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="deliveryAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please enter delivery address' }]}
          >
            <TextArea rows={2} placeholder="Enter delivery address..." />
          </Form.Item>

          <Form.Item
            name="specialInstructions"
            label="Special Instructions"
          >
            <TextArea
              rows={3}
              placeholder="Add any special instructions for the supplier..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Internal Notes"
          >
            <TextArea
              rows={2}
              placeholder="Add any internal notes (not visible to supplier)..."
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Form>
      </Modal> */}

      {/* // Enhanced Edit Modal JSX (replace existing edit modal) */}
      <Modal
        title={`Edit Purchase Order - ${selectedPO?.poNumber || selectedPO?.id}`}
        open={editModalVisible}
        onOk={handleUpdatePO}
        onCancel={() => setEditModalVisible(false)}
        confirmLoading={loading}
        width={1200}
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Alert
            message="Edit Purchase Order"
            description={`Status: ${selectedPO?.status}. You can edit all order details except supplier information.`}
            type="info"
            showIcon
            style={{ marginBottom: '24px' }}
          />

          <Divider>Order Details</Divider>

          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item
                name="expectedDeliveryDate"
                label="Expected Delivery Date"
                rules={[{ required: true, message: 'Please select expected delivery date' }]}
              >
                <DatePicker 
                  style={{ width: '100%' }}
                  disabledDate={(current) => current && current < moment().add(1, 'day')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="paymentTerms"
                label="Payment Terms"
                rules={[{ required: true, message: 'Please select payment terms' }]}
              >
                <Select placeholder="Select payment terms">
                  <Option value="15 days">15 days</Option>
                  <Option value="30 days">30 days</Option>
                  <Option value="45 days">45 days</Option>
                  <Option value="60 days">60 days</Option>
                  <Option value="Cash on delivery">Cash on delivery</Option>
                  <Option value="Advance payment">Advance payment</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true, message: 'Please select currency' }]}
              >
                <Select>
                  <Option value="XAF">XAF (Central African Franc)</Option>
                  <Option value="USD">USD (US Dollar)</Option>
                  <Option value="EUR">EUR (Euro)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="deliveryAddress"
            label="Delivery Address"
            rules={[{ required: true, message: 'Please enter delivery address' }]}
          >
            <TextArea rows={3} placeholder="Enter complete delivery address..." />
          </Form.Item>

          <Divider>Items</Divider>

          <Form.List
            name="items"
            rules={[
              {
                validator: async (_, items) => {
                  if (!items || items.length < 1) {
                    return Promise.reject(new Error('At least one item is required'));
                  }
                }
              }
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Card 
                    key={key} 
                    size="small" 
                    style={{ marginBottom: '16px' }}
                    title={`Item ${name + 1}`}
                    extra={
                      fields.length > 1 ? (
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        >
                          Remove
                        </Button>
                      ) : null
                    }
                  >
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="Item Description"
                          rules={[{ required: true, message: 'Item description is required' }]}
                        >
                          <Input placeholder="Enter item description" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          label="Quantity"
                          rules={[{ required: true, message: 'Quantity is required' }]}
                        >
                          <InputNumber
                            min={1}
                            placeholder="Qty"
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          label="Unit Price"
                          rules={[{ required: true, message: 'Unit price is required' }]}
                        >
                          <InputNumber
                            min={0}
                            placeholder="Price per unit"
                            style={{ width: '100%' }}
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            parser={value => value.replace(/\$\s?|(,*)/g, '')}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={[16, 16]}>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitOfMeasure']}
                          label="Unit of Measure"
                        >
                          <Select placeholder="Select unit">
                            <Option value="Pieces">Pieces</Option>
                            <Option value="Sets">Sets</Option>
                            <Option value="Boxes">Boxes</Option>
                            <Option value="Packs">Packs</Option>
                            <Option value="Units">Units</Option>
                            <Option value="Each">Each</Option>
                            <Option value="Kg">Kg</Option>
                            <Option value="Litres">Litres</Option>
                          </Select>
                        </Form.Item>
                      </Col>
                      <Col span={12}>
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          label="Category (Optional)"
                        >
                          <Select placeholder="Select category" allowClear>
                            {itemCategories.map(category => (
                              <Option key={category} value={category}>
                                {category}
                              </Option>
                            ))}
                          </Select>
                        </Form.Item>
                      </Col>
                    </Row>
                    
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item
                          {...restField}
                          name={[name, 'specifications']}
                          label="Specifications (Optional)"
                        >
                          <TextArea
                            rows={2}
                            placeholder="Enter item specifications or additional details..."
                          />
                        </Form.Item>
                      </Col>
                    </Row>

                    {/* Hidden field for itemId */}
                    <Form.Item
                      {...restField}
                      name={[name, 'itemId']}
                      hidden
                    >
                      <Input />
                    </Form.Item>
                  </Card>
                ))}
                <Form.Item>
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    block
                    icon={<PlusOutlined />}
                  >
                    Add Item
                  </Button>
                  <Form.ErrorList errors={errors} />
                </Form.Item>
              </>
            )}
          </Form.List>

          <Divider>Tax Configuration</Divider>

          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Form.Item
                name="taxApplicable"
                label=""
                valuePropName="checked"
              >
                <Checkbox>
                  Apply tax to this purchase order
                </Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="taxRate"
                label="Tax Rate (%)"
                dependencies={['taxApplicable']}
              >
                {({ getFieldValue }) => (
                  <InputNumber
                    min={0}
                    max={100}
                    precision={2}
                    style={{ width: '100%' }}
                    disabled={!getFieldValue('taxApplicable')}
                    addonAfter="%"
                    placeholder="19.25"
                  />
                )}
              </Form.Item>
            </Col>
          </Row>

          <Divider>Additional Information</Divider>

          <Form.Item
            name="specialInstructions"
            label="Special Instructions"
          >
            <TextArea
              rows={3}
              placeholder="Add any special instructions for the supplier..."
              showCount
              maxLength={500}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Internal Notes"
          >
            <TextArea
              rows={2}
              placeholder="Add any internal notes (not visible to supplier)..."
              showCount
              maxLength={300}
            />
          </Form.Item>
        </Form>

        <Alert
          message="Important Note"
          description="Changes to items will recalculate the total amount. Make sure all quantities and prices are correct before saving."
          type="warning"
          showIcon
          style={{ marginTop: '16px' }}
        />
      </Modal>

      {/* ==================== DRAWERS ==================== */}

      {/* ========== PURCHASE ORDER DETAILS DRAWER ========== */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Purchase Order Details - {selectedPO?.poNumber || selectedPO?.id}
          </Space>
        }
        placement="right"
        width={900}
        open={detailDrawerVisible}
        onClose={() => setDetailDrawerVisible(false)}
      >
        {selectedPO && (
          <div>
            {/* PO Header */}
            <Card size="small" title="Purchase Order Information" style={{ marginBottom: '16px' }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="PO Number">
                      <Text code strong>{selectedPO.poNumber || selectedPO.id}</Text>
                    </Descriptions.Item>
                    {selectedPO.requisitionId && (
                      <Descriptions.Item label="Requisition">
                        {selectedPO.requisitionId}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Creation Date">
                      {moment(selectedPO.creationDate).format('MMM DD, YYYY HH:mm')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Expected Delivery">
                      {selectedPO.expectedDeliveryDate ? (
                        <Text type={moment(selectedPO.expectedDeliveryDate).isBefore(moment()) && 
                                    !['delivered', 'completed'].includes(selectedPO.status) ? 'danger' : 'default'}>
                          {moment(selectedPO.expectedDeliveryDate).format('MMM DD, YYYY')}
                        </Text>
                      ) : (
                        <Text type="secondary">Not set</Text>
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">
                      {selectedPO.paymentTerms}
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      {getStatusTag(selectedPO.status)}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Supplier">
                      {selectedPO.supplierName}
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <MailOutlined /> {selectedPO.supplierEmail}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <PhoneOutlined /> {selectedPO.supplierPhone}
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Amount">
                      <Text strong style={{ color: '#1890ff', fontSize: '18px' }}>
                        {selectedPO.currency} {selectedPO.totalAmount.toLocaleString()}
                      </Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Delivery Address">
                      <TruckOutlined /> {selectedPO.deliveryAddress}
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Progress Tracking */}
            <Card size="small" title="Order Progress" style={{ marginBottom: '16px' }}>
              <Steps current={getStageIndex(selectedPO.currentStage)}>
                {getStageSteps().map((step, index) => (
                  <Step key={index} title={step} />
                ))}
              </Steps>
              <div style={{ marginTop: '16px' }}>
                <Progress 
                  percent={selectedPO.progress || 0} 
                  status={selectedPO.status === 'cancelled' ? 'exception' : 'active'}
                />
              </div>
            </Card>

            {/* Items Table */}
            <Card size="small" title="Ordered Items" style={{ marginBottom: '16px' }}>
              <Table
                columns={[
                  {
                    title: 'Description',
                    dataIndex: 'description',
                    key: 'description',
                    render: (text, record) => (
                      <div>
                        <Text strong>{text}</Text>
                        {record.itemCode && (
                          <>
                            <br />
                            <Tag size="small" color="blue">
                              {record.itemCode}
                            </Tag>
                          </>
                        )}
                        {record.category && (
                          <Tag size="small" color="green">
                            {record.category}
                          </Tag>
                        )}
                      </div>
                    )
                  },
                  {
                    title: 'Qty',
                    dataIndex: 'quantity',
                    key: 'quantity',
                    width: 60,
                    align: 'center',
                    render: (qty, record) => (
                      <div>
                        {qty}
                        {record.unitOfMeasure && (
                          <>
                            <br />
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              {record.unitOfMeasure}
                            </Text>
                          </>
                        )}
                      </div>
                    )
                  },
                  {
                    title: 'Unit Price',
                    dataIndex: 'unitPrice',
                    key: 'unitPrice',
                    render: (price) => `${selectedPO.currency} ${price.toLocaleString()}`,
                    width: 120
                  },
                  {
                    title: 'Total',
                    dataIndex: 'totalPrice',
                    key: 'totalPrice',
                    render: (price) => (
                      <Text strong>{selectedPO.currency} {price.toLocaleString()}</Text>
                    ),
                    width: 120
                  }
                ]}
                dataSource={selectedPO.items || []}
                pagination={false}
                size="small"
                rowKey="description"
                summary={(pageData) => {
                  const total = pageData.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={3}>
                        <Text strong>Total Amount:</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text strong style={{ color: '#1890ff', fontSize: '16px' }}>
                          {selectedPO.currency} {total.toLocaleString()}
                        </Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </Card>

            {/* Special Instructions */}
            {selectedPO.specialInstructions && (
              <Card size="small" title="Special Instructions" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <Text>{selectedPO.specialInstructions}</Text>
                </div>
              </Card>
            )}

            {/* Notes */}
            {selectedPO.notes && (
              <Card size="small" title="Internal Notes" style={{ marginBottom: '16px' }}>
                <div style={{ padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                  <Text>{selectedPO.notes}</Text>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <Space style={{ marginTop: '16px' }}>
              {selectedPO.status === 'draft' && (
                <Button 
                  type="primary" 
                  icon={<SendOutlined />}
                  onClick={() => {
                    setDetailDrawerVisible(false);
                    handleSendPO(selectedPO);
                  }}
                >
                  Send to Supplier
                </Button>
              )}
              {!['delivered', 'completed', 'cancelled'].includes(selectedPO.status) && (
                <>
                  <Button 
                    type="default" 
                    icon={<EditOutlined />}
                    onClick={() => {
                      setDetailDrawerVisible(false);
                      handleEditPO(selectedPO);
                    }}
                  >
                    Edit PO
                  </Button>
                  <Button 
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleCancelPO(selectedPO)}
                  >
                    Cancel PO
                  </Button>
                </>
              )}
              <Button 
                icon={<DownloadOutlined />}
                loading={pdfLoading}
                onClick={() => handleDownloadPDF(selectedPO)}
              >
                Download PDF
              </Button>
              <Button 
                icon={<FilePdfOutlined />}
                loading={pdfLoading}
                onClick={() => handlePreviewPDF(selectedPO)}
              >
                Preview PDF
              </Button>
              <Button 
                icon={<ShareAltOutlined />}
                onClick={() => handleEmailPDF(selectedPO)}
              >
                Email PDF
              </Button>
              <Button icon={<PrinterOutlined />}>
                Print
              </Button>
            </Space>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BuyerPurchaseOrders;






