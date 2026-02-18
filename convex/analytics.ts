import { query } from "./_generated/server";
import { v } from "convex/values";

type SignupSeriesPoint = { day: string; signups: number };

function dayKeyFromMs(ms: number) {
  const d = new Date(ms);
  // UTC day buckets to avoid timezone surprises for server + clients.
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Basic signup analytics derived from the auth `users` table.
 *
 * Note: this is intentionally simple and works well up to a few thousand users.
 * If you expect large scale, we should switch to an event table + aggregations.
 */
export const getSignupAnalytics = query({
  args: {
    days: v.optional(v.number()),
    seriesDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const days = Math.max(1, Math.min(365, args.days ?? 30));
    const seriesDays = Math.max(1, Math.min(365, args.seriesDays ?? 14));

    const last24hCutoff = now - 24 * 60 * 60 * 1000;
    const last7dCutoff = now - 7 * 24 * 60 * 60 * 1000;
    const lastNDaysCutoff = now - days * 24 * 60 * 60 * 1000;
    const seriesCutoff = now - seriesDays * 24 * 60 * 60 * 1000;

    let signupsLast24h = 0;
    let signupsLast7d = 0;
    let signupsLastNDays = 0;

    const seriesMap = new Map<string, number>();

    // Efficient-ish: iterate newest to oldest and stop once we're past the max window.
    // The default order is insertion order; `order("desc")` sorts by `_creationTime`.
    let cursor: string | null = null;
    const pageSize = 200;

    // `users` is provided by `authTables` from `@convex-dev/auth/server`.
    while (true) {
      const page = await ctx.db
        .query("users")
        .order("desc")
        .paginate({ cursor, numItems: pageSize });

      for (const user of page.page as Array<{ _creationTime: number }>) {
        const t = user._creationTime;
        if (t < lastNDaysCutoff) {
          // We've passed the max requested window, we can stop scanning.
          return {
            windowDays: days,
            seriesDays,
            signupsLast24h,
            signupsLast7d,
            signupsLastNDays,
            series: mapToSortedSeries(seriesMap),
          };
        }

        signupsLastNDays += 1;
        if (t >= last7dCutoff) signupsLast7d += 1;
        if (t >= last24hCutoff) signupsLast24h += 1;

        if (t >= seriesCutoff) {
          const key = dayKeyFromMs(t);
          seriesMap.set(key, (seriesMap.get(key) ?? 0) + 1);
        }
      }

      if (page.isDone) {
        break;
      }
      cursor = page.continueCursor;
    }

    return {
      windowDays: days,
      seriesDays,
      signupsLast24h,
      signupsLast7d,
      signupsLastNDays,
      series: mapToSortedSeries(seriesMap),
    };
  },
});

function mapToSortedSeries(
  seriesMap: Map<string, number>,
): SignupSeriesPoint[] {
  return Array.from(seriesMap.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, signups]) => ({ day, signups }));
}
