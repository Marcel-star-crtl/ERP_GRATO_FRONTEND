import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../../components/Dashboard';

// SupervisorTeamDashboard component that uses the unified Dashboard
const SupervisorTeamDashboard = () => {
  // For supervisors, redirect to the main dashboard which has role-based content
  return <Dashboard />;
};

export default SupervisorTeamDashboard;