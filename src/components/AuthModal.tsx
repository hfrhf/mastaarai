'use client';

import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, addToast, t, settings } = useChat();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    if (!supabase) {
      addToast('Supabase client is not configured.', 'error');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        addToast(t.loginSuccess, 'success');
        setAuthModalOpen(false);
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });
        if (error) throw error;
        addToast(t.registerSuccess, 'success');
        setIsLogin(true); // Switch to login after signup
      }
    } catch (error: any) {
      console.error(error);
      addToast(error.message || t.errorOccurred, 'error');
    } finally {
      setLoading(false);
    }
  };

  const isRTL = settings.language === 'ar';

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in"
      onClick={() => setAuthModalOpen(false)}
    >
      <div 
        className="bg-white dark:bg-[#1e1e1e] border border-neutral-200 dark:border-neutral-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 md:p-8 relative text-neutral-900 dark:text-neutral-100" 
        onClick={(e) => e.stopPropagation()}
        style={{ direction: isRTL ? 'rtl' : 'ltr' }}
      >
        {/* Close Button */}
        <button 
          className="absolute top-4 right-4 p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          onClick={() => setAuthModalOpen(false)}
        >
          <X size={18} />
        </button>

        {/* Header Title */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 text-xl shadow-inner animate-pulse">
            <Sparkles size={20} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {isLogin ? t.login : t.signUp}
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mt-1">
            {isLogin 
              ? (isRTL ? 'سجل الدخول لحفظ سحابي لمحادثاتك' : 'Log in to securely backup your chats')
              : (isRTL ? 'أنشئ حساباً جديداً لبدء مزامنة بياناتك' : 'Create an account to synchronize your data')
            }
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-neutral-500">{t.email}</label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-neutral-400 ${isRTL ? 'right-3' : 'left-3'}`}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className={`w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isRTL ? 'pr-10' : 'pl-10'
                }`}
              />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-xs text-neutral-500">{t.password}</label>
            <div className="relative">
              <span className={`absolute inset-y-0 flex items-center text-neutral-400 ${isRTL ? 'right-3' : 'left-3'}`}>
                <Lock size={16} />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-2.5 text-sm text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isRTL ? 'pr-10 pl-10' : 'pl-10 pr-10'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute inset-y-0 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-white ${
                  isRTL ? 'left-3' : 'right-3'
                }`}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-black rounded-xl font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 mt-4"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
            ) : (
              isLogin ? t.login : t.signUp
            )}
          </button>
        </form>

        {/* Switch Login / Sign Up options */}
        <div className="text-center mt-6 text-xs text-neutral-500">
          <span>{isLogin ? t.dontHaveAccount : t.alreadyHaveAccount} </span>
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline bg-transparent border-none cursor-pointer"
          >
            {isLogin ? t.signUp : t.login}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AuthModal;
