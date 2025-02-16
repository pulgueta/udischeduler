import { keys as analytics } from '@udi/analytics/keys';
import { keys as auth } from '@udi/auth/keys';
import { keys as collaboration } from '@udi/collaboration/keys';
import { keys as database } from '@udi/database/keys';
import { keys as email } from '@udi/email/keys';
import { keys as flags } from '@udi/feature-flags/keys';
import { keys as core } from '@udi/next-config/keys';
import { keys as notifications } from '@udi/notifications/keys';
import { keys as observability } from '@udi/observability/keys';
import { keys as security } from '@udi/security/keys';
import { keys as webhooks } from '@udi/webhooks/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    security(),
    webhooks(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
