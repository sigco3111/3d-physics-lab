
import React, { ChangeEvent, useCallback, useState, useEffect } from 'react';
import { PhysicsObject, ObjectType, Vector3, PhysicsObjectProperties, UpdatableCannonObjectFields, MaterialPreset, SimulationStatus } from '../types';

interface PropertiesEditorProps {
  selectedObject: PhysicsObject | null;
  onUpdateObject: (id: string, updates: UpdatableCannonObjectFields) => void;
  onDeleteObject: (id: string) => void;
  onFocusObject: (id: string) => void;
  onApplyImpulse: (id: string, impulse: Vector3) => void;
  simulationStatus: SimulationStatus;
}

const getDisplayTypeName = (type: ObjectType): string => {
  switch (type) {
    case ObjectType.SPHERE: return '구체';
    case ObjectType.BOX: return '상자';
    case ObjectType.CYLINDER: return '원통';
    case ObjectType.PLANE: return '평면';
    case ObjectType.CONE: return '원뿔';
    case ObjectType.TORUS: return '토러스';
    case ObjectType.CAPSULE: return '캡슐';
    default: return type;
  }
};

const materialPresets: MaterialPreset[] = [
  { name: 'custom', displayName: '사용자 정의', friction: -1, restitution: -1, metalness: 0.5, roughness: 0.5 }, // Placeholder
  { name: 'rubber', displayName: '고무 (Rubber)', friction: 0.8, restitution: 0.7, metalness: 0.0, roughness: 0.7, baseColor: '#303030' },
  { name: 'ice', displayName: '얼음 (Ice)', friction: 0.05, restitution: 0.1, metalness: 0.1, roughness: 0.05, baseColor: '#D4F1F9' },
  { name: 'wood', displayName: '나무 (Wood)', friction: 0.45, restitution: 0.3, metalness: 0.0, roughness: 0.8, baseColor: '#8B4513' },
  { name: 'metal_rough', displayName: '금속 (거친) (Metal - Rough)', friction: 0.25, restitution: 0.1, metalness: 0.8, roughness: 0.6, baseColor: '#A9A9A9' },
  { name: 'metal_smooth', displayName: '금속 (매끈한) (Metal - Smooth)', friction: 0.15, restitution: 0.05, metalness: 0.9, roughness: 0.1, baseColor: '#D3D3D3' },
  { name: 'plastic', displayName: '플라스틱 (Plastic)', friction: 0.3, restitution: 0.4, metalness: 0.0, roughness: 0.3, baseColor: '#4682B4' },
  { name: 'glass', displayName: '유리 (Glass)', friction: 0.1, restitution: 0.1, metalness: 0.1, roughness: 0.05, baseColor: '#ADD8E6' }, // Note: True glass needs transparency
  { name: 'concrete', displayName: '콘크리트 (Concrete)', friction: 0.7, restitution: 0.15, metalness: 0.0, roughness: 0.9, baseColor: '#808080' },
  { name: 'bouncy', displayName: '탄력있는 공 (Bouncy Ball)', friction: 0.5, restitution: 0.9, metalness: 0.0, roughness: 0.5, baseColor: '#FF69B4' },
];


