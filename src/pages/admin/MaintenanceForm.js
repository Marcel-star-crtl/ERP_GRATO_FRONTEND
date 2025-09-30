// technician-app/pages/MaintenanceForm.js
import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Select, 
  Button, 
  Card, 
  Space, 
  Upload, 
  message,
  InputNumber,
  Steps,
  Divider,
  Typography
} from 'antd';
import { 
  UploadOutlined, 
  PlusOutlined, 
  MinusOutlined,
  ScanOutlined,
  CheckOutlined 
} from '@ant-design/icons';
import GeneratorScanner from '../components/GeneratorScanner';
// import './MaintenanceForm.css';

const { Step } = Steps;
const { Title } = Typography;
const { TextArea } = Input;

const MaintenanceForm = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState([]);
  const [parts, setParts] = useState([{ name: '', quantity: 1 }]);

  const steps = [
    'Generator Info',
    'Maintenance Details',
    'Review & Submit'
  ];

  const handleScanComplete = (data) => {
    form.setFieldsValue({
      generator_id: data.id,
      tower_id: data.towerId
    });
    setScanning(false);
    setCurrentStep(1);
  };

  const nextStep = () => setCurrentStep(currentStep + 1);
  const prevStep = () => setCurrentStep(currentStep - 1);

  const onFinish = (values) => {
    // Submit logic here
    message.success('Maintenance report submitted!');
  };

  // ... (keep your existing part management functions)

  return (
    <div className="maintenance-form">
      <Steps current={currentStep} responsive={false}>
        {steps.map((item) => (
          <Step key={item} title={item} />
        ))}
      </Steps>

      <Divider />

      {currentStep === 0 && (
        <Card>
          <Title level={4} style={{ marginBottom: 24 }}>Generator Information</Title>
          <Button 
            type="primary" 
            icon={<ScanOutlined />}
            onClick={() => setScanning(true)}
            block
            size="large"
          >
            Scan Generator QR Code
          </Button>
          <Divider plain>OR</Divider>
          <Form form={form} layout="vertical">
            <Form.Item
              name="generator_id"
              label="Generator ID"
              rules={[{ required: true }]}
            >
              <Input placeholder="GEN_ABJ_001" />
            </Form.Item>
            <Form.Item
              name="tower_id"
              label="Tower ID"
              rules={[{ required: true }]}
            >
              <Input placeholder="TOWER_ABJ_001" />
            </Form.Item>
          </Form>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <Title level={4} style={{ marginBottom: 24 }}>Maintenance Details</Title>
          {/* Your existing form fields here */}
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <Title level={4} style={{ marginBottom: 24 }}>Review Information</Title>
          {/* Review summary here */}
        </Card>
      )}

      <div className="form-actions">
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={prevStep}>
            Back
          </Button>
        )}
        {currentStep < steps.length - 1 && (
          <Button type="primary" onClick={nextStep}>
            Next
          </Button>
        )}
        {currentStep === steps.length - 1 && (
          <Button 
            type="primary" 
            icon={<CheckOutlined />}
            onClick={() => form.submit()}
          >
            Submit Report
          </Button>
        )}
      </div>

      {/* QR Scanner Modal */}
      <GeneratorScanner
        visible={scanning}
        onComplete={handleScanComplete}
        onCancel={() => setScanning(false)}
      />
    </div>
  );
};

export default MaintenanceForm;