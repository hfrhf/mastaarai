'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Chat, Message, ChatSettings, ModelConfig } from '../types/chat';
import { getStorageAdapter } from '../adapters/storage';
import { Memory } from '../adapters/storage/types';
import { parseSSEChunk } from '../utils/api';
import { translations } from '../utils/translations';
import { supabase } from '../utils/supabaseClient';
import defaultSettings from '../config/defaultSettings.json';
import modelsList from '../config/models.json';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  settings: ChatSettings;
  models: ModelConfig[];
  toasts: Toast[];
  isGenerating: boolean;
  activeChat: Chat | null;
  t: typeof translations.en;
  createNewChat: (modelId?: string) => string;
  selectChat: (chatId: string) => void;
  selectModelId: (modelId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, title: string) => void;
  sendMessage: (content: string) => Promise<void>;
  stopGenerating: () => void;
  regenerateMessage: (messageId: string) => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  continueGenerating: (messageId: string) => Promise<void>;
  toggleWebSearch: (chatId: string) => void;
  updateSettings: (newSettings: Partial<ChatSettings>) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeToast: (toastId: string) => void;
  exportChat: (chatId: string, format: 'markdown' | 'json' | 'text') => void;
  user: any | null;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  logout: () => Promise<void>;
  memories: Memory[];
  deleteMemory: (id: string) => Promise<void>;
  memoryAlert: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [settings, setSettings] = useState<ChatSettings>(defaultSettings as ChatSettings);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [user, setUser] = useState<any | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [memoryAlert, setMemoryAlert] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const storage = getStorageAdapter();
  const models = modelsList as ModelConfig[];
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  // Active translation dictionary
  const t = translations[settings.language || 'en'];

  // Initialize, subscribe to auth state changes and load data dynamically
  useEffect(() => {
    const loadData = async () => {
      try {
        const storedSettings = await storage.getSettings();
        setSettings(storedSettings);
        
        const root = document.documentElement;
        if (storedSettings.theme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        root.setAttribute('dir', storedSettings.language === 'ar' ? 'rtl' : 'ltr');

        const storedChats = await storage.getChats();
        setChats(storedChats);

        const storedMemories = await storage.getMemories();
        setMemories(storedMemories);

        if (storedChats.length > 0) {
          setActiveChatId(storedChats[0].id);
        } else {
          setActiveChatId(null);
        }
      } catch (e) {
        console.error('Failed to load storage data', e);
      }
    };

    // Load initial user session
    if (supabase) {
      supabase.auth.getUser().then(({ data: { user } }) => {
        setUser(user);
        loadData();
      });

      // Listen to auth shifts
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        setUser(session?.user || null);
        await loadData();
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      loadData();
    }
  }, []);

  const logout = async () => {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addToast(error.message, 'error');
      } else {
        addToast(t.logoutSuccess, 'success');
      }
    }
  };

  const deleteMemory = async (id: string) => {
    await storage.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
    addToast(settings.language === 'ar' ? 'تم حذف الذاكرة بنجاح' : 'Memory deleted successfully', 'success');
  };

  const extractMemoriesBackground = async (messageText: string) => {
    try {
      const response = await fetch('/api/memories/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      if (response.ok) {
        const { memories: extracted } = await response.json();
        if (extracted && extracted.length > 0) {
          for (const fact of extracted) {
            const saved = await storage.saveMemory(fact);
            setMemories((prev) => [saved, ...prev]);
          }
          // Set the subtle memory alert text
          setMemoryAlert(settings.language === 'ar' ? 'تم تحديث الذاكرة ✨' : 'Memory updated ✨');
          setTimeout(() => {
            setMemoryAlert(null);
          }, 3500);
        }
      }
    } catch (e) {
      console.error('Failed to extract memories in background:', e);
    }
  };

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = generateUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  };

  const updateSettings = async (newSettings: Partial<ChatSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    
    const root = document.documentElement;
    if (newSettings.theme) {
      if (newSettings.theme === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
    if (newSettings.language) root.setAttribute('dir', newSettings.language === 'ar' ? 'rtl' : 'ltr');

    await storage.saveSettings(updated);
    const trans = translations[updated.language || 'en'];
    addToast(trans.settingsUpdated, 'success');
  };

  const createNewChat = (modelId?: string) => {
    const defaultTitle = settings.language === 'ar' ? 'محادثة جديدة' : 'New Chat';
    const newChat: Chat = {
      id: generateUUID(),
      title: defaultTitle,
      createdAt: new Date().toISOString(),
      messages: [],
      modelId: modelId || settings.defaultModelId,
      temperature: settings.defaultTemperature,
      maxTokens: settings.defaultMaxTokens,
      systemPrompt: settings.defaultSystemPrompt,
      webSearchEnabled: false,
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    storage.saveChat(newChat);
    return newChat.id;
  };

  const selectChat = (chatId: string) => {
    setActiveChatId(chatId);
  };

  const selectModelId = (modelId: string) => {
    if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            const updated = { ...c, modelId };
            storage.saveChat(updated);
            return updated;
          }
          return c;
        })
      );
    } else {
      updateSettings({ defaultModelId: modelId });
    }
  };

  const deleteChat = async (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    await storage.deleteChat(chatId);
    
    if (activeChatId === chatId) {
      const remaining = chats.filter((c) => c.id !== chatId);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        setActiveChatId(null);
      }
    }
    addToast(t.chatDeleted, 'info');
  };

  const renameChat = async (chatId: string, title: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const updated = { ...c, title };
          storage.saveChat(updated);
          return updated;
        }
        return c;
      })
    );
    addToast(t.chatRenamed, 'success');
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsGenerating(false);

      if (activeChatId) {
        setChats((prev) =>
          prev.map((c) => {
            if (c.id === activeChatId) {
              const updatedMessages = c.messages.map((m) =>
                m.status === 'streaming' || m.status === 'thinking' || m.status === 'searching'
                  ? { ...m, status: 'done' as const }
                  : m
              );
              const updated = { ...c, messages: updatedMessages };
              storage.saveChat(updated);
              return updated;
            }
            return c;
          })
        );
      }
      addToast(t.generationStopped, 'info');
    }
  };

  const generateTitle = async (chatId: string, userPrompt: string, modelId: string) => {
    try {
      const response = await fetch('/api/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt, model: modelId }),
      });
      if (response.ok) {
        const { title } = await response.json();
        if (title) {
          renameChat(chatId, title);
        }
      }
    } catch (e) {
      console.error('Failed to generate dynamic title', e);
    }
  };

  const toggleWebSearch = (chatId: string) => {
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          const updated = { ...c, webSearchEnabled: !c.webSearchEnabled };
          storage.saveChat(updated);
          return updated;
        }
        return c;
      })
    );
  };

  const streamResponse = async (
    chatId: string,
    messageHistory: Message[],
    assistantMessageId: string,
    modelId: string,
    temp: number,
    maxTok: number,
    systemPromptText?: string,
    searchResults?: { title: string; url: string }[]
  ) => {
    setIsGenerating(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const startTime = performance.now();
      
      const payloadMessages = [];
      
      // Inject search result context if search was toggled on and returned results
      let systemContext = systemPromptText || '';
      if (searchResults && searchResults.length > 0) {
        systemContext += `\n\n[Web Search Context: Web Search is enabled. The user's query was run on the web. Search Results:\n${searchResults.map((r, i) => `[${i + 1}] "${r.title}" - ${r.url}`).join('\n')}\n\nUse these search results to answer the query. You MUST cite your sources using bracket numbers like [1], [2], etc., corresponding to the indices of the search results above when referencing them. Maintain a helpful, accurate, and search-grounded response.]`;
      }

      if (systemContext) {
        payloadMessages.push({ role: 'system', content: systemContext });
      }
      
      payloadMessages.push(...messageHistory.map(m => ({ role: m.role, content: m.content })));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model: modelId,
          temperature: temp,
          maxTokens: maxTok,
          stream: true,
          memories: memories.map(m => m.content),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error('No body reader');

      let accumulatedContent = '';
      let buffer = '';

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMessageId ? { ...m, status: 'streaming' as const } : m
              ),
            };
          }
          return c;
        })
      );

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        buffer += text;

        const lastNewlineIdx = buffer.lastIndexOf('\n');
        if (lastNewlineIdx !== -1) {
          const processable = buffer.slice(0, lastNewlineIdx);
          buffer = buffer.slice(lastNewlineIdx + 1);

          parseSSEChunk(processable, (delta) => {
            accumulatedContent += delta;

            setChats((prev) =>
              prev.map((c) => {
                if (c.id === chatId) {
                  return {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedContent }
                        : m
                    ),
                  };
                }
                return c;
              })
            );
          });
        }
      }

      if (buffer.trim()) {
        parseSSEChunk(buffer, (delta) => {
          accumulatedContent += delta;
        });
      }

      const endTime = performance.now();
      const duration = parseFloat(((endTime - startTime) / 1000).toFixed(2));
      const estimatedTokens = Math.round(accumulatedContent.length / 3.5);

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            const updatedMessages = c.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: accumulatedContent,
                    status: 'done' as const,
                    duration,
                    tokens: estimatedTokens,
                  }
                : m
            );
            const updated = { ...c, messages: updatedMessages };
            storage.saveChat(updated);
            return updated;
          }
          return c;
        })
      );
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Stream aborted');
        return;
      }
      console.error('Streaming error', e);
      addToast(e.message || 'Error occurred while streaming response', 'error');

      setChats((prev) =>
        prev.map((c) => {
          if (c.id === chatId) {
            const updatedMessages = c.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, status: 'error' as const, content: m.content || 'Error generating response.' }
                : m
            );
            const updated = { ...c, messages: updatedMessages };
            storage.saveChat(updated);
            return updated;
          }
          return c;
        })
      );
    } finally {
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  };

  const getMockSearchResults = (prompt: string): { title: string; url: string }[] => {
    const query = prompt.toLowerCase();
    
    if (query.includes('laravel')) {
      return [
        { title: 'Laravel Queues & Job Processing Documentation', url: 'https://laravel.com/docs/queues' },
        { title: 'Laravel Queue Workers and Supervised Configurations', url: 'https://laravel.com/docs/queues#running-the-queue-worker' },
        { title: 'Introduction to Laravel Queues - Laracasts Tutorial', url: 'https://laracasts.com/series/laravel-queues-demystified' },
        { title: 'Optimizing Redis and Database Queues in Laravel Production', url: 'https://laravel-news.com/laravel-queue-optimization' }
      ];
    }

    if (query.includes('react') || query.includes('context')) {
      return [
        { title: 'React Context API Documentation - React Dev', url: 'https://react.dev/reference/react/createContext' },
        { title: 'Passing Data Deeply with Context in React Components', url: 'https://react.dev/learn/passing-data-deeply-with-context' },
        { title: 'When and How to Use React Context vs Prop Drilling', url: 'https://freecodecamp.org/news/react-context-vs-props' }
      ];
    }

    if (query.includes('python')) {
      return [
        { title: 'Python HTTP requests using urllib and requests package', url: 'https://realpython.com/python-requests/' },
        { title: 'Parsing JSON payloads in Python - official json docs', url: 'https://docs.python.org/3/library/json.html' }
      ];
    }

    if (query.includes('flexbox') || query.includes('css')) {
      return [
        { title: 'A Complete Guide to Flexbox - CSS-Tricks', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
        { title: 'CSS Grid Layout - MDN Web Docs', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout' }
      ];
    }

    // Default mock results
    const cleanQuery = encodeURIComponent(prompt);
    return [
      { title: `${prompt} - Google Search Search results`, url: `https://www.google.com/search?q=${cleanQuery}` },
      { title: `Wikipedia search page overview for "${prompt}"`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${cleanQuery}` },
      { title: `Reddit discussions on ${prompt}`, url: `https://www.reddit.com/search/?q=${cleanQuery}` }
    ];
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    
    let currentChatId = activeChatId;
    let currentChat: Chat | undefined;

    if (!currentChatId) {
      const defaultTitle = settings.language === 'ar' ? 'محادثة جديدة' : 'New Chat';
      const newChat: Chat = {
        id: generateUUID(),
        title: defaultTitle,
        createdAt: new Date().toISOString(),
        messages: [],
        modelId: settings.defaultModelId,
        temperature: settings.defaultTemperature,
        maxTokens: settings.defaultMaxTokens,
        systemPrompt: settings.defaultSystemPrompt,
        webSearchEnabled: false,
      };

      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      storage.saveChat(newChat);
      
      currentChatId = newChat.id;
      currentChat = newChat;
    } else {
      currentChat = chats.find((c) => c.id === currentChatId);
    }

    if (!currentChat) return;

    const isFirstMsg = currentChat.messages.length === 0;
    const isSearchEnabled = currentChat.webSearchEnabled;

    const userMessage: Message = {
      id: generateUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      model: currentChat.modelId,
      status: 'done',
    };

    const assistantMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: currentChat.modelId,
      status: isSearchEnabled ? 'searching' as const : 'thinking' as const,
      searchQuery: isSearchEnabled ? content : undefined,
    };

    const updatedMessages = [...currentChat.messages, userMessage, assistantMessage];
    
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === currentChatId) {
          const updated = { ...c, messages: updatedMessages };
          storage.saveChat(updated);
          return updated;
        }
        return c;
      })
    );

    if (isFirstMsg) {
      generateTitle(currentChatId, content, currentChat.modelId);
    }

    // Process memory extraction asynchronously in background
    extractMemoriesBackground(content);

    let searchResults: { title: string; url: string }[] | undefined = undefined;

    if (isSearchEnabled) {
      // Simulate search delay (1.2s)
      await new Promise((resolve) => setTimeout(resolve, 1200));
      searchResults = getMockSearchResults(content);
      
      // Update assistant message with search results and change status to 'thinking'
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === currentChatId) {
            const updated = c.messages.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, status: 'thinking' as const, searchResults }
                : m
            );
            return { ...c, messages: updated };
          }
          return c;
        })
      );
    }

    const history = [...currentChat.messages, userMessage];
    await streamResponse(
      currentChatId,
      history,
      assistantMessage.id,
      currentChat.modelId,
      currentChat.temperature,
      currentChat.maxTokens,
      currentChat.systemPrompt,
      searchResults
    );
  };

  const regenerateMessage = async (messageId: string) => {
    if (!activeChatId || isGenerating) return;

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    const targetMsgIdx = currentChat.messages.findIndex((m) => m.id === messageId);
    if (targetMsgIdx === -1) return;

    const userMsgIdx = targetMsgIdx - 1;
    if (userMsgIdx < 0 || currentChat.messages[userMsgIdx].role !== 'user') return;

    const userPrompt = currentChat.messages[userMsgIdx].content;
    const isSearchEnabled = currentChat.webSearchEnabled;
    const originalAssistantMsg = currentChat.messages[targetMsgIdx];

    const newAssistantMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: currentChat.modelId,
      status: isSearchEnabled ? 'searching' as const : 'thinking' as const,
      regeneratedFrom: originalAssistantMsg.id,
      searchQuery: isSearchEnabled ? userPrompt : undefined,
    };

    const history = currentChat.messages.slice(0, userMsgIdx + 1);
    const updatedMessages = [...history, newAssistantMessage];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const updated = { ...c, messages: updatedMessages };
          storage.saveChat(updated);
          return updated;
        }
        return c;
      })
    );

    let searchResults: { title: string; url: string }[] | undefined = undefined;

    if (isSearchEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      searchResults = getMockSearchResults(userPrompt);
      
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            const updated = c.messages.map((m) =>
              m.id === newAssistantMessage.id
                ? { ...m, status: 'thinking' as const, searchResults }
                : m
            );
            return { ...c, messages: updated };
          }
          return c;
        })
      );
    }

    await streamResponse(
      activeChatId,
      history,
      newAssistantMessage.id,
      currentChat.modelId,
      currentChat.temperature,
      currentChat.maxTokens,
      currentChat.systemPrompt,
      searchResults
    );
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!activeChatId || isGenerating) return;

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    const msgIdx = currentChat.messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return;

    const isSearchEnabled = currentChat.webSearchEnabled;

    const editedUserMessage: Message = {
      ...currentChat.messages[msgIdx],
      content: newContent,
      edited: true,
    };

    const newAssistantMessage: Message = {
      id: generateUUID(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      model: currentChat.modelId,
      status: isSearchEnabled ? 'searching' as const : 'thinking' as const,
      searchQuery: isSearchEnabled ? newContent : undefined,
    };

    const history = currentChat.messages.slice(0, msgIdx);
    const updatedMessages = [...history, editedUserMessage, newAssistantMessage];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const updated = { ...c, messages: updatedMessages };
          storage.saveChat(updated);
          return updated;
        }
        return c;
      })
    );

    let searchResults: { title: string; url: string }[] | undefined = undefined;

    if (isSearchEnabled) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      searchResults = getMockSearchResults(newContent);
      
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            const updated = c.messages.map((m) =>
              m.id === newAssistantMessage.id
                ? { ...m, status: 'thinking' as const, searchResults }
                : m
            );
            return { ...c, messages: updated };
          }
          return c;
        })
      );
    }

    const streamHistory = [...history, editedUserMessage];
    await streamResponse(
      activeChatId,
      streamHistory,
      newAssistantMessage.id,
      currentChat.modelId,
      currentChat.temperature,
      currentChat.maxTokens,
      currentChat.systemPrompt,
      searchResults
    );
  };

  const continueGenerating = async (messageId: string) => {
    if (!activeChatId || isGenerating) return;

    const currentChat = chats.find((c) => c.id === activeChatId);
    if (!currentChat) return;

    const msgIdx = currentChat.messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1 || currentChat.messages[msgIdx].role !== 'assistant') return;

    const assistantMsg = currentChat.messages[msgIdx];

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const updatedMessages = c.messages.map((m) =>
            m.id === messageId ? { ...m, status: 'streaming' as const } : m
          );
          return { ...c, messages: updatedMessages };
        }
        return c;
      })
    );

    const history = currentChat.messages.slice(0, msgIdx + 1);

    await streamResponse(
      activeChatId,
      history,
      assistantMsg.id,
      currentChat.modelId,
      currentChat.temperature,
      currentChat.maxTokens,
      currentChat.systemPrompt,
      assistantMsg.searchResults // pass existing search results
    );
  };

  const exportChat = (chatId: string, format: 'markdown' | 'json' | 'text') => {
    const targetChat = chats.find((c) => c.id === chatId);
    if (!targetChat) return;

    let content = '';
    let filename = `${targetChat.title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`;

    if (format === 'json') {
      content = JSON.stringify(targetChat, null, 2);
      filename += '.json';
    } else if (format === 'markdown') {
      content = `# ${targetChat.title}\n\nCreated: ${new Date(targetChat.createdAt).toLocaleString()}\n\n`;
      targetChat.messages.forEach((m) => {
        content += `### ${m.role === 'user' ? 'User' : 'Assistant'} (${m.model})\n${m.content}\n\n---\n\n`;
      });
      filename += '.md';
    } else {
      content = `CHAT: ${targetChat.title}\nCreated: ${new Date(targetChat.createdAt).toLocaleString()}\n\n`;
      targetChat.messages.forEach((m) => {
        content += `${m.role === 'user' ? 'USER' : 'ASSISTANT'}:\n${m.content}\n\n`;
      });
      filename += '.txt';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    
    const msg = t.exportSuccess.replace('{format}', format.toUpperCase());
    addToast(msg, 'success');
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        settings,
        models,
        toasts,
        isGenerating,
        activeChat,
        t,
        createNewChat,
        selectChat,
        selectModelId,
        deleteChat,
        renameChat,
        sendMessage,
        stopGenerating,
        regenerateMessage,
        editMessage,
        continueGenerating,
        toggleWebSearch,
        updateSettings,
        addToast,
        removeToast,
        exportChat,
        user,
        authModalOpen,
        setAuthModalOpen,
        logout,
        memories,
        deleteMemory,
        memoryAlert,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
