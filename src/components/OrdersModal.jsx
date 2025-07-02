import React, { useState, useEffect } from 'react';
import { Modal, Box, Typography, Button, TextField } from '@mui/material';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from './Toast';
import { IoClose } from 'react-icons/io5';

const OrdersModal = ({ theme, isOpen, onClose, user }) => {
  const [orders, setOrders] = useState([]);
  const [cancelReason, setCancelReason] = useState({});
  const [showCancelInput, setShowCancelInput] = useState({});
  const [submittingOrderId, setSubmittingOrderId] = useState(null);

  const fetchUserOrders = async () => {
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/order/user`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      showToast('Failed to load orders', 'error');
    }
  };

  useEffect(() => {
    if (isOpen && user) {
      fetchUserOrders();
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

    setSubmittingOrderId(orderId);
    try {
      const token = Cookies.get('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/cancel-requests`,
        { orderId, reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Your cancel order request submitted, wait for admin response', 'success');
      toggleCancelInput(orderId);
      onClose();
    } catch (error) {
      console.error('Error submitting cancel request:', error);
      showToast('Failed to submit cancel request', 'error');
    } finally {
      setSubmittingOrderId(null);
    }
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
                  className={`p-4 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-700'}`}
                >
                  <Typography sx={{ color: theme === 'light' ? 'gray.900' : 'gray.100', fontWeight: 'bold' }}>
                    {order.name} ({order.email})
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Phone: {order.phone}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Project Type: {order.projectType}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Budget: {order.projectBudget}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Timeline: {new Date(order.timeline).toLocaleDateString()}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                    Description: {order.projectDescription}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Payment Reference: {order.paymentReference}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem' }}>
                    Payment Method: {order.paymentMethod}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.600' : 'gray.400', fontSize: '0.875rem', wordBreak: 'break-word' }}>
                    Files: {order.filesList}
                  </Typography>
                  <Typography sx={{ color: theme === 'light' ? 'gray.500' : 'gray.500', fontSize: '0.75rem', pt: 1 }}>
                    Created: {new Date(order.createdAt).toLocaleDateString()}
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => toggleCancelInput(order._id)}
                    disabled={submittingOrderId === order._id}
                    sx={{ mt: 2, mb: 1 }}
                  >
                    {showCancelInput[order._id] ? 'Hide Cancel Request' : 'Cancel Order Request'}
                  </Button>
                  {showCancelInput[order._id] && (
                    <div className="mt-2">
                      <TextField
                        fullWidth
                        label="Reason for Cancellation"
                        value={cancelReason[order._id] || ''}
                        onChange={(e) =>
                          setCancelReason((prev) => ({
                            ...prev,
                            [order._id]: e.target.value,
                          }))
                        }
                        multiline
                        rows={3}
                        sx={{ mb: 2 }}
                      />
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleCancelRequest(order._id)}
                        disabled={submittingOrderId === order._id}
                      >
                        Submit
                      </Button>
                    </div>
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