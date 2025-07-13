import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../components/Toast';
import Skeleton from '@mui/material/Skeleton';
import { socket } from '../socket';
import { ArrowForward } from '@mui/icons-material';

const Services = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/services`);
        if (response.data.success) {
          setServices(response.data.data);
        } else {
          showToast(response.data.message || 'Failed to load services', 'error');
        }
      } catch (err) {
        showToast('Error loading services', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();

    const handleServiceCreated = (newService) => {
      setServices((prev) => [...prev, newService]);
    };

    const handleServiceUpdated = (updatedService) => {
      setServices((prev) =>
        prev.map((s) => (s._id === updatedService._id ? updatedService : s))
      );
    };

    const handleServiceDeleted = ({ id }) => {
      setServices((prev) => prev.filter((s) => s._id !== id));
    };

    socket.on('serviceCreated', handleServiceCreated);
    socket.on('serviceUpdated', handleServiceUpdated);
    socket.on('serviceDeleted', handleServiceDeleted);

    return () => {
      socket.off('serviceCreated', handleServiceCreated);
      socket.off('serviceUpdated', handleServiceUpdated);
      socket.off('serviceDeleted', handleServiceDeleted);
    };
  }, []);

  const handleViewDetails = (serviceId) => {
    navigate(`/services/${serviceId}`);
  };

  const getImageUrl = (image) => {
    if (image.startsWith('http')) {
      return image;
    }
    return `/images/${image}`;
  };

  const ServiceCardSkeleton = () => (
    <div className={`p-6 rounded-lg shadow-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <Skeleton variant="rectangular" height={192} className="mb-4 rounded-md" />
      <Skeleton variant="text" height={28} width="60%" className="mb-2" />
      <Skeleton variant="text" height={20} width="90%" className="mb-2" />
      <Skeleton variant="text" height={20} width="70%" className="mb-2" />
      <Skeleton variant="text" height={20} width="40%" />
    </div>
  );

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} pt-12 px-4 sm:px-8 lg:px-12 pb-10`}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Our Services
          <div className="w-16 h-1 bg-[#646cff] mt-2 mx-auto"></div>
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)
            : services.map((service) => (
                <div
                  key={service._id}
                  className={`p-6 rounded-lg shadow-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}
                >
                  <img
                    src={getImageUrl(service.image)}
                    alt={service.title}
                    className="w-full h-48 object-contain rounded-md mb-4"
                  />
                  <h2 className="text-xl font-semibold mb-2">{service.title}</h2>
                  <p className="text-sm mb-3">{service.shortDesc}</p>
                  <p className="text-sm mb-4"><strong>Provider:</strong> {service.provider}</p>
                  <button
                    onClick={() => handleViewDetails(service._id)}
                    className={`group inline-flex items-center text-sm font-semibold transition-colors duration-300 text-[#535bf2] hover:text-[#535bf2]`}
                  >
                    View Details
                    <ArrowForward
                      fontSize="small"
                      className="ml-2 mt-0.5 transform group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </button>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};

export default Services;
