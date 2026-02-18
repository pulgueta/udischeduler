import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00",
];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatTimeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12)}:${pad(m)} ${ampm}`;
}
function formatDateDisplay(d: string) {
  const [y, m, day] = d.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

type Invitation = {
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
};

export default function Invitations({
  profile,
}: {
  profile: Doc<"profiles">;
}) {
  const invitations = useQuery(api.bookings.getPendingInvitations);
  const respond = useMutation(api.bookings.respondToInvitation);

  if (invitations === undefined) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const handleRespond = async (bookingId: string, accept: boolean) => {
    const action = accept ? "accept" : "decline";
    if (!confirm(`Are you sure you want to ${action} this invitation?`)) return;
    try {
      await respond({ bookingId: bookingId as Id<"bookings">, accept });
      toast.success(
        accept
          ? "Invitation accepted! The student has been notified."
          : "Invitation declined. The student has been notified."
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to respond");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-primary tracking-tight">
          Pending Invitations
        </h1>
        <p className="text-secondary text-sm mt-1">
          Review lab booking invitations from students. Check the lab
          availability before accepting.
        </p>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-border">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-secondary font-medium">
            No pending invitations
          </p>
          <p className="text-sm text-secondary-light mt-1">
            You're all caught up!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {invitations.map((inv) => (
            <InvitationCard
              key={inv._id}
              invitation={inv}
              onAccept={() => handleRespond(inv._id, true)}
              onDecline={() => handleRespond(inv._id, false)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvitationCard({
  invitation,
  onAccept,
  onDecline,
}: {
  invitation: Invitation;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="bg-white rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-border bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary text-lg">
              {invitation.labName}
            </h3>
            <p className="text-sm text-secondary">{invitation.labRoom} · {invitation.campus}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-medium text-primary">
              From: {invitation.studentName}
            </p>
            <p className="text-xs text-secondary">
              {invitation.studentDepartment}
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="text-xs text-secondary">Date</p>
            <p className="text-sm font-medium text-primary">
              {formatDateDisplay(invitation.date)}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary">Time</p>
            <p className="text-sm font-medium text-primary">
              {formatTimeLabel(invitation.startTime)} –{" "}
              {formatTimeLabel(invitation.endTime)}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary">Students</p>
            <p className="text-sm font-medium text-primary">
              {invitation.studentCount} / {invitation.labCapacity}
            </p>
          </div>
          <div>
            <p className="text-xs text-secondary">Campus</p>
            <p className="text-sm font-medium text-primary">
              {invitation.campus}
            </p>
          </div>
        </div>

        {invitation.notes && (
          <div className="mb-5 p-3 rounded-lg bg-surface-tertiary">
            <p className="text-xs text-secondary mb-1">Student's Notes</p>
            <p className="text-sm text-primary">{invitation.notes}</p>
          </div>
        )}

        {/* Availability Timeline */}
        <div className="mb-5">
          <h4 className="text-sm font-medium text-primary mb-2">
            Lab Availability — {formatDateDisplay(invitation.date)}
          </h4>
          <div className="flex items-center gap-4 text-xs text-secondary mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></span>
              Requested
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>
              Other bookings
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></span>
              Available
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
            {TIME_SLOTS.map((slot) => {
              const isRequested =
                slot >= invitation.startTime && slot < invitation.endTime;
              const isOtherBooked = invitation.existingBookings.some(
                (b) => slot >= b.startTime && slot < b.endTime
              );

              return (
                <div
                  key={slot}
                  className={`h-10 rounded-md flex flex-col items-center justify-center text-[10px] font-medium border ${
                    isRequested
                      ? "bg-blue-100 text-blue-800 border-blue-300 ring-1 ring-blue-400"
                      : isOtherBooked
                        ? "bg-red-50 text-red-700 border-red-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <span>{formatTimeLabel(slot).split(" ")[0]}</span>
                  <span className="opacity-60">
                    {formatTimeLabel(slot).split(" ")[1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-border">
          <button
            onClick={onAccept}
            className="px-5 py-2.5 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 active:scale-[0.98] transition-all"
          >
            Accept Invitation
          </button>
          <button
            onClick={onDecline}
            className="px-5 py-2.5 rounded-md bg-white text-red-700 text-sm font-medium border border-red-200 hover:bg-red-50 active:scale-[0.98] transition-all"
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
