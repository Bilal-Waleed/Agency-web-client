import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Stack, Button } from '@mui/material';
import Loader from '../../components/Loader';

const CancelRequests = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cancelRequests, setCancelRequests] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [disabledRequests, setDisabledRequests] = useState({});
  const requestsPerPage = 10;
  const socketRef = useRef(null);

  const fetchCancelRequests = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/cancel-requests?page=${page}&limit=${requestsPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Fetched cancel requests:', response.data.data);
      setCancelRequests(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching cancel requests:', error);
      let message = 'Error loading Cancel Requests. Please try again.';
      if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
        message = 'No internet connection. Please check your network.';
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      }
      showToast(message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleAcceptCancelRequest = async (requestId) => {
    setDisabledRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      const token = Cookies.get('token');
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/cancel-requests/${requestId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(res?.data?.message || 'Cancel request accepted and order deleted', 'success');
      setCancelRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error('Error accepting cancel request:', error);
      showToast('Failed to accept cancel request', 'error');
    }
  };

  const handleDeclineCancelRequest = async (requestId) => {
    setDisabledRequests(prev => ({ ...prev, [requestId]: true }));
    try {
      const token = Cookies.get('token');
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/cancel-requests/${requestId}/decline`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(res?.data?.message || 'Cancel request declined', 'success');
      setCancelRequests((prev) => prev.filter((req) => req._id !== requestId));
    } catch (error) {
      console.error('Error declining cancel request:', error);
      showToast('Failed to decline cancel request', 'error');
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

      socketRef.current.on('cancelRequestChange', (change) => {
        console.log('Received cancelRequestChange:', change);
       if (change.operationType === 'insert') {
            fetchCancelRequests(true); 
       }
        });
    }

    fetchCancelRequests();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveAdmin');
        socketRef.current.off('cancelRequestChange');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, navigate, page]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const handlePageChange = (_, value) => {
    setPage(value);
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAvatarUrl = (item) => {
  const name = item?.userName || item?.name;
    return item?.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
  };


  return (
    <div className="flex flex-col justify-between flex-grow min-h-[60vh]">
      <div className="space-y-4">
        {loading && <Loader />}
        {cancelRequests?.length > 0 ? (
          cancelRequests.map((request) => (
            <div
              key={request._id}
              className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg transform transition-transform duration-200 hover:-translate-x-1 relative ${
                theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
              }`}
            >
              <img
                src={getAvatarUrl(request)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    request?.userName
                  )}`;
                }}
                alt={request?.userName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col min-w-0 w-full">
                <p className={`font-semibold text-lg break-words ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  {request?.userName} ({request?.userEmail})
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Phone:</strong> {request.order.phone}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Project Type:</strong> {request.order.projectType}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Budget:</strong> {request.order.projectBudget}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Timeline:</strong> {new Date(request.order.timeline).toLocaleDateString()}
                </p>
                <p className={`text-sm break-words ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Description:</strong> {request.order.projectDescription}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Payment Reference:</strong> {request.order.paymentReference}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Payment Method:</strong> {request.order.paymentMethod}
                </p>
                <p className={`text-sm break-words whitespace-normal ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Files:</strong> {request.order.filesList}
                </p>
                <p className={`text-sm break-words ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Cancellation Reason:</strong> {request.reason}
                </p>
                <p className={`text-xs pt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                  <strong>Order Created:</strong> {new Date(request.order.createdAt).toLocaleDateString()}
                </p>

                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleAcceptCancelRequest(request._id)}
                    variant="contained"
                    size="medium"
                    disabled={disabledRequests[request._id]}
                    sx={{
                      textTransform: 'none',
                      fontWeight: '700',
                      borderColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      '&:hover': {
                        transform: 'scale(1.03)',
                        transition: 'all 0.2s ease-in-out',
                      },
                      ...disabledRequests[request._id] && {
                        backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                        color: theme === 'light' ? '#9ca3af' : '#9ca3af',
                      },
                    }}
                  >
                    Accept
                  </Button>

                  <Button
                    onClick={() => handleDeclineCancelRequest(request._id)}
                    variant="outlined"
                    size="medium"
                    disabled={disabledRequests[request._id]}
                    sx={{
                      textTransform: 'none',
                      fontWeight: '500',
                      borderColor: theme === 'light' ? '#ef4444' : '#f87171',
                      color: theme === 'light' ? '#ef4444' : '#f87171',
                      '&:hover': {
                        transform: 'scale(1.03)',
                        transition: 'all 0.2s ease-in-out',
                      },
                      ...disabledRequests[request._id] && {
                        backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                        color: theme === 'light' ? '#9ca3af' : '#9ca3af',
                      },
                    }}
                  >
                    Decline
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : !loading ? (
          <div className={`text-center text-lg ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
            No cancel requests found.
          </div>
        ) : null}
      </div>

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
  );
};

export default CancelRequests;