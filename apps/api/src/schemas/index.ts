import { object, string } from 'zod';

export const notFoundSchema = object({
  message: string(),
});

export const tooManyRequestsSchema = object({
  message: string(),
});
