import { createRouter } from '@/routes/router';
import * as handlers from './handlers';
import * as routes from './routes';

export const bookingRouter = createRouter()
  .openapi(routes.postBooking, handlers.create)
  .openapi(routes.getBooking, handlers.get);
