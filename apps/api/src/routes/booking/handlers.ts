import {} from '@udi/database/schemas';
import { createStudent, getStudents } from '@udi/database/services';

import type { AppRouteHandler } from '@/types';
import type { GetStudents, PostStudent } from './routes';

export const create: AppRouteHandler<PostStudent> = async (c) => {
  const student = await createStudent(c.body);

  return c.json(student);
};

export const get: AppRouteHandler<GetStudents> = async (c) => {
  const page = c.req.query('page');
  const pageSize = c.req.query('pageSize');

  const students = await getStudents({
    page,
    pageSize,
  });

  return c.json(students);
};
