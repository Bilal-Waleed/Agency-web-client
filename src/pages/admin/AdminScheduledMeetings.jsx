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
import { Pagination, Stack, Button } from '@mui/material';
import Loader from '../../components/Loader';
import ScheduleMeetingModal from '../../components/ScheduleMeetingModal';
import { FaCalendarAlt } from 'react-icons/fa';

const AdminScheduledMeetings = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const meetingsPerPage = 10;
  const socketRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

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

      socketRef.current.on('meetingChange', (meeting) => {
        if (meeting?._id && page === 1) {
          setMeetings((prev) => {
            const updated = [meeting, ...prev.filter((m) => m._id !== meeting._id)];
            return updated.slice(0, meetingsPerPage);
          });
        }
      });
    }

    const fetchMeetings = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/scheduled-meetings?page=${page}&limit=${meetingsPerPage}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMeetings(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        const message = error.response?.data?.message || 'Error loading meetings. Please try again.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leaveAdmin');
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user, navigate, page]);

  const handleAcceptMeeting = async (meetingId) => {
    try {
      const token = Cookies.get('token');
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/scheduled-meetings/${meetingId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        showToast('Meeting accepted successfully', 'success');
        setMeetings((prev) =>
          prev.map((m) => (m._id === meetingId ? { ...m, status: 'accepted' } : m))
        );
      } else {
        showToast(response.data.message || 'Failed to accept meeting', 'error');
      }
    } catch {
      showToast('Error accepting meeting', 'error');
    }
  };

  const openRescheduleModal = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  const onModalClose = (shouldReload) => {
    setIsModalOpen(false);
    setSelectedMeeting(null);
    if (shouldReload) setPage(1);
  };

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

  const getAvatarUrl = (user) => {
    return user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
      {loading && <Loader />}
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col flex-grow">
        <TopBar />
        <h1 className={`text-3xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          Scheduled Meetings
          <div className="w-18 h-1 bg-[#646cff] mt-2"></div>
        </h1>

        <div className="space-y-4 flex-grow">
          {meetings.map((meeting) => (
            <div
              key={meeting._id}
              className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg transform transition-transform duration-200 hover:-translate-x-1 ${
                theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
              }`}
            >
              <img
                src={getAvatarUrl(meeting.user)}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(meeting.user.name)}`;
                }}
                alt={meeting.user.name}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col min-w-0 w-full">
                <p className={`font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  {meeting.user.name}
                </p>
                <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {meeting.user.email}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Service: {meeting.service.title}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Date: {new Date(meeting.date).toLocaleDateString()}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Time: {meeting.time}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Status: {meeting.status}
                </p>
                <div className="flex gap-4 mt-2">
                  {meeting.status !== 'accepted' && (
                    <Button
                      onClick={() => handleAcceptMeeting(meeting._id)}
                      variant="contained"
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 'medium',
                        backgroundColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                        '&:hover': {
                          backgroundColor: theme === 'light' ? '#2563eb' : '#3b82f6',
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s ease-in-out',
                        },
                      }}
                    >
                      Accept
                    </Button>
                  )}
                  <Button
                    onClick={() => openRescheduleModal(meeting)}
                    variant="outlined"
                    size="small"
                    startIcon={<FaCalendarAlt />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 'medium',
                      borderColor: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      color: theme === 'light' ? '#3b82f6' : '#60a5fa',
                      '&:hover': {
                        borderColor: theme === 'light' ? '#2563eb' : '#3b82f6',
                        backgroundColor: theme === 'light' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(96, 165, 250, 0.1)',
                        transform: 'scale(1.02)',
                        transition: 'all 0.2s ease-in-out',
                      },
                    }}
                  >
                    Reschedule
                  </Button>
                </div>
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

      <ScheduleMeetingModal
        isOpen={isModalOpen}
        onClose={onModalClose}
        meetingId={selectedMeeting?._id}
        serviceTitle={selectedMeeting?.service?.title}
        initialDate={selectedMeeting?.date}
        initialTime={selectedMeeting?.time}
      />
    </div>
  );
};

export default AdminScheduledMeetings;