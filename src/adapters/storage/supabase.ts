import { supabase } from '../../utils/supabaseClient';
import { IStorageAdapter, Memory } from './types';
import { Chat, ChatSettings } from '../../types/chat';
import { LocalStorageAdapter } from './localStorage';
import defaultSettings from '../../config/defaultSettings.json';

export class SupabaseStorageAdapter implements IStorageAdapter {
  private localFallback = new LocalStorageAdapter();

  private getClient() {
    if (!supabase) {
      throw new Error('Supabase client is not initialized. Please configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }
    return supabase;
  }

  private async getUserId(): Promise<string | null> {
    try {
      const client = this.getClient();
      const { data: { user }, error } = await client.auth.getUser();
      if (error || !user) return null;
      return user.id;
    } catch (e) {
      return null;
    }
  }

  async getChats(): Promise<Chat[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return this.localFallback.getChats();
      }

      const client = this.getClient();
      const { data, error } = await client
        .from('chats')
        .select('*')
        .eq('user_id', userId)
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
      const userId = await this.getUserId();
      if (!userId) {
        await this.localFallback.saveChat(chat);
        return;
      }

      const client = this.getClient();
      const payload = {
        id: chat.id,
        user_id: userId,
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
      const userId = await this.getUserId();
      if (!userId) {
        await this.localFallback.deleteChat(id);
        return;
      }

      const client = this.getClient();
      const { error } = await client
        .from('chats')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to delete chat from Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.deleteChat(id);
    }
  }

  async getSettings(): Promise<ChatSettings> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return this.localFallback.getSettings();
      }

      const client = this.getClient();
      const { data, error } = await client
        .from('settings')
        .select('*')
        .eq('user_id', userId)
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
      const userId = await this.getUserId();
      if (!userId) {
        await this.localFallback.saveSettings(settings);
        return;
      }

      const client = this.getClient();
      const payload = {
        user_id: userId,
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
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to save settings to Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.saveSettings(settings);
    }
  }

  async getMemories(): Promise<Memory[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return this.localFallback.getMemories();
      }

      const client = this.getClient();
      const { data, error } = await client
        .from('memories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
      }));
    } catch (e: any) {
      console.warn('Failed to get memories from Supabase, falling back to LocalStorage:', e?.message || e);
      return this.localFallback.getMemories();
    }
  }

  async saveMemory(content: string): Promise<Memory> {
    const memoryId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const createdAt = new Date().toISOString();
    const memory: Memory = { id: memoryId, content, createdAt };

    try {
      const userId = await this.getUserId();
      if (!userId) {
        return this.localFallback.saveMemory(content);
      }

      const client = this.getClient();
      const payload = {
        id: memoryId,
        user_id: userId,
        content,
        created_at: createdAt,
      };

      const { error } = await client
        .from('memories')
        .insert(payload);

      if (error) throw error;
      return memory;
    } catch (e: any) {
      console.warn('Failed to save memory to Supabase, falling back to LocalStorage:', e?.message || e);
      return this.localFallback.saveMemory(content);
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        await this.localFallback.deleteMemory(id);
        return;
      }

      const client = this.getClient();
      const { error } = await client
        .from('memories')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (e: any) {
      console.warn('Failed to delete memory from Supabase, falling back to LocalStorage:', e?.message || e);
      await this.localFallback.deleteMemory(id);
    }
  }
}
