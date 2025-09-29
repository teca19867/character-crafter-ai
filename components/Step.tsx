
import React from 'react';

interface StepProps {
  title: string;
  stepNumber: number;
  isDirty?: boolean;
  children: React.ReactNode;
}

export const Step: React.FC<StepProps> = ({ title, stepNumber, isDirty = false, children }) => {
  const dirtyClass = isDirty ? 'border-yellow-500/50' : 'border-gray-700';

  return (
    <div className={`bg-gray-800/50 rounded-lg border ${dirtyClass} transition-colors duration-300`}>
      <div className="flex items-center p-4 border-b border-gray-700">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm mr-4 shrink-0">
          {stepNumber}
        </div>
        <h2 className="text-xl font-semibold text-gray-200">{title}</h2>
        {isDirty && (
          <span className="ml-auto text-xs font-medium bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full">
            Out of sync
          </span>
        )}
      </div>
      <div className="p-4 md:p-6">
        {children}
      </div>
    </div>
  );
};
