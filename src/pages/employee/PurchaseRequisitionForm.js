import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Row,
  Col,
  Select,
  DatePicker,
  InputNumber,
  Table,
  Modal,
  message,
  Alert,
  Tag,
  Upload,
  Divider,
  Spin,
  Descriptions,
  Progress,
  Radio,
  AutoComplete
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  SaveOutlined,
  SendOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  UploadOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  DatabaseOutlined,
  SearchOutlined,
  ReloadOutlined,
  ProjectOutlined,
  FileOutlined,
  EyeOutlined,
  DownloadOutlined,
  InboxOutlined,
  ShopOutlined,
  TagOutlined,
  WarningOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
import { projectAPI } from '../../services/projectAPI';
import { itemAPI } from '../../services/itemAPI';
import supplierApiService from '../../services/supplierAPI';
import moment from 'moment';
import '../../styles/dropdownZIndex.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;

// Constants
const URGENCY_OPTIONS = [
  { value: 'Low', color: 'green' },
  { value: 'Medium', color: 'orange' },
  { value: 'High', color: 'red' }
];

const ITEM_CATEGORIES = [
  'IT Accessories',
  'Office Supplies',
  'Equipment',
  'Consumables',
  'Software',
  'Hardware',
  'Furniture',
  'Safety Equipment',
  'Maintenance Supplies',
  'Other'
];

const UNITS_OF_MEASURE = [
  'Pieces', 'Sets', 'Boxes', 'Packs', 'Units', 'Kg', 
  'Litres', 'Meters', 'Pairs', 'Each'
];

const ALLOWED_FILE_TYPES = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
  '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 5;

