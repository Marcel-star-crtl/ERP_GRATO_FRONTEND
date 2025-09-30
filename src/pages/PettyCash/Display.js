// import React, { useState } from 'react';
// import { Table, Button, Input, Typography, Space, Card, Divider } from 'antd';
// import {
//   CopyOutlined,
//   FileExcelOutlined,
//   FilePdfOutlined,
//   PrinterOutlined,
//   DeleteOutlined,
//   SearchOutlined
// } from '@ant-design/icons';

// const { Title, Text } = Typography;
// const { Search } = Input;

// const Display = () => {
//   // Sample data - this would typically come from an API
//   const [billsData, setBillsData] = useState([
//     {
//       key: '1',
//       date: '2018-11-20',
//       billName: 'happy foodstuff',
//       billNo: 'H893',
//       payee: 'Mark',
//       allocation: 'food',
//       comment: 'purchased food for guest',
//       amount: 2000.00
//     }
//   ]);

//   const [advancesData, setAdvancesData] = useState([]);

//   const [salaryAdvancesData, setSalaryAdvancesData] = useState([]);

//   // Search states
//   const [billsSearch, setBillsSearch] = useState('');
//   const [advancesSearch, setAdvancesSearch] = useState('');
//   const [salaryAdvancesSearch, setSalaryAdvancesSearch] = useState('');

//   // Calculate totals
//   const billsTotal = billsData.reduce((sum, item) => sum + item.amount, 0);
//   const advancesTotal = advancesData.reduce((sum, item) => sum + item.amount, 0);
//   const salaryAdvancesTotal = salaryAdvancesData.reduce((sum, item) => sum + item.amount, 0);

//   // Common action buttons
//   const ActionButtons = ({ onCopy, onExcel, onCSV, onPDF }) => (
//     <Space>
//       <Button icon={<CopyOutlined />} onClick={onCopy}>Copy</Button>
//       <Button icon={<FileExcelOutlined />} onClick={onExcel}>Excel</Button>
//       <Button icon={<CopyOutlined />} onClick={onCSV}>CSV</Button>
//       <Button icon={<FilePdfOutlined />} onClick={onPDF}>PDF</Button>
//     </Space>
//   );

//   // Bills table columns
//   const billsColumns = [
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       sorter: (a, b) => new Date(a.date) - new Date(b.date),
//     },
//     {
//       title: 'BillName',
//       dataIndex: 'billName',
//       key: 'billName',
//       sorter: (a, b) => a.billName.localeCompare(b.billName),
//     },
//     {
//       title: 'BillNo',
//       dataIndex: 'billNo',
//       key: 'billNo',
//     },
//     {
//       title: 'Payee',
//       dataIndex: 'payee',
//       key: 'payee',
//     },
//     {
//       title: 'Allocation',
//       dataIndex: 'allocation',
//       key: 'allocation',
//     },
//     {
//       title: 'Comment',
//       dataIndex: 'comment',
//       key: 'comment',
//     },
//     {
//       title: 'Amount',
//       dataIndex: 'amount',
//       key: 'amount',
//       render: (amount) => amount.toFixed(2),
//       sorter: (a, b) => a.amount - b.amount,
//     },
//     {
//       title: 'Reprint',
//       key: 'reprint',
//       render: () => <Button icon={<PrinterOutlined />} size="small" />,
//     },
//     {
//       title: 'Delete',
//       key: 'delete',
//       render: (_, record) => (
//         <Button 
//           icon={<DeleteOutlined />} 
//           size="small" 
//           danger 
//           onClick={() => handleDelete('bills', record.key)}
//         />
//       ),
//     },
//   ];

//   // Advances table columns
//   const advancesColumns = [
//     {
//       title: 'Date',
//       dataIndex: 'date',
//       key: 'date',
//       sorter: (a, b) => new Date(a.date) - new Date(b.date),
//     },
//     {
//       title: 'EmpName',
//       dataIndex: 'empName',
//       key: 'empName',
//       sorter: (a, b) => a.empName.localeCompare(b.empName),
//     },
//     {
//       title: 'EmpCode',
//       dataIndex: 'empCode',
//       key: 'empCode',
//     },
//     {
//       title: 'Comment',
//       dataIndex: 'comment',
//       key: 'comment',
//     },
//     {
//       title: 'Amount',
//       dataIndex: 'amount',
//       key: 'amount',
//       render: (amount) => amount.toFixed(2),
//       sorter: (a, b) => a.amount - b.amount,
//     },
//     {
//       title: 'Reprint',
//       key: 'reprint',
//       render: () => <Button icon={<PrinterOutlined />} size="small" />,
//     },
//     {
//       title: 'Delete',
//       key: 'delete',
//       render: (_, record) => (
//         <Button 
//           icon={<DeleteOutlined />} 
//           size="small" 
//           danger 
//           onClick={() => handleDelete('advances', record.key)}
//         />
//       ),
//     },
//   ];

