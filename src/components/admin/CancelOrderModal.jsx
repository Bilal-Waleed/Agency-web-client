import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { showToast } from '../Toast';

const CancelOrderModal = ({ isOpen, onClose, onSubmit, orderId }) => {
  const { theme } = useTheme();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (reason.trim().length < 10) {
        showToast('Cancellation reason must be at least 10 characters.', 'error');
        return;
    }

    setLoading(true);
    try {
      await onSubmit(orderId, reason);
      setReason('');
      onClose();
    } catch (error) {
      console.error('Error in modal:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-2 sm:px-0">
    <div
      className={`p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'
      }`}
    >
      <h2 className="text-xl sm:text-2xl font-bold">Cancel Order</h2>
      <div className="w-16 sm:w-24 h-1 bg-[#646cff] mt-1 mb-4 rounded"></div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm sm:text-base font-medium mb-1 text-gray-400">
            Reason for Cancellation (minimum 10 words)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={`w-full p-2 rounded-md border resize-none text-sm sm:text-base ${
              theme === 'light'
                ? 'border-gray-300 bg-white text-black'
                : 'border-gray-600 bg-gray-700 text-white'
            }`}
            rows="4"
            required
          />
        </div>

        <div className="flex justify-end gap-2 sm:gap-4">
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-3 sm:py-2 sm:px-4 text-sm sm:text-base bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`py-1.5 px-3 sm:py-2 sm:px-4 text-sm sm:text-base rounded-md transition-colors text-white ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#646cff] hover:bg-[#535bf2]'
            }`}
          >
            {loading ? 'Cancelling...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default CancelOrderModal;