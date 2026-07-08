import { Chat, ChatSettings } from '../../types/chat';

export interface Memory {
  id: string;
  content: string;
  createdAt: string;
}

export interface IStorageAdapter {
  getChats(): Promise<Chat[]>;
  saveChat(chat: Chat): Promise<void>;
  deleteChat(id: string): Promise<void>;
  getSettings(): Promise<ChatSettings>;
  saveSettings(settings: ChatSettings): Promise<void>;
  getMemories(): Promise<Memory[]>;
  saveMemory(content: string): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;
}
