import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import SignatureRequiredOverlay from './SignatureRequiredOverlay';
import QuarterlyKpiNotice from './QuarterlyKpiNotice';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.signature?.url) {
    return <SignatureRequiredOverlay visible />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Admin can access all routes - no restrictions for admin
    if (user.role === 'admin') {
      return children;
    }
    
    // Redirect other roles to appropriate dashboard based on role
    let redirectPath = '/pettycash';
    
    if (user.role === 'employee') {
      redirectPath = '/employee/requests';
    } else if (user.role === 'supervisor') {
      redirectPath = '/supervisor/requests';
    } else if (user.role === 'finance') {
      redirectPath = '/finance/requests';
    }
    
    return <Navigate to={redirectPath} replace />;
  }
  
  return (
    <>
      <QuarterlyKpiNotice user={user} />
      {children}
    </>
  );
};

export default ProtectedRoute;