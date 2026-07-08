'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import MessageList from './MessageList';
import InputBox from './InputBox';
import { 
  Menu, ChevronDown, Sun, Moon, Star, Info, Sparkles, 
  Code, Image, Edit, Search, Check
} from 'lucide-react';

interface ChatWindowProps {
  onOpenSettings: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  onOpenSettings, 
  sidebarCollapsed, 
  onToggleSidebar,
  isPremium,
  onUpgrade
}) => {
  const { 
    activeChat, 
    sendMessage, 
    models, 
    settings, 
    updateSettings, 
    selectModelId,
    t 
  } = useChat();

  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePillClick = async (type: 'image' | 'write' | 'search') => {
    const isAr = settings.language === 'ar';
    let prompt = '';
    
    if (type === 'image') {
      prompt = isAr 
        ? 'أنشئ صورة فنية رقمية دقيقة لكوخ دافئ في الغابة خلال فصل الخريف.'
        : 'Create a beautiful digital art image of a cozy cabin in the woods during autumn.';
    } else if (type === 'write') {
      prompt = isAr
        ? 'اكتب نموذج بريد إلكتروني احترافي ومنسق لطلب تحديثات حول حالة المشروع السحابي.'
        : 'Write a professional formatted email template asking for cloud project status updates.';
    } else {
      prompt = isAr
        ? 'ابحث في الويب ولخّص آخر الأخبار والتقنيات البرمجية حول Next.js.'
        : 'Search the web and summarize the latest coding news and updates about Next.js.';
    }
    
    await sendMessage(prompt);
  };

  const activeModelId = activeChat ? activeChat.modelId : settings.defaultModelId;
  const activeModel = models.find((m) => m.id === activeModelId) || models[0];

  const hasMessages = activeChat && activeChat.messages.length > 0;
  const isRTL = settings.language === 'ar';

  return (
    <main className="flex-1 flex flex-col bg-white dark:bg-[#171717] text-neutral-900 dark:text-[#ececec] relative overflow-hidden transition-all duration-300 h-full">
      {/* TOP NAVIGATION HEADER */}
      <header className="h-14 flex items-center justify-between px-4 z-20 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-2">
          {/* Sidebar Toggle Button */}
          {sidebarCollapsed && (
            <button 
              onClick={onToggleSidebar} 
              id="sidebar-open-btn" 
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" 
              title={isRTL ? "افتح القائمة الجانبية" : "Ouvrir la barre latérale"}
            >
              <Menu size={20} />
            </button>
          )}

          {/* Model Selection Dropdown */}
          <div className="relative inline-block text-left" ref={dropdownRef}>
            <button 
              onClick={() => setModelDropdownOpen(!modelDropdownOpen)} 
              id="model-dropdown-btn" 
              className="flex items-center gap-1.5 px-3 py-1.5 text-[15px] font-semibold text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all"
            >
              <span>{activeModel?.name || 'Kimi K2.6'}</span>
              <ChevronDown size={14} className="text-neutral-400" />
            </button>

            {modelDropdownOpen && (
              <div 
                id="model-dropdown" 
                className={`absolute mt-2 w-64 rounded-xl bg-white dark:bg-[#212121] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-1.5 z-50 ${
                  isRTL ? 'right-0' : 'left-0'
                }`}
              >
                {models.map((m) => (
                  <button 
                    key={m.id}
                    onClick={() => {
                      selectModelId(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className="flex items-start gap-3 w-full p-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all text-left"
                  >
                    <div className={`p-1.5 rounded-md ${
                      m.name.includes('Kimi') 
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' 
                        : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    }`}>
                      {m.name.includes('Kimi') ? <Code size={16} /> : <Sparkles size={16} />}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="font-medium text-sm text-neutral-900 dark:text-neutral-100 flex items-center justify-between">
                        <span>{m.name}</span>
                        {m.id === activeModelId && <Check size={12} className="text-indigo-500" />}
                      </div>
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 line-clamp-2">
                        {m.name.includes('Kimi') 
                          ? (isRTL ? 'مثالي للمهام المعقدة وكتابة الأكواد والتحليل الإبداعي.' : 'Idéal pour les tâches complexes, la programmation et l\'analyse.')
                          : (isRTL ? 'سريع وخفيف للأسئلة السريعة والمهام اليومية.' : 'Rapide, léger et parfait pour les tâches de tous les jours.')
                        }
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Right Options */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle Button */}
          <button 
            onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors" 
            title={isRTL ? "تغيير المظهر" : "Changer de thème"}
          >
            {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Premium Upgrade Badge */}
          <button 
            onClick={onUpgrade}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full text-xs font-semibold shadow-lg shadow-indigo-900/20 transition-all"
          >
            <Star size={14} fill="currentColor" />
            <span>{isRTL ? "ترقية الاشتراك" : "Mettre à niveau"}</span>
          </button>

          {/* Feedback Info Button */}
          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
          >
            <Info size={20} />
          </button>
        </div>
      </header>

      {/* CHAT WORKSPACE SCROLL AREA */}
      <div className="flex-1 overflow-hidden flex flex-col relative">
        {hasMessages ? (
          <MessageList messages={activeChat.messages} />
        ) : (
          /* LANDING SCREEN */
          <div className="max-w-4xl mx-auto flex flex-col items-center justify-center flex-grow text-center px-4">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-800 dark:text-neutral-100 mb-10 select-none">
              {isRTL ? 'دائماً مستعد للإجابة.' : 'Toujours prêt à répondre.'}
            </h1>

            {/* SUGGESTED PILLS */}
            <div className="flex flex-wrap items-center justify-center gap-3 max-w-xl mx-auto">
              <button 
                onClick={() => handlePillClick('image')}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-[13px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm font-medium"
              >
                <Image size={14} className="text-emerald-500" />
                <span>{isRTL ? 'إنشاء صورة' : 'Créer une image'}</span>
              </button>
              <button 
                onClick={() => handlePillClick('write')}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-[13px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm font-medium"
              >
                <Edit size={14} className="text-sky-500" />
                <span>{isRTL ? 'كتابة أو تعديل' : 'Écrire ou modifier'}</span>
              </button>
              <button 
                onClick={() => handlePillClick('search')}
                className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-full text-[13px] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm font-medium"
              >
                <Search size={14} className="text-amber-500" />
                <span>{isRTL ? 'البحث في الويب' : 'Faire une recherche'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STICKY INPUT BAR */}
      <footer className="w-full bg-gradient-to-t from-white via-white to-transparent dark:from-[#171717] dark:via-[#171717] dark:to-transparent pt-6 pb-4 px-4 z-10">
        <InputBox />
      </footer>
    </main>
  );
};
export default ChatWindow;
