import {
  cacheKeys,
  deleteCacheKey,
  getCacheKey,
  setCacheKey,
} from '@udi/rate-limit';
import { eq } from 'drizzle-orm';

import { ErrorHandler } from '@/error/handler';
import type { CreateStudent, Student, UpdateStudent } from '@/schemas';
import { student as studentTable } from '@/schemas';
import type { PaginationParams } from '@/utils/queries';
import { database } from '..';

export async function createStudent(student: CreateStudent): Promise<Student> {
  try {
    const existingStudent = await getStudentByUserId(student.userId);

    if (existingStudent) {
      throw ErrorHandler.handleKnownError('El estudiante ya existe');
    }

    const [newStudent] = await database
      .insert(studentTable)
      .values(student)
      .returning();

    await Promise.all([
      setCacheKey(`${cacheKeys.student}:${newStudent.id}`, newStudent),
      setCacheKey(`${cacheKeys.student}:${newStudent.userId}`, newStudent),
    ]);

    return newStudent;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export async function getStudentById(
  id: Student['id']
): Promise<Student | undefined> {
  try {
    const cachedStudent = await getCacheKey<Student>(
      `${cacheKeys.student}:${id}`
    );

    if (cachedStudent) {
      return cachedStudent;
    }

    const student = await database.query.student.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    });

    if (student) {
      await setCacheKey(`${cacheKeys.student}:${id}`, student);
    }

    return student;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export async function getStudentByUserId(
  userId: Student['userId']
): Promise<Student | undefined> {
  try {
    const cachedStudent = await getCacheKey<Student>(
      `${cacheKeys.student}:${userId}`
    );

    if (cachedStudent) {
      return cachedStudent;
    }

    const student = await database.query.student.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    });

    if (student) {
      await setCacheKey(`${cacheKeys.student}:${userId}`, student);
    }

    return student;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export async function updateStudent(
  id: Student['id'],
  data: UpdateStudent
): Promise<Student> {
  try {
    const [updatedStudent] = await database
      .update(studentTable)
      .set(data)
      .where(eq(studentTable.id, id))
      .returning();

    await Promise.all([
      deleteCacheKey(`${cacheKeys.student}:${id}`),
      deleteCacheKey(`${cacheKeys.student}:${updatedStudent.userId}`),
    ]);

    return updatedStudent;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export async function deleteStudent(id: Student['id']): Promise<Student> {
  try {
    const [deletedStudent] = await database
      .delete(studentTable)
      .where(eq(studentTable.id, id))
      .returning();

    if (!deletedStudent) {
      throw ErrorHandler.handleKnownError('El estudiante no existe');
    }

    await Promise.all([
      deleteCacheKey(`${cacheKeys.student}:${id}`),
      deleteCacheKey(`${cacheKeys.student}:${deletedStudent.userId}`),
    ]);

    return deletedStudent;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}

export async function getStudents(
  params: PaginationParams
): Promise<Student[]> {
  try {
    const students = await database.query.student.findMany({
      extras: () => ({
        studentsCount: database.$count(studentTable).as('students_count'),
      }),
      offset: (params.page - 1) * params.pageSize,
      limit: params.pageSize,
      orderBy: (table, { asc, desc }) =>
        params.sortOrder === 'asc'
          ? asc(table[params.sortBy])
          : desc(table[params.sortBy]),
    });

    return students;
  } catch (error) {
    throw ErrorHandler.handle(error);
  }
}
