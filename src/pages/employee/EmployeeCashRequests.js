import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Button, 
  Alert, 
  Spin, 
  Modal, 
  Card,
  Tooltip,
  Popconfirm,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  DollarOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;

const EmployeeCashRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canCreateNewRequest, setCanCreateNewRequest] = useState(false);
  const [deletingRequestId, setDeletingRequestId] = useState(null);
  const navigate = useNavigate();

  // Fetch cash requests
  const fetchRequests = useCallback(async () => {
    try {
      console.log('Fetching employee cash requests...');
      const response = await api.get('/cash-requests/employee');
      
      console.log('Cash requests response:', response.data);
      
      if (response.data.success) {
        const employeeRequests = response.data.data || [];
        setRequests(employeeRequests);
        checkIfCanCreateNewRequest(employeeRequests);
      } else {
        throw new Error(response.data.message || 'Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching cash requests:', error);
      setError(error.response?.data?.message || 'Failed to fetch cash requests');
      setRequests([]);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
        await fetchRequests();
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [fetchRequests]);

  const checkIfCanCreateNewRequest = (requests) => {
    if (requests.length === 0) {
      setCanCreateNewRequest(true);
      return;
    }

    // Check if there's any pending request
    const hasPendingRequest = requests.some(r => 
      r.status && r.status.includes('pending')
    );

    // Check if there's any disbursed request needing justification
    const needsJustification = requests.some(r => 
      ['disbursed', 'justification_pending_supervisor', 
       'justification_pending_finance', 'justification_rejected'].includes(r.status)
    );
    
    if (!hasPendingRequest && !needsJustification) {
      setCanCreateNewRequest(true);
    } else {
      setCanCreateNewRequest(false);
    }
  };

  const showCannotCreateModal = () => {
    Modal.warning({
      title: 'Cannot Create New Request',
      content: (
        <div>
          <p>You currently have a pending cash request that must be completed first.</p>
          <p><strong>What you can do:</strong></p>
          <ul>
            <li>Wait for your pending request to be approved/rejected</li>
            <li>If it's still pending first approval, you can <strong>edit</strong> or <strong>delete</strong> it and create a new one</li>
            <li>Complete any pending justifications</li>
          </ul>
        </div>
      ),
      okText: 'Understood',
    });
  };

  const handleNewRequestClick = () => {
    if (canCreateNewRequest) {
      navigate('/employee/cash-request/new');
    } else {
      showCannotCreateModal();
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchRequests();
    setLoading(false);
  };

  
  // Check if request can be deleted
  const canDeleteRequest = (record) => {
    if (!record) return false;
    
    // STRICT: Only if pending_supervisor AND first approver hasn't acted
    if (record.status !== 'pending_supervisor') return false;
    
    const firstStep = record.approvalChain?.[0];
    if (!firstStep) return false;
    
    // Once ANY approver takes action, NEVER allow delete
    return firstStep.status === 'pending';
  };

  // Check if request can be edited
  const canEditRequest = (record) => {
    if (!record) return false;
    
    // STRICT: ONLY after rejection (denied or justification_rejected)
    // NOT allowed if just pending with no approvals
    
    // Scenario 1: Request denied
    if (record.status === 'denied') return true;
    
    // Scenario 2: Justification rejected
    if (record.status && record.status.includes('justification_rejected')) return true;
    
    // All other cases: CANNOT EDIT
    return false;
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId) => {
    try {
      setDeletingRequestId(requestId);
      
      const response = await api.delete(`/cash-requests/${requestId}`);
      
      if (response.data.success) {
        message.success('Request deleted successfully');
        
        // Refresh the list
        await fetchRequests();
      }
    } catch (error) {
      console.error('Delete error:', error);
      message.error(error.response?.data?.message || 'Failed to delete request');
    } finally {
      setDeletingRequestId(null);
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'pending_supervisor': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Supervisor' 
      },
      'pending_departmental_head': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Departmental Head' 
      },
      'pending_head_of_business': { 
        color: 'orange', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Head of Business' 
      },
      'pending_finance': { 
        color: 'blue', 
        icon: <ClockCircleOutlined />, 
        text: 'Pending Finance' 
      },
      'approved': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Approved' 
      },
      'denied': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Denied' 
      },
      'rejected': { 
        color: 'red', 
        icon: <CloseCircleOutlined />, 
        text: 'Rejected' 
      },
      'disbursed': { 
        color: 'cyan', 
        icon: <DollarOutlined />, 
        text: 'Disbursed - Need Justification' 
      },
      'justification_pending_supervisor': { 
        color: 'purple', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Supervisor' 
      },
      'justification_pending_finance': { 
        color: 'geekblue', 
        icon: <ClockCircleOutlined />, 
        text: 'Justification - Pending Finance' 
      },
      'justification_rejected': { 
        color: 'red', 
        icon: <ExclamationCircleOutlined />, 
        text: 'Justification Rejected' 
      },
      'completed': { 
        color: 'green', 
        icon: <CheckCircleOutlined />, 
        text: 'Completed' 
      }
    };

    const statusInfo = statusMap[status] || { 
      color: 'default', 
      text: status?.replace('_', ' ') || 'Unknown' 
    };
    
    return (
      <Tag color={statusInfo.color} icon={statusInfo.icon}>
        {statusInfo.text}
      </Tag>
    );
  };

  const getActionButtons = (record) => {
    const buttons = [
      <Button 
        type="link" 
        icon={<EyeOutlined />}
        onClick={() => navigate(`/employee/cash-request/${record._id}`)}
        disabled={!record._id}
        key="view"
      >
        View
      </Button>
    ];

    // Add EDIT button if editable
    if (canEditRequest(record)) {
      buttons.push(
        <Button 
          type="link" 
          icon={<EditOutlined />}
          onClick={() => navigate(`/employee/cash-request/${record._id}/edit`)}
          style={{ color: '#52c41a' }}
          key="edit"
        >
          Edit
        </Button>
      );
    }

    // Add delete button if deletable
    if (canDeleteRequest(record)) {
      buttons.push(
        <Popconfirm
          key="delete"
          title="Delete this request?"
          description={
            <div style={{ maxWidth: 300 }}>
              <p>This action cannot be undone.</p>
              <div style={{ fontSize: '12px', marginTop: '8px' }}>
                <div>Amount: XAF {Number(record.amountRequested || 0).toLocaleString()}</div>
                <div>Type: {record.requestType?.replace(/-/g, ' ')}</div>
              </div>
            </div>
          }
          onConfirm={() => handleDeleteRequest(record._id)}
          okText="Yes, Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true, loading: deletingRequestId === record._id }}
        >
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            loading={deletingRequestId === record._id}
          >
            Delete
          </Button>
        </Popconfirm>
      );
    }

    // Justification buttons
    if (record.status === 'disbursed') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#1890ff' }}
          key="justify"
        >
          Submit Justification
        </Button>
      );
    }

    if (record.status === 'justification_rejected') {
      buttons.push(
        <Button 
          type="link" 
          onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
          disabled={!record._id}
          style={{ color: '#faad14' }}
          key="resubmit"
        >
          Resubmit Justification
        </Button>
      );
    }

    return buttons;
  };

  const requestColumns = [
    {
      title: 'Request ID',
      dataIndex: '_id',
      key: '_id',
      render: (id, record) => (
        <Space direction="vertical" size="small">
          <Text code>{id ? `REQ-${id.slice(-6).toUpperCase()}` : 'N/A'}</Text>
          {record.isEdited && record.totalEdits > 0 && (
            <Tag color="orange" style={{ fontSize: '10px' }}>
              <EditOutlined /> Edited {record.totalEdits}x
            </Tag>
          )}
        </Space>
      ),
      width: 140
    },
    {
      title: 'Amount Requested',
      dataIndex: 'amountRequested',
      key: 'amount',
      render: (amount) => `XAF ${Number(amount || 0).toLocaleString()}`,
      sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0),
      width: 150
    },
    {
      title: 'Type',
      dataIndex: 'requestType',
      key: 'type',
      render: (type) => type ? type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
      width: 120
    },
    {
      title: 'Purpose',
      dataIndex: 'purpose',
      key: 'purpose',
      render: (purpose) => purpose ? (
        <Tooltip title={purpose}>
          <Text ellipsis style={{ maxWidth: 200 }}>
            {purpose.length > 50 ? `${purpose.substring(0, 50)}...` : purpose}
          </Text>
        </Tooltip>
      ) : 'N/A',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Space direction="vertical" size="small">
          {getStatusTag(status)}
          {canEditRequest(record) && (
            <Tag color="green" style={{ fontSize: '11px' }}>
              Can Edit
            </Tag>
          )}
          {canDeleteRequest(record) && (
            <Tag color="cyan" style={{ fontSize: '11px' }}>
              Can Delete
            </Tag>
          )}
        </Space>
      ),
      filters: [
        { text: 'Pending Supervisor', value: 'pending_supervisor' },
        { text: 'Pending Departmental Head', value: 'pending_departmental_head' },
        { text: 'Pending Head of Business', value: 'pending_head_of_business' },
        { text: 'Pending Finance', value: 'pending_finance' },
        { text: 'Approved', value: 'approved' },
        { text: 'Disbursed', value: 'disbursed' },
        { text: 'Completed', value: 'completed' },
        { text: 'Denied', value: 'denied' },
      ],
      onFilter: (value, record) => record.status === value,
      width: 240
    },
    {
      title: 'Date Submitted',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
      sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      defaultSortOrder: 'descend',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          {getActionButtons(record)}
        </Space>
      ),
      width: 180
    }
  ];

  const totalPending = requests.filter(r => 
    ['disbursed', 'justification_rejected'].includes(r.status)
  ).length;

  const editableCount = requests.filter(r => canEditRequest(r)).length;
  const deletableCount = requests.filter(r => canDeleteRequest(r)).length;

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Loading your cash requests...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ margin: 0 }}>
            <DollarOutlined /> My Cash Requests
          </Title>
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Tooltip title={!canCreateNewRequest ? "Complete pending requests first" : ""}>
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={handleNewRequestClick}
                disabled={!canCreateNewRequest}
              >
                New Cash Request
              </Button>
            </Tooltip>
          </Space>
        </div>

        {error && (
          <Alert
            message="Error Loading Data"
            description={error}
            type="error"
            showIcon
            closable
            style={{ marginBottom: '16px' }}
            onClose={() => setError(null)}
          />
        )}

        {/* {!canCreateNewRequest && (
          <Alert
            message="Cannot Create New Request"
            description="You have a pending request that must be completed first. Edit or delete it, or wait for approval/rejection before creating a new one."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )} */}

        {(editableCount > 0 || deletableCount > 0) && (
          <Alert
            message={
              <div>
                <strong>Request Management Options:</strong>
                <ul style={{ marginBottom: 0, marginTop: '8px', paddingLeft: '20px' }}>
                  {editableCount > 0 && (
                    <li>
                      <Tag color="orange" style={{ marginRight: '8px' }}>Can Edit</Tag>
                      {editableCount} rejected request{editableCount > 1 ? 's' : ''} can be edited and resubmitted
                    </li>
                  )}
                  {deletableCount > 0 && (
                    <li>
                      <Tag color="cyan" style={{ marginRight: '8px' }}>Can Delete</Tag>
                      {deletableCount} request{deletableCount > 1 ? 's' : ''} can be deleted (no approvals started yet)
                    </li>
                  )}
                </ul>
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                  <strong>Note:</strong> Once any approver takes action, requests cannot be deleted. Rejected requests can only be edited.
                </div>
              </div>
            }
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {totalPending > 0 && (
          <Alert
            message={`You have ${totalPending} cash request(s) that need your attention`}
            description="Complete justifications or resubmit rejected requests to move forward."
            type="warning"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        {requests.length === 0 ? (
          <Alert
            message="No Cash Requests Found"
            description="You haven't submitted any cash requests yet. Click the 'New Cash Request' button to create your first request."
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        ) : (
          <Table 
            columns={requestColumns} 
            dataSource={requests} 
            loading={loading}
            rowKey="_id"
            pagination={{ 
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => 
                `${range[0]}-${range[1]} of ${total} requests`
            }}
            scroll={{ x: 'max-content' }}
            rowClassName={(record) => {
              const needsAttention = ['disbursed', 'justification_rejected'];
              if (needsAttention.includes(record.status)) {
                return 'highlight-row'; 
              }
              if (canEditRequest(record)) {
                return 'editable-row'; // Rejected - can edit
              }
              if (canDeleteRequest(record)) {
                return 'deletable-row'; // Pending no approvals - can delete
              }
              return '';
            }}
          />
        )}
      </Card>

      <style jsx>{`
        .highlight-row {
          background-color: #fff7e6 !important;
        }
        .highlight-row:hover {
          background-color: #fff1d6 !important;
        }
        .editable-row {
          background-color: #fff1f0 !important; /* Orange/red tint for rejected */
        }
        .editable-row:hover {
          background-color: #ffe7e6 !important;
        }
        .deletable-row {
          background-color: #f0f5ff !important; /* Blue tint for deletable */
        }
        .deletable-row:hover {
          background-color: #e6f0ff !important;
        }
      `}</style>
    </div>
  );
};

export default EmployeeCashRequests;






// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Table, 
//   Tag, 
//   Space, 
//   Typography, 
//   Button, 
//   Alert, 
//   Spin, 
//   Modal, 
//   Card,
//   Badge,
//   Tooltip
// } from 'antd';
// import { 
//   FileTextOutlined, 
//   CheckCircleOutlined, 
//   CloseCircleOutlined, 
//   ClockCircleOutlined,
//   PlusOutlined,
//   DollarOutlined,
//   ExclamationCircleOutlined,
//   EyeOutlined,
//   ReloadOutlined
// } from '@ant-design/icons';
// import api from '../../services/api';

// const { Title, Text } = Typography;

// const EmployeeCashRequests = () => {
//   const [requests, setRequests] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [canCreateNewRequest, setCanCreateNewRequest] = useState(false);
//   const navigate = useNavigate();

//   // Fetch cash requests
//   const fetchRequests = useCallback(async () => {
//     try {
//       console.log('Fetching employee cash requests...');
//       const response = await api.get('/cash-requests/employee');
      
//       console.log('Cash requests response:', response.data);
      
//       if (response.data.success) {
//         const employeeRequests = response.data.data || [];
//         setRequests(employeeRequests);
//         checkIfCanCreateNewRequest(employeeRequests);
//       } else {
//         throw new Error(response.data.message || 'Failed to fetch requests');
//       }
//     } catch (error) {
//       console.error('Error fetching cash requests:', error);
//       setError(error.response?.data?.message || 'Failed to fetch cash requests');
//       setRequests([]);
//     }
//   }, []);

//   // Initial data fetch
//   useEffect(() => {
//     const fetchInitialData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         await fetchRequests();
//       } catch (error) {
//         console.error('Error in initial data fetch:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchInitialData();
//   }, [fetchRequests]);

//   const checkIfCanCreateNewRequest = (requests) => {
//     if (requests.length === 0) {
//       setCanCreateNewRequest(true);
//       return;
//     }

//     const sortedRequests = [...requests].sort(
//       (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
//     );

//     const latestRequest = sortedRequests[0];
//     const allowedStatuses = ['completed', 'denied'];
//     const needsJustification = ['disbursed', 'justification_pending_supervisor', 
//                               'justification_pending_finance', 'justification_rejected'];
    
//     const hasPendingJustification = requests.some(r => needsJustification.includes(r.status));
    
//     if (allowedStatuses.includes(latestRequest.status) && !hasPendingJustification) {
//       setCanCreateNewRequest(true);
//     } else {
//       setCanCreateNewRequest(false);
//     }
//   };

//   const showCannotCreateModal = () => {
//     Modal.warning({
//       title: 'Cannot Create New Request',
//       content: (
//         <div>
//           <p>You currently have a pending cash request that requires your attention.</p>
//           <p>Please complete the justification process for your existing request before creating a new one.</p>
//         </div>
//       ),
//       okText: 'View My Requests',
//     });
//   };

//   const handleNewRequestClick = () => {
//     if (canCreateNewRequest) {
//       navigate('/employee/cash-request/new');
//     } else {
//       showCannotCreateModal();
//     }
//   };

//   const handleRefresh = async () => {
//     setLoading(true);
//     await fetchRequests();
//     setLoading(false);
//   };

//   const getStatusTag = (status) => {
//     const statusMap = {
//       'pending_supervisor': { 
//         color: 'orange', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Supervisor' 
//       },
//       'pending_finance': { 
//         color: 'blue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Pending Finance' 
//       },
//       'approved': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Approved' 
//       },
//       'denied': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Denied' 
//       },
//       'rejected': { 
//         color: 'red', 
//         icon: <CloseCircleOutlined />, 
//         text: 'Rejected' 
//       },
//       'disbursed': { 
//         color: 'cyan', 
//         icon: <DollarOutlined />, 
//         text: 'Disbursed - Need Justification' 
//       },
//       'justification_pending_supervisor': { 
//         color: 'purple', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification - Pending Supervisor' 
//       },
//       'justification_pending_finance': { 
//         color: 'geekblue', 
//         icon: <ClockCircleOutlined />, 
//         text: 'Justification - Pending Finance' 
//       },
//       'justification_rejected': { 
//         color: 'red', 
//         icon: <ExclamationCircleOutlined />, 
//         text: 'Justification Rejected' 
//       },
//       'completed': { 
//         color: 'green', 
//         icon: <CheckCircleOutlined />, 
//         text: 'Completed' 
//       }
//     };

//     const statusInfo = statusMap[status] || { 
//       color: 'default', 
//       text: status?.replace('_', ' ') || 'Unknown' 
//     };
    
//     return (
//       <Tag color={statusInfo.color} icon={statusInfo.icon}>
//         {statusInfo.text}
//       </Tag>
//     );
//   };

//   const getActionButtons = (record) => {
//     const buttons = [
//       <Button 
//         type="link" 
//         icon={<EyeOutlined />}
//         onClick={() => navigate(`/employee/cash-request/${record._id}`)}
//         disabled={!record._id}
//         key="view"
//       >
//         View Details
//       </Button>
//     ];

//     if (record.status === 'disbursed') {
//       buttons.push(
//         <Button 
//           type="link" 
//           onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
//           disabled={!record._id}
//           style={{ color: '#1890ff' }}
//           key="justify"
//         >
//           Submit Justification
//         </Button>
//       );
//     }

//     if (record.status === 'justification_rejected') {
//       buttons.push(
//         <Button 
//           type="link" 
//           onClick={() => navigate(`/employee/cash-request/${record._id}/justify`)}
//           disabled={!record._id}
//           style={{ color: '#faad14' }}
//           key="resubmit"
//         >
//           Resubmit Justification
//         </Button>
//       );
//     }

//     return buttons;
//   };

//   const requestColumns = [
//     {
//       title: 'Request ID',
//       dataIndex: '_id',
//       key: '_id',
//       render: (id) => id ? `REQ-${id.slice(-6).toUpperCase()}` : 'N/A',
//       width: 120
//     },
//     {
//       title: 'Amount Requested',
//       dataIndex: 'amountRequested',
//       key: 'amount',
//       render: (amount) => `XAF ${Number(amount || 0).toLocaleString()}`,
//       sorter: (a, b) => (a.amountRequested || 0) - (b.amountRequested || 0),
//       width: 150
//     },
//     {
//       title: 'Type',
//       dataIndex: 'requestType',
//       key: 'type',
//       render: (type) => type ? type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'N/A',
//       width: 120
//     },
//     {
//       title: 'Purpose',
//       dataIndex: 'purpose',
//       key: 'purpose',
//       render: (purpose) => purpose ? (
//         <Tooltip title={purpose}>
//           <Text ellipsis style={{ maxWidth: 200 }}>
//             {purpose.length > 50 ? `${purpose.substring(0, 50)}...` : purpose}
//           </Text>
//         </Tooltip>
//       ) : 'N/A',
//       ellipsis: true
//     },
//     {
//       title: 'Status',
//       dataIndex: 'status',
//       key: 'status',
//       render: (status) => getStatusTag(status),
//       filters: [
//         { text: 'Pending Supervisor', value: 'pending_supervisor' },
//         { text: 'Pending Finance', value: 'pending_finance' },
//         { text: 'Approved', value: 'approved' },
//         { text: 'Disbursed', value: 'disbursed' },
//         { text: 'Completed', value: 'completed' },
//         { text: 'Denied', value: 'denied' },
//       ],
//       onFilter: (value, record) => record.status === value,
//       width: 200
//     },
//     {
//       title: 'Date Submitted',
//       dataIndex: 'createdAt',
//       key: 'date',
//       render: (date) => date ? new Date(date).toLocaleDateString('en-GB') : 'N/A',
//       sorter: (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
//       defaultSortOrder: 'descend',
//       width: 120
//     },
//     {
//       title: 'Actions',
//       key: 'actions',
//       render: (_, record) => (
//         <Space size="small">
//           {getActionButtons(record)}
//         </Space>
//       ),
//       width: 200
//     }
//   ];

//   const totalPending = requests.filter(r => 
//     ['disbursed', 'justification_rejected'].includes(r.status)
//   ).length;

//   if (loading) {
//     return (
//       <div style={{ padding: '24px', textAlign: 'center' }}>
//         <Spin size="large" />
//         <div style={{ marginTop: '16px' }}>Loading your cash requests...</div>
//       </div>
//     );
//   }

//   return (
//     <div style={{ padding: '24px' }}>
//       <Card>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
//           <Title level={2} style={{ margin: 0 }}>
//             <DollarOutlined /> My Cash Requests
//           </Title>
//           <Space>
//             <Button 
//               icon={<ReloadOutlined />}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//             <Button 
//               type="primary" 
//               icon={<PlusOutlined />}
//               onClick={handleNewRequestClick}
//             >
//               New Cash Request
//             </Button>
//           </Space>
//         </div>

//         {error && (
//           <Alert
//             message="Error Loading Data"
//             description={error}
//             type="error"
//             showIcon
//             closable
//             style={{ marginBottom: '16px' }}
//             onClose={() => setError(null)}
//           />
//         )}

//         {totalPending > 0 && (
//           <Alert
//             message={`You have ${totalPending} cash request(s) that need your attention`}
//             type="warning"
//             showIcon
//             style={{ marginBottom: '16px' }}
//             action={
//               <Button size="small" type="primary">
//                 Review Pending
//               </Button>
//             }
//           />
//         )}

//         {requests.length === 0 ? (
//           <Alert
//             message="No Cash Requests Found"
//             description="You haven't submitted any cash requests yet. Click the 'New Cash Request' button to create your first request."
//             type="info"
//             showIcon
//             style={{ marginBottom: '16px' }}
//           />
//         ) : (
//           <Table 
//             columns={requestColumns} 
//             dataSource={requests} 
//             loading={loading}
//             rowKey="_id"
//             pagination={{ 
//               pageSize: 10,
//               showSizeChanger: true,
//               showQuickJumper: true,
//               showTotal: (total, range) => 
//                 `${range[0]}-${range[1]} of ${total} requests`
//             }}
//             scroll={{ x: 'max-content' }}
//             rowClassName={(record) => {
//               const needsAttention = ['disbursed', 'justification_rejected'];
//               if (needsAttention.includes(record.status)) {
//                 return 'highlight-row'; 
//               }
//               return '';
//             }}
//           />
//         )}
//       </Card>

//       <style jsx>{`
//         .highlight-row {
//           background-color: #fff7e6 !important;
//         }
//         .highlight-row:hover {
//           background-color: #fff1d6 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default EmployeeCashRequests;