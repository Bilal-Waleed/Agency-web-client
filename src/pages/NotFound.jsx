import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router';

const NotFound = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-[calc(100vh-80px)] flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } px-2 lg:px-12 `}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 w-full flex justify-center lg:justify-start">
          <h1
            className="text-[150px] lg:text-[200px] font-bold text-transparent bg-clip-text animate-gradient"
            style={{
              backgroundImage: 'linear-gradient(45deg, #646cff, #4b5cc4, #646cff)',
              backgroundSize: '200% 200%',
            }}
          >
            404
          </h1>
        </div>
        <div className="lg:w-1/2 w-full text-center lg:text-left">
          <h2 className="text-2xl lg:text-3xl font-semibold mb-4">SORRY! PAGE NOT FOUND</h2>
          <p className="mb-6 text-sm lg:text-base">
            Oops! It seems like the page you're trying to access doesn't exist. If you believe there's an issue, feel free to report it and we'll look into it.
          </p>
          <div className="flex gap-4 justify-center lg:justify-start">
            <Link to="/" className="px-4 py-2 bg-[#646cff] text-white font-semibold rounded-md hover:bg-[#535bf2] transition-colors">
              Return Home
            </Link>
            <Link to="/contact" className="px-4 py-2 bg-transparent border border-[#646cff] text-[#646cff] font-semibold rounded-md hover:border-[#535bf2] hover:text-[#535bf2] transition-colors">
              Report Problem
            </Link>
          </div>    
        </div>
      </div>
    </div>
  );
};

export default NotFound;