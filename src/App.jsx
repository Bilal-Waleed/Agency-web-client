import React, { useContext, useRef } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { ProtectedRoute, RestrictedRoute } from './components/RouteProtection';
import AdminRoute from './components/admin/AdminRoute';
import Loader from './components/Loader';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Services from './pages/Services';
import Service from './pages/Service';
import Register from './pages/Register';
import Login from './pages/Login';
import OTPVerification from './pages/OTPVerification';
import Order from './pages/Order';
import ForgotPassword from './pages/ForgotPassword';
import NotFound from './pages/NotFound';
import ResetPassword from './pages/ResetPassword';
import ScrollToTop from './components/ScrollToTop';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMessages from './pages/admin/AdminMessages';
import AdminServices from './pages/admin/AdminServices';
import AdminOrders from './pages/admin/AdminOrders';
import CustomScrollbar from './components/CustomScrollbar';
import AdminScheduledMeetings from './pages/admin/AdminScheduledMeetings';

const App = () => {
  const { user, isLoading } = useContext(AuthContext);
  const location = useLocation();
  const scrollRef = useRef(); 

  if (user) {
    console.log('User:', user);
  }

  if (isLoading) {
    return <Loader />;
  }

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <CustomScrollbar ref={scrollRef}>
      <div className="flex flex-col">
        <ToastProvider />
        <ScrollToTop scrollRef={scrollRef} />
        {!isAdminRoute && <Navbar />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home scrollRef={scrollRef} />} />
            <Route path="/about" element={<About scrollRef={scrollRef} />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:id" element={<Service />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/order" element={<Order />} />
            </Route>
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers scrollRef={scrollRef} />} />
              <Route path="/admin/messages" element={<AdminMessages scrollRef={scrollRef} />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/orders" element={<AdminOrders scrollRef={scrollRef} />} />
              <Route path="/admin/scheduled-meetings" element={<AdminScheduledMeetings scrollRef={scrollRef} />} />
            </Route>
            <Route element={<RestrictedRoute />}>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-otp" element={<OTPVerification />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </CustomScrollbar>
  );
};

export default App;