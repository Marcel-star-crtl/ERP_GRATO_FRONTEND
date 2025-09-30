import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Card, 
  Space, 
  Tag,
  message
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { 
  fetchTowers, 
  addTower, 
  editTower, 
  removeTower 
} from '../../features/towers/towerSlice';

const { Option } = Select;

const TowerAdminPage = () => {
  const dispatch = useDispatch();
  const { towers, loading } = useSelector((state) => state.towers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTower, setCurrentTower] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchTowers());
  }, [dispatch]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentTower(null);
    setIsModalVisible(true);
  };

  const handleEdit = (tower) => {
    form.setFieldsValue(tower);
    setCurrentTower(tower);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Tower',
      content: 'Are you sure you want to delete this tower?',
      onOk: () => dispatch(removeTower(id)),
    });
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          _id: values._id.toUpperCase()
        };

        if (currentTower) {
          dispatch(editTower({ id: currentTower._id, ...formattedValues }));
        } else {
          dispatch(addTower(formattedValues));
        }
        setIsModalVisible(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const columns = [
    {
      title: 'Tower ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'active' ? 'green' : 
                   status === 'maintenance' ? 'orange' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Generators',
      dataIndex: 'generators',
      key: 'generators',
      render: (generators) => generators.length,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => handleEdit(record)}
          />
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={() => handleDelete(record._id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="tower-admin-page">
      <Card
        title="Tower Management"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Add Tower
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={towers}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentTower ? 'Edit Tower' : 'Add Tower'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="_id"
            label="Tower ID"
            rules={[
              { required: true, message: 'Please input tower ID!' },
              { 
                pattern: /^TOWER_[A-Z]{3}_\d{3}$/,
                message: 'Format must be TOWER_XXX_000 (e.g. TOWER_ABJ_001)'
              }
            ]}
          >
            <Input 
              placeholder="TOWER_ABJ_001" 
              disabled={!!currentTower}
            />
          </Form.Item>

          <Form.Item
            name="name"
            label="Tower Name"
            rules={[
              { required: true, message: 'Please input tower name!' },
              { min: 3, message: 'Minimum 3 characters' },
              { max: 100, message: 'Maximum 100 characters' }
            ]}
          >
            <Input placeholder="Main Tower" />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            rules={[
              { required: true, message: 'Please input address!' },
              { min: 5, message: 'Minimum 5 characters' },
              { max: 200, message: 'Maximum 200 characters' }
            ]}
          >
            <Input.TextArea placeholder="123 Main St, City" rows={3} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status!' }]}
          >
            <Select placeholder="Select status">
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="maintenance">Maintenance</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TowerAdminPage;