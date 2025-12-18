import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  Typography,
  Alert,
  Space,
  Steps,
  Progress,
  message,
  Divider,
  Tag
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import unifiedSupplierAPI from '../../services/unifiedSupplierAPI';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const SupplierBulkImport = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploadedData, setUploadedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Company Name': 'ABC Technologies Ltd',
        'Contact Name': 'John Doe',
        'Email': 'john@abc.com',
        'Phone': '+237677123456',
        'Supplier Type': 'IT Services',
        'Business Type': 'Limited Company',
        'Business Reg. Number': 'RC/DLA/2020/A/123',
        'Tax ID': 'M012345678901',
        'Street Address': '123 Main Street',
        'City': 'Douala',
        'State': 'Littoral',
        'Country': 'Cameroon',
        'Postal Code': '12345',
        'Bank Name': 'ABC Bank',
        'Account Number': '1234567890',
        'Account Name': 'ABC Technologies Ltd'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    XLSX.writeFile(wb, 'supplier_import_template.xlsx');
    message.success('Template downloaded successfully');
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Transform data to match API format
        const suppliers = jsonData.map(row => ({
          companyName: row['Company Name'],
          contactName: row['Contact Name'],
          email: row['Email'],
          phoneNumber: row['Phone'],
          supplierType: row['Supplier Type'] || 'General',
          businessType: row['Business Type'],
          businessRegistrationNumber: row['Business Reg. Number'],
          taxIdNumber: row['Tax ID'],
          address: {
            street: row['Street Address'],
            city: row['City'],
            state: row['State'],
            country: row['Country'] || 'Cameroon',
            postalCode: row['Postal Code']
          },
          bankDetails: {
            bankName: row['Bank Name'],
            accountNumber: row['Account Number'],
            accountName: row['Account Name']
          }
        }));

        setUploadedData(suppliers);
        validateData(suppliers);
        setCurrentStep(1);
      } catch (error) {
        message.error('Failed to parse file. Please check the format.');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; // Prevent auto upload
  };

  const validateData = (data) => {
    const results = data.map((supplier, index) => {
      const errors = [];
      if (!supplier.companyName) errors.push('Company name required');
      if (!supplier.email || !/\S+@\S+\.\S+/.test(supplier.email)) {
        errors.push('Valid email required');
      }
      if (!supplier.phoneNumber) errors.push('Phone number required');
      if (!supplier.contactName) errors.push('Contact name required');

      return {
        row: index + 1,
        supplier,
        valid: errors.length === 0,
        errors
      };
    });

    setValidationResults(results);
  };

  const handleImport = async () => {
    const validSuppliers = validationResults
      .filter(r => r.valid)
      .map(r => r.supplier);

    if (validSuppliers.length === 0) {
      message.error('No valid suppliers to import');
      return;
    }

    try {
      setImporting(true);
      const response = await unifiedSupplierAPI.bulkImport(validSuppliers);
      
      if (response.success) {
        setImportResults(response.data);
        setCurrentStep(2);
        message.success(`Successfully imported ${response.data.successful.length} suppliers`);
      }
    } catch (error) {
      message.error('Import failed: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  const validationColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 60
    },
    {
      title: 'Company Name',
      dataIndex: ['supplier', 'companyName'],
      key: 'companyName'
    },
    {
      title: 'Email',
      dataIndex: ['supplier', 'email'],
      key: 'email'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        record.valid ? (
          <Tag color="success" icon={<CheckCircleOutlined />}>Valid</Tag>
        ) : (
          <Tag color="error" icon={<CloseCircleOutlined />}>Invalid</Tag>
        )
      )
    },
    {
      title: 'Errors',
      dataIndex: 'errors',
      key: 'errors',
      render: (errors) => (
        errors.length > 0 ? (
          <Space direction="vertical" size="small">
            {errors.map((err, i) => (
              <Text key={i} type="danger" style={{ fontSize: '12px' }}>{err}</Text>
            ))}
          </Space>
        ) : <Text type="success">No errors</Text>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>Bulk Supplier Import</Title>
        <Text type="secondary">
          Import multiple suppliers at once using an Excel spreadsheet
        </Text>

        <Divider />

        <Steps current={currentStep} style={{ marginBottom: '24px' }}>
          <Steps.Step title="Upload" description="Upload Excel file" />
          <Steps.Step title="Validate" description="Review data" />
          <Steps.Step title="Import" description="Import suppliers" />
        </Steps>

        {currentStep === 0 && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Download Template First"
              description="Download the Excel template, fill in supplier data, then upload it here."
              type="info"
              showIcon
              action={
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={downloadTemplate}
                >
                  Download Template
                </Button>
              }
            />

            <Dragger
              accept=".xlsx,.xls"
              beforeUpload={handleFileUpload}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Click or drag Excel file to upload</p>
              <p className="ant-upload-hint">
                Support for .xlsx and .xls files
              </p>
            </Dragger>
          </Space>
        )}

        {currentStep === 1 && validationResults && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message={`${validationResults.filter(r => r.valid).length} of ${validationResults.length} suppliers are valid`}
              type={validationResults.every(r => r.valid) ? 'success' : 'warning'}
              showIcon
            />

            <Table
              columns={validationColumns}
              dataSource={validationResults}
              rowKey="row"
              pagination={{ pageSize: 10 }}
            />

            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                type="primary"
                onClick={handleImport}
                loading={importing}
                disabled={!validationResults.some(r => r.valid)}
              >
                Import Valid Suppliers
              </Button>
            </Space>
          </Space>
        )}

        {currentStep === 2 && importResults && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Alert
              message="Import Complete"
              description={`Successfully imported ${importResults.successful.length} suppliers. ${importResults.failed.length} failed.`}
              type={importResults.failed.length === 0 ? 'success' : 'warning'}
              showIcon
            />

            {importResults.successful.length > 0 && (
              <Card title="Successfully Imported" size="small">
                <Table
                  dataSource={importResults.successful}
                  columns={[
                    { title: 'Company', dataIndex: 'companyName', key: 'company' },
                    { title: 'Email', dataIndex: 'email', key: 'email' },
                    { title: 'Password', dataIndex: 'tempPassword', key: 'password' }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {importResults.failed.length > 0 && (
              <Card title="Failed Imports" size="small">
                <Table
                  dataSource={importResults.failed}
                  columns={[
                    { title: 'Company', dataIndex: 'companyName', key: 'company' },
                    { title: 'Email', dataIndex: 'email', key: 'email' },
                    { title: 'Error', dataIndex: 'error', key: 'error' }
                  ]}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            <Button type="primary" onClick={() => {
              setCurrentStep(0);
              setUploadedData([]);
              setValidationResults(null);
              setImportResults(null);
            }}>
              Import More Suppliers
            </Button>
          </Space>
        )}
      </Card>
    </div>
  );
};

export default SupplierBulkImport;