import React from 'react';
import { 
  Form, 
  Input, 
  InputNumber, 
  Select, 
  DatePicker, 
  Upload, 
  Button, 
  Typography,
  Card,
  Row,
  Col
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';

const { Option } = Select;
const { Title } = Typography;

const PCRequestForm = ({ editMode }) => {
  const [form] = Form.useForm();

  const categories = [
    'Office Supplies', 
    'Travel Expenses', 
    'Client Entertainment',
    'Utilities'
  ];

  return (
    <Card>
      <Title level={4}>
        {editMode ? 'Edit Request' : 'New Petty Cash Request'}
      </Title>
      
      <Form form={form} layout="vertical">
        <Form.Item 
          name="purpose" 
          label="Purpose"
          rules={[{ required: true }]}
        >
          <Input placeholder="Brief purpose description" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="amount" 
              label="Amount (AED)"
              rules={[{ required: true }]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                precision={2} 
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="category" 
              label="Category"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select category">
                {categories.map(cat => (
                  <Option key={cat} value={cat}>{cat}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="receipt" label="Receipt (if available)">
          <Upload beforeUpload={() => false}>
            <Button icon={<UploadOutlined />}>Attach File</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {editMode ? 'Update Request' : 'Submit Request'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default PCRequestForm;