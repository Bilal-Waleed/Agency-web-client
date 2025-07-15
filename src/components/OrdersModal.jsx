import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import axios from '../utils/axiosConfig';
import Cookies from 'js-cookie';
import { showToast } from './Toast';
import { IoClose } from 'react-icons/io5';

const OrdersModal = ({ theme, isOpen, onClose, user }) => {
  const [orders, setOrders] = useState([]);
  const [cancelReason, setCancelReason] = useState({});
  const [showCancelInput, setShowCancelInput] = useState({});
  const [submittingOrderId, setSubmittingOrderId] = useState(null);
  const [cancelRequests, setCancelRequests] = useState([]); 

  const fetchUserOrders = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) {
        showToast('Please log in to view orders', 'info');
        return;
      }
      const response = await axios.get(
        `/api/order/user`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data.data || []);
    } catch (error) {
      console.error('Error fetching user orders:', error);
    }
  };

  const fetchCancelRequests = async () => {
    try {
      const token = Cookies.get('token');
      if (!token) return;
      const response = await axios.get(
        `/api/order/user-cancel-requests`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setCancelRequests(response.data.data || []);
    } catch (error) {
      console.error('Error fetching cancel requests:', error);
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserOrders();
      fetchCancelRequests();
    }
  }, [isOpen, user]);

  const toggleCancelInput = (orderId) => {
    setShowCancelInput((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
    if (showCancelInput[orderId]) {
      setCancelReason((prev) => ({
        ...prev,
        [orderId]: '',
      }));
    }
  };

  const handleCancelRequest = async (orderId) => {
    const reason = cancelReason[orderId]?.trim();
    if (!reason) {
      showToast('Please provide a reason for cancellation', 'error');
      return;
    }
    if (reason.replace(/\s/g, '').length < 10) {
      showToast('Reason must be at least 10 characters (excluding spaces)', 'error');
      return;
    }

    setSubmittingOrderId(orderId);
    try {
      const token = Cookies.get('token');
      const res = await axios.post(
        `/api/admin/cancel-requests`,
        { orderId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(
        res?.data?.message || 'Your cancel order request submitted, wait for admin response',
        'success'
      );
      toggleCancelInput(orderId);
      fetchUserOrders();
      fetchCancelRequests(); 
    } catch (error) {
      console.error('Error submitting cancel request:', error);
    } finally {
      setSubmittingOrderId(null);
    }
  };

  const hasPendingCancelRequest = (orderId) => {
    return cancelRequests.some((request) => request.order._id === orderId);
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      aria-labelledby="orders-modal-title"
      aria-describedby="orders-modal-description"
    >
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm`}
        onClick={onClose}
      >
        <div
          className={`p-6 rounded-lg relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto
            ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-100'}
            shadow-lg`}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${
              theme === 'light' ? '#9CA3AF #F3F4F6' : '#4B5563 #1F2937'
            }`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <style>
            {`
              div::-webkit-scrollbar {
                width: 8px;
              }
              div::-webkit-scrollbar-track {
                background: ${theme === 'light' ? '#F3F4F6' : '#1F2937'};
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb {
                background: ${theme === 'light' ? '#9CA3AF' : '#4B5563'};
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: ${theme === 'light' ? '#6B7280' : '#6B7280'};
              }
            `}
          </style>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 p-1 rounded-full
              ${theme === 'light' 
                ? 'text-gray-600 hover:bg-gray-200' 
                : 'text-gray-300 hover:bg-gray-700'}
            `}
          >
            <IoClose size={24} />
          </button>
          <Typography
            id="orders-modal-title"
            variant="h6"
            component="h2"
            fontWeight={800}
            sx={{ mb: 2, color: theme === 'light' ? 'black' : 'white', pr: 8 }}
          >
            My Orders
          </Typography>
          {orders.length === 0 ? (
            <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', textAlign: 'center' }}>
              No orders placed
            </Typography>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-200 text-gray-900' : 'bg-gray-700 text-gray-200'}`}
                >
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-900' : 'text-gray-100', fontWeight: 'bold' }}>
                    {order.name} ({order.email})
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Order ID:</strong> {order.orderId || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Phone:</strong> {order.phone || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Project Type:</strong> {order.projectType || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Budget:</strong> {order.projectBudget || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Timeline:</strong> {order.timeline ? new Date(order.timeline).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                    <strong>Description:</strong> {order.projectDescription || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Payment Reference:</strong> {order.paymentReference || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem' }}>
                    <strong>Payment Method:</strong> {order.paymentMethod || 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-600' : 'text-gray-400', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                    <strong>Files:</strong> {order.filesList || 'None'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-500' : 'text-gray-500', fontSize: '0.75rem', pt: 1 }}>
                    <strong>Created:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'text-gray-500' : 'text-gray-500', fontSize: '0.75rem', pt: 1 }}>
                    <strong>Status:</strong> {order.status || 'N/A'}
                  </Typography>
                  {order.status === 'completed' ? (
                    <Typography
                      sx={{
                        mt: 2,
                        mb: 1,
                        color: theme === 'light' ? '#10B981' : '#34D399',
                        fontWeight: 'medium',
                      }}
                    >
                      Order Completed Successfully, Check Email
                    </Typography>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        color="error"
                        size="small"
                        onClick={() => toggleCancelInput(order._id)}
                        disabled={submittingOrderId === order._id || hasPendingCancelRequest(order._id)}
                        sx={{ mt: 2, mb: 1 }}
                      >
                        {showCancelInput[order._id]
                          ? 'Hide Cancel Request'
                          : hasPendingCancelRequest(order._id)
                          ? 'Cancellation Request Pending'
                          : 'Cancel Order Request'}
                      </Button>
                      {showCancelInput[order._id] && (
                        <div className="mt-2">
                          <TextField
                            fullWidth
                            label="Reason for Cancellation (minimum 10 words)"
                            value={cancelReason[order._id] || ''}
                            onChange={(e) =>
                              setCancelReason((prev) => ({
                                ...prev,
                                [order._id]: e.target.value,
                              }))
                            }
                            multiline
                            rows={3}
                            sx={{
                              mb: 2,
                              '& .MuiInputBase-input': {
                                color: theme === 'light' ? 'black' : 'white',
                              },
                              '& .MuiInputLabel-root': {
                                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                              },
                              '& .MuiOutlinedInput-root': {
                                '& fieldset': {
                                  borderColor: theme === 'light' ? '#d1d5db' : '#4b5563',
                                },
                                '&:hover fieldset': {
                                  borderColor: theme === 'light' ? '#9ca3af' : '#6b7280',
                                },
                              },
                            }}
                          />
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleCancelRequest(order._id)}
                            disabled={submittingOrderId === order._id}
                            sx={{
                              textTransform: 'none',
                              backgroundColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                              '&:hover': {
                                backgroundColor: theme === 'light' ? '#2563eb' : '#3b82f6',
                              },
                            }}
                          >
                            {submittingOrderId === order._id ? 'Submitting...' : 'Submit'}
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default OrdersModal;