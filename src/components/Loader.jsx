import React from 'react';
import { useTheme } from '../context/ThemeContext';
import CircularProgress from '@mui/material/CircularProgress';

const Loader = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-30 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <CircularProgress
          size={50}
          sx={{ color: theme === 'light' ? '#646cff' : '#ffffff' }}
        />
        <p
          className={`mt-2 text-base font-medium ${
            theme === 'light' ? 'text-[#646cff]' : 'text-white'
          }`}
        >
          Loading...
        </p>
      </div>
    </div>
  );
};

export default Loader;
