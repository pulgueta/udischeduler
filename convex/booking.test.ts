/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

let mockUser: Record<string, unknown> | null = null;

vi.mock("./auth", () => ({
  getCurrentUser: vi.fn().mockImplementation(() => Promise.resolve(mockUser)),
  requireUser: vi.fn().mockImplementation(() => {
    if (!mockUser) return Promise.reject(new Error("Not authenticated"));
    return Promise.resolve(mockUser);
  }),
  requireRole: vi.fn().mockImplementation(() => {
    if (!mockUser) return Promise.reject(new Error("Not authenticated"));
    return Promise.resolve(mockUser);
  }),
}));

// Rate limiter always succeeds in tests
vi.mock("./ratelimiter", () => ({
  rateLimiter: {},
  rateLimit: vi.fn().mockResolvedValue(undefined),
}));

const modules = import.meta.glob("./**/*.ts");

// Branded ID helpers for the zod-based tool schema types
type CampusId = string & { __tableName: "campuses" };
type LabId = string & { __tableName: "labs" };
type BookingId = string & { __tableName: "bookings" };

const asCampusId = (id: string): CampusId => id as CampusId;
const asLabId = (id: string): LabId => id as LabId;
const asBookingId = (id: string): BookingId => id as BookingId;

function setAuthUser(user: Record<string, unknown> | null) {
  mockUser = user;
}

const MOCK_USER = { _id: "user_abc123", email: "test@udi.edu.co", role: "admin" };
const OTHER_USER = { _id: "user_xyz789", email: "other@udi.edu.co" };

// Time slots (epoch ms)
const SLOT_A_START = 1_700_000_000_000;
const SLOT_A_END = 1_700_003_600_000; // +1h

const SLOT_B_START = 1_700_010_000_000; // non-overlapping
const SLOT_B_END = 1_700_013_600_000;

/** Seed campus + lab and return their IDs (requires auth to be set) */
async function seedCampusAndLab(t: ReturnType<typeof convexTest>) {
  const campusId = await t.mutation(internal.campus.create, {
    name: "Test Campus",
    address: "Calle 1 # 2-3",
    city: "Bogotá",
    state: "Cundinamarca",
    zip: "110111",
  });

  const labId = await t.mutation(internal.lab.create, {
    campusId: asCampusId(campusId),
    floor: 2,
    room: 201,
    capacity: 10,
    availability: {
      days: ["Monday", "Tuesday"],
      hours: ["08:00", "10:00"],
    },
  });

  return { campusId, labId };
}

/** Seed a booking at given time slot (requires auth to be set) */
async function seedBooking(
  t: ReturnType<typeof convexTest>,
  labId: string,
  campusId: string,
  start = SLOT_A_START,
  end = SLOT_A_END,
) {
  return t.mutation(api.booking.create, {
    labId: asLabId(labId),
    campusId: asCampusId(campusId),
    name: "Reserva de prueba",
    startDate: start,
    endDate: end,
    participants: [],
  });
}

describe("booking.create", () => {
  it("creates a booking when user is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const id = await seedBooking(t, labId, campusId);
    expect(id).toBeDefined();

    const bookings = await t.query(api.booking.getByLab, {
      id: asLabId(labId),
    });
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({
      startDate: SLOT_A_START,
      endDate: SLOT_A_END,
      userId: MOCK_USER._id,
    });
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    setAuthUser(null);

    await expect(
      t.mutation(api.booking.create, {
        labId: asLabId(labId),
        campusId: asCampusId(campusId),
        name: "Reserva de prueba",
        startDate: SLOT_A_START,
        endDate: SLOT_A_END,
        participants: [],
      }),
    ).rejects.toThrowError();
  });

  it("throws when booking overlaps an existing booking", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    await seedBooking(t, labId, campusId);

    // Overlapping window: starts within slot A, ends after it
    const overlapStart = SLOT_A_START + 1_800_000; // +30min
    const overlapEnd = SLOT_A_END + 1_800_000;

    await expect(
      t.mutation(api.booking.create, {
        labId: asLabId(labId),
        campusId: asCampusId(campusId),
        name: "Reserva solapada",
        startDate: overlapStart,
        endDate: overlapEnd,
        participants: [],
      }),
    ).rejects.toThrowError();
  });

  it("allows bookings for the same lab at non-overlapping times", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    await seedBooking(t, labId, campusId);

    const id2 = await seedBooking(t, labId, campusId, SLOT_B_START, SLOT_B_END);
    expect(id2).toBeDefined();

    const bookings = await t.query(api.booking.getByLab, {
      id: asLabId(labId),
    });
    expect(bookings).toHaveLength(2);
  });
});

