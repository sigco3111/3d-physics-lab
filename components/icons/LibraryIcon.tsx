import React from 'react';

interface IconProps {
  className?: string;
}

const LibraryIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-5 h-5"}
  >
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-3 9H9V9h8v2zm-4 4H9v-2h4v2zm4-8H9V5h8v2z" />
  </svg>
);

export default LibraryIcon;