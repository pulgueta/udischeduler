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
  availability: z.object({
    days: z.array(z.string()),
    hours: z.array(z.string()),
  }),
}));

export const bookings = zodTable("bookings", (id) => ({
  labId: id("labs"),
  campusId: id("campuses"),
  users: z.array(id("users")).optional(),
  name: z.string().optional(),
  userId: z.string(),
  startDate: z.number(),
  endDate: z.number(),
}));

export const users = zodTable("users", () => ({
  userId: z.string(),
  // Won't be assigned at creation time, onboarding will require user's role.
  role: z.enum(["professor", "student"]).optional(),
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
  users: users
    .table()
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),
});
