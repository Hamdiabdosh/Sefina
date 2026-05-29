import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { useState } from 'react';
import { LanguageSwitcher } from '../../../components/LanguageSwitcher';
import { isGoogleSignInEnabled } from '../../../config/env';
import { AppLogo } from '../../../components/AppLogo';
import { BookGoogleSignIn } from '../components/BookGoogleSignIn';
import { BookLoginParticles } from '../components/BookLoginParticles';
import { useAuth } from '../hooks/useAuth';
import { loginSchema, type LoginFormValues } from '../schemas/auth.schemas';
import { getGoogleLoginErrorMessage } from '../utils/googleAuthErrors';
import '../styles/book-login.css';

const BookCorner = ({ dark }: { dark?: boolean }) => (
  <>
    <div className={`book-login-corner book-login-corner--tl${dark ? ' book-login-corner--dark' : ''}`} />
    <div className={`book-login-corner book-login-corner--tr${dark ? ' book-login-corner--dark' : ''}`} />
    <div className={`book-login-corner book-login-corner--bl${dark ? ' book-login-corner--dark' : ''}`} />
    <div className={`book-login-corner book-login-corner--br${dark ? ' book-login-corner--dark' : ''}`} />
  </>
);

export const LoginPage = () => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const {
    login,
    loginWithGoogle,
    isLoggingIn,
    isGoogleLoggingIn,
    loginError,
    googleLoginError,
  } = useAuth();

  const isSubmitting = isLoggingIn || isGoogleLoggingIn;
  const showGoogle = isGoogleSignInEnabled();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const loginErrorMessage =
    loginError &&
    (isAxiosError(loginError) && !loginError.response
      ? 'Cannot reach API. Is the backend running on port 4000?'
      : isAxiosError(loginError) && loginError.response?.status === 429
        ? 'Too many attempts. Wait a few minutes and try again.'
        : t('auth.invalidCredentials'));

  return (
    <div className="book-login-page">
      <BookLoginParticles />
      <LanguageSwitcher variant="book" />

      <div className="book-login-scene">
        <div className="book-login-book">
          <div className="book-login-page-left">
            <div className="book-login-islamic-pattern" aria-hidden />
            <div className="book-login-edge-left" aria-hidden />
            <BookCorner />

            <div className="book-login-left-content">
              <div className="book-login-logo-shell">
                <AppLogo size="lg" className="h-12 w-12" />
              </div>
              <div className="book-login-arabic-text">
                {t('marketing.basmala')}
                <br />
                {t('auth.appNameAr')}
              </div>
              <h1 className="book-login-brand-name">{t('auth.appName')}</h1>
              <p className="book-login-brand-tagline">{t('marketing.heroSubtitle')}</p>

              <div className="book-login-divider-ornament" aria-hidden>
                <div className="book-login-divider-line" />
                <div className="book-login-divider-diamond" />
                <div className="book-login-divider-line" />
              </div>

              <blockquote className="book-login-verse-block">
                <p className="book-login-verse-text">&ldquo;{t('common.blessingQuote')}&rdquo;</p>
                <cite className="book-login-verse-ref not-italic">{t('common.blessingReference')}</cite>
              </blockquote>
            </div>

            <div className="book-login-page-number book-login-page-number--left" aria-hidden>
              I
            </div>
          </div>

          <div className="book-login-spine" aria-hidden>
            <div className="book-login-spine-ornament" />
            <div className="book-login-spine-ornament" />
            <div className="book-login-spine-ornament" />
          </div>

          <div className="book-login-page-right">
            <div className="book-login-page-lines" aria-hidden />
            <div className="book-login-edge-right" aria-hidden />
            <BookCorner dark />

            <form
              className="book-login-right-content"
              onSubmit={handleSubmit((data) => login(data))}
              noValidate
            >
              <div className="book-login-logo-shell book-login-logo-shell--form">
                <AppLogo size="md" className="h-9 w-9" />
              </div>

              <h2 className="book-login-form-title">{t('auth.signIn')}</h2>
              <p className="book-login-form-subtitle">{t('auth.signInHint')}</p>

              <div className="book-login-field-group">
                <label className="book-login-field-label" htmlFor="login-identifier">
                  {t('auth.phoneOrEmail')}
                </label>
                <div className="book-login-field-input-wrap">
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="ustaz.ahmed@gmail.com"
                    className={`book-login-field-input${errors.identifier ? ' book-login-field-input--error' : ''}`}
                    {...register('identifier')}
                  />
                  <span className="book-login-field-icon" aria-hidden>
                    <Mail size={14} />
                  </span>
                </div>
                {errors.identifier && (
                  <p className="book-login-field-error">{errors.identifier.message}</p>
                )}
              </div>

              <div className="book-login-field-group book-login-field-group--second">
                <label className="book-login-field-label" htmlFor="login-password">
                  {t('auth.password')}
                </label>
                <div className="book-login-field-input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••••"
                    className={`book-login-field-input${errors.password ? ' book-login-field-input--error' : ''}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="book-login-field-icon book-login-toggle-pass"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="book-login-field-error">{errors.password.message}</p>
                )}
              </div>

              <Link to="/forgot-password" className="book-login-forgot-link">
                {t('auth.forgotPassword')}
              </Link>

              {loginErrorMessage && (
                <p className="book-login-alert" role="alert">
                  {loginErrorMessage}
                </p>
              )}

              <button type="submit" disabled={isSubmitting} className="book-login-sign-in-btn">
                {isLoggingIn ? (
                  <span className="book-login-spinner" aria-hidden />
                ) : (
                  <>
                    <span aria-hidden>→</span>
                    {t('auth.signIn').toUpperCase()}
                  </>
                )}
              </button>

              {showGoogle && (
                <>
                  <div className="book-login-or-divider" aria-hidden>
                    <div className="book-login-or-line" />
                    <span className="book-login-or-text">{t('auth.orContinueWith')}</span>
                    <div className="book-login-or-line" />
                  </div>

                  {googleLoginError && (
                    <p className="book-login-alert" role="alert">
                      {getGoogleLoginErrorMessage(googleLoginError, t)}
                    </p>
                  )}

                  <BookGoogleSignIn onCredential={loginWithGoogle} disabled={isSubmitting} />
                </>
              )}
            </form>

            <p className="book-login-page-footer">{t('auth.version')}</p>
            <div className="book-login-page-number book-login-page-number--right" aria-hidden>
              II
            </div>
          </div>
        </div>

        <div className="book-login-book-shadow" aria-hidden />
      </div>
    </div>
  );
};
