import React, { useEffect, forwardRef } from 'react';
import { Box } from '@mui/material';
import { useTheme } from '../context/ThemeContext';

const CustomScrollbar = forwardRef(({ children, className = '', noNavbar = false }, ref) => {
  const { theme } = useTheme();

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      html, body {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      html::-webkit-scrollbar, body::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);

    return () => document.head.removeChild(style);
  }, []);

  return (
    <Box
      ref={ref}
      className={`relative overflow-y-auto ${className}`}
      sx={{
        height: noNavbar ? '100vh' : 'calc(100vh - 4rem)',
        marginTop: noNavbar ? 0 : '4rem',
        width: '100%',
        backgroundColor: theme === 'dark' ? '#111827' : 'transparent',
        '&::-webkit-scrollbar': {
          width: '10px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#3b82f6',
          borderRadius: '5px',
          border: '2px solid transparent',
          backgroundClip: 'content-box',
        },
        scrollbarWidth: 'thin',
        scrollbarColor: '#3b82f6 transparent',
      }}
    >
      {children}
    </Box>
  );
});

export default CustomScrollbar;