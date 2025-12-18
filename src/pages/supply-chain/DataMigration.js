import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Steps,
  Typography,
  Space,
  Alert,
  Table,
  Progress,
  Divider,
  Row,
  Col,
  message,
  Tag,
  Collapse,
  Statistic
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  FileExcelOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import api from '../../services/api';
import * as XLSX from 'xlsx';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Dragger } = Upload;
const { Panel } = Collapse;

const DataMigration = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileData, setFileData] = useState({
    availableStock: null,
    inbound: null,
    outbound: null,
    suppliers: null
  });
  const [validationResults, setValidationResults] = useState(null);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const migrationTypes = [
    {
      key: 'availableStock',
      title: 'Available Stock',
      description: 'Import current inventory stock levels',
      requiredColumns: [
        'Material Code', 'Material Name', 'CATEGORY', 'UOM', 
        'AVAILABLE TP', 'OPENING STOCK', 'ON HAND', 'SUPPLIER'
      ]
    },
    {
      key: 'inbound',
      title: 'Inbound History',
      description: 'Import historical inbound transactions',
      requiredColumns: [
        'DATE', 'Material Code', 'Material Desc', 'UOM', 
        'INBOUND', 'UP', 'TP', 'PO No.', 'SUPPLIER', 'RECEIVED BY'
      ]
    },
    {
      key: 'outbound',
      title: 'Outbound History',
      description: 'Import historical outbound transactions',
      requiredColumns: [
        'Date', 'Material Code', 'Description', 'CATEGORY', 
        'Qty', 'SITE NAME', 'PROJECT NAME', 'Requestor'
      ]
    },
    {
      key: 'suppliers',
      title: 'Supplier Performance',
      description: 'Import supplier performance data',
      requiredColumns: [
        'Supplier Name', 'Category', 'On-Time Delivery (%)', 
        'Quality Rating (%)', 'Cost Compliance (%)', 
        'Responsiveness Rating (%)'
      ]
    }
  ];

  const downloadTemplate = (type) => {
    const templates = {
      availableStock: [
        ['Material Code', 'Material Name', 'CATEGORY', 'PROJECT', 'UOM', 'UP', 'TP', 'AVAILABLE TP', 'OPENING STOCK', 'INBOUND', 'TOTAL', 'TV IB', 'OUTBOUND', 'TV OB', 'ON HAND', 'TV AVAILABLE STOCK', 'SUPPLIER', 'COMMENT'],
        ['IT-001', 'Wireless Mouse', 'IT Accessories', '', 'Pieces', 5000, 5000, 5000, 100, 50, 150, 250000, 30, 150000, 120, 600000, 'Tech Supplies Ltd', 'Sample data']
      ],
      inbound: [
        ['DATE', 'Material Code', 'Material Desc', 'UOM', 'INITIAL QTY', 'INBOUND', 'TOTAL', 'UP', 'TP', 'PO No.', 'PROJECT', 'SUPPLIER', 'RECEIVED BY', 'Comment'],
        ['01/01/2024', 'IT-001', 'Wireless Mouse', 'Pieces', 100, 50, 150, 5000, 250000, 'PO-2024-001', 'Main Office', 'Tech Supplies Ltd', 'John Doe', 'Sample data']
      ],
      outbound: [
        ['Date', 'Material Code', 'Description', 'CATEGORY', 'Qty', 'CLUSTER', 'SITE NAME', 'IHS ID', 'Site ID', 'MFR Number', 'MFR DATE', 'PROJECT NAME', 'Requestor', 'Delivery Note', 'Carrier Name', 'Served By', 'Transporter', 'Comment'],
        ['01/01/2024', 'IT-001', 'Wireless Mouse', 'IT Accessories', 30, 'North', 'Site A', 'IHS-001', 'SITE-001', 'MFR-001', '01/01/2024', 'Project Alpha', 'Jane Smith', 'DN-001', 'Express Carrier', 'John Doe', 'Fast Transport', 'Sample data']
      ],
      suppliers: [
        ['Supplier Name', 'Category', 'On-Time Delivery (%)', 'Quality Rating (%)', 'Cost Compliance (%)', 'Responsiveness Rating (%)', 'Overall Performance Score (%)', 'Remarks'],
        ['Tech Supplies Ltd', 'IT Accessories', 95, 90, 85, 88, 89.5, 'Excellent supplier']
      ]
    };

    const ws = XLSX.utils.aoa_to_sheet(templates[type]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `${type}_template.xlsx`);
    message.success(`Template downloaded: ${type}_template.xlsx`);
  };

  const handleFileUpload = (type, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Read with defval option to handle empty cells
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          defval: '',
          raw: false 
        });

        // Clean up column names - remove quotes, whitespace, newlines
        const cleanedData = jsonData.map(row => {
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            // Remove quotes, trim whitespace, and normalize
            const cleanKey = key.replace(/^["']|["']$/g, '').trim().replace(/\n/g, '');
            cleanedRow[cleanKey] = row[key];
          });
          return cleanedRow;
        });

        setFileData(prev => ({
          ...prev,
          [type]: cleanedData
        }));

        message.success(`File uploaded: ${file.name} (${cleanedData.length} rows)`);
      } catch (error) {
        console.error('File parsing error:', error);
        message.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    return false; 
  };

  const validateData = async () => {
    try {
      setUploading(true);
      
      const results = {};
      
      for (const [key, data] of Object.entries(fileData)) {
        if (data && data.length > 0) {
          const typeConfig = migrationTypes.find(t => t.key === key);
          
          // Check for required columns
          const firstRow = data[0];
          const availableColumns = Object.keys(firstRow);
          
          // More flexible column matching - check for partial matches
          const missingColumns = typeConfig.requiredColumns.filter(requiredCol => {
            // Check for exact match or close match (case-insensitive, trimmed)
            const normalizedRequired = requiredCol.toLowerCase().trim();
            return !availableColumns.some(availCol => 
              availCol.toLowerCase().trim() === normalizedRequired
            );
          });

          // Log for debugging
          console.log(`[${key}] Available columns:`, availableColumns);
          console.log(`[${key}] Required columns:`, typeConfig.requiredColumns);
          console.log(`[${key}] Missing columns:`, missingColumns);

          results[key] = {
            totalRows: data.length,
            validRows: missingColumns.length === 0 ? data.length : 0,
            invalidRows: missingColumns.length > 0 ? data.length : 0,
            missingColumns,
            errors: [],
            warnings: []
          };

          // Validate data
          if (missingColumns.length === 0) {
            data.forEach((row, index) => {
              // Add validation logic here
              if (!row['Material Code'] && !row['Supplier Name']) {
                results[key].errors.push(`Row ${index + 2}: Missing required identifier`);
                results[key].invalidRows++;
                results[key].validRows--;
              }
            });
          }
        }
      }

      setValidationResults(results);
      setCurrentStep(1);
    } catch (error) {
      console.error('Validation error:', error);
      message.error('Validation failed');
    } finally {
      setUploading(false);
    }
  };

  const startImport = async () => {
    try {
      setUploading(true);
      setCurrentStep(2);
      setImportProgress(0);

      const results = {
        availableStock: { success: 0, failed: 0, errors: [] },
        inbound: { success: 0, failed: 0, errors: [] },
        outbound: { success: 0, failed: 0, errors: [] },
        suppliers: { success: 0, failed: 0, errors: [] }
      };

      let totalProgress = 0;
      const totalSteps = Object.values(fileData).filter(d => d).length;

      // Import Available Stock
      if (fileData.availableStock) {
        try {
          const response = await api.post('/api/migration/available-stock', {
            data: fileData.availableStock
          });
          results.availableStock.success = response.data.data.imported;
          results.availableStock.failed = response.data.data.failed;
          results.availableStock.errors = response.data.data.errors || [];
        } catch (error) {
          results.availableStock.errors.push(error.response?.data?.message || error.message);
        }
        totalProgress++;
        setImportProgress((totalProgress / totalSteps) * 100);
      }

      // Import Inbound History
      if (fileData.inbound) {
        try {
          const response = await api.post('/api/migration/inbound', {
            data: fileData.inbound
          });
          results.inbound.success = response.data.data.imported;
          results.inbound.failed = response.data.data.failed;
          results.inbound.errors = response.data.data.errors || [];
        } catch (error) {
          results.inbound.errors.push(error.response?.data?.message || error.message);
        }
        totalProgress++;
        setImportProgress((totalProgress / totalSteps) * 100);
      }

      // Import Outbound History
      if (fileData.outbound) {
        try {
          const response = await api.post('/api/migration/outbound', {
            data: fileData.outbound
          });
          results.outbound.success = response.data.data.imported;
          results.outbound.failed = response.data.data.failed;
          results.outbound.errors = response.data.data.errors || [];
        } catch (error) {
          results.outbound.errors.push(error.response?.data?.message || error.message);
        }
        totalProgress++;
        setImportProgress((totalProgress / totalSteps) * 100);
      }

      // Import Suppliers
      if (fileData.suppliers) {
        try {
          const response = await api.post('/api/migration/suppliers', {
            data: fileData.suppliers
          });
          results.suppliers.success = response.data.data.imported;
          results.suppliers.failed = response.data.data.failed;
          results.suppliers.errors = response.data.data.errors || [];
        } catch (error) {
          results.suppliers.errors.push(error.response?.data?.message || error.message);
        }
        totalProgress++;
        setImportProgress((totalProgress / totalSteps) * 100);
      }

      setImportResults(results);
      setCurrentStep(3);
      message.success('Data migration completed');
    } catch (error) {
      console.error('Import error:', error);
      message.error('Import failed');
    } finally {
      setUploading(false);
    }
  };

  const validationColumns = [
    {
      title: 'Data Type',
      dataIndex: 'type',
      key: 'type'
    },
    {
      title: 'Total Rows',
      dataIndex: 'totalRows',
      key: 'totalRows',
      align: 'center'
    },
    {
      title: 'Valid Rows',
      dataIndex: 'validRows',
      key: 'validRows',
      align: 'center',
      render: (count) => (
        <Tag color="green" icon={<CheckCircleOutlined />}>
          {count}
        </Tag>
      )
    },
    {
      title: 'Invalid Rows',
      dataIndex: 'invalidRows',
      key: 'invalidRows',
      align: 'center',
      render: (count) => (
        <Tag color="red" icon={<CloseCircleOutlined />}>
          {count}
        </Tag>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        record.invalidRows === 0 ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Ready to Import
          </Tag>
        ) : (
          <Tag color="red" icon={<WarningOutlined />}>
            Has Errors
          </Tag>
        )
      )
    }
  ];

  const getValidationTableData = () => {
    if (!validationResults) return [];
    
    return Object.entries(validationResults).map(([key, result]) => ({
      key,
      type: migrationTypes.find(t => t.key === key)?.title,
      ...result
    }));
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <UploadOutlined /> Data Migration Tool
        </Title>
        <Paragraph>
          Import historical data from Excel spreadsheets. Download templates, fill them with your data, 
          and upload to migrate to the new system.
        </Paragraph>

        <Alert
          message="Important: Data Migration Guidelines"
          description={
            <ul>
              <li>Download templates before starting the migration</li>
              <li>Ensure all required columns are present</li>
              <li>Use the exact column names as shown in templates</li>
              <li>Dates should be in DD/MM/YYYY format</li>
              <li>Validate data before importing</li>
              <li>Create a backup before running migration</li>
            </ul>
          }
          type="warning"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        <Steps current={currentStep} style={{ marginBottom: '32px' }}>
          <Step title="Upload Files" icon={<UploadOutlined />} />
          <Step title="Validate Data" icon={<CheckCircleOutlined />} />
          <Step title="Import" icon={<LoadingOutlined />} />
          <Step title="Complete" icon={<CheckCircleOutlined />} />
        </Steps>

        <Divider />

        {/* Step 0: Upload Files */}
        {currentStep === 0 && (
          <>
            <Title level={4}>Step 1: Download Templates & Upload Data</Title>
            
            {migrationTypes.map(type => (
              <Card 
                key={type.key} 
                size="small" 
                style={{ marginBottom: '16px' }}
                title={
                  <Space>
                    <FileExcelOutlined />
                    {type.title}
                  </Space>
                }
              >
                <Row gutter={16} align="middle">
                  <Col flex="auto">
                    <Paragraph style={{ margin: 0 }}>
                      {type.description}
                    </Paragraph>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      Required columns: {type.requiredColumns.join(', ')}
                    </Text>
                  </Col>
                  <Col>
                    <Space>
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={() => downloadTemplate(type.key)}
                      >
                        Download Template
                      </Button>
                      <Upload
                        accept=".xlsx,.xls"
                        showUploadList={false}
                        beforeUpload={(file) => handleFileUpload(type.key, file)}
                      >
                        <Button
                          type={fileData[type.key] ? 'primary' : 'default'}
                          icon={<UploadOutlined />}
                        >
                          {fileData[type.key] 
                            ? `Uploaded (${fileData[type.key].length} rows)` 
                            : 'Upload File'
                          }
                        </Button>
                      </Upload>
                    </Space>
                  </Col>
                </Row>
              </Card>
            ))}

            <Divider />

            <Space>
              <Button
                type="primary"
                size="large"
                onClick={validateData}
                disabled={!Object.values(fileData).some(d => d)}
                loading={uploading}
              >
                Validate Data
              </Button>
              <Text type="secondary">
                {Object.values(fileData).filter(d => d).length} file(s) uploaded
              </Text>
            </Space>
          </>
        )}

        {/* Step 1: Validation Results */}
        {currentStep === 1 && validationResults && (
          <>
            <Title level={4}>Step 2: Validation Results</Title>
            
            <Table
              columns={validationColumns}
              dataSource={getValidationTableData()}
              pagination={false}
              style={{ marginBottom: '24px' }}
            />

            <Collapse>
              {Object.entries(validationResults).map(([key, result]) => (
                result.errors.length > 0 || result.warnings.length > 0 || result.missingColumns.length > 0 ? (
                  <Panel 
                    header={
                      <Space>
                        {migrationTypes.find(t => t.key === key)?.title}
                        {result.errors.length > 0 && (
                          <Tag color="red">{result.errors.length} errors</Tag>
                        )}
                        {result.warnings.length > 0 && (
                          <Tag color="orange">{result.warnings.length} warnings</Tag>
                        )}
                      </Space>
                    } 
                    key={key}
                  >
                    {result.missingColumns.length > 0 && (
                      <Alert
                        message="Missing Columns"
                        description={`Required columns not found: ${result.missingColumns.join(', ')}`}
                        type="error"
                        showIcon
                        style={{ marginBottom: '16px' }}
                      />
                    )}
                    
                    {result.errors.length > 0 && (
                      <>
                        <Title level={5}>Errors:</Title>
                        <ul>
                          {result.errors.map((error, index) => (
                            <li key={index}><Text type="danger">{error}</Text></li>
                          ))}
                        </ul>
                      </>
                    )}
                    
                    {result.warnings.length > 0 && (
                      <>
                        <Title level={5}>Warnings:</Title>
                        <ul>
                          {result.warnings.map((warning, index) => (
                            <li key={index}><Text type="warning">{warning}</Text></li>
                          ))}
                        </ul>
                      </>
                    )}
                  </Panel>
                ) : null
              ))}
            </Collapse>

            <Divider />

            <Space>
              <Button onClick={() => setCurrentStep(0)}>
                Back
              </Button>
              <Button
                type="primary"
                size="large"
                onClick={startImport}
                disabled={Object.values(validationResults).some(r => r.invalidRows > 0)}
                loading={uploading}
              >
                Start Import
              </Button>
            </Space>
          </>
        )}

        {/* Step 2: Import Progress */}
        {currentStep === 2 && (
          <>
            <Title level={4}>Step 3: Importing Data</Title>
            
            <Card style={{ marginBottom: '24px' }}>
              <Progress
                percent={Math.round(importProgress)}
                status="active"
                strokeColor={{
                  '0%': '#108ee9',
                  '100%': '#87d068',
                }}
              />
              <Text style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>
                Importing data... Please wait.
              </Text>
            </Card>
          </>
        )}

        {/* Step 3: Import Complete */}
        {currentStep === 3 && importResults && (
          <>
            <Title level={4}>Step 4: Import Complete</Title>
            
            <Alert
              message="Data Migration Completed"
              description="Your data has been successfully migrated to the new system."
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
              style={{ marginBottom: '24px' }}
            />

            <Row gutter={[16, 16]}>
              {Object.entries(importResults).map(([key, result]) => (
                result.success > 0 || result.failed > 0 ? (
                  <Col xs={24} md={12} key={key}>
                    <Card size="small">
                      <Title level={5}>
                        {migrationTypes.find(t => t.key === key)?.title}
                      </Title>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Statistic
                            title="Successful"
                            value={result.success}
                            valueStyle={{ color: '#52c41a' }}
                            prefix={<CheckCircleOutlined />}
                          />
                        </Col>
                        <Col span={12}>
                          <Statistic
                            title="Failed"
                            value={result.failed}
                            valueStyle={{ color: '#f5222d' }}
                            prefix={<CloseCircleOutlined />}
                          />
                        </Col>
                      </Row>
                      {result.errors.length > 0 && (
                        <Alert
                          message={`${result.errors.length} errors occurred`}
                          description={result.errors.slice(0, 3).join('; ')}
                          type="error"
                          showIcon
                          style={{ marginTop: '16px' }}
                        />
                      )}
                    </Card>
                  </Col>
                ) : null
              ))}
            </Row>

            <Divider />

            <Space>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  setCurrentStep(0);
                  setFileData({
                    availableStock: null,
                    inbound: null,
                    outbound: null,
                    suppliers: null
                  });
                  setValidationResults(null);
                  setImportResults(null);
                  setImportProgress(0);
                }}
              >
                Start New Migration
              </Button>
              <Button
                size="large"
                onClick={() => window.location.href = '/supply-chain/inventory'}
              >
                Go to Inventory
              </Button>
            </Space>
          </>
        )}
      </Card>
    </div>
  );
};

