import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaCheckSquare, FaSquare, FaPlus } from 'react-icons/fa';
import axios from 'axios';
import Cookies from 'js-cookie';
import EditServiceModal from '../../components/admin/EditServiceModal';
import { showToast } from '../../components/Toast';
import Loader from '../../components/Loader';
import { socket } from '../../socket';
import Sidebar from '../../components/admin/Sidebar';
import TopBar from '../../components/admin/TopBar';
import { Skeleton } from '@mui/material';

const AdminServices = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [editService, setEditService] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteService, setDeleteService] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }

    const fetchServices = async () => {
      setLoading(true);
      try {
        const token = Cookies.get('token');
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/services`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setServices(response.data.data);
      } catch (error) {
        console.error('Error fetching services:', error);
        const message = error.response?.data?.error || 'Error loading services. Please try again.';
        showToast(message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();

    const handleServiceCreated = (newService) => {
      setServices((prev) => {
        if (prev.some((service) => service._id === newService._id)) {
          return prev;
        }
        return [...prev, newService];
      });
    };

    const handleServiceUpdated = (updatedService) => {
      setServices((prev) =>
        prev.map((service) =>
          service._id === updatedService._id ? updatedService : service
        )
      );
    };

    const handleServiceDeleted = ({ id }) => {
      setServices((prev) => prev.filter((service) => service._id !== id));
      setSelectedServices((prev) => prev.filter((serviceId) => serviceId !== id));
    };

    socket.on('serviceCreated', handleServiceCreated);
    socket.on('serviceUpdated', handleServiceUpdated);
    socket.on('serviceDeleted', handleServiceDeleted);

    return () => {
      socket.off('serviceCreated', handleServiceCreated);
      socket.off('serviceUpdated', handleServiceUpdated);
      socket.off('serviceDeleted', handleServiceDeleted);
    };
  }, [user, navigate]);

  const handleEdit = (service) => {
    setEditService(service);
  };

  const handleCreate = () => {
    setEditService({
      _id: '',
      title: '',
      provider: '',
      shortDesc: '',
      fullDesc: '',
      image: '',
      minTime: '',
      budget: '',
      faqs: [],
      imageFile: null,
    });
  };

  const handleSave = async (formData) => {
    try {
      const token = Cookies.get('token');
      const isNewService = !formData.get('_id');
      const response = await axios({
        method: isNewService ? 'POST' : 'PUT',
        url: `${import.meta.env.VITE_BACKEND_URL}/api${isNewService ? '' : '/admin'}/services${isNewService ? '' : `/${formData.get('_id')}`}`,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        data: formData,
      });

      setServices((prev) =>
        isNewService
          ? [...prev, response.data.data]
          : prev.map((service) =>
              service._id === formData.get('_id') ? response.data.data : service
            )
      );
    } catch (error) {
      console.error('Error saving service:', error);
      const message = error.response?.data?.error || 'Error saving service. Please try again.';
      throw new Error(message);
    }
  };

  const handleDeleteSelected = async () => {
    setDeleteService(true);
    try {
      const token = Cookies.get('token');
      await Promise.all(
        selectedServices.map((serviceId) =>
          axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/services/${serviceId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSelectedServices([]);
      showToast('Selected services deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting services:', error);
      const message = error.response?.data?.error || 'Error deleting services. Please try again.';
      showToast(message, 'error');
    } finally{
      setDeleteService(false);
    }
  };

  const toggleSelection = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleMouseDown = (service) => {
    const timer = setTimeout(() => {
      toggleSelection(service._id);
    }, 500);
    setLongPressTimer(timer);
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const ServiceCardSkeleton = () => {
  return (
    <div
      className={`p-4 rounded-lg shadow-md flex justify-between items-center ${
        theme === 'light' ? 'bg-white' : 'bg-gray-800'
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: '4px', bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
        <div className="flex flex-col flex-1">
          <Skeleton variant="text" width="60%" height={20} sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
          <Skeleton variant="text" width="80%" height={16} sx={{ bgcolor: theme === 'light' ? 'grey.200' : 'grey.700' }} />
        </div>
      </div>
      <Skeleton variant="circular" width={24} height={24} sx={{ bgcolor: theme === 'light' ? 'grey.300' : 'grey.700' }} />
    </div>
  );
};


  const handleDoubleClick = (service) => {
    toggleSelection(service._id);
  };

  return (
    <div
      className={`min-h-screen ${
        theme === 'light' ? 'bg-gray-100 text-gray-900' : 'bg-gray-900 text-gray-100'
      }`}
    >
      <Sidebar />
      <div className="ml-16 mt-2 p-6">
        <TopBar />
        <div className="flex justify-between items-center mb-6">
          <h1
            className={`text-3xl font-bold ${
              theme === 'light' ? 'text-gray-900' : 'text-gray-100'
            }`}
          >
            Services
            <div className="w-16 h-1 bg-[#646cff] mt-2"></div>
          </h1>
          <div className="flex gap-2">
            {selectedServices.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                disabled={deleteService}
                className={`px-2 py-2 sm:px-4 sm:py-2 rounded-md flex items-center 
                  ${deleteService
                    ? 'bg-gray-400 text-white cursor-not-allowed' 
                    : theme === 'light'
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-red-600 text-gray-100 hover:bg-red-700'
                  }`}
              >
                <FaTrash className="mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Delete Selected</span>
              </button>
            )}
            <button
              onClick={handleCreate}
              className={`px-2 py-2 sm:px-4 sm:py-2 rounded-md flex items-center ${
                theme === 'light'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-[#646cff] text-gray-100 hover:bg-blue-700'
              }`}
            >
              <FaPlus className="mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Create Service</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading
            ? [...Array(6)].map((_, id) => <ServiceCardSkeleton key={id} />)
            : services.map((service) => (
            <div
              key={service._id}
              className={`p-4 rounded-lg ${
                theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-100'
              } flex justify-between items-center relative shadow-md`}
              onMouseDown={() => handleMouseDown(service)}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={() => handleDoubleClick(service)}
            >
              <div className="flex items-center">
                <button
                  onClick={() => toggleSelection(service._id)}
                  className="mr-3"
                >
                  {selectedServices.includes(service._id) ? (
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
                <div>
                  <h3 className="text-lg font-semibold">{service.title}</h3>
                  <p className="text-sm">{service.shortDesc}</p>
                </div>
              </div>
              <button onClick={() => handleEdit(service)}>
                <FaEdit
                  className={`text-xl ${
                    theme === 'light' ? 'text-blue-500' : 'text-[#646cff]'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        {editService && (
          <EditServiceModal
            service={editService}
            onClose={() => setEditService(null)}
            onSave={handleSave}
          />
        )}
      </div>
    </div>
  );
};

export default AdminServices;