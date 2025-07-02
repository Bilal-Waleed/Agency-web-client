import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { showToast } from '../Toast';
import { IoClose } from 'react-icons/io5';
import * as Yup from 'yup';

// Yup validation schema
const validationSchema = Yup.object({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title is too long')
    .required('Title is required'),
  provider: Yup.string()
    .min(3, 'Provider name must be at least 3 characters')
    .max(100, 'Provider name is too long')
    .required('Provider name is required'),
  shortDesc: Yup.string()
    .min(10, 'Short description must be at least 10 characters')
    .max(200, 'Short description is too long')
    .required('Short description is required'),
  fullDesc: Yup.string()
    .min(50, 'Full description must be at least 50 characters')
    .max(2000, 'Full description is too long')
    .required('Full description is required'),
  minTime: Yup.string()
    .min(1, 'Minimum time is required')
    .required('Minimum time is required'),
  budget: Yup.string()
    .min(1, 'Budget is required')
    .required('Budget is required'),
  image: Yup.string().optional(),
  faqs: Yup.array()
    .of(
      Yup.object({
        question: Yup.string()
          .min(1, 'Question must be at least 1 character')
          .required('Question is required'),
        answer: Yup.string()
          .min(1, 'Answer must be at least 1 character')
          .required('Answer is required'),
      })
    )
    .optional(),
});

