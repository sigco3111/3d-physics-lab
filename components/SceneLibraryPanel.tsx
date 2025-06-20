import React, { useState, ChangeEvent, useEffect, useRef } from 'react';
import { SavedScene } from '../types';
import SaveIcon from './icons/SaveIcon';
import DownloadIcon from './icons/DownloadIcon'; // New Icon
import UploadIcon from './icons/UploadIcon';   // New Icon

interface SceneLibraryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedScenes: SavedScene[];
  onSaveCurrentScene: (name: string) => void;
  onLoadScene: (sceneId: string) => void;
  onDeleteScene: (sceneId: string) => void;
  onRenameScene: (sceneId: string, newName: string) => void;
  onOverwriteScene: (sceneId: string) => void;
  onImportScenes: (importedScenes: SavedScene[]) => void; // New prop
}

const SceneLibraryPanel: React.FC<SceneLibraryPanelProps> = ({
  isOpen,
  onClose,
  savedScenes,
  onSaveCurrentScene,
  onLoadScene,
  onDeleteScene,
  onRenameScene,
  onOverwriteScene,
  onImportScenes,
}) => {
  const [newSceneName, setNewSceneName] = useState<string>('');
  const [renamingSceneId, setRenamingSceneId] = useState<string | null>(null);
  const [renameInputValue, setRenameInputValue] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      setNewSceneName('');
      setRenamingSceneId(null);
      setRenameInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSaveClick = () => {
    if (newSceneName.trim()) {
      onSaveCurrentScene(newSceneName.trim());
      setNewSceneName('');
    } else {
      alert('저장할 장면의 이름을 입력해주세요.');
    }
  };

  const handleRenameStart = (scene: SavedScene) => {
    setRenamingSceneId(scene.id);
    setRenameInputValue(scene.name);
  };

  const handleRenameConfirm = () => {
    if (renamingSceneId && renameInputValue.trim()) {
      onRenameScene(renamingSceneId, renameInputValue.trim());
      setRenamingSceneId(null);
      setRenameInputValue('');
    } else {
      alert('새로운 장면 이름을 입력해주세요.');
    }
  };

  const handleExportScenes = () => {
    if (savedScenes.length === 0) {
      alert("내보낼 장면이 없습니다.");
      return;
    }
    const jsonString = JSON.stringify(savedScenes, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'physics_lab_scenes.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert(`${savedScenes.length}개 장면을 내보냈습니다.`);
  };

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const imported = JSON.parse(text);
        if (Array.isArray(imported)) {
          // Basic validation for SavedScene structure can be added here if needed
          // For now, assume the structure is correct if it's an array.
          // App.tsx will do more thorough validation and ID generation.
          onImportScenes(imported as SavedScene[]);
        } else {
          alert("가져오기 실패: 파일 내용이 장면 배열이 아닙니다.");
        }
      } catch (error) {
        console.error("Error importing scenes:", error);
        alert(`가져오기 실패: 파일을 읽거나 분석하는 중 오류가 발생했습니다. (오류: ${error instanceof Error ? error.message : String(error)})`);
      } finally {
        // Reset file input value so the same file can be selected again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        alert("파일을 읽는 중 오류가 발생했습니다.");
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
    reader.readAsText(file);
  };
  
  const commonButtonClass = "px-2 py-1 text-xs rounded-md transition-colors duration-150";
  const inputClass = "block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100";
  const actionButtonClass = "flex-1 px-3 py-2 text-sm rounded-md transition-colors duration-150 flex items-center justify-center space-x-1.5";


  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="scene-library-modal-title"
    >
      <div 
        className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h2 id="scene-library-modal-title" className="text-xl font-semibold text-gray-100">장면 라이브러리</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
            aria-label="라이브러리 닫기"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 flex-shrink-0">
          <label htmlFor="modalNewSceneName" className="block text-sm font-medium text-gray-300 mb-1">
            새 장면 이름
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              id="modalNewSceneName"
              value={newSceneName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setNewSceneName(e.target.value)}
              className={`${inputClass} flex-grow`}
              placeholder="예: 나의 첫 실험"
            />
            <button
              onClick={handleSaveClick}
              className={`${commonButtonClass} bg-green-500 hover:bg-green-600 text-white flex items-center space-x-1`}
              title="현재 장면 저장"
            >
              <SaveIcon className="w-4 h-4" />
              <span>저장</span>
            </button>
          </div>
        </div>
        
        <div className="flex space-x-2 mb-4 flex-shrink-0">
          <button
            onClick={handleExportScenes}
            className={`${actionButtonClass} bg-cyan-600 hover:bg-cyan-700 text-white`}
          >
            <DownloadIcon className="w-4 h-4" />
            <span>라이브러리 내보내기</span>
          </button>
          <label 
            htmlFor="import-scenes-input"
            className={`${actionButtonClass} bg-purple-600 hover:bg-purple-700 text-white cursor-pointer`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
          >
            <UploadIcon className="w-4 h-4" />
            <span>라이브러리 가져오기</span>
          </label>
          <input
            type="file"
            id="import-scenes-input"
            accept=".json"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImportFileChange}
          />
        </div>


        <h5 className="text-sm font-semibold mb-2 text-gray-300 border-t border-gray-700 pt-3 flex-shrink-0">
          저장된 장면 ({savedScenes.length})
        </h5>
        {savedScenes.length === 0 ? (
          <p className="text-sm text-gray-400 flex-shrink-0">저장된 장면이 없습니다.</p>
        ) : (
          <ul className="space-y-2 flex-grow overflow-y-auto properties-editor-scrollbar pr-1">
            {savedScenes.map((scene) => (
              <li key={scene.id} className="p-3 bg-gray-700 rounded-md shadow">
                {renamingSceneId === scene.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={renameInputValue}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setRenameInputValue(e.target.value)}
                      className={inputClass}
                      aria-label={`'${scene.name}' 장면 새 이름`}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleRenameConfirm}
                        className={`${commonButtonClass} bg-sky-500 hover:bg-sky-600 text-white`}
                      >
                        이름 저장
                      </button>
                      <button
                        onClick={() => setRenamingSceneId(null)}
                        className={`${commonButtonClass} bg-gray-500 hover:bg-gray-400 text-white`}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-md font-medium text-sky-400">{scene.name}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(scene.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 mb-2">
                      객체: {scene.objects.length}, 제약: {scene.constraints.length}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => { onLoadScene(scene.id); onClose(); }}
                        className={`${commonButtonClass} bg-blue-500 hover:bg-blue-600 text-white col-span-2`}
                      >
                        불러오기
                      </button>
                      <button
                        onClick={() => handleRenameStart(scene)}
                        className={`${commonButtonClass} bg-yellow-500 hover:bg-yellow-600 text-black`}
                      >
                        이름변경
                      </button>
                       <button
                        onClick={() => {
                          onOverwriteScene(scene.id);
                        }}
                        className={`${commonButtonClass} bg-orange-500 hover:bg-orange-600 text-white`}
                      >
                        덮어쓰기
                      </button>
                      <button
                        onClick={() => {
                          onDeleteScene(scene.id);
                        }}
                        className={`${commonButtonClass} bg-red-600 hover:bg-red-700 text-white col-span-2`}
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SceneLibraryPanel;