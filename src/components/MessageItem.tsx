'use client';

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { useChat } from '../context/ChatContext';
import { Message } from '../types/chat';
import CodeBlock from './CodeBlock';
import { Edit, RotateCcw, Play, Check, Eye, EyeOff, Globe, Volume2, Copy } from 'lucide-react';

interface MessageItemProps {
  message: Message;
  isLast: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isLast }) => {
  const { 
    settings, 
    editMessage, 
    regenerateMessage, 
    continueGenerating, 
    addToast,
    isGenerating,
    t
  } = useChat();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [showJson, setShowJson] = useState(false);
  const [copied, setCopied] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  // Stop speech if message item is unmounted
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      addToast(t.copiedToast, 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      addToast('Failed to copy message', 'error');
    }
  };

  const handleSpeakResponse = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      addToast('Speech Synthesis not supported in this browser', 'error');
      return;
    }

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Clean text from markdown syntax tags
    const cleanText = message.content
      .replace(/[*#`_\-~>|]/g, '')
      .replace(/\[\d+\]/g, '') // remove citations [1]
      .substring(0, 400);

    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    if (settings.language === 'ar') {
      utterance.lang = 'ar-SA';
    } else {
      utterance.lang = message.content.match(/[a-zA-Z]/) ? 'en-US' : 'fr-FR';
    }

    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveEdit = async () => {
    if (editText.trim() && editText !== message.content) {
      setIsEditing(false);
      await editMessage(message.id, editText);
    } else {
      setIsEditing(false);
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch (e) {
      return '';
    }
  };

  const isUser = message.role === 'user';
  const modelDisplayName = message.model.split('/').pop() || 'Assistant';

  if (isUser) {
    return (
      <div className="w-full flex justify-end pb-4" id={`msg-${message.id}`}>
        <div className="flex flex-col items-end max-w-[85%]">
          {isEditing ? (
            <div className="edit-textarea-container mt-1">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-2xl p-3 text-[15px] outline-none resize-none focus:ring-1 focus:ring-indigo-500"
                rows={3}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button className="px-3 py-1.5 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" onClick={() => setIsEditing(false)}>{t.cancel}</button>
                <button className="px-3 py-1.5 text-xs bg-neutral-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors" onClick={handleSaveEdit}>{t.saveSettings}</button>
              </div>
            </div>
          ) : (
            <div className="group relative">
              <div className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-3xl text-[15px] leading-relaxed shadow-sm flex flex-col gap-2">
                {/* Attachments inside user message bubble */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-1.5 justify-end">
                    {message.attachments.map((att, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-2 p-1.5 bg-white/40 dark:bg-black/30 rounded-xl border border-white/10 dark:border-black/10 max-w-[180px] shadow-sm select-none"
                      >
                        {att.mimeType.startsWith('image/') ? (
                          <img 
                            src={`data:${att.mimeType};base64,${att.base64Data}`} 
                            alt={att.name} 
                            className="w-8 h-8 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-[9px] flex-shrink-0">
                            PDF
                          </div>
                        )}
                        <span className="text-[11px] font-semibold truncate max-w-[100px] text-neutral-800 dark:text-neutral-200">
                          {att.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {message.content && <div>{message.content}</div>}
              </div>
              
              {!isGenerating && (
                <button 
                  onClick={() => { setEditText(message.content); setIsEditing(true); }}
                  className="absolute right-full top-1/2 -translate-y-1/2 mr-2 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Modifier"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Assistant bubble
  return (
    <div className="w-full flex gap-4 justify-start pb-6" id={`msg-${message.id}`}>
      {/* Circle Avatar 'M' */}
      <div className="w-8 h-8 rounded-full bg-indigo-950 border border-indigo-900/50 text-indigo-400 flex items-center justify-center text-xs font-semibold flex-shrink-0 select-none shadow">
        M
      </div>

      <div className="flex-1 max-w-[85%] flex flex-col gap-1">
        <div className="text-xs font-bold text-neutral-500 dark:text-neutral-400">mastaar.ai</div>
        
        {/* Web Search Logs */}
        {message.searchQuery && (
          <div className="web-search-status-wrapper">
            <button 
              className="web-search-header-btn" 
              onClick={() => setSearchExpanded(!searchExpanded)}
              disabled={message.status === 'searching'}
            >
              <Globe size={14} className={message.status === 'searching' ? 'spinning-globe' : ''} />
              <span className="web-search-header-text">
                {message.status === 'searching'
                  ? `${t.searchingWeb} "${message.searchQuery}"`
                  : t.searchFound.replace('{count}', String(message.searchResults?.length || 0))}
              </span>
              {message.searchResults && message.searchResults.length > 0 && (
                <span className="web-search-toggle-indicator">
                  {searchExpanded ? '▲' : '▼'}
                </span>
              )}
            </button>

            {searchExpanded && message.searchResults && message.searchResults.length > 0 && (
              <div className="web-search-results-list">
                {message.searchResults.map((result, idx) => {
                  const domain = getDomain(result.url);
                  return (
                    <a 
                      key={idx} 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="search-result-source-card"
                    >
                      <span className="search-result-index">{idx + 1}</span>
                      <div className="search-result-card-info">
                        <span className="search-result-title">{result.title}</span>
                        <span className="search-result-url">{domain}</span>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Text Markdown Content */}
        <div className="text-[15px] leading-relaxed text-neutral-900 dark:text-neutral-100 response-text-content">
          {message.status === 'thinking' ? (
            <div className="thinking-container">
              <span className="thinking-text">{modelDisplayName} {t.isThinking}</span>
              <div className="thinking-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : message.status === 'searching' ? null : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <CodeBlock
                      language={match[1]}
                      value={String(children).replace(/\n$/, '')}
                      {...props}
                    />
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {message.content || ''}
            </ReactMarkdown>
          )}
        </div>

        {/* Action utility row */}
        {message.status !== 'thinking' && message.status !== 'searching' && (
          <div className="utility-actions flex items-center gap-3 mt-2">
            {/* Copy Button */}
            <button 
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-all"
              onClick={handleCopyMessage}
              title={t.copyMessage}
            >
              {copied ? <Check size={14} className="text-indigo-500" /> : <Copy size={14} />}
            </button>

            {/* Read Loud synthesis speaker */}
            <button 
              className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-all"
              onClick={handleSpeakResponse}
              title="Écouter la réponse"
              style={{ color: speaking ? 'var(--accent-color)' : 'inherit' }}
            >
              <Volume2 size={14} className={speaking ? 'animate-pulse' : ''} />
            </button>

            {/* Regenerate / Continue Actions */}
            {isLast && !isGenerating && (
              <>
                <button 
                  className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white transition-all"
                  onClick={() => regenerateMessage(message.id)} 
                  title={t.regenerate}
                >
                  <RotateCcw size={14} />
                </button>
                {message.status === 'done' && (
                  <button 
                    className="flex items-center gap-1 px-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all font-medium"
                    onClick={() => continueGenerating(message.id)} 
                    title={t.continueGenerating}
                  >
                    <Play size={10} style={{ transform: settings.language === 'ar' ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                    <span>{t.continueGenerating}</span>
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {/* Developer stats panel */}
        {!isUser && settings.developerMode && message.status !== 'thinking' && message.status !== 'searching' && (
          <div className="dev-stats-container">
            <div className="dev-stats-header">
              <span className="dev-stats-title">{t.devInfo}</span>
              <button className="dev-json-btn" onClick={() => setShowJson(!showJson)}>
                {showJson ? <EyeOff size={12} /> : <Eye size={12} />}
                <span>{showJson ? t.hideRaw : t.showRawJson}</span>
              </button>
            </div>

            <div className="dev-stats-grid">
              <div className="dev-stat-item">
                <span className="dev-stat-label">Model:</span>
                <span className="dev-stat-value">{message.model}</span>
              </div>
              <div className="dev-stat-item">
                <span className="dev-stat-label">Latency:</span>
                <span className="dev-stat-value">{message.duration ? `${message.duration}s` : 'N/A'}</span>
              </div>
              <div className="dev-stat-item">
                <span className="dev-stat-label">Est. Tokens:</span>
                <span className="dev-stat-value">{message.tokens || 'N/A'}</span>
              </div>
              <div className="dev-stat-item">
                <span className="dev-stat-label">Speed:</span>
                <span className="dev-stat-value">
                  {message.tokens && message.duration 
                    ? `${Math.round(message.tokens / message.duration)} tok/s` 
                    : 'N/A'}
                </span>
              </div>
            </div>

            {showJson && (
              <pre className="dev-raw-json">
                {JSON.stringify(message, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default MessageItem;
