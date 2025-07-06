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
import { Pagination, Stack } from '@mui/material';
import Loader from '../../components/Loader';

const AdminMessages = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesPerPage = 10;
  const socketRef = useRef(null);


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

      socketRef.current.on('contactChange', (contact) => {
        console.log('Received contactChange:', contact);
        if (contact?._id && page === 1) {
          setContacts((prev) => {
            const updated = [contact, ...prev.filter((c) => c._id !== contact._id)];
            return updated.slice(0, messagesPerPage);
          });
        }
      });
    }

    const fetchContacts = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/contacts?page=${page}&limit=${messagesPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setContacts(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching messages:', error);
        const message = error.response?.data?.message || 'Error loading Messages. Please try again.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveAdmin');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, navigate, page]);

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

  const getAvatarUrl = (contact) => {
    return contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
        {loading && <Loader />}
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col flex-grow">
        <TopBar />
        <h1 className={`text-3xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          Messages
          <div className="w-18 h-1 bg-[#646cff] mt-2"></div>
        </h1>
        <div className="space-y-4 flex-grow">
          {contacts.map((contact) => (
            <div
              key={contact._id}
              className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg transform transition-transform duration-200 hover:-translate-x-1 ${
                theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
              }`}
            >
              <img
                src={getAvatarUrl(contact)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}`;
                }}
                alt={contact.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col min-w-0 w-full">
                <p className={`font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  {contact.name}
                </p>
                <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {contact.email}
                </p>
                <p className={`text-sm break-words ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  {contact.message}
                </p>
                <p className={`text-xs pt-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>
                  Sent: {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default AdminMessages;