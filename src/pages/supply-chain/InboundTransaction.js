import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Typography,
  message,
  Space,
  Divider,
  Table,
  Upload,
  Tag,
  Switch,
  Tooltip,
  Modal,
  Alert
} from 'antd';
import {
  InboxOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CameraOutlined,
  BarcodeOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const InboundTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  
  // Item instances management
  const [useItemInstances, setUseItemInstances] = useState(false);
  const [itemInstances, setItemInstances] = useState([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  
  // Bulk entry state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkQuantity, setBulkQuantity] = useState(1);
  const [bulkAssetTagPrefix, setBulkAssetTagPrefix] = useState('');
  const [bulkStartNumber, setBulkStartNumber] = useState(1);

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (itemId && items.length > 0) {
      const item = items.find(i => i._id === itemId);
      if (item) {
        form.setFieldsValue({ itemId });
        setSelectedItem(item);
        // Auto-generate asset tag prefix from item code
        setBulkAssetTagPrefix(item.code || '');
      }
    }
  }, [items, searchParams]);

  useEffect(() => {
    if (useItemInstances) {
      const total = itemInstances.length;
      setTotalQuantity(total);
      form.setFieldValue('quantity', total);
    }
  }, [itemInstances, useItemInstances, form]);

  const fetchItems = async () => {
    try {
      const response = await api.get('/items/active');
      setItems(response.data.data || []);
    } catch (error) {
      console.error('Error fetching items:', error);
      message.error('Failed to load items');
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await api.get('/suppliers/admin/all');
      setSuppliers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Failed to load suppliers');
    }
  };

  const handleItemSelect = (itemId) => {
    const item = items.find(i => i._id === itemId);
    setSelectedItem(item);
    
    if (item?.standardPrice) {
      form.setFieldsValue({ unitPrice: item.standardPrice });
    }
    
    // Set asset tag prefix from item code
    setBulkAssetTagPrefix(item?.code || '');
  };

  const handleSupplierSelect = (supplierId) => {
    const supplier = suppliers.find(s => s._id === supplierId);
    setSelectedSupplier(supplier);
  };

  const handleToggleItemInstances = (checked) => {
    setUseItemInstances(checked);
    if (!checked) {
      setItemInstances([]);
      setTotalQuantity(0);
    }
  };

  // Add single item instance
  const addItemInstance = () => {
    const newInstance = {
      key: Date.now(),
      instanceId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assetTag: '',
      barcode: '',
      serialNumber: '',
      condition: 'new',
      location: 'Main Warehouse',
      notes: '',
      imageUrl: null,
      imageFile: null
    };
    setItemInstances([...itemInstances, newInstance]);
  };

  // Remove item instance
  const removeItemInstance = (key) => {
    setItemInstances(itemInstances.filter(item => item.key !== key));
  };

  // Update item instance
  const updateItemInstance = (key, field, value) => {
    setItemInstances(itemInstances.map(item => 
      item.key === key ? { ...item, [field]: value } : item
    ));
  };

  // Handle image upload for instance
  const handleInstanceImageUpload = (key, file) => {
    const isImage = file.type.startsWith('image/');
    const isLt5M = file.size / 1024 / 1024 < 5;
    
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      updateItemInstance(key, 'imageUrl', e.target.result);
      updateItemInstance(key, 'imageFile', file);
    };
    reader.readAsDataURL(file);
    
    return false; // Prevent auto upload
  };

  // Bulk add instances
  const handleBulkAdd = () => {
    if (!bulkQuantity || bulkQuantity < 1) {
      message.error('Please enter a valid quantity');
      return;
    }

    const newInstances = [];
    const startNum = parseInt(bulkStartNumber) || 1;
    
    for (let i = 0; i < bulkQuantity; i++) {
      const assetTagNumber = (startNum + i).toString().padStart(4, '0');
      const assetTag = bulkAssetTagPrefix 
        ? `${bulkAssetTagPrefix}-${assetTagNumber}` 
        : assetTagNumber;
      
      newInstances.push({
        key: Date.now() + i,
        instanceId: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        assetTag,
        barcode: '',
        serialNumber: '',
        condition: 'new',
        location: 'Main Warehouse',
        notes: '',
        imageUrl: null,
        imageFile: null
      });
    }

    setItemInstances([...itemInstances, ...newInstances]);
    setShowBulkModal(false);
    setBulkQuantity(1);
    message.success(`Added ${bulkQuantity} item instances`);
  };

  const handleSubmit = async (values) => {
    try {
      // Validation
      if (useItemInstances) {
        if (itemInstances.length === 0) {
          message.error('Please add at least one item instance or disable item tracking');
          return;
        }

        // Check for duplicate asset tags
        const assetTags = itemInstances
          .map(i => i.assetTag)
          .filter(tag => tag && tag.trim());
        
        const duplicates = assetTags.filter((tag, index) => 
          assetTags.indexOf(tag) !== index
        );
        
        if (duplicates.length > 0) {
          message.error(`Duplicate asset tags found: ${duplicates.join(', ')}`);
          return;
        }

        // Validate quantity matches instances
        if (itemInstances.length !== parseInt(values.quantity)) {
          message.error(`Number of item instances (${itemInstances.length}) must match quantity (${values.quantity})`);
          return;
        }
      }

      setLoading(true);

      // OPTION 1: Use JSON instead of FormData (simpler, no images yet)
      const payload = {
        itemId: values.itemId,
        quantity: values.quantity,
        unitPrice: values.unitPrice,
        transactionDate: values.transactionDate?.toISOString() || new Date().toISOString(),
        poNumber: values.poNumber || null,
        supplierId: values.supplierId || null,
        supplierName: selectedSupplier?.name || selectedSupplier?.fullName || null,
        grnNumber: values.grnNumber || null,
        inspectionStatus: values.inspectionStatus || 'not-required',
        comment: values.comment || null
      };

      // Add item instances if tracked
      if (useItemInstances && itemInstances.length > 0) {
        const instancesData = itemInstances.map(instance => ({
          instanceId: instance.instanceId,
          assetTag: instance.assetTag,
          barcode: instance.barcode,
          serialNumber: instance.serialNumber,
          condition: instance.condition,
          location: instance.location,
          notes: instance.notes
        }));
        
        payload.itemInstances = instancesData;
      }

      console.log('Sending payload:', payload);

      const response = await api.post('/inventory/inbound', payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        message.success('Inbound transaction recorded successfully');
        navigate('/supply-chain/inventory');
      } else {
        message.error(response.data.message || 'Failed to record inbound transaction');
      }
    } catch (error) {
      console.error('Error recording inbound:', error);
      message.error(error.response?.data?.message || 'Failed to record inbound transaction');
    } finally {
      setLoading(false);
    }
  };

  const instanceColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Asset Tag',
      dataIndex: 'assetTag',
      key: 'assetTag',
      width: 150,
      render: (text, record) => (
        <Input
          placeholder="e.g., ITM-001-0001"
          value={text}
          onChange={(e) => updateItemInstance(record.key, 'assetTag', e.target.value)}
          prefix={<BarcodeOutlined />}
        />
      )
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (text, record) => (
        <Input
          placeholder="Scan or enter barcode"
          value={text}
          onChange={(e) => updateItemInstance(record.key, 'barcode', e.target.value)}
        />
      )
    },
    {
      title: 'Serial Number',
      dataIndex: 'serialNumber',
      key: 'serialNumber',
      width: 150,
      render: (text, record) => (
        <Input
          placeholder="Optional"
          value={text}
          onChange={(e) => updateItemInstance(record.key, 'serialNumber', e.target.value)}
        />
      )
    },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (text, record) => (
        <Select
          style={{ width: '100%' }}
          value={text}
          onChange={(value) => updateItemInstance(record.key, 'condition', value)}
        >
          <Option value="new">New</Option>
          <Option value="excellent">Excellent</Option>
          <Option value="good">Good</Option>
          <Option value="fair">Fair</Option>
        </Select>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 150,
      render: (text, record) => (
        <Input
          placeholder="Storage location"
          value={text}
          onChange={(e) => updateItemInstance(record.key, 'location', e.target.value)}
        />
      )
    },
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      width: 100,
      render: (url, record) => (
        <Upload
          showUploadList={false}
          beforeUpload={(file) => handleInstanceImageUpload(record.key, file)}
          accept="image/*"
        >
          <Button 
            icon={<CameraOutlined />} 
            type={url ? 'primary' : 'default'}
            size="small"
          >
            {url ? 'Change' : 'Add'}
          </Button>
        </Upload>
      )
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      render: (text, record) => (
        <Input
          placeholder="Optional notes"
          value={text}
          onChange={(e) => updateItemInstance(record.key, 'notes', e.target.value)}
        />
      )
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeItemInstance(record.key)}
        />
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <InboxOutlined /> Record Inbound Transaction
        </Title>
        <Text type="secondary">
          Record incoming stock from suppliers or transfers
        </Text>

        <Divider />

        <Alert
          message="Item Tracking Information"
          description={
            <div>
              <Text>• Enable item tracking to assign unique asset tags and barcodes to each item</Text><br />
              <Text>• Useful for tracking individual high-value items or equipment</Text><br />
              <Text>• Asset tags can be scanned in the future for quick identification</Text>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          style={{ marginBottom: '24px' }}
        />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            transactionDate: moment(),
            inspectionStatus: 'not-required',
            quantity: 1
          }}
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="itemId"
                label="Item"
                rules={[{ required: true, message: 'Please select an item' }]}
              >
                <Select
                  showSearch
                  placeholder="Select item"
                  onChange={handleItemSelect}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {items.map(item => (
                    <Option key={item._id} value={item._id}>
                      {item.code} - {item.description}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="supplierId"
                label="Supplier"
                rules={[{ required: true, message: 'Please select a supplier' }]}
              >
                <Select
                  showSearch
                  placeholder="Select supplier"
                  onChange={handleSupplierSelect}
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map(supplier => (
                    <Option key={supplier._id} value={supplier._id}>
                      {supplier.name || supplier.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          {selectedItem && (
            <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f2f5' }}>
              <Row gutter={16}>
                <Col span={6}>
                  <Text strong>Category:</Text> {selectedItem.category}
                </Col>
                <Col span={6}>
                  <Text strong>Unit:</Text> {selectedItem.unitOfMeasure}
                </Col>
                <Col span={6}>
                  <Text strong>Current Stock:</Text> {selectedItem.stockQuantity || 0}
                </Col>
                <Col span={6}>
                  <Text strong>Reorder Point:</Text> {selectedItem.reorderPoint || 0}
                </Col>
              </Row>
            </Card>
          )}

          {/* Item Tracking Toggle */}
          <Card 
            style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
            bodyStyle={{ padding: '16px' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space align="center">
                <Switch 
                  checked={useItemInstances}
                  onChange={handleToggleItemInstances}
                />
                <Text strong>Track Individual Items (Asset Tags & Barcodes)</Text>
                <Tag color="blue" icon={<CheckCircleOutlined />}>
                  Recommended for Assets
                </Tag>
                <Tooltip title="Enable to assign unique asset tags, barcodes, and serial numbers to each item">
                  <InfoCircleOutlined style={{ color: '#1890ff' }} />
                </Tooltip>
              </Space>
              
              {!useItemInstances && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Tracking individual items is optional but recommended for valuable assets
                </Text>
              )}
            </Space>
          </Card>

          {/* Quantity field */}
          {!useItemInstances ? (
            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item
                  name="quantity"
                  label="Quantity"
                  rules={[
                    { required: true, message: 'Please enter quantity' },
                    { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter quantity"
                    min={0}
                    step={1}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="unitPrice"
                  label="Unit Price (XAF)"
                  rules={[
                    { required: true, message: 'Please enter unit price' },
                    { type: 'number', min: 0, message: 'Price must be non-negative' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="Enter unit price"
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/,/g, '')}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="transactionDate"
                  label="Transaction Date"
                  rules={[{ required: true, message: 'Please select date' }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item
                  name="inspectionStatus"
                  label="Inspection Status"
                >
                  <Select>
                    <Option value="not-required">Not Required</Option>
                    <Option value="pending">Pending</Option>
                    <Option value="passed">Passed</Option>
                    <Option value="failed">Failed</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          ) : (
            <>
              <Row gutter={16}>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="quantity"
                    label="Total Quantity (Auto-calculated)"
                    rules={[{ required: true, message: 'Please add item instances' }]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      disabled
                      value={totalQuantity}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="unitPrice"
                    label="Unit Price (XAF)"
                    rules={[
                      { required: true, message: 'Please enter unit price' },
                      { type: 'number', min: 0, message: 'Price must be non-negative' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="Enter unit price"
                      min={0}
                      formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={(value) => value.replace(/,/g, '')}
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="transactionDate"
                    label="Transaction Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name="inspectionStatus"
                    label="Inspection Status"
                  >
                    <Select>
                      <Option value="not-required">Not Required</Option>
                      <Option value="pending">Pending</Option>
                      <Option value="passed">Passed</Option>
                      <Option value="failed">Failed</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Item Instances Table */}
              <Card 
                title={
                  <Space>
                    <BarcodeOutlined />
                    <Text strong>Item Instances ({itemInstances.length})</Text>
                  </Space>
                }
                extra={
                  <Space>
                    <Button 
                      icon={<PlusOutlined />}
                      onClick={() => setShowBulkModal(true)}
                    >
                      Bulk Add
                    </Button>
                    <Button 
                      type="primary" 
                      icon={<PlusOutlined />}
                      onClick={addItemInstance}
                    >
                      Add Single
                    </Button>
                  </Space>
                }
                style={{ marginBottom: '24px' }}
              >
                {itemInstances.length === 0 ? (
                  <Alert
                    message="No item instances added yet"
                    description="Click 'Add Single' to add individual items or 'Bulk Add' to add multiple items at once"
                    type="info"
                    showIcon
                  />
                ) : (
                  <Table
                    dataSource={itemInstances}
                    columns={instanceColumns}
                    pagination={false}
                    scroll={{ x: 1200 }}
                    size="small"
                    rowKey="key"
                  />
                )}
              </Card>
            </>
          )}

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="poNumber"
                label="PO Number"
              >
                <Input placeholder="Enter PO number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="grnNumber"
                label="GRN Number"
              >
                <Input placeholder="Enter GRN number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item label="Total Value">
                <Input
                  style={{ width: '100%' }}
                  value={
                    ((form.getFieldValue('quantity') || 0) * 
                    (form.getFieldValue('unitPrice') || 0)).toLocaleString() + ' XAF'
                  }
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="comment"
            label="Comments / Notes"
          >
            <TextArea
              rows={3}
              placeholder="Enter any additional comments or notes"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
              >
                Record Inbound
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/supply-chain/inventory')}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Bulk Add Modal */}
      <Modal
        title="Bulk Add Item Instances"
        open={showBulkModal}
        onOk={handleBulkAdd}
        onCancel={() => setShowBulkModal(false)}
        width={600}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Text strong>Quantity to Add</Text>
            <InputNumber
              style={{ width: '100%', marginTop: '8px' }}
              min={1}
              max={100}
              value={bulkQuantity}
              onChange={setBulkQuantity}
              placeholder="Number of items"
            />
          </div>

          <div>
            <Text strong>Asset Tag Prefix</Text>
            <Input
              style={{ marginTop: '8px' }}
              value={bulkAssetTagPrefix}
              onChange={(e) => setBulkAssetTagPrefix(e.target.value)}
              placeholder="e.g., ITM-001"
              prefix={<BarcodeOutlined />}
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              This will be used as prefix for auto-generated asset tags
            </Text>
          </div>

          <div>
            <Text strong>Starting Number</Text>
            <InputNumber
              style={{ width: '100%', marginTop: '8px' }}
              min={1}
              value={bulkStartNumber}
              onChange={setBulkStartNumber}
              placeholder="Starting number"
            />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Asset tags will be: {bulkAssetTagPrefix}-0001, {bulkAssetTagPrefix}-0002, etc.
            </Text>
          </div>

          <Alert
            message="Preview"
            description={
              <div>
                <Text>First tag: <Text code>{bulkAssetTagPrefix}-{bulkStartNumber.toString().padStart(4, '0')}</Text></Text><br />
                <Text>Last tag: <Text code>{bulkAssetTagPrefix}-{(bulkStartNumber + bulkQuantity - 1).toString().padStart(4, '0')}</Text></Text>
              </div>
            }
            type="info"
            showIcon
          />
        </Space>
      </Modal>
    </div>
  );
};

export default InboundTransaction;










// import React, { useState, useEffect } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import {
//   Card,
//   Form,
//   Input,
//   InputNumber,
//   Select,
//   DatePicker,
//   Button,
//   Row,
//   Col,
//   Typography,
//   message,
//   Space,
//   Divider,
//   Table,
//   Upload,
//   Tag,
//   Switch,
//   Tooltip,
//   Modal,
//   Alert
// } from 'antd';
// import {
//   InboxOutlined,
//   SaveOutlined,
//   PlusOutlined,
//   DeleteOutlined,
//   CameraOutlined,
//   BarcodeOutlined,
//   InfoCircleOutlined,
//   CheckCircleOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const InboundTransaction = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [selectedSupplier, setSelectedSupplier] = useState(null);
  
//   // Item instances management
//   const [useItemInstances, setUseItemInstances] = useState(false);
//   const [itemInstances, setItemInstances] = useState([]);
//   const [totalQuantity, setTotalQuantity] = useState(0);
  
//   // Bulk entry state
//   const [showBulkModal, setShowBulkModal] = useState(false);
//   const [bulkQuantity, setBulkQuantity] = useState(1);
//   const [bulkAssetTagPrefix, setBulkAssetTagPrefix] = useState('');
//   const [bulkStartNumber, setBulkStartNumber] = useState(1);

//   useEffect(() => {
//     fetchItems();
//     fetchSuppliers();
//   }, []);

//   useEffect(() => {
//     const itemId = searchParams.get('itemId');
//     if (itemId && items.length > 0) {
//       const item = items.find(i => i._id === itemId);
//       if (item) {
//         form.setFieldsValue({ itemId });
//         setSelectedItem(item);
//         // Auto-generate asset tag prefix from item code
//         setBulkAssetTagPrefix(item.code || '');
//       }
//     }
//   }, [items, searchParams]);

//   useEffect(() => {
//     if (useItemInstances) {
//       const total = itemInstances.length;
//       setTotalQuantity(total);
//       form.setFieldValue('quantity', total);
//     }
//   }, [itemInstances, useItemInstances, form]);

//   const fetchItems = async () => {
//     try {
//       const response = await api.get('/api/items/active');
//       setItems(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching items:', error);
//       message.error('Failed to load items');
//     }
//   };

//   const fetchSuppliers = async () => {
//     try {
//       const response = await api.get('/api/suppliers/admin/all');
//       setSuppliers(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//       message.error('Failed to load suppliers');
//     }
//   };

//   const handleItemSelect = (itemId) => {
//     const item = items.find(i => i._id === itemId);
//     setSelectedItem(item);
    
//     if (item?.standardPrice) {
//       form.setFieldsValue({ unitPrice: item.standardPrice });
//     }
    
//     // Set asset tag prefix from item code
//     setBulkAssetTagPrefix(item?.code || '');
//   };

//   const handleSupplierSelect = (supplierId) => {
//     const supplier = suppliers.find(s => s._id === supplierId);
//     setSelectedSupplier(supplier);
//   };

//   const handleToggleItemInstances = (checked) => {
//     setUseItemInstances(checked);
//     if (!checked) {
//       setItemInstances([]);
//       setTotalQuantity(0);
//     }
//   };

//   // Add single item instance
//   const addItemInstance = () => {
//     const newInstance = {
//       key: Date.now(),
//       instanceId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
//       assetTag: '',
//       barcode: '',
//       serialNumber: '',
//       condition: 'new',
//       location: 'Main Warehouse',
//       notes: '',
//       imageUrl: null,
//       imageFile: null
//     };
//     setItemInstances([...itemInstances, newInstance]);
//   };

//   // Remove item instance
//   const removeItemInstance = (key) => {
//     setItemInstances(itemInstances.filter(item => item.key !== key));
//   };

//   // Update item instance
//   const updateItemInstance = (key, field, value) => {
//     setItemInstances(itemInstances.map(item => 
//       item.key === key ? { ...item, [field]: value } : item
//     ));
//   };

//   // Handle image upload for instance
//   const handleInstanceImageUpload = (key, file) => {
//     const isImage = file.type.startsWith('image/');
//     const isLt5M = file.size / 1024 / 1024 < 5;
    
//     if (!isImage) {
//       message.error('You can only upload image files!');
//       return false;
//     }
    
//     if (!isLt5M) {
//       message.error('Image must be smaller than 5MB!');
//       return false;
//     }

//     // Create preview URL
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       updateItemInstance(key, 'imageUrl', e.target.result);
//       updateItemInstance(key, 'imageFile', file);
//     };
//     reader.readAsDataURL(file);
    
//     return false; // Prevent auto upload
//   };

//   // Bulk add instances
//   const handleBulkAdd = () => {
//     if (!bulkQuantity || bulkQuantity < 1) {
//       message.error('Please enter a valid quantity');
//       return;
//     }

//     const newInstances = [];
//     const startNum = parseInt(bulkStartNumber) || 1;
    
//     for (let i = 0; i < bulkQuantity; i++) {
//       const assetTagNumber = (startNum + i).toString().padStart(4, '0');
//       const assetTag = bulkAssetTagPrefix 
//         ? `${bulkAssetTagPrefix}-${assetTagNumber}` 
//         : assetTagNumber;
      
//       newInstances.push({
//         key: Date.now() + i,
//         instanceId: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
//         assetTag,
//         barcode: '',
//         serialNumber: '',
//         condition: 'new',
//         location: 'Main Warehouse',
//         notes: '',
//         imageUrl: null,
//         imageFile: null
//       });
//     }

//     setItemInstances([...itemInstances, ...newInstances]);
//     setShowBulkModal(false);
//     setBulkQuantity(1);
//     message.success(`Added ${bulkQuantity} item instances`);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       // Validation
//       if (useItemInstances) {
//         if (itemInstances.length === 0) {
//           message.error('Please add at least one item instance or disable item tracking');
//           return;
//         }

//         // Check for duplicate asset tags
//         const assetTags = itemInstances
//           .map(i => i.assetTag)
//           .filter(tag => tag && tag.trim());
        
//         const duplicates = assetTags.filter((tag, index) => 
//           assetTags.indexOf(tag) !== index
//         );
        
//         if (duplicates.length > 0) {
//           message.error(`Duplicate asset tags found: ${duplicates.join(', ')}`);
//           return;
//         }

//         // Validate quantity matches instances
//         if (itemInstances.length !== parseInt(values.quantity)) {
//           message.error(`Number of item instances (${itemInstances.length}) must match quantity (${values.quantity})`);
//           return;
//         }
//       }

//       setLoading(true);

//       const formData = new FormData();
//       formData.append('itemId', values.itemId);
//       formData.append('quantity', values.quantity);
//       formData.append('unitPrice', values.unitPrice);
//       formData.append('transactionDate', values.transactionDate?.toDate() || new Date());
      
//       if (values.poNumber) formData.append('poNumber', values.poNumber);
//       if (values.supplierId) formData.append('supplierId', values.supplierId);
//       if (selectedSupplier) {
//         formData.append('supplierName', selectedSupplier.name || selectedSupplier.fullName);
//       }
//       if (values.grnNumber) formData.append('grnNumber', values.grnNumber);
//       if (values.inspectionStatus) formData.append('inspectionStatus', values.inspectionStatus);
//       if (values.comment) formData.append('comment', values.comment);

//       // Add item instances if tracked
//       if (useItemInstances && itemInstances.length > 0) {
//         // Prepare instances data without image files
//         const instancesData = itemInstances.map(instance => ({
//           instanceId: instance.instanceId,
//           assetTag: instance.assetTag,
//           barcode: instance.barcode,
//           serialNumber: instance.serialNumber,
//           condition: instance.condition,
//           location: instance.location,
//           notes: instance.notes
//         }));
        
//         formData.append('itemInstances', JSON.stringify(instancesData));
        
//         // Add image files separately
//         itemInstances.forEach((instance, index) => {
//           if (instance.imageFile) {
//             formData.append(`instanceImage_${index}`, instance.imageFile);
//           }
//         });
//       }

//       const response = await api.post('/api/inventory/inbound', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data'
//         }
//       });

//       if (response.data.success) {
//         message.success('Inbound transaction recorded successfully');
//         navigate('/supply-chain/inventory');
//       } else {
//         message.error(response.data.message || 'Failed to record inbound transaction');
//       }
//     } catch (error) {
//       console.error('Error recording inbound:', error);
//       message.error(error.response?.data?.message || 'Failed to record inbound transaction');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const instanceColumns = [
//     {
//       title: '#',
//       key: 'index',
//       width: 50,
//       render: (_, __, index) => index + 1
//     },
//     {
//       title: 'Asset Tag',
//       dataIndex: 'assetTag',
//       key: 'assetTag',
//       width: 150,
//       render: (text, record) => (
//         <Input
//           placeholder="e.g., ITM-001-0001"
//           value={text}
//           onChange={(e) => updateItemInstance(record.key, 'assetTag', e.target.value)}
//           prefix={<BarcodeOutlined />}
//         />
//       )
//     },
//     {
//       title: 'Barcode',
//       dataIndex: 'barcode',
//       key: 'barcode',
//       width: 150,
//       render: (text, record) => (
//         <Input
//           placeholder="Scan or enter barcode"
//           value={text}
//           onChange={(e) => updateItemInstance(record.key, 'barcode', e.target.value)}
//         />
//       )
//     },
//     {
//       title: 'Serial Number',
//       dataIndex: 'serialNumber',
//       key: 'serialNumber',
//       width: 150,
//       render: (text, record) => (
//         <Input
//           placeholder="Optional"
//           value={text}
//           onChange={(e) => updateItemInstance(record.key, 'serialNumber', e.target.value)}
//         />
//       )
//     },
//     {
//       title: 'Condition',
//       dataIndex: 'condition',
//       key: 'condition',
//       width: 120,
//       render: (text, record) => (
//         <Select
//           style={{ width: '100%' }}
//           value={text}
//           onChange={(value) => updateItemInstance(record.key, 'condition', value)}
//         >
//           <Option value="new">New</Option>
//           <Option value="excellent">Excellent</Option>
//           <Option value="good">Good</Option>
//           <Option value="fair">Fair</Option>
//         </Select>
//       )
//     },
//     {
//       title: 'Location',
//       dataIndex: 'location',
//       key: 'location',
//       width: 150,
//       render: (text, record) => (
//         <Input
//           placeholder="Storage location"
//           value={text}
//           onChange={(e) => updateItemInstance(record.key, 'location', e.target.value)}
//         />
//       )
//     },
//     {
//       title: 'Image',
//       dataIndex: 'imageUrl',
//       key: 'imageUrl',
//       width: 100,
//       render: (url, record) => (
//         <Upload
//           showUploadList={false}
//           beforeUpload={(file) => handleInstanceImageUpload(record.key, file)}
//           accept="image/*"
//         >
//           <Button 
//             icon={<CameraOutlined />} 
//             type={url ? 'primary' : 'default'}
//             size="small"
//           >
//             {url ? 'Change' : 'Add'}
//           </Button>
//         </Upload>
//       )
//     },
//     {
//       title: 'Notes',
//       dataIndex: 'notes',
//       key: 'notes',
//       width: 150,
//       render: (text, record) => (
//         <Input
//           placeholder="Optional notes"
//           value={text}
//           onChange={(e) => updateItemInstance(record.key, 'notes', e.target.value)}
//         />
//       )
//     },
//     {
//       title: 'Action',
//       key: 'action',
//       width: 80,
//       fixed: 'right',
//       render: (_, record) => (
//         <Button
//           type="text"
//           danger
//           icon={<DeleteOutlined />}
//           onClick={() => removeItemInstance(record.key)}
//         />
//       )
//     }
//   ];

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <InboxOutlined /> Record Inbound Transaction
//         </Title>
//         <Text type="secondary">
//           Record incoming stock from suppliers or transfers
//         </Text>

//         <Divider />

//         <Alert
//           message="Item Tracking Information"
//           description={
//             <div>
//               <Text>• Enable item tracking to assign unique asset tags and barcodes to each item</Text><br />
//               <Text>• Useful for tracking individual high-value items or equipment</Text><br />
//               <Text>• Asset tags can be scanned in the future for quick identification</Text>
//             </div>
//           }
//           type="info"
//           showIcon
//           icon={<InfoCircleOutlined />}
//           style={{ marginBottom: '24px' }}
//         />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             transactionDate: moment(),
//             inspectionStatus: 'not-required',
//             quantity: 1
//           }}
//         >
//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="itemId"
//                 label="Item"
//                 rules={[{ required: true, message: 'Please select an item' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select item"
//                   onChange={handleItemSelect}
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {items.map(item => (
//                     <Option key={item._id} value={item._id}>
//                       {item.code} - {item.description}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="supplierId"
//                 label="Supplier"
//                 rules={[{ required: true, message: 'Please select a supplier' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select supplier"
//                   onChange={handleSupplierSelect}
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {suppliers.map(supplier => (
//                     <Option key={supplier._id} value={supplier._id}>
//                       {supplier.name || supplier.fullName}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           {selectedItem && (
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f2f5' }}>
//               <Row gutter={16}>
//                 <Col span={6}>
//                   <Text strong>Category:</Text> {selectedItem.category}
//                 </Col>
//                 <Col span={6}>
//                   <Text strong>Unit:</Text> {selectedItem.unitOfMeasure}
//                 </Col>
//                 <Col span={6}>
//                   <Text strong>Current Stock:</Text> {selectedItem.stockQuantity || 0}
//                 </Col>
//                 <Col span={6}>
//                   <Text strong>Reorder Point:</Text> {selectedItem.reorderPoint || 0}
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {/* Item Tracking Toggle */}
//           <Card 
//             style={{ marginBottom: '24px', backgroundColor: '#f9f9f9' }}
//             bodyStyle={{ padding: '16px' }}
//           >
//             <Space direction="vertical" style={{ width: '100%' }}>
//               <Space align="center">
//                 <Switch 
//                   checked={useItemInstances}
//                   onChange={handleToggleItemInstances}
//                 />
//                 <Text strong>Track Individual Items (Asset Tags & Barcodes)</Text>
//                 <Tag color="blue" icon={<CheckCircleOutlined />}>
//                   Recommended for Assets
//                 </Tag>
//                 <Tooltip title="Enable to assign unique asset tags, barcodes, and serial numbers to each item">
//                   <InfoCircleOutlined style={{ color: '#1890ff' }} />
//                 </Tooltip>
//               </Space>
              
//               {!useItemInstances && (
//                 <Text type="secondary" style={{ fontSize: '12px' }}>
//                   Tracking individual items is optional but recommended for valuable assets
//                 </Text>
//               )}
//             </Space>
//           </Card>

//           {/* Quantity field */}
//           {!useItemInstances ? (
//             <Row gutter={16}>
//               <Col xs={24} md={6}>
//                 <Form.Item
//                   name="quantity"
//                   label="Quantity"
//                   rules={[
//                     { required: true, message: 'Please enter quantity' },
//                     { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' }
//                   ]}
//                 >
//                   <InputNumber
//                     style={{ width: '100%' }}
//                     placeholder="Enter quantity"
//                     min={0}
//                     step={1}
//                   />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} md={6}>
//                 <Form.Item
//                   name="unitPrice"
//                   label="Unit Price (XAF)"
//                   rules={[
//                     { required: true, message: 'Please enter unit price' },
//                     { type: 'number', min: 0, message: 'Price must be non-negative' }
//                   ]}
//                 >
//                   <InputNumber
//                     style={{ width: '100%' }}
//                     placeholder="Enter unit price"
//                     min={0}
//                     formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                     parser={(value) => value.replace(/,/g, '')}
//                   />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} md={6}>
//                 <Form.Item
//                   name="transactionDate"
//                   label="Transaction Date"
//                   rules={[{ required: true, message: 'Please select date' }]}
//                 >
//                   <DatePicker style={{ width: '100%' }} />
//                 </Form.Item>
//               </Col>
//               <Col xs={24} md={6}>
//                 <Form.Item
//                   name="inspectionStatus"
//                   label="Inspection Status"
//                 >
//                   <Select>
//                     <Option value="not-required">Not Required</Option>
//                     <Option value="pending">Pending</Option>
//                     <Option value="passed">Passed</Option>
//                     <Option value="failed">Failed</Option>
//                   </Select>
//                 </Form.Item>
//               </Col>
//             </Row>
//           ) : (
//             <>
//               <Row gutter={16}>
//                 <Col xs={24} md={6}>
//                   <Form.Item
//                     name="quantity"
//                     label="Total Quantity (Auto-calculated)"
//                     rules={[{ required: true, message: 'Please add item instances' }]}
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       disabled
//                       value={totalQuantity}
//                     />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Form.Item
//                     name="unitPrice"
//                     label="Unit Price (XAF)"
//                     rules={[
//                       { required: true, message: 'Please enter unit price' },
//                       { type: 'number', min: 0, message: 'Price must be non-negative' }
//                     ]}
//                   >
//                     <InputNumber
//                       style={{ width: '100%' }}
//                       placeholder="Enter unit price"
//                       min={0}
//                       formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                       parser={(value) => value.replace(/,/g, '')}
//                     />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Form.Item
//                     name="transactionDate"
//                     label="Transaction Date"
//                     rules={[{ required: true, message: 'Please select date' }]}
//                   >
//                     <DatePicker style={{ width: '100%' }} />
//                   </Form.Item>
//                 </Col>
//                 <Col xs={24} md={6}>
//                   <Form.Item
//                     name="inspectionStatus"
//                     label="Inspection Status"
//                   >
//                     <Select>
//                       <Option value="not-required">Not Required</Option>
//                       <Option value="pending">Pending</Option>
//                       <Option value="passed">Passed</Option>
//                       <Option value="failed">Failed</Option>
//                     </Select>
//                   </Form.Item>
//                 </Col>
//               </Row>

//               {/* Item Instances Table */}
//               <Card 
//                 title={
//                   <Space>
//                     <BarcodeOutlined />
//                     <Text strong>Item Instances ({itemInstances.length})</Text>
//                   </Space>
//                 }
//                 extra={
//                   <Space>
//                     <Button 
//                       icon={<PlusOutlined />}
//                       onClick={() => setShowBulkModal(true)}
//                     >
//                       Bulk Add
//                     </Button>
//                     <Button 
//                       type="primary" 
//                       icon={<PlusOutlined />}
//                       onClick={addItemInstance}
//                     >
//                       Add Single
//                     </Button>
//                   </Space>
//                 }
//                 style={{ marginBottom: '24px' }}
//               >
//                 {itemInstances.length === 0 ? (
//                   <Alert
//                     message="No item instances added yet"
//                     description="Click 'Add Single' to add individual items or 'Bulk Add' to add multiple items at once"
//                     type="info"
//                     showIcon
//                   />
//                 ) : (
//                   <Table
//                     dataSource={itemInstances}
//                     columns={instanceColumns}
//                     pagination={false}
//                     scroll={{ x: 1200 }}
//                     size="small"
//                     rowKey="key"
//                   />
//                 )}
//               </Card>
//             </>
//           )}

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="poNumber"
//                 label="PO Number"
//               >
//                 <Input placeholder="Enter PO number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="grnNumber"
//                 label="GRN Number"
//               >
//                 <Input placeholder="Enter GRN number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item label="Total Value">
//                 <Input
//                   style={{ width: '100%' }}
//                   value={
//                     ((form.getFieldValue('quantity') || 0) * 
//                     (form.getFieldValue('unitPrice') || 0)).toLocaleString() + ' XAF'
//                   }
//                   disabled
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="comment"
//             label="Comments / Notes"
//           >
//             <TextArea
//               rows={3}
//               placeholder="Enter any additional comments or notes"
//               maxLength={500}
//               showCount
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SaveOutlined />}
//                 size="large"
//               >
//                 Record Inbound
//               </Button>
//               <Button
//                 size="large"
//                 onClick={() => navigate('/supply-chain/inventory')}
//               >
//                 Cancel
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>

//       {/* Bulk Add Modal */}
//       <Modal
//         title="Bulk Add Item Instances"
//         open={showBulkModal}
//         onOk={handleBulkAdd}
//         onCancel={() => setShowBulkModal(false)}
//         width={600}
//       >
//         <Space direction="vertical" style={{ width: '100%' }} size="large">
//           <div>
//             <Text strong>Quantity to Add</Text>
//             <InputNumber
//               style={{ width: '100%', marginTop: '8px' }}
//               min={1}
//               max={100}
//               value={bulkQuantity}
//               onChange={setBulkQuantity}
//               placeholder="Number of items"
//             />
//           </div>

//           <div>
//             <Text strong>Asset Tag Prefix</Text>
//             <Input
//               style={{ marginTop: '8px' }}
//               value={bulkAssetTagPrefix}
//               onChange={(e) => setBulkAssetTagPrefix(e.target.value)}
//               placeholder="e.g., ITM-001"
//               prefix={<BarcodeOutlined />}
//             />
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               This will be used as prefix for auto-generated asset tags
//             </Text>
//           </div>

//           <div>
//             <Text strong>Starting Number</Text>
//             <InputNumber
//               style={{ width: '100%', marginTop: '8px' }}
//               min={1}
//               value={bulkStartNumber}
//               onChange={setBulkStartNumber}
//               placeholder="Starting number"
//             />
//             <Text type="secondary" style={{ fontSize: '12px' }}>
//               Asset tags will be: {bulkAssetTagPrefix}-0001, {bulkAssetTagPrefix}-0002, etc.
//             </Text>
//           </div>

//           <Alert
//             message="Preview"
//             description={
//               <div>
//                 <Text>First tag: <Text code>{bulkAssetTagPrefix}-{bulkStartNumber.toString().padStart(4, '0')}</Text></Text><br />
//                 <Text>Last tag: <Text code>{bulkAssetTagPrefix}-{(bulkStartNumber + bulkQuantity - 1).toString().padStart(4, '0')}</Text></Text>
//               </div>
//             }
//             type="info"
//             showIcon
//           />
//         </Space>
//       </Modal>
//     </div>
//   );
// };

// export default InboundTransaction;












// import React, { useState, useEffect } from 'react';
// import { useNavigate, useSearchParams } from 'react-router-dom';
// import {
//   Card,
//   Form,
//   Input,
//   InputNumber,
//   Select,
//   DatePicker,
//   Button,
//   Row,
//   Col,
//   Typography,
//   message,
//   Space,
//   Divider,
//   Table,
//   Modal
// } from 'antd';
// import {
//   InboxOutlined,
//   PlusOutlined,
//   SaveOutlined,
//   DeleteOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const InboundTransaction = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);
//   const [lineItems, setLineItems] = useState([]);

//   useEffect(() => {
//     fetchItems();
//     fetchSuppliers();
    
//     // Pre-select item if itemId in URL
//     const itemId = searchParams.get('itemId');
//     if (itemId) {
//       const item = items.find(i => i._id === itemId);
//       if (item) {
//         form.setFieldsValue({ itemId });
//         setSelectedItem(item);
//       }
//     }
//   }, []);

//   const fetchItems = async () => {
//     try {
//       const response = await api.get('/api/items/active');
//       setItems(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching items:', error);
//       message.error('Failed to load items');
//     }
//   };

//   const fetchSuppliers = async () => {
//     try {
//       const response = await api.get('/api/suppliers/admin/all');
//       setSuppliers(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//       message.error('Failed to load suppliers');
//     }
//   };

//   const handleItemSelect = (itemId) => {
//     const item = items.find(i => i._id === itemId);
//     setSelectedItem(item);
    
//     if (item?.standardPrice) {
//       form.setFieldsValue({ unitPrice: item.standardPrice });
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);

//       const transactionData = {
//         itemId: values.itemId,
//         quantity: values.quantity,
//         unitPrice: values.unitPrice,
//         poNumber: values.poNumber,
//         supplierId: values.supplierId,
//         supplierName: suppliers.find(s => s._id === values.supplierId)?.name,
//         grnNumber: values.grnNumber,
//         inspectionStatus: values.inspectionStatus || 'not-required',
//         transactionDate: values.transactionDate?.toDate() || new Date(),
//         comment: values.comment
//       };

//       const response = await api.post('/api/inventory/inbound', transactionData);

//       if (response.data.success) {
//         message.success('Inbound transaction recorded successfully');
//         navigate('/supply-chain/inventory');
//       } else {
//         message.error(response.data.message || 'Failed to record inbound transaction');
//       }
//     } catch (error) {
//       console.error('Error recording inbound:', error);
//       message.error(error.response?.data?.message || 'Failed to record inbound transaction');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <InboxOutlined /> Record Inbound Transaction
//         </Title>
//         <Text type="secondary">
//           Record incoming stock from suppliers or transfers
//         </Text>

//         <Divider />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             transactionDate: moment(),
//             inspectionStatus: 'not-required'
//           }}
//         >
//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="itemId"
//                 label="Item"
//                 rules={[{ required: true, message: 'Please select an item' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select item"
//                   onChange={handleItemSelect}
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {items.map(item => (
//                     <Option key={item._id} value={item._id}>
//                       {item.code} - {item.description}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="supplierId"
//                 label="Supplier"
//                 rules={[{ required: true, message: 'Please select a supplier' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select supplier"
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {suppliers.map(supplier => (
//                     // <Option key={supplier._id} value={supplier._id}>
//                     <Option key={supplier._id} value={supplier.fullName}>
//                       {supplier.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           {selectedItem && (
//             <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#f0f2f5' }}>
//               <Row gutter={16}>
//                 <Col span={8}>
//                   <Text strong>Category:</Text> {selectedItem.category}
//                 </Col>
//                 <Col span={8}>
//                   <Text strong>Unit:</Text> {selectedItem.unitOfMeasure}
//                 </Col>
//                 <Col span={8}>
//                   <Text strong>Current Stock:</Text> {selectedItem.stockQuantity}
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           <Row gutter={16}>
//             <Col xs={24} md={6}>
//               <Form.Item
//                 name="quantity"
//                 label="Quantity"
//                 rules={[
//                   { required: true, message: 'Please enter quantity' },
//                   { type: 'number', min: 0.01, message: 'Quantity must be greater than 0' }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   placeholder="Enter quantity"
//                   min={0}
//                   step={1}
//                 />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={6}>
//               <Form.Item
//                 name="unitPrice"
//                 label="Unit Price (XAF)"
//                 rules={[
//                   { required: true, message: 'Please enter unit price' },
//                   { type: 'number', min: 0, message: 'Price must be non-negative' }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   placeholder="Enter unit price"
//                   min={0}
//                   formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                 />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={6}>
//               <Form.Item
//                 name="transactionDate"
//                 label="Transaction Date"
//                 rules={[{ required: true, message: 'Please select date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={6}>
//               <Form.Item
//                 name="inspectionStatus"
//                 label="Inspection Status"
//               >
//                 <Select>
//                   <Option value="not-required">Not Required</Option>
//                   <Option value="pending">Pending</Option>
//                   <Option value="passed">Passed</Option>
//                   <Option value="failed">Failed</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="poNumber"
//                 label="PO Number"
//               >
//                 <Input placeholder="Enter PO number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="grnNumber"
//                 label="GRN Number"
//               >
//                 <Input placeholder="Enter GRN number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 label="Total Value"
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   value={
//                     (form.getFieldValue('quantity') || 0) * 
//                     (form.getFieldValue('unitPrice') || 0)
//                   }
//                   disabled
//                   formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   suffix="XAF"
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="comment"
//             label="Comments / Notes"
//           >
//             <TextArea
//               rows={3}
//               placeholder="Enter any additional comments or notes"
//               maxLength={500}
//               showCount
//             />
//           </Form.Item>

//           <Form.Item>
//             <Space>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SaveOutlined />}
//                 size="large"
//               >
//                 Record Inbound
//               </Button>
//               <Button
//                 size="large"
//                 onClick={() => navigate('/supply-chain/inventory')}
//               >
//                 Cancel
//               </Button>
//             </Space>
//           </Form.Item>
//         </Form>
//       </Card>
//     </div>
//   );
// };

// export default InboundTransaction;