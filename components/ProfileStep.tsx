
import React from 'react';
import { Step } from './Step.tsx';
import { CharacterContent } from '../types.ts';
import { SparklesIcon, LoaderIcon } from './icons.tsx';

interface ProfileStepProps {
  idea: CharacterContent;
  profile: CharacterContent;
  isGenerating: boolean;
  onProfileChange: (value: string) => void;
  onGenerate: () => void;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({ idea, profile, isGenerating, onProfileChange, onGenerate }) => {
  const isDirty = idea.lastModified > profile.lastGenerated && profile.lastGenerated !== 0;

  return (
    <Step title="Character Profile" stepNumber={2} isDirty={isDirty}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
        <p className="text-gray-400 text-sm">
          Expand your idea into a full profile. Edit the result as you see fit.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !idea.value}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
        >
          {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
          <span>{profile.value ? 'Regenerate' : 'Generate'} Profile</span>
        </button>
      </div>
      <textarea
        value={profile.value}
        onChange={(e) => onProfileChange(e.target.value)}
        placeholder="Generate or write a character profile here..."
        className="w-full h-64 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500"
      />
    </Step>
  );
};