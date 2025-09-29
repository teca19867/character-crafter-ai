
import React from 'react';
import { Step } from './Step.tsx';
import { CharacterContent } from '../types.ts';
import { SparklesIcon, LoaderIcon } from './icons.tsx';

interface PromptStepProps {
  card: CharacterContent;
  imagePrompt: CharacterContent;
  isGenerating: boolean;
  onPromptChange: (value: string) => void;
  onGenerate: () => void;
}

export const PromptStep: React.FC<PromptStepProps> = ({ card, imagePrompt, isGenerating, onPromptChange, onGenerate }) => {
  const isDirty = card.lastModified > imagePrompt.lastGenerated && imagePrompt.lastGenerated !== 0;

  return (
    <Step title="Image Generation Prompt" stepNumber={4} isDirty={isDirty}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <p className="text-gray-400 text-sm">
          Translate the character card into a detailed prompt for the image AI.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !card.value}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
          <span>{imagePrompt.value ? 'Regenerate' : 'Generate'} Prompt</span>
        </button>
      </div>
      <textarea
        value={imagePrompt.value}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="Generate or write an image prompt here..."
        className="w-full h-40 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500"
      />
    </Step>
  );
};