import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert,
  Spin
} from 'antd';
import {
  PlusOutlined,
  SaveOutlined,
  BarcodeOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const RegisterFixedAsset = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Data states
  const [inventoryItems, setInventoryItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [users, setUsers] = useState([]);
  const [nextAssetTag, setNextAssetTag] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [useCustomTag, setUseCustomTag] = useState(false);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setDataLoading(true);
    try {
      console.log('Fetching all required data...');
      
      // Fetch all required data in parallel
      const [
        inventoryRes,
        suppliersRes,
        usersRes,
        tagsRes
      ] = await Promise.all([
        api.get('/api/inventory/available-stock?limit=1000').catch(() => ({ data: { data: { items: [] } } })),
        api.get('/api/suppliers/admin/all').catch(() => ({ data: { data: [] } })),
        api.get('/api/auth/users').catch(() => ({ data: { data: [] } })),
        api.get('/api/fixed-assets/available-tags').catch(() => ({ data: { data: { nextAvailable: null } } }))
      ]);
      
      // Process inventory items (only show items not already registered as fixed assets)
      // Handle different response structures
      const inventoryData = inventoryRes.data.data?.items || inventoryRes.data.items || [];
      console.log('Raw inventory data:', inventoryData);
      
      const availableItems = Array.isArray(inventoryData)
        ? inventoryData.filter(item => 
            !item.isFixedAsset && 
            item.isActive !== false &&
            item.code && 
            item.description
          )
        : [];
      
      console.log('Available inventory items:', availableItems.length);
      setInventoryItems(availableItems);
      
      // Process suppliers
      const suppliersList = suppliersRes.data.data || [];
      console.log('Suppliers loaded:', suppliersList.length);
      setSuppliers(suppliersList);
      
      // Process users (filter out suppliers)
      const usersData = usersRes.data.data?.users || usersRes.data.data || [];
      const activeUsers = usersData.filter(user => 
        user.role !== 'supplier' && 
        user.isActive !== false
      );
      console.log('Active users loaded:', activeUsers.length);
      setUsers(activeUsers);
      
      // Get next available asset tag
      const nextTag = tagsRes.data.data?.nextAvailable;
      console.log('Next available asset tag:', nextTag);
      setNextAssetTag(nextTag);
      
      // Set default tag in form
      if (nextTag) {
        form.setFieldsValue({ assetTag: nextTag });
      }
      
      if (availableItems.length === 0) {
        message.warning('No inventory items available for fixed asset registration');
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load required data. Please refresh the page.');
    } finally {
      setDataLoading(false);
    }
  };

  const handleItemSelect = (itemId) => {
    const item = inventoryItems.find(i => i._id === itemId);
    if (item) {
      console.log('Selected item:', item);
      setSelectedItem(item);
      
      // Pre-fill form fields
      form.setFieldsValue({
        assetName: item.description,
        assetDescription: item.specifications,
        acquisitionCost: item.standardPrice || item.averageCost,
        supplierName: item.supplier
      });
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      console.log('Submitting fixed asset registration:', values);

      const assetData = {
        itemId: values.itemId,
        assetName: values.assetName,
        assetDescription: values.assetDescription,
        serialNumber: values.serialNumber,
        modelNumber: values.modelNumber,
        manufacturer: values.manufacturer,
        acquisitionDate: values.acquisitionDate?.toDate() || new Date(),
        acquisitionCost: parseFloat(values.acquisitionCost),
        supplierId: values.supplierId,
        supplierName: values.supplierName,
        poNumber: values.poNumber,
        invoiceNumber: values.invoiceNumber,
        warrantyExpiry: values.warrantyExpiry?.toDate(),
        depreciationMethod: values.depreciationMethod,
        usefulLifeYears: parseInt(values.usefulLifeYears),
        salvageValue: parseFloat(values.salvageValue) || 0,
        assignedToId: values.assignedToId,
        assignedDepartment: values.assignedDepartment,
        assignedLocation: values.assignedLocation,
        condition: values.condition,
        physicalLocation: {
          building: values.building,
          floor: values.floor,
          room: values.room
        },
        notes: values.notes,
        customAssetTag: useCustomTag ? values.assetTag : undefined
      };

      console.log('Sending asset data:', assetData);

      const response = await api.post('/api/fixed-assets/register', assetData);

      if (response.data.success) {
        message.success('Fixed asset registered successfully! Item removed from inventory.');
        navigate('/supply-chain/fixed-assets');
      } else {
        message.error(response.data.message || 'Failed to register fixed asset');
      }
    } catch (error) {
      console.error('Error registering asset:', error);
      message.error(error.response?.data?.message || 'Failed to register fixed asset');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <BarcodeOutlined /> Register Fixed Asset
        </Title>
        <Text type="secondary">
          Register a new fixed asset from inventory. Once registered, the item will be removed from available inventory stock.
        </Text>

        {inventoryItems.length === 0 && (
          <Alert
            message="No Items Available"
            description="There are no inventory items available for fixed asset registration. Please add items to inventory first."
            type="warning"
            showIcon
            style={{ margin: '16px 0' }}
          />
        )}

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            acquisitionDate: moment(),
            condition: 'good',
            depreciationMethod: 'straight-line',
            usefulLifeYears: 5,
            salvageValue: 0
          }}
        >
          {/* Asset Tag Section */}
          <Card size="small" style={{ marginBottom: '16px', backgroundColor: '#e6f7ff' }}>
            <Row gutter={16} align="middle">
              <Col span={12}>
                <Text strong>Next Available Asset Tag: </Text>
                <Text style={{ fontSize: '18px', color: '#1890ff' }}>{nextAssetTag || 'N/A'}</Text>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Button
                  size="small"
                  onClick={() => setUseCustomTag(!useCustomTag)}
                >
                  {useCustomTag ? 'Use Auto Tag' : 'Use Custom Tag'}
                </Button>
              </Col>
            </Row>
          </Card>

          {useCustomTag && (
            <Form.Item
              name="assetTag"
              label="Custom Asset Tag"
              rules={[
                { required: true, message: 'Please enter asset tag' },
                { pattern: /^[0-9]{4}$/, message: 'Asset tag must be 4 digits (0001-3000)' }
              ]}
            >
              <Input
                placeholder="Enter 4-digit asset tag (0001-3000)"
                maxLength={4}
              />
            </Form.Item>
          )}

          <Divider orientation="left">Item Selection</Divider>

          <Form.Item
            name="itemId"
            label="Select Inventory Item"
            rules={[{ required: true, message: 'Please select an item' }]}
          >
            <Select
              showSearch
              placeholder="Select item from inventory"
              onChange={handleItemSelect}
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {inventoryItems.map(item => (
                <Option key={item._id} value={item._id}>
                  {item.code} - {item.description} (Stock: {item.stockQuantity})
                </Option>
              ))}
            </Select>
          </Form.Item>

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
                  <Text strong>Stock:</Text> {selectedItem.stockQuantity}
                </Col>
                <Col span={6}>
                  <Text strong>Price:</Text> {(selectedItem.standardPrice || selectedItem.averageCost || 0).toLocaleString()} XAF
                </Col>
              </Row>
            </Card>
          )}

          <Divider orientation="left">Asset Information</Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="assetName"
                label="Asset Name"
                rules={[{ required: true, message: 'Please enter asset name' }]}
              >
                <Input placeholder="Enter asset name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="condition"
                label="Condition"
                rules={[{ required: true, message: 'Please select condition' }]}
              >
                <Select placeholder="Select condition">
                  <Option value="excellent">Excellent</Option>
                  <Option value="good">Good</Option>
                  <Option value="fair">Fair</Option>
                  <Option value="poor">Poor</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assetDescription"
            label="Asset Description"
          >
            <TextArea rows={3} placeholder="Enter detailed description" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="serialNumber"
                label="Serial Number"
              >
                <Input placeholder="Enter serial number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="modelNumber"
                label="Model Number"
              >
                <Input placeholder="Enter model number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="manufacturer"
                label="Manufacturer"
              >
                <Input placeholder="Enter manufacturer" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Acquisition Details</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="acquisitionDate"
                label="Acquisition Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="acquisitionCost"
                label="Acquisition Cost (XAF)"
                rules={[
                  { required: true, message: 'Please enter cost' },
                  { type: 'number', min: 0, message: 'Cost must be positive' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="Enter cost"
                  min={0}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="warrantyExpiry"
                label="Warranty Expiry Date"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="supplierId"
                label="Supplier"
              >
                <Select
                  showSearch
                  placeholder="Select supplier"
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {suppliers.map(supplier => (
                    <Option key={supplier._id} value={supplier._id}>
                      {supplier.fullName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="poNumber"
                label="PO Number"
              >
                <Input placeholder="Purchase order number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="invoiceNumber"
                label="Invoice Number"
              >
                <Input placeholder="Invoice number" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="supplierName"
            label="Supplier Name (if not in list)"
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>

          <Divider orientation="left">Depreciation Settings</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="depreciationMethod"
                label="Depreciation Method"
                rules={[{ required: true, message: 'Please select method' }]}
              >
                <Select placeholder="Select method">
                  <Option value="straight-line">Straight Line</Option>
                  <Option value="declining-balance">Declining Balance</Option>
                  <Option value="none">No Depreciation</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="usefulLifeYears"
                label="Useful Life (Years)"
                rules={[{ required: true, message: 'Please enter useful life' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={1}
                  max={50}
                  placeholder="Enter years"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="salvageValue"
                label="Salvage Value (XAF)"
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  placeholder="Enter salvage value"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Assignment (Optional)</Divider>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="assignedToId"
                label="Assign To User"
              >
                <Select
                  showSearch
                  placeholder="Select user"
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {users.map(user => (
                    <Option key={user._id || user.id} value={user._id || user.id}>
                      {user.fullName} - {user.department}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="assignedDepartment"
                label="Department"
              >
                <Input placeholder="Enter department" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="assignedLocation"
            label="Assigned Location"
          >
            <Input placeholder="Enter location" />
          </Form.Item>

          <Divider orientation="left">Physical Location</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="building"
                label="Building"
              >
                <Input placeholder="Enter building" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="floor"
                label="Floor"
              >
                <Input placeholder="Enter floor" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="room"
                label="Room"
              >
                <Input placeholder="Enter room" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <TextArea
              rows={3}
              placeholder="Enter any additional notes"
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Divider />

          <Alert
            message="Important Notice"
            description="Once registered as a fixed asset, this item will be removed from the available inventory stock and tracked separately in the fixed assets registry."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                disabled={inventoryItems.length === 0}
              >
                Register Fixed Asset
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/supply-chain/fixed-assets')}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterFixedAsset;












// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
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
//   Upload,
//   Alert,
//   Steps
// } from 'antd';
// import {
//   PlusOutlined,
//   SaveOutlined,
//   BarcodeOutlined,
//   UploadOutlined,
//   InboxOutlined
// } from '@ant-design/icons';
// import axios from 'axios';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;
// const { Dragger } = Upload;
// const { Step } = Steps;

// const AssetRegistrationForm = () => {
//   const navigate = useNavigate();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [items, setItems] = useState([]);
//   const [suppliers, setSuppliers] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [nextAssetTag, setNextAssetTag] = useState('');
//   const [useCustomTag, setUseCustomTag] = useState(false);
//   const [imageFileList, setImageFileList] = useState([]);
//   const [documentFileList, setDocumentFileList] = useState([]);

//   useEffect(() => {
//     fetchItems();
//     fetchSuppliers();
//     fetchUsers();
//     fetchNextAssetTag();
//   }, []);

//   const fetchItems = async () => {
//     try {
//       const response = await axios.get('/api/items/active');
//       setItems(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching items:', error);
//       message.error('Failed to load items');
//     }
//   };

//   const fetchSuppliers = async () => {
//     try {
//       const response = await axios.get('/api/suppliers');
//       setSuppliers(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching suppliers:', error);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await axios.get('/api/users');
//       setUsers(response.data.data || []);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//     }
//   };

//   const fetchNextAssetTag = async () => {
//     try {
//       const response = await axios.get('/api/fixed-assets/available-tags');
//       setNextAssetTag(response.data.data.nextAvailable);
//     } catch (error) {
//       console.error('Error fetching next asset tag:', error);
//     }
//   };

//   const handleItemSelect = (itemId) => {
//     const item = items.find(i => i._id === itemId);
//     if (item) {
//       form.setFieldsValue({
//         assetName: item.description,
//         assetDescription: item.specifications || item.description
//       });
//     }
//   };

//   const handleImageUpload = ({ fileList }) => {
//     setImageFileList(fileList);
//   };

//   const handleDocumentUpload = ({ fileList }) => {
//     setDocumentFileList(fileList);
//   };

//   const uploadFile = async (file) => {
//     const formData = new FormData();
//     formData.append('file', file);

//     try {
//       const response = await axios.post('/api/upload', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       return response.data.data.url;
//     } catch (error) {
//       console.error('File upload error:', error);
//       throw error;
//     }
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);

//       // Upload images
//       const images = [];
//       for (const file of imageFileList) {
//         if (file.originFileObj) {
//           const url = await uploadFile(file.originFileObj);
//           images.push({ url, caption: file.name });
//         }
//       }

//       // Upload documents
//       const documents = [];
//       for (const file of documentFileList) {
//         if (file.originFileObj) {
//           const url = await uploadFile(file.originFileObj);
//           documents.push({
//             filename: file.name,
//             url,
//             documentType: 'other'
//           });
//         }
//       }

//       const assetData = {
//         itemId: values.itemId,
//         assetName: values.assetName,
//         assetDescription: values.assetDescription,
//         serialNumber: values.serialNumber,
//         modelNumber: values.modelNumber,
//         manufacturer: values.manufacturer,
//         acquisitionDate: values.acquisitionDate.toDate(),
//         acquisitionCost: values.acquisitionCost,
//         supplierId: values.supplierId,
//         poNumber: values.poNumber,
//         invoiceNumber: values.invoiceNumber,
//         warrantyExpiry: values.warrantyExpiry?.toDate(),
//         depreciationMethod: values.depreciationMethod,
//         usefulLifeYears: values.usefulLifeYears,
//         salvageValue: values.salvageValue || 0,
//         condition: values.condition,
//         physicalLocation: {
//           building: values.building,
//           floor: values.floor,
//           room: values.room,
//           notes: values.locationNotes
//         },
//         notes: values.notes,
//         customAssetTag: useCustomTag ? values.customAssetTag : undefined,
//         images,
//         documents
//       };

//       // Add assignment if provided
//       if (values.assignNow && values.assignedToId) {
//         assetData.assignedToId = values.assignedToId;
//         assetData.assignedDepartment = values.assignedDepartment;
//         assetData.assignedLocation = values.assignedLocation;
//       }

//       const response = await axios.post('/api/fixed-assets/register', assetData);

//       if (response.data.success) {
//         message.success('Fixed asset registered successfully');
//         navigate('/supply-chain/fixed-assets');
//       } else {
//         message.error(response.data.message || 'Failed to register asset');
//       }
//     } catch (error) {
//       console.error('Error registering asset:', error);
//       message.error(error.response?.data?.message || 'Failed to register asset');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const steps = [
//     {
//       title: 'Basic Information',
//       content: (
//         <>
//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="itemId"
//                 label="Link to Item"
//                 rules={[{ required: true, message: 'Please select an item' }]}
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select item from inventory"
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
//               <Form.Item label="Asset Tag">
//                 <Space>
//                   {!useCustomTag ? (
//                     <>
//                       <Input
//                         value={nextAssetTag}
//                         disabled
//                         prefix={<BarcodeOutlined />}
//                         style={{ width: '120px' }}
//                       />
//                       <Button
//                         type="link"
//                         onClick={() => setUseCustomTag(true)}
//                       >
//                         Use Custom Tag
//                       </Button>
//                     </>
//                   ) : (
//                     <>
//                       <Form.Item
//                         name="customAssetTag"
//                         noStyle
//                         rules={[
//                           { required: true, message: 'Please enter asset tag' },
//                           { pattern: /^[0-9]{4}$/, message: 'Must be 4 digits (0001-3000)' },
//                           {
//                             validator: async (_, value) => {
//                               if (value) {
//                                 const num = parseInt(value);
//                                 if (num < 1 || num > 3000) {
//                                   throw new Error('Tag must be between 0001 and 3000');
//                                 }
//                               }
//                             }
//                           }
//                         ]}
//                       >
//                         <Input
//                           placeholder="Enter 4-digit tag"
//                           prefix={<BarcodeOutlined />}
//                           style={{ width: '150px' }}
//                         />
//                       </Form.Item>
//                       <Button
//                         type="link"
//                         onClick={() => setUseCustomTag(false)}
//                       >
//                         Use Auto Tag
//                       </Button>
//                     </>
//                   )}
//                 </Space>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="assetName"
//                 label="Asset Name"
//                 rules={[{ required: true, message: 'Please enter asset name' }]}
//               >
//                 <Input placeholder="Enter asset name" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="serialNumber"
//                 label="Serial Number"
//               >
//                 <Input placeholder="Enter manufacturer serial number" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="modelNumber"
//                 label="Model Number"
//               >
//                 <Input placeholder="Enter model number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="manufacturer"
//                 label="Manufacturer"
//               >
//                 <Input placeholder="Enter manufacturer name" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="assetDescription"
//             label="Asset Description"
//           >
//             <TextArea
//               rows={3}
//               placeholder="Enter detailed asset description"
//               maxLength={500}
//               showCount
//             />
//           </Form.Item>
//         </>
//       )
//     },
//     {
//       title: 'Acquisition Details',
//       content: (
//         <>
//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="acquisitionDate"
//                 label="Acquisition Date"
//                 rules={[{ required: true, message: 'Please select acquisition date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="acquisitionCost"
//                 label="Acquisition Cost (XAF)"
//                 rules={[
//                   { required: true, message: 'Please enter acquisition cost' },
//                   { type: 'number', min: 0, message: 'Cost must be non-negative' }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   placeholder="Enter cost"
//                   min={0}
//                   formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                 />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="condition"
//                 label="Initial Condition"
//                 rules={[{ required: true, message: 'Please select condition' }]}
//               >
//                 <Select placeholder="Select condition">
//                   <Option value="excellent">Excellent</Option>
//                   <Option value="good">Good</Option>
//                   <Option value="fair">Fair</Option>
//                   <Option value="poor">Poor</Option>
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="supplierId"
//                 label="Supplier"
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select supplier"
//                   allowClear
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {suppliers.map(supplier => (
//                     <Option key={supplier._id} value={supplier._id}>
//                       {supplier.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="poNumber"
//                 label="PO Number"
//               >
//                 <Input placeholder="Enter purchase order number" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="invoiceNumber"
//                 label="Invoice Number"
//               >
//                 <Input placeholder="Enter invoice number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
//               <Form.Item
//                 name="warrantyExpiry"
//                 label="Warranty Expiry Date"
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>
//           </Row>
//         </>
//       )
//     },
//     {
//       title: 'Depreciation',
//       content: (
//         <>
//           <Alert
//             message="Depreciation Settings"
//             description="Configure how this asset will depreciate over time. This affects book value calculations."
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="depreciationMethod"
//                 label="Depreciation Method"
//                 rules={[{ required: true, message: 'Please select method' }]}
//               >
//                 <Select placeholder="Select method">
//                   <Option value="straight-line">Straight Line</Option>
//                   <Option value="declining-balance">Declining Balance</Option>
//                   <Option value="none">No Depreciation</Option>
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="usefulLifeYears"
//                 label="Useful Life (Years)"
//                 rules={[
//                   { required: true, message: 'Please enter useful life' },
//                   { type: 'number', min: 1, message: 'Must be at least 1 year' }
//                 ]}
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   placeholder="Enter years"
//                   min={1}
//                   max={50}
//                 />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="salvageValue"
//                 label="Salvage Value (XAF)"
//               >
//                 <InputNumber
//                   style={{ width: '100%' }}
//                   placeholder="Enter salvage value"
//                   min={0}
//                   formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
//                   parser={value => value.replace(/\$\s?|(,*)/g, '')}
//                 />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Card size="small" style={{ backgroundColor: '#f0f2f5' }}>
//             <Title level={5}>Depreciation Preview</Title>
//             <Row gutter={16}>
//               <Col span={8}>
//                 <Text strong>Acquisition Cost:</Text>
//                 <br />
//                 <Text>{(form.getFieldValue('acquisitionCost') || 0).toLocaleString()} XAF</Text>
//               </Col>
//               <Col span={8}>
//                 <Text strong>Salvage Value:</Text>
//                 <br />
//                 <Text>{(form.getFieldValue('salvageValue') || 0).toLocaleString()} XAF</Text>
//               </Col>
//               <Col span={8}>
//                 <Text strong>Annual Depreciation:</Text>
//                 <br />
//                 <Text>
//                   {(
//                     ((form.getFieldValue('acquisitionCost') || 0) - 
//                     (form.getFieldValue('salvageValue') || 0)) / 
//                     (form.getFieldValue('usefulLifeYears') || 1)
//                   ).toLocaleString()} XAF
//                 </Text>
//               </Col>
//             </Row>
//           </Card>
//         </>
//       )
//     },
//     {
//       title: 'Location & Assignment',
//       content: (
//         <>
//           <Divider orientation="left">Physical Location</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="building"
//                 label="Building"
//               >
//                 <Input placeholder="Enter building name" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="floor"
//                 label="Floor"
//               >
//                 <Input placeholder="Enter floor number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="room"
//                 label="Room"
//               >
//                 <Input placeholder="Enter room number" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Form.Item
//             name="locationNotes"
//             label="Location Notes"
//           >
//             <TextArea
//               rows={2}
//               placeholder="Additional location details"
//               maxLength={200}
//               showCount
//             />
//           </Form.Item>

//           <Divider orientation="left">Initial Assignment (Optional)</Divider>

//           <Form.Item
//             name="assignNow"
//             valuePropName="checked"
//           >
//             <Alert
//               message="Would you like to assign this asset to a user now?"
//               description="You can skip this and assign the asset later"
//               type="info"
//               showIcon
//             />
//           </Form.Item>

//           <Form.Item
//             noStyle
//             shouldUpdate={(prevValues, currentValues) => 
//               prevValues.assignNow !== currentValues.assignNow
//             }
//           >
//             {({ getFieldValue }) =>
//               getFieldValue('assignNow') ? (
//                 <>
//                   <Row gutter={16}>
//                     <Col xs={24} md={12}>
//                       <Form.Item
//                         name="assignedToId"
//                         label="Assign To"
//                         rules={[{ required: true, message: 'Please select user' }]}
//                       >
//                         <Select
//                           showSearch
//                           placeholder="Select user"
//                           filterOption={(input, option) =>
//                             option.children.toLowerCase().includes(input.toLowerCase())
//                           }
//                         >
//                           {users.map(user => (
//                             <Option key={user._id} value={user._id}>
//                               {user.fullName || user.email} - {user.department}
//                             </Option>
//                           ))}
//                         </Select>
//                       </Form.Item>
//                     </Col>

//                     <Col xs={24} md={12}>
//                       <Form.Item
//                         name="assignedDepartment"
//                         label="Department"
//                       >
//                         <Input placeholder="Enter department" />
//                       </Form.Item>
//                     </Col>
//                   </Row>

//                   <Form.Item
//                     name="assignedLocation"
//                     label="Assignment Location"
//                   >
//                     <Input placeholder="Where will the asset be used?" />
//                   </Form.Item>
//                 </>
//               ) : null
//             }
//           </Form.Item>
//         </>
//       )
//     },
//     {
//       title: 'Files & Notes',
//       content: (
//         <>
//           <Form.Item label="Asset Images">
//             <Dragger
//               multiple
//               fileList={imageFileList}
//               onChange={handleImageUpload}
//               beforeUpload={() => false}
//               accept="image/*"
//             >
//               <p className="ant-upload-drag-icon">
//                 <InboxOutlined />
//               </p>
//               <p className="ant-upload-text">
//                 Click or drag image files to upload
//               </p>
//               <p className="ant-upload-hint">
//                 Upload photos of the asset
//               </p>
//             </Dragger>
//           </Form.Item>

//           <Form.Item label="Documents">
//             <Dragger
//               multiple
//               fileList={documentFileList}
//               onChange={handleDocumentUpload}
//               beforeUpload={() => false}
//             >
//               <p className="ant-upload-drag-icon">
//                 <UploadOutlined />
//               </p>
//               <p className="ant-upload-text">
//                 Click or drag documents to upload
//               </p>
//               <p className="ant-upload-hint">
//                 Upload invoices, warranties, manuals, certificates, etc.
//               </p>
//             </Dragger>
//           </Form.Item>

//           <Form.Item
//             name="notes"
//             label="Additional Notes"
//           >
//             <TextArea
//               rows={4}
//               placeholder="Enter any additional notes or information about this asset"
//               maxLength={1000}
//               showCount
//             />
//           </Form.Item>
//         </>
//       )
//     }
//   ];

//   const next = () => {
//     form.validateFields().then(() => {
//       setCurrentStep(currentStep + 1);
//     }).catch(() => {
//       message.error('Please complete all required fields');
//     });
//   };

//   const prev = () => {
//     setCurrentStep(currentStep - 1);
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <PlusOutlined /> Register New Fixed Asset
//         </Title>
//         <Text type="secondary">
//           Register a new fixed asset with automatic tag assignment
//         </Text>

//         <Divider />

//         <Steps current={currentStep} style={{ marginBottom: '24px' }}>
//           {steps.map(item => (
//             <Step key={item.title} title={item.title} />
//           ))}
//         </Steps>

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             depreciationMethod: 'straight-line',
//             usefulLifeYears: 5,
//             salvageValue: 0,
//             condition: 'good',
//             assignNow: false
//           }}
//         >
//           <div style={{ minHeight: '400px' }}>
//             {steps[currentStep].content}
//           </div>

//           <Divider />

//           <Form.Item>
//             <Space>
//               {currentStep > 0 && (
//                 <Button onClick={prev}>
//                   Previous
//                 </Button>
//               )}
//               {currentStep < steps.length - 1 && (
//                 <Button type="primary" onClick={next}>
//                   Next
//                 </Button>
//               )}
//               {currentStep === steps.length - 1 && (
//                 <Button
//                   type="primary"
//                   htmlType="submit"
//                   loading={loading}
//                   icon={<SaveOutlined />}
//                   size="large"
//                 >
//                   Register Asset
//                 </Button>
//               )}
//               <Button
//                 onClick={() => navigate('/supply-chain/fixed-assets')}
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

// export default AssetRegistrationForm;