import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async Thunks
export const fetchCompanySettings = createAsyncThunk(
    'pettyCash/fetchCompanySettings',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/pettycash/company');
            return response.data.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            console.error('Fetch company settings error:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

export const updateCompanySettings = createAsyncThunk(
    'pettyCash/updateCompanySettings',
    async ({ companyId, data }, { rejectWithValue }) => {
        try {
            let requestData;
            let headers = {};

            // Check if data is FormData (contains files) or regular object
            if (data instanceof FormData) {
                requestData = data;
                headers['Content-Type'] = 'multipart/form-data';
            } else {
                // Convert regular object to FormData for consistency
                requestData = new FormData();
                Object.keys(data).forEach(key => {
                    if (data[key] !== undefined && data[key] !== null) {
                        requestData.append(key, data[key]);
                    }
                });
                headers['Content-Type'] = 'multipart/form-data';
            }

            const response = await api.put(`/api/pettycash/company/${companyId}`, requestData, {
                headers
            });

            return response.data.data;
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            console.error('Update company settings error:', errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

export const createTransaction = createAsyncThunk(
    'pettyCash/createTransaction',
    async (transactionData, { rejectWithValue, dispatch }) => {
        try {
            const response = await api.post('/api/pettycash/transactions', transactionData);
            // After a successful transaction, re-fetch the current position and dashboard stats
            dispatch(fetchCurrentPosition());
            dispatch(fetchDashboardStats());
            dispatch(fetchTransactions()); // Re-fetch all transactions to update display tables
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchTransactions = createAsyncThunk(
  'pettyCash/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/pettycash/transactions');
      return response.data; // Changed this from response.data.data to response.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

// Async thunk for deleting a transaction
export const deleteTransaction = createAsyncThunk(
  'pettyCash/deleteTransaction',
  async (transactionId, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.delete(`/api/pettycash/transactions/${transactionId}`);
      // After successful deletion, re-fetch transactions, current position, and dashboard stats
      dispatch(fetchTransactions());
      dispatch(fetchCurrentPosition());
      dispatch(fetchDashboardStats());
      return transactionId; // Return the ID of the deleted transaction
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);


export const fetchCurrentPosition = createAsyncThunk(
    'pettyCash/fetchCurrentPosition',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/pettycash/position');
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

export const fetchDashboardStats = createAsyncThunk(
    'pettyCash/fetchDashboardStats',
    async (_, { rejectWithValue }) => {
        try {
            const response = await api.get('/api/pettycash/dashboard');
            return response.data.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || err.message);
        }
    }
);

// Slice
const pettyCashSlice = createSlice({
    name: 'pettyCash',
    initialState: {
        companySettings: null,
        transactions: [],
        currentPosition: null,
        dashboardStats: null,
        loading: false,
        updating: false,
        saving: false,
        error: null,
        uploadProgress: 0,
        pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: 0
        }
    },
    reducers: {
        resetPettyCashState: (state) => {
            state.companySettings = null;
            state.transactions = [];
            state.currentPosition = null;
            state.dashboardStats = null;
            state.loading = false;
            state.updating = false;
            state.saving = false;
            state.error = null;
            state.uploadProgress = 0;
        },
        setUploadProgress: (state, action) => {
            state.uploadProgress = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Company Settings
            .addCase(fetchCompanySettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCompanySettings.fulfilled, (state, action) => {
                state.loading = false;
                state.companySettings = action.payload;
                state.error = null;
            })
            .addCase(fetchCompanySettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Update Company Settings
            .addCase(updateCompanySettings.pending, (state) => {
                state.updating = true;
                state.error = null;
                state.uploadProgress = 0;
            })
            .addCase(updateCompanySettings.fulfilled, (state, action) => {
                state.updating = false;
                state.companySettings = action.payload;
                state.uploadProgress = 100;
                state.error = null;
            })
            .addCase(updateCompanySettings.rejected, (state, action) => {
                state.updating = false;
                state.error = action.payload;
                state.uploadProgress = 0;
            })

            // Transactions
            .addCase(createTransaction.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(createTransaction.fulfilled, (state, action) => {
                state.saving = false;
                // Since fetchTransactions is dispatched, no need to manually unshift here
                state.error = null;
            })
            .addCase(createTransaction.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })

            .addCase(fetchTransactions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchTransactions.fulfilled, (state, action) => {
                state.loading = false;
                state.transactions = action.payload.data; // This now correctly accesses action.payload.data
                state.pagination = {
                    currentPage: action.payload.pagination.currentPage, // This now correctly accesses action.payload.pagination.currentPage
                    totalPages: action.payload.pagination.totalPages,
                    totalItems: action.payload.pagination.totalItems
                };
                state.error = null;
            })
            .addCase(fetchTransactions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Delete Transaction
            .addCase(deleteTransaction.pending, (state) => {
                state.saving = true;
                state.error = null;
            })
            .addCase(deleteTransaction.fulfilled, (state, action) => {
                state.saving = false;
                // The `fetchTransactions()` call in the thunk will update the list,
                // so no need to filter manually here.
                state.error = null;
            })
            .addCase(deleteTransaction.rejected, (state, action) => {
                state.saving = false;
                state.error = action.payload;
            })

            // Position (currentPosition)
            .addCase(fetchCurrentPosition.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCurrentPosition.fulfilled, (state, action) => {
                state.loading = false;
                state.currentPosition = action.payload;
                state.error = null;
            })
            .addCase(fetchCurrentPosition.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Dashboard Stats
            .addCase(fetchDashboardStats.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchDashboardStats.fulfilled, (state, action) => {
                state.loading = false;
                state.dashboardStats = action.payload;
                state.error = null;
            })
            .addCase(fetchDashboardStats.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { resetPettyCashState, setUploadProgress, clearError } = pettyCashSlice.actions;
export default pettyCashSlice.reducer;










// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import api from '../../services/api';

// // Helper function for consistent error handling
// const handleApiError = (error) => {
//   const errorMessage = error.response?.data?.message || error.message;
//   console.error('API Error:', errorMessage);
//   return errorMessage;
// };

// // Async Thunks
// export const fetchCompanySettings = createAsyncThunk(
//   'pettyCash/fetchCompanySettings',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/api/pettycash/company');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const updateCompanySettings = createAsyncThunk(
//   'pettyCash/updateCompanySettings',
//   async ({ companyId, data }, { rejectWithValue }) => {
//     try {
//       const requestData = data instanceof FormData ? data : (() => {
//         const formData = new FormData();
//         Object.entries(data).forEach(([key, value]) => {
//           if (value !== undefined && value !== null) {
//             formData.append(key, value);
//           }
//         });
//         return formData;
//       })();

//       const response = await api.put(`/api/pettycash/company/${companyId}`, requestData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const createTransaction = createAsyncThunk(
//   'pettyCash/createTransaction',
//   async (transactionData, { rejectWithValue, dispatch }) => {
//     try {
//       const response = await api.post('/api/pettycash/transactions', {
//         ...transactionData,
//         date: transactionData.date.format('YYYY-MM-DD')
//       });

//       // Dispatch all necessary updates in parallel
//       await Promise.all([
//         dispatch(fetchCurrentPosition()),
//         dispatch(fetchDashboardStats()),
//         dispatch(fetchTransactions())
//       ]);

//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const fetchTransactions = createAsyncThunk(
//   'pettyCash/fetchTransactions',
//   async (params = {}, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/api/pettycash/transactions', { params });
//       return {
//         data: response.data.data,
//         pagination: response.data.pagination
//       };
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const deleteTransaction = createAsyncThunk(
//   'pettyCash/deleteTransaction',
//   async (transactionId, { rejectWithValue, dispatch }) => {
//     try {
//       await api.delete(`/api/pettycash/transactions/${transactionId}`);
      
//       // Refresh all relevant data
//       await Promise.all([
//         dispatch(fetchCurrentPosition()),
//         dispatch(fetchDashboardStats()),
//         dispatch(fetchTransactions())
//       ]);
      
//       return transactionId;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const fetchCurrentPosition = createAsyncThunk(
//   'pettyCash/fetchCurrentPosition',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/api/pettycash/position');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// export const fetchDashboardStats = createAsyncThunk(
//   'pettyCash/fetchDashboardStats',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/api/pettycash/dashboard');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(handleApiError(err));
//     }
//   }
// );

// // Slice with improved state structure
// const pettyCashSlice = createSlice({
//   name: 'pettyCash',
//   initialState: {
//     companySettings: {
//       data: null,
//       loading: false,
//       error: null
//     },
//     transactions: {
//       data: [],
//       loading: false,
//       error: null,
//       pagination: {
//         currentPage: 1,
//         totalPages: 1,
//         totalItems: 0
//       }
//     },
//     currentPosition: {
//       data: null,
//       loading: false,
//       error: null,
//       lastUpdated: null
//     },
//     dashboardStats: {
//       data: null,
//       loading: false,
//       error: null
//     },
//     operationStatus: {
//       saving: false,
//       updating: false,
//       deleting: false,
//       uploadProgress: 0
//     }
//   },
//   reducers: {
//     resetPettyCashState: (state) => {
//       state.companySettings = { data: null, loading: false, error: null };
//       state.transactions = { 
//         data: [], 
//         loading: false, 
//         error: null,
//         pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }
//       };
//       state.currentPosition = { data: null, loading: false, error: null, lastUpdated: null };
//       state.dashboardStats = { data: null, loading: false, error: null };
//       state.operationStatus = { saving: false, updating: false, deleting: false, uploadProgress: 0 };
//     },
//     setUploadProgress: (state, action) => {
//       state.operationStatus.uploadProgress = action.payload;
//     },
//     clearError: (state) => {
//       state.companySettings.error = null;
//       state.transactions.error = null;
//       state.currentPosition.error = null;
//       state.dashboardStats.error = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // Company Settings
//       .addCase(fetchCompanySettings.pending, (state) => {
//         state.companySettings.loading = true;
//         state.companySettings.error = null;
//       })
//       .addCase(fetchCompanySettings.fulfilled, (state, action) => {
//         state.companySettings.loading = false;
//         state.companySettings.data = action.payload;
//       })
//       .addCase(fetchCompanySettings.rejected, (state, action) => {
//         state.companySettings.loading = false;
//         state.companySettings.error = action.payload;
//       })

//       // Update Company Settings
//       .addCase(updateCompanySettings.pending, (state) => {
//         state.operationStatus.updating = true;
//         state.companySettings.error = null;
//         state.operationStatus.uploadProgress = 0;
//       })
//       .addCase(updateCompanySettings.fulfilled, (state, action) => {
//         state.operationStatus.updating = false;
//         state.companySettings.data = action.payload;
//         state.operationStatus.uploadProgress = 100;
//       })
//       .addCase(updateCompanySettings.rejected, (state, action) => {
//         state.operationStatus.updating = false;
//         state.companySettings.error = action.payload;
//         state.operationStatus.uploadProgress = 0;
//       })

//       // Transactions
//       .addCase(createTransaction.pending, (state) => {
//         state.operationStatus.saving = true;
//         state.transactions.error = null;
//       })
//       .addCase(createTransaction.fulfilled, (state) => {
//         state.operationStatus.saving = false;
//       })
//       .addCase(createTransaction.rejected, (state, action) => {
//         state.operationStatus.saving = false;
//         state.transactions.error = action.payload;
//       })

//       // Fetch Transactions
//       .addCase(fetchTransactions.pending, (state) => {
//         state.transactions.loading = true;
//         state.transactions.error = null;
//       })
//       .addCase(fetchTransactions.fulfilled, (state, action) => {
//         state.transactions.loading = false;
//         state.transactions.data = action.payload.data;
//         state.transactions.pagination = action.payload.pagination;
//       })
//       .addCase(fetchTransactions.rejected, (state, action) => {
//         state.transactions.loading = false;
//         state.transactions.error = action.payload;
//       })

//       // Delete Transaction
//       .addCase(deleteTransaction.pending, (state) => {
//         state.operationStatus.deleting = true;
//         state.transactions.error = null;
//       })
//       .addCase(deleteTransaction.fulfilled, (state) => {
//         state.operationStatus.deleting = false;
//       })
//       .addCase(deleteTransaction.rejected, (state, action) => {
//         state.operationStatus.deleting = false;
//         state.transactions.error = action.payload;
//       })

//       // Current Position
//       .addCase(fetchCurrentPosition.pending, (state) => {
//         state.currentPosition.loading = true;
//         state.currentPosition.error = null;
//       })
//       .addCase(fetchCurrentPosition.fulfilled, (state, action) => {
//         state.currentPosition.loading = false;
//         state.currentPosition.data = action.payload;
//         state.currentPosition.lastUpdated = new Date().toISOString();
//       })
//       .addCase(fetchCurrentPosition.rejected, (state, action) => {
//         state.currentPosition.loading = false;
//         state.currentPosition.error = action.payload;
//       })

//       // Dashboard Stats
//       .addCase(fetchDashboardStats.pending, (state) => {
//         state.dashboardStats.loading = true;
//         state.dashboardStats.error = null;
//       })
//       .addCase(fetchDashboardStats.fulfilled, (state, action) => {
//         state.dashboardStats.loading = false;
//         state.dashboardStats.data = action.payload;
//       })
//       .addCase(fetchDashboardStats.rejected, (state, action) => {
//         state.dashboardStats.loading = false;
//         state.dashboardStats.error = action.payload;
//       });
//   }
// });

// export const { resetPettyCashState, setUploadProgress, clearError } = pettyCashSlice.actions;
// export default pettyCashSlice.reducer;









// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import api from '../../services/api';

// // Async Thunks
// export const fetchCompanySettings = createAsyncThunk(
//   'pettyCash/fetchCompanySettings',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/pettycash/company');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// export const updateCompanySettings = createAsyncThunk(
//   'pettyCash/updateCompanySettings',
//   async ({ companyId, data }, { rejectWithValue }) => {
//     try {
//       const response = await api.put(`/pettycash/company/${companyId}`, data);
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// export const createTransaction = createAsyncThunk(
//   'pettyCash/createTransaction',
//   async (transactionData, { rejectWithValue }) => {
//     try {
//       const response = await api.post('/pettycash/transactions', transactionData);
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// export const fetchTransactions = createAsyncThunk(
//   'pettyCash/fetchTransactions',
//   async (params, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/pettycash/transactions', { params });
//       return response.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// export const fetchCurrentPosition = createAsyncThunk(
//   'pettyCash/fetchCurrentPosition',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/pettycash/position');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// export const fetchDashboardStats = createAsyncThunk(
//   'pettyCash/fetchDashboardStats',
//   async (_, { rejectWithValue }) => {
//     try {
//       const response = await api.get('/pettycash/dashboard');
//       return response.data.data;
//     } catch (err) {
//       return rejectWithValue(err.response.data.message);
//     }
//   }
// );

// // Slice
// const pettyCashSlice = createSlice({
//   name: 'pettyCash',
//   initialState: {
//     companySettings: null,
//     transactions: [],
//     currentPosition: null,
//     dashboardStats: null,
//     loading: false,
//     error: null,
//     pagination: {
//       currentPage: 1,
//       totalPages: 1,
//       totalItems: 0
//     }
//   },
//   reducers: {
//     resetPettyCashState: (state) => {
//       state.companySettings = null;
//       state.transactions = [];
//       state.currentPosition = null;
//       state.dashboardStats = null;
//       state.loading = false;
//       state.error = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       // Company Settings
//       .addCase(fetchCompanySettings.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCompanySettings.fulfilled, (state, action) => {
//         state.loading = false;
//         state.companySettings = action.payload;
//       })
//       .addCase(fetchCompanySettings.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(updateCompanySettings.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(updateCompanySettings.fulfilled, (state, action) => {
//         state.loading = false;
//         state.companySettings = action.payload;
//       })
//       .addCase(updateCompanySettings.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       // Transactions
//       .addCase(createTransaction.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(createTransaction.fulfilled, (state, action) => {
//         state.loading = false;
//         state.transactions.unshift(action.payload);
//       })
//       .addCase(createTransaction.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchTransactions.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchTransactions.fulfilled, (state, action) => {
//         state.loading = false;
//         state.transactions = action.payload.data;
//         state.pagination = {
//           currentPage: action.payload.pagination.currentPage,
//           totalPages: action.payload.pagination.totalPages,
//           totalItems: action.payload.pagination.totalItems
//         };
//       })
//       .addCase(fetchTransactions.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
      
//       // Position & Dashboard
//       .addCase(fetchCurrentPosition.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchCurrentPosition.fulfilled, (state, action) => {
//         state.loading = false;
//         state.currentPosition = action.payload;
//       })
//       .addCase(fetchCurrentPosition.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       })
//       .addCase(fetchDashboardStats.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(fetchDashboardStats.fulfilled, (state, action) => {
//         state.loading = false;
//         state.dashboardStats = action.payload;
//       })
//       .addCase(fetchDashboardStats.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });
//   }
// });

// export const { resetPettyCashState } = pettyCashSlice.actions;
// export default pettyCashSlice.reducer;