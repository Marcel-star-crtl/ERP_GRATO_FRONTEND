import { theme } from 'antd';

export const customTheme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 4,
    colorBgContainer: '#ffffff',
  },
  components: {
    Button: {
      colorPrimary: '#1890ff',
      algorithm: true,
    },
    Table: {
      headerBg: '#f0f0f0',
      headerColor: '#333',
      algorithm: true,
    },
    Card: {
      headerBg: '#f0f0f0',
      algorithm: true,
    },
  },
};