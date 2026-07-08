import { Chat, ChatSettings } from '../../types/chat';

export interface IStorageAdapter {
  getChats(): Promise<Chat[]>;
  saveChat(chat: Chat): Promise<void>;
  deleteChat(id: string): Promise<void>;
  getSettings(): Promise<ChatSettings>;
  saveSettings(settings: ChatSettings): Promise<void>;
}