//   // Salary Advances table columns (same as advances)
//   const salaryAdvancesColumns = [...advancesColumns];

//   const handleDelete = (type, key) => {
//     switch(type) {
//       case 'bills':
//         setBillsData(prev => prev.filter(item => item.key !== key));
//         break;
//       case 'advances':
//         setAdvancesData(prev => prev.filter(item => item.key !== key));
//         break;
//       case 'salaryAdvances':
//         setSalaryAdvancesData(prev => prev.filter(item => item.key !== key));
//         break;
//       default:
//         break;
//     }
//   };

//   const handleExport = (type, format) => {
//     console.log(`Exporting ${type} data as ${format}`);
//     // Implement export functionality here
//   };

//   // Filter data based on search
//   const filteredBillsData = billsData.filter(item =>
//     Object.values(item).some(val => 
//       val.toString().toLowerCase().includes(billsSearch.toLowerCase())
//     )
//   );

//   const filteredAdvancesData = advancesData.filter(item =>
//     Object.values(item).some(val => 
//       val.toString().toLowerCase().includes(advancesSearch.toLowerCase())
//     )
//   );

//   const filteredSalaryAdvancesData = salaryAdvancesData.filter(item =>
//     Object.values(item).some(val => 
//       val.toString().toLowerCase().includes(salaryAdvancesSearch.toLowerCase())
//     )
//   );

//   return (
//     <div style={{ padding: '24px' }}>
//       <div style={{ marginBottom: '24px' }}>
//         <Title level={4} style={{ color: '#1890ff', marginBottom: '8px' }}>EDIT TABLE</Title>
//       </div>

//       {/* BILLS Section */}
//       <Card style={{ marginBottom: '32px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//           <Title level={3} style={{ margin: 0 }}>BILLS</Title>
//           <Search
//             placeholder="Search..."
//             style={{ width: 200 }}
//             value={billsSearch}
//             onChange={(e) => setBillsSearch(e.target.value)}
//             prefix={<SearchOutlined />}
//           />
//         </div>
        
//         <div style={{ marginBottom: '16px' }}>
//           <ActionButtons
//             onCopy={() => handleExport('bills', 'copy')}
//             onExcel={() => handleExport('bills', 'excel')}
//             onCSV={() => handleExport('bills', 'csv')}
//             onPDF={() => handleExport('bills', 'pdf')}
//           />
//         </div>

//         <Table
//           columns={billsColumns}
//           dataSource={filteredBillsData}
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
//           }}
//           scroll={{ x: 'max-content' }}
//         />
        
//         <div style={{ textAlign: 'right', marginTop: '8px' }}>
//           <Text strong>Bills Total = {billsTotal.toFixed(2)}</Text>
//         </div>
//       </Card>

//       {/* ADVANCES Section */}
//       <Card style={{ marginBottom: '32px' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//           <Title level={3} style={{ margin: 0 }}>ADVANCES</Title>
//           <Search
//             placeholder="Search..."
//             style={{ width: 200 }}
//             value={advancesSearch}
//             onChange={(e) => setAdvancesSearch(e.target.value)}
//             prefix={<SearchOutlined />}
//           />
//         </div>
        
//         <div style={{ marginBottom: '16px' }}>
//           <ActionButtons
//             onCopy={() => handleExport('advances', 'copy')}
//             onExcel={() => handleExport('advances', 'excel')}
//             onCSV={() => handleExport('advances', 'csv')}
//             onPDF={() => handleExport('advances', 'pdf')}
//           />
//         </div>

//         <Table
//           columns={advancesColumns}
//           dataSource={filteredAdvancesData}
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => 
//               total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
//           }}
//           locale={{
//             emptyText: 'No data available in table'
//           }}
//           scroll={{ x: 'max-content' }}
//         />
        
