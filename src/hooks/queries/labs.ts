import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const labsByCampusQueryOptions = (campusId: Id<"campuses">) =>
  convexQuery(api.lab.getByCampus, { id: campusId });

export const labQueryOptions = (labId: Id<"labs">) =>
  convexQuery(api.lab.getById, { id: labId });

export const useLabsByCampus = (campusId: Id<"campuses">) =>
  useSuspenseQuery(labsByCampusQueryOptions(campusId));

export const useLab = (labId: Id<"labs">) =>
  useSuspenseQuery(labQueryOptions(labId));
