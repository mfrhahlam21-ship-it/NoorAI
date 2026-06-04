import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

type AuthPage = 'login' | 'register' | 'reset';

export default function AuthPage() {
  const { login, register, requestPasswordReset, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState<AuthPage>('login');
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirm, setRegisterConfirm] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  // Reset form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    const result = await login(loginEmail, loginPassword);
    if (result.error) {
      setLoginError(result.error);
    } else {
      // Success - will be handled by auth state change
    }
    setLoginLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (registerPassword !== registerConfirm) {
      setRegisterError('كلمات المرور غير متطابقة');
      return;
    }

    if (registerPassword.length < 6) {
      setRegisterError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setRegisterLoading(true);
    const result = await register(registerName, registerEmail, registerPassword);

    if (result.error) {
      setRegisterError(result.error);
    } else {
      setRegisterSuccess(true);
      setTimeout(() => {
        setCurrentPage('login');
        setRegisterSuccess(false);
      }, 2000);
    }
    setRegisterLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    setResetLoading(true);

    const result = await requestPasswordReset(resetEmail);
    if (result.error) {
      setResetError(result.error);
    } else {
      setResetSuccess(true);
      setTimeout(() => {
        setCurrentPage('login');
        setResetSuccess(false);
      }, 3000);
    }
    setResetLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0c] via-[#1a1a2e] to-[#0a0a0c] text-white flex items-center justify-center px-2 sm:px-4 py-4 sm:py-8">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 sm:w-96 sm:h-96 bg-[#00ffcc]/10 blur-[80px] sm:blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 bg-[#ff00ff]/10 blur-[80px] sm:blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {currentPage === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm sm:max-w-md relative z-10"
          >
            <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl">
              {/* Header */}
              <div className="text-center mb-6 sm:mb-8">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-[#00ffcc] to-[#ff00ff] p-[2px] mx-auto mb-3 sm:mb-4">
                  <div className="w-full h-full bg-[#111115] rounded-[6px] flex items-center justify-center">
                    <span className="font-black text-[#00ffcc] text-sm sm:text-base">N</span>
                  </div>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black mb-1">
                  Noor<span className="text-[#00ffcc]">AI</span>
                </h1>
                <p className="text-gray-400 text-xs sm:text-sm">🔐 تسجيل الدخول</p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-3 sm:space-y-4">
                {loginError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
                    {loginError}
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 sm:top-3 text-gray-500" size={16} className="sm:size-18" />
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-white text-sm sm:text-base placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 sm:top-3 text-gray-500" size={16} className="sm:size-18" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 sm:pl-10 pr-9 sm:pr-10 py-2 sm:py-2.5 text-white text-sm sm:text-base placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 sm:top-3 text-gray-500 hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} className="sm:size-18" /> : <Eye size={16} className="sm:size-18" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loginLoading || isLoading}
                  className="w-full bg-[#00ffcc] text-black font-bold py-2 sm:py-2.5 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {loginLoading ? 'جاري التحميل...' : 'دخول'}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-4 sm:mt-6 space-y-2 text-center text-xs sm:text-sm">
                <button
                  onClick={() => setCurrentPage('reset')}
                  className="block w-full text-[#00ffcc] hover:text-[#00ffcc]/80 transition-colors"
                >
                  هل نسيت كلمة المرور؟
                </button>
                <p className="text-gray-500 text-xs">
                  ليس لديك حساب؟{' '}
                  <button
                    onClick={() => setCurrentPage('register')}
                    className="text-[#ff00ff] hover:text-[#ff00ff]/80 transition-colors font-medium"
                  >
                    إنشاء حساب
                  </button>
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {currentPage === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-sm sm:max-w-md relative z-10"
          >
            <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl p-5 sm:p-8 shadow-2xl">
              {/* Header */}
              <button
                onClick={() => setCurrentPage('login')}
                className="mb-4 sm:mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                <span>عودة</span>
              </button>

              <div className="text-center mb-6 sm:mb-8">
                <h1 className="text-xl sm:text-2xl font-black mb-1">إنشاء حساب جديد</h1>
                <p className="text-gray-400 text-xs sm:text-sm">تجربة مجانية لمدة 3 أيام</p>
              </div>

              {registerSuccess && (
                <div className="mb-4 sm:mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm">
                  <CheckCircle size={16} className="sm:size-18 flex-shrink-0" />
                  <span>تم إنشاء الحساب بنجاح! جاري التحويل...</span>
                </div>
              )}

              {/* Register Form */}
              <form onSubmit={handleRegister} className="space-y-3 sm:space-y-4">
                {registerError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm">
                    {registerError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">الاسم</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type="text"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="محمد"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-500 hover:text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={registerConfirm}
                      onChange={(e) => setRegisterConfirm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2.5 text-white placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={registerLoading || isLoading}
                  className="w-full bg-[#ff00ff] text-white font-bold py-2.5 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registerLoading ? 'جاري التحميل...' : 'إنشاء الحساب'}
                </button>
              </form>

              {/* Footer */}
              <p className="mt-4 text-center text-gray-500 text-sm">
                هل لديك حساب بالفعل؟{' '}
                <button
                  onClick={() => setCurrentPage('login')}
                  className="text-[#00ffcc] hover:text-[#00ffcc]/80 transition-colors font-medium"
                >
                  دخول
                </button>
              </p>
            </div>
          </motion.div>
        )}

        {currentPage === 'reset' && (
          <motion.div
            key="reset"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="bg-[#111115]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
              {/* Header */}
              <button
                onClick={() => setCurrentPage('login')}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={16} />
                <span>عودة</span>
              </button>

              <div className="text-center mb-8">
                <h1 className="text-2xl font-black mb-1">استعادة كلمة المرور</h1>
                <p className="text-gray-400 text-sm">أدخل بريدك الإلكتروني لإعادة تعيين كلمة المرور</p>
              </div>

              {resetSuccess && (
                <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg flex items-center gap-2">
                  <CheckCircle size={18} />
                  <span className="text-sm">تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني</span>
                </div>
              )}

              {/* Reset Form */}
              <form onSubmit={handleResetPassword} className="space-y-4">
                {resetError && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
                    {resetError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-gray-600 focus:border-[#00ffcc] focus:outline-none transition-colors"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={resetLoading || isLoading}
                  className="w-full bg-[#00ffcc] text-black font-bold py-2.5 rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resetLoading ? 'جاري الإرسال...' : 'إرسال رابط الإعادة'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
