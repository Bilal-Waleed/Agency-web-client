import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Link } from 'react-router';

const GetStarted = () => {
  const { theme } = useTheme();

  return (
    <div
      className={`w-full max-w-5xl mx-auto my-12 p-2 ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } rounded-lg flex flex-col lg:flex-row items-center justify-between gap-8`}
    >
      <div className="lg:w-2/5 w-full flex justify-center">
        <img
          src="/images/design.png" 
          alt="Get Started Illustration"
          className="w-full max-w-md h-auto"
        />
      </div>
      <div className="lg:w-1/2 w-full text-left">
        <p className="text-sm mb-2">we are here to help you</p>
        <h2 className="text-3xl font-bold mb-4">Get Started Today</h2>
        <p className="mb-6">
          Ready to take the first step towards a more efficient and secure IT infrastructure? Contact us today for a free consultation and let’s discuss how Bold-Zyt Digital Solutions can help your business thrive in the digital age.
        </p>
        <div className="flex gap-4 justify-start">
            <Link to="/contact" className="px-4 py-2 bg-[#646cff] text-white font-semibold rounded-md hover:bg-[#535bf2] transition-colors">
              Contact Now
            </Link>
            <Link to="/about" className="px-4 py-2 bg-transparent border border-[#646cff] text-[#646cff] font-semibold rounded-md hover:border-[#535bf2] hover:text-[#535bf2] transition-colors">
              Learn More
            </Link>
          </div>
      </div>
    </div>
  );
};

export default GetStarted;