import React, { useState, useEffect, useRef } from 'react';
import { Settings, ApiProvider, AspectRatio, BFLModel } from '../types.ts';
import { fetchModelsOpenAI } from '../services/thirdPartyService.ts';
import * as settingsService from '../services/settingsService.ts';
import { LoaderIcon, CheckCircleIcon, AlertTriangleIcon } from './icons.tsx';
import { BFL_MODELS } from '../constants.ts';


interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onSave: (newSettings: Settings) => void;
  onReset: () => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string; disabled?: boolean; }> = ({ label, value, onChange, type = 'text', placeholder, disabled = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 placeholder-gray-500 disabled:opacity-50"
    />
  </div>
);

const SelectField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; disabled?: boolean; }> = ({ label, value, onChange, children, disabled = false }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200"
      >
        {children}
      </select>
    </div>
);

const TextAreaField: React.FC<{ label: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number; }> = ({ label, value, onChange, rows = 5 }) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-1">{label}</label>
      <textarea
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full p-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-gray-200 font-mono text-sm"
      />
    </div>
);

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, settings, onSave, onReset }) => {
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [showImportExport, setShowImportExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
    setHasUnsavedChanges(false);
    // Reset test state when panel is opened or settings change from outside
    setTestStatus('idle');
    setAvailableModels([]);
  }, [settings, isOpen]);
  
  // Reset test status if credentials change
  useEffect(() => {
      setTestStatus('idle');
      setAvailableModels([]);
  }, [localSettings.llmApiUrl, localSettings.llmApiKey]);


  const handleChange = (field: keyof Settings, value: string) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleProviderChange = (apiType: 'llm' | 'image', provider: ApiProvider) => {
    setLocalSettings(prev => ({
        ...prev,
        [`${apiType}ApiProvider`]: provider,
    }));
    setHasUnsavedChanges(true);
  };

  const handleBFLSettingChange = (field: keyof Settings['bflSettings'], value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      bflSettings: {
        ...prev.bflSettings,
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  };
  
  const handleTestConnection = async () => {
      setTestStatus('testing');
      setTestError(null);
      setAvailableModels([]);
      try {
          const models = await fetchModelsOpenAI(localSettings.llmApiUrl, localSettings.llmApiKey);
          if (models.length > 0) {
              setAvailableModels(models);
              setTestStatus('success');
              // If current model is not in the list, select the first one
              if (!models.includes(localSettings.llmModel)) {
                  handleChange('llmModel', models[0]);
              }
          } else {
              setTestStatus('error');
              setTestError('Connection successful, but no models found.');
          }
      } catch (error: any) {
          setTestStatus('error');
          setTestError(error.message);
      }
  };

  const handleTestBFLConnection = async () => {
      setTestStatus('testing');
      setTestError(null);
      try {
          const response = await fetch('http://localhost:3001/test-bfl', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
              },
              body: JSON.stringify({ apiKey: localSettings.imageApiKey }),
          });
          
          const result = await response.json();
          
          if (result.success) {
              setTestStatus('success');
              setTestError(null);
          } else {
              setTestStatus('error');
              setTestError(result.error || result.message || 'BFL API test failed');
          }
      } catch (error: any) {
          setTestStatus('error');
          setTestError(`BFL API test failed: ${error.message}`);
      }
  };

  const handleSave = () => {
    // 验证设置
    const validation = settingsService.validateSettings(localSettings);
    if (!validation.isValid) {
      setTestError(`Settings validation failed: ${validation.errors.join(', ')}`);
      return;
    }
    
    onSave(localSettings);
    onClose();
  };

  const handleExport = () => {
    try {
      const exportData = settingsService.exportSettings(localSettings);
      const blob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'character-crafter-settings.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setTestError('Failed to export settings');
    }
  };

  const handleImport = () => {
    try {
      setImportError(null);
      const importedSettings = settingsService.importSettings(importText);
      setLocalSettings(importedSettings);
      setImportText('');
      setShowImportExport(false);
    } catch (error: any) {
      setImportError(error.message);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Invalid file content");
        const importedSettings = settingsService.importSettings(text);
        setLocalSettings(importedSettings);
        setShowImportExport(false);
      } catch (error: any) {
        setImportError(error.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      onReset();
      onClose();
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };
  
  const aspectRatios: AspectRatio[] = ["1:1", "16:9", "9:16", "4:3", "3:4"];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="fixed top-0 right-0 h-full w-full max-w-lg bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col h-full">
            <header className="flex items-center justify-between p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Settings</h2>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowImportExport(!showImportExport)}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 rounded transition-colors"
                  >
                    {showImportExport ? 'Hide' : 'Import/Export'}
                  </button>
                  <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors text-2xl leading-none">&times;</button>
                </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto space-y-6">
                <section className="space-y-4 p-4 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-300">Text Generation (LLM)</h3>
                    <SelectField label="API Provider" value={localSettings.llmApiProvider} onChange={(e) => handleProviderChange('llm', e.target.value as ApiProvider)}>
                        <option value="google">Google Gemini</option>
                        <option value="third-party">Third-Party (OpenAI-compatible)</option>
                    </SelectField>
                    {localSettings.llmApiProvider === 'google' ? (
                        <InputField label="Model" value={localSettings.llmModel} onChange={(e) => handleChange('llmModel', e.target.value)} placeholder="e.g., gemini-2.5-flash" />
                    ) : (
                        <div className="space-y-4">
                            <InputField label="API URL" value={localSettings.llmApiUrl} onChange={(e) => handleChange('llmApiUrl', e.target.value)} placeholder="e.g., https://api.openai.com/v1" />
                            <div>
                                <InputField label="API Key" value={localSettings.llmApiKey} onChange={(e) => handleChange('llmApiKey', e.target.value)} type="password" />
                                <button
                                    onClick={handleTestConnection}
                                    disabled={!localSettings.llmApiUrl || !localSettings.llmApiKey || testStatus === 'testing'}
                                    className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {testStatus === 'testing' ? <LoaderIcon/> : null}
                                    Test Connection
                                </button>
                                {testStatus === 'success' && <div className="mt-2 text-sm flex items-center gap-2 text-green-400"><CheckCircleIcon /> Connection successful. Models loaded.</div>}
                                {testStatus === 'error' && <div className="mt-2 text-sm flex items-center gap-2 text-red-400"><AlertTriangleIcon /> {testError}</div>}
                            </div>
                           
                            {availableModels.length > 0 ? (
                                <SelectField label="Model Name" value={localSettings.llmModel} onChange={(e) => handleChange('llmModel', e.target.value)}>
                                    {availableModels.map(model => <option key={model} value={model}>{model}</option>)}
                                </SelectField>
                            ) : (
                                <InputField label="Model Name" value={localSettings.llmModel} onChange={(e) => handleChange('llmModel', e.target.value)} placeholder="e.g., gpt-4" disabled={testStatus === 'success'} />
                            )}
                        </div>
                    )}
                </section>

                <section className="space-y-4 p-4 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-300">Image Generation</h3>
                    <SelectField label="API Provider" value={localSettings.imageApiProvider} onChange={(e) => handleProviderChange('image', e.target.value as ApiProvider)}>
                        <option value="google">Google Gemini (Imagen)</option>
                        <option value="third-party">Black Forest Labs (BFL)</option>
                    </SelectField>
                    {localSettings.imageApiProvider === 'google' ? (
                         <InputField label="Model" value={localSettings.imageModel} onChange={(e) => handleChange('imageModel', e.target.value)} placeholder="e.g., imagen-4.0-generate-001" />
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <InputField label="BFL API Key" value={localSettings.imageApiKey} onChange={(e) => handleChange('imageApiKey', e.target.value)} type="password" placeholder="Enter your BFL API key" />
                                <button
                                    onClick={handleTestBFLConnection}
                                    disabled={!localSettings.imageApiKey || testStatus === 'testing'}
                                    className="mt-2 flex items-center justify-center gap-2 w-full px-4 py-2 text-sm bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-500 disabled:bg-gray-500/50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {testStatus === 'testing' ? <LoaderIcon/> : null}
                                    Test BFL Connection
                                </button>
                                {testStatus === 'success' && <div className="mt-2 text-sm flex items-center gap-2 text-green-400"><CheckCircleIcon /> BFL connection successful.</div>}
                                {testStatus === 'error' && <div className="mt-2 text-sm flex items-center gap-2 text-red-400"><AlertTriangleIcon /> {testError}</div>}
                            </div>
                            
                            <SelectField label="BFL Model" value={localSettings.bflSettings.model} onChange={(e) => handleBFLSettingChange('model', e.target.value as BFLModel)}>
                                {BFL_MODELS.map(model => (
                                    <option key={model} value={model}>
                                        {model === 'flux-pro-1.1-ultra' ? 'FLUX Pro 1.1 Ultra (Highest Quality)' :
                                         model === 'flux-pro-1.1' ? 'FLUX Pro 1.1 (Professional)' :
                                         model === 'flux-pro' ? 'FLUX Pro (Standard)' :
                                         'FLUX Dev (Development)'}
                                    </option>
                                ))}
                            </SelectField>

                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input
                                        type="checkbox"
                                        checked={localSettings.bflSettings.promptUpsampling}
                                        onChange={(e) => handleBFLSettingChange('promptUpsampling', e.target.checked)}
                                        className="rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>Prompt Upsampling</span>
                                </label>
                                <p className="text-xs text-gray-400 ml-6">
                                    Automatically modifies the prompt for more creative generation (not available for Ultra models)
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300">
                                    Safety Tolerance: {localSettings.bflSettings.safetyTolerance}
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="6"
                                    value={localSettings.bflSettings.safetyTolerance}
                                    onChange={(e) => handleBFLSettingChange('safetyTolerance', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                />
                                <div className="flex justify-between text-xs text-gray-400">
                                    <span>Strict (1)</span>
                                    <span>Least Strict (6)</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <SelectField label="Image Aspect Ratio" value={localSettings.imageAspectRatio} onChange={(e) => handleChange('imageAspectRatio', e.target.value as AspectRatio)}>
                        {aspectRatios.map(ratio => <option key={ratio} value={ratio}>{ratio}</option>)}
                    </SelectField>
                </section>
                
                <section className="space-y-4 p-4 border border-gray-700 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-300">System Prompts</h3>
                    <TextAreaField label="Character Profile Prompt" value={localSettings.profilePrompt} onChange={(e) => handleChange('profilePrompt', e.target.value)} />
                    <TextAreaField label="Character Card Prompt" value={localSettings.cardPrompt} onChange={(e) => handleChange('cardPrompt', e.target.value)} />
                    <TextAreaField label="Image Generation Prompt" value={localSettings.promptPrompt} onChange={(e) => handleChange('promptPrompt', e.target.value)} />
                </section>

            </main>

            {showImportExport && (
              <div className="p-4 border-t border-gray-700 bg-gray-900/50">
                <h4 className="text-md font-semibold text-white mb-3">Import/Export Settings</h4>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button 
                      onClick={handleExport}
                      className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                    >
                      Export Settings
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImportFile}
                      accept=".json"
                      className="hidden"
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                    >
                      Import from File
                    </button>
                  </div>
                  <div>
                    <textarea
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      placeholder="Paste settings JSON here..."
                      className="w-full h-20 p-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-200 placeholder-gray-500"
                    />
                    {importError && (
                      <p className="text-red-400 text-xs mt-1">{importError}</p>
                    )}
                    <button 
                      onClick={handleImport}
                      disabled={!importText.trim()}
                      className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
                    >
                      Import from Text
                    </button>
                  </div>
                </div>
              </div>
            )}

            <footer className="p-4 border-t border-gray-700 flex justify-between items-center">
                <button 
                  onClick={handleReset}
                  className="px-4 py-2 text-red-400 hover:text-red-300 transition-colors"
                >
                  Reset to Defaults
                </button>
                <div className="flex gap-3">
                  <button onClick={handleClose} className="px-4 py-2 text-gray-300 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className={`px-4 py-2 text-white font-semibold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${
                      hasUnsavedChanges 
                        ? 'bg-orange-600 hover:bg-orange-500' 
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {hasUnsavedChanges ? 'Save & Close*' : 'Save & Close'}
                  </button>
                </div>
            </footer>
        </div>
      </div>
    </div>
  );
};