const EditServiceModal = ({ service, onClose, onSave }) => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    _id: service._id || '',
    title: service.title || '',
    provider: service.provider || '',
    shortDesc: service.shortDesc || '',
    fullDesc: service.fullDesc || '',
    image: service.image || '',
    minTime: service.minTime || '',
    budget: service.budget || '',
    faqs: service.faqs || [],
    imageFile: null,
  });
  const [newFaq, setNewFaq] = useState({ question: '', answer: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    return () => {
      document.body.style.overflow = 'auto';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, imageFile: file, image: '' });
      setErrors((prev) => ({ ...prev, image: '' }));
    }
  };

  const handleFaqChange = (index, field, value) => {
    const updatedFaqs = [...formData.faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFormData({ ...formData, faqs: updatedFaqs });
    setErrors((prev) => ({ ...prev, faqs: '' }));
  };

  const addFaq = () => {
    if (!newFaq.question.trim() || !newFaq.answer.trim()) {
      showToast('Question and answer are required', 'error');
      return;
    }
    const faq = {
      question: newFaq.question.trim(),
      answer: newFaq.answer.trim(),
    };
    setFormData({ ...formData, faqs: [...formData.faqs, faq] });
    setNewFaq({ question: '', answer: '' });
  };

  const removeFaq = (index) => {
    const updatedFaqs = formData.faqs.filter((_, i) => i !== index);
    setFormData({ ...formData, faqs: updatedFaqs });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setErrors({});

    try {
      await validationSchema.validate(formData, { abortEarly: false });

      const payload = new FormData();
      payload.append('_id', formData._id);
      payload.append('title', formData.title);
      payload.append('provider', formData.provider);
      payload.append('shortDesc', formData.shortDesc);
      payload.append('fullDesc', formData.fullDesc);
      payload.append('minTime', formData.minTime);
      payload.append('budget', formData.budget);
      payload.append('image', formData.image);

      if (formData.imageFile) {
        payload.append('image', formData.imageFile);
      }

      const safeFaqs = Array.isArray(formData.faqs) ? formData.faqs : [];
      console.log('Sending faqs:', safeFaqs); // Debug: Log faqs before stringifying
      // Debug: Log FormData entries
      console.log('FormData entries:');
      for (let [key, value] of payload.entries()) {
        console.log(`${key}: ${value}`);
      }
      payload.append('faqs', JSON.stringify(safeFaqs));

      await onSave(payload);
      showToast(formData._id ? 'Service updated successfully' : 'Service created successfully', 'success');
      onClose();
    } catch (error) {
      if (error.name === 'ValidationError') {
        const validationErrors = {};
        error.inner.forEach((err) => {
          validationErrors[err.path] = err.message;
        });
        setErrors(validationErrors);
        showToast('Please fix the form errors', 'error');
      } else {
        console.error('Submit error:', error);
        const message = error.response?.data?.error || 'Something went wrong while saving.';
        showToast(message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`p-6 rounded-lg relative z-50 w-full max-w-lg max-h-[80vh] overflow-y-auto
          ${theme === 'light' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-100'}
          shadow-lg`}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${
            theme === 'light' ? '#9CA3AF #F3F4F6' : '#4B5563 #1F2937'
          }`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <style>
          {`
            div::-webkit-scrollbar {
              width: 8px;
            }
            div::-webkit-scrollbar-track {
              background: ${theme === 'light' ? '#F3F4F6' : '#1F2937'};
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb {
              background: ${theme === 'light' ? '#9CA3AF' : '#4B5563'};
              border-radius: 4px;
            }
            div::-webkit-scrollbar-thumb:hover {
              background: ${theme === 'light' ? '#6B7280' : '#6B7280'};
            }
          `}
        </style>
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-1 rounded-full
            ${theme === 'light' 
              ? 'text-gray-600 hover:bg-gray-200' 
              : 'text-gray-300 hover:bg-gray-700'}
          `}
        >
          <IoClose size={24} />
        </button>
        <h2 className="text-xl font-semibold mb-4 pr-8">{formData._id ? 'Edit Service' : 'Create Service'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.title ? 'border-red-500' : ''}`}
              placeholder="Enter title (3-100 characters)"
            />
            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Provider</label>
            <input
              type="text"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.provider ? 'border-red-500' : ''}`}
              placeholder="Enter provider name (3-100 characters)"
            />
            {errors.provider && <p className="text-red-500 text-sm mt-1">{errors.provider}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Short Description</label>
            <textarea
              name="shortDesc"
              value={formData.shortDesc}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.shortDesc ? 'border-red-500' : ''}`}
              placeholder="Enter short description (10-200 characters)"
            />
            {errors.shortDesc && <p className="text-red-500 text-sm mt-1">{errors.shortDesc}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Full Description</label>
            <textarea
              name="fullDesc"
              value={formData.fullDesc}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.fullDesc ? 'border-red-500' : ''}`}
              placeholder="Enter full description (50-2000 characters)"
            />
            {errors.fullDesc && <p className="text-red-500 text-sm mt-1">{errors.fullDesc}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Image</label>
            <input
              type="file"
              name="imageFile"
              accept="image/jpeg,image/png"
              onChange={handleFileChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.imageFile ? 'border-red-500' : ''}`}
            />
            {formData.image && (
              <p className="text-sm mt-1">
                Current Image: {formData.image.startsWith('http') ? formData.image.split('/').pop() : formData.image}
              </p>
            )}
            {errors.imageFile && <p className="text-red-500 text-sm mt-1">{errors.imageFile}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Image Name (Optional, for existing folder-based images)</label>
            <input
              type="text"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.image ? 'border-red-500' : ''}`}
              placeholder="Enter image name (e.g., image.jpg, optional)"
            />
            {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Minimum Time</label>
            <input
              type="text"
              name="minTime"
              value={formData.minTime}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.minTime ? 'border-red-500' : ''}`}
              placeholder="Enter minimum time (e.g., 1 day)"
            />
            {errors.minTime && <p className="text-red-500 text-sm mt-1">{errors.minTime}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Budget</label>
            <input
              type="text"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              className={`w-full p-2 rounded-md border ${
                theme === 'light'
                  ? 'bg-gray-100 border-gray-300 text-gray-900'
                  : 'bg-gray-700 border-gray-600 text-gray-100'
              } ${errors.budget ? 'border-red-500' : ''}`}
              placeholder="Enter budget (e.g., $100)"
            />
            {errors.budget && <p className="text-red-500 text-sm mt-1">{errors.budget}</p>}
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">FAQs</label>
            {formData.faqs.map((faq, index) => (
              <div key={index} className="mb-4 border-b pb-2">
                <input
                  type="text"
                  value={faq.question}
                  onChange={(e) => handleFaqChange(index, 'question', e.target.value)}
                  placeholder="Enter question (at least 1 character)"
                  className={`w-full p-2 mb-1 rounded-md border ${
                    theme === 'light'
                      ? 'bg-gray-100 border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-gray-100'
                  } ${errors[`faqs[${index}].question`] ? 'border-red-500' : ''}`}
                />
                {errors[`faqs[${index}].question`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`faqs[${index}].question`]}</p>
                )}
                <textarea
                  value={faq.answer}
                  onChange={(e) => handleFaqChange(index, 'answer', e.target.value)}
                  placeholder="Enter answer (at least 1 character)"
                  className={`w-full p-2 rounded-md border ${
                    theme === 'light'
                      ? 'bg-gray-100 border-gray-300 text-gray-900'
                      : 'bg-gray-700 border-gray-600 text-gray-100'
                  } ${errors[`faqs[${index}].answer`] ? 'border-red-500' : ''}`}
                />
                {errors[`faqs[${index}].answer`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`faqs[${index}].answer`]}</p>
                )}
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  className="text-red-500 mt-1 hover:text-red-700"
                >
                  Remove FAQ
                </button>
              </div>
            ))}
            <div className="mt-2">
              <input
                type="text"
                value={newFaq.question}
                onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
                placeholder="Enter new question (at least 1 character)"
                className={`w-full p-2 mb-1 rounded-md border ${
                  theme === 'light'
                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                    : 'bg-gray-700 border-gray-600 text-gray-100'
                }`}
              />
              <textarea
                value={newFaq.answer}
                onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
                placeholder="Enter new answer (at least 1 character)"
                className={`w-full p-2 rounded-md border ${
                  theme === 'light'
                    ? 'bg-gray-100 border-gray-300 text-gray-900'
                    : 'bg-gray-700 border-gray-600 text-gray-100'
                }`}
              />
              <button
                type="button"
                onClick={addFaq}
                className={`mt-2 px-4 py-2 rounded-md ${
                  theme === 'light'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-[#646cff] text-gray-100 hover:bg-blue-700'
                }`}
              >
                Add FAQ
              </button>
            </div>
            {errors.faqs && <p className="text-red-500 text-sm mt-1">{errors.faqs}</p>}
          </div>
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
                theme === 'light'
                  ? 'bg-gray-500 text-white hover:bg-gray-600'
                  : 'bg-gray-600 text-gray-100 hover:bg-gray-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                loading
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : theme === 'light'
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-[#646cff] text-gray-100 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServiceModal;