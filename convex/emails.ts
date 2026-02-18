import { components, internal } from "./_generated/api";
import { Resend } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Test mode: all emails go to delivered@resend.dev and appear in Resend Dashboard → Logs
export const resend = new Resend(components.resend, {});

export const notifyProfessorOfInvitation = internalMutation({
  args: {
    professorName: v.string(),
    studentName: v.string(),
    labName: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.sendEmail(
      ctx,
      "LabBook <testing@resend.dev>",
      "delivered@resend.dev",
      `Lab Booking Invitation from ${args.studentName}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#1e40af;">Lab Booking Invitation</h2>
        <p>Dear <strong>${args.professorName}</strong>,</p>
        <p><strong>${args.studentName}</strong> has invited you to a lab booking:</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Lab:</td><td style="padding:4px 0;font-weight:600;">${args.labName}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Date:</td><td style="padding:4px 0;font-weight:600;">${args.date}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Time:</td><td style="padding:4px 0;font-weight:600;">${args.startTime} – ${args.endTime}</td></tr>
        </table>
        <p>Please log in to <strong>LabBook</strong> to review the lab availability and accept or decline this invitation.</p>
      </div>`
    );
  },
});

export const notifyStudentsOfBooking = internalMutation({
  args: {
    studentIds: v.array(v.id("users")),
    professorName: v.string(),
    labName: v.string(),
    date: v.string(),
    startTime: v.string(),
    endTime: v.string(),
    requiredItems: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const itemsHtml =
      args.requiredItems && args.requiredItems.length > 0
        ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Bring:</td><td style="padding:4px 0;font-weight:600;">${args.requiredItems.join(", ")}</td></tr>`
        : "";

    for (const studentId of args.studentIds) {
      const studentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", studentId))
        .unique();
      const studentName = studentProfile?.fullName || "Student";

      await resend.sendEmail(
        ctx,
        "LabBook <testing@resend.dev>",
        "delivered@resend.dev",
        `Lab Session: ${args.labName} on ${args.date}`,
        `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#1e40af;">Lab Session Scheduled</h2>
          <p>Dear <strong>${studentName}</strong>,</p>
          <p>Professor <strong>${args.professorName}</strong> has scheduled a lab session you're invited to:</p>
          <table style="border-collapse:collapse;margin:16px 0;">
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Lab:</td><td style="padding:4px 0;font-weight:600;">${args.labName}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Date:</td><td style="padding:4px 0;font-weight:600;">${args.date}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;color:#6b7280;">Time:</td><td style="padding:4px 0;font-weight:600;">${args.startTime} – ${args.endTime}</td></tr>
            ${itemsHtml}
          </table>
          <p>Please log in to <strong>LabBook</strong> to view details.</p>
        </div>`
      );
    }
  },
});

export const notifyApprovalResult = internalMutation({
  args: {
    studentName: v.string(),
    professorName: v.string(),
    labName: v.string(),
    date: v.string(),
    accepted: v.boolean(),
  },
  handler: async (ctx, args) => {
    const status = args.accepted ? "Accepted" : "Declined";
    const statusColor = args.accepted ? "#059669" : "#dc2626";
    const followUp = args.accepted
      ? "Your booking is now confirmed with the professor."
      : "Your booking remains active without a professor assignment. You may invite another professor if needed.";

    await resend.sendEmail(
      ctx,
      "LabBook <testing@resend.dev>",
      "delivered@resend.dev",
      `Booking ${status} by Prof. ${args.professorName}`,
      `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:${statusColor};">Booking Invitation ${status}</h2>
        <p>Dear <strong>${args.studentName}</strong>,</p>
        <p>Professor <strong>${args.professorName}</strong> has <strong style="color:${statusColor};">${status.toLowerCase()}</strong> your lab booking invitation for <strong>${args.labName}</strong> on <strong>${args.date}</strong>.</p>
        <p>${followUp}</p>
        <p>Log in to <strong>LabBook</strong> for details.</p>
      </div>`
    );
  },
});
