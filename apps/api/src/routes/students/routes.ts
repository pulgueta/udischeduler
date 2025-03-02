import { createRoute } from '@hono/zod-openapi';

import {
  selectStudentSchema,
  selectStudentWithBookingsSchema,
  updateStudentSchema,
} from '@udi/database/schemas/student';
import { paginationSchema } from '@udi/database/utils/queries';
import { NOT_FOUND, OK } from 'stoker/http-status-codes';
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers';

import { responses } from '@/routes/router';
import { notFoundSchema } from '@/schemas';

const tags = ['student'];

export const getStudents = createRoute({
  path: '/students',
  method: 'get',
  request: {
    query: paginationSchema,
  },
  responses: {
    [OK]: jsonContent(selectStudentWithBookingsSchema, 'The students'),
    [NOT_FOUND]: jsonContent(notFoundSchema, 'The students were not found'),
    ...responses,
  },
  tags,
});

export const getStudentById = createRoute({
  path: '/students/:id',
  method: 'get',
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The student'),
    [NOT_FOUND]: jsonContent(notFoundSchema, 'The student was not found'),
    ...responses,
  },
  tags,
});

export const getStudentByUserId = createRoute({
  path: '/students/:id',
  method: 'get',
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The student'),
    [NOT_FOUND]: jsonContent(notFoundSchema, 'The student was not found'),
    ...responses,
  },
  tags,
});

export const updateStudent = createRoute({
  path: '/students/:id',
  method: 'put',
  request: {
    body: jsonContentRequired(updateStudentSchema, 'The student to update'),
  },
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The student was updated'),
    ...responses,
  },
  tags,
});

export const deleteStudent = createRoute({
  path: '/students/:id',
  method: 'delete',
  responses: {
    [OK]: jsonContent(selectStudentSchema, 'The student was deleted'),
    ...responses,
  },
  tags,
});

export type GetStudents = typeof getStudents;
export type GetStudentById = typeof getStudentById;
export type GetStudentByUserId = typeof getStudentByUserId;
export type PutStudent = typeof updateStudent;
export type DeleteStudent = typeof deleteStudent;