export default DataMigration;











// import React, { useState } from 'react';
// import {
//   Card,
//   Upload,
//   Button,
//   Steps,
//   Typography,
//   Space,
//   Alert,
//   Table,
//   Progress,
//   Divider,
//   Row,
//   Col,
//   message,
//   Tag,
//   Collapse,
//   Statistic
// } from 'antd';
// import {
//   UploadOutlined,
//   DownloadOutlined,
//   CheckCircleOutlined,
//   CloseCircleOutlined,
//   LoadingOutlined,
//   FileExcelOutlined,
//   WarningOutlined,
// } from '@ant-design/icons';
// import api from '../../services/api';
// import * as XLSX from 'xlsx';

// const { Title, Text, Paragraph } = Typography;
// const { Step } = Steps;
// const { Dragger } = Upload;
// const { Panel } = Collapse;

// const DataMigration = () => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [uploading, setUploading] = useState(false);
//   const [fileData, setFileData] = useState({
//     availableStock: null,
//     inbound: null,
//     outbound: null,
//     suppliers: null
//   });
//   const [validationResults, setValidationResults] = useState(null);
//   const [importProgress, setImportProgress] = useState(0);
//   const [importResults, setImportResults] = useState(null);

//   const migrationTypes = [
//     {
//       key: 'availableStock',
//       title: 'Available Stock',
//       description: 'Import current inventory stock levels',
//       requiredColumns: [
//         'Material Code', 'Material Name', 'CATEGORY', 'UOM', 
//         'AVAILABLE TP', 'OPENING STOCK', 'ON HAND', 'SUPPLIER'
//       ]
//     },
//     {
//       key: 'inbound',
//       title: 'Inbound History',
//       description: 'Import historical inbound transactions',
//       requiredColumns: [
//         'DATE', 'Material Code', 'Material Desc', 'UOM', 
//         'INBOUND', 'UP', 'TP', 'PO No.', 'SUPPLIER', 'RECEIVED BY'
//       ]
//     },
//     {
//       key: 'outbound',
//       title: 'Outbound History',
//       description: 'Import historical outbound transactions',
//       requiredColumns: [
//         'Date', 'Material Code', 'Description', 'CATEGORY', 
//         'Qty', 'SITE NAME', 'PROJECT NAME', 'Requestor'
//       ]
//     },
//     {
//       key: 'suppliers',
//       title: 'Supplier Performance',
//       description: 'Import supplier performance data',
//       requiredColumns: [
//         'Supplier Name', 'Category', 'On-Time Delivery (%)', 
//         'Quality Rating (%)', 'Cost Compliance (%)', 
//         'Responsiveness Rating (%)'
//       ]
//     }
//   ];

