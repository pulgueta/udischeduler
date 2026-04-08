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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SignOutButton, useAuth, useUser } from "@clerk/react";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { useWebHaptics } from "web-haptics/react";
import { api } from "../../convex/_generated/api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const VALID_DOMAIN = "udi.edu.co";

const DOC_TYPES = [
  { value: "CC", label: "Cédula de Ciudadanía" },
  { value: "CE", label: "Cédula de Extranjería" },
  { value: "PP", label: "Pasaporte" },
] as const;

const ROLES = [
  { value: "student", label: "Estudiante" },
  { value: "professor", label: "Profesor" },
] as const;

function OffDomainBanner({ email }: { email: string }) {
  const { user } = useUser();
  const haptic = useWebHaptics();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const [deleting, setDeleting] = useState(false);

  console.log(user);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Bootstrap first so the mutation can find a user doc to delete,
      // then delete both the Convex record and the Clerk account.
      await deleteAccount().catch(() => {});
      await user?.delete();
      haptic.trigger("success");
    } catch {
      haptic.trigger("error");
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl bg-warning/10 p-6 ring-1 ring-warning/30">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-warning/20 text-xl">
          ⚠️
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Correo no institucional
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La cuenta <span className="font-medium text-foreground">{email}</span>{" "}
          no pertenece al dominio institucional{" "}
          <span className="font-medium text-foreground">@{VALID_DOMAIN}</span>.
          Solo los miembros de la institución pueden usar UDIScheduler.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => haptic.trigger("warning")}
              >
                Eliminar cuenta
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar cuenta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es irreversible. Se eliminará tu cuenta y no
                  podrás recuperar el acceso con este correo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting ? "Eliminando..." : "Sí, eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <SignOutButton>
            <Button variant="outline" className="w-full">
              Cerrar sesión
            </Button>
          </SignOutButton>
        </div>
      </div>
    </div>
  );
}

function OnboardingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const haptic = useWebHaptics();

  const me = useQuery(api.users.me);
  const bootstrap = useMutation(api.users.bootstrap);
  const completeOnboarding = useMutation(api.users.completeOnboarding);

  const form = useForm({
    defaultValues: {
      name: user?.fullName ?? "",
      documentType: "CC" as "CC" | "CE" | "PP",
      documentNumber: "",
      role: "student" as "student" | "professor",
    },
    onSubmit: async ({ value }) => {
      try {
        await bootstrap();
        await completeOnboarding(value);
        haptic.trigger("success");
        router.navigate({ to: "/campuses" });
      } catch {
        haptic.trigger("error");
      }
    },
  });

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    redirect({ to: "/sign-in" });
    return null;
  }

  if (me?.onboardingCompleted) {
    redirect({ to: "/campuses" });
    return null;
  }

  // Check domain from Clerk before anything else — covers first-time visitors
  // who haven't been bootstrapped yet.
  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const [, domain] = email.split("@");
  const isOffDomain = domain !== VALID_DOMAIN;

  if (isOffDomain) {
    return <OffDomainBanner email={email} />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Completa tu perfil
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Necesitamos algunos datos para configurar tu cuenta.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex flex-col gap-5"
        >
          <form.Field name="name">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Nombre completo</Label>
                <Input
                  id={field.name}
                  placeholder="Ej. María García"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
                {field.state.meta.errors[0] && (
                  <p className="text-destructive text-xs">
                    {field.state.meta.errors[0]}
                  </p>
                )}
              </div>
            )}
          </form.Field>

          <form.Field name="documentType">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Tipo de documento</Label>
                <div className="flex gap-2">
                  {DOC_TYPES.map((dt) => (
                    <button
                      key={dt.value}
                      type="button"
                      onClick={() => {
                        field.handleChange(dt.value);
                        haptic.trigger("selection");
                      }}
                      className={cn(
                        "flex-1 rounded-lg border py-2 text-sm font-medium transition-colors",
                        field.state.value === dt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {dt.value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {DOC_TYPES.find((d) => d.value === field.state.value)?.label}
                </p>
              </div>
            )}
          </form.Field>

          <form.Field name="documentNumber">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={field.name}>Número de documento</Label>
                <Input
                  id={field.name}
                  placeholder="Ej. 1234567890"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  aria-invalid={field.state.meta.errors.length > 0}
                />
              </div>
            )}
          </form.Field>

          <form.Field name="role">
            {(field) => (
              <div className="flex flex-col gap-1.5">
                <Label>Soy</Label>
                <div className="flex gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => {
                        field.handleChange(r.value);
                        haptic.trigger("selection");
                      }}
                      className={cn(
                        "flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors",
                        field.state.value === r.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form.Field>

          <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
            {([canSubmit, isSubmitting]) => (
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                size="lg"
                className="mt-2 w-full"
              >
                {isSubmitting ? "Guardando..." : "Continuar"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  );
}
