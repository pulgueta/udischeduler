import { useUser, SignOutButton } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useWebHaptics } from "web-haptics/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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

export const Route = createFileRoute("/off-domain")({
  component: OffDomainPage,
});

function OffDomainPage() {
  const { user } = useUser();
  const haptic = useWebHaptics();
  const deleteAccount = useMutation(api.users.deleteAccount);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
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
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-warning/20">
          <span className="text-xl">⚠️</span>
        </div>
        <h1 className="text-lg font-semibold text-foreground">
          Correo no institucional
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La cuenta{" "}
          <span className="font-medium text-foreground">{user?.primaryEmailAddress?.emailAddress}</span>{" "}
          no pertenece al dominio institucional{" "}
          <span className="font-medium text-foreground">@udi.edu.co</span>.
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
                  Esta acción es irreversible. Se eliminarán todos tus datos y
                  no podrás recuperarlos.
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
