import { useStytchSession, useStytchUser, useStytch } from '@stytch/react';
import { STORAGE_KEYS } from '../constants';

export const useAuth = () => {
  const { session, isInitialized } = useStytchSession();
  const { user } = useStytchUser();
  const stytchClient = useStytch();

  const signOut = async () => {
    await stytchClient.session.revoke();
    // Wipe all known app-scoped localStorage keys + the legacy underscore
    // theme key so a shared device doesn't leak prefs to the next user.
    const toClear = [
      ...Object.values(STORAGE_KEYS),
      'mulbros_theme',          // legacy split-key key
      'mulbros_notifications',
    ];
    for (const k of toClear) {
      try { localStorage.removeItem(k); } catch { /* noop */ }
    }
    try { sessionStorage.clear(); } catch { /* noop */ }
  };

  return {
    session,           // truthy when logged in
    user,              // stytch user object — use user.user_id as identifier
    loading: !isInitialized,
    signOut,
  };
};
