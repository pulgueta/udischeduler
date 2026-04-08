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
  userId: z.string(),
  name: z.string(),
  startDate: z.number(),
  endDate: z.number(),
  participants: z
    .array(
      z.object({
        name: z.string(),
        email: z.string(),
      }),
    )
    .default([]),
}));

export const users = zodTable("users", () => ({
  tokenIdentifier: z.string(),
  email: z.string(),
  name: z.string(),
  documentType: z.enum(["CC", "CE", "PP"]).optional(),
  documentNumber: z.string().optional(),
  role: z.enum(["student", "professor", "support", "admin"]).optional(),
  onboardingCompleted: z.boolean().default(false),
  isOffDomain: z.boolean().default(false),
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
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_role", ["role"]),
});
