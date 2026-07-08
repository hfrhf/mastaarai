import { IStorageAdapter } from './types';
import { Chat, ChatSettings } from '../../types/chat';
import defaultSettings from '../../config/defaultSettings.json';

const CHATS_KEY = 'antigravity_chats';
const SETTINGS_KEY = 'antigravity_settings';

export class LocalStorageAdapter implements IStorageAdapter {
  private isBrowser(): boolean {
    return typeof window !== 'undefined';
  }

  async getChats(): Promise<Chat[]> {
    if (!this.isBrowser()) return [];
    try {
      const data = localStorage.getItem(CHATS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to get chats from localStorage', e);
      return [];
    }
  }

  async saveChat(chat: Chat): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      const chats = await this.getChats();
      const index = chats.findIndex((c) => c.id === chat.id);
      if (index >= 0) {
        chats[index] = chat;
      } else {
        chats.push(chat);
      }
      localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chat to localStorage', e);
    }
  }

  async deleteChat(id: string): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      const chats = await this.getChats();
      const filtered = chats.filter((c) => c.id !== id);
      localStorage.setItem(CHATS_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete chat from localStorage', e);
    }
  }

  async getSettings(): Promise<ChatSettings> {
    if (!this.isBrowser()) return defaultSettings as ChatSettings;
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...defaultSettings, ...JSON.parse(data) } as ChatSettings;
      }
      return defaultSettings as ChatSettings;
    } catch (e) {
      console.error('Failed to get settings from localStorage', e);
      return defaultSettings as ChatSettings;
    }
  }

  async saveSettings(settings: ChatSettings): Promise<void> {
    if (!this.isBrowser()) return;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings to localStorage', e);
    }
  }
}
