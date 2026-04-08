---
name: clerk convex app
overview: Migrate authentication from Better Auth to Clerk using Clerk's Convex integration, then rebuild the SPA around scalable feature modules, TanStack Router loaders + React Query suspense hooks, TanStack Form composition, and selective web haptics.
todos:
  - id: auth-migration
    content: Replace Better Auth with Clerk + Convex auth provider wiring and reset auth-related data model
    status: pending
  - id: domain-model
    content: Redesign Convex schema and permissions for campuses, labs, bookings, participants, onboarding, and role management
    status: pending
  - id: data-architecture
    content: Add shared query client, route preloading helpers, and feature-level query hooks using convexQuery + useSuspenseQuery
    status: pending
  - id: ui-shell
    content: Replace demo UI with a scalable application shell, onboarding flow, campus/lab/booking views, and admin/support surfaces
    status: pending
  - id: forms-haptics
    content: Adopt TanStack Form composition patterns and add targeted web-haptics at meaningful interaction points
    status: pending
  - id: env-verification
    content: Set up Clerk and Convex environment requirements, then verify auth, routing, and query-loading flows end to end
    status: pending
isProject: false
---

# Clerk + Convex SPA Plan

## Source Of Truth
- Use Clerk's Convex integration guide as the auth baseline: [Clerk + Convex](https://clerk.com/docs/guides/development/integrations/databases/convex.md).
- Use Convex's Clerk auth model for provider wiring and `ctx.auth.getUserIdentity()` in functions: [Convex + Clerk](https://docs.convex.dev/auth/clerk).
- Follow Clerk React (Vite) setup for `VITE_CLERK_PUBLISHABLE_KEY` and `ClerkProvider` in the SPA shell: [Clerk React Quickstart](https://clerk.com/docs/react/getting-started/quickstart).
- Use Clerk metadata only for light session-safe claims and keep the main profile in Convex: [Clerk user metadata](https://clerk.com/docs/guides/users/extending).

## Auth Migration
- Remove Better Auth-specific packages and wiring from [package.json](package.json), [convex/auth.ts](convex/auth.ts), [convex/auth.config.ts](convex/auth.config.ts), [convex/http.ts](convex/http.ts), [convex/convex.config.ts](convex/convex.config.ts), and [src/lib/auth-client.ts](src/lib/auth-client.ts).
- Add Clerk React and Convex Clerk integration, then wrap the app in `ClerkProvider` followed by `ConvexProviderWithClerk` in [src/main.tsx](src/main.tsx).
- Replace the current Better Auth helper model with a Convex-side identity helper that derives the signed-in user from `ctx.auth.getUserIdentity()` and resolves the matching app profile row.
- Because you chose a clean cutover, treat existing Better Auth identity rows as disposable and design the new auth bootstrapping around Clerk IDs instead of migrating legacy IDs.
- Create `.env.local` with `VITE_CLERK_PUBLISHABLE_KEY=pk_test_Y29taWMtZWVsLTIyLmNsZXJrLmFjY291bnRzLmRldiQ` and plan to set the Convex-side issuer env with `pnpx convex set ...` for Clerk's frontend API URL.

## Product Rules And Data Model
- Refactor [convex/schema.ts](convex/schema.ts) so `users` becomes a proper profile table keyed by Clerk identity and stores:
  - Clerk user ID / token identifier
  - email, full name
  - document type and number
  - role: `student | professor | support | admin`
  - onboarding completion
  - off-domain status / remediation state
- Expand bookings so a booking stores the owner plus invited participants with name and email, instead of only the current `users?: Id<"users">[]` shortcut.
- Add role-safe permissions in Convex functions:
  - `student` and `professor`: create and manage their own bookings
  - `support`: update labs only
  - `admin`: create/delete campuses and labs, assign `support`/`admin`
- Keep first-sign-in onboarding limited to `student` and `professor`; `support` and `admin` must be assigned later by an admin.
- Add the university-domain rule at profile/onboarding time so Google sign-in is allowed to complete, but off-domain users are forced into a warning screen with a delete-account action instead of being silently accepted.

## Router, Query, And Loader Architecture
- Replace the current single demo route in [src/routes/index.tsx](src/routes/index.tsx) with feature routes for:
  - public landing/auth gate
  - onboarding
  - campus selector
  - single-campus redirect flow
  - campus detail with labs
  - booking create/detail/list
  - admin campus/lab management
  - support lab edit surfaces
  - user settings / account warning screen
- Introduce a shared query client module and a route preloading helper, for example in:
  - [src/lib/query-client.ts](src/lib/query-client.ts)
  - [src/lib/ensure-query-data.ts](src/lib/ensure-query-data.ts)
- Standardize feature hooks around reusable query option factories using `convexQuery(...)` and `useSuspenseQuery(...)`, matching the pattern you requested. Example target shape:
  - `labQueryOptions(campusId)`
  - `useLab(campusId)`
- In route loaders, call a custom wrapper around `queryClient.ensureQueryData(...)` so route transitions preload server data before rendering.
- In route components, consume the same query options through custom hooks rather than duplicating keys or fetch logic.
- Keep conditional suspense rules clean: loaders guarantee data, hooks read via `useSuspenseQuery`, and UI components do not mix `enabled` flags into suspense queries.

## Component And Form Architecture
- Replace the current showcase component tree with feature-oriented modules such as:
  - `src/features/auth/*`
  - `src/features/onboarding/*`
  - `src/features/campuses/*`
  - `src/features/labs/*`
  - `src/features/bookings/*`
  - `src/features/admin/*`
- Follow scalable Vercel composition patterns by preferring compound components, explicit variants, and provider-backed state over boolean-prop sprawl.
- Lazy-load heavy hook-consuming UI with `React.lazy()` and wrap each lazy surface in explicit `Suspense` boundaries. This applies especially to booking flows, admin tables, detail side panels, and form-heavy screens.
- Keep route shells and lightweight layouts eager, while large data-driven panels and hook-backed feature modules are split out for bundle control.
- Introduce a shared TanStack Form composition layer inspired by the provided `use-form.tsx` example, likely in:
  - `src/hooks/form/use-app-form.tsx`
  - `src/hooks/form/form-context.tsx`
  - `src/components/primitives/form/*`
- Use TanStack Form validators and typed field components for onboarding, campus/lab management, booking creation, invitee lists, and account-remediation flows.

## UX And Interaction Direction
- Replace the placeholder demo UI with a real app shell that feels like an academic scheduling tool rather than a component gallery.
- Make the IA straightforward:
  - sign in
  - complete onboarding
  - choose campus or auto-redirect if only one exists
  - browse labs
  - create/manage bookings
  - access admin/support tools if permitted
- Include designed empty, loading, and error states for each feature, not raw placeholder text.
- Add web haptics selectively at the component/action level:
  - checkboxes/toggles: `light`
  - segmented selection / picker-like switching: `selection`
  - successful saves / booking confirmation: `success`
  - destructive pre-confirmation: `warning`
  - validation or network failures: `error`
- Do not add haptics to every button; reserve them for meaningful state changes and mobile-feeling controls.

## Verification And Delivery
- Verify the new auth flow end to end:
  - Clerk sign-in
  - Convex token validation
  - profile bootstrap
  - onboarding completion
  - off-domain warning and delete-account path
- Verify the routing/data pattern end to end:
  - route loader prefetch via `ensureQueryData`
  - lazy component render inside `Suspense`
  - feature hook reads via `useSuspenseQuery`
- Update tests around Convex auth helpers and domain permissions, then run React quality checks and lint/test/build validation after implementation.
- Keep [src/main.tsx](src/main.tsx) as the central provider entrypoint and treat the current [src/routes/index.tsx](src/routes/index.tsx) implementation as temporary scaffolding to be fully replaced.

## Important File Targets
- Auth/config: [package.json](package.json), [convex/auth.ts](convex/auth.ts), [convex/auth.config.ts](convex/auth.config.ts), [convex/http.ts](convex/http.ts), [convex/convex.config.ts](convex/convex.config.ts), [src/main.tsx](src/main.tsx)
- Domain backend: [convex/schema.ts](convex/schema.ts), [convex/booking.ts](convex/booking.ts), [convex/campus.ts](convex/campus.ts), `convex/lab.ts`, new user/profile/admin modules
- Frontend app shell: [src/routes/__root.tsx](src/routes/__root.tsx), [src/routes/index.tsx](src/routes/index.tsx), new route files under `src/routes/`
- Shared client architecture: `src/lib/query-client.ts`, `src/lib/ensure-query-data.ts`, `src/hooks/queries/*`, `src/hooks/form/*`, `src/features/*`
- Env: create `.env.local`, add Clerk issuer env for Convex with `pnpx convex set ...` during implementation