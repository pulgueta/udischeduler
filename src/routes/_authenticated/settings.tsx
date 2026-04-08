import { useUser, SignOutButton } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { api } from "../../../convex/_generated/api";
import { useWebHaptics } from "web-haptics/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SignOut, User, IdentificationCard } from "@phosphor-icons/react";

export const Route = createFileRoute("/_authenticated/settings")({
  loader: ({ context: { queryClient: qc } }) =>
    qc.ensureQueryData(convexQuery(api.users.me, {})),
  component: () => (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsPage />
    </Suspense>
  ),
});

const ROLE_LABELS: Record<string, string> = {
  student: "Estudiante",
  professor: "Profesor",
  support: "Soporte",
  admin: "Administrador",
};

function SettingsPage() {
  const { user } = useUser();
  const haptic = useWebHaptics();
  const { data: me } = useSuspenseQuery(convexQuery(api.users.me, {}));

  if (!me) return null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">Configuración</h1>
        <p className="text-sm text-muted-foreground">Tu cuenta y preferencias</p>
      </div>

      <div className="max-w-md space-y-4">
        {/* Profile card */}
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-center gap-4">
            {user?.imageUrl && (
              <img
                src={user.imageUrl}
                alt={me.name}
                className="size-14 rounded-full object-cover ring-2 ring-primary/20"
              />
            )}
            <div>
              <p className="font-semibold text-foreground">{me.name}</p>
              <p className="text-sm text-muted-foreground">{me.email}</p>
              {me.role && (
                <Badge className="mt-1 text-xs" variant="secondary">
                  {ROLE_LABELS[me.role] ?? me.role}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Document info */}
        {me.documentType && (
          <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <IdentificationCard className="size-4" />
              Documento
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-xs">
                {me.documentType}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {me.documentNumber}
              </span>
            </div>
          </div>
        )}

        {/* Onboarding status */}
        <div className="rounded-xl bg-card p-5 ring-1 ring-foreground/10">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Perfil completado</span>
            <Badge
              className={cn(
                "text-xs",
                me.onboardingCompleted
                  ? "bg-success text-success-foreground"
                  : "bg-warning/20 text-warning",
              )}
            >
              {me.onboardingCompleted ? "Sí" : "Pendiente"}
            </Badge>
          </div>
        </div>

        {/* Sign out */}
        <SignOutButton>
          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-destructive"
            onClick={() => haptic.trigger("light")}
          >
            <SignOut className="size-4" />
            Cerrar sesión
          </Button>
        </SignOutButton>
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="p-6 space-y-4 max-w-md">
      <div className="h-24 animate-pulse rounded-xl bg-muted" />
      <div className="h-16 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
