import React, { useState, useEffect, useContext, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../../components/Toast';
import dayjs from 'dayjs';
import { FaRegCalendarAlt } from 'react-icons/fa';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BarChart, LineChart, PieChart } from '@mui/x-charts';
import { socket } from '../../socket';

const AdminDashboard = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());
  const [dashboardData, setDashboardData] = useState({
    monthlyOrders: [],
    monthlyUsers: [],
    monthlyContacts: [],
    serviceOrders: [],
  });
  const startRef = useRef();
  const endRef = useRef();

  const chartTextColor = theme === 'light' ? '#1f2937' : '#ffffff';

  const chartCommonStyles = {
    backgroundColor: theme === 'light' ? '#fff' : '#1f2937',
    borderRadius: 10,
    padding: '1rem',
    '& .MuiChartsAxis-tickLabel': {
      fill: `${chartTextColor} !important`,
      fontSize: window.innerWidth < 640 ? 10 : 12,
    }
  };
  

  const fetchData = async (start, end, showLoader = true) => {
    if (!user?.isAdmin) return; 
    if (showLoader) setLoading(true);
    try {
      const token = Cookies.get('token');
      const startFormatted = dayjs(start).format('YYYY-MM-DD');
      const endFormatted = dayjs(end).format('YYYY-MM-DD');
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/dashboard?start=${startFormatted}&end=${endFormatted}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = response.data.data || {};
      setDashboardData({
        monthlyOrders: data.monthlyOrders || [],
        monthlyUsers: data.monthlyUsers || [],
        monthlyContacts: data.monthlyContacts || [],
        serviceOrders: data.serviceOrders || [],
      });
      setLastUpdated(new Date());
    } catch (error) {
      const message = error.response?.data?.message || 'Error loading dashboard data.';
      showToast(message, 'error');
      console.error('Dashboard fetch error:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    fetchData(startDate, endDate);

    const handleUpdate = () => {
      if (!user?.isAdmin) return; 
      console.log('Socket event triggered, refetching data');
      fetchData(startDate, endDate, false);
    };

    socket.on('orderChange', handleUpdate);
    socket.on('contactChange', handleUpdate);
    socket.on('serviceChange', handleUpdate);
    socket.on('connect_error', () => {
      showToast('Internet disconnected. Please check your connection.', 'error');
    });

    return () => {
      socket.off('orderChange', handleUpdate);
      socket.off('contactChange', handleUpdate);
      socket.off('serviceChange', handleUpdate);
      socket.off('connect_error');
    };
  }, [user, navigate, startDate, endDate]);

  const safeData = {
    monthlyOrders: dashboardData.monthlyOrders.filter(item => item && item._id) || [],
    monthlyUsers: dashboardData.monthlyUsers.filter(item => item && item._id) || [],
    monthlyContacts: dashboardData.monthlyContacts.filter(item => item && item._id) || [],
    serviceOrders: dashboardData.serviceOrders.filter(item => item && item.name) || [],
  };

  const ChartSkeleton = ({ height = 300 }) => {
    const barColor = theme === 'light' ? 'rgba(209, 213, 219, 0.8)' : 'rgba(75, 85, 99, 0.7)';
    const bgColor = theme === 'light' ? 'rgba(243, 244, 246, 1)' : 'rgba(31, 41, 55, 1)';

    return (
      <div
        className="w-full animate-pulse rounded-lg"
        style={{
          height,
          backgroundColor: bgColor,
          padding: '1rem',
        }}
      >
        <div className="flex items-end justify-between h-full px-2 py-2">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="rounded-md"
              style={{
                width: '10%',
                height: `${30 + i * 10}%`,
                backgroundColor: barColor,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const PieChartSkeleton = ({ size = 250 }) => {
    const backgroundColor = theme === 'light' ? '#f3f4f6' : '#1f2937';
    const sliceColor = theme === 'light' ? '#e5e7eb' : '#374151';
    const sliceCount = 6;

    return (
      <div
        className="animate-pulse mx-auto relative rounded-full"
        style={{
          width: size,
          height: size,
          backgroundColor,
        }}
      >
        <div
          className="absolute rounded-full"
          style={{
            width: size * 0.4,
            height: size * 0.4,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: theme === 'light' ? '#d1d5db' : '#111827',
          }}
        />
        {[...Array(sliceCount)].map((_, i) => {
          const rotate = i * (360 / sliceCount);
          return (
            <div
              key={i}
              className="absolute origin-bottom-left"
              style={{
                width: '50%',
                height: '50%',
                backgroundColor: sliceColor,
                transform: `rotate(${rotate}deg) skewY(-30deg)`,
                transformOrigin: '100% 100%',
                opacity: 0.8 - i * 0.1,
                borderRadius: '0 100% 0 0',
                top: 0,
                left: 0,
              }}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-900'} text-${theme === 'light' ? 'black' : 'white'}`}>
      <Sidebar />
      <div className="ml-16 mt-2 p-4 sm:p-6 flex flex-col flex-grow">
        <TopBar />
        {!user?.isAdmin ? (
          <p className="text-center text-gray-500 mt-4">No access to view dashboard.</p>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                Admin Dashboard
                <div className="w-24 h-1 bg-[#646cff] mt-2 rounded"></div>
              </h1>
              <div className="flex gap-2 items-center justify-end flex-wrap w-full sm:w-auto">
                <div className="relative w-[120px] sm:w-[140px]">
                  <DatePicker
                    ref={startRef}
                    selected={startDate}
                    onChange={(date) => {
                      if (date > endDate) {
                        showToast('Start date cannot be after end date', 'error');
                        return;
                      }
                      setStartDate(date);
                      fetchData(date, endDate);
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Start Date"
                    maxDate={endDate}
                    className={`w-full py-2 px-3 rounded text-sm ${
                      theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                    } border`}
                  />
                  <FaRegCalendarAlt
                    onClick={() => startRef.current?.setOpen(true)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="relative w-[120px] sm:w-[140px]">
                  <DatePicker
                    ref={endRef}
                    selected={endDate}
                    onChange={(date) => {
                      if (date < startDate) {
                        showToast('End date cannot be before start date', 'error');
                        return;
                      }
                      setEndDate(date);
                      fetchData(startDate, date);
                    }}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="End Date"
                    minDate={startDate}
                    className={`w-full py-2 px-3 rounded text-sm ${
                      theme === 'dark' ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                    } border`}
                  />
                  <FaRegCalendarAlt
                    onClick={() => endRef.current?.setOpen(true)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm cursor-pointer ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  />
                </div>
              </div>
            </div>
            {safeData.monthlyOrders.length === 0 &&
            safeData.monthlyUsers.length === 0 &&
            safeData.monthlyContacts.length === 0 &&
            safeData.serviceOrders.length === 0 && !loading ? (
              <div className="text-center text-gray-500 mt-8 text-lg">
                No data available for the selected date range.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly Orders</h2>
                  <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                    {loading ? (
                      <ChartSkeleton height="100%" />
                    ) : safeData.monthlyOrders.length > 0 ? (
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: safeData.monthlyOrders.map(d => d._id)  }]}
                        series={[{ data: safeData.monthlyOrders.map(d => d.count), label: 'Orders', color: '#6366f1' }]}
                        sx={chartCommonStyles}
                        slotProps={{ container: { className: 'w-full h-full' } }}
                      />
                    ) : (
                      <p className="text-center text-gray-500 mt-4">No orders data</p>
                    )}
                  </div>
                  {lastUpdated && !loading && (
                    <p className="text-sm text-gray-400 mt-4 text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  )}
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly New Users</h2>
                  <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                    {loading ? (
                      <ChartSkeleton height="100%" />
                    ) : safeData.monthlyUsers.length > 0 ? (
                      <LineChart
                        xAxis={[{ scaleType: 'point', data: safeData.monthlyUsers.map(d => d._id) }]}
                        series={[{ data: safeData.monthlyUsers.map(d => d.count), label: 'Users', area: true, showMark: true, color: '#10b981' }]}
                        sx={chartCommonStyles}
                        slotProps={{ container: { className: 'w-full h-full' } }}
                      />
                    ) : (
                      <p className="text-center text-gray-500 mt-4">No user data</p>
                    )}
                  </div>
                  {lastUpdated && !loading && (
                    <p className="text-sm text-gray-400 mt-4 text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  )}
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4">Monthly Contacts</h2>
                  <div className="w-full h-[200px] sm:h-[300px] md:h-[350px] lg:h-[400px]">
                    {loading ? (
                      <ChartSkeleton height="100%" />
                    ) : safeData.monthlyContacts.length > 0 ? (
                      <BarChart
                        xAxis={[{ scaleType: 'band', data: safeData.monthlyContacts.map(d => d._id) }]}
                        series={[{ data: safeData.monthlyContacts.map(d => d.count), label: 'Contacts', color: '#f59e0b' }]}
                        sx={chartCommonStyles}
                        slotProps={{ container: { className: 'w-full h-full' } }}
                      />
                    ) : (
                      <p className="text-center text-gray-500 mt-4">No contact data</p>
                    )}
                  </div>
                  {lastUpdated && !loading && (
                    <p className="text-sm text-gray-400 mt-4 text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  )}
                </div>
                <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
                  <h2 className="text-base sm:text-lg font-semibold mb-4">Service-wise Order Distribution</h2>
                  <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[400px]">
                    {loading ? (
                      <PieChartSkeleton height="100%" />
                    ) : safeData.serviceOrders.length > 0 ? (
                      <PieChart
                        series={[{
                          data: safeData.serviceOrders.map((item, id) => ({
                            id: id,
                            value: item.count,
                            label: item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name,
                          })),
                          labelFontSize: window.innerWidth < 640 ? 6 : window.innerWidth < 1024 ? 10 : 12,
                        }]}
                        sx={chartCommonStyles}
                        slotProps={{ container: { className: 'w-full h-full' } }}
                      />
                    ) : (
                      <p className="text-center text-gray-500 mt-4">No service data</p>
                    )}
                  </div>
                  {lastUpdated && !loading && (
                    <p className="text-sm text-gray-400 mt-4 text-right">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;