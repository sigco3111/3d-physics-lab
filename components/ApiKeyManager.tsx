
import React from 'react';
import { GeminiApiKeyStatus } from '../App'; // Assuming App.tsx exports this type
import SaveIcon from './icons/SaveIcon';

interface ApiKeyManagerProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onSaveApiKey: () => void;
  status: GeminiApiKeyStatus;
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({
  apiKey,
  onApiKeyChange,
  onSaveApiKey,
  status,
}) => {
  let statusText = 'API 키 상태 확인 중...';
  let statusColor = 'bg-gray-400'; // Default/Loading

  switch (status) {
    case 'READY_USER':
      statusText = 'Gemini API: 사용자 키 사용 중';
      statusColor = 'bg-green-500';
      break;
    case 'READY_SYSTEM':
      statusText = 'Gemini API: 시스템 키 사용 중';
      statusColor = 'bg-sky-500';
      break;
    case 'NOT_CONFIGURED':
      statusText = 'Gemini API: 설정 필요';
      statusColor = 'bg-yellow-500';
      break;
    default: // LOADING
      statusText = 'Gemini API: 상태 확인 중...';
      statusColor = 'bg-gray-400';
      break;
  }

  return (
    <div className="p-4 bg-gray-800 border-b border-gray-700">
      <h3 className="text-md font-semibold text-gray-100 mb-2">Gemini API 키 관리</h3>
      <div className="space-y-2">
        <div>
          <label htmlFor="apiKeyInput" className="block text-sm font-medium text-gray-300 mb-1">
            API 키 입력 (저장 시 기존 키 덮어씀, 빈 값 저장 시 사용자 키 삭제)
          </label>
          <div className="flex space-x-2">
            <input
              type="password" // Use password type to obscure the key
              id="apiKeyInput"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              className="flex-grow px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100"
              placeholder="API 키를 여기에 입력하세요"
            />
            <button
              onClick={onSaveApiKey}
              className="p-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors duration-150 ease-in-out shadow-md flex items-center space-x-1"
              title="API 키 저장 또는 사용자 키 삭제"
            >
              <SaveIcon className="w-4 h-4" />
              <span className="text-xs">저장</span>
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2 pt-1">
          <span className={`w-3 h-3 rounded-full ${statusColor}`}></span>
          <p className="text-xs text-gray-300">{statusText}</p>
        </div>
        {status === 'NOT_CONFIGURED' && (
            <p className="text-xs text-yellow-300">AI 장면 생성 기능을 사용하려면 API 키를 입력하고 저장해주세요.</p>
        )}
      </div>
    </div>
  );
};

export default ApiKeyManager;
