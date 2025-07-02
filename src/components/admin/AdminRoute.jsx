import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Loader from '../Loader';

const AdminRoute = () => {
  const { user, isLoading } = useContext(AuthContext);

  if (isLoading) return <Loader />;
  if (!user || !user.isAdmin) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default AdminRoute;