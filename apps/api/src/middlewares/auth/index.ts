import { auth } from '@udi/auth/server';
import { cors } from 'hono/cors';
import { createMiddleware } from 'hono/factory';

import { keys } from '@/keys';

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set('user', null);
    c.set('session', null);

    return next();
  }

  c.set('user', session.user);
  c.set('session', session.session);

  return next();
});

export const corsMiddleware = cors({
  origin: [keys.ALLOWED_ORIGIN],
  allowHeaders: ['Authorization', 'Content-Type'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  exposeHeaders: ['Content-Length'],
  maxAge: 600,
  credentials: true,
});
