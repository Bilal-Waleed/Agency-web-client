import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Stack, Button, Typography } from '@mui/material';
import Loader from '../../components/Loader';
import { FaDownload } from 'react-icons/fa';
import CancelRequests from '../../components/admin/CancelRequests';
import CancelOrderModal from '../../components/admin/CancelOrderModal';

const AdminOrders = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const ordersPerPage = 10;
  const socketRef = useRef(null);

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

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(import.meta.env.VITE_BACKEND_URL, {
        reconnection: false,
      });

      socketRef.current.emit('joinAdmin');

      socketRef.current.on('orderChange', (change) => {
        if (['insert', 'delete'].includes(change.operationType)) {
        fetchOrders(false);
        }
    });
  }

    if (activeTab === 'orders') {
      fetchOrders();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveAdmin');
        socketRef.current.off('orderChange');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, navigate, page, activeTab]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handlePageChange = (event, value) => {
    setPage(value);
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAvatarUrl = (item) => {
    return item?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}`;
  };

  const openCancelModal = (orderId) => {
    setSelectedOrderId(orderId);
    setIsCancelModalOpen(true);
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
              <div className="w-24 h-1 bg-[#646cff] mt-1 rounded"></div>
            )}
          </div>
        </div>
        {activeTab === 'orders' ? (
          <div className="space-y-4 flex-grow">
            {loading ? (
              <Loader />
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
                      theme === 'light'
                        ? 'bg-white shadow-lg border border-gray-200'
                        : 'bg-gray-800 shadow-xl border border-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => handleDownload(order._id)}
                      disabled={downloadingId === order._id}
                      className={`absolute top-4 right-4 p-2 rounded-full ${
                        downloadingId === order._id
                          ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                          : theme === 'light'
                          ? 'text-blue-500 hover:bg-blue-100'
                          : 'text-blue-400 hover:bg-gray-700'
                      }`}
                      title="Download Order"
                    >
                      <FaDownload className="text-xl" />
                    </button>

                    <img
                      src={getAvatarUrl(order)}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          order.name
                        )}`;
                      }}
                      alt={order.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex flex-col min-w-0 w-full">
                      <p
                        className={`font-semibold text-lg break-words ${
                          theme === 'light' ? 'text-gray-900' : 'text-gray-100'
                        }`}
                      >
                        {order.name}{' '}
                        <span className="text-sm font-normal">({order.email})</span>
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Phone:</strong> {order.phone}
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Project Type:</strong> {order.projectType}
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Budget:</strong> {order.projectBudget}
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Timeline:</strong>{' '}
                        {new Date(order.timeline).toLocaleDateString()}
                      </p>
                      <p
                        className={`text-sm break-words ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Description:</strong> {order.projectDescription}
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Payment Reference:</strong> {order.paymentReference}
                      </p>
                      <p
                        className={`text-sm ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Payment Method:</strong> {order.paymentMethod}
                      </p>
                      <p
                        className={`text-sm break-words whitespace-normal ${
                          theme === 'light' ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        <strong>Files:</strong> {order.filesList}
                      </p>
                      <div className="flex flex-col gap-2 mt-2 mb-2">
                        <p
                          className={`text-xs ${
                            theme === 'light' ? 'text-gray-500' : 'text-gray-500'
                          }`}
                        >
                          <strong>Created:</strong>{' '}
                          {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                        <Button
                          onClick={() => openCancelModal(order._id)}
                          variant="contained"
                          size="small"
                          sx={{
                            textTransform: 'none',
                            fontWeight: 'medium',
                            backgroundColor:
                              theme === 'light' ? '#dc2626' : '#ef4444',
                            '&:hover': {
                              backgroundColor:
                                theme === 'light' ? '#dc2626' : '#ef4444',
                              transform: 'scale(1.05)',
                              transition: 'all 0.2s ease-in-out',
                            },
                            width: 'fit-content',
                          }}
                        >
                          Cancel Order
                        </Button>
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
                            backgroundColor:
                              theme === 'light' ? '#e5e7eb' : '#4b5563',
                          },
                          '&.Mui-selected': {
                            backgroundColor:
                              theme === 'light' ? '#3b82f6' : '#60a5fa',
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
      </div>
    </div>
  );
};

export default AdminOrders;