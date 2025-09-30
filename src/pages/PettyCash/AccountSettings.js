import React, { useEffect, useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  Typography, 
  Row, 
  Col, 
  message, 
  Spin, 
  Upload, 
  Progress,
  List,
  Card,
  Select,
  InputNumber
} from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchCompanySettings, 
  updateCompanySettings 
} from '../../features/pettyCash/pettyCashSlice';

const { Title } = Typography;
const { Option } = Select;

const AccountSettings = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { 
    companySettings, 
    loading, 
    updating,
    error 
  } = useSelector((state) => state.pettyCash);
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    dispatch(fetchCompanySettings());
  }, [dispatch]);

  useEffect(() => {
    if (companySettings) {
      form.setFieldsValue({
        name: companySettings.name,
        address: companySettings.address,
        city: companySettings.city,
        telephone: companySettings.telephone,
        currency: companySettings.currency || 'XAF',
        openingBalance: companySettings.openingBalance || 0
      });

      // Initialize existing documents if any
      if (companySettings.documents) {
        setFileList(companySettings.documents.map(doc => ({
          uid: doc._id || doc.path,
          name: doc.filename,
          status: 'done',
          url: doc.path,
          size: doc.size,
          type: doc.mimetype
        })));
      }
    }
  }, [companySettings, form]);

  useEffect(() => {
    if (error) {
      console.error('Company settings error:', error);
      
      // Check if it's a 404 error (company not found)
      if (error.includes('not found') || error.includes('404')) {
        message.warning('Company settings not found. Please contact your administrator to set up company information.');
      } else {
        message.error(`Error: ${error}`);
      }
    }
  }, [error]);

  const beforeUpload = (file) => {
    const isAllowedType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type);
    if (!isAllowedType) {
      message.error('You can only upload JPG/PNG/PDF files!');
      return Upload.LIST_IGNORE;
    }
    
    const isLt5MB = file.size / 1024 / 1024 < 5;
    if (!isLt5MB) {
      message.error('File must be smaller than 5MB!');
      return Upload.LIST_IGNORE;
    }
    
    return true;
  };

  const handleUploadChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const handleRemove = (file) => {
    setFileList(prevList => prevList.filter(item => item.uid !== file.uid));
    return true;
  };

  const handleSave = async (values) => {
    try {
      // If no company settings exist, we might need to create new ones
      if (!companySettings?._id) {
        message.error('Cannot save settings - company information not found. Please contact administrator.');
        return;
      }

      const formData = new FormData();
      
      // Append all form data including opening balance
      Object.keys(values).forEach(key => {
        if (values[key] !== undefined && values[key] !== null) {
          formData.append(key, values[key]);
        }
      });
      
      // Append new documents
      fileList.forEach(file => {
        if (file.originFileObj) {
          formData.append('documents', file.originFileObj);
        }
      });

      await dispatch(updateCompanySettings({
        companyId: companySettings._id,
        data: formData
      })).unwrap();

      message.success('Settings saved successfully');
    } catch (err) {
      console.error('Save error:', err);
      message.error(err.message || 'Failed to save settings');
    }
  };

  // Show loading spinner while fetching initial data
  if (loading && !companySettings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Show error state if company settings not found
  if (error && !companySettings && !loading) {
    return (
      <Row justify="center" style={{ marginTop: 24 }}>
        <Col xs={24} sm={20} md={16} lg={12}>
          <Card>
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <Title level={4} type="warning">Company Settings Not Found</Title>
              <div style={{ marginBottom: 16, color: 'rgba(0,0,0,0.65)' }}>
                No company information has been set up yet. Please contact your administrator 
                to initialize the company settings.
              </div>
              <Button 
                type="primary" 
                onClick={() => dispatch(fetchCompanySettings())}
                loading={loading}
              >
                Retry
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    );
  }

  return (
    <Row justify="center" style={{ marginTop: 24 }}>
      <Col xs={24} sm={20} md={16} lg={12}>
        <Card>
          <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>Company Settings</Title>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
          >
            <Form.Item 
              label="Company Name" 
              name="name"
              rules={[{ required: true, message: 'Please input company name!' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item 
              label="Address" 
              name="address"
            >
              <Input />
            </Form.Item>

            <Form.Item 
              label="City" 
              name="city"
            >
              <Input />
            </Form.Item>

            <Form.Item 
              label="Telephone" 
              name="telephone"
            >
              <Input />
            </Form.Item>

            <Form.Item 
              label="Currency" 
              name="currency"
              rules={[{ required: true, message: 'Please select currency!' }]}
            >
              <Select>
                <Option value="XAF">XAF</Option>
                <Option value="USD">USD</Option>
              </Select>
            </Form.Item>

            <Form.Item 
              label="Opening Balance" 
              name="openingBalance"
              rules={[
                { required: true, message: 'Please input opening balance!' },
                { type: 'number', min: 0, message: 'Opening balance must be positive!' }
              ]}
              tooltip="This is the initial amount in the petty cash fund"
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                placeholder="Enter opening balance"
              />
            </Form.Item>

            <Form.Item label="Supporting Documents">
              <Upload
                multiple
                fileList={fileList}
                beforeUpload={beforeUpload}
                onChange={handleUploadChange}
                onRemove={handleRemove}
                accept=".pdf,.jpg,.jpeg,.png"
                listType="picture-card"
              >
                <Button icon={<UploadOutlined />}>Upload Documents</Button>
              </Upload>
              <div style={{ fontSize: 12, color: 'rgba(0, 0, 0, 0.45)', marginTop: 8 }}>
                PDF, JPG, or PNG (Max 5MB each)
              </div>
            </Form.Item>

            {updating && (
              <div style={{ marginBottom: 16 }}>
                <Progress percent={uploadProgress} status="active" />
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  <Spin size="small" /> Saving changes...
                </div>
              </div>
            )}

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block
                size="large"
                loading={updating}
                disabled={!companySettings || updating}
                icon={<UploadOutlined />}
              >
                {companySettings ? 'Save Settings' : 'Loading...'}
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {companySettings?.documents?.length > 0 && (
          <Card style={{ marginTop: 24 }}>
            <Title level={5}>Existing Documents</Title>
            <List
              size="small"
              dataSource={companySettings.documents}
              renderItem={doc => (
                <List.Item
                  actions={[
                    <Button 
                      type="text" 
                      danger 
                      icon={<DeleteOutlined />} 
                      disabled
                      onClick={() => message.info('Delete functionality would be implemented here')}
                    />
                  ]}
                >
                  <List.Item.Meta
                    title={<a href={doc.path} target="_blank" rel="noopener noreferrer">{doc.filename}</a>}
                    description={`${(doc.size / 1024).toFixed(2)} KB - ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        )}
      </Col>
    </Row>
  );
};

export default AccountSettings;









