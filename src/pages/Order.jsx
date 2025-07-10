import React, { useState, useContext, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import * as Yup from 'yup';
import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../components/Toast';
import { Breadcrumbs, Link, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useRef } from 'react';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  phone: Yup.string()
    .matches(/^(\+?\d{1,4})?[\s.-]?(\(?\d{2,4}\)?[\s.-]?)?[\d\s.-]{6,12}$/, 'Invalid phone number')
    .required('Phone number is required'),
  projectType: Yup.string().required('Project type is required'),
  projectBudget: Yup.string().required('Project budget is required'),
  timeline: Yup.date()
    .min(new Date(), 'Timeline must be in the future')
    .required('Timeline is required'),
  projectDescription: Yup.string()
    .min(10, 'Project description must be at least 10 characters')
    .required('Project description is required'),
  paymentReference: Yup.string().required('Payment reference is required'),
  paymentMethod: Yup.string().required('Payment method is required'),
});

const Order = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    projectType: '',
    projectBudget: '',
    timeline: '',
    projectDescription: '',
    paymentReference: '',
    paymentMethod: '',
    files: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.projectType) {
      const normalizedType = normalizeProjectType(location.state.projectType);
      setFormData((prev) => ({ ...prev, projectType: normalizedType }));
    }
  }, [location.state]);

  const normalizeProjectType = (type) => {
    const typeMap = {
      'Web Development': 'Website',
      'App Development': 'Mobile App',
      'UI/UX Design': 'UI/UX',
      'SEO Services': 'SEO',
      'Bug Fixing': 'Bug Fixing',
      'WordPress Development': 'Wordpress',
    };
    return typeMap[type] || type; 
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? Array.from(files) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await validationSchema.validate(formData, { abortEarly: false });

      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key === 'files') {
          formData.files.forEach((file) => {
            formDataToSend.append('files', file); 
          });
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      const token = Cookies.get('token');
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/order`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        phone: '',
        projectType: '',
        projectBudget: '',
        timeline: '',
        projectDescription: '',
        paymentReference: '',
        paymentMethod: '',
        files: [],
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; 
      }
      setErrors({});
      showToast(`Thanks for your order, ${formData.name}! Order ID: ${response.data.orderId}`, 'success');
    } catch (err) {
      if (err.name === 'ValidationError') {
        const newErrors = {};
        err.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
        setErrors(newErrors);
        showToast('Please fix the form errors', 'error');
      } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
        showToast('No internet connection. Please check your network.', 'error');
      } else {
        const msg = err.response?.data?.error || 'Failed to submit order';
        setErrors({ api: msg });
        showToast(msg, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } pt-18 px-4 sm:px-8 lg:px-12 pb-10`}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-20">
        <div className="lg:w-1/2 w-full flex flex-col">
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="/"
            sx={{
              '& .MuiBreadcrumbs-separator': {
                color: theme === 'light' ? 'text.primary' : '#ffffff',
              }
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

            {location.state?.projectType && (
              <Link
                onClick={() => navigate(-1)}
                underline="hover"
                sx={{
                  color: theme === 'light' ? 'text.primary' : '#ffffff',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                {location.state.projectType}
              </Link>
            )}

            <Typography
              sx={{
                color: theme === 'light' ? 'text.primary' : '#ffffff',
              }}
            >
              Order
            </Typography>
          </Breadcrumbs>
          <h1 className="text-3xl font-bold mb-2 mt-2">Place Your Order</h1>
          <div className="w-24 h-1 bg-[#646cff] mb-6"></div>
          <p className="text-lg mb-6">
            Fill in the details below to help us understand your needs:
          </p>
          <img
            src="/images/info.png"
            alt="Order"
            className="w-full max-w-md h-auto md:mx-auto sm:mx-auto"
          />
        </div>

        <div className="lg:w-1/2 w-full flex justify-center lg:mt-6">
          <form onSubmit={handleSubmit} className="w-full max-w-md space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.name && (
                <div className="text-red-500 text-sm mt-1">{errors.name}</div>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.email ? 'border-red-500' : ''
                }`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.email && (
                <div className="text-red-500 text-sm mt-1">{errors.email}</div>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.phone ? 'border-red-500' : ''
                }`}
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.phone && (
                <div className="text-red-500 text-sm mt-1">{errors.phone}</div>
              )}
            </div>
            <div>
              <label htmlFor="projectType" className="block text-sm font-medium">
                Project Type
              </label>
              <select
                id="projectType"
                name="projectType"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.projectType ? 'border-red-500' : ''
                }`}
                value={formData.projectType}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select project type</option>
                <option value="Website">Website</option>
                <option value="Mobile App">Mobile App</option>
                <option value="UI/UX">UI/UX</option>
                <option value="SEO">SEO Services</option>
                <option value="Bug Fixing">Bug Fixing</option>
                <option value="Wordpress">Wordpress Development</option>
              </select>
              {errors.projectType && (
                <div className="text-red-500 text-sm mt-1">{errors.projectType}</div>
              )}
            </div>
            <div>
              <label htmlFor="projectBudget" className="block text-sm font-medium">
                Project Budget
              </label>
              <select
                id="projectBudget"
                name="projectBudget"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.projectBudget ? 'border-red-500' : ''
                }`}
                value={formData.projectBudget}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select budget range</option>
                <option value="$100-$500">$100–$500</option>
                <option value="$500-$1000">$500–$1000</option>
                <option value="$1000-$5000">$1000–$5000</option>
                <option value="$5000+">$5000+</option>
              </select>
              {errors.projectBudget && (
                <div className="text-red-500 text-sm mt-1">{errors.projectBudget}</div>
              )}
            </div>
            <div>
              <label htmlFor="timeline" className="block text-sm font-medium">
                Timeline / Deadline
              </label>
              <input
                type="date"
                id="timeline"
                name="timeline"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.timeline ? 'border-red-500' : ''
                }`}
                value={formData.timeline}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.timeline && (
                <div className="text-red-500 text-sm mt-1">{errors.timeline}</div>
              )}
            </div>
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium">
                Project Description
              </label>
              <textarea
                id="projectDescription"
                name="projectDescription"
                rows="4"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.projectDescription ? 'border-red-500' : ''
                }`}
                placeholder="Describe your project requirements"
                value={formData.projectDescription}
                onChange={handleChange}
                disabled={loading}
              ></textarea>
              {errors.projectDescription && (
                <div className="text-red-500 text-sm mt-1">{errors.projectDescription}</div>
              )}
            </div>
            <div>
              <label htmlFor="file" className="block text-sm font-medium">
                Attach File (Optional)
              </label>
              <input
                type="file"
                id="file"
                name="files"
                multiple
                ref={fileInputRef} 
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff]`}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="paymentReference" className="block text-sm font-medium">
                Payment Reference
              </label>
              <input
                type="text"
                id="paymentReference"
                name="paymentReference"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.paymentReference ? 'border-red-500' : ''
                }`}
                placeholder="Enter payment reference"
                value={formData.paymentReference}
                onChange={handleChange}
                disabled={loading}
              />
              {errors.paymentReference && (
                <div className="text-red-500 text-sm mt-1">{errors.paymentReference}</div>
              )}
            </div>
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium">
                Payment Method
              </label>
              <select
                id="paymentMethod"
                name="paymentMethod"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.paymentMethod ? 'border-red-500' : ''
                }`}
                value={formData.paymentMethod}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select payment method</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
              {errors.paymentMethod && (
                <div className="text-red-500 text-sm mt-1">{errors.paymentMethod}</div>
              )}
            </div>
            {errors.api && (
              <div className="text-red-500 text-sm text-center">{errors.api}</div>
            )}
            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 text-white font-semibold rounded-md ${
                  loading
                    ? 'bg-gray-500 cursor-not-allowed'
                    : 'bg-[#646cff] hover:bg-[#535bf2]'
                } transition-colors`}
              >
                {loading ? 'Submitting...' : 'Book Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Order;