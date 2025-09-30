import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Space,
  Typography,
  Tag,
  Alert,
  Row,
  Col,
  Popconfirm,
  message,
  Switch,
  Tabs,
  Statistic,
  Upload,
  Radio
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileExcelOutlined,
  UploadOutlined,
  PictureOutlined
} from '@ant-design/icons';
import { itemAPI } from '../../services/itemAPI';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { TabPane } = Tabs;

const SupplyChainItemManagement = () => {
  const { user } = useSelector((state) => state.auth || {});
  const [items, setItems] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [processingRequest, setProcessingRequest] = useState(null);
  const [form] = Form.useForm();
  const [requestForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('items');

  // Track selected categories for dynamic subcategory options
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [requestSelectedCategory, setRequestSelectedCategory] = useState(null);

  // New enhancement states
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const categories = [
    'IT Accessories',
    'Office Supplies',
    'Equipment',
    'Consumables',
    'Software',
    'Hardware',
    'Furniture',
    'Safety Equipment',
    'Maintenance Supplies',
    'Personal Accessories',
    'Other'
  ];

  const subcategories = {
    'IT Accessories': ['Input Devices', 'Displays', 'Storage Devices', 'Cables & Connectors', 'Other IT'],
    'Office Supplies': ['Paper Products', 'Writing Materials', 'Filing & Organization', 'Presentation Materials'],
    'Equipment': ['Audio/Visual', 'Computing Equipment', 'Telecommunication', 'Other Equipment'],
    'Hardware': ['Memory', 'Storage', 'Processors', 'Motherboards', 'Other Hardware'],
    'Consumables': ['Printer Supplies', 'Cleaning Supplies', 'Kitchen Supplies', 'Other Consumables'],
    'Software': ['Operating Systems', 'Applications', 'Utilities', 'Other Software'],
    'Furniture': ['Office Chairs', 'Desks', 'Storage', 'Meeting Room', 'Other Furniture'],
    'Safety Equipment': ['PPE', 'First Aid', 'Fire Safety', 'Other Safety'],
    'Maintenance Supplies': ['Cleaning', 'Repair Tools', 'Spare Parts', 'Other Maintenance'],
    'Personal Accessories': ['Electronics', 'Household Items', 'Personal Care', 'Entertainment', 'Other Personal'],
    'Other': ['Miscellaneous']
  };

  const measurementUnits = [
    'Pieces', 'Sets', 'Boxes', 'Packs', 'Units', 'Kg', 'Litres', 'Meters', 'Pairs', 'Each', 'Reams'
  ];

  useEffect(() => {
    fetchItems();
    fetchItemRequests();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchText, categoryFilter, statusFilter, items]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await itemAPI.getItems();
      if (response && response.success && Array.isArray(response.data)) {
        setItems(response.data);
      } else {
        console.error('Invalid response format:', response);
        setItems([]);
        message.error(response?.message || 'Failed to fetch items');
      }
    } catch (error) {
      console.error('Fetch items error:', error);
      setItems([]);
      message.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const fetchItemRequests = async () => {
    try {
      const response = await itemAPI.getItemRequests();
      if (response && response.success && Array.isArray(response.data)) {
        setItemRequests(response.data);
      } else {
        console.error('Invalid response format:', response);
        setItemRequests([]);
        if (response?.message) {
          message.error(response.message);
        }
      }
    } catch (error) {
      console.error('Fetch item requests error:', error);
      setItemRequests([]);
      message.error('Failed to fetch item requests');
    }
  };

  const filterItems = () => {
    if (!Array.isArray(items)) {
      setFilteredItems([]);
      return;
    }

    let filtered = [...items];

    if (searchText) {
      filtered = filtered.filter(item =>
        (item.description || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (item.code || '').toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(item => item.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item =>
        statusFilter === 'active' ? item.isActive : !item.isActive
      );
    }

    setFilteredItems(filtered);
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setSelectedCategory(null);
    form.resetFields();
    setShowItemModal(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setSelectedCategory(item.category);
    form.setFieldsValue(item);
    
    // Handle existing image
    if (item.imageUrl) {
      const secureImageUrl = getImageUrl(item.imageUrl);
      setImageFile({
        uid: '-1',
        name: 'existing-image',
        status: 'done',
        url: secureImageUrl,
        originUrl: item.imageUrl // Keep original for updates
      });
      setImagePreview(secureImageUrl);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
    
    setShowItemModal(true);
  };

  const handleCategoryChange = (value) => {
    setSelectedCategory(value);
    form.setFieldsValue({ subcategory: undefined });
  };

  const handleRequestCategoryChange = (value) => {
    setRequestSelectedCategory(value);
    requestForm.setFieldsValue({ subcategory: undefined });
  };

  const handleDeleteItem = async (itemId) => {
    try {
      console.log('Deleting item with ID:', itemId);
      if (!itemId) {
        console.error('No item ID provided for deletion');
        message.error('No item ID provided');
        return;
      }
      
      const response = await itemAPI.deleteItem(itemId);
      console.log('Delete response:', response);
      
      if (response && response.success) {
        message.success('Item deleted successfully');
        fetchItems();
      } else {
        message.error(response?.message || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Delete item error:', error);
      message.error('Failed to delete item');
    }
  };

  const handleToggleStatus = async (itemId, currentStatus) => {
    try {
      const response = await itemAPI.toggleItemStatus(itemId, !currentStatus);
      if (response && response.success) {
        message.success('Item status updated');
        fetchItems();
      } else {
        message.error(response?.message || 'Failed to update item status');
      }
    } catch (error) {
      console.error('Toggle status error:', error);
      message.error('Failed to update item status');
    }
  };

  // Enhanced handlers for new functionality
  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      // Update form value
      form.setFieldsValue({ category: newCategoryName.trim() });
      setSelectedCategory(newCategoryName.trim());
      setShowNewCategoryInput(false);
      setNewCategoryName('');
      message.success(`New category "${newCategoryName.trim()}" will be created with this item`);
    }
  };

  const handleImageChange = ({ fileList }) => {
    console.log('Image change event:', fileList);
    
    if (fileList.length > 0) {
      const file = fileList[0];
      
      // Validate file type
      const isImage = file.type && file.type.startsWith('image/');
      if (!isImage && file.originFileObj) {
        message.error('Please upload only image files (JPG, PNG, GIF, etc.)');
        return;
      }
      
      // Validate file size (max 5MB)
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M && file.originFileObj) {
        message.error('Image must be smaller than 5MB');
        return;
      }
      
      setImageFile(file);
      
      // Create preview URL
      if (file.originFileObj) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
          console.log('Image preview set for new file');
        };
        reader.readAsDataURL(file.originFileObj);
      } else if (file.url) {
        const secureUrl = getImageUrl(file.url);
        setImagePreview(secureUrl);
        console.log('Image preview set for existing file using secure URL');
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
      console.log('Image cleared');
    }
    
    // Trigger form validation for the image field
    setTimeout(() => {
      form.validateFields(['image']);
    }, 100);
  };

  // Component for rendering item images safely
  const ItemImage = ({ imageUrl, description }) => {
    const [imageError, setImageError] = React.useState(false);
    const secureImageUrl = getImageUrl(imageUrl);
    
    console.log('ItemImage render:', {
      description,
      originalImageUrl: imageUrl,
      secureImageUrl,
      imageError
    });
    
    return (
      <div style={{ 
        width: '60px', 
        height: '60px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px',
        border: '1px solid #d9d9d9',
        overflow: 'hidden'
      }}>
        {secureImageUrl && !imageError ? (
          <img
            src={secureImageUrl}
            alt={description || 'Item image'}
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover'
            }}
            onError={() => {
              console.error('Image load error for item:', description, 'URL:', secureImageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('Image loaded successfully for item:', description, 'URL:', secureImageUrl);
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: '#bfbfbf',
            fontSize: '12px'
          }}>
            {secureImageUrl ? 'Error' : 'No Image'}
          </div>
        )}
      </div>
    );
  };

  // Helper function to get secure image URL
  const getImageUrl = (imageUrlOrFilename) => {
    console.log('getImageUrl called with:', imageUrlOrFilename, 'type:', typeof imageUrlOrFilename);
    
    if (!imageUrlOrFilename || imageUrlOrFilename === 'undefined' || imageUrlOrFilename.trim() === '') {
      console.log('No image URL provided');
      return null;
    }
    
    // If it's already a full URL (like base64 data), return as is
    if (imageUrlOrFilename.startsWith('data:')) {
      console.log('Using base64 data URL');
      return imageUrlOrFilename;
    }
    
    if (imageUrlOrFilename.startsWith('http')) {
      console.log('Using external HTTP URL');
      return imageUrlOrFilename;
    }
    
    // If it looks like a base64 string without the data: prefix, add it
    if (imageUrlOrFilename.length > 100 && !imageUrlOrFilename.includes('/') && !imageUrlOrFilename.includes('.')) {
      console.log('Looks like base64 without prefix, adding data:image prefix');
      // Assume it's a base64 image without the data: prefix
      return `data:image/jpeg;base64,${imageUrlOrFilename}`;
    }
    
    // If it's a filename, construct the public image viewing URL
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';
    const secureUrl = `${apiUrl}/files/image/${imageUrlOrFilename}`;
    console.log('Generated public image URL:', secureUrl);
    return secureUrl;
  };

  // Upload image to server and get the file URL
  const uploadImageToServer = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile.originFileObj);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/items/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (data.success) {
        return data.data.imageUrl; // This will be the filename
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  };

  const handleItemSubmit = async () => {
    try {
      console.log('=== FORM SUBMISSION START ===');
      console.log('editingItem:', editingItem);
      console.log('imageFile:', imageFile);
      console.log('imagePreview:', imagePreview);
      
      console.log('Starting form validation...');
      const values = await form.validateFields();
      console.log('Form values validated:', values);
      
      // Prepare item data
      const itemData = {
        ...values,
        createdBy: user?.fullName || user?.email || 'Unknown'
      };

      // Remove the image field from form data since it's handled separately
      if (itemData.image) {
        delete itemData.image;
      }

      // Handle image upload
      if (imageFile && imageFile.originFileObj) {
        try {
          message.loading('Uploading image...', 0);
          const imageUrl = await uploadImageToServer(imageFile);
          itemData.imageUrl = imageUrl;
          message.destroy(); // Clear loading message
          console.log('Image uploaded successfully:', imageUrl);
        } catch (error) {
          message.destroy(); // Clear loading message
          console.error('Error uploading image:', error);
          message.error('Failed to upload image. Please try again.');
          return;
        }
      } else if (imageFile && imageFile.url) {
        // Existing image - use original URL if available, otherwise use current URL
        itemData.imageUrl = imageFile.originUrl || imageFile.url;
        console.log('Using existing image:', itemData.imageUrl);
      } else if (editingItem && editingItem.imageUrl) {
        // Keep existing image if no new image uploaded
        itemData.imageUrl = editingItem.imageUrl;
        console.log('Keeping existing image');
      }

      console.log('Submitting item data:', itemData);
      console.log('Editing item:', editingItem);

      let response;
      if (editingItem) {
        const itemId = editingItem._id || editingItem.id;
        console.log('Using item ID for update:', itemId);
        response = await itemAPI.updateItem(itemId, itemData);
        if (response && response.success) {
          message.success('Item updated successfully');
        }
      } else {
        response = await itemAPI.createItem(itemData);
        if (response && response.success) {
          message.success('Item created successfully');
        }
      }

      if (response && response.success) {
        fetchItems();
        setShowItemModal(false);
        setEditingItem(null);
        setSelectedCategory(null);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        setImageFile(null);
        setImagePreview(null);
        form.resetFields();
      } else {
        console.error('API response error:', response);
        const errorMessage = response?.message || response?.error || 'Failed to save item';
        message.error(`Error: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Item submit error:', error);
      
      // Check if it's a validation error
      if (error.errorFields && error.errorFields.length > 0) {
        const errorField = error.errorFields[0];
        message.error(`Validation error: ${errorField.errors[0]} (Field: ${errorField.name[0]})`);
      } else if (error.response && error.response.data) {
        // API error
        const errorMessage = error.response.data.message || error.response.data.error || 'Server error occurred';
        message.error(`Server Error: ${errorMessage}`);
      } else {
        message.error('Failed to save item');
      }
    }
  };

  const generateItemCode = (category) => {
    const categoryMap = {
      'IT Accessories': 'IT',
      'Office Supplies': 'OFF',
      'Equipment': 'EQP',
      'Consumables': 'CON',
      'Software': 'SW',
      'Hardware': 'HW',
      'Furniture': 'FUR',
      'Safety Equipment': 'SAF',
      'Maintenance Supplies': 'MNT',
      'Other': 'OTH'
    };
    const prefix = categoryMap[category] || 'ITM';
    const number = String((Array.isArray(items) ? items.length : 0) + 1).padStart(3, '0');
    return `${prefix}-${number}`;
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingItem) {
        const response = await itemAPI.updateItem(editingItem.id, values);
        if (response && response.success) {
          message.success('Item updated successfully');
          fetchItems();
        } else {
          message.error(response?.message || 'Failed to update item');
        }
      } else {
        const itemData = {
          ...values,
          code: generateItemCode(values.category),
          createdBy: user?.fullName || user?.email || 'Unknown'
        };
        const response = await itemAPI.createItem(itemData);
        if (response && response.success) {
          message.success('Item added successfully');
          fetchItems();
        } else {
          message.error(response?.message || 'Failed to create item');
        }
      }

      setShowItemModal(false);
      setSelectedCategory(null);
      form.resetFields();
    } catch (error) {
      console.error('Modal validation failed:', error);
    }
  };

  const handleProcessRequest = (request, action) => {
    setProcessingRequest({ ...request, action });
    if (action === 'create_item') {
      setRequestSelectedCategory(request.category);
      requestForm.setFieldsValue({
        description: request.description,
        category: request.category,
        subcategory: request.subcategory,
        unitOfMeasure: request.unitOfMeasure,
        justification: request.justification
      });
    }
    setShowRequestModal(true);
  };

  const handleRequestModalOk = async () => {
    try {
      if (processingRequest.action === 'create_item') {
        const values = await requestForm.validateFields();
        const itemData = {
          ...values,
          code: generateItemCode(values.category),
          createdBy: user?.fullName || user?.email || 'Unknown',
          requestId: processingRequest.id
        };

        const response = await itemAPI.processItemRequest(
          processingRequest.id,
          'create_item',
          itemData
        );

        if (response && response.success) {
          message.success('Item created and request approved');
          fetchItems();
          fetchItemRequests();
        } else {
          message.error(response?.message || 'Failed to process request');
        }
      } else {
        const response = await itemAPI.processItemRequest(
          processingRequest.id,
          processingRequest.action
        );

        if (response && response.success) {
          message.success(`Request ${processingRequest.action}d successfully`);
          fetchItemRequests();
        } else {
          message.error(response?.message || 'Failed to process request');
        }
      }

      setShowRequestModal(false);
      setProcessingRequest(null);
      setRequestSelectedCategory(null);
      requestForm.resetFields();
    } catch (error) {
      console.error('Request processing failed:', error);
      message.error('Failed to process request');
    }
  };

  const itemColumns = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 80,
      render: (imageUrl, record) => (
        <ItemImage imageUrl={imageUrl} description={record.description} />
      )
    },
    {
      title: 'Item Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code, record) => (
        <div>
          <Text strong>{code || 'N/A'}</Text>
          <br />
          <Tag color={record.isActive ? 'green' : 'red'} size="small">
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </div>
      )
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description, record) => (
        <div>
          <Text strong>{description || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category || 'N/A'} {record.subcategory && `- ${record.subcategory}`}
          </Text>
        </div>
      )
    },
    {
      title: 'Unit',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
      width: 80,
      align: 'center'
    },
    {
      title: 'Standard Price (XAF)',
      dataIndex: 'standardPrice',
      key: 'standardPrice',
      width: 120,
      align: 'right',
      render: (price) => price ? `${price.toLocaleString()}` : 'N/A'
    },
    {
      title: 'Preferred Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      width: 150,
      render: (supplier) => supplier || 'Not specified'
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastUpdated',
      key: 'lastUpdated',
      width: 100,
      align: 'center',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditItem(record)}
          />
          <Switch
            size="small"
            checked={record.isActive}
            onChange={() => handleToggleStatus(record._id || record.id, record.isActive)}
            checkedChildren="On"
            unCheckedChildren="Off"
          />
          <Popconfirm
            title="Delete this item?"
            description="This will remove the item from the database. Are you sure?"
            onConfirm={() => handleDeleteItem(record._id || record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const requestColumns = [
    {
      title: 'Requested Item',
      dataIndex: 'description',
      key: 'description',
      width: 250,
      render: (description, record) => (
        <div>
          <Text strong>{description || 'N/A'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category || 'N/A'} {record.subcategory && `- ${record.subcategory}`}
          </Text>
        </div>
      )
    },
    {
      title: 'Requested By',
      dataIndex: 'requestedBy',
      key: 'requestedBy',
      width: 150,
      render: (requestedBy, record) => (
        <div>
          <Text>{requestedBy || 'Unknown'}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.department || 'N/A'}
          </Text>
        </div>
      )
    },
    {
      title: 'Unit',
      dataIndex: 'unitOfMeasure',
      key: 'unitOfMeasure',
      width: 80,
      align: 'center'
    },
    {
      title: 'Request Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 100,
      align: 'center',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (status) => {
        const colors = {
          pending: 'orange',
          approved: 'green',
          rejected: 'red',
          completed: 'blue'
        };
        return <Tag color={colors[status] || 'default'}>{(status || 'unknown').toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                type="primary"
                onClick={() => handleProcessRequest(record, 'create_item')}
              >
                Create Item
              </Button>
              <Button
                size="small"
                onClick={() => handleProcessRequest(record, 'approve')}
              >
                Approve
              </Button>
              <Button
                size="small"
                danger
                onClick={() => handleProcessRequest(record, 'reject')}
              >
                Reject
              </Button>
            </>
          )}
          <Button
            size="small"
            icon={<InfoCircleOutlined />}
            onClick={() => {
              Modal.info({
                title: 'Request Details',
                content: (
                  <div>
                    <p><strong>Description:</strong> {record.description || 'N/A'}</p>
                    <p><strong>Category:</strong> {record.category || 'N/A'}</p>
                    {record.subcategory && <p><strong>Subcategory:</strong> {record.subcategory}</p>}
                    <p><strong>Justification:</strong> {record.justification || 'N/A'}</p>
                    <p><strong>Requested by:</strong> {record.requestedBy || 'Unknown'}</p>
                    <p><strong>Department:</strong> {record.department || 'N/A'}</p>
                  </div>
                ),
              });
            }}
          />
        </Space>
      )
    }
  ];

  // Calculate stats with safety checks
  const safeItems = Array.isArray(items) ? items : [];
  const safeItemRequests = Array.isArray(itemRequests) ? itemRequests : [];
  
  const stats = {
    total: safeItems.length,
    active: safeItems.filter(item => item.isActive).length,
    inactive: safeItems.filter(item => !item.isActive).length,
    categories: [...new Set(safeItems.map(item => item.category).filter(Boolean))].length,
    pendingRequests: safeItemRequests.filter(req => req.status === 'pending').length
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ margin: 0 }}>
              <DatabaseOutlined /> Item Master Database
            </Title>
            <Text type="secondary">
              Manage approved items for purchase requisitions
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
              >
                Add New Item
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                onClick={() => message.info('Export functionality coming soon')}
              >
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Active Items"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Categories"
              value={stats.categories}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Pending Requests"
              value={stats.pendingRequests}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Control Policy Alert */}
      <Alert
        message="Item Control Policy"
        description="Only items in this database can be selected in purchase requisitions. Employees can request new items to be added through the item request system."
        type="info"
        icon={<InfoCircleOutlined />}
        showIcon
        style={{ marginBottom: '24px' }}
      />

      {/* Tabs for Items and Requests */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={`Items Database (${stats.total})`} key="items">
            {/* Header with Add Button */}
            <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
              <Col>
                <Title level={4} style={{ margin: 0 }}>Items Database</Title>
              </Col>
              <Col>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingItem(null);
                    setSelectedCategory(null);
                    form.resetFields();
                    setShowItemModal(true);
                  }}
                >
                  Add New Item
                </Button>
              </Col>
            </Row>

            {/* Filters */}
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: '16px' }}>
              <Col xs={24} md={8}>
                <Input
                  placeholder="Search items..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Filter by Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Categories</Option>
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} md={6}>
                <Select
                  placeholder="Filter by Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  style={{ width: '100%' }}
                >
                  <Option value="all">All Status</Option>
                  <Option value="active">Active Only</Option>
                  <Option value="inactive">Inactive Only</Option>
                </Select>
              </Col>
              <Col xs={24} md={4}>
                <Text type="secondary">
                  {Array.isArray(filteredItems) ? filteredItems.length : 0} of {stats.total} items
                </Text>
              </Col>
            </Row>

            {/* Items Table */}
            <Table
              columns={itemColumns}
              dataSource={Array.isArray(filteredItems) ? filteredItems : []}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: 1200 }}
            />
          </TabPane>

          <TabPane tab={`Item Requests (${safeItemRequests.length})`} key="requests">
            <Table
              columns={requestColumns}
              dataSource={safeItemRequests}
              rowKey="id"
              pagination={{
                pageSize: 20,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} requests`,
              }}
              scroll={{ x: 1000 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Add/Edit Item Modal */}
      <Modal
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        open={showItemModal}
        onOk={handleModalOk}
        onCancel={() => {
          setShowItemModal(false);
          setSelectedCategory(null);
          form.resetFields();
        }}
        width={800}
        okText={editingItem ? 'Update Item' : 'Add Item'}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Item Description"
                rules={[
                  { required: true, message: 'Please enter item description' },
                  { min: 10, message: 'Description must be at least 10 characters' }
                ]}
              >
                <Input placeholder="Enter detailed item description" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select
                  placeholder="Select category"
                  onChange={handleCategoryChange}
                >
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subcategory"
                label="Subcategory (Optional)"
              >
                <Select 
                  placeholder="Select subcategory" 
                  disabled={!selectedCategory}
                  allowClear
                >
                  {selectedCategory &&
                    subcategories[selectedCategory]?.map(sub => (
                      <Option key={sub} value={sub}>
                        {sub}
                      </Option>
                    ))
                  }
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitOfMeasure"
                label="Unit of Measure"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  {measurementUnits.map(unit => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="standardPrice"
                label="Standard Price (XAF)"
                help="Optional: Standard/reference price for budgeting"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,)/g, '')}
                  placeholder="Enter standard price"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="Preferred Supplier"
                help="Optional: Preferred supplier for this item"
              >
                <Input placeholder="Enter preferred supplier name" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specifications"
            label="Technical Specifications"
            help="Optional: Additional technical details or specifications"
          >
            <TextArea
              rows={3}
              placeholder="Enter technical specifications or additional details"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add/Edit Item Modal */}
      <Modal
        title={editingItem ? 'Edit Item' : 'Add New Item'}
        open={showItemModal}
        onOk={handleItemSubmit}
        onCancel={() => {
          setShowItemModal(false);
          setEditingItem(null);
          setSelectedCategory(null);
          setNewCategoryName('');
          setShowNewCategoryInput(false);
          setImageFile(null);
          setImagePreview(null);
          form.resetFields();
        }}
        width={800}
        okText={editingItem ? 'Update Item' : 'Create Item'}
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changedValues) => {
            if (changedValues.category) {
              setSelectedCategory(changedValues.category);
              // Reset subcategory when category changes
              form.setFieldsValue({ subcategory: undefined });
            }
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="description"
                label="Item Description"
                rules={[{ required: true, message: 'Please enter item description' }]}
              >
                <Input placeholder="Enter item description" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select
                  placeholder="Select category"
                  onSelect={(value) => setSelectedCategory(value)}
                  dropdownRender={menu => (
                    <div>
                      {menu}
                      <div style={{ padding: '8px', borderTop: '1px solid #e8e8e8' }}>
                        {!showNewCategoryInput ? (
                          <Button
                            type="link"
                            icon={<PlusOutlined />}
                            onClick={() => setShowNewCategoryInput(true)}
                            style={{ padding: 0 }}
                          >
                            Add New Category
                          </Button>
                        ) : (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Input
                              size="small"
                              placeholder="Enter new category"
                              value={newCategoryName}
                              onChange={(e) => setNewCategoryName(e.target.value)}
                              onPressEnter={handleAddNewCategory}
                            />
                            <Button size="small" type="primary" onClick={handleAddNewCategory}>
                              Add
                            </Button>
                            <Button size="small" onClick={() => {
                              setShowNewCategoryInput(false);
                              setNewCategoryName('');
                            }}>
                              Cancel
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                >
                  {categories.map(category => (
                    <Option key={category} value={category}>
                      {category}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="subcategory"
                label="Subcategory (Optional)"
              >
                <Select 
                  placeholder="Select subcategory" 
                  disabled={!selectedCategory}
                  allowClear
                >
                  {selectedCategory &&
                    subcategories[selectedCategory]?.map(sub => (
                      <Option key={sub} value={sub}>
                        {sub}
                      </Option>
                    ))
                  }
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="unitOfMeasure"
                label="Unit of Measure"
                rules={[{ required: true, message: 'Please select unit' }]}
              >
                <Select placeholder="Select unit">
                  {measurementUnits.map(unit => (
                    <Option key={unit} value={unit}>
                      {unit}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="itemType"
                label="Item Classification"
                rules={[{ required: true, message: 'Please select item type' }]}
              >
                <Radio.Group>
                  <Radio value="asset">Asset</Radio>
                  <Radio value="liability">Liability</Radio>
                  <Radio value="expense">Expense</Radio>
                </Radio.Group>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="standardPrice"
                label="Standard Price (XAF)"
                help="Optional: Standard/reference price for budgeting"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/\$\s?|(,)/g, '')}
                  placeholder="Enter standard price"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="supplier"
                label="Preferred Supplier"
                help="Optional: Preferred supplier for this item"
              >
                <Input placeholder="Enter preferred supplier name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="image"
                label="Item Image"
                help={editingItem ? "Optional: Upload a new image or keep existing" : "Required: Upload an image of the item"}
                rules={[
                  {
                    validator: (_, value) => {
                      if (!editingItem && !imageFile) {
                        return Promise.reject(new Error('Please upload an image for the item'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Upload
                  listType="picture-card"
                  fileList={imageFile ? [imageFile] : []}
                  onPreview={() => {}}
                  onChange={handleImageChange}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                  showUploadList={{
                    showPreviewIcon: true,
                    showRemoveIcon: true,
                  }}
                >
                  {!imageFile && (
                    <div>
                      <PictureOutlined />
                      <div style={{ marginTop: 8 }}>Upload Image</div>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: 4 }}>
                        JPG, PNG, GIF (Max 5MB)
                      </div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="specifications"
            label="Technical Specifications"
            help="Optional: Additional technical details or specifications"
          >
            <TextArea
              rows={3}
              placeholder="Enter technical specifications or additional details"
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Process Request Modal */}
      <Modal
        title={`Process Item Request`}
        open={showRequestModal}
        onOk={handleRequestModalOk}
        onCancel={() => {
          setShowRequestModal(false);
          setProcessingRequest(null);
          setRequestSelectedCategory(null);
          requestForm.resetFields();
        }}
        width={600}
        okText={
          processingRequest?.action === 'create_item'
            ? 'Create Item & Approve'
            : processingRequest?.action === 'approve'
            ? 'Approve Request'
            : 'Reject Request'
        }
        okButtonProps={{
          danger: processingRequest?.action === 'reject'
        }}
      >
        {processingRequest?.action === 'create_item' ? (
          <Form form={requestForm} layout="vertical">
            <Alert
              message="Create New Item"
              description="Review and modify the requested item details before adding to the database."
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="description"
                  label="Item Description"
                  rules={[
                    { required: true, message: 'Please enter item description' },
                    { min: 10, message: 'Description must be at least 10 characters' }
                  ]}
                >
                  <Input placeholder="Enter detailed item description" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="category"
                  label="Category"
                  rules={[{ required: true, message: 'Please select category' }]}
                >
                  <Select
                    placeholder="Select category"
                    onChange={handleRequestCategoryChange}
                  >
                    {categories.map(category => (
                      <Option key={category} value={category}>
                        {category}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="subcategory"
                  label="Subcategory (Optional)"
                >
                  <Select 
                    placeholder="Select subcategory" 
                    disabled={!requestSelectedCategory}
                    allowClear
                  >
                    {requestSelectedCategory &&
                      subcategories[requestSelectedCategory]?.map(sub => (
                        <Option key={sub} value={sub}>
                          {sub}
                        </Option>
                      ))
                    }
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="unitOfMeasure"
                  label="Unit of Measure"
                  rules={[{ required: true, message: 'Please select unit' }]}
                >
                  <Select placeholder="Select unit">
                    {measurementUnits.map(unit => (
                      <Option key={unit} value={unit}>
                        {unit}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="standardPrice"
                  label="Standard Price (XAF)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={value => value.replace(/\$\s?|(,)/g, '')}
                    placeholder="Enter standard price"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="supplier"
                  label="Preferred Supplier"
                >
                  <Input placeholder="Enter preferred supplier name" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="justification"
              label="Original Justification"
            >
              <TextArea
                rows={2}
                disabled
                placeholder="Original request justification"
              />
            </Form.Item>
          </Form>
        ) : (
          <div>
            <p>Processing request with action: {processingRequest?.action}</p>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplyChainItemManagement;

