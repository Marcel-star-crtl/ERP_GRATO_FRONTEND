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
  DatePicker,
  InputNumber,
  Row,
  Col, 
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import { 
  fetchGenerators, 
  addGenerator, 
  editGenerator, 
  removeGenerator 
} from '../../features/generators/generatorSlice';
import { fetchTowers } from '../../features/towers/towerSlice';
import moment from 'moment';

const { Option } = Select;

const GeneratorAdminPage = () => {
  const dispatch = useDispatch();
  const { generators, loading } = useSelector((state) => state.generators);
  const { towers } = useSelector((state) => state.towers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentGenerator, setCurrentGenerator] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchGenerators());
    dispatch(fetchTowers());
  }, [dispatch]);

  const handleCreate = () => {
    form.resetFields();
    setCurrentGenerator(null);
    setIsModalVisible(true);
  };

  const handleEdit = (generator) => {
    form.setFieldsValue({
      ...generator,
      installation_date: moment(generator.installation_date)
    });
    setCurrentGenerator(generator);
    setIsModalVisible(true);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'Delete Generator',
      content: 'Are you sure you want to delete this generator?',
      onOk: () => dispatch(removeGenerator(id)),
    });
  };

  const handleSubmit = () => {
    form.validateFields()
      .then(values => {
        const formattedValues = {
          ...values,
          _id: values._id.toUpperCase(),
          installation_date: values.installation_date.toISOString(),
          specifications: {
            fuel_capacity: values.fuel_capacity,
            power_rating: values.power_rating,
            fuel_type: values.fuel_type
          }
        };

        if (currentGenerator) {
          dispatch(editGenerator({ id: currentGenerator._id, ...formattedValues }));
        } else {
          dispatch(addGenerator(formattedValues));
        }
        setIsModalVisible(false);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  const columns = [
    {
      title: 'Generator ID',
      dataIndex: '_id',
      key: '_id',
      render: (id) => <Tag color="blue">{id}</Tag>,
    },
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: 'Tower',
      dataIndex: 'tower_id',
      key: 'tower',
      render: (id) => {
        const tower = towers.find(t => t._id === id);
        return tower ? tower.name : id;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = status === 'running' ? 'green' : 
                   status === 'standby' ? 'blue' : 
                   status === 'maintenance' ? 'orange' : 'red';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: 'Fuel Level',
      dataIndex: 'current_stats',
      key: 'fuel',
      render: (stats) => `${stats?.fuel || 0}%`,
    },
    {
      title: 'Power Output',
      dataIndex: 'current_stats',
      key: 'power',
      render: (stats) => `${stats?.power || 0} kW`,
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
    <div className="generator-admin-page">
      <Card
        title="Generator Management"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleCreate}
          >
            Add Generator
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={generators}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title={currentGenerator ? 'Edit Generator' : 'Add Generator'}
        visible={isModalVisible}
        onOk={handleSubmit}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="_id"
                label="Generator ID"
                rules={[
                  { required: true, message: 'Please input generator ID!' },
                  { 
                    pattern: /^GEN_[A-Z]{3}_\d{3}$/,
                    message: 'Format must be GEN_XXX_000 (e.g. GEN_ABJ_001)'
                  }
                ]}
              >
                <Input 
                  placeholder="GEN_ABJ_001" 
                  disabled={!!currentGenerator}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tower_id"
                label="Tower"
                rules={[{ required: true, message: 'Please select tower!' }]}
              >
                <Select placeholder="Select tower" showSearch>
                  {towers.map(tower => (
                    <Option key={tower._id} value={tower._id}>
                      {tower.name} ({tower._id})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="model"
                label="Model"
                rules={[{ required: true, message: 'Please select model!' }]}
              >
                <Select placeholder="Select model">
                  <Option value="PowerMax 3000">PowerMax 3000</Option>
                  <Option value="EcoGen 2500">EcoGen 2500</Option>
                  <Option value="DieselPro 4000">DieselPro 4000</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status!' }]}
              >
                <Select placeholder="Select status">
                  <Option value="running">Running</Option>
                  <Option value="standby">Standby</Option>
                  <Option value="fault">Fault</Option>
                  <Option value="maintenance">Maintenance</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Specifications</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="fuel_capacity"
                label="Fuel Capacity (L)"
                rules={[
                  { required: true, message: 'Please input fuel capacity!' },
                  { type: 'number', min: 50, max: 1000 }
                ]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="power_rating"
                label="Power Rating (kW)"
                rules={[
                  { required: true, message: 'Please input power rating!' },
                  { type: 'number', min: 5, max: 100 }
                ]}
              >
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="fuel_type"
                label="Fuel Type"
                rules={[{ required: true, message: 'Please select fuel type!' }]}
              >
                <Select placeholder="Select fuel type">
                  <Option value="diesel">Diesel</Option>
                  <Option value="gasoline">Gasoline</Option>
                  <Option value="hybrid">Hybrid</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="installation_date"
            label="Installation Date"
            rules={[{ required: true, message: 'Please select installation date!' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              disabledDate={current => current > moment().endOf('day')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GeneratorAdminPage;