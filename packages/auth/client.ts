import { oneTapClient, passkeyClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { keys } from '@/keys';

export const { signIn, signOut, signUp, useListPasskeys, useSession, oneTap } =
  createAuthClient({
    baseURL: keys.PUBLIC_BASE_URL,
    plugins: [
      passkeyClient(),
      oneTapClient({ clientId: keys.PUBLIC_GOOGLE_CLIENT_ID }),
    ],
  });
