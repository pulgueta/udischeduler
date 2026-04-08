import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";

export const meQueryOptions = () => convexQuery(api.users.me, {});

export const useMe = () => useSuspenseQuery(meQueryOptions());

export const allUsersQueryOptions = () =>
  convexQuery(api.users.listByRole, {});
