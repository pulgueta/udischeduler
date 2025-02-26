import { createRoute } from '@hono/zod-openapi';

import { NOT_FOUND, TOO_MANY_REQUESTS } from 'stoker/http-status-codes';
import { jsonContent } from 'stoker/openapi/helpers';

import { notFoundSchema, tooManyRequestsSchema } from '@/schemas';

const tags = ['images'];

export const postBooking = createRoute({
  path: '/booking',
  method: 'post',
  request: {
    // body: jsonContentRequired(optimizeImageSchema, 'The image to optimize'),
  },
  responses: {
    // [OK]: jsonContent(optimizeImageResponseSchema, 'The image was optimized'),
    [TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      'Too many requests'
    ),
  },
  tags,
});

export const getBooking = createRoute({
  path: '/image/:src',
  method: 'get',
  request: {
    // body: jsonContentRequired(optimizeImageSchema, 'The image to optimize'),
    // params: getImageParamsSchema,
    // query: getImageQuerySchema,
  },
  responses: {
    // [OK]: jsonContent(optimizeImageResponseSchema, 'The image was optimized'),
    [NOT_FOUND]: jsonContent(notFoundSchema, 'The image was not found'),
  },
  tags,
});

export type PostBooking = typeof postBooking;
export type GetBooking = typeof getBooking;
