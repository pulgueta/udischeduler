import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    labId: v.id("labs"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    studentCount: v.number(),
    campus: v.string(),
    professorId: v.optional(v.id("users")),
    invitedStudentIds: v.optional(v.array(v.id("users"))),
    requiredItems: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    if (args.startTime >= args.endTime) {
      throw new Error("End time must be after start time");
    }

    const lab = await ctx.db.get(args.labId);
    if (!lab) throw new Error("Lab not found");

    if (args.studentCount > lab.capacity) {
      throw new Error(`Student count exceeds lab capacity of ${lab.capacity}`);
    }

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_lab_and_date", (q) =>
        q.eq("labId", args.labId).eq("date", args.date)
      )
      .collect();

    const hasOverlap = existingBookings.some(
      (b) =>
        b.status === "active" &&
        b.startTime < args.endTime &&
        b.endTime > args.startTime
    );

    if (hasOverlap) {
      throw new Error("This time slot overlaps with an existing booking");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) throw new Error("Profile not found");

    const isProfessorInvitation =
      args.professorId && profile.role === "student";

    const bookingId = await ctx.db.insert("bookings", {
      labId: args.labId,
      userId,
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      studentCount: args.studentCount,
      campus: args.campus,
      status: "active" as const,
      ...(args.professorId ? { professorId: args.professorId } : {}),
      ...(isProfessorInvitation
        ? { professorApproval: "pending" as const }
        : {}),
      ...(args.requiredItems && args.requiredItems.length > 0
        ? { requiredItems: args.requiredItems }
        : {}),
      ...(args.notes ? { notes: args.notes } : {}),
    });

    // Student invited a professor → send email
    if (isProfessorInvitation && args.professorId) {
      const profProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", args.professorId!))
        .unique();

      await ctx.scheduler.runAfter(
        0,
        internal.emails.notifyProfessorOfInvitation,
        {
          professorName: profProfile?.fullName || "Professor",
          studentName: profile.fullName || "A student",
          labName: lab.name,
          date: args.date,
          startTime: args.startTime,
          endTime: args.endTime,
        }
      );
    }

    // Professor invited students → create join records + send emails
    if (
      args.invitedStudentIds &&
      args.invitedStudentIds.length > 0 &&
      profile.role === "professor"
    ) {
      for (const studentId of args.invitedStudentIds) {
        await ctx.db.insert("bookingStudents", {
          bookingId,
          studentId,
        });
      }

      await ctx.scheduler.runAfter(
        0,
        internal.emails.notifyStudentsOfBooking,
        {
          studentIds: args.invitedStudentIds,
          professorName: profile.fullName || "Professor",
          labName: lab.name,
          date: args.date,
          startTime: args.startTime,
          endTime: args.endTime,
          requiredItems: args.requiredItems,
        }
      );
    }

    return bookingId;
  },
});

