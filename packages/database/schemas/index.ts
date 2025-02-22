import { timestamp } from 'drizzle-orm/pg-core';

export const timestamps = {
  createdAt: timestamp().defaultNow(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};

export * from './auth';
export * from './booking';
export * from './student';
