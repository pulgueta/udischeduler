import { SignIn } from "@clerk/react";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: ({ context: _ }) => {},
  component: SignInPage,
});

function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          UDIScheduler
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Reserva laboratorios de tu universidad
        </p>
      </div>
      <SignIn
        routing="hash"
        fallbackRedirectUrl="/campuses"
        appearance={{
          elements: {
            rootBox: "w-full max-w-sm",
            card: "bg-card text-card-foreground shadow-none ring-1 ring-foreground/10 rounded-xl",
            headerTitle: "text-foreground font-medium",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "border border-border bg-background hover:bg-muted text-foreground",
            formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
            footerActionLink: "text-primary",
            formFieldInput:
              "bg-background border-input text-foreground placeholder:text-muted-foreground",
            formFieldLabel: "text-foreground",
          },
        }}
      />
    </div>
  );
}
