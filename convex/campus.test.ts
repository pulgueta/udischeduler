/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, it, vi } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

vi.mock("./auth", () => ({
  getCurrentUser: vi.fn(),
  authComponent: {},
  createAuth: vi.fn(),
  onCreate: vi.fn(),
  onUpdate: vi.fn(),
  onDelete: vi.fn(),
  getAuthUser: vi.fn(),
}));

const modules = import.meta.glob("./**/*.ts");

async function setAuthUser(user: Record<string, unknown> | null) {
  const { getCurrentUser } = await import("./auth");
  vi.mocked(getCurrentUser).mockResolvedValue(user as never);
}

const MOCK_USER = { _id: "user_abc123", email: "test@udi.edu.co" };

const CAMPUS_DATA = {
  name: "Campus Norte",
  address: "Calle 100 # 5-20",
  city: "Bogotá",
  state: "Cundinamarca",
  zip: "110121",
};

/** Seed a campus via the internal mutation (requires auth to be set) */
async function seedCampus(
  t: ReturnType<typeof convexTest>,
  data = CAMPUS_DATA,
) {
  return t.mutation(internal.campus.create, data);
}

describe("campus.getAll", () => {
  it("returns empty array when no campuses exist", async () => {
    const t = convexTest(schema, modules);
    const campuses = await t.query(api.campus.getAll, {});
    expect(campuses).toEqual([]);
  });

  it("returns all campuses after creating them", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);

    await seedCampus(t);
    await seedCampus(t, {
      name: "Campus Sur",
      address: "Cra 30 # 45-10",
      city: "Bogotá",
      state: "Cundinamarca",
      zip: "111611",
    });

    const campuses = await t.query(api.campus.getAll, {});
    expect(campuses).toHaveLength(2);
    expect(campuses[0]).toMatchObject({ name: "Campus Norte" });
    expect(campuses[1]).toMatchObject({ name: "Campus Sur" });
  });
});

describe("campus.create (internal)", () => {
  it("creates a campus when user is authenticated", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);

    const id = await t.mutation(internal.campus.create, CAMPUS_DATA);
    expect(id).toBeDefined();

    const campuses = await t.query(api.campus.getAll, {});
    expect(campuses).toHaveLength(1);
    expect(campuses[0]).toMatchObject(CAMPUS_DATA);
  });

  it("throws when no user is authenticated", async () => {
    await setAuthUser(null);
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(internal.campus.create, CAMPUS_DATA),
    ).rejects.toThrowError();
  });
});

describe("campus.update (internal)", () => {
  it("updates campus fields when user is authenticated", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);

    const campusId = await seedCampus(t);

    await t.mutation(internal.campus.update, {
      id: campusId,
      data: { name: "Campus Norte Actualizado" },
    });

    const campuses = await t.query(api.campus.getAll, {});
    expect(campuses[0]).toMatchObject({ name: "Campus Norte Actualizado" });
  });

  it("throws when no user is authenticated on update", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    await setAuthUser(null);

    await expect(
      t.mutation(internal.campus.update, {
        id: campusId,
        data: { name: "Unauthorized Edit" },
      }),
    ).rejects.toThrowError();
  });
});

describe("campus.remove (internal)", () => {
  it("deletes a campus when user is authenticated", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);

    const campusId = await seedCampus(t);
    await t.mutation(internal.campus.remove, { id: campusId });

    const campuses = await t.query(api.campus.getAll, {});
    expect(campuses).toHaveLength(0);
  });

  it("throws when no user is authenticated on remove", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);
    const campusId = await seedCampus(t);

    await setAuthUser(null);

    await expect(
      t.mutation(internal.campus.remove, { id: campusId }),
    ).rejects.toThrowError();
  });
});

describe("campus.search", () => {
  it("returns campuses matching the search query when authenticated", async () => {
    await setAuthUser(MOCK_USER);
    const t = convexTest(schema, modules);

    await seedCampus(t); // "Campus Norte"
    await seedCampus(t, {
      name: "Campus Oriente",
      address: "Cra 50 # 20-30",
      city: "Medellín",
      state: "Antioquia",
      zip: "050001",
    });

    const results = await t.query(api.campus.search, { query: "Norte" });

    // convex-test text search returns docs containing at least one word prefix
    expect(results.some((c) => c.name.includes("Norte"))).toBe(true);
  });

  it("throws when no user is authenticated", async () => {
    await setAuthUser(null);
    const t = convexTest(schema, modules);

    await expect(
      t.query(api.campus.search, { query: "Norte" }),
    ).rejects.toThrowError();
  });
});
