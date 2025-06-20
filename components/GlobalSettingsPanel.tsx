import React, { ChangeEvent, useCallback } from 'react';
import { Vector3, GlobalPhysicsSettings } from '../types';

interface GlobalSettingsPanelProps {
  currentSettings: GlobalPhysicsSettings;
  onGravityChange: (newGravity: Vector3) => void;
  onSimulationSpeedChange: (newSpeed: number) => void;
}

const GlobalSettingsPanel: React.FC<GlobalSettingsPanelProps> = ({ 
  currentSettings, 
  onGravityChange,
  onSimulationSpeedChange
}) => {

  const handleGravityInputChange = useCallback((axis: keyof Vector3, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onGravityChange({
        ...currentSettings.gravity,
        [axis]: numValue,
      });
    }
  }, [currentSettings.gravity, onGravityChange]);

  const handleSpeedInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    let newSpeed = parseFloat(event.target.value);
    if (isNaN(newSpeed)) {
      newSpeed = 1.0; // Default to 1 if input is invalid
    }
    newSpeed = Math.max(0.1, Math.min(newSpeed, 10)); // Clamp speed between 0.1x and 10x
    onSimulationSpeedChange(newSpeed);
  }, [onSimulationSpeedChange]);

  return (
    <div className="p-4 bg-gray-800">
      {/* <h4 className="text-md font-semibold mb-2 text-gray-200 border-b border-gray-700 pb-1">전역 설정</h4> */}
      <div className="space-y-3">
        <div>
            <label className="block text-sm font-medium text-gray-300">중력 (m/s²)</label>
            <div className="grid grid-cols-3 gap-2 mt-1">
            {(['x', 'y', 'z'] as const).map(axis => (
                <div key={axis}>
                <span className="text-xs text-gray-400 uppercase">{axis}:</span>
                <input
                    type="number"
                    step="0.1"
                    value={currentSettings.gravity[axis]}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => handleGravityInputChange(axis, e.target.value)}
                    className="mt-1 block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
                    aria-label={`Gravity ${axis}`}
                />
                </div>
            ))}
            </div>
        </div>
        <div>
            <label htmlFor="simulationSpeed" className="block text-sm font-medium text-gray-300">시뮬레이션 속도</label>
            <input
                type="number"
                id="simulationSpeed"
                step="0.1"
                min="0.1"
                max="10" // Example max, adjust as needed
                value={currentSettings.simulationSpeed}
                onChange={handleSpeedInputChange}
                className="mt-1 block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
                aria-label="Simulation speed multiplier"
            />
            <p className="text-xs text-gray-400 mt-1">예: 0.5 (절반 속도), 1 (정상), 2 (두 배 속도)</p>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsPanel;
