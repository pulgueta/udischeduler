import { object, string } from 'zod';

const baseSchema = object({
  message: string(),
});

export const notFoundSchema = baseSchema;

export const tooManyRequestsSchema = baseSchema;
