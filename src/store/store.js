import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import alertReducer from '../features/alerts/alertSlice';
import userReducer from '../features/user/userSlice';
import pettyCashReducer from '../features/pettyCash/pettyCashSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    alerts: alertReducer,
    user: userReducer,
    pettyCash: pettyCashReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});