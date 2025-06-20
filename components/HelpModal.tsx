
import React from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  const sectionTitleClass = "text-xl font-semibold text-sky-300 mt-4 mb-2";
  const subSectionTitleClass = "text-lg font-medium text-teal-300 mt-3 mb-1";
  const paragraphClass = "text-sm text-gray-300 mb-2 leading-relaxed";
  const listItemClass = "text-sm text-gray-300 ml-4 mb-1 list-disc";
  const codeClass = "bg-gray-700 text-amber-400 px-1 py-0.5 rounded text-xs";

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close on backdrop click
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
    >
      <div
        className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="help-modal-title" className="text-2xl font-bold text-gray-100">도움말 - 3D 물리 실험실</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-3xl font-light"
            aria-label="도움말 닫기"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto properties-editor-scrollbar pr-2">
          <h3 className={sectionTitleClass}>소개</h3>
          <p className={paragraphClass}>
            3D 물리 실험실에 오신 것을 환영합니다! 이 애플리케이션을 사용하면 다양한 3D 객체를 만들고, 물리적 속성을 조정하며, 실시간으로 시뮬레이션 결과를 확인할 수 있습니다. AI를 활용하여 복잡한 장면을 자동으로 생성할 수도 있습니다.
          </p>

          <h3 className={sectionTitleClass}>화면 구성</h3>
          <p className={paragraphClass}>애플리케이션 인터페이스는 크게 세 부분으로 나뉩니다:</p>
          <ul className="list-none mb-3">
            <li className={listItemClass}><strong className="text-sky-400">왼쪽 패널:</strong> API 키 관리, 객체 추가, AI 장면 생성, 전역 설정, 제약 조건 편집, 장면 라이브러리, 조작 도구, 시뮬레이션 및 카메라 컨트롤 등 주요 기능을 제공합니다. (모바일에서는 오른쪽 패널 상단에 일부 통합)</li>
            <li className={listItemClass}><strong className="text-sky-400">중앙 캔버스:</strong> 3D 작업 공간입니다. 객체를 시각화하고 선택하며, 마우스로 카메라를 조작할 수 있습니다 (왼쪽 클릭 드래그: 회전, 오른쪽 클릭 드래그: 이동, 휠: 줌).</li>
            <li className={listItemClass}><strong className="text-sky-400">오른쪽 패널:</strong> 선택된 객체의 상세 속성을 편집합니다. (모바일에서는 왼쪽 패널의 기능들이 이 곳 하단에 표시될 수 있습니다).</li>
          </ul>

          <h3 className={sectionTitleClass}>주요 기능</h3>

          <h4 className={subSectionTitleClass}>객체 조작</h4>
          <ul className="list-none mb-3">
            <li className={listItemClass}><strong className="text-emerald-400">추가:</strong> 왼쪽 패널의 "객체 추가" 섹션에서 원하는 객체(구, 상자 등) 버튼을 클릭합니다.</li>
            <li className={listItemClass}><strong className="text-emerald-400">선택:</strong> 3D 캔버스에서 객체를 마우스로 클릭합니다. 선택된 객체는 강조 표시됩니다.</li>
            <li className={listItemClass}><strong className="text-emerald-400">이동/회전:</strong>
              <ul className="list-none mt-1">
                  <li className={listItemClass}>오른쪽 "속성 편집기"에서 위치, 회전 값을 직접 수정합니다.</li>
                  <li className={listItemClass}>조작 도구(Gizmo): 객체 선택 후, 왼쪽 패널 하단의 "이동" 또는 "회전" 버튼을 클릭하거나, 단축키 <code className={codeClass}>T</code> (이동) 또는 <code className={codeClass}>R</code> (회전)을 누릅니다. 시뮬레이션 중에는 Gizmo 사용이 불가합니다.</li>
              </ul>
            </li>
            <li className={listItemClass}><strong className="text-emerald-400">속성 변경:</strong> 오른쪽 "속성 편집기"에서 질량, 마찰계수, 반발계수, 색상, 크기 등 다양한 물리 및 시각 속성을 변경합니다.</li>
            <li className={listItemClass}><strong className="text-emerald-400">삭제:</strong> 오른쪽 "속성 편집기" 하단의 "객체 삭제" 버튼을 클릭합니다.</li>
          </ul>

          <h4 className={subSectionTitleClass}>물리 시뮬레이션</h4>
           <ul className="list-none mb-3">
            <li className={listItemClass}>왼쪽 패널 하단의 컨트롤 버튼 (<code className={codeClass}>시작</code>, <code className={codeClass}>일시정지</code>, <code className={codeClass}>초기화</code>)을 사용합니다.</li>
            <li className={listItemClass}><code className={codeClass}>장면 초기화</code> (휴지통 아이콘) 버튼은 모든 객체를 삭제하고 장면을 비웁니다.</li>
            <li className={listItemClass}><strong className="text-emerald-400">충격량 적용:</strong> "속성 편집기"에서 시뮬레이션이 실행 중일 때 선택된 객체에 특정 방향과 크기로 순간적인 힘(충격량)을 가할 수 있습니다.</li>
          </ul>

          <h4 className={subSectionTitleClass}>제약 조건 (Constraints)</h4>
           <ul className="list-none mb-3">
            <li className={listItemClass}>왼쪽 패널의 "제약 조건 편집기"를 사용합니다.</li>
            <li className={listItemClass}>두 개의 동적 객체를 선택하고, 각 객체에서의 로컬 피벗 위치를 설정합니다.</li>
            <li className={listItemClass}>제약 종류 (점대점, 힌지, 고정, 거리)를 선택하고 추가합니다. 힌지의 경우 회전 축도 설정할 수 있습니다.</li>
          </ul>
          
          <h4 className={subSectionTitleClass}>AI 장면 생성</h4>
           <ul className="list-none mb-3">
            <li className={listItemClass}><strong className="text-emerald-400">API 키 설정:</strong> 왼쪽 패널 상단의 "Gemini API 키 관리"에서 유효한 Gemini API 키를 입력하고 "저장" 버튼을 누릅니다. 키가 없으면 이 기능은 비활성화됩니다.</li>
            <li className={listItemClass}>"AI 장면 생성" 패널의 텍스트 영역에 원하는 장면을 자연어로 설명합니다 (예: "커다란 파란색 공 위에 작은 빨간색 상자를 쌓고, 그 옆에는 초록색 원통을 비스듬히 세워주세요").</li>
            <li className={listItemClass}>"AI로 장면 생성" 버튼을 클릭하면 AI가 프롬프트를 기반으로 객체와 설정을 생성합니다.</li>
          </ul>

          <h4 className={subSectionTitleClass}>장면 라이브러리</h4>
           <ul className="list-none mb-3">
            <li className={listItemClass}>왼쪽 패널의 "장면 라이브러리" 버튼을 클릭하여 모달을 엽니다.</li>
            <li className={listItemClass}>현재 작업 중인 장면을 새로운 이름으로 저장할 수 있습니다.</li>
            <li className={listItemClass}>저장된 장면을 불러오거나, 이름을 변경하거나, 덮어쓰거나, 삭제할 수 있습니다.</li>
            <li className={listItemClass}>"라이브러리 내보내기"로 모든 저장된 장면을 JSON 파일로 다운로드하고, "라이브러리 가져오기"로 JSON 파일을 통해 장면들을 가져올 수 있습니다.</li>
            <li className={listItemClass}>앱 최초 실행 시 <code className={codeClass}>public/physics_lab_scenes.json</code> 파일이 있다면 기본 라이브러리로 자동 로드됩니다.</li>
          </ul>

          <h4 className={subSectionTitleClass}>실행 취소 / 복구</h4>
           <ul className="list-none mb-3">
            <li className={listItemClass}>왼쪽 패널 하단의 "취소" (<code className={codeClass}>Ctrl+Z</code>) 및 "복구" (<code className={codeClass}>Ctrl+Y</code>) 버튼으로 대부분의 편집 작업을 되돌리거나 다시 실행할 수 있습니다.</li>
          </ul>

          <h3 className={sectionTitleClass}>단축키</h3>
          <ul className="list-none mb-3">
            <li className={listItemClass}><code className={codeClass}>T</code>: 선택된 객체의 이동(Translate) Gizmo 활성화/비활성화.</li>
            <li className={listItemClass}><code className={codeClass}>R</code>: 선택된 객체의 회전(Rotate) Gizmo 활성화/비활성화.</li>
            <li className={listItemClass}><code className={codeClass}>Esc</code>: 활성화된 Gizmo 비활성화 또는 선택된 객체 해제.</li>
            <li className={listItemClass}><code className={codeClass}>Ctrl + Z</code>: 실행 취소.</li>
            <li className={listItemClass}><code className={codeClass}>Ctrl + Y</code>: 다시 실행.</li>
          </ul>

           <h3 className={sectionTitleClass}>팁</h3>
           <ul className="list-none mb-3">
            <li className={listItemClass}>AI 장면 생성 시, 프롬프트를 구체적으로 작성할수록 원하는 결과를 얻을 확률이 높아집니다. (예: 객체의 색상, 크기, 상대적 위치, 초기 움직임 등)</li>
            <li className={listItemClass}>복잡한 시뮬레이션에서는 객체 수를 적절히 조절하여 성능을 유지하세요.</li>
            <li className={listItemClass}>"전역 설정"에서 중력의 방향이나 크기, 시뮬레이션 속도를 변경하여 다양한 환경을 실험해볼 수 있습니다.</li>
          </ul>

        </div>
        <div className="mt-6 flex-shrink-0 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
