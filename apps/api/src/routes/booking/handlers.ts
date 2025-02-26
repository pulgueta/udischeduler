import type { AppRouteHandler } from '@/types';
import type { GetBooking, PostBooking } from './routes';

export const create: AppRouteHandler<PostBooking> = (c) => {
  return c.json({ message: 'Hello, World!' });
};

export const get: AppRouteHandler<GetBooking> = (c) => {
  return c.json({ message: 'Hello, World!' });
};
