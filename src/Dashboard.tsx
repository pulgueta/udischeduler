import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id, Doc } from "../convex/_generated/dataModel";
import { useState, useEffect, useRef } from "react";

function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function formatDateStr(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function formatTimeStr(d: Date) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type LabWithStatus = {
  _id: Id<"labs">;
  _creationTime: number;
  name: string;
  campus: string;
  building: string;
  room: string;
  capacity: number;
  description: string;
  amenities: string[];
  currentStatus: string;
  statusInfo?: string;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  available: {
    label: "Available",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  "in-use": {
    label: "In Use",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  upcoming: {
    label: "Upcoming",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
};

export default function Dashboard({
  profile,
  onSelectLab,
}: {
  profile: Doc<"profiles">;
  onSelectLab: (labId: Id<"labs">) => void;
}) {
  const [now, setNow] = useState(() => new Date());
  const currentDate = formatDateStr(now);
  const currentTime = formatTimeStr(now);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const labs = useQuery(api.labs.list, { currentDate, currentTime });
  const seedLabs = useMutation(api.labs.seedLabs);
  const seededRef = useRef(false);

  useEffect(() => {
    if (labs !== undefined && labs.length === 0 && !seededRef.current) {
      seededRef.current = true;
      seedLabs();
    }
  }, [labs, seedLabs]);

  const [campusFilter, setCampusFilter] = useState("all");

  if (labs === undefined) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const campuses = [...new Set(labs.map((l) => l.campus))].sort();
  const filteredLabs =
    campusFilter === "all"
      ? labs
      : labs.filter((l) => l.campus === campusFilter);

  const availableCount = labs.filter(
    (l) => l.currentStatus === "available"
  ).length;
  const inUseCount = labs.filter((l) => l.currentStatus === "in-use").length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary tracking-tight">
            Computer Labs
          </h1>
          <p className="text-secondary text-sm mt-1">
            {profile.role === "student"
              ? "Browse and book labs for your classes"
              : "Schedule labs for your lectures"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="px-3 py-2 rounded-md bg-white border border-border text-sm text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none"
          >
            <option value="all">All Campuses</option>
            {campuses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">
            {labs.length}
          </div>
          <div>
            <p className="text-xs text-secondary">Total Labs</p>
            <p className="font-semibold text-primary text-sm">All Campuses</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-semibold">
            {availableCount}
          </div>
          <div>
            <p className="text-xs text-secondary">Available Now</p>
            <p className="font-semibold text-primary text-sm">Ready to book</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-border p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-700 font-semibold">
            {inUseCount}
          </div>
          <div>
            <p className="text-xs text-secondary">In Use</p>
            <p className="font-semibold text-primary text-sm">
              Currently booked
            </p>
          </div>
        </div>
      </div>

      {filteredLabs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-border">
          <p className="text-secondary">
            No labs found for the selected campus.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLabs.map((lab) => (
            <LabCard
              key={lab._id}
              lab={lab as LabWithStatus}
              onSelect={() => onSelectLab(lab._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LabCard({
  lab,
  onSelect,
}: {
  lab: LabWithStatus;
  onSelect: () => void;
}) {
  const status = STATUS_CONFIG[lab.currentStatus] || STATUS_CONFIG.available;

  return (
    <div className="bg-white rounded-lg border border-border p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-primary leading-tight">
          {lab.name}
        </h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></span>
          {status.label}
        </span>
      </div>

      <div className="space-y-1.5 text-sm text-secondary">
        <p className="flex items-center gap-2">
          <span className="text-base">📍</span>
          {lab.building}, Room {lab.room}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-base">🏫</span>
          {lab.campus}
        </p>
        <p className="flex items-center gap-2">
          <span className="text-base">👥</span>
          Capacity: {lab.capacity} students
        </p>
      </div>

      {lab.statusInfo && (
        <p className="text-xs text-secondary-light italic">{lab.statusInfo}</p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {lab.amenities.slice(0, 3).map((a, i) => (
          <span
            key={i}
            className="px-2 py-0.5 bg-surface-tertiary rounded text-xs text-secondary"
          >
            {a}
          </span>
        ))}
        {lab.amenities.length > 3 && (
          <span className="px-2 py-0.5 bg-surface-tertiary rounded text-xs text-secondary">
            +{lab.amenities.length - 3}
          </span>
        )}
      </div>

      <button
        onClick={onSelect}
        className="mt-auto w-full py-2.5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 active:scale-[0.98] transition-all"
      >
        View &amp; Book
      </button>
    </div>
  );
}
