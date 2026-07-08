'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { ArrowUp, Plus, Square, Globe, Mic, X } from 'lucide-react';

export const InputBox: React.FC = () => {
  const { 
    sendMessage, 
    isGenerating, 
    stopGenerating, 
    activeChat, 
    toggleWebSearch, 
    createNewChat,
    settings,
    t 
  } = useChat();
  const [input, setInput] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-expand height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || isGenerating) return;
    const text = input;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    await sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleToggleSearch = () => {
    if (!activeChat) {
      const newId = createNewChat();
      toggleWebSearch(newId);
    } else {
      toggleWebSearch(activeChat.id);
    }
  };

  const handleFinishVoice = async () => {
    setVoiceModalOpen(false);
    const isAr = settings.language === 'ar';
    const voicePrompt = isAr
      ? "مرحباً! هل يمكنك شرح كيفية عمل مفتاح API الخاص بموقع mastaar.ai؟"
      : "Hello! Can you explain how the mastaar.ai API works?";
    
    setInput('');
    await sendMessage(voicePrompt);
  };

  const isSearchActive = activeChat ? !!activeChat.webSearchEnabled : false;
  const isAr = settings.language === 'ar';

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="w-full bg-neutral-100 dark:bg-[#2f2f2f] rounded-3xl p-3 shadow-xl border border-transparent dark:border-neutral-800 transition-all focus-within:ring-2 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-700 relative">
        <div className="flex items-center gap-2">
          {/* Attachment + Button */}
          <button 
            className="p-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors flex-shrink-0"
            title="Ajouter un fichier"
            disabled
          >
            <Plus size={20} />
          </button>

          {/* Custom Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "اسأل سؤالاً" : "Poser une question"}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] placeholder-neutral-400 text-neutral-900 dark:text-white max-h-36 py-1 w-full focus:ring-0 focus:outline-none"
            style={{ minHeight: '24px' }}
          />

          {/* Web Search Globe Toggle Button */}
          <button
            onClick={handleToggleSearch}
            className={`p-2.5 rounded-full transition-colors ${
              isSearchActive 
                ? 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' 
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
            title={t.webSearch}
          >
            <Globe size={20} />
          </button>

          {/* Micro / Voice Input button */}
          <button 
            onClick={() => setVoiceModalOpen(true)}
            className="p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors"
            title="Entrée vocale"
          >
            <Mic size={20} />
          </button>

          {/* Send / Stop Action Button */}
          {isGenerating ? (
            <button
              onClick={stopGenerating}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black p-2.5 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex-shrink-0 cursor-pointer"
              title={t.stopGenerating}
            >
              <Square size={16} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className={`p-2.5 rounded-full transition-all flex-shrink-0 ${
                input.trim()
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-default'
              }`}
              disabled={!input.trim()}
            >
              <ArrowUp size={16} className="stroke-[3px]" />
            </button>
          )}
        </div>
      </div>

      <div className="text-[11px] text-center text-neutral-500 mt-2 select-none">
        {isAr 
          ? "قد يرتكب الذكاء الاصطناعي بعض الأخطاء. يرجى التحقق من التفاصيل الهامة."
          : "Le contenu peut être inexact. mastaar.ai peut faire des erreurs."
        }
      </div>

      {/* VOICE INPUT MICROPHONE MODAL SIMULATION */}
      {voiceModalOpen && (
        <div className="voice-modal-overlay" onClick={() => setVoiceModalOpen(false)}>
          <div className="voice-modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 className="voice-modal-title">
              {isAr ? 'جاري الاستماع...' : 'Écoute en cours...'}
            </h3>
            <p className="voice-modal-subtitle">
              {isAr ? 'تحدث الآن لطرح سؤالك' : 'Parlez maintenant pour poser votre question'}
            </p>
            
            {/* Animated audio waves */}
            <div className="voice-waves-container flex items-end justify-center gap-1.5 h-12 mb-8">
              <span className="w-1.5 bg-indigo-500 rounded-full wave-bar" style={{ height: '10px' }}></span>
              <span className="w-1.5 bg-indigo-500 rounded-full wave-bar" style={{ height: '25px' }}></span>
              <span className="w-1.5 bg-indigo-500 rounded-full wave-bar" style={{ height: '40px' }}></span>
              <span className="w-1.5 bg-indigo-500 rounded-full wave-bar" style={{ height: '15px' }}></span>
              <span className="w-1.5 bg-indigo-500 rounded-full wave-bar" style={{ height: '30px' }}></span>
            </div>

            <button 
              onClick={handleFinishVoice} 
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-colors mb-4 w-full"
            >
              {isAr ? 'إنهاء وإرسال' : 'Terminer & Envoyer'}
            </button>
            <button 
              onClick={() => setVoiceModalOpen(false)} 
              className="text-neutral-400 hover:text-white text-sm"
            >
              {isAr ? 'إلغاء' : 'Annuler'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default InputBox;
