
import React from 'react';

interface IconProps {
  className?: string;
}

const HelpIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-5 h-5"}
  >
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.882-.41-1.713-.663-2.622-.663-2.026 0-3.422 1.026-3.422 2.663 0 .981.63 1.69 1.408 2.274 1.036.776 1.392 1.442 1.392 2.366v.318H12.5v-.318c0-.882-.356-1.548-1.392-2.366-.778-.585-1.408-1.293-1.408-2.274 0-.806.826-1.318 1.832-1.318.73 0 1.303.187 1.768.41a1.04 1.04 0 001.074-.238l.626-.874a1.04 1.04 0 00-.238-1.074zM12.5 16.125a1.125 1.125 0 11-2.25 0 1.125 1.125 0 012.25 0z" clipRule="evenodd" />
  </svg>
);

export default HelpIcon;
