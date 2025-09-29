
import React from 'react';
import { Step } from './Step.tsx';
import { CharacterContent } from '../types.ts';
import { SparklesIcon, LoaderIcon } from './icons.tsx';

interface CardStepProps {
  profile: CharacterContent;
  card: CharacterContent;
  isGenerating: boolean;
  onCardChange: (value: string) => void;
  onGenerate: () => void;
}

export const CardStep: React.FC<CardStepProps> = ({ profile, card, isGenerating, onCardChange, onGenerate }) => {
  const isDirty = profile.lastModified > card.lastGenerated && card.lastGenerated !== 0;

  return (
    <Step title="Character Card (W++ Format)" stepNumber={3} isDirty={isDirty}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <p className="text-gray-400 text-sm">
          Distill the profile into a structured, portable character card format.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !profile.value}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
          <span>{card.value ? 'Regenerate' : 'Generate'} Card</span>
        </button>
      </div>
      <textarea
        value={card.value}
        onChange={(e) => onCardChange(e.target.value)}
        placeholder="Generate or write a W++ character card here..."
        className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500 font-mono text-sm"
      />
    </Step>
  );
};