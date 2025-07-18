import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Stack, Button, Typography, Skeleton } from '@mui/material';
import { FaDownload } from 'react-icons/fa';
import CancelRequests from '../../components/admin/CancelRequests';
import CancelOrderModal from '../../components/admin/CancelOrderModal';
import CompleteOrderModal from '../../components/admin/CompleteOrderModal';
import { socket } from '../../socket';

const AdminOrders = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'orders');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ordersPerPage = 10;

  const fetchOrders = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders?page=${page}&limit=${ordersPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching orders:', error);
      let message = 'Error loading Orders. Please try again.';
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        message = 'No internet connection. Please check your network.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      showToast(message, 'error');
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleDownload = async (orderId) => {
    setDownloadingId(orderId);
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${orderId}/download`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `order_${orderId}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Order downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading order:', error);
      showToast('Failed to download order', 'error');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      const token = Cookies.get('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${orderId}/cancel`,
        { reason },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      showToast('Order cancelled successfully', 'success');
      fetchOrders(false);
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order', 'error');
    }
  };

  const handleCompleteOrder = async (orderId, message, files) => {
    const MAX_SINGLE_FILE_SIZE = 25 * 1024 * 1024;
    const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    for (let file of files) {
      if (file.size > MAX_SINGLE_FILE_SIZE) {
        showToast(`${file.name} is larger than 25MB`, 'error');
        return;
      }
    }
    if (totalSize > MAX_TOTAL_SIZE) {
      showToast('Total file size exceeds 25MB', 'error');
      return;
    }
    try {
      const token = Cookies.get('token');
      const formData = new FormData();
      formData.append('message', message || '');
      files.forEach((file) => formData.append('files', file));

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/orders/${orderId}/complete`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      showToast(response.data.message || 'Order completion initiated. Payment link sent to user.', 'success');
      fetchOrders(false);
    } catch (error) {
      console.error('Error completing order:', error);
      showToast(error?.response?.data?.message || 'Failed to complete order. Please try again.', 'error');
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const handleOrderChange = (change) => {
      if (['insert', 'delete', 'update'].includes(change.operationType)) {
        fetchOrders(false);
      }
    };

    if (activeTab === 'orders') {
      fetchOrders();
    }

    socket.on('orderChange', handleOrderChange);
    socket.on('orderCompleted', (data) => {
      showToast(`Order ${data.orderId} completed`, 'success');
      fetchOrders(false);
    });
    socket.on('connect_error', () => {
      showToast('Internet disconnected. Please check your connection.', 'error');
    });

    return () => {
      socket.off('orderChange', handleOrderChange);
      socket.off('orderCompleted');
      socket.off('connect_error');
    };
  }, [user, navigate, page, activeTab]);

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, activeTab]);

  const handlePageChange = (event, value) => {
    setPage(value);
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const OrderCardSkeleton = () => {
    return (
      <div
        className={`flex flex-wrap sm:flex-nowrap gap-4 p-6 rounded-lg ${
          theme === 'light' ? 'bg-white shadow-lg border border-gray-200' : 'bg-gray-800 shadow-xl border border-gray-700'
        }`}
      >
        <Skeleton
          variant="circular"
          width={48}
          height={48}
          sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }}
        />
        <div className="flex flex-col flex-grow gap-2">
          <Skeleton variant="text" width="40%" height={30} sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
          <Skeleton variant="text" width="60%" height={28} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
          <Skeleton variant="text" width="55%" height={26} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
          <Skeleton variant="text" width="50%" height={26} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
          <Skeleton variant="text" width="70%" height={26} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1, bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
        </div>
      </div>
    );
  };

  const getAvatarUrl = (item) => {
    return item?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`;
  };

  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setIsCancelModalOpen(true);
  };

  const openCompleteModal = (orderId) => {
    setSelectedOrderId(orderId);
    setIsCompleteModalOpen(true);
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col flex-grow">
        <TopBar />
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-8 mb-6 relative">
          <div onClick={() => setActiveTab('orders')} className="cursor-pointer">
            <h1
              className={`text-2xl sm:text-3xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-white'
              } ${activeTab === 'orders' ? 'text-[#646cff]' : ''}`}
            >
              Orders
            </h1>
            {activeTab === 'orders' && (
              <div className="w-16 h-1 bg-[#646cff] mt-1 rounded"></div>
            )}
          </div>
          <Typography
            variant="h4"
            className={`${theme === 'light' ? 'text-black' : 'text-white'} font-bold hidden sm:block`}
          >
            /
          </Typography>
          <div onClick={() => setActiveTab('cancel-requests')} className="cursor-pointer">
            <h1
              className={`text-2xl sm:text-3xl font-bold ${
                theme === 'light' ? 'text-black' : 'text-white'
              } ${activeTab === 'cancel-requests' ? 'text-[#646cff]' : ''}`}
            >
              Cancel Requests
            </h1>
            {activeTab === 'cancel-requests' && (
              <div className="w-28 h-1 bg-[#646cff] mt-1 rounded"></div>
            )}
          </div>
        </div>
        {activeTab === 'orders' ? (
          <div className="space-y-4 flex-grow">
            {loading ? (
              <>
                {[...Array(5)].map((_, id) => (
                  <OrderCardSkeleton key={id} />
                ))}
              </>
            ) : orders.length === 0 ? (
              <div className="text-center text-gray-500 mt-4 text-lg">
                No orders found.
              </div>
            ) : (
              <>
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className={`relative flex flex-wrap sm:flex-nowrap items-start gap-4 p-6 rounded-lg transform transition-transform duration-200 hover:-translate-y-1 ${
                      theme === 'light' ? 'bg-white shadow-lg border border-gray-200' : 'bg-gray-800 shadow-xl border border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => handleDownload(order._id)}
                      disabled={downloadingId === order._id}
                      className={`absolute top-4 right-4 p-2 rounded-full ${
                        downloadingId === order._id
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                          : theme === 'light' ? 'text-blue-500 hover:bg-blue-100' : 'text-blue-400 hover:bg-gray-700'
                      }`}
                      title="Download Order"
                    >
                      <FaDownload className="text-xl" />
                    </button>
                    <img
                      src={getAvatarUrl(order)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(order.name)}`;
                      }}
                      alt={order.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex flex-col min-w-0 w-full">
                      <p className={`font-semibold text-lg break-words ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                        {order.name} <span className="text-sm font-normal">({order.email})</span>
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Order ID:</strong> {order.orderId}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Phone:</strong> {order.phone}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Project Type:</strong> {order.projectType}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Budget:</strong> {order.projectBudget}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Timeline:</strong> {new Date(order.timeline).toLocaleDateString()}
                      </p>
                      <p className={`text-sm break-words ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Description:</strong> {order.projectDescription}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Payment Reference:</strong> {order.paymentReference}
                      </p>
                      <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Payment Method:</strong> {order.paymentMethod}
                      </p>
                      <p className={`text-sm break-words whitespace-normal ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                        <strong>Files:</strong> {order.filesList}
                      </p>
                      <div className="flex flex-col gap-2 mt-2 mb-2">
                        <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                          <strong>Created:</strong> {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        {order.status === 'completed' ? (
                          <Typography sx={{ color: theme === 'light' ? '#10B981' : '#34D399', fontWeight: 'medium' }}>
                            Order Completed
                          </Typography>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => openCancelModal(order._id)}
                              variant="contained"
                              size="small"
                              sx={{
                                textTransform: 'none',
                                fontWeight: 'medium',
                                backgroundColor: theme === 'light' ? '#dc2626' : '#ef4444',
                                '&:hover': {
                                  backgroundColor: theme === 'light' ? '#dc2626' : '#ef4444',
                                  transform: 'scale(1.05)',
                                  transition: 'all 0.2s ease-in-out',
                                },
                                width: 'fit-content',
                              }}
                            >
                              Cancel Order
                            </Button>
                            <Button
                              onClick={() => openCompleteModal(order._id)}
                              variant="outlined"
                              size="small"
                              sx={{
                                textTransform: 'none',
                                fontWeight: 'medium',
                                color: '#10B981',
                                borderColor: '#10B981',
                                '&:hover': {
                                  backgroundColor: theme === 'light' ? '#d1fae5' : '#064e3b',
                                  borderColor: '#10B981',
                                  color: theme === 'light' ? '#059669' : '#6ee7b7',
                                  transform: 'scale(1.05)',
                                  transition: 'all 0.2s ease-in-out',
                                },
                                width: 'fit-content',
                              }}
                            >
                              Complete Order
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-6">
                  <Stack spacing={2} alignItems="center">
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={handlePageChange}
                      variant="outlined"
                      shape="rounded"
                      sx={{
                        '& .MuiPaginationItem-root': {
                          color: theme === 'light' ? '#000' : '#fff',
                          backgroundColor: theme === 'light' ? '#fff' : '#374151',
                          '&:hover': {
                            backgroundColor: theme === 'light' ? '#e5e7eb' : '#4b5563',
                          },
                          '&.Mui-selected': {
                            backgroundColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                            color: '#fff',
                          },
                        },
                      }}
                    />
                  </Stack>
                </div>
              </>
            )}
          </div>
        ) : (
          <CancelRequests scrollRef={scrollRef} />
        )}
        <CancelOrderModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onSubmit={handleCancelOrder}
          orderId={selectedOrderId}
        />
        <CompleteOrderModal
          isOpen={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          onSubmit={handleCompleteOrder}
          orderId={selectedOrderId}
        />
      </div>
    </div>
  );
};

export default AdminOrders;