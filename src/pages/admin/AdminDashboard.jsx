import React, { useState, useEffect, useContext } from 'react';
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
  const chartTextColor = theme === 'light' ? '#1f2937' : '#ffffff'; 


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

    const fetchData = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDashboardData(response.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const message = error.response?.data?.message || 'Error loading Dashboard data.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.on('orderChange', fetchData);
    socket.on('userChange', fetchData);
    socket.on('contactChange', fetchData);
    socket.on('serviceChange', fetchData);

    return () => {
      socket.emit('leaveAdmin');
      socket.off('orderChange', fetchData);
      socket.off('userChange', fetchData);
      socket.off('contactChange', fetchData);
      socket.off('serviceChange', fetchData);
      socket.disconnect();
    };
  }, [user, navigate]);

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
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6">Admin Dashboard
          <div className="w-30 h-1 bg-[#646cff] mt-2"></div>
        </h1>

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
                    tickLabelStyle: { fill: chartTextColor }
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
            </div>
          )}

          {safeData.serviceOrders.length > 0 && (
            <div className={`p-4 rounded-lg ${theme === 'light' ? 'bg-white' : 'bg-gray-800'}`}>
              <h2 className="text-base sm:text-lg font-semibold mb-4">Service-wise Order Distribution</h2>
              <div className="w-full h-[250px] sm:h-[350px] md:h-[400px] lg:h-[450px]">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;