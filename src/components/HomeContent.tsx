'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import { SettingsModal } from './SettingsModal';
import { AuthModal } from './AuthModal';
import { ToastContainer } from './Toast';
import { useChat } from '../context/ChatContext';
import { X } from 'lucide-react';

export default function HomeContent() {
  const { addToast, settings } = useChat();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  // Auto-collapse sidebar on smaller screens on load/resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize(); // run on load
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSimulateUpgrade = () => {
    setIsPremium(true);
    setUpgradeModalOpen(false);
    
    const isAr = settings.language === 'ar';
    const upgradeMsg = isAr
      ? "تهانينا! أنت الآن عضو في Mastaar Plus! ✨ تم ترقية حسابك بنجاح."
      : "Félicitations ! Vous êtes maintenant membre Mastaar Plus ! ✨ Votre compte est à niveau !";
      
    addToast(upgradeMsg, 'success');
  };

  const isAr = settings.language === 'ar';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-[#171717]">
      <Sidebar 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isPremium={isPremium}
        onUpgrade={() => setUpgradeModalOpen(true)}
      />
      <ChatWindow 
        onOpenSettings={() => setIsSettingsOpen(true)} 
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        isPremium={isPremium}
        onUpgrade={() => setUpgradeModalOpen(true)}
      />
      
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AuthModal />
      <ToastContainer />

      {/* MODAL UPGRADE */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4" onClick={() => setUpgradeModalOpen(false)}>
          <div className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 max-w-md w-full rounded-2xl p-6 relative shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setUpgradeModalOpen(false)} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-900 dark:hover:text-white">
              <X size={20} />
            </button>
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 text-xl">✨</div>
              <h3 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">
                {isAr ? 'الترقية إلى Mastaar Plus' : 'Passer à Mastaar Plus'}
              </h3>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6">
                {isAr 
                  ? 'تمتع بسرعات فائقة، وأولوية الوصول لأحدث الميزات ونماذج الذكاء الاصطناعي مع معالجة ذكية.' 
                  : 'Bénéficiez des vitesses ultra-rapides, d\'un accès prioritaire aux nouveaux modèles mastaar.ai et du générateur d\'images HD.'
                }
              </p>
              
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 text-left border border-neutral-200 dark:border-neutral-800 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-neutral-900 dark:text-white">Mastaar Plus</span>
                  <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">19,99 $ / {isAr ? 'شهر' : 'mois'}</span>
                </div>
                <ul className={`text-xs text-neutral-500 dark:text-neutral-400 space-y-1.5 list-disc ${isAr ? 'pr-4' : 'pl-4'}`}>
                  <li>{isAr ? 'وصول غير محدود لنموذج Kimi K2.6' : 'Accès illimité à mastaar.ai 4o'}</li>
                  <li>{isAr ? 'معالجة نصوص فائقة السرعة والاستجابة' : 'Création d\'images par Gemini Imagen-4.0'}</li>
                  <li>{isAr ? 'تحويل النصوص إلى كلام منطوق فائق الواقعية' : 'Synthèse vocale fluide et ultra-réaliste'}</li>
                </ul>
              </div>
              
              <button 
                onClick={handleSimulateUpgrade} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-semibold text-white transition-colors cursor-pointer"
              >
                {isAr ? 'اشترك الآن' : 'S\'abonner maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
