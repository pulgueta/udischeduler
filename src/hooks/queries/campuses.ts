import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const campusesQueryOptions = () =>
  convexQuery(api.campus.getAll, {});

export const campusQueryOptions = (campusId: Id<"campuses">) =>
  convexQuery(api.campus.getById, { id: campusId });

export const campusSearchQueryOptions = (query: string) =>
  convexQuery(api.campus.search, { query });

export const useCampuses = () =>
  useSuspenseQuery(campusesQueryOptions());

export const useCampus = (campusId: Id<"campuses">) =>
  useSuspenseQuery(campusQueryOptions(campusId));
