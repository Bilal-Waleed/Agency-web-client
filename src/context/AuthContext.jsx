import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import { io } from 'socket.io-client';
import { showToast } from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

const fetchUser = async (token, setUser, setIsLoading, navigate) => {
  try {
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setUser(response.data.user);
  } catch (err) {
    if (err.response?.status === 401) {
      Cookies.remove('token');
      setUser(null);
      showToast('Session expired or user deleted. Please log in again.', 'error');
      navigate('/login');
    } else {
      console.error('Error fetching user:', err.message, err.response?.data);
    }
  } finally {
    setIsLoading(false);
  }
};

const refreshToken = async () => {
  try {
    const token = Cookies.get('token');
    if (!token) {
      console.warn('No token found for refresh');
      return null;
    }

    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const newToken = response.data.token;
    Cookies.set('token', newToken, { expires: 7 });
    console.log('Current token in cookie:', Cookies.get('token'));
    console.log('Token refreshed successfully');
    return newToken;
  } catch (err) {
    console.error('Error refreshing token:', err.message, err.response?.data);
    return null;
  }
};

const handleUserChange = async (change, user, setUser, navigate) => {
  console.log('Received userChange:', change);
  const token = Cookies.get('token');
  if (!token || !user || change.documentKey._id !== user._id) return;

  if (change.operationType === 'delete') {
    Cookies.remove('token');
    setUser(null);
    showToast('Your account has been deleted. Please log in again.', 'info');
    navigate('/login');
    return;
  }

  if (change.operationType === 'update') {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = response.data.user;

      if (updatedUser.isAdmin !== user.isAdmin) {
        const newToken = await refreshToken();
        if (newToken) {
          Cookies.set('token', newToken, { expires: 7 });

          const newResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/user`, {
            headers: { Authorization: `Bearer ${newToken}` },
          });

          const latestUser = newResponse.data.user;
          setUser(latestUser);

          const isAdminNow = latestUser.isAdmin;
          showToast(
            isAdminNow
              ? 'You have been granted admin access.'
              : 'Your admin access has been revoked.',
            isAdminNow ? 'success' : 'info'
          );
          console.log('Showing toast:', isAdminNow ? 'Granted Admin' : 'Revoked Admin');
        } else {
          Cookies.remove('token');
          setUser(null);
          showToast('Session expired. Please log in again.', 'error');
          navigate('/login');
          return;
        }
      } else {
        setUser(updatedUser);
      }

      console.log('Updated user state:', updatedUser);
    } catch (err) {
      console.error('Error handling user update:', err.message, err.response?.data);
      if (err.response?.status === 401) {
        Cookies.remove('token');
        setUser(null);
        showToast('Session expired. Please log in again.', 'error');
        navigate('/login');
      } else {
        const newIsAdmin = change.fullDocument?.isAdmin ?? user.isAdmin;
        setUser({ ...user, isAdmin: newIsAdmin });
        showToast(
          newIsAdmin
            ? 'You have been granted admin access.'
            : 'Your admin access has been revoked.',
          newIsAdmin ? 'success' : 'info'
        );
      }
    }
  }
};

const initializeSocket = (socketRef, getUser, setUser, navigate) => {
  if (socketRef.current) return;

  socketRef.current = io(import.meta.env.VITE_BACKEND_URL, {
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socketRef.current.on('connect', () => {
    console.log('Socket connected:', socketRef.current.id);
    const currentUser = getUser();
    if (currentUser?._id) {
      socketRef.current.emit('joinUserRoom', `user:${currentUser._id}`);
    }
  });

  socketRef.current.on('connect_error', (err) => {
    console.error('Socket connection error:', err);
  });

  socketRef.current.on('userChange', (change) =>
    handleUserChange(change, getUser(), setUser, navigate)
  );
};

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);
  const userRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const token = Cookies.get('token');
    fetchUser(token, setUser, setIsLoading, navigate);

    initializeSocket(socketRef, () => userRef.current, setUser, navigate);

    if (socketRef.current && user?._id) {
      socketRef.current.emit('joinUserRoom', `user:${user._id}`);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('userChange');
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log('Socket disconnected and cleaned up');
      }
    };
  }, [user?._id]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
