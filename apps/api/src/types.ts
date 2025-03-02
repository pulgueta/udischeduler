import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';

import type { Session, User } from '@udi/auth/server';

export type UDISchedulerAPI = {
  Variables: {
    user: User;
    session: Session;
  };
};

export type AppOpenAPI = OpenAPIHono<UDISchedulerAPI>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  UDISchedulerAPI
>;
