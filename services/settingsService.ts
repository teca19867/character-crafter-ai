import { Settings } from '../types.ts';

const SETTINGS_STORAGE_KEY = 'character-crafter-settings';
const SETTINGS_VERSION = '1.0.0';

interface StoredSettings {
  version: string;
  settings: Settings;
  lastSaved: number;
}

/**
 * 保存设置到 localStorage
 */
export const saveSettings = (settings: Settings): void => {
  try {
    const storedData: StoredSettings = {
      version: SETTINGS_VERSION,
      settings,
      lastSaved: Date.now()
    };
    
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(storedData));
    console.log('Settings saved successfully');
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings to local storage');
  }
};

/**
 * 从 localStorage 加载设置
 */
export const loadSettings = (): Settings | null => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) {
      return null;
    }

    const storedData: StoredSettings = JSON.parse(stored);
    
    // 检查版本兼容性
    if (storedData.version !== SETTINGS_VERSION) {
      console.warn('Settings version mismatch, using defaults');
      return null;
    }

    // 验证设置完整性
    if (!storedData.settings || typeof storedData.settings !== 'object') {
      console.warn('Invalid settings data, using defaults');
      return null;
    }

    console.log('Settings loaded successfully');
    return storedData.settings;
  } catch (error) {
    console.error('Failed to load settings:', error);
    return null;
  }
};

/**
 * 清除所有保存的设置
 */
export const clearSettings = (): void => {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
    console.log('Settings cleared successfully');
  } catch (error) {
    console.error('Failed to clear settings:', error);
    throw new Error('Failed to clear settings from local storage');
  }
};

/**
 * 检查是否有保存的设置
 */
export const hasStoredSettings = (): boolean => {
  return localStorage.getItem(SETTINGS_STORAGE_KEY) !== null;
};

/**
 * 获取设置的最后保存时间
 */
export const getSettingsLastSaved = (): number | null => {
  try {
    const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return null;
    
    const storedData: StoredSettings = JSON.parse(stored);
    return storedData.lastSaved;
  } catch (error) {
    console.error('Failed to get settings last saved time:', error);
    return null;
  }
};

/**
 * 导出设置为 JSON 字符串
 */
export const exportSettings = (settings: Settings): string => {
  const exportData = {
    version: SETTINGS_VERSION,
    settings,
    exportedAt: Date.now(),
    appName: 'Character Crafter AI'
  };
  
  return JSON.stringify(exportData, null, 2);
};

/**
 * 从 JSON 字符串导入设置
 */
export const importSettings = (jsonString: string): Settings => {
  try {
    const importData = JSON.parse(jsonString);
    
    // 验证导入数据格式
    if (!importData.settings || typeof importData.settings !== 'object') {
      throw new Error('Invalid settings format');
    }
    
    // 验证必要的设置字段
    const requiredFields = [
      'llmApiProvider', 'llmModel', 'llmApiUrl', 'llmApiKey',
      'imageApiProvider', 'imageModel', 'imageApiUrl', 'imageApiKey',
      'imageAspectRatio', 'profilePrompt', 'cardPrompt', 'promptPrompt',
      'bflSettings'
    ];
    
    for (const field of requiredFields) {
      if (!(field in importData.settings)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    console.log('Settings imported successfully');
    return importData.settings;
  } catch (error) {
    console.error('Failed to import settings:', error);
    throw new Error('Failed to import settings: Invalid format or corrupted data');
  }
};

/**
 * 验证设置的有效性
 */
export const validateSettings = (settings: Settings): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // 验证 API Provider 类型
  if (!['google', 'third-party'].includes(settings.llmApiProvider)) {
    errors.push('Invalid LLM API provider');
  }
  
  if (!['google', 'third-party'].includes(settings.imageApiProvider)) {
    errors.push('Invalid Image API provider');
  }
  
  // 验证第三方 API 配置
  if (settings.llmApiProvider === 'third-party') {
    if (!settings.llmApiUrl.trim()) {
      errors.push('LLM API URL is required for third-party provider');
    }
    if (!settings.llmApiKey.trim()) {
      errors.push('LLM API Key is required for third-party provider');
    }
  }
  
  if (settings.imageApiProvider === 'third-party') {
    if (!settings.imageApiKey.trim()) {
      errors.push('BFL API Key is required for third-party provider');
    }
  }
  
  // 验证 aspect ratio
  const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  if (!validAspectRatios.includes(settings.imageAspectRatio)) {
    errors.push('Invalid aspect ratio');
  }
  
  // 验证 BFL 设置
  if (settings.bflSettings) {
    const validBFLModels = ['flux-pro-1.1-ultra', 'flux-pro-1.1', 'flux-pro', 'flux-dev'];
    if (!validBFLModels.includes(settings.bflSettings.model)) {
      errors.push('Invalid BFL model');
    }
    
    if (typeof settings.bflSettings.promptUpsampling !== 'boolean') {
      errors.push('BFL prompt upsampling must be a boolean');
    }
    
    if (typeof settings.bflSettings.safetyTolerance !== 'number' || 
        settings.bflSettings.safetyTolerance < 1 || 
        settings.bflSettings.safetyTolerance > 6) {
      errors.push('BFL safety tolerance must be a number between 1 and 6');
    }
  } else {
    errors.push('BFL settings are required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
