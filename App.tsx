import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  CharacterData,
  UiState,
  Settings,
  Notification,
  ProjectFile,
  AsyncState,
} from './types.ts';
import {
  DEFAULT_SETTINGS,
  INITIAL_CHARACTER_DATA,
  INITIAL_UI_STATE,
  INITIAL_ASYNC_STATE,
} from './constants.ts';
import * as geminiService from './services/geminiService.ts';
import * as thirdPartyService from './services/thirdPartyService.ts';
import * as settingsService from './services/settingsService.ts';

import { IdeaStep } from './components/IdeaStep.tsx';
import { ProfileStep } from './components/ProfileStep.tsx';
import { CardStep } from './components/CardStep.tsx';
import { PromptStep } from './components/PromptStep.tsx';
import { ImageStep } from './components/ImageStep.tsx';
import { SettingsPanel } from './components/SettingsPanel.tsx';
import { NotificationCenter } from './components/NotificationCenter.tsx';
import { SettingsIcon, SaveIcon, UploadIcon, PowerIcon } from './components/icons.tsx';

const POLLING_INTERVAL = 2500; // 2.5 seconds (matching BFL reference)
const MAX_POLLING_ATTEMPTS = 100; // 100 attempts (matching BFL reference)

// Security Warning: This app handles API keys, please ensure not to commit configurations containing real keys to version control
// BFL debug logging switch
const BFL_DEBUG_LOGS = true; // Set to false to disable detailed logging

const App: React.FC = () => {
  const [characterData, setCharacterData] = useState<CharacterData>(INITIAL_CHARACTER_DATA);
  const [uiState, setUiState] = useState<UiState>(INITIAL_UI_STATE);
  const [asyncState, setAsyncState] = useState<AsyncState>(INITIAL_ASYNC_STATE);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingTimerRef = useRef<number | null>(null);

  // 加载保存的设置
  useEffect(() => {
    const loadStoredSettings = () => {
      try {
        const storedSettings = settingsService.loadSettings();
        if (storedSettings) {
          // 合并默认设置和保存的设置，确保新字段有默认值
          const mergedSettings = { 
            ...DEFAULT_SETTINGS, 
            ...storedSettings,
            // 确保BFL设置正确合并
            bflSettings: {
              ...DEFAULT_SETTINGS.bflSettings,
              ...(storedSettings.bflSettings || {})
            }
          };
          setSettings(mergedSettings);
          // 静默加载，不显示通知
        } else if (settingsService.hasStoredSettings()) {
          // 只有在有存储的设置但版本不匹配时才显示警告
          addNotification('Settings loaded with some defaults (version mismatch)', 'warning');
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        addNotification('Failed to load saved settings, using defaults', 'warning');
      }
    };

    loadStoredSettings();
  }, []);

  // 自动保存设置
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  useEffect(() => {
    // 跳过初始加载时的保存
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }

    try {
      settingsService.saveSettings(settings);
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
      addNotification('Failed to save settings automatically', 'error');
    }
  }, [settings, isInitialLoad]);

  const addNotification = useCallback((message: string, type: Notification['type']) => {
    const id = Date.now().toString();
    setUiState((prev) => ({
      ...prev,
      notifications: [...prev.notifications, { id, message, type }],
    }));
    setTimeout(() => {
      setUiState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id),
      }));
    }, 5000);
  }, []);
  
  const dismissNotification = (id: string) => {
    setUiState((prev) => ({
      ...prev,
      notifications: prev.notifications.filter((n) => n.id !== id),
    }));
  };

  const handleUpdateContent = (key: keyof Omit<CharacterData, 'generatedImageUrl' | 'generatedImageData'>, value: string) => {
      setCharacterData(prev => ({
          ...prev,
          [key]: { ...prev[key], value, lastModified: Date.now() }
      }));
  };
  
  const handleGenerate = async (
    field: keyof UiState['isGenerating'],
    input: string,
    systemPrompt: string,
    outputField: keyof Omit<CharacterData, 'generatedImageUrl' | 'generatedImageData'>
  ) => {
    setUiState(prev => ({...prev, isGenerating: {...prev.isGenerating, [field]: true}}));
    try {
      let result = '';
      if (settings.llmApiProvider === 'google') {
        result = await geminiService.generateText(settings.llmModel, systemPrompt, input);
      } else {
        result = await thirdPartyService.generateTextOpenAI(settings.llmApiUrl, settings.llmApiKey, settings.llmModel, systemPrompt, input);
      }
      setCharacterData(prev => ({
        ...prev,
        [outputField]: { value: result, lastModified: Date.now(), lastGenerated: Date.now() }
      }));
      addNotification(`${outputField.charAt(0).toUpperCase() + outputField.slice(1)} generated successfully.`, 'success');
    } catch (error: any) {
      addNotification(`Error generating ${outputField}: ${error.message}`, 'error');
    } finally {
      setUiState(prev => ({...prev, isGenerating: {...prev.isGenerating, [field]: false}}));
    }
  };

  const resetAsyncState = () => {
    if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
        pollingTimerRef.current = null;
    }
    setAsyncState(INITIAL_ASYNC_STATE);
    setUiState(prev => ({ ...prev, isGenerating: { ...prev.isGenerating, image: false } }));
  }

  // Effect for handling BFL polling
  useEffect(() => {
    if (asyncState.imageGeneration.status !== 'polling' || !asyncState.imageGeneration.pollingUrl) {
        return;
    }

    const poll = async () => {
        const currentAttempts = asyncState.imageGeneration.pollingAttempts;
        console.log(`🔄 [APP] 轮询尝试 ${currentAttempts + 1}/${MAX_POLLING_ATTEMPTS}`);
        
        if (currentAttempts >= MAX_POLLING_ATTEMPTS) {
            console.log('⏰ [APP] 轮询超时，停止轮询');
            addNotification('Image generation timed out.', 'error');
            resetAsyncState();
            return;
        }

        setAsyncState(prev => ({...prev, imageGeneration: {...prev.imageGeneration, pollingAttempts: prev.imageGeneration.pollingAttempts + 1}}));

        try {
            console.log('📡 [APP] 发送轮询请求...');
            const result = await thirdPartyService.pollImageBFL(asyncState.imageGeneration.pollingUrl!, settings.imageApiKey);
            console.log('📊 [APP] 轮询结果:', result.status);
            
            if (result.status === 'Ready') {
                console.log('✅ [APP] 图像生成完成，更新状态');
                setCharacterData(prev => ({
                    ...prev,
                    generatedImageUrl: result.result?.sample || '',
                    generatedImageData: null,
                    imagePrompt: { ...prev.imagePrompt, lastGenerated: Date.now() }
                }));
                addNotification('Image generated successfully.', 'success');
                resetAsyncState();
            } else if (result.status === 'Failed') {
                console.log('❌ [APP] 图像生成失败');
                addNotification('Image generation failed.', 'error');
                resetAsyncState();
            } else {
                console.log('⏳ [APP] 任务仍在进行中，继续轮询...');
            }
            // 如果状态是'Pending'，继续轮询（不执行任何操作）
        } catch (error: any) {
            console.error('💥 [APP] 轮询错误:', error);
            addNotification(`Polling error: ${error.message}`, 'error');
            resetAsyncState();
        }
    };
    
    pollingTimerRef.current = window.setInterval(poll, POLLING_INTERVAL);

    return () => {
        if (pollingTimerRef.current) {
            clearInterval(pollingTimerRef.current);
        }
    };
  }, [asyncState.imageGeneration.status, asyncState.imageGeneration.pollingUrl, asyncState.imageGeneration.pollingAttempts, settings.imageApiKey, addNotification]);

  const handleGenerateImage = async () => {
    setUiState(prev => ({ ...prev, isGenerating: { ...prev.isGenerating, image: true } }));
    setAsyncState(prev => ({ ...prev, imageGeneration: { ...prev.imageGeneration, status: 'generating' }}));
    
    if (settings.imageApiProvider === 'google') {
      try {
          const resultUrl = await geminiService.generateImage(settings.imageModel, characterData.imagePrompt.value, settings.imageAspectRatio);
          setCharacterData(prev => ({ ...prev, generatedImageUrl: resultUrl, generatedImageData: null, imagePrompt: { ...prev.imagePrompt, lastGenerated: Date.now() } }));
          addNotification('Image generated successfully.', 'success');
      } catch (error: any) {
          addNotification(`Error generating image: ${error.message}`, 'error');
      } finally {
          setUiState(prev => ({ ...prev, isGenerating: { ...prev.isGenerating, image: false } }));
          setAsyncState(INITIAL_ASYNC_STATE);
      }
    } else { // BFL flow
        console.log('🎨 [APP] 开始BFL图像生成流程');
        console.log('⚙️ [APP] BFL设置:', settings.bflSettings);
        console.log('🔑 [APP] API密钥状态:', settings.imageApiKey ? '已配置' : '未配置');
        
        try {
            const { id } = await thirdPartyService.initiateImageGenerationBFL(
                settings.imageApiKey,
                characterData.imagePrompt.value,
                settings.bflSettings.model,
                settings.imageAspectRatio,
                settings.bflSettings.promptUpsampling
            );
            console.log('✅ [APP] BFL初始化成功，任务ID:', id);
            setAsyncState({ imageGeneration: { status: 'polling', pollingUrl: id, pollingAttempts: 0 } });
            addNotification('Image generation started, now polling for result.', 'info');
        } catch (error: any) {
            console.error('❌ [APP] BFL初始化失败:', error);
            addNotification(`Error starting image generation: ${error.message}`, 'error');
            resetAsyncState();
        }
    }
  };

  const handleSaveProject = async () => {
    let dataToSave = { ...characterData };
    if (dataToSave.generatedImageUrl && !dataToSave.generatedImageUrl.startsWith('data:')) {
      try {
        const response = await fetch(dataToSave.generatedImageUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        dataToSave.generatedImageData = dataUrl;
      } catch (e) {
        addNotification('Could not save image data. Project file will link to URL.', 'warning');
      }
    } else if (dataToSave.generatedImageUrl?.startsWith('data:')) {
      dataToSave.generatedImageData = dataToSave.generatedImageUrl;
    }
    
    const projectFile: ProjectFile = { characterData: dataToSave, settings };
    const blob = new Blob([JSON.stringify(projectFile, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'character_project.json';
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Project saved!', 'success');
  };

  const handleLoadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Invalid file content");
        const project: ProjectFile = JSON.parse(text);
        
        if (!project.characterData || !project.settings) {
          throw new Error("Invalid project file structure");
        }
        
        const loadedData = project.characterData;
        if(loadedData.generatedImageData){
          loadedData.generatedImageUrl = loadedData.generatedImageData;
        }

        setCharacterData(loadedData);
        // Merge loaded settings with defaults to ensure compatibility with new versions
        setSettings(prev => ({
          ...DEFAULT_SETTINGS, 
          ...project.settings,
          // 确保BFL设置正确合并
          bflSettings: {
            ...DEFAULT_SETTINGS.bflSettings,
            ...(project.settings.bflSettings || {})
          }
        }));
        addNotification('Project loaded successfully!', 'success');
      } catch (err) {
        console.error("Failed to load project:", err);
        addNotification('Failed to load project file. It may be corrupted.', 'error');
      }
    };
    reader.readAsText(file);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  };

  const handleResetSettings = () => {
    try {
      settingsService.clearSettings();
      setSettings(DEFAULT_SETTINGS);
      addNotification('Settings reset to defaults', 'success');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      addNotification('Failed to reset settings', 'error');
    }
  };
  
  const isGeneratingImage = uiState.isGenerating.image || asyncState.imageGeneration.status === 'polling';
  const imageGenerationStatusText = asyncState.imageGeneration.status === 'polling' ? `Polling (${asyncState.imageGeneration.pollingAttempts})...` : 'Generating image...';

  // 在App组件中添加退出处理函数
  const handleExitApp = async () => {
    // 自动保存当前设置
    try {
      settingsService.saveSettings(settings);
      console.log('✅ 设置已自动保存');
    } catch (error) {
      console.error('❌ 保存设置失败:', error);
    }
    
    // 显示退出确认消息
    addNotification('应用正在退出，设置已保存...', 'info');
    
    // 延迟退出以便用户看到消息
    setTimeout(() => {
      // 如果是Electron环境，关闭窗口
      if (typeof window !== 'undefined' && (window as any).require) {
        try {
          const { ipcRenderer } = (window as any).require('electron');
          ipcRenderer.send('close-app');
        } catch (e) {
          console.log('非Electron环境，使用网页方式退出');
          // 网页环境下提示用户手动关闭
          alert('应用已准备退出。请手动关闭浏览器标签页。所有设置已自动保存。');
        }
      } else {
        // 网页环境下提示用户手动关闭
        alert('应用已准备退出。请手动关闭浏览器标签页。所有设置已自动保存。');
      }
    }, 1000);
  };

  return (
    <>
      <NotificationCenter notifications={uiState.notifications} onDismiss={dismissNotification} />
      <SettingsPanel 
        isOpen={uiState.isSettingsOpen} 
        onClose={() => setUiState(p => ({...p, isSettingsOpen: false}))} 
        settings={settings} 
        onSave={setSettings}
        onReset={handleResetSettings}
      />

      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <header className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white">Character Crafter AI</h1>
              <p className="text-indigo-300">An AI-assisted workflow for novelists.</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="file" ref={fileInputRef} onChange={handleLoadProject} accept=".json" style={{ display: 'none' }} />
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors"><UploadIcon /><span>Load</span></button>
              <button onClick={handleSaveProject} className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors"><SaveIcon /><span>Save</span></button>
              <button onClick={() => setUiState(p => ({...p, isSettingsOpen: true}))} className="flex items-center gap-2 p-2 bg-gray-700 hover:bg-gray-600 rounded-md font-semibold transition-colors"><SettingsIcon /><span>Settings</span></button>
              <button onClick={handleExitApp} className="flex items-center gap-2 p-2 bg-red-600 hover:bg-red-700 rounded-md font-semibold transition-colors"><PowerIcon /><span>Exit</span></button>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto grid gap-8">
            <IdeaStep idea={characterData.idea} onIdeaChange={(v) => handleUpdateContent('idea', v)} />
            
            <ProfileStep 
                idea={characterData.idea}
                profile={characterData.profile}
                isGenerating={uiState.isGenerating.profile}
                onProfileChange={(v) => handleUpdateContent('profile', v)}
                onGenerate={() => handleGenerate('profile', characterData.idea.value, settings.profilePrompt, 'profile')}
            />

            <CardStep
                profile={characterData.profile}
                card={characterData.card}
                isGenerating={uiState.isGenerating.card}
                onCardChange={(v) => handleUpdateContent('card', v)}
                onGenerate={() => handleGenerate('card', characterData.profile.value, settings.cardPrompt, 'card')}
            />

            <PromptStep
                card={characterData.card}
                imagePrompt={characterData.imagePrompt}
                isGenerating={uiState.isGenerating.prompt}
                onPromptChange={(v) => handleUpdateContent('imagePrompt', v)}
                onGenerate={() => handleGenerate('prompt', characterData.card.value, settings.promptPrompt, 'imagePrompt')}
            />

            <ImageStep
                imagePrompt={characterData.imagePrompt}
                imageUrl={characterData.generatedImageUrl}
                isGenerating={isGeneratingImage}
                generationStatusText={imageGenerationStatusText}
                onGenerate={handleGenerateImage}
            />
        </main>
      </div>
    </>
  );
};

export default App;