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
      showToast('Network error. Please check your internet.', 'info');
    } else {
      const status = error.response.status;
      const message = error.response.data?.message || 'Something went wrong';

      if (status === 401) {
        Cookies.remove('token');
        if (message === 'Invalid token') {
          showToast('Session expired. Please login again.', 'info');
          window.location.href = '/login';
        } else if (message === 'User not found') {
          showToast('User account deleted. Please register again.', 'info');
          window.location.href = '/register';
        } else {
          showToast(message, 'info');
        }
      } else if (status === 503) {
        showToast(message, 'info');
      } else {
        showToast(message, 'info');
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
