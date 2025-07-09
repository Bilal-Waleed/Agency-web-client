import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';

const CompleteOrderModal = ({ isOpen, onClose, onSubmit, orderId }) => {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [files, setFiles] = useState([]);

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(orderId, message, files);
    setMessage('');
    setFiles([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`p-6 rounded-lg shadow-lg max-w-md w-full ${
          theme === 'light' ? 'bg-white text-black' : 'bg-gray-800 text-white'
        }`}
      >
        <h2 className="text-2xl font-bold mb-4">Complete Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full p-2 rounded-md border ${
                theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
              }`}
              rows={4}
              placeholder="Enter any additional message for the user..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Upload Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light' ? 'border-gray-300 bg-white' : 'border-gray-600 bg-gray-700'
              }`}
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
              className="py-2 px-4 bg-[#646cff] text-white rounded-md hover:bg-[#535bf2] transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompleteOrderModal;