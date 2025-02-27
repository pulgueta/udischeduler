import { like, relations } from 'drizzle-orm';
import { check, pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from 'drizzle-zod';
import { ulid } from 'ulid';
import type { TypeOf } from 'zod';
import { string } from 'zod';

import { user } from './auth';
import { booking } from './booking';

export const student = pgTable(
  'student',
  ({ text, timestamp }) => ({
    id: text()
      .primaryKey()
      .$defaultFn(() => ulid()),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    email: text().notNull().unique(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    check('student_email_check', like(t.email, '%@udi.edu.co%')),
    uniqueIndex('student_id_idx').on(t.id),
    uniqueIndex('student_user_id_idx').on(t.userId),
  ]
);

export const createStudentSchema = createInsertSchema(student, {
  email: string({ message: 'El correo electrónico es requerido' }).email(
    'El correo electrónico debe ser el de la universidad'
  ),
  name: string({ message: 'El nombre es requerido' })
    .min(6, 'El nombre debe tener al menos 6 caracteres')
    .max(128, 'El nombre no puede tener más de 128 caracteres')
    .trim(),
}).omit({
  createdAt: true,
  updatedAt: true,
  id: true,
});

export const selectStudentSchema = createSelectSchema(student).omit({
  updatedAt: true,
});

export const updateStudentSchema = createUpdateSchema(student).omit({
  createdAt: true,
  updatedAt: true,
  id: true,
});

export type CreateStudent = TypeOf<typeof createStudentSchema>;
export type Student = TypeOf<typeof selectStudentSchema>;
export type UpdateStudent = TypeOf<typeof updateStudentSchema>;

export const studentRelations = relations(student, ({ many }) => ({
  bookings: many(booking),
}));
