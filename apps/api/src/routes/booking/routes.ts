import { createRoute } from '@hono/zod-openapi';

import {
  createStudentSchema,
  selectStudentSchema,
} from '@udi/database/schemas/student';
import { paginationSchema } from '@udi/database/utils/queries';
import { NOT_FOUND, OK, TOO_MANY_REQUESTS } from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

import { notFoundSchema, tooManyRequestsSchema } from '@/schemas';

const tags = ['student'];

export const createStudent = createRoute({
  path: '/student',
  method: 'post',
  request: {
    body: jsonContentRequired(createStudentSchema, 'The student to create'),
  },
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The student was created'),
    [TOO_MANY_REQUESTS]: jsonContent(
      tooManyRequestsSchema,
      'Too many requests'
    ),
  },
  tags,
});

export const getStudents = createRoute({
  path: '/students',
  method: 'get',
  request: {
    query: paginationSchema,
  },
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The students'),
    [NOT_FOUND]: jsonContent(notFoundSchema, 'The students were not found'),
  },
  tags,
});

export type PostStudent = typeof createStudent;
export type GetStudents = typeof getStudents;
