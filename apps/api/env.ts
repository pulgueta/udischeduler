import { keys as analytics } from '@udi/analytics/keys';
import { keys as auth } from '@udi/auth/keys';
import { keys as database } from '@udi/database/keys';
import { keys as email } from '@udi/email/keys';
import { keys as core } from '@udi/next-config/keys';
import { keys as observability } from '@udi/observability/keys';
import { keys as payments } from '@udi/payments/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    core(),
    database(),
    email(),
    observability(),
    payments(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
