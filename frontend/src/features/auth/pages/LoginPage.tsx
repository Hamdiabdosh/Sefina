import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { GeometricPattern } from '../../../components/GeometricPattern';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { Building2, Eye, EyeOff, LogIn, Mail } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';

export const LoginPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-white rounded-[32px] border-[6px] border-black/5 overflow-hidden shadow-xl">
        <div className="bg-teal-400 p-8 pt-10 relative overflow-hidden text-white">
          <GeometricPattern />
          <div className="relative z-10">
            <LanguageSwitcher />
            <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center mb-4">
              <Building2 size={24} />
            </div>
            <h1 className="text-lg font-medium mb-0.5">{t('auth.appName')}</h1>
            <p className="text-[11px] text-white/70">
              {t('auth.tagline')} · {t('auth.taglineAr')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit((data) => login(data))} className="p-6 pt-8 pb-10 bg-cream">
          <div className="mb-4">
            <label className="field-label">{t('auth.phoneOrEmail')}</label>
            <div className="relative">
              <input
                type="text"
                {...register('identifier')}
                placeholder="ustaz.ahmed@gmail.com"
                className="field-input pr-10"
              />
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-100" size={16} />
            </div>
            {errors.identifier && (
              <p className="text-xs text-danger-text mt-1">{errors.identifier.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="field-label">{t('auth.password')}</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder="••••••••••"
                className="field-input pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-danger-text mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex justify-end mb-6">
            <Link
              to="/forgot-password"
              className="text-xs text-teal-400 hover:text-teal-600 transition-colors"
            >
              {t('auth.forgotPassword')}
            </Link>
          </div>

          {loginError && (
            <p className="text-xs text-danger-text bg-danger-bg p-3 rounded-md mb-4">
              {t('auth.invalidCredentials')}
            </p>
          )}

          <button type="submit" disabled={isLoggingIn} className="btn-primary">
            {isLoggingIn ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                {t('auth.signIn')}
              </>
            )}
          </button>

          <p className="text-[11px] text-muted-foreground text-center mt-6">{t('auth.version')}</p>
        </form>
      </div>
    </div>
  );
};
