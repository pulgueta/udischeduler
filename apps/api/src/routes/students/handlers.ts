import {
  deleteStudent,
  getStudentById,
  getStudents,
  updateStudent,
} from '@udi/database/services';
import { NOT_FOUND, OK, UNAUTHORIZED } from 'stoker/http-status-codes';

import type { AppRouteHandler } from '@/types';
import type {
  DeleteStudent,
  GetStudentById,
  GetStudents,
  PutStudent,
} from './routes';

export const get: AppRouteHandler<GetStudents> = async (c) => {
  const [user, session] = [c.get('user'), c.get('session')];

  if (!user || !session) {
    return c.json({ message: 'No autorizado' }, UNAUTHORIZED);
  }

  const queryParams = c.req.valid('query');

  const students = await getStudents(queryParams);

  if (students.length === 0) {
    return c.json({ message: 'No hay estudiantes' }, NOT_FOUND);
  }

  return c.json(students, OK);
};

export const getById: AppRouteHandler<GetStudentById> = async (c) => {
  const [user, session] = [c.get('user'), c.get('session')];

  if (!user || !session) {
    return c.json({ message: 'No autorizado' }, UNAUTHORIZED);
  }

  const studentId = c.req.param('id');

  const student = await getStudentById(studentId);

  return c.json(student, OK);
};

export const getByUserId: AppRouteHandler<GetStudentById> = async (c) => {
  const [user, session] = [c.get('user'), c.get('session')];

  if (!user || !session) {
    return c.json({ message: 'No autorizado' }, UNAUTHORIZED);
  }

  const userId = c.req.param('id');

  const student = await getStudentById(userId);

  return c.json(student, OK);
};

export const update: AppRouteHandler<PutStudent> = async (c) => {
  const [user, session] = [c.get('user'), c.get('session')];

  if (!user || !session) {
    return c.json({ message: 'No autorizado' }, UNAUTHORIZED);
  }

  const studentId = c.req.param('id');

  const student = await updateStudent(studentId, c.body);

  return c.json(student, OK);
};

export const remove: AppRouteHandler<DeleteStudent> = async (c) => {
  const [user, session] = [c.get('user'), c.get('session')];

  if (!user || !session) {
    return c.json({ message: 'No autorizado' }, UNAUTHORIZED);
  }

  const studentId = c.req.param('id');

  const student = await deleteStudent(studentId);

  return c.json(student, OK);
};
