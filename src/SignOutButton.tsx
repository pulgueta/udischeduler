"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { api } from "../convex/_generated/api";

export function UserMenu() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Guard against missing auth provider (prevent crashes)
  if (!isAuthenticated || !signOut) {
    return null;
  }

  const userInitial = loggedInUser?.email?.[0]?.toUpperCase() ?? "U";
  const userEmail = loggedInUser?.email ?? "User";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-tertiary transition-colors duration-200"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-8 h-8 rounded-full bg-surface-tertiary border border-border flex items-center justify-center">
          <span className="text-sm font-medium text-primary">
            {userInitial}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-surface rounded-lg border border-border shadow-lg py-1 z-50">
          {/* User info section */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-tertiary border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-base font-medium text-primary">
                  {userInitial}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">
                  {userEmail}
                </p>
                <p className="text-xs text-secondary">Signed in</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                void signOut();
              }}
              className="w-full text-left px-4 py-2 text-sm text-secondary hover:bg-surface-tertiary hover:text-primary transition-colors duration-150"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
