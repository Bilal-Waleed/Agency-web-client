import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { showToast } from '../components/Toast';
import axios from 'axios';
import Cookies from 'js-cookie';
import { useTheme } from '../context/ThemeContext';

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { theme } = useTheme();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + '.' : ''));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const verifyPaymentAndSaveOrder = async () => {
      try {
        if (!sessionId) {
          showToast('Invalid payment session.', 'error');
          navigate('/');
          return;
        }

        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/order/finalize`,
          { sessionId },
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
        console.error('Error finalizing order:', error.response?.data || error.message);
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
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } pt-14 px-4 sm:px-8 lg:px-12 pb-10`}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-20">
        <div className="lg:w-1/2 w-full flex flex-col">
          <h1 className="text-3xl font-bold mb-2 mt-2">Order Confirmation</h1>
          <div className="w-24 h-1 bg-[#646cff] mb-6"></div>
          <img
            src="/images/info.png"
            alt="Order Success"
            className="w-full max-w-md h-auto md:mx-auto sm:mx-auto"
          />
        </div>

        <div className="lg:w-1/2 w-full flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-4">
            Processing Payment<span className="inline-block">{dots}</span>
          </h2>
          <p className="text-lg mb-6">
            Please wait while we verify your payment and save your order. You'll be redirected to the order page shortly.
          </p>
          <style jsx>{`
            @keyframes dots {
              0% { opacity: 0; }
              50% { opacity: 1; }
              100% { opacity: 0; }
            }
            .dots span {
              animation: dots 1.5s infinite;
            }
            .dots span:nth-child(2) { animation-delay: 0.5s; }
            .dots span:nth-child(3) { animation-delay: 1s; }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;