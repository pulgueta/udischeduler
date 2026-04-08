import { useAuth } from "@clerk/react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    // Auth check deferred to component to use Clerk hooks.
    // Route loader can't access Clerk hooks — the component handles redirect.
    void location;
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  const me = useQuery(api.users.me);

  if (!isLoaded || me === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isSignedIn) {
    throw redirect({ to: "/sign-in" });
  }

  if (!me) {
    throw redirect({ to: "/onboarding" });
  }

  if (me.isOffDomain) {
    throw redirect({ to: "/off-domain" });
  }

  if (!me.onboardingCompleted) {
    throw redirect({ to: "/onboarding" });
  }

  return (
    <AppShell user={me}>
      <Outlet />
    </AppShell>
  );
}
