// import { useSelector, useDispatch } from 'react-redux';
// import { 
//   fetchCompanySettings, 
//   updateCompanySettings,
//   createTransaction,
//   fetchTransactions,
//   fetchCurrentPosition,
//   fetchDashboardStats,
//   resetPettyCashState
// } from './pettyCashSlice';

// export const useCompanySettings = () => {
//   const dispatch = useDispatch();
//   const { companySettings, loading, error } = useSelector((state) => state.pettyCash);

//   const getCompanySettings = () => {
//     dispatch(fetchCompanySettings());
//   };

//   const updateSettings = (companyId, data) => {
//     return dispatch(updateCompanySettings({ companyId, data })).unwrap();
//   };

//   return { companySettings, loading, error, getCompanySettings, updateSettings };
// };

// export const useTransactions = () => {
//   const dispatch = useDispatch();
//   const { transactions, loading, error, pagination } = useSelector((state) => state.pettyCash);

//   const getTransactions = (params) => {
//     dispatch(fetchTransactions(params));
//   };

//   const addTransaction = (transactionData) => {
//     return dispatch(createTransaction(transactionData)).unwrap();
//   };

//   return { transactions, loading, error, pagination, getTransactions, addTransaction };
// };

// export const usePettyCashPosition = () => {
//   const dispatch = useDispatch();
//   const { currentPosition, loading, error } = useSelector((state) => state.pettyCash);

//   const getCurrentPosition = () => {
//     dispatch(fetchCurrentPosition());
//   };

//   return { currentPosition, loading, error, getCurrentPosition };
// };

// export const useDashboardStats = () => {
//   const dispatch = useDispatch();
//   const { dashboardStats, loading, error } = useSelector((state) => state.pettyCash);

//   const getDashboardStats = () => {
//     dispatch(fetchDashboardStats());
//   };

//   return { dashboardStats, loading, error, getDashboardStats };
// };

// export const useResetPettyCash = () => {
//   const dispatch = useDispatch();
//   return () => dispatch(resetPettyCashState());
// };









import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCompanySettings, 
  updateCompanySettings,
  createTransaction,
  fetchTransactions,
  fetchCurrentPosition,
  fetchDashboardStats,
  resetPettyCashState
} from './pettyCashSlice';

export const useCompanySettings = () => {
  const dispatch = useDispatch();
  const { companySettings, loading, error, updating } = useSelector((state) => state.pettyCash);

  const getCompanySettings = () => {
    dispatch(fetchCompanySettings());
  };

  const updateSettings = async (companyId, data, documents = []) => {
    try {
      const result = await dispatch(
        updateCompanySettings({ companyId, data, documents })
      ).unwrap();
      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err };
    }
  };

  return { 
    companySettings, 
    loading, 
    error, 
    updating,
    getCompanySettings, 
    updateSettings 
  };
};

export const useTransactions = () => {
  const dispatch = useDispatch();
  const { transactions, loading, error, pagination } = useSelector((state) => state.pettyCash);

  const getTransactions = (params) => {
    dispatch(fetchTransactions(params));
  };

  const addTransaction = (transactionData) => {
    return dispatch(createTransaction(transactionData)).unwrap();
  };

  return { transactions, loading, error, pagination, getTransactions, addTransaction };
};

export const usePettyCashPosition = () => {
  const dispatch = useDispatch();
  const { currentPosition, loading, error } = useSelector((state) => state.pettyCash);

  const getCurrentPosition = () => {
    dispatch(fetchCurrentPosition());
  };

  return { currentPosition, loading, error, getCurrentPosition };
};

export const useDashboardStats = () => {
  const dispatch = useDispatch();
  const { dashboardStats, loading, error } = useSelector((state) => state.pettyCash);

  const getDashboardStats = () => {
    dispatch(fetchDashboardStats());
  };

  return { dashboardStats, loading, error, getDashboardStats };
};

export const useResetPettyCash = () => {
  const dispatch = useDispatch();
  return () => dispatch(resetPettyCashState());
};


