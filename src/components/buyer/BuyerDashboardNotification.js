import React, { useState, useEffect } from 'react';
import { Badge, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { pettyCashAPI } from '../../services/pettyCashAPI';

const BuyerDashboardNotification = () => {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadPendingCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(loadPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadPendingCount = async () => {
    try {
      const response = await pettyCashAPI.getBuyerPettyCashStats();
      
      if (response.success) {
        setPendingCount(response.data.pendingDownload || 0);
      }
    } catch (error) {
      console.error('Error loading pending count:', error);
    }
  };

  return (
    <Badge count={pendingCount} offset={[10, 0]}>
      <FileTextOutlined style={{ fontSize: '20px' }} />
    </Badge>
  );
};

export default BuyerDashboardNotification;