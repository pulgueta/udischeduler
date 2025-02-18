import 'server-only';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { keys } from './keys';
import * as schema from './schema';

const client = neon(keys.DATABASE_URL);

export const database = drizzle({ client, schema });

export * from './schema';

const getStudentByUserId = async (userId: string) => {
  const student = await database.query.student.findFirst({
    where: (t, { eq }) => eq(t.id, userId),
    orderBy: (t, { asc }) => [asc(t.createdAt)],
    with: {
      bookings: true,
    },
  });

  return student;
};

getStudentByUserId("1")