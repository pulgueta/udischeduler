import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { UserMenu } from "./SignOutButton";
import { Toaster } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";
import Onboarding from "./Onboarding";
import Registration from "./Registration";
import Dashboard from "./Dashboard";
import LabDetail from "./LabDetail";
import MyBookings from "./MyBookings";
import Invitations from "./Invitations";

type Page =
  | { kind: "dashboard" }
  | { kind: "lab-detail"; labId: Id<"labs"> }
  | { kind: "my-bookings" }
  | { kind: "invitations" };

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface-secondary">
      <Authenticated>
        <AuthenticatedApp />
      </Authenticated>
      <Unauthenticated>
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md h-16 flex items-center border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">LB</span>
            </div>
            <h2 className="text-lg font-semibold text-primary tracking-tight">
              LabBook
            </h2>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md mx-auto space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl font-semibold text-primary tracking-tight">
                University Lab Booking
              </h1>
              <p className="text-secondary text-lg max-w-sm mx-auto">
                Book computer labs for your classes and projects
              </p>
            </div>
            <div className="card p-6 sm:p-8">
              <SignInForm />
            </div>
          </div>
        </main>
      </Unauthenticated>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181B",
            color: "#FFFFFF",
            border: "none",
          },
        }}
      />
    </div>
  );
}

function AuthenticatedApp() {
  const profile = useQuery(api.profiles.get);
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [page, setPage] = useState<Page>({ kind: "dashboard" });

  const pendingCount = useQuery(
    api.bookings.countPendingInvitations,
    profile?.role === "professor" && profile?.registered ? {} : "skip"
  );

  if (profile === undefined || loggedInUser === undefined) {
    return (
      <div className="flex-1 flex justify-center items-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (profile === null) {
    return <Onboarding />;
  }

  if (!profile.registered) {
    return <Registration profile={profile} />;
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md h-16 flex items-center border-b border-border px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">LB</span>
          </div>
          <h2 className="text-lg font-semibold text-primary tracking-tight hidden sm:block">
            LabBook
          </h2>
        </div>

        <nav className="flex items-center gap-1 ml-4 sm:ml-8">
          <button
            onClick={() => setPage({ kind: "dashboard" })}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              page.kind === "dashboard" || page.kind === "lab-detail"
                ? "bg-blue-50 text-blue-700"
                : "text-secondary hover:text-primary hover:bg-surface-tertiary"
            }`}
          >
            Labs
          </button>
          <button
            onClick={() => setPage({ kind: "my-bookings" })}
            className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              page.kind === "my-bookings"
                ? "bg-blue-50 text-blue-700"
                : "text-secondary hover:text-primary hover:bg-surface-tertiary"
            }`}
          >
            My Bookings
          </button>
          {profile.role === "professor" && (
            <button
              onClick={() => setPage({ kind: "invitations" })}
              className={`px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-colors relative ${
                page.kind === "invitations"
                  ? "bg-blue-50 text-blue-700"
                  : "text-secondary hover:text-primary hover:bg-surface-tertiary"
              }`}
            >
              Invitations
              {typeof pendingCount === "number" && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-medium capitalize hidden sm:inline-flex">
            {profile.role}
          </span>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1">
        {page.kind === "dashboard" && (
          <Dashboard
            profile={profile}
            onSelectLab={(labId) => setPage({ kind: "lab-detail", labId })}
          />
        )}
        {page.kind === "lab-detail" && (
          <LabDetail
            labId={page.labId}
            profile={profile}
            onBack={() => setPage({ kind: "dashboard" })}
          />
        )}
        {page.kind === "my-bookings" && (
          <MyBookings
            profile={profile}
            onViewLab={(labId) => setPage({ kind: "lab-detail", labId })}
          />
        )}
        {page.kind === "invitations" && (
          <Invitations profile={profile} />
        )}
      </main>
    </>
  );
}
