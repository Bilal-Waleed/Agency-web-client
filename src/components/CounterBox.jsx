import React, { useEffect, useState } from 'react';

const CounterBox = ({ scrollRef }) => {
  const [counters, setCounters] = useState({
    registeredCompanies: 0,
    happyClients: 0,
    developers: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const element = document.querySelector('.counter-box');
      if (element && scrollRef?.current) {
        const rect = element.getBoundingClientRect();
        const parentRect = scrollRef.current.getBoundingClientRect();
        if (rect.top < parentRect.bottom) {
          setIsVisible(true);
        }
      }
    };

    if (scrollRef?.current) {
      scrollRef.current.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => {
      if (scrollRef?.current) {
        scrollRef.current.removeEventListener('scroll', handleScroll);
      }
    };
  }, [scrollRef]);

  useEffect(() => {
    if (isVisible) {
      const duration = 2000; 
      const steps = 100;
      const stepTime = duration / steps;

      const targetCounters = {
        registeredCompanies: 10,
        happyClients: 1000,
        developers: 50,
      };

      let currentStep = 0;
      const timer = setInterval(() => {
        if (currentStep <= steps) {
          setCounters({
            registeredCompanies: Math.floor(
              (currentStep / steps) * targetCounters.registeredCompanies
            ),
            happyClients: Math.floor(
              (currentStep / steps) * targetCounters.happyClients
            ),
            developers: Math.floor(
              (currentStep / steps) * targetCounters.developers
            ),
          });
          currentStep++;
        } else {
          clearInterval(timer);
        }
      }, stepTime);

      return () => clearInterval(timer);
    }
  }, [isVisible]);

  return (
    <div className="counter-box w-full max-w-5xl mt-20 bg-gray-200 text-gray-900 px-12 py-8 rounded-lg flex flex-col sm:flex-row justify-around items-center gap-6 sm:gap-12">
        <div className="text-center pl-4 sm:pl-0 w-full sm:w-auto">
            <h3 className="text-2xl font-bold">{counters.registeredCompanies}+</h3>
            <p>Registered Companies</p>
        </div>
        <div className="w-full h-px bg-gray-400 block sm:hidden"></div>
        <div className="hidden sm:block h-12 w-px bg-gray-400"></div>
        <div className="text-center pl-4 sm:pl-0 w-full sm:w-auto">
            <h3 className="text-2xl font-bold">{counters.happyClients}+</h3>
            <p>Happy Clients</p>
        </div>
        <div className="w-full h-px bg-gray-400 block sm:hidden"></div>
        <div className="hidden sm:block h-12 w-px bg-gray-400"></div>
        <div className="text-center pl-4 sm:pl-0 w-full sm:w-auto">
            <h3 className="text-2xl font-bold">{counters.developers}+</h3>
            <p>Well Known Developers</p>
        </div>
        <div className="w-full h-px bg-gray-400 block sm:hidden"></div>
        <div className="hidden sm:block h-12 w-px bg-gray-400"></div>
        <div className="text-center pl-4 sm:pl-0 w-full sm:w-auto">
            <h3 className="text-2xl font-bold">24/7</h3>
            <p>Service</p>
        </div>
</div>

  );
};

export default CounterBox;