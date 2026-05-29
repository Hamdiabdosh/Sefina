import { useEffect, useRef } from 'react';
import { googleClientId, isGoogleSignInEnabled } from '../../../config/env';

type GoogleSignInButtonProps = {
  onCredential: (credential: string) => void;
  disabled?: boolean;
  /** Transparent overlay on a custom-styled sign-in control. */
  overlay?: boolean;
};

/** GSI initialize() must run once per page load; StrictMode and re-renders must not repeat it. */
let gsiInitializedForClientId: string | null = null;

const ensureGsiInitialized = (onCredential: (credential: string) => void) => {
  if (!window.google?.accounts?.id) {
    return false;
  }

  const skippedInit = gsiInitializedForClientId === googleClientId;
  if (!skippedInit) {
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      auto_select: false,
      callback: (response) => {
        if (response.credential) {
          onCredential(response.credential);
        }
      },
    });
    gsiInitializedForClientId = googleClientId;
  }

  return true;
};

export const GoogleSignInButton = ({ onCredential, disabled, overlay }: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!isGoogleSignInEnabled() || disabled || !containerRef.current) {
      return;
    }

    const renderButton = () => {
      const container = containerRef.current;
      if (!container || !ensureGsiInitialized((credential) => onCredentialRef.current(credential))) {
        return;
      }

      container.innerHTML = '';
      window.google!.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: container.offsetWidth > 0 ? container.offsetWidth : 300,
        shape: 'pill',
      });
    };

    if (window.google?.accounts?.id) {
      renderButton();
      return;
    }

    const script = document.querySelector<HTMLScriptElement>(
      'script[src*="accounts.google.com/gsi/client"]'
    );
    if (!script) {
      return;
    }

    script.addEventListener('load', renderButton);
    return () => script.removeEventListener('load', renderButton);
  }, [disabled]);

  if (!isGoogleSignInEnabled()) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={
        overlay
          ? `absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-0 ${disabled ? 'pointer-events-none' : ''}`
          : `flex min-h-[44px] w-full justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`
      }
    />
  );
};
