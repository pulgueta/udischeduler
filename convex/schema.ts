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
  floor: z.number(),
  room: z.number(),
  campusId: id("campuses"),
}));

export default defineSchema({
  campuses: campuses.table(),
  labs: labs.table(),
});
