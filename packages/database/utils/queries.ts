import type { TypeOf } from 'zod';
import { number, object, string, union, enum as zodEnum } from 'zod';

export const paginationSchema = object({
  page: number().min(1).default(1),
  pageSize: number().min(5).default(10),
  sortBy: zodEnum(['createdAt']).default('createdAt'), // WIP: Add more fields
  sortOrder: zodEnum(['asc', 'desc']).default('desc'),
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
