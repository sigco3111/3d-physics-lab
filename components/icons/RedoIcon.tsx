
import React from 'react';

interface IconProps {
  className?: string;
}

const RedoIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || "w-6 h-6"}
  >
    <path d="M3 13h15.17l-3.58-3.59L16 8l6 6-6 6-1.41-1.41L15.17 15H3v-2z" />
    <path d="M13 5h4.5A4.5 4.5 0 0 1 22 9.5V11" />
  </svg>
);

export default RedoIcon;