//   const downloadTemplate = (type) => {
//     const templates = {
//       availableStock: [
//         ['Material Code', 'Material Name', 'CATEGORY', 'PROJECT', 'UOM', 'UP', 'TP', 'AVAILABLE TP', 'OPENING STOCK', 'INBOUND', 'TOTAL', 'TV IB', 'OUTBOUND', 'TV OB', 'ON HAND', 'TV AVAILABLE STOCK', 'SUPPLIER', 'COMMENT'],
//         ['IT-001', 'Wireless Mouse', 'IT Accessories', '', 'Pieces', 5000, 5000, 5000, 100, 50, 150, 250000, 30, 150000, 120, 600000, 'Tech Supplies Ltd', 'Sample data']
//       ],
//       inbound: [
//         ['DATE', 'Material Code', 'Material Desc', 'UOM', 'INITIAL QTY', 'INBOUND', 'TOTAL', 'UP', 'TP', 'PO No.', 'PROJECT', 'SUPPLIER', 'RECEIVED BY', 'Comment'],
//         ['01/01/2024', 'IT-001', 'Wireless Mouse', 'Pieces', 100, 50, 150, 5000, 250000, 'PO-2024-001', 'Main Office', 'Tech Supplies Ltd', 'John Doe', 'Sample data']
//       ],
//       outbound: [
//         ['Date', 'Material Code', 'Description', 'CATEGORY', 'Qty', 'CLUSTER', 'SITE NAME', 'IHS ID', 'Site ID', 'MFR Number', 'MFR DATE', 'PROJECT NAME', 'Requestor', 'Delivery Note', 'Carrier Name', 'Served By', 'Transporter', 'Comment'],
//         ['01/01/2024', 'IT-001', 'Wireless Mouse', 'IT Accessories', 30, 'North', 'Site A', 'IHS-001', 'SITE-001', 'MFR-001', '01/01/2024', 'Project Alpha', 'Jane Smith', 'DN-001', 'Express Carrier', 'John Doe', 'Fast Transport', 'Sample data']
//       ],
//       suppliers: [
//         ['Supplier Name', 'Category', 'On-Time Delivery (%)', 'Quality Rating (%)', 'Cost Compliance (%)', 'Responsiveness Rating (%)', 'Overall Performance Score (%)', 'Remarks'],
//         ['Tech Supplies Ltd', 'IT Accessories', 95, 90, 85, 88, 89.5, 'Excellent supplier']
//       ]
//     };

