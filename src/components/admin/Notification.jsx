import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import { FaBell, FaCog } from 'react-icons/fa';
import { socket } from '../../socket';

const Notification = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filterDays, setFilterDays] = useState(30);
  const [showSettings, setShowSettings] = useState(false);

  const addNotification = (incoming, type) => {
    setNotifications((prev) => {
      const exists = prev.some(
        (notif) => notif._id === incoming._id || notif._id === incoming.fullDocument?._id
      );
      if (exists) return prev;
      const doc = incoming.fullDocument || incoming;
      const newNotification = {
        _id: doc._id,
        type,
        data: doc,
        createdAt: new Date(doc.createdAt || Date.now()),
        viewed: false,
      };
      return [newNotification, ...prev];
    });
  };

  const fetchNotifications = async (pageNum = 1) => {
    try {
      setLoadingMore(true);
      const token = Cookies.get('token');
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/notifications?page=${pageNum}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newNotifications = res.data.data.map((notif) => ({
        _id: notif._id,
        type: notif.type,
        data: notif.data,
        createdAt: new Date(notif.createdAt),
        viewed: notif.viewed,
      }));

      if (pageNum === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
      }

      setHasMore(pageNum < res.data.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1);

    const handleConnect = () => console.log('Socket connected:', socket.id);
    const handleConnectError = () =>
      showToast('Internet disconnected. Please check your connection.', 'error');

    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);
    socket.on('contactChange', (contact) => addNotification(contact, 'contact'));
    socket.on('orderChange', (change) => addNotification(change, 'order'));
    socket.on('cancelRequestChange', (change) => addNotification(change, 'cancelRequest'));
    socket.on('meetingChange', (meeting) => addNotification(meeting, 'meeting'));

    return () => {
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.off('contactChange');
      socket.off('orderChange');
      socket.off('cancelRequestChange');
      socket.off('meetingChange');
    };
  }, []);

  const handleDropdownOpen = async () => {
    setIsDropdownOpen(true);
    try {
      const token = Cookies.get('token');
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/notifications/mark-viewed`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((notif) => ({ ...notif, viewed: true })));
    } catch (error) {
      console.error('Error marking notifications viewed:', error);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const now = new Date();
    const createdAt = new Date(notification.createdAt);
    const diffDays = (now - createdAt) / (1000 * 60 * 60 * 24);
    return diffDays <= filterDays;
  });

  const unviewedCount = notifications.filter((notif) => !notif.viewed).length;

  const handleNotificationClick = (notification) => {
    switch (notification.type) {
      case 'contact':
        navigate('/admin/messages');
        break;
      case 'order':
        navigate('/admin/orders');
        break;
      case 'cancelRequest':
        navigate('/admin/orders', { state: { activeTab: 'cancel-requests' } });
        break;
      case 'meeting':
        navigate('/admin/scheduled-meetings');
        break;
      default:
        break;
    }
    setIsDropdownOpen(false);
  };

  const renderNotificationMessage = (notification) => {
    const { type, data } = notification;
    const doc = data.fullDocument || data;
    let name = 'User';
    let email = 'No email';
    let avatar = `https://ui-avatars.com/api/?name=User`;

    if (type === 'contact') {
      name = doc.name || name;
      email = doc.email || email;
      avatar = doc.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    } else if (type === 'order') {
      name = doc.user?.name || name;
      email = doc.user?.email || email;
      avatar = doc.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    } else if (type === 'cancelRequest') {
      name = doc.userName || name;
      email = doc.userEmail || email;
      avatar = doc.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    } else if (type === 'meeting') {
      name = doc.user?.name || name;
      email = doc.user?.email || email;
      avatar = doc.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
    }

    const formatTime = (date) => {
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    };

    return (
      <div
        className={`flex items-center gap-3 p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer ${
          theme === 'light' ? 'hover:bg-gray-200' : 'hover:bg-gray-800'
        }`}
        onClick={() => handleNotificationClick(notification)}
      >
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}`;
          }}
        />
        <div className="flex flex-col">
          <p className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
          <p className="text-sm text-blue-400">
            {type === 'contact' && 'Submitted a contact form'}
            {type === 'order' && 'Placed an order'}
            {type === 'cancelRequest' && 'Requested order cancellation'}
            {type === 'meeting' && 'Scheduled a meeting'}
          </p>
          <p className="text-[10px] text-gray-400 mt-1">{formatTime(notification.createdAt)}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <div
        className="relative group cursor-pointer"
        onClick={() => {
          if (!isDropdownOpen) handleDropdownOpen();
          else setIsDropdownOpen(false);
        }}
        onMouseEnter={() => !isDropdownOpen && handleDropdownOpen()}
        onMouseLeave={() => {
          setIsDropdownOpen(false);
          setShowSettings(false);
        }}
      >
        <FaBell className={`text-2xl ${theme === 'light' ? 'text-[#646cff]' : 'text-[#646cff]'}`} />
        {unviewedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            {unviewedCount}
          </span>
        )}
      </div>

      {isDropdownOpen && (
        <div
          className={`fixed top-11 right-0 lg:right-16 w-80 min-h-[200px] max-h-[400px] overflow-y-auto rounded-xl shadow-2xl z-[9999] transition-all ${
            theme === 'light' ? 'bg-white border border-gray-200' : 'bg-gray-900 border border-gray-700'
          }`}
          onScroll={(e) => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollTop + clientHeight >= scrollHeight - 10 && hasMore && !loadingMore) {
              fetchNotifications(page + 1);
            }
          }}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => {
            setIsDropdownOpen(false);
            setShowSettings(false);
          }}
        >
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h5 className={`font-semibold ${theme === 'light' ? 'text-[#646cff]' : 'text-white'}`}>
              Notifications
            </h5>
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full hover:bg-gray-200 text-[#646cff]"
              >
                <FaCog className="text-lg" />
              </button>
              {showSettings && (
                <div className="absolute right-0 top-7 bg-white text-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-md z-50 w-36 text-sm">
                  {[15, 30, 90].map((days) => (
                    <button
                      key={days}
                      onClick={() => {
                        setFilterDays(days);
                        setShowSettings(false);
                      }}
                      className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                        filterDays === days ? 'bg-[#646cff] text-white' : ''
                      }`}
                    >
                      Last {days} Days
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification, index) => (
              <div key={notification._id || index}>{renderNotificationMessage(notification)}</div>
            ))
          ) : (
            <p className="p-3 text-sm text-gray-600 dark:text-gray-400">No notifications</p>
          )}

          {loadingMore && (
            <div className="flex justify-center p-2">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;
