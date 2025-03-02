import type { TypeOf } from 'zod';
import { coerce, object, string, union, enum as zodEnum } from 'zod';

export const paginationSchema = object({
  page: coerce.number().min(1).default(1),
  pageSize: coerce.number().min(5).max(255).default(10),
  sortBy: zodEnum(['createdAt']).optional().default('createdAt'), // WIP: Add more fields
  sortOrder: zodEnum(['asc', 'desc']).optional().default('desc'),
});

export type PaginationParams = TypeOf<typeof paginationSchema>;

export const querySchema = union([
  object({
    search: string().optional(),
  }),
  object({
    sortBy: string().optional(),
  }),
]);

export type SearchOrQueryParams = TypeOf<typeof querySchema>;
