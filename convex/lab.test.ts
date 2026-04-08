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

const modules = import.meta.glob("./**/*.ts");

function setAuthUser(user: Record<string, unknown> | null) {
  mockUser = user;
}

const MOCK_USER = { _id: "user_abc123", email: "test@udi.edu.co", role: "admin" };

// Branded ID helpers to satisfy the zod-based tool schema types
type CampusId = string & { __tableName: "campuses" };
type LabId = string & { __tableName: "labs" };

const asCampusId = (id: string): CampusId => id as CampusId;
const asLabId = (id: string): LabId => id as LabId;

const CAMPUS_DATA = {
  name: "Test Campus",
  address: "Calle 1 # 2-3",
  city: "Bogotá",
  state: "Cundinamarca",
  zip: "110111",
};

/** Seed a campus via the internal mutation (requires auth to be set) */
async function seedCampus(t: ReturnType<typeof convexTest>) {
  return t.mutation(internal.campus.create, CAMPUS_DATA);
}

/** Seed a lab via the internal mutation (requires auth to be set) */
async function seedLab(
  t: ReturnType<typeof convexTest>,
  campusId: string,
  overrides: Partial<{
    floor: number;
    room: number;
    capacity: number;
  }> = {},
) {
  return t.mutation(internal.lab.create, {
    campusId: asCampusId(campusId),
    floor: overrides.floor ?? 3,
    room: overrides.room ?? 301,
    capacity: overrides.capacity ?? 20,
    availability: {
      days: ["Monday", "Wednesday", "Friday"],
      hours: ["08:00", "10:00", "14:00"],
    },
  });
}

describe("lab.getAll", () => {
  it("returns empty array when no labs exist", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const labs = await t.query(api.lab.getAll, {});
    expect(labs).toEqual([]);
  });

  it("returns all labs after creating them", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    await seedLab(t, campusId, { floor: 3, room: 301 });
    await seedLab(t, campusId, { floor: 4, room: 402 });

    const labs = await t.query(api.lab.getAll, {});
    expect(labs).toHaveLength(2);
  });
});

describe("lab.create (internal)", () => {
  it("creates a lab when user is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    const id = await seedLab(t, campusId);
    expect(id).toBeDefined();

    const labs = await t.query(api.lab.getAll, {});
    expect(labs).toHaveLength(1);
    expect(labs[0]).toMatchObject({ floor: 3, room: 301, capacity: 20 });
  });

  it("creates a lab with default capacity when capacity is omitted", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    // capacity is optional in toolInsertSchema (zod .optional().default(5))
    await t.mutation(internal.lab.create, {
      campusId: asCampusId(campusId),
      floor: 1,
      room: 101,
      availability: { days: ["Monday"], hours: ["08:00"] },
    });

    const labs = await t.query(api.lab.getAll, {});
    expect(labs[0].capacity).toBe(5);
  });

  it("throws when no user is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    setAuthUser(null);

    await expect(seedLab(t, campusId)).rejects.toThrowError();
  });
});

describe("lab.update (internal)", () => {
  it("updates lab fields when user is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);
    const labId = await seedLab(t, campusId);

    await t.mutation(internal.lab.update, {
      id: asLabId(labId),
      data: { capacity: 30, floor: 5 },
    });

    const labs = await t.query(api.lab.getAll, {});
    expect(labs[0]).toMatchObject({ capacity: 30, floor: 5 });
  });

  it("throws when no user is authenticated on update", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);
    const labId = await seedLab(t, campusId);

    setAuthUser(null);

    await expect(
      t.mutation(internal.lab.update, {
        id: asLabId(labId),
        data: { floor: 2 },
      }),
    ).rejects.toThrowError();
  });
});

describe("lab.remove (internal)", () => {
  it("deletes a lab when user is authenticated", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);
    const labId = await seedLab(t, campusId);

    await t.mutation(internal.lab.remove, { id: asLabId(labId) });

    const labs = await t.query(api.lab.getAll, {});
    expect(labs).toHaveLength(0);
  });

  it("throws when no user is authenticated on remove", async () => {
    setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);
    const labId = await seedLab(t, campusId);

    setAuthUser(null);

    await expect(
      t.mutation(internal.lab.remove, { id: asLabId(labId) }),
    ).rejects.toThrowError();
  });
});
