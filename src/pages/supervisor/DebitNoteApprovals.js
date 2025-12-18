// components/supervisor/DebitNoteApprovals.jsx

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Modal, Form, Input, message,
  Tag, Tooltip, Descriptions, Alert, Spin
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, EyeOutlined,
  DownloadOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { buyerRequisitionAPI } from '../../services/buyerRequisitionAPI';
import moment from 'moment';

const { TextArea } = Input;

const DebitNoteApprovals = () => {
  const [debitNotes, setDebitNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState(null);
  const [approvalDecision, setApprovalDecision] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  
  const [form] = Form.useForm();

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await buyerRequisitionAPI.getPendingDebitNoteApprovals();
      if (response.success) {
        setDebitNotes(response.data);
      }
    } catch (error) {
      message.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApprovalModal = (debitNote, decision) => {
    setSelectedDebitNote(debitNote);
    setApprovalDecision(decision);
    setApprovalModalVisible(true);
    form.resetFields();
  };

  const handleProcessApproval = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const response = await buyerRequisitionAPI.processDebitNoteApproval(
        selectedDebitNote._id,
        {
          decision: approvalDecision,
          comments: values.comments
        }
      );

      if (response.success) {
        message.success(
          `Debit note ${approvalDecision === 'approved' ? 'approved' : 'rejected'} successfully`
        );
        setApprovalModalVisible(false);
        form.resetFields();
        loadPendingApprovals();
      }
    } catch (error) {
      message.error(error.message || 'Failed to process approval');
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

  const getCurrentApprovalLevel = (debitNote) => {
    const currentStep = debitNote.approvalChain?.find(
      step => step.level === debitNote.currentApprovalLevel
    );
    return currentStep;
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
      render: (reason) => (
        <Tag color="red">{reason.replace(/_/g, ' ').toUpperCase()}</Tag>
      )
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
      title: 'Your Level',
      key: 'approvalLevel',
      render: (_, record) => {
        const currentStep = getCurrentApprovalLevel(record);
        return currentStep ? (
          <Tag color="blue">Level {currentStep.level}</Tag>
        ) : null;
      }
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => moment(date).fromNow()
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small" direction="vertical">
          <Space size="small">
            <Tooltip title="Approve">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleOpenApprovalModal(record, 'approved')}
              >
                Approve
              </Button>
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleOpenApprovalModal(record, 'rejected')}
              >
                Reject
              </Button>
            </Tooltip>
          </Space>
          <Space size="small">
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
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <h2>
            <CheckCircleOutlined /> Debit Note Approvals
          </h2>
          <Alert
            message="Review Required"
            description="Please review and approve/reject the following debit notes."
            type="info"
            showIcon
            style={{ marginTop: '16px' }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={debitNotes}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{
            emptyText: 'No pending debit note approvals'
          }}
        />
      </Card>

      {/* Approval/Rejection Modal */}
      <Modal
        title={
          approvalDecision === 'approved'
            ? `Approve Debit Note - ${selectedDebitNote?.debitNoteNumber}`
            : `Reject Debit Note - ${selectedDebitNote?.debitNoteNumber}`
        }
        open={approvalModalVisible}
        onOk={handleProcessApproval}
        onCancel={() => setApprovalModalVisible(false)}
        confirmLoading={loading}
        okText={approvalDecision === 'approved' ? 'Approve' : 'Reject'}
        okButtonProps={{
          danger: approvalDecision === 'rejected'
        }}
        width={700}
      >
        {selectedDebitNote && (
          <div>
            <Alert
              message={
                approvalDecision === 'approved'
                  ? 'Approve Debit Note'
                  : 'Reject Debit Note'
              }
              description={
                approvalDecision === 'approved'
                  ? 'By approving, you confirm that this debit note is valid and should proceed to the next approval level.'
                  : 'Please provide a reason for rejecting this debit note.'
              }
              type={approvalDecision === 'approved' ? 'success' : 'error'}
              showIcon
              style={{ marginBottom: '24px' }}
            />

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Debit Note #" span={2}>
                <strong>{selectedDebitNote.debitNoteNumber}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="PO Reference">
                {selectedDebitNote.purchaseOrderId?.poNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">
                {selectedDebitNote.supplierDetails?.name}
              </Descriptions.Item>
              <Descriptions.Item label="Reason" span={2}>
                {selectedDebitNote.reason.replace(/_/g, ' ').toUpperCase()}
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>
                {selectedDebitNote.description}
              </Descriptions.Item>
              <Descriptions.Item label="Original Amount">
                {selectedDebitNote.currency} {selectedDebitNote.originalAmount?.toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Debit Amount">
                <span style={{ color: '#f5222d', fontWeight: 'bold' }}>
                  {selectedDebitNote.currency} {selectedDebitNote.debitAmount?.toLocaleString()}
                </span>
              </Descriptions.Item>
            </Descriptions>

            <Form form={form} layout="vertical" style={{ marginTop: '24px' }}>
              <Form.Item
                name="comments"
                label={approvalDecision === 'approved' ? 'Comments (Optional)' : 'Rejection Reason'}
                rules={[
                  {
                    required: approvalDecision === 'rejected',
                    message: 'Please provide a reason for rejection'
                  }
                ]}
              >
                <TextArea
                  rows={4}
                  placeholder={
                    approvalDecision === 'approved'
                      ? 'Add any comments or notes...'
                      : 'Please explain why you are rejecting this debit note...'
                  }
                />
              </Form.Item>
            </Form>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DebitNoteApprovals;