import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00",
];
const END_TIMES = [...TIME_SLOTS.slice(1), "20:00"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTimeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${(h % 12 || 12)}:${pad(m)} ${ampm}`;
}
function formatDateDisplay(d: string) {
  const [y, m, day] = d.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(day));
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

type BookingEnriched = {
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
};

export default function MyBookings({
  profile,
  onViewLab,
}: {
  profile: Doc<"profiles">;
  onViewLab: (labId: Id<"labs">) => void;
}) {
  const bookings = useQuery(api.bookings.listByUser);
  const updateBooking = useMutation(api.bookings.update);
  const cancelBooking = useMutation(api.bookings.cancel);
  const professors = useQuery(
    api.profiles.listProfessors,
    profile.role === "student" ? {} : "skip"
  );

  const [filter, setFilter] = useState<"all" | "upcoming" | "past" | "cancelled">("upcoming");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (bookings === undefined) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const today = formatDateStr(new Date());
  const filtered = bookings.filter((b) => {
    switch (filter) {
      case "upcoming": return b.status === "active" && b.date >= today;
      case "past": return b.status === "active" && b.date < today;
      case "cancelled": return b.status === "cancelled";
      default: return true;
    }
  });

  const upcomingCount = bookings.filter((b) => b.status === "active" && b.date >= today).length;

  const handleCancel = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      await cancelBooking({ bookingId: bookingId as Id<"bookings"> });
      toast.success("Booking cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">My Bookings</h1>
          <p className="text-secondary text-sm mt-1">{upcomingCount} upcoming booking{upcomingCount !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="flex gap-1 p-1 bg-surface-tertiary rounded-lg mb-6 w-fit">
        {([
          { key: "upcoming", label: "Upcoming" },
          { key: "past", label: "Past" },
          { key: "cancelled", label: "Cancelled" },
          { key: "all", label: "All" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === key ? "bg-white text-primary shadow-sm" : "text-secondary hover:text-primary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-border">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-secondary">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((booking) =>
            editingId === booking._id ? (
              <EditBookingForm
                key={booking._id}
                booking={booking}
                profile={profile}
                professors={professors || []}
                onSave={async (data) => {
                  try {
                    await updateBooking(data);
                    toast.success("Booking updated");
                    setEditingId(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Failed to update");
                  }
                }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <BookingCard
                key={booking._id}
                booking={booking}
                profile={profile}
                onEdit={() => setEditingId(booking._id)}
                onCancel={() => handleCancel(booking._id)}
                onViewLab={() => onViewLab(booking.labId as Id<"labs">)}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

function ApprovalBadge({ booking }: { booking: BookingEnriched }) {
  if (booking.isInvitedTo) {
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
        📨 Invited by professor
      </span>
    );
  }
  if (!booking.professorApproval) return null;
  const config: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", label: "⏳ Awaiting professor" },
    accepted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "✅ Professor confirmed" },
    declined: { bg: "bg-red-50", text: "text-red-700", label: "❌ Professor declined" },
  };
  const c = config[booking.professorApproval];
  if (!c) return null;
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>{c.label}</span>;
}

function BookingCard({
  booking, profile, onEdit, onCancel, onViewLab,
}: {
  booking: BookingEnriched;
  profile: Doc<"profiles">;
  onEdit: () => void;
  onCancel: () => void;
  onViewLab: () => void;
}) {
  const isActive = booking.status === "active";
  const today = formatDateStr(new Date());
  const isPast = booking.date < today;
  const canModify = isActive && !isPast && (booking.isOwn || booking.isAssignedProfessor);

  return (
    <div className="bg-white rounded-lg border border-border p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold shrink-0 ${isActive ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
            🖥️
          </div>
          <div>
            <h3 className="font-semibold text-primary">{booking.labName}</h3>
            <p className="text-xs text-secondary">{booking.labRoom}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
            booking.status === "cancelled" ? "bg-red-50 text-red-700"
              : isPast ? "bg-gray-100 text-gray-600"
              : "bg-emerald-50 text-emerald-700"
          }`}>
            {booking.status === "cancelled" ? "Cancelled" : isPast ? "Completed" : "Active"}
          </span>
          <ApprovalBadge booking={booking} />
          {booking.isAssignedProfessor && !booking.isOwn && (
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              Assigned to you
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm mb-3">
        <div>
          <p className="text-xs text-secondary">Date</p>
          <p className="font-medium text-primary">{formatDateDisplay(booking.date)}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Time</p>
          <p className="font-medium text-primary">{formatTimeLabel(booking.startTime)} – {formatTimeLabel(booking.endTime)}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Students</p>
          <p className="font-medium text-primary">{booking.studentCount} / {booking.labCapacity}</p>
        </div>
        <div>
          <p className="text-xs text-secondary">Campus</p>
          <p className="font-medium text-primary">{booking.campus}</p>
        </div>
      </div>

      {booking.isAssignedProfessor && !booking.isOwn && (
        <div className="mb-3 text-sm">
          <p className="text-xs text-secondary">Booked by</p>
          <p className="font-medium text-primary">{booking.bookerName}</p>
        </div>
      )}

      {booking.professorName && booking.isOwn && (
        <div className="mb-3 text-sm">
          <p className="text-xs text-secondary">Professor</p>
          <p className="font-medium text-primary">{booking.professorName}</p>
        </div>
      )}

      {booking.isInvitedTo && (
        <div className="mb-3 text-sm">
          <p className="text-xs text-secondary">Organized by</p>
          <p className="font-medium text-primary">{booking.bookerName}</p>
        </div>
      )}

      {booking.invitedStudentNames.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-secondary mb-1">Invited Students</p>
          <div className="flex flex-wrap gap-1.5">
            {booking.invitedStudentNames.map((name, i) => (
              <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">{name}</span>
            ))}
          </div>
        </div>
      )}

      {booking.requiredItems && booking.requiredItems.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-secondary mb-1">Required Items</p>
          <div className="flex flex-wrap gap-1.5">
            {booking.requiredItems.map((item, i) => (
              <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium">{item}</span>
            ))}
          </div>
        </div>
      )}

      {booking.notes && (
        <div className="mb-3 text-sm">
          <p className="text-xs text-secondary">Notes</p>
          <p className="text-primary">{booking.notes}</p>
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-border">
        <button onClick={onViewLab} className="px-3 py-1.5 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors">
          View Lab
        </button>
        {canModify && (
          <>
            <button onClick={onEdit} className="px-3 py-1.5 rounded-md text-xs font-medium text-primary bg-surface-tertiary hover:bg-surface-secondary border border-border transition-colors">
              Edit
            </button>
            <button onClick={onCancel} className="px-3 py-1.5 rounded-md text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 transition-colors">
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EditBookingForm({
  booking, profile, professors, onSave, onCancel,
}: {
  booking: BookingEnriched;
  profile: Doc<"profiles">;
  professors: Array<{ userId: string; name: string; department: string }>;
  onSave: (data: {
    bookingId: Id<"bookings">;
    date: string;
    startTime: string;
    endTime: string;
    studentCount: number;
    professorId?: Id<"users">;
    requiredItems?: string[];
    notes?: string;
  }) => Promise<void>;
  onCancel: () => void;
}) {
  const today = formatDateStr(new Date());
  const [date, setDate] = useState(booking.date);
  const [startTime, setStartTime] = useState(booking.startTime);
  const [endTime, setEndTime] = useState(booking.endTime);
  const [studentCount, setStudentCount] = useState(booking.studentCount);
  const [selectedProfessor, setSelectedProfessor] = useState(booking.professorId || "");
  const [requiredItems, setRequiredItems] = useState<string[]>(booking.requiredItems || []);
  const [itemInput, setItemInput] = useState("");
  const [notes, setNotes] = useState(booking.notes || "");
  const [saving, setSaving] = useState(false);

  const availableEndTimes = END_TIMES.filter((t) => t > startTime);

  const handleSubmit = async () => {
    if (startTime >= endTime) { toast.error("End time must be after start time"); return; }
    setSaving(true);
    try {
      await onSave({
        bookingId: booking._id as Id<"bookings">,
        date, startTime, endTime, studentCount,
        ...(selectedProfessor ? { professorId: selectedProfessor as Id<"users"> } : {}),
        ...(requiredItems.length > 0 ? { requiredItems } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
    } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-lg border-2 border-blue-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-primary">Edit Booking</h3>
        <span className="text-sm text-secondary">{booking.labName}</span>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Date</label>
            <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Start Time</label>
            <select value={startTime} onChange={(e) => { setStartTime(e.target.value); if (e.target.value >= endTime) { const idx = TIME_SLOTS.indexOf(e.target.value); if (idx < END_TIMES.length - 1) setEndTime(END_TIMES[idx]); } }} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none">
              {TIME_SLOTS.map((t) => (<option key={t} value={t}>{formatTimeLabel(t)}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">End Time</label>
            <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none">
              {availableEndTimes.map((t) => (<option key={t} value={t}>{formatTimeLabel(t)}</option>))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Students</label>
            <input type="number" min={1} max={booking.labCapacity} value={studentCount} onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none" />
          </div>
          {profile.role === "student" && (
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">Professor</label>
              <select value={selectedProfessor} onChange={(e) => setSelectedProfessor(e.target.value)} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none">
                <option value="">None</option>
                {professors.map((p) => (<option key={p.userId} value={p.userId}>{p.name}</option>))}
              </select>
            </div>
          )}
        </div>
        {(profile.role === "professor" || booking.isAssignedProfessor) && (
          <div>
            <label className="block text-xs font-medium text-secondary mb-1">Required Items</label>
            <div className="flex gap-2 mb-2">
              <input type="text" value={itemInput} onChange={(e) => setItemInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); const t = itemInput.trim(); if (t && !requiredItems.includes(t)) { setRequiredItems([...requiredItems, t]); setItemInput(""); } } }} placeholder="Add item..." className="flex-1 px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none" />
              <button type="button" onClick={() => { const t = itemInput.trim(); if (t && !requiredItems.includes(t)) { setRequiredItems([...requiredItems, t]); setItemInput(""); } }} className="px-3 py-2 rounded-md bg-surface-tertiary border border-border text-sm font-medium hover:bg-surface-secondary transition-colors">Add</button>
            </div>
            {requiredItems.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {requiredItems.map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                    {item}
                    <button onClick={() => setRequiredItems(requiredItems.filter((_, j) => j !== i))} className="hover:text-blue-900">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-secondary mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-md bg-white border border-border text-sm focus:border-blue-600 outline-none resize-none" />
        </div>
        <div className="flex items-center gap-2 pt-2">
          <button onClick={handleSubmit} disabled={saving} className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-md bg-surface-tertiary border border-border text-sm font-medium text-primary hover:bg-surface-secondary transition-colors">
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
