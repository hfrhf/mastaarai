'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { ArrowUp, Plus, Square, Globe, Mic, X, Sparkles } from 'lucide-react';
import { Attachment } from '../types/chat';

export const InputBox: React.FC = () => {
  const { 
    sendMessage, 
    isGenerating, 
    stopGenerating, 
    activeChat, 
    toggleWebSearch, 
    createNewChat,
    settings,
    t,
    addToast
  } = useChat();
  const [input, setInput] = useState('');
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-expand height
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, [input]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const res = reader.result as string;
        const base64 = res.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const isAr = settings.language === 'ar';

    if (attachments.length + files.length > 5) {
      addToast(
        isAr 
          ? 'لا يمكن رفع أكثر من 5 ملفات في المرة الواحدة' 
          : 'You can only upload up to 5 files at a time', 
        'error'
      );
      return;
    }

    setUploading(true);
    const newAttachments: Attachment[] = [];
    for (const file of files) {
      try {
        const base64 = await fileToBase64(file);
        newAttachments.push({
          name: file.name,
          mimeType: file.type,
          base64Data: base64
        });
      } catch (err) {
        console.error('File read error:', err);
        addToast(
          isAr ? `فشل قراءة الملف: ${file.name}` : `Failed to read file: ${file.name}`, 
          'error'
        );
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploading(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isGenerating) return;
    const text = input;
    const atts = attachments;
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.focus();
    }
    await sendMessage(text, atts);
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
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        accept="image/*,application/pdf" 
        className="hidden" 
        onChange={handleFileChange} 
      />

      {/* Attachments preview row */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2.5 mb-3 p-2.5 bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/50 dark:border-neutral-800/80 rounded-2xl animate-fade-in relative z-20">
          {attachments.map((att, idx) => (
            <div 
              key={idx} 
              className="relative flex items-center gap-2.5 p-2 bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-xl max-w-[200px] shadow-sm flex-shrink-0"
              style={{ direction: isAr ? 'rtl' : 'ltr' }}
            >
              {att.mimeType.startsWith('image/') ? (
                <img 
                  src={`data:${att.mimeType};base64,${att.base64Data}`} 
                  alt={att.name} 
                  className="w-9 h-9 rounded-lg object-cover border border-neutral-100 dark:border-neutral-800"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                  PDF
                </div>
              )}
              <div className="flex-grow min-w-0 pr-2">
                <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {att.name}
                </div>
                <div className="text-[10px] text-neutral-400 truncate">
                  {att.mimeType.startsWith('image/') ? (isAr ? 'صورة' : 'Image') : 'PDF'}
                </div>
              </div>
              <button
                onClick={() => removeAttachment(idx)}
                className="absolute -top-1.5 -right-1.5 p-1 bg-neutral-900 dark:bg-white text-white dark:text-black rounded-full hover:bg-red-500 dark:hover:bg-red-500 hover:text-white dark:hover:text-white transition-all shadow-md cursor-pointer"
                title={isAr ? 'حذف' : 'Remove'}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main input wrapper */}
      <div className="w-full bg-neutral-100 dark:bg-[#2f2f2f] rounded-3xl p-2 md:p-3 shadow-xl border border-transparent dark:border-neutral-800 transition-all focus-within:ring-2 focus-within:ring-neutral-300 dark:focus-within:ring-neutral-700 relative">
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Attachment + Button */}
          <button 
            onClick={triggerUpload}
            className={`p-2 md:p-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-full transition-colors flex-shrink-0 cursor-pointer ${
              uploading ? 'animate-pulse pointer-events-none' : ''
            }`}
            title={isAr ? 'إرفاق ملفات' : 'Ajouter des fichiers'}
          >
            <Plus className={`w-[18px] h-[18px] md:w-5 md:h-5 transition-transform ${uploading ? 'rotate-45' : ''}`} />
          </button>

          {/* Custom Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isAr ? "اسأل سؤالاً أو أرفق صوراً وملفات..." : "Poser une question ou joindre des fichiers..."}
            rows={1}
            className="flex-1 bg-transparent border-none outline-none resize-none text-sm md:text-[15px] placeholder-neutral-400 text-neutral-900 dark:text-white max-h-36 py-1.5 w-full focus:ring-0 focus:outline-none"
            style={{ minHeight: '24px' }}
          />

          {/* Web Search Globe Toggle Button */}
          <button
            onClick={handleToggleSearch}
            className={`p-2 md:p-2.5 rounded-full transition-colors ${
              isSearchActive 
                ? 'text-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/20' 
                : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-white'
            }`}
            title={t.webSearch}
          >
            <Globe className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>

          {/* Micro / Voice Input button */}
          <button 
            onClick={() => setVoiceModalOpen(true)}
            className="p-2 md:p-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-colors flex-shrink-0"
            title="Entrée vocale"
          >
            <Mic className="w-[18px] h-[18px] md:w-5 md:h-5" />
          </button>

          {/* Send / Stop Action Button */}
          {isGenerating ? (
            <button
              onClick={stopGenerating}
              className="bg-neutral-900 dark:bg-white text-white dark:text-black p-2 md:p-2.5 rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all flex-shrink-0 cursor-pointer"
              title={t.stopGenerating}
            >
              <Square className="w-3.5 h-3.5 md:w-4 md:h-4" fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              className={`p-2 md:p-2.5 rounded-full transition-all flex-shrink-0 ${
                input.trim() || attachments.length > 0
                  ? 'bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 cursor-pointer'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-default'
              }`}
              disabled={!input.trim() && attachments.length === 0}
            >
              <ArrowUp className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
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
