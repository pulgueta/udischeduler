import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

export const user = pgTable('user', {
  id: text().primaryKey(),
  name: text().notNull(),
  email: text().notNull().unique(),
  emailVerified: boolean().notNull(),
  image: text(),
  ...timestamps,
});

export const student = pgTable('student', {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  email: text().notNull().unique(),
  ...timestamps,
});

export const studentRelations = relations(student, ({ many }) => ({
  bookings: many(booking),
}));

export const session = pgTable('session', {
  id: text().primaryKey(),
  expiresAt: timestamp().notNull(),
  token: text().notNull().unique(),
  ipAddress: text(),
  userAgent: text(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  ...timestamps,
});

export const account = pgTable('account', {
  id: text().primaryKey(),
  accountId: text().notNull(),
  providerId: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text(),
  refreshToken: text(),
  idToken: text(),
  accessTokenExpiresAt: timestamp(),
  refreshTokenExpiresAt: timestamp(),
  scope: text(),
  password: text(),
  ...timestamps,
});

export const verification = pgTable('verification', {
  id: text().primaryKey(),
  identifier: text().notNull(),
  value: text().notNull(),
  expiresAt: timestamp().notNull(),
  ...timestamps,
});

export const passkey = pgTable('passkey', {
  id: text().primaryKey(),
  name: text(),
  publicKey: text().notNull(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  credentialID: text().notNull(),
  counter: integer().notNull(),
  deviceType: text().notNull(),
  backedUp: boolean().notNull(),
  transports: text(),
  ...timestamps,
});

export const booking = pgTable('booking', {
  id: text().primaryKey(),
  userId: text()
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  bookingDate: timestamp().notNull(),
  ...timestamps,
});

export const bookingRelations = relations(booking, ({ one }) => ({
  user: one(user, {
    fields: [booking.userId],
    references: [user.id],
  }),
}));
