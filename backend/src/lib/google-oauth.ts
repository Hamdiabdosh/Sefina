import { env, isGoogleOAuthConfigured } from "../config/env";

type GoogleTokenInfo = {
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  error?: string;
};

/** Verifies a Google ID token and returns the user's email. */
export const verifyGoogleIdToken = async (
  credential: string
): Promise<{ email: string } | null> => {
  if (!isGoogleOAuthConfigured()) {
    return null;
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );

  const data = (await response.json()) as GoogleTokenInfo;
  if (!response.ok || data.error || !data.email) {
    return null;
  }

  if (data.aud !== env.GOOGLE_CLIENT_ID) {
    return null;
  }

  const emailVerified =
    data.email_verified === true || data.email_verified === "true";
  if (!emailVerified) {
    return null;
  }

  return { email: data.email.toLowerCase() };
};
