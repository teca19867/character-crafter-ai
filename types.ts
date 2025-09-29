export interface CharacterContent {
  value: string;
  lastModified: number;
  lastGenerated: number;
}

export interface CharacterData {
  idea: CharacterContent;
  profile: CharacterContent;
  card: CharacterContent;
  imagePrompt: CharacterContent;
  generatedImageUrl: string | null;
  generatedImageData: string | null;
}

export interface UiState {
  isGenerating: {
    profile: boolean;
    card: boolean;
    prompt: boolean;
    image: boolean;
  };
  notifications: Notification[];
  isSettingsOpen: boolean;
}

export interface AsyncState {
  imageGeneration: {
    status: 'idle' | 'generating' | 'polling' | 'error' | 'success';
    pollingUrl: string | null; // For BFL, this will be the task ID
    pollingAttempts: number;
  }
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export type AspectRatio = "1:1" | "16:9" | "9:16" | "4:3" | "3:4";

export type ApiProvider = 'google' | 'third-party';

// BFL模型类型
export type BFLModel = 'flux-pro-1.1-ultra' | 'flux-pro-1.1' | 'flux-pro' | 'flux-dev';

// BFL特定设置
export interface BFLSettings {
  model: BFLModel;
  promptUpsampling: boolean;
  safetyTolerance: number;
}

export interface Settings {
  llmApiProvider: ApiProvider;
  llmModel: string;
  llmApiUrl: string;
  llmApiKey: string;
  
  imageApiProvider: ApiProvider;
  imageModel: string;
  imageApiUrl: string;
  imageApiKey: string;

  imageAspectRatio: AspectRatio;
  profilePrompt: string;
  cardPrompt: string;
  promptPrompt: string;
  
  // BFL特定设置
  bflSettings: BFLSettings;
}

export interface SavedPreset extends Settings {
  name: string;
}

export interface ProjectFile {
  characterData: CharacterData;
  settings: Settings;
}

// BFL API响应类型
export interface BFLInitiateResponse {
  id: string;
}

export interface BFLPollResponse {
  status: 'Pending' | 'Ready' | 'Failed';
  result?: {
    sample: string;
  };
}
