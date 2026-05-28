import { Navigate } from 'react-router-dom';

// This component redirects to the new admin dashboard
export const AdminDashboard = () => {
  return <Navigate to="/admin/dashboard" replace />;
};
