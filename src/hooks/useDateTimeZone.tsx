import { createContext, useContext, type ReactNode } from "react";
import { useUser } from "@/store/authSlice";
import { browserTimeZone, resolveTimeZone } from "@/lib/zonedDate";

const DateTimeZoneContext = createContext<string | undefined>(undefined);

/** Scopes dates below it to a record's timezone (e.g. the contract's). */
export function DateTimeZoneProvider({
  timeZone,
  children,
}: {
  timeZone?: string | null;
  children: ReactNode;
}) {
  return (
    <DateTimeZoneContext.Provider value={timeZone || undefined}>
      {children}
    </DateTimeZoneContext.Provider>
  );
}

/**
 * The timezone to show dates in: the enclosing record's (contract) timezone,
 * else the logged-in user's, else the browser's.
 */
export function useDateTimeZone(): string {
  const scoped = useContext(DateTimeZoneContext);
  const user = useUser();
  return (
    resolveTimeZone(scoped) ??
    resolveTimeZone(user?.timezone) ??
    browserTimeZone()
  );
}
