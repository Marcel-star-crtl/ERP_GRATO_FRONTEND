import React from 'react';
import { Modal, Typography, Space } from 'antd';
import { WarningOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const SignatureRequiredOverlay = ({ visible }) => {
  return (
    <Modal
      open={visible}
      closable={false}
      footer={null}
      centered
      maskClosable={false}
      width={520}
    >
      <Space direction="vertical" size={12} style={{ width: '100%', textAlign: 'center' }}>
        <WarningOutlined style={{ fontSize: 36, color: '#faad14' }} />
        <Title level={4} style={{ marginBottom: 0 }}>Signature Required</Title>
        <Text type="secondary">
          You must submit your signature to IT before you can access any system features.
        </Text>
        <Text type="secondary">
          Please contact IT to complete your signature submission.
        </Text>
      </Space>
    </Modal>
  );
};

export default SignatureRequiredOverlay;
