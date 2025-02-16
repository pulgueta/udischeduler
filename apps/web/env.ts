import { keys as cms } from '@udi/cms/keys';
import { keys as email } from '@udi/email/keys';
import { keys as flags } from '@udi/feature-flags/keys';
import { keys as core } from '@udi/next-config/keys';
import { keys as observability } from '@udi/observability/keys';
import { keys as rateLimit } from '@udi/rate-limit/keys';
import { keys as security } from '@udi/security/keys';
import { createEnv } from '@t3-oss/env-nextjs';

export const env = createEnv({
  extends: [
    cms(),
    core(),
    email(),
    observability(),
    flags(),
    security(),
    rateLimit(),
  ],
  server: {},
  client: {},
  runtimeEnv: {},
});