export const listByUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
    if (!profile) return [];

    const ownBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const ids = new Set(ownBookings.map((b) => b._id));
    const allBookings = [...ownBookings];

    // Professors also see bookings assigned to them
    if (profile.role === "professor") {
      const assignedBookings = await ctx.db
        .query("bookings")
        .withIndex("by_professor", (q) => q.eq("professorId", userId))
        .collect();
      for (const b of assignedBookings) {
        if (!ids.has(b._id)) {
          ids.add(b._id);
          allBookings.push(b);
        }
      }
    }

    // Students also see bookings they're invited to
    const invitedBookingIds = new Set<string>();
    if (profile.role === "student") {
      const invitations = await ctx.db
        .query("bookingStudents")
        .withIndex("by_student", (q) => q.eq("studentId", userId))
        .collect();
      for (const inv of invitations) {
        invitedBookingIds.add(inv.bookingId);
        if (!ids.has(inv.bookingId)) {
          ids.add(inv.bookingId);
          const booking = await ctx.db.get(inv.bookingId);
          if (booking) allBookings.push(booking);
        }
      }
    }

    const enriched: Array<{
      _id: string;
      _creationTime: number;
      labId: string;
      userId: string;
      professorId?: string;
      professorApproval?: string;
      date: string;
      startTime: string;
      endTime: string;
      studentCount: number;
      campus: string;
      status: string;
      requiredItems?: string[];
      notes?: string;
      labName: string;
      labRoom: string;
      labCapacity: number;
      bookerName: string;
      bookerEmail: string;
      professorName: string | null;
      invitedStudentNames: string[];
      isOwn: boolean;
      isAssignedProfessor: boolean;
      isInvitedTo: boolean;
    }> = [];

    for (const booking of allBookings) {
      const lab = await ctx.db.get(booking.labId);
      const booker = await ctx.db.get(booking.userId);
      let professorName: string | null = null;
      if (booking.professorId) {
        const profProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", booking.professorId!))
          .unique();
        professorName = profProfile?.fullName || null;
        if (!professorName) {
          const profUser = await ctx.db.get(booking.professorId);
          professorName = profUser?.name || profUser?.email || null;
        }
      }

      // Get invited students
      const studentRecords = await ctx.db
        .query("bookingStudents")
        .withIndex("by_booking", (q) => q.eq("bookingId", booking._id))
        .take(10);
      const invitedStudentNames: string[] = [];
      for (const rec of studentRecords) {
        const sp = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", rec.studentId))
          .unique();
        invitedStudentNames.push(sp?.fullName || "Unknown");
      }

      const bookerProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", booking.userId))
        .unique();

      enriched.push({
        _id: booking._id,
        _creationTime: booking._creationTime,
        labId: booking.labId,
        userId: booking.userId,
        professorId: booking.professorId,
        professorApproval: booking.professorApproval,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        studentCount: booking.studentCount,
        campus: booking.campus,
        status: booking.status,
        requiredItems: booking.requiredItems,
        notes: booking.notes,
        labName: lab?.name || "Unknown Lab",
        labRoom: lab ? `${lab.building} - ${lab.room}` : "",
        labCapacity: lab?.capacity || 0,
        bookerName:
          bookerProfile?.fullName ||
          booker?.name ||
          booker?.email ||
          "Unknown",
        bookerEmail: booker?.email || "",
        professorName,
        invitedStudentNames,
        isOwn: booking.userId === userId,
        isAssignedProfessor:
          profile.role === "professor" && booking.professorId === userId,
        isInvitedTo: invitedBookingIds.has(booking._id),
      });
    }

    enriched.sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.startTime.localeCompare(a.startTime);
    });

    return enriched;
  },
});

export const getLabBookingsForDate = query({
  args: { labId: v.id("labs"), date: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_lab_and_date", (q) =>
        q.eq("labId", args.labId).eq("date", args.date)
      )
      .collect();

    return bookings
      .filter((b) => b.status === "active")
      .map((b) => ({
        _id: b._id,
        startTime: b.startTime,
        endTime: b.endTime,
        studentCount: b.studentCount,
      }));
  },
});

export const getPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_professor", (q) => q.eq("professorId", userId))
      .collect();

    const pending = bookings.filter(
      (b) => b.status === "active" && b.professorApproval === "pending"
    );

    const enriched: Array<{
      _id: string;
      date: string;
      startTime: string;
      endTime: string;
      studentCount: number;
      campus: string;
      notes?: string;
      labName: string;
      labRoom: string;
      labCapacity: number;
      studentName: string;
      studentDepartment: string;
      existingBookings: Array<{ startTime: string; endTime: string }>;
    }> = [];

    for (const booking of pending) {
      const lab = await ctx.db.get(booking.labId);
      const studentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", booking.userId))
        .unique();
      const studentUser = await ctx.db.get(booking.userId);

      const dateBookings = await ctx.db
        .query("bookings")
        .withIndex("by_lab_and_date", (q) =>
          q.eq("labId", booking.labId).eq("date", booking.date)
        )
        .collect();
      const existingBookings = dateBookings
        .filter((b) => b.status === "active" && b._id !== booking._id)
        .map((b) => ({ startTime: b.startTime, endTime: b.endTime }));

      enriched.push({
        _id: booking._id,
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        studentCount: booking.studentCount,
        campus: booking.campus,
        notes: booking.notes,
        labName: lab?.name || "Unknown Lab",
        labRoom: lab ? `${lab.building} - ${lab.room}` : "",
        labCapacity: lab?.capacity || 0,
        studentName:
          studentProfile?.fullName ||
          studentUser?.name ||
          studentUser?.email ||
          "Unknown",
        studentDepartment: studentProfile?.department || "",
        existingBookings,
      });
    }

    enriched.sort((a, b) => a.date.localeCompare(b.date));
    return enriched;
  },
});

