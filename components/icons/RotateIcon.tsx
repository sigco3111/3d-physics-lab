
import React from 'react';

interface IconProps {
  className?: string;
}

const RotateIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 15.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm0 13c-1.57 0-3.03-.46-4.26-1.24L6.2 16.3c.83.45 1.79.7 2.8.7 3.31 0 6-2.69 6-6v-3l-4 4 4 4v-3c0 4.42-3.58 8-8 8z"/>
    <path d="M17.47 6.53C16.24 5.3 14.66 4.5 13 4.5V2L9 6l4 4V7.5c1.86 0 3.5.76 4.71 2L19.53 7.7A8.94 8.94 0 0017.47 6.53zM6.53 17.47C7.76 18.7 9.34 19.5 11 19.5V22l4-4-4-4v2.5c-1.86 0-3.5-.76-4.71-2L4.47 16.3a8.94 8.94 0 002.06 1.17z"/>
  </svg>
);

export default RotateIcon;
