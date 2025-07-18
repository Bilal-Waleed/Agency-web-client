import React, { useState, useEffect, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { Breadcrumbs, Link, Typography } from '@mui/material';
import { showToast } from '../components/Toast';
import Skeleton from '@mui/material/Skeleton';
import { socket } from '../socket';
import ScheduleMeetingModal from '../components/ScheduleMeetingModal';
import { FaCalendarAlt } from 'react-icons/fa';

const Service = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchServiceById = async () => {
      try {
        const response = await axios.get(`/api/services/${id}`);
        if (response.data.success) {
          setSelectedService(response.data.data);
        } else {
          console.log(response.data.message || 'Service not found', 'error');
          navigate('/services');
        }
      } catch (err) {
        showToast('Error loading service', 'info');
        navigate('/services');
      } finally {
        setLoading(false);
      }
    };

    fetchServiceById();

    const handleServiceUpdated = (updatedService) => {
      if (updatedService._id === id) {
        setSelectedService({ ...updatedService });
      }
    };

    const handleServiceDeleted = ({ id: deletedId }) => {
      if (deletedId === id) {
        showToast('This service has been deleted', 'info');
        navigate('/services');
      }
    };

    socket.on('serviceUpdated', handleServiceUpdated);
    socket.on('serviceDeleted', handleServiceDeleted);

    return () => {
      socket.off('serviceUpdated', handleServiceUpdated);
      socket.off('serviceDeleted', handleServiceDeleted);
    };
  }, [id, navigate]);

  const handleOrderNow = (service) => {
    if (!user) {
      showToast('Please log in to place an order', 'info');
      navigate('/login');
    } else {
      navigate(`/order`, { state: { projectType: service.title } });
    }
  };

  const handleScheduleMeeting = () => {
    if (!user) {
      showToast('Please log in to schedule a meeting', 'info');
      navigate('/login');
    } else {
      setIsModalOpen(true);
    }
  };

  const getImageUrl = (image) => {
    if (image.startsWith('http')) {
      return image;
    }
    return `/images/${image}`;
  };

  if (loading) {
  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} pt-18 px-4 sm:px-8 lg:px-12 pb-10`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 mt-4">
          <div className="w-full md:w-3/5 lg:w-2/4 mx-auto">
            <Skeleton variant="rectangular" height={300} className="rounded-lg" />
          </div>
          <div className="lg:w-1/2 w-full space-y-4">
            <Skeleton variant="text" height={40} width="70%" />
            <Skeleton variant="text" height={10} width="20%" />
            <Skeleton variant="text" height={24} width="100%" />
            <Skeleton variant="text" height={20} width="80%" />
            <Skeleton variant="text" height={20} width="60%" />
            <Skeleton variant="text" height={20} width="40%" />
            <div className="flex gap-4 mt-4">
              <Skeleton variant="rectangular" height={40} width={120} className="rounded-md" />
              <Skeleton variant="rectangular" height={40} width={180} className="rounded-md" />
            </div>
          </div>
        </div>
        <div className="mt-20 space-y-4">
          <Skeleton variant="text" height={36} width="50%" />
          <Skeleton variant="text" height={10} width="20%" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border-b pb-4 space-y-2">
              <Skeleton variant="text" height={20} width="60%" />
              <Skeleton variant="text" height={16} width="90%" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


  if (!selectedService) return null;

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'} pt-18 px-4 sm:px-8 lg:px-12 pb-10`}>
      <div className="max-w-5xl mx-auto">
        <Breadcrumbs
          aria-label="breadcrumb"
          separator="/"
          sx={{
            '& .MuiBreadcrumbs-separator': {
              color: theme === 'light' ? 'text.primary' : '#ffffff',
            },
          }}
        >
          <Link
            onClick={() => navigate('/services')}
            underline="hover"
            sx={{
              color: theme === 'light' ? 'text.primary' : '#ffffff',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Services
          </Link>
          <Typography
            sx={{
              color: theme === 'light' ? 'text.primary' : '#ffffff',
            }}
          >
            {selectedService.title}
          </Typography>
        </Breadcrumbs>
        <div className="flex flex-col lg:flex-row gap-12 mt-4">
          <div className="w-full md:w-3/5 lg:w-2/4 mx-auto">
            <img
              src={getImageUrl(selectedService.image)}
              alt={selectedService.title}
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="lg:w-1/2 w-full">
            <h1 className="text-3xl font-bold mb-2">{selectedService.title}</h1>
            <div className="w-20 h-1 bg-[#646cff] mb-4"></div>
            <p className="text-lg mb-4">{selectedService.fullDesc}</p>
            <p className="text-sm mb-2"><strong>Provider:</strong> {selectedService.provider}</p>
            <p className="text-sm mb-2"><strong>Minimum Time:</strong> {selectedService.minTime}</p>
            <p className="text-sm mb-4"><strong>Minimum Budget:</strong> {selectedService.budget}</p>
            <div className="flex gap-4">
              <button
                onClick={() => handleOrderNow(selectedService)}
                className="py-2 px-2 bg-[#646cff] text-white font-semibold rounded-md hover:bg-[#535bf2] transition-colors"
              >
                Order Now
              </button>
              <button
                onClick={handleScheduleMeeting}
                className="py-2 px-2 bg-[#646cff] text-white font-semibold rounded-md hover:bg-[#535bf2] transition-colors flex items-center gap-2"
              >
                <FaCalendarAlt /> Schedule Meeting
              </button>
            </div>
          </div>
        </div>
        {selectedService.faqs?.length > 0 && (
          <div className="mt-20">
            <h2 className="text-3xl font-bold mb-2">Frequently Asked Questions</h2>
            <div className="w-20 h-1 bg-[#646cff] mb-4"></div>
            <div className="space-y-4">
              {selectedService.faqs.map((faq, index) => (
                <div key={index} className="border-b pb-4">
                  <h3 className="text-lg font-semibold">{faq.question}</h3>
                  <p className="text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ScheduleMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        serviceId={id}
        serviceTitle={selectedService.title}
      />
    </div>
  );
};

export default Service;