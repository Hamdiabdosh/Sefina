/** Google OAuth client ID for Sign in with Google (public; safe in frontend bundle). */
export const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '';

export const isGoogleSignInEnabled = (): boolean => googleClientId.length > 0;
