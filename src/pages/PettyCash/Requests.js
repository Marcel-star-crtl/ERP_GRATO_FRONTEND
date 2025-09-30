import React from 'react';
import { useLocation } from 'react-router-dom';
import { Table, Tag, Space, Input, DatePicker, Button, Card, Select } from 'antd'; 
import { 
  SearchOutlined, 
  FilePdfOutlined, 
  PrinterOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Column } = Table;

const PCRequests = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const category = queryParams.get('category') || 'all';

  // Sample data for all transaction types
  const allData = [
    // Bills
    {
      key: '1',
      type: 'bill',
      id: 'B-1001',
      date: '2023-06-15',
      amount: 150,
      description: 'Office Supplies - Happy Foodstuff',
      status: 'completed',
      reference: 'INV-001',
      payee: 'Stationery World'
    },
    // Advances
    {
      key: '2',
      type: 'advance',
      id: 'A-1001',
      date: '2023-06-16',
      amount: 200,
      description: 'Travel Advance',
      status: 'completed',
      reference: 'EMP-007',
      employee: 'John Smith'
    },
    // Staff Advances
    {
      key: '3',
      type: 'staff-adv',
      id: 'SA-1001',
      date: '2023-06-17',
      amount: 500,
      description: 'Salary Advance',
      status: 'completed',
      reference: 'EMP-042',
      employee: 'Sarah Johnson'
    },
    // Add more sample data as needed
  ];

  // Filter data based on URL category
  const filteredData = category === 'all' 
    ? allData 
    : allData.filter(item => item.type === category);

  const statusTag = (status) => {
    return <Tag color={status === 'completed' ? 'green' : 'orange'}>{status.toUpperCase()}</Tag>;
  };

  const renderActions = (_, record) => (
    <Space size="middle">
      <Button icon={<PrinterOutlined />} onClick={() => handleReprint(record)} />
      <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record)} danger />
    </Space>
  );

  const handleReprint = (record) => {
    console.log('Reprint:', record);
  };

  const handleDelete = (record) => {
    console.log('Delete:', record);
  };

  const handleCategoryChange = (value) => {
    window.location.href = `/pettycash/requests?category=${value}`;
  };

  return (
    <div className="pc-requests">
      <Card>
        <Space style={{ marginBottom: 16, width: '100%' }}>
          <Select
            value={category}
            style={{ width: 180 }}
            onChange={handleCategoryChange}
          >
            <Option value="all">All Transactions</Option>
            <Option value="bill">Bills</Option>
            <Option value="advance">Advances</Option>
            <Option value="staff-adv">Staff Advances</Option>
            <Option value="cash-sales">Cash Sales</Option>
            <Option value="fund-in">Fund-In</Option>
            <Option value="make-cheque">Make Cheque</Option>
          </Select>
          
          <Input 
            placeholder="Search transactions..." 
            prefix={<SearchOutlined />} 
            style={{ width: 300 }}
          />
          
          <RangePicker />
          
          <Button icon={<FilePdfOutlined />}>Export</Button>
        </Space>

        <Table 
          dataSource={filteredData}
          scroll={{ x: true }}
          pagination={{ pageSize: 10 }}
        >
          <Column title="ID" dataIndex="id" key="id" />
          <Column title="Date" dataIndex="date" key="date" />
          <Column title="Amount" dataIndex="amount" key="amount" render={(amt) => `${amt} AED`} />
          <Column title="Description" dataIndex="description" key="description" />
          <Column 
            title="Reference/Payee" 
            key="reference"
            render={(_, record) => record.reference || record.payee || record.employee || 'N/A'}
          />
          <Column title="Status" dataIndex="status" key="status" render={statusTag} />
          <Column
            title="Actions"
            key="actions"
            render={renderActions}
          />
        </Table>
      </Card>
    </div>
  );
};

export default PCRequests;