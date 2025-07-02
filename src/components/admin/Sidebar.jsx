import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Link } from 'react-router-dom';
import { FaBars, FaTachometerAlt, FaUsers, FaBox, FaConciergeBell, FaEnvelope, FaCalendarAlt } from 'react-icons/fa';

const Sidebar = () => {
  const { theme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <div
      className={`fixed top-0 left-0 h-screen z-50 ${
        isOpen ? 'w-64' : 'w-16'
      } ${theme === 'light' ? 'bg-white' : 'bg-gray-900'} transition-all duration-300 flex flex-col `}
    >
      <div className="p-4">
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-md ${theme === 'light' ? 'text-[#646cff] hover:bg-gray-100' : 'text-[#646cff] hover:bg-gray-800'}`}
        >
          <FaBars className="text-2xl" />
        </button>
      </div>
      <nav className="flex-1">
        <ul>
          {[
            { to: '/admin/dashboard', icon: <FaTachometerAlt />, text: 'Dashboard' },
            { to: '/admin/users', icon: <FaUsers />, text: 'Users' },
            { to: '/admin/orders', icon: <FaBox />, text: 'Orders' },
            { to: '/admin/services', icon: <FaConciergeBell />, text: 'Services' },
            { to: '/admin/messages', icon: <FaEnvelope />, text: 'Messages' },
            { to: '/admin/scheduled-meetings', icon: <FaCalendarAlt />, text: 'Scheduled Meetings' },
          ].map((item) => (
            <li key={item.text}>
              <Link
                to={item.to}
                className={`flex items-center p-4 px-6 relative group transition-colors duration-300 ${
                  theme === 'light' ? 'text-[#646cff] hover:text-[#535bf2]' : 'text-[#646cff] hover:text-white'
                }`}
              >
                <span className="text-xl mr-4">{item.icon}</span>
                {isOpen && <span>{item.text}</span>}
                <span
                  className={`absolute bottom-[-2px] left-0 w-full h-[1.5px] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                    theme === 'light' ? 'bg-[#535bf2]' : 'bg-[#646cff]'
                  }`}
                ></span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;