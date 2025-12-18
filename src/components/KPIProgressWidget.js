import React, { useState, useEffect } from 'react';
import { Card, Progress, Row, Col, Statistic, Tag, Empty } from 'antd';
import { TrophyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { kpiAPI } from '../services/kpiAPI';

const KPIProgressWidget = () => {
  const [kpi, setKpi] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCurrentKPI();
  }, []);

  const loadCurrentKPI = async () => {
    try {
      setLoading(true);
      const result = await kpiAPI.getMyKPIs();
      if (result.success && result.data.length > 0) {
        // Get current quarter KPI
        const current = result.data.find(k => k.quarter === result.currentQuarter);
        setKpi(current);
      }
    } catch (error) {
      console.error('Error loading KPI:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!kpi) {
    return (
      <Card
        title={
          <span>
            <TrophyOutlined style={{ marginRight: '8px' }} />
            Quarterly KPIs
          </span>
        }
        loading={loading}
      >
        <Empty
          description="No KPIs defined for current quarter"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card
      title={
        <span>
          <TrophyOutlined style={{ marginRight: '8px' }} />
          Quarterly KPIs - {kpi.quarter}
        </span>
      }
      extra={
        <Tag color={kpi.approvalStatus === 'approved' ? 'success' : 'warning'}>
          {kpi.approvalStatus.toUpperCase()}
        </Tag>
      }
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        {kpi.kpis.slice(0, 3).map((kpiItem, index) => (
          <Col span={24} key={index}>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{kpiItem.title}</strong>
                <Tag color="blue">{kpiItem.weight}%</Tag>
              </div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Target: {kpiItem.targetValue}
              </div>
            </div>
          </Col>
        ))}
      </Row>
      {kpi.kpis.length > 3 && (
        <div style={{ textAlign: 'center', marginTop: '12px', color: '#1890ff' }}>
          +{kpi.kpis.length - 3} more KPIs
        </div>
      )}
    </Card>
  );
};

export default KPIProgressWidget;