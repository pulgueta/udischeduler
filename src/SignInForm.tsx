"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { toast } from "sonner";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);

  return (
    <div className="w-full space-y-5">
      <form
        className="flex flex-col gap-form-field"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          void signIn("password", formData).catch((error) => {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
            setSubmitting(false);
          });
        }}
      >
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-primary"
          >
            Email
          </label>
          <input
            className="auth-input-field"
            type="email"
            id="email"
            name="email"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-primary"
          >
            Password
          </label>
          <input
            className="auth-input-field"
            type="password"
            id="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>
        <button
          className="auth-button mt-2"
          type="submit"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              {flow === "signIn" ? "Signing in..." : "Creating account..."}
            </span>
          ) : flow === "signIn" ? (
            "Sign in"
          ) : (
            "Create account"
          )}
        </button>
        <p className="text-center text-sm text-secondary">
          {flow === "signIn"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            type="button"
            className="text-primary hover:text-primary-light font-medium transition-colors"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </form>

      <div className="divider-text">
        <span>or continue with</span>
      </div>

      <button
        type="button"
        className="auth-button-secondary"
        onClick={() => void signIn("anonymous")}
      >
        Continue as guest
      </button>
    </div>
  );
}
