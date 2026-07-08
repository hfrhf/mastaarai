export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  model: string;
  status: 'searching' | 'thinking' | 'streaming' | 'done' | 'error';
  tokens?: number;
  duration?: number; // Latency in seconds
  regeneratedFrom?: string | null;
  edited?: boolean;
  searchQuery?: string;
  searchResults?: { title: string; url: string }[];
}

export interface Chat {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
  modelId: string;
  temperature: number;
  maxTokens: number;
  systemPrompt?: string;
  webSearchEnabled?: boolean;
}

export interface ModelConfig {
  id: string;
  provider: 'dahl' | 'openai' | 'custom';
  name: string;
  supportsStreaming: boolean;
  supportsVision: boolean;
}

export interface ChatSettings {
  theme: 'dark' | 'light';
  language: 'en' | 'ar';
  developerMode: boolean;
  defaultModelId: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultSystemPrompt: string;
}
