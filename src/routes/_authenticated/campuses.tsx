import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense, useEffect } from "react";
import { api } from "../../../convex/_generated/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Buildings, MapPin } from "@phosphor-icons/react";

export const Route = createFileRoute("/_authenticated/campuses")({
  loader: ({ context: { queryClient: qc } }) =>
    qc.ensureQueryData(convexQuery(api.campus.getAll, {})),
  component: () => (
    <Suspense fallback={<CampusesSkeleton />}>
      <CampusesPage />
    </Suspense>
  ),
});

function CampusesPage() {
  const { data: campuses } = useSuspenseQuery(convexQuery(api.campus.getAll, {}));
  const navigate = useNavigate();

  useEffect(() => {
    if (campuses.length === 1) {
      void navigate({
        to: "/campuses/$campusId",
        params: { campusId: campuses[0]._id },
      });
    }
  }, [campuses, navigate]);

  if (campuses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Buildings className="mb-3 size-10 text-muted-foreground/50" />
        <p className="text-sm font-medium text-muted-foreground">
          No hay sedes disponibles aún
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Sedes</h1>
        <p className="text-sm text-muted-foreground">
          Selecciona una sede para ver los laboratorios disponibles.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campuses.map((campus) => (
          <CampusCard key={campus._id} campus={campus} />
        ))}
      </div>
    </div>
  );
}

function CampusCard({
  campus,
}: {
  campus: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
}) {
  return (
    <Link
      to="/campuses/$campusId"
      params={{ campusId: campus._id }}
    >
      <Card className="cursor-pointer transition-all hover:ring-primary/30">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-base">{campus.name}</CardTitle>
            <Badge variant="secondary" className="shrink-0 text-xs">
              Sede
            </Badge>
          </div>
          <CardDescription className="flex items-center gap-1 text-xs">
            <MapPin className="size-3" />
            {campus.city}, {campus.state}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">{campus.address}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function CampusesSkeleton() {
  return (
    <div className="p-6">
      <div className="mb-6 space-y-2">
        <div className="h-6 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-64 animate-pulse rounded bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
