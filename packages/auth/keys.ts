import { createEnv } from '@t3-oss/env-core';
import { string } from 'zod';

export const keys = createEnv({
  server: {
    BASE_URL: string().min(1).url(),
    BETTER_AUTH_SECRET: string().min(1),
    DATABASE_URL: string().min(1).url(),
    GOOGLE_CLIENT_ID: string().min(1),
    GOOGLE_CLIENT_SECRET: string().min(1),
    GOOGLE_CAPTCHA_SECRET_KEY: string().min(1),
  },
  clientPrefix: 'PUBLIC_',
  client: {
    PUBLIC_BASE_URL: string().min(1).url(),
    PUBLIC_GOOGLE_CLIENT_ID: string().min(1),
    PUBLIC_CAPTCHA_SITE_KEY: string().min(1),
  },
  runtimeEnv: {
    BASE_URL: process.env.BASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_CAPTCHA_SECRET_KEY: process.env.GOOGLE_CAPTCHA_SECRET_KEY,
    PUBLIC_BASE_URL: process.env.PUBLIC_BASE_URL,
    PUBLIC_GOOGLE_CLIENT_ID: process.env.PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_CAPTCHA_SITE_KEY: process.env.PUBLIC_CAPTCHA_SITE,
  },
  emptyStringAsUndefined: true,
});
