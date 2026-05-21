import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { AppLogo } from '../../../components/AppLogo';
import { GeometricPattern } from '../../../components/GeometricPattern';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { ArrowLeft, Mail, Send, MailCheck } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { axiosInstance } from '../../../lib/axios';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas/auth.schemas';
import { useState } from 'react';

export const ForgotPasswordPage = () => {
  const { t } = useTranslation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setError(null);
    try {
      await axiosInstance.post('/api/v1/auth/password-reset/request', {
        identifier: data.identifier,
      });
      setIsSubmitted(true);
    } catch {
      setIsSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-[360px] bg-white rounded-[32px] border-[6px] border-black/5 overflow-hidden shadow-xl">
        <div className="bg-teal-400 p-6 pt-8 relative overflow-hidden text-white">
          <GeometricPattern />
          <div className="relative z-10">
            <LanguageSwitcher />
            <AppLogo size="md" tone="light" className="mb-3 h-12 w-12 drop-shadow-sm" />
            <h1 className="text-[15px] font-medium mb-0.5">{t('auth.resetTitle')}</h1>
            <p className="text-[11px] text-white/70">{t('auth.resetSubtitle')}</p>
          </div>
        </div>

        <div className="p-6 pt-8 pb-10 bg-cream">
          <Link
            to="/login"
            className="flex items-center gap-2 text-[13px] text-teal-400 font-medium mb-6 hover:text-teal-600"
          >
            <ArrowLeft size={14} />
            {t('auth.backToLogin')}
          </Link>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit(onSubmit)}>
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

              {error && <p className="text-xs text-danger-text mb-4">{error}</p>}

              <button type="submit" disabled={isSubmitting} className="btn-primary mb-4">
                {isSubmitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    {t('auth.sendResetLink')}
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="bg-teal-50 rounded-xl p-5 text-center mb-6 border border-teal-100">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 text-teal-400">
                <MailCheck size={28} />
              </div>
              <p className="text-sm font-medium text-teal-800 mb-1">{t('auth.resetSentTitle')}</p>
              <p className="text-[12px] text-teal-600">{t('auth.resetSentBody')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
