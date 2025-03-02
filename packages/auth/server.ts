import { createStudent, database } from '@udi/database';
import {
  getCacheKey,
  intervalInSeconds,
  requests,
  setCacheKey,
} from '@udi/rate-limit';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { captcha, oneTap, openAPI } from 'better-auth/plugins';
import { passkey } from 'better-auth/plugins/passkey';

import { keys } from './keys';

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
  }),
  socialProviders: {
    google: {
      enabled: true,
      clientId: keys.GOOGLE_CLIENT_ID,
      clientSecret: keys.GOOGLE_CLIENT_SECRET,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => user.email.endsWith('@udi.edu.co'),
        after: async (user) => {
          await createStudent({
            name: user.name,
            email: user.email,
            userId: user.id,
          });
        },
      },
    },
  },
  emailAndPassword: {
    enabled: false,
  },
  baseURL: keys.BASE_URL,
  secret: keys.BETTER_AUTH_SECRET,
  rateLimit: {
    storage: 'secondary-storage',
    customStorage: {
      get: getCacheKey,
      set: setCacheKey,
    },
    max: requests,
    window: intervalInSeconds,
  },
  plugins: [
    passkey(),
    oneTap(),
    captcha({
      provider: 'google-recaptcha',
      secretKey: keys.GOOGLE_CAPTCHA_SECRET_KEY,
      endpoints: ['/login', '/register', '/forgot-password'],
    }),
    openAPI(),
  ],
});

export type User = typeof auth.$Infer.Session.user | null;
export type Session = typeof auth.$Infer.Session.session | null;
