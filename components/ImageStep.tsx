import React from 'react';
import { Step } from './Step.tsx';
import { CharacterContent } from '../types.ts';
import { SparklesIcon, DownloadIcon, LoaderIcon } from './icons.tsx';

interface ImageStepProps {
  imagePrompt: CharacterContent;
  imageUrl: string | null;
  isGenerating: boolean;
  generationStatusText: string;
  onGenerate: () => void;
}

export const ImageStep: React.FC<ImageStepProps> = ({ imagePrompt, imageUrl, isGenerating, generationStatusText, onGenerate }) => {
  const isDirty = imagePrompt.lastModified > imagePrompt.lastGenerated && !!imageUrl;

  return (
    <Step title="Character Image" stepNumber={5} isDirty={isDirty}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
        <p className="text-gray-400 text-sm">
          Visualize your character. A generated image will appear below.
        </p>
        <div className="flex items-center gap-2">
           <a
            href={imageUrl || '#'}
            download="character_image.jpg"
            className={`flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-md transition-colors ${
              !imageUrl ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500'
            }`}
            onClick={(e) => !imageUrl && e.preventDefault()}
          >
            <DownloadIcon />
            <span>Save Image</span>
          </a>
          <button
            onClick={onGenerate}
            disabled={isGenerating || !imagePrompt.value}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500"
          >
            {isGenerating ? <LoaderIcon /> : <SparklesIcon />}
            <span>{imageUrl ? 'Regenerate' : 'Generate'} Image</span>
          </button>
        </div>
      </div>
      <div className="w-full aspect-square bg-gray-900 rounded-md flex items-center justify-center border border-gray-600">
        {isGenerating ? (
          <div className="text-center">
            <LoaderIcon />
            <p className="mt-2 text-gray-400">{generationStatusText}</p>
          </div>
        ) : imageUrl ? (
          <img src={imageUrl} alt="Generated Character" className="object-contain w-full h-full rounded-md" />
        ) : (
          <p className="text-gray-500">Image will appear here</p>
        )}
      </div>
    </Step>
  );
};