const EnhancedPurchaseRequisitionForm = ({ onSubmit, onCancel, onSaveDraft, editData }) => {
  const { user } = useSelector((state) => state.auth);
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [requestForm] = Form.useForm();

  // State management
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [supplierError, setSupplierError] = useState(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [databaseItems, setDatabaseItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [budgetCodes, setBudgetCodes] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectBudgetInfo, setProjectBudgetInfo] = useState(null);
  const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
  const [budgetCodeDetails, setBudgetCodeDetails] = useState(null);
  const [manualBudget, setManualBudget] = useState(null);
  
  const [supplierSelectionMode, setSupplierSelectionMode] = useState('database');
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const generateRequisitionNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REQ${year}${month}${day}${random}`;
  }, []);

  const calculateTotalCost = useMemo(() => {
    if (manualBudget !== null && manualBudget > 0) {
      return manualBudget;
    }
    return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
  }, [items, manualBudget]);

  const validateFile = useCallback((file) => {
    const fileName = file.name || file.originalname || '';
    const fileSize = file.size || 0;
    const fileExt = fileName.includes('.') ? 
      '.' + fileName.split('.').pop().toLowerCase() : '';

    if (fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${fileName}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      };
    }

    if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
      return {
        valid: false,
        error: `File type "${fileExt}" not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
      };
    }

    return { valid: true };
  }, []);

  // Fetch budget codes
  const fetchBudgetCodes = useCallback(async () => {
    try {
      setLoadingBudgetCodes(true);
      console.log('🔍 Fetching budget codes...');
      
      const response = await purchaseRequisitionAPI.getActiveBudgetCodes();
      console.log('📦 Budget codes response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        setBudgetCodes(response.data);
        console.log(`✅ Loaded ${response.data.length} active budget codes`);
        
        if (response.data.length > 0) {
          message.success(`Loaded ${response.data.length} active budget codes`);
        } else {
          message.info('No active budget codes available');
        }
      } else {
        console.error('❌ Invalid response structure:', response);
        setBudgetCodes([]);
        message.warning('No budget codes available');
      }
    } catch (error) {
      console.error('❌ Error fetching budget codes:', error);
      message.error('Failed to load budget codes');
      setBudgetCodes([]);
    } finally {
      setLoadingBudgetCodes(false);
    }
  }, []);

  // Check budget code availability
  const checkBudgetCodeAvailability = useCallback(async (budgetCodeId, requiredAmount) => {
    try {
      const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
      if (!budgetCode) return { available: false, message: 'Budget code not found' };

      const available = budgetCode.budget - budgetCode.used;
      
      if (available < requiredAmount) {
        return {
          available: false,
          message: `Insufficient budget. Available: XAF ${available.toLocaleString()}, Required: XAF ${requiredAmount.toLocaleString()}`
        };
      }

      return {
        available: true,
        budgetCode: budgetCode,
        availableAmount: available
      };
    } catch (error) {
      console.error('Error checking budget availability:', error);
      return { available: false, message: 'Failed to check budget availability' };
    }
  }, [budgetCodes]);

  // Handle budget code selection
  const handleBudgetCodeChange = useCallback((budgetCodeId) => {
    console.log('Budget code selected:', budgetCodeId);
    setSelectedBudgetCode(budgetCodeId);
    
    if (!budgetCodeId) {
      setBudgetCodeDetails(null);
      return;
    }

    const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
    if (budgetCode) {
      console.log('Budget code details:', budgetCode);
      
      const available = budgetCode.budget - budgetCode.used;
      const utilizationRate = Math.round((budgetCode.used / budgetCode.budget) * 100);
      const status = utilizationRate >= 90 ? 'critical' : 
                    utilizationRate >= 75 ? 'high' : 
                    utilizationRate >= 50 ? 'moderate' : 'low';
      
      setBudgetCodeDetails({
        code: budgetCode.code,
        name: budgetCode.name,
        department: budgetCode.department,
        totalBudget: budgetCode.budget,
        used: budgetCode.used,
        available: available,
        utilizationRate: utilizationRate,
        status: status
      });

      if (budgetCode.budgetHolder) {
        form.setFieldsValue({ budgetHolder: budgetCode.budgetHolder });
      }

      if (calculateTotalCost > 0 && calculateTotalCost > available) {
        message.warning({
          content: `Total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds available budget (XAF ${available.toLocaleString()})`,
          duration: 5
        });
      } else if (calculateTotalCost > 0) {
        message.success({
          content: `Budget sufficient. Remaining after: XAF ${(available - calculateTotalCost).toLocaleString()}`,
          duration: 3
        });
      }
    }
  }, [budgetCodes, calculateTotalCost, form]);

  // Fetch database items
  const fetchDatabaseItems = useCallback(async (categoryFilter = null) => {
    try {
      setLoadingItems(true);
      setFetchError(null);
      
      console.log('Fetching database items...', categoryFilter ? `for category: ${categoryFilter}` : 'all items');
      
      const response = await itemAPI.getActiveItems(categoryFilter);
      
      if (response.success && Array.isArray(response.data)) {
        setDatabaseItems(response.data);
        console.log(`Successfully loaded ${response.data.length} items`);
        
        if (response.data.length > 0) {
          message.success(`Loaded ${response.data.length} items from database`);
        } else {
          message.info('No items found for the selected criteria');
        }
      } else {
        console.error('API returned invalid data:', response);
        setDatabaseItems([]);
        setFetchError(response.message || 'Failed to load item database');
      }
    } catch (error) {
      console.error('Error fetching database items:', error);
      setDatabaseItems([]);
      setFetchError(error.message || 'Failed to connect to item database');
    } finally {
      setLoadingItems(false);
    }
  }, []);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoadingProjects(true);
      const response = await projectAPI.getActiveProjects();
      
      if (response.success) {
        setProjects(response.data);
        console.log(`Loaded ${response.data.length} active projects`);
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
  }, []);

  // Fetch project budget info
  const fetchProjectBudgetInfo = useCallback(async (projectId) => {
    try {
      const response = await projectAPI.getProjectById(projectId);
      
      if (response.success) {
        const project = response.data;
        const budgetRemaining = project.budget.allocated - project.budget.spent;
        
        setProjectBudgetInfo({
          projectName: project.name,
          projectCode: project.code,
          budgetAllocated: project.budget.allocated,
          budgetSpent: project.budget.spent,
          budgetRemaining: budgetRemaining,
          budgetUtilization: project.budgetUtilization,
          budgetCode: project.budgetCode ? {
            code: project.budgetCode.code,
            name: project.budgetCode.name,
            available: project.budgetCode.budget - project.budgetCode.used
          } : null,
          status: project.status,
          priority: project.priority
        });
      }
    } catch (error) {
      console.error('Error fetching project budget info:', error);
      setProjectBudgetInfo(null);
    }
  }, []);

  // Fetch suppliers
  const fetchSuppliers = useCallback(async () => {
    setLoadingSuppliers(true);
    setSupplierError(null);
    
    try {
      console.log('🔍 Starting supplier fetch...');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login to continue');
      }
      
      const response = await supplierApiService.getAllSuppliers({ 
        status: 'approved',
        limit: 100 
      });
      
      console.log('📦 Fetch response:', response);
      
      if (response.success && Array.isArray(response.data)) {
        setSuppliers(response.data);
        console.log(`✅ Successfully loaded ${response.data.length} suppliers`);
        
        if (response.data.length > 0) {
          message.success(`Loaded ${response.data.length} active suppliers`);
        } else {
          message.info('No active suppliers found');
        }
      } else {
        const errorMsg = response.message || 'Failed to load suppliers';
        console.error('❌ Fetch failed:', errorMsg);
        setSupplierError(errorMsg);
        message.error(errorMsg);
        setSuppliers([]);
      }
      
    } catch (error) {
      console.error('💥 Error fetching suppliers:', error);
      const errorMessage = error.message || 'Failed to load suppliers';
      setSupplierError(errorMessage);
      message.error(errorMessage);
      setSuppliers([]);
    } finally {
      setLoadingSuppliers(false);
    }
  }, []);

  // Form initialization
  const initializeForm = useCallback((isEditMode) => {
    if (isEditMode && editData) {
      const formData = {
        ...editData,
        expectedDate: editData.expectedDate ? moment(editData.expectedDate) : moment().add(14, 'days'),
        date: editData.createdAt ? moment(editData.createdAt) : moment(),
        project: editData.project,
        budgetCode: editData.budgetCode
      };
      
      if (editData.preferredSupplier) {
        if (editData.supplierId) {
          setSupplierSelectionMode('database');
          setSelectedSupplier(editData.supplierId);
          formData.supplierId = editData.supplierId;
        } else {
          setSupplierSelectionMode('manual');
          formData.preferredSupplierName = editData.preferredSupplier;
        }
      }
      
      form.setFieldsValue(formData);
      setItems(editData.items || []);
      setSelectedProject(editData.project);
      
      if (editData.budgetCode) {
        const budgetCodeId = editData.budgetCode;
        const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
        if (budgetCode) {
          const available = budgetCode.budget - budgetCode.used;
          const utilizationRate = Math.round((budgetCode.used / budgetCode.budget) * 100);
          const status = utilizationRate >= 90 ? 'critical' : 
                        utilizationRate >= 75 ? 'high' : 
                        utilizationRate >= 50 ? 'moderate' : 'low';
          
          setBudgetCodeDetails({
            code: budgetCode.code,
            name: budgetCode.name,
            department: budgetCode.department,
            totalBudget: budgetCode.budget,
            used: budgetCode.used,
            available: available,
            utilizationRate: utilizationRate,
            status: status
          });
        }
      }
      
      if (editData.attachments && editData.attachments.length > 0) {
        const existingAttachments = editData.attachments.map((att, index) => ({
          uid: att._id || `existing-${index}`,
          name: att.name || att.fileName || 'Unknown File',
          status: 'done',
          url: att.url || att.downloadUrl,
          size: att.size || 0,
          type: att.mimetype || 'application/octet-stream',
          existing: true,
          publicId: att.publicId
        }));
        setAttachments(existingAttachments);
      }
    } else {
      form.setFieldsValue({
        requisitionNumber: generateRequisitionNumber(),
        requesterName: user?.fullName || '',
        department: user?.department || '',
        date: moment(),
        deliveryLocation: 'Office',
        expectedDate: moment().add(14, 'days'),
        urgency: 'Medium'
      });
    }
  }, [editData, form, generateRequisitionNumber, user, budgetCodes]);

  // Component initialization
  useEffect(() => {
    console.log('Component mounted, fetching data...');
    
    const initData = async () => {
      try {
        await Promise.all([
          fetchProjects(),
          fetchDatabaseItems(),
          fetchSuppliers(),
          fetchBudgetCodes()
        ]);
        
        initializeForm(!!editData);
      } catch (error) {
        console.error('Error initializing component:', error);
      }
    };
    
    initData();
    
    return () => {
      console.log('Component unmounting...');
    };
  }, []);

  // Project selection effect
  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetInfo(selectedProject);
    } else {
      setProjectBudgetInfo(null);
    }
  }, [selectedProject, fetchProjectBudgetInfo]);

  // Item management functions
  const handleAddItem = useCallback(() => {
    if (loadingItems) {
      message.warning('Please wait while items are loading...');
      return;
    }
    
    if (fetchError) {
      message.error('Cannot add items: ' + fetchError);
      return;
    }
    
    if (!databaseItems || databaseItems.length === 0) {
      message.error('No items available in database. Please contact Supply Chain team.');
      return;
    }
    
    setEditingItem(null);
    setShowItemModal(true);
    itemForm.resetFields();
  }, [loadingItems, fetchError, databaseItems, itemForm]);

  const handleEditItem = useCallback((item, index) => {
    setEditingItem(index);
    setShowItemModal(true);
    itemForm.setFieldsValue({
      itemId: item.itemId,
      quantity: item.quantity,
      projectName: item.projectName
    });
  }, [itemForm]);

  const handleDeleteItem = useCallback((index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    message.success('Item removed successfully');
  }, [items]);

  const handleItemModalOk = useCallback(async () => {
    try {
      const values = await itemForm.validateFields();
      console.log('Item form values:', values);
      
      const selectedItem = databaseItems.find(item => 
        (item._id || item.id) === values.itemId
      );

      console.log('Selected item from database:', selectedItem);

      if (!selectedItem) {
        message.error('Please select a valid item from the database');
        return;
      }

      const existingItemIndex = items.findIndex(item => 
        item.itemId === (selectedItem._id || selectedItem.id)
      );

      const itemData = {
        itemId: selectedItem._id || selectedItem.id,
        code: selectedItem.code,
        description: selectedItem.description,
        category: selectedItem.category,
        subcategory: selectedItem.subcategory,
        quantity: values.quantity,
        measuringUnit: selectedItem.unitOfMeasure || 'Pieces',
        projectName: values.projectName || '',
        estimatedPrice: selectedItem.standardPrice || 0
      };

      console.log('Item data to add:', itemData);

      if (editingItem !== null) {
        const newItems = [...items];
        newItems[editingItem] = itemData;
        setItems(newItems);
        console.log('Items after editing:', newItems);
        message.success('Item updated successfully');
        setShowItemModal(false);
        itemForm.resetFields();
        setEditingItem(null);
      } else if (existingItemIndex !== -1) {
        Modal.confirm({
          title: 'Item Already Added',
          content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
          onOk() {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += values.quantity;
            setItems(newItems);
            console.log('Items after quantity update:', newItems);
            message.success('Quantity updated successfully');
            setShowItemModal(false);
            itemForm.resetFields();
            setEditingItem(null);
          },
          onCancel() {
            // Keep modal open if user cancels
          }
        });
      } else {
        setItems(prevItems => {
          const updatedItems = [...prevItems, itemData];
          console.log('Items after adding new item:', updatedItems);
          console.log('Updated items length:', updatedItems.length);
          
          setTimeout(() => {
            setShowItemModal(false);
            itemForm.resetFields();
            setEditingItem(null);
          }, 0);
          
          return updatedItems;
        });
        
        message.success('Item added successfully');
      }
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Failed to add item. Please try again.');
    }
  }, [itemForm, databaseItems, items, editingItem]);

  const handleRequestNewItem = useCallback(() => {
    setShowRequestModal(true);
    requestForm.resetFields();
  }, [requestForm]);

  const handleRequestModalOk = useCallback(async () => {
    try {
      const values = await requestForm.validateFields();

      const requestData = {
        ...values,
        requestedBy: user?.fullName || user?.email,
        department: user?.department || '',
        requisitionId: form.getFieldValue('requisitionNumber')
      };

      const response = await itemAPI.requestNewItem(requestData);

      if (response.success) {
        message.success('Item request submitted to Supply Chain team. You will be notified when the item is available.');
        setShowRequestModal(false);
        requestForm.resetFields();
      } else {
        message.error(response.message || 'Failed to submit item request');
      }
    } catch (error) {
      console.error('Request failed:', error);
      message.error('Failed to submit item request');
    }
  }, [requestForm, user, form]);

  // File upload handling
  const handleAttachmentChange = useCallback(({ fileList }) => {
    console.log('📎 Attachment change:', fileList.length, 'files');
    console.log('Files:', fileList.map(f => ({ name: f.name, status: f.status, hasOrigin: !!f.originFileObj })));
    
    const processedFiles = fileList.map(file => {
      if (file.existing) {
        return file;
      }
      
      if (file.originFileObj && file.status !== 'removed') {
        const validation = validateFile(file.originFileObj);
        
        if (!validation.valid) {
          message.error(validation.error);
          return {
            ...file,
            status: 'error',
            error: validation.error
          };
        }
        
        return {
          ...file,
          status: file.status || 'done',
          originFileObj: file.originFileObj
        };
      }
      
      return file;
    });

    const validFiles = processedFiles.filter(file => 
      file.status !== 'error' && file.status !== 'removed'
    );
    
    if (validFiles.length > MAX_FILES) {
      message.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setAttachments(validFiles);
    
    // ✅ Show success message when files are attached
    if (validFiles.length > 0) {
      message.success(`${validFiles.length} file(s) attached successfully`, 2);
    }
  }, [validateFile]);

  const customUploadRequest = useCallback(({ file, onSuccess, onError }) => {
    const fileData = {
      uid: file.uid,
      name: file.name,
      status: 'done',
      originFileObj: file,
      type: file.type,
      size: file.size
    };
    
    setTimeout(() => {
      onSuccess("ok", fileData);
    }, 0);
  }, []);

  const handleDownloadAttachment = useCallback(async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          const lastPart = publicId.split('/').pop();
          if (lastPart && lastPart.includes('.')) {
            publicId = publicId.replace(/\.[^/.]+$/, '');
          }
        }
      }

      if (!publicId) {
        message.error('Invalid attachment URL');
        return;
      }

      const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  }, []);

  const handleSubmit = useCallback(async (values) => {
    console.log('Form submitted with items:', items);
    console.log('Items length:', items.length);
    
    if (!items || items.length === 0) {
      message.error('Please add at least one item to the requisition');
      return;
    }

    if (!values.budgetCode || !selectedBudgetCode) {
      message.error('Please select a budget code');
      return;
    }

    if (selectedProject && projectBudgetInfo) {
      if (calculateTotalCost > projectBudgetInfo.budgetRemaining) {
        Modal.confirm({
          title: 'Budget Warning',
          content: `The total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds the remaining project budget (XAF ${projectBudgetInfo.budgetRemaining.toLocaleString()}). Do you want to continue?`,
          onOk() {
            checkBudgetAndSubmit(values, items);
          }
        });
        return;
      }
    }

    checkBudgetAndSubmit(values, items);
  }, [items, selectedProject, projectBudgetInfo, calculateTotalCost, selectedBudgetCode]);

  const checkBudgetAndSubmit = useCallback(async (values, itemsToSubmit) => {
    console.log('checkBudgetAndSubmit received items:', itemsToSubmit);
    console.log('Items count:', itemsToSubmit?.length);
    
    const budgetCheck = await checkBudgetCodeAvailability(values.budgetCode, calculateTotalCost);
    
    if (!budgetCheck.available) {
      Modal.error({
        title: 'Insufficient Budget',
        content: (
          <div>
            <p>The selected budget code does not have sufficient funds.</p>
            <Divider />
            <p><strong>Budget Code:</strong> {budgetCodeDetails?.code}</p>
            <p><strong>Available:</strong> XAF {budgetCodeDetails?.available.toLocaleString()}</p>
            <p><strong>Required:</strong> XAF {calculateTotalCost.toLocaleString()}</p>
            <p><strong>Shortfall:</strong> XAF {(calculateTotalCost - budgetCodeDetails?.available).toLocaleString()}</p>
            <Divider />
            <p>Please select a different budget code or reduce items.</p>
          </div>
        ),
        okText: 'Understood'
      });
      return;
    }

    Modal.confirm({
      title: 'Confirm Submission',
      content: (
        <div>
          <p><strong>Total Estimated Cost:</strong> XAF {calculateTotalCost.toLocaleString()}</p>
          <p><strong>Budget Code:</strong> {budgetCodeDetails?.code}</p>
          <p><strong>Available Budget:</strong> XAF {budgetCodeDetails?.available.toLocaleString()}</p>
          <p><strong>Remaining After:</strong> XAF {(budgetCodeDetails?.available - calculateTotalCost).toLocaleString()}</p>
          <Divider />
          <p>Are you sure you want to submit this requisition?</p>
        </div>
      ),
      onOk() {
        console.log('Confirming submission with items:', itemsToSubmit);
        submitRequisition(values, itemsToSubmit);
      }
    });
  }, [calculateTotalCost, budgetCodeDetails, checkBudgetCodeAvailability]);

  const submitRequisition = useCallback(async (values, itemsToSubmit) => {
    setLoading(true);
    try {
      console.log('submitRequisition called with:');
      console.log('  - values:', values);
      console.log('  - itemsToSubmit:', itemsToSubmit);
      console.log('  - itemsToSubmit length:', itemsToSubmit?.length);
      
      if (!itemsToSubmit || !Array.isArray(itemsToSubmit) || itemsToSubmit.length === 0) {
        message.error('No items to submit. Please add at least one item to the requisition.');
        setLoading(false);
        return;
      }

      const formData = new FormData();

      formData.append('requisitionNumber', values.requisitionNumber);
      formData.append('title', values.title);
      formData.append('itemCategory', values.itemCategory);
      formData.append('budgetXAF', values.budgetXAF || calculateTotalCost);
      formData.append('budgetCode', values.budgetCode);
      
      if (values.budgetHolder) {
        formData.append('budgetHolder', values.budgetHolder);
      }
      
      formData.append('urgency', values.urgency);
      formData.append('deliveryLocation', values.deliveryLocation);
      formData.append('expectedDate', values.expectedDate.format('YYYY-MM-DD'));
      // ✅ UPDATED: Justification now captured at creation time
      formData.append('justificationOfPurchase', values.justificationOfPurchase || '');
      formData.append('justificationOfPreferredSupplier', values.justificationOfPreferredSupplier || '');
      
      if (supplierSelectionMode === 'database' && selectedSupplier) {
        formData.append('supplierId', selectedSupplier);
        const supplier = suppliers.find(s => s._id === selectedSupplier);
        if (supplier) {
          formData.append('preferredSupplier', supplier.supplierDetails?.companyName || supplier.fullName);
        }
      } else if (supplierSelectionMode === 'manual' && values.preferredSupplierName) {
        formData.append('preferredSupplier', values.preferredSupplierName);
      }
      
      if (selectedProject) {
        formData.append('project', selectedProject);
      }

      const itemsJson = JSON.stringify(itemsToSubmit);
      console.log('Items JSON being appended:', itemsJson);
      console.log('Items JSON length:', itemsJson.length);
      formData.append('items', itemsJson);

      console.log('FormData contents:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ' + (pair[0] === 'items' ? pair[1] : pair[1].substring ? pair[1].substring(0, 50) : pair[1]));
      }

      const newAttachments = attachments.filter(att => !att.existing && att.originFileObj);
      
      console.log('📎 ATTACHMENT DEBUG:');
      console.log('  - Total attachments in state:', attachments.length);
      console.log('  - New attachments to upload:', newAttachments.length);
      console.log('  - Attachments detail:', attachments.map(a => ({
        name: a.name,
        existing: a.existing,
        hasOrigin: !!a.originFileObj,
        status: a.status
      })));
      
      if (attachments.length > 0 && newAttachments.length === 0) {
        console.warn('⚠️  WARNING: You have attachments in state but none have originFileObj!');
      }
      
      newAttachments.forEach((file, index) => {
        console.log(`  📁 Adding file ${index + 1}:`, file.name, `(${(file.originFileObj.size / 1024).toFixed(1)} KB)`);
        formData.append('attachments', file.originFileObj);
      });

      const existingAttachmentIds = attachments
        .filter(att => att.existing)
        .map(att => att._id || att.uid);
      
      if (existingAttachmentIds.length > 0) {
        formData.append('existingAttachments', JSON.stringify(existingAttachmentIds));
      }

      console.log('Submitting requisition with', newAttachments.length, 'new files and', itemsToSubmit.length, 'items...');

      const response = await purchaseRequisitionAPI.createRequisition(formData);

      if (response.success) {
        message.success('Purchase requisition submitted successfully!');
        
        if (response.attachments) {
          const { uploaded, total } = response.attachments;
          if (uploaded < total) {
            message.warning(`${uploaded} out of ${total} attachments uploaded successfully`);
          } else if (uploaded > 0) {
            message.success(`All ${uploaded} attachments uploaded successfully`);
          }
        }
        
        if (onSubmit) {
          onSubmit(response.data);
        }
      } else {
        message.error(response.message || 'Failed to submit requisition');
      }

    } catch (error) {
      console.error('Error submitting requisition:', error);
      
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error('Failed to submit requisition. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [attachments, selectedProject, suppliers, selectedSupplier, supplierSelectionMode, calculateTotalCost, onSubmit]);

  const handleSaveDraft = useCallback(async () => {
    try {
      const values = await form.getFieldsValue();
      const draftData = {
        ...values,
        expectedDate: values.expectedDate ? values.expectedDate.format('YYYY-MM-DD') : moment().add(14, 'days').format('YYYY-MM-DD'),
        items,
        project: selectedProject,
        budgetCode: selectedBudgetCode,
        status: 'draft',
        lastSaved: new Date(),
        totalEstimatedCost: calculateTotalCost
      };

      const response = await purchaseRequisitionAPI.saveDraft(draftData);

      if (response.success) {
        message.success('Draft saved successfully!');
        if (onSaveDraft) {
          onSaveDraft(response.data);
        }
      } else {
        message.error(response.message || 'Failed to save draft');
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      message.error('Failed to save draft');
    }
  }, [form, items, selectedProject, selectedBudgetCode, calculateTotalCost, onSaveDraft]);

  // Render functions
  const renderBudgetCodeSelection = () => (
    <Card 
      size="small" 
      title={
        <Space>
          <TagOutlined />
          Budget Code Selection (Required)
        </Space>
      } 
      style={{ marginBottom: '24px' }}
    >
      <Alert
        message="Budget Code Required"
        description="You must select a budget code before submitting. The system will verify that sufficient budget is available."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={16}>
          <Form.Item
            name="budgetCode"
            label="Select Budget Code"
            rules={[{ required: true, message: 'Budget code is required' }]}
            help="Choose the budget code that will fund this purchase"
          >
            <Select
              placeholder={
                loadingBudgetCodes 
                  ? "Loading budget codes..." 
                  : budgetCodes.length === 0 
                    ? "No budget codes available"
                    : "Select a budget code"
              }
              loading={loadingBudgetCodes}
              disabled={loadingBudgetCodes || budgetCodes.length === 0}
              showSearch
              allowClear
              onChange={handleBudgetCodeChange}
              value={selectedBudgetCode}
              optionFilterProp="children"
              filterOption={(input, option) => {
                if (!input) return true;
                const code = budgetCodes.find(bc => bc._id === option.value);
                if (!code) return false;
                const searchStr = `${code.code} ${code.name} ${code.department}`.toLowerCase();
                return searchStr.includes(input.toLowerCase());
              }}
              notFoundContent={
                loadingBudgetCodes ? (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="small" />
                    <div><Text type="secondary">Loading budget codes...</Text></div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Text type="secondary">No budget codes available</Text>
                  </div>
                )
              }
            >
              {budgetCodes.map(code => {
                const available = code.budget - code.used;
                const utilizationRate = Math.round((code.used / code.budget) * 100);
                const status = utilizationRate >= 90 ? 'critical' : 
                             utilizationRate >= 75 ? 'high' : 
                             utilizationRate >= 50 ? 'moderate' : 'low';
                
                return (
                  <Option key={code._id} value={code._id}>
                    <div style={{ padding: '4px 0' }}>
                      <div>
                        <Text strong>{code.code}</Text> - {code.name}
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {code.department} | Available: XAF {available.toLocaleString()}
                          {' '}
                          <Tag 
                            color={
                              status === 'critical' ? 'red' :
                              status === 'high' ? 'orange' :
                              status === 'moderate' ? 'blue' : 'green'
                            }
                            style={{ marginLeft: '4px' }}
                          >
                            {utilizationRate}% used
                          </Tag>
                        </Text>
                      </div>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </Form.Item>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item label=" ">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchBudgetCodes}
              loading={loadingBudgetCodes}
              block
            >
              Refresh Codes
            </Button>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter requisition title' }]}
          >
            <Input placeholder="Purchase of IT accessories - Safety Stock" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="deliveryLocation"
            label="Delivery Location"
            rules={[{ required: true, message: 'Please enter delivery location' }]}
          >
            <Input placeholder="Office" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="expectedDate"
            label="Expected Date"
            rules={[{ required: true, message: 'Please select expected delivery date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
            />
          </Form.Item>
        </Col>
      </Row>

      {budgetCodeDetails && (
        <Alert
          message={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text strong>Budget Code Selected: {budgetCodeDetails.code}</Text>
            </Space>
          }
          description={
            <div>
              <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
                <Descriptions.Item label="Code">
                  <Text code strong>{budgetCodeDetails.code}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Name">
                  {budgetCodeDetails.name}
                </Descriptions.Item>
                <Descriptions.Item label="Department">
                  <Tag color="blue">{budgetCodeDetails.department}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Budget">
                  <Text strong>XAF {budgetCodeDetails.totalBudget.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Used">
                  <Text>XAF {budgetCodeDetails.used.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Available">
                  <Text strong style={{ color: '#52c41a' }}>
                    XAF {budgetCodeDetails.available.toLocaleString()}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Utilization" span={2}>
                  <Progress 
                    percent={budgetCodeDetails.utilizationRate} 
                    size="small"
                    status={
                      budgetCodeDetails.status === 'critical' ? 'exception' :
                      budgetCodeDetails.status === 'high' ? 'normal' : 'success'
                    }
                  />
                </Descriptions.Item>
              </Descriptions>
              
              {calculateTotalCost > 0 && (
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  backgroundColor: budgetCodeDetails.available >= calculateTotalCost ? '#f6ffed' : '#fff2e8', 
                  borderRadius: '4px',
                  border: `1px solid ${budgetCodeDetails.available >= calculateTotalCost ? '#b7eb8f' : '#ffbb96'}`
                }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>Estimated Cost: </Text>
                      <Text style={{ color: '#1890ff' }}>XAF {calculateTotalCost.toLocaleString()}</Text>
                    </Col>
                    <Col span={12}>
                      <Text strong>Remaining After: </Text>
                      <Text style={{ 
                        color: budgetCodeDetails.available >= calculateTotalCost ? '#52c41a' : '#ff4d4f',
                        fontWeight: 'bold'
                      }}>
                        XAF {(budgetCodeDetails.available - calculateTotalCost).toLocaleString()}
                      </Text>
                    </Col>
                  </Row>
                  
                  {budgetCodeDetails.available < calculateTotalCost ? (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ffbb96' }}>
                      <Space>
                        <WarningOutlined style={{ color: '#ff4d4f' }} />
                        <Text type="danger" strong>
                          Insufficient budget! Please select a different budget code or reduce items.
                        </Text>
                      </Space>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #b7eb8f' }}>
                      <Space>
                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                        <Text style={{ color: '#52c41a' }} strong>
                          Sufficient budget available for this requisition
                        </Text>
                      </Space>
                    </div>
                  )}
                </div>
              )}
            </div>
          }
          type={
            calculateTotalCost > 0 && budgetCodeDetails.available < calculateTotalCost 
              ? "warning" 
              : "success"
          }
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}

      {!loadingBudgetCodes && budgetCodes.length === 0 && (
        <Alert
          message="No Budget Codes Available"
          description="There are no active budget codes available. Please contact the Finance team to create budget codes before submitting requisitions."
          type="error"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </Card>
  );

  const renderRequisitionInfo = () => (
    <Card size="small" title="Requisition Information" style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="requisitionNumber"
            label="Requisition Number"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="date"
            label="Date"
          >
            <DatePicker
              disabled
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="urgency"
            label="Urgency"
            rules={[{ required: true, message: 'Please select urgency level' }]}
          >
            <Select>
              {URGENCY_OPTIONS.map(option => (
                <Option key={option.value} value={option.value}>
                  <Tag color={option.color}>{option.value}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderRequesterDetails = () => (
    <Card size="small" title="Requester Details" style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Form.Item
            name="requesterName"
            label="Requester Name"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="department"
            label="Department"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item
            name="itemCategory"
            label="Primary Item Category"
            rules={[{ required: true, message: 'Please select primary category' }]}
          >
            <Select 
              placeholder="Select primary category"
              onChange={(value) => {
                console.log('Category selected:', value);
                if (value && value !== 'all') {
                  fetchDatabaseItems(value);
                } else {
                  fetchDatabaseItems();
                }
              }}
            >
              <Option value="all">All Categories</Option>
              {ITEM_CATEGORIES.map(category => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderBudgetInfo = () => {
    const itemsTotal = items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
    const isManualBudget = manualBudget !== null && manualBudget > 0;
    
    return (
      <Card size="small" title="Budget Information" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12}>
            <Form.Item
              name="budgetXAF"
              label="Budget (XAF)"
              help="Enter estimated budget in Central African Francs (overrides calculated total)"
            >
              <InputNumber
                style={{ width: '100%' }}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,)/g, '')}
                placeholder="Enter budget amount"
                addonBefore={<DollarOutlined />}
                onChange={(value) => {
                  setManualBudget(value);
                  if (selectedBudgetCode && value) {
                    handleBudgetCodeChange(selectedBudgetCode);
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Alert
              message={
                <div>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>Total Estimated Cost: </Text>
                    <Text style={{ fontSize: '18px', color: '#1890ff' }}>
                      {calculateTotalCost.toLocaleString()} XAF
                    </Text>
                  </div>
                  {isManualBudget && itemsTotal > 0 && (
                    <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                      (Items total: {itemsTotal.toLocaleString()} XAF - Manual override applied)
                    </div>
                  )}
                </div>
              }
              description={
                isManualBudget 
                  ? "Using manually entered budget amount"
                  : calculateTotalCost > 0 
                    ? `Based on ${items.length} selected items with known prices` 
                    : "Add items or enter budget amount manually"
              }
              type={isManualBudget ? "warning" : "info"}
              showIcon
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderProjectAndSupplierSelection = useCallback(() => (
    <Card 
      size="small" 
      title={
        <Space>
          <ProjectOutlined />
          Project Assignment & Preferred Supplier (Optional)
        </Space>
      } 
      style={{ marginBottom: '24px' }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="project"
            label="Assign to Project"
            help="Select a project to associate this requisition with (optional)"
          >
            <Select
              placeholder="Select project (optional)"
              allowClear
              showSearch
              loading={loadingProjects}
              onChange={(value) => setSelectedProject(value)}
              filterOption={(input, option) => {
                const project = projects.find(p => p._id === option.value);
                return project && (
                  project.name.toLowerCase().includes(input.toLowerCase()) ||
                  project.code.toLowerCase().includes(input.toLowerCase())
                );
              }}
            >
              {projects.map(project => (
                <Option key={project._id} value={project._id}>
                  <div>
                    <Text strong>{project.code}</Text> - {project.name}
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {project.projectType} | {project.priority} Priority | {project.status}
                    </Text>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        
        <Col xs={24} md={12}>
          <Form.Item
            label="Supplier Selection Method"
            help="Choose whether to select from registered suppliers or enter a new supplier name"
          >
            <Radio.Group 
              value={supplierSelectionMode} 
              onChange={(e) => {
                setSupplierSelectionMode(e.target.value);
                setSelectedSupplier(null);
                form.setFieldsValue({ 
                  supplierId: undefined, 
                  preferredSupplierName: undefined 
                });
              }}
            >
              <Radio value="database">
                <Space>
                  <DatabaseOutlined />
                  Database ({suppliers.length})
                </Space>
              </Radio>
              <Radio value="manual">
                <Space>
                  <EditOutlined />
                  Manual Entry
                </Space>
              </Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>

      {supplierError && (
        <Alert
          message="Supplier Loading Error"
          description={supplierError}
          type="error"
          showIcon
          closable
          onClose={() => setSupplierError(null)}
          action={
            <Button size="small" onClick={fetchSuppliers} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
          style={{ marginBottom: '16px' }}
        />
      )}

      <Row gutter={[16, 16]}>
        {supplierSelectionMode === 'database' ? (
          <>
            <Col xs={24} md={20}>
              <Form.Item
                name="supplierId"
                label="Select Supplier"
                help="Choose from registered and approved suppliers"
              >
                <Select
                  placeholder={
                    loadingSuppliers 
                      ? "Loading suppliers..." 
                      : suppliers.length === 0 
                        ? "No suppliers available"
                        : "Search and select a supplier"
                  }
                  allowClear
                  showSearch
                  loading={loadingSuppliers}
                  disabled={loadingSuppliers || suppliers.length === 0}
                  onChange={(value) => setSelectedSupplier(value)}
                  filterOption={(input, option) => {
                    const supplier = suppliers.find(s => s._id === option.value);
                    if (!supplier) return false;
                    
                    const companyName = supplier.supplierDetails?.companyName || '';
                    const fullName = supplier.fullName || '';
                    const email = supplier.email || '';
                    const supplierType = supplier.supplierDetails?.supplierType || '';
                    
                    const searchStr = `${companyName} ${fullName} ${email} ${supplierType}`.toLowerCase();
                    return searchStr.includes(input.toLowerCase());
                  }}
                  notFoundContent={
                    loadingSuppliers ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Spin size="small" />
                        <div><Text type="secondary">Loading suppliers...</Text></div>
                      </div>
                    ) : supplierError ? (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Text type="danger">Error: {supplierError}</Text>
                        <div style={{ marginTop: '8px' }}>
                          <Button size="small" type="primary" onClick={fetchSuppliers}>
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px' }}>
                        <Text type="secondary">No suppliers found</Text>
                      </div>
                    )
                  }
                >
                  {suppliers.map(supplier => (
                    <Option key={supplier._id} value={supplier._id}>
                      <div>
                        <Text strong>
                          {supplier.supplierDetails?.companyName || supplier.fullName}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {supplier.supplierDetails?.supplierType && (
                            <Tag size="small" color="blue">
                              {supplier.supplierDetails.supplierType}
                            </Tag>
                          )}
                          {supplier.email}
                          {supplier.supplierDetails?.phoneNumber && 
                            ` | ${supplier.supplierDetails.phoneNumber}`
                          }
                        </Text>
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={4}>
              <Form.Item label=" ">
                <Button 
                  icon={<ReloadOutlined />} 
                  onClick={fetchSuppliers}
                  loading={loadingSuppliers}
                  block
                >
                  Refresh
                </Button>
              </Form.Item>
            </Col>
          </>
        ) : (
          <Col xs={24} md={24}>
            <Form.Item
              name="preferredSupplierName"
              label="Supplier Name"
              help="Enter the name of the supplier (not yet registered in the system)"
              rules={[
                { 
                  min: 2, 
                  message: 'Supplier name must be at least 2 characters' 
                }
              ]}
            >
              <Input 
                placeholder="Enter supplier company name or full name"
                prefix={<ShopOutlined />}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      {projectBudgetInfo && (
        <Alert
          message="Project Budget Information"
          description={
            <div>
              <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
                <Descriptions.Item label="Project">
                  <Text strong>{projectBudgetInfo.projectCode}</Text> - {projectBudgetInfo.projectName}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={
                    projectBudgetInfo.status === 'In Progress' ? 'green' :
                    projectBudgetInfo.status === 'Planning' ? 'blue' :
                    projectBudgetInfo.status === 'Completed' ? 'purple' : 'orange'
                  }>
                    {projectBudgetInfo.status}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Budget">
                  <Text>XAF {projectBudgetInfo.budgetAllocated.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Remaining Budget">
                  <Text style={{ 
                    color: projectBudgetInfo.budgetRemaining < calculateTotalCost ? '#f5222d' : '#52c41a' 
                  }}>
                    XAF {projectBudgetInfo.budgetRemaining.toLocaleString()}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Budget Utilization">
                  <Text>{projectBudgetInfo.budgetUtilization}%</Text>
                </Descriptions.Item>
                {projectBudgetInfo.budgetCode && (
                  <Descriptions.Item label="Budget Code">
                    <Tag color="gold">
                      {projectBudgetInfo.budgetCode.code} 
                      (Available: XAF {projectBudgetInfo.budgetCode.available.toLocaleString()})
                    </Tag>
                  </Descriptions.Item>
                )}
              </Descriptions>
              {calculateTotalCost > projectBudgetInfo.budgetRemaining && (
                <div style={{ marginTop: '8px' }}>
                  <Text type="danger">
                    <ExclamationCircleOutlined /> Warning: Estimated cost exceeds remaining project budget
                  </Text>
                </div>
              )}
            </div>
          }
          type={calculateTotalCost > (projectBudgetInfo?.budgetRemaining || 0) ? "warning" : "info"}
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}

      {selectedSupplier && supplierSelectionMode === 'database' && (
        <Alert
          message="Selected Supplier Details"
          description={(() => {
            const supplier = suppliers.find(s => s._id === selectedSupplier);
            return supplier ? (
              <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
                <Descriptions.Item label="Company">
                  <Text strong>{supplier.supplierDetails?.companyName || supplier.fullName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Contact">
                  {supplier.supplierDetails?.contactName || supplier.fullName}
                </Descriptions.Item>
                <Descriptions.Item label="Email">
                  {supplier.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {supplier.supplierDetails?.phoneNumber || 'N/A'}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color="blue">
                    {supplier.supplierDetails?.supplierType || 'N/A'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={supplier.status === 'active' ? 'green' : 'orange'}>
                    {supplier.status || 'N/A'}
                  </Tag>
                </Descriptions.Item>
                {supplier.supplierDetails?.address && (
                  <Descriptions.Item label="Address" span={2}>
                    {supplier.supplierDetails.address}
                  </Descriptions.Item>
                )}
              </Descriptions>
            ) : null;
          })()}
          type="info"
          style={{ marginTop: '16px' }}
        />
      )}

      {loadingProjects && !selectedProject && (
        <Alert
          message="Loading Projects"
          description="Please wait while we load available projects..."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
      
      {!loadingProjects && projects.length === 0 && (
        <Alert
          message="No Active Projects"
          description="No active projects found. You can still create the requisition without assigning it to a project."
          type="info"
          showIcon
          style={{ marginTop: '16px' }}
        />
      )}
    </Card>
  ), [
    loadingProjects,
    loadingSuppliers,
    projects,
    suppliers,
    supplierSelectionMode,
    selectedSupplier,
    supplierError,
    projectBudgetInfo,
    calculateTotalCost,
    form,
    fetchSuppliers
  ]);

  const renderAttachments = () => (
    <Card 
      size="small" 
      title={
        <Space>
          <FileOutlined />
          Attachments (Optional)
          {attachments.length > 0 && (
            <Tag color="green">{attachments.length} file(s) attached</Tag>
          )}
        </Space>
      } 
      style={{ marginBottom: '24px' }}
    >
      {attachments.length > 0 && (
        <Alert
          type="success"
          message={`${attachments.length} file(s) ready to upload`}
          description={
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
              {attachments.map((file, idx) => (
                <li key={idx}>
                  {file.name} ({file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'})
                </li>
              ))}
            </ul>
          }
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}
      <Form.Item
        name="attachments"
        label="Upload Supporting Documents"
        help={`Maximum ${MAX_FILES} files. Each file max ${MAX_FILE_SIZE / (1024 * 1024)}MB. Accepted: ${ALLOWED_FILE_TYPES.join(', ')}`}
      >
        <Dragger
          multiple
          fileList={attachments}
          onChange={handleAttachmentChange}
          customRequest={customUploadRequest}
          beforeUpload={(file) => {
            const validation = validateFile(file);
            if (!validation.valid) {
              message.error(validation.error);
              return false;
            }
            return true;
          }}
          onRemove={(file) => {
            console.log('Removing file:', file.name);
            return true;
          }}
          accept={ALLOWED_FILE_TYPES.join(',')}
          maxCount={MAX_FILES}
          showUploadList={{
            showPreviewIcon: true,
            showRemoveIcon: true,
            showDownloadIcon: false
          }}
          onPreview={(file) => {
            if (file.existing && file.url) {
              handleDownloadAttachment(file);
            } else if (file.originFileObj) {
              const url = URL.createObjectURL(file.originFileObj);
              window.open(url, '_blank');
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Click or drag files to this area to upload</p>
          <p className="ant-upload-hint">
            Support for single or bulk upload. Maximum {MAX_FILES} files, each up to {MAX_FILE_SIZE / (1024 * 1024)}MB.
            <br />
            Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT, CSV
          </p>
        </Dragger>
      </Form.Item>
      
      {attachments.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <Text strong>Attached Files ({attachments.length}/{MAX_FILES}):</Text>
          <div style={{ marginTop: '8px' }}>
            {attachments.map((file, index) => (
              <div key={file.uid || index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                padding: '4px 0',
                borderBottom: '1px solid #f0f0f0'
              }}>
                <FileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
                <div style={{ flex: 1 }}>
                  <Text>{file.name}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
                    {file.existing && ' (Existing file)'}
                  </Text>
                </div>
                <Space>
                  {file.existing && file.url && (
                    <Button 
                      size="small" 
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleDownloadAttachment(file)}
                    >
                      Preview
                    </Button>
                  )}
                  <Button 
                    size="small" 
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      const newAttachments = attachments.filter((_, i) => i !== index);
                      setAttachments(newAttachments);
                    }}
                  >
                    Remove
                  </Button>
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );

  // Table columns
  const itemColumns = useMemo(() => [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: '10%',
      render: (code) => <Text code>{code}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '30%',
      render: (description, record) => (
        <div>
          <div>
            <Text strong>{description}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.category} - {record.subcategory}
            </Text>
          </div>
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '10%',
      align: 'center'
    },
    {
      title: 'Unit',
      dataIndex: 'measuringUnit',
      key: 'measuringUnit',
      width: '10%',
      align: 'center'
    },
    {
      title: 'Est. Price (XAF)',
      dataIndex: 'estimatedPrice',
      key: 'estimatedPrice',
      width: '15%',
      align: 'right',
      render: (price, record) => {
        const total = price * record.quantity;
        return (
          <div>
            <div>
              <Text strong>{total ? total.toLocaleString() : 'TBD'}</Text>
            </div>
            {price > 0 && (
              <div>
                <Text type="secondary" style={{ fontSize: '11px' }}>
                  {price.toLocaleString()} each
                </Text>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Project',
      dataIndex: 'projectName',
      key: 'projectName',
      width: '15%'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record, index) => (
        <Space>
          <Button
            size="small"
            type="link"
            onClick={() => handleEditItem(record, index)}
            icon={<EditOutlined />}
          />
          <Button
            size="small"
            type="link"
            danger
            onClick={() => handleDeleteItem(index)}
            icon={<DeleteOutlined />}
          />
        </Space>
      )
    }
  ], [handleEditItem, handleDeleteItem]);

  const renderHeader = () => (
    <div style={{ marginBottom: '24px' }}>
      <Title level={3} style={{ margin: 0 }}>
        <ShoppingCartOutlined style={{ marginRight: '8px' }} />
        {editData ? 'Update Purchase Requisition' : 'New Purchase Requisition'}
      </Title>
      <Text type="secondary">
        {editData ? 'Update your purchase requisition' : 'Create a new purchase requisition using approved items and optionally assign to a project'}
      </Text>
    </div>
  );

  const renderDatabaseAlert = () => (
    <Alert
      message={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            Items must be selected from the pre-approved database managed by the Supply Chain team. 
            {loadingItems ? ' Loading items...' : ` ${databaseItems.length} items available.`}
            {fetchError && ' (Error loading items)'}
          </span>
          <Space>
            <Button
              type="link"
              size="small"
              onClick={handleRequestNewItem}
              disabled={loadingItems}
            >
              Request New Item
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => {
                const selectedCategory = form.getFieldValue('itemCategory');
                fetchDatabaseItems(selectedCategory);
              }}
              loading={loadingItems}
            >
              Refresh
            </Button>
          </Space>
        </div>
      }
      type={fetchError ? "error" : loadingItems ? "info" : "success"}
      showIcon
      icon={<DatabaseOutlined />}
      style={{ marginBottom: '24px' }}
    />
  );

  const renderItemsSection = () => (
    <Card 
      size="small" 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>
            <DatabaseOutlined /> Selected Items ({items.length})
          </span>
          <Space>
            {calculateTotalCost > 0 && (
              <Text type="secondary">
                Total Est. Cost: <Text strong style={{ color: '#1890ff' }}>{calculateTotalCost.toLocaleString()} XAF</Text>
              </Text>
            )}
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={handleAddItem}
              loading={loadingItems}
              disabled={fetchError || databaseItems.length === 0}
            >
              Add from Database
            </Button>
          </Space>
        </div>
      } 
      style={{ marginBottom: '24px' }}
    >
      {loadingItems ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading item database...</Text>
          </div>
        </div>
      ) : fetchError ? (
        <Alert
          message="Item Database Error"
          description={fetchError}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={() => {
              const selectedCategory = form.getFieldValue('itemCategory');
              fetchDatabaseItems(selectedCategory);
            }} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      ) : databaseItems.length === 0 ? (
        <Alert
          message="No Items Available"
          description="No items found in the database. Please contact the Supply Chain team to add items to the database."
          type="warning"
          showIcon
          action={
            <Button size="small" onClick={() => {
              const selectedCategory = form.getFieldValue('itemCategory');
              fetchDatabaseItems(selectedCategory);
            }} icon={<ReloadOutlined />}>
              Refresh
            </Button>
          }
        />
      ) : items.length === 0 ? (
        <Alert
          message="No items selected yet"
          description={`Choose from ${databaseItems.length} approved items in the database by clicking "Add from Database"`}
          type="info"
          showIcon
          action={
            <Button 
              type="primary" 
              size="small" 
              icon={<PlusOutlined />}
              onClick={handleAddItem}
            >
              Add First Item
            </Button>
          }
        />
      ) : (
        <Table
          columns={itemColumns}
          dataSource={items}
          pagination={false}
          rowKey={(record, index) => index}
          size="small"
          scroll={{ x: 800 }}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={4}>
                <Text strong>Total Estimated Cost:</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4}>
                <Text strong style={{ color: '#1890ff' }}>
                  {calculateTotalCost.toLocaleString()} XAF
                </Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} colSpan={2} />
            </Table.Summary.Row>
          )}
        />
      )}
    </Card>
  );

  // ✅ UPDATED: Justification is captured at requisition creation
  const renderJustifications = () => (
    <Card size="small" title="📝 Justification" style={{ marginBottom: '24px' }}>
      <Form.Item
        name="justificationOfPurchase"
        label="Justification of Purchase"
        rules={[
          { required: true, message: 'Please provide justification for this purchase' },
          { min: 20, message: 'Justification must be at least 20 characters long' }
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Explain why this purchase is necessary and how it will benefit the organization..."
          maxLength={1000}
          showCount
        />
      </Form.Item>

      <Form.Item
        name="justificationOfPreferredSupplier"
        label="Justification of Preferred Supplier (Optional)"
        rules={[
          { min: 10, message: 'If provided, supplier justification must be at least 10 characters long' }
        ]}
      >
        <TextArea
          rows={3}
          placeholder="If you have a preferred supplier, explain why they were selected..."
          maxLength={500}
          showCount
        />
      </Form.Item>
    </Card>
  );

  const renderActionButtons = () => (
    <Card size="small">
      <Space>
        <Button onClick={onCancel}>
          Cancel
        </Button>
        <Button 
          onClick={handleSaveDraft}
          icon={<SaveOutlined />}
        >
          Save Draft
        </Button>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading}
          icon={<SendOutlined />}
          disabled={items.length === 0 || !selectedBudgetCode}
        >
          {editData ? 'Update Requisition' : 'Submit Requisition'}
        </Button>
      </Space>
    </Card>
  );

  const renderAddItemModal = () => (
    <Modal
      title="Add Item from Database"
      open={showItemModal}
      onOk={handleItemModalOk}
      onCancel={() => {
        setShowItemModal(false);
        itemForm.resetFields();
      }}
      width={700}
      okText={editingItem !== null ? "Update Item" : "Add Item"}
    >
      <Alert
        message="Database Item Selection"
        description={`Select from ${databaseItems.length} pre-approved items. Contact Supply Chain team if your item is not listed.`}
        type="warning"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Form form={itemForm} layout="vertical">
        <Form.Item
          name="itemId"
          label="Select Item"
          rules={[{ required: true, message: 'Please select an item' }]}
        >
          <Select
            placeholder="Search and select from approved items"
            showSearch
            optionFilterProp="children"
            loading={loadingItems}
            filterOption={(input, option) => {
              const item = databaseItems.find(item => (item._id || item.id) === option.value);
              if (!item) return false;
              return (
                item.description.toLowerCase().includes(input.toLowerCase()) ||
                item.code.toLowerCase().includes(input.toLowerCase()) ||
                item.category.toLowerCase().includes(input.toLowerCase())
              );
            }}
          >
            {databaseItems.map(item => (
              <Option key={item._id || item.id} value={item._id || item.id}>
                <div>
                  <Text strong>{item.code}</Text> - {item.description}
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {item.category} | Unit: {item.unitOfMeasure} |
                    {item.standardPrice ? ` Price: ${item.standardPrice.toLocaleString()} XAF` : ' Price: TBD'}
                  </Text>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="quantity"
              label="Quantity"
              rules={[
                { required: true, message: 'Please enter quantity' },
                { type: 'number', min: 1, message: 'Quantity must be at least 1' }
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }}
                min={1}
                placeholder="Enter quantity"
              />
            </Form.Item>
          </Col>
        </Row>

        {itemForm.getFieldValue('itemId') && (
          <Alert
            message="Selected Item Details"
            description={(() => {
              const item = databaseItems.find(i => (i._id || i.id) === itemForm.getFieldValue('itemId'));
              const quantity = itemForm.getFieldValue('quantity') || 1;
              return item ? (
                <div>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text><strong>Code:</strong> {item.code}</Text><br />
                      <Text><strong>Description:</strong> {item.description}</Text><br />
                      <Text><strong>Category:</strong> {item.category} - {item.subcategory}</Text><br />
                      <Text><strong>Unit:</strong> {item.unitOfMeasure}</Text>
                    </Col>
                    <Col span={12}>
                      {item.standardPrice && (
                        <>
                          <Text><strong>Unit Price:</strong> {item.standardPrice.toLocaleString()} XAF</Text><br />
                          <Text><strong>Total Est.:</strong> {(item.standardPrice * quantity).toLocaleString()} XAF</Text><br />
                        </>
                      )}
                      {item.supplier && (
                        <Text><strong>Preferred Supplier:</strong> {item.supplier}</Text>
                      )}
                    </Col>
                  </Row>
                </div>
              ) : null;
            })()}
            type="info"
            style={{ marginTop: '16px' }}
          />
        )}
      </Form>
    </Modal>
  );

  const renderRequestNewItemModal = () => (
    <Modal
      title="Request New Item"
      open={showRequestModal}
      onOk={handleRequestModalOk}
      onCancel={() => {
        setShowRequestModal(false);
        requestForm.resetFields();
      }}
      width={600}
      okText="Submit Request"
    >
      <Alert
        message="Request New Item Addition"
        description="Submit a request to add a new item to the database. The Supply Chain team will review and approve items before they become available for selection."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />

      <Form form={requestForm} layout="vertical">
        <Form.Item
          name="description"
          label="Item Description"
          rules={[
            { required: true, message: 'Please describe the item' },
            { min: 10, message: 'Description must be at least 10 characters' }
          ]}
        >
          <Input placeholder="Describe the item you need in detail" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select category' }]}
            >
              <Select 
                placeholder="Select category"
              >
                {ITEM_CATEGORIES.map(category => (
                  <Option key={category} value={category}>
                    {category}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="unitOfMeasure"
              label="Unit of Measure"
              rules={[{ required: true, message: 'Please specify unit' }]}
            >
              <Select 
                placeholder="Select unit"
              >
                {UNITS_OF_MEASURE.map(unit => (
                  <Option key={unit} value={unit}>
                    {unit}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="justification"
          label="Justification"
          rules={[{ required: true, message: 'Please justify why this item is needed' }]}
        >
          <TextArea
            rows={4}
            placeholder="Explain why this item is needed and why it should be added to the database..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="estimatedPrice"
          label="Estimated Price (XAF) - Optional"
          help="If you know the approximate price, please include it"
        >
          <InputNumber
            style={{ width: '100%' }}
            min={0}
            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            parser={value => value.replace(/\$\s?|(,)/g, '')}
            placeholder="Estimated price in XAF"
          />
        </Form.Item>

        <Form.Item
          name="preferredSupplier"
          label="Preferred Supplier - Optional"
        >
          <Input placeholder="Suggest a supplier if you have one in mind" />
        </Form.Item>
      </Form>

      <Alert
        message="Request Process"
        description="Your request will be sent to the Supply Chain team for review. You'll be notified when the item is approved and available for selection. This may take 1-3 business days."
        type="warning"
        style={{ marginTop: '16px' }}
      />
    </Modal>
  );

  return (
    <>
      <style>
        {`
          /* Optimize scrolling performance with hardware acceleration */
          .ant-card-body,
          .ant-modal-body,
          .ant-table-body,
          .ant-form {
            -webkit-overflow-scrolling: touch;
            transform: translateZ(0);
            will-change: transform;
          }
          
          /* Remove smooth scroll behavior for better performance */
          * {
            scroll-behavior: auto !important;
          }
          
          /* Optimize rendering with CSS containment - exclude interactive elements */
          .ant-table-tbody > tr {
            contain: layout style;
          }
          
          /* Custom scrollbar styling */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Optimize table scrolling */
          .ant-table-body {
            overflow-y: auto !important;
            transform: translateZ(0);
            -webkit-overflow-scrolling: touch;
          }
          
          /* Ensure dropdowns render correctly above all content */
          .ant-select-dropdown,
          .ant-picker-dropdown,
          .ant-dropdown,
          .ant-popover,
          .ant-tooltip {
            transform: none !important;
            will-change: auto !important;
            contain: none !important;
            z-index: 9999 !important;
          }
          
          /* Ensure modal content allows dropdowns to show */
          .ant-modal-body,
          .ant-modal-content {
            overflow: visible !important;
          }
          
          /* Ensure form items don't hide dropdowns */
          .ant-form-item {
            position: relative;
            z-index: auto;
          }
          
          /* Reduce animations for better scroll performance */
          .ant-input,
          .ant-select,
          .ant-input-number,
          .ant-picker {
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
          }
          
          /* Fast modal transitions */
          .ant-modal {
            transition: opacity 0.2s ease;
          }
        `}
      </style>
      
      <div>
        <Card>
          {renderHeader()}
          {renderDatabaseAlert()}

          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            {renderRequisitionInfo()}
            {renderRequesterDetails()}
            {renderBudgetCodeSelection()}
            {renderProjectAndSupplierSelection()}
            {renderBudgetInfo()}
            {renderItemsSection()}
            {renderAttachments()}
            {renderJustifications()}
            {renderActionButtons()}
          </Form>
        </Card>

        {renderAddItemModal()}
        {renderRequestNewItemModal()}
      </div>
    </>
  );
};

export default EnhancedPurchaseRequisitionForm;










// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Space,
//   Typography,
//   Row,
//   Col,
//   Select,
//   DatePicker,
//   InputNumber,
//   Table,
//   Modal,
//   message,
//   Alert,
//   Tag,
//   Upload,
//   Divider,
//   Spin,
//   Descriptions,
//   Progress,
//   Radio,
//   AutoComplete
// } from 'antd';
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   SendOutlined,
//   ShoppingCartOutlined,
//   DollarOutlined,
//   UploadOutlined,
//   EditOutlined,
//   ExclamationCircleOutlined,
//   DatabaseOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   ProjectOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownloadOutlined,
//   InboxOutlined,
//   ShopOutlined,
//   TagOutlined,
//   WarningOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
// import { projectAPI } from '../../services/projectAPI';
// import { itemAPI } from '../../services/itemAPI';
// import supplierApiService from '../../services/supplierAPI';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Dragger } = Upload;

// // Constants
// const URGENCY_OPTIONS = [
//   { value: 'Low', color: 'green' },
//   { value: 'Medium', color: 'orange' },
//   { value: 'High', color: 'red' }
// ];

// const ITEM_CATEGORIES = [
//   'IT Accessories',
//   'Office Supplies',
//   'Equipment',
//   'Consumables',
//   'Software',
//   'Hardware',
//   'Furniture',
//   'Safety Equipment',
//   'Maintenance Supplies',
//   'Other'
// ];

// const UNITS_OF_MEASURE = [
//   'Pieces', 'Sets', 'Boxes', 'Packs', 'Units', 'Kg', 
//   'Litres', 'Meters', 'Pairs', 'Each'
// ];

// const ALLOWED_FILE_TYPES = [
//   '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
//   '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv'
// ];

// const MAX_FILE_SIZE = 10 * 1024 * 1024;
// const MAX_FILES = 5;

// const EnhancedPurchaseRequisitionForm = ({ onSubmit, onCancel, onSaveDraft, editData }) => {
//   const { user } = useSelector((state) => state.auth);
//   const [form] = Form.useForm();
//   const [itemForm] = Form.useForm();
//   const [requestForm] = Form.useForm();

//   // State management
//   const [loading, setLoading] = useState(false);
//   const [loadingItems, setLoadingItems] = useState(true);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [loadingSuppliers, setLoadingSuppliers] = useState(false);
//   const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);
//   const [fetchError, setFetchError] = useState(null);
//   const [supplierError, setSupplierError] = useState(null);
//   const [showItemModal, setShowItemModal] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);

//   const [items, setItems] = useState([]);
//   const [attachments, setAttachments] = useState([]);
//   const [databaseItems, setDatabaseItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [projectBudgetInfo, setProjectBudgetInfo] = useState(null);
//   const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
//   const [budgetCodeDetails, setBudgetCodeDetails] = useState(null);
//   const [manualBudget, setManualBudget] = useState(null);
  
//   const [supplierSelectionMode, setSupplierSelectionMode] = useState('database');
//   const [selectedSupplier, setSelectedSupplier] = useState(null);

//   const generateRequisitionNumber = useCallback(() => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     return `REQ${year}${month}${day}${random}`;
//   }, []);

//   // const calculateTotalCost = useMemo(() => {
//   //   return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
//   // }, [items]);

//   const calculateTotalCost = useMemo(() => {
//     // If manual budget is entered, use that instead of calculated total
//     if (manualBudget !== null && manualBudget > 0) {
//       return manualBudget;
//     }
//     // Otherwise, calculate from items
//     return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
//   }, [items, manualBudget]);


//   const validateFile = useCallback((file) => {
//     const fileName = file.name || file.originalname || '';
//     const fileSize = file.size || 0;
//     const fileExt = fileName.includes('.') ? 
//       '.' + fileName.split('.').pop().toLowerCase() : '';

//     if (fileSize > MAX_FILE_SIZE) {
//       return {
//         valid: false,
//         error: `File "${fileName}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
//       };
//     }

//     if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
//       return {
//         valid: false,
//         error: `File type "${fileExt}" not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
//       };
//     }

//     return { valid: true };
//   }, []);

//   // Fetch budget codes
//   const fetchBudgetCodes = useCallback(async () => {
//     try {
//       setLoadingBudgetCodes(true);
//       console.log('🔍 Fetching budget codes...');
      
//       const response = await purchaseRequisitionAPI.getActiveBudgetCodes();
//       console.log('📦 Budget codes response:', response);
      
//       if (response.success && Array.isArray(response.data)) {
//         setBudgetCodes(response.data);
//         console.log(`✅ Loaded ${response.data.length} active budget codes`);
        
//         if (response.data.length > 0) {
//           message.success(`Loaded ${response.data.length} active budget codes`);
//         } else {
//           message.info('No active budget codes available');
//         }
//       } else {
//         console.error('❌ Invalid response structure:', response);
//         setBudgetCodes([]);
//         message.warning('No budget codes available');
//       }
//     } catch (error) {
//       console.error('❌ Error fetching budget codes:', error);
//       message.error('Failed to load budget codes');
//       setBudgetCodes([]);
//     } finally {
//       setLoadingBudgetCodes(false);
//     }
//   }, []);

//   // Check budget code availability
//   const checkBudgetCodeAvailability = useCallback(async (budgetCodeId, requiredAmount) => {
//     try {
//       const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//       if (!budgetCode) return { available: false, message: 'Budget code not found' };

//       const available = budgetCode.budget - budgetCode.used;
      
//       if (available < requiredAmount) {
//         return {
//           available: false,
//           message: `Insufficient budget. Available: XAF ${available.toLocaleString()}, Required: XAF ${requiredAmount.toLocaleString()}`
//         };
//       }

//       return {
//         available: true,
//         budgetCode: budgetCode,
//         availableAmount: available
//       };
//     } catch (error) {
//       console.error('Error checking budget availability:', error);
//       return { available: false, message: 'Failed to check budget availability' };
//     }
//   }, [budgetCodes]);

//   // Handle budget code selection
//   const handleBudgetCodeChange = useCallback((budgetCodeId) => {
//     console.log('Budget code selected:', budgetCodeId);
//     setSelectedBudgetCode(budgetCodeId);
    
//     if (!budgetCodeId) {
//       setBudgetCodeDetails(null);
//       return;
//     }



//     const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//     if (budgetCode) {
//       console.log('Budget code details:', budgetCode);
      
//       const available = budgetCode.budget - budgetCode.used;
//       const utilizationRate = Math.round((budgetCode.used / budgetCode.budget) * 100);
//       const status = utilizationRate >= 90 ? 'critical' : 
//                     utilizationRate >= 75 ? 'high' : 
//                     utilizationRate >= 50 ? 'moderate' : 'low';
      
//       setBudgetCodeDetails({
//         code: budgetCode.code,
//         name: budgetCode.name,
//         department: budgetCode.department,
//         totalBudget: budgetCode.budget,
//         used: budgetCode.used,
//         available: available,
//         utilizationRate: utilizationRate,
//         status: status
//       });

//       if (budgetCode.budgetHolder) {
//         form.setFieldsValue({ budgetHolder: budgetCode.budgetHolder });
//       }

//       if (calculateTotalCost > 0 && calculateTotalCost > available) {
//         message.warning({
//           content: `Total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds available budget (XAF ${available.toLocaleString()})`,
//           duration: 5
//         });
//       } else if (calculateTotalCost > 0) {
//         message.success({
//           content: `Budget sufficient. Remaining after: XAF ${(available - calculateTotalCost).toLocaleString()}`,
//           duration: 3
//         });
//       }
//     }
//   }, [budgetCodes, calculateTotalCost, form]);

//   // Fetch database items
//   const fetchDatabaseItems = useCallback(async (categoryFilter = null) => {
//     try {
//       setLoadingItems(true);
//       setFetchError(null);
      
//       console.log('Fetching database items...', categoryFilter ? `for category: ${categoryFilter}` : 'all items');
      
//       const response = await itemAPI.getActiveItems(categoryFilter);
      
//       if (response.success && Array.isArray(response.data)) {
//         setDatabaseItems(response.data);
//         console.log(`Successfully loaded ${response.data.length} items`);
        
//         if (response.data.length > 0) {
//           message.success(`Loaded ${response.data.length} items from database`);
//         } else {
//           message.info('No items found for the selected criteria');
//         }
//       } else {
//         console.error('API returned invalid data:', response);
//         setDatabaseItems([]);
//         setFetchError(response.message || 'Failed to load item database');
//       }
//     } catch (error) {
//       console.error('Error fetching database items:', error);
//       setDatabaseItems([]);
//       setFetchError(error.message || 'Failed to connect to item database');
//     } finally {
//       setLoadingItems(false);
//     }
//   }, []);

//   // Fetch projects
//   const fetchProjects = useCallback(async () => {
//     try {
//       setLoadingProjects(true);
//       const response = await projectAPI.getActiveProjects();
      
//       if (response.success) {
//         setProjects(response.data);
//         console.log(`Loaded ${response.data.length} active projects`);
//       } else {
//         console.error('Failed to fetch projects:', response.message);
//         setProjects([]);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       setProjects([]);
//     } finally {
//       setLoadingProjects(false);
//     }
//   }, []);

//   // Fetch project budget info
//   const fetchProjectBudgetInfo = useCallback(async (projectId) => {
//     try {
//       const response = await projectAPI.getProjectById(projectId);
      
//       if (response.success) {
//         const project = response.data;
//         const budgetRemaining = project.budget.allocated - project.budget.spent;
        
//         setProjectBudgetInfo({
//           projectName: project.name,
//           projectCode: project.code,
//           budgetAllocated: project.budget.allocated,
//           budgetSpent: project.budget.spent,
//           budgetRemaining: budgetRemaining,
//           budgetUtilization: project.budgetUtilization,
//           budgetCode: project.budgetCode ? {
//             code: project.budgetCode.code,
//             name: project.budgetCode.name,
//             available: project.budgetCode.budget - project.budgetCode.used
//           } : null,
//           status: project.status,
//           priority: project.priority
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching project budget info:', error);
//       setProjectBudgetInfo(null);
//     }
//   }, []);

//   // Fetch suppliers
//   const fetchSuppliers = useCallback(async () => {
//     setLoadingSuppliers(true);
//     setSupplierError(null);
    
//     try {
//       console.log('🔍 Starting supplier fetch...');
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('Please login to continue');
//       }
      
//       const response = await supplierApiService.getAllSuppliers({ 
//         status: 'active',
//         limit: 100 
//       });
      
//       console.log('📦 Fetch response:', response);
      
//       if (response.success && Array.isArray(response.data)) {
//         setSuppliers(response.data);
//         console.log(`✅ Successfully loaded ${response.data.length} suppliers`);
        
//         if (response.data.length > 0) {
//           message.success(`Loaded ${response.data.length} active suppliers`);
//         } else {
//           message.info('No active suppliers found');
//         }
//       } else {
//         const errorMsg = response.message || 'Failed to load suppliers';
//         console.error('❌ Fetch failed:', errorMsg);
//         setSupplierError(errorMsg);
//         message.error(errorMsg);
//         setSuppliers([]);
//       }
      
//     } catch (error) {
//       console.error('💥 Error fetching suppliers:', error);
//       const errorMessage = error.message || 'Failed to load suppliers';
//       setSupplierError(errorMessage);
//       message.error(errorMessage);
//       setSuppliers([]);
//     } finally {
//       setLoadingSuppliers(false);
//     }
//   }, []);

//   // Form initialization - use useCallback with proper dependencies
//   const initializeForm = useCallback((isEditMode) => {
//     if (isEditMode && editData) {
//       const formData = {
//         ...editData,
//         expectedDate: editData.expectedDate ? moment(editData.expectedDate) : moment().add(14, 'days'),
//         date: editData.createdAt ? moment(editData.createdAt) : moment(),
//         project: editData.project,
//         budgetCode: editData.budgetCode
//       };
      
//       if (editData.preferredSupplier) {
//         if (editData.supplierId) {
//           setSupplierSelectionMode('database');
//           setSelectedSupplier(editData.supplierId);
//           formData.supplierId = editData.supplierId;
//         } else {
//           setSupplierSelectionMode('manual');
//           formData.preferredSupplierName = editData.preferredSupplier;
//         }
//       }
      
//       form.setFieldsValue(formData);
//       setItems(editData.items || []);
//       setSelectedProject(editData.project);
      
//       if (editData.budgetCode) {
//         const budgetCodeId = editData.budgetCode;
//         const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//         if (budgetCode) {
//           const available = budgetCode.budget - budgetCode.used;
//           const utilizationRate = Math.round((budgetCode.used / budgetCode.budget) * 100);
//           const status = utilizationRate >= 90 ? 'critical' : 
//                         utilizationRate >= 75 ? 'high' : 
//                         utilizationRate >= 50 ? 'moderate' : 'low';
          
//           setBudgetCodeDetails({
//             code: budgetCode.code,
//             name: budgetCode.name,
//             department: budgetCode.department,
//             totalBudget: budgetCode.budget,
//             used: budgetCode.used,
//             available: available,
//             utilizationRate: utilizationRate,
//             status: status
//           });
//         }
//       }
      
//       if (editData.attachments && editData.attachments.length > 0) {
//         const existingAttachments = editData.attachments.map((att, index) => ({
//           uid: att._id || `existing-${index}`,
//           name: att.name || att.fileName || 'Unknown File',
//           status: 'done',
//           url: att.url || att.downloadUrl,
//           size: att.size || 0,
//           type: att.mimetype || 'application/octet-stream',
//           existing: true,
//           publicId: att.publicId
//         }));
//         setAttachments(existingAttachments);
//       }
//     } else {
//       form.setFieldsValue({
//         requisitionNumber: generateRequisitionNumber(),
//         requesterName: user?.fullName || '',
//         department: user?.department || '',
//         date: moment(),
//         deliveryLocation: 'Office',
//         expectedDate: moment().add(14, 'days'),
//         urgency: 'Medium'
//       });
//     }
//   }, [editData, form, generateRequisitionNumber, user, budgetCodes]);

//   // Component initialization - FIXED: Remove initializeForm from dependencies
//   useEffect(() => {
//     console.log('Component mounted, fetching data...');
    
//     const initData = async () => {
//       try {
//         await Promise.all([
//           fetchProjects(),
//           fetchDatabaseItems(),
//           fetchSuppliers(),
//           fetchBudgetCodes()
//         ]);
        
//         // Initialize form after data is fetched
//         initializeForm(!!editData);
//       } catch (error) {
//         console.error('Error initializing component:', error);
//       }
//     };
    
//     initData();
    
//     // Cleanup function
//     return () => {
//       console.log('Component unmounting...');
//     };
//   }, []); // Empty dependency array - only run on mount

//   // Project selection effect
//   useEffect(() => {
//     if (selectedProject) {
//       fetchProjectBudgetInfo(selectedProject);
//     } else {
//       setProjectBudgetInfo(null);
//     }
//   }, [selectedProject]);

//   // Item management functions
//   const handleAddItem = useCallback(() => {
//     if (loadingItems) {
//       message.warning('Please wait while items are loading...');
//       return;
//     }
    
//     if (fetchError) {
//       message.error('Cannot add items: ' + fetchError);
//       return;
//     }
    
//     if (!databaseItems || databaseItems.length === 0) {
//       message.error('No items available in database. Please contact Supply Chain team.');
//       return;
//     }
    
//     setEditingItem(null);
//     setShowItemModal(true);
//     itemForm.resetFields();
//   }, [loadingItems, fetchError, databaseItems, itemForm]);

//   const handleEditItem = useCallback((item, index) => {
//     setEditingItem(index);
//     setShowItemModal(true);
//     itemForm.setFieldsValue({
//       itemId: item.itemId,
//       quantity: item.quantity,
//       projectName: item.projectName
//     });
//   }, [itemForm]);

//   const handleDeleteItem = useCallback((index) => {
//     const newItems = items.filter((_, i) => i !== index);
//     setItems(newItems);
//     message.success('Item removed successfully');
//   }, [items]);

//   // const handleItemModalOk = useCallback(async () => {
//   //   try {
//   //     const values = await itemForm.validateFields();
//   //     const selectedItem = databaseItems.find(item => 
//   //       (item._id || item.id) === values.itemId
//   //     );

//   //     if (!selectedItem) {
//   //       message.error('Please select a valid item from the database');
//   //       return;
//   //     }

//   //     const existingItemIndex = items.findIndex(item => 
//   //       item.itemId === (selectedItem._id || selectedItem.id)
//   //     );

//   //     const itemData = {
//   //       itemId: selectedItem._id || selectedItem.id,
//   //       code: selectedItem.code,
//   //       description: selectedItem.description,
//   //       category: selectedItem.category,
//   //       subcategory: selectedItem.subcategory,
//   //       quantity: values.quantity,
//   //       measuringUnit: selectedItem.unitOfMeasure || 'Pieces',
//   //       projectName: values.projectName || '',
//   //       estimatedPrice: selectedItem.standardPrice || 0
//   //     };

//   //     if (editingItem !== null) {
//   //       const newItems = [...items];
//   //       newItems[editingItem] = itemData;
//   //       setItems(newItems);
//   //       message.success('Item updated successfully');
//   //     } else if (existingItemIndex !== -1) {
//   //       Modal.confirm({
//   //         title: 'Item Already Added',
//   //         content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
//   //         onOk() {
//   //           const newItems = [...items];
//   //           newItems[existingItemIndex].quantity += values.quantity;
//   //           setItems(newItems);
//   //           message.success('Quantity updated successfully');
//   //         }
//   //       });
//   //     } else {
//   //       setItems(prev => [...prev, itemData]);
//   //       message.success('Item added successfully');
//   //     }

//   //     setShowItemModal(false);
//   //     itemForm.resetFields();
//   //   } catch (error) {
//   //     console.error('Validation failed:', error);
//   //     message.error('Failed to add item. Please try again.');
//   //   }
//   // }, [itemForm, databaseItems, items, editingItem]);


// //   const handleItemModalOk = useCallback(async () => {
// //   try {
// //     const values = await itemForm.validateFields();
// //     console.log('Item form values:', values); // Debug log
    
// //     const selectedItem = databaseItems.find(item => 
// //       (item._id || item.id) === values.itemId
// //     );

// //     console.log('Selected item from database:', selectedItem); // Debug log

// //     if (!selectedItem) {
// //       message.error('Please select a valid item from the database');
// //       return;
// //     }

// //     const existingItemIndex = items.findIndex(item => 
// //       item.itemId === (selectedItem._id || selectedItem.id)
// //     );

// //     const itemData = {
// //       itemId: selectedItem._id || selectedItem.id,
// //       code: selectedItem.code,
// //       description: selectedItem.description,
// //       category: selectedItem.category,
// //       subcategory: selectedItem.subcategory,
// //       quantity: values.quantity,
// //       measuringUnit: selectedItem.unitOfMeasure || 'Pieces',
// //       projectName: values.projectName || '',
// //       estimatedPrice: selectedItem.standardPrice || 0
// //     };

// //     console.log('Item data to add:', itemData); // Debug log

// //     if (editingItem !== null) {
// //       const newItems = [...items];
// //       newItems[editingItem] = itemData;
// //       setItems(newItems);
// //       console.log('Items after editing:', newItems); // Debug log
// //       message.success('Item updated successfully');
// //     } else if (existingItemIndex !== -1) {
// //       Modal.confirm({
// //         title: 'Item Already Added',
// //         content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
// //         onOk() {
// //           const newItems = [...items];
// //           newItems[existingItemIndex].quantity += values.quantity;
// //           setItems(newItems);
// //           console.log('Items after quantity update:', newItems); // Debug log
// //           message.success('Quantity updated successfully');
// //         }
// //       });
// //     } else {
// //       setItems(prev => {
// //         const updated = [...prev, itemData];
// //         console.log('Items after adding new item:', updated); // Debug log
// //         console.log('Updated items length:', updated.length); // Debug log
// //         return updated;
// //       });
// //       message.success('Item added successfully');
// //     }

// //     setShowItemModal(false);
// //     itemForm.resetFields();
// //     setEditingItem(null);
// //   } catch (error) {
// //     console.error('Validation failed:', error);
// //     message.error('Failed to add item. Please try again.');
// //   }
// // }, [itemForm, databaseItems, items, editingItem]);

//   const handleItemModalOk = useCallback(async () => {
//   try {
//     const values = await itemForm.validateFields();
//     console.log('Item form values:', values);
    
//     const selectedItem = databaseItems.find(item => 
//       (item._id || item.id) === values.itemId
//     );

//     console.log('Selected item from database:', selectedItem);

//     if (!selectedItem) {
//       message.error('Please select a valid item from the database');
//       return;
//     }

//     const existingItemIndex = items.findIndex(item => 
//       item.itemId === (selectedItem._id || selectedItem.id)
//     );

//     const itemData = {
//       itemId: selectedItem._id || selectedItem.id,
//       code: selectedItem.code,
//       description: selectedItem.description,
//       category: selectedItem.category,
//       subcategory: selectedItem.subcategory,
//       quantity: values.quantity,
//       measuringUnit: selectedItem.unitOfMeasure || 'Pieces',
//       projectName: values.projectName || '',
//       estimatedPrice: selectedItem.standardPrice || 0
//     };

//     console.log('Item data to add:', itemData);

//     if (editingItem !== null) {
//       const newItems = [...items];
//       newItems[editingItem] = itemData;
//       setItems(newItems);
//       console.log('Items after editing:', newItems);
//       message.success('Item updated successfully');
//       setShowItemModal(false);
//       itemForm.resetFields();
//       setEditingItem(null);
//     } else if (existingItemIndex !== -1) {
//       Modal.confirm({
//         title: 'Item Already Added',
//         content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
//         onOk() {
//           const newItems = [...items];
//           newItems[existingItemIndex].quantity += values.quantity;
//           setItems(newItems);
//           console.log('Items after quantity update:', newItems);
//           message.success('Quantity updated successfully');
//           setShowItemModal(false);
//           itemForm.resetFields();
//           setEditingItem(null);
//         },
//         onCancel() {
//           // Keep modal open if user cancels
//         }
//       });
//     } else {
//       // FIXED: Add new item and wait for state to update
//       setItems(prevItems => {
//         const updatedItems = [...prevItems, itemData];
//         console.log('Items after adding new item:', updatedItems);
//         console.log('Updated items length:', updatedItems.length);
        
//         // Close modal after state update in next tick
//         setTimeout(() => {
//           setShowItemModal(false);
//           itemForm.resetFields();
//           setEditingItem(null);
//         }, 0);
        
//         return updatedItems;
//       });
      
//       message.success('Item added successfully');
//     }
//   } catch (error) {
//     console.error('Validation failed:', error);
//     message.error('Failed to add item. Please try again.');
//   }
// }, [itemForm, databaseItems, items, editingItem]);


//   const handleRequestNewItem = useCallback(() => {
//     setShowRequestModal(true);
//     requestForm.resetFields();
//   }, [requestForm]);

//   const handleRequestModalOk = useCallback(async () => {
//     try {
//       const values = await requestForm.validateFields();

//       const requestData = {
//         ...values,
//         requestedBy: user?.fullName || user?.email,
//         department: user?.department || '',
//         requisitionId: form.getFieldValue('requisitionNumber')
//       };

//       const response = await itemAPI.requestNewItem(requestData);

//       if (response.success) {
//         message.success('Item request submitted to Supply Chain team. You will be notified when the item is available.');
//         setShowRequestModal(false);
//         requestForm.resetFields();
//       } else {
//         message.error(response.message || 'Failed to submit item request');
//       }
//     } catch (error) {
//       console.error('Request failed:', error);
//       message.error('Failed to submit item request');
//     }
//   }, [requestForm, user, form]);

//   // File upload handling
//   const handleAttachmentChange = useCallback(({ fileList }) => {
//   console.log('Attachment change:', fileList);
  
//   const processedFiles = fileList.map(file => {
//     if (file.existing) {
//       return file;
//     }
    
//     if (file.originFileObj && file.status !== 'removed') {
//       const validation = validateFile(file.originFileObj);
      
//       if (!validation.valid) {
//         message.error(validation.error);
//         return {
//           ...file,
//           status: 'error',
//           error: validation.error
//         };
//       }
      
//       // Store file reference immediately to prevent file system issues
//       return {
//         ...file,
//         status: file.status || 'done',
//         // Keep original file object reference
//         originFileObj: file.originFileObj
//       };
//     }
    
//     return file;
//   });

//   const validFiles = processedFiles.filter(file => 
//     file.status !== 'error' && file.status !== 'removed'
//   );
  
//   if (validFiles.length > MAX_FILES) {
//     message.error(`Maximum ${MAX_FILES} files allowed`);
//     return;
//   }

//   setAttachments(validFiles);
// }, [validateFile]);


//   // const customUploadRequest = useCallback(({ file, onSuccess, onError }) => {
//   //   setTimeout(() => {
//   //     onSuccess("ok");
//   //   }, 0);
//   // }, []);

//   const customUploadRequest = useCallback(({ file, onSuccess, onError }) => {
//     // Store file immediately to prevent ERR_UPLOAD_FILE_CHANGED
//     const fileData = {
//       uid: file.uid,
//       name: file.name,
//       status: 'done',
//       originFileObj: file,
//       type: file.type,
//       size: file.size
//     };
    
//     setTimeout(() => {
//       onSuccess("ok", fileData);
//     }, 0);
//   }, []);

//   const handleDownloadAttachment = useCallback(async (attachment) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required');
//         return;
//       }

//       let publicId = '';
//       if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           publicId = urlParts.slice(uploadIndex + 2).join('/');
//           const lastPart = publicId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             publicId = publicId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!publicId) {
//         message.error('Invalid attachment URL');
//         return;
//       }

//       const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
      
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       window.URL.revokeObjectURL(url);
      
//       message.success('File downloaded successfully');
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error('Failed to download attachment');
      
//       if (attachment.url) {
//         window.open(attachment.url, '_blank');
//       }
//     }
//   }, []);

//   // // Form submission
//   // const handleSubmit = useCallback(async (values) => {
//   //   if (items.length === 0) {
//   //     message.error('Please add at least one item to the requisition');
//   //     return;
//   //   }

//   //   if (!values.budgetCode || !selectedBudgetCode) {
//   //     message.error('Please select a budget code');
//   //     return;
//   //   }
//   // const handleSubmit = useCallback(async (values) => {
//   //   console.log('Form submitted with items:', items); // Debug log
//   //   console.log('Items length:', items.length); // Debug log
    
//   //   if (!items || items.length === 0) {
//   //     message.error('Please add at least one item to the requisition');
//   //     return;
//   //   }

//   //   if (!values.budgetCode || !selectedBudgetCode) {
//   //     message.error('Please select a budget code');
//   //     return;
//   //   }

//   //   if (selectedProject && projectBudgetInfo) {
//   //     if (calculateTotalCost > projectBudgetInfo.budgetRemaining) {
//   //       Modal.confirm({
//   //         title: 'Budget Warning',
//   //         content: `The total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds the remaining project budget (XAF ${projectBudgetInfo.budgetRemaining.toLocaleString()}). Do you want to continue?`,
//   //         onOk() {
//   //           checkBudgetAndSubmit(values);
//   //         }
//   //       });
//   //       return;
//   //     }
//   //   }

//   //   checkBudgetAndSubmit(values);
//   // }, [items, selectedProject, projectBudgetInfo, calculateTotalCost, selectedBudgetCode]);


//   const handleSubmit = useCallback(async (values) => {
//     console.log('Form submitted with items:', items);
//     console.log('Items length:', items.length);
    
//     if (!items || items.length === 0) {
//       message.error('Please add at least one item to the requisition');
//       return;
//     }

//     if (!values.budgetCode || !selectedBudgetCode) {
//       message.error('Please select a budget code');
//       return;
//     }

//     if (selectedProject && projectBudgetInfo) {
//       if (calculateTotalCost > projectBudgetInfo.budgetRemaining) {
//         Modal.confirm({
//           title: 'Budget Warning',
//           content: `The total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds the remaining project budget (XAF ${projectBudgetInfo.budgetRemaining.toLocaleString()}). Do you want to continue?`,
//           onOk() {
//             // FIXED: Pass items explicitly here
//             checkBudgetAndSubmit(values, items);
//           }
//         });
//         return;
//       }
//     }

//     // FIXED: Pass items explicitly here too
//     checkBudgetAndSubmit(values, items);
//   }, [items, selectedProject, projectBudgetInfo, calculateTotalCost, selectedBudgetCode]);


// const checkBudgetAndSubmit = useCallback(async (values, itemsToSubmit) => {
//   console.log('checkBudgetAndSubmit received items:', itemsToSubmit);
//   console.log('Items count:', itemsToSubmit?.length);
  
//   const budgetCheck = await checkBudgetCodeAvailability(values.budgetCode, calculateTotalCost);
  
//   if (!budgetCheck.available) {
//     Modal.error({
//       title: 'Insufficient Budget',
//       content: (
//         <div>
//           <p>The selected budget code does not have sufficient funds.</p>
//           <Divider />
//           <p><strong>Budget Code:</strong> {budgetCodeDetails?.code}</p>
//           <p><strong>Available:</strong> XAF {budgetCodeDetails?.available.toLocaleString()}</p>
//           <p><strong>Required:</strong> XAF {calculateTotalCost.toLocaleString()}</p>
//           <p><strong>Shortfall:</strong> XAF {(calculateTotalCost - budgetCodeDetails?.available).toLocaleString()}</p>
//           <Divider />
//           <p>Please select a different budget code or reduce items.</p>
//         </div>
//       ),
//       okText: 'Understood'
//     });
//     return;
//   }

//   Modal.confirm({
//     title: 'Confirm Submission',
//     content: (
//       <div>
//         <p><strong>Total Estimated Cost:</strong> XAF {calculateTotalCost.toLocaleString()}</p>
//         <p><strong>Budget Code:</strong> {budgetCodeDetails?.code}</p>
//         <p><strong>Available Budget:</strong> XAF {budgetCodeDetails?.available.toLocaleString()}</p>
//         <p><strong>Remaining After:</strong> XAF {(budgetCodeDetails?.available - calculateTotalCost).toLocaleString()}</p>
//         <Divider />
//         <p>Are you sure you want to submit this requisition?</p>
//       </div>
//     ),
//     onOk() {
//       // Pass the itemsToSubmit parameter through to submitRequisition
//       console.log('Confirming submission with items:', itemsToSubmit);
//       submitRequisition(values, itemsToSubmit);
//     }
//   });
// }, [calculateTotalCost, budgetCodeDetails, checkBudgetCodeAvailability]);

//   // const submitRequisition = useCallback(async (values, itemsToSubmit) => {


//   const submitRequisition = useCallback(async (values, itemsToSubmit) => {
//   setLoading(true);
//   try {
//     // FIXED: Add explicit validation and logging
//     console.log('submitRequisition called with:');
//     console.log('  - values:', values);
//     console.log('  - itemsToSubmit:', itemsToSubmit);
//     console.log('  - itemsToSubmit length:', itemsToSubmit?.length);
    
//     // CRITICAL: Validate items before creating FormData
//     if (!itemsToSubmit || !Array.isArray(itemsToSubmit) || itemsToSubmit.length === 0) {
//       message.error('No items to submit. Please add at least one item to the requisition.');
//       setLoading(false);
//       return;
//     }

//     const formData = new FormData();

//     formData.append('requisitionNumber', values.requisitionNumber);
//     formData.append('title', values.title);
//     formData.append('itemCategory', values.itemCategory);
//     formData.append('budgetXAF', values.budgetXAF || calculateTotalCost);
//     formData.append('budgetCode', values.budgetCode);
    
//     if (values.budgetHolder) {
//       formData.append('budgetHolder', values.budgetHolder);
//     }
    
//     formData.append('urgency', values.urgency);
//     formData.append('deliveryLocation', values.deliveryLocation);
//     formData.append('expectedDate', values.expectedDate.format('YYYY-MM-DD'));
//     formData.append('justificationOfPurchase', values.justificationOfPurchase);
//     formData.append('justificationOfPreferredSupplier', values.justificationOfPreferredSupplier || '');
    
//     if (supplierSelectionMode === 'database' && selectedSupplier) {
//       formData.append('supplierId', selectedSupplier);
//       const supplier = suppliers.find(s => s._id === selectedSupplier);
//       if (supplier) {
//         formData.append('preferredSupplier', supplier.supplierDetails?.companyName || supplier.fullName);
//       }
//     } else if (supplierSelectionMode === 'manual' && values.preferredSupplierName) {
//       formData.append('preferredSupplier', values.preferredSupplierName);
//     }
    
//     if (selectedProject) {
//       formData.append('project', selectedProject);
//     }

//     // FIXED: Ensure items are stringified correctly
//     const itemsJson = JSON.stringify(itemsToSubmit);
//     console.log('Items JSON being appended:', itemsJson);
//     console.log('Items JSON length:', itemsJson.length);
//     formData.append('items', itemsJson);

//     // FIXED: Log FormData contents for debugging
//     console.log('FormData contents:');
//     for (let pair of formData.entries()) {
//       console.log(pair[0] + ': ' + (pair[0] === 'items' ? pair[1] : pair[1].substring ? pair[1].substring(0, 50) : pair[1]));
//     }

//     const newAttachments = attachments.filter(att => !att.existing && att.originFileObj);
    
//     newAttachments.forEach((file, index) => {
//       console.log(`Adding file ${index + 1}:`, file.name);
//       formData.append('attachments', file.originFileObj);
//     });

//     const existingAttachmentIds = attachments
//       .filter(att => att.existing)
//       .map(att => att._id || att.uid);
    
//     if (existingAttachmentIds.length > 0) {
//       formData.append('existingAttachments', JSON.stringify(existingAttachmentIds));
//     }

//     console.log('Submitting requisition with', newAttachments.length, 'new files and', itemsToSubmit.length, 'items...');

//     const response = await purchaseRequisitionAPI.createRequisition(formData);

//     if (response.success) {
//       message.success('Purchase requisition submitted successfully!');
      
//       if (response.attachments) {
//         const { uploaded, total } = response.attachments;
//         if (uploaded < total) {
//           message.warning(`${uploaded} out of ${total} attachments uploaded successfully`);
//         } else if (uploaded > 0) {
//           message.success(`All ${uploaded} attachments uploaded successfully`);
//         }
//       }
      
//       if (onSubmit) {
//         onSubmit(response.data);
//       }
//     } else {
//       message.error(response.message || 'Failed to submit requisition');
//     }

//   } catch (error) {
//     console.error('Error submitting requisition:', error);
    
//     if (error.response?.data?.message) {
//       message.error(error.response.data.message);
//     } else {
//       message.error('Failed to submit requisition. Please try again.');
//     }
//   } finally {
//     setLoading(false);
//   }
// }, [attachments, selectedProject, suppliers, selectedSupplier, supplierSelectionMode, calculateTotalCost, onSubmit]);


//   const handleSaveDraft = useCallback(async () => {
//     try {
//       const values = await form.getFieldsValue();
//       const draftData = {
//         ...values,
//         expectedDate: values.expectedDate ? values.expectedDate.format('YYYY-MM-DD') : moment().add(14, 'days').format('YYYY-MM-DD'),
//         items,
//         project: selectedProject,
//         budgetCode: selectedBudgetCode,
//         status: 'draft',
//         lastSaved: new Date(),
//         totalEstimatedCost: calculateTotalCost
//       };

//       const response = await purchaseRequisitionAPI.saveDraft(draftData);

//       if (response.success) {
//         message.success('Draft saved successfully!');
//         if (onSaveDraft) {
//           onSaveDraft(response.data);
//         }
//       } else {
//         message.error(response.message || 'Failed to save draft');
//       }
//     } catch (error) {
//       console.error('Error saving draft:', error);
//       message.error('Failed to save draft');
//     }
//   }, [form, items, selectedProject, selectedBudgetCode, calculateTotalCost, onSaveDraft]);

//   // Render functions
//   const renderBudgetCodeSelection = () => (
//     <Card 
//       size="small" 
//       title={
//         <Space>
//           <TagOutlined />
//           Budget Code Selection (Required)
//         </Space>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       <Alert
//         message="Budget Code Required"
//         description="You must select a budget code before submitting. The system will verify that sufficient budget is available."
//         type="info"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={16}>
//           <Form.Item
//             name="budgetCode"
//             label="Select Budget Code"
//             rules={[{ required: true, message: 'Budget code is required' }]}
//             help="Choose the budget code that will fund this purchase"
//           >
//             <Select
//               placeholder={
//                 loadingBudgetCodes 
//                   ? "Loading budget codes..." 
//                   : budgetCodes.length === 0 
//                     ? "No budget codes available"
//                     : "Select a budget code"
//               }
//               loading={loadingBudgetCodes}
//               disabled={loadingBudgetCodes || budgetCodes.length === 0}
//               showSearch
//               allowClear
//               onChange={handleBudgetCodeChange}
//               value={selectedBudgetCode}
//               optionFilterProp="children"
//               filterOption={(input, option) => {
//                 if (!input) return true;
//                 const code = budgetCodes.find(bc => bc._id === option.value);
//                 if (!code) return false;
//                 const searchStr = `${code.code} ${code.name} ${code.department}`.toLowerCase();
//                 return searchStr.includes(input.toLowerCase());
//               }}
//               notFoundContent={
//                 loadingBudgetCodes ? (
//                   <div style={{ textAlign: 'center', padding: '20px' }}>
//                     <Spin size="small" />
//                     <div><Text type="secondary">Loading budget codes...</Text></div>
//                   </div>
//                 ) : (
//                   <div style={{ textAlign: 'center', padding: '20px' }}>
//                     <Text type="secondary">No budget codes available</Text>
//                   </div>
//                 )
//               }
//             >
//               {budgetCodes.map(code => {
//                 const available = code.budget - code.used;
//                 const utilizationRate = Math.round((code.used / code.budget) * 100);
//                 const status = utilizationRate >= 90 ? 'critical' : 
//                              utilizationRate >= 75 ? 'high' : 
//                              utilizationRate >= 50 ? 'moderate' : 'low';
                
//                 return (
//                   <Option key={code._id} value={code._id}>
//                     <div style={{ padding: '4px 0' }}>
//                       <div>
//                         <Text strong>{code.code}</Text> - {code.name}
//                       </div>
//                       <div style={{ marginTop: '4px' }}>
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                           {code.department} | Available: XAF {available.toLocaleString()}
//                           {' '}
//                           <Tag 
//                             color={
//                               status === 'critical' ? 'red' :
//                               status === 'high' ? 'orange' :
//                               status === 'moderate' ? 'blue' : 'green'
//                             }
//                             style={{ marginLeft: '4px' }}
//                           >
//                             {utilizationRate}% used
//                           </Tag>
//                         </Text>
//                       </div>
//                     </div>
//                   </Option>
//                 );
//               })}
//             </Select>
//           </Form.Item>
//         </Col>
        
//         <Col xs={24} md={8}>
//           <Form.Item label=" ">
//             <Button 
//               icon={<ReloadOutlined />} 
//               onClick={fetchBudgetCodes}
//               loading={loadingBudgetCodes}
//               block
//             >
//               Refresh Codes
//             </Button>
//           </Form.Item>
//         </Col>
//       </Row>

//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="title"
//             label="Title"
//             rules={[{ required: true, message: 'Please enter requisition title' }]}
//           >
//             <Input placeholder="Purchase of IT accessories - Safety Stock" />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="deliveryLocation"
//             label="Delivery Location"
//             rules={[{ required: true, message: 'Please enter delivery location' }]}
//           >
//             <Input placeholder="Office" />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="expectedDate"
//             label="Expected Date"
//             rules={[{ required: true, message: 'Please select expected delivery date' }]}
//           >
//             <DatePicker style={{ width: '100%' }} />
//           </Form.Item>
//         </Col>
//       </Row>

//       {budgetCodeDetails && (
//         <Alert
//           message={
//             <Space>
//               <CheckCircleOutlined style={{ color: '#52c41a' }} />
//               <Text strong>Budget Code Selected: {budgetCodeDetails.code}</Text>
//             </Space>
//           }
//           description={
//             <div>
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Code">
//                   <Text code strong>{budgetCodeDetails.code}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Name">
//                   {budgetCodeDetails.name}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Department">
//                   <Tag color="blue">{budgetCodeDetails.department}</Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Total Budget">
//                   <Text strong>XAF {budgetCodeDetails.totalBudget.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Used">
//                   <Text>XAF {budgetCodeDetails.used.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Available">
//                   <Text strong style={{ color: '#52c41a' }}>
//                     XAF {budgetCodeDetails.available.toLocaleString()}
//                   </Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Utilization" span={2}>
//                   <Progress 
//                     percent={budgetCodeDetails.utilizationRate} 
//                     size="small"
//                     status={
//                       budgetCodeDetails.status === 'critical' ? 'exception' :
//                       budgetCodeDetails.status === 'high' ? 'normal' : 'success'
//                     }
//                   />
//                 </Descriptions.Item>
//               </Descriptions>
              
//               {calculateTotalCost > 0 && (
//                 <div style={{ 
//                   marginTop: '12px', 
//                   padding: '12px', 
//                   backgroundColor: budgetCodeDetails.available >= calculateTotalCost ? '#f6ffed' : '#fff2e8', 
//                   borderRadius: '4px',
//                   border: `1px solid ${budgetCodeDetails.available >= calculateTotalCost ? '#b7eb8f' : '#ffbb96'}`
//                 }}>
//                   <Row gutter={16}>
//                     <Col span={12}>
//                       <Text strong>Estimated Cost: </Text>
//                       <Text style={{ color: '#1890ff' }}>XAF {calculateTotalCost.toLocaleString()}</Text>
//                     </Col>
//                     <Col span={12}>
//                       <Text strong>Remaining After: </Text>
//                       <Text style={{ 
//                         color: budgetCodeDetails.available >= calculateTotalCost ? '#52c41a' : '#ff4d4f',
//                         fontWeight: 'bold'
//                       }}>
//                         XAF {(budgetCodeDetails.available - calculateTotalCost).toLocaleString()}
//                       </Text>
//                     </Col>
//                   </Row>
                  
//                   {budgetCodeDetails.available < calculateTotalCost ? (
//                     <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #ffbb96' }}>
//                       <Space>
//                         <WarningOutlined style={{ color: '#ff4d4f' }} />
//                         <Text type="danger" strong>
//                           Insufficient budget! Please select a different budget code or reduce items.
//                         </Text>
//                       </Space>
//                     </div>
//                   ) : (
//                     <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #b7eb8f' }}>
//                       <Space>
//                         <CheckCircleOutlined style={{ color: '#52c41a' }} />
//                         <Text style={{ color: '#52c41a' }} strong>
//                           Sufficient budget available for this requisition
//                         </Text>
//                       </Space>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           }
//           type={
//             calculateTotalCost > 0 && budgetCodeDetails.available < calculateTotalCost 
//               ? "warning" 
//               : "success"
//           }
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}

//       {!loadingBudgetCodes && budgetCodes.length === 0 && (
//         <Alert
//           message="No Budget Codes Available"
//           description="There are no active budget codes available. Please contact the Finance team to create budget codes before submitting requisitions."
//           type="error"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
//     </Card>
//   );

//   const renderRequisitionInfo = () => (
//     <Card size="small" title="Requisition Information" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="requisitionNumber"
//             label="Requisition Number"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="date"
//             label="Date"
//           >
//             <DatePicker
//               disabled
//               style={{ width: '100%' }}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="urgency"
//             label="Urgency"
//             rules={[{ required: true, message: 'Please select urgency level' }]}
//           >
//             <Select>
//               {URGENCY_OPTIONS.map(option => (
//                 <Option key={option.value} value={option.value}>
//                   <Tag color={option.color}>{option.value}</Tag>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderRequesterDetails = () => (
//     <Card size="small" title="Requester Details" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="requesterName"
//             label="Requester Name"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="department"
//             label="Department"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="itemCategory"
//             label="Primary Item Category"
//             rules={[{ required: true, message: 'Please select primary category' }]}
//           >
//             <Select 
//               placeholder="Select primary category"
//               onChange={(value) => {
//                 console.log('Category selected:', value);
//                 if (value && value !== 'all') {
//                   fetchDatabaseItems(value);
//                 } else {
//                   fetchDatabaseItems();
//                 }
//               }}
//             >
//               <Option value="all">All Categories</Option>
//               {ITEM_CATEGORIES.map(category => (
//                 <Option key={category} value={category}>
//                   {category}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   // const renderBudgetInfo = () => (
//   //   <Card size="small" title="Budget Information" style={{ marginBottom: '24px' }}>
//   //     <Row gutter={[16, 16]} align="middle">
//   //       <Col xs={24} md={12}>
//   //         <Form.Item
//   //           name="budgetXAF"
//   //           label="Budget (XAF)"
//   //           help="Enter estimated budget in Central African Francs"
//   //         >
//   //           <InputNumber
//   //             style={{ width: '100%' }}
//   //             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//   //             parser={value => value.replace(/\$\s?|(,)/g, '')}
//   //             placeholder="Enter budget amount"
//   //             addonBefore={<DollarOutlined />}
//   //           />
//   //         </Form.Item>
//   //       </Col>
//   //       <Col xs={24} md={12}>
//   //         <Alert
//   //           message={`Estimated Total: ${calculateTotalCost.toLocaleString()} XAF`}
//   //           description={
//   //             calculateTotalCost > 0 
//   //               ? `Based on ${items.length} selected items with known prices` 
//   //               : "Add items to see estimated cost"
//   //           }
//   //           type="info"
//   //           showIcon
//   //         />
//   //       </Col>
//   //     </Row>
//   //   </Card>
//   // );


//   const renderBudgetInfo = () => {
//     const itemsTotal = items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
//     const isManualBudget = manualBudget !== null && manualBudget > 0;
    
//     return (
//       <Card size="small" title="Budget Information" style={{ marginBottom: '24px' }}>
//         <Row gutter={[16, 16]} align="middle">
//           <Col xs={24} md={12}>
//             <Form.Item
//               name="budgetXAF"
//               label="Budget (XAF)"
//               help="Enter estimated budget in Central African Francs (overrides calculated total)"
//             >
//               <InputNumber
//                 style={{ width: '100%' }}
//                 formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                 parser={value => value.replace(/\$\s?|(,)/g, '')}
//                 placeholder="Enter budget amount"
//                 addonBefore={<DollarOutlined />}
//                 onChange={(value) => {
//                   setManualBudget(value);
//                   // Recalculate budget details if budget code is selected
//                   if (selectedBudgetCode && value) {
//                     handleBudgetCodeChange(selectedBudgetCode);
//                   }
//                 }}
//               />
//             </Form.Item>
//           </Col>
//           <Col xs={24} md={12}>
//             <Alert
//               message={
//                 <div>
//                   <div style={{ marginBottom: '8px' }}>
//                     <Text strong>Total Estimated Cost: </Text>
//                     <Text style={{ fontSize: '18px', color: '#1890ff' }}>
//                       {calculateTotalCost.toLocaleString()} XAF
//                     </Text>
//                   </div>
//                   {isManualBudget && itemsTotal > 0 && (
//                     <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
//                       (Items total: {itemsTotal.toLocaleString()} XAF - Manual override applied)
//                     </div>
//                   )}
//                 </div>
//               }
//               description={
//                 isManualBudget 
//                   ? "Using manually entered budget amount"
//                   : calculateTotalCost > 0 
//                     ? `Based on ${items.length} selected items with known prices` 
//                     : "Add items or enter budget amount manually"
//               }
//               type={isManualBudget ? "warning" : "info"}
//               showIcon
//             />
//           </Col>
//         </Row>
//       </Card>
//     );
//   };

//   const renderProjectAndSupplierSelection = useCallback(() => (
//     <Card 
//       size="small" 
//       title={
//         <Space>
//           <ProjectOutlined />
//           Project Assignment & Preferred Supplier (Optional)
//         </Space>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="project"
//             label="Assign to Project"
//             help="Select a project to associate this requisition with (optional)"
//           >
//             <Select
//               placeholder="Select project (optional)"
//               allowClear
//               showSearch
//               loading={loadingProjects}
//               onChange={(value) => setSelectedProject(value)}
//               filterOption={(input, option) => {
//                 const project = projects.find(p => p._id === option.value);
//                 return project && (
//                   project.name.toLowerCase().includes(input.toLowerCase()) ||
//                   project.code.toLowerCase().includes(input.toLowerCase())
//                 );
//               }}
//             >
//               {projects.map(project => (
//                 <Option key={project._id} value={project._id}>
//                   <div>
//                     <Text strong>{project.code}</Text> - {project.name}
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       {project.projectType} | {project.priority} Priority | {project.status}
//                     </Text>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
        
//         <Col xs={24} md={12}>
//           <Form.Item
//             label="Supplier Selection Method"
//             help="Choose whether to select from registered suppliers or enter a new supplier name"
//           >
//             <Radio.Group 
//               value={supplierSelectionMode} 
//               onChange={(e) => {
//                 setSupplierSelectionMode(e.target.value);
//                 setSelectedSupplier(null);
//                 form.setFieldsValue({ 
//                   supplierId: undefined, 
//                   preferredSupplierName: undefined 
//                 });
//               }}
//             >
//               <Radio value="database">
//                 <Space>
//                   <DatabaseOutlined />
//                   Database ({suppliers.length})
//                 </Space>
//               </Radio>
//               <Radio value="manual">
//                 <Space>
//                   <EditOutlined />
//                   Manual Entry
//                 </Space>
//               </Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//       </Row>

//       {supplierError && (
//         <Alert
//           message="Supplier Loading Error"
//           description={supplierError}
//           type="error"
//           showIcon
//           closable
//           onClose={() => setSupplierError(null)}
//           action={
//             <Button size="small" onClick={fetchSuppliers} icon={<ReloadOutlined />}>
//               Retry
//             </Button>
//           }
//           style={{ marginBottom: '16px' }}
//         />
//       )}

//       <Row gutter={[16, 16]}>
//         {supplierSelectionMode === 'database' ? (
//           <>
//             <Col xs={24} md={20}>
//               <Form.Item
//                 name="supplierId"
//                 label="Select Supplier"
//                 help="Choose from registered and approved suppliers"
//               >
//                 <Select
//                   placeholder={
//                     loadingSuppliers 
//                       ? "Loading suppliers..." 
//                       : suppliers.length === 0 
//                         ? "No suppliers available"
//                         : "Search and select a supplier"
//                   }
//                   allowClear
//                   showSearch
//                   loading={loadingSuppliers}
//                   disabled={loadingSuppliers || suppliers.length === 0}
//                   onChange={(value) => setSelectedSupplier(value)}
//                   filterOption={(input, option) => {
//                     const supplier = suppliers.find(s => s._id === option.value);
//                     if (!supplier) return false;
                    
//                     const companyName = supplier.supplierDetails?.companyName || '';
//                     const fullName = supplier.fullName || '';
//                     const email = supplier.email || '';
//                     const supplierType = supplier.supplierDetails?.supplierType || '';
                    
//                     const searchStr = `${companyName} ${fullName} ${email} ${supplierType}`.toLowerCase();
//                     return searchStr.includes(input.toLowerCase());
//                   }}
//                   notFoundContent={
//                     loadingSuppliers ? (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Spin size="small" />
//                         <div><Text type="secondary">Loading suppliers...</Text></div>
//                       </div>
//                     ) : supplierError ? (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Text type="danger">Error: {supplierError}</Text>
//                         <div style={{ marginTop: '8px' }}>
//                           <Button size="small" type="primary" onClick={fetchSuppliers}>
//                             Retry
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Text type="secondary">No suppliers found</Text>
//                       </div>
//                     )
//                   }
//                 >
//                   {suppliers.map(supplier => (
//                     <Option key={supplier._id} value={supplier._id}>
//                       <div>
//                         <Text strong>
//                           {supplier.supplierDetails?.companyName || supplier.fullName}
//                         </Text>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                           {supplier.supplierDetails?.supplierType && (
//                             <Tag size="small" color="blue">
//                               {supplier.supplierDetails.supplierType}
//                             </Tag>
//                           )}
//                           {supplier.email}
//                           {supplier.supplierDetails?.phoneNumber && 
//                             ` | ${supplier.supplierDetails.phoneNumber}`
//                           }
//                         </Text>
//                       </div>
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={4}>
//               <Form.Item label=" ">
//                 <Button 
//                   icon={<ReloadOutlined />} 
//                   onClick={fetchSuppliers}
//                   loading={loadingSuppliers}
//                   block
//                 >
//                   Refresh
//                 </Button>
//               </Form.Item>
//             </Col>
//           </>
//         ) : (
//           <Col xs={24} md={24}>
//             <Form.Item
//               name="preferredSupplierName"
//               label="Supplier Name"
//               help="Enter the name of the supplier (not yet registered in the system)"
//               rules={[
//                 { 
//                   min: 2, 
//                   message: 'Supplier name must be at least 2 characters' 
//                 }
//               ]}
//             >
//               <Input 
//                 placeholder="Enter supplier company name or full name"
//                 prefix={<ShopOutlined />}
//               />
//             </Form.Item>
//           </Col>
//         )}
//       </Row>

//       {projectBudgetInfo && (
//         <Alert
//           message="Project Budget Information"
//           description={
//             <div>
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Project">
//                   <Text strong>{projectBudgetInfo.projectCode}</Text> - {projectBudgetInfo.projectName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status">
//                   <Tag color={
//                     projectBudgetInfo.status === 'In Progress' ? 'green' :
//                     projectBudgetInfo.status === 'Planning' ? 'blue' :
//                     projectBudgetInfo.status === 'Completed' ? 'purple' : 'orange'
//                   }>
//                     {projectBudgetInfo.status}
//                   </Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Total Budget">
//                   <Text>XAF {projectBudgetInfo.budgetAllocated.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Remaining Budget">
//                   <Text style={{ 
//                     color: projectBudgetInfo.budgetRemaining < calculateTotalCost ? '#f5222d' : '#52c41a' 
//                   }}>
//                     XAF {projectBudgetInfo.budgetRemaining.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Budget Utilization">
//                   <Text>{projectBudgetInfo.budgetUtilization}%</Text>
//                 </Descriptions.Item>
//                 {projectBudgetInfo.budgetCode && (
//                   <Descriptions.Item label="Budget Code">
//                     <Tag color="gold">
//                       {projectBudgetInfo.budgetCode.code} 
//                       (Available: XAF {projectBudgetInfo.budgetCode.available.toLocaleString()})
//                     </Tag>
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//               {calculateTotalCost > projectBudgetInfo.budgetRemaining && (
//                 <div style={{ marginTop: '8px' }}>
//                   <Text type="danger">
//                     <ExclamationCircleOutlined /> Warning: Estimated cost exceeds remaining project budget
//                   </Text>
//                 </div>
//               )}
//             </div>
//           }
//           type={calculateTotalCost > (projectBudgetInfo?.budgetRemaining || 0) ? "warning" : "info"}
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}

//       {selectedSupplier && supplierSelectionMode === 'database' && (
//         <Alert
//           message="Selected Supplier Details"
//           description={(() => {
//             const supplier = suppliers.find(s => s._id === selectedSupplier);
//             return supplier ? (
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Company">
//                   <Text strong>{supplier.supplierDetails?.companyName || supplier.fullName}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Contact">
//                   {supplier.supplierDetails?.contactName || supplier.fullName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Email">
//                   {supplier.email}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Phone">
//                   {supplier.supplierDetails?.phoneNumber || 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Type">
//                   <Tag color="blue">
//                     {supplier.supplierDetails?.supplierType || 'N/A'}
//                   </Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status">
//                   <Tag color={supplier.status === 'active' ? 'green' : 'orange'}>
//                     {supplier.status || 'N/A'}
//                   </Tag>
//                 </Descriptions.Item>
//                 {supplier.supplierDetails?.address && (
//                   <Descriptions.Item label="Address" span={2}>
//                     {supplier.supplierDetails.address}
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//             ) : null;
//           })()}
//           type="info"
//           style={{ marginTop: '16px' }}
//         />
//       )}

//       {loadingProjects && !selectedProject && (
//         <Alert
//           message="Loading Projects"
//           description="Please wait while we load available projects..."
//           type="info"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
      
//       {!loadingProjects && projects.length === 0 && (
//         <Alert
//           message="No Active Projects"
//           description="No active projects found. You can still create the requisition without assigning it to a project."
//           type="info"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
//     </Card>
//   ), [
//     loadingProjects,
//     loadingSuppliers,
//     projects,
//     suppliers,
//     supplierSelectionMode,
//     selectedSupplier,
//     supplierError,
//     projectBudgetInfo,
//     calculateTotalCost,
//     form,
//     fetchSuppliers
//   ]);

//   const renderAttachments = () => (
//     <Card size="small" title="Attachments (Optional)" style={{ marginBottom: '24px' }}>
//       <Form.Item
//         name="attachments"
//         label="Upload Supporting Documents"
//         help={`Maximum ${MAX_FILES} files. Each file max ${MAX_FILE_SIZE / (1024 * 1024)}MB. Accepted: ${ALLOWED_FILE_TYPES.join(', ')}`}
//       >
//         <Dragger
//           multiple
//           fileList={attachments}
//           onChange={handleAttachmentChange}
//           customRequest={customUploadRequest}
//           beforeUpload={(file) => {
//             const validation = validateFile(file);
//             if (!validation.valid) {
//               message.error(validation.error);
//               return false;
//             }
//             return true;
//           }}
//           onRemove={(file) => {
//             console.log('Removing file:', file.name);
//             return true;
//           }}
//           accept={ALLOWED_FILE_TYPES.join(',')}
//           maxCount={MAX_FILES}
//           showUploadList={{
//             showPreviewIcon: true,
//             showRemoveIcon: true,
//             showDownloadIcon: false
//           }}
//           onPreview={(file) => {
//             if (file.existing && file.url) {
//               handleDownloadAttachment(file);
//             } else if (file.originFileObj) {
//               const url = URL.createObjectURL(file.originFileObj);
//               window.open(url, '_blank');
//             }
//           }}
//         >
//           <p className="ant-upload-drag-icon">
//             <InboxOutlined />
//           </p>
//           <p className="ant-upload-text">Click or drag files to this area to upload</p>
//           <p className="ant-upload-hint">
//             Support for single or bulk upload. Maximum {MAX_FILES} files, each up to {MAX_FILE_SIZE / (1024 * 1024)}MB.
//             <br />
//             Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT, CSV
//           </p>
//         </Dragger>
//       </Form.Item>
      
//       {attachments.length > 0 && (
//         <div style={{ marginTop: '16px' }}>
//           <Text strong>Attached Files ({attachments.length}/{MAX_FILES}):</Text>
//           <div style={{ marginTop: '8px' }}>
//             {attachments.map((file, index) => (
//               <div key={file.uid || index} style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 padding: '4px 0',
//                 borderBottom: '1px solid #f0f0f0'
//               }}>
//                 <FileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//                 <div style={{ flex: 1 }}>
//                   <Text>{file.name}</Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
//                     {file.existing && ' (Existing file)'}
//                   </Text>
//                 </div>
//                 <Space>
//                   {file.existing && file.url && (
//                     <Button 
//                       size="small" 
//                       type="link"
//                       icon={<EyeOutlined />}
//                       onClick={() => handleDownloadAttachment(file)}
//                     >
//                       Preview
//                     </Button>
//                   )}
//                   <Button 
//                     size="small" 
//                     type="link"
//                     danger
//                     icon={<DeleteOutlined />}
//                     onClick={() => {
//                       const newAttachments = attachments.filter((_, i) => i !== index);
//                       setAttachments(newAttachments);
//                     }}
//                   >
//                     Remove
//                   </Button>
//                 </Space>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </Card>
//   );

//   // Table columns
//   const itemColumns = useMemo(() => [
//     {
//       title: 'Code',
//       dataIndex: 'code',
//       key: 'code',
//       width: '10%',
//       render: (code) => <Text code>{code}</Text>
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       width: '30%',
//       render: (description, record) => (
//         <div>
//           <div>
//             <Text strong>{description}</Text>
//           </div>
//           <div>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               {record.category} - {record.subcategory}
//             </Text>
//           </div>
//         </div>
//       )
//     },
//     {
//       title: 'Quantity',
//       dataIndex: 'quantity',
//       key: 'quantity',
//       width: '10%',
//       align: 'center'
//     },
//     {
//       title: 'Unit',
//       dataIndex: 'measuringUnit',
//       key: 'measuringUnit',
//       width: '10%',
//       align: 'center'
//     },
//     {
//       title: 'Est. Price (XAF)',
//       dataIndex: 'estimatedPrice',
//       key: 'estimatedPrice',
//       width: '15%',
//       align: 'right',
//       render: (price, record) => {
//         const total = price * record.quantity;
//         return (
//           <div>
//             <div>
//               <Text strong>{total ? total.toLocaleString() : 'TBD'}</Text>
//             </div>
//             {price > 0 && (
//               <div>
//                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                   {price.toLocaleString()} each
//                 </Text>
//               </div>
//             )}
//           </div>
//         );
//       }
//     },
//     {
//       title: 'Project',
//       dataIndex: 'projectName',
//       key: 'projectName',
//       width: '15%'
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: '10%',
//       render: (_, record, index) => (
//         <Space>
//           <Button
//             size="small"
//             type="link"
//             onClick={() => handleEditItem(record, index)}
//             icon={<EditOutlined />}
//           />
//           <Button
//             size="small"
//             type="link"
//             danger
//             onClick={() => handleDeleteItem(index)}
//             icon={<DeleteOutlined />}
//           />
//         </Space>
//       )
//     }
//   ], [handleEditItem, handleDeleteItem]);

//   const renderHeader = () => (
//     <div style={{ marginBottom: '24px' }}>
//       <Title level={3} style={{ margin: 0 }}>
//         <ShoppingCartOutlined style={{ marginRight: '8px' }} />
//         {editData ? 'Update Purchase Requisition' : 'New Purchase Requisition'}
//       </Title>
//       <Text type="secondary">
//         {editData ? 'Update your purchase requisition' : 'Create a new purchase requisition using approved items and optionally assign to a project'}
//       </Text>
//     </div>
//   );

//   const renderDatabaseAlert = () => (
//     <Alert
//       message={
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span>
//             Items must be selected from the pre-approved database managed by the Supply Chain team. 
//             {loadingItems ? ' Loading items...' : ` ${databaseItems.length} items available.`}
//             {fetchError && ' (Error loading items)'}
//           </span>
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               onClick={handleRequestNewItem}
//               disabled={loadingItems}
//             >
//               Request New Item
//             </Button>
//             <Button
//               size="small"
//               icon={<ReloadOutlined />}
//               onClick={() => {
//                 const selectedCategory = form.getFieldValue('itemCategory');
//                 fetchDatabaseItems(selectedCategory);
//               }}
//               loading={loadingItems}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>
//       }
//       type={fetchError ? "error" : loadingItems ? "info" : "success"}
//       showIcon
//       icon={<DatabaseOutlined />}
//       style={{ marginBottom: '24px' }}
//     />
//   );

//   const renderItemsSection = () => (
//     <Card 
//       size="small" 
//       title={
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span>
//             <DatabaseOutlined /> Selected Items ({items.length})
//           </span>
//           <Space>
//             {calculateTotalCost > 0 && (
//               <Text type="secondary">
//                 Total Est. Cost: <Text strong style={{ color: '#1890ff' }}>{calculateTotalCost.toLocaleString()} XAF</Text>
//               </Text>
//             )}
//             <Button 
//               type="primary" 
//               icon={<PlusOutlined />}
//               onClick={handleAddItem}
//               loading={loadingItems}
//               disabled={fetchError || databaseItems.length === 0}
//             >
//               Add from Database
//             </Button>
//           </Space>
//         </div>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       {loadingItems ? (
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px' }}>
//             <Text>Loading item database...</Text>
//           </div>
//         </div>
//       ) : fetchError ? (
//         <Alert
//           message="Item Database Error"
//           description={fetchError}
//           type="error"
//           showIcon
//           action={
//             <Button size="small" onClick={() => {
//               const selectedCategory = form.getFieldValue('itemCategory');
//               fetchDatabaseItems(selectedCategory);
//             }} icon={<ReloadOutlined />}>
//               Retry
//             </Button>
//           }
//         />
//       ) : databaseItems.length === 0 ? (
//         <Alert
//           message="No Items Available"
//           description="No items found in the database. Please contact the Supply Chain team to add items to the database."
//           type="warning"
//           showIcon
//           action={
//             <Button size="small" onClick={() => {
//               const selectedCategory = form.getFieldValue('itemCategory');
//               fetchDatabaseItems(selectedCategory);
//             }} icon={<ReloadOutlined />}>
//               Refresh
//             </Button>
//           }
//         />
//       ) : items.length === 0 ? (
//         <Alert
//           message="No items selected yet"
//           description={`Choose from ${databaseItems.length} approved items in the database by clicking "Add from Database"`}
//           type="info"
//           showIcon
//           action={
//             <Button 
//               type="primary" 
//               size="small" 
//               icon={<PlusOutlined />}
//               onClick={handleAddItem}
//             >
//               Add First Item
//             </Button>
//           }
//         />
//       ) : (
//         <Table
//           columns={itemColumns}
//           dataSource={items}
//           pagination={false}
//           rowKey={(record, index) => index}
//           size="small"
//           scroll={{ x: 800 }}
//           summary={() => (
//             <Table.Summary.Row>
//               <Table.Summary.Cell index={0} colSpan={4}>
//                 <Text strong>Total Estimated Cost:</Text>
//               </Table.Summary.Cell>
//               <Table.Summary.Cell index={4}>
//                 <Text strong style={{ color: '#1890ff' }}>
//                   {calculateTotalCost.toLocaleString()} XAF
//                 </Text>
//               </Table.Summary.Cell>
//               <Table.Summary.Cell index={5} colSpan={2} />
//             </Table.Summary.Row>
//           )}
//         />
//       )}
//     </Card>
//   );

//   const renderJustifications = () => (
//     <Card size="small" title="Justifications" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="justificationOfPurchase"
//             label="Justification for Purchase"
//             rules={[{ required: true, message: 'Please provide justification' }]}
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain why these items are needed..."
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="justificationOfPreferredSupplier"
//             label="Justification of Preferred Supplier (Optional)"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain why you prefer a specific supplier (if any)"
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderActionButtons = () => (
//     <Card size="small">
//       <Space>
//         <Button onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button 
//           onClick={handleSaveDraft}
//           icon={<SaveOutlined />}
//         >
//           Save Draft
//         </Button>
//         <Button 
//           type="primary" 
//           htmlType="submit" 
//           loading={loading}
//           icon={<SendOutlined />}
//           disabled={items.length === 0 || !selectedBudgetCode}
//         >
//           {editData ? 'Update Requisition' : 'Submit Requisition'}
//         </Button>
//       </Space>
//     </Card>
//   );

//   const renderAddItemModal = () => (
//     <Modal
//       title="Add Item from Database"
//       open={showItemModal}
//       onOk={handleItemModalOk}
//       onCancel={() => {
//         setShowItemModal(false);
//         itemForm.resetFields();
//       }}
//       width={700}
//       okText={editingItem !== null ? "Update Item" : "Add Item"}
//     >
//       <Alert
//         message="Database Item Selection"
//         description={`Select from ${databaseItems.length} pre-approved items. Contact Supply Chain team if your item is not listed.`}
//         type="warning"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Form form={itemForm} layout="vertical">
//         <Form.Item
//           name="itemId"
//           label="Select Item"
//           rules={[{ required: true, message: 'Please select an item' }]}
//         >
//           <Select
//             placeholder="Search and select from approved items"
//             showSearch
//             optionFilterProp="children"
//             loading={loadingItems}
//             filterOption={(input, option) => {
//               const item = databaseItems.find(item => (item._id || item.id) === option.value);
//               if (!item) return false;
//               return (
//                 item.description.toLowerCase().includes(input.toLowerCase()) ||
//                 item.code.toLowerCase().includes(input.toLowerCase()) ||
//                 item.category.toLowerCase().includes(input.toLowerCase())
//               );
//             }}
//           >
//             {databaseItems.map(item => (
//               <Option key={item._id || item.id} value={item._id || item.id}>
//                 <div>
//                   <Text strong>{item.code}</Text> - {item.description}
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {item.category} | Unit: {item.unitOfMeasure} |
//                     {item.standardPrice ? ` Price: ${item.standardPrice.toLocaleString()} XAF` : ' Price: TBD'}
//                   </Text>
//                 </div>
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item
//               name="quantity"
//               label="Quantity"
//               rules={[
//                 { required: true, message: 'Please enter quantity' },
//                 { type: 'number', min: 1, message: 'Quantity must be at least 1' }
//               ]}
//             >
//               <InputNumber 
//                 style={{ width: '100%' }}
//                 min={1}
//                 placeholder="Enter quantity"
//               />
//             </Form.Item>
//           </Col>
//         </Row>

//         {itemForm.getFieldValue('itemId') && (
//           <Alert
//             message="Selected Item Details"
//             description={(() => {
//               const item = databaseItems.find(i => (i._id || i.id) === itemForm.getFieldValue('itemId'));
//               const quantity = itemForm.getFieldValue('quantity') || 1;
//               return item ? (
//                 <div>
//                   <Row gutter={16}>
//                     <Col span={12}>
//                       <Text><strong>Code:</strong> {item.code}</Text><br />
//                       <Text><strong>Description:</strong> {item.description}</Text><br />
//                       <Text><strong>Category:</strong> {item.category} - {item.subcategory}</Text><br />
//                       <Text><strong>Unit:</strong> {item.unitOfMeasure}</Text>
//                     </Col>
//                     <Col span={12}>
//                       {item.standardPrice && (
//                         <>
//                           <Text><strong>Unit Price:</strong> {item.standardPrice.toLocaleString()} XAF</Text><br />
//                           <Text><strong>Total Est.:</strong> {(item.standardPrice * quantity).toLocaleString()} XAF</Text><br />
//                         </>
//                       )}
//                       {item.supplier && (
//                         <Text><strong>Preferred Supplier:</strong> {item.supplier}</Text>
//                       )}
//                     </Col>
//                   </Row>
//                 </div>
//               ) : null;
//             })()}
//             type="info"
//             style={{ marginTop: '16px' }}
//           />
//         )}
//       </Form>
//     </Modal>
//   );

//   const renderRequestNewItemModal = () => (
//     <Modal
//       title="Request New Item"
//       open={showRequestModal}
//       onOk={handleRequestModalOk}
//       onCancel={() => {
//         setShowRequestModal(false);
//         requestForm.resetFields();
//       }}
//       width={600}
//       okText="Submit Request"
//     >
//       <Alert
//         message="Request New Item Addition"
//         description="Submit a request to add a new item to the database. The Supply Chain team will review and approve items before they become available for selection."
//         type="info"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Form form={requestForm} layout="vertical">
//         <Form.Item
//           name="description"
//           label="Item Description"
//           rules={[
//             { required: true, message: 'Please describe the item' },
//             { min: 10, message: 'Description must be at least 10 characters' }
//           ]}
//         >
//           <Input placeholder="Describe the item you need in detail" />
//         </Form.Item>

//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item
//               name="category"
//               label="Category"
//               rules={[{ required: true, message: 'Please select category' }]}
//             >
//               <Select placeholder="Select category">
//                 {ITEM_CATEGORIES.map(category => (
//                   <Option key={category} value={category}>
//                     {category}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//           <Col span={12}>
//             <Form.Item
//               name="unitOfMeasure"
//               label="Unit of Measure"
//               rules={[{ required: true, message: 'Please specify unit' }]}
//             >
//               <Select placeholder="Select unit">
//                 {UNITS_OF_MEASURE.map(unit => (
//                   <Option key={unit} value={unit}>
//                     {unit}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>

//         <Form.Item
//           name="justification"
//           label="Justification"
//           rules={[{ required: true, message: 'Please justify why this item is needed' }]}
//         >
//           <TextArea
//             rows={4}
//             placeholder="Explain why this item is needed and why it should be added to the database..."
//             maxLength={500}
//             showCount
//           />
//         </Form.Item>

//         <Form.Item
//           name="estimatedPrice"
//           label="Estimated Price (XAF) - Optional"
//           help="If you know the approximate price, please include it"
//         >
//           <InputNumber
//             style={{ width: '100%' }}
//             min={0}
//             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//             parser={value => value.replace(/\$\s?|(,)/g, '')}
//             placeholder="Estimated price in XAF"
//           />
//         </Form.Item>

//         <Form.Item
//           name="preferredSupplier"
//           label="Preferred Supplier - Optional"
//         >
//           <Input placeholder="Suggest a supplier if you have one in mind" />
//         </Form.Item>
//       </Form>

//       <Alert
//         message="Request Process"
//         description="Your request will be sent to the Supply Chain team for review. You'll be notified when the item is approved and available for selection. This may take 1-3 business days."
//         type="warning"
//         style={{ marginTop: '16px' }}
//       />
//     </Modal>
//   );

//   return (
//     <div>
//       <Card>
//         {renderHeader()}
//         {renderDatabaseAlert()}

//         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//           {renderRequisitionInfo()}
//           {renderRequesterDetails()}
//           {renderBudgetCodeSelection()}
//           {renderProjectAndSupplierSelection()}
//           {renderBudgetInfo()}
//           {renderItemsSection()}
//           {renderAttachments()}
//           {renderJustifications()}
//           {renderActionButtons()}
//         </Form>
//       </Card>

//       {renderAddItemModal()}
//       {renderRequestNewItemModal()}
//     </div>
//   );
// };

// export default EnhancedPurchaseRequisitionForm;













// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useSelector } from 'react-redux';
// import {
//   Card,
//   Form,
//   Input,
//   Button,
//   Space,
//   Typography,
//   Row,
//   Col,
//   Select,
//   DatePicker,
//   InputNumber,
//   Table,
//   Modal,
//   message,
//   Alert,
//   Tag,
//   Upload,
//   Divider,
//   Spin,
//   Descriptions,
//   Progress,
//   Radio,
//   AutoComplete
// } from 'antd';
// import {
//   PlusOutlined,
//   DeleteOutlined,
//   SaveOutlined,
//   SendOutlined,
//   ShoppingCartOutlined,
//   DollarOutlined,
//   UploadOutlined,
//   EditOutlined,
//   ExclamationCircleOutlined,
//   DatabaseOutlined,
//   SearchOutlined,
//   ReloadOutlined,
//   ProjectOutlined,
//   FileOutlined,
//   EyeOutlined,
//   DownloadOutlined,
//   InboxOutlined,
//   ShopOutlined,
//   TagOutlined,
//   WarningOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
// import { projectAPI } from '../../services/projectAPI';
// import { itemAPI } from '../../services/itemAPI';
// import supplierApiService from '../../services/supplierAPI';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { TextArea } = Input;
// const { Option } = Select;
// const { Dragger } = Upload;

// // Constants
// const URGENCY_OPTIONS = [
//   { value: 'Low', color: 'green' },
//   { value: 'Medium', color: 'orange' },
//   { value: 'High', color: 'red' }
// ];

// const ITEM_CATEGORIES = [
//   'IT Accessories',
//   'Office Supplies',
//   'Equipment',
//   'Consumables',
//   'Software',
//   'Hardware',
//   'Furniture',
//   'Safety Equipment',
//   'Maintenance Supplies',
//   'Other'
// ];

// const UNITS_OF_MEASURE = [
//   'Pieces', 'Sets', 'Boxes', 'Packs', 'Units', 'Kg', 
//   'Litres', 'Meters', 'Pairs', 'Each'
// ];

// const ALLOWED_FILE_TYPES = [
//   '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
//   '.jpg', '.jpeg', '.png', '.gif', '.txt', '.csv'
// ];

// const MAX_FILE_SIZE = 10 * 1024 * 1024;
// const MAX_FILES = 5;

// const EnhancedPurchaseRequisitionForm = ({ onSubmit, onCancel, onSaveDraft, editData }) => {
//   const { user } = useSelector((state) => state.auth);
//   const [form] = Form.useForm();
//   const [itemForm] = Form.useForm();
//   const [requestForm] = Form.useForm();

//   // State management
//   const [loading, setLoading] = useState(false);
//   const [loadingItems, setLoadingItems] = useState(true);
//   const [loadingProjects, setLoadingProjects] = useState(false);
//   const [loadingSuppliers, setLoadingSuppliers] = useState(false);
//   const [loadingBudgetCodes, setLoadingBudgetCodes] = useState(false);
//   const [fetchError, setFetchError] = useState(null);
//   const [supplierError, setSupplierError] = useState(null);
//   const [showItemModal, setShowItemModal] = useState(false);
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [editingItem, setEditingItem] = useState(null);

//   const [items, setItems] = useState([]);
//   const [attachments, setAttachments] = useState([]);
//   const [databaseItems, setDatabaseItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [budgetCodes, setBudgetCodes] = useState([]);
//   const [selectedProject, setSelectedProject] = useState(null);
//   const [projectBudgetInfo, setProjectBudgetInfo] = useState(null);
//   const [selectedBudgetCode, setSelectedBudgetCode] = useState(null);
//   const [budgetCodeDetails, setBudgetCodeDetails] = useState(null);
  
//   const [supplierSelectionMode, setSupplierSelectionMode] = useState('database');
//   const [selectedSupplier, setSelectedSupplier] = useState(null);

//   const generateRequisitionNumber = useCallback(() => {
//     const now = new Date();
//     const year = now.getFullYear();
//     const month = String(now.getMonth() + 1).padStart(2, '0');
//     const day = String(now.getDate()).padStart(2, '0');
//     const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
//     return `REQ${year}${month}${day}${random}`;
//   }, []);

//   const calculateTotalCost = useMemo(() => {
//     return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
//   }, [items]);

//   const validateFile = useCallback((file) => {
//     const fileName = file.name || file.originalname || '';
//     const fileSize = file.size || 0;
//     const fileExt = fileName.includes('.') ? 
//       '.' + fileName.split('.').pop().toLowerCase() : '';

//     if (fileSize > MAX_FILE_SIZE) {
//       return {
//         valid: false,
//         error: `File "${fileName}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
//       };
//     }

//     if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
//       return {
//         valid: false,
//         error: `File type "${fileExt}" not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
//       };
//     }

//     return { valid: true };
//   }, []);

//   // Fetch budget codes
//   const fetchBudgetCodes = useCallback(async () => {
//     try {
//       setLoadingBudgetCodes(true);
//       const response = await purchaseRequisitionAPI.getActiveBudgetCodes()
//       // const response = await fetch('/api/budget-codes/active', {
//       //   headers: {
//       //     'Authorization': `Bearer ${localStorage.getItem('token')}`
//       //   }
//       // });
      
//       if (response.ok) {
//         const data = await response.json();
//         if (data.success) {
//           setBudgetCodes(data.data);
//           console.log(`✅ Loaded ${data.data.length} active budget codes`);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching budget codes:', error);
//       message.error('Failed to load budget codes');
//     } finally {
//       setLoadingBudgetCodes(false);
//     }
//   }, []);

//   // Check budget code availability
//   const checkBudgetCodeAvailability = useCallback(async (budgetCodeId, requiredAmount) => {
//     try {
//       const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//       if (!budgetCode) return { available: false, message: 'Budget code not found' };

//       const available = budgetCode.budget - budgetCode.used;
      
//       if (available < requiredAmount) {
//         return {
//           available: false,
//           message: `Insufficient budget. Available: XAF ${available.toLocaleString()}, Required: XAF ${requiredAmount.toLocaleString()}`
//         };
//       }

//       return {
//         available: true,
//         budgetCode: budgetCode,
//         availableAmount: available
//       };
//     } catch (error) {
//       console.error('Error checking budget availability:', error);
//       return { available: false, message: 'Failed to check budget availability' };
//     }
//   }, [budgetCodes]);

//   // Handle budget code selection
//   const handleBudgetCodeChange = useCallback(async (budgetCodeId) => {
//     setSelectedBudgetCode(budgetCodeId);
    
//     if (!budgetCodeId) {
//       setBudgetCodeDetails(null);
//       return;
//     }

//     const budgetCode = budgetCodes.find(bc => bc._id === budgetCodeId);
//     if (budgetCode) {
//       const available = budgetCode.budget - budgetCode.used;
//       const utilizationRate = Math.round((budgetCode.used / budgetCode.budget) * 100);
      
//       setBudgetCodeDetails({
//         code: budgetCode.code,
//         name: budgetCode.name,
//         totalBudget: budgetCode.budget,
//         used: budgetCode.used,
//         available: available,
//         utilizationRate: utilizationRate,
//         status: utilizationRate >= 90 ? 'critical' : 
//                 utilizationRate >= 75 ? 'high' : 
//                 utilizationRate >= 50 ? 'moderate' : 'low'
//       });

//       if (calculateTotalCost > available) {
//         message.warning(`Total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds available budget (XAF ${available.toLocaleString()})`);
//       }
//     }
//   }, [budgetCodes, calculateTotalCost]);

//   // Fetch database items
//   const fetchDatabaseItems = useCallback(async (categoryFilter = null) => {
//     try {
//       setLoadingItems(true);
//       setFetchError(null);
      
//       console.log('Fetching database items...', categoryFilter ? `for category: ${categoryFilter}` : 'all items');
      
//       const response = await itemAPI.getActiveItems(categoryFilter);
      
//       if (response.success && Array.isArray(response.data)) {
//         setDatabaseItems(response.data);
//         console.log(`Successfully loaded ${response.data.length} items`);
        
//         if (response.data.length > 0) {
//           message.success(`Loaded ${response.data.length} items from database`);
//         } else {
//           message.info('No items found for the selected criteria');
//         }
//       } else {
//         console.error('API returned invalid data:', response);
//         setDatabaseItems([]);
//         setFetchError(response.message || 'Failed to load item database');
//       }
//     } catch (error) {
//       console.error('Error fetching database items:', error);
//       setDatabaseItems([]);
//       setFetchError(error.message || 'Failed to connect to item database');
//     } finally {
//       setLoadingItems(false);
//     }
//   }, []);

//   // Fetch projects
//   const fetchProjects = useCallback(async () => {
//     try {
//       setLoadingProjects(true);
//       const response = await projectAPI.getActiveProjects();
      
//       if (response.success) {
//         setProjects(response.data);
//         console.log(`Loaded ${response.data.length} active projects`);
//       } else {
//         console.error('Failed to fetch projects:', response.message);
//         setProjects([]);
//       }
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       setProjects([]);
//     } finally {
//       setLoadingProjects(false);
//     }
//   }, []);

//   // Fetch project budget info
//   const fetchProjectBudgetInfo = useCallback(async (projectId) => {
//     try {
//       const response = await projectAPI.getProjectById(projectId);
      
//       if (response.success) {
//         const project = response.data;
//         const budgetRemaining = project.budget.allocated - project.budget.spent;
        
//         setProjectBudgetInfo({
//           projectName: project.name,
//           projectCode: project.code,
//           budgetAllocated: project.budget.allocated,
//           budgetSpent: project.budget.spent,
//           budgetRemaining: budgetRemaining,
//           budgetUtilization: project.budgetUtilization,
//           budgetCode: project.budgetCode ? {
//             code: project.budgetCode.code,
//             name: project.budgetCode.name,
//             available: project.budgetCode.budget - project.budgetCode.used
//           } : null,
//           status: project.status,
//           priority: project.priority
//         });
//       }
//     } catch (error) {
//       console.error('Error fetching project budget info:', error);
//       setProjectBudgetInfo(null);
//     }
//   }, []);

//   // Fetch suppliers
//   const fetchSuppliers = useCallback(async () => {
//     setLoadingSuppliers(true);
//     setSupplierError(null);
    
//     try {
//       console.log('🔍 Starting supplier fetch...');
      
//       const token = localStorage.getItem('token');
//       if (!token) {
//         throw new Error('Please login to continue');
//       }
      
//       const response = await supplierApiService.getAllSuppliers({ 
//         status: 'active',
//         limit: 100 
//       });
      
//       console.log('📦 Fetch response:', response);
      
//       if (response.success && Array.isArray(response.data)) {
//         setSuppliers(response.data);
//         console.log(`✅ Successfully loaded ${response.data.length} suppliers`);
        
//         if (response.data.length > 0) {
//           message.success(`Loaded ${response.data.length} active suppliers`);
//         } else {
//           message.info('No active suppliers found');
//         }
//       } else {
//         const errorMsg = response.message || 'Failed to load suppliers';
//         console.error('❌ Fetch failed:', errorMsg);
//         setSupplierError(errorMsg);
//         message.error(errorMsg);
//         setSuppliers([]);
//       }
      
//     } catch (error) {
//       console.error('💥 Error fetching suppliers:', error);
//       const errorMessage = error.message || 'Failed to load suppliers';
//       setSupplierError(errorMessage);
//       message.error(errorMessage);
//       setSuppliers([]);
//     } finally {
//       setLoadingSuppliers(false);
//     }
//   }, []);

//   // Form initialization
//   const initializeForm = useCallback(() => {
//     if (editData) {
//       const formData = {
//         ...editData,
//         expectedDate: editData.expectedDate ? moment(editData.expectedDate) : moment().add(14, 'days'),
//         date: editData.createdAt ? moment(editData.createdAt) : moment(),
//         project: editData.project,
//         budgetCode: editData.budgetCode
//       };
      
//       // Initialize supplier selection
//       if (editData.preferredSupplier) {
//         if (editData.supplierId) {
//           setSupplierSelectionMode('database');
//           setSelectedSupplier(editData.supplierId);
//           formData.supplierId = editData.supplierId;
//         } else {
//           setSupplierSelectionMode('manual');
//           formData.preferredSupplierName = editData.preferredSupplier;
//         }
//       }
      
//       form.setFieldsValue(formData);
//       setItems(editData.items || []);
//       setSelectedProject(editData.project);
      
//       if (editData.budgetCode) {
//         handleBudgetCodeChange(editData.budgetCode);
//       }
      
//       if (editData.attachments && editData.attachments.length > 0) {
//         const existingAttachments = editData.attachments.map((att, index) => ({
//           uid: att._id || `existing-${index}`,
//           name: att.name || att.fileName || 'Unknown File',
//           status: 'done',
//           url: att.url || att.downloadUrl,
//           size: att.size || 0,
//           type: att.mimetype || 'application/octet-stream',
//           existing: true,
//           publicId: att.publicId
//         }));
//         setAttachments(existingAttachments);
//       }
//     } else {
//       form.setFieldsValue({
//         requisitionNumber: generateRequisitionNumber(),
//         requesterName: user?.fullName || '',
//         department: user?.department || '',
//         date: moment(),
//         deliveryLocation: 'Office',
//         expectedDate: moment().add(14, 'days'),
//         urgency: 'Medium'
//       });
//     }
//   }, [editData, form, generateRequisitionNumber, user, handleBudgetCodeChange]);

//   // Component initialization
//   useEffect(() => {
//     fetchProjects();
//     fetchDatabaseItems();
//     fetchSuppliers();
//     fetchBudgetCodes();
//     initializeForm();
//   }, [fetchProjects, fetchDatabaseItems, fetchSuppliers, fetchBudgetCodes, initializeForm]);

//   // Project selection effect
//   useEffect(() => {
//     if (selectedProject) {
//       fetchProjectBudgetInfo(selectedProject);
//     } else {
//       setProjectBudgetInfo(null);
//     }
//   }, [selectedProject, fetchProjectBudgetInfo]);

//   // Item management functions
//   const handleAddItem = useCallback(() => {
//     if (loadingItems) {
//       message.warning('Please wait while items are loading...');
//       return;
//     }
    
//     if (fetchError) {
//       message.error('Cannot add items: ' + fetchError);
//       return;
//     }
    
//     if (!databaseItems || databaseItems.length === 0) {
//       message.error('No items available in database. Please contact Supply Chain team.');
//       return;
//     }
    
//     setEditingItem(null);
//     setShowItemModal(true);
//     itemForm.resetFields();
//   }, [loadingItems, fetchError, databaseItems, itemForm]);

//   const handleEditItem = useCallback((item, index) => {
//     setEditingItem(index);
//     setShowItemModal(true);
//     itemForm.setFieldsValue({
//       itemId: item.itemId,
//       quantity: item.quantity,
//       projectName: item.projectName
//     });
//   }, [itemForm]);

//   const handleDeleteItem = useCallback((index) => {
//     const newItems = items.filter((_, i) => i !== index);
//     setItems(newItems);
//     message.success('Item removed successfully');
//   }, [items]);

//   const handleItemModalOk = useCallback(async () => {
//     try {
//       const values = await itemForm.validateFields();
//       const selectedItem = databaseItems.find(item => 
//         (item._id || item.id) === values.itemId
//       );

//       if (!selectedItem) {
//         message.error('Please select a valid item from the database');
//         return;
//       }

//       const existingItemIndex = items.findIndex(item => 
//         item.itemId === (selectedItem._id || selectedItem.id)
//       );

//       const itemData = {
//         itemId: selectedItem._id || selectedItem.id,
//         code: selectedItem.code,
//         description: selectedItem.description,
//         category: selectedItem.category,
//         subcategory: selectedItem.subcategory,
//         quantity: values.quantity,
//         measuringUnit: selectedItem.unitOfMeasure || 'Pieces',
//         projectName: values.projectName || '',
//         estimatedPrice: selectedItem.standardPrice || 0
//       };

//       if (editingItem !== null) {
//         const newItems = [...items];
//         newItems[editingItem] = itemData;
//         setItems(newItems);
//         message.success('Item updated successfully');
//       } else if (existingItemIndex !== -1) {
//         Modal.confirm({
//           title: 'Item Already Added',
//           content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
//           onOk() {
//             const newItems = [...items];
//             newItems[existingItemIndex].quantity += values.quantity;
//             setItems(newItems);
//             message.success('Quantity updated successfully');
//           }
//         });
//       } else {
//         setItems(prev => [...prev, itemData]);
//         message.success('Item added successfully');
//       }

//       setShowItemModal(false);
//       itemForm.resetFields();
//     } catch (error) {
//       console.error('Validation failed:', error);
//       message.error('Failed to add item. Please try again.');
//     }
//   }, [itemForm, databaseItems, items, editingItem]);

//   const handleRequestNewItem = useCallback(() => {
//     setShowRequestModal(true);
//     requestForm.resetFields();
//   }, [requestForm]);

//   const handleRequestModalOk = useCallback(async () => {
//     try {
//       const values = await requestForm.validateFields();

//       const requestData = {
//         ...values,
//         requestedBy: user?.fullName || user?.email,
//         department: user?.department || '',
//         requisitionId: form.getFieldValue('requisitionNumber')
//       };

//       const response = await itemAPI.requestNewItem(requestData);

//       if (response.success) {
//         message.success('Item request submitted to Supply Chain team. You will be notified when the item is available.');
//         setShowRequestModal(false);
//         requestForm.resetFields();
//       } else {
//         message.error(response.message || 'Failed to submit item request');
//       }
//     } catch (error) {
//       console.error('Request failed:', error);
//       message.error('Failed to submit item request');
//     }
//   }, [requestForm, user, form]);

//   // File upload handling
//   const handleAttachmentChange = useCallback(({ fileList }) => {
//     console.log('Attachment change:', fileList);
    
//     const processedFiles = fileList.map(file => {
//       if (file.existing) {
//         return file;
//       }
      
//       if (file.originFileObj && file.status !== 'removed') {
//         const validation = validateFile(file.originFileObj);
        
//         if (!validation.valid) {
//           message.error(validation.error);
//           return {
//             ...file,
//             status: 'error',
//             error: validation.error
//           };
//         }
        
//         return {
//           ...file,
//           status: file.status || 'done'
//         };
//       }
      
//       return file;
//     });

//     const validFiles = processedFiles.filter(file => 
//       file.status !== 'error' && file.status !== 'removed'
//     );
    
//     if (validFiles.length > MAX_FILES) {
//       message.error(`Maximum ${MAX_FILES} files allowed`);
//       return;
//     }

//     setAttachments(validFiles);
//   }, [validateFile]);

//   const customUploadRequest = useCallback(({ file, onSuccess, onError }) => {
//     setTimeout(() => {
//       onSuccess("ok");
//     }, 0);
//   }, []);

//   const handleDownloadAttachment = useCallback(async (attachment) => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         message.error('Authentication required');
//         return;
//       }

//       let publicId = '';
//       if (attachment.url) {
//         const urlParts = attachment.url.split('/');
//         const uploadIndex = urlParts.findIndex(part => part === 'upload');
//         if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
//           publicId = urlParts.slice(uploadIndex + 2).join('/');
//           const lastPart = publicId.split('/').pop();
//           if (lastPart && lastPart.includes('.')) {
//             publicId = publicId.replace(/\.[^/.]+$/, '');
//           }
//         }
//       }

//       if (!publicId) {
//         message.error('Invalid attachment URL');
//         return;
//       }

//       const response = await fetch(`/api/files/download/${encodeURIComponent(publicId)}`, {
//         method: 'GET',
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`);
//       }

//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
      
//       const link = document.createElement('a');
//       link.href = url;
//       link.download = attachment.originalName || attachment.name || 'attachment';
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
      
//       window.URL.revokeObjectURL(url);
      
//       message.success('File downloaded successfully');
//     } catch (error) {
//       console.error('Error downloading attachment:', error);
//       message.error('Failed to download attachment');
      
//       if (attachment.url) {
//         window.open(attachment.url, '_blank');
//       }
//     }
//   }, []);

//   // Form submission
//   const handleSubmit = useCallback(async (values) => {
//     if (items.length === 0) {
//       message.error('Please add at least one item to the requisition');
//       return;
//     }

//     // Validate budget code selection
//     if (!values.budgetCode) {
//       message.error('Please select a budget code');
//       return;
//     }

//     // Validate project budget if project is selected
//     if (selectedProject && projectBudgetInfo) {
//       if (calculateTotalCost > projectBudgetInfo.budgetRemaining) {
//         Modal.confirm({
//           title: 'Budget Warning',
//           content: `The total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds the remaining project budget (XAF ${projectBudgetInfo.budgetRemaining.toLocaleString()}). Do you want to continue?`,
//           onOk() {
//             checkBudgetAndSubmit(values);
//           }
//         });
//         return;
//       }
//     }

//     checkBudgetAndSubmit(values);
//   }, [items, selectedProject, projectBudgetInfo, calculateTotalCost, checkBudgetCodeAvailability]);

//   const checkBudgetAndSubmit = useCallback(async (values) => {
//     // Check budget availability
//     const budgetCheck = await checkBudgetCodeAvailability(values.budgetCode, calculateTotalCost);
    
//     if (!budgetCheck.available) {
//       Modal.error({
//         title: 'Insufficient Budget',
//         content: budgetCheck.message,
//         okText: 'Understood'
//       });
//       return;
//     }

//     // Show confirmation with budget details
//     Modal.confirm({
//       title: 'Confirm Submission',
//       content: (
//         <div>
//           <p><strong>Total Estimated Cost:</strong> XAF {calculateTotalCost.toLocaleString()}</p>
//           <p><strong>Budget Code:</strong> {budgetCodeDetails?.code}</p>
//           <p><strong>Available Budget:</strong> XAF {budgetCodeDetails?.available.toLocaleString()}</p>
//           <p><strong>Remaining After:</strong> XAF {(budgetCodeDetails?.available - calculateTotalCost).toLocaleString()}</p>
//           <Divider />
//           <p>Are you sure you want to submit this requisition?</p>
//         </div>
//       ),
//       onOk() {
//         submitRequisition(values);
//       }
//     });
//   }, [calculateTotalCost, budgetCodeDetails, checkBudgetCodeAvailability]);

//   const submitRequisition = useCallback(async (values) => {
//     setLoading(true);
//     try {
//       const formData = new FormData();

//       // Add all form fields
//       formData.append('requisitionNumber', values.requisitionNumber);
//       formData.append('title', values.title);
//       formData.append('itemCategory', values.itemCategory);
//       formData.append('budgetXAF', values.budgetXAF || calculateTotalCost);
//       formData.append('budgetCode', values.budgetCode);
//       formData.append('budgetHolder', values.budgetHolder);
//       formData.append('urgency', values.urgency);
//       formData.append('deliveryLocation', values.deliveryLocation);
//       formData.append('expectedDate', values.expectedDate.format('YYYY-MM-DD'));
//       formData.append('justificationOfPurchase', values.justificationOfPurchase);
//       formData.append('justificationOfPreferredSupplier', values.justificationOfPreferredSupplier || '');
      
//       // Add supplier information
//       if (supplierSelectionMode === 'database' && selectedSupplier) {
//         formData.append('supplierId', selectedSupplier);
//         const supplier = suppliers.find(s => s._id === selectedSupplier);
//         if (supplier) {
//           formData.append('preferredSupplier', supplier.supplierDetails?.companyName || supplier.fullName);
//         }
//       } else if (supplierSelectionMode === 'manual' && values.preferredSupplierName) {
//         formData.append('preferredSupplier', values.preferredSupplierName);
//       }
      
//       if (selectedProject) {
//         formData.append('project', selectedProject);
//       }

//       formData.append('items', JSON.stringify(items));

//       // Handle file attachments
//       const newAttachments = attachments.filter(att => !att.existing && att.originFileObj);
      
//       newAttachments.forEach((file, index) => {
//         console.log(`Adding file ${index + 1}:`, file.name);
//         formData.append('attachments', file.originFileObj, file.name);
//       });

//       const existingAttachmentIds = attachments
//         .filter(att => att.existing)
//         .map(att => att._id || att.uid);
      
//       if (existingAttachmentIds.length > 0) {
//         formData.append('existingAttachments', JSON.stringify(existingAttachmentIds));
//       }

//       console.log('Submitting requisition with', newAttachments.length, 'new files...');

//       const response = await purchaseRequisitionAPI.createRequisition(formData);

//       if (response.success) {
//         message.success('Purchase requisition submitted successfully!');
        
//         if (response.attachments) {
//           const { uploaded, total } = response.attachments;
//           if (uploaded < total) {
//             message.warning(`${uploaded} out of ${total} attachments uploaded successfully`);
//           } else if (uploaded > 0) {
//             message.success(`All ${uploaded} attachments uploaded successfully`);
//           }
//         }
        
//         if (onSubmit) {
//           onSubmit(response.data);
//         }
//       } else {
//         message.error(response.message || 'Failed to submit requisition');
//       }

//     } catch (error) {
//       console.error('Error submitting requisition:', error);
      
//       if (error.response?.data?.message) {
//         message.error(error.response.data.message);
//       } else {
//         message.error('Failed to submit requisition. Please try again.');
//       }
//     } finally {
//       setLoading(false);
//     }
//   }, [items, attachments, selectedProject, suppliers, selectedSupplier, supplierSelectionMode, calculateTotalCost, onSubmit]);

//   const handleSaveDraft = useCallback(async () => {
//     try {
//       const values = await form.getFieldsValue();
//       const draftData = {
//         ...values,
//         expectedDate: values.expectedDate ? values.expectedDate.format('YYYY-MM-DD') : moment().add(14, 'days').format('YYYY-MM-DD'),
//         items,
//         project: selectedProject,
//         budgetCode: selectedBudgetCode,
//         status: 'draft',
//         lastSaved: new Date(),
//         totalEstimatedCost: calculateTotalCost
//       };

//       const response = await purchaseRequisitionAPI.saveDraft(draftData);

//       if (response.success) {
//         message.success('Draft saved successfully!');
//         if (onSaveDraft) {
//           onSaveDraft(response.data);
//         }
//       } else {
//         message.error(response.message || 'Failed to save draft');
//       }
//     } catch (error) {
//       console.error('Error saving draft:', error);
//       message.error('Failed to save draft');
//     }
//   }, [form, items, selectedProject, selectedBudgetCode, calculateTotalCost, onSaveDraft]);

//   // Render functions

//   const renderBudgetCodeSelection = () => (
//     <Card 
//       size="small" 
//       title={
//         <Space>
//           <TagOutlined />
//           Budget Code Selection (Required)
//         </Space>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       <Alert
//         message="Budget Code Required"
//         description="You must select a budget code before submitting. The system will verify that sufficient budget is available."
//         type="info"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={16}>
//           <Form.Item
//             name="budgetCode"
//             label="Select Budget Code"
//             rules={[{ required: true, message: 'Budget code is required' }]}
//             help="Choose the budget code that will fund this purchase"
//           >
//             <Select
//               placeholder="Select budget code"
//               loading={loadingBudgetCodes}
//               showSearch
//               allowClear
//               onChange={handleBudgetCodeChange}
//               filterOption={(input, option) => {
//                 // Always show all options when input is empty
//                 if (!input) return true;
                
//                 const code = budgetCodes.find(bc => bc._id === option.value);
//                 if (!code) return false;
                
//                 const searchStr = `${code.code} ${code.name}`.toLowerCase();
//                 return searchStr.includes(input.toLowerCase());
//               }}
//             >
//               {budgetCodes.map(code => {
//                 const available = code.budget - code.used;
//                 const utilizationRate = Math.round((code.used / code.budget) * 100);
//                 const status = utilizationRate >= 90 ? 'critical' : 
//                              utilizationRate >= 75 ? 'high' : 
//                              utilizationRate >= 50 ? 'moderate' : 'low';
                
//                 return (
//                   <Option key={code._id} value={code._id}>
//                     <div>
//                       <Text strong>{code.code}</Text> - {code.name}
//                       <br />
//                       <Text type="secondary" style={{ fontSize: '12px' }}>
//                         Available: XAF {available.toLocaleString()} 
//                         {' | '}
//                         <Tag 
//                           color={
//                             status === 'critical' ? 'red' :
//                             status === 'high' ? 'orange' :
//                             status === 'moderate' ? 'blue' : 'green'
//                           }
//                           style={{ marginLeft: '4px' }}
//                         >
//                           {utilizationRate}% used
//                         </Tag>
//                       </Text>
//                     </div>
//                   </Option>
//                 );
//               })}
//             </Select>
//           </Form.Item>
//         </Col>
        
//         <Col xs={24} md={8}>
//           <Form.Item label=" ">
//             <Button 
//               icon={<ReloadOutlined />} 
//               onClick={fetchBudgetCodes}
//               loading={loadingBudgetCodes}
//               block
//             >
//               Refresh Codes
//             </Button>
//           </Form.Item>
//         </Col>
//       </Row>

//       {/* Budget Code Details */}
//       {budgetCodeDetails && (
//         <Alert
//           message={
//             <Space>
//               <CheckCircleOutlined style={{ color: '#52c41a' }} />
//               Budget Code Selected
//             </Space>
//           }
//           description={
//             <div>
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Code">
//                   <Text code strong>{budgetCodeDetails.code}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Name">
//                   {budgetCodeDetails.name}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Total Budget">
//                   <Text strong>XAF {budgetCodeDetails.totalBudget.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Used">
//                   <Text>XAF {budgetCodeDetails.used.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Available">
//                   <Text strong style={{ color: '#52c41a' }}>
//                     XAF {budgetCodeDetails.available.toLocaleString()}
//                   </Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Utilization">
//                   <Progress 
//                     percent={budgetCodeDetails.utilizationRate} 
//                     size="small"
//                     status={
//                       budgetCodeDetails.status === 'critical' ? 'exception' :
//                       budgetCodeDetails.status === 'high' ? 'normal' : 'success'
//                     }
//                   />
//                 </Descriptions.Item>
//               </Descriptions>
              
//               {calculateTotalCost > 0 && (
//                 <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#f0f8ff', borderRadius: '4px' }}>
//                   <Text strong>Estimated Cost: </Text>
//                   <Text style={{ color: '#1890ff' }}>XAF {calculateTotalCost.toLocaleString()}</Text>
//                   <br />
//                   <Text strong>Remaining After: </Text>
//                   <Text style={{ 
//                     color: budgetCodeDetails.available >= calculateTotalCost ? '#52c41a' : '#ff4d4f' 
//                   }}>
//                     XAF {(budgetCodeDetails.available - calculateTotalCost).toLocaleString()}
//                   </Text>
                  
//                   {budgetCodeDetails.available < calculateTotalCost && (
//                     <div style={{ marginTop: '8px' }}>
//                       <WarningOutlined style={{ color: '#ff4d4f', marginRight: '4px' }} />
//                       <Text type="danger">
//                         Insufficient budget! Please select a different budget code or reduce items.
//                       </Text>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           }
//           type={budgetCodeDetails.available >= calculateTotalCost ? "success" : "warning"}
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
//     </Card>
//   );

//   const renderProjectAndSupplierSelection = useCallback(() => (
//     <Card 
//       size="small" 
//       title={
//         <Space>
//           <ProjectOutlined />
//           Project Assignment & Preferred Supplier (Optional)
//         </Space>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="project"
//             label="Assign to Project"
//             help="Select a project to associate this requisition with (optional)"
//           >
//             <Select
//               placeholder="Select project (optional)"
//               allowClear
//               showSearch
//               loading={loadingProjects}
//               onChange={(value) => setSelectedProject(value)}
//               filterOption={(input, option) => {
//                 const project = projects.find(p => p._id === option.value);
//                 return project && (
//                   project.name.toLowerCase().includes(input.toLowerCase()) ||
//                   project.code.toLowerCase().includes(input.toLowerCase())
//                 );
//               }}
//             >
//               {projects.map(project => (
//                 <Option key={project._id} value={project._id}>
//                   <div>
//                     <Text strong>{project.code}</Text> - {project.name}
//                     <br />
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       {project.projectType} | {project.priority} Priority | {project.status}
//                     </Text>
//                   </div>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
        
//         <Col xs={24} md={12}>
//           <Form.Item
//             label="Supplier Selection Method"
//             help="Choose whether to select from registered suppliers or enter a new supplier name"
//           >
//             <Radio.Group 
//               value={supplierSelectionMode} 
//               onChange={(e) => {
//                 setSupplierSelectionMode(e.target.value);
//                 setSelectedSupplier(null);
//                 form.setFieldsValue({ 
//                   supplierId: undefined, 
//                   preferredSupplierName: undefined 
//                 });
//               }}
//             >
//               <Radio value="database">
//                 <Space>
//                   <DatabaseOutlined />
//                   Database ({suppliers.length})
//                 </Space>
//               </Radio>
//               <Radio value="manual">
//                 <Space>
//                   <EditOutlined />
//                   Manual Entry
//                 </Space>
//               </Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//       </Row>

//       {supplierError && (
//         <Alert
//           message="Supplier Loading Error"
//           description={supplierError}
//           type="error"
//           showIcon
//           closable
//           onClose={() => setSupplierError(null)}
//           action={
//             <Button size="small" onClick={fetchSuppliers} icon={<ReloadOutlined />}>
//               Retry
//             </Button>
//           }
//           style={{ marginBottom: '16px' }}
//         />
//       )}

//       <Row gutter={[16, 16]}>
//         {supplierSelectionMode === 'database' ? (
//           <>
//             <Col xs={24} md={20}>
//               <Form.Item
//                 name="supplierId"
//                 label="Select Supplier"
//                 help="Choose from registered and approved suppliers"
//               >
//                 <Select
//                   placeholder={
//                     loadingSuppliers 
//                       ? "Loading suppliers..." 
//                       : suppliers.length === 0 
//                         ? "No suppliers available"
//                         : "Search and select a supplier"
//                   }
//                   allowClear
//                   showSearch
//                   loading={loadingSuppliers}
//                   disabled={loadingSuppliers || suppliers.length === 0}
//                   onChange={(value) => setSelectedSupplier(value)}
//                   filterOption={(input, option) => {
//                     const supplier = suppliers.find(s => s._id === option.value);
//                     if (!supplier) return false;
                    
//                     const companyName = supplier.supplierDetails?.companyName || '';
//                     const fullName = supplier.fullName || '';
//                     const email = supplier.email || '';
//                     const supplierType = supplier.supplierDetails?.supplierType || '';
                    
//                     const searchStr = `${companyName} ${fullName} ${email} ${supplierType}`.toLowerCase();
//                     return searchStr.includes(input.toLowerCase());
//                   }}
//                   notFoundContent={
//                     loadingSuppliers ? (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Spin size="small" />
//                         <div><Text type="secondary">Loading suppliers...</Text></div>
//                       </div>
//                     ) : supplierError ? (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Text type="danger">Error: {supplierError}</Text>
//                         <div style={{ marginTop: '8px' }}>
//                           <Button size="small" type="primary" onClick={fetchSuppliers}>
//                             Retry
//                           </Button>
//                         </div>
//                       </div>
//                     ) : (
//                       <div style={{ textAlign: 'center', padding: '20px' }}>
//                         <Text type="secondary">No suppliers found</Text>
//                       </div>
//                     )
//                   }
//                 >
//                   {suppliers.map(supplier => (
//                     <Option key={supplier._id} value={supplier._id}>
//                       <div>
//                         <Text strong>
//                           {supplier.supplierDetails?.companyName || supplier.fullName}
//                         </Text>
//                         <br />
//                         <Text type="secondary" style={{ fontSize: '12px' }}>
//                           {supplier.supplierDetails?.supplierType && (
//                             <Tag size="small" color="blue">
//                               {supplier.supplierDetails.supplierType}
//                             </Tag>
//                           )}
//                           {supplier.email}
//                           {supplier.supplierDetails?.phoneNumber && 
//                             ` | ${supplier.supplierDetails.phoneNumber}`
//                           }
//                         </Text>
//                       </div>
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//             <Col xs={24} md={4}>
//               <Form.Item label=" ">
//                 <Button 
//                   icon={<ReloadOutlined />} 
//                   onClick={fetchSuppliers}
//                   loading={loadingSuppliers}
//                   block
//                 >
//                   Refresh
//                 </Button>
//               </Form.Item>
//             </Col>
//           </>
//         ) : (
//           <Col xs={24} md={24}>
//             <Form.Item
//               name="preferredSupplierName"
//               label="Supplier Name"
//               help="Enter the name of the supplier (not yet registered in the system)"
//               rules={[
//                 { 
//                   min: 2, 
//                   message: 'Supplier name must be at least 2 characters' 
//                 }
//               ]}
//             >
//               <Input 
//                 placeholder="Enter supplier company name or full name"
//                 prefix={<ShopOutlined />}
//               />
//             </Form.Item>
//           </Col>
//         )}
//       </Row>

//       {projectBudgetInfo && (
//         <Alert
//           message="Project Budget Information"
//           description={
//             <div>
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Project">
//                   <Text strong>{projectBudgetInfo.projectCode}</Text> - {projectBudgetInfo.projectName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status">
//                   <Tag color={
//                     projectBudgetInfo.status === 'In Progress' ? 'green' :
//                     projectBudgetInfo.status === 'Planning' ? 'blue' :
//                     projectBudgetInfo.status === 'Completed' ? 'purple' : 'orange'
//                   }>
//                     {projectBudgetInfo.status}
//                   </Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Total Budget">
//                   <Text>XAF {projectBudgetInfo.budgetAllocated.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Remaining Budget">
//                   <Text style={{ 
//                     color: projectBudgetInfo.budgetRemaining < calculateTotalCost ? '#f5222d' : '#52c41a' 
//                   }}>
//                     XAF {projectBudgetInfo.budgetRemaining.toLocaleString()}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Budget Utilization">
//                   <Text>{projectBudgetInfo.budgetUtilization}%</Text>
//                 </Descriptions.Item>
//                 {projectBudgetInfo.budgetCode && (
//                   <Descriptions.Item label="Budget Code">
//                     <Tag color="gold">
//                       {projectBudgetInfo.budgetCode.code} 
//                       (Available: XAF {projectBudgetInfo.budgetCode.available.toLocaleString()})
//                     </Tag>
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//               {calculateTotalCost > projectBudgetInfo.budgetRemaining && (
//                 <div style={{ marginTop: '8px' }}>
//                   <Text type="danger">
//                     <ExclamationCircleOutlined /> Warning: Estimated cost exceeds remaining project budget
//                   </Text>
//                 </div>
//               )}
//             </div>
//           }
//           type={calculateTotalCost > (projectBudgetInfo?.budgetRemaining || 0) ? "warning" : "info"}
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}

//       {selectedSupplier && supplierSelectionMode === 'database' && (
//         <Alert
//           message="Selected Supplier Details"
//           description={(() => {
//             const supplier = suppliers.find(s => s._id === selectedSupplier);
//             return supplier ? (
//               <Descriptions column={2} size="small" style={{ marginTop: '8px' }}>
//                 <Descriptions.Item label="Company">
//                   <Text strong>{supplier.supplierDetails?.companyName || supplier.fullName}</Text>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Contact">
//                   {supplier.supplierDetails?.contactName || supplier.fullName}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Email">
//                   {supplier.email}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Phone">
//                   {supplier.supplierDetails?.phoneNumber || 'N/A'}
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Type">
//                   <Tag color="blue">
//                     {supplier.supplierDetails?.supplierType || 'N/A'}
//                   </Tag>
//                 </Descriptions.Item>
//                 <Descriptions.Item label="Status">
//                   <Tag color={supplier.status === 'active' ? 'green' : 'orange'}>
//                     {supplier.status || 'N/A'}
//                   </Tag>
//                 </Descriptions.Item>
//                 {supplier.supplierDetails?.address && (
//                   <Descriptions.Item label="Address" span={2}>
//                     {supplier.supplierDetails.address}
//                   </Descriptions.Item>
//                 )}
//               </Descriptions>
//             ) : null;
//           })()}
//           type="info"
//           style={{ marginTop: '16px' }}
//         />
//       )}

//       {loadingProjects && !selectedProject && (
//         <Alert
//           message="Loading Projects"
//           description="Please wait while we load available projects..."
//           type="info"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
      
//       {!loadingProjects && projects.length === 0 && (
//         <Alert
//           message="No Active Projects"
//           description="No active projects found. You can still create the requisition without assigning it to a project."
//           type="info"
//           showIcon
//           style={{ marginTop: '16px' }}
//         />
//       )}
//     </Card>
//   ), [
//     loadingProjects,
//     loadingSuppliers,
//     projects,
//     suppliers,
//     supplierSelectionMode,
//     selectedSupplier,
//     supplierError,
//     projectBudgetInfo,
//     calculateTotalCost,
//     form,
//     fetchSuppliers
//   ]);

//   const renderAttachments = () => (
//     <Card size="small" title="Attachments (Optional)" style={{ marginBottom: '24px' }}>
//       <Form.Item
//         name="attachments"
//         label="Upload Supporting Documents"
//         help={`Maximum ${MAX_FILES} files. Each file max ${MAX_FILE_SIZE / (1024 * 1024)}MB. Accepted: ${ALLOWED_FILE_TYPES.join(', ')}`}
//       >
//         <Dragger
//           multiple
//           fileList={attachments}
//           onChange={handleAttachmentChange}
//           customRequest={customUploadRequest}
//           beforeUpload={(file) => {
//             const validation = validateFile(file);
//             if (!validation.valid) {
//               message.error(validation.error);
//               return false;
//             }
//             return true;
//           }}
//           onRemove={(file) => {
//             console.log('Removing file:', file.name);
//             return true;
//           }}
//           accept={ALLOWED_FILE_TYPES.join(',')}
//           maxCount={MAX_FILES}
//           showUploadList={{
//             showPreviewIcon: true,
//             showRemoveIcon: true,
//             showDownloadIcon: false
//           }}
//           onPreview={(file) => {
//             if (file.existing && file.url) {
//               handleDownloadAttachment(file);
//             } else if (file.originFileObj) {
//               const url = URL.createObjectURL(file.originFileObj);
//               window.open(url, '_blank');
//             }
//           }}
//         >
//           <p className="ant-upload-drag-icon">
//             <InboxOutlined />
//           </p>
//           <p className="ant-upload-text">Click or drag files to this area to upload</p>
//           <p className="ant-upload-hint">
//             Support for single or bulk upload. Maximum {MAX_FILES} files, each up to {MAX_FILE_SIZE / (1024 * 1024)}MB.
//             <br />
//             Accepted formats: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, GIF, TXT, CSV
//           </p>
//         </Dragger>
//       </Form.Item>
      
//       {attachments.length > 0 && (
//         <div style={{ marginTop: '16px' }}>
//           <Text strong>Attached Files ({attachments.length}/{MAX_FILES}):</Text>
//           <div style={{ marginTop: '8px' }}>
//             {attachments.map((file, index) => (
//               <div key={file.uid || index} style={{ 
//                 display: 'flex', 
//                 alignItems: 'center', 
//                 padding: '4px 0',
//                 borderBottom: '1px solid #f0f0f0'
//               }}>
//                 <FileOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
//                 <div style={{ flex: 1 }}>
//                   <Text>{file.name}</Text>
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {file.size ? `${(file.size / 1024).toFixed(1)} KB` : 'Unknown size'}
//                     {file.existing && ' (Existing file)'}
//                   </Text>
//                 </div>
//                 <Space>
//                   {file.existing && file.url && (
//                     <Button 
//                       size="small" 
//                       type="link"
//                       icon={<EyeOutlined />}
//                       onClick={() => handleDownloadAttachment(file)}
//                     >
//                       Preview
//                     </Button>
//                   )}
//                   <Button 
//                     size="small" 
//                     type="link"
//                     danger
//                     icon={<DeleteOutlined />}
//                     onClick={() => {
//                       const newAttachments = attachments.filter((_, i) => i !== index);
//                       setAttachments(newAttachments);
//                     }}
//                   >
//                     Remove
//                   </Button>
//                 </Space>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </Card>
//   );

//   // Table columns
//   const itemColumns = useMemo(() => [
//     {
//       title: 'Code',
//       dataIndex: 'code',
//       key: 'code',
//       width: '10%',
//       render: (code) => <Text code>{code}</Text>
//     },
//     {
//       title: 'Description',
//       dataIndex: 'description',
//       key: 'description',
//       width: '30%',
//       render: (description, record) => (
//         <div>
//           <div>
//             <Text strong>{description}</Text>
//           </div>
//           <div>
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               {record.category} - {record.subcategory}
//             </Text>
//           </div>
//         </div>
//       )
//     },
//     {
//       title: 'Quantity',
//       dataIndex: 'quantity',
//       key: 'quantity',
//       width: '10%',
//       align: 'center'
//     },
//     {
//       title: 'Unit',
//       dataIndex: 'measuringUnit',
//       key: 'measuringUnit',
//       width: '10%',
//       align: 'center'
//     },
//     {
//       title: 'Est. Price (XAF)',
//       dataIndex: 'estimatedPrice',
//       key: 'estimatedPrice',
//       width: '15%',
//       align: 'right',
//       render: (price, record) => {
//         const total = price * record.quantity;
//         return (
//           <div>
//             <div>
//               <Text strong>{total ? total.toLocaleString() : 'TBD'}</Text>
//             </div>
//             {price > 0 && (
//               <div>
//                 <Text type="secondary" style={{ fontSize: '11px' }}>
//                   {price.toLocaleString()} each
//                 </Text>
//               </div>
//             )}
//           </div>
//         );
//       }
//     },
//     {
//       title: 'Project',
//       dataIndex: 'projectName',
//       key: 'projectName',
//       width: '15%'
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       width: '10%',
//       render: (_, record, index) => (
//         <Space>
//           <Button
//             size="small"
//             type="link"
//             onClick={() => handleEditItem(record, index)}
//             icon={<EditOutlined />}
//           />
//           <Button
//             size="small"
//             type="link"
//             danger
//             onClick={() => handleDeleteItem(index)}
//             icon={<DeleteOutlined />}
//           />
//         </Space>
//       )
//     }
//   ], [handleEditItem, handleDeleteItem]);

//   const renderHeader = () => (
//     <div style={{ marginBottom: '24px' }}>
//       <Title level={3} style={{ margin: 0 }}>
//         <ShoppingCartOutlined style={{ marginRight: '8px' }} />
//         {editData ? 'Update Purchase Requisition' : 'New Purchase Requisition'}
//       </Title>
//       <Text type="secondary">
//         {editData ? 'Update your purchase requisition' : 'Create a new purchase requisition using approved items and optionally assign to a project'}
//       </Text>
//     </div>
//   );

//   const renderDatabaseAlert = () => (
//     <Alert
//       message={
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span>
//             Items must be selected from the pre-approved database managed by the Supply Chain team. 
//             {loadingItems ? ' Loading items...' : ` ${databaseItems.length} items available.`}
//             {fetchError && ' (Error loading items)'}
//           </span>
//           <Space>
//             <Button
//               type="link"
//               size="small"
//               onClick={handleRequestNewItem}
//               disabled={loadingItems}
//             >
//               Request New Item
//             </Button>
//             <Button
//               size="small"
//               icon={<ReloadOutlined />}
//               onClick={() => {
//                 const selectedCategory = form.getFieldValue('itemCategory');
//                 fetchDatabaseItems(selectedCategory);
//               }}
//               loading={loadingItems}
//             >
//               Refresh
//             </Button>
//           </Space>
//         </div>
//       }
//       type={fetchError ? "error" : loadingItems ? "info" : "success"}
//       showIcon
//       icon={<DatabaseOutlined />}
//       style={{ marginBottom: '24px' }}
//     />
//   );

//   const renderRequisitionInfo = () => (
//     <Card size="small" title="Requisition Information" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="requisitionNumber"
//             label="Requisition Number"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="date"
//             label="Date"
//           >
//             <DatePicker
//               disabled
//               style={{ width: '100%' }}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="urgency"
//             label="Urgency"
//             rules={[{ required: true, message: 'Please select urgency level' }]}
//           >
//             <Select>
//               {URGENCY_OPTIONS.map(option => (
//                 <Option key={option.value} value={option.value}>
//                   <Tag color={option.color}>{option.value}</Tag>
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
//       </Row>

//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="title"
//             label="Title"
//             rules={[{ required: true, message: 'Please enter requisition title' }]}
//           >
//             <Input placeholder="Purchase of IT accessories - Safety Stock" />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="deliveryLocation"
//             label="Delivery Location"
//             rules={[{ required: true, message: 'Please enter delivery location' }]}
//           >
//             <Input placeholder="Office" />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="expectedDate"
//             label="Expected Date"
//             rules={[{ required: true, message: 'Please select expected delivery date' }]}
//           >
//             <DatePicker style={{ width: '100%' }} />
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderRequesterDetails = () => (
//     <Card size="small" title="Requester Details" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="requesterName"
//             label="Requester Name"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="department"
//             label="Department"
//           >
//             <Input disabled />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={8}>
//           <Form.Item
//             name="itemCategory"
//             label="Primary Item Category"
//             rules={[{ required: true, message: 'Please select primary category' }]}
//           >
//             <Select 
//               placeholder="Select primary category"
//               onChange={(value) => {
//                 console.log('Category selected:', value);
//                 if (value && value !== 'all') {
//                   fetchDatabaseItems(value);
//                 } else {
//                   fetchDatabaseItems();
//                 }
//               }}
//             >
//               <Option value="all">All Categories</Option>
//               {ITEM_CATEGORIES.map(category => (
//                 <Option key={category} value={category}>
//                   {category}
//                 </Option>
//               ))}
//             </Select>
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderBudgetInfo = () => (
//     <Card size="small" title="Budget Information" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]} align="middle">
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="budgetXAF"
//             label="Budget (XAF)"
//             help="Enter estimated budget in Central African Francs"
//           >
//             <InputNumber
//               style={{ width: '100%' }}
//               formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//               parser={value => value.replace(/\$\s?|(,)/g, '')}
//               placeholder="Enter budget amount"
//               addonBefore={<DollarOutlined />}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={12}>
//           <Alert
//             message={`Estimated Total: ${calculateTotalCost.toLocaleString()} XAF`}
//             description={
//               calculateTotalCost > 0 
//                 ? `Based on ${items.length} selected items with known prices` 
//                 : "Add items to see estimated cost"
//             }
//             type="info"
//             showIcon
//           />
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderItemsSection = () => (
//     <Card 
//       size="small" 
//       title={
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//           <span>
//             <DatabaseOutlined /> Selected Items ({items.length})
//           </span>
//           <Space>
//             {calculateTotalCost > 0 && (
//               <Text type="secondary">
//                 Total Est. Cost: <Text strong style={{ color: '#1890ff' }}>{calculateTotalCost.toLocaleString()} XAF</Text>
//               </Text>
//             )}
//             <Button 
//               type="primary" 
//               icon={<PlusOutlined />}
//               onClick={handleAddItem}
//               loading={loadingItems}
//               disabled={fetchError || databaseItems.length === 0}
//             >
//               Add from Database
//             </Button>
//           </Space>
//         </div>
//       } 
//       style={{ marginBottom: '24px' }}
//     >
//       {loadingItems ? (
//         <div style={{ textAlign: 'center', padding: '40px' }}>
//           <Spin size="large" />
//           <div style={{ marginTop: '16px' }}>
//             <Text>Loading item database...</Text>
//           </div>
//         </div>
//       ) : fetchError ? (
//         <Alert
//           message="Item Database Error"
//           description={fetchError}
//           type="error"
//           showIcon
//           action={
//             <Button size="small" onClick={() => {
//               const selectedCategory = form.getFieldValue('itemCategory');
//               fetchDatabaseItems(selectedCategory);
//             }} icon={<ReloadOutlined />}>
//               Retry
//             </Button>
//           }
//         />
//       ) : databaseItems.length === 0 ? (
//         <Alert
//           message="No Items Available"
//           description="No items found in the database. Please contact the Supply Chain team to add items to the database."
//           type="warning"
//           showIcon
//           action={
//             <Button size="small" onClick={() => {
//               const selectedCategory = form.getFieldValue('itemCategory');
//               fetchDatabaseItems(selectedCategory);
//             }} icon={<ReloadOutlined />}>
//               Refresh
//             </Button>
//           }
//         />
//       ) : items.length === 0 ? (
//         <Alert
//           message="No items selected yet"
//           description={`Choose from ${databaseItems.length} approved items in the database by clicking "Add from Database"`}
//           type="info"
//           showIcon
//           action={
//             <Button 
//               type="primary" 
//               size="small" 
//               icon={<PlusOutlined />}
//               onClick={handleAddItem}
//             >
//               Add First Item
//             </Button>
//           }
//         />
//       ) : (
//         <Table
//           columns={itemColumns}
//           dataSource={items}
//           pagination={false}
//           rowKey={(record, index) => index}
//           size="small"
//           scroll={{ x: 800 }}
//           summary={() => (
//             <Table.Summary.Row>
//               <Table.Summary.Cell index={0} colSpan={4}>
//                 <Text strong>Total Estimated Cost:</Text>
//               </Table.Summary.Cell>
//               <Table.Summary.Cell index={4}>
//                 <Text strong style={{ color: '#1890ff' }}>
//                   {calculateTotalCost.toLocaleString()} XAF
//                 </Text>
//               </Table.Summary.Cell>
//               <Table.Summary.Cell index={5} colSpan={2} />
//             </Table.Summary.Row>
//           )}
//         />
//       )}
//     </Card>
//   );

//   const renderJustifications = () => (
//     <Card size="small" title="Justifications" style={{ marginBottom: '24px' }}>
//       <Row gutter={[16, 16]}>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="justificationOfPurchase"
//             label="Justification for Purchase"
//             rules={[{ required: true, message: 'Please provide justification' }]}
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain why these items are needed..."
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>
//         </Col>
//         <Col xs={24} md={12}>
//           <Form.Item
//             name="justificationOfPreferredSupplier"
//             label="Justification of Preferred Supplier (Optional)"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Explain why you prefer a specific supplier (if any)"
//               showCount
//               maxLength={500}
//             />
//           </Form.Item>
//         </Col>
//       </Row>
//     </Card>
//   );

//   const renderActionButtons = () => (
//     <Card size="small">
//       <Space>
//         <Button onClick={onCancel}>
//           Cancel
//         </Button>
//         <Button 
//           onClick={handleSaveDraft}
//           icon={<SaveOutlined />}
//         >
//           Save Draft
//         </Button>
//         <Button 
//           type="primary" 
//           htmlType="submit" 
//           loading={loading}
//           icon={<SendOutlined />}
//           disabled={items.length === 0 || !selectedBudgetCode}
//         >
//           {editData ? 'Update Requisition' : 'Submit Requisition'}
//         </Button>
//       </Space>
//     </Card>
//   );

//   const renderAddItemModal = () => (
//     <Modal
//       title="Add Item from Database"
//       open={showItemModal}
//       onOk={handleItemModalOk}
//       onCancel={() => {
//         setShowItemModal(false);
//         itemForm.resetFields();
//       }}
//       width={700}
//       okText={editingItem !== null ? "Update Item" : "Add Item"}
//     >
//       <Alert
//         message="Database Item Selection"
//         description={`Select from ${databaseItems.length} pre-approved items. Contact Supply Chain team if your item is not listed.`}
//         type="warning"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Form form={itemForm} layout="vertical">
//         <Form.Item
//           name="itemId"
//           label="Select Item"
//           rules={[{ required: true, message: 'Please select an item' }]}
//         >
//           <Select
//             placeholder="Search and select from approved items"
//             showSearch
//             optionFilterProp="children"
//             loading={loadingItems}
//             filterOption={(input, option) => {
//               const item = databaseItems.find(item => (item._id || item.id) === option.value);
//               if (!item) return false;
//               return (
//                 item.description.toLowerCase().includes(input.toLowerCase()) ||
//                 item.code.toLowerCase().includes(input.toLowerCase()) ||
//                 item.category.toLowerCase().includes(input.toLowerCase())
//               );
//             }}
//           >
//             {databaseItems.map(item => (
//               <Option key={item._id || item.id} value={item._id || item.id}>
//                 <div>
//                   <Text strong>{item.code}</Text> - {item.description}
//                   <br />
//                   <Text type="secondary" style={{ fontSize: '12px' }}>
//                     {item.category} | Unit: {item.unitOfMeasure} |
//                     {item.standardPrice ? ` Price: ${item.standardPrice.toLocaleString()} XAF` : ' Price: TBD'}
//                   </Text>
//                 </div>
//               </Option>
//             ))}
//           </Select>
//         </Form.Item>

//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item
//               name="quantity"
//               label="Quantity"
//               rules={[
//                 { required: true, message: 'Please enter quantity' },
//                 { type: 'number', min: 1, message: 'Quantity must be at least 1' }
//               ]}
//             >
//               <InputNumber 
//                 style={{ width: '100%' }}
//                 min={1}
//                 placeholder="Enter quantity"
//               />
//             </Form.Item>
//           </Col>
//         </Row>

//         {itemForm.getFieldValue('itemId') && (
//           <Alert
//             message="Selected Item Details"
//             description={(() => {
//               const item = databaseItems.find(i => (i._id || i.id) === itemForm.getFieldValue('itemId'));
//               const quantity = itemForm.getFieldValue('quantity') || 1;
//               return item ? (
//                 <div>
//                   <Row gutter={16}>
//                     <Col span={12}>
//                       <Text><strong>Code:</strong> {item.code}</Text><br />
//                       <Text><strong>Description:</strong> {item.description}</Text><br />
//                       <Text><strong>Category:</strong> {item.category} - {item.subcategory}</Text><br />
//                       <Text><strong>Unit:</strong> {item.unitOfMeasure}</Text>
//                     </Col>
//                     <Col span={12}>
//                       {item.standardPrice && (
//                         <>
//                           <Text><strong>Unit Price:</strong> {item.standardPrice.toLocaleString()} XAF</Text><br />
//                           <Text><strong>Total Est.:</strong> {(item.standardPrice * quantity).toLocaleString()} XAF</Text><br />
//                         </>
//                       )}
//                       {item.supplier && (
//                         <Text><strong>Preferred Supplier:</strong> {item.supplier}</Text>
//                       )}
//                     </Col>
//                   </Row>
//                 </div>
//               ) : null;
//             })()}
//             type="info"
//             style={{ marginTop: '16px' }}
//           />
//         )}
//       </Form>
//     </Modal>
//   );

//   const renderRequestNewItemModal = () => (
//     <Modal
//       title="Request New Item"
//       open={showRequestModal}
//       onOk={handleRequestModalOk}
//       onCancel={() => {
//         setShowRequestModal(false);
//         requestForm.resetFields();
//       }}
//       width={600}
//       okText="Submit Request"
//     >
//       <Alert
//         message="Request New Item Addition"
//         description="Submit a request to add a new item to the database. The Supply Chain team will review and approve items before they become available for selection."
//         type="info"
//         showIcon
//         style={{ marginBottom: '16px' }}
//       />

//       <Form form={requestForm} layout="vertical">
//         <Form.Item
//           name="description"
//           label="Item Description"
//           rules={[
//             { required: true, message: 'Please describe the item' },
//             { min: 10, message: 'Description must be at least 10 characters' }
//           ]}
//         >
//           <Input placeholder="Describe the item you need in detail" />
//         </Form.Item>

//         <Row gutter={16}>
//           <Col span={12}>
//             <Form.Item
//               name="category"
//               label="Category"
//               rules={[{ required: true, message: 'Please select category' }]}
//             >
//               <Select placeholder="Select category">
//                 {ITEM_CATEGORIES.map(category => (
//                   <Option key={category} value={category}>
//                     {category}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//           <Col span={12}>
//             <Form.Item
//               name="unitOfMeasure"
//               label="Unit of Measure"
//               rules={[{ required: true, message: 'Please specify unit' }]}
//             >
//               <Select placeholder="Select unit">
//                 {UNITS_OF_MEASURE.map(unit => (
//                   <Option key={unit} value={unit}>
//                     {unit}
//                   </Option>
//                 ))}
//               </Select>
//             </Form.Item>
//           </Col>
//         </Row>

//         <Form.Item
//           name="justification"
//           label="Justification"
//           rules={[{ required: true, message: 'Please justify why this item is needed' }]}
//         >
//           <TextArea
//             rows={4}
//             placeholder="Explain why this item is needed and why it should be added to the database..."
//             maxLength={500}
//             showCount
//           />
//         </Form.Item>

//         <Form.Item
//           name="estimatedPrice"
//           label="Estimated Price (XAF) - Optional"
//           help="If you know the approximate price, please include it"
//         >
//           <InputNumber
//             style={{ width: '100%' }}
//             min={0}
//             formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//             parser={value => value.replace(/\$\s?|(,)/g, '')}
//             placeholder="Estimated price in XAF"
//           />
//         </Form.Item>

//         <Form.Item
//           name="preferredSupplier"
//           label="Preferred Supplier - Optional"
//         >
//           <Input placeholder="Suggest a supplier if you have one in mind" />
//         </Form.Item>
//       </Form>

//       <Alert
//         message="Request Process"
//         description="Your request will be sent to the Supply Chain team for review. You'll be notified when the item is approved and available for selection. This may take 1-3 business days."
//         type="warning"
//         style={{ marginTop: '16px' }}
//       />
//     </Modal>
//   );

//   return (
//     <div>
//       <Card>
//         {renderHeader()}
//         {renderDatabaseAlert()}

//         <Form form={form} layout="vertical" onFinish={handleSubmit}>
//           {renderRequisitionInfo()}
//           {renderRequesterDetails()}
//           {renderBudgetCodeSelection()}
//           {renderProjectAndSupplierSelection()}
//           {renderBudgetInfo()}
//           {renderItemsSection()}
//           {renderAttachments()}
//           {renderJustifications()}
//           {renderActionButtons()}
//         </Form>
//       </Card>

//       {renderAddItemModal()}
//       {renderRequestNewItemModal()}
//     </div>
//   );
// };

// export default EnhancedPurchaseRequisitionForm;



