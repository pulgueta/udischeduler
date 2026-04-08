import { createFileRoute, Link } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Monitor, Users, ArrowLeft, FloorPlan } from "@phosphor-icons/react";

export const Route = createFileRoute("/_authenticated/campuses/$campusId")({
  loader: async ({ context: { queryClient: qc }, params }) => {
    await Promise.all([
      qc.ensureQueryData(
        convexQuery(api.campus.getById, { id: params.campusId as never }),
      ),
      qc.ensureQueryData(
        convexQuery(api.lab.getByCampus, { id: params.campusId as never }),
      ),
    ]);
  },
  component: () => (
    <Suspense fallback={<CampusDetailSkeleton />}>
      <CampusDetailPage />
    </Suspense>
  ),
});

function CampusDetailPage() {
  const { campusId } = Route.useParams();
  const { data: campus } = useSuspenseQuery(
    convexQuery(api.campus.getById, { id: campusId as never }),
  );
  const { data: labs } = useSuspenseQuery(
    convexQuery(api.lab.getByCampus, { id: campusId as never }),
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Link to="/campuses">
          <Button variant="ghost" size="icon-sm">
            <ArrowLeft />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-semibold text-foreground">{campus.name}</h1>
          <p className="text-xs text-muted-foreground">
            {campus.address} · {campus.city}, {campus.state}
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-foreground">
          Laboratorios ({labs.length})
        </h2>
      </div>

      {labs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Monitor className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No hay laboratorios en esta sede
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((lab) => (
            <LabCard key={lab._id} lab={lab} campusId={campusId} />
          ))}
        </div>
      )}
    </div>
  );
}

function LabCard({
  lab,
  campusId,
}: {
  lab: {
    _id: string;
    floor: number;
    room: number;
    capacity?: number;
    availability: { days: string[]; hours: string[] };
  };
  campusId: string;
}) {
  return (
    <Link
      to="/campuses/$campusId/labs/$labId"
      params={{ campusId, labId: lab._id }}
    >
      <Card className="cursor-pointer transition-shadow hover:ring-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">Lab {lab.room}</CardTitle>
            <Badge variant="outline" className="text-xs">
              <FloorPlan className="mr-1 size-3" />
              Piso {lab.floor}
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1 text-xs">
            <Users className="size-3" />
            Capacidad: {lab.capacity ?? 5}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {lab.availability.days.slice(0, 3).map((day) => (
              <span
                key={day}
                className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
              >
                {day}
              </span>
            ))}
            {lab.availability.days.length > 3 && (
              <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                +{lab.availability.days.length - 3}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function CampusDetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="size-8 animate-pulse rounded-lg bg-muted" />
        <div className="space-y-1">
          <div className="h-5 w-40 animate-pulse rounded bg-muted" />
          <div className="h-3 w-56 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
