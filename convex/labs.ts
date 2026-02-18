import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_LABS = [
  {
    name: "Computer Lab A101",
    campus: "Main Campus",
    building: "Technology Center",
    room: "A101",
    capacity: 30,
    description:
      "General purpose computer lab with modern workstations and dual monitors for everyday computing tasks.",
    amenities: [
      "Projector",
      "Whiteboard",
      "Air Conditioning",
      "Wi-Fi",
      "Dual Monitors",
    ],
  },
  {
    name: "Computer Lab A102",
    campus: "Main Campus",
    building: "Technology Center",
    room: "A102",
    capacity: 25,
    description:
      "Specialized lab for software development with high-performance machines and development tools pre-installed.",
    amenities: [
      "Projector",
      "Whiteboard",
      "Air Conditioning",
      "Wi-Fi",
      "High-Performance PCs",
    ],
  },
  {
    name: "Computer Lab B201",
    campus: "North Campus",
    building: "Engineering Hall",
    room: "B201",
    capacity: 40,
    description:
      "Large computer lab ideal for lectures, workshops, and hands-on training sessions.",
    amenities: [
      "Projector",
      "Smart Board",
      "Air Conditioning",
      "Wi-Fi",
      "Surround Sound",
    ],
  },
  {
    name: "Computer Lab B202",
    campus: "North Campus",
    building: "Engineering Hall",
    room: "B202",
    capacity: 20,
    description:
      "Compact lab designed for small group sessions, tutorials, and collaborative work.",
    amenities: ["Projector", "Whiteboard", "Air Conditioning", "Wi-Fi"],
  },
  {
    name: "Computer Lab C301",
    campus: "South Campus",
    building: "Science Building",
    room: "C301",
    capacity: 35,
    description:
      "Multimedia lab equipped with video editing software, graphic design tools, and creative workstations.",
    amenities: [
      "Projector",
      "Green Screen",
      "Air Conditioning",
      "Wi-Fi",
      "Graphics Tablets",
    ],
  },
  {
    name: "Computer Lab D401",
    campus: "Downtown Campus",
    building: "Business Center",
    room: "D401",
    capacity: 30,
    description:
      "Business-oriented lab with presentation facilities, video conferencing, and collaborative tools.",
    amenities: [
      "Projector",
      "Video Conferencing",
      "Air Conditioning",
      "Wi-Fi",
      "Webcams",
    ],
  },
];

export const list = query({
  args: { currentDate: v.string(), currentTime: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const labs = await ctx.db.query("labs").collect();

    return Promise.all(
      labs.map(async (lab) => {
        const bookings = await ctx.db
          .query("bookings")
          .withIndex("by_lab_and_date", (q) =>
            q.eq("labId", lab._id).eq("date", args.currentDate)
          )
          .collect();

        const activeBookings = bookings.filter((b) => b.status === "active");
        const currentBooking = activeBookings.find(
          (b) =>
            b.startTime <= args.currentTime && b.endTime > args.currentTime
        );

        let currentStatus: string;
        let statusInfo: string | undefined;

        if (currentBooking) {
          currentStatus = "in-use";
          statusInfo = `Until ${currentBooking.endTime}`;
        } else {
          const upcoming = activeBookings
            .filter((b) => b.startTime > args.currentTime)
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          if (upcoming.length > 0) {
            currentStatus = "upcoming";
            statusInfo = `Next at ${upcoming[0].startTime}`;
          } else {
            currentStatus = "available";
          }
        }

        return {
          ...lab,
          currentStatus,
          statusInfo,
        };
      })
    );
  },
});

export const get = query({
  args: { labId: v.id("labs") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(args.labId);
  },
});

export const seedLabs = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db.query("labs").first();
    if (existing) return;

    for (const lab of DEFAULT_LABS) {
      await ctx.db.insert("labs", lab);
    }
  },
});
