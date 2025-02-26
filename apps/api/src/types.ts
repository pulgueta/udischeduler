import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi';

// biome-ignore lint/complexity/noBannedTypes: WIP
export type UDISchedulerAPI = {};

export type AppOpenAPI = OpenAPIHono<UDISchedulerAPI>;
export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
  R,
  UDISchedulerAPI
>;
