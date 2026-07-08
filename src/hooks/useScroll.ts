import { useEffect, useRef, useState } from 'react';

export function useScroll(dependencies: any[] = []) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    
    // Check if user is scrolled to near bottom (threshold: 100px)
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
    setIsAtBottom(isNearBottom);
  };

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
    });
    setIsAtBottom(true);
  };

  // Scroll to bottom when dependencies change, only if user was already at the bottom
  useEffect(() => {
    if (isAtBottom) {
      // Small timeout to ensure DOM has rendered new content
      const timer = setTimeout(() => scrollToBottom('auto'), 50);
      return () => clearTimeout(timer);
    }
  }, dependencies);

  // Monitor manual scrolls to show/hide the scroll-to-bottom button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Run check once initially
    checkScroll();

    el.addEventListener('scroll', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
    };
  }, [scrollRef.current]);

  return { scrollRef, isAtBottom, scrollToBottom };
}
