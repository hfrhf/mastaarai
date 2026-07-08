'use client';

import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Settings, Moon, Sun, Terminal, Globe, Brain, Trash2, Cpu } from 'lucide-react';
import { Language } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'models' | 'memory';

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, models, t, memories, deleteMemory } = useChat();
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>('dark');
  const [localLang, setLocalLang] = useState<Language>('ar');
  const [localDevMode, setLocalDevMode] = useState(false);
  const [defaultModel, setDefaultModel] = useState('');
  const [temp, setTemp] = useState(0.7);
  const [maxTok, setMaxTok] = useState(2048);
  const [sysPrompt, setSysPrompt] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalTheme(settings.theme);
      setLocalLang(settings.language || 'en');
      setLocalDevMode(settings.developerMode);
      setDefaultModel(settings.defaultModelId);
      setTemp(settings.defaultTemperature);
      setMaxTok(settings.defaultMaxTokens);
      setSysPrompt(settings.defaultSystemPrompt);
    }
  }, [isOpen, settings]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    updateSettings({
      theme: localTheme,
      language: localLang,
      developerMode: localDevMode,
      defaultModelId: defaultModel,
      defaultTemperature: temp,
      defaultMaxTokens: maxTok,
      defaultSystemPrompt: sysPrompt,
    });
    onClose();
  };

  const isRTL = localLang === 'ar';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-neutral-900 dark:text-neutral-100" 
        onClick={(e) => e.stopPropagation()}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold">
            <Settings size={18} className="text-neutral-500" />
            <span>{t.settingsTitle}</span>
          </div>
          <button 
            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Container (Tab layout) */}
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {/* Sidebar Tab Selectors */}
          <div className="w-1/3 bg-neutral-50 dark:bg-[#181818] p-4 border-r dark:border-neutral-800 space-y-1 select-none">
            <button
              onClick={() => setActiveTab('general')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'general'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Settings size={16} />
              <span>{isRTL ? 'عام' : 'Général'}</span>
            </button>

            <button
              onClick={() => setActiveTab('models')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'models'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Cpu size={16} />
              <span>{isRTL ? 'النماذج' : 'Modèles'}</span>
            </button>

            <button
              onClick={() => setActiveTab('memory')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'memory'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black shadow-md'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Brain size={16} />
              <span>{isRTL ? 'الذاكرة' : 'Mémoire'}</span>
            </button>
          </div>

          {/* Active Tab Panel Content */}
          <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] space-y-6 text-sm">
            {activeTab === 'general' && (
              <div className="space-y-6">
                {/* Theme Selector */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-semibold block">{t.theme}</span>
                  </div>
                  <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <button
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        localTheme === 'light' 
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      onClick={() => setLocalTheme('light')}
                    >
                      <Sun size={14} />
                      <span>{t.light}</span>
                    </button>
                    <button
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        localTheme === 'dark' 
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      onClick={() => setLocalTheme('dark')}
                    >
                      <Moon size={14} />
                      <span>{t.dark}</span>
                    </button>
                  </div>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Language Selector */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-semibold block">{t.language}</span>
                  </div>
                  <div className="flex bg-neutral-100 dark:bg-neutral-900 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <button
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        localLang === 'ar' 
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      onClick={() => setLocalLang('ar')}
                    >
                      <Globe size={14} />
                      <span>{t.arabic}</span>
                    </button>
                    <button
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        localLang === 'en' 
                          ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm' 
                          : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
                      }`}
                      onClick={() => setLocalLang('en')}
                    >
                      <Globe size={14} />
                      <span>{t.english}</span>
                    </button>
                  </div>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Developer Mode */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="font-semibold block">{t.developerMode}</span>
                    <span className="text-xs text-neutral-500 mt-0.5 block">{t.devModeDesc}</span>
                  </div>
                  <button
                    onClick={() => setLocalDevMode(!localDevMode)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 focus:outline-none ${
                      localDevMode ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${
                        localDevMode 
                          ? (isRTL ? '-translate-x-5' : 'translate-x-5') 
                          : 'translate-x-0'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'models' && (
              <div className="space-y-6">
                {/* Default Model selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold">{t.defaultModel}</label>
                  <span className="text-xs text-neutral-500 mb-1">{t.defaultModelDesc}</span>
                  <select
                    value={defaultModel}
                    onChange={(e) => setDefaultModel(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    {models.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.provider.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Temperature Slider */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-semibold">{t.temperature} ({temp})</label>
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {temp === 0 
                        ? (isRTL ? 'دقيق ومتطابق' : 'Deterministic') 
                        : temp >= 1.2 
                          ? (isRTL ? 'إبداعي متنوع' : 'Creative') 
                          : (isRTL ? 'متوازن' : 'Balanced')}
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 mb-1">{t.tempDesc}</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(parseFloat(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none"
                  />
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Max Tokens Slider */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold">{t.maxTokens} ({maxTok})</label>
                  <span className="text-xs text-neutral-500 mb-1">{t.maxTokensDesc}</span>
                  <input
                    type="range"
                    min="256"
                    max="32768"
                    step="128"
                    value={maxTok}
                    onChange={(e) => setMaxTok(parseInt(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none"
                  />
                </div>

                <hr className="border-neutral-200 dark:border-neutral-800" />

                {/* Default System Prompt */}
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold">{t.systemPrompt}</label>
                  <span className="text-xs text-neutral-500 mb-1">{t.systemPromptDesc}</span>
                  <textarea
                    value={sysPrompt}
                    onChange={(e) => setSysPrompt(e.target.value)}
                    className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {activeTab === 'memory' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-sm block">{isRTL ? 'إدارة الذاكرة' : 'Gérer la mémoire'}</h3>
                  <p className="text-xs text-neutral-500 mt-1 block">
                    {isRTL 
                      ? 'يقوم الذكاء الاصطناعي باستخلاص الحقائق والتفضيلات الشخصية عنك تلقائياً أثناء الحوار. يمكنك استعراضها وإزالة ما ترغب منه بالأسفل:' 
                      : 'L\'IA extrait automatiquement les faits et vos préférences personnelles de vos conversations. Vous pouvez les passer en revue et les supprimer ci-dessous :'}
                  </p>
                </div>

                {/* Memories List */}
                <div className="space-y-2 mt-4 max-h-[350px] overflow-y-auto pr-1">
                  {memories.length === 0 ? (
                    <div className="text-center py-10 bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl border border-neutral-100 dark:border-neutral-800/80 p-6 flex flex-col items-center">
                      <Brain size={28} className="text-neutral-400 dark:text-neutral-600 mb-2 animate-bounce" />
                      <span className="text-xs text-neutral-500 font-semibold block">{t.noConversations}</span>
                      <span className="text-[11px] text-neutral-400 mt-1 block max-w-xs leading-normal">
                        {isRTL 
                          ? 'الذاكرة فارغة حالياً. بمجرد إخبار المساعد بمعلومات عنك (مثل اسمك أو تفضيلات برمجية)، سيتم تخزينها وحفظها هنا.' 
                          : 'La mémoire est vide. Dès que vous partagez des informations (comme votre nom ou vos préférences de codage), elles apparaîtront ici.'}
                      </span>
                    </div>
                  ) : (
                    memories.map((m) => (
                      <div 
                        key={m.id} 
                        className="flex items-center justify-between p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#1a1a1a] hover:bg-neutral-100/50 dark:hover:bg-neutral-800/30 transition-all gap-3"
                      >
                        <span className="text-xs text-neutral-800 dark:text-neutral-200 leading-normal flex-1">
                          {m.content}
                        </span>
                        <button
                          onClick={() => deleteMemory(m.id)}
                          className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                          title={isRTL ? 'حذف' : 'Supprimer'}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#1a1a1a]">
          <button 
            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-medium text-xs cursor-pointer"
            onClick={onClose}
          >
            {t.cancel}
          </button>
          <button 
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black rounded-xl transition-all font-semibold text-xs cursor-pointer"
            onClick={handleSave}
          >
            {t.saveSettings}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;
