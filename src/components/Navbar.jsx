import React, { useState, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { IconButton } from '@mui/material';
import { Brightness4, Brightness7, Menu, Close } from '@mui/icons-material';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import Cookies from 'js-cookie';
import { showToast } from './Toast';

const Navbar = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, setUser } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const baseNavItems = ['Home', 'About', 'Contact', 'Services'];
  const authNavItems = user
    ? ['Logout']
    : ['Register', 'Login'];
  const navItems = user?.isAdmin
    ? [...baseNavItems, 'Admin', ...authNavItems]
    : [...baseNavItems, ...authNavItems];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    setUser(null);
    Cookies.remove('token');
    showToast('Logged out successfully!', 'success');
    navigate('/');
    if (isSidebarOpen) {
      toggleSidebar();
    }
  };

  return (
    <header className={`${theme === 'light' ? 'bg-white' : 'bg-gray-900'} fixed w-full top-0 z-50 h-16`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        <h2 className="text-3xl font-bold text-[#646cff]">Bold-Zyt</h2>

        <nav className="hidden lg:flex items-center">
          <ul className="flex items-center gap-8 list-none">
            {navItems.map((item) => {
              if (item === 'Logout') {
                return (
                  <li key={item}>
                    <button
                      onClick={handleLogout}
                      className={`
                        relative group transition-colors duration-300
                        ${theme === 'dark' ? 'text-[#646cff] hover:text-white' : 'text-[#646cff] hover:text-[#535bf2]'}
                      `}
                    >
                      Logout
                      <span
                        className={`
                          absolute bottom-[-4px] left-0 w-full h-[2px] transform scale-x-0 
                          group-hover:scale-x-100 transition-transform duration-300
                        `}
                        style={{
                          backgroundColor: theme === 'dark' ? '#646cff' : '#535bf2',
                        }}
                      ></span>
                    </button>
                  </li>
                );
              }
              const path = item === 'Home' ? '/' : item === 'Admin' ? '/admin/dashboard' : `/${item.toLowerCase()}`;
              const isActive = location.pathname === path;

              return (
                <li key={item}>
                  <NavLink
                    to={path}
                    className={`
                      relative group transition-colors duration-300
                      ${theme === 'dark' && isActive ? 'text-white' : ''}
                      ${theme === 'dark' && !isActive ? 'text-[#646cff] hover:text-white' : ''}
                      ${theme === 'light' ? 'text-[#646cff] hover:text-[#535bf2]' : ''}
                    `}
                  >
                    {item}
                    <span
                      className={`
                        absolute bottom-[-4px] left-0 w-full h-[2px] transform scale-x-0 
                        group-hover:scale-x-100 transition-transform duration-300 
                        ${isActive ? 'scale-x-100' : ''}
                      `}
                      style={{
                        backgroundColor: theme === 'dark' ? '#646cff' : '#535bf2',
                      }}
                    ></span>
                  </NavLink>
                </li>
              );
            })}
            <li>
              <IconButton onClick={toggleTheme} className="ml-8">
                {theme === 'light' ? (
                  <Brightness4 style={{ color: '#646cff' }} />
                ) : (
                  <Brightness7 className="text-white" />
                )}
              </IconButton>
            </li>
          </ul>
        </nav>

        <div className="lg:hidden flex items-center">
          <IconButton onClick={toggleTheme}>
            {theme === 'light' ? (
              <Brightness4 style={{ color: '#646cff' }} />
            ) : (
              <Brightness7 className="text-white" />
            )}
          </IconButton>
          <IconButton onClick={toggleSidebar}>
            {isSidebarOpen ? (
              <Close className={`${theme === 'light' ? 'text-[#646cff]' : 'text-white'}`} />
            ) : (
              <Menu className={`${theme === 'light' ? 'text-[#646cff]' : 'text-white'}`} />
            )}
          </IconButton>
        </div>
      </div>

      <div
        className={`
          fixed top-0 right-0 h-full w-64 ${theme === 'light' ? 'bg-white' : 'bg-gray-900'} 
          shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} 
          transition-transform duration-300 ease-in-out lg:hidden z-40
        `}
      >
        <div className="flex justify-end p-4">
          <IconButton onClick={toggleSidebar}>
            <Close className={`${theme === 'light' ? 'text-[#646cff]' : 'text-white'}`} />
          </IconButton>
        </div>
        <ul className="flex flex-col gap-4 p-6 list-none">
          {navItems.map((item) => {
            if (item === 'Logout') {
              return (
                <li key={item}>
                  <button
                    onClick={handleLogout}
                    className={`
                      relative transition-colors duration-300
                      ${theme === 'dark' ? 'text-[#646cff] hover:text-white' : 'text-[#646cff] hover:text-[#535bf2]'}
                    `}
                  >
                    Logout
                  </button>
                </li>
              );
            }
            const path = item === 'Home' ? '/' : item === 'Admin' ? '/admin/dashboard' : `/${item.toLowerCase()}`;
            const isActive = location.pathname === path;

            return (
              <li key={item}>
                <NavLink
                  to={path}
                  onClick={toggleSidebar}
                  className={`
                    relative transition-colors duration-300
                    ${theme === 'dark' && isActive ? 'text-white' : ''}
                    ${theme === 'dark' && !isActive ? 'text-[#646cff] hover:text-white' : ''}
                    ${theme === 'light' ? 'text-[#646cff]' : ''}
                  `}
                >
                  {item}
                  {isActive && (
                    <span
                      className="absolute left-0 top-6 w-full h-[2px] bg-[#646cff]"
                    ></span>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
};

export default Navbar;