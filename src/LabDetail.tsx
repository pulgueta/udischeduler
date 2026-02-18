import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00",
];
const END_TIMES = [...TIME_SLOTS.slice(1), "20:00"];

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTimeLabel(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const dh = h % 12 || 12;
  return `${dh}:${pad(m)} ${ampm}`;
}

type SelectedStudent = { userId: string; fullName: string };
type SelectedProfessor = { userId: string; fullName: string; department: string };

export default function LabDetail({
  labId,
  profile,
  onBack,
}: {
  labId: Id<"labs">;
  profile: Doc<"profiles">;
  onBack: () => void;
}) {
  const lab = useQuery(api.labs.get, { labId });
  const today = formatDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState(today);
  const bookingsForDate = useQuery(api.bookings.getLabBookingsForDate, {
    labId,
    date: selectedDate,
  });
  const createBooking = useMutation(api.bookings.create);

  // Form state
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [studentCount, setStudentCount] = useState(1);
  const [requiredItems, setRequiredItems] = useState<string[]>([]);
  const [itemInput, setItemInput] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Professor search (for students)
  const [profSearch, setProfSearch] = useState("");
  const [debouncedProfSearch, setDebouncedProfSearch] = useState("");
  const [selectedProfessor, setSelectedProfessor] = useState<SelectedProfessor | null>(null);
  const [showProfDropdown, setShowProfDropdown] = useState(false);
  const profRef = useRef<HTMLDivElement>(null);

  // Student search (for professors)
  const [studentSearch, setStudentSearch] = useState("");
  const [debouncedStudentSearch, setDebouncedStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<SelectedStudent[]>([]);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const studentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedProfSearch(profSearch), 300);
    return () => clearTimeout(t);
  }, [profSearch]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedStudentSearch(studentSearch), 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profRef.current && !profRef.current.contains(e.target as Node))
        setShowProfDropdown(false);
      if (studentRef.current && !studentRef.current.contains(e.target as Node))
        setShowStudentDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const profResults = useQuery(
    api.profiles.searchProfessors,
    profile.role === "student" && debouncedProfSearch.trim()
      ? { searchTerm: debouncedProfSearch.trim() }
      : "skip"
  );

  const studentResults = useQuery(
    api.profiles.searchStudents,
    profile.role === "professor" && debouncedStudentSearch.trim()
      ? { searchTerm: debouncedStudentSearch.trim(), department: profile.department }
      : "skip"
  );

  if (lab === undefined || lab === null) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isSlotBooked = (slot: string) => {
    if (!bookingsForDate) return false;
    return bookingsForDate.some((b) => slot >= b.startTime && slot < b.endTime);
  };

  const addItem = () => {
    const trimmed = itemInput.trim();
    if (trimmed && !requiredItems.includes(trimmed)) {
      setRequiredItems([...requiredItems, trimmed]);
      setItemInput("");
    }
  };

  const handleBook = async () => {
    if (startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }
    if (studentCount < 1 || studentCount > lab.capacity) {
      toast.error(`Student count must be between 1 and ${lab.capacity}`);
      return;
    }

    setSubmitting(true);
    try {
      await createBooking({
        labId,
        date: selectedDate,
        startTime,
        endTime,
        studentCount,
        campus: lab.campus,
        ...(selectedProfessor
          ? { professorId: selectedProfessor.userId as Id<"users"> }
          : {}),
        ...(selectedStudents.length > 0
          ? { invitedStudentIds: selectedStudents.map((s) => s.userId as Id<"users">) }
          : {}),
        ...(requiredItems.length > 0 ? { requiredItems } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      const message =
        selectedProfessor
          ? "Lab booked! An invitation has been sent to the professor."
          : selectedStudents.length > 0
            ? "Lab booked! Notifications sent to invited students."
            : "Lab booked successfully!";
      toast.success(message);

      setStartTime("09:00");
      setEndTime("10:00");
      setStudentCount(1);
      setSelectedProfessor(null);
      setProfSearch("");
      setSelectedStudents([]);
      setStudentSearch("");
      setRequiredItems([]);
      setItemInput("");
      setNotes("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to book lab");
    } finally {
      setSubmitting(false);
    }
  };

  const availableEndTimes = END_TIMES.filter((t) => t > startTime);

  const filteredProfResults = (profResults || []).filter(
    (p) => p.userId !== selectedProfessor?.userId
  );
  const filteredStudentResults = (studentResults || []).filter(
    (s) => !selectedStudents.some((sel) => sel.userId === s.userId)
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary mb-6 transition-colors"
      >
        <span>←</span> Back to Labs
      </button>

      {/* Lab Info */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-primary">{lab.name}</h1>
            <div className="mt-2 space-y-1 text-sm text-secondary">
              <p>📍 {lab.building}, Room {lab.room}</p>
              <p>🏫 {lab.campus}</p>
              <p>👥 Capacity: {lab.capacity} students</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {lab.amenities.map((a, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-50 rounded-full text-xs text-blue-700 font-medium">
                {a}
              </span>
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-secondary leading-relaxed">{lab.description}</p>
        <div className="mt-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-xs text-amber-800">
            <strong>Open to all majors:</strong> Labs are available across all campuses and programs. Any student or professor can book this lab regardless of their department.
          </p>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-lg border border-border p-6 mb-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Availability</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-primary mb-1">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-xs text-secondary mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></span> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span> Booked
            </span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {TIME_SLOTS.map((slot) => {
              const booked = isSlotBooked(slot);
              return (
                <div
                  key={slot}
                  className={`h-12 rounded-md flex flex-col items-center justify-center text-xs font-medium border ${
                    booked
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                  }`}
                >
                  <span>{formatTimeLabel(slot).split(" ")[0]}</span>
                  <span className="text-[10px] opacity-70">{formatTimeLabel(slot).split(" ")[1]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Booking Form */}
      <div className="bg-white rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Book This Lab</h2>
        <div className="space-y-4">
          {/* Date/Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                min={today}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Start Time</label>
              <select
                value={startTime}
                onChange={(e) => {
                  setStartTime(e.target.value);
                  if (e.target.value >= endTime) {
                    const idx = TIME_SLOTS.indexOf(e.target.value);
                    if (idx < END_TIMES.length - 1) setEndTime(END_TIMES[idx]);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{formatTimeLabel(t)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">End Time</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              >
                {availableEndTimes.map((t) => (
                  <option key={t} value={t}>{formatTimeLabel(t)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Student count + Campus */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Number of Students</label>
              <input
                type="number"
                min={1}
                max={lab.capacity}
                value={studentCount}
                onChange={(e) => setStudentCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              />
              <p className="text-xs text-secondary mt-1">Max capacity: {lab.capacity}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Campus</label>
              <input
                type="text"
                value={lab.campus}
                readOnly
                className="w-full px-3 py-2.5 rounded-md bg-surface-tertiary border border-border text-sm text-secondary cursor-not-allowed"
              />
            </div>
          </div>

          {/* Student → Professor Search */}
          {profile.role === "student" && (
            <div ref={profRef} className="relative">
              <label className="block text-sm font-medium text-primary mb-1">
                Invite Professor (Optional)
              </label>
              {selectedProfessor ? (
                <div className="flex items-center gap-2 p-3 rounded-md bg-blue-50 border border-blue-200">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">{selectedProfessor.fullName}</p>
                    <p className="text-xs text-blue-700">{selectedProfessor.department}</p>
                  </div>
                  <button
                    onClick={() => { setSelectedProfessor(null); setProfSearch(""); }}
                    className="text-blue-600 hover:text-blue-800 font-bold"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <input
                  type="text"
                  value={profSearch}
                  onChange={(e) => { setProfSearch(e.target.value); setShowProfDropdown(true); }}
                  onFocus={() => setShowProfDropdown(true)}
                  placeholder="Search by professor name..."
                  className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                />
              )}
              {showProfDropdown && !selectedProfessor && filteredProfResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-border shadow-lg max-h-48 overflow-y-auto">
                  {filteredProfResults.map((p) => (
                    <button
                      key={p.userId}
                      onClick={() => {
                        setSelectedProfessor({ userId: p.userId, fullName: p.fullName, department: p.department });
                        setProfSearch("");
                        setShowProfDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-tertiary transition-colors border-b border-border last:border-0"
                    >
                      <p className="text-sm font-medium text-primary">{p.fullName}</p>
                      <p className="text-xs text-secondary">{p.department} · {p.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedProfessor && (
                <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                  ⚠️ The professor will receive a notification and must accept this invitation.
                </p>
              )}
            </div>
          )}

          {/* Professor → Student Search */}
          {profile.role === "professor" && (
            <div ref={studentRef} className="relative">
              <label className="block text-sm font-medium text-primary mb-1">
                Invite Students from {profile.department}
              </label>
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => { setStudentSearch(e.target.value); setShowStudentDropdown(true); }}
                onFocus={() => setShowStudentDropdown(true)}
                placeholder="Search students by name..."
                className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
              />
              {showStudentDropdown && filteredStudentResults.length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-border shadow-lg max-h-48 overflow-y-auto">
                  {filteredStudentResults.map((s) => (
                    <button
                      key={s.userId}
                      onClick={() => {
                        setSelectedStudents([...selectedStudents, { userId: s.userId, fullName: s.fullName }]);
                        setStudentSearch("");
                        setShowStudentDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-surface-tertiary transition-colors border-b border-border last:border-0"
                    >
                      <p className="text-sm font-medium text-primary">{s.fullName}</p>
                      <p className="text-xs text-secondary">{s.studentId ? `${s.studentId} · ` : ""}{s.email}</p>
                    </button>
                  ))}
                </div>
              )}
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedStudents.map((s) => (
                    <span key={s.userId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                      {s.fullName}
                      <button
                        onClick={() => setSelectedStudents(selectedStudents.filter((x) => x.userId !== s.userId))}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {selectedStudents.length > 0 && (
                <p className="text-xs text-secondary mt-1">
                  {selectedStudents.length} student{selectedStudents.length !== 1 ? "s" : ""} will be notified by email.
                </p>
              )}
            </div>
          )}

          {/* Required Items (professor) */}
          {profile.role === "professor" && (
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Required Items for Students</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                  placeholder="e.g., Laptop, USB drive..."
                  className="flex-1 px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
                />
                <button type="button" onClick={addItem} className="px-4 py-2.5 rounded-md bg-surface-tertiary border border-border text-sm font-medium text-primary hover:bg-surface-secondary transition-colors">
                  Add
                </button>
              </div>
              {requiredItems.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {requiredItems.map((item, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-medium">
                      {item}
                      <button onClick={() => setRequiredItems(requiredItems.filter((_, j) => j !== i))} className="hover:text-amber-900">×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-primary mb-1">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this booking..."
              rows={3}
              className="w-full px-3 py-2.5 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none resize-none"
            />
          </div>

          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Booking..." : "Book Lab"}
          </button>
        </div>
      </div>
    </div>
  );
}
