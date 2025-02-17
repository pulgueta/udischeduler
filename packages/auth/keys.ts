import { createEnv } from '@t3-oss/env-core';
import { string } from 'zod';

export const keys = createEnv({
  server: {
    BETTER_AUTH_SECRET: string().min(1),
    DATABASE_URL: string().min(1).url(),
  },
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_BASE_URL: string().min(1).url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
  },
  emptyStringAsUndefined: true,
});
