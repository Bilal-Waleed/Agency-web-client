import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Skeleton, Stack } from '@mui/material';
import { socket } from '../../socket'; 

const AdminMessages = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const messagesPerPage = 10;

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/contacts?page=${page}&limit=${messagesPerPage}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log('Fetched contacts:', response.data); 
      setContacts(response.data.data || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching messages:', error);
      const message = error.response?.data?.message || 'Error loading messages. Please try again.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    fetchContacts();

    const handleContactChange = (contact) => {
  if (contact && contact._id && page === 1) {
    setContacts((prev) => {
      const updated = [contact, ...prev.filter((c) => c?._id !== contact._id)];
      return updated.slice(0, messagesPerPage);
    });
  }

  else if (contact?.operationType === 'insert' && contact?.fullDocument && page === 1) {
    const newContact = contact.fullDocument;

    if (!newContact._id) return;

    setContacts((prev) => {
      const updated = [newContact, ...prev.filter((c) => c?._id !== newContact._id)];
      return updated.slice(0, messagesPerPage);
    });
  }
};

    socket.on('contactChange', handleContactChange);
    socket.on('connect_error', () => {
      showToast('Internet disconnected. Please check your connection.', 'error');
    });

    return () => {
      socket.off('contactChange', handleContactChange);
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

  const MessageCardSkeleton = () => (
  <div
    className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg ${
      theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
    }`}
  >
    <Skeleton
      variant="circular"
      width={40}
      height={40}
      sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }}
    />
    <div className="flex flex-col gap-2 w-full">
      <Skeleton
        variant="text"
        width="40%"
        height={24}
        sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }}
      />
      <Skeleton
        variant="text"
        width="60%"
        height={18}
        sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.800' }}
      />
      <Skeleton
        variant="text"
        width="90%"
        height={16}
        sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.800' }}
      />
      <Skeleton
        variant="text"
        width="30%"
        height={12}
        sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.800' }}
      />
    </div>
  </div>
);

  const handlePageChange = (event, value) => {
    console.log('Changing to page:', value); 
    setPage(value);
  };

  const getAvatarUrl = (contact) => {
    return contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col flex-grow">
        <TopBar />
        <h1 className={`text-3xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          Contact Messages
          <div className="w-36 h-1 bg-[#646cff] mt-2"></div>
        </h1>
        <div className="space-y-4 flex-grow">
         {loading ? (
            <>
              {[...Array(5)].map((_, id) => (
                <MessageCardSkeleton key={id}/>
              ))}
            </>
          ) : contacts.length === 0 ? (
            <div className="text-center text-gray-500 mt-4 text-lg">
              No messages found.
            </div>
          ) : (
            contacts.map((contact) => (
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
            ))
          )}
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