import { createStudent, database } from '@udi/database';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { passkey } from 'better-auth/plugins/passkey';

import { keys } from './keys';

export const auth = betterAuth({
  database: drizzleAdapter(database, {
    provider: 'pg',
  }),
  databaseHooks: {
    user: {
      create: {
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
    enabled: true,
  },
  secret: keys.BETTER_AUTH_SECRET,
  plugins: [passkey()],
});
