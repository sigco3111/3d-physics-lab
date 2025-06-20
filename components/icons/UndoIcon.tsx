
import React from 'react';

interface IconProps {
  className?: string;
}

const UndoIcon: React.FC<IconProps> = ({ className }) => (
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
    <path d="M21 13H5.83l3.58-3.59L8 8l-6 6 6 6 1.41-1.41L5.83 15H21v-2z" />
    <path d="M11 5H6.5A4.5 4.5 0 0 0 2 9.5V11" />
  </svg>
);

export default UndoIcon;
