import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  DatePicker, 
  Button, 
  Space, 
  Radio,
  message,
  Alert
} from 'antd';
import { 
  DownloadOutlined, 
  FileExcelOutlined, 
  FilePdfOutlined,
  FileTextOutlined 
} from '@ant-design/icons';
import api from '../../services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

const CashRequestExportModal = ({ visible, onCancel }) => {
  const [form] = Form.useForm();
  const [exporting, setExporting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Load departments and employees on mount
  useEffect(() => {
    if (visible) {
      loadFilters();
    }
  }, [visible]);

  const loadFilters = async () => {
    try {
      // Fetch departments
      const deptResponse = await api.get('/users/departments');
      if (deptResponse.data.success) {
        setDepartments(deptResponse.data.data);
      }

      // Fetch employees
      const empResponse = await api.get('/users/employees');
      if (empResponse.data.success) {
        setEmployees(empResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
      // Set some defaults if API fails
      setDepartments(['Engineering', 'Finance', 'Operations', 'IT', 'HR']);
    }
  };

  const handleExport = async (values) => {
    try {
      setExporting(true);
      console.log('Export values:', values);

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', values.format);

      if (values.dateRange) {
        params.append('startDate', values.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', values.dateRange[1].format('YYYY-MM-DD'));
      }

      if (values.department && values.department !== 'all') {
        params.append('department', values.department);
      }

      if (values.status && values.status !== 'all') {
        params.append('status', values.status);
      }

      if (values.employee && values.employee !== 'all') {
        params.append('employeeId', values.employee);
      }

      console.log('Export URL:', `/cash-requests/export?${params.toString()}`);

      // Make request
      const response = await api.get(`/cash-requests/export?${params.toString()}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      // Determine filename
      const extension = values.format === 'excel' ? 'xlsx' : values.format;
      link.setAttribute('download', `cash_requests_${Date.now()}.${extension}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      message.success('Export completed successfully');
      form.resetFields();
      onCancel();
    } catch (error) {
      console.error('Export error:', error);
      message.error(error.response?.data?.message || 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined />
          Export Cash Requests
        </Space>
      }
      open={visible}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
      width={600}
    >
      <Alert
        message="Export Options"
        description="Select filters to export cash requests. All approval chain details and disbursement history will be included."
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={handleExport}
        initialValues={{
          format: 'csv',
          department: 'all',
          status: 'all',
          employee: 'all'
        }}
      >
        {/* Export Format */}
        <Form.Item
          label="Export Format"
          name="format"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio.Button value="csv">
              <FileTextOutlined /> CSV
            </Radio.Button>
            <Radio.Button value="excel">
              <FileExcelOutlined /> Excel
            </Radio.Button>
            <Radio.Button value="pdf">
              <FilePdfOutlined /> PDF
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {/* Date Range */}
        <Form.Item
          label="Date Range"
          name="dateRange"
          rules={[{ required: true, message: 'Please select date range' }]}
        >
          <RangePicker 
            style={{ width: '100%' }}
            format="DD/MM/YYYY"
            ranges={{
              'This Month': [dayjs().startOf('month'), dayjs()],
              'Last Month': [
                dayjs().subtract(1, 'month').startOf('month'),
                dayjs().subtract(1, 'month').endOf('month')
              ],
              'This Year': [dayjs().startOf('year'), dayjs()],
              'Last 3 Months': [dayjs().subtract(3, 'months'), dayjs()],
              'Last 6 Months': [dayjs().subtract(6, 'months'), dayjs()],
              'All Time': [dayjs('2020-01-01'), dayjs()]
            }}
          />
        </Form.Item>

        {/* Department Filter */}
        <Form.Item
          label="Department"
          name="department"
        >
          <Select placeholder="Select department">
            <Option value="all">All Departments</Option>
            {departments.map(dept => (
              <Option key={dept} value={dept}>{dept}</Option>
            ))}
          </Select>
        </Form.Item>

        {/* Status Filter */}
        <Form.Item
          label="Status"
          name="status"
        >
          <Select placeholder="Select status">
            <Option value="all">All Statuses</Option>
            <Option value="pending_finance">Pending Finance</Option>
            <Option value="approved">Approved</Option>
            <Option value="partially_disbursed">Partially Disbursed</Option>
            <Option value="fully_disbursed">Fully Disbursed</Option>
            <Option value="completed">Completed</Option>
            <Option value="denied">Denied</Option>
          </Select>
        </Form.Item>

        {/* Employee Filter */}
        <Form.Item
          label="Employee"
          name="employee"
        >
          <Select 
            placeholder="Select employee"
            showSearch
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().includes(input.toLowerCase())
            }
          >
            <Option value="all">All Employees</Option>
            {employees.map(emp => (
              <Option key={emp._id} value={emp._id}>
                {emp.fullName} ({emp.department})
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => {
              form.resetFields();
              onCancel();
            }}>
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={exporting}
              icon={<DownloadOutlined />}
            >
              {exporting ? 'Exporting...' : 'Export'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CashRequestExportModal;