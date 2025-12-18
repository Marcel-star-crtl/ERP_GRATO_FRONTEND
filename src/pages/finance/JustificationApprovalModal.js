import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  Space,
  Typography,
  Alert,
  Descriptions,
  Table,
  Tag,
  Divider
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  DollarOutlined
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

const JustificationApprovalModal = ({ visible, request, onSubmit, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const disbursed = request.disbursementDetails?.amount || request.totalDisbursed || 0;
  const spent = request.justification?.amountSpent || 0;
  const returned = request.justification?.balanceReturned || 0;
  const isBalanced = Math.abs((spent + returned) - disbursed) < 0.01;

  const itemizedData = request.justification?.itemizedBreakdown || [];
  const documents = request.justification?.documents || [];

  const itemizedColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      width: '50%'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '25%',
      render: (category) => category ? (
        <Tag color="blue">{category.replace(/-/g, ' ').toUpperCase()}</Tag>
      ) : '-'
    },
    {
      title: 'Amount (XAF)',
      dataIndex: 'amount',
      key: 'amount',
      width: '25%',
      render: (amount) => (
        <Text strong style={{ color: '#1890ff' }}>
          {parseFloat(amount).toLocaleString()}
        </Text>
      )
    }
  ];

  const handleSubmit = async () => {
    try {
      await form.validateFields();
      setLoading(true);

      const values = form.getFieldsValue();
      await onSubmit({
        requestId: request._id,
        decision: values.decision,
        comments: values.comments || ''
      });

      form.resetFields();
      setLoading(false);
    } catch (error) {
      console.error('Validation failed:', error);
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>Review Justification</span>
        </Space>
      }
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      confirmLoading={loading}
      width={800}
      okText="Submit Decision"
      cancelText="Cancel"
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Request Info */}
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="Request ID">
            <Tag color="blue">REQ-{request._id?.toString().slice(-6).toUpperCase()}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Employee">
            <Text strong>{request.employee?.fullName}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Disbursed Amount">
            <Text strong style={{ color: '#1890ff' }}>
              XAF {disbursed.toLocaleString()}
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            {isBalanced ? (
              <Tag color="success" icon={<CheckCircleOutlined />}>Balanced</Tag>
            ) : (
              <Tag color="warning" icon={<CloseCircleOutlined />}>Unbalanced</Tag>
            )}
          </Descriptions.Item>
        </Descriptions>

        {/* Financial Summary */}
        <Alert
          message="Financial Summary"
          description={
            <div>
              <Text>Amount Spent: XAF {spent.toLocaleString()}</Text>
              <br />
              <Text>Balance Returned: XAF {returned.toLocaleString()}</Text>
              <br />
              <Text strong>Total: XAF {(spent + returned).toLocaleString()}</Text>
              {!isBalanced && (
                <>
                  <br />
                  <Text type="danger">
                    Discrepancy: XAF {Math.abs((spent + returned) - disbursed).toLocaleString()}
                  </Text>
                </>
              )}
            </div>
          }
          type={isBalanced ? 'success' : 'warning'}
          icon={<DollarOutlined />}
          showIcon
        />

        {/* Justification Details */}
        {request.justification?.details && (
          <div>
            <Text strong>Justification Details:</Text>
            <div style={{ 
              marginTop: '8px', 
              padding: '12px', 
              backgroundColor: '#fafafa',
              borderRadius: '4px',
              border: '1px solid #d9d9d9'
            }}>
              <Text>{request.justification.details}</Text>
            </div>
          </div>
        )}

        {/* Itemized Breakdown */}
        {itemizedData.length > 0 && (
          <div>
            <Text strong>Itemized Expenses:</Text>
            <Table
              dataSource={itemizedData}
              columns={itemizedColumns}
              pagination={false}
              size="small"
              rowKey={(record, index) => index}
              style={{ marginTop: '8px' }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong style={{ color: '#1890ff' }}>
                        XAF {itemizedData.reduce((sum, item) => 
                          sum + parseFloat(item.amount || 0), 0
                        ).toLocaleString()}
                      </Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </div>
        )}

        {/* Documents */}
        {documents.length > 0 && (
          <div>
            <Text strong>Supporting Documents ({documents.length}):</Text>
            <div style={{ marginTop: '8px' }}>
              <Space wrap>
                {documents.map((doc, index) => (
                  <Tag 
                    key={index} 
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    <FileTextOutlined /> {doc.name}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        <Divider style={{ margin: '12px 0' }} />

        {/* Decision Form */}
        <Form form={form} layout="vertical" initialValues={{ decision: 'approved' }}>
          <Form.Item
            name="decision"
            label="Your Decision"
            rules={[{ required: true, message: 'Please make a decision' }]}
          >
            <Radio.Group>
              <Radio.Button value="approved" style={{ color: '#52c41a' }}>
                <CheckCircleOutlined /> Approve Justification
              </Radio.Button>
              <Radio.Button value="rejected" style={{ color: '#f5222d' }}>
                <CloseCircleOutlined /> Request Revision
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="comments"
            label="Comments"
            rules={[{ required: true, message: 'Please provide comments' }]}
          >
            <TextArea
              rows={4}
              placeholder="Provide your feedback..."
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default JustificationApprovalModal;