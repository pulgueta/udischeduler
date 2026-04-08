import { createFileRoute, Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useWebHaptics } from "web-haptics/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CalendarBlank, Plus, Trash, Users } from "@phosphor-icons/react";

export const Route = createFileRoute("/_authenticated/bookings")({
  loader: ({ context: { queryClient: qc } }) =>
    qc.ensureQueryData(convexQuery(api.booking.getMyBookings, {})),
  component: () => (
    <Suspense fallback={<BookingsSkeleton />}>
      <BookingsPage />
    </Suspense>
  ),
});

function BookingsPage() {
  const { data: bookings } = useSuspenseQuery(
    convexQuery(api.booking.getMyBookings, {}),
  );
  const haptic = useWebHaptics();
  const cancel = useMutation(api.booking.cancel);

  const upcoming = bookings
    .filter((b) => b.endDate > Date.now())
    .sort((a, b) => a.startDate - b.startDate);
  const past = bookings
    .filter((b) => b.endDate <= Date.now())
    .sort((a, b) => b.startDate - a.startDate);

  const handleCancel = async (id: string) => {
    try {
      await cancel({ id: id as never });
      haptic.trigger("success");
    } catch {
      haptic.trigger("error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Mis reservas</h1>
          <p className="text-sm text-muted-foreground">
            {upcoming.length} próximas · {past.length} pasadas
          </p>
        </div>
        <Link to="/bookings/new">
          <Button size="sm">
            <Plus />
            Nueva reserva
          </Button>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-24 text-center">
          <CalendarBlank className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            No tienes reservas aún
          </p>
          <Link to="/campuses" className="mt-3">
            <Button size="sm" variant="outline">
              Explorar laboratorios
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Próximas
              </h2>
              <div className="flex flex-col gap-2">
                {upcoming.map((b) => (
                  <BookingItem
                    key={b._id}
                    booking={b}
                    onCancel={() => {
                      haptic.trigger("warning");
                    }}
                    onConfirmCancel={() => handleCancel(b._id)}
                  />
                ))}
              </div>
            </section>
          )}

          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Pasadas
              </h2>
              <div className="flex flex-col gap-2 opacity-60">
                {past.map((b) => (
                  <BookingItem key={b._id} booking={b} isPast />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function BookingItem({
  booking,
  isPast = false,
  onCancel,
  onConfirmCancel,
}: {
  booking: {
    _id: string;
    name: string;
    startDate: number;
    endDate: number;
    participants?: { name: string; email: string }[];
  };
  isPast?: boolean;
  onCancel?: () => void;
  onConfirmCancel?: () => void;
}) {
  const start = new Date(booking.startDate);
  const end = new Date(booking.endDate);

  return (
    <div className="flex items-center justify-between rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
          <span className="text-xs font-bold leading-none">
            {start.getDate()}
          </span>
          <span className="text-[10px] leading-none">
            {start.toLocaleString("es-CO", { month: "short" })}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">{booking.name}</p>
          <p className="text-xs text-muted-foreground">
            {start.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })} –{" "}
            {end.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {(booking.participants?.length ?? 0) > 0 && (
          <Badge variant="secondary" className="text-xs">
            <Users className="mr-1 size-3" />
            {booking.participants!.length}
          </Badge>
        )}
        {!isPast && onConfirmCancel && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={onCancel}
              >
                <Trash />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar reserva?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se cancelará la reserva "{booking.name}". Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Mantener</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmCancel}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Cancelar reserva
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
