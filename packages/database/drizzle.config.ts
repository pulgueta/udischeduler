import { defineConfig } from 'drizzle-kit';

import { keys } from './keys';

export default defineConfig({
  dialect: 'postgresql',
  schema: './schemas',
  out: './drizzle',
  casing: 'snake_case',
  verbose: true,
  strict: true,
  dbCredentials: {
    url: keys.DATABASE_URL,
  },
});
