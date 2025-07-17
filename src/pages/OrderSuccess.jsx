import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../components/Toast';
import axios from 'axios';
import Cookies from 'js-cookie';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const verifyPaymentAndSaveOrder = async () => {
      try {
        if (!sessionId) {
          showToast('Invalid payment session.', 'error');
          navigate('/');
          return;
        }

        const formData = JSON.parse(sessionStorage.getItem('pendingOrderData') || '{}');
        if (!formData || !formData.name) {
          showToast('Order data not found.', 'error');
          navigate('/');
          return;
        }

        const orderDataString = JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          projectType: formData.projectType,
          projectBudget: formData.projectBudget,
          timeline: formData.timeline,
          projectDescription: formData.projectDescription,
          paymentReference: formData.paymentReference,
          paymentMethod: formData.paymentMethod,
        });

        console.log('Sending order data:', orderDataString);
        console.log('Sending tempId:', formData.tempId);

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/order`,
          {
            sessionId,
            orderData: orderDataString,
            tempId: formData.tempId,
            paymentMethod: formData.paymentMethod,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Cookies.get("token")}`,
            },
          }
        );

        showToast('Payment successful! Your order has been submitted.', 'success');
        console.log('Order saved:', response.data);
        sessionStorage.removeItem('pendingOrderData');
        setTimeout(() => navigate('/order'), 3000);
      } catch (error) {
        console.error('Error saving order:', error.response?.data || error.message);
        showToast('Error verifying payment or saving order.', 'error');
        sessionStorage.removeItem('pendingOrderData');
        navigate('/');
      }
    };

    verifyPaymentAndSaveOrder();

    return () => {
      sessionStorage.removeItem('pendingOrderData');
    };
  }, [sessionId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Processing Payment...</h1>
        <p>Please wait while we verify your payment and save your order.</p>
      </div>
    </div>
  );
};

export default OrderSuccess;