//     const ws = XLSX.utils.aoa_to_sheet(templates[type]);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Template');
//     XLSX.writeFile(wb, `${type}_template.xlsx`);
//     message.success(`Template downloaded: ${type}_template.xlsx`);
//   };

//   const handleFileUpload = (type, file) => {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: 'array' });
//         const sheetName = workbook.SheetNames[0];
//         const worksheet = workbook.Sheets[sheetName];
//         const jsonData = XLSX.utils.sheet_to_json(worksheet);

//         setFileData(prev => ({
//           ...prev,
//           [type]: jsonData
//         }));

//         message.success(`File uploaded: ${file.name} (${jsonData.length} rows)`);
//       } catch (error) {
//         console.error('File parsing error:', error);
//         message.error('Failed to parse Excel file');
//       }
//     };
//     reader.readAsArrayBuffer(file);
//     return false; 
//   };

//   const validateData = async () => {
//     try {
//       setUploading(true);
      
//       const results = {};
      
//       for (const [key, data] of Object.entries(fileData)) {
//         if (data && data.length > 0) {
//           const typeConfig = migrationTypes.find(t => t.key === key);
          
//           // Check for required columns
//           const firstRow = data[0];
//           const missingColumns = typeConfig.requiredColumns.filter(
//             col => !Object.keys(firstRow).includes(col)
//           );

//           results[key] = {
//             totalRows: data.length,
//             validRows: missingColumns.length === 0 ? data.length : 0,
//             invalidRows: missingColumns.length > 0 ? data.length : 0,
//             missingColumns,
//             errors: [],
//             warnings: []
//           };

//           // Validate data
//           if (missingColumns.length === 0) {
//             data.forEach((row, index) => {
//               // Add validation logic here
//               if (!row['Material Code'] && !row['Supplier Name']) {
//                 results[key].errors.push(`Row ${index + 2}: Missing required identifier`);
//                 results[key].invalidRows++;
//                 results[key].validRows--;
//               }
//             });
//           }
//         }
//       }

//       setValidationResults(results);
//       setCurrentStep(1);
//     } catch (error) {
//       console.error('Validation error:', error);
//       message.error('Validation failed');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const startImport = async () => {
//     try {
//       setUploading(true);
//       setCurrentStep(2);
//       setImportProgress(0);

//       const results = {
//         availableStock: { success: 0, failed: 0, errors: [] },
//         inbound: { success: 0, failed: 0, errors: [] },
//         outbound: { success: 0, failed: 0, errors: [] },
//         suppliers: { success: 0, failed: 0, errors: [] }
//       };

//       let totalProgress = 0;
//       const totalSteps = Object.values(fileData).filter(d => d).length;

//       // Import Available Stock
//       if (fileData.availableStock) {
//         try {
//           const response = await api.post('/api/migration/available-stock', {
//             data: fileData.availableStock
//           });
//           results.availableStock.success = response.data.data.imported;
//           results.availableStock.failed = response.data.data.failed;
//           results.availableStock.errors = response.data.data.errors || [];
//         } catch (error) {
//           results.availableStock.errors.push(error.response?.data?.message || error.message);
//         }
//         totalProgress++;
//         setImportProgress((totalProgress / totalSteps) * 100);
//       }

//       // Import Inbound History
//       if (fileData.inbound) {
//         try {
//           const response = await api.post('/api/migration/inbound', {
//             data: fileData.inbound
//           });
//           results.inbound.success = response.data.data.imported;
//           results.inbound.failed = response.data.data.failed;
//           results.inbound.errors = response.data.data.errors || [];
//         } catch (error) {
//           results.inbound.errors.push(error.response?.data?.message || error.message);
//         }
//         totalProgress++;
//         setImportProgress((totalProgress / totalSteps) * 100);
//       }

//       // Import Outbound History
//       if (fileData.outbound) {
//         try {
//           const response = await api.post('/api/migration/outbound', {
//             data: fileData.outbound
//           });
//           results.outbound.success = response.data.data.imported;
//           results.outbound.failed = response.data.data.failed;
//           results.outbound.errors = response.data.data.errors || [];
//         } catch (error) {
//           results.outbound.errors.push(error.response?.data?.message || error.message);
//         }
//         totalProgress++;
//         setImportProgress((totalProgress / totalSteps) * 100);
//       }

//       // Import Suppliers
//       if (fileData.suppliers) {
//         try {
//           const response = await api.post('/api/migration/suppliers', {
//             data: fileData.suppliers
//           });
//           results.suppliers.success = response.data.data.imported;
//           results.suppliers.failed = response.data.data.failed;
//           results.suppliers.errors = response.data.data.errors || [];
//         } catch (error) {
//           results.suppliers.errors.push(error.response?.data?.message || error.message);
//         }
//         totalProgress++;
//         setImportProgress((totalProgress / totalSteps) * 100);
//       }

//       setImportResults(results);
//       setCurrentStep(3);
//       message.success('Data migration completed');
//     } catch (error) {
//       console.error('Import error:', error);
//       message.error('Import failed');
//     } finally {
//       setUploading(false);
//     }
//   };

