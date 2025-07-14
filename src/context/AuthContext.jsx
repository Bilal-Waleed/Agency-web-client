import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from '../utils/axiosConfig';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import { showToast } from '../components/Toast';
import { socket, initializeSocket, disconnectSocket, updateSocketUser } from '../socket';
import { debounce } from 'lodash'; 

export const AuthContext = createContext();

const fetchUser = async (token) => {
  const res = await axios.get('/api/auth/user', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data.user;
};

// const refreshToken = async () => {
//   try {
//     const token = Cookies.get('token');
//     if (!token) return null;

//     const res = await axios.post(
//       `${import.meta.env.VITE_BACKEND_URL}/api/admin/refresh-token`,
//       {},
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     const newToken = res.data.token;
//     Cookies.set('token', newToken, { expires: 7 });
//     return newToken;
//   } catch {
//     return null;
//   }
// };

const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const userRef = useRef(null);
  const lastRoleRef = useRef(null);

  useEffect(() => {
    userRef.current = user;
    lastRoleRef.current = user?.isAdmin;
    if (user?._id && socket.connected) {
      updateSocketUser(user);
    }
  }, [user]);

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setIsLoading(false);
      disconnectSocket();
      return;
    }

    fetchUser(token, navigate).then((fetchedUser) => {
      if (fetchedUser) {
        setUser(fetchedUser);
        initializeSocket(fetchedUser, fetchedUser.isAdmin);
      }
      setIsLoading(false);
    });

    const handleUserChange = debounce(async (change) => {
      const currentUser = userRef.current;
      const token = Cookies.get('token');

      if (!token || !currentUser || change?.documentKey?._id !== currentUser._id) return;

      if (change.operationType === 'delete') {
        Cookies.remove('token');
        setUser(null);
        showToast('Your account has been deleted. Please log in again.', 'info');
        navigate('/login');
        return;
      }

      if (change.operationType === 'update') {
        const newIsAdmin = change.fullDocument?.isAdmin;
        if (newIsAdmin !== undefined && newIsAdmin !== lastRoleRef.current) {
          showToast(
            newIsAdmin
              ? 'You have been granted admin access.'
              : 'Your admin access has been revoked.',
            newIsAdmin ? 'success' : 'info'
          );
          setUser({ ...currentUser, isAdmin: newIsAdmin });
          lastRoleRef.current = newIsAdmin;
          if (!newIsAdmin) {
            navigate('/'); 
          }
        }
      }
    }, 300); 

    socket.on('userChange', handleUserChange);

    return () => {
      socket.off('userChange', handleUserChange);
    };
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;