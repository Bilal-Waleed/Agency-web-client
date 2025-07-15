import axios from 'axios';
import Cookies from 'js-cookie';
import { showToast } from '../components/Toast';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

axiosInstance.interceptors.response.use(
  response => response,
  error => {
    if (!error.response) {
      showToast('Network error. Please check your internet.', 'error');
    } else {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      if (status === 401) {
        Cookies.remove('token');
        if (message === 'Invalid token') {
          showToast('Session expired. Please login again.', 'error');
          window.location.href = '/login';
        } else if (message === 'User not found') {
          showToast('User account deleted. Please register again.', 'error');
          window.location.href = '/register';
        } else {
          showToast(message, 'error');
        }
      } else if (status === 503) {
        showToast(message, 'error');
      } else {
        showToast(message, 'error');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
