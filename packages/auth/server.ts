import { database } from '@udi/database';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';

import { keys } from './keys';

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
  },
  secret: keys.BETTER_AUTH_SECRET,
  plugins: [passkey()],
});
