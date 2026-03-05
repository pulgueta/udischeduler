import { defineSchema } from "convex/server";
import { z } from "zod";

import { zodTable } from ".";

export const campuses = zodTable("campuses", () => ({
  name: z.string(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip: z.string(),
}));

export const labs = zodTable("labs", (id) => ({
  campusId: id("campuses"),
  floor: z.number(),
  room: z.number(),
  capacity: z.number().optional().default(5),
}));

export const bookings = zodTable("bookings", (id) => ({
  labId: id("labs"),
  campusId: id("campuses"),
  name: z.string().optional(),
  userId: z.string(),
  startDate: z.number(),
  endDate: z.number(),
}));

export default defineSchema({
  campuses: campuses.table().searchIndex("by_name", {
    searchField: "name",
    filterFields: ["address", "city"],
  }),
  labs: labs.table().index("by_campus", ["campusId"]),
  bookings: bookings
    .table()
    .index("by_lab", ["labId"])
    .index("by_campus", ["campusId"])
    .index("by_user", ["userId"])
    .searchIndex("by_name", {
      searchField: "name",
      filterFields: ["labId", "campusId", "userId"],
    }),
});
