import React from 'react';
import { useTheme } from '../context/ThemeContext';
import CounterBox from '../components/CounterBox';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import { Link } from 'react-router';

const About = ({scrollRef}) => {
  const { theme } = useTheme();
  const { user } = useContext(AuthContext);

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center ${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } pt-12 px-4 sm:px-8 lg:px-12`}
    >
      <div className='w-full max-w-5xl flex flex-col items-start pt-8 '>
      {user &&(
          <h1 className="text-1xl font-bold mb-2">Welcome, {user.name}</h1>
        )}
      </div>
      <div className="w-full max-w-5xl flex flex-col lg:flex-row items-center justify-between gap-12">
        <div className="lg:w-1/2 w-full  text-left">
          <h2 className="text-3xl font-bold mb-6">Why Choose Us?</h2>
          <p className="mb-4">
            <strong>Expertise:</strong> We specialize in MERN stack and WordPress development, building fast, responsive, and scalable websites that stand out.
          </p>
          <p className="mb-4">
            <strong>Custom Solutions:</strong> Every business is different — we deliver tailored websites that reflect your unique brand and goals.
          </p>
          <p className="mb-4">
            <strong>Client-Focused:</strong> From first meeting to final delivery, we prioritize your needs and provide ongoing support every step of the way.
          </p>
          <p className="mb-4">
            <strong>Affordable Quality:</strong> Get high-end web solutions at competitive prices — no compromise on performance or design.
          </p>
          <p className="mb-6">
            <strong>Dependable & Scalable:</strong> Whether it’s a WordPress site or a MERN app, we ensure your project is reliable, secure, and ready to grow with you.
          </p>
          <div className="flex gap-4 justify-start">
            <Link to= "/contact" className="px-4 py-2 bg-[#646cff] text-white font-semibold rounded-md hover:bg-[#535bf2] transition-colors">
              Contact Now
            </Link>
            <Link to= "/services" className="px-4 py-2 bg-transparent border border-[#646cff] text-[#646cff] font-semibold rounded-md hover:border-[#535bf2] hover:text-[#535bf2] transition-colors">
              Explore More
            </Link>
          </div>
        </div>
        <div className="lg:w-1/2 w-full flex justify-center mt-8 lg:mt-0">
          <img
            src="/images/about.png" 
            alt="About Illustration"
            className="w-full max-w-md h-auto"
          />
        </div>
      </div>
        <CounterBox scrollRef={scrollRef} />
    </div>
  );
};

export default About;