//   const validationColumns = [
//     {
//       title: 'Data Type',
//       dataIndex: 'type',
//       key: 'type'
//     },
//     {
//       title: 'Total Rows',
//       dataIndex: 'totalRows',
//       key: 'totalRows',
//       align: 'center'
//     },
//     {
//       title: 'Valid Rows',
//       dataIndex: 'validRows',
//       key: 'validRows',
//       align: 'center',
//       render: (count) => (
//         <Tag color="green" icon={<CheckCircleOutlined />}>
//           {count}
//         </Tag>
//       )
//     },
//     {
//       title: 'Invalid Rows',
//       dataIndex: 'invalidRows',
//       key: 'invalidRows',
//       align: 'center',
//       render: (count) => (
//         <Tag color="red" icon={<CloseCircleOutlined />}>
//           {count}
//         </Tag>
//       )
//     },
//     {
//       title: 'Status',
//       key: 'status',
//       render: (_, record) => (
//         record.invalidRows === 0 ? (
//           <Tag color="green" icon={<CheckCircleOutlined />}>
//             Ready to Import
//           </Tag>
//         ) : (
//           <Tag color="red" icon={<WarningOutlined />}>
//             Has Errors
//           </Tag>
//         )
//       )
//     }
//   ];

//   const getValidationTableData = () => {
//     if (!validationResults) return [];
    
//     return Object.entries(validationResults).map(([key, result]) => ({
//       key,
//       type: migrationTypes.find(t => t.key === key)?.title,
//       ...result
//     }));
//   };

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <Title level={2}>
//           <UploadOutlined /> Data Migration Tool
//         </Title>
//         <Paragraph>
//           Import historical data from Excel spreadsheets. Download templates, fill them with your data, 
//           and upload to migrate to the new system.
//         </Paragraph>

//         <Alert
//           message="Important: Data Migration Guidelines"
//           description={
//             <ul>
//               <li>Download templates before starting the migration</li>
//               <li>Ensure all required columns are present</li>
//               <li>Use the exact column names as shown in templates</li>
//               <li>Dates should be in DD/MM/YYYY format</li>
//               <li>Validate data before importing</li>
//               <li>Create a backup before running migration</li>
//             </ul>
//           }
//           type="warning"
//           showIcon
//           style={{ marginBottom: '24px' }}
//         />

//         <Steps current={currentStep} style={{ marginBottom: '32px' }}>
//           <Step title="Upload Files" icon={<UploadOutlined />} />
//           <Step title="Validate Data" icon={<CheckCircleOutlined />} />
//           <Step title="Import" icon={<LoadingOutlined />} />
//           <Step title="Complete" icon={<CheckCircleOutlined />} />
//         </Steps>

//         <Divider />

//         {/* Step 0: Upload Files */}
//         {currentStep === 0 && (
//           <>
//             <Title level={4}>Step 1: Download Templates & Upload Data</Title>
            
//             {migrationTypes.map(type => (
//               <Card 
//                 key={type.key} 
//                 size="small" 
//                 style={{ marginBottom: '16px' }}
//                 title={
//                   <Space>
//                     <FileExcelOutlined />
//                     {type.title}
//                   </Space>
//                 }
//               >
//                 <Row gutter={16} align="middle">
//                   <Col flex="auto">
//                     <Paragraph style={{ margin: 0 }}>
//                       {type.description}
//                     </Paragraph>
//                     <Text type="secondary" style={{ fontSize: '12px' }}>
//                       Required columns: {type.requiredColumns.join(', ')}
//                     </Text>
//                   </Col>
//                   <Col>
//                     <Space>
//                       <Button
//                         icon={<DownloadOutlined />}
//                         onClick={() => downloadTemplate(type.key)}
//                       >
//                         Download Template
//                       </Button>
//                       <Upload
//                         accept=".xlsx,.xls"
//                         showUploadList={false}
//                         beforeUpload={(file) => handleFileUpload(type.key, file)}
//                       >
//                         <Button
//                           type={fileData[type.key] ? 'primary' : 'default'}
//                           icon={<UploadOutlined />}
//                         >
//                           {fileData[type.key] 
//                             ? `Uploaded (${fileData[type.key].length} rows)` 
//                             : 'Upload File'
//                           }
//                         </Button>
//                       </Upload>
//                     </Space>
//                   </Col>
//                 </Row>
//               </Card>
//             ))}

//             <Divider />

//             <Space>
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={validateData}
//                 disabled={!Object.values(fileData).some(d => d)}
//                 loading={uploading}
//               >
//                 Validate Data
//               </Button>
//               <Text type="secondary">
//                 {Object.values(fileData).filter(d => d).length} file(s) uploaded
//               </Text>
//             </Space>
//           </>
//         )}

//         {/* Step 1: Validation Results */}
//         {currentStep === 1 && validationResults && (
//           <>
//             <Title level={4}>Step 2: Validation Results</Title>
            
//             <Table
//               columns={validationColumns}
//               dataSource={getValidationTableData()}
//               pagination={false}
//               style={{ marginBottom: '24px' }}
//             />

