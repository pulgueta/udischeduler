# UDIScheduler

Organize your schedule and book labs on any campus.

## Features
* Reactive database by Convex, giving full sync across clients for a realtime experience.
* Auth by better-auth with Convex component for seamless authentication integration with the app, ensuring only UDI-Google accounts are allowed.
* Friendly UI/UX. Don't overcomplicate things and get what you need.
* More TBD.

## Stack
- Frontend:
    * TanStack Start: full SSR or SPA mode.
    * TanStack Router: type-safe routes, params and layout creation.
    * TanStack Query with Convex: type-safe data fetching.
    * Shadcn with base-ui.
    * State management TBD.
    * Icons by Phosphor icons.
- Backend:
    * Convex: Realtime database.
    * Better-Auth: Simple and robust authentication living in our app.
    * Convex rate-limiter: Prevent server overloading and DoS/DDoS attacks.
- Infra:
    * Convex Cloud: Convex backend deployment.
    * Vercel: Frontend deployment syncing with Convex changes.
- Utils:
    * Vite: Web application bundler.
    * TypeScript: Type-safe scalable code.
    * Biome: Ultra-fast linter and formatter.
    * PNPM: Fast and efficient package manager.

## AI Usage

There's only one existing method in this repository to use AI seamlessly with Convex which are the default Cursor rules under the `.cursor` directory, but for a better code creation, use the skills from your preferred AI agent (Claude Code, OpenCode, CursorBot, etc.). You can find them [here](https://skills.sh)