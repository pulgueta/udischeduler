import { createRouter } from '@/routes/router';
import * as handlers from './handlers';
import * as routes from './routes';

export const studentRouter = createRouter()
  .openapi(routes.createStudent, handlers.create)
  .openapi(routes.getStudents, handlers.get);
