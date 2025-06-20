import React from 'react';

interface IconProps {
  className?: string;
}

const UploadIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-5 h-5"}
  >
    <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75A.75.75 0 013.75 15H6v2.25a3 3 0 003 3h6a3 3 0 003-3V15h2.25a.75.75 0 010 1.5H18v2.25a1.5 1.5 0 01-1.5 1.5H9a1.5 1.5 0 01-1.5-1.5V16.5H3.75a.75.75 0 01-.75-.75z" clipRule="evenodd" />
  </svg>
);

export default UploadIcon;
