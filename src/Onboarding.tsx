import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

const DEPARTMENTS = [
  "Computer Science",
  "Information Technology",
  "Software Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Business Administration",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Data Science",
];

export default function Onboarding() {
  const [role, setRole] = useState<"student" | "professor" | null>(null);
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const createProfile = useMutation(api.profiles.create);

  const handleSubmit = async () => {
    if (!role || !department) {
      toast.error("Please select a role and department");
      return;
    }
    setLoading(true);
    try {
      await createProfile({ role, department });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create profile"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">LB</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-primary tracking-tight">
            Complete Your Profile
          </h1>
          <p className="text-secondary max-w-sm mx-auto">
            Tell us about yourself so we can personalize your lab booking
            experience.
          </p>
        </div>

        <div className="card p-6 sm:p-8 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-primary">
              I am a...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`p-5 rounded-lg border-2 text-left transition-all ${
                  role === "student"
                    ? "border-blue-600 bg-blue-50"
                    : "border-border hover:border-border-dark"
                }`}
              >
                <div className="text-2xl mb-2">🎓</div>
                <h3 className="font-semibold text-primary text-sm">Student</h3>
                <p className="text-xs text-secondary mt-1">
                  Book labs for classes & projects
                </p>
              </button>
              <button
                type="button"
                onClick={() => setRole("professor")}
                className={`p-5 rounded-lg border-2 text-left transition-all ${
                  role === "professor"
                    ? "border-blue-600 bg-blue-50"
                    : "border-border hover:border-border-dark"
                }`}
              >
                <div className="text-2xl mb-2">👨‍🏫</div>
                <h3 className="font-semibold text-primary text-sm">
                  Professor
                </h3>
                <p className="text-xs text-secondary mt-1">
                  Schedule labs for lectures
                </p>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="department"
              className="block text-sm font-medium text-primary"
            >
              Undergraduate Program
            </label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-3 rounded-md bg-surface border border-border text-primary focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 outline-none transition-all"
            >
              <option value="">Select your program...</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!role || !department || loading}
            className="w-full px-4 py-3 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Get Started"}
          </button>
        </div>
      </div>
    </div>
  );
}
