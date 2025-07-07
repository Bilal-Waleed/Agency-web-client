import React, { useState, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Cookies from 'js-cookie';
import { showToast } from '../Toast';
import Notification from './Notification';

const TopBar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    Cookies.remove('token');
    showToast('Logged out successfully!', 'success');
    console.log('Logout clicked');
    navigate('/');
  };

  const getAvatarUrl = (user) => {
    return user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`;
  };

  return (
    <div
      className={`fixed top-0 left-16 right-0 h-16 z-40 ${
        theme === 'light' ? 'bg-white' : 'bg-gray-900'
      } flex items-center justify-between px-6 `}
    >
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate('/')}
          className={`p-2 rounded-md relative group transition-colors duration-300 ${
            theme === 'light' ? 'text-[#646cff] hover:bg-gray-100' : 'text-[#646cff] hover:bg-gray-800'
          }`}
        >
          <FaArrowLeft className="text-xl" />
        </button>
        <IconButton onClick={toggleTheme}>
          {theme === 'light' ? (
            <Brightness4 style={{ color: '#646cff' }} />
          ) : (
            <Brightness7 className="text-white" />
          )}
        </IconButton>
      </div>
      <div className="flex items-center gap-4 relative">
        <Notification />
        <div
          className="relative"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <img
            src={getAvatarUrl(user)}
            alt="Admin"
            className="w-8 h-8 rounded-full cursor-pointer"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Admin')}`;
            }}
          />
          {isDropdownOpen && (
            <div
              className={`absolute top-8 right-0 w-48 p-4 rounded-lg shadow-lg z-50 ${
                theme === 'light' ? 'bg-white' : 'bg-gray-800'
              }`}
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              <p className={`font-semibold mb-2 ${theme === 'light' ? 'text-[#646cff]' : 'text-white'}`}>
                {user?.name} (Admin)
              </p>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 text-left"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBar;