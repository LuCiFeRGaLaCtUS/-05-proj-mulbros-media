import { useStytchSession, useStytchUser, useStytch } from '@stytch/react';

export const useAuth = () => {
  const { session, isInitialized } = useStytchSession();
  const { user } = useStytchUser();
  const stytchClient = useStytch();

  const signOut = async () => {
    await stytchClient.session.revoke();
    [
      'mulbros_openai_key',
      'mulbros_settings',
      'mulbros_notifications',
      'mulbros_integration_toggles',
      'mulbros_theme',
    ].forEach(k => localStorage.removeItem(k));
  };

  return {
    session,           // truthy when logged in
    user,              // stytch user object — use user.user_id as identifier
    loading: !isInitialized,
    signOut,
  };
};
