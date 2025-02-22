import { cacheKeys, getCacheKey } from '@udi/rate-limit';

import type { CreateStudent, Student } from '@/schemas';
import { student as studentTable } from '@/schemas';
import { database } from '..';

export async function createStudent(student: CreateStudent) {
  const existingStudent = await getStudentByUserId(student.userId);

  if (existingStudent) {
    throw new Error('El estudiante ya existe');
  }

  const newStudent = await database.insert(studentTable).values(student);

  return newStudent;
}

export async function getStudentById(id: Student['id']) {
  const cachedStudent = await getCacheKey<Student>(
    `${cacheKeys.student}:${id}`
  );

  if (cachedStudent) {
    return cachedStudent;
  }

  const student = await database.query.student.findFirst({
    where: (t, { eq }) => eq(t.id, id),
  });

  return student;
}

export async function getStudentByUserId(userId: Student['userId']) {
  const cachedStudent = await getCacheKey<Student>(
    `${cacheKeys.student}:${userId}`
  );

  if (cachedStudent) {
    return cachedStudent;
  }

  const student = await database.query.student.findFirst({
    where: (t, { eq }) => eq(t.userId, userId),
  });

  return student;
}
