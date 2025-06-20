import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { PhysicsObject, ObjectType, Vector3, PhysicsConstraint, ConstraintType } from '../types';

interface ConstraintEditorProps {
  physicsObjects: PhysicsObject[];
  constraints: PhysicsConstraint[];
  onAddConstraint: (
    bodyAId: string, 
    bodyBId: string, 
    pivotA: Vector3, 
    pivotB: Vector3, 
    type: ConstraintType,
    options?: { 
      axisA?: Vector3,
      axisB?: Vector3,
      distance?: number
    }
  ) => void;
  onDeleteConstraint: (constraintId: string) => void;
}

const getObjectName = (obj: PhysicsObject | undefined): string => {
  if (!obj) return 'N/A';
  return `${obj.type.charAt(0).toUpperCase() + obj.type.slice(1).toLowerCase()} (${obj.id.substring(0, 4)})`;
};

const ConstraintEditor: React.FC<ConstraintEditorProps> = ({
  physicsObjects,
  constraints,
  onAddConstraint,
  onDeleteConstraint,
}) => {
  const [selectedBodyAId, setSelectedBodyAId] = useState<string>('');
  const [selectedBodyBId, setSelectedBodyBId] = useState<string>('');
  const [pivotAInput, setPivotAInput] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [pivotBInput, setPivotBInput] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [axisAInput, setAxisAInput] = useState<Vector3>({ x: 0, y: 1, z: 0 }); 
  const [axisBInput, setAxisBInput] = useState<Vector3>({ x: 0, y: 1, z: 0 }); 
  const [distanceInput, setDistanceInput] = useState<number>(1);


  const dynamicObjects = physicsObjects.filter(obj => obj.type !== ObjectType.PLANE);

  const resetInputs = () => {
    setSelectedBodyAId('');
    setSelectedBodyBId('');
    setPivotAInput({ x: 0, y: 0, z: 0 });
    setPivotBInput({ x: 0, y: 0, z: 0 });
    setAxisAInput({ x: 0, y: 1, z: 0 });
    setAxisBInput({ x: 0, y: 1, z: 0 });
    setDistanceInput(1);
  }

  useEffect(() => {
    if (selectedBodyAId && selectedBodyBId) {
      const bodyA = physicsObjects.find(obj => obj.id === selectedBodyAId);
      const bodyB = physicsObjects.find(obj => obj.id === selectedBodyBId);
      if (bodyA && bodyB) {
        const worldPivotA = { 
          x: bodyA.position.x + pivotAInput.x, 
          y: bodyA.position.y + pivotAInput.y, 
          z: bodyA.position.z + pivotAInput.z 
        };
        const worldPivotB = { 
          x: bodyB.position.x + pivotBInput.x, 
          y: bodyB.position.y + pivotBInput.y, 
          z: bodyB.position.z + pivotBInput.z 
        };
        const dx = worldPivotA.x - worldPivotB.x;
        const dy = worldPivotA.y - worldPivotB.y;
        const dz = worldPivotA.z - worldPivotB.z;
        const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (dist > 0.01) { 
            setDistanceInput(parseFloat(dist.toFixed(2)));
        }
      }
    }
  }, [selectedBodyAId, selectedBodyBId, pivotAInput, pivotBInput, physicsObjects]);

  const handleAddPointToPointClick = useCallback(() => {
    if (selectedBodyAId && selectedBodyBId && selectedBodyAId !== selectedBodyBId) {
      onAddConstraint(
        selectedBodyAId,
        selectedBodyBId,
        pivotAInput,
        pivotBInput,
        ConstraintType.POINT_TO_POINT
      );
      resetInputs();
    } else {
      alert("점대점 제약을 위해서는 두 개의 서로 다른 동적 객체를 선택해야 합니다.");
    }
  }, [selectedBodyAId, selectedBodyBId, pivotAInput, pivotBInput, onAddConstraint]);

  const handleAddHingeClick = useCallback(() => {
    if (selectedBodyAId && selectedBodyBId && selectedBodyAId !== selectedBodyBId) {
      onAddConstraint(
        selectedBodyAId,
        selectedBodyBId,
        pivotAInput,
        pivotBInput,
        ConstraintType.HINGE,
        { axisA: axisAInput, axisB: axisBInput }
      );
      resetInputs();
    } else {
      alert("힌지 제약을 위해서는 두 개의 서로 다른 동적 객체를 선택해야 합니다.");
    }
  }, [selectedBodyAId, selectedBodyBId, pivotAInput, pivotBInput, axisAInput, axisBInput, onAddConstraint]);

  const handleAddLockClick = useCallback(() => {
    if (selectedBodyAId && selectedBodyBId && selectedBodyAId !== selectedBodyBId) {
      onAddConstraint(
        selectedBodyAId,
        selectedBodyBId,
        pivotAInput, 
        pivotBInput,
        ConstraintType.LOCK
      );
      resetInputs();
    } else {
      alert("고정 제약을 위해서는 두 개의 서로 다른 동적 객체를 선택해야 합니다.");
    }
  }, [selectedBodyAId, selectedBodyBId, pivotAInput, pivotBInput, onAddConstraint]);

  const handleAddDistanceClick = useCallback(() => {
    if (selectedBodyAId && selectedBodyBId && selectedBodyAId !== selectedBodyBId) {
      if (distanceInput <= 0) {
        alert("거리 제약의 목표 거리는 0보다 커야 합니다.");
        return;
      }
      onAddConstraint(
        selectedBodyAId,
        selectedBodyBId,
        pivotAInput,
        pivotBInput,
        ConstraintType.DISTANCE,
        { distance: distanceInput }
      );
      resetInputs();
    } else {
      alert("거리 제약을 위해서는 두 개의 서로 다른 동적 객체를 선택해야 합니다.");
    }
  }, [selectedBodyAId, selectedBodyBId, pivotAInput, pivotBInput, distanceInput, onAddConstraint]);


  const handlePivotInputChange = (
    pivotSetter: React.Dispatch<React.SetStateAction<Vector3>>,
    axis: keyof Vector3,
    value: string
  ) => {
    pivotSetter(prev => ({ ...prev, [axis]: parseFloat(value) || 0 }));
  };

  const renderVector3Input = (
    label: string,
    value: Vector3,
    onChange: (axis: keyof Vector3, valueStr: string) => void,
    title?: string,
  ) => (
    <div className="mb-2">
      <label className="block text-sm font-medium text-gray-300 mb-1" title={title}>{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {(['x', 'y', 'z'] as const).map(axis => (
          <div key={axis}>
            <span className="text-xs text-gray-400 uppercase">{axis}:</span>
            <input
              type="number"
              step="0.1"
              value={value[axis]}
              onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(axis, e.target.value)}
              className="mt-0.5 block w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
            />
          </div>
        ))}
      </div>
    </div>
  );
  
  const commonSelectClass = "block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100";
  const commonButtonClass = "w-full p-2 text-white rounded-md transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed";

  return (
    <div className="p-4 bg-gray-800 flex flex-col flex-grow min-h-0">
      {/* <h4 className="text-md font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2 flex-shrink-0">
        제약 조건 편집기
      </h4> */}
      
      <div className="flex-grow overflow-y-auto properties-editor-scrollbar space-y-3 mb-4 pr-1">
        <div>
          <label htmlFor="bodyASelect" className="block text-sm font-medium text-gray-300 mb-1">바디 A</label>
          <select 
            id="bodyASelect" 
            value={selectedBodyAId} 
            onChange={e => setSelectedBodyAId(e.target.value)}
            className={commonSelectClass}
          >
            <option value="">-- 바디 A 선택 --</option>
            {dynamicObjects.map(obj => (
              <option key={obj.id} value={obj.id} disabled={obj.id === selectedBodyBId}>
                {getObjectName(obj)}
              </option>
            ))}
          </select>
        </div>
        {selectedBodyAId && renderVector3Input("바디 A 피벗 (로컬)", pivotAInput, (axis, valStr) => handlePivotInputChange(setPivotAInput, axis, valStr))}

        <div>
          <label htmlFor="bodyBSelect" className="block text-sm font-medium text-gray-300 mb-1">바디 B</label>
          <select 
            id="bodyBSelect" 
            value={selectedBodyBId} 
            onChange={e => setSelectedBodyBId(e.target.value)}
            className={commonSelectClass}
          >
            <option value="">-- 바디 B 선택 --</option>
            {dynamicObjects.map(obj => (
              <option key={obj.id} value={obj.id} disabled={obj.id === selectedBodyAId}>
                {getObjectName(obj)}
              </option>
            ))}
          </select>
        </div>
        {selectedBodyBId && renderVector3Input("바디 B 피벗 (로컬)", pivotBInput, (axis, valStr) => handlePivotInputChange(setPivotBInput, axis, valStr))}
        
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
            <h5 className="text-sm font-medium text-gray-300 mb-1">힌지 축 (힌지 전용)</h5>
            {selectedBodyAId && renderVector3Input("바디 A 힌지 축 (로컬)", axisAInput, (axis, valStr) => handlePivotInputChange(setAxisAInput, axis, valStr), "힌지 제약 시 A의 회전 축 (기본값: Y축)")}
            {selectedBodyBId && renderVector3Input("바디 B 힌지 축 (로컬)", axisBInput, (axis, valStr) => handlePivotInputChange(setAxisBInput, axis, valStr), "힌지 제약 시 B의 회전 축 (기본값: Y축)")}
        
            <h5 className="text-sm font-medium text-gray-300 mb-1 pt-2 border-t border-gray-600">목표 거리 (거리 전용)</h5>
             <div>
                <label htmlFor="distanceInput" className="block text-xs font-medium text-gray-400">거리:</label>
                <input
                    type="number"
                    id="distanceInput"
                    step="0.1"
                    min="0.01"
                    value={distanceInput}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setDistanceInput(parseFloat(e.target.value) || 0.01)}
                    className="mt-0.5 block w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
                    title="두 피벗 지점 간의 목표 거리"
                />
            </div>
        </div>


        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleAddPointToPointClick}
            disabled={!selectedBodyAId || !selectedBodyBId || selectedBodyAId === selectedBodyBId}
            className={`${commonButtonClass} bg-green-600 hover:bg-green-700`}
            title="두 객체의 지정된 로컬 피벗 지점을 서로 연결합니다."
          >
            점대점(P2P)
          </button>
          <button
            onClick={handleAddHingeClick}
            disabled={!selectedBodyAId || !selectedBodyBId || selectedBodyAId === selectedBodyBId}
            className={`${commonButtonClass} bg-blue-600 hover:bg-blue-700`}
            title="두 객체를 지정된 로컬 피벗 및 축을 기준으로 경첩처럼 연결합니다."
          >
            힌지(Hinge)
          </button>
          <button
            onClick={handleAddLockClick}
            disabled={!selectedBodyAId || !selectedBodyBId || selectedBodyAId === selectedBodyBId}
            className={`${commonButtonClass} bg-purple-600 hover:bg-purple-700`}
            title="두 객체를 현재 상대 위치와 방향으로 단단히 고정합니다."
          >
            고정(Lock)
          </button>
          <button
            onClick={handleAddDistanceClick}
            disabled={!selectedBodyAId || !selectedBodyBId || selectedBodyAId === selectedBodyBId || distanceInput <=0}
            className={`${commonButtonClass} bg-orange-500 hover:bg-orange-600`}
            title="두 객체의 지정된 로컬 피벗 지점 간의 거리를 일정하게 유지합니다."
          >
            거리(Distance)
          </button>
        </div>
      </div>

      <h5 className="text-sm font-semibold mt-2 mb-2 text-gray-300 border-t border-gray-700 pt-3 flex-shrink-0">
        현재 제약 조건
      </h5>
      {constraints.length === 0 ? (
        <p className="text-sm text-gray-400 flex-shrink-0">활성 제약 조건이 없습니다.</p>
      ) : (
        <ul className="space-y-2 max-h-40 overflow-y-auto properties-editor-scrollbar flex-shrink-0">
          {constraints.map(constraint => {
            const bodyA = physicsObjects.find(obj => obj.id === constraint.bodyAId);
            const bodyB = physicsObjects.find(obj => obj.id === constraint.bodyBId);
            let typeDisplayString: string;
            switch(constraint.type) {
                case ConstraintType.POINT_TO_POINT: typeDisplayString = "점대점"; break;
                case ConstraintType.HINGE: typeDisplayString = "힌지"; break;
                case ConstraintType.LOCK: typeDisplayString = "고정"; break;
                case ConstraintType.DISTANCE: typeDisplayString = "거리"; break;
                default: typeDisplayString = constraint.type;
            }

            return (
              <li key={constraint.id} className="text-xs p-2 bg-gray-700 rounded-md">
                <div className="flex justify-between items-center">
                  <div>
                    <strong className="text-sky-400">ID: {constraint.id.substring(0,4)}</strong> ({typeDisplayString})<br/>
                    <span className="text-gray-300">A: {getObjectName(bodyA)} @ ({constraint.pivotA.x.toFixed(1)},{constraint.pivotA.y.toFixed(1)},{constraint.pivotA.z.toFixed(1)})</span><br/>
                    <span className="text-gray-300">B: {getObjectName(bodyB)} @ ({constraint.pivotB.x.toFixed(1)},{constraint.pivotB.y.toFixed(1)},{constraint.pivotB.z.toFixed(1)})</span>
                    {constraint.type === ConstraintType.HINGE && constraint.axisA && constraint.axisB && (
                        <>
                        <br/>
                        <span className="text-amber-400">축A: ({constraint.axisA.x.toFixed(1)},{constraint.axisA.y.toFixed(1)},{constraint.axisA.z.toFixed(1)})</span>
                        <br/>
                        <span className="text-amber-400">축B: ({constraint.axisB.x.toFixed(1)},{constraint.axisB.y.toFixed(1)},{constraint.axisB.z.toFixed(1)})</span>
                        </>
                    )}
                    {constraint.type === ConstraintType.DISTANCE && constraint.distance !== undefined && (
                        <>
                        <br/>
                        <span className="text-emerald-400">목표 거리: {constraint.distance.toFixed(2)}</span>
                        </>
                    )}
                  </div>
                  <button 
                    onClick={() => onDeleteConstraint(constraint.id)}
                    className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    title="제약 조건 삭제"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ConstraintEditor;
