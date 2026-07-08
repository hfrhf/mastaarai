'use client';

import React from 'react';
import { Message } from '../types/chat';
import MessageItem from './MessageItem';
import { useScroll } from '../hooks/useScroll';
import { ArrowDown } from 'lucide-react';
import { useChat } from '../context/ChatContext';

interface MessageListProps {
  messages: Message[];
}

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { settings } = useChat();
  const lastMsg = messages[messages.length - 1];
  const scrollDep = [messages.length, lastMsg?.content, lastMsg?.status];
  
  const { scrollRef, isAtBottom, scrollToBottom } = useScroll(scrollDep);
  const isRTL = settings.language === 'ar';

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth relative w-full h-full"
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        {messages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isLast={index === messages.length - 1}
          />
        ))}
      </div>

      {/* Floating Scroll to Bottom Arrow */}
      {!isAtBottom && (
        <button
          onClick={() => scrollToBottom('smooth')}
          className={`absolute bottom-28 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 p-2 rounded-full shadow-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors z-20 cursor-pointer flex items-center justify-center ${
            isRTL ? 'left-6' : 'right-6'
          }`}
          title="Scroll to bottom"
        >
          <ArrowDown size={16} />
        </button>
      )}
    </div>
  );
};
export default MessageList;