//             <Collapse>
//               {Object.entries(validationResults).map(([key, result]) => (
//                 result.errors.length > 0 || result.warnings.length > 0 || result.missingColumns.length > 0 ? (
//                   <Panel 
//                     header={
//                       <Space>
//                         {migrationTypes.find(t => t.key === key)?.title}
//                         {result.errors.length > 0 && (
//                           <Tag color="red">{result.errors.length} errors</Tag>
//                         )}
//                         {result.warnings.length > 0 && (
//                           <Tag color="orange">{result.warnings.length} warnings</Tag>
//                         )}
//                       </Space>
//                     } 
//                     key={key}
//                   >
//                     {result.missingColumns.length > 0 && (
//                       <Alert
//                         message="Missing Columns"
//                         description={`Required columns not found: ${result.missingColumns.join(', ')}`}
//                         type="error"
//                         showIcon
//                         style={{ marginBottom: '16px' }}
//                       />
//                     )}
                    
//                     {result.errors.length > 0 && (
//                       <>
//                         <Title level={5}>Errors:</Title>
//                         <ul>
//                           {result.errors.map((error, index) => (
//                             <li key={index}><Text type="danger">{error}</Text></li>
//                           ))}
//                         </ul>
//                       </>
//                     )}
                    
//                     {result.warnings.length > 0 && (
//                       <>
//                         <Title level={5}>Warnings:</Title>
//                         <ul>
//                           {result.warnings.map((warning, index) => (
//                             <li key={index}><Text type="warning">{warning}</Text></li>
//                           ))}
//                         </ul>
//                       </>
//                     )}
//                   </Panel>
//                 ) : null
//               ))}
//             </Collapse>

//             <Divider />

//             <Space>
//               <Button onClick={() => setCurrentStep(0)}>
//                 Back
//               </Button>
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={startImport}
//                 disabled={Object.values(validationResults).some(r => r.invalidRows > 0)}
//                 loading={uploading}
//               >
//                 Start Import
//               </Button>
//             </Space>
//           </>
//         )}

//         {/* Step 2: Import Progress */}
//         {currentStep === 2 && (
//           <>
//             <Title level={4}>Step 3: Importing Data</Title>
            
//             <Card style={{ marginBottom: '24px' }}>
//               <Progress
//                 percent={importProgress}
//                 status="active"
//                 strokeColor={{
//                   '0%': '#108ee9',
//                   '100%': '#87d068',
//                 }}
//               />
//               <Text style={{ display: 'block', textAlign: 'center', marginTop: '16px' }}>
//                 Importing data... Please wait.
//               </Text>
//             </Card>
//           </>
//         )}

//         {/* Step 3: Import Complete */}
//         {currentStep === 3 && importResults && (
//           <>
//             <Title level={4}>Step 4: Import Complete</Title>
            
//             <Alert
//               message="Data Migration Completed"
//               description="Your data has been successfully migrated to the new system."
//               type="success"
//               showIcon
//               icon={<CheckCircleOutlined />}
//               style={{ marginBottom: '24px' }}
//             />

//             <Row gutter={[16, 16]}>
//               {Object.entries(importResults).map(([key, result]) => (
//                 result.success > 0 || result.failed > 0 ? (
//                   <Col xs={24} md={12} key={key}>
//                     <Card size="small">
//                       <Title level={5}>
//                         {migrationTypes.find(t => t.key === key)?.title}
//                       </Title>
//                       <Row gutter={16}>
//                         <Col span={12}>
//                           <Statistic
//                             title="Successful"
//                             value={result.success}
//                             valueStyle={{ color: '#52c41a' }}
//                             prefix={<CheckCircleOutlined />}
//                           />
//                         </Col>
//                         <Col span={12}>
//                           <Statistic
//                             title="Failed"
//                             value={result.failed}
//                             valueStyle={{ color: '#f5222d' }}
//                             prefix={<CloseCircleOutlined />}
//                           />
//                         </Col>
//                       </Row>
//                       {result.errors.length > 0 && (
//                         <Alert
//                           message={`${result.errors.length} errors occurred`}
//                           description={result.errors.slice(0, 3).join('; ')}
//                           type="error"
//                           showIcon
//                           style={{ marginTop: '16px' }}
//                         />
//                       )}
//                     </Card>
//                   </Col>
//                 ) : null
//               ))}
//             </Row>

//             <Divider />

//             <Space>
//               <Button
//                 type="primary"
//                 size="large"
//                 onClick={() => {
//                   setCurrentStep(0);
//                   setFileData({
//                     availableStock: null,
//                     inbound: null,
//                     outbound: null,
//                     suppliers: null
//                   });
//                   setValidationResults(null);
//                   setImportResults(null);
//                   setImportProgress(0);
//                 }}
//               >
//                 Start New Migration
//               </Button>
//               <Button
//                 size="large"
//                 onClick={() => window.location.href = '/supply-chain/inventory'}
//               >
//                 Go to Inventory
//               </Button>
//             </Space>
//           </>
//         )}
//       </Card>
//     </div>
//   );
// };

// export default DataMigration;