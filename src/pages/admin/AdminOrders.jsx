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
import CancelRequests from '../../components/admin/CancelRequests'

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
  const ordersPerPage = 10;
  const socketRef = useRef(null);

  const fetchOrders = async () => {
    setLoading(true);
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
      setLoading(false);
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
        if (change.operationType === 'insert') {
          setOrders((prevOrders) => {
            if (prevOrders.some((order) => order._id === change.fullDocument._id)) {
              return prevOrders;
            }
            const updatedOrders = [change.fullDocument, ...prevOrders];
            if (updatedOrders.length > ordersPerPage) {
              updatedOrders.pop();
            }
            setTotalPages((prevTotal) => {
              const totalOrders = prevTotal * ordersPerPage + 1;
              return Math.ceil(totalOrders / ordersPerPage);
            });
            return updatedOrders;
          });
        } else if (change.operationType === 'delete') {
          setOrders((prevOrders) =>
            prevOrders.filter((order) => order._id !== change.documentKey._id)
          );
          if (orders.length === 1 && page === totalPages && page > 1) {
            setPage((prevPage) => prevPage - 1);
          } else if (orders.length <= ordersPerPage) {
            fetchOrders();
          }
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
            {loading && <Loader />}
            {orders?.map((order) => (
              <div
                key={order._id}
                className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg transform transition-transform duration-200 hover:-translate-x-1 relative ${
                  theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
                }`}
              >
                <img
                  src={getAvatarUrl(order)}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(order.name)}`;
                  }}
                  alt={order.name}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex flex-col min-w-0 w-full">
                  <p className={`font-semibold break-words ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                    {order.name} ({order.email})
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Phone: {order.phone}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Project Type: {order.projectType}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Budget: {order.projectBudget}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Timeline: {new Date(order.timeline).toLocaleDateString()}
                  </p>
                  <p className={`text-sm break-words ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Description: {order.projectDescription}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Payment Reference: {order.paymentReference}
                  </p>
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Payment Method: {order.paymentMethod}
                  </p>
                  <p className={`text-sm break-words whitespace-normal ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                    Files: {order.filesList}
                  </p>
                  <p className={`text-xs pt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDownload(order._id)}
                  disabled={downloadingId === order._id}
                  className={`absolute top-2 right-2 p-2 rounded-full
                    ${downloadingId === order._id
                      ? 'text-gray-400 bg-gray-200 cursor-not-allowed'
                      : theme === 'light'
                      ? 'text-blue-500 hover:bg-blue-100'
                      : 'text-blue-400 hover:bg-gray-700'
                    }`}
                  title="Download Order"
                >
                  <FaDownload className="text-xl" />
                </button>
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
          </div>
        ) : (
          <CancelRequests scrollRef={scrollRef} />
        )}
      </div>
    </div>
  );
};

export default AdminOrders;