import { passkeyClient } from 'better-auth/plugins/passkey';
import { createAuthClient } from 'better-auth/react';

export const { signIn, signOut, signUp, useListPasskeys, useSession } =
  createAuthClient({
    plugins: [passkeyClient()],
  });
