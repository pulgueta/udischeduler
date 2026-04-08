import { createFileRoute, Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Users, CalendarBlank, Clock } from "@phosphor-icons/react";

export const Route = createFileRoute(
  "/_authenticated/campuses/$campusId/labs/$labId",
)({
  loader: async ({ context: { queryClient: qc }, params }) => {
    await Promise.all([
      qc.ensureQueryData(
        convexQuery(api.lab.getById, { id: params.labId as never }),
      ),
      qc.ensureQueryData(
        convexQuery(api.booking.getByLab, { id: params.labId as never }),
      ),
    ]);
  },
  component: () => (
    <Suspense fallback={<LabDetailSkeleton />}>
      <LabDetailPage />
    </Suspense>
  ),
});

function LabDetailPage() {
  const { campusId, labId } = Route.useParams();
  const { data: lab } = useSuspenseQuery(
    convexQuery(api.lab.getById, { id: labId as never }),
  );
  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.booking.getByLab, { id: labId as never }),
  );

  const upcomingBookings = bookings
    .filter((b) => b.endDate > Date.now())
    .sort((a, b) => a.startDate - b.startDate);

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/campuses/$campusId" params={{ campusId }}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              Laboratorio {lab.room}
            </h1>
            <p className="text-xs text-muted-foreground">Piso {lab.floor}</p>
          </div>
        </div>
        <Link
          to="/bookings/new"
          search={{ labId, campusId }}
        >
          <Button size="sm">Reservar</Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Capacidad</p>
          <div className="mt-1 flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            <span className="font-medium">{lab.capacity ?? 5} personas</span>
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Días disponibles</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {lab.availability.days.map((d) => (
              <span key={d} className="text-xs font-medium">
                {d}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">Horarios</p>
          <div className="mt-1 flex items-center gap-1">
            <Clock className="size-4 text-primary" />
            <span className="text-xs">
              {lab.availability.hours[0]} – {lab.availability.hours[lab.availability.hours.length - 1]}
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-medium text-foreground">
          Reservas próximas ({upcomingBookings.length})
        </h2>
        {upcomingBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
            <CalendarBlank className="mb-2 size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              Sin reservas próximas
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {upcomingBookings.map((booking) => (
              <BookingRow key={booking._id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingRow({
  booking,
}: {
  booking: { _id: string; name: string; startDate: number; endDate: number; participants?: { name: string; email: string }[] };
}) {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{booking.name}</p>
        <p className="text-xs text-muted-foreground">
          {start.toLocaleDateString("es-CO", {
            weekday: "short",
            day: "numeric",
            month: "short",
          })}{" "}
          · {start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} –{" "}
          {end.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
      {(booking.participants?.length ?? 0) > 0 && (
        <Badge variant="secondary" className="text-xs">
          <Users className="mr-1 size-3" />
          {booking.participants!.length}
        </Badge>
      )}
    </div>
  );
}

function LabDetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
