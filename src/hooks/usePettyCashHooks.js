import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCompanySettings, 
  updateCompanySettings 
} from '../features/pettyCash/pettyCashSlice';

export const useCompanySettings = () => {
  const dispatch = useDispatch();
  const { 
    companySettings, 
    loading, 
    error, 
    updating 
  } = useSelector((state) => state.pettyCash);

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