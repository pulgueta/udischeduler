import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

import { timestamps } from '.';
import { user } from './auth';

export const booking = pgTable(
  'booking',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    bookingDate: timestamp().notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex('booking_id_idx').on(t.id),
    uniqueIndex('booking_user_id_idx').on(t.userId),
  ]
);

export const createBooking = createInsertSchema(booking);

export const bookingRelations = relations(booking, ({ one }) => ({
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
}));
