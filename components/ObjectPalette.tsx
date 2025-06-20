import React from 'react';
import { ObjectType } from '../types';

interface ObjectPaletteProps {
  onAddObject: (type: ObjectType) => void;
}

const ObjectPalette: React.FC<ObjectPaletteProps> = ({ onAddObject }) => {
  const buttonClass = "p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors duration-150 ease-in-out shadow-md hover:shadow-lg text-sm text-center";

  return (
    <div className="p-3 bg-gray-800 grid grid-cols-3 gap-2 md:min-w-[250px] rounded-b-lg md:rounded-bl-lg">
      {/* <h3 className="text-xl font-semibold mb-4 text-gray-100 border-b border-gray-700 pb-2 col-span-3">객체 추가</h3> */}
      <button onClick={() => onAddObject(ObjectType.SPHERE)} className={buttonClass}>
        구체 추가
      </button>
      <button onClick={() => onAddObject(ObjectType.BOX)} className={buttonClass}>
        상자 추가
      </button>
      <button onClick={() => onAddObject(ObjectType.CYLINDER)} className={buttonClass}>
        원통 추가
      </button>
      <button onClick={() => onAddObject(ObjectType.CONE)} className={buttonClass}>
        원뿔 추가
      </button>
      <button onClick={() => onAddObject(ObjectType.CAPSULE)} className={buttonClass}>
        캡슐 추가
      </button>
      <button onClick={() => onAddObject(ObjectType.TORUS)} className={buttonClass} title="토러스 (물리 시뮬레이션은 단순화됨)">
        토러스 추가
      </button>
    </div>
  );
};

export default ObjectPalette;