import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Facebook, Twitter, LinkedIn, WhatsApp, Email } from '@mui/icons-material';

const Footer = () => {
  const { theme } = useTheme();

  return (
    <footer
      className={`${
        theme === 'light' ? 'bg-white text-black' : 'bg-gray-900 text-white'
      } py-7 w-full`}
    >
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm font-medium">
          © 2025 Bold-Zyt. All Rights Reserved.
        </div>
        <div className="flex gap-4">
          <a
            href="mailto:boldzyt.ds@gmail.com"
            className="hover:text-[#BB001B] transition-colors"
          >
            <Email />
          </a>
          <a
            href="https://facebook.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#646cff] transition-colors"
          >
            <Facebook />
          </a>
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#646cff] transition-colors"
          >
            <Twitter />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#646cff] transition-colors"
          >
            <LinkedIn />
          </a>
          <a
            href="https://wa.me/923147766234"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#25D366] transition-colors"
          >
            <WhatsApp />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
