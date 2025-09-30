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
  Progress
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
  InboxOutlined
} from '@ant-design/icons';
import { purchaseRequisitionAPI } from '../../services/purchaseRequisitionAPI';
import { projectAPI } from '../../services/projectAPI';
import { itemAPI } from '../../services/itemAPI';
import moment from 'moment';

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
  // Redux state
  const { user } = useSelector((state) => state.auth);

  // Form instances
  const [form] = Form.useForm();
  const [itemForm] = Form.useForm();
  const [requestForm] = Form.useForm();

  // State management
  const [state, setState] = useState({
    loading: false,
    loadingItems: true,
    loadingProjects: false,
    fetchError: null,
    showItemModal: false,
    showRequestModal: false,
    editingItem: null
  });

  const [items, setItems] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [databaseItems, setDatabaseItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectBudgetInfo, setProjectBudgetInfo] = useState(null);

  // Utility functions
  const generateRequisitionNumber = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `REQ${year}${month}${day}${random}`;
  }, []);

  const calculateTotalCost = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.estimatedPrice * item.quantity || 0), 0);
  }, [items]);

  // State update helper
  const updateState = useCallback((updates) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const validateFile = useCallback((file) => {
    const fileName = file.name || file.originalname || '';
    const fileSize = file.size || 0;
    const fileExt = fileName.includes('.') ? 
      '.' + fileName.split('.').pop().toLowerCase() : '';

    // Check file size
    if (fileSize > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File "${fileName}" exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(fileExt)) {
      return {
        valid: false,
        error: `File type "${fileExt}" not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`
      };
    }

    return { valid: true };
  }, []);

  // API functions (keeping existing ones, adding file handling)
  const fetchDatabaseItems = useCallback(async (categoryFilter = null) => {
    try {
      updateState({ loadingItems: true, fetchError: null });
      
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
        updateState({ fetchError: response.message || 'Failed to load item database' });
      }
    } catch (error) {
      console.error('Error fetching database items:', error);
      setDatabaseItems([]);
      updateState({ fetchError: error.message || 'Failed to connect to item database' });
    } finally {
      updateState({ loadingItems: false });
    }
  }, [updateState]);

  const fetchProjects = useCallback(async () => {
    try {
      updateState({ loadingProjects: true });
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
      updateState({ loadingProjects: false });
    }
  }, [updateState]);

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

  // Form initialization
  const initializeForm = useCallback(() => {
    if (editData) {
      const formData = {
        ...editData,
        expectedDate: editData.expectedDate ? moment(editData.expectedDate) : moment().add(14, 'days'),
        date: editData.createdAt ? moment(editData.createdAt) : moment(),
        project: editData.project
      };
      form.setFieldsValue(formData);
      setItems(editData.items || []);
      setSelectedProject(editData.project);
      
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
  }, [editData, form, generateRequisitionNumber, user]);

  // Component initialization
  useEffect(() => {
    // Load projects and database items on component mount
    fetchProjects();
    fetchDatabaseItems();
    initializeForm();
  }, [fetchProjects, fetchDatabaseItems, initializeForm]);

  // Project selection effect
  useEffect(() => {
    if (selectedProject) {
      fetchProjectBudgetInfo(selectedProject);
    } else {
      setProjectBudgetInfo(null);
    }
  }, [selectedProject, fetchProjectBudgetInfo]);

  const handleAddItem = useCallback(() => {
    if (state.loadingItems) {
      message.warning('Please wait while items are loading...');
      return;
    }
    
    if (state.fetchError) {
      message.error('Cannot add items: ' + state.fetchError);
      return;
    }
    
    if (!databaseItems || databaseItems.length === 0) {
      message.error('No items available in database. Please contact Supply Chain team.');
      return;
    }
    
    updateState({ editingItem: null, showItemModal: true });
    itemForm.resetFields();
  }, [state.loadingItems, state.fetchError, databaseItems, itemForm, updateState]);

  const handleEditItem = useCallback((item, index) => {
    updateState({ editingItem: index, showItemModal: true });
    itemForm.setFieldsValue({
      itemId: item.itemId,
      quantity: item.quantity,
      projectName: item.projectName
    });
  }, [itemForm, updateState]);

  const handleDeleteItem = useCallback((index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    message.success('Item removed successfully');
  }, [items]);

  const handleItemModalOk = useCallback(async () => {
    try {
      const values = await itemForm.validateFields();
      const selectedItem = databaseItems.find(item => 
        (item._id || item.id) === values.itemId
      );

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

      if (state.editingItem !== null) {
        const newItems = [...items];
        newItems[state.editingItem] = itemData;
        setItems(newItems);
        message.success('Item updated successfully');
      } else if (existingItemIndex !== -1) {
        Modal.confirm({
          title: 'Item Already Added',
          content: `"${selectedItem.description}" is already in your list. Do you want to add to the existing quantity?`,
          onOk() {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += values.quantity;
            setItems(newItems);
            message.success('Quantity updated successfully');
          }
        });
      } else {
        setItems(prev => [...prev, itemData]);
        message.success('Item added successfully');
      }

      updateState({ showItemModal: false });
      itemForm.resetFields();
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('Failed to add item. Please try again.');
    }
  }, [itemForm, databaseItems, items, state.editingItem, updateState]);

  // Request new item functionality (keeping existing)
  const handleRequestNewItem = useCallback(() => {
    updateState({ showRequestModal: true });
    requestForm.resetFields();
  }, [requestForm, updateState]);

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
        updateState({ showRequestModal: false });
        requestForm.resetFields();
      } else {
        message.error(response.message || 'Failed to submit item request');
      }
    } catch (error) {
      console.error('Request failed:', error);
      message.error('Failed to submit item request');
    }
  }, [requestForm, user, form, updateState]);

  // FIXED: File upload handling
  const handleAttachmentChange = useCallback(({ fileList }) => {
    console.log('Attachment change:', fileList);
    
    // Process new uploads and validate them
    const processedFiles = fileList.map(file => {
      // Handle existing files
      if (file.existing) {
        return file;
      }
      
      // Handle new uploads
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
          status: file.status || 'done'
        };
      }
      
      return file;
    });

    // Filter out error files and removed files
    const validFiles = processedFiles.filter(file => 
      file.status !== 'error' && file.status !== 'removed'
    );
    
    // Check file count limit
    if (validFiles.length > MAX_FILES) {
      message.error(`Maximum ${MAX_FILES} files allowed`);
      return;
    }

    setAttachments(validFiles);
  }, [validateFile]);

  const customUploadRequest = useCallback(({ file, onSuccess, onError }) => {
    setTimeout(() => {
      onSuccess("ok");
    }, 0);
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (values) => {
    if (items.length === 0) {
      message.error('Please add at least one item to the requisition');
      return;
    }

    // Validate project budget if project is selected
    if (selectedProject && projectBudgetInfo) {
      if (calculateTotalCost > projectBudgetInfo.budgetRemaining) {
        Modal.confirm({
          title: 'Budget Warning',
          content: `The total estimated cost (XAF ${calculateTotalCost.toLocaleString()}) exceeds the remaining project budget (XAF ${projectBudgetInfo.budgetRemaining.toLocaleString()}). Do you want to continue?`,
          onOk() {
            submitRequisition(values);
          }
        });
        return;
      }
    }

    submitRequisition(values);
  }, [items, selectedProject, projectBudgetInfo, calculateTotalCost]);

  const submitRequisition = useCallback(async (values) => {
    updateState({ loading: true });
    try {
      const submissionData = {
        ...values,
        expectedDate: values.expectedDate.format('YYYY-MM-DD'),
        items,
        attachments: attachments.filter(att => !att.existing), // Only send new attachments
        project: selectedProject,
        submittedBy: user?.email,
        submittedDate: new Date(),
        status: 'pending_supervisor',
        totalEstimatedCost: calculateTotalCost
      };

      const validItems = items.filter(item => item.itemId);
      
      if (validItems.length !== items.length) {
        message.error('Some items are missing database references. Please re-add them from the database.');
        return;
      }

      console.log('Submitting requisition with attachments:', submissionData.attachments.length);

      const response = await purchaseRequisitionAPI.createRequisition(submissionData);

      if (response.success) {
        message.success('Purchase requisition submitted successfully!');
        
        // Show attachment upload status if any
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
      updateState({ loading: false });
    }
  }, [items, attachments, selectedProject, user, calculateTotalCost, onSubmit, updateState]);

  const handleSaveDraft = useCallback(async () => {
    try {
      const values = await form.getFieldsValue();
      const draftData = {
        ...values,
        expectedDate: values.expectedDate ? values.expectedDate.format('YYYY-MM-DD') : moment().add(14, 'days').format('YYYY-MM-DD'),
        items,
        project: selectedProject,
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
  }, [form, items, selectedProject, calculateTotalCost, onSaveDraft]);

  const handleDownloadAttachment = useCallback(async (attachment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('Authentication required');
        return;
      }

      // Extract publicId from Cloudinary URL
      let publicId = '';
      if (attachment.url) {
        const urlParts = attachment.url.split('/');
        const uploadIndex = urlParts.findIndex(part => part === 'upload');
        if (uploadIndex !== -1 && uploadIndex + 2 < urlParts.length) {
          publicId = urlParts.slice(uploadIndex + 2).join('/');
          // Remove file extension from publicId
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
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = url;
      link.download = attachment.originalName || attachment.name || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
      
      message.success('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      message.error('Failed to download attachment');
      
      // Fallback to direct URL if download fails
      if (attachment.url) {
        window.open(attachment.url, '_blank');
      }
    }
  }, []);

  // FIXED: Render attachments section
  const renderAttachments = () => (
    <Card size="small" title="Attachments (Optional)" style={{ marginBottom: '24px' }}>
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
              // For new files, create a blob URL for preview
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

  // Table columns (keeping existing)
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
            {state.loadingItems ? ' Loading items...' : ` ${databaseItems.length} items available.`}
            {state.fetchError && ' (Error loading items)'}
          </span>
          <Space>
            <Button
              type="link"
              size="small"
              onClick={handleRequestNewItem}
              disabled={state.loadingItems}
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
              loading={state.loadingItems}
            >
              Refresh
            </Button>
          </Space>
        </div>
      }
      type={state.fetchError ? "error" : state.loadingItems ? "info" : "success"}
      showIcon
      icon={<DatabaseOutlined />}
      style={{ marginBottom: '24px' }}
    />
  );

  const renderRequisitionInfo = () => (
    <Card size="small" title="Requisition Information" style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={6}>
          <Form.Item
            name="requisitionNumber"
            label="Requisition Number"
          >
            <Input disabled />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
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
        <Col xs={24} md={6}>
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
        <Col xs={24} md={6}>
          <Form.Item
            name="budgetHolder"
            label="Budget Holder"
            rules={[{ required: true, message: 'Please enter budget holder' }]}
          >
            <Input placeholder="e.g., HR/IT" />
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
            <DatePicker style={{ width: '100%' }} />
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

  const renderProjectSelection = () => (
    <Card 
      size="small" 
      title={
        <Space>
          <ProjectOutlined />
          Project Assignment (Optional)
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
              loading={state.loadingProjects}
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
          {state.loadingProjects && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Spin />
              <div style={{ marginTop: '8px' }}>
                <Text type="secondary">Loading projects...</Text>
              </div>
            </div>
          )}
          {!state.loadingProjects && projects.length === 0 && (
            <Alert
              message="No Active Projects"
              description="No active projects found. You can still create the requisition without assigning it to a project."
              type="info"
              showIcon
            />
          )}
        </Col>
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
                    XAF {projectBudgetInfo.budgetRemaining.toLocaleString()}
                  </Text>
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
    </Card>
  );

  const renderBudgetInfo = () => (
    <Card size="small" title="Budget Information" style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]} align="middle">
        <Col xs={24} md={12}>
          <Form.Item
            name="budgetXAF"
            label="Budget (XAF)"
            help="Enter estimated budget in Central African Francs"
          >
            <InputNumber
              style={{ width: '100%' }}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,)/g, '')}
              placeholder="Enter budget amount"
              addonBefore={<DollarOutlined />}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Alert
            message={`Estimated Total: ${calculateTotalCost.toLocaleString()} XAF`}
            description={
              calculateTotalCost > 0 
                ? `Based on ${items.length} selected items with known prices` 
                : "Add items to see estimated cost"
            }
            type="info"
            showIcon
          />
        </Col>
      </Row>
    </Card>
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
              loading={state.loadingItems}
              disabled={state.fetchError || databaseItems.length === 0}
            >
              Add from Database
            </Button>
          </Space>
        </div>
      } 
      style={{ marginBottom: '24px' }}
    >
      {state.loadingItems ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>
            <Text>Loading item database...</Text>
          </div>
        </div>
      ) : state.fetchError ? (
        <Alert
          message="Item Database Error"
          description={state.fetchError}
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

  const renderJustifications = () => (
    <Card size="small" title="Justifications" style={{ marginBottom: '24px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            name="justificationOfPurchase"
            label="Justification for Purchase"
            rules={[{ required: true, message: 'Please provide justification' }]}
          >
            <TextArea
              rows={4}
              placeholder="Explain why these items are needed..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Col>
        <Col xs={24} md={12}>
          <Form.Item
            name="justificationOfPreferredSupplier"
            label="Justification of Preferred Supplier (Optional)"
          >
            <TextArea
              rows={4}
              placeholder="Explain why you prefer a specific supplier (if any)"
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Col>
      </Row>
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
          loading={state.loading}
          icon={<SendOutlined />}
          disabled={items.length === 0}
        >
          {editData ? 'Update Requisition' : 'Submit Requisition'}
        </Button>
      </Space>
    </Card>
  );

  const renderAddItemModal = () => (
    <Modal
      title="Add Item from Database"
      open={state.showItemModal}
      onOk={handleItemModalOk}
      onCancel={() => {
        updateState({ showItemModal: false });
        itemForm.resetFields();
      }}
      width={700}
      okText={state.editingItem !== null ? "Update Item" : "Add Item"}
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
            loading={state.loadingItems}
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
          <Col span={12}>
            <Form.Item
              name="projectName"
              label="Project Name (Optional)"
            >
              <Input placeholder="Enter project name if applicable" />
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
      open={state.showRequestModal}
      onOk={handleRequestModalOk}
      onCancel={() => {
        updateState({ showRequestModal: false });
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
              <Select placeholder="Select category">
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
              <Select placeholder="Select unit">
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
    <div>
      <Card>
        {renderHeader()}
        {renderDatabaseAlert()}

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {renderRequisitionInfo()}
          {renderRequesterDetails()}
          {renderProjectSelection()}
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
  );
};


export default EnhancedPurchaseRequisitionForm;




