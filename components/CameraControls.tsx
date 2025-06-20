import React from 'react';
import { CameraViewPreset } from '../types';

interface CameraControlsProps {
  onSetView: (view: CameraViewPreset) => void;
}

const CameraControls: React.FC<CameraControlsProps> = ({ onSetView }) => {
  const buttonClass = "flex-1 p-2.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-colors duration-150 ease-in-out shadow text-sm";

  return (
    <div className="p-4 bg-gray-800 shadow-lg md:rounded-b-lg flex flex-col space-y-2 md:space-y-0 md:flex-row md:space-x-2">
      <h4 className="text-sm font-semibold text-gray-300 mb-2 md:hidden text-center">카메라 뷰</h4>
      <button onClick={() => onSetView('top')} className={buttonClass}>
        상단 (Top)
      </button>
      <button onClick={() => onSetView('front')} className={buttonClass}>
        정면 (Front)
      </button>
      <button onClick={() => onSetView('side')} className={buttonClass}>
        측면 (Side)
      </button>
    </div>
  );
};

export default CameraControls;