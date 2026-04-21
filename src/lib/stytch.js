import { StytchUIClient } from '@stytch/vanilla-js';

export const stytch = new StytchUIClient(import.meta.env.VITE_STYTCH_PUBLIC_TOKEN);
