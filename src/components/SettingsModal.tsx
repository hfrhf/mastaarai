'use client';

import React, { useEffect, useState } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Settings, Moon, Sun, Terminal, Globe } from 'lucide-react';
import { Language } from '../utils/translations';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings, models, t } = useChat();
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] text-neutral-900 dark:text-neutral-100" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-2 font-semibold">
            <Settings size={18} className="text-neutral-500" />
            <span>{t.settingsTitle}</span>
          </div>
          <button 
            className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {/* Theme Segment Selector */}
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

          {/* Language Segment Selector */}
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

          {/* Developer Mode Custom Switch */}
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

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* Default Model */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold">{t.defaultModel}</label>
            <span className="text-xs text-neutral-500 mb-2">{t.defaultModelDesc}</span>
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold">{t.temperature} ({temp})</label>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                {temp === 0 
                  ? (t.language === 'ar' ? 'دقيق ومتطابق' : 'Deterministic') 
                  : temp >= 1.2 
                    ? (t.language === 'ar' ? 'إبداعي متنوع' : 'Creative') 
                    : (t.language === 'ar' ? 'متوازن' : 'Balanced')}
              </span>
            </div>
            <span className="text-xs text-neutral-500 mb-2">{t.tempDesc}</span>
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
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-center">
              <label className="font-semibold">{t.maxTokens} ({maxTok})</label>
            </div>
            <span className="text-xs text-neutral-500 mb-2">{t.maxTokensDesc}</span>
            <input
              type="range"
              min="256"
              max="8192"
              step="128"
              value={maxTok}
              onChange={(e) => setMaxTok(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none"
            />
          </div>

          <hr className="border-neutral-200 dark:border-neutral-800" />

          {/* System Prompt Textarea */}
          <div className="flex flex-col gap-1">
            <label className="font-semibold">{t.systemPrompt}</label>
            <span className="text-xs text-neutral-500 mb-2">{t.systemPromptDesc}</span>
            <textarea
              value={sysPrompt}
              onChange={(e) => setSysPrompt(e.target.value)}
              className="w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-3 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
              rows={3}
            />
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
