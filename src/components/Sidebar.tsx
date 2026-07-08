'use client';

import React from 'react';
import { useChat } from '../context/ChatContext';
import { Trash2, Search, Archive, Briefcase, Grid, Code, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  onOpenSettings: () => void;
  isCollapsed: boolean;
  onToggle: () => void;
  isPremium: boolean;
  onUpgrade: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  onOpenSettings, 
  isCollapsed, 
  onToggle, 
  isPremium,
  onUpgrade
}) => {
  const { 
    chats, 
    activeChatId, 
    selectChat, 
    deleteChat, 
    createNewChat,
    settings,
    t,
    user,
    setAuthModalOpen,
    logout
  } = useChat();

  const isRTL = settings.language === 'ar';

  // Calculate profile card information
  const isLoggedIn = !!user;
  const username = isLoggedIn ? user.email.split('@')[0] : (isRTL ? 'مستخدم ضيف' : 'Guest');
  const initials = isLoggedIn ? user.email.substring(0, 2).toUpperCase() : 'G';

  return (
    <aside 
      id="sidebar" 
      className={`${
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      } flex-shrink-0 bg-[#0d0d0d] text-[#ececec] flex flex-col justify-between border-r border-transparent dark:border-neutral-800 transition-all duration-300 relative z-30 h-full`}
    >
      {/* Sidebar Top Header & Navigation */}
      <div className={`flex flex-col flex-1 overflow-y-auto pt-3.5 ${isCollapsed ? 'px-1.5' : 'px-3.5'}`}>
        {/* Sidebar Header & Toggle Button */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`} id="sidebar-header">
          {!isCollapsed && (
            <span className="font-semibold text-lg tracking-tight flex items-center gap-2 select-none">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              mastaar.ai
            </span>
          )}
          <button 
            onClick={onToggle} 
            className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-200 transition-colors" 
            title={isCollapsed ? (isRTL ? "افتح القائمة الجانبية" : "Open sidebar") : (isRTL ? "أغلق القائمة الجانبية" : "Close sidebar")}
          >
            <svg 
              className={`w-5 h-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Nouveau Chat Button */}
        <button 
          onClick={() => createNewChat()} 
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-3' : 'justify-between p-3'
          } w-full bg-neutral-900 hover:bg-neutral-800 text-sm font-medium rounded-lg mb-2 transition-all group`} 
          id="new-chat-btn"
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-neutral-400 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {!isCollapsed && <span className="sidebar-text">{t.newChat}</span>}
          </div>
          {!isCollapsed && (
            <kbd className="hidden md:inline-block text-[10px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded border border-neutral-700">⌘N</kbd>
          )}
        </button>

        {/* Navigation Links */}
        <nav className="space-y-1 mb-6 text-sm" id="nav-links">
          <button 
            onClick={onOpenSettings} 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white transition-colors`}
          >
            <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{t.searchChats}</span>}
          </button>
          
          <div 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-colors`}
          >
            <Archive className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{isRTL ? "المكتبة" : "Bibliothèque"}</span>}
          </div>

          <div 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-colors`}
          >
            <Briefcase className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{isRTL ? "المشاريع" : "Projets"}</span>}
          </div>

          <div 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-colors`}
          >
            <Grid className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{isRTL ? "التطبيقات" : "Applications"}</span>}
          </div>

          <div 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-colors`}
          >
            <Code className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{isRTL ? "محرر الأكواد" : "Codex"}</span>}
          </div>

          <div 
            className={`flex items-center ${
              isCollapsed ? 'justify-center p-2.5' : 'gap-3 p-2.5'
            } w-full hover:bg-neutral-900 rounded-lg text-neutral-300 hover:text-white cursor-pointer transition-colors`}
            onClick={onOpenSettings}
          >
            <Settings className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            {!isCollapsed && <span className="sidebar-text">{t.settings}</span>}
          </div>
        </nav>

        {/* Recents Chat History Section */}
        {!isCollapsed && (
          <div className="mt-4" id="recent-section">
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-500 uppercase tracking-wider px-2.5 mb-2 sidebar-text">
              <span>{isRTL ? "الأخيرة" : "Récents"}</span>
            </div>
            
            <div className="space-y-0.5 text-sm max-h-[260px] overflow-y-auto pr-1">
              {chats.length === 0 ? (
                <div className="text-xs text-neutral-600 px-2.5 py-1">{t.noConversations}</div>
              ) : (
                chats.map((chat) => {
                  const isActive = chat.id === activeChatId;
                  return (
                    <div 
                      key={chat.id}
                      onClick={() => selectChat(chat.id)}
                      className={`flex items-center justify-between w-full p-2 rounded-lg text-neutral-300 hover:text-white font-medium tracking-wide transition-colors cursor-pointer group ${
                        isActive ? 'bg-neutral-950 text-white' : 'hover:bg-neutral-950'
                      }`}
                    >
                      <span className="truncate flex-1 text-right" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
                        {chat.title}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChat(chat.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-800 rounded text-neutral-500 hover:text-red-500 transition-all ml-1"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Bottom (Profile & Level Up) */}
      <div 
        className={`bg-[#0d0d0d] border-t border-neutral-900 flex flex-col gap-2 ${
          isCollapsed ? 'p-1.5' : 'p-3'
        }`} 
        id="sidebar-footer"
      >
        <div 
          onClick={() => {
            if (!isLoggedIn) {
              setAuthModalOpen(true);
            }
          }}
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-1.5' : 'justify-between p-2'
          } rounded-lg hover:bg-neutral-900 transition-colors cursor-pointer group`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`w-8 h-8 rounded-full ${
              isLoggedIn 
                ? (isPremium ? 'bg-gradient-to-tr from-amber-400 to-orange-500' : 'bg-fuchsia-700') 
                : 'bg-neutral-700'
            } flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}>
              {initials}
            </div>
            {!isCollapsed && (
              <div className="flex flex-col text-left overflow-hidden sidebar-text">
                <span className="font-medium text-sm text-neutral-200 group-hover:text-white truncate">
                  {username}
                </span>
                <span className="text-[11px] text-neutral-500">
                  {isLoggedIn ? (isPremium ? 'Plus' : 'Free') : (isRTL ? 'ضيف' : 'Guest')}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {isLoggedIn ? (
                <button 
                  onClick={logout}
                  className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-red-500 transition-colors"
                  title={t.logout}
                >
                  <LogOut size={14} />
                </button>
              ) : (
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="px-2.5 py-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-full transition-colors"
                >
                  {t.login}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
