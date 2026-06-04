import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, type User, type Subscription } from '../lib/supabase';
import bcryptjs from 'bcryptjs';

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isSubscriptionActive: boolean;
  register: (name: string, email: string, password: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
  requestPasswordReset: (email: string) => Promise<any>;
  resetPassword: (token: string, newPassword: string) => Promise<any>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: Check if user is already logged in (via localStorage)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isSupabaseConfigured) {
          setIsLoading(false);
          return;
        }

        const storedUserId = localStorage.getItem('noorai_user_id');
        if (storedUserId) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', storedUserId)
            .single();

          if (data && !error) {
            setUser(data);
            await refreshSubscriptionData(storedUserId);
          } else {
            localStorage.removeItem('noorai_user_id');
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        localStorage.removeItem('noorai_user_id');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const refreshSubscriptionData = async (userId: string) => {
    const { data: subData } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subData) {
      setSubscription(subData);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: 'خدمة قاعدة البيانات غير متاحة. يرجى تكوين Supabase.' };
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { error: 'البريد الإلكتروني مستخدم بالفعل' };
      }

      // Hash password
      const passwordHash = await bcryptjs.hash(password, 10);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert([
          {
            name,
            email,
            password_hash: passwordHash,
            is_active: true
          }
        ])
        .select()
        .single();

      if (createError) {
        return { error: createError.message };
      }

      // Create trial subscription (3 days)
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days

      const { data: subData, error: subError } = await supabase
        .from('subscriptions')
        .insert([
          {
            user_id: newUser.id,
            plan_name: 'NoorAI Trial',
            plan_type: 'trial',
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
          }
        ])
        .select()
        .single();

      if (!subError) {
        setSubscription(subData);
      }

      setUser(newUser);
      localStorage.setItem('noorai_user_id', newUser.id);

      return { user: newUser, subscription: subData };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (!isSupabaseConfigured) {
        return { error: 'خدمة قاعدة البيانات غير متاحة. يرجى تكوين Supabase.' };
      }

      // Get user by email
      const { data: foundUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (findError || !foundUser) {
        return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      // Check password
      const passwordMatch = await bcryptjs.compare(password, foundUser.password_hash);

      if (!passwordMatch) {
        return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }

      if (!foundUser.is_active) {
        return { error: 'الحساب معطل' };
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', foundUser.id);

      setUser(foundUser);
      localStorage.setItem('noorai_user_id', foundUser.id);

      // Fetch subscription
      await refreshSubscriptionData(foundUser.id);

      return { user: foundUser };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const logout = async () => {
    localStorage.removeItem('noorai_user_id');
    setUser(null);
    setSubscription(null);
    return {};
  };

  const requestPasswordReset = async (email: string) => {
    try {
      const { data: foundUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (!foundUser) {
        return { error: 'لم يتم العثور على هذا البريد الإلكتروني' };
      }

      // Generate reset token (simple random string)
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

      const { error: insertError } = await supabase
        .from('password_reset_tokens')
        .insert([
          {
            user_id: foundUser.id,
            token,
            expires_at: expiresAt.toISOString()
          }
        ]);

      if (insertError) {
        return { error: insertError.message };
      }

      // In production: send email with reset link
      console.log(`Reset token for ${email}: ${token}`);

      return { success: true, message: 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const resetPassword = async (token: string, newPassword: string) => {
    try {
      // Verify token
      const { data: resetTokenData, error: tokenError } = await supabase
        .from('password_reset_tokens')
        .select('*')
        .eq('token', token)
        .single();

      if (tokenError || !resetTokenData) {
        return { error: 'رابط إعادة التعيين غير صحيح أو انتهت صلاحيته' };
      }

      if (new Date(resetTokenData.expires_at) < new Date()) {
        return { error: 'انتهت صلاحية رابط إعادة التعيين' };
      }

      // Hash new password
      const passwordHash = await bcryptjs.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: passwordHash })
        .eq('id', resetTokenData.user_id);

      if (updateError) {
        return { error: updateError.message };
      }

      // Delete used token
      await supabase
        .from('password_reset_tokens')
        .delete()
        .eq('id', resetTokenData.id);

      return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
    } catch (error: any) {
      return { error: error.message };
    }
  };

  const refreshSubscription = async () => {
    if (user) {
      await refreshSubscriptionData(user.id);
    }
  };

  const isAuthenticated = !!user;
  const isSubscriptionActive = subscription?.status === 'active' && (!subscription?.end_date || new Date(subscription.end_date) > new Date());

  return (
    <AuthContext.Provider
      value={{
        user,
        subscription,
        isLoading,
        isAuthenticated,
        isSubscriptionActive,
        register,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
        refreshSubscription
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
