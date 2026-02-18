import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Doc } from "../convex/_generated/dataModel";
import { toast } from "sonner";
import { UserMenu } from "./SignOutButton";

export default function Registration({
  profile,
}: {
  profile: Doc<"profiles">;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const registerMutation = useMutation(api.profiles.register);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loggedInUser) {
      if (loggedInUser.name && !fullName) setFullName(loggedInUser.name);
      if (loggedInUser.email && !email) setEmail(loggedInUser.email);
    }
  }, [loggedInUser]);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      await registerMutation({
        fullName: fullName.trim(),
        email: email.trim(),
        ...(profile.role === "student" && studentId.trim()
          ? { studentId: studentId.trim() }
          : {}),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
      });
      toast.success("Registration complete! Welcome to LabBook.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md h-16 flex items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">LB</span>
          </div>
          <h2 className="text-lg font-semibold text-primary tracking-tight">
            LabBook
          </h2>
        </div>
        <UserMenu />
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg mx-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-2">
              Step 2 of 2
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
              Complete Your Registration
            </h1>
            <p className="text-secondary max-w-sm mx-auto">
              Fill in your details so others can find and collaborate with you.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-border shadow-card p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-tertiary">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                {profile.role === "student" ? "🎓" : "👨‍🏫"}
              </div>
              <div>
                <p className="text-sm font-medium text-primary capitalize">
                  {profile.role}
                </p>
                <p className="text-xs text-secondary">{profile.department}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 rounded-md bg-white border border-border text-primary placeholder:text-secondary-light focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
              />
              {loggedInUser?.name && (
                <p className="text-xs text-secondary">
                  Auto-filled from your account
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 rounded-md bg-white border border-border text-primary placeholder:text-secondary-light focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
              />
              {loggedInUser?.email && (
                <p className="text-xs text-secondary">
                  Auto-filled from your account
                </p>
              )}
            </div>

            {profile.role === "student" && (
              <div className="space-y-1">
                <label className="block text-sm font-medium text-primary">
                  Student ID
                </label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., CS-2024-001"
                  className="w-full px-4 py-3 rounded-md bg-white border border-border text-primary placeholder:text-secondary-light focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-sm font-medium text-primary">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-md bg-white border border-border text-primary placeholder:text-secondary-light focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={!fullName.trim() || !email.trim() || loading}
              className="w-full px-4 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Completing registration..." : "Complete Registration"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
