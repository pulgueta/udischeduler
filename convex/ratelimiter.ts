import { config } from "./config";
import type { RunMutationCtx } from "@convex-dev/rate-limiter";
import { HOUR, MINUTE, RateLimiter } from "@convex-dev/rate-limiter";
import { ConvexError } from "convex/values";

import { components } from "./_generated/api";

export const rateLimiter = new RateLimiter(components.rateLimiter, {
  createCampus: {
    kind: "token bucket",
    capacity: 10,
    rate: 3,
    period: 1 * MINUTE,
  },
  createBooking: {
    kind: "token bucket",
    capacity: 5,
    rate: 2,
    period: 1 * HOUR,
  },
  rescheduleBooking: {
    kind: "fixed window",
    rate: 10,
    period: 1 * HOUR,
  },
  cancelBooking: {
    kind: "fixed window",
    rate: 5,
    period: 1 * HOUR,
  },
  assignUsersToBooking: {
    kind: "fixed window",
    rate: 20,
    period: 1 * HOUR,
  },
});

type RateLimitName = keyof NonNullable<typeof rateLimiter.limits>;

export async function rateLimit(
  ctx: RunMutationCtx,
  opts: {
    name: RateLimitName;
    key: string;
  },
) {
  const { ok } = await rateLimiter.limit(ctx, opts.name, { key: opts.key });

  if (!ok) {
    throw new ConvexError({
      code: config.errors.rateLimitExceeded.code,
      message: config.errors.rateLimitExceeded.message,
    });
  }
}
