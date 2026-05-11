import { QueryKey } from "@tanstack/react-query";
import { useUser } from "@/store/authSlice";

// Returns a query key augmented with the current user's ID to ensure cache isolation per user
export const useUserQueryKey = (baseKey: QueryKey): QueryKey => {
  const user = useUser();
  const id = user?._id;
  const normalized = Array.isArray(baseKey) ? baseKey : [baseKey];
  return [...normalized, id];
};