import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const CompleteOrderModal = ({ isOpen, onClose, onSubmit, orderId }) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); 
    try {
      await onSubmit(orderId, message, files); 
      setMessage('');
      setFiles([]);
      onClose();
    } catch (error) {
      console.error('Error submitting order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
  <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 px-2 sm:px-4">
    <div
      className={`p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'
      }`}
    >
      <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Complete Order</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium mb-1">Message (Optional)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`w-full p-2 text-sm rounded-md border ${
              theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
            }`}
            rows={4}
            placeholder="Enter any additional message for the user..."
            disabled={isSubmitting}
          />
        </div>

        <div className="mb-3 sm:mb-4">
          <label className="block text-xs sm:text-sm font-medium mb-1">Upload Files</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className={`w-full p-2 text-sm rounded-md border ${
              theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
            }`}
            disabled={isSubmitting}
          />
        </div>

        <div className="flex justify-end gap-2 sm:gap-4 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="text-xs sm:text-sm py-2 px-3 sm:px-4 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-md text-white transition-colors ${
              isSubmitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-[#646cff] hover:bg-[#535bf2]'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </div>
  </div>
);
};

export default CompleteOrderModal;