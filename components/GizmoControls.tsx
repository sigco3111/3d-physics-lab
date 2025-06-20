
import React from 'react';
import { GizmoMode } from '../types';
import TranslateIcon from './icons/TranslateIcon';
import RotateIcon from './icons/RotateIcon';

interface GizmoControlsProps {
  currentMode: GizmoMode;
  onSetMode: (mode: GizmoMode) => void;
  simulationStatus: 'playing' | 'paused' | 'stopped'; // To disable when playing
  selectedObjectId: string | null; // To disable if no object is selected
}

const GizmoControls: React.FC<GizmoControlsProps> = ({ currentMode, onSetMode, simulationStatus, selectedObjectId }) => {
  const commonButtonClass = "p-2.5 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const activeClass = "bg-green-500 hover:bg-green-600 text-white focus:ring-green-400";
  const inactiveClass = "bg-gray-600 hover:bg-gray-500 text-gray-200 focus:ring-sky-500";
  const disabledClass = "bg-gray-700 text-gray-500 cursor-not-allowed opacity-50";
  const iconSize = "w-5 h-5";

  const isDisabled = simulationStatus === 'playing' || !selectedObjectId;

  const handleModeClick = (mode: 'translate' | 'rotate') => {
    if (isDisabled) return;
    onSetMode(currentMode === mode ? null : mode);
  };

  return (
    <div className="p-3 bg-gray-800 shadow-lg md:rounded-b-lg flex items-center justify-center space-x-2">
       <h4 className="text-sm font-semibold text-gray-300 mr-2 md:hidden">조작 도구:</h4>
      <button
        onClick={() => handleModeClick('translate')}
        disabled={isDisabled}
        className={`${commonButtonClass} ${currentMode === 'translate' && !isDisabled ? activeClass : inactiveClass} ${isDisabled ? disabledClass : ''}`}
        title={isDisabled ? (simulationStatus === 'playing' ? "시뮬레이션 중에는 사용 불가" : "객체 선택 필요") : "이동 모드 (T)"}
        aria-pressed={currentMode === 'translate' && !isDisabled}
      >
        <TranslateIcon className={iconSize} />
        <span className="hidden sm:inline">이동</span>
      </button>
      <button
        onClick={() => handleModeClick('rotate')}
        disabled={isDisabled}
        className={`${commonButtonClass} ${currentMode === 'rotate' && !isDisabled ? activeClass : inactiveClass} ${isDisabled ? disabledClass : ''}`}
        title={isDisabled ? (simulationStatus === 'playing' ? "시뮬레이션 중에는 사용 불가" : "객체 선택 필요") : "회전 모드 (R)"}
        aria-pressed={currentMode === 'rotate' && !isDisabled}
      >
        <RotateIcon className={iconSize} />
        <span className="hidden sm:inline">회전</span>
      </button>
    </div>
  );
};

export default GizmoControls;
