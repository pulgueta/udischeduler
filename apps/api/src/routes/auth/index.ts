import { auth } from '@udi/auth/server';
import { UNAUTHORIZED } from 'stoker/http-status-codes';

import { sessionMiddleware } from '@/middlewares/auth';
import { createRouter } from '@/routes/router';

export const authRouter = createRouter()
  .basePath('/auth')
  .on(['POST', 'GET'], '*', (c) => auth.handler(c.req.raw))
  .get('/session', (c) => {
    const session = c.get('session');
    const user = c.get('user');

    if (!user || !session) {
      return c.body(null, UNAUTHORIZED);
    }

    return c.json({ session, user });
  })
  .use('*', sessionMiddleware);