describe("booking.getByLab", () => {
  it("returns bookings for a specific lab when authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);
    await seedBooking(t, labId, campusId);

    const bookings = await t.query(api.booking.getByLab, {
      id: asLabId(labId),
    });
    expect(bookings).toHaveLength(1);
    expect(bookings[0]).toMatchObject({ startDate: SLOT_A_START });
  });

  it("returns empty array when no bookings exist for the lab", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId } = await seedCampusAndLab(t);

    const bookings = await t.query(api.booking.getByLab, {
      id: asLabId(labId),
    });
    expect(bookings).toEqual([]);
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId } = await seedCampusAndLab(t);

    setAuthUser(null);

    await expect(
      t.query(api.booking.getByLab, { id: asLabId(labId) }),
    ).rejects.toThrowError();
  });
});

describe("booking.getByCampus", () => {
  it("returns bookings for a specific campus when authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);
    await seedBooking(t, labId, campusId);

    const bookings = await t.query(api.booking.getByCampus, {
      id: asCampusId(campusId),
    });
    expect(bookings).toHaveLength(1);
  });

  it("returns empty array when no bookings exist for the campus", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { campusId } = await seedCampusAndLab(t);

    const bookings = await t.query(api.booking.getByCampus, {
      id: asCampusId(campusId),
    });
    expect(bookings).toEqual([]);
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { campusId } = await seedCampusAndLab(t);

    setAuthUser(null);

    await expect(
      t.query(api.booking.getByCampus, { id: asCampusId(campusId) }),
    ).rejects.toThrowError();
  });
});

describe("booking.getByUser", () => {
  it("returns bookings for the authenticated user", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);
    await seedBooking(t, labId, campusId);

    const bookings = await t.query(api.booking.getByUser, {
      userId: MOCK_USER._id,
    });
    expect(bookings).toHaveLength(1);
    expect(bookings[0].userId).toBe(MOCK_USER._id);
  });

  it("throws when querying another user's bookings without admin role", async () => {
    setAuthUser({ ...MOCK_USER, role: "student" });
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.booking.getByUser, { userId: OTHER_USER._id }),
    ).rejects.toThrowError();
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(null);
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.booking.getByUser, { userId: MOCK_USER._id }),
    ).rejects.toThrowError();
  });
});

describe("booking.getById", () => {
  it("returns a booking by ID when authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    const booking = await t.query(api.booking.getById, {
      id: asBookingId(bookingId),
    });
    expect(booking).toMatchObject({ startDate: SLOT_A_START });
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    setAuthUser(null);

    await expect(
      t.query(api.booking.getById, { id: asBookingId(bookingId) }),
    ).rejects.toThrowError();
  });
});

describe("booking.reschedule", () => {
  it("reschedules a booking when the owner is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    await t.mutation(api.booking.reschedule, {
      id: asBookingId(bookingId),
      startDate: SLOT_B_START,
      endDate: SLOT_B_END,
    });

    const booking = await t.query(api.booking.getById, {
      id: asBookingId(bookingId),
    });
    expect(booking).toMatchObject({
      startDate: SLOT_B_START,
      endDate: SLOT_B_END,
    });
  });

  it("throws when a different user tries to reschedule", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    setAuthUser(OTHER_USER);

    await expect(
      t.mutation(api.booking.reschedule, {
        id: asBookingId(bookingId),
        startDate: SLOT_B_START,
        endDate: SLOT_B_END,
      }),
    ).rejects.toThrowError();
  });

  it("throws when reschedule creates an overlap with another booking", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    // Two non-overlapping bookings
    await seedBooking(t, labId, campusId, SLOT_A_START, SLOT_A_END);
    const booking2Id = await seedBooking(
      t,
      labId,
      campusId,
      SLOT_B_START,
      SLOT_B_END,
    );

    // Move booking2 to overlap booking1
    await expect(
      t.mutation(api.booking.reschedule, {
        id: asBookingId(booking2Id),
        startDate: SLOT_A_START + 1_800_000,
        endDate: SLOT_A_END + 1_800_000,
      }),
    ).rejects.toThrowError();
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    setAuthUser(null);

    await expect(
      t.mutation(api.booking.reschedule, {
        id: asBookingId(bookingId),
        startDate: SLOT_B_START,
        endDate: SLOT_B_END,
      }),
    ).rejects.toThrowError();
  });
});

describe("booking.cancel", () => {
  it("cancels a booking when the owner is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    await t.mutation(api.booking.cancel, { id: asBookingId(bookingId) });

    const bookings = await t.query(api.booking.getByLab, {
      id: asLabId(labId),
    });
    expect(bookings).toHaveLength(0);
  });

  it("throws when a different user tries to cancel", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    setAuthUser(OTHER_USER);

    await expect(
      t.mutation(api.booking.cancel, { id: asBookingId(bookingId) }),
    ).rejects.toThrowError();
  });

  it("throws when user is not authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const { labId, campusId } = await seedCampusAndLab(t);

    const bookingId = await seedBooking(t, labId, campusId);

    setAuthUser(null);

    await expect(
      t.mutation(api.booking.cancel, { id: asBookingId(bookingId) }),
    ).rejects.toThrowError();
  });
});
