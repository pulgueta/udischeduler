import { keys } from '@/keys';
import { authRouter } from '@/routes/auth';
import { createApp } from '@/routes/router';
import { studentRouter } from '@/routes/students';

const app = createApp();

const routes = [studentRouter, authRouter] as const;

for (const route of routes) {
  app.route('/', route);
}

export type UDI = typeof routes;

export default {
  port: keys.PORT,
  fetch: app.fetch,
};
