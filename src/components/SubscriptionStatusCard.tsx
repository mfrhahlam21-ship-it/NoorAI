import React, { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { Calendar, Clock, AlertCircle, CheckCircle, CreditCard } from 'lucide-react';
import { motion } from 'motion/react';

interface SubscriptionStatus {
  plan: string;
  status: 'active' | 'trial' | 'expired';
  daysRemaining: number;
  startDate: string;
  endDate: string;
}

export default function SubscriptionStatusCard() {
  const { user, subscription } = useAuth();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!subscription) return;

    const today = new Date();
    const endDate = new Date(subscription.end_date);
    const startDate = new Date(subscription.start_date);
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    setStatus({
      plan: subscription.plan_name,
      status: subscription.status as 'active' | 'trial' | 'expired' || 'expired',
      daysRemaining: Math.max(0, daysRemaining),
      startDate: startDate.toLocaleDateString('ar-SA'),
      endDate: endDate.toLocaleDateString('ar-SA'),
    });
  }, [subscription]);

  if (!status) {
    return (
      <div className="bg-[#111115] border border-white/10 rounded-lg p-4 sm:p-6">
        <div className="flex items-center gap-2 text-gray-400 text-sm sm:text-base">
          <Clock size={16} className="sm:size-18" />
          <span>جاري تحميل حالة الاشتراك...</span>
        </div>
      </div>
    );
  }

  const isActive = status.status === 'active' && status.daysRemaining > 0;
  const isTrial = status.status === 'trial' && status.daysRemaining > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-6 backdrop-blur-xl ${
        isActive || isTrial
          ? 'bg-gradient-to-br from-[#00ffcc]/10 to-[#00ffcc]/5 border-[#00ffcc]/30'
          : 'bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
        <div className="flex items-center gap-2 sm:gap-3 w-full">
          {isActive || isTrial ? (
            <div className="p-1.5 sm:p-2 rounded-lg bg-[#00ffcc]/20 flex-shrink-0">
              <CheckCircle className="text-[#00ffcc]" size={20} className="sm:size-24" />
            </div>
          ) : (
            <div className="p-1.5 sm:p-2 rounded-lg bg-red-500/20 flex-shrink-0">
              <AlertCircle className="text-red-400" size={20} className="sm:size-24" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-base break-words">
              {isTrial ? '🎁 نسخة تجريبية' : isActive ? '✅ مشترك نشط' : '❌ الاشتراك منتهي'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 truncate">{status.plan}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="bg-white/5 rounded-lg p-2.5 sm:p-3">
          <p className="text-xs text-gray-500 mb-1">أيام متبقية</p>
          <p className={`text-xl sm:text-2xl font-bold ${isTrial || isActive ? 'text-[#00ffcc]' : 'text-red-400'}`}>
            {status.daysRemaining}
          </p>
        </div>

        <div className="bg-white/5 rounded-lg p-2.5 sm:p-3">
          <p className="text-xs text-gray-500 mb-1">تاريخ الانتهاء</p>
          <p className="text-xs sm:text-sm font-medium text-white break-words">{status.endDate}</p>
        </div>
      </div>

      {isActive || isTrial ? (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} className="text-[#00ffcc]" />
              <p className="text-xs text-gray-400">بدء الاشتراك</p>
            </div>
            <p className="text-sm font-medium text-white">{status.startDate}</p>
          </div>

          {status.daysRemaining <= 3 && isTrial && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
              <p className="text-sm text-yellow-400 flex items-center gap-2">
                <AlertCircle size={16} />
                تنتهي النسخة التجريبية قريبًا!
              </p>
            </div>
          )}

          {isTrial && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] text-black font-bold py-2.5 rounded-lg hover:shadow-lg hover:shadow-[#00ffcc]/50 transition-shadow"
            >
              <CreditCard className="inline mr-2" size={18} />
              ترقية الآن - 0.99$ شهريًا
            </motion.button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle size={16} />
              انتهى اشتراكك. قم بالترقية للمتابعة
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] text-black font-bold py-2.5 rounded-lg hover:shadow-lg hover:shadow-[#00ffcc]/50 transition-shadow"
          >
            <CreditCard className="inline mr-2" size={18} />
            تجديد الاشتراك الآن
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
