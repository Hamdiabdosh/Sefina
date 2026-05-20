import { isAxiosError } from 'axios';

export const getGoogleLoginErrorMessage = (
  error: unknown,
  t: (key: string) => string
): string => {
  if (isAxiosError(error) && !error.response) {
    return 'Cannot reach API. Is the backend running on port 4000?';
  }

  const code = isAxiosError(error)
    ? (error.response?.data as { error?: { code?: string } })?.error?.code
    : undefined;

  switch (code) {
    case 'GOOGLE_ACCOUNT_NOT_FOUND':
      return t('auth.googleAccountNotFound');
    case 'INVALID_GOOGLE_TOKEN':
      return t('auth.googleSignInFailed');
    case 'GOOGLE_NOT_CONFIGURED':
      return t('auth.googleNotConfigured');
    case 'RATE_LIMITED':
      return 'Too many attempts. Wait a few minutes and try again.';
    default:
      return t('auth.googleSignInFailed');
  }
};
