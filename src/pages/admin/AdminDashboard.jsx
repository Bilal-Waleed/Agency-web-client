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
import Loader from '../../components/Loader';
import dayjs from 'dayjs';
import { FaRegCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import {
  BarChart,
  LineChart,
  PieChart,
} from '@mui/x-charts';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const AdminDashboard = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const chartTextColor = theme === 'light' ? '#1f2937' : '#ffffff'; 
  const [startDate, setStartDate] = useState(dayjs().subtract(15, 'day'));
  const [endDate, setEndDate] = useState(dayjs());

  const fetchData = async (start, end, showLoader = true) => {
  if (showLoader) setLoading(true);
  try {
    const token = Cookies.get('token');
    const response = await axios.get(
      `${import.meta.env.VITE_BACKEND_URL}/api/admin/dashboard?start=${start}&end=${end}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setDashboardData(response.data.data);
    setLastUpdated(new Date());
  } catch (error) {
    const message = error.response?.data?.message || 'Error loading Dashboard data.';
    showToast(message, 'error');
  } finally {
    if (showLoader) setLoading(false);
  }
};

  const [dashboardData, setDashboardData] = useState({
    monthlyOrders: [],
    monthlyUsers: [],
    monthlyContacts: [],
    serviceOrders: [],
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    socket.emit('joinAdmin');

    const handleUpdate = () => {
      console.log("Realtime triggered");
      fetchData(startDate, endDate, false);
    };

    fetchData(startDate, endDate, true);

    socket.on('orderChange', handleUpdate);
    socket.on('userChange', handleUpdate);
    socket.on('contactChange', handleUpdate);
    socket.on('serviceChange', handleUpdate);

    return () => {
      socket.emit('leaveAdmin');
      socket.off('orderChange', handleUpdate);
      socket.off('userChange', handleUpdate);
      socket.off('contactChange', handleUpdate);
      socket.off('serviceChange', handleUpdate);
      socket.disconnect();
    };
  }, [user, navigate, startDate, endDate]);

  const safeData = {
    monthlyOrders: dashboardData.monthlyOrders.filter(item => item._id),
    monthlyUsers: dashboardData.monthlyUsers.filter(item => item._id),
    monthlyContacts: dashboardData.monthlyContacts.filter(item => item._id),
    serviceOrders: dashboardData.serviceOrders,
  };

  const textColor = theme === 'light' ? '#000' : '#fff';

  const chartCommonStyles = {
    backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
    borderRadius: 10,
    padding: '1rem',
    animationDuration: '5000ms',
    '& .MuiChartsAxis-tickLabel': {
      fill: textColor,
      fontSize: window.innerWidth < 640 ? 10 : 12,
    },
    '& .MuiChartsLegend-label': {
      fill: textColor,
      fontSize: window.innerWidth < 640 ? 10 : 12,
    },
    '& .MuiChartsTooltip-tooltip': {
      color: textColor,
      backgroundColor: theme === 'light' ? '#f3f4f6' : '#374151',
      fontSize: window.innerWidth < 640 ? 10 : 12,
    },
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'} text-${theme === 'light' ? 'black' : 'white'}`}>
      {loading && <Loader />}
      <Sidebar />
      <div className="ml-16 mt-2 p-4 sm:p-6 flex flex-col flex-grow min-h-screen">
        <TopBar />
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
            Admin Dashboard
            <div className="w-30 h-1 bg-[#646cff] mt-2"></div>
          </h1>

        <div className="flex gap-2 items-center justify-end flex-wrap w-full sm:w-auto">
          <div className="relative w-[110px] sm:w-[130px] md:w-[150px]">
            <DatePicker
              selected={startDate.toDate()}
              onChange={(date) => {
                const newDate = dayjs(date);
                setStartDate(newDate);
                if (endDate && newDate) {
                  fetchData(newDate, endDate);
                }
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="Start"
              ref={(ref) => (window.startRef = ref)}
              className={`w-full py-[6px] pr-8 pl-2 rounded text-xs sm:text-sm ${
                theme === 'dark'
                  ? 'bg-white text-black border border-black'
                  : 'bg-black text-white border border-white'
              }`}
            />
            <FaRegCalendarAlt
              onClick={() => window.startRef.setOpen(true)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm cursor-pointer ${
                theme === 'dark' ? 'text-black' : 'text-white'
              }`}
            />
          </div>

          <div className="relative w-[110px] sm:w-[130px] md:w-[150px]">
            <DatePicker
              selected={endDate.toDate()}
              onChange={(date) => {
                const newDate = dayjs(date);
                setEndDate(newDate);
                if (startDate && newDate) {
                  fetchData(startDate, newDate);
                }
              }}
              dateFormat="yyyy-MM-dd"
              placeholderText="End"
              ref={(ref) => (window.endRef = ref)}
              className={`w-full py-[6px] pr-8 pl-2 rounded text-xs sm:text-sm ${
                theme === 'dark'
                  ? 'bg-white text-black border border-black'
                  : 'bg-black text-white border border-white'
              }`}
            />
            <FaRegCalendarAlt
              onClick={() => window.endRef.setOpen(true)}
              className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs sm:text-sm cursor-pointer ${
                theme === 'dark' ? 'text-black' : 'text-white'
              }`}
            />
          </div>
        </div>
      </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {safeData.monthlyOrders.length > 0 && (
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly Orders</h2>
              <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                <BarChart
                  xAxis={[{
                    scaleType: 'band',
                    data: safeData.monthlyOrders.map(d => d._id),
                    tickLabelStyle: { fill: chartTextColor }
                  }]}
                  series={[{
                    data: safeData.monthlyOrders.map(d => d.count),
                    label: 'Orders',
                    color: '#6366f1',
                    labelStyle: { fill: chartTextColor }
                  }]}
                  sx={{
                    ...chartCommonStyles,
                    '& .MuiChartsLegend-root text': {
                      fill: chartTextColor,
                    },
                    '& .MuiChartsAxis-root text': {
                      fill: chartTextColor,
                    }
                  }}
                  width={undefined}
                  height={undefined}
                  slotProps={{ container: { className: 'w-full h-full' } }}
                />
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-400 mt-4 text-right">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {safeData.monthlyUsers.length > 0 && (
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly New Users</h2>
              <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                <LineChart
                  xAxis={[{
                    scaleType: 'point',
                    data: safeData.monthlyUsers.map(d => d._id),
                    tickLabelStyle: { fill: chartTextColor }
                  }]}
                  series={[{
                    data: safeData.monthlyUsers.map(d => d.count),
                    label: 'Users',
                    area: true,
                    showMark: true,
                    color: '#10b981',
                    labelStyle: { fill: chartTextColor }
                  }]}
                  sx={{
                    ...chartCommonStyles,
                    '& .MuiChartsLegend-root text': {
                      fill: chartTextColor,
                    },
                    '& .MuiChartsAxis-root text': {
                      fill: chartTextColor,
                    }
                  }}
                  width={undefined}
                  height={undefined}
                  slotProps={{ container: { className: 'w-full h-full' } }}
                />
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-400 mt-4 text-right">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {safeData.monthlyContacts.length > 0 && (
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly Contacts</h2>
              <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                <BarChart
                  xAxis={[{
                    scaleType: 'band',
                    data: safeData.monthlyContacts.map(d => d._id),
                    tickLabelStyle: { fill: chartTextColor },
                    
                  }]}
                  series={[{
                    data: safeData.monthlyContacts.map(d => d.count),
                    label: 'Contacts',
                    color: '#f59e0b',
                    labelStyle: { fill: chartTextColor }
                  }]}
                  sx={{
                    ...chartCommonStyles,
                    '& .MuiChartsLegend-root text': { fill: chartTextColor },
                    '& .MuiChartsAxis-root text': { fill: chartTextColor }
                  }}
                  width={undefined}
                  height={undefined}
                  slotProps={{ container: { className: 'w-full h-full' } }}
                />
              </div>
              {lastUpdated && (
                <p className="text-sm text-gray-400 mt-4 text-right">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}

          {safeData.serviceOrders.length > 0 && (
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">Service-wise Order Distribution</h2>
              <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[400px]">
                <PieChart
                  series={[{
                    data: safeData.serviceOrders.map((item, idx) => ({
                      id: idx,
                      value: item.count,
                      label: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
                    })),
                    labelFontSize: window.innerWidth < 640 ? 6 : window.innerWidth < 1024 ? 10 : 12,
                    labelColor: chartTextColor
                  }]}
                  sx={{
                    ...chartCommonStyles,
                    '& .MuiChartsLegend-root text': {
                      fill: chartTextColor,
                    },
                    '& .MuiChartsAxis-root text': {
                      fill: chartTextColor,
                    }
                  }}
                  width={undefined}
                  height={undefined}
                  slotProps={{ container: { className: 'w-full h-full' } }}
                />
              </div>
                {lastUpdated && (
                  <p className="text-sm text-gray-400 mt-4 text-right">
                    Last updated: {lastUpdated.toLocaleTimeString()}
                  </p>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;