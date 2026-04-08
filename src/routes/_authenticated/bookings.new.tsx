import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { Suspense, useState } from "react";
import { z } from "zod";
import { api } from "../../../convex/_generated/api";
import { useWebHaptics } from "web-haptics/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash, Users } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  labId: z.string().optional(),
  campusId: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/bookings/new")({
  validateSearch: searchSchema,
  loader: ({ context: { queryClient: qc } }) =>
    qc.ensureQueryData(convexQuery(api.campus.getAll, {})),
  component: () => (
    <Suspense fallback={<div className="p-6"><div className="h-48 animate-pulse rounded-xl bg-muted" /></div>}>
      <NewBookingPage />
    </Suspense>
  ),
});

function NewBookingPage() {
  const { labId: preselectedLabId, campusId: preselectedCampusId } = Route.useSearch();
  const router = useRouter();
  const haptic = useWebHaptics();
  const createBooking = useMutation(api.booking.create);
  const { data: campuses } = useSuspenseQuery(convexQuery(api.campus.getAll, {}));

  const [participants, setParticipants] = useState<{ name: string; email: string }[]>([]);
  const [newParticipant, setNewParticipant] = useState({ name: "", email: "" });
  const [error, setError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      campusId: preselectedCampusId ?? campuses[0]?._id ?? "",
      labId: preselectedLabId ?? "",
      startDate: "",
      endDate: "",
    },
    onSubmit: async ({ value }) => {
      setError(null);
      try {
        await createBooking({
          name: value.name,
          campusId: value.campusId,
          labId: value.labId,
          startDate: new Date(value.startDate).getTime(),
          endDate: new Date(value.endDate).getTime(),
          participants,
        });
        haptic.trigger("success");
        router.navigate({ to: "/bookings" });
      } catch (e: unknown) {
        haptic.trigger("error");
        setError(e instanceof Error ? e.message : "Error al crear la reserva");
      }
    },
  });

  const addParticipant = () => {
    if (!newParticipant.name || !newParticipant.email) return;
    setParticipants((p) => [...p, newParticipant]);
    setNewParticipant({ name: "", email: "" });
    haptic.trigger("light");
  };

  const removeParticipant = (i: number) => {
    setParticipants((p) => p.filter((_, idx) => idx !== i));
    haptic.trigger("light");
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/bookings">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">Nueva reserva</h1>
          <p className="text-sm text-muted-foreground">Reserva un laboratorio</p>
        </div>
      </div>

      <form
        className="max-w-lg space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="name">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>Nombre de la reserva</Label>
              <Input
                id={field.name}
                placeholder="Ej. Práctica de redes"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="campusId">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label>Sede</Label>
              <div className="flex flex-wrap gap-2">
                {campuses.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      field.handleChange(c._id);
                      haptic.trigger("selection");
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                      field.state.value === c._id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </form.Field>

        <form.Field name="labId">
          {(field) => (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={field.name}>ID del laboratorio</Label>
              <Input
                id={field.name}
                placeholder="Selecciona desde la vista del lab"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                readOnly={!!preselectedLabId}
                className={preselectedLabId ? "opacity-60" : ""}
              />
            </div>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-3">
          <form.Field name="startDate">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Inicio</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>
          <form.Field name="endDate">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Fin</Label>
                <Input
                  id={field.name}
                  type="datetime-local"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </div>
            )}
          </form.Field>
        </div>

        {/* Participants */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>
              <Users className="mr-1.5 inline size-3.5" />
              Participantes ({participants.length})
            </Label>
          </div>

          {participants.map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.email}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeParticipant(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash />
              </Button>
            </div>
          ))}

          <div className="flex gap-2">
            <Input
              placeholder="Nombre"
              value={newParticipant.name}
              onChange={(e) =>
                setNewParticipant((p) => ({ ...p, name: e.target.value }))
              }
              className="flex-1"
            />
            <Input
              placeholder="Correo"
              type="email"
              value={newParticipant.email}
              onChange={(e) =>
                setNewParticipant((p) => ({ ...p, email: e.target.value }))
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addParticipant}
              disabled={!newParticipant.name || !newParticipant.email}
            >
              <Plus />
            </Button>
          </div>
        </div>

        {error && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              disabled={!canSubmit || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Creando..." : "Crear reserva"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
