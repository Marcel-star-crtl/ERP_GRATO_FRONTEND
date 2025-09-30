// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { getAlerts, resolveAlert } from '../../services/api';

// export const fetchAlerts = createAsyncThunk(
//   'alerts/fetchAlerts',
//   async () => {
//     const response = await getAlerts();
//     return response.data;
//   }
// );

// export const markAlertResolved = createAsyncThunk(
//   'alerts/markAlertResolved',
//   async (alertId) => {
//     const response = await resolveAlert(alertId);
//     return response.data;
//   }
// );

// const alertSlice = createSlice({
//   name: 'alerts',
//   initialState: {
//     alerts: [],
//     loading: false,
//     error: null,
//   },
//   reducers: {},
//   extraReducers: (builder) => {
//     builder
//       .addCase(fetchAlerts.pending, (state) => {
//         state.loading = true;
//       })
//       .addCase(fetchAlerts.fulfilled, (state, action) => {
//         state.loading = false;
//         state.alerts = action.payload;
//       })
//       .addCase(fetchAlerts.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.error.message;
//       })
//       .addCase(markAlertResolved.fulfilled, (state, action) => {
//         const index = state.alerts.findIndex(
//           (a) => a._id === action.payload._id
//         );
//         if (index !== -1) {
//           state.alerts[index] = action.payload;
//         }
//       });
//   },
// });

// export default alertSlice.reducer;