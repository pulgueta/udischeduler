import { bookingRouter } from '@/routes/booking';
import { createApp } from '@/routes/router';

const app = createApp();

const routes = [bookingRouter] as const;

for (const route of routes) {
  app.route('/', route);
}

export default app;
