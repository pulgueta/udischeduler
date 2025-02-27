import { relations } from 'drizzle-orm';
import { pgTable, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { user } from './auth';

export const booking = pgTable(
  'booking',
  ({ text, timestamp }) => ({
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bookingDate: timestamp().notNull(),
    createdAt: timestamp().defaultNow(),
    updatedAt: timestamp()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  }),
  (t) => [
    uniqueIndex('booking_id_idx').on(t.id),
    uniqueIndex('booking_user_id_idx').on(t.userId),
  ]
);

export const createBooking = createInsertSchema(booking);
export const selectBooking = createSelectSchema(booking);

export const bookingRelations = relations(booking, ({ one }) => ({
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
}));
