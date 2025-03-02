import type { ZodTypeAny } from 'zod';
import { ZodArray, ZodNullable, ZodObject, ZodOptional, ZodType } from 'zod';

export function zodKeys<T extends ZodTypeAny>(schema: T): string[] {
  if (schema === null || schema === undefined) {
    return [];
  }

  if (schema instanceof ZodNullable || schema instanceof ZodOptional) {
    return zodKeys(schema.unwrap());
  }

  if (schema instanceof ZodArray) {
    return zodKeys(schema.element);
  }

  if (schema instanceof ZodObject) {
    const entries = Object.entries(schema.shape);

    return entries.flatMap(([key, value]) => {
      const nested =
        value instanceof ZodType
          ? zodKeys(value).map((subKey) => `${key}.${subKey}`)
          : [];

      return nested.length ? nested : key;
    });
  }

  return [];
}
