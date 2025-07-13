import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Stack, Button, Skeleton } from '@mui/material';
import { socket } from '../../socket'; 

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
      showToast(res?.data?.message || 'Cancel request accepted successfully', 'success');
      fetchCancelRequests(true);
    } catch (error) {
      console.error('Error accepting cancel request:', error);
      showToast(error.response?.data?.message || 'Failed to accept cancel request', 'error');
    } finally {
      setDisabledRequests(prev => ({ ...prev, [requestId]: false }));
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
      showToast(res?.data?.message || 'Cancel request declined successfully', 'success');
      fetchCancelRequests(true);
    } catch (error) {
      console.error('Error declining cancel request:', error);
      showToast(error.response?.data?.message || 'Failed to decline cancel request', 'error');
    } finally {
      setDisabledRequests(prev => ({ ...prev, [requestId]: false }));
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    fetchCancelRequests();

    const handleCancelRequestChange = (change) => {
      if (['insert', 'delete', 'update'].includes(change.operationType)) {
        fetchCancelRequests(true);
      }
    };

    socket.on('cancelRequestChange', handleCancelRequestChange);
    socket.on('connect_error', () => {
      showToast('Internet disconnected. Please check your connection.', 'error');
    });

    return () => {
      socket.off('cancelRequestChange', handleCancelRequestChange);
      socket.off('connect_error');
    };
  }, [user, navigate, page]);

  useEffect(() => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, scrollRef]);

  const handlePageChange = (event, value) => {
    setPage(value);
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAvatarUrl = (item) => {
    return item?.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.userName)}`;
  };

  const CancelRequestSkeleton = () => (
  <div
    className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-6 rounded-lg ${
      theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
    }`}
  >
    <Skeleton
      variant="circular"
      width={48}
      height={48}
      sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }}
    />
    <div className="flex flex-col gap-2 w-full">
      <Skeleton
        variant="text"
        width="60%"
        height={24}
        sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }}
      />
      <Skeleton
        variant="text"
        width="40%"
        height={18}
        sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.800' }}
      />
      <Skeleton
        variant="text"
        width="80%"
        height={16}
        sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.800' }}
      />
      <Skeleton
        variant="text"
        width="90%"
        height={16}
        sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.800' }}
      />
      <Skeleton
        variant="rectangular"
        width="30%"
        height={30}
        sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700', borderRadius: 1 }}
      />
    </div>
  </div>
);

  return (
    <div className="space-y-4 flex-grow">
      {loading ? (
      <>
        {[...Array(5)].map((_, i) => (
          <CancelRequestSkeleton key={i} theme={theme} />
        ))}
      </>
      ) : cancelRequests.length === 0 ? (
        <div className="text-center text-gray-500 mt-4 text-lg">
          No cancel requests found.
        </div>
      ) : (
        <>
          {cancelRequests.map((request) => (
            <div
              key={request._id}
              className={`relative flex flex-wrap sm:flex-nowrap items-start gap-4 p-6 rounded-lg transform transition-transform duration-200 hover:-translate-y-1 ${
                theme === 'light' ? 'bg-white shadow-lg border border-gray-200' : 'bg-gray-800 shadow-xl border border-gray-700'
              }`}
            >
              <img
                src={getAvatarUrl(request)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(request.userName)}`;
                }}
                alt={request.userName}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex flex-col min-w-0 w-full">
                <p className={`font-semibold text-lg break-words ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  {request.userName} <span className="text-sm font-normal">({request.userEmail})</span>
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Order ID:</strong> {request.order.orderId}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Reason:</strong> {request.reason}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Project Type:</strong> {request.order.projectType}
                </p>
                <p className={`text-sm break-words sm:break-normal ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  <strong>Files:</strong> {request.order.filesList}
                </p>
                <p className={`text-xs mb-1 mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                  <strong>Requested:</strong> {new Date(request.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={() => handleAcceptCancelRequest(request._id)}
                    variant="contained"
                    size="small"
                    disabled={disabledRequests[request._id]}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'medium',
                      backgroundColor: theme === 'light' ? '#10B981' : '#34D399',
                      '&:hover': {
                        backgroundColor: theme === 'light' ? '#059669' : '#6ee7b7',
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out',
                      },
                      width: 'fit-content',
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDeclineCancelRequest(request._id)}
                    variant="contained"
                    size="small"
                    disabled={disabledRequests[request._id]}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'medium',
                      backgroundColor: theme === 'light' ? '#dc2626' : '#ef4444',
                      '&:hover': {
                        backgroundColor: theme === 'light' ? '#b91c1c' : '#f87171',
                        transform: 'scale(1.05)',
                        transition: 'all 0.2s ease-in-out',
                      },
                      width: 'fit-content',
                    }}
                  >
                    Decline
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
  );
};

export default CancelRequests;