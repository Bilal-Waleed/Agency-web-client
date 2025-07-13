import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { Pagination, Stack, Button, Skeleton } from '@mui/material';
import Loader from '../../components/Loader';
import ScheduleMeetingModal from '../../components/ScheduleMeetingModal';
import { FaCalendarAlt } from 'react-icons/fa';
import { socket } from '../../socket'; 

const AdminScheduledMeetings = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const meetingsPerPage = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchMeetings = async () => {
      setLoading(true);
      try {
      const token = Cookies.get('token');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/scheduled-meetings?page=${page}&limit=${meetingsPerPage}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMeetings(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      const message =
        error.response?.data?.message || 'Error loading meetings. Please try again.';
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  fetchMeetings();
}, [page]); 


useEffect(() => {
  const handleMeetingChange = (meeting) => {
  const inserted = meeting?.fullDocument;

  if (meeting.operationType === 'insert' && inserted?._id) {
    const meetingDateTime = new Date(`${inserted.date}T${inserted.time}`);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (meetingDateTime < oneHourAgo) return;

    showToast('New meeting scheduled by user', 'info');

    if (page === 1) {
      setMeetings((prev) => {
        const exists = prev.some((m) => m._id === inserted._id);
        if (exists) return prev;
        const updated = [inserted, ...prev];
        return updated.slice(0, meetingsPerPage);
      });
    }
  }

  else if (meeting.operationType === 'update') {
    const updated = meeting.fullDocument || {};
    const id = meeting.documentKey?._id;
    if (!id) return;

    setMeetings((prev) =>
      prev.map((m) => (m._id === id ? { ...m, ...updated } : m))
    );
  }

  else if (meeting.operationType === 'delete') {
    setMeetings((prev) =>
      prev.filter((m) => m._id !== meeting.documentKey._id)
    );
  }
};

 const handleMeetingUIUpdate = (payload) => {
    if (payload.action === 'update' && payload.data?._id) {
      setMeetings((prev) =>
        prev.map((m) =>
          m._id === payload.data._id ? { ...m, ...payload.data } : m
        )
      );
    }

    if (payload.action === 'insert' && payload.data?._id) {
      if (page === 1) {
        setMeetings((prev) => {
          const exists = prev.some((m) => m._id === payload.data._id);
          if (exists) return prev;
          const updated = [payload.data, ...prev];
          return updated.slice(0, meetingsPerPage);
        });
      }
    }
  };

  socket.on('meetingChange', handleMeetingChange);
  socket.on('meetingUI', handleMeetingUIUpdate);

  socket.on('connect_error', () => {
    showToast('Internet disconnected. Please check your connection.', 'error');
  });

  return () => {
    socket.off('meetingChange', handleMeetingChange);
    socket.off('meetingUI', handleMeetingUIUpdate); 
    socket.off('connect_error');
  };
}, []);
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
        setMeetings((prevMeetings) =>
        prevMeetings.map((meeting) =>
          meeting._id === meetingId ? { ...meeting, status: 'accepted' } : meeting
        )
      );
      } else {
        showToast(response.data.message || 'Failed to accept meeting', 'error');
      }
    } catch (error) {
      showToast('Error accepting meeting', 'error');
    }
  };

  const openRescheduleModal = (meeting) => {
    setSelectedMeeting(meeting);
    setIsModalOpen(true);
  };

  const onModalClose = (shouldReload, updatedMeetingData = null) => {
  setIsModalOpen(false);
  setSelectedMeeting(null);

  if (shouldReload && updatedMeetingData?._id) {
    setMeetings((prev) =>
      prev.map((m) => (m._id === updatedMeetingData._id ? updatedMeetingData : m))
    );
  }
};


  const scrollToTop = () => {
    if (scrollRef?.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToTop();
  }, [page]);

  const handlePageChange = (event,value) => {
    setPage(value);
    scrollToTop();
  };

  const MeetingCardSkeleton = () => {
  return (
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
      <div className="flex flex-col gap-2 flex-grow">
        <Skeleton variant="text" width="40%" height={20} sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
        <Skeleton variant="text" width="60%" height={16} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
        <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
        <Skeleton variant="text" width="50%" height={16} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
        <Skeleton variant="text" width="40%" height={16} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1, bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
      </div>
    </div>
  );
};


  const formatTime = (time) => {
    if (!time) return time;
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const adjustedHours = hours % 12 || 12;
    return `${adjustedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col flex-grow">
        <TopBar />
        <h1 className={`text-3xl font-bold mb-6 ${theme === 'light' ? 'text-black' : 'text-white'}`}>
          Scheduled Meetings
          <div className="w-18 h-1 bg-[#646cff] mt-2"></div>
        </h1>
        <div className="space-y-4 flex-grow">
          {loading
            ? [...Array(6)].map((_, id) => (<MeetingCardSkeleton key={id}/>))
            : meetings.map((meeting) => (
            <div
              key={meeting._id}
              className={`flex flex-wrap sm:flex-nowrap items-start gap-4 p-4 rounded-lg transform transition-transform duration-200 hover:-translate-x-1 ${
                theme === 'light' ? 'bg-white shadow-sm' : 'bg-gray-800 shadow-md'
              }`}
            >
              <img
                src={meeting.userAvatar || meeting.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.userName)}`}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(meeting.userName)}`;
                }}
                alt={meeting.userName}
                className="w-10 h-10 rounded-full"
              />
              <div className="flex flex-col min-w-0 w-full">
                <p className={`font-semibold truncate ${theme === 'light' ? 'text-gray-900' : 'text-gray-100'}`}>
                  {meeting.userName}
                </p>
                <p className={`text-sm truncate ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>
                  {meeting.userEmail}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Service: {meeting.service.title}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Date: {new Date(meeting.date).toLocaleDateString()}
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                  Time: {formatTime(meeting.time)}
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