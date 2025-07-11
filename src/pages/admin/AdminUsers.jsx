import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaCheckSquare, FaSquare, FaTrash } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import { Pagination, Stack, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { socket } from '../../socket';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';

const AdminUsers = ({ scrollRef }) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const usersPerPage = 10;
  const [openDialog, setOpenDialog] = useState({ open: false, action: '', userId: null });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchUsers = async () => {
      if (!isOnline) {
        showToast('Internet disconnected. Please check your connection.', 'error');
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/admin/users?page=${page}&limit=${usersPerPage}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUsers(response.data.data);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Error fetching users:', error);
        const message = isOnline
          ? error.response?.status === 401
            ? 'Unauthorized access. Please log in again.'
            : error.response?.data?.message || 'Error loading Users. Please try again.'
          : 'Internet disconnected. Please check your connection.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const handleUserChange = (change) => {
      const { operationType, documentKey, fullDocument } = change;

      setUsers((prevUsers) => {
        if (operationType === 'delete') {
          return prevUsers.filter((user) => user._id !== documentKey._id);
        } else if (operationType === 'insert') {
          if (page === 1 && !prevUsers.some((u) => u._id === fullDocument._id)) {
            const updated = [fullDocument, ...prevUsers.filter((u) => u._id !== fullDocument._id)];
            return updated.slice(0, usersPerPage);
          }
          return prevUsers;
        } else if (operationType === 'update') {
          return prevUsers.map((user) =>
            user._id === documentKey._id ? fullDocument : user
          );
        }
        return prevUsers;
      });

      if (operationType === 'delete') {
        setSelectedUsers((prev) => prev.filter((id) => id !== documentKey._id));
      }
    };

    socket.on('userChange', handleUserChange);
    socket.on('connect_error', () => {
      showToast('Internet disconnected. Please check your connection.', 'error');
    });

    return () => {
      socket.off('userChange', handleUserChange);
      socket.off('connect_error');
    };
  }, [user, navigate, isOnline, page]);

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

  const handleUserInteraction = (userId) => {
    let pressTimer;
    let clickCount = 0;

    return (e) => {
      clickCount++;
      if (clickCount === 2) {
        clearTimeout(pressTimer);
        setSelectedUsers((prev) =>
          prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
        clickCount = 0;
        return;
      }

      pressTimer = setTimeout(() => {
        setSelectedUsers((prev) => prev.filter((id) => id !== userId));
        clickCount = 0;
      }, 500);

      const clear = () => {
        clearTimeout(pressTimer);
        document.removeEventListener('mouseup', clear);
        document.removeEventListener('touchend', clear);
      };

      document.addEventListener('mouseup', clear);
      document.addEventListener('touchend', clear);
    };
  };

  const deleteSelectedUsers = async () => {
    if (!isOnline) {
      showToast('Internet disconnected. Please check your connection.', 'error');
      return;
    }

    try {
      const token = Cookies.get('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        data: { userIds: selectedUsers },
      });
      setSelectedUsers([]);
      showToast('Selected users deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting users:', error);
      const message = isOnline
        ? error.response?.status === 401
          ? 'Unauthorized access. Please log in again.'
          : error.response?.data?.message || 'Error deleting Users. Please try again.'
        : 'Internet disconnected. Please check your connection.';
      showToast(message, 'error');
    }
  };

  const toggleAdmin = async (userId) => {
    if (!isOnline) {
      showToast('Internet disconnected. Please check your connection.', 'error');
      return;
    }

    try {
      const token = Cookies.get('token');
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/users/${userId}/toggle-admin`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data.error) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, isAdmin: response.data.user.isAdmin } : u))
        );
        showToast('Admin status updated', 'success');
      } else {
        showToast(response.data.message, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Failed to update admin status', 'error');
    }
  };

  const handleOpenDialog = (userId, action) => {
    setOpenDialog({ open: true, action, userId });
  };

  const handleCloseDialog = () => {
    setOpenDialog({ open: false, action: '', userId: null });
  };

  const handleConfirmToggle = () => {
    if (openDialog.userId) {
      toggleAdmin(openDialog.userId);
    }
    handleCloseDialog();
  };

  const getAvatarUrl = (u) => {
    return u?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name)}`;
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'}`}>
      {loading && <Loader />}
      <Sidebar />
      <div className="ml-16 mt-2 p-6 flex flex-col min-h-[calc(100vh-4rem)]">
        <TopBar />
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${theme === 'light' ? 'text-black' : 'text-white'}`}>
            Users
            <div className="w-12 h-1 bg-[#646cff] mt-2"></div>
          </h1>
          {selectedUsers.length > 0 && (
            <Button
              onClick={deleteSelectedUsers}
              variant="contained"
              color="error"
              startIcon={<FaTrash />}
              sx={{
                textTransform: 'none',
                fontWeight: 'bold',
                padding: { xs: '8px 12px', sm: '8px 16px' },
                backgroundColor: '#dc2626',
                '&:hover': {
                  backgroundColor: theme === 'light' ? '#dc2626' : '#991b1b',
                  transform: 'scale(1.02)',
                  transition: 'all 0.2s ease-in-out',
                },
              }}
            >
              <span className="hidden sm:inline">Delete Selected</span>
            </Button>
          )}
        </div>

        <div className="space-y-4 flex-grow">
          {users.map((u) => (
            <div
              key={u._id}
              className={`flex items-center p-4 gap-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}
              onClick={handleUserInteraction(u._id)}
              onTouchStart={handleUserInteraction(u._id)}
            >
              <div className="flex items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedUsers((prev) =>
                      prev.includes(u._id)
                        ? prev.filter((id) => id !== u._id)
                        : [...prev, u._id]
                    );
                  }}
                  className="mr-2"
                >
                  {selectedUsers.includes(u._id) ? (
                    <FaCheckSquare
                      className={`text-xl ${
                        theme === 'light' ? 'text-blue-500' : 'text-blue-400'
                      }`}
                    />
                  ) : (
                    <FaSquare
                      className={`text-xl ${
                        theme === 'light' ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    />
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                <img
                  src={getAvatarUrl(u)}
                  alt={u?.name}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u?.name || 'User')}`;
                  }}
                />

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold break-words ${
                      theme === 'light' ? 'text-black' : 'text-white'
                    }`}
                  >
                    {u.name}
                  </p>
                  <p
                    className={`text-sm break-all ${
                      theme === 'light' ? 'text-gray-600' : 'text-gray-300'
                    }`}
                  >
                    {u.email}
                  </p>
                  <p className="text-sm text-gray-500 break-words">
                    Joined: {new Date(u.createdAt).toLocaleDateString()}
                  </p>
                  <p className={`text-sm ${u.isAdmin ? 'text-green-600' : 'text-gray-500'}`}>
                    Role: {u.isAdmin ? 'Admin' : 'User'}
                  </p>
                  {user._id !== u._id && (
                    <Button
                      onClick={() => handleOpenDialog(u._id, u.isAdmin ? 'remove' : 'make')}
                      variant="contained"
                      size="small"
                      sx={{
                        marginTop: '4px',
                        textTransform: 'none',
                        fontWeight: 'medium',
                        backgroundColor: u.isAdmin
                          ? theme === 'light' ? '#ef4444' : '#dc2626'
                          : theme === 'light' ? '#3b82f6' : '#2563eb', 
                        color: '#ffffff',
                        '&:hover': {
                          transform: 'scale(1.02)',
                          transition: 'all 0.2s ease-in-out',
                          backgroundColor: u.isAdmin
                            ? theme === 'light' ? '#dc2626' : '#b91c1c'
                            : theme === 'light' ? '#2563eb' : '#1d4ed8',
                        },
                      }}
                    >
                      {u.isAdmin ? 'Remove Admin' : 'Make Admin'}
                  </Button>

                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Dialog
          open={openDialog.open}
          onClose={handleCloseDialog}
          aria-labelledby="admin-toggle-dialog-title"
          PaperProps={{
            sx: {
              borderRadius: '8px',
              backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
              color: theme === 'light' ? '#000' : '#fff',
            },
          }}
        >
          <DialogTitle id="admin-toggle-dialog-title">
            {openDialog.action === 'make' ? 'Grant Admin Access' : 'Revoke Admin Access'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ color: theme === 'light' ? '#4b5563' : '#d1d5db' }}>
              Are you sure you want to {openDialog.action === 'make' ? 'grant admin access to' : 'revoke admin access from'} this user?
              {openDialog.action === 'make'
                ? ' This will allow them to manage users, services, and other administrative tasks.'
                : ' This will remove their administrative privileges.'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
              sx={{
                textTransform: 'none',
                color: theme === 'light' ? '#6b7280' : '#9ca3af',
                '&:hover': {
                  backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
                },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmToggle}
              variant="contained"
              sx={{
                textTransform: 'none',
                backgroundColor: openDialog.action === 'make'
                  ? theme === 'light' ? '#3b82f6' : '#60a5fa'
                  : theme === 'light' ? '#f59e0b' : '#d97706',
                '&:hover': {
                  backgroundColor: openDialog.action === 'make'
                    ? theme === 'light' ? '#2563eb' : '#3b82f6'
                    : theme === 'light' ? '#d97706' : '#b45309',
                },
              }}
            >
              Confirm
            </Button>
          </DialogActions>
        </Dialog>

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

export default AdminUsers;