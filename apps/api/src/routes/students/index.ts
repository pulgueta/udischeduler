import { createRouter } from '@/routes/router';
import * as handlers from './handlers';
import * as routes from './routes';

export const studentRouter = createRouter()

  .openapi(routes.getStudents, handlers.get)
  .openapi(routes.getStudentByUserId, handlers.getByUserId)
  .openapi(routes.getStudentById, handlers.getById)
  .openapi(routes.updateStudent, handlers.update)
  .openapi(routes.deleteStudent, handlers.remove);
