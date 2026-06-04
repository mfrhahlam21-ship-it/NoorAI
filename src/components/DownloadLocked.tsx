import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { Lock, Clock, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface DownloadLockedProps {
  onUpgradeClick?: () => void;
}

export default function DownloadLocked({ onUpgradeClick }: DownloadLockedProps) {
  const { subscription } = useAuth();

  if (!subscription) {
    return null;
  }

  const today = new Date();
  const endDate = new Date(subscription.end_date);
  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpired = daysRemaining <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/30 rounded-lg sm:rounded-xl p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
        <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/20 flex-shrink-0">
          <Lock className="text-red-400" size={20} className="sm:size-24" />
        </div>

        <div className="flex-1 w-full">
          <h3 className="font-bold text-white text-base sm:text-lg mb-2">
            {isExpired ? '🔒 الاشتراك منتهي' : '⏰ النسخة التجريبية'}
          </h3>

          <p className="text-gray-300 text-xs sm:text-sm mb-4">
            {isExpired
              ? 'لقد انتهى اشتراكك. لا يمكنك الآن تحميل أو استخدام برنامج Electron.'
              : `لديك ${daysRemaining} أيام متبقية من النسخة التجريبية. قم بالترقية للمتابعة بعد انتهاء الفترة التجريبية.`}
          </p>

          <div className="bg-white/5 rounded-lg p-2.5 sm:p-3 mb-4">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400 mb-1">
              <Clock size={14} />
              <span>تاريخ الانتهاء</span>
            </div>
            <p className="font-medium text-white text-sm sm:text-base">
              {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onUpgradeClick}
            className="w-full bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] text-black font-bold py-2 sm:py-3 rounded-lg hover:shadow-lg hover:shadow-[#00ffcc]/50 transition-shadow text-sm sm:text-base"
          >
            💳 ترقية الآن
          </motion.button>
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 p-2.5 sm:p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
        <AlertCircle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-yellow-300">
          تحتاج إلى اشتراك نشط للوصول إلى جميع الميزات
        </p>
      </div>
    </motion.div>
  );
}
