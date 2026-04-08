import {
  Buildings,
  CalendarBlank,
  Gear,
  ShieldStar,
} from "@phosphor-icons/react";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useWebHaptics } from "web-haptics/react";

import { cn } from "@/lib/utils";

type User = {
  name: string;
  email: string;
  role?: "student" | "professor" | "support" | "admin";
};

interface AppShellProps {
  user: User;
  children: ReactNode;
}

const NAV_ITEMS = [
  {
    to: "/campuses",
    label: "Sedes",
    icon: Buildings,
    roles: ["student", "professor", "support", "admin"] as User["role"][],
  },
  {
    to: "/bookings",
    label: "Reservas",
    icon: CalendarBlank,
    roles: ["student", "professor", "admin"] as User["role"][],
  },
  {
    to: "/admin",
    label: "Admin",
    icon: ShieldStar,
    roles: ["admin"] as User["role"][],
  },
  {
    to: "/settings",
    label: "Cuenta",
    icon: Gear,
    roles: ["student", "professor", "support", "admin"] as User["role"][],
  },
] as const;

export function AppShell({ user, children }: AppShellProps) {
  const location = useLocation();
  const haptic = useWebHaptics();

  const visibleNav = NAV_ITEMS.filter(
    (item) =>
      !user.role ||
      (item.roles as readonly (User["role"] | undefined)[]).includes(user.role),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-border bg-background/80 px-4 backdrop-blur-sm sm:px-6">
        <div className="flex flex-1 items-center gap-2">
          <span className="font-semibold text-foreground">UDIScheduler</span>
        </div>
        <nav className="hidden items-center gap-1 sm:flex">
          {visibleNav.map((item) => {
            const active =
              location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => haptic.trigger("selection")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="sticky bottom-0 z-10 flex border-t border-border bg-background/80 backdrop-blur-sm sm:hidden">
        {visibleNav.map((item) => {
          const active =
            location.pathname === item.to ||
            location.pathname.startsWith(`${item.to}/`);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => haptic.trigger("selection")}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon
                className={cn("size-5", active && "fill-primary/20")}
                weight={active ? "duotone" : "regular"}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
