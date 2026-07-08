import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageAdapter } from './types';
import { Chat, ChatSettings } from '../../types/chat';
import { LocalStorageAdapter } from './localStorage';
import defaultSettings from '../../config/defaultSettings.json';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export class SupabaseStorageAdapter implements IStorageAdapter {
  private supabase: SupabaseClient | null = null;
  private localFallback = new LocalStorageAdapter();

  constructor() {
    if (supabaseUrl && supabaseAnonKey) {
      this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  private getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client is not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return this.supabase;
  }

  async getChats(): Promise<Chat[]> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('chats')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        title: row.title,
        createdAt: row.created_at,
        modelId: row.model_id,
        temperature: row.temperature,
        maxTokens: row.max_tokens,
        systemPrompt: row.system_prompt,
        messages: row.messages || [],
      }));
    } catch (e: any) {
      console.warn('Failed to get chats from Supabase, falling back to LocalStorage:', e?.message || e);
      return this.localFallback.getChats();
    }
  }

  async saveChat(chat: Chat): Promise<void> {
    try {
      const client = this.getClient();
      const payload = {
        id: chat.id,
        title: chat.title,
        created_at: chat.createdAt,
        model_id: chat.modelId,
        temperature: chat.temperature,
        max_tokens: chat.maxTokens,
        system_prompt: chat.systemPrompt,
        messages: chat.messages,
      };

      const { error } = await client
        .from('chats')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to save chat to Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.saveChat(chat);
    }
  }

  async deleteChat(id: string): Promise<void> {
    try {
      const client = this.getClient();
      const { error } = await client
        .from('chats')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to delete chat from Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.deleteChat(id);
    }
  }

  async getSettings(): Promise<ChatSettings> {
    try {
      const client = this.getClient();
      const { data, error } = await client
        .from('settings')
        .select('*')
        .eq('id', 'default')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is code for "no rows returned"

      if (data) {
        return {
          theme: data.theme,
          language: data.language || 'ar',
          developerMode: data.developer_mode,
          defaultModelId: data.default_model_id,
          defaultTemperature: data.default_temperature,
          defaultMaxTokens: data.default_max_tokens,
          defaultSystemPrompt: data.default_system_prompt,
        };
      }
      return this.localFallback.getSettings();
    } catch (e: any) {
      console.warn('Failed to get settings from Supabase, falling back to LocalStorage:', e?.message || e);
      return this.localFallback.getSettings();
    }
  }

  async saveSettings(settings: ChatSettings): Promise<void> {
    try {
      const client = this.getClient();
      const payload = {
        id: 'default',
        theme: settings.theme,
        language: settings.language,
        developer_mode: settings.developerMode,
        default_model_id: settings.defaultModelId,
        default_temperature: settings.defaultTemperature,
        default_max_tokens: settings.defaultMaxTokens,
        default_system_prompt: settings.defaultSystemPrompt,
      };

      const { error } = await client
        .from('settings')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to save settings to Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.saveSettings(settings);
    }
  }
}
