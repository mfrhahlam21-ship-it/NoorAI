import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogOut, User, Mail, Calendar, Shield, Smartphone, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import SubscriptionStatusCard from './SubscriptionStatusCard';

interface AccountPageProps {
  onClose?: () => void;
}

export default function AccountPage({ onClose }: AccountPageProps) {
  const { user, subscription, logout, isLoading } = useAuth();
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    await logout();
    setLogoutLoading(false);
    onClose?.();
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-[#111115] border border-white/10 rounded-lg sm:rounded-2xl shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#111115] border-b border-white/10 p-3 sm:p-6 flex items-center justify-between z-10">
          <h1 className="text-lg sm:text-2xl font-black text-white flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-[#00ffcc] to-[#ff00ff]">
              <User size={20} className="sm:size-24 text-black" />
            </div>
            <span className="truncate">حسابي</span>
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl sm:text-2xl flex-shrink-0"
          >
            ✕
          </button>
        </div>

        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* User Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#111115] border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-[#00ffcc]" />
              معلومات الحساب
            </h2>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-1">الاسم</p>
                <p className="text-white font-medium">{user.name}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Mail size={16} />
                  البريد الإلكتروني
                </p>
                <p className="text-white font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                  <Calendar size={16} />
                  تاريخ الانضمام
                </p>
                <p className="text-white font-medium">
                  {new Date(user.created_at).toLocaleDateString('ar-SA')}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Subscription Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Shield size={20} className="text-[#ff00ff]" />
              حالة الاشتراك
            </h2>
            <SubscriptionStatusCard />
          </motion.div>

          {/* Devices */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#1a1a2e] to-[#111115] border border-white/10 rounded-xl p-6"
          >
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Smartphone size={20} className="text-[#00ffcc]" />
              الأجهزة المتصلة
            </h2>

            <p className="text-gray-400 text-sm mb-4">
              تتبع جميع الأجهزة التي تدخل حسابك
            </p>

            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-[#00ffcc]/20 mt-1">
                  <Smartphone size={18} className="text-[#00ffcc]" />
                </div>
                <div>
                  <p className="font-medium text-white">هذا الجهاز</p>
                  <p className="text-xs text-gray-400">
                    آخر تسجيل دخول: الآن
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex gap-3"
          >
            <AlertCircle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-400 text-sm mb-1">ملاحظة أمان</p>
              <p className="text-yellow-300/80 text-sm">
                لا تشارك بيانات حسابك مع أي شخص. نحن لن نطلب منك كلمة المرور عبر البريد الإلكتروني.
              </p>
            </div>
          </motion.div>

          {/* Logout Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            disabled={logoutLoading || isLoading}
            className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 font-bold py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            {logoutLoading ? 'جاري تسجيل الخروج...' : 'تسجيل الخروج'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