export const countPendingInvitations = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const bookings = await ctx.db
      .query("bookings")
      .withIndex("by_professor", (q) => q.eq("professorId", userId))
      .collect();

    return bookings.filter(
      (b) => b.status === "active" && b.professorApproval === "pending"
    ).length;
  },
});

export const respondToInvitation = mutation({
  args: {
    bookingId: v.id("bookings"),
    accept: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.professorId !== userId) throw new Error("Not authorized");
    if (booking.professorApproval !== "pending")
      throw new Error("Already responded to this invitation");

    await ctx.db.patch(args.bookingId, {
      professorApproval: args.accept
        ? ("accepted" as const)
        : ("declined" as const),
    });

    const lab = await ctx.db.get(booking.labId);
    const studentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", booking.userId))
      .unique();
    const professorProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    await ctx.scheduler.runAfter(0, internal.emails.notifyApprovalResult, {
      studentName: studentProfile?.fullName || "Student",
      professorName: professorProfile?.fullName || "Professor",
      labName: lab?.name || "Lab",
      date: booking.date,
      accepted: args.accept,
    });
  },
});

export const update = mutation({
  args: {
    bookingId: v.id("bookings"),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    studentCount: v.number(),
    professorId: v.optional(v.id("users")),
    requiredItems: v.optional(v.array(v.string())),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");
    if (booking.status === "cancelled")
      throw new Error("Cannot update cancelled booking");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const isOwner = booking.userId === userId;
    const isAssignedProfessor =
      profile?.role === "professor" && booking.professorId === userId;

    if (!isOwner && !isAssignedProfessor)
      throw new Error("Not authorized to update this booking");

    if (args.startTime >= args.endTime) {
      throw new Error("End time must be after start time");
    }

    const lab = await ctx.db.get(booking.labId);
    if (lab && args.studentCount > lab.capacity) {
      throw new Error(`Student count exceeds lab capacity of ${lab.capacity}`);
    }

    const existingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_lab_and_date", (q) =>
        q.eq("labId", booking.labId).eq("date", args.date)
      )
      .collect();

    const hasOverlap = existingBookings.some(
      (b) =>
        b._id !== args.bookingId &&
        b.status === "active" &&
        b.startTime < args.endTime &&
        b.endTime > args.startTime
    );

    if (hasOverlap) {
      throw new Error("This time slot overlaps with an existing booking");
    }

    await ctx.db.patch(args.bookingId, {
      date: args.date,
      startTime: args.startTime,
      endTime: args.endTime,
      studentCount: args.studentCount,
      ...(args.professorId !== undefined
        ? { professorId: args.professorId }
        : {}),
      ...(args.requiredItems !== undefined
        ? { requiredItems: args.requiredItems }
        : {}),
      ...(args.notes !== undefined ? { notes: args.notes } : {}),
    });
  },
});

export const cancel = mutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const booking = await ctx.db.get(args.bookingId);
    if (!booking) throw new Error("Booking not found");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    const isOwner = booking.userId === userId;
    const isAssignedProfessor =
      profile?.role === "professor" && booking.professorId === userId;

    if (!isOwner && !isAssignedProfessor)
      throw new Error("Not authorized to cancel this booking");

    await ctx.db.patch(args.bookingId, { status: "cancelled" as const });
  },
});
