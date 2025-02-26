import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { prettyJSON } from 'hono/pretty-json';
import { notFound, onError } from 'stoker/middlewares';
import { defaultHook } from 'stoker/openapi';

import type { UDISchedulerAPI } from '@/types';
import { version } from '../../package.json';

export const createRouter = () =>
  new OpenAPIHono<UDISchedulerAPI>({ strict: true, defaultHook });

export const createApp = () => {
  const app = createRouter();

  app.use('*', prettyJSON());
  app.notFound(notFound);
  app.onError(onError);

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version,
      title: 'Image Optimizer API',
    },
  });

  app.get(
    '/reference',
    apiReference({
      theme: 'deepSpace',
      spec: {
        url: '/doc',
      },
    })
  );

  return app;
};