//         <div style={{ textAlign: 'right', marginTop: '8px' }}>
//           <Text strong>Advances Total = {advancesTotal.toFixed(2)}</Text>
//         </div>
//       </Card>

//       {/* SALARY ADVANCES Section */}
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
//           <Title level={3} style={{ margin: 0 }}>SALARY ADVANCES</Title>
//           <Search
//             placeholder="Search..."
//             style={{ width: 200 }}
//             value={salaryAdvancesSearch}
//             onChange={(e) => setSalaryAdvancesSearch(e.target.value)}
//             prefix={<SearchOutlined />}
//           />
//         </div>
        
//         <div style={{ marginBottom: '16px' }}>
//           <ActionButtons
//             onCopy={() => handleExport('salaryAdvances', 'copy')}
//             onExcel={() => handleExport('salaryAdvances', 'excel')}
//             onCSV={() => handleExport('salaryAdvances', 'csv')}
//             onPDF={() => handleExport('salaryAdvances', 'pdf')}
//           />
//         </div>

//         <Table
//           columns={salaryAdvancesColumns}
//           dataSource={filteredSalaryAdvancesData}
//           pagination={{
//             showSizeChanger: true,
//             showQuickJumper: true,
//             showTotal: (total, range) => 
//               total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
//           }}
//           locale={{
//             emptyText: 'No data available in table'
//           }}
//           scroll={{ x: 'max-content' }}
//         />
        
//         <div style={{ textAlign: 'right', marginTop: '8px' }}>
//           <Text strong>Salary Advances Total = {salaryAdvancesTotal.toFixed(2)}</Text>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default Display;






import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Typography, Space, Card, message, Spin } from 'antd';
import {
  CopyOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  PrinterOutlined,
  DeleteOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchTransactions, 
  deleteTransaction,
  clearError 
} from '../../features/pettyCash/pettyCashSlice'; // Adjust import path as needed

const { Title, Text } = Typography;
const { Search } = Input;

const Display = () => {
  const dispatch = useDispatch();
  const { transactions, loading, error } = useSelector((state) => state.pettyCash);

  // Search states
  const [billsSearch, setBillsSearch] = useState('');
  const [advancesSearch, setAdvancesSearch] = useState('');
  const [salaryAdvancesSearch, setSalaryAdvancesSearch] = useState('');
  const [cashSalesSearch, setCashSalesSearch] = useState('');
  const [fundInSearch, setFundInSearch] = useState('');
  const [chequeSearch, setChequeSearch] = useState('');

  useEffect(() => {
    // Fetch transactions when component mounts
    dispatch(fetchTransactions());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(`Error: ${error}`);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  // Filter transactions by type
  const billsData = transactions?.filter(t => t.type === 'bill') || [];
  const advancesData = transactions?.filter(t => t.type === 'advance') || [];
  const salaryAdvancesData = transactions?.filter(t => t.type === 'adv-salary') || [];
  const cashSalesData = transactions?.filter(t => t.type === 'cash-sales') || [];
  const fundInData = transactions?.filter(t => t.type === 'fund-in') || [];
  const chequeData = transactions?.filter(t => t.type === 'make-cheque') || [];

  // Calculate totals
  const billsTotal = billsData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const advancesTotal = advancesData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const salaryAdvancesTotal = salaryAdvancesData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const cashSalesTotal = cashSalesData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const fundInTotal = fundInData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const chequeTotal = chequeData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

  // Common action buttons
  const ActionButtons = ({ onCopy, onExcel, onCSV, onPDF }) => (
    <Space>
      <Button icon={<CopyOutlined />} onClick={onCopy}>Copy</Button>
      <Button icon={<FileExcelOutlined />} onClick={onExcel}>Excel</Button>
      <Button icon={<CopyOutlined />} onClick={onCSV}>CSV</Button>
      <Button icon={<FilePdfOutlined />} onClick={onPDF}>PDF</Button>
    </Space>
  );

  // Bills table columns
  const billsColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'BillName',
      dataIndex: 'billName',
      key: 'billName',
      sorter: (a, b) => (a.billName || '').localeCompare(b.billName || ''),
    },
    {
      title: 'BillNo',
      dataIndex: 'billNo',
      key: 'billNo',
    },
    {
      title: 'Payee',
      dataIndex: 'payee',
      key: 'payee',
    },
    {
      title: 'Allocation',
      dataIndex: 'allocation',
      key: 'allocation',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => parseFloat(amount || 0).toFixed(2),
      sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
    },
    {
      title: 'Reprint',
      key: 'reprint',
      render: (_, record) => (
        <Button 
          icon={<PrinterOutlined />} 
          size="small" 
          onClick={() => handleReprint(record)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  // Advances table columns
  const advancesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'EmpName',
      dataIndex: 'empName',
      key: 'empName',
      sorter: (a, b) => (a.empName || '').localeCompare(b.empName || ''),
    },
    {
      title: 'EmpCode',
      dataIndex: 'empCode',
      key: 'empCode',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => parseFloat(amount || 0).toFixed(2),
      sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
    },
    {
      title: 'Reprint',
      key: 'reprint',
      render: (_, record) => (
        <Button 
          icon={<PrinterOutlined />} 
          size="small" 
          onClick={() => handleReprint(record)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  // Cash Sales columns
  const cashSalesColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'R.V No',
      dataIndex: 'rvNo',
      key: 'rvNo',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => parseFloat(amount || 0).toFixed(2),
      sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
    },
    {
      title: 'Reprint',
      key: 'reprint',
      render: (_, record) => (
        <Button 
          icon={<PrinterOutlined />} 
          size="small" 
          onClick={() => handleReprint(record)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  // Fund In columns
  const fundInColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => parseFloat(amount || 0).toFixed(2),
      sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
    },
    {
      title: 'Reprint',
      key: 'reprint',
      render: (_, record) => (
        <Button 
          icon={<PrinterOutlined />} 
          size="small" 
          onClick={() => handleReprint(record)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  // Cheque columns
  const chequeColumns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
    },
    {
      title: 'P.V/Cheque No',
      dataIndex: 'chequeNo',
      key: 'chequeNo',
    },
    {
      title: 'Comment',
      dataIndex: 'comment',
      key: 'comment',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => parseFloat(amount || 0).toFixed(2),
      sorter: (a, b) => parseFloat(a.amount || 0) - parseFloat(b.amount || 0),
    },
    {
      title: 'Reprint',
      key: 'reprint',
      render: (_, record) => (
        <Button 
          icon={<PrinterOutlined />} 
          size="small" 
          onClick={() => handleReprint(record)}
        />
      ),
    },
    {
      title: 'Delete',
      key: 'delete',
      render: (_, record) => (
        <Button
          icon={<DeleteOutlined />}
          size="small"
          danger
          onClick={() => handleDelete(record.id)}
        />
      ),
    },
  ];

  const handleDelete = async (transactionId) => {
    try {
      await dispatch(deleteTransaction(transactionId)).unwrap();
      message.success('Transaction deleted successfully');
      // Refresh transactions
      dispatch(fetchTransactions());
    } catch (error) {
      message.error(`Failed to delete transaction: ${error.message || 'Unknown error'}`);
    }
  };

  const handleReprint = (record) => {
    console.log('Reprinting record:', record);
    // Implement reprint functionality here
    message.info('Reprint functionality to be implemented');
  };

  const handleExport = (type, format) => {
    console.log(`Exporting ${type} data as ${format}`);
    // Implement export functionality here
    message.info(`${format.toUpperCase()} export functionality to be implemented`);
  };

  // Filter data based on search
  const filteredBillsData = billsData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(billsSearch.toLowerCase())
    )
  );

  const filteredAdvancesData = advancesData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(advancesSearch.toLowerCase())
    )
  );

  const filteredSalaryAdvancesData = salaryAdvancesData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(salaryAdvancesSearch.toLowerCase())
    )
  );

  const filteredCashSalesData = cashSalesData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(cashSalesSearch.toLowerCase())
    )
  );

  const filteredFundInData = fundInData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(fundInSearch.toLowerCase())
    )
  );

  const filteredChequeData = chequeData.filter(item =>
    Object.values(item).some(val =>
      val && val.toString().toLowerCase().includes(chequeSearch.toLowerCase())
    )
  );

  if (loading) {
    return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: '20%' }} />;
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ color: '#1890ff', marginBottom: '8px' }}>EDIT TABLE</Title>
      </div>

      {/* BILLS Section */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>BILLS</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={billsSearch}
            onChange={(e) => setBillsSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('bills', 'copy')}
            onExcel={() => handleExport('bills', 'excel')}
            onCSV={() => handleExport('bills', 'csv')}
            onPDF={() => handleExport('bills', 'pdf')}
          />
        </div>

        <Table
          columns={billsColumns}
          dataSource={filteredBillsData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `Showing ${range[0]} to ${range[1]} of ${total} entries`,
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Bills Total = {billsTotal.toFixed(2)}</Text>
        </div>
      </Card>

      {/* ADVANCES Section */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>ADVANCES</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={advancesSearch}
            onChange={(e) => setAdvancesSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('advances', 'copy')}
            onExcel={() => handleExport('advances', 'excel')}
            onCSV={() => handleExport('advances', 'csv')}
            onPDF={() => handleExport('advances', 'pdf')}
          />
        </div>

        <Table
          columns={advancesColumns}
          dataSource={filteredAdvancesData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
          }}
          locale={{
            emptyText: 'No data available in table'
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Advances Total = {advancesTotal.toFixed(2)}</Text>
        </div>
      </Card>

      {/* SALARY ADVANCES Section */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>SALARY ADVANCES</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={salaryAdvancesSearch}
            onChange={(e) => setSalaryAdvancesSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('salaryAdvances', 'copy')}
            onExcel={() => handleExport('salaryAdvances', 'excel')}
            onCSV={() => handleExport('salaryAdvances', 'csv')}
            onPDF={() => handleExport('salaryAdvances', 'pdf')}
          />
        </div>

        <Table
          columns={advancesColumns}
          dataSource={filteredSalaryAdvancesData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
          }}
          locale={{
            emptyText: 'No data available in table'
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Salary Advances Total = {salaryAdvancesTotal.toFixed(2)}</Text>
        </div>
      </Card>

      {/* CASH SALES Section */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>CASH SALES</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={cashSalesSearch}
            onChange={(e) => setCashSalesSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('cashSales', 'copy')}
            onExcel={() => handleExport('cashSales', 'excel')}
            onCSV={() => handleExport('cashSales', 'csv')}
            onPDF={() => handleExport('cashSales', 'pdf')}
          />
        </div>

        <Table
          columns={cashSalesColumns}
          dataSource={filteredCashSalesData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
          }}
          locale={{
            emptyText: 'No data available in table'
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Cash Sales Total = {cashSalesTotal.toFixed(2)}</Text>
        </div>
      </Card>

      {/* FUND-IN Section */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>FUND-IN</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={fundInSearch}
            onChange={(e) => setFundInSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('fundIn', 'copy')}
            onExcel={() => handleExport('fundIn', 'excel')}
            onCSV={() => handleExport('fundIn', 'csv')}
            onPDF={() => handleExport('fundIn', 'pdf')}
          />
        </div>

        <Table
          columns={fundInColumns}
          dataSource={filteredFundInData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
          }}
          locale={{
            emptyText: 'No data available in table'
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Fund-In Total = {fundInTotal.toFixed(2)}</Text>
        </div>
      </Card>

      {/* MAKE CHEQUE Section */}
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>MAKE CHEQUE</Title>
          <Search
            placeholder="Search..."
            style={{ width: 200 }}
            value={chequeSearch}
            onChange={(e) => setChequeSearch(e.target.value)}
            prefix={<SearchOutlined />}
          />
        </div>
       
        <div style={{ marginBottom: '16px' }}>
          <ActionButtons
            onCopy={() => handleExport('cheque', 'copy')}
            onExcel={() => handleExport('cheque', 'excel')}
            onCSV={() => handleExport('cheque', 'csv')}
            onPDF={() => handleExport('cheque', 'pdf')}
          />
        </div>

        <Table
          columns={chequeColumns}
          dataSource={filteredChequeData.map(item => ({ ...item, key: item.id }))}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              total > 0 ? `Showing ${range[0]} to ${range[1]} of ${total} entries` : 'Showing 0 to 0 of 0 entries',
          }}
          locale={{
            emptyText: 'No data available in table'
          }}
          scroll={{ x: 'max-content' }}
        />
       
        <div style={{ textAlign: 'right', marginTop: '8px' }}>
          <Text strong>Cheque Total = {chequeTotal.toFixed(2)}</Text>
        </div>
      </Card>
    </div>
  );
};

export default Display;