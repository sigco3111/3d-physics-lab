
import React, { useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';

interface AIControlsProps {
  onGenerateScene: (prompt: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  disabled?: boolean; // New prop
}

const AIControls: React.FC<AIControlsProps> = ({ onGenerateScene, isLoading, error, disabled }) => {
  const [prompt, setPrompt] = useState<string>('');

  const handleSubmit = async () => {
    if (disabled) {
      alert('AI 기능을 사용하려면 먼저 Gemini API 키를 설정해야 합니다.');
      return;
    }
    if (!prompt.trim()) {
      alert('장면을 설명하는 프롬프트를 입력해주세요.');
      return;
    }
    await onGenerateScene(prompt.trim());
  };

  const title = disabled 
    ? "AI 기능을 사용하려면 API 키를 설정하세요." 
    : (isLoading ? "장면 생성 중..." : "AI로 장면 생성");

  return (
    <div className="p-4 bg-gray-800">
      <div className="space-y-3">
        <div>
          <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-300 mb-1">
            AI 장면 설명 프롬프트
          </label>
          <textarea
            id="aiPrompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="block w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm text-gray-100 disabled:opacity-70"
            placeholder="예: 빨간 공 위에 파란 상자가 놓여 있고, 경사면을 따라 굴러갑니다."
            disabled={isLoading || disabled}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isLoading || disabled}
          className="w-full p-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-150 ease-in-out shadow-md flex items-center justify-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
          title={title}
        >
          <SparklesIcon className="w-5 h-5" />
          <span>{isLoading ? '생성 중...' : 'AI로 장면 생성'}</span>
        </button>
        {error && (
          <p className="text-sm text-red-400 mt-2">오류: {error}</p>
        )}
      </div>
    </div>
  );
};

export default AIControls;
