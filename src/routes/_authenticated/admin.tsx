import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMutation } from "convex/react";
import { Suspense } from "react";
import { api } from "../../../convex/_generated/api";
import { useWebHaptics } from "web-haptics/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin")({
  loader: ({ context: { queryClient: qc } }) =>
    qc.ensureQueryData(convexQuery(api.users.listByRole, {})),
  component: () => (
    <Suspense fallback={<AdminSkeleton />}>
      <AdminPage />
    </Suspense>
  ),
});

const ROLES = ["student", "professor", "support", "admin"] as const;

type Role = (typeof ROLES)[number];

const ROLE_LABELS: Record<Role, string> = {
  student: "Estudiante",
  professor: "Profesor",
  support: "Soporte",
  admin: "Administrador",
};

const ROLE_COLORS: Record<Role, string> = {
  student: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  professor: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  support: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  admin: "bg-primary/10 text-primary",
};

function AdminPage() {
  const { data: users } = useSuspenseQuery(
    convexQuery(api.users.listByRole, {}),
  );
  const assignRole = useMutation(api.users.assignRole);
  const haptic = useWebHaptics();

  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      await assignRole({ userId, role });
      haptic.trigger("success");
    } catch {
      haptic.trigger("error");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-foreground">
          Administración
        </h1>
        <p className="text-sm text-muted-foreground">
          Gestiona usuarios y roles · {users.length} usuarios
        </p>
      </div>

      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Usuario
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Documento
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Rol actual
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                Asignar rol
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => (
              <tr key={user._id} className="bg-card">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {user.documentType && (
                    <span className="text-xs">
                      {user.documentType} {user.documentNumber}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {user.role ? (
                    <Badge
                      className={cn(
                        "border-0 text-xs",
                        ROLE_COLORS[user.role],
                      )}
                    >
                      {ROLE_LABELS[user.role]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin rol</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {ROLES.filter((r) => r !== user.role).map((role) => (
                      <Button
                        key={role}
                        variant="ghost"
                        size="xs"
                        onClick={() => {
                          haptic.trigger("selection");
                          handleRoleChange(user._id, role);
                        }}
                        className="text-xs"
                      >
                        {ROLE_LABELS[role]}
                      </Button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="p-6 space-y-3">
      <div className="h-6 w-40 animate-pulse rounded bg-muted" />
      <div className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse border-b border-border bg-card last:border-0" />
        ))}
      </div>
    </div>
  );
}
