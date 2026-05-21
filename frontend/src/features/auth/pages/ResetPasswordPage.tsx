import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../../../components/AppLogo';
import { GeometricPattern } from '../../../components/GeometricPattern';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { Lock, Check, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { axiosInstance } from '../../../lib/axios';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas/auth.schemas';

export const ResetPasswordPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const search = useSearch({ from: '/reset-password' });
  const token = search.token?.trim() ?? '';
  const hasToken = token.length >= 10;
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password') ?? '';

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!hasToken) {
      setError(t('auth.resetError'));
      return;
    }
    setError(null);
    try {
      await axiosInstance.post('/api/v1/auth/password-reset/confirm', {
        token,
        newPassword: data.password,
      });
      setIsSuccess(true);
      setTimeout(() => navigate({ to: '/login' }), 3000);
    } catch {
      setError(t('auth.resetError'));
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 10 ? 2 : 3;

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-white rounded-[32px] border-[6px] border-black/5 overflow-hidden shadow-xl">
        <div className="bg-teal-400 p-6 pt-8 relative overflow-hidden text-white">
          <GeometricPattern />
          <div className="relative z-10">
            <LanguageSwitcher />
            <AppLogo size="md" tone="light" className="mb-3 h-12 w-12 drop-shadow-sm" />
            <h1 className="text-[15px] font-medium mb-0.5">{t('auth.setPassword')}</h1>
          </div>
        </div>

        <div className="p-6 pt-8 pb-10 bg-cream">
          {!hasToken && !isSuccess ? (
            <div className="text-center">
              <AlertCircle size={28} className="mx-auto mb-3 text-danger-text" />
              <p className="text-sm text-danger-text mb-4">{t('auth.missingToken')}</p>
              <Link to="/forgot-password" className="text-sm text-teal-600 font-medium hover:underline">
                {t('auth.sendResetLink')}
              </Link>
            </div>
          ) : !isSuccess ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="mb-4">
                <label className="field-label">{t('auth.newPassword')}</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
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

              <div className="flex gap-1 mb-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`h-[3px] flex-1 rounded-full ${i < strength ? 'bg-teal-400' : 'bg-cream-dark'}`}
                  />
                ))}
              </div>

              <div className="mb-6">
                <label className="field-label">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <input type="password" {...register('confirmPassword')} className="field-input pr-10" />
                  {watch('confirmPassword') && watch('confirmPassword') === password && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400" size={16} />
                  )}
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-danger-text mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              {error && <p className="text-xs text-danger-text mb-4">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary mb-4">
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={18} />
                    {t('auth.setPassword')}
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-success-bg rounded-xl p-5 text-center mb-6">
              <ShieldCheck size={28} className="mx-auto mb-3 text-success-text" />
              <p className="text-sm font-medium text-success-text">{t('auth.passwordUpdated')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
