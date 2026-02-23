import React, { useState } from 'react';
import {
  Card,
  Upload,
  Button,
  Table,
  Alert,
  Row,
  Col,
  Statistic,
  Space,
  Tag,
  Divider,
  message,
  Drawer,
  Input,
  Select,
  Typography
} from 'antd';
import {
  UploadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';

const { Title, Text } = Typography;

const DataMigrationValidator = ({ onValidate }) => {
  const [fileData, setFileData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'duplicates', 'unique'

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false
        });

        const cleanedData = jsonData.map(row => {
          const cleanedRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.replace(/^["']|["']$/g, '').trim().replace(/\n/g, '');
            cleanedRow[cleanKey] = row[key];
          });
          return cleanedRow;
        });

        setFileData(cleanedData);
        analyzeData(cleanedData);
        message.success(`File loaded: ${cleanedData.length} rows`);
      } catch (error) {
        console.error('File parsing error:', error);
        message.error('Failed to parse Excel file');
      }
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const analyzeData = (data) => {
    const codeMap = {};
    const duplicates = [];
    const unique = [];

    data.forEach((row, index) => {
      const code = row['Material Code']?.toString().trim();
      if (!code) return;

      if (!codeMap[code]) {
        codeMap[code] = [];
      }
      codeMap[code].push({
        rowNumber: index + 2,
        description: row['Material Name']?.toString().trim(),
        qty: row['ON HAND']?.toString().trim(),
        price: row['UP']?.toString().trim()
      });
    });

    Object.entries(codeMap).forEach(([code, rows]) => {
      if (rows.length > 1) {
        duplicates.push({
          key: code,
          code,
          count: rows.length,
          rows: rows.map(r => r.rowNumber).join(', '),
          descriptions: rows.map(r => r.description).join(' | ')
        });
      } else {
        unique.push({
          key: code,
          code,
          rowNumber: rows[0].rowNumber,
          description: rows[0].description,
          qty: rows[0].qty,
          price: rows[0].price
        });
      }
    });

    const analysis = {
      totalRows: data.length,
      uniqueCodes: Object.keys(codeMap).length,
      duplicateCodes: duplicates.length,
      duplicateRows: duplicates.reduce((sum, d) => sum + d.count, 0),
      duplicates,
      unique
    };

    setAnalysis(analysis);
  };

  const downloadDuplicatesReport = () => {
    if (!analysis || analysis.duplicates.length === 0) {
      message.info('No duplicates to download');
      return;
    }

    const reportData = analysis.duplicates.map((d, idx) => ({
      '#': idx + 1,
      'Material Code': d.code,
      'Count': d.count,
      'Rows in File': d.rows,
      'Descriptions': d.descriptions
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Duplicates');
    XLSX.writeFile(wb, `duplicate_codes_report_${new Date().getTime()}.xlsx`);
    message.success('Duplicates report downloaded');
  };

  const removeDuplicates = () => {
    if (!fileData || !analysis) {
      message.error('No file loaded');
      return;
    }

    // Keep only the first occurrence of each code
    const seen = {};
    const cleaned = fileData.filter(row => {
      const code = row['Material Code']?.toString().trim();
      if (!code) return false;

      if (seen[code]) {
        return false; // Skip duplicate
      }
      seen[code] = true;
      return true;
    });

    // Generate cleaned Excel file
    const ws = XLSX.utils.json_to_sheet(cleaned);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Available Stock');
    XLSX.writeFile(wb, `available_stock_cleaned_${new Date().getTime()}.xlsx`);

    message.success(`Cleaned file downloaded: ${cleaned.length} unique rows (removed ${fileData.length - cleaned.length} duplicates)`);

    // Update analysis
    setFileData(cleaned);
    analyzeData(cleaned);
  };

  const getFilteredDuplicates = () => {
    if (!analysis) return [];
    let data = analysis.duplicates;

    if (filterText) {
      data = data.filter(d =>
        d.code.toLowerCase().includes(filterText.toLowerCase()) ||
        d.descriptions.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    return data;
  };

  const duplicateColumns = [
    {
      title: '#',
      key: 'index',
      width: 50,
      render: (_, __, index) => index + 1
    },
    {
      title: 'Material Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag color="orange">{code}</Tag>
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
      width: 80,
      render: (count) => (
        <Tag color="red" icon={<ExclamationCircleOutlined />}>
          {count}x
        </Tag>
      )
    },
    {
      title: 'Rows',
      dataIndex: 'rows',
      key: 'rows'
    },
    {
      title: 'Descriptions',
      dataIndex: 'descriptions',
      key: 'descriptions',
      ellipsis: true
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Title level={2}>
          <WarningOutlined /> Excel Data Validator
        </Title>
        <Text type="secondary">
          Analyze your Excel file to detect duplicate material codes before migration
        </Text>

        <Divider />

        {/* Upload Section */}
        <Card size="small" style={{ marginBottom: '24px' }} title="Step 1: Upload Your Excel File">
          <Upload
            accept=".xlsx,.xls"
            showUploadList={true}
            beforeUpload={handleFileUpload}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />} size="large">
              Select Excel File
            </Button>
          </Upload>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <>
            <Card
              size="small"
              style={{ marginBottom: '24px' }}
              title="Step 2: Analysis Results"
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Total Rows"
                    value={analysis.totalRows}
                    suffix="rows"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Unique Codes"
                    value={analysis.uniqueCodes}
                    suffix="codes"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Duplicate Codes"
                    value={analysis.duplicateCodes}
                    suffix="codes"
                    valueStyle={{ color: '#f5222d' }}
                    prefix={<WarningOutlined />}
                  />
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Statistic
                    title="Duplicate Rows"
                    value={analysis.duplicateRows}
                    suffix="rows"
                    valueStyle={{ color: '#f5222d' }}
                  />
                </Col>
              </Row>

              {analysis.duplicateCodes > 0 && (
                <>
                  <Alert
                    message="Duplicates Detected"
                    description={`Your file has ${analysis.duplicateRows} duplicate rows across ${analysis.duplicateCodes} duplicate material codes. These must be cleaned before migration to avoid data loss.`}
                    type="error"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                    style={{ marginTop: '24px', marginBottom: '16px' }}
                  />

                  <Space style={{ marginBottom: '24px' }}>
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      onClick={downloadDuplicatesReport}
                    >
                      Download Duplicates Report
                    </Button>
                    <Button
                      type="primary"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={removeDuplicates}
                    >
                      Generate Cleaned File (Keep First)
                    </Button>
                  </Space>

                  {/* Duplicates Table */}
                  <Card size="small" title={`Duplicate Codes (${analysis.duplicateCodes})`}>
                    <Input.Search
                      placeholder="Search material codes or descriptions..."
                      style={{ marginBottom: '16px' }}
                      onChange={(e) => setFilterText(e.target.value)}
                    />
                    <Table
                      columns={duplicateColumns}
                      dataSource={getFilteredDuplicates()}
                      pagination={{ pageSize: 10 }}
                      size="small"
                      scroll={{ x: 800 }}
                    />
                  </Card>
                </>
              )}

              {analysis.duplicateCodes === 0 && (
                <Alert
                  message="No Duplicates Found"
                  description="Your file is clean and ready for migration!"
                  type="success"
                  showIcon
                  icon={<CheckCircleOutlined />}
                  style={{ marginTop: '24px' }}
                />
              )}
            </Card>

            {/* Action Buttons */}
            <Card size="small" title="Step 3: What Next?">
              <Space direction="vertical" style={{ width: '100%' }}>
                {analysis.duplicateCodes === 0 ? (
                  <Alert
                    message="Ready for Migration"
                    description="Click the button below to proceed with migration in the DataMigration component."
                    type="success"
                    showIcon
                  />
                ) : (
                  <>
                    <Alert
                      message="Action Required"
                      description={
                        <ul>
                          <li>Option 1: Download the cleaned file (keeps first occurrence of each code)</li>
                          <li>Option 2: Manually edit your Excel file to resolve duplicates</li>
                          <li>Option 3: Download the duplicates report for manual review</li>
                          <li>Once fixed, re-upload this validator to confirm</li>
                        </ul>
                      }
                      type="warning"
                      showIcon
                    />
                  </>
                )}
              </Space>
            </Card>
          </>
        )}
      </Card>
    </div>
  );
};

export default DataMigrationValidator;
