import React, { useState, useContext, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import Cookies from 'js-cookie';
import axios from 'axios';
import { showToast } from './Toast';

const ScheduleMeetingModal = ({
  isOpen,
  onClose,
  serviceId,
  serviceTitle,
  meetingId = null,      
  initialDate = '',
  initialTime = '',
}) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setDate(initialDate);
    setTime(initialTime);
  }, [initialDate, initialTime, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const selectedDateTime = new Date(`${date}T${time}`);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    if (selectedDateTime < tomorrow) {
      showToast('Please select a date and time at least one day in the future', 'info');
      return;
    }

    try {
    setLoading(true);
    const token = Cookies.get('token');

    const url = meetingId
        ? `${import.meta.env.VITE_BACKEND_URL}/api/scheduled-meetings/${meetingId}/reschedule`
        : `${import.meta.env.VITE_BACKEND_URL}/api/scheduled-meetings`;

    const payload = meetingId
        ? { date, time }
        : { userId: user._id, serviceId, date, time };

    const method = meetingId ? 'put' : 'post';

    const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success) {
        showToast(
        meetingId ? 'Meeting rescheduled successfully' : 'Your meeting has been scheduled.',
        'success'
        );
        onClose(true);
    } else {
        showToast(response.data.message || 'Something went wrong', 'error');
    }
    } catch (error) {
    if (error.response?.status === 409) {
        showToast(error.response.data.message, 'info');
    } else if (error.response?.data?.message) {
        showToast(error.response.data.message, 'info');
    } else {
        showToast('Error submitting the meeting', 'error');
    }
    } finally {
    setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg shadow-lg max-w-md w-full ${
          theme === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">
          {meetingId ? 'Reschedule Meeting' : 'Schedule a Meeting'}
        </h2>
        {serviceTitle && <p className="mb-4">For: {serviceTitle}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-2 rounded-md border ${
                theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
              }`}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`w-full p-2 rounded-md border ${
                theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
              }`}
              required
            />
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`py-2 px-4 rounded-md transition-colors text-white ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#646cff] hover:bg-[#535bf2]'
              }`}
            >
              {loading ? (meetingId ? 'Rescheduling...' : 'Scheduling...') : (meetingId ? 'Reschedule' : 'Schedule')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleMeetingModal;
