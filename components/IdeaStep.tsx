
import React from 'react';
import { Step } from './Step.tsx';
import { CharacterContent } from '../types.ts';

interface IdeaStepProps {
  idea: CharacterContent;
  onIdeaChange: (value: string) => void;
}

export const IdeaStep: React.FC<IdeaStepProps> = ({ idea, onIdeaChange }) => {
  return (
    <Step title="Character Idea" stepNumber={1}>
      <p className="text-gray-400 mb-4 text-sm">
        Start here. Write down your core concept, a simple phrase, or a detailed paragraph. This idea will fuel all subsequent generation steps.
      </p>
      <textarea
        value={idea.value}
        onChange={(e) => onIdeaChange(e.target.value)}
        placeholder="e.g., A stoic space marine who secretly writes poetry, haunted by a past failure..."
        className="w-full h-32 p-3 bg-gray-900 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500"
      />
    </Step>
  );
};