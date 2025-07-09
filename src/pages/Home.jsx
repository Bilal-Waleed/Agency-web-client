import React, { useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import CounterBox from '../components/CounterBox';
import GetStarted from '../components/GetStarted';
import { Link } from 'react-router';

const Home = ({ scrollRef }) => {
  const { theme } = useTheme();

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } pt-12 px-4 sm:px-8 lg:px-12`}
    >
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12 mt-10">
        <div className="lg:w-1/2 w-full lg:text-left">
          <p className="text-sm mb-2">We are the World Best IT Company</p>
          <h1 className="text-4xl font-bold mb-4">Welcome to Bold-Zyt Digital Solutions</h1>
          <p className="mb-6">
            Are you ready to take your business to the next level with cutting-edge IT solutions? Look no further! At Bold-Zyt Digital Solutions, we specialize in providing innovative IT services and solutions tailored to meet your unique needs.
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
        <div className="lg:w-2/5 w-full flex justify-center mt-8 lg:mt-0">
          <img
            src="/images/home.png"
            alt="Home Illustration"
            className="w-full max-w-md h-auto"
          />
        </div>
      </div>
      <CounterBox scrollRef={scrollRef} />
      <GetStarted />
    </div>
  );
};

export default Home;