import { useEffect, useState } from 'react';
import { Modal, Typography, List, Tag } from 'antd';
import { ExclamationCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const QuarterlyKpiNotice = ({ user }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!user || user.role === 'supplier') return;

    const kpiStatus = user.kpiStatus;
    if (!kpiStatus) return;

    const storageKey = 'kpi_notice_seen';
    const seen = sessionStorage.getItem(storageKey);
    if (seen) return;

    setVisible(true);
    sessionStorage.setItem(storageKey, '1');
  }, [user]);

  if (!user || user.role === 'supplier' || !user.kpiStatus) return null;

  const { hasKpi, isSubmitted, quarter } = user.kpiStatus;
  const isMissing = !hasKpi || !isSubmitted;

  return (
    <Modal
      open={visible}
      onOk={() => setVisible(false)}
      onCancel={() => setVisible(false)}
      okText="Got it"
      cancelButtonProps={{ style: { display: 'none' } }}
      title={
        <span>
          {isMissing ? (
            <ExclamationCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />
          ) : (
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
          )}
          Quarterly Performance Notice
        </span>
      }
    >
      <Title level={5} style={{ marginTop: 0 }}>
        {isMissing ? 'KPI Submission Required' : 'Quarter Projects Ready'}
      </Title>

      <Text>
        Quarter <Tag color="blue">{quarter}</Tag> ends in <Tag color="red">June</Tag>.
      </Text>

      <List
        size="small"
        style={{ marginTop: 12 }}
        dataSource={
          isMissing
            ? [
                'You have not submitted your KPI for this quarter.',
                'All employees without KPIs or completed tasks will have no performance score.',
                'Submit your KPI to unlock task creation and assignment tracking.'
              ]
            : [
                'Projects have been created for the quarter and are awaiting task creation and assignments.',
                'Quarterly performance is driven by task completion for all employees.',
                'Keep tasks updated to ensure accurate performance scoring.'
              ]
        }
        renderItem={(item) => <List.Item>• {item}</List.Item>}
      />
    </Modal>
  );
};

export default QuarterlyKpiNotice;
