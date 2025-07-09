import React, { useState, useContext } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import * as Yup from 'yup';
import axios from 'axios';
import { showToast } from '../components/Toast';

const validationSchema = Yup.object({
  name: Yup.string()
    .min(3, 'Name must be at least 3 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  message: Yup.string()
    .min(10, 'Message must be at least 10 characters')
    .required('Message is required'),
});

const Contact = () => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await validationSchema.validate(formData, { abortEarly: false });
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/contact`, formData);
      console.log('Form data:', formData);
      console.log('Form submitted successfully:', response.data);
      setFormData({ name: user?.name || '', email: user?.email || '', message: '' });
      setErrors({});
      showToast(`Thanks for your message, ${formData.name}!`, 'success');
    } catch (err) {
      const newErrors = {};
      if (err.name === 'ValidationError') {
        err.inner.forEach((error) => {
          newErrors[error.path] = error.message;
        });
        showToast('Please fix the form errors', 'error');
      } else {
        const msg = err.response?.data?.error || 'Failed to submit message';
        newErrors.api = msg;
        showToast(msg, 'error');
      }
      setErrors(newErrors);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } pt-18 px-4 sm:px-8 lg:px-12`}
    >
      <div className="w-full max-w-4xl flex flex-col lg:flex-row gap-12 mb-8">
        <div className="lg:w-1/2 w-full flex flex-col">
          <h1 className="text-3xl font-bold mb-6">
            Contact Us
            <div className="w-16 h-1 bg-[#646cff] mt-2"></div>
          </h1>
          <img
            src="/images/support.png"
            alt="Contact"
            className="w-full max-w-md h-auto md:mx-auto sm:mx-auto"
          />
        </div>

        <div className="lg:w-1/2 w-full flex justify-center lg:mt-26">
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
              <label htmlFor="message" className="block text-sm font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows="5"
                className={`mt-1 p-2 w-full border rounded-md ${
                  theme === 'light' ? 'bg-white border-gray-300' : 'bg-gray-800 border-gray-600 text-white'
                } focus:outline-none focus:ring-2 focus:ring-[#646cff] ${
                  errors.message ? 'border-red-500' : ''
                }`}
                placeholder="Enter your message"
                value={formData.message}
                onChange={handleChange}
                disabled={loading}
              ></textarea>
              {errors.message && (
                <div className="text-red-500 text-sm mt-1">{errors.message}</div>
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
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="w-full max-w-7xl pt-8">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153167!3d-37.81627997975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf0727e3b3b8b3b!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sus!4v1635782345678!5m2!1sen!2sus"
          width="100%"
          height="400"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          className="rounded-lg"
        ></iframe>
      </div>
    </div>
  );
};

export default Contact;