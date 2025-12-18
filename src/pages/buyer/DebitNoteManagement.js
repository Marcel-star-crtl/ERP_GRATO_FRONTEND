// components/buyer/DebitNoteManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, Select,
  message, Tag, Tooltip, Descriptions, Timeline, Spin, InputNumber
} from 'antd';
import {
  FileTextOutlined, PlusOutlined, DownloadOutlined,
  FilePdfOutlined, ShareAltOutlined, EyeOutlined
} from '@ant-design/icons';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
import moment from 'moment';

const { TextArea } = Input;
const { Option } = Select;

const DebitNoteManagement = () => {
  const [debitNotes, setDebitNotes] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const [form] = Form.useForm();

  useEffect(() => {
    loadDebitNotes();
    loadPurchaseOrders();
  }, []);

  const loadDebitNotes = async () => {
    try {
      setLoading(true);
      const response = await buyerRequisitionAPI.getDebitNotes();
      if (response.success) {
        setDebitNotes(response.data);
      }
    } catch (error) {
      message.error('Failed to load debit notes');
    } finally {
      setLoading(false);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const response = await buyerRequisitionAPI.getPurchaseOrders({
        status: 'delivered,completed'
      });
      if (response.success) {
        setPurchaseOrders(response.data);
      }
    } catch (error) {
      console.error('Failed to load purchase orders:', error);
    }
  };

  const handleCreateDebitNote = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await buyerRequisitionAPI.createDebitNote(values);

      if (response.success) {
        message.success('Debit note created and sent for approval');
        setCreateModalVisible(false);
        form.resetFields();
        loadDebitNotes();
      }
    } catch (error) {
      message.error(error.message || 'Failed to create debit note');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (debitNote) => {
    try {
      setLoading(true);
      const response = await buyerRequisitionAPI.getDebitNoteDetails(debitNote._id);
      if (response.success) {
        setSelectedDebitNote(response.data.debitNote);
        setDetailsModalVisible(true);
      }
    } catch (error) {
      message.error('Failed to load debit note details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (debitNote) => {
    try {
      setPdfLoading(true);
      await buyerRequisitionAPI.downloadDebitNotePDF(debitNote._id);
      message.success('Debit note PDF downloaded');
    } catch (error) {
      message.error('Failed to download PDF');
    } finally {
      setPdfLoading(false);
    }
  };

  const handlePreviewPDF = async (debitNote) => {
    try {
      await buyerRequisitionAPI.previewDebitNotePDF(debitNote._id);
    } catch (error) {
      message.error('Failed to preview PDF');
    }
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'draft': { color: 'default', text: 'Draft' },
      'pending_approval': { color: 'orange', text: 'Pending Approval' },
      'approved': { color: 'blue', text: 'Approved' },
      'sent_to_supplier': { color: 'purple', text: 'Sent to Supplier' },
      'acknowledged': { color: 'green', text: 'Acknowledged' },
      'rejected': { color: 'red', text: 'Rejected' }
    };
    const info = statusMap[status] || { color: 'default', text: status };
    return <Tag color={info.color}>{info.text}</Tag>;
  };

  const columns = [
    {
      title: 'Debit Note #',
      dataIndex: 'debitNoteNumber',
      key: 'debitNoteNumber',
      render: (text) => <strong>{text}</strong>
    },
    {
      title: 'PO Reference',
      key: 'poReference',
      render: (_, record) => record.purchaseOrderId?.poNumber || 'N/A'
    },
    {
      title: 'Supplier',
      key: 'supplier',
      render: (_, record) => record.supplierDetails?.name || 'N/A'
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => reason.replace(/_/g, ' ').toUpperCase()
    },
    {
      title: 'Debit Amount',
      dataIndex: 'debitAmount',
      key: 'debitAmount',
      render: (amount, record) => (
        <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
          {record.currency} {amount.toLocaleString()}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).format('MMM DD, YYYY')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              loading={pdfLoading}
              onClick={() => handleDownloadPDF(record)}
            />
          </Tooltip>
          <Tooltip title="Preview PDF">
            <Button
              size="small"
              icon={<FilePdfOutlined />}
              onClick={() => handlePreviewPDF(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h2><FileTextOutlined /> Debit Note Management</h2>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setCreateModalVisible(true)}
          >
            Create Debit Note
          </Button>
        </div>

        <Table
          columns={columns}
          dataSource={debitNotes}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Create Debit Note"
        open={createModalVisible}
        onOk={handleCreateDebitNote}
        onCancel={() => setCreateModalVisible(false)}
        confirmLoading={loading}
        width={700}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="purchaseOrderId"
            label="Purchase Order"
            rules={[{ required: true, message: 'Please select a purchase order' }]}
          >
            <Select placeholder="Select PO">
              {purchaseOrders.map(po => (
                <Option key={po.id} value={po.id}>
                  {po.poNumber} - {po.supplierName} ({po.currency} {po.totalAmount.toLocaleString()})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select reason">
              <Option value="shortage">Shortage</Option>
              <Option value="damaged_goods">Damaged Goods</Option>
              <Option value="pricing_error">Pricing Error</Option>
              <Option value="quality_issue">Quality Issue</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={4} placeholder="Describe the issue..." />
          </Form.Item>

          <Form.Item
            name="debitAmount"
            label="Debit Amount"
            rules={[{ required: true, message: 'Please enter debit amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={0}
              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/\$\s?|(,*)/g, '')}
              placeholder="Enter amount to debit"
            />
          </Form.Item>
        </Form>
        </Modal>

      {/* Details Modal */}
      <Modal
        title={`Debit Note Details - ${selectedDebitNote?.debitNoteNumber}`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="download"
            icon={<DownloadOutlined />}
            loading={pdfLoading}
            onClick={() => handleDownloadPDF(selectedDebitNote)}
          >
            Download PDF
          </Button>,
          <Button
            key="preview"
            type="primary"
            icon={<FilePdfOutlined />}
            onClick={() => handlePreviewPDF(selectedDebitNote)}
          >
            Preview PDF
          </Button>
        ]}
        width={800}
      >
        {selectedDebitNote && (
          <div>
            {/* Basic Info */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Debit Note #" span={2}>
                <strong>{selectedDebitNote.debitNoteNumber}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="PO Reference">
                {selectedDebitNote.purchaseOrderId?.poNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                {getStatusTag(selectedDebitNote.status)}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {selectedDebitNote.supplierDetails?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier Email">
                {selectedDebitNote.supplierDetails?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedDebitNote.reason.replace(/_/g, ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedDebitNote.description}
              </Descriptions.Item>
              <Descriptions.Item label="Original Amount">
                {selectedDebitNote.currency} {selectedDebitNote.originalAmount.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Debit Amount">
                <span style={{ color: '#f5222d', fontWeight: 'bold', fontSize: '16px' }}>
                  {selectedDebitNote.currency} {selectedDebitNote.debitAmount.toLocaleString()}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {moment(selectedDebitNote.createdAt).format('MMM DD, YYYY HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="Created By">
                {selectedDebitNote.createdBy?.fullName}
              </Descriptions.Item>
            </Descriptions>

            {/* Approval Chain */}
            {selectedDebitNote.approvalChain && selectedDebitNote.approvalChain.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3>Approval Chain</h3>
                <Timeline>
                  {selectedDebitNote.approvalChain.map((step, index) => {
                    const getStepColor = () => {
                      if (step.status === 'approved') return 'green';
                      if (step.status === 'rejected') return 'red';
                      return 'blue';
                    };

                    const getStepIcon = () => {
                      if (step.status === 'approved') return '✓';
                      if (step.status === 'rejected') return '✗';
                      return '⏳';
                    };

                    return (
                      <Timeline.Item
                        key={index}
                        color={getStepColor()}
                        dot={<span style={{ fontSize: '16px' }}>{getStepIcon()}</span>}
                      >
                        <div>
                          <strong>Level {step.level}: {step.approver.name}</strong>
                          <br />
                          <span style={{ fontSize: '12px', color: '#666' }}>
                            {step.approver.role} - {step.approver.department}
                          </span>
                          <br />
                          {step.status === 'approved' && (
                            <Tag color="green" style={{ marginTop: '4px' }}>
                              Approved on {moment(step.actionDate).format('MMM DD, YYYY HH:mm')}
                            </Tag>
                          )}
                          {step.status === 'rejected' && (
                            <Tag color="red" style={{ marginTop: '4px' }}>
                              Rejected on {moment(step.actionDate).format('MMM DD, YYYY HH:mm')}
                            </Tag>
                          )}
                          {step.status === 'pending' && (
                            <Tag color="orange" style={{ marginTop: '4px' }}>
                              Pending Approval
                            </Tag>
                          )}
                          {step.comments && (
                            <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                              <strong>Comments:</strong> {step.comments}
                            </div>
                          )}
                        </div>
                      </Timeline.Item>
                    );
                  })}
                </Timeline>
              </div>
            )}

            {/* Supplier Acknowledgment */}
            {selectedDebitNote.supplierAcknowledgment?.acknowledged && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: '4px' }}>
                <h4 style={{ color: '#52c41a', marginTop: 0 }}>
                  ✓ Supplier Acknowledged
                </h4>
                <p>
                  <strong>Acknowledged By:</strong> {selectedDebitNote.supplierAcknowledgment.acknowledgedBy}
                </p>
                <p>
                  <strong>Date:</strong> {moment(selectedDebitNote.supplierAcknowledgment.acknowledgedDate).format('MMM DD, YYYY HH:mm')}
                </p>
                {selectedDebitNote.supplierAcknowledgment.comments && (
                  <p>
                    <strong>Comments:</strong> {selectedDebitNote.supplierAcknowledgment.comments}
                  </p>
                )}
              </div>
            )}

            {/* Activities */}
            {selectedDebitNote.activities && selectedDebitNote.activities.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3>Activity History</h3>
                <Timeline>
                  {selectedDebitNote.activities.map((activity, index) => (
                    <Timeline.Item key={index}>
                      <div>
                        <strong>{activity.description}</strong>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {activity.user} - {moment(activity.timestamp).format('MMM DD, YYYY HH:mm')}
                        </span>
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DebitNoteManagement;