import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export const myBookingsQueryOptions = () =>
  convexQuery(api.booking.getMyBookings, {});

export const bookingsByLabQueryOptions = (labId: Id<"labs">) =>
  convexQuery(api.booking.getByLab, { id: labId });

export const bookingQueryOptions = (bookingId: Id<"bookings">) =>
  convexQuery(api.booking.getById, { id: bookingId });

export const useMyBookings = () =>
  useSuspenseQuery(myBookingsQueryOptions());

export const useBookingsByLab = (labId: Id<"labs">) =>
  useSuspenseQuery(bookingsByLabQueryOptions(labId));

export const useBooking = (bookingId: Id<"bookings">) =>
  useSuspenseQuery(bookingQueryOptions(bookingId));