const PropertiesEditor: React.FC<PropertiesEditorProps> = ({ 
  selectedObject, 
  onUpdateObject, 
  onDeleteObject, 
  onFocusObject,
  onApplyImpulse,
  simulationStatus
}) => {
  const [currentPresetName, setCurrentPresetName] = useState<string>('custom');
  const [impulseInput, setImpulseInput] = useState<Vector3>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    if (selectedObject) {
      const props = selectedObject.properties;
      const matchedPreset = materialPresets.find(
        p => p.name !== 'custom' && 
             p.friction === props.friction && 
             p.restitution === props.restitution &&
             (p.metalness === undefined || p.metalness === props.metalness) &&
             (p.roughness === undefined || p.roughness === props.roughness)
      );
      setCurrentPresetName(matchedPreset ? matchedPreset.name : 'custom');
      setImpulseInput({ x: 0, y: 0, z: 0 }); 
    } else {
      setCurrentPresetName('custom');
    }
  }, [selectedObject]);

  const handleInputChange = useCallback((path: string, value: string | number | boolean | null) => {
    if (!selectedObject) return;

    const keys = path.split('.');
    let updates: UpdatableCannonObjectFields = {};
    let currentLevel: any = updates;

    keys.forEach((key, index) => {
      if (index === keys.length - 1) {
        currentLevel[key] = value;
      } else {
        currentLevel[key] = currentLevel[key] || {};
        currentLevel = currentLevel[key];
      }
    });
    
    onUpdateObject(selectedObject.id, updates);

    if (path.startsWith('properties.')) {
      setCurrentPresetName('custom');
    }

  }, [selectedObject, onUpdateObject]);

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const presetName = event.target.value;
    setCurrentPresetName(presetName);
    if (!selectedObject) return;

    const preset = materialPresets.find(p => p.name === presetName);
    if (preset) {
      const updates: UpdatableCannonObjectFields = {
        properties: {
          friction: preset.friction === -1 ? selectedObject.properties.friction : preset.friction,
          restitution: preset.restitution === -1 ? selectedObject.properties.restitution : preset.restitution,
          metalness: preset.metalness === undefined ? selectedObject.properties.metalness : preset.metalness,
          roughness: preset.roughness === undefined ? selectedObject.properties.roughness : preset.roughness,
        }
      };
      if (preset.baseColor && preset.name !== 'custom') { // Do not change color for 'custom' preset itself
        updates.color = preset.baseColor;
      }
      onUpdateObject(selectedObject.id, updates);
    }
  };

  const handleImpulseInputChange = useCallback((axis: keyof Vector3, value: string) => {
    setImpulseInput(prev => ({
      ...prev,
      [axis]: parseFloat(value) || 0
    }));
  }, []);

  const handleApplyImpulseClick = useCallback(() => {
    if (selectedObject && selectedObject.type !== ObjectType.PLANE) {
      onApplyImpulse(selectedObject.id, impulseInput);
    }
  }, [selectedObject, impulseInput, onApplyImpulse]);


  const renderVector3Input = (label: string, path: string, value: Vector3, title?: string, isImpulseInput: boolean = false) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300 mb-1" title={title}>{label}</label>
      <div className="grid grid-cols-3 gap-2">
        {(['x', 'y', 'z'] as const).map(axis => (
          <div key={axis}>
            <span className="text-xs text-gray-400 uppercase">{axis}:</span>
            <input
              type="number"
              step="0.1"
              value={isImpulseInput ? impulseInput[axis] : value[axis]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => 
                isImpulseInput ? handleImpulseInputChange(axis, e.target.value) : handleInputChange(`${path}.${axis}`, parseFloat(e.target.value))
              }
              className="mt-1 block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
          </div>
        ))}
      </div>
    </div>
  );

  const renderNumberInput = (label: string, path: string, value: number, step: number = 0.1, title?: string, min?: number, max?:number) => (
    <div className="mb-3">
      <label htmlFor={path} className="block text-sm font-medium text-gray-300" title={title}>{label}</label>
      <input
        type="number"
        id={path}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(path, parseFloat(e.target.value))}
        className="mt-1 block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
      />
    </div>
  );
  
  const renderColorInput = (label: string, path: string, value: string) => (
    <div className="mb-3">
      <label htmlFor={path} className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type="color"
        id={path}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => handleInputChange(path, e.target.value)}
        className="mt-1 block w-full h-10 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500"
      />
    </div>
  );

  const renderSelectInput = (label: string, value: string, onChange: (e: ChangeEvent<HTMLSelectElement>) => void, options: {value: string, label: string}[]) => (
    <div className="mb-3">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="mt-1 block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );


  if (!selectedObject) {
    return (
      <div className="w-full md:w-80 p-4 bg-gray-800 text-gray-400 flex items-center justify-center shadow-lg rounded-lg h-full">
        <p>객체를 선택하여 속성을 편집하세요.</p>
      </div>
    );
  }

  const isDynamicObject = selectedObject.type !== ObjectType.PLANE;
  const props = selectedObject.properties;

  return (
    <div className="w-full bg-gray-800 shadow-lg rounded-lg flex flex-col flex-grow">
      <h3 className="text-xl font-semibold p-4 text-gray-100 border-b border-gray-700 sticky top-0 bg-gray-800 z-10">
        속성 편집: {getDisplayTypeName(selectedObject.type)} ({selectedObject.id.substring(0,6)})
      </h3>
      <div className="p-4 space-y-4 flex-grow properties-editor-scrollbar overflow-y-auto">
        {renderVector3Input("위치", "position", selectedObject.position)}
        {renderVector3Input("회전 (오일러 각도 °)", "rotation", selectedObject.rotation)}
        
        <h4 className="text-lg font-medium text-gray-200 mt-3 pt-3 border-t border-gray-700">재질 및 모양</h4>
        {renderColorInput("기본 색상", "color", selectedObject.color)}
        {isDynamicObject && renderSelectInput("재질 프리셋", currentPresetName, handlePresetChange, 
          materialPresets.map(p => ({ value: p.name, label: p.displayName }))
        )}
        {isDynamicObject && renderNumberInput("금속성 (Metalness)", "properties.metalness", props.metalness ?? 0.5, 0.01, "PBR 재질의 금속성입니다. 0(비금속)과 1(금속) 사이의 값입니다.", 0, 1)}
        {isDynamicObject && renderNumberInput("거칠기 (Roughness)", "properties.roughness", props.roughness ?? 0.5, 0.01, "PBR 재질의 표면 거칠기입니다. 0(매끈함)과 1(거침) 사이의 값입니다.", 0, 1)}

        <h4 className="text-lg font-medium text-gray-200 mt-3 pt-3 border-t border-gray-700">물리 속성</h4>
        {isDynamicObject && renderNumberInput("질량", "properties.mass", props.mass, 0.1, "객체의 관성과 중력에 대한 저항 정도입니다. 값이 클수록 무겁습니다.", 0)}
        {isDynamicObject && renderNumberInput("마찰력", "properties.friction", props.friction, 0.01, "두 표면이 서로 미끄러질 때 발생하는 저항력입니다. 0과 1 사이의 값이며, 값이 클수록 마찰이 큽니다.", 0)}
        {isDynamicObject && renderNumberInput("반발력", "properties.restitution", props.restitution, 0.01, "충돌 시 객체가 얼마나 '튕기는지'를 나타냅니다. 0과 1 사이의 값이며, 1에 가까울수록 탄성이 높습니다.", 0)}
        {isDynamicObject && renderVector3Input("초기 속도", "properties.velocity", props.velocity)}
        {isDynamicObject && renderVector3Input("초기 각속도", "properties.angularVelocity", props.angularVelocity)}

        {/* Shape Specific Properties */}
        {selectedObject.type === ObjectType.SPHERE && props.radius !== undefined && (
          renderNumberInput("반지름", "properties.radius", props.radius, 0.05, undefined, 0.01)
        )}
        {selectedObject.type === ObjectType.BOX && props.size && (
          renderVector3Input("크기 (너비, 높이, 깊이)", "properties.size", props.size)
        )}
        {selectedObject.type === ObjectType.CYLINDER && (
          <>
            <h4 className="text-md font-medium text-gray-200 mt-2 pt-2 border-t border-gray-700">원통 속성</h4>
            {renderNumberInput("상단 반지름", "properties.radiusTop", props.radiusTop ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("하단 반지름", "properties.radiusBottom", props.radiusBottom ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("높이", "properties.height", props.height ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("세그먼트 수", "properties.numSegments", props.numSegments ?? 16, 1, "원통의 원주를 구성하는 면의 수입니다. 값이 높을수록 부드러워집니다.", 3)}
          </>
        )}
        {selectedObject.type === ObjectType.CONE && (
          <>
            <h4 className="text-md font-medium text-gray-200 mt-2 pt-2 border-t border-gray-700">원뿔 속성</h4>
            {renderNumberInput("반지름 (하단)", "properties.radius", props.radius ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("높이", "properties.height", props.height ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("세그먼트 수", "properties.numSegments", props.numSegments ?? 16, 1, "원뿔의 원주를 구성하는 면의 수입니다. 값이 높을수록 부드러워집니다.", 3)}
          </>
        )}
        {selectedObject.type === ObjectType.CAPSULE && (
          <>
            <h4 className="text-md font-medium text-gray-200 mt-2 pt-2 border-t border-gray-700">캡슐 속성</h4>
            {renderNumberInput("반지름", "properties.radius", props.radius ?? 0.5, 0.05, undefined, 0.01)}
            {renderNumberInput("높이 (원통 부분)", "properties.height", props.height ?? 1, 0.05, undefined, 0.01)}
          </>
        )}
        {selectedObject.type === ObjectType.TORUS && (
          <>
            <h4 className="text-md font-medium text-gray-200 mt-2 pt-2 border-t border-gray-700">토러스 속성</h4>
            {renderNumberInput("반지름 (중심에서 튜브 중심까지)", "properties.radius", props.radius ?? 1, 0.05, undefined, 0.01)}
            {renderNumberInput("튜브 반지름", "properties.tube", props.tube ?? 0.4, 0.05, undefined, 0.01)}
            {renderNumberInput("방사형 세그먼트", "properties.radialSegments", props.radialSegments ?? 16, 1, undefined, 3)}
            {renderNumberInput("관형 세그먼트", "properties.tubularSegments", props.tubularSegments ?? 32, 1, undefined, 3)}
          </>
        )}


        {isDynamicObject && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <h4 className="text-lg font-medium text-gray-200 mb-2">충격량 적용 (Ns)</h4>
            {renderVector3Input("충격량 (X, Y, Z)", "impulse", impulseInput, "선택된 객체에 적용할 순간적인 힘의 크기 및 방향입니다.", true)}
            <button
              onClick={handleApplyImpulseClick}
              disabled={simulationStatus === 'stopped'}
              className="w-full mt-2 p-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              title={simulationStatus === 'stopped' ? "시뮬레이션이 실행 중일 때만 적용 가능합니다." : "객체에 충격량 적용"}
            >
              충격량 적용
            </button>
          </div>
        )}
        
        <div className="pt-4 space-y-2">
          <button
            onClick={() => onFocusObject(selectedObject.id)}
            className="w-full p-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
          >
            카메라 포커스
          </button>
          {isDynamicObject && (
            <button 
              onClick={() => onDeleteObject(selectedObject.id)}
              className="w-full p-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              객체 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertiesEditor;