// OutboundTransaction.jsx - Complete Component with Fixed fetchItems

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
  Alert
} from 'antd';
import {
  ShoppingOutlined,
  SaveOutlined,
  WarningOutlined
} from '@ant-design/icons';
import api from '../../services/api';
import moment from 'moment';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const OutboundTransaction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchProjects();
    fetchUsers();
  }, []);

  useEffect(() => {
    const itemId = searchParams.get('itemId');
    if (itemId && items.length > 0) {
      const item = items.find(i => i._id === itemId);
      if (item) {
        form.setFieldsValue({ itemId });
        setSelectedItem(item);
      }
    }
  }, [items, searchParams, form]);

  /**
   * Fetch items from both Inventory and Item catalog
   * Similar to inbound transaction
   */
  const fetchItems = async () => {
    try {
      console.log('Fetching items for outbound...');
      
      // Fetch from both sources in parallel
      const [inventoryRes, catalogRes] = await Promise.all([
        api.get('/api/inventory/available-stock?limit=1000')
          .catch(err => {
            console.warn('Inventory fetch failed:', err.message);
            return { data: { data: { items: [] } } };
          }),
        api.get('/api/items/active')
          .catch(err => {
            console.warn('Catalog fetch failed:', err.message);
            return { data: { data: [] } };
          })
      ]);
      
      const inventoryItems = inventoryRes.data.data?.items || [];
      const catalogItems = catalogRes.data.data || [];
      
      console.log('📦 Loaded from inventory:', inventoryItems.length);
      console.log('📋 Loaded from catalog:', catalogItems.length);
      
      // Combine, preferring inventory items
      const itemsMap = new Map();
      
      // Add inventory items first (they have stock info)
      inventoryItems.forEach(item => {
        itemsMap.set(item._id, {
          ...item,
          source: 'inventory',
          hasStock: (item.stockQuantity || 0) > 0
        });
      });
      
      // Add catalog items that aren't already in inventory
      catalogItems.forEach(item => {
        if (!itemsMap.has(item._id)) {
          // Check if there's a matching inventory item by code
          const matchingInventory = inventoryItems.find(inv => inv.code === item.code);
          
          if (matchingInventory) {
            // Use the inventory item's ID
            itemsMap.set(matchingInventory._id, {
              ...matchingInventory,
              source: 'inventory',
              hasStock: (matchingInventory.stockQuantity || 0) > 0
            });
          } else {
            itemsMap.set(item._id, {
              ...item,
              stockQuantity: 0,
              source: 'catalog',
              hasStock: false
            });
          }
        }
      });
      
      const combined = Array.from(itemsMap.values());
      
      // For outbound, prioritize items with stock
      const itemsWithStock = combined.filter(item => (item.stockQuantity || 0) > 0);
      
      console.log('✅ Total items available:', combined.length);
      console.log('✅ Items with stock:', itemsWithStock.length);
      
      setItems(combined);
      
      if (itemsWithStock.length === 0) {
        message.warning('No items with available stock found');
      }
    } catch (error) {
      console.error('❌ Error fetching items:', error);
      message.error('Failed to load items. Please refresh the page.');
      setItems([]);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      console.log('Raw projects response:', response.data);
      
      const projectsData = response.data.data?.projects || response.data.data || response.data.projects || [];
      console.log('Projects data extracted:', projectsData);
      
      const activeProjects = Array.isArray(projectsData) 
        ? projectsData.filter(project => 
            project.isActive !== false && project.name
          )
        : [];
      
      console.log('Filtered active projects:', activeProjects.length);
      setProjects(activeProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      message.error('Failed to load projects');
      setProjects([]);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/auth/users');
      console.log('Raw users response:', response.data);
      
      const usersData = response.data.data?.users || response.data.data || response.data.users || [];
      console.log('Users data extracted:', usersData);
      
      const activeUsers = Array.isArray(usersData)
        ? usersData.filter(user => 
            user.role !== 'supplier' && 
            user.isActive !== false &&
            user.fullName
          )
        : [];
      
      console.log('Filtered active users:', activeUsers.length);
      setUsers(activeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Failed to load users');
      setUsers([]);
    }
  };

  const handleItemSelect = (itemId) => {
    const item = items.find(i => i._id === itemId);
    setSelectedItem(item);
    
    if (item && (item.stockQuantity || 0) === 0) {
      message.warning(`${item.code} has no stock available`);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Validate stock availability
      if (selectedItem && values.quantity > (selectedItem.stockQuantity || 0)) {
        message.error(`Insufficient stock. Available: ${selectedItem.stockQuantity || 0}`);
        setLoading(false);
        return;
      }

      const transactionData = {
        itemId: values.itemId,
        quantity: values.quantity,
        requisitionNumber: values.requisitionNumber,
        projectId: values.projectId,
        projectName: projects.find(p => p._id === values.projectId)?.name,
        cluster: values.cluster,
        siteName: values.siteName,
        ihsId: values.ihsId,
        siteId: values.siteId,
        mfrNumber: values.mfrNumber,
        mfrDate: values.mfrDate?.toDate(),
        requestorId: values.requestorId,
        requestorName: users.find(u => u._id === values.requestorId)?.fullName,
        deliveryNote: values.deliveryNote,
        carrier: values.carrier,
        carrierName: values.carrierName,
        transporter: values.transporter,
        transactionDate: values.transactionDate?.toDate() || new Date(),
        comment: values.comment
      };

      console.log('Submitting outbound transaction:', transactionData);

      const response = await api.post('/api/inventory/outbound', transactionData);

      if (response.data.success) {
        message.success('Outbound transaction recorded successfully');
        navigate('/supply-chain/inventory');
      } else {
        message.error(response.data.message || 'Failed to record outbound transaction');
      }
    } catch (error) {
      console.error('Error recording outbound:', error);
      message.error(error.response?.data?.message || 'Failed to record outbound transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <ShoppingOutlined /> Record Outbound Transaction
        </Title>
        <Text type="secondary">
          Record outgoing stock for projects, sites, or departments
        </Text>

        <Divider />

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            transactionDate: moment()
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
                    <Option 
                      key={item._id} 
                      value={item._id}
                      disabled={(item.stockQuantity || 0) === 0}
                    >
                      {item.code} - {item.description}
                      {` (Stock: ${item.stockQuantity || 0} ${item.unitOfMeasure || ''})`}
                      {item.source === 'catalog' && ' [Catalog]'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
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
                  <Text strong>Available Stock:</Text> 
                  <Text style={{ 
                    color: (selectedItem.stockQuantity || 0) <= (selectedItem.reorderPoint || 0) ? '#faad14' : '#52c41a',
                    fontWeight: 'bold',
                    marginLeft: '8px'
                  }}>
                    {selectedItem.stockQuantity || 0}
                  </Text>
                </Col>
                <Col span={6}>
                  <Text strong>Unit Price:</Text> {(selectedItem.averageCost || selectedItem.standardPrice || 0).toLocaleString()} XAF
                </Col>
              </Row>
            </Card>
          )}

          {selectedItem && form.getFieldValue('quantity') > (selectedItem.stockQuantity || 0) && (
            <Alert
              message="Insufficient Stock"
              description={`Requested quantity (${form.getFieldValue('quantity')}) exceeds available stock (${selectedItem.stockQuantity || 0})`}
              type="error"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: '16px' }}
            />
          )}

          <Divider orientation="left">Transaction Details</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="requisitionNumber"
                label="Requisition/MRF Number"
              >
                <Input placeholder="Enter requisition number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="transactionDate"
                label="Transaction Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="requestorId"
                label="Requestor"
              >
                <Select
                  showSearch
                  placeholder="Select requestor"
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No active users found"
                >
                  {users.map(user => (
                    <Option key={user._id || user.id} value={user._id || user.id}>
                      {user.fullName || user.email} 
                      {user.department && ` - ${user.department}`}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Project & Site Information</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="projectId"
                label="Project"
              >
                <Select
                  showSearch
                  placeholder="Select project"
                  allowClear
                  filterOption={(input, option) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                  notFoundContent="No active projects found"
                >
                  {projects.map(project => (
                    <Option key={project._id || project.id} value={project._id || project.id}>
                      {project.code ? `${project.code} - ` : ''}{project.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="cluster"
                label="Cluster"
              >
                <Input placeholder="Enter cluster" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="siteName"
                label="Site Name"
              >
                <Input placeholder="Enter site name" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="ihsId"
                label="IHS ID"
              >
                <Input placeholder="Enter IHS ID" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="siteId"
                label="Site ID"
              >
                <Input placeholder="Enter site ID" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="mfrNumber"
                label="MFR Number"
              >
                <Input placeholder="Material Flow Reference" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Delivery Information</Divider>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name="deliveryNote"
                label="Delivery Note"
              >
                <Input placeholder="Enter delivery note number" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="carrier"
                label="Carrier"
              >
                <Input placeholder="Enter carrier name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="transporter"
                label="Transporter"
              >
                <Input placeholder="Enter transporter name" />
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

          <Divider />

          <Card size="small" style={{ backgroundColor: '#e6f7ff', marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Total Value:</Text>
                <Text style={{ marginLeft: '8px', fontSize: '16px', color: '#1890ff' }}>
                  {(
                    (form.getFieldValue('quantity') || 0) * 
                    (selectedItem?.averageCost || selectedItem?.standardPrice || 0)
                  ).toLocaleString()} XAF
                </Text>
              </Col>
              <Col span={12}>
                <Text strong>Stock After Transaction:</Text>
                <Text style={{ marginLeft: '8px', fontSize: '16px' }}>
                  {selectedItem ? 
                    Math.max(0, (selectedItem.stockQuantity || 0) - (form.getFieldValue('quantity') || 0)) : 
                    0
                  }
                </Text>
              </Col>
            </Row>
          </Card>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<SaveOutlined />}
                size="large"
                disabled={selectedItem && form.getFieldValue('quantity') > (selectedItem.stockQuantity || 0)}
              >
                Record Outbound
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
    </div>
  );
};

export default OutboundTransaction;










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
//   Alert
// } from 'antd';
// import {
//   ShoppingOutlined,
//   SaveOutlined,
//   WarningOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const OutboundTransaction = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);

//   useEffect(() => {
//     fetchItems();
//     fetchProjects();
//     fetchUsers();
//   }, []);

//   useEffect(() => {
//     const itemId = searchParams.get('itemId');
//     if (itemId && items.length > 0) {
//       const item = items.find(i => i._id === itemId);
//       if (item) {
//         form.setFieldsValue({ itemId });
//         setSelectedItem(item);
//       }
//     }
//   }, [items, searchParams, form]);

//   const fetchItems = async () => {
//     try {
//       // Fetch from both sources
//       const [inventoryRes, catalogRes] = await Promise.all([
//         api.get('/api/inventory/available-stock?limit=1000').catch(() => ({ data: { data: { items: [] } } })),
//         api.get('/api/items/active').catch(() => ({ data: { data: [] } }))
//       ]);
      
//       const inventoryItems = inventoryRes.data.data?.items || [];
//       const catalogItems = catalogRes.data.data || [];
      
//       console.log('Loaded from inventory:', inventoryItems.length);
//       console.log('Loaded from catalog:', catalogItems.length);
      
//       // Combine, preferring inventory items
//       const itemsMap = new Map();
      
//       inventoryItems.forEach(item => {
//         itemsMap.set(item._id, {
//           ...item,
//           source: 'inventory',
//           hasStock: true
//         });
//       });
      
//       catalogItems.forEach(item => {
//         if (!itemsMap.has(item._id)) {
//           itemsMap.set(item._id, {
//             ...item,
//             stockQuantity: 0,
//             source: 'catalog',
//             hasStock: false
//           });
//         }
//       });
      
//       const combined = Array.from(itemsMap.values());
//       console.log('Total items available:', combined.length);
      
//       setItems(combined);
//     } catch (error) {
//       console.error('Error fetching items:', error);
//       message.error('Failed to load items. Please refresh the page.');
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const response = await api.get('/api/projects');
//       console.log('Raw projects response:', response.data);
      
//       // Handle different response structures
//       const projectsData = response.data.data?.projects || response.data.data || response.data.projects || [];
//       console.log('Projects data extracted:', projectsData);
      
//       // Filter active projects only
//       const activeProjects = Array.isArray(projectsData) 
//         ? projectsData.filter(project => 
//             project.isActive !== false && project.name
//           )
//         : [];
      
//       console.log('Filtered active projects:', activeProjects.length);
//       setProjects(activeProjects);
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       message.error('Failed to load projects');
//       setProjects([]);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await api.get('/api/auth/users');
//       console.log('Raw users response:', response.data);
      
//       // Handle different response structures
//       const usersData = response.data.data?.users || response.data.data || response.data.users || [];
//       console.log('Users data extracted:', usersData);
      
//       // Filter out suppliers and inactive users
//       const activeUsers = Array.isArray(usersData)
//         ? usersData.filter(user => 
//             user.role !== 'supplier' && 
//             user.isActive !== false &&
//             user.fullName
//           )
//         : [];
      
//       console.log('Filtered active users:', activeUsers.length);
//       setUsers(activeUsers);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       message.error('Failed to load users');
//       setUsers([]);
//     }
//   };

//   const handleItemSelect = (itemId) => {
//     const item = items.find(i => i._id === itemId);
//     setSelectedItem(item);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);

//       // Validate stock availability
//       if (selectedItem && values.quantity > selectedItem.stockQuantity) {
//         message.error(`Insufficient stock. Available: ${selectedItem.stockQuantity}`);
//         setLoading(false);
//         return;
//       }

//       const transactionData = {
//         itemId: values.itemId,
//         quantity: values.quantity,
//         requisitionNumber: values.requisitionNumber,
//         projectId: values.projectId,
//         projectName: projects.find(p => p._id === values.projectId)?.name,
//         cluster: values.cluster,
//         siteName: values.siteName,
//         ihsId: values.ihsId,
//         siteId: values.siteId,
//         mfrNumber: values.mfrNumber,
//         mfrDate: values.mfrDate?.toDate(),
//         requestorId: values.requestorId,
//         requestorName: users.find(u => u._id === values.requestorId)?.fullName,
//         deliveryNote: values.deliveryNote,
//         carrier: values.carrier,
//         carrierName: values.carrierName,
//         transporter: values.transporter,
//         transactionDate: values.transactionDate?.toDate() || new Date(),
//         comment: values.comment
//       };

//       console.log('Submitting outbound transaction:', transactionData);

//       const response = await api.post('/api/inventory/outbound', transactionData);

//       if (response.data.success) {
//         message.success('Outbound transaction recorded successfully');
//         navigate('/supply-chain/inventory');
//       } else {
//         message.error(response.data.message || 'Failed to record outbound transaction');
//       }
//     } catch (error) {
//       console.error('Error recording outbound:', error);
//       message.error(error.response?.data?.message || 'Failed to record outbound transaction');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <ShoppingOutlined /> Record Outbound Transaction
//         </Title>
//         <Text type="secondary">
//           Record outgoing stock for projects, sites, or departments
//         </Text>

//         <Divider />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             transactionDate: moment()
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
//                       {item.hasStock && ` (Stock: ${item.stockQuantity})`}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={12}>
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
//                   <Text strong>Available Stock:</Text> 
//                   <Text style={{ 
//                     color: selectedItem.stockQuantity <= (selectedItem.reorderPoint || 0) ? '#faad14' : '#52c41a',
//                     fontWeight: 'bold',
//                     marginLeft: '8px'
//                   }}>
//                     {selectedItem.stockQuantity || 0}
//                   </Text>
//                 </Col>
//                 <Col span={6}>
//                   <Text strong>Unit Price:</Text> {(selectedItem.averageCost || selectedItem.standardPrice || 0).toLocaleString()} XAF
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {selectedItem && form.getFieldValue('quantity') > (selectedItem.stockQuantity || 0) && (
//             <Alert
//               message="Insufficient Stock"
//               description={`Requested quantity (${form.getFieldValue('quantity')}) exceeds available stock (${selectedItem.stockQuantity || 0})`}
//               type="error"
//               showIcon
//               icon={<WarningOutlined />}
//               style={{ marginBottom: '16px' }}
//             />
//           )}

//           <Divider orientation="left">Transaction Details</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="requisitionNumber"
//                 label="Requisition/MRF Number"
//               >
//                 <Input placeholder="Enter requisition number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="transactionDate"
//                 label="Transaction Date"
//                 rules={[{ required: true, message: 'Please select date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="requestorId"
//                 label="Requestor"
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select requestor"
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                   notFoundContent="No active users found"
//                 >
//                   {users.map(user => (
//                     <Option key={user._id || user.id} value={user._id || user.id}>
//                       {user.fullName || user.email} 
//                       {user.department && ` - ${user.department}`}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider orientation="left">Project & Site Information</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="projectId"
//                 label="Project"
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select project"
//                   allowClear
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                   notFoundContent="No active projects found"
//                 >
//                   {projects.map(project => (
//                     <Option key={project._id || project.id} value={project._id || project.id}>
//                       {project.code ? `${project.code} - ` : ''}{project.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="cluster"
//                 label="Cluster"
//               >
//                 <Input placeholder="Enter cluster" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="siteName"
//                 label="Site Name"
//               >
//                 <Input placeholder="Enter site name" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="ihsId"
//                 label="IHS ID"
//               >
//                 <Input placeholder="Enter IHS ID" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="siteId"
//                 label="Site ID"
//               >
//                 <Input placeholder="Enter site ID" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="mfrNumber"
//                 label="MFR Number"
//               >
//                 <Input placeholder="Material Flow Reference" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider orientation="left">Delivery Information</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="deliveryNote"
//                 label="Delivery Note"
//               >
//                 <Input placeholder="Enter delivery note number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="carrier"
//                 label="Carrier"
//               >
//                 <Input placeholder="Enter carrier name" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="transporter"
//                 label="Transporter"
//               >
//                 <Input placeholder="Enter transporter name" />
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

//           <Divider />

//           <Card size="small" style={{ backgroundColor: '#e6f7ff', marginBottom: '16px' }}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Text strong>Total Value:</Text>
//                 <Text style={{ marginLeft: '8px', fontSize: '16px', color: '#1890ff' }}>
//                   {(
//                     (form.getFieldValue('quantity') || 0) * 
//                     (selectedItem?.averageCost || selectedItem?.standardPrice || 0)
//                   ).toLocaleString()} XAF
//                 </Text>
//               </Col>
//               <Col span={12}>
//                 <Text strong>Stock After Transaction:</Text>
//                 <Text style={{ marginLeft: '8px', fontSize: '16px' }}>
//                   {selectedItem ? 
//                     Math.max(0, (selectedItem.stockQuantity || 0) - (form.getFieldValue('quantity') || 0)) : 
//                     0
//                   }
//                 </Text>
//               </Col>
//             </Row>
//           </Card>

//           <Form.Item>
//             <Space>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SaveOutlined />}
//                 size="large"
//                 disabled={selectedItem && form.getFieldValue('quantity') > (selectedItem.stockQuantity || 0)}
//               >
//                 Record Outbound
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

// export default OutboundTransaction;












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
//   Alert
// } from 'antd';
// import {
//   ShoppingOutlined,
//   SaveOutlined,
//   WarningOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';
// import moment from 'moment';

// const { Title, Text } = Typography;
// const { Option } = Select;
// const { TextArea } = Input;

// const OutboundTransaction = () => {
//   const navigate = useNavigate();
//   const [searchParams] = useSearchParams();
//   const [form] = Form.useForm();
//   const [loading, setLoading] = useState(false);
//   const [items, setItems] = useState([]);
//   const [projects, setProjects] = useState([]);
//   const [users, setUsers] = useState([]);
//   const [selectedItem, setSelectedItem] = useState(null);

//   useEffect(() => {
//     fetchItems();
//     fetchProjects();
//     fetchUsers();
    
//     const itemId = searchParams.get('itemId');
//     if (itemId) {
//       const item = items.find(i => i._id === itemId);
//       if (item) {
//         form.setFieldsValue({ itemId });
//         setSelectedItem(item);
//       }
//     }
//   }, []);

//   // const fetchItems = async () => {
//   //   try {
//   //     const response = await api.get('/api/items/active');
//   //     const itemsData = response.data.data || response.data || [];
//   //     setItems(Array.isArray(itemsData) ? itemsData : []);
//   //   } catch (error) {
//   //     console.error('Error fetching items:', error);
//   //     message.error('Failed to load items');
//   //     setItems([]);
//   //   }
//   // };

//   const fetchItems = async () => {
//     try {
//       // Fetch from both sources
//       const [inventoryRes, catalogRes] = await Promise.all([
//         api.get('/api/inventory/available-stock?limit=1000').catch(() => ({ data: { data: { items: [] } } })),
//         api.get('/api/items/active').catch(() => ({ data: { data: [] } }))
//       ]);
      
//       const inventoryItems = inventoryRes.data.data?.items || [];
//       const catalogItems = catalogRes.data.data || [];
      
//       console.log('Loaded from inventory:', inventoryItems.length);
//       console.log('Loaded from catalog:', catalogItems.length);
      
//       // Combine, preferring inventory items
//       const itemsMap = new Map();
      
//       inventoryItems.forEach(item => {
//         itemsMap.set(item._id, {
//           ...item,
//           source: 'inventory',
//           hasStock: true
//         });
//       });
      
//       catalogItems.forEach(item => {
//         if (!itemsMap.has(item._id)) {
//           itemsMap.set(item._id, {
//             ...item,
//             stockQuantity: 0,
//             source: 'catalog',
//             hasStock: false
//           });
//         }
//       });
      
//       const combined = Array.from(itemsMap.values());
//       console.log('Total items available:', combined.length);
      
//       setItems(combined);
//     } catch (error) {
//       console.error('Error fetching items:', error);
//       message.error('Failed to load items. Please refresh the page.');
//     }
//   };

//   const fetchProjects = async () => {
//     try {
//       const response = await api.get('/api/projects');
//       const projectsData = response.data.data || response.data || [];
//       setProjects(Array.isArray(projectsData) ? projectsData : []);
//     } catch (error) {
//       console.error('Error fetching projects:', error);
//       setProjects([]);
//     }
//   };

//   const fetchUsers = async () => {
//     try {
//       const response = await api.get('/api/auth/users');
//       const usersData = response.data.data || response.data || [];
//       setUsers(Array.isArray(usersData) ? usersData : []);
//     } catch (error) {
//       console.error('Error fetching users:', error);
//       setUsers([]);
//     }
//   };

//   const handleItemSelect = (itemId) => {
//     const item = items.find(i => i._id === itemId);
//     setSelectedItem(item);
//   };

//   const handleSubmit = async (values) => {
//     try {
//       setLoading(true);

//       // Validate stock availability
//       if (selectedItem && values.quantity > selectedItem.stockQuantity) {
//         message.error(`Insufficient stock. Available: ${selectedItem.stockQuantity}`);
//         return;
//       }

//       const transactionData = {
//         itemId: values.itemId,
//         quantity: values.quantity,
//         requisitionNumber: values.requisitionNumber,
//         projectId: values.projectId,
//         projectName: projects.find(p => p._id === values.projectId)?.name,
//         cluster: values.cluster,
//         siteName: values.siteName,
//         ihsId: values.ihsId,
//         siteId: values.siteId,
//         mfrNumber: values.mfrNumber,
//         mfrDate: values.mfrDate?.toDate(),
//         requestorId: values.requestorId,
//         requestorName: users.find(u => u._id === values.requestorId)?.fullName,
//         deliveryNote: values.deliveryNote,
//         carrier: values.carrier,
//         carrierName: values.carrierName,
//         transporter: values.transporter,
//         transactionDate: values.transactionDate?.toDate() || new Date(),
//         comment: values.comment
//       };

//       const response = await api.post('/api/inventory/outbound', transactionData);

//       if (response.data.success) {
//         message.success('Outbound transaction recorded successfully');
//         navigate('/supply-chain/inventory');
//       } else {
//         message.error(response.data.message || 'Failed to record outbound transaction');
//       }
//     } catch (error) {
//       console.error('Error recording outbound:', error);
//       message.error(error.response?.data?.message || 'Failed to record outbound transaction');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <ShoppingOutlined /> Record Outbound Transaction
//         </Title>
//         <Text type="secondary">
//           Record outgoing stock for projects, sites, or departments
//         </Text>

//         <Divider />

//         <Form
//           form={form}
//           layout="vertical"
//           onFinish={handleSubmit}
//           initialValues={{
//             transactionDate: moment()
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
//                   <Text strong>Available Stock:</Text> 
//                   <Text style={{ 
//                     color: selectedItem.stockQuantity <= selectedItem.reorderPoint ? '#faad14' : '#52c41a',
//                     fontWeight: 'bold',
//                     marginLeft: '8px'
//                   }}>
//                     {selectedItem.stockQuantity}
//                   </Text>
//                 </Col>
//                 <Col span={6}>
//                   <Text strong>Unit Price:</Text> {(selectedItem.averageCost || selectedItem.standardPrice || 0).toLocaleString()} XAF
//                 </Col>
//               </Row>
//             </Card>
//           )}

//           {selectedItem && form.getFieldValue('quantity') > selectedItem.stockQuantity && (
//             <Alert
//               message="Insufficient Stock"
//               description={`Requested quantity (${form.getFieldValue('quantity')}) exceeds available stock (${selectedItem.stockQuantity})`}
//               type="error"
//               showIcon
//               icon={<WarningOutlined />}
//               style={{ marginBottom: '16px' }}
//             />
//           )}

//           <Divider orientation="left">Transaction Details</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="requisitionNumber"
//                 label="Requisition/MRF Number"
//               >
//                 <Input placeholder="Enter requisition number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="transactionDate"
//                 label="Transaction Date"
//                 rules={[{ required: true, message: 'Please select date' }]}
//               >
//                 <DatePicker style={{ width: '100%' }} />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="requestorId"
//                 label="Requestor"
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select requestor"
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {users.map(user => (
//                     <Option key={user._id} value={user._id}>
//                       {user.fullName || user.email}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider orientation="left">Project & Site Information</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="projectId"
//                 label="Project"
//               >
//                 <Select
//                   showSearch
//                   placeholder="Select project"
//                   allowClear
//                   filterOption={(input, option) =>
//                     option.children.toLowerCase().includes(input.toLowerCase())
//                   }
//                 >
//                   {projects.map(project => (
//                     <Option key={project._id} value={project._id}>
//                       {project.name}
//                     </Option>
//                   ))}
//                 </Select>
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="cluster"
//                 label="Cluster"
//               >
//                 <Input placeholder="Enter cluster" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="siteName"
//                 label="Site Name"
//               >
//                 <Input placeholder="Enter site name" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="ihsId"
//                 label="IHS ID"
//               >
//                 <Input placeholder="Enter IHS ID" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="siteId"
//                 label="Site ID"
//               >
//                 <Input placeholder="Enter site ID" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="mfrNumber"
//                 label="MFR Number"
//               >
//                 <Input placeholder="Material Flow Reference" />
//               </Form.Item>
//             </Col>
//           </Row>

//           <Divider orientation="left">Delivery Information</Divider>

//           <Row gutter={16}>
//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="deliveryNote"
//                 label="Delivery Note"
//               >
//                 <Input placeholder="Enter delivery note number" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="carrier"
//                 label="Carrier"
//               >
//                 <Input placeholder="Enter carrier name" />
//               </Form.Item>
//             </Col>

//             <Col xs={24} md={8}>
//               <Form.Item
//                 name="transporter"
//                 label="Transporter"
//               >
//                 <Input placeholder="Enter transporter name" />
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

//           <Divider />

//           <Card size="small" style={{ backgroundColor: '#e6f7ff', marginBottom: '16px' }}>
//             <Row gutter={16}>
//               <Col span={12}>
//                 <Text strong>Total Value:</Text>
//                 <Text style={{ marginLeft: '8px', fontSize: '16px', color: '#1890ff' }}>
//                   {(
//                     (form.getFieldValue('quantity') || 0) * 
//                     (selectedItem?.averageCost || selectedItem?.standardPrice || 0)
//                   ).toLocaleString()} XAF
//                 </Text>
//               </Col>
//               <Col span={12}>
//                 <Text strong>Stock After Transaction:</Text>
//                 <Text style={{ marginLeft: '8px', fontSize: '16px' }}>
//                   {selectedItem ? 
//                     Math.max(0, selectedItem.stockQuantity - (form.getFieldValue('quantity') || 0)) : 
//                     0
//                   }
//                 </Text>
//               </Col>
//             </Row>
//           </Card>

//           <Form.Item>
//             <Space>
//               <Button
//                 type="primary"
//                 htmlType="submit"
//                 loading={loading}
//                 icon={<SaveOutlined />}
//                 size="large"
//                 disabled={selectedItem && form.getFieldValue('quantity') > selectedItem.stockQuantity}
//               >
//                 Record Outbound
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

// export default OutboundTransaction;