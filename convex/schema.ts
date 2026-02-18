import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("professor")),
    department: v.string(),
    fullName: v.optional(v.string()),
    email: v.optional(v.string()),
    studentId: v.optional(v.string()),
    phone: v.optional(v.string()),
    registered: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_department_and_role", ["department", "role"])
    .searchIndex("search_name", {
      searchField: "fullName",
      filterFields: ["department", "role"],
    }),

  labs: defineTable({
    name: v.string(),
    campus: v.string(),
    building: v.string(),
    room: v.string(),
    capacity: v.number(),
    description: v.string(),
    amenities: v.array(v.string()),
  }).index("by_campus", ["campus"]),

  bookings: defineTable({
    labId: v.id("labs"),
    userId: v.id("users"),
    professorId: v.optional(v.id("users")),
    professorApproval: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("accepted"),
        v.literal("declined")
      )
    ),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    studentCount: v.number(),
    campus: v.string(),
    status: v.union(v.literal("active"), v.literal("cancelled")),
    requiredItems: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  })
    .index("by_lab", ["labId"])
    .index("by_user", ["userId"])
    .index("by_professor", ["professorId"])
    .index("by_lab_and_date", ["labId", "date"]),

  bookingStudents: defineTable({
    bookingId: v.id("bookings"),
    studentId: v.id("users"),
  })
    .index("by_student", ["studentId"])
    .index("by_booking", ["bookingId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
