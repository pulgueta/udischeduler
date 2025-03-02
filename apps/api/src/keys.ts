import { createEnv } from '@t3-oss/env-core';
import { coerce, string } from 'zod';

export const keys = createEnv({
  server: {
    ALLOWED_ORIGIN: string().min(1).url(),
    BASE_URL: string().min(1).url(),
    PORT: coerce.number().optional().default(3008),
  },
  runtimeEnv: {
    BASE_URL: process.env.BASE_URL,
    ALLOWED_ORIGIN: process.env.ALLOWED_ORIGIN,
    PORT: process.env.PORT,
  },
  emptyStringAsUndefined: true,
});
