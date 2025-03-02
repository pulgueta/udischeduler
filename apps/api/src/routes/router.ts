// biome-ignore lint/style/useNodejsImportProtocol: Using Bun
import { join } from 'path';

import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { serveStatic } from 'hono/bun';
import { prettyJSON } from 'hono/pretty-json';
import { TOO_MANY_REQUESTS, UNAUTHORIZED } from 'stoker/http-status-codes';
import { notFound, onError } from 'stoker/middlewares';
import { defaultHook } from 'stoker/openapi';
import { jsonContent } from 'stoker/openapi/helpers';

import { keys } from '@/keys';
import { corsMiddleware } from '@/middlewares/auth';
import { tooManyRequestsSchema, unauthorizedSchema } from '@/schemas';
import type { UDISchedulerAPI } from '@/types';
import { version } from '../../package.json';

export function createRouter() {
  return new OpenAPIHono<UDISchedulerAPI>({
    strict: true,
    defaultHook,
  });
}

export function createApp() {
  const app = createRouter().basePath('/api');

  app.use('*', prettyJSON());
  app.notFound(notFound);
  app.onError(onError);

  app.use('*', corsMiddleware);

  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version,
      title: 'UDIScheduler API',
    },
  });

  app.get(
    '/reference',
    apiReference({
      baseServerURL: keys.BASE_URL,
      theme: 'deepSpace',
      spec: {
        url: '/api/doc',
      },
    })
  );

  app.get(
    '*',
    serveStatic({
      path: join(__dirname, '../../../frontend/dist'),
    })
  );

  return app;
}

export const responses = {
  [UNAUTHORIZED]: jsonContent(unauthorizedSchema, 'No autorizado'),
  [TOO_MANY_REQUESTS]: jsonContent(
    tooManyRequestsSchema,
    'Haz alcanzado el limite de peticiones, inténtalo más tade'
  ),
};
