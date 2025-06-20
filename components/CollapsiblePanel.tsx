import React from 'react';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronUpIcon from './icons/ChevronUpIcon';

interface CollapsiblePanelProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

const CollapsiblePanel: React.FC<CollapsiblePanelProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  className = '',
  headerClassName = 'p-3 cursor-pointer bg-gray-800 hover:bg-gray-700 border-b border-gray-700',
  contentClassName = '',
}) => {
  return (
    <div className={`shadow-md ${isOpen ? 'flex flex-col' : ''} ${className}`}>
      <div
        className={`flex items-center justify-between ${headerClassName}`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
        aria-expanded={isOpen}
        aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <h3 className="text-md font-semibold text-gray-100">{title}</h3>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
      </div>
      {isOpen && (
        <div 
          id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
          className={`bg-gray-800 ${contentClassName} ${isOpen ? 'flex-grow flex flex-col min-h-0' : ''}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsiblePanel;
