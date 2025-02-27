import { studentRouter } from '@/routes/booking';
import { createApp } from '@/routes/router';

const app = createApp();

const routes = [studentRouter] as const;

for (const route of routes) {
  app.route('/', route);
}

export type UDI = typeof routes;

export default app;
