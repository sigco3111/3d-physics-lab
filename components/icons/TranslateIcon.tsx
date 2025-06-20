
import React from 'react';

interface IconProps {
  className?: string;
}

const TranslateIcon: React.FC<IconProps> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className || "w-6 h-6"}
  >
    <path d="M12 2L8 6h3v3H6v4h3v3l4-4 4 4v-3h3V9h-3V6h3l-4-4zm-1 9H9V8h2v3zm0 1v3h2v-3h-2zm1-4h3V8h-3v1zm0 4h3v-1h-3v1zM6 13h2v-2H6v2zm10 0h2v-2h-2v2z"/>
    <path d="M17.71 13.29l-4-4L12 10.59V7h-2v3.59L8.29 9.29l-4 4L6 15H2v2h4l-1.29 1.29 1.41 1.41L10 16v4h2v-4l2.88 2.7 1.41-1.41L15 17h4v-2h-4l1.71-1.71zM11 15.59L9.41 14H11v1.59zm2 0V14h1.59L13 15.59z"/>
     <path fillRule="evenodd" clipRule="evenodd" d="M13 4.828V2h-2v2.828L8.172 2L7 3.172L9.828 6H7v2h2.828L7 10.828L8.172 12L11 9.172V12h2V9.172L15.828 12L17 10.828L14.172 8H17V6h-2.172L17 3.172L15.828 2L13 4.828zM3 14v2h2.05L4 17.05l1.413 1.414L7.465 16H10v-2H7.465l-2.05-2.05L4 13.05L3 14zm18 0l-1 1.05L21.05 14l-1.414-1.414L17.535 16H14v2h2.535l2.052-2.05L20 17.05L21 16v-2zM12 20.05l-1.413-1.414L9.465 18H7v2h2.465l2.05-2.05L13 19.05l1.413 1.414L15.535 19.5V22h2v-2.535l-2.052-2.05L14 18.535V16h-2v2.535l-1.12.915z"/>
  </svg>
);
// Simplified version (more standard move icon)
const BetterTranslateIcon: React.FC<IconProps> = ({ className }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className || "w-6 h-6"}
    >
        <path d="M12 6l-4 4h3v4h2v-4h3l-4-4zm0 12l4-4h-3v-4h-2v4h-3l4 4zM6 12l-4 4h3v-2h2v-2H9v-2H7v2H4l2 2zm12 0l4-4h-3v2h-2v2h2v2h2v-2h3l-2-2z"/>
        <path d="M12 2L9 5h2v4H7v2h4v2H9v2h2v4l3 3 3-3v-4h2v-2h-2V9h2V7h-2V5l-3-3zm0 2.83L13.17 6H10.83L12 4.83zM14 9v6h-4V9h4zm-2-2c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1zm0 10c.55 0 1-.45 1-1s-.45-1-1-1-1 .45-1 1 .45 1 1 1zM6 13l2-2h-1v-2h2V7H7L5 9v1h1v2H5l1 2zm12 0l-2-2h1v-2h-2V7h2l2 2v1h-1v2h1l-1 2z" />
        <path d="M10 2L9 3v2h2V3L10 2zM3 9l-2 1h2v2H1l2 1v-2H3V9zm7 10l-1 2h2l-1-2zm11-9l2-1h-2V9h2l-2-1v2h-2v2z" />
        <path d="M17.71 11.29l-4-4a1 1 0 00-1.42 0l-4 4A1 1 0 009 13h2v6h2v-6h2a1 1 0 00.71-1.71zM12 21a1 1 0 001-1v-6h-2v6a1 1 0 001 1z" />
        <path d="M12 2L8 6h3v5h2V6h3L12 2zm0 20l4-4h-3v-5h-2v5H8l4 4zM2 12l4 4v-3h5v-2H6V8L2 12zm20 0l-4-4v3h-5v2h5v3l4-4z" />
    </svg>
);


export default BetterTranslateIcon;
