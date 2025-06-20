
import React from 'react';
import { SimulationStatus } from '../types';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import ResetIcon from './icons/ResetIcon';
import UndoIcon from './icons/UndoIcon';
import RedoIcon from './icons/RedoIcon';
import TrashIcon from './icons/TrashIcon'; // New Icon

interface ControlsProps {
  simulationStatus: SimulationStatus;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void; // Resets current simulation state
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onResetScene: () => void; // Resets entire scene to empty
}

const Controls: React.FC<ControlsProps> = ({ 
  simulationStatus, 
  onPlay, 
  onPause, 
  onReset,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onResetScene
}) => {
  const commonButtonClass = "p-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 text-sm";
  const activeClass = "bg-sky-500 hover:bg-sky-600 text-white";
  const inactiveClass = "bg-gray-600 hover:bg-gray-500 text-gray-200";
  const dangerClass = "bg-red-600 hover:bg-red-700 text-white";
  const disabledClass = "bg-gray-700 text-gray-500 cursor-not-allowed";
  const iconSize = "w-4 h-4"; 

  return (
    <div className="p-3 bg-gray-800 shadow-lg rounded-b-lg md:rounded-bl-none md:rounded-br-lg md:rounded-tr-lg flex items-center justify-around space-x-1 md:space-x-2 flex-wrap">
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`${commonButtonClass} ${!canUndo ? disabledClass : inactiveClass}`}
        title="실행 취소 (Ctrl+Z)"
      >
        <UndoIcon className={iconSize} /> 
        <span className="hidden sm:inline">취소</span>
      </button>
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`${commonButtonClass} ${!canRedo ? disabledClass : inactiveClass}`}
        title="다시 실행 (Ctrl+Y)"
      >
        <RedoIcon className={iconSize} />
        <span className="hidden sm:inline">복구</span>
      </button>
      
      <div className="border-l border-gray-700 h-8 mx-1 hidden sm:block"></div>

      <button
        onClick={onPlay}
        disabled={simulationStatus === 'playing'}
        className={`${commonButtonClass} ${simulationStatus === 'playing' ? disabledClass : activeClass}`}
        title="시뮬레이션 시작"
      >
        <PlayIcon className={iconSize} /> 
        <span className="hidden sm:inline">시작</span>
      </button>
      <button
        onClick={onPause}
        disabled={simulationStatus !== 'playing'}
        className={`${commonButtonClass} ${simulationStatus === 'playing' ? activeClass : disabledClass}`}
        title="시뮬레이션 일시정지"
      >
        <PauseIcon className={iconSize} />
        <span className="hidden sm:inline">일시정지</span>
      </button>
      <button
        onClick={onReset}
        className={`${commonButtonClass} ${inactiveClass}`}
        title="현재 시뮬레이션 초기화"
      >
        <ResetIcon className={iconSize} />
        <span className="hidden sm:inline">초기화</span>
      </button>
      <div className="border-l border-gray-700 h-8 mx-1 hidden sm:block"></div>
       <button
        onClick={onResetScene}
        className={`${commonButtonClass} ${dangerClass}`}
        title="장면 전체 초기화 (모든 객체 삭제)"
      >
        <TrashIcon className={iconSize} />
        <span className="hidden sm:inline">장면 초기화</span>
      </button>
    </div>
  );
};

export default